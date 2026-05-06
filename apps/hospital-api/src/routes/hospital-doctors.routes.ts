import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalDoctorsRouter = Router()

hospitalDoctorsRouter.use(requireHospitalAuth)

const createDoctorSchema = z.object({
  fullName: z.string().min(2),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  bio: z.string().optional(),
  consultationFee: z.number().min(0).optional(),
  departmentId: z.string().uuid().optional(),
})

const updateDoctorSchema = createDoctorSchema.partial()

hospitalDoctorsRouter.get('/', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({
        message: 'No hospital assigned.',
      })
    }

    const doctors = await prisma.hospitalDoctor.findMany({
      where: {
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.json({
      doctors,
    })
  } catch (error) {
    console.error('List hospital doctors error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

hospitalDoctorsRouter.post('/', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({
        message: 'No hospital assigned.',
      })
    }

    const parsed = createDoctorSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid doctor data.',
        errors: parsed.error.flatten(),
      })
    }

    const {
      fullName,
      specialization,
      licenseNumber,
      yearsExperience,
      bio,
      consultationFee,
      departmentId,
    } = parsed.data

    if (departmentId) {
      const department = await prisma.hospitalDepartment.findFirst({
        where: {
          id: departmentId,
          hospitalId,
          deletedAt: null,
        },
      })

      if (!department) {
        return res.status(400).json({
          message: 'Invalid department for this hospital.',
        })
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const doctor = await tx.doctor.create({
        data: {
          fullName,
          specialization,
          licenseNumber,
          yearsExperience,
          bio,
          consultationFee,
        },
      })

      const hospitalDoctor = await tx.hospitalDoctor.create({
        data: {
          hospitalId,
          doctorId: doctor.id,
          departmentId,
          isActive: true,
        },
        include: {
          doctor: true,
          department: true,
        },
      })

      return hospitalDoctor
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_HOSPITAL_DOCTOR',
        entityType: 'DOCTOR',
        entityId: result.doctor.id,
        metadata: {
          hospitalId,
          doctorName: result.doctor.fullName,
          departmentId,
        },
      },
    })

    return res.status(201).json({
      message: 'Doctor created successfully.',
      doctor: result,
    })
  } catch (error) {
    console.error('Create hospital doctor error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

hospitalDoctorsRouter.get('/:id', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({
        message: 'No hospital assigned.',
      })
    }

    const doctor = await prisma.hospitalDoctor.findFirst({
      where: {
        id: req.params.id,
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

    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor not found.',
      })
    }

    return res.json({
      doctor,
    })
  } catch (error) {
    console.error('Get hospital doctor error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

hospitalDoctorsRouter.patch('/:id', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({
        message: 'No hospital assigned.',
      })
    }

    const parsed = updateDoctorSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid doctor data.',
        errors: parsed.error.flatten(),
      })
    }

    const existing = await prisma.hospitalDoctor.findFirst({
      where: {
        id: req.params.id,
        hospitalId,
        isActive: true,
        doctor: {
          deletedAt: null,
        },
      },
      include: {
        doctor: true,
      },
    })

    if (!existing) {
      return res.status(404).json({
        message: 'Doctor not found.',
      })
    }

    const { departmentId, ...doctorData } = parsed.data

    if (departmentId) {
      const department = await prisma.hospitalDepartment.findFirst({
        where: {
          id: departmentId,
          hospitalId,
          deletedAt: null,
        },
      })

      if (!department) {
        return res.status(400).json({
          message: 'Invalid department for this hospital.',
        })
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.doctor.update({
        where: {
          id: existing.doctorId,
        },
        data: doctorData,
      })

      const hospitalDoctor = await tx.hospitalDoctor.update({
        where: {
          id: existing.id,
        },
        data: {
          departmentId,
        },
        include: {
          doctor: true,
          department: true,
        },
      })

      return hospitalDoctor
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'UPDATE_HOSPITAL_DOCTOR',
        entityType: 'DOCTOR',
        entityId: result.doctor.id,
        metadata: {
          hospitalId,
          doctorName: result.doctor.fullName,
        },
      },
    })

    return res.json({
      message: 'Doctor updated successfully.',
      doctor: result,
    })
  } catch (error) {
    console.error('Update hospital doctor error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

hospitalDoctorsRouter.delete('/:id', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({
        message: 'No hospital assigned.',
      })
    }

    const existing = await prisma.hospitalDoctor.findFirst({
      where: {
        id: req.params.id,
        hospitalId,
        isActive: true,
      },
      include: {
        doctor: true,
      },
    })

    if (!existing) {
      return res.status(404).json({
        message: 'Doctor not found.',
      })
    }

    const result = await prisma.$transaction(async (tx) => {
      const hospitalDoctor = await tx.hospitalDoctor.update({
        where: {
          id: existing.id,
        },
        data: {
          isActive: false,
        },
        include: {
          doctor: true,
          department: true,
        },
      })

      await tx.doctor.update({
        where: {
          id: existing.doctorId,
        },
        data: {
          deletedAt: new Date(),
        },
      })

      return hospitalDoctor
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'DELETE_HOSPITAL_DOCTOR',
        entityType: 'DOCTOR',
        entityId: result.doctor.id,
        metadata: {
          hospitalId,
          doctorName: result.doctor.fullName,
        },
      },
    })

    return res.json({
      message: 'Doctor deleted successfully.',
      doctor: result,
    })
  } catch (error) {
    console.error('Delete hospital doctor error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})