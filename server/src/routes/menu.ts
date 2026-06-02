import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { authenticate, requireRole } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { menuItemSchema, menuItemUpdateSchema, menuCategorySchema, menuCategoryUpdateSchema } from '../schemas'
import { AuthRequest } from '../types'
import { logger } from '../middleware/logger'
import { asyncHandler } from '../utils/asyncHandler'
import { NotFoundError } from '../errors'

const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads')

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadsDir)
  },
  filename: (_req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `menu-${uniqueSuffix}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: FileFilterCallback) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedExts.includes(ext) && allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only images allowed (jpg, jpeg, png, webp, gif)'))
    }
  },
})

const router = Router()

router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.query.businessId as string
    if (!businessId) return res.status(400).json({ error: 'businessId required' })

    const categories = await prisma.menuCategory.findMany({
      where: { businessId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            modifiers: {
              include: { options: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
      },
    })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/categories', authenticate, requireRole('ADMIN', 'MANAGER'), validate(menuCategorySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, nameAr, description, sortOrder } = req.body
  const category = await prisma.menuCategory.create({
    data: { name, nameAr, description, sortOrder, businessId: req.user!.businessId },
  })
  res.status(201).json(category)
}))

router.put('/categories/:id', authenticate, requireRole('ADMIN', 'MANAGER'), validate(menuCategoryUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, nameAr, description, sortOrder } = req.body
  const category = await prisma.menuCategory.update({
    where: { id: req.params.id },
    data: { name, nameAr, description, sortOrder },
  })
  res.json(category)
}))

router.delete('/categories/:id', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  await prisma.menuCategory.delete({ where: { id: req.params.id } })
  res.json({ message: 'Category deleted' })
}))

router.post('/items', authenticate, requireRole('ADMIN', 'MANAGER'), validate(menuItemSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, nameAr, description, descriptionAr, price, discountPrice, categoryId, barcode, prepTime, sortOrder } = req.body
  const item = await prisma.menuItem.create({
    data: { name, nameAr, description, descriptionAr, price, discountPrice, categoryId, barcode, prepTime, sortOrder },
  })
  res.status(201).json(item)
}))

router.put('/items/:id', authenticate, requireRole('ADMIN', 'MANAGER'), validate(menuItemUpdateSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, nameAr, description, descriptionAr, price, discountPrice, categoryId, barcode, isAvailable, prepTime, sortOrder } = req.body
  const item = await prisma.menuItem.update({
    where: { id: req.params.id },
    data: { name, nameAr, description, descriptionAr, price, discountPrice, categoryId, barcode, isAvailable, prepTime, sortOrder },
  })
  res.json(item)
}))

router.delete('/items/:id', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  await prisma.menuItem.delete({ where: { id: req.params.id } })
  res.json({ message: 'Item deleted' })
}))

router.patch('/items/:id/toggle', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } })
  if (!item) throw new NotFoundError('Item')
  const updated = await prisma.menuItem.update({
    where: { id: req.params.id },
    data: { isAvailable: !item.isAvailable },
  })
  res.json(updated)
}))

router.post('/items/:id/image', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthRequest, res: Response) => {
  upload.single('image')(req, res, async (err: any) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No image file provided' })

    try {
      const prisma: PrismaClient = req.app.get('prisma')
      const { fileTypeFromFile } = await import('file-type')
      const type = await fileTypeFromFile(req.file.path)
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!type || !allowedMimes.includes(type.mime)) {
        await fs.unlink(req.file.path).catch(() => {})
        return res.status(400).json({ error: `Invalid file format. Detected: ${type?.mime || 'unknown'}` })
      }

      const sharp = await import('sharp')
      const optimizedPath = req.file.path.replace(path.extname(req.file.path), '.webp')
      await sharp.default(req.file.path)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(optimizedPath)
      await fs.unlink(req.file.path).catch(() => {})

      const imageUrl = `/api/uploads/${path.basename(optimizedPath)}`
      const item = await prisma.menuItem.update({
        where: { id: req.params.id },
        data: { image: imageUrl },
      })
      res.json(item)
    } catch (error) {
      logger.error('Image upload failed', { error })
      res.status(500).json({ error: 'Internal server error' })
    }
  })
})

router.post('/items/:id/modifiers', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, nameAr, type, required, min, max } = req.body
  const modifier = await prisma.menuModifier.create({
    data: { name, nameAr, type, required, min, max, menuItemId: req.params.id },
    include: { options: true },
  })
  res.status(201).json(modifier)
}))

router.put('/modifiers/:id', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  const { name, nameAr, type, required, min, max } = req.body
  const modifier = await prisma.menuModifier.update({
    where: { id: req.params.id },
    data: { name, nameAr, type, required, min, max },
    include: { options: true },
  })
  res.json(modifier)
}))

router.delete('/modifiers/:id', authenticate, requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const prisma: PrismaClient = req.app.get('prisma')
  await prisma.menuModifier.delete({ where: { id: req.params.id } })
  res.json({ message: 'Modifier deleted' })
}))

export default router
