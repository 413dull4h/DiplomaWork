import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@careos/database'
import { requireAdminAuth } from '../middleware/require-admin-auth'

export const adminPatientsRouter = Router()

adminPatientsRouter.use(requireAdminAuth)

const listPatientsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

adminPatientsRouter.get('/', async (req, res) => {
  try {
    const parsed = listPatientsQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid query parameters.',
        errors: parsed.error.flatten(),
      })
    }

    const { search, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              {
                fullName: {
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
                gender: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                user: {
                  email: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    }

    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
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
              avatarUrl: true,
              lastLoginAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          primaryAddress: true,
          appointments: {
            select: {
              id: true,
              status: true,
              appointmentType: true,
              scheduledStart: true,
              scheduledEnd: true,
              createdAt: true,
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
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 3,
          },
          labOrders: {
            select: {
              id: true,
              status: true,
              source: true,
              collectionType: true,
              createdAt: true,
              lab: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 3,
          },
          labReports: {
            select: {
              id: true,
              title: true,
              status: true,
              fileUrl: true,
              createdAt: true,
              lab: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 3,
          },
          _count: {
            select: {
              appointments: true,
              encounters: true,
              medicalDocuments: true,
              labOrders: true,
              labReports: true,
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
            avatarUrl: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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
        },
        hospitalReviews: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        doctorReviews: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        visitFeedbacks: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        notifications: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 30,
        },
        chatThreads: {
          include: {
            messages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 5,
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            appointments: true,
            encounters: true,
            medicalDocuments: true,
            labOrders: true,
            labReports: true,
            notifications: true,
            chatThreads: true,
          },
        },
      },
    })

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found.',
      })
    }

    return res.json({ patient })
  } catch (error) {
    console.error('Admin get patient error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})