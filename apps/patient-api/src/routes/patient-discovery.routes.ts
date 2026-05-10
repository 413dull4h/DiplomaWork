import { Router } from 'express'
import {
  prisma,
  AppointmentStatus,
  AvailabilityAppointmentType,
  DayOfWeek,
  HospitalStatus,
  ReviewStatus,
} from '@careos/database'
import {
  requirePatientAuth,
  type AuthenticatedPatientRequest,
} from '../middleware/require-patient-auth'

export const patientDiscoveryRouter = Router()

patientDiscoveryRouter.use(requirePatientAuth)

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

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function isValidDateString(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

function buildDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00.000Z`)
}

function roundRating(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return null
  }

  return Number(value.toFixed(1))
}

async function getHospitalRatingStats(hospitalId: string) {
  const stats = await prisma.hospitalReview.aggregate({
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
    _count: {
      _all: true,
    },
  })

  return {
    averageRating: roundRating(stats._avg.overallRating),
    reviewCount: stats._count._all,
    averageBreakdown: {
      staffRating: roundRating(stats._avg.staffRating),
      cleanlinessRating: roundRating(stats._avg.cleanlinessRating),
      waitingTimeRating: roundRating(stats._avg.waitingTimeRating),
      serviceRating: roundRating(stats._avg.serviceRating),
    },
  }
}

async function getDoctorRatingStats({
  hospitalId,
  doctorId,
  hospitalDoctorId,
}: {
  hospitalId: string
  doctorId: string
  hospitalDoctorId: string
}) {
  const [stats, wouldRecommendCount] = await Promise.all([
    prisma.doctorReview.aggregate({
      where: {
        hospitalId,
        doctorId,
        hospitalDoctorId,
        status: ReviewStatus.APPROVED,
        deletedAt: null,
      },
      _avg: {
        overallRating: true,
        communicationRating: true,
        professionalismRating: true,
        helpfulnessRating: true,
      },
      _count: {
        _all: true,
      },
    }),

    prisma.doctorReview.count({
      where: {
        hospitalId,
        doctorId,
        hospitalDoctorId,
        status: ReviewStatus.APPROVED,
        wouldRecommend: true,
        deletedAt: null,
      },
    }),
  ])

  return {
    averageRating: roundRating(stats._avg.overallRating),
    reviewCount: stats._count._all,
    wouldRecommendCount,
    averageBreakdown: {
      communicationRating: roundRating(stats._avg.communicationRating),
      professionalismRating: roundRating(stats._avg.professionalismRating),
      helpfulnessRating: roundRating(stats._avg.helpfulnessRating),
    },
  }
}

const hospitalLocationInclude = {
  address: true,
  departments: {
    where: {
      deletedAt: null,
    },
    orderBy: {
      name: 'asc' as const,
    },
  },
  doctors: {
    where: {
      isActive: true,
      doctor: {
        deletedAt: null,
      },
    },
    include: {
      doctor: true,
      department: true,
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
}

patientDiscoveryRouter.get('/hospitals', async (_req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      where: {
        status: HospitalStatus.APPROVED,
        deletedAt: null,
      },
      include: {
        address: true,
        locations: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: hospitalLocationInclude,
          orderBy: [
            {
              isMain: 'desc',
            },
            {
              name: 'asc',
            },
          ],
        },
        departments: {
          where: {
            deletedAt: null,
          },
          include: {
            location: {
              include: {
                address: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    const hospitalsWithRatings = await Promise.all(
      hospitals.map(async (hospital) => {
        const rating = await getHospitalRatingStats(hospital.id)

        return {
          ...hospital,
          averageRating: rating.averageRating,
          reviewCount: rating.reviewCount,
          rating,
        }
      })
    )

    return res.json({
      hospitals: hospitalsWithRatings,
    })
  } catch (error) {
    console.error('Patient list hospitals error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

patientDiscoveryRouter.get('/hospitals/:hospitalId/locations', async (req, res) => {
  try {
    const hospital = await prisma.hospital.findFirst({
      where: {
        id: req.params.hospitalId,
        status: HospitalStatus.APPROVED,
        deletedAt: null,
      },
      include: {
        address: true,
      },
    })

    if (!hospital) {
      return res.status(404).json({
        message: 'Hospital not found or not available.',
      })
    }

    const locations = await prisma.hospitalLocation.findMany({
      where: {
        hospitalId: hospital.id,
        deletedAt: null,
        isActive: true,
      },
      include: hospitalLocationInclude,
      orderBy: [
        {
          isMain: 'desc',
        },
        {
          name: 'asc',
        },
      ],
    })

    const rating = await getHospitalRatingStats(hospital.id)

    return res.json({
      hospital: {
        ...hospital,
        averageRating: rating.averageRating,
        reviewCount: rating.reviewCount,
        rating,
      },
      locations,
    })
  } catch (error) {
    console.error('Patient list hospital locations error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

patientDiscoveryRouter.get('/hospitals/:hospitalId/doctors', async (req, res) => {
  try {
    const hospital = await prisma.hospital.findFirst({
      where: {
        id: req.params.hospitalId,
        status: HospitalStatus.APPROVED,
        deletedAt: null,
      },
      include: {
        address: true,
        locations: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: hospitalLocationInclude,
          orderBy: [
            {
              isMain: 'desc',
            },
            {
              name: 'asc',
            },
          ],
        },
      },
    })

    if (!hospital) {
      return res.status(404).json({
        message: 'Hospital not found or not available.',
      })
    }

    const doctors = await prisma.hospitalDoctor.findMany({
      where: {
        hospitalId: hospital.id,
        isActive: true,
        doctor: {
          deletedAt: null,
        },
      },
      include: {
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
        availabilities: {
          where: {
            isActive: true,
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const hospitalRating = await getHospitalRatingStats(hospital.id)

    const doctorsWithRatings = await Promise.all(
      doctors.map(async (hospitalDoctor) => {
        const rating = await getDoctorRatingStats({
          hospitalId: hospitalDoctor.hospitalId,
          doctorId: hospitalDoctor.doctorId,
          hospitalDoctorId: hospitalDoctor.id,
        })

        const effectiveLocation =
          hospitalDoctor.location ?? hospitalDoctor.department?.location ?? null

        return {
          ...hospitalDoctor,
          effectiveLocation,
          averageRating: rating.averageRating,
          reviewCount: rating.reviewCount,
          wouldRecommendCount: rating.wouldRecommendCount,
          rating,
          doctor: {
            ...hospitalDoctor.doctor,
            averageRating: rating.averageRating,
            reviewCount: rating.reviewCount,
            wouldRecommendCount: rating.wouldRecommendCount,
            rating,
          },
        }
      })
    )

    return res.json({
      hospital: {
        ...hospital,
        averageRating: hospitalRating.averageRating,
        reviewCount: hospitalRating.reviewCount,
        rating: hospitalRating,
      },
      doctors: doctorsWithRatings,
    })
  } catch (error) {
    console.error('Patient list hospital doctors error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

patientDiscoveryRouter.get(
  '/doctors/:hospitalDoctorId/slots',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const date = String(req.query.date || '')
      const appointmentType = String(req.query.appointmentType || 'IN_PERSON')

      if (!isValidDateString(date)) {
        return res.status(400).json({
          message: 'Valid date query is required. Example: ?date=2026-05-11',
        })
      }

      if (!['IN_PERSON', 'TELECONSULT'].includes(appointmentType)) {
        return res.status(400).json({
          message: 'appointmentType must be IN_PERSON or TELECONSULT.',
        })
      }

      const targetDate = new Date(`${date}T00:00:00.000Z`)
      const dayOfWeek = dayMap[targetDate.getUTCDay()]

      const hospitalDoctor = await prisma.hospitalDoctor.findFirst({
        where: {
          id: req.params.hospitalDoctorId,
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

      const effectiveLocation =
        hospitalDoctor.location ?? hospitalDoctor.department?.location ?? null

      const effectiveLocationId =
        hospitalDoctor.locationId ?? hospitalDoctor.department?.locationId ?? null

      const availabilities = await prisma.doctorAvailability.findMany({
        where: {
          hospitalDoctorId: hospitalDoctor.id,
          dayOfWeek,
          isActive: true,
          deletedAt: null,
          appointmentType: {
            in:
              appointmentType === 'IN_PERSON'
                ? [
                    AvailabilityAppointmentType.IN_PERSON,
                    AvailabilityAppointmentType.BOTH,
                  ]
                : [
                    AvailabilityAppointmentType.TELECONSULT,
                    AvailabilityAppointmentType.BOTH,
                  ],
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      })

      const dayStart = new Date(`${date}T00:00:00.000Z`)
      const dayEnd = new Date(`${date}T23:59:59.999Z`)

      const bookedAppointments = await prisma.appointment.findMany({
        where: {
          hospitalDoctorId: hospitalDoctor.id,
          scheduledStart: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: {
            in: [AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED],
          },
          deletedAt: null,
        },
        select: {
          scheduledStart: true,
          scheduledEnd: true,
        },
      })

      const bookedSlotKeys = new Set(
        bookedAppointments.map((appointment) => {
          return `${appointment.scheduledStart.toISOString()}_${appointment.scheduledEnd.toISOString()}`
        })
      )

      const slots = availabilities.flatMap((availability) => {
        const startMinutes = timeToMinutes(availability.startTime)
        const endMinutes = timeToMinutes(availability.endTime)
        const duration = availability.slotDurationMinutes

        const generatedSlots = []

        for (
          let current = startMinutes;
          current + duration <= endMinutes;
          current += duration
        ) {
          const startTime = minutesToTime(current)
          const endTime = minutesToTime(current + duration)

          const slotStart = buildDateTime(date, startTime)
          const slotEnd = buildDateTime(date, endTime)

          const slotKey = `${slotStart.toISOString()}_${slotEnd.toISOString()}`

          if (bookedSlotKeys.has(slotKey)) {
            continue
          }

          generatedSlots.push({
            date,
            dayOfWeek,
            startTime,
            endTime,
            appointmentType,
            hospitalDoctorId: hospitalDoctor.id,
            doctorId: hospitalDoctor.doctorId,
            hospitalId: hospitalDoctor.hospitalId,
            departmentId: hospitalDoctor.departmentId,
            locationId: effectiveLocationId,
            location: effectiveLocation,
          })
        }

        return generatedSlots
      })

      const doctorRating = await getDoctorRatingStats({
        hospitalId: hospitalDoctor.hospitalId,
        doctorId: hospitalDoctor.doctorId,
        hospitalDoctorId: hospitalDoctor.id,
      })

      const hospitalRating = await getHospitalRatingStats(hospitalDoctor.hospitalId)

      return res.json({
        doctor: {
          hospitalDoctorId: hospitalDoctor.id,
          doctorId: hospitalDoctor.doctor.id,
          fullName: hospitalDoctor.doctor.fullName,
          specialization: hospitalDoctor.doctor.specialization,
          consultationFee: hospitalDoctor.doctor.consultationFee,
          location: effectiveLocation,
          locationId: effectiveLocationId,
          averageRating: doctorRating.averageRating,
          reviewCount: doctorRating.reviewCount,
          wouldRecommendCount: doctorRating.wouldRecommendCount,
          rating: doctorRating,
        },
        hospital: {
          id: hospitalDoctor.hospital.id,
          name: hospitalDoctor.hospital.name,
          averageRating: hospitalRating.averageRating,
          reviewCount: hospitalRating.reviewCount,
          rating: hospitalRating,
        },
        department: hospitalDoctor.department,
        location: effectiveLocation,
        locationId: effectiveLocationId,
        date,
        dayOfWeek,
        slots,
      })
    } catch (error) {
      console.error('Patient doctor slots error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)