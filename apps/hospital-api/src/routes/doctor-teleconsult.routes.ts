import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  AppointmentStatus,
  AppointmentType,
  NotificationType,
} from '@careos/database'
import {
  requireDoctorAuth,
  type AuthenticatedDoctorRequest,
} from '../middleware/require-doctor-auth'

export const doctorTeleconsultRouter = Router()

doctorTeleconsultRouter.use(requireDoctorAuth)

const teleconsultLinkSchema = z.object({
  providerType: z.string().default('CUSTOM_URL'),
  providerName: z.string().max(100).optional(),
  joinUrl: z
    .string()
    .url()
    .refine((value) => value.startsWith('https://'), {
      message: 'Only HTTPS meeting links are allowed.',
    }),
  hostUrl: z
    .string()
    .url()
    .refine((value) => value.startsWith('https://'), {
      message: 'Only HTTPS host links are allowed.',
    })
    .optional(),
})

function canManageTeleconsult(status: AppointmentStatus) {
  return [
    AppointmentStatus.REQUESTED,
    AppointmentStatus.CONFIRMED,
  ].includes(status)
}

doctorTeleconsultRouter.get(
  '/appointments/:appointmentId/teleconsult',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const doctorId = req.user?.doctorId
      const hospitalDoctorId = req.user?.hospitalDoctorId

      if (!hospitalId || !doctorId || !hospitalDoctorId) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: req.params.appointmentId,
          hospitalId,
          doctorId,
          hospitalDoctorId,
          deletedAt: null,
        },
        include: {
          teleconsultSession: true,
          patient: true,
          hospital: true,
          department: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found for this doctor.',
        })
      }

      if (appointment.appointmentType !== AppointmentType.TELECONSULT) {
        return res.status(400).json({
          message: 'This appointment is not a teleconsult appointment.',
        })
      }

      return res.json({
        appointment,
        teleconsultSession: appointment.teleconsultSession,
      })
    } catch (error) {
      console.error('Doctor get teleconsult error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorTeleconsultRouter.patch(
  '/appointments/:appointmentId/teleconsult-link',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const doctorId = req.user?.doctorId
      const hospitalDoctorId = req.user?.hospitalDoctorId
      const userId = req.user?.userId

      if (!hospitalId || !doctorId || !hospitalDoctorId || !userId) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const parsed = teleconsultLinkSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid teleconsult link data.',
          errors: parsed.error.flatten(),
        })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: req.params.appointmentId,
          hospitalId,
          doctorId,
          hospitalDoctorId,
          deletedAt: null,
        },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          doctor: true,
          hospital: true,
          teleconsultSession: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found for this doctor.',
        })
      }

      if (appointment.appointmentType !== AppointmentType.TELECONSULT) {
        return res.status(400).json({
          message: 'Meeting links can only be added to TELECONSULT appointments.',
        })
      }

      if (!canManageTeleconsult(appointment.status)) {
        return res.status(400).json({
          message: `Meeting link can only be managed for REQUESTED or CONFIRMED appointments. Current status: ${appointment.status}`,
        })
      }

      const session = await prisma.teleconsultSession.upsert({
        where: {
          appointmentId: appointment.id,
        },
        update: {
          providerType: parsed.data.providerType,
          providerName: parsed.data.providerName,
          joinUrl: parsed.data.joinUrl,
          hostUrl: parsed.data.hostUrl,
          status: 'READY',
          createdByUserId: userId,
          startedAt: null,
          endedAt: null,
        },
        create: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          hospitalId: appointment.hospitalId,
          hospitalDoctorId: appointment.hospitalDoctorId,
          doctorId: appointment.doctorId,
          providerType: parsed.data.providerType,
          providerName: parsed.data.providerName,
          joinUrl: parsed.data.joinUrl,
          hostUrl: parsed.data.hostUrl,
          status: 'READY',
          createdByUserId: userId,
        },
      })

      await prisma.notification.create({
        data: {
          recipientUserId: appointment.patient.userId,
          type: NotificationType.SYSTEM,
          title: 'Teleconsult link is ready',
          body: `Your online consultation link is ready for ${appointment.doctor.fullName}.`,
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          metadata: {
            appointmentId: appointment.id,
            teleconsultSessionId: session.id,
          },
        },
      })

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'DOCTOR_UPSERT_TELECONSULT_LINK',
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          metadata: {
            hospitalId,
            doctorId,
            hospitalDoctorId,
            providerType: session.providerType,
            providerName: session.providerName,
          },
        },
      })

      return res.json({
        message: 'Teleconsult link saved successfully.',
        teleconsultSession: session,
      })
    } catch (error) {
      console.error('Doctor save teleconsult link error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorTeleconsultRouter.patch(
  '/appointments/:appointmentId/teleconsult/start',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const doctorId = req.user?.doctorId
      const hospitalDoctorId = req.user?.hospitalDoctorId

      if (!hospitalId || !doctorId || !hospitalDoctorId) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const session = await prisma.teleconsultSession.findFirst({
        where: {
          appointmentId: req.params.appointmentId,
          hospitalId,
          doctorId,
          hospitalDoctorId,
          deletedAt: null,
        },
      })

      if (!session) {
        return res.status(404).json({
          message: 'Teleconsult session not found.',
        })
      }

      const updated = await prisma.teleconsultSession.update({
        where: {
          id: session.id,
        },
        data: {
          status: 'STARTED',
          startedAt: new Date(),
          endedAt: null,
        },
      })

      return res.json({
        message: 'Teleconsult session started.',
        teleconsultSession: updated,
      })
    } catch (error) {
      console.error('Doctor start teleconsult error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorTeleconsultRouter.patch(
  '/appointments/:appointmentId/teleconsult/end',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const doctorId = req.user?.doctorId
      const hospitalDoctorId = req.user?.hospitalDoctorId

      if (!hospitalId || !doctorId || !hospitalDoctorId) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const session = await prisma.teleconsultSession.findFirst({
        where: {
          appointmentId: req.params.appointmentId,
          hospitalId,
          doctorId,
          hospitalDoctorId,
          deletedAt: null,
        },
      })

      if (!session) {
        return res.status(404).json({
          message: 'Teleconsult session not found.',
        })
      }

      const updated = await prisma.teleconsultSession.update({
        where: {
          id: session.id,
        },
        data: {
          status: 'ENDED',
          endedAt: new Date(),
        },
      })

      return res.json({
        message: 'Teleconsult session ended.',
        teleconsultSession: updated,
      })
    } catch (error) {
      console.error('Doctor end teleconsult error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)