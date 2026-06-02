import { Server as SocketIOServer, Socket } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { RedisClientType } from 'redis'
import jwt from 'jsonwebtoken'
import { logger } from '../middleware/logger'
import { generateEscPosReceipt, generateReceiptData } from '../services/printer'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set for socket auth')
  process.exit(1)
}

interface AuthenticatedSocket extends Socket {
  userId?: string
  businessId?: string
  role?: string
  clientVersion?: string
}

const MAX_SOCKETS_PER_USER = 5

export function setupSocketHandlers(io: SocketIOServer, prisma: PrismaClient, redis: RedisClientType) {
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    if (!token) return next()

    try {
      const decoded = jwt.verify(token as string, JWT_SECRET!) as any
      socket.userId = decoded.userId
      socket.businessId = decoded.businessId
      socket.role = decoded.role
      socket.clientVersion = socket.handshake.auth?.version || 'unknown'
      next()
    } catch {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId || socket.id
    const userKey = `user:${userId}:sockets`
    logger.info('Socket connected', { socketId: socket.id, userId, clientVersion: socket.clientVersion })

    await redis.sAdd(userKey, socket.id)
    const connections = await redis.sCard(userKey)

    if (connections > MAX_SOCKETS_PER_USER) {
      logger.warn('User exceeded connection limit, removing oldest', {
        userId, connections,
      })
      const members = await redis.sMembers(userKey)
      const oldest = members[0]
      io.to(oldest).disconnectSockets(true)
    }

    if (socket.businessId) {
      socket.join(`business:${socket.businessId}`)
    }

    const handlers = {
      'join:business': (businessId: string) => {
        socket.join(`business:${businessId}`)
      },
      'join:table': (tableId: string) => {
        socket.join(`table:${tableId}`)
      },
      'order:new': async (data: any) => {
        try {
          logger.info('Socket order:new received', { data })
          socket.to(`business:${socket.businessId}`).emit('order:incoming', data)
        } catch (err) {
          logger.error('Socket order:new failed', { error: err })
          socket.emit('error', { message: 'Failed to broadcast order' })
        }
      },
      'order:update': async (data: any) => {
        try {
          socket.to(`business:${socket.businessId}`).emit('order:updated', data)
        } catch (err) {
          logger.error('Socket order:update failed', { error: err })
        }
      },
      'kitchen:itemDone': async (data: { orderId: string; itemId: string }) => {
        try {
          await prisma.orderItem.update({ where: { id: data.itemId }, data: { status: 'READY' } })
          io.to(`business:${socket.businessId}`).emit('kitchen:itemUpdated', {
            orderId: data.orderId, itemId: data.itemId, status: 'READY',
          })
        } catch (err) {
          logger.error('Socket kitchen:itemDone failed', { error: err })
          socket.emit('error', { message: 'Failed to update item' })
        }
      },
      'kitchen:startPrep': async (data: { orderId: string; itemId: string }) => {
        try {
          await prisma.orderItem.update({ where: { id: data.itemId }, data: { status: 'PREPARING' } })
          io.to(`business:${socket.businessId}`).emit('kitchen:itemUpdated', {
            orderId: data.orderId, itemId: data.itemId, status: 'PREPARING',
          })
        } catch (err) {
          logger.error('Socket kitchen:startPrep failed', { error: err })
          socket.emit('error', { message: 'Failed to update item' })
        }
      },
      'table:callService': (data: { tableId: string; message: string }) => {
        io.to(`business:${socket.businessId}`).emit('table:serviceCalled', {
          tableId: data.tableId, message: data.message, timestamp: new Date().toISOString(),
        })
      },
      'order:typing': (data: { tableId: string; isTyping: boolean }) => {
        socket.to(`business:${socket.businessId}`).emit('order:customerTyping', {
          tableId: data.tableId, isTyping: data.isTyping,
        })
      },
      'chat:message': (data: { message: string; to: string }) => {
        io.to(data.to).emit('chat:received', {
          from: socket.id, message: data.message, timestamp: new Date().toISOString(),
        })
      },
      'printer:printReceipt': async (data: { orderId: string }) => {
        try {
          const order = await prisma.order.findUnique({
            where: { id: data.orderId },
            include: { items: { include: { menuItem: true } }, table: true, cashier: true },
          })
          if (!order) { socket.emit('printer:error', { message: 'Order not found' }); return }
          const business = await prisma.business.findUnique({ where: { id: order.businessId } })
          const receiptData = generateReceiptData(order, business)
          const escPosBytes = generateEscPosReceipt(receiptData)
          const base64 = Buffer.from(escPosBytes).toString('base64')
          socket.emit('printer:receiptData', { base64, orderId: data.orderId })
          logger.info('Receipt printed via socket', { orderId: data.orderId })
        } catch (err) {
          logger.error('Printer socket error', { error: err })
          socket.emit('printer:error', { message: 'Failed to generate receipt' })
        }
      },
    }

    for (const [event, handler] of Object.entries(handlers)) {
      socket.on(event, handler)
    }

    socket.on('error', (error) => {
      logger.error('Socket error', { socketId: socket.id, error })
      socket.disconnect(true)
    })

    socket.on('disconnect', async (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, userId, reason })
      await redis.sRem(userKey, socket.id)
      if (await redis.sCard(userKey) === 0) {
        await redis.del(userKey)
        logger.debug('User fully disconnected', { userId })
      }
    })
  })

  // Clean up expired Wi-Fi sessions every 60s
  setInterval(async () => {
    try {
      const now = new Date()
      await prisma.wifiSession.updateMany({
        where: { endTime: { lte: now }, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      })
    } catch { /* silent */ }
  }, 60000)

  // Report socket stats every 30s
  setInterval(async () => {
    try {
      const keys = await redis.keys('user:*:sockets')
      let totalConnections = 0
      for (const key of keys) {
        totalConnections += await redis.sCard(key)
      }
      logger.debug('Socket stats', {
        totalConnections,
        totalUsers: keys.length,
      })
    } catch { /* silent */ }
  }, 30000)
}
