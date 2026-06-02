import { PrismaClient, Prisma } from '@prisma/client'
import { NotFoundError, ValidationError } from '../errors'

interface CreateDeliveryInput {
  businessId: string
  orderId?: string
  customerName: string
  customerPhone?: string
  customerAddress?: string
  customerLat?: number
  customerLng?: number
  zoneId?: string
  deliveryFee?: number
  notes?: string
}

interface CreateDriverInput {
  businessId: string
  name: string
  phone: string
  vehicle?: string
  vehiclePlate?: string
}

interface CreateZoneInput {
  businessId: string
  name: string
  nameAr?: string
  areas?: string[]
  deliveryFee?: number
  minOrder?: number
  estimatedTime?: number
}

export class DeliveryService {
  constructor(private prisma: PrismaClient) {}

  async createDriver(input: CreateDriverInput) {
    return this.prisma.deliveryDriver.create({ data: input })
  }

  async updateDriver(id: string, businessId: string, data: Partial<CreateDriverInput & { status: string }>) {
    const driver = await this.prisma.deliveryDriver.findFirst({ where: { id, businessId } })
    if (!driver) throw new NotFoundError('DeliveryDriver')
    return this.prisma.deliveryDriver.update({ where: { id }, data })
  }

  async getDrivers(businessId: string, status?: string) {
    const where: any = { businessId }
    if (status) where.status = status
    return this.prisma.deliveryDriver.findMany({ where, orderBy: { createdAt: 'desc' } })
  }

  async getDriver(id: string, businessId: string) {
    const driver = await this.prisma.deliveryDriver.findFirst({ where: { id, businessId } })
    if (!driver) throw new NotFoundError('DeliveryDriver')
    return driver
  }

  async toggleDriverStatus(id: string, businessId: string) {
    const driver = await this.getDriver(id, businessId)
    const newStatus = driver.status === 'online' ? 'offline' : 'online'
    return this.prisma.deliveryDriver.update({ where: { id }, data: { status: newStatus } })
  }

  async createZone(input: CreateZoneInput) {
    return this.prisma.deliveryZone.create({
      data: { ...input, areas: input.areas ? JSON.stringify(input.areas) : undefined },
    })
  }

  async updateZone(id: string, businessId: string, data: Partial<CreateZoneInput>) {
    const zone = await this.prisma.deliveryZone.findFirst({ where: { id, businessId } })
    if (!zone) throw new NotFoundError('DeliveryZone')
    const updateData: any = { ...data }
    if (data.areas) updateData.areas = JSON.stringify(data.areas)
    return this.prisma.deliveryZone.update({ where: { id }, data: updateData })
  }

  async getZones(businessId: string) {
    return this.prisma.deliveryZone.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: 'asc' },
    })
  }

  async getZone(id: string, businessId: string) {
    const zone = await this.prisma.deliveryZone.findFirst({ where: { id, businessId } })
    if (!zone) throw new NotFoundError('DeliveryZone')
    return zone
  }

  async createDelivery(input: CreateDeliveryInput) {
    return this.prisma.delivery.create({ data: input })
  }

  async assignDriver(deliveryId: string, driverId: string, businessId: string) {
    const delivery = await this.prisma.delivery.findFirst({ where: { id: deliveryId, businessId } })
    if (!delivery) throw new NotFoundError('Delivery')
    const driver = await this.prisma.deliveryDriver.findFirst({ where: { id: driverId, businessId } })
    if (!driver) throw new NotFoundError('DeliveryDriver')
    if (driver.status === 'offline') throw new ValidationError('Cannot assign to offline driver')
    return this.prisma.$transaction(async tx => {
      await tx.deliveryDriver.update({ where: { id: driverId }, data: { status: 'busy', currentDeliveries: { increment: 1 } } })
      return tx.delivery.update({
        where: { id: deliveryId },
        data: { driverId, status: 'assigned', assignedAt: new Date() },
      })
    })
  }

  async updateDeliveryStatus(deliveryId: string, businessId: string, status: string, location?: { lat: number; lng: number }) {
    const delivery = await this.prisma.delivery.findFirst({ where: { id: deliveryId, businessId } })
    if (!delivery) throw new NotFoundError('Delivery')
    const updateData: any = { status }
    if (status === 'picked_up') updateData.pickedUpAt = new Date()
    if (status === 'delivered') {
      updateData.deliveredAt = new Date()
      if (delivery.estimatedTime) updateData.actualTime = Math.round((Date.now() - new Date(delivery.assignedAt || delivery.createdAt).getTime()) / 60000)
    }
    if (status === 'failed') updateData.failedAt = new Date()
    if (status === 'delivered' || status === 'failed') {
      await this.prisma.deliveryDriver.update({
        where: { id: delivery.driverId! },
        data: {
          status: 'online',
          currentDeliveries: { decrement: 1 },
          totalDeliveries: status === 'delivered' ? { increment: 1 } : undefined,
        },
      })
    }
    return this.prisma.delivery.update({ where: { id: deliveryId }, data: updateData })
  }

  async getDeliveries(businessId: string, filters?: { status?: string; driverId?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = { businessId }
    if (filters?.status) where.status = filters.status
    if (filters?.driverId) where.driverId = filters.driverId
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
    }
    return this.prisma.delivery.findMany({
      where,
      include: { driver: true, zone: true, order: { include: { items: { include: { menuItem: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async autoAssignDelivery(deliveryId: string, businessId: string) {
    const delivery = await this.prisma.delivery.findFirst({ where: { id: deliveryId, businessId } })
    if (!delivery) throw new NotFoundError('Delivery')
    const availableDriver = await this.prisma.deliveryDriver.findFirst({
      where: { businessId, status: 'online', isActive: true },
      orderBy: { currentDeliveries: 'asc' },
    })
    if (!availableDriver) throw new ValidationError('No available drivers')
    return this.assignDriver(deliveryId, availableDriver.id, businessId)
  }
}
