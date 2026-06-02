import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { settingsSchema } from '../schemas'
import { AuthRequest } from '../types'
import { asyncHandler } from '../utils/asyncHandler'
import { NotFoundError } from '../errors'

const router = Router()

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const settings = await prisma.business.findUnique({
    where: { id: req.user!.businessId },
  })
  res.json(settings)
}))

router.get('/public', asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const business = await prisma.business.findFirst()
  if (!business) throw new NotFoundError('Business')
  res.json({ id: business.id, name: business.name, nameAr: business.nameAr, logo: business.logo, currency: business.currency })
}))

router.get('/public/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const business = await prisma.business.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, nameAr: true, logo: true, currency: true },
  })
  if (!business) throw new NotFoundError('Business')
  res.json(business)
}))

router.put('/', authenticate, requireRole('ADMIN'), validate(settingsSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, nameAr, logo, taxRate, serviceChargeRate, currency, wifiDuration, wifiVoucherEnabled, autoPrintOrders, kitchenDisplayEnabled } = req.body
  const settings = await prisma.business.update({
    where: { id: req.user!.businessId },
    data: { name, nameAr, logo, taxRate, serviceChargeRate, currency, wifiDuration, wifiVoucherEnabled, autoPrintOrders, kitchenDisplayEnabled },
  })
  res.json(settings)
}))

export default router
