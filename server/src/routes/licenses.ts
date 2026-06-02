import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { authenticate, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { licenseCreateSchema, licenseUpdateSchema } from '../schemas'
import { AuthRequest } from '../types'
import { asyncHandler } from '../utils/asyncHandler'
import { NotFoundError, ValidationError, ConflictError } from '../errors'

const router = Router()

function generateLicenseKey(): string {
  const segments: string[] = []
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(4).toString('hex').toUpperCase())
  }
  return segments.join('-')
}

// Get license info (public - no auth needed for verification)
router.post('/verify', asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { key, businessId } = req.body
    const where: any = { key }
    if (businessId) where.businessId = businessId

    const license = await prisma.license.findFirst({ where })
    if (!license) throw new NotFoundError('License')
    if (!license.isActive) return res.status(403).json({ valid: false, error: 'License is deactivated' })
    if (new Date() > license.validUntil) return res.status(410).json({ valid: false, error: 'License expired' })

    res.json({
      valid: true,
      plan: license.plan,
      maxUsers: license.maxUsers,
      maxBranches: license.maxBranches,
      validUntil: license.validUntil,
    })
}))

// Get current license
router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const license = await prisma.license.findUnique({
      where: { businessId: req.user!.businessId },
    })
    if (!license) throw new NotFoundError('License')
    res.json(license)
}))

// Generate license (admin only)
router.post('/', authenticate, requireRole('ADMIN'), validate(licenseCreateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { businessId, plan, maxUsers, maxBranches, validDays } = req.body
    if (!businessId) throw new ValidationError('businessId required')

    const existing = await prisma.license.findUnique({ where: { businessId } })
    if (existing) throw new ConflictError('Business already has a license')

    const key = generateLicenseKey()
    const validFrom = new Date()
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + (validDays || 365))

    const license = await prisma.license.create({
      data: {
        key,
        businessId,
        plan: plan || 'STANDARD',
        maxUsers: maxUsers || 10,
        maxBranches: maxBranches || 1,
        validFrom,
        validUntil,
      },
    })
    res.status(201).json(license)
}))

router.put('/:id', authenticate, requireRole('ADMIN'), validate(licenseUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { plan, maxUsers, maxBranches, validFrom, validUntil, isActive } = req.body
    const license = await prisma.license.update({
      where: { id: req.params.id },
      data: { plan, maxUsers, maxBranches, validFrom: validFrom ? new Date(validFrom) : undefined, validUntil: validUntil ? new Date(validUntil) : undefined, isActive },
    })
    res.json(license)
}))

export default router
