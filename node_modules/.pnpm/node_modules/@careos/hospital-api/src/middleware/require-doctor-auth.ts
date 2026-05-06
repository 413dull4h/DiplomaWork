import type { NextFunction, Request, Response } from 'express'
import { RoleName } from '@careos/database'
import { verifyAccessToken } from '../utils/jwt'

export type AuthenticatedDoctorRequest = Request & {
  user?: {
    userId: string
    email: string
    primaryRole: RoleName
    hospitalId: string
    doctorId: string
    hospitalDoctorId: string
  }
}

export function requireDoctorAuth(
  req: AuthenticatedDoctorRequest,
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

    if (payload.primaryRole !== RoleName.DOCTOR) {
      return res.status(403).json({
        message: 'Forbidden. Doctor access required.',
      })
    }

    if (!payload.hospitalId || !payload.doctorId || !payload.hospitalDoctorId) {
      return res.status(403).json({
        message: 'Forbidden. Doctor is not assigned to a hospital.',
      })
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      primaryRole: payload.primaryRole,
      hospitalId: payload.hospitalId,
      doctorId: payload.doctorId,
      hospitalDoctorId: payload.hospitalDoctorId,
    }

    next()
  } catch {
    return res.status(401).json({
      message: 'Unauthorized. Invalid or expired token.',
    })
  }
}