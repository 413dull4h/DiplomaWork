import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  AppointmentStatus,
  ReviewStatus,
} from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalReviewsRouter = Router()

hospitalReviewsRouter.use(requireHospitalAuth)

const reviewQuerySchema = z.object({
  status: z.nativeEnum(ReviewStatus).optional(),
  doctorId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

const patientFeedbackSchema = z.object({
  arrivedOnTime: z.boolean().optional(),
  wasNoShow: z.boolean().optional(),
  followedInstructions: z.boolean().optional(),
  followUpNeeded: z.boolean().optional(),
  communicationNote: z.string().max(2000).optional(),
  internalNote: z.string().max(3000).optional(),
})

function canCreatePatientFeedback(status: AppointmentStatus) {
  return [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW].includes(status)
}

hospitalReviewsRouter.get(
  '/summary',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const [
        hospitalPending,
        hospitalApproved,
        hospitalRejected,
        doctorPending,
        doctorApproved,
        doctorRejected,
        hospitalAverage,
        doctorAverage,
        feedbackCount,
      ] = await Promise.all([
        prisma.hospitalReview.count({
          where: { hospitalId, status: ReviewStatus.PENDING, deletedAt: null },
        }),
        prisma.hospitalReview.count({
          where: { hospitalId, status: ReviewStatus.APPROVED, deletedAt: null },
        }),
        prisma.hospitalReview.count({
          where: { hospitalId, status: ReviewStatus.REJECTED, deletedAt: null },
        }),

        prisma.doctorReview.count({
          where: { hospitalId, status: ReviewStatus.PENDING, deletedAt: null },
        }),
        prisma.doctorReview.count({
          where: { hospitalId, status: ReviewStatus.APPROVED, deletedAt: null },
        }),
        prisma.doctorReview.count({
          where: { hospitalId, status: ReviewStatus.REJECTED, deletedAt: null },
        }),

        prisma.hospitalReview.aggregate({
          where: {
            hospitalId,
            status: ReviewStatus.APPROVED,
            deletedAt: null,
          },
          _avg: {
            overallRating: true,
            staffRating: true,
            cleanlinessRating: true,
            waitingTimeRating: true,
            serviceRating: true,
          },
        }),

        prisma.doctorReview.aggregate({
          where: {
            hospitalId,
            status: ReviewStatus.APPROVED,
            deletedAt: null,
          },
          _avg: {
            overallRating: true,
            communicationRating: true,
            professionalismRating: true,
            helpfulnessRating: true,
          },
        }),

        prisma.patientVisitFeedback.count({
          where: {
            hospitalId,
            deletedAt: null,
          },
        }),
      ])

      return res.json({
        hospitalReviews: {
          pending: hospitalPending,
          approved: hospitalApproved,
          rejected: hospitalRejected,
          average: hospitalAverage._avg,
        },
        doctorReviews: {
          pending: doctorPending,
          approved: doctorApproved,
          rejected: doctorRejected,
          average: doctorAverage._avg,
        },
        patientVisitFeedback: {
          total: feedbackCount,
        },
      })
    } catch (error) {
      console.error('Hospital review summary error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalReviewsRouter.get(
  '/hospital',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = reviewQuerySchema.safeParse(req.query)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid review query.',
          errors: parsed.error.flatten(),
        })
      }

      const reviews = await prisma.hospitalReview.findMany({
        where: {
          hospitalId,
          deletedAt: null,
          status: parsed.data.status,
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
          appointment: true,
          hospital: true,
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
      console.error('Hospital list hospital reviews error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalReviewsRouter.get(
  '/doctors',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = reviewQuerySchema.safeParse(req.query)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid review query.',
          errors: parsed.error.flatten(),
        })
      }

      const reviews = await prisma.doctorReview.findMany({
        where: {
          hospitalId,
          deletedAt: null,
          status: parsed.data.status,
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
      console.error('Hospital list doctor reviews error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalReviewsRouter.post(
  '/appointments/:appointmentId/patient-feedback',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const createdByUserId = req.user?.userId

      if (!hospitalId || !createdByUserId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = patientFeedbackSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid patient feedback data.',
          errors: parsed.error.flatten(),
        })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: req.params.appointmentId,
          hospitalId,
          deletedAt: null,
        },
        include: {
          patientVisitFeedback: true,
          patient: true,
          doctor: true,
          hospitalDoctor: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found.',
        })
      }

      if (!canCreatePatientFeedback(appointment.status)) {
        return res.status(400).json({
          message: `Patient visit feedback can only be created for COMPLETED or NO_SHOW appointments. Current status: ${appointment.status}`,
        })
      }

      if (appointment.patientVisitFeedback) {
        return res.status(409).json({
          message: 'Patient visit feedback already exists for this appointment.',
        })
      }

      const feedback = await prisma.patientVisitFeedback.create({
        data: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          hospitalId: appointment.hospitalId,
          doctorId: appointment.doctorId,
          hospitalDoctorId: appointment.hospitalDoctorId,
          createdByUserId,
          arrivedOnTime: parsed.data.arrivedOnTime,
          wasNoShow: parsed.data.wasNoShow,
          followedInstructions: parsed.data.followedInstructions,
          followUpNeeded: parsed.data.followUpNeeded,
          communicationNote: parsed.data.communicationNote,
          internalNote: parsed.data.internalNote,
        },
        include: {
          patient: true,
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
      })

      await prisma.auditLog.create({
        data: {
          userId: createdByUserId,
          action: 'CREATE_PATIENT_VISIT_FEEDBACK',
          entityType: 'PATIENT_VISIT_FEEDBACK',
          entityId: feedback.id,
          metadata: {
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            hospitalId,
            doctorId: appointment.doctorId,
          },
        },
      })

      return res.status(201).json({
        message: 'Patient visit feedback created successfully.',
        feedback,
      })
    } catch (error) {
      console.error('Create patient visit feedback error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalReviewsRouter.get(
  '/appointments/:appointmentId/patient-feedback',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const feedback = await prisma.patientVisitFeedback.findFirst({
        where: {
          appointmentId: req.params.appointmentId,
          hospitalId,
          deletedAt: null,
        },
        include: {
          patient: true,
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
      })

      if (!feedback) {
        return res.status(404).json({
          message: 'Patient visit feedback not found.',
        })
      }

      return res.json({
        feedback,
      })
    } catch (error) {
      console.error('Get patient visit feedback error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalReviewsRouter.get(
  '/patients/:patientId/visit-feedback',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const feedbacks = await prisma.patientVisitFeedback.findMany({
        where: {
          patientId: req.params.patientId,
          hospitalId,
          deletedAt: null,
        },
        include: {
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
      })

      return res.json({
        feedbacks,
      })
    } catch (error) {
      console.error('List patient visit feedback error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)
