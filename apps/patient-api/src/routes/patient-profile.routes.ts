import fs from 'fs'
import path from 'path'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@careos/database'
import { createImageUpload } from '../utils/upload'
import {
  requirePatientAuth,
  type AuthenticatedPatientRequest,
} from '../middleware/require-patient-auth'

export const patientProfileRouter = Router()

patientProfileRouter.use(requirePatientAuth)

const avatarUpload = createImageUpload('patients')

const updatePatientProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  address: z
    .object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().min(1),
    })
    .optional(),
})

function deleteLocalPatientAvatar(profileImageUrl?: string | null) {
  if (!profileImageUrl) {
    return
  }

  if (!profileImageUrl.startsWith('/uploads/patients/')) {
    return
  }

  const filename = path.basename(profileImageUrl)
  const filePath = path.join(process.cwd(), 'uploads', 'patients', filename)

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

patientProfileRouter.get(
  '/profile',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const patient = await prisma.patient.findUnique({
        where: {
          id: patientId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              status: true,
              primaryRole: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
          primaryAddress: true,
        },
      })

      if (!patient) {
        return res.status(404).json({
          message: 'Patient not found.',
        })
      }

      return res.json({
        patient,
      })
    } catch (error) {
      console.error('Get patient profile error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientProfileRouter.patch(
  '/profile',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const parsed = updatePatientProfileSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid patient profile data.',
          errors: parsed.error.flatten(),
        })
      }

      const existingPatient = await prisma.patient.findUnique({
        where: {
          id: patientId,
        },
        include: {
          primaryAddress: true,
        },
      })

      if (!existingPatient) {
        return res.status(404).json({
          message: 'Patient not found.',
        })
      }

      const { address, dateOfBirth, ...profileData } = parsed.data

      let primaryAddressId = existingPatient.primaryAddressId

      if (address) {
        if (existingPatient.primaryAddressId) {
          await prisma.address.update({
            where: {
              id: existingPatient.primaryAddressId,
            },
            data: address,
          })
        } else {
          const newAddress = await prisma.address.create({
            data: address,
          })

          primaryAddressId = newAddress.id
        }
      }

      const patient = await prisma.patient.update({
        where: {
          id: patientId,
        },
        data: {
          ...profileData,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          primaryAddressId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              status: true,
              primaryRole: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
          primaryAddress: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'UPDATE_PATIENT_PROFILE',
          entityType: 'PATIENT',
          entityId: patient.id,
          metadata: {
            fullName: patient.fullName,
          },
        },
      })

      return res.json({
        message: 'Patient profile updated successfully.',
        patient,
      })
    } catch (error) {
      console.error('Update patient profile error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientProfileRouter.post(
  '/profile/avatar',
  avatarUpload.single('avatar'),
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'Avatar image is required.',
        })
      }

      const existingPatient = await prisma.patient.findUnique({
        where: {
          id: patientId,
        },
      })

      if (!existingPatient) {
        return res.status(404).json({
          message: 'Patient not found.',
        })
      }

      deleteLocalPatientAvatar(existingPatient.profileImageUrl)

      const profileImageUrl = `/uploads/patients/${req.file.filename}`

      const patient = await prisma.patient.update({
        where: {
          id: patientId,
        },
        data: {
          profileImageUrl,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              status: true,
              primaryRole: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
          primaryAddress: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'UPDATE_PATIENT_AVATAR',
          entityType: 'PATIENT',
          entityId: patient.id,
          metadata: {
            profileImageUrl,
          },
        },
      })

      return res.json({
        message: 'Profile picture uploaded successfully.',
        profileImageUrl,
        patient,
      })
    } catch (error) {
      console.error('Upload patient avatar error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientProfileRouter.delete(
  '/profile/avatar',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const existingPatient = await prisma.patient.findUnique({
        where: {
          id: patientId,
        },
      })

      if (!existingPatient) {
        return res.status(404).json({
          message: 'Patient not found.',
        })
      }

      deleteLocalPatientAvatar(existingPatient.profileImageUrl)

      const patient = await prisma.patient.update({
        where: {
          id: patientId,
        },
        data: {
          profileImageUrl: null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              status: true,
              primaryRole: true,
              lastLoginAt: true,
              createdAt: true,
            },
          },
          primaryAddress: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'DELETE_PATIENT_AVATAR',
          entityType: 'PATIENT',
          entityId: patient.id,
          metadata: {},
        },
      })

      return res.json({
        message: 'Profile picture removed successfully.',
        patient,
      })
    } catch (error) {
      console.error('Delete patient avatar error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)