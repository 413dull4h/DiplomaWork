import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalLocationsRouter = Router()

hospitalLocationsRouter.use(requireHospitalAuth)

const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required.'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required.'),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1, 'Country is required.'),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
})

const createLocationSchema = z.object({
  name: z.string().min(2, 'Location name is required.'),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isMain: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  address: addressSchema,
})

const updateLocationSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isMain: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  address: addressSchema.optional(),
})

hospitalLocationsRouter.get(
  '/locations',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const locations = await prisma.hospitalLocation.findMany({
        where: {
          hospitalId,
          deletedAt: null,
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
              createdAt: 'desc',
            },
          },
        },
        orderBy: [
          {
            isMain: 'desc',
          },
          {
            name: 'asc',
          },
        ],
      })

      return res.json({
        locations,
      })
    } catch (error) {
      console.error('List hospital locations error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalLocationsRouter.get(
  '/locations/:id',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const location = await prisma.hospitalLocation.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          deletedAt: null,
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
              createdAt: 'desc',
            },
          },
          appointments: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              scheduledStart: 'desc',
            },
            take: 20,
          },
        },
      })

      if (!location) {
        return res.status(404).json({
          message: 'Hospital location not found.',
        })
      }

      return res.json({
        location,
      })
    } catch (error) {
      console.error('Get hospital location error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalLocationsRouter.post(
  '/locations',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = createLocationSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid location data.',
          errors: parsed.error.flatten(),
        })
      }

      const result = await prisma.$transaction(async (tx) => {
        if (parsed.data.isMain) {
          await tx.hospitalLocation.updateMany({
            where: {
              hospitalId,
              deletedAt: null,
            },
            data: {
              isMain: false,
            },
          })
        }

        const address = await tx.address.create({
          data: parsed.data.address,
        })

        const location = await tx.hospitalLocation.create({
          data: {
            hospitalId,
            addressId: address.id,
            name: parsed.data.name,
            description: parsed.data.description,
            phone: parsed.data.phone,
            email: parsed.data.email,
            isMain: parsed.data.isMain ?? false,
            isActive: parsed.data.isActive ?? true,
          },
          include: {
            address: true,
            departments: true,
            doctors: {
              include: {
                doctor: true,
                department: true,
              },
            },
          },
        })

        return location
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'CREATE_HOSPITAL_LOCATION',
          entityType: 'HOSPITAL_LOCATION',
          entityId: result.id,
          metadata: {
            hospitalId,
            name: result.name,
            isMain: result.isMain,
            address: result.address,
          },
        },
      })

      return res.status(201).json({
        message: 'Hospital location created successfully.',
        location: result,
      })
    } catch (error) {
      console.error('Create hospital location error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalLocationsRouter.patch(
  '/locations/:id',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = updateLocationSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid location data.',
          errors: parsed.error.flatten(),
        })
      }

      const existing = await prisma.hospitalLocation.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          deletedAt: null,
        },
        include: {
          address: true,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Hospital location not found.',
        })
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (parsed.data.isMain) {
          await tx.hospitalLocation.updateMany({
            where: {
              hospitalId,
              deletedAt: null,
              id: {
                not: existing.id,
              },
            },
            data: {
              isMain: false,
            },
          })
        }

        let addressId = existing.addressId

        if (parsed.data.address) {
          if (existing.addressId) {
            await tx.address.update({
              where: {
                id: existing.addressId,
              },
              data: parsed.data.address,
            })
          } else {
            const address = await tx.address.create({
              data: parsed.data.address,
            })

            addressId = address.id
          }
        }

        const location = await tx.hospitalLocation.update({
          where: {
            id: existing.id,
          },
          data: {
            addressId,
            name: parsed.data.name,
            description: parsed.data.description,
            phone: parsed.data.phone,
            email: parsed.data.email,
            isMain: parsed.data.isMain,
            isActive: parsed.data.isActive,
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
            },
          },
        })

        return location
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'UPDATE_HOSPITAL_LOCATION',
          entityType: 'HOSPITAL_LOCATION',
          entityId: updated.id,
          metadata: {
            hospitalId,
            name: updated.name,
            isMain: updated.isMain,
            address: updated.address,
          },
        },
      })

      return res.json({
        message: 'Hospital location updated successfully.',
        location: updated,
      })
    } catch (error) {
      console.error('Update hospital location error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalLocationsRouter.delete(
  '/locations/:id',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const existing = await prisma.hospitalLocation.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Hospital location not found.',
        })
      }

      const [departmentsCount, doctorsCount, appointmentsCount] =
        await Promise.all([
          prisma.hospitalDepartment.count({
            where: {
              locationId: existing.id,
              deletedAt: null,
            },
          }),
          prisma.hospitalDoctor.count({
            where: {
              locationId: existing.id,
              isActive: true,
            },
          }),
          prisma.appointment.count({
            where: {
              locationId: existing.id,
              deletedAt: null,
            },
          }),
        ])

      if (departmentsCount || doctorsCount || appointmentsCount) {
        return res.status(400).json({
          message:
            'Cannot delete this location because it has departments, doctors, or appointments assigned.',
          usage: {
            departments: departmentsCount,
            doctors: doctorsCount,
            appointments: appointmentsCount,
          },
        })
      }

      const deleted = await prisma.hospitalLocation.update({
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
          action: 'DELETE_HOSPITAL_LOCATION',
          entityType: 'HOSPITAL_LOCATION',
          entityId: deleted.id,
          metadata: {
            hospitalId,
            name: deleted.name,
          },
        },
      })

      return res.json({
        message: 'Hospital location deleted successfully.',
      })
    } catch (error) {
      console.error('Delete hospital location error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)