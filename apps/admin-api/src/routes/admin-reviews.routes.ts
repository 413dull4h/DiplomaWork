import { Router } from 'express'
import { z } from 'zod'
import { prisma, ReviewStatus } from '@careos/database'
import {
  requireAdminAuth,
  type AuthenticatedAdminRequest,
} from '../middleware/require-admin-auth'

export const adminReviewsRouter = Router()

adminReviewsRouter.use(requireAdminAuth)

const reviewQuerySchema = z.object({
  status: z.nativeEnum(ReviewStatus).optional(),
  hospitalId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

const moderationSchema = z.object({
  moderationNote: z.string().max(2000).optional(),
})

adminReviewsRouter.get('/summary', async (_req, res) => {
  try {
    const [
      hospitalPending,
      hospitalApproved,
      hospitalRejected,
      doctorPending,
      doctorApproved,
      doctorRejected,
      patientFeedbackTotal,
    ] = await Promise.all([
      prisma.hospitalReview.count({
        where: {
          status: ReviewStatus.PENDING,
          deletedAt: null,
        },
      }),

      prisma.hospitalReview.count({
        where: {
          status: ReviewStatus.APPROVED,
          deletedAt: null,
        },
      }),

      prisma.hospitalReview.count({
        where: {
          status: ReviewStatus.REJECTED,
          deletedAt: null,
        },
      }),

      prisma.doctorReview.count({
        where: {
          status: ReviewStatus.PENDING,
          deletedAt: null,
        },
      }),

      prisma.doctorReview.count({
        where: {
          status: ReviewStatus.APPROVED,
          deletedAt: null,
        },
      }),

      prisma.doctorReview.count({
        where: {
          status: ReviewStatus.REJECTED,
          deletedAt: null,
        },
      }),

      prisma.patientVisitFeedback.count({
        where: {
          deletedAt: null,
        },
      }),
    ])

    return res.json({
      hospitalReviews: {
        pending: hospitalPending,
        approved: hospitalApproved,
        rejected: hospitalRejected,
      },
      doctorReviews: {
        pending: doctorPending,
        approved: doctorApproved,
        rejected: doctorRejected,
      },
      patientVisitFeedback: {
        total: patientFeedbackTotal,
      },
    })
  } catch (error) {
    console.error('Admin review summary error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminReviewsRouter.get('/hospitals', async (req, res) => {
  try {
    const parsed = reviewQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid review query.',
        errors: parsed.error.flatten(),
      })
    }

    const reviews = await prisma.hospitalReview.findMany({
      where: {
        deletedAt: null,
        status: parsed.data.status,
        hospitalId: parsed.data.hospitalId,
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
              },
            },
          },
        },
        hospital: true,
        appointment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parsed.data.limit,
    })

    return res.json({
      reviews,
    })
  } catch (error) {
    console.error('Admin list hospital reviews error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminReviewsRouter.get('/doctors', async (req, res) => {
  try {
    const parsed = reviewQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid review query.',
        errors: parsed.error.flatten(),
      })
    }

    const reviews = await prisma.doctorReview.findMany({
      where: {
        deletedAt: null,
        status: parsed.data.status,
        hospitalId: parsed.data.hospitalId,
        doctorId: parsed.data.doctorId,
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
              },
            },
          },
        },
        hospital: true,
        doctor: true,
        hospitalDoctor: true,
        appointment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parsed.data.limit,
    })

    return res.json({
      reviews,
    })
  } catch (error) {
    console.error('Admin list doctor reviews error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminReviewsRouter.get('/patient-feedback', async (req, res) => {
  try {
    const parsed = reviewQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid patient feedback query.',
        errors: parsed.error.flatten(),
      })
    }

    const feedbacks = await prisma.patientVisitFeedback.findMany({
      where: {
        deletedAt: null,
        hospitalId: parsed.data.hospitalId,
        doctorId: parsed.data.doctorId,
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
              },
            },
          },
        },
        hospital: true,
        doctor: true,
        hospitalDoctor: true,
        appointment: true,
        createdByUser: {
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
      take: parsed.data.limit,
    })

    return res.json({
      feedbacks,
    })
  } catch (error) {
    console.error('Admin list patient feedback error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminReviewsRouter.patch(
  '/hospitals/:id/approve',
  async (req: AuthenticatedAdminRequest, res) => {
    try {
      const parsed = moderationSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid moderation data.',
          errors: parsed.error.flatten(),
        })
      }

      const existing = await prisma.hospitalReview.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Hospital review not found.',
        })
      }

      const review = await prisma.hospitalReview.update({
        where: {
          id: existing.id,
        },
        data: {
          status: ReviewStatus.APPROVED,
          moderationNote: parsed.data.moderationNote,
          moderatedByUserId: req.user?.userId,
          moderatedAt: new Date(),
        },
        include: {
          patient: true,
          hospital: true,
          appointment: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'APPROVE_HOSPITAL_REVIEW',
          entityType: 'HOSPITAL_REVIEW',
          entityId: review.id,
          metadata: {
            appointmentId: review.appointmentId,
            hospitalId: review.hospitalId,
            patientId: review.patientId,
          },
        },
      })

      return res.json({
        message: 'Hospital review approved successfully.',
        review,
      })
    } catch (error) {
      console.error('Approve hospital review error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

adminReviewsRouter.patch(
  '/hospitals/:id/reject',
  async (req: AuthenticatedAdminRequest, res) => {
    try {
      const parsed = moderationSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid moderation data.',
          errors: parsed.error.flatten(),
        })
      }

      const existing = await prisma.hospitalReview.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Hospital review not found.',
        })
      }

      const review = await prisma.hospitalReview.update({
        where: {
          id: existing.id,
        },
        data: {
          status: ReviewStatus.REJECTED,
          moderationNote: parsed.data.moderationNote,
          moderatedByUserId: req.user?.userId,
          moderatedAt: new Date(),
        },
        include: {
          patient: true,
          hospital: true,
          appointment: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'REJECT_HOSPITAL_REVIEW',
          entityType: 'HOSPITAL_REVIEW',
          entityId: review.id,
          metadata: {
            appointmentId: review.appointmentId,
            hospitalId: review.hospitalId,
            patientId: review.patientId,
          },
        },
      })

      return res.json({
        message: 'Hospital review rejected successfully.',
        review,
      })
    } catch (error) {
      console.error('Reject hospital review error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

adminReviewsRouter.patch(
  '/doctors/:id/approve',
  async (req: AuthenticatedAdminRequest, res) => {
    try {
      const parsed = moderationSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid moderation data.',
          errors: parsed.error.flatten(),
        })
      }

      const existing = await prisma.doctorReview.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Doctor review not found.',
        })
      }

      const review = await prisma.doctorReview.update({
        where: {
          id: existing.id,
        },
        data: {
          status: ReviewStatus.APPROVED,
          moderationNote: parsed.data.moderationNote,
          moderatedByUserId: req.user?.userId,
          moderatedAt: new Date(),
        },
        include: {
          patient: true,
          hospital: true,
          doctor: true,
          appointment: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'APPROVE_DOCTOR_REVIEW',
          entityType: 'DOCTOR_REVIEW',
          entityId: review.id,
          metadata: {
            appointmentId: review.appointmentId,
            hospitalId: review.hospitalId,
            doctorId: review.doctorId,
            patientId: review.patientId,
          },
        },
      })

      return res.json({
        message: 'Doctor review approved successfully.',
        review,
      })
    } catch (error) {
      console.error('Approve doctor review error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

adminReviewsRouter.patch(
  '/doctors/:id/reject',
  async (req: AuthenticatedAdminRequest, res) => {
    try {
      const parsed = moderationSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid moderation data.',
          errors: parsed.error.flatten(),
        })
      }

      const existing = await prisma.doctorReview.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Doctor review not found.',
        })
      }

      const review = await prisma.doctorReview.update({
        where: {
          id: existing.id,
        },
        data: {
          status: ReviewStatus.REJECTED,
          moderationNote: parsed.data.moderationNote,
          moderatedByUserId: req.user?.userId,
          moderatedAt: new Date(),
        },
        include: {
          patient: true,
          hospital: true,
          doctor: true,
          appointment: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'REJECT_DOCTOR_REVIEW',
          entityType: 'DOCTOR_REVIEW',
          entityId: review.id,
          metadata: {
            appointmentId: review.appointmentId,
            hospitalId: review.hospitalId,
            doctorId: review.doctorId,
            patientId: review.patientId,
          },
        },
      })

      return res.json({
        message: 'Doctor review rejected successfully.',
        review,
      })
    } catch (error) {
      console.error('Reject doctor review error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)