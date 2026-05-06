import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalRouter = Router()

hospitalRouter.use(requireHospitalAuth)

const updateHospitalProfileSchema = z.object({
  name: z.string().min(2).optional(),
  legalName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  licenseNumber: z.string().optional(),
  timeZone: z.string().optional(),
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

const departmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
})

hospitalRouter.get('/profile', async (req: AuthenticatedHospitalRequest, res) => {
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
          orderBy: {
            name: 'asc',
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
})

hospitalRouter.patch('/profile', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({
        message: 'No hospital assigned.',
      })
    }

    const parsed = updateHospitalProfileSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid hospital profile data.',
        errors: parsed.error.flatten(),
      })
    }

    const existingHospital = await prisma.hospital.findUnique({
      where: {
        id: hospitalId,
      },
      include: {
        address: true,
      },
    })

    if (!existingHospital) {
      return res.status(404).json({
        message: 'Hospital not found.',
      })
    }

    const { address, ...profileData } = parsed.data

    let addressId = existingHospital.addressId

    if (address) {
      if (existingHospital.addressId) {
        await prisma.address.update({
          where: {
            id: existingHospital.addressId,
          },
          data: address,
        })
      } else {
        const newAddress = await prisma.address.create({
          data: address,
        })

        addressId = newAddress.id
      }
    }

    const hospital = await prisma.hospital.update({
      where: {
        id: hospitalId,
      },
      data: {
        ...profileData,
        addressId,
      },
      include: {
        address: true,
        departments: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'UPDATE_HOSPITAL_PROFILE',
        entityType: 'HOSPITAL',
        entityId: hospital.id,
        metadata: {
          hospitalName: hospital.name,
        },
      },
    })

    return res.json({
      message: 'Hospital profile updated successfully.',
      hospital,
    })
  } catch (error) {
    console.error('Update hospital profile error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

hospitalRouter.get('/departments', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({
        message: 'No hospital assigned.',
      })
    }

    const departments = await prisma.hospitalDepartment.findMany({
      where: {
        hospitalId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return res.json({
      departments,
    })
  } catch (error) {
    console.error('List departments error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

hospitalRouter.post('/departments', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({
        message: 'No hospital assigned.',
      })
    }

    const parsed = departmentSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid department data.',
        errors: parsed.error.flatten(),
      })
    }

    const department = await prisma.hospitalDepartment.create({
      data: {
        hospitalId,
        name: parsed.data.name,
        description: parsed.data.description,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_HOSPITAL_DEPARTMENT',
        entityType: 'HOSPITAL_DEPARTMENT',
        entityId: department.id,
        metadata: {
          hospitalId,
          departmentName: department.name,
        },
      },
    })

    return res.status(201).json({
      message: 'Department created successfully.',
      department,
    })
  } catch (error: any) {
    console.error('Create department error:', error)

    if (error?.code === 'P2002') {
      return res.status(409).json({
        message: 'Department with this name already exists in this hospital.',
      })
    }

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

hospitalRouter.patch('/departments/:id', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({
        message: 'No hospital assigned.',
      })
    }

    const parsed = departmentSchema.partial().safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid department data.',
        errors: parsed.error.flatten(),
      })
    }

    const existingDepartment = await prisma.hospitalDepartment.findFirst({
      where: {
        id: req.params.id,
        hospitalId,
        deletedAt: null,
      },
    })

    if (!existingDepartment) {
      return res.status(404).json({
        message: 'Department not found.',
      })
    }

    const department = await prisma.hospitalDepartment.update({
      where: {
        id: existingDepartment.id,
      },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'UPDATE_HOSPITAL_DEPARTMENT',
        entityType: 'HOSPITAL_DEPARTMENT',
        entityId: department.id,
        metadata: {
          hospitalId,
          departmentName: department.name,
        },
      },
    })

    return res.json({
      message: 'Department updated successfully.',
      department,
    })
  } catch (error: any) {
    console.error('Update department error:', error)

    if (error?.code === 'P2002') {
      return res.status(409).json({
        message: 'Department with this name already exists in this hospital.',
      })
    }

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

hospitalRouter.delete('/departments/:id', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({
        message: 'No hospital assigned.',
      })
    }

    const existingDepartment = await prisma.hospitalDepartment.findFirst({
      where: {
        id: req.params.id,
        hospitalId,
        deletedAt: null,
      },
    })

    if (!existingDepartment) {
      return res.status(404).json({
        message: 'Department not found.',
      })
    }

    const department = await prisma.hospitalDepartment.update({
      where: {
        id: existingDepartment.id,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'DELETE_HOSPITAL_DEPARTMENT',
        entityType: 'HOSPITAL_DEPARTMENT',
        entityId: department.id,
        metadata: {
          hospitalId,
          departmentName: department.name,
        },
      },
    })

    return res.json({
      message: 'Department deleted successfully.',
      department,
    })
  } catch (error) {
    console.error('Delete department error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})