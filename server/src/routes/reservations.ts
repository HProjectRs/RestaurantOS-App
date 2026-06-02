import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { reservationSchema, reservationUpdateSchema } from '../schemas'
import { AuthRequest } from '../types'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { date, status } = req.query
  const where: { businessId: string; dateTime?: any; status?: string } = { businessId: req.user!.businessId }

  if (date) {
    const d = new Date(date as string)
    where.dateTime = {
      gte: new Date(d.setHours(0, 0, 0, 0)),
      lte: new Date(d.setHours(23, 59, 59, 999)),
    }
  }
  if (status) where.status = status as string

  const reservations = await prisma.reservation.findMany({
    where,
    include: { table: true },
    orderBy: { dateTime: 'asc' },
  })
  res.json(reservations)
}))

router.post('/', validate(reservationSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { businessId, customerName, customerPhone, guests, tableId, dateTime, notes } = req.body

  const reservation = await prisma.reservation.create({
    data: {
      businessId: businessId || req.user?.businessId,
      customerName,
      customerPhone,
      guests,
      tableId,
      dateTime: new Date(dateTime),
      notes,
    },
    include: { table: true },
  })

  if (tableId) {
    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'RESERVED' },
    })
  }

  res.status(201).json(reservation)
}))

router.put('/:id', authenticate, validate(reservationUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { tableId, customerName, customerPhone, guests, dateTime, status, notes } = req.body
  const reservation = await prisma.reservation.update({
    where: { id: req.params.id },
    data: { tableId, customerName, customerPhone, guests, dateTime: dateTime ? new Date(dateTime) : undefined, status, notes },
    include: { table: true },
  })
  res.json(reservation)
}))

router.patch('/:id/status', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { status } = req.body
  const reservation = await prisma.reservation.update({
    where: { id: req.params.id },
    data: { status },
  })

  if (status === 'SEATED' || status === 'CANCELLED' || status === 'NO_SHOW') {
    await prisma.table.update({
      where: { id: reservation.tableId! },
      data: { status: status === 'SEATED' ? 'OCCUPIED' : 'AVAILABLE' },
    })
  }

  res.json(reservation)
}))

export default router
