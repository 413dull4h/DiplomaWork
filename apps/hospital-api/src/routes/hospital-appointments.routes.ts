import { Router } from 'express'
import { z } from 'zod'
import { prisma, AppointmentStatus, NotificationType } from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalAppointmentsRouter = Router()

hospitalAppointmentsRouter.use(requireHospitalAuth)

const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().optional(),
})

const appointmentInclude = {
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
      primaryAddress: true,
    },
  },
  hospital: true,
  doctor: true,
  department: true,
  hospitalDoctor: true,
  encounter: true,
  medicalDocuments: true,
  hospitalReview: true,
  doctorReview: true,
  patientVisitFeedback: true,
  chatThread: true,
  teleconsultSession: true,
}

hospitalAppointmentsRouter.get(
  '/',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const status = req.query.status ? String(req.query.status) : undefined

      const appointments = await prisma.appointment.findMany({
        where: {
          hospitalId,
          deletedAt: null,
          status: status as AppointmentStatus | undefined,
        },
        include: appointmentInclude,
        orderBy: {
          scheduledStart: 'asc',
        },
      })

      return res.json({
        appointments,
      })
    } catch (error) {
      console.error('List hospital appointments error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalAppointmentsRouter.get(
  '/:id',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          deletedAt: null,
        },
        include: appointmentInclude,
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
      console.error('Get hospital appointment error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalAppointmentsRouter.patch(
  '/:id/confirm',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const existing = await prisma.appointment.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Appointment not found.',
        })
      }

      if (existing.status !== AppointmentStatus.REQUESTED) {
        return res.status(400).json({
          message: `Only REQUESTED appointments can be confirmed. Current status: ${existing.status}`,
        })
      }

      const appointment = await prisma.appointment.update({
        where: {
          id: existing.id,
        },
        data: {
          status: AppointmentStatus.CONFIRMED,
        },
        include: appointmentInclude,
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'CONFIRM_HOSPITAL_APPOINTMENT',
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          metadata: {
            hospitalId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
          },
        },
      })

      await prisma.notification.create({
        data: {
          recipientUserId: appointment.patient.userId,
          type: NotificationType.APPOINTMENT_CONFIRMED,
          title: 'Appointment confirmed',
          body: `Your appointment with ${appointment.doctor.fullName} has been confirmed.`,
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          metadata: {
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            hospitalId: appointment.hospitalId,
            doctorId: appointment.doctorId,
            appointmentType: appointment.appointmentType,
            scheduledStart: appointment.scheduledStart.toISOString(),
            scheduledEnd: appointment.scheduledEnd.toISOString(),
          },
        },
      })

      return res.json({
        message: 'Appointment confirmed successfully.',
        appointment,
      })
    } catch (error) {
      console.error('Confirm hospital appointment error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalAppointmentsRouter.patch(
  '/:id/cancel',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = cancelAppointmentSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid cancellation data.',
          errors: parsed.error.flatten(),
        })
      }

      const existing = await prisma.appointment.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Appointment not found.',
        })
      }

      if (
        existing.status === AppointmentStatus.CANCELLED ||
        existing.status === AppointmentStatus.COMPLETED
      ) {
        return res.status(400).json({
          message: `Appointment cannot be cancelled because it is ${existing.status}.`,
        })
      }

      const appointment = await prisma.appointment.update({
        where: {
          id: existing.id,
        },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancellationReason: parsed.data.cancellationReason,
        },
        include: appointmentInclude,
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'CANCEL_HOSPITAL_APPOINTMENT',
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          metadata: {
            hospitalId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            reason: parsed.data.cancellationReason,
          },
        },
      })

      await prisma.notification.create({
        data: {
          recipientUserId: appointment.patient.userId,
          type: NotificationType.APPOINTMENT_CANCELLED,
          title: 'Appointment cancelled',
          body: `Your appointment with ${appointment.doctor.fullName} was cancelled.`,
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          metadata: {
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            hospitalId: appointment.hospitalId,
            doctorId: appointment.doctorId,
            cancellationReason: appointment.cancellationReason,
            scheduledStart: appointment.scheduledStart.toISOString(),
            scheduledEnd: appointment.scheduledEnd.toISOString(),
          },
        },
      })

      return res.json({
        message: 'Appointment cancelled successfully.',
        appointment,
      })
    } catch (error) {
      console.error('Cancel hospital appointment error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalAppointmentsRouter.patch(
  '/:id/complete',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const existing = await prisma.appointment.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Appointment not found.',
        })
      }

      if (
        existing.status === AppointmentStatus.CANCELLED ||
        existing.status === AppointmentStatus.NO_SHOW
      ) {
        return res.status(400).json({
          message: `Appointment cannot be completed because it is ${existing.status}.`,
        })
      }

      const appointment = await prisma.appointment.update({
        where: {
          id: existing.id,
        },
        data: {
          status: AppointmentStatus.COMPLETED,
        },
        include: appointmentInclude,
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'COMPLETE_HOSPITAL_APPOINTMENT',
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          metadata: {
            hospitalId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
          },
        },
      })

      await prisma.notification.create({
        data: {
          recipientUserId: appointment.patient.userId,
          type: NotificationType.APPOINTMENT_COMPLETED,
          title: 'Appointment completed',
          body: `Your appointment with ${appointment.doctor.fullName} has been marked as completed.`,
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          metadata: {
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            hospitalId: appointment.hospitalId,
            doctorId: appointment.doctorId,
            scheduledStart: appointment.scheduledStart.toISOString(),
            scheduledEnd: appointment.scheduledEnd.toISOString(),
          },
        },
      })

      return res.json({
        message: 'Appointment completed successfully.',
        appointment,
      })
    } catch (error) {
      console.error('Complete hospital appointment error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalAppointmentsRouter.patch(
  '/:id/no-show',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const existing = await prisma.appointment.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Appointment not found.',
        })
      }

      if (
        existing.status === AppointmentStatus.CANCELLED ||
        existing.status === AppointmentStatus.COMPLETED
      ) {
        return res.status(400).json({
          message: `Appointment cannot be marked no-show because it is ${existing.status}.`,
        })
      }

      const appointment = await prisma.appointment.update({
        where: {
          id: existing.id,
        },
        data: {
          status: AppointmentStatus.NO_SHOW,
        },
        include: appointmentInclude,
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'MARK_HOSPITAL_APPOINTMENT_NO_SHOW',
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          metadata: {
            hospitalId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
          },
        },
      })

      await prisma.notification.create({
        data: {
          recipientUserId: appointment.patient.userId,
          type: NotificationType.APPOINTMENT_NO_SHOW,
          title: 'Appointment marked as no-show',
          body: `Your appointment with ${appointment.doctor.fullName} was marked as no-show.`,
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          metadata: {
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            hospitalId: appointment.hospitalId,
            doctorId: appointment.doctorId,
            scheduledStart: appointment.scheduledStart.toISOString(),
            scheduledEnd: appointment.scheduledEnd.toISOString(),
          },
        },
      })

      return res.json({
        message: 'Appointment marked as no-show successfully.',
        appointment,
      })
    } catch (error) {
      console.error('No-show hospital appointment error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)