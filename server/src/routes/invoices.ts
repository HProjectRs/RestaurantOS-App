import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth'
import { AuthRequest } from '../types'
import { asyncHandler } from '../utils/asyncHandler'
import { NotFoundError, ValidationError, ConflictError } from '../errors'
import { generateZatcaQRBase64, formatZatcaInvoiceDate } from '../utils/zatca'

const router = Router()

// Generate invoice data for an order
router.get('/orders/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId },
      include: {
        items: { include: { menuItem: true } },
        table: true,
        cashier: { select: { id: true, name: true } },
      },
    })
    if (!order) throw new NotFoundError('Order')

    const business = await prisma.business.findUnique({ where: { id: order.businessId } })

    const invoice = {
      header: {
        businessName: business?.nameAr || business?.name || '',
        businessLogo: business?.logo || null,
        taxNumber: '', // Add if available in settings
        address: '',
        phone: '',
      },
      order: {
        number: order.orderNumber,
        date: order.createdAt,
        type: order.type,
        status: order.status,
        table: order.table?.number || null,
        cashier: order.cashier?.name || null,
      },
      items: order.items.map(item => ({
        name: item.menuItem.nameAr || item.menuItem.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        modifiers: item.selectedModifiers || {},
      })),
      summary: {
        subtotal: order.subtotal,
        tax: order.tax,
        serviceCharge: order.serviceCharge,
        discount: order.discount,
        total: order.total,
        paid: order.paymentStatus === 'PAID' ? order.total : 0,
        due: order.paymentStatus === 'PAID' ? 0 : order.total,
      },
      payment: {
        method: order.paymentMethod || null,
        status: order.paymentStatus,
      },
      footer: {
        thankYou: 'شكراً لزيارتكم',
        thankYouFr: 'Merci de votre visite',
        thankYouEn: 'Thank you for your visit',
      },
    }

    res.json(invoice)
}))

// Generate invoice as plain text (for thermal printer)
router.get('/orders/:id/print', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId },
      include: {
        items: { include: { menuItem: true } },
        table: true,
      },
    })
    if (!order) throw new NotFoundError('Order')

    const business = await prisma.business.findUnique({ where: { id: order.businessId } })
    const businessName = business?.nameAr || business?.name || 'Restaurant'
    const currency = business?.currency === 'DZD' ? 'د.ج' : 'DA'

    let print = ''
    print += `${'='.repeat(32)}\n`
    print += `  ${businessName}\n`
    print += `${'='.repeat(32)}\n`
    print += `فاتورة #${order.orderNumber}\n`
    print += `تاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-DZ')}\n`
    if (order.table) print += `طاولة: ${order.table.number}\n`
    print += `${'-'.repeat(32)}\n`

    for (const item of order.items) {
      const name = item.menuItem.nameAr || item.menuItem.name
      print += `${name}\n`
      print += `  x${item.quantity} @ ${item.price.toFixed(2)} ${currency}\n`
      print += `  ${(item.price * item.quantity).toFixed(2)} ${currency}\n`
    }

    print += `${'-'.repeat(32)}\n`
    print += `المجموع الفرعي: ${order.subtotal.toFixed(2)} ${currency}\n`
    print += `الضريبة:        ${order.tax.toFixed(2)} ${currency}\n`
    if (order.serviceCharge > 0) print += `خدمة:           ${order.serviceCharge.toFixed(2)} ${currency}\n`
    print += `${'='.repeat(32)}\n`
    print += `الإجمالي:       ${order.total.toFixed(2)} ${currency}\n`
    print += `الحالة:         ${order.paymentStatus === 'PAID' ? 'مدفوع' : 'غير مدفوع'}\n`
    print += `${'='.repeat(32)}\n`
    print += `\nشكراً لزيارتكم ${businessName}\n`
    print += `نتمنى لكم يوماً سعيداً!\n`
    print += `\n${'='.repeat(32)}\n`

    res.type('text/plain; charset=utf-8').send(print)
}))

// ZATCA-compliant invoice with QR code (Saudi tax authority)
router.get('/orders/:id/zatca', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const prisma: PrismaClient = req.app.get('prisma')
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId },
      include: {
        items: { include: { menuItem: true } },
        table: true,
        cashier: { select: { id: true, name: true } },
      },
    })
    if (!order) throw new NotFoundError('Order')

    const business = await prisma.business.findUnique({ where: { id: order.businessId } })

    const sellerName = business?.nameAr || business?.name || ''
    const vatNumber = ''
    const invoiceDate = formatZatcaInvoiceDate(order.createdAt)
    const totalWithVat = Number(order.total)
    const vatTotal = Number(order.tax)

    const qrBase64 = await generateZatcaQRBase64({ sellerName, vatNumber, invoiceDate, totalWithVat, vatTotal })

    const invoice = {
      header: {
        businessName: sellerName,
        businessLogo: business?.logo || null,
        taxNumber: vatNumber,
        address: '',
        phone: '',
      },
      order: {
        number: order.orderNumber,
        date: order.createdAt,
        type: order.type,
        status: order.status,
        table: order.table?.number || null,
        cashier: order.cashier?.name || null,
      },
      items: order.items.map(item => ({
        name: item.menuItem.nameAr || item.menuItem.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        modifiers: item.selectedModifiers || {},
      })),
      summary: {
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        serviceCharge: Number(order.serviceCharge),
        discount: Number(order.discount),
        total: Number(order.total),
        paid: order.paymentStatus === 'PAID' ? Number(order.total) : 0,
        due: order.paymentStatus === 'PAID' ? 0 : Number(order.total),
      },
      payment: {
        method: order.paymentMethod || null,
        status: order.paymentStatus,
      },
      zatca: {
        qrCodeBase64: qrBase64,
        sellerName,
        vatNumber,
        invoiceDate,
        totalWithVat,
        vatTotal,
      },
      footer: {
        thankYou: 'شكراً لزيارتكم',
        thankYouFr: 'Merci de votre visite',
        thankYouEn: 'Thank you for your visit',
      },
    }

    res.json(invoice)
}))

export default router
