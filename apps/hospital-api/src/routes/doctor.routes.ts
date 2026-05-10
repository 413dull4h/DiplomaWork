import fs from 'fs'
import path from 'path'
import { Router } from 'express'
import { z } from 'zod'
import { prisma, AppointmentStatus } from '@careos/database'
import { createImageUpload } from '../utils/upload'
import {
  requireDoctorAuth,
  type AuthenticatedDoctorRequest,
} from '../middleware/require-doctor-auth'

export const doctorRouter = Router()

doctorRouter.use(requireDoctorAuth)

const avatarUpload = createImageUpload('doctors')

const updateDoctorProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  specialization: z.string().optional(),
  yearsExperience: z.coerce.number().int().min(0).optional(),
  bio: z.string().optional(),
  consultationFee: z.coerce.number().min(0).optional(),
})

const encounterSchema = z.object({
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
  prescription: z.string().optional(),
  followUpInstructions: z.string().optional(),
})

const doctorAppointmentInclude = {
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

function deleteLocalDoctorAvatar(profileImageUrl?: string | null) {
  if (!profileImageUrl) {
    return
  }

  if (!profileImageUrl.startsWith('/uploads/doctors/')) {
    return
  }

  const filename = path.basename(profileImageUrl)
  const filePath = path.join(process.cwd(), 'uploads', 'doctors', filename)

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

doctorRouter.get('/dashboard', async (req: AuthenticatedDoctorRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId
    const hospitalDoctorId = req.user?.hospitalDoctorId

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [
      todayAppointments,
      requestedCount,
      confirmedCount,
      completedCount,
      upcomingAppointments,
    ] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          hospitalId,
          hospitalDoctorId,
          scheduledStart: {
            gte: todayStart,
            lte: todayEnd,
          },
          deletedAt: null,
        },
        include: doctorAppointmentInclude,
        orderBy: {
          scheduledStart: 'asc',
        },
      }),

      prisma.appointment.count({
        where: {
          hospitalId,
          hospitalDoctorId,
          status: AppointmentStatus.REQUESTED,
          deletedAt: null,
        },
      }),

      prisma.appointment.count({
        where: {
          hospitalId,
          hospitalDoctorId,
          status: AppointmentStatus.CONFIRMED,
          deletedAt: null,
        },
      }),

      prisma.appointment.count({
        where: {
          hospitalId,
          hospitalDoctorId,
          status: AppointmentStatus.COMPLETED,
          deletedAt: null,
        },
      }),

      prisma.appointment.findMany({
        where: {
          hospitalId,
          hospitalDoctorId,
          scheduledStart: {
            gte: new Date(),
          },
          status: {
            in: [AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED],
          },
          deletedAt: null,
        },
        include: doctorAppointmentInclude,
        orderBy: {
          scheduledStart: 'asc',
        },
        take: 8,
      }),
    ])

    return res.json({
      summary: {
        requested: requestedCount,
        confirmed: confirmedCount,
        completed: completedCount,
        today: todayAppointments.length,
      },
      todayAppointments,
      upcomingAppointments,
    })
  } catch (error) {
    console.error('Doctor dashboard error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

doctorRouter.get('/appointments', async (req: AuthenticatedDoctorRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId
    const hospitalDoctorId = req.user?.hospitalDoctorId

    const status = req.query.status ? String(req.query.status) : undefined
    const from = req.query.from ? new Date(String(req.query.from)) : undefined
    const to = req.query.to ? new Date(String(req.query.to)) : undefined

    const appointments = await prisma.appointment.findMany({
      where: {
        hospitalId,
        hospitalDoctorId,
        status: status as AppointmentStatus | undefined,
        scheduledStart:
          from || to
            ? {
                gte: from,
                lte: to,
              }
            : undefined,
        deletedAt: null,
      },
      include: doctorAppointmentInclude,
      orderBy: {
        scheduledStart: 'asc',
      },
    })

    return res.json({
      appointments,
    })
  } catch (error) {
    console.error('Doctor appointments error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

doctorRouter.get('/appointments/:id', async (req: AuthenticatedDoctorRequest, res) => {
  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: req.params.id,
        hospitalId: req.user?.hospitalId,
        hospitalDoctorId: req.user?.hospitalDoctorId,
        doctorId: req.user?.doctorId,
        deletedAt: null,
      },
      include: doctorAppointmentInclude,
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
    console.error('Doctor appointment detail error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

doctorRouter.post(
  '/appointments/:appointmentId/encounter',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const parsed = encounterSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid encounter data.',
          errors: parsed.error.flatten(),
        })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: req.params.appointmentId,
          hospitalId: req.user?.hospitalId,
          hospitalDoctorId: req.user?.hospitalDoctorId,
          doctorId: req.user?.doctorId,
          deletedAt: null,
        },
        include: {
          encounter: true,
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
          teleconsultSession: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found.',
        })
      }

      if (appointment.encounter) {
        return res.status(409).json({
          message: 'Encounter already exists for this appointment.',
        })
      }

      if (appointment.status !== AppointmentStatus.CONFIRMED) {
        return res.status(400).json({
          message: `Only CONFIRMED appointments can create an encounter. Current status: ${appointment.status}`,
        })
      }

      const encounter = await prisma.$transaction(async (tx) => {
        const created = await tx.encounter.create({
          data: {
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            hospitalId: appointment.hospitalId,
            hospitalDoctorId: appointment.hospitalDoctorId,
            doctorId: appointment.doctorId,
            departmentId: appointment.departmentId,
            chiefComplaint: parsed.data.chiefComplaint,
            notes: parsed.data.notes,
            diagnosis: parsed.data.diagnosis,
            prescription: parsed.data.prescription,
            followUpInstructions: parsed.data.followUpInstructions,
          },
          include: {
            appointment: {
              include: {
                location: {
                  include: {
                    address: true,
                  },
                },
              },
            },
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
          },
        })

        await tx.appointment.update({
          where: {
            id: appointment.id,
          },
          data: {
            status: AppointmentStatus.COMPLETED,
          },
        })

        return created
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'CREATE_DOCTOR_ENCOUNTER',
          entityType: 'ENCOUNTER',
          entityId: encounter.id,
          metadata: {
            hospitalId: req.user?.hospitalId,
            doctorId: req.user?.doctorId,
            hospitalDoctorId: req.user?.hospitalDoctorId,
            appointmentId: appointment.id,
            patientId: appointment.patientId,
          },
        },
      })

      return res.status(201).json({
        message: 'Encounter created successfully.',
        encounter,
      })
    } catch (error) {
      console.error('Doctor create encounter error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorRouter.get('/patients/:patientId/records', async (req: AuthenticatedDoctorRequest, res) => {
  try {
    const hasAccess = await prisma.appointment.findFirst({
      where: {
        patientId: req.params.patientId,
        hospitalId: req.user?.hospitalId,
        hospitalDoctorId: req.user?.hospitalDoctorId,
        doctorId: req.user?.doctorId,
        deletedAt: null,
      },
    })

    if (!hasAccess) {
      return res.status(403).json({
        message: 'You do not have access to this patient record.',
      })
    }

    const encounters = await prisma.encounter.findMany({
      where: {
        patientId: req.params.patientId,
        hospitalId: req.user?.hospitalId,
        hospitalDoctorId: req.user?.hospitalDoctorId,
        doctorId: req.user?.doctorId,
        deletedAt: null,
      },
      include: {
        appointment: {
          include: {
            teleconsultSession: true,
            location: {
              include: {
                address: true,
              },
            },
          },
        },
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.json({
      encounters,
    })
  } catch (error) {
    console.error('Doctor patient records error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

doctorRouter.get('/profile', async (req: AuthenticatedDoctorRequest, res) => {
  try {
    const hospitalDoctor = await prisma.hospitalDoctor.findFirst({
      where: {
        id: req.user?.hospitalDoctorId,
        hospitalId: req.user?.hospitalId,
        doctorId: req.user?.doctorId,
        isActive: true,
      },
      include: {
        doctor: true,
        hospital: true,
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
    })

    if (!hospitalDoctor) {
      return res.status(404).json({
        message: 'Doctor profile not found.',
      })
    }

    return res.json({
      hospitalDoctor,
      doctor: hospitalDoctor.doctor,
      hospital: hospitalDoctor.hospital,
      department: hospitalDoctor.department,
      location: hospitalDoctor.location,
      availabilities: hospitalDoctor.availabilities,
    })
  } catch (error) {
    console.error('Doctor profile error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

doctorRouter.patch('/profile', async (req: AuthenticatedDoctorRequest, res) => {
  try {
    const parsed = updateDoctorProfileSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid profile data.',
        errors: parsed.error.flatten(),
      })
    }

    const doctorId = req.user?.doctorId

    if (!doctorId) {
      return res.status(403).json({
        message: 'No doctor assigned.',
      })
    }

    const doctor = await prisma.doctor.update({
      where: {
        id: doctorId,
      },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'UPDATE_DOCTOR_PROFILE',
        entityType: 'DOCTOR',
        entityId: doctor.id,
        metadata: {
          hospitalId: req.user?.hospitalId,
          hospitalDoctorId: req.user?.hospitalDoctorId,
        },
      },
    })

    return res.json({
      message: 'Doctor profile updated successfully.',
      doctor,
    })
  } catch (error) {
    console.error('Update doctor profile error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

doctorRouter.post(
  '/profile/avatar',
  avatarUpload.single('avatar'),
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const doctorId = req.user?.doctorId

      if (!doctorId) {
        return res.status(403).json({
          message: 'No doctor assigned.',
        })
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'Avatar image is required.',
        })
      }

      const existingDoctor = await prisma.doctor.findUnique({
        where: {
          id: doctorId,
        },
      })

      if (!existingDoctor) {
        return res.status(404).json({
          message: 'Doctor not found.',
        })
      }

      deleteLocalDoctorAvatar(existingDoctor.profileImageUrl)

      const profileImageUrl = `/uploads/doctors/${req.file.filename}`

      const doctor = await prisma.doctor.update({
        where: {
          id: doctorId,
        },
        data: {
          profileImageUrl,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'UPDATE_DOCTOR_AVATAR',
          entityType: 'DOCTOR',
          entityId: doctor.id,
          metadata: {
            hospitalId: req.user?.hospitalId,
            hospitalDoctorId: req.user?.hospitalDoctorId,
            profileImageUrl,
          },
        },
      })

      return res.json({
        message: 'Doctor profile picture uploaded successfully.',
        profileImageUrl,
        doctor,
      })
    } catch (error) {
      console.error('Upload doctor avatar error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorRouter.delete(
  '/profile/avatar',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const doctorId = req.user?.doctorId

      if (!doctorId) {
        return res.status(403).json({
          message: 'No doctor assigned.',
        })
      }

      const existingDoctor = await prisma.doctor.findUnique({
        where: {
          id: doctorId,
        },
      })

      if (!existingDoctor) {
        return res.status(404).json({
          message: 'Doctor not found.',
        })
      }

      deleteLocalDoctorAvatar(existingDoctor.profileImageUrl)

      const doctor = await prisma.doctor.update({
        where: {
          id: doctorId,
        },
        data: {
          profileImageUrl: null,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'DELETE_DOCTOR_AVATAR',
          entityType: 'DOCTOR',
          entityId: doctor.id,
          metadata: {
            hospitalId: req.user?.hospitalId,
            hospitalDoctorId: req.user?.hospitalDoctorId,
          },
        },
      })

      return res.json({
        message: 'Doctor profile picture removed successfully.',
        doctor,
      })
    } catch (error) {
      console.error('Delete doctor avatar error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)