import type { NextFunction, Request, Response } from 'express'
import { RoleName } from '@careos/database'
import { verifyAccessToken } from '../utils/jwt'

export type AuthenticatedAdminRequest = Request & {
  user?: {
    userId: string
    email: string
    primaryRole: RoleName
  }
}

export function requireAdminAuth(
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Unauthorized. Missing token.',
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAccessToken(token)

    if (
      payload.primaryRole !== RoleName.PLATFORM_ADMIN &&
      payload.primaryRole !== RoleName.SUPER_ADMIN
    ) {
      return res.status(403).json({
        message: 'Forbidden. Admin access required.',
      })
    }

    req.user = payload
    next()
  } catch {
    return res.status(401).json({
      message: 'Unauthorized. Invalid or expired token.',
    })
  }
}