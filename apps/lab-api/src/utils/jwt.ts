import jwt from 'jsonwebtoken'
import type { LabStaffRole, RoleName } from '@careos/database'

export type LabJwtPayload = {
  userId: string
  email: string
  primaryRole: RoleName
  labId: string
  labStaffId: string
  staffRole: LabStaffRole
}

export function signAccessToken(payload: LabJwtPayload) {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is missing')
  }

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

export function verifyAccessToken(token: string): LabJwtPayload {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is missing')
  }

  return jwt.verify(token, secret) as LabJwtPayload
}