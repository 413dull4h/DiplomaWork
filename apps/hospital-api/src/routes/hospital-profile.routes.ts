import fs from 'fs'
import path from 'path'
import { Router } from 'express'
import { prisma } from '@careos/database'
import { createImageUpload } from '../utils/upload'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalProfileRouter = Router()

hospitalProfileRouter.use(requireHospitalAuth)

const logoUpload = createImageUpload('hospitals')

function deleteLocalHospitalLogo(logoUrl?: string | null) {
  if (!logoUrl) {
    return
  }

  if (!logoUrl.startsWith('/uploads/hospitals/')) {
    return
  }

  const filename = path.basename(logoUrl)
  const filePath = path.join(process.cwd(), 'uploads', 'hospitals', filename)

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

hospitalProfileRouter.get(
  '/profile',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const hospital = await prisma.hospital.findUnique({
        where: {
          id: hospitalId,
        },
        include: {
          address: true,
          departments: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              name: 'asc',
            },
          },
          staff: {
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
            },
          },
        },
      })

      if (!hospital) {
        return res.status(404).json({
          message: 'Hospital not found.',
        })
      }

      return res.json({
        hospital,
      })
    } catch (error) {
      console.error('Get hospital profile error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalProfileRouter.post(
  '/profile/logo',
  logoUpload.single('logo'),
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'Logo image is required.',
        })
      }

      const existingHospital = await prisma.hospital.findUnique({
        where: {
          id: hospitalId,
        },
      })

      if (!existingHospital) {
        return res.status(404).json({
          message: 'Hospital not found.',
        })
      }

      deleteLocalHospitalLogo(existingHospital.logoUrl)

      const logoUrl = `/uploads/hospitals/${req.file.filename}`

      const hospital = await prisma.hospital.update({
        where: {
          id: hospitalId,
        },
        data: {
          logoUrl,
        },
        include: {
          address: true,
          departments: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              name: 'asc',
            },
          },
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'UPDATE_HOSPITAL_LOGO',
          entityType: 'HOSPITAL',
          entityId: hospital.id,
          metadata: {
            logoUrl,
          },
        },
      })

      return res.json({
        message: 'Hospital logo uploaded successfully.',
        logoUrl,
        hospital,
      })
    } catch (error) {
      console.error('Upload hospital logo error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalProfileRouter.delete(
  '/profile/logo',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const existingHospital = await prisma.hospital.findUnique({
        where: {
          id: hospitalId,
        },
      })

      if (!existingHospital) {
        return res.status(404).json({
          message: 'Hospital not found.',
        })
      }

      deleteLocalHospitalLogo(existingHospital.logoUrl)

      const hospital = await prisma.hospital.update({
        where: {
          id: hospitalId,
        },
        data: {
          logoUrl: null,
        },
        include: {
          address: true,
          departments: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              name: 'asc',
            },
          },
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'DELETE_HOSPITAL_LOGO',
          entityType: 'HOSPITAL',
          entityId: hospital.id,
          metadata: {},
        },
      })

      return res.json({
        message: 'Hospital logo removed successfully.',
        hospital,
      })
    } catch (error) {
      console.error('Delete hospital logo error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)