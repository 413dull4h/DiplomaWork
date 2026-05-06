import type { NextFunction, Request, Response } from 'express'
import { RoleName } from '@careos/database'
import { verifyAccessToken } from '../utils/jwt'

export type AuthenticatedPatientRequest = Request & {
  user?: {
    userId: string
    email: string
    primaryRole: RoleName
    patientId?: string
  }
}

export function requirePatientAuth(
  req: AuthenticatedPatientRequest,
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

    if (payload.primaryRole !== RoleName.PATIENT) {
      return res.status(403).json({
        message: 'Forbidden. Patient access required.',
      })
    }

    if (!payload.patientId) {
      return res.status(403).json({
        message: 'Forbidden. No patient profile assigned.',
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