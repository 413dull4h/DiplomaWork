import jwt from 'jsonwebtoken'
import type { RoleName } from '@careos/database'

export type JwtPayload = {
  userId: string
  email: string
  primaryRole: RoleName
}

export function signAccessToken(payload: JwtPayload) {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is missing')
  }

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is missing')
  }

  return jwt.verify(token, secret) as JwtPayload
}