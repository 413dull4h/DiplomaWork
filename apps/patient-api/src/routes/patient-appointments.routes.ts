import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  AppointmentStatus,
  AppointmentType,
  AvailabilityAppointmentType,
  DayOfWeek,
  HospitalStatus,
  NotificationType,
  UserStatus,
} from '@careos/database'
import {
  requirePatientAuth,
  type AuthenticatedPatientRequest,
} from '../middleware/require-patient-auth'

export const patientAppointmentsRouter = Router()

patientAppointmentsRouter.use(requirePatientAuth)

const dayMap: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function buildDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00.000Z`)
}

async function getActiveHospitalStaffUserIds(hospitalId: string) {
  const hospitalStaff = await prisma.orgStaff.findMany({
    where: {
      hospitalId,
      isActive: true,
      user: {
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
    },
    select: {
      userId: true,
    },
  })

  return hospitalStaff.map((staff) => staff.userId)
}

const createAppointmentSchema = z.object({
  hospitalDoctorId: z.string().uuid(),
  appointmentType: z.nativeEnum(AppointmentType),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  reason: z.string().optional(),
})

const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().optional(),
})

const appointmentInclude = {
  patient: true,
  hospital: true,
  doctor: true,
  department: {
    include: {
      location: {
        include: {
          address: true,
        },
      },
    },
  },
  location: {
    include: {
      address: true,
    },
  },
  hospitalDoctor: {
    include: {
      location: {
        include: {
          address: true,
        },
      },
      department: {
        include: {
          location: {
            include: {
              address: true,
            },
          },
        },
      },
    },
  },
  encounter: true,
  medicalDocuments: true,
  hospitalReview: true,
  doctorReview: true,
  patientVisitFeedback: true,
  chatThread: true,
  teleconsultSession: true,
}

patientAppointmentsRouter.post(
  '/appointments',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const parsed = createAppointmentSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid appointment data.',
          errors: parsed.error.flatten(),
        })
      }

      const {
        hospitalDoctorId,
        appointmentType,
        date,
        startTime,
        endTime,
        reason,
      } = parsed.data

      const requestedStart = timeToMinutes(startTime)
      const requestedEnd = timeToMinutes(endTime)

      if (requestedStart >= requestedEnd) {
        return res.status(400).json({
          message: 'startTime must be earlier than endTime.',
        })
      }

      const scheduledDate = new Date(`${date}T00:00:00.000Z`)
      const scheduledStart = buildDateTime(date, startTime)
      const scheduledEnd = buildDateTime(date, endTime)
      const dayOfWeek = dayMap[scheduledDate.getUTCDay()]

      const hospitalDoctor = await prisma.hospitalDoctor.findFirst({
        where: {
          id: hospitalDoctorId,
          isActive: true,
          hospital: {
            status: HospitalStatus.APPROVED,
            deletedAt: null,
          },
          doctor: {
            deletedAt: null,
          },
        },
        include: {
          hospital: true,
          doctor: true,
          department: {
            include: {
              location: {
                include: {
                  address: true,
                },
              },
            },
          },
          location: {
            include: {
              address: true,
            },
          },
        },
      })

      if (!hospitalDoctor) {
        return res.status(404).json({
          message: 'Doctor not found or not available.',
        })
      }

      const locationId =
        hospitalDoctor.locationId ?? hospitalDoctor.department?.locationId ?? null

      const allowedAvailabilityTypes =
        appointmentType === AppointmentType.IN_PERSON
          ? [
              AvailabilityAppointmentType.IN_PERSON,
              AvailabilityAppointmentType.BOTH,
            ]
          : [
              AvailabilityAppointmentType.TELECONSULT,
              AvailabilityAppointmentType.BOTH,
            ]

      const availabilities = await prisma.doctorAvailability.findMany({
        where: {
          hospitalDoctorId,
          dayOfWeek,
          isActive: true,
          deletedAt: null,
          appointmentType: {
            in: allowedAvailabilityTypes,
          },
        },
      })

      if (availabilities.length === 0) {
        return res.status(400).json({
          message:
            'Doctor is not available on this date for this appointment type.',
        })
      }

      const requestedDuration = requestedEnd - requestedStart

      const matchingAvailability = availabilities.find((availability) => {
        const availabilityStart = timeToMinutes(availability.startTime)
        const availabilityEnd = timeToMinutes(availability.endTime)

        const isWithinAvailability =
          requestedStart >= availabilityStart && requestedEnd <= availabilityEnd

        const hasCorrectDuration =
          requestedDuration === availability.slotDurationMinutes

        const isAlignedToSlot =
          (requestedStart - availabilityStart) %
            availability.slotDurationMinutes ===
          0

        return isWithinAvailability && hasCorrectDuration && isAlignedToSlot
      })

      if (!matchingAvailability) {
        return res.status(400).json({
          message: 'Requested slot does not match doctor availability.',
        })
      }

      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          hospitalDoctorId,
          scheduledStart: {
            lt: scheduledEnd,
          },
          scheduledEnd: {
            gt: scheduledStart,
          },
          status: {
            in: [AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED],
          },
          deletedAt: null,
        },
      })

      if (existingAppointment) {
        return res.status(409).json({
          message: 'This slot is already booked.',
        })
      }

      const appointment = await prisma.appointment.create({
        data: {
          patientId,
          hospitalId: hospitalDoctor.hospitalId,
          hospitalDoctorId: hospitalDoctor.id,
          doctorId: hospitalDoctor.doctorId,
          departmentId: hospitalDoctor.departmentId,
          locationId,
          appointmentType,
          scheduledDate,
          scheduledStart,
          scheduledEnd,
          status: AppointmentStatus.REQUESTED,
          reason,
        },
        include: appointmentInclude,
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'CREATE_PATIENT_APPOINTMENT',
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          metadata: {
            patientId,
            hospitalId: appointment.hospitalId,
            doctorId: appointment.doctorId,
            departmentId: appointment.departmentId,
            locationId: appointment.locationId,
            startTime,
            endTime,
            date,
          },
        },
      })

      const hospitalStaffUserIds = await getActiveHospitalStaffUserIds(
        appointment.hospitalId
      )

      if (hospitalStaffUserIds.length > 0) {
        await prisma.notification.createMany({
          data: hospitalStaffUserIds.map((userId) => ({
            recipientUserId: userId,
            type: NotificationType.APPOINTMENT_BOOKED,
            title: 'New appointment request',
            body: `${appointment.patient.fullName} booked an appointment with ${appointment.doctor.fullName}.`,
            entityType: 'APPOINTMENT',
            entityId: appointment.id,
            metadata: {
              appointmentId: appointment.id,
              patientId: appointment.patientId,
              hospitalId: appointment.hospitalId,
              doctorId: appointment.doctorId,
              departmentId: appointment.departmentId,
              locationId: appointment.locationId,
              appointmentType: appointment.appointmentType,
              scheduledStart: appointment.scheduledStart.toISOString(),
              scheduledEnd: appointment.scheduledEnd.toISOString(),
            },
          })),
        })
      }

      return res.status(201).json({
        message: 'Appointment requested successfully.',
        appointment,
      })
    } catch (error) {
      console.error('Create patient appointment error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientAppointmentsRouter.get(
  '/appointments',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const appointments = await prisma.appointment.findMany({
        where: {
          patientId,
          deletedAt: null,
        },
        include: appointmentInclude,
        orderBy: {
          scheduledStart: 'desc',
        },
      })

      return res.json({
        appointments,
      })
    } catch (error) {
      console.error('List patient appointments error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientAppointmentsRouter.get(
  '/appointments/:id',
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
          id: req.params.id,
          patientId,
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
      console.error('Get patient appointment error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientAppointmentsRouter.patch(
  '/appointments/:id/cancel',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
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
          patientId,
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
          action: 'CANCEL_PATIENT_APPOINTMENT',
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          metadata: {
            patientId,
            hospitalId: appointment.hospitalId,
            doctorId: appointment.doctorId,
            departmentId: appointment.departmentId,
            locationId: appointment.locationId,
            reason: parsed.data.cancellationReason,
          },
        },
      })

      const hospitalStaffUserIds = await getActiveHospitalStaffUserIds(
        appointment.hospitalId
      )

      if (hospitalStaffUserIds.length > 0) {
        await prisma.notification.createMany({
          data: hospitalStaffUserIds.map((userId) => ({
            recipientUserId: userId,
            type: NotificationType.APPOINTMENT_CANCELLED,
            title: 'Appointment cancelled',
            body: `${appointment.patient.fullName} cancelled an appointment with ${appointment.doctor.fullName}.`,
            entityType: 'APPOINTMENT',
            entityId: appointment.id,
            metadata: {
              appointmentId: appointment.id,
              patientId: appointment.patientId,
              hospitalId: appointment.hospitalId,
              doctorId: appointment.doctorId,
              departmentId: appointment.departmentId,
              locationId: appointment.locationId,
              cancellationReason: appointment.cancellationReason,
              scheduledStart: appointment.scheduledStart.toISOString(),
              scheduledEnd: appointment.scheduledEnd.toISOString(),
            },
          })),
        })
      }

      return res.json({
        message: 'Appointment cancelled successfully.',
        appointment,
      })
    } catch (error) {
      console.error('Cancel patient appointment error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)