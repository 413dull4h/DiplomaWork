import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  AppointmentStatus,
  ReviewStatus,
} from '@careos/database'
import {
  requirePatientAuth,
  type AuthenticatedPatientRequest,
} from '../middleware/require-patient-auth'

export const patientReviewsRouter = Router()

patientReviewsRouter.use(requirePatientAuth)

const rating = z.coerce.number().int().min(1).max(5)

const createHospitalReviewSchema = z.object({
  appointmentId: z.string().uuid(),
  overallRating: rating,
  staffRating: rating.optional(),
  cleanlinessRating: rating.optional(),
  waitingTimeRating: rating.optional(),
  serviceRating: rating.optional(),
  comment: z.string().max(2000).optional(),
})

const createDoctorReviewSchema = z.object({
  appointmentId: z.string().uuid(),
  overallRating: rating,
  communicationRating: rating.optional(),
  professionalismRating: rating.optional(),
  helpfulnessRating: rating.optional(),
  wouldRecommend: z.boolean().optional(),
  comment: z.string().max(2000).optional(),
})

patientReviewsRouter.get('/', async (req: AuthenticatedPatientRequest, res) => {
  try {
    const patientId = req.user?.patientId

    if (!patientId) {
      return res.status(403).json({
        message: 'No patient assigned.',
      })
    }

    const [hospitalReviews, doctorReviews] = await Promise.all([
      prisma.hospitalReview.findMany({
        where: {
          patientId,
          deletedAt: null,
        },
        include: {
          hospital: true,
          appointment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),

      prisma.doctorReview.findMany({
        where: {
          patientId,
          deletedAt: null,
        },
        include: {
          hospital: true,
          doctor: true,
          appointment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return res.json({
      hospitalReviews,
      doctorReviews,
    })
  } catch (error) {
    console.error('Patient list reviews error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

patientReviewsRouter.get(
  '/appointment/:appointmentId/status',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: req.params.appointmentId,
          patientId,
          deletedAt: null,
        },
        include: {
          hospitalReview: true,
          doctorReview: true,
          hospital: true,
          doctor: true,
          department: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found.',
        })
      }

      return res.json({
        appointmentId: appointment.id,
        canReview: appointment.status === AppointmentStatus.COMPLETED,
        status: appointment.status,
        hospitalReviewSubmitted: Boolean(appointment.hospitalReview),
        doctorReviewSubmitted: Boolean(appointment.doctorReview),
        hospital: appointment.hospital,
        doctor: appointment.doctor,
        department: appointment.department,
      })
    } catch (error) {
      console.error('Patient appointment review status error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientReviewsRouter.post(
  '/hospital',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId
      const userId = req.user?.userId

      if (!patientId || !userId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const parsed = createHospitalReviewSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid hospital review data.',
          errors: parsed.error.flatten(),
        })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: parsed.data.appointmentId,
          patientId,
          deletedAt: null,
        },
        include: {
          hospitalReview: true,
          hospital: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found.',
        })
      }

      if (appointment.status !== AppointmentStatus.COMPLETED) {
        return res.status(400).json({
          message: `Only COMPLETED appointments can be reviewed. Current status: ${appointment.status}`,
        })
      }

      if (appointment.hospitalReview) {
        return res.status(409).json({
          message: 'Hospital review already submitted for this appointment.',
        })
      }

      const review = await prisma.hospitalReview.create({
        data: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          hospitalId: appointment.hospitalId,
          overallRating: parsed.data.overallRating,
          staffRating: parsed.data.staffRating,
          cleanlinessRating: parsed.data.cleanlinessRating,
          waitingTimeRating: parsed.data.waitingTimeRating,
          serviceRating: parsed.data.serviceRating,
          comment: parsed.data.comment,
          status: ReviewStatus.PENDING,
        },
        include: {
          hospital: true,
          appointment: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_HOSPITAL_REVIEW',
          entityType: 'HOSPITAL_REVIEW',
          entityId: review.id,
          metadata: {
            appointmentId: appointment.id,
            patientId,
            hospitalId: appointment.hospitalId,
            status: review.status,
          },
        },
      })

      return res.status(201).json({
        message: 'Hospital review submitted successfully.',
        review,
      })
    } catch (error) {
      console.error('Create hospital review error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientReviewsRouter.post(
  '/doctor',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId
      const userId = req.user?.userId

      if (!patientId || !userId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const parsed = createDoctorReviewSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid doctor review data.',
          errors: parsed.error.flatten(),
        })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: parsed.data.appointmentId,
          patientId,
          deletedAt: null,
        },
        include: {
          doctorReview: true,
          hospital: true,
          doctor: true,
          hospitalDoctor: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found.',
        })
      }

      if (appointment.status !== AppointmentStatus.COMPLETED) {
        return res.status(400).json({
          message: `Only COMPLETED appointments can be reviewed. Current status: ${appointment.status}`,
        })
      }

      if (appointment.doctorReview) {
        return res.status(409).json({
          message: 'Doctor review already submitted for this appointment.',
        })
      }

      const review = await prisma.doctorReview.create({
        data: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          hospitalId: appointment.hospitalId,
          doctorId: appointment.doctorId,
          hospitalDoctorId: appointment.hospitalDoctorId,
          overallRating: parsed.data.overallRating,
          communicationRating: parsed.data.communicationRating,
          professionalismRating: parsed.data.professionalismRating,
          helpfulnessRating: parsed.data.helpfulnessRating,
          wouldRecommend: parsed.data.wouldRecommend,
          comment: parsed.data.comment,
          status: ReviewStatus.PENDING,
        },
        include: {
          hospital: true,
          doctor: true,
          appointment: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_DOCTOR_REVIEW',
          entityType: 'DOCTOR_REVIEW',
          entityId: review.id,
          metadata: {
            appointmentId: appointment.id,
            patientId,
            hospitalId: appointment.hospitalId,
            doctorId: appointment.doctorId,
            hospitalDoctorId: appointment.hospitalDoctorId,
            status: review.status,
          },
        },
      })

      return res.status(201).json({
        message: 'Doctor review submitted successfully.',
        review,
      })
    } catch (error) {
      console.error('Create doctor review error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)