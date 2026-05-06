import { Router } from 'express'
import { Prisma, prisma } from '@careos/database'
import { requireAdminAuth } from '../middleware/require-admin-auth'

export const adminAuditLogsRouter = Router()

adminAuditLogsRouter.use(requireAdminAuth)

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function parseDate(value: unknown) {
  if (!value) {
    return null
  }

  const date = new Date(String(value))

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

adminAuditLogsRouter.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim()
    const action = String(req.query.action || '').trim()
    const entityType = String(req.query.entityType || '').trim()
    const userId = String(req.query.userId || '').trim()

    const from = parseDate(req.query.from)
    const to = parseDate(req.query.to)

    const page = parsePositiveInt(req.query.page, 1)
    const limit = Math.min(parsePositiveInt(req.query.limit, 25), 100)
    const skip = (page - 1) * limit

    const where: Prisma.AuditLogWhereInput = {}

    if (action) {
      where.action = {
        contains: action,
        mode: 'insensitive',
      }
    }

    if (entityType) {
      where.entityType = {
        contains: entityType,
        mode: 'insensitive',
      }
    }

    if (userId) {
      where.userId = userId
    }

    if (from || to) {
      where.createdAt = {}

      if (from) {
        where.createdAt.gte = from
      }

      if (to) {
        where.createdAt.lte = to
      }
    }

    if (search) {
      where.OR = [
        {
          action: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          entityType: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          entityId: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          ipAddress: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ]
    }

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              primaryRole: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      prisma.auditLog.count({
        where,
      }),
    ])

    return res.json({
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        search,
        action,
        entityType,
        userId,
        from: from?.toISOString() ?? null,
        to: to?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error('Admin list audit logs error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminAuditLogsRouter.get('/:id', async (req, res) => {
  try {
    const auditLog = await prisma.auditLog.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            primaryRole: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    })

    if (!auditLog) {
      return res.status(404).json({
        message: 'Audit log not found.',
      })
    }

    return res.json({
      auditLog,
    })
  } catch (error) {
    console.error('Admin get audit log error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})