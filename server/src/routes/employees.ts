import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { authenticate, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { employeeCreateSchema, employeeUpdateSchema, salaryUpdateSchema, shiftCreateSchema, shiftUpdateSchema } from '../schemas'
import { AuthRequest } from '../types'
import { asyncHandler } from '../utils/asyncHandler'
import { ValidationError } from '../errors'

const router = Router()

router.get('/', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const employees = await prisma.user.findMany({
    where: { businessId: req.user!.businessId },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      isActive: true, shiftId: true, shift: true, salary: true,
      salaryPeriod: true, createdAt: true,
    },
    orderBy: { name: 'asc' },
  })
  res.json(employees)
}))

router.post('/', authenticate, requireRole('ADMIN', 'MANAGER'), validate(employeeCreateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, email, password, phone, role, pin, shiftId, salary, salaryPeriod } = req.body

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new ValidationError('Email already in use')

  const hashedPassword = password ? await bcrypt.hash(password, 12) : ''
  const hashedPin = pin ? await bcrypt.hash(pin, 12) : null

  const employee = await prisma.user.create({
    data: {
      name, email, password: hashedPassword, phone, role: role || 'WAITER',
      pin: hashedPin, shiftId, salary: salary || 0, salaryPeriod: salaryPeriod || 'MONTHLY',
      businessId: req.user!.businessId,
    },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
  })

  res.status(201).json(employee)
}))

router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), validate(employeeUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, phone, role, pin, shiftId, isActive } = req.body
  const data: Record<string, any> = {}
  if (name !== undefined) data.name = name
  if (phone !== undefined) data.phone = phone
  if (role !== undefined) data.role = role
  if (pin !== undefined) data.pin = await bcrypt.hash(pin, 12)
  if (shiftId !== undefined) data.shiftId = shiftId
  if (isActive !== undefined) data.isActive = isActive

  const employee = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
  })
  res.json(employee)
}))

router.delete('/:id', authenticate, requireRole('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
  })
  res.json({ message: 'Employee deactivated' })
}))

router.get('/shifts', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const shifts = await prisma.shift.findMany({
    where: { businessId: req.user!.businessId },
    include: { _count: { select: { users: true } } },
  })
  res.json(shifts)
}))

router.post('/shifts', authenticate, requireRole('ADMIN', 'MANAGER'), validate(shiftCreateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, nameAr, startTime, endTime, days } = req.body
  const shift = await prisma.shift.create({
    data: { name, nameAr, startTime, endTime, days, businessId: req.user!.businessId },
  })
  res.status(201).json(shift)
}))

router.put('/shifts/:id', authenticate, requireRole('ADMIN', 'MANAGER'), validate(shiftUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, nameAr, startTime, endTime, days, isActive } = req.body
  const shift = await prisma.shift.update({
    where: { id: req.params.id },
    data: { name, nameAr, startTime, endTime, days, isActive },
  })
  res.json(shift)
}))

router.delete('/shifts/:id', authenticate, requireRole('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  await prisma.shift.delete({ where: { id: req.params.id } })
  res.json({ message: 'Shift deleted' })
}))

router.put('/:id/salary', authenticate, requireRole('ADMIN'), validate(salaryUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { salary, salaryPeriod } = req.body
  const employee = await prisma.user.update({
    where: { id: req.params.id },
    data: { salary, salaryPeriod },
    select: { id: true, name: true, salary: true, salaryPeriod: true },
  })
  res.json(employee)
}))

router.get('/payroll', authenticate, requireRole('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const businessId = req.user!.businessId

  const employees = await prisma.user.findMany({
    where: { businessId, isActive: true },
    select: {
      id: true, name: true, role: true, salary: true, salaryPeriod: true,
      orders: {
        where: { createdAt: { gte: new Date(new Date().setDate(1)) } },
        select: { total: true },
      },
    },
  })

  const payrollData = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    role: emp.role,
    salary: emp.salary,
    salaryPeriod: emp.salaryPeriod,
    thisMonthOrders: emp.orders.length,
    thisMonthSales: emp.orders.reduce((s, o) => s + o.total, 0),
  }))

  res.json(payrollData)
}))

router.post('/clock-in', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const record = await prisma.attendance.create({
    data: {
      userId: req.user!.userId,
      businessId: req.user!.businessId,
      clockIn: new Date(),
      date: new Date().toISOString().slice(0, 10),
    },
  })
  res.json(record)
}))

router.post('/clock-out', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const today = new Date().toISOString().slice(0, 10)
  const record = await prisma.attendance.findFirst({
    where: { userId: req.user!.userId, date: today, clockOut: null },
  })
  if (!record) return res.status(404).json({ error: 'No active clock-in found' })

  const updated = await prisma.attendance.update({
    where: { id: record.id },
    data: { clockOut: new Date() },
  })
  res.json(updated)
}))

router.get('/attendance', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { from, to, userId } = req.query

  const where: { businessId: string; userId?: string; date?: any } = { businessId: req.user!.businessId }
  if (userId) where.userId = userId as string
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = from as string
    if (to) where.date.lte = to as string
  }

  const records = await prisma.attendance.findMany({
    where,
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { date: 'desc' },
  })
  res.json(records)
}))

export default router
