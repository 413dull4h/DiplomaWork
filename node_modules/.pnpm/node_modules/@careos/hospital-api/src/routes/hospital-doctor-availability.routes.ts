import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  AvailabilityAppointmentType,
  DayOfWeek,
} from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalDoctorAvailabilityRouter = Router()

hospitalDoctorAvailabilityRouter.use(requireHospitalAuth)

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const createAvailabilitySchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.string().regex(timeRegex, 'Time must be HH:mm format'),
  endTime: z.string().regex(timeRegex, 'Time must be HH:mm format'),
  slotDurationMinutes: z.number().int().min(5).max(240).default(30),
  appointmentType: z.nativeEnum(AvailabilityAppointmentType).default(AvailabilityAppointmentType.BOTH),
})

const updateAvailabilitySchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek).optional(),
  startTime: z.string().regex(timeRegex, 'Time must be HH:mm format').optional(),
  endTime: z.string().regex(timeRegex, 'Time must be HH:mm format').optional(),
  slotDurationMinutes: z.number().int().min(5).max(240).optional(),
  appointmentType: z.nativeEnum(AvailabilityAppointmentType).optional(),
  isActive: z.boolean().optional(),
})

hospitalDoctorAvailabilityRouter.get(
  '/doctors/:hospitalDoctorId/availabilities',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const hospitalDoctor = await prisma.hospitalDoctor.findFirst({
        where: {
          id: req.params.hospitalDoctorId,
          hospitalId,
          isActive: true,
        },
      })

      if (!hospitalDoctor) {
        return res.status(404).json({
          message: 'Doctor not found for this hospital.',
        })
      }

      const availabilities = await prisma.doctorAvailability.findMany({
        where: {
          hospitalDoctorId: hospitalDoctor.id,
          deletedAt: null,
        },
        orderBy: [
          {
            dayOfWeek: 'asc',
          },
          {
            startTime: 'asc',
          },
        ],
      })

      return res.json({
        availabilities,
      })
    } catch (error) {
      console.error('List doctor availabilities error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalDoctorAvailabilityRouter.post(
  '/doctors/:hospitalDoctorId/availabilities',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = createAvailabilitySchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid availability data.',
          errors: parsed.error.flatten(),
        })
      }

      const { dayOfWeek, startTime, endTime, slotDurationMinutes, appointmentType } = parsed.data

      if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
        return res.status(400).json({
          message: 'startTime must be earlier than endTime.',
        })
      }

      const totalMinutes = timeToMinutes(endTime) - timeToMinutes(startTime)

      if (totalMinutes < slotDurationMinutes) {
        return res.status(400).json({
          message: 'Slot duration is longer than the available time range.',
        })
      }

      const hospitalDoctor = await prisma.hospitalDoctor.findFirst({
        where: {
          id: req.params.hospitalDoctorId,
          hospitalId,
          isActive: true,
          doctor: {
            deletedAt: null,
          },
        },
        include: {
          doctor: true,
          department: true,
        },
      })

      if (!hospitalDoctor) {
        return res.status(404).json({
          message: 'Doctor not found for this hospital.',
        })
      }

      const availability = await prisma.doctorAvailability.create({
        data: {
          hospitalDoctorId: hospitalDoctor.id,
          dayOfWeek,
          startTime,
          endTime,
          slotDurationMinutes,
          appointmentType,
          isActive: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'CREATE_DOCTOR_AVAILABILITY',
          entityType: 'DOCTOR_AVAILABILITY',
          entityId: availability.id,
          metadata: {
            hospitalId,
            hospitalDoctorId: hospitalDoctor.id,
            doctorName: hospitalDoctor.doctor.fullName,
            dayOfWeek,
            startTime,
            endTime,
          },
        },
      })

      return res.status(201).json({
        message: 'Doctor availability created successfully.',
        availability,
      })
    } catch (error) {
      console.error('Create doctor availability error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalDoctorAvailabilityRouter.patch(
  '/availabilities/:availabilityId',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = updateAvailabilitySchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid availability data.',
          errors: parsed.error.flatten(),
        })
      }

      const existing = await prisma.doctorAvailability.findFirst({
        where: {
          id: req.params.availabilityId,
          deletedAt: null,
          hospitalDoctor: {
            hospitalId,
            isActive: true,
          },
        },
        include: {
          hospitalDoctor: {
            include: {
              doctor: true,
            },
          },
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Availability not found.',
        })
      }

      const nextStartTime = parsed.data.startTime ?? existing.startTime
      const nextEndTime = parsed.data.endTime ?? existing.endTime
      const nextSlotDuration =
        parsed.data.slotDurationMinutes ?? existing.slotDurationMinutes

      if (timeToMinutes(nextStartTime) >= timeToMinutes(nextEndTime)) {
        return res.status(400).json({
          message: 'startTime must be earlier than endTime.',
        })
      }

      const totalMinutes = timeToMinutes(nextEndTime) - timeToMinutes(nextStartTime)

      if (totalMinutes < nextSlotDuration) {
        return res.status(400).json({
          message: 'Slot duration is longer than the available time range.',
        })
      }

      const availability = await prisma.doctorAvailability.update({
        where: {
          id: existing.id,
        },
        data: parsed.data,
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'UPDATE_DOCTOR_AVAILABILITY',
          entityType: 'DOCTOR_AVAILABILITY',
          entityId: availability.id,
          metadata: {
            hospitalId,
            doctorName: existing.hospitalDoctor.doctor.fullName,
          },
        },
      })

      return res.json({
        message: 'Doctor availability updated successfully.',
        availability,
      })
    } catch (error) {
      console.error('Update doctor availability error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalDoctorAvailabilityRouter.delete(
  '/availabilities/:availabilityId',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const existing = await prisma.doctorAvailability.findFirst({
        where: {
          id: req.params.availabilityId,
          deletedAt: null,
          hospitalDoctor: {
            hospitalId,
            isActive: true,
          },
        },
        include: {
          hospitalDoctor: {
            include: {
              doctor: true,
            },
          },
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Availability not found.',
        })
      }

      const availability = await prisma.doctorAvailability.update({
        where: {
          id: existing.id,
        },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'DELETE_DOCTOR_AVAILABILITY',
          entityType: 'DOCTOR_AVAILABILITY',
          entityId: availability.id,
          metadata: {
            hospitalId,
            doctorName: existing.hospitalDoctor.doctor.fullName,
          },
        },
      })

      return res.json({
        message: 'Doctor availability deleted successfully.',
        availability,
      })
    } catch (error) {
      console.error('Delete doctor availability error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)