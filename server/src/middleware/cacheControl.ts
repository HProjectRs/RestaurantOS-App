import { Request, Response, NextFunction } from 'express'

export function cacheControl(maxAge: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = process.env.CACHE_DISABLED === 'true' ? 'no-store' : `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`
    res.setHeader('Cache-Control', key)
    next()
  }
}
