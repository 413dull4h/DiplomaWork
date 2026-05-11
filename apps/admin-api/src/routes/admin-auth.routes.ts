import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma, RoleName, UserStatus } from '@careos/database'
import { signAccessToken } from '../utils/jwt'
import {
  requireAdminAuth,
  type AuthenticatedAdminRequest,
} from '../middleware/require-admin-auth'

export const adminAuthRouter = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

function adminUserResponse(user: {
  id: string
  email: string
  phone?: string | null
  primaryRole: RoleName
  status: UserStatus
  avatarUrl?: string | null
  lastLoginAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone ?? null,
    primaryRole: user.primaryRole,
    status: user.status,
    avatarUrl: user.avatarUrl ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

adminAuthRouter.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid email or password format.',
        errors: parsed.error.flatten(),
      })
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials.',
      })
    }

    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({
        message: 'Account is not active.',
      })
    }

    const isAdmin =
      user.primaryRole === RoleName.PLATFORM_ADMIN ||
      user.primaryRole === RoleName.SUPER_ADMIN ||
      user.userRoles.some(
        (userRole) =>
          userRole.role.name === RoleName.PLATFORM_ADMIN ||
          userRole.role.name === RoleName.SUPER_ADMIN
      )

    if (!isAdmin) {
      return res.status(403).json({
        message: 'Admin access required.',
      })
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid credentials.',
      })
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ADMIN_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        metadata: {
          email: user.email,
        },
      },
    })

    const token = signAccessToken({
      userId: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
    })

    return res.json({
      message: 'Login successful.',
      token,
      user: adminUserResponse(user),
    })
  } catch (error) {
    console.error('Admin login error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminAuthRouter.get(
  '/me',
  requireAdminAuth,
  async (req: AuthenticatedAdminRequest, res) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({
          message: 'Unauthorized.',
        })
      }

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      })

      if (!user || user.deletedAt) {
        return res.status(404).json({
          message: 'User not found.',
        })
      }

      if (user.status !== UserStatus.ACTIVE) {
        return res.status(403).json({
          message: 'Account is not active.',
        })
      }

      const isAdmin =
        user.primaryRole === RoleName.PLATFORM_ADMIN ||
        user.primaryRole === RoleName.SUPER_ADMIN

      if (!isAdmin) {
        return res.status(403).json({
          message: 'Admin access required.',
        })
      }

      return res.json({
        user: adminUserResponse(user),
      })
    } catch (error) {
      console.error('Admin me error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)