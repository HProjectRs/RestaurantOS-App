import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth'
import { AuthRequest } from '../types'
import { asyncHandler } from '../utils/asyncHandler'
import { DeliveryService } from '../services/deliveryService'

const router = Router()

// ─── Drivers ────────────────────────────────────────────────────────────
router.get('/drivers', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const status = req.query.status as string | undefined
  const drivers = await service.getDrivers(req.user!.businessId, status)
  res.json(drivers)
}))

router.get('/drivers/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const driver = await service.getDriver(req.params.id, req.user!.businessId)
  res.json(driver)
}))

router.post('/drivers', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const driver = await service.createDriver({ ...req.body, businessId: req.user!.businessId })
  res.status(201).json(driver)
}))

router.put('/drivers/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const driver = await service.updateDriver(req.params.id, req.user!.businessId, req.body)
  res.json(driver)
}))

router.patch('/drivers/:id/toggle', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const driver = await service.toggleDriverStatus(req.params.id, req.user!.businessId)
  res.json(driver)
}))

// ─── Zones ──────────────────────────────────────────────────────────────
router.get('/zones', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const zones = await service.getZones(req.user!.businessId)
  res.json(zones)
}))

router.get('/zones/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const zone = await service.getZone(req.params.id, req.user!.businessId)
  res.json(zone)
}))

router.post('/zones', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const zone = await service.createZone({ ...req.body, businessId: req.user!.businessId })
  res.status(201).json(zone)
}))

router.put('/zones/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const zone = await service.updateZone(req.params.id, req.user!.businessId, req.body)
  res.json(zone)
}))

// ─── Deliveries ─────────────────────────────────────────────────────────
router.get('/deliveries', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const { status, driverId, dateFrom, dateTo } = req.query as any
  const deliveries = await service.getDeliveries(req.user!.businessId, { status, driverId, dateFrom, dateTo })
  res.json(deliveries)
}))

router.post('/deliveries', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const io = req.app.get('io')
  const delivery = await service.createDelivery({ ...req.body, businessId: req.user!.businessId })
  io.to(`business:${req.user!.businessId}`).emit('delivery:new', delivery)
  res.status(201).json(delivery)
}))

router.patch('/deliveries/:id/assign', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const io = req.app.get('io')
  const delivery = await service.assignDriver(req.params.id, req.body.driverId, req.user!.businessId)
  io.to(`business:${req.user!.businessId}`).emit('delivery:assigned', delivery)
  res.json(delivery)
}))

router.patch('/deliveries/:id/auto-assign', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const io = req.app.get('io')
  const delivery = await service.autoAssignDelivery(req.params.id, req.user!.businessId)
  io.to(`business:${req.user!.businessId}`).emit('delivery:assigned', delivery)
  res.json(delivery)
}))

router.patch('/deliveries/:id/status', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const service = new DeliveryService(prisma)
  const io = req.app.get('io')
  const delivery = await service.updateDeliveryStatus(req.params.id, req.user!.businessId, req.body.status, req.body.location)
  io.to(`business:${req.user!.businessId}`).emit('delivery:statusUpdate', delivery)
  res.json(delivery)
}))

export default router
