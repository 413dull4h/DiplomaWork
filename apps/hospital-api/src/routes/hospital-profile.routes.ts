import fs from 'fs'
import path from 'path'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@careos/database'
import { createImageUpload } from '../utils/upload'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalProfileRouter = Router()

hospitalProfileRouter.use(requireHospitalAuth)

const logoUpload = createImageUpload('hospitals')

const updateHospitalLocationSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required.'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required.'),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1, 'Country is required.'),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
})

const assignDepartmentLocationSchema = z.object({
  locationId: z.string().uuid().nullable(),
})

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

hospitalProfileRouter.patch(
  '/profile/location',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = updateHospitalLocationSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid location data.',
          errors: parsed.error.flatten(),
        })
      }

      const hospital = await prisma.hospital.findFirst({
        where: {
          id: hospitalId,
          deletedAt: null,
        },
        include: {
          address: true,
        },
      })

      if (!hospital) {
        return res.status(404).json({
          message: 'Hospital not found.',
        })
      }

      const addressData = {
        line1: parsed.data.line1,
        line2: parsed.data.line2,
        city: parsed.data.city,
        state: parsed.data.state,
        postalCode: parsed.data.postalCode,
        country: parsed.data.country,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
      }

      const updatedHospital = await prisma.hospital.update({
        where: {
          id: hospital.id,
        },
        data: {
          address: hospital.addressId
            ? {
                update: addressData,
              }
            : {
                create: addressData,
              },
        },
        include: {
          address: true,
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

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'UPDATE_HOSPITAL_LOCATION',
          entityType: 'HOSPITAL',
          entityId: hospital.id,
          metadata: {
            hospitalId: hospital.id,
            address: updatedHospital.address,
          },
        },
      })

      return res.json({
        message: 'Hospital location updated successfully.',
        hospital: updatedHospital,
      })
    } catch (error) {
      console.error('Update hospital location error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalProfileRouter.patch(
  '/departments/:departmentId/location',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = assignDepartmentLocationSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid department location data.',
          errors: parsed.error.flatten(),
        })
      }

      const department = await prisma.hospitalDepartment.findFirst({
        where: {
          id: req.params.departmentId,
          hospitalId,
          deletedAt: null,
        },
      })

      if (!department) {
        return res.status(404).json({
          message: 'Department not found.',
        })
      }

      if (parsed.data.locationId) {
        const location = await prisma.hospitalLocation.findFirst({
          where: {
            id: parsed.data.locationId,
            hospitalId,
            deletedAt: null,
            isActive: true,
          },
        })

        if (!location) {
          return res.status(404).json({
            message: 'Hospital location not found.',
          })
        }
      }

      const updatedDepartment = await prisma.hospitalDepartment.update({
        where: {
          id: department.id,
        },
        data: {
          locationId: parsed.data.locationId,
        },
        include: {
          location: {
            include: {
              address: true,
            },
          },
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'ASSIGN_DEPARTMENT_LOCATION',
          entityType: 'HOSPITAL_DEPARTMENT',
          entityId: updatedDepartment.id,
          metadata: {
            hospitalId,
            departmentId: updatedDepartment.id,
            departmentName: updatedDepartment.name,
            locationId: updatedDepartment.locationId,
          },
        },
      })

      return res.json({
        message: 'Department location updated successfully.',
        department: updatedDepartment,
      })
    } catch (error) {
      console.error('Assign department location error:', error)

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