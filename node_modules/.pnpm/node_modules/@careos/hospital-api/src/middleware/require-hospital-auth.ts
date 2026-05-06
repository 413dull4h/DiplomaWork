import type { NextFunction, Request, Response } from 'express'
import { RoleName } from '@careos/database'
import { verifyAccessToken } from '../utils/jwt'

export type AuthenticatedHospitalRequest = Request & {
  user?: {
    userId: string
    email: string
    primaryRole: RoleName
    hospitalId?: string
  }
}

export function requireHospitalAuth(
  req: AuthenticatedHospitalRequest,
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
      payload.primaryRole !== RoleName.HOSPITAL_ADMIN &&
      payload.primaryRole !== RoleName.HOSPITAL_STAFF
    ) {
      return res.status(403).json({
        message: 'Forbidden. Hospital access required.',
      })
    }

    if (!payload.hospitalId) {
      return res.status(403).json({
        message: 'Forbidden. No hospital assigned to this user.',
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