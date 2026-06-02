import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { loyaltyProgramUpdateSchema, loyaltyCustomerCreateSchema, loyaltyPointsAddSchema, loyaltyPointsRedeemSchema } from '../schemas'
import { AuthRequest } from '../types'
import { asyncHandler } from '../utils/asyncHandler'
import { NotFoundError, ValidationError, ConflictError } from '../errors'

const router = Router()

// Get loyalty program settings for business
router.get('/program', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    let program = await prisma.loyaltyProgram.findFirst({
      where: { businessId: req.user!.businessId },
    })
    if (!program) {
      program = await prisma.loyaltyProgram.create({
        data: { businessId: req.user!.businessId },
      })
    }
    res.json(program)
}))

// Update loyalty program settings
router.put('/program', authenticate, requireRole('ADMIN'), validate(loyaltyProgramUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { name, pointsPerDinar, dinarPerPoint, minPointsRedeem, enabled } = req.body
    const program = await prisma.loyaltyProgram.upsert({
      where: { id: req.body.id || '' },
      create: { name, pointsPerDinar, dinarPerPoint, minPointsRedeem, enabled, businessId: req.user!.businessId },
      update: { name, pointsPerDinar, dinarPerPoint, minPointsRedeem, enabled },
    })
    res.json(program)
}))

// Find customer by phone
router.get('/customers/search', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { phone } = req.query
    if (!phone) throw new ValidationError('Phone required')

    const customer = await prisma.loyaltyCustomer.findFirst({
      where: { businessId: req.user!.businessId, phone: phone as string },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    })
    res.json(customer)
}))

// Register or find loyalty customer
router.post('/customers', authenticate, validate(loyaltyCustomerCreateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { phone, name } = req.body

    const program = await prisma.loyaltyProgram.findFirst({
      where: { businessId: req.user!.businessId },
    })
    if (!program) throw new ValidationError('Loyalty program not configured')

    let customer = await prisma.loyaltyCustomer.findFirst({
      where: { businessId: req.user!.businessId, phone },
    })

    if (customer) {
      if (name) await prisma.loyaltyCustomer.update({ where: { id: customer.id }, data: { name } })
    } else {
      customer = await prisma.loyaltyCustomer.create({
        data: { businessId: req.user!.businessId, programId: program.id, phone, name },
      })
    }

    res.json(customer)
}))

// Add points (call this when order is paid)
router.post('/points/add', authenticate, validate(loyaltyPointsAddSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { customerId, points, orderId, description } = req.body

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        customerId,
        type: 'EARN',
        points,
        referenceType: orderId ? 'ORDER' : 'MANUAL',
        referenceId: orderId || null,
        description: description || 'نقاط مكتسبة',
      },
    })

    await prisma.loyaltyCustomer.update({
      where: { id: customerId },
      data: {
        totalPoints: { increment: points },
        totalSpent: { increment: orderId ? points : 0 },
        lastVisit: new Date(),
      },
    })

    res.json(transaction)
}))

// Redeem points
router.post('/points/redeem', authenticate, validate(loyaltyPointsRedeemSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { customerId, points, description } = req.body

    const customer = await prisma.loyaltyCustomer.findUnique({ where: { id: customerId } })
    if (!customer) throw new NotFoundError('Customer')
    if (customer.totalPoints < points) throw new ValidationError('Insufficient points')

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        customerId,
        type: 'REDEEM',
        points: -points,
        referenceType: 'MANUAL',
        description: description || 'نقاط مستخدمة',
      },
    })

    await prisma.loyaltyCustomer.update({
      where: { id: customerId },
      data: { totalPoints: { decrement: points } },
    })

    res.json(transaction)
}))

// Get all loyalty customers
router.get('/customers', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const customers = await prisma.loyaltyCustomer.findMany({
      where: { businessId: req.user!.businessId },
      include: { _count: { select: { transactions: true } } },
      orderBy: { totalPoints: 'desc' },
    })
    res.json(customers)
}))

export default router
