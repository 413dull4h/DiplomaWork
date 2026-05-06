import { Router } from 'express'
import { z } from 'zod'
import { prisma, AppointmentStatus } from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalAppointmentsRouter = Router()

hospitalAppointmentsRouter.use(requireHospitalAuth)

const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().optional(),
})

hospitalAppointmentsRouter.get('/', async (req: AuthenticatedHospitalRequest, res) => {
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
        doctor: true,
        department: true,
        hospitalDoctor: true,
      },
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
})

hospitalAppointmentsRouter.get('/:id', async (req: AuthenticatedHospitalRequest, res) => {
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
            primaryAddress: true,
          },
        },
        hospital: true,
        doctor: true,
        department: true,
        hospitalDoctor: true,
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
    console.error('Get hospital appointment error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

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
        include: {
          patient: true,
          doctor: true,
          department: true,
          hospital: true,
        },
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
        include: {
          patient: true,
          doctor: true,
          department: true,
          hospital: true,
        },
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
            reason: parsed.data.cancellationReason,
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
        include: {
          patient: true,
          doctor: true,
          department: true,
          hospital: true,
        },
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
        include: {
          patient: true,
          doctor: true,
          department: true,
          hospital: true,
        },
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
