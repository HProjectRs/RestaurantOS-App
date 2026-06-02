import { Router, Response } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import QRCode from 'qrcode'
import { authenticate, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { tableUpdateSchema } from '../schemas'
import { AuthRequest } from '../types'
import { asyncHandler } from '../utils/asyncHandler'
import { NotFoundError, ConflictError } from '../errors'

const router = Router()

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const tables = await prisma.table.findMany({
    where: { businessId: req.user!.businessId, isActive: true },
    orderBy: { number: 'asc' },
  })
  res.json(tables)
}))

router.post('/', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { number, capacity } = req.body
  const domain = process.env.FRONTEND_URL || 'http://localhost:5173'

  const table = await prisma.table.create({
    data: { number, capacity, businessId: req.user!.businessId },
  })

  const qrData = `${domain}/consumer?businessId=${req.user!.businessId}&tableId=${table.id}&table=${table.number}`
  const qrCode = await QRCode.toDataURL(qrData)

  const updated = await prisma.table.update({
    where: { id: table.id },
    data: { qrCode },
  })
  res.status(201).json(updated)
}))

router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), validate(tableUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { number, capacity, status, version } = req.body

  if (!version) throw new ConflictError('version required for optimistic locking')

  try {
    const table = await prisma.table.update({
      where: { id: req.params.id, version },
      data: { number, capacity, status, version: { increment: 1 } },
    })
    res.json(table)
  } catch (err) {
    if ((err as Record<string, any>)?.code === 'P2025') {
      throw new ConflictError('Table was modified by another request')
    }
    throw err
  }
}))

router.delete('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  await prisma.table.update({
    where: { id: req.params.id },
    data: { isActive: false },
  })
  res.json({ message: 'Table removed' })
}))

router.patch('/:id/status', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { status } = req.body

  const table = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const current = await tx.table.findUnique({ where: { id: req.params.id } })
    if (!current) throw new NotFoundError('Table')

    if (status === 'OCCUPIED' && current.status === 'OCCUPIED') {
      throw new ConflictError('Table already occupied')
    }

    return tx.table.update({
      where: { id: req.params.id, version: current.version },
      data: { status, version: { increment: 1 } },
    })
  })
  res.json(table)
}))

router.post('/:id/regenerate-qr', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const domain = process.env.FRONTEND_URL || 'http://localhost:5173'
  const table = await prisma.table.findUnique({ where: { id: req.params.id } })
  if (!table) throw new NotFoundError('Table')

  const qrData = `${domain}/consumer?businessId=${table.businessId}&tableId=${table.id}&table=${table.number}`
  const qrCode = await QRCode.toDataURL(qrData)

  const updated = await prisma.table.update({
    where: { id: table.id },
    data: { qrCode },
  })
  res.json(updated)
}))

export default router
