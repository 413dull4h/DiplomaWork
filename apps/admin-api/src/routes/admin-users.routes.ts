import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  Prisma,
  RoleName,
  UserStatus,
} from '@careos/database'
import {
  requireAdminAuth,
  type AuthenticatedAdminRequest,
} from '../middleware/require-admin-auth'

export const adminUsersRouter = Router()

adminUsersRouter.use(requireAdminAuth)

const updateUserStatusSchema = z.object({
  reason: z.string().optional(),
})

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

adminUsersRouter.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim()
    const status = String(req.query.status || '').trim()
    const role = String(req.query.role || '').trim()

    const page = parsePositiveInt(req.query.page, 1)
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100)
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    if (status) {
      if (!Object.values(UserStatus).includes(status as UserStatus)) {
        return res.status(400).json({
          message: 'Invalid user status.',
        })
      }

      where.status = status as UserStatus
    }

    if (role) {
      if (!Object.values(RoleName).includes(role as RoleName)) {
        return res.status(400).json({
          message: 'Invalid user role.',
        })
      }

      where.primaryRole = role as RoleName
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          patient: true,
          userRoles: {
            include: {
              role: true,
            },
          },
          orgStaff: {
            include: {
              hospital: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      prisma.user.count({
        where,
      }),
    ])

    return res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin list users error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminUsersRouter.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
      },
      include: {
        patient: {
          include: {
            primaryAddress: true,
            appointments: {
              include: {
                hospital: true,
                doctor: true,
                department: true,
              },
              orderBy: {
                scheduledStart: 'desc',
              },
              take: 10,
            },
            encounters: {
              include: {
                hospital: true,
                doctor: true,
                department: true,
                appointment: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
        orgStaff: {
          include: {
            hospital: true,
          },
        },
        auditLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    })

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      })
    }

    return res.json({
      user,
    })
  } catch (error) {
    console.error('Admin get user error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminUsersRouter.patch(
  '/:id/suspend',
  async (req: AuthenticatedAdminRequest, res) => {
    try {
      if (req.user?.userId === req.params.id) {
        return res.status(400).json({
          message: 'You cannot suspend your own admin account.',
        })
      }

      const parsed = updateUserStatusSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid suspension data.',
          errors: parsed.error.flatten(),
        })
      }

      const existing = await prisma.user.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'User not found.',
        })
      }

      const user = await prisma.user.update({
        where: {
          id: existing.id,
        },
        data: {
          status: UserStatus.SUSPENDED,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'SUSPEND_USER',
          entityType: 'USER',
          entityId: user.id,
          metadata: {
            targetEmail: user.email,
            reason: parsed.data.reason,
          },
        },
      })

      return res.json({
        message: 'User suspended successfully.',
        user,
      })
    } catch (error) {
      console.error('Admin suspend user error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

adminUsersRouter.patch(
  '/:id/activate',
  async (req: AuthenticatedAdminRequest, res) => {
    try {
      const parsed = updateUserStatusSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid activation data.',
          errors: parsed.error.flatten(),
        })
      }

      const existing = await prisma.user.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'User not found.',
        })
      }

      const user = await prisma.user.update({
        where: {
          id: existing.id,
        },
        data: {
          status: UserStatus.ACTIVE,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'ACTIVATE_USER',
          entityType: 'USER',
          entityId: user.id,
          metadata: {
            targetEmail: user.email,
            reason: parsed.data.reason,
          },
        },
      })

      return res.json({
        message: 'User activated successfully.',
        user,
      })
    } catch (error) {
      console.error('Admin activate user error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)