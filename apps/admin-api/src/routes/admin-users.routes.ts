import { Router } from 'express'
import { z } from 'zod'
import { prisma, RoleName, UserStatus } from '@careos/database'
import {
  requireAdminAuth,
  type AuthenticatedAdminRequest,
} from '../middleware/require-admin-auth'

export const adminUsersRouter = Router()

adminUsersRouter.use(requireAdminAuth)

const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(RoleName).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

function safeUserSelect() {
  return {
    id: true,
    email: true,
    phone: true,
    status: true,
    primaryRole: true,
    avatarUrl: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  }
}

adminUsersRouter.get('/', async (req, res) => {
  try {
    const parsed = listUsersQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid query parameters.',
        errors: parsed.error.flatten(),
      })
    }

    const { search, status, role, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(role ? { primaryRole: role } : {}),
      ...(search
        ? {
            OR: [
              {
                email: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                phone: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                patient: {
                  fullName: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
              {
                doctor: {
                  fullName: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          ...safeUserSelect(),
          patient: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              gender: true,
              dateOfBirth: true,
            },
          },
          doctor: {
            select: {
              id: true,
              fullName: true,
              specialization: true,
              licenseNumber: true,
            },
          },
          orgStaff: {
            select: {
              id: true,
              hospitalId: true,
              staffRole: true,
              isActive: true,
              hospital: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
          labStaff: {
            select: {
              id: true,
              labId: true,
              staffRole: true,
              isActive: true,
              lab: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  type: true,
                },
              },
            },
          },
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
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
      select: {
        ...safeUserSelect(),
        userRoles: {
          include: {
            role: true,
          },
        },
        patient: {
          include: {
            primaryAddress: true,
            appointments: {
              include: {
                hospital: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
                doctor: {
                  select: {
                    id: true,
                    fullName: true,
                    specialization: true,
                  },
                },
                department: true,
                encounter: true,
                teleconsultSession: true,
                medicalDocuments: true,
                labOrders: {
                  include: {
                    lab: {
                      select: {
                        id: true,
                        name: true,
                        status: true,
                        type: true,
                      },
                    },
                    items: true,
                    reports: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
            encounters: {
              include: {
                hospital: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                doctor: {
                  select: {
                    id: true,
                    fullName: true,
                    specialization: true,
                  },
                },
                appointment: {
                  select: {
                    id: true,
                    status: true,
                    appointmentType: true,
                    scheduledStart: true,
                    scheduledEnd: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
            medicalDocuments: {
              include: {
                hospital: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                uploadedBy: {
                  select: {
                    id: true,
                    email: true,
                    primaryRole: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
            labOrders: {
              include: {
                lab: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    type: true,
                  },
                },
                hospital: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                doctor: {
                  select: {
                    id: true,
                    fullName: true,
                    specialization: true,
                  },
                },
                items: true,
                reports: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
            labReports: {
              include: {
                lab: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
                hospital: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                doctor: {
                  select: {
                    id: true,
                    fullName: true,
                    specialization: true,
                  },
                },
                labOrder: {
                  include: {
                    items: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
          },
        },
        doctor: {
          include: {
            hospitals: {
              include: {
                hospital: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
                department: true,
                location: {
                  include: {
                    address: true,
                  },
                },
              },
            },
            appointments: {
              include: {
                patient: {
                  select: {
                    id: true,
                    fullName: true,
                    phone: true,
                  },
                },
                hospital: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                department: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
            encounters: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
            labOrders: {
              include: {
                lab: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    type: true,
                  },
                },
                patient: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
                items: true,
                reports: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
          },
        },
        orgStaff: {
          include: {
            hospital: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        labStaff: {
          include: {
            lab: {
              select: {
                id: true,
                name: true,
                status: true,
                type: true,
                hospitalId: true,
                hospital: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        notifications: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
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

    return res.json({ user })
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
      const currentAdminUserId = req.user?.userId

      if (currentAdminUserId === req.params.id) {
        return res.status(400).json({
          message: 'You cannot suspend your own admin account.',
        })
      }

      const [currentAdmin, targetUser] = await Promise.all([
        currentAdminUserId
          ? prisma.user.findFirst({
              where: {
                id: currentAdminUserId,
                deletedAt: null,
              },
            })
          : null,
        prisma.user.findFirst({
          where: {
            id: req.params.id,
            deletedAt: null,
          },
        }),
      ])

      if (!targetUser) {
        return res.status(404).json({
          message: 'User not found.',
        })
      }

      if (
        targetUser.primaryRole === RoleName.SUPER_ADMIN &&
        currentAdmin?.primaryRole !== RoleName.SUPER_ADMIN
      ) {
        return res.status(403).json({
          message: 'Only a super admin can suspend another super admin.',
        })
      }

      const updatedUser = await prisma.user.update({
        where: {
          id: targetUser.id,
        },
        data: {
          status: UserStatus.SUSPENDED,
        },
        select: safeUserSelect(),
      })

      await prisma.auditLog.create({
        data: {
          userId: currentAdminUserId,
          action: 'ADMIN_SUSPEND_USER',
          entityType: 'USER',
          entityId: targetUser.id,
          metadata: {
            email: targetUser.email,
            previousStatus: targetUser.status,
            newStatus: UserStatus.SUSPENDED,
          },
        },
      })

      return res.json({
        message: 'User suspended successfully.',
        user: updatedUser,
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
      const currentAdminUserId = req.user?.userId

      const targetUser = await prisma.user.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
        },
      })

      if (!targetUser) {
        return res.status(404).json({
          message: 'User not found.',
        })
      }

      const updatedUser = await prisma.user.update({
        where: {
          id: targetUser.id,
        },
        data: {
          status: UserStatus.ACTIVE,
        },
        select: safeUserSelect(),
      })

      await prisma.auditLog.create({
        data: {
          userId: currentAdminUserId,
          action: 'ADMIN_ACTIVATE_USER',
          entityType: 'USER',
          entityId: targetUser.id,
          metadata: {
            email: targetUser.email,
            previousStatus: targetUser.status,
            newStatus: UserStatus.ACTIVE,
          },
        },
      })

      return res.json({
        message: 'User activated successfully.',
        user: updatedUser,
      })
    } catch (error) {
      console.error('Admin activate user error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)