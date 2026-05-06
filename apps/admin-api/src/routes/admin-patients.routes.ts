import { Router } from 'express'
import { Prisma, prisma } from '@careos/database'
import { requireAdminAuth } from '../middleware/require-admin-auth'

export const adminPatientsRouter = Router()

adminPatientsRouter.use(requireAdminAuth)

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

adminPatientsRouter.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim()
    const page = parsePositiveInt(req.query.page, 1)
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100)
    const skip = (page - 1) * limit

    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        {
          fullName: {
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

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              status: true,
              primaryRole: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
          primaryAddress: true,
          _count: {
            select: {
              appointments: true,
              encounters: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      prisma.patient.count({
        where,
      }),
    ])

    return res.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin list patients error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminPatientsRouter.get('/:id', async (req, res) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
            primaryRole: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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
        },
        encounters: {
          include: {
            appointment: true,
            hospital: true,
            doctor: true,
            department: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found.',
      })
    }

    return res.json({
      patient,
    })
  } catch (error) {
    console.error('Admin get patient error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})