import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import express from 'express'
import request from 'supertest'
import path from 'path'
import fs from 'fs'

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}))

jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1', businessId: 'biz-1', role: 'ADMIN', name: 'Admin' }
    next()
  }),
  requireRole: jest.fn(() => (req: any, res: any, next: any) => next()),
}))

jest.mock('../middleware/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

const mockFileTypeFromFile = jest.fn()
jest.mock('file-type', () => ({
  fileTypeFromFile: mockFileTypeFromFile,
}), { virtual: true })

const mockSharp = jest.fn()
const mockSharpInstance = { resize: jest.fn().mockReturnThis(), webp: jest.fn().mockReturnThis(), toFile: jest.fn().mockResolvedValue(undefined) }
mockSharp.mockImplementation(() => mockSharpInstance)
jest.mock('sharp', () => ({ __esModule: true, default: mockSharp }), { virtual: true })

const testImagePath = path.join(__dirname, 'test-image.png')
beforeAll(() => {
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xD7, 0x63, 0x60, 0x60, 0x60, 0x00,
    0x00, 0x00, 0x04, 0x00, 0x01, 0x27, 0x34, 0x27,
    0x85, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
    0x44, 0xAE, 0x42, 0x60, 0x82,
  ])
  fs.writeFileSync(testImagePath, pngBuffer)
})

afterAll(() => {
  if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath)
})

import { PrismaClient } from '@prisma/client'
import { mockDeep } from 'jest-mock-extended'

const prisma = mockDeep<PrismaClient>()
;(PrismaClient as unknown as jest.Mock).mockImplementation(() => prisma)

import menuRoutes from '../routes/menu'

const app = express()
app.use(express.json())
app.set('prisma', prisma)
app.set('io', { to: jest.fn().mockReturnThis(), emit: jest.fn() } as any)
app.use('/api/menu', menuRoutes)

describe('POST /api/menu/items/:id/image', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFileTypeFromFile.mockReset()
    mockSharp.mockClear()
    ;(prisma.menuItem.update as any).mockResolvedValue({ id: 'item-1', image: '/api/uploads/test.webp' })
  })

  it('should reject non-image files based on content', async () => {
    const fakeImagePath = path.join(__dirname, 'fake-image.png')
    fs.writeFileSync(fakeImagePath, 'this is not an image')
    mockFileTypeFromFile.mockResolvedValue(null)
    try {
      const res = await request(app)
        .post('/api/menu/items/item-1/image')
        .attach('image', fakeImagePath)
      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/Invalid file format/i)
    } finally {
      if (fs.existsSync(fakeImagePath)) fs.unlinkSync(fakeImagePath)
    }
  })

  it('should require image file', async () => {
    const res = await request(app)
      .post('/api/menu/items/item-1/image')
    expect(res.status).toBe(400)
  })

  it('should reject unsupported mime type', async () => {
    const res = await request(app)
      .post('/api/menu/items/item-1/image')
      .attach('image', testImagePath, { filename: 'test.txt', contentType: 'text/plain' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Only images allowed/i)
  })

  it('should upload and process a valid image', async () => {
    mockFileTypeFromFile.mockResolvedValue({ mime: 'image/png' })
    const res = await request(app)
      .post('/api/menu/items/item-1/image')
      .attach('image', testImagePath)
    expect(res.status).toBe(200)
    expect(mockSharp).toHaveBeenCalled()
    expect(mockSharpInstance.resize).toHaveBeenCalled()
    expect(mockSharpInstance.webp).toHaveBeenCalled()
    expect(res.body.image).toMatch(/^\/api\/uploads\//)
  })
})
