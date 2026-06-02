import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { generateToken, generateRefreshToken, verifyRefreshToken, authenticate } from '../middleware/auth'
import { AuthRequest } from '../types'
import { asyncHandler } from '../utils/asyncHandler'
import { ValidationError, UnauthorizedError, NotFoundError } from '../errors'

const router = Router()

router.post('/login', asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { email, password, pin } = req.body

  if (!email && !pin) throw new ValidationError('Email or PIN required')

  const user = await prisma.user.findUnique({
    where: { email },
    include: { business: true },
  })

  if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials')

  if (password) {
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new UnauthorizedError('Invalid credentials')
  }

  if (pin) {
    const validPin = await bcrypt.compare(pin, user.pin || '')
    if (!validPin) throw new UnauthorizedError('Invalid PIN')
  }

  const payload = {
    userId: user.id,
    businessId: user.businessId,
    role: user.role,
    name: user.name,
  }
  const accessToken = generateToken(payload)
  const refreshToken = generateRefreshToken(payload)

  res.json({
    accessToken,
    refreshToken,
    token: accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    },
    business: user.business,
  })
}))

router.post('/register', asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, email, password, phone, businessName } = req.body

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new ValidationError('Email already in use')

  const hashedPassword = await bcrypt.hash(password, 12)

  const business = await prisma.business.create({
    data: {
      name: businessName || name + "'s Restaurant",
      nameAr: '',
    },
  })

  const user = await prisma.user.create({
    data: {
      name, email, password: hashedPassword, phone,
      role: 'ADMIN', businessId: business.id,
    },
  })

  const token = generateToken({
    userId: user.id, businessId: business.id, role: user.role, name: user.name,
  })

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    business,
  })
}))

router.post('/refresh', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken) throw new ValidationError('Refresh token required')

  try {
    const decoded = verifyRefreshToken(refreshToken)
    const prisma: PrismaClient = req.app.get('prisma')

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { business: true },
    })
    if (!user || !user.isActive) throw new UnauthorizedError('User not found')

    const payload = {
      userId: user.id, businessId: user.businessId, role: user.role, name: user.name,
    }
    const newAccessToken = generateToken(payload)
    const newRefreshToken = generateRefreshToken(payload)

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ValidationError) throw error
    throw new UnauthorizedError('Invalid refresh token')
  }
}))

router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, phone: true, role: true, businessId: true, isActive: true },
  })
  if (!user) throw new NotFoundError('User')
  res.json(user)
}))

router.put('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, phone } = req.body
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { name, phone },
  })
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone })
}))

router.put('/change-password', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { currentPassword, newPassword } = req.body
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
  if (!user) throw new NotFoundError('User')

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) throw new ValidationError('Current password is incorrect')

  const hashedPassword = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })
  res.json({ message: 'Password updated successfully' })
}))

export default router
