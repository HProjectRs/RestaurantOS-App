import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { mockDeep } from 'jest-mock-extended'
import { setupSocketHandlers } from '../sockets'

jest.useFakeTimers()

describe('Socket Handlers', () => {
  let io: any
  let socket: any
  let prisma: any
  let redis: any
  let useMiddleware: any
  let connectionHandler: any
  let mockEmit: jest.Mock
  let mockToEmit: jest.Mock
  let mockToDisconnect: jest.Mock

  beforeEach(() => {
    mockEmit = jest.fn()
    mockToEmit = jest.fn()
    mockToDisconnect = jest.fn()
    io = {
      use: jest.fn(),
      on: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: mockEmit, disconnectSockets: mockToDisconnect }),
      sockets: { sockets: new Map() },
    }

    socket = {
      id: 'socket-1',
      handshake: { auth: {}, query: {} },
      on: jest.fn(),
      join: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: mockToEmit }),
      disconnect: jest.fn(),
      removeAllListeners: jest.fn(),
      userId: undefined,
      businessId: undefined,
      role: undefined,
    }

    prisma = mockDeep<PrismaClient>()
    redis = {
      sAdd: jest.fn().mockResolvedValue(1),
      sCard: jest.fn().mockResolvedValue(1),
      sMembers: jest.fn().mockResolvedValue(['socket-1']),
      sRem: jest.fn().mockResolvedValue(1),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
    }

    setupSocketHandlers(io, prisma, redis)

    useMiddleware = io.use.mock.calls[0][0]
    connectionHandler = io.on.mock.calls.find((c: any[]) => c[0] === 'connection')[1]
  })

  describe('Authentication middleware', () => {
    it('should authenticate socket with valid token', () => {
      const next = jest.fn()
      const token = jwt.sign(
        { userId: 'user-1', businessId: 'biz-1', role: 'ADMIN' },
        process.env.JWT_SECRET!
      )
      socket.handshake.auth = { token }

      useMiddleware(socket, next)

      expect(socket.userId).toBe('user-1')
      expect(socket.businessId).toBe('biz-1')
      expect(socket.role).toBe('ADMIN')
      expect(next).toHaveBeenCalledWith()
    })

    it('should allow unauthenticated connections (no token)', () => {
      const next = jest.fn()

      useMiddleware(socket, next)

      expect(socket.userId).toBeUndefined()
      expect(next).toHaveBeenCalledWith()
    })

    it('should reject invalid token', () => {
      const next = jest.fn()
      socket.handshake.auth = { token: 'invalid-jwt-token' }

      useMiddleware(socket, next)

      expect(next).toHaveBeenCalledWith(new Error('Authentication failed'))
    })

    it('should read token from query string if not in auth', () => {
      const next = jest.fn()
      const token = jwt.sign(
        { userId: 'user-2', businessId: 'biz-2', role: 'CHEF' },
        process.env.JWT_SECRET!
      )
      socket.handshake.query = { token }

      useMiddleware(socket, next)

      expect(socket.userId).toBe('user-2')
      expect(socket.businessId).toBe('biz-2')
      expect(socket.role).toBe('CHEF')
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('Connection handler', () => {
    beforeEach(() => {
      socket.businessId = 'biz-1'
      socket.role = 'ADMIN'
      connectionHandler(socket)
    })

    it('should join business room when authenticated', () => {
      expect(socket.join).toHaveBeenCalledWith('business:biz-1')
    })

    it('should not join business room when not authenticated', () => {
      socket.businessId = undefined
      socket.join.mockClear()
      connectionHandler(socket)
      expect(socket.join).not.toHaveBeenCalled()
    })

    describe('join:business event', () => {
      it('should join the specified business room', () => {
        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'join:business')[1]
        handler('biz-2')
        expect(socket.join).toHaveBeenCalledWith('business:biz-2')
      })
    })

    describe('join:table event', () => {
      it('should join the specified table room', () => {
        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'join:table')[1]
        handler('table-5')
        expect(socket.join).toHaveBeenCalledWith('table:table-5')
      })
    })

    describe('kitchen:itemDone event', () => {
      it('should update item status to READY and emit to business room', async () => {
        ;(prisma.orderItem.update as jest.Mock).mockResolvedValue({
          id: 'oi-1',
          status: 'READY',
        })

        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'kitchen:itemDone')[1]
        await handler({ orderId: 'order-1', itemId: 'oi-1' })

        expect(prisma.orderItem.update).toHaveBeenCalledWith({
          where: { id: 'oi-1' },
          data: { status: 'READY' },
        })
        expect(io.to).toHaveBeenCalledWith('business:biz-1')
        expect(mockEmit).toHaveBeenCalledWith('kitchen:itemUpdated', {
          orderId: 'order-1',
          itemId: 'oi-1',
          status: 'READY',
        })
      })

      it('should emit error when update fails', async () => {
        ;(prisma.orderItem.update as jest.Mock).mockRejectedValue(new Error('DB error'))

        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'kitchen:itemDone')[1]
        await handler({ orderId: 'order-1', itemId: 'oi-1' })

        expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Failed to update item' })
      })
    })

    describe('kitchen:startPrep event', () => {
      it('should update item status to PREPARING and emit to business room', async () => {
        ;(prisma.orderItem.update as jest.Mock).mockResolvedValue({
          id: 'oi-1',
          status: 'PREPARING',
        })

        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'kitchen:startPrep')[1]
        await handler({ orderId: 'order-1', itemId: 'oi-1' })

        expect(prisma.orderItem.update).toHaveBeenCalledWith({
          where: { id: 'oi-1' },
          data: { status: 'PREPARING' },
        })
        expect(io.to).toHaveBeenCalledWith('business:biz-1')
        expect(mockEmit).toHaveBeenCalledWith('kitchen:itemUpdated', {
          orderId: 'order-1',
          itemId: 'oi-1',
          status: 'PREPARING',
        })
      })

      it('should emit error when update fails', async () => {
        ;(prisma.orderItem.update as jest.Mock).mockRejectedValue(new Error('DB error'))

        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'kitchen:startPrep')[1]
        await handler({ orderId: 'order-1', itemId: 'oi-1' })

        expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Failed to update item' })
      })
    })

    describe('table:callService event', () => {
      it('should emit service called event to the business room', () => {
        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'table:callService')[1]
        handler({ tableId: 'table-1', message: 'Water please' })

        expect(io.to).toHaveBeenCalledWith('business:biz-1')
        expect(mockEmit).toHaveBeenCalledWith(
          'table:serviceCalled',
          expect.objectContaining({
            tableId: 'table-1',
            message: 'Water please',
          })
        )
      })
    })

    describe('order:typing event', () => {
      it('should emit typing indicator to business room excluding sender', () => {
        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'order:typing')[1]
        handler({ tableId: 'table-1', isTyping: true })

        expect(socket.to).toHaveBeenCalledWith('business:biz-1')
        expect(mockToEmit).toHaveBeenCalledWith('order:customerTyping', {
          tableId: 'table-1',
          isTyping: true,
        })
      })
    })

    describe('disconnect event', () => {
      it('should remove socket from redis and clean up if last connection', async () => {
        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'disconnect')[1]
        redis.sCard.mockResolvedValue(0)
        
        await handler('transport close')
        
        expect(redis.sRem).toHaveBeenCalledWith(`user:socket-1:sockets`, 'socket-1')
        expect(redis.del).toHaveBeenCalledWith(`user:socket-1:sockets`)
      })

      it('should remove socket from redis but not delete key if other connections exist', async () => {
        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'disconnect')[1]
        redis.sCard.mockResolvedValue(2)
        
        await handler('transport close')
        
        expect(redis.sRem).toHaveBeenCalledWith(`user:socket-1:sockets`, 'socket-1')
        expect(redis.del).not.toHaveBeenCalled()
      })
    })

    describe('error event', () => {
      it('should disconnect socket on error', () => {
        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'error')[1]
        handler(new Error('Socket error'))
        expect(socket.disconnect).toHaveBeenCalledWith(true)
      })
    })

    it('should disconnect oldest socket when connection limit is exceeded', async () => {
      redis.sCard.mockResolvedValue(6) // Exceeds MAX_SOCKETS_PER_USER (5)
      redis.sMembers.mockResolvedValue(['socket-old', 'socket-1', 'socket-2', 'socket-3', 'socket-4', 'socket-5'])
      
      await connectionHandler(socket)
      
      expect(io.to).toHaveBeenCalledWith('socket-old')
      expect(mockToDisconnect).toHaveBeenCalledWith(true)
    })

    describe('remaining events', () => {
      it('should handle order:new event', async () => {
        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'order:new')[1]
        const data = { id: 'order-1', total: 100 }
        await handler(data)
        expect(socket.to).toHaveBeenCalledWith('business:biz-1')
        expect(mockToEmit).toHaveBeenCalledWith('order:incoming', data)
      })

      it('should handle order:update event', async () => {
        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'order:update')[1]
        const data = { id: 'order-1', status: 'READY' }
        await handler(data)
        expect(socket.to).toHaveBeenCalledWith('business:biz-1')
        expect(mockToEmit).toHaveBeenCalledWith('order:updated', data)
      })

      it('should handle order:new failure', async () => {
        socket.to.mockReturnValue({ emit: jest.fn().mockImplementation(() => { throw new Error('Emit failed') }) })
        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'order:new')[1]
        await handler({ id: 'order-1' })
        expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Failed to broadcast order' })
      })

      it('should handle order:update failure', async () => {
        socket.to.mockReturnValue({ emit: jest.fn().mockImplementation(() => { throw new Error('Emit failed') }) })
        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'order:update')[1]
        await handler({ id: 'order-1' })
        // التحقق من عدم حدوث انهيار للنظام
      })

      it('should handle chat:message event', () => {
        const handler = socket.on.mock.calls.find((c: any[]) => c[0] === 'chat:message')[1]
        const data = { message: 'Hello', to: 'user-2' }
        handler(data)
        expect(io.to).toHaveBeenCalledWith('user-2')
        expect(mockEmit).toHaveBeenCalledWith('chat:received', expect.objectContaining({
          from: 'socket-1',
          message: 'Hello'
        }))
      })
    })
  })
})

describe('Background Tasks', () => {
  let io: any
  let prisma: any
  let redis: any

  beforeEach(() => {
    io = {
      on: jest.fn(),
      use: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    }
    prisma = mockDeep<PrismaClient>()
    redis = {
      keys: jest.fn().mockResolvedValue(['user:1:sockets', 'user:2:sockets']),
      sCard: jest.fn().mockResolvedValue(1),
    }
    setupSocketHandlers(io, prisma, redis)
  })

  it('should clean up expired wifi sessions', async () => {
    jest.advanceTimersByTime(60000)
    expect(prisma.wifiSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
        data: { status: 'EXPIRED' },
      })
    )
  })

  it('should report socket stats', async () => {
    jest.advanceTimersByTime(30000)
    await Promise.resolve() // الانتظار حتى تنتهي المهام غير المتزامنة في الـ interval
    expect(redis.keys).toHaveBeenCalledWith('user:*:sockets')
    expect(redis.sCard).toHaveBeenCalled()
  })
})
