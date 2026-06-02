import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { expenseCreateSchema, expenseUpdateSchema } from '../schemas'
import { AuthRequest } from '../types'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const expenses = await prisma.expense.findMany({
    where: { businessId: req.user!.businessId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json(expenses)
}))

router.post('/', authenticate, requireRole('ADMIN', 'MANAGER'), validate(expenseCreateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const expense = await prisma.expense.create({
    data: {
      businessId: req.user!.businessId,
      description: req.body.description,
      amount: req.body.amount,
      category: req.body.category || 'أخرى',
      notes: req.body.notes || null,
      date: req.body.date || new Date().toISOString(),
    },
  })
  res.status(201).json(expense)
}))

router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), validate(expenseUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { description, amount, category, date, notes } = req.body
  const expense = await prisma.expense.update({
    where: { id: req.params.id },
    data: { description, amount, category, date: date ? new Date(date) : undefined, notes },
  })
  res.json(expense)
}))

router.delete('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  await prisma.expense.delete({ where: { id: req.params.id } })
  res.json({ message: 'Expense deleted' })
}))

export default router
