import { Router } from 'express'
import {
  prisma,
  Prisma,
  AppointmentStatus,
  AppointmentType,
} from '@careos/database'
import { requireAdminAuth } from '../middleware/require-admin-auth'

export const adminAppointmentsRouter = Router()

adminAppointmentsRouter.use(requireAdminAuth)

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

adminAppointmentsRouter.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim()
    const status = String(req.query.status || '').trim()
    const appointmentType = String(req.query.appointmentType || '').trim()
    const hospitalId = String(req.query.hospitalId || '').trim()
    const doctorId = String(req.query.doctorId || '').trim()
    const patientId = String(req.query.patientId || '').trim()

    const from = parseDate(req.query.from)
    const to = parseDate(req.query.to)

    const page = parsePositiveInt(req.query.page, 1)
    const limit = Math.min(parsePositiveInt(req.query.limit, 25), 100)
    const skip = (page - 1) * limit

    const where: Prisma.AppointmentWhereInput = {
      deletedAt: null,
    }

    if (status) {
      if (!Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
        return res.status(400).json({
          message: 'Invalid appointment status.',
        })
      }

      where.status = status as AppointmentStatus
    }

    if (appointmentType) {
      if (!Object.values(AppointmentType).includes(appointmentType as AppointmentType)) {
        return res.status(400).json({
          message: 'Invalid appointment type.',
        })
      }

      where.appointmentType = appointmentType as AppointmentType
    }

    if (hospitalId) {
      where.hospitalId = hospitalId
    }

    if (doctorId) {
      where.doctorId = doctorId
    }

    if (patientId) {
      where.patientId = patientId
    }

    if (from || to) {
      where.scheduledStart = {}

      if (from) {
        where.scheduledStart.gte = from
      }

      if (to) {
        where.scheduledStart.lte = to
      }
    }

    if (search) {
      where.OR = [
        {
          reason: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          patient: {
            fullName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          patient: {
            phone: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          patient: {
            user: {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          hospital: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          hospital: {
            contactEmail: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          doctor: {
            fullName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          department: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ]
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  phone: true,
                  status: true,
                  primaryRole: true,
                },
              },
            },
          },
          hospital: true,
          doctor: true,
          department: true,
          hospitalDoctor: true,
          encounter: true,
        },
        orderBy: {
          scheduledStart: 'desc',
        },
        skip,
        take: limit,
      }),

      prisma.appointment.count({
        where,
      }),
    ])

    return res.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        search,
        status,
        appointmentType,
        hospitalId,
        doctorId,
        patientId,
        from: from?.toISOString() ?? null,
        to: to?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error('Admin list appointments error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminAppointmentsRouter.get('/:id', async (req, res) => {
  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
      },
      include: {
        patient: {
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
          },
        },
        hospital: {
          include: {
            address: true,
          },
        },
        doctor: true,
        department: true,
        hospitalDoctor: true,
        encounter: true,
      },
    })

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found.',
      })
    }

    return res.json({
      appointment,
    })
  } catch (error) {
    console.error('Admin get appointment error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})