import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthRequest } from '../types'
import { asyncHandler } from '../utils/asyncHandler'
import { NotFoundError, ValidationError } from '../errors'

const router = Router()

/**
 * POST /api/wifi/qr-codes
 * Generate a new WiFi QR code for guest internet access.
 * @body {label?, durationMinutes?, maxSessions?}
 * @returns 201 {wifiQrCode, qrImage, qrUrl}
 */
router.post('/qr-codes', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { label, durationMinutes, maxSessions } = req.body

    const code = uuidv4().slice(0, 8).toUpperCase()
    const domain = process.env.FRONTEND_URL || 'http://localhost:5173'

    const wifiQr = await prisma.wifiQrCode.create({
      data: {
        businessId: req.user!.businessId,
        code,
        label: label || `WiFi-${code}`,
        durationMinutes: durationMinutes || 120,
        maxSessions: maxSessions || 50,
      },
    })

    // Generate QR code data
    const qrData = `${domain}/wifi?code=${code}&businessId=${req.user!.businessId}`
    const qrImage = await QRCode.toDataURL(qrData)

    res.status(201).json({ ...wifiQr, qrImage, qrUrl: qrData })
}))

/**
 * GET /api/wifi/qr-codes
 * Get all WiFi QR codes for the current business with session counts.
 * @returns {Array<WifiQrCode & {_count: {sessions: number}}>}
 */
router.get('/qr-codes', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const qrCodes = await prisma.wifiQrCode.findMany({
      where: { businessId: req.user!.businessId },
      include: { _count: { select: { sessions: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(qrCodes)
}))

/**
 * POST /api/wifi/connect
 * Public endpoint for customers to connect to WiFi via QR code.
 * Creates a WiFi session with duration limit.
 * @body {code: string, phoneNumber?, macAddress?}
 * @returns {success, session, wifi}
 * @throws 404 if QR code invalid or inactive
 * @throws 429 if max sessions reached
 */
router.post('/connect', asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const { code, phoneNumber, macAddress } = req.body

    const wifiQr = await prisma.wifiQrCode.findUnique({
      where: { code },
      include: { business: true },
    })

    if (!wifiQr || !wifiQr.isActive) {
      throw new NotFoundError('QR code')
    }

    // Check session limit
    const activeSessions = await prisma.wifiSession.count({
      where: { wifiQrCodeId: wifiQr.id, status: 'ACTIVE' },
    })
    if (activeSessions >= wifiQr.maxSessions) {
      return res.status(429).json({ error: 'Maximum active sessions reached' })
    }

    const duration = wifiQr.durationMinutes
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + duration * 60000)

    const session = await prisma.wifiSession.create({
      data: {
        wifiQrCodeId: wifiQr.id,
        phoneNumber: phoneNumber || null,
        macAddress: macAddress || null,
        durationMinutes: duration,
        status: 'ACTIVE',
        startTime,
        endTime,
      },
    })

    // Here you would integrate with your WiFi gateway (MikroTik, etc.)
    // to actually grant network access to the MAC address
    // Example MikroTik API call would go here

    res.json({
      success: true,
      session: {
        id: session.id,
        durationMinutes: session.durationMinutes,
        startTime: session.startTime,
        endTime: session.endTime,
      },
      wifi: {
        ssid: wifiQr.business.name,
        password: 'welcome', // Or dynamic password
      },
    })
}))

/**
 * GET /api/wifi/info/:code
 * Public endpoint to get WiFi QR code info (duration, business name).
 * @returns {id, durationMinutes, business}
 * @throws 404 if QR code not found
 */
router.get('/info/:code', asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const wifiQr = await prisma.wifiQrCode.findUnique({
      where: { code: req.params.code },
      include: { business: { select: { name: true, nameAr: true, logo: true } } },
    })
    if (!wifiQr) throw new NotFoundError('QR code')
    res.json({
      id: wifiQr.id,
      durationMinutes: wifiQr.durationMinutes,
      business: wifiQr.business,
    })
}))

/**
 * GET /api/wifi/sessions
 * Get WiFi sessions for the current business (last 100).
 * @returns {Array<WifiSession & {wifiQrCode: {label, code}}>}
 */
router.get('/sessions', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const sessions = await prisma.wifiSession.findMany({
      where: { wifiQrCode: { businessId: req.user!.businessId } },
      orderBy: { startTime: 'desc' },
      take: 100,
      include: { wifiQrCode: { select: { label: true, code: true } } },
    })
    res.json(sessions)
}))

/**
 * PATCH /api/wifi/sessions/:id/disconnect
 * Forcefully disconnect an active WiFi session.
 * @returns {WifiSession} with status set to DISCONNECTED
 */
router.patch('/sessions/:id/disconnect', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const session = await prisma.wifiSession.update({
      where: { id: req.params.id },
      data: { status: 'DISCONNECTED' },
    })
    res.json(session)
}))

/**
 * PATCH /api/wifi/qr-codes/:id/toggle
 * Toggle a WiFi QR code's active status.
 * @returns {WifiQrCode} with updated isActive flag
 * @throws 404 if QR code not found
 */
router.patch('/qr-codes/:id/toggle', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const qr = await prisma.wifiQrCode.findUnique({ where: { id: req.params.id } })
    if (!qr) throw new NotFoundError('QR code')
    const updated = await prisma.wifiQrCode.update({
      where: { id: req.params.id },
      data: { isActive: !qr.isActive },
    })
    res.json(updated)
}))

export default router
