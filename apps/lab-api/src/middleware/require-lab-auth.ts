import type { NextFunction, Request, Response } from 'express'
import { RoleName, type LabStaffRole } from '@careos/database'
import { verifyAccessToken } from '../utils/jwt'

export type AuthenticatedLabRequest = Request & {
  user?: {
    userId: string
    email: string
    primaryRole: RoleName
    labId: string
    labStaffId: string
    staffRole: LabStaffRole
  }
}

const allowedRoles = [
  RoleName.LAB_ADMIN,
  RoleName.LAB_STAFF,
  RoleName.LAB_TECHNICIAN,
]

export function requireLabAuth(
  req: AuthenticatedLabRequest,
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

    if (!allowedRoles.includes(payload.primaryRole)) {
      return res.status(403).json({
        message: 'Forbidden. Lab access required.',
      })
    }

    if (!payload.labId || !payload.labStaffId) {
      return res.status(403).json({
        message: 'Forbidden. Lab account is not assigned.',
      })
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      primaryRole: payload.primaryRole,
      labId: payload.labId,
      labStaffId: payload.labStaffId,
      staffRole: payload.staffRole,
    }

    next()
  } catch {
    return res.status(401).json({
      message: 'Unauthorized. Invalid or expired token.',
    })
  }
}