import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import {
  prisma,
  HospitalStatus,
  OrgStaffRole,
  RoleName,
  UserStatus,
} from '@careos/database'
import {
  requireAdminAuth,
  type AuthenticatedAdminRequest,
} from '../middleware/require-admin-auth'

export const adminHospitalsRouter = Router()

adminHospitalsRouter.use(requireAdminAuth)

const createHospitalSchema = z.object({
  name: z.string().min(2),
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

const createHospitalAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
})

adminHospitalsRouter.get('/', async (_req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        address: true,
        departments: true,
        staff: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                status: true,
                primaryRole: true,
              },
            },
          },
        },
      },
    })

    return res.json({
      hospitals,
    })
  } catch (error) {
    console.error('List hospitals error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminHospitalsRouter.post('/', async (req: AuthenticatedAdminRequest, res) => {
  try {
    const parsed = createHospitalSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid hospital data.',
        errors: parsed.error.flatten(),
      })
    }

    const { address, ...hospitalData } = parsed.data

    const hospital = await prisma.hospital.create({
      data: {
        ...hospitalData,
        status: HospitalStatus.PENDING,
        address: address
          ? {
              create: address,
            }
          : undefined,
      },
      include: {
        address: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_HOSPITAL',
        entityType: 'HOSPITAL',
        entityId: hospital.id,
        metadata: {
          name: hospital.name,
          status: hospital.status,
        },
      },
    })

    return res.status(201).json({
      message: 'Hospital created successfully.',
      hospital,
    })
  } catch (error) {
    console.error('Create hospital error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminHospitalsRouter.get('/:id', async (req, res) => {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        address: true,
        departments: true,
        staff: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                status: true,
                primaryRole: true,
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
    console.error('Get hospital error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminHospitalsRouter.patch('/:id/approve', async (req: AuthenticatedAdminRequest, res) => {
  try {
    const hospital = await prisma.hospital.update({
      where: {
        id: req.params.id,
      },
      data: {
        status: HospitalStatus.APPROVED,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'APPROVE_HOSPITAL',
        entityType: 'HOSPITAL',
        entityId: hospital.id,
      },
    })

    return res.json({
      message: 'Hospital approved successfully.',
      hospital,
    })
  } catch (error) {
    console.error('Approve hospital error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminHospitalsRouter.patch('/:id/suspend', async (req: AuthenticatedAdminRequest, res) => {
  try {
    const hospital = await prisma.hospital.update({
      where: {
        id: req.params.id,
      },
      data: {
        status: HospitalStatus.SUSPENDED,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'SUSPEND_HOSPITAL',
        entityType: 'HOSPITAL',
        entityId: hospital.id,
      },
    })

    return res.json({
      message: 'Hospital suspended successfully.',
      hospital,
    })
  } catch (error) {
    console.error('Suspend hospital error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminHospitalsRouter.patch('/:id/reject', async (req: AuthenticatedAdminRequest, res) => {
  try {
    const hospital = await prisma.hospital.update({
      where: {
        id: req.params.id,
      },
      data: {
        status: HospitalStatus.REJECTED,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'REJECT_HOSPITAL',
        entityType: 'HOSPITAL',
        entityId: hospital.id,
      },
    })

    return res.json({
      message: 'Hospital rejected successfully.',
      hospital,
    })
  } catch (error) {
    console.error('Reject hospital error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminHospitalsRouter.post('/:id/admins', async (req: AuthenticatedAdminRequest, res) => {
  try {
    const parsed = createHospitalAdminSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid hospital admin data.',
        errors: parsed.error.flatten(),
      })
    }

    const hospital = await prisma.hospital.findUnique({
      where: {
        id: req.params.id,
      },
    })

    if (!hospital) {
      return res.status(404).json({
        message: 'Hospital not found.',
      })
    }

    const { email, password, phone } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'A user with this email already exists.',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const hospitalAdminRole = await prisma.role.findUniqueOrThrow({
      where: {
        name: RoleName.HOSPITAL_ADMIN,
      },
    })

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          primaryRole: RoleName.HOSPITAL_ADMIN,
          status: UserStatus.ACTIVE,
        },
      })

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: hospitalAdminRole.id,
        },
      })

      const staff = await tx.orgStaff.create({
        data: {
          userId: user.id,
          hospitalId: hospital.id,
          staffRole: OrgStaffRole.HOSPITAL_ADMIN,
          isActive: true,
        },
      })

      return {
        user,
        staff,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_HOSPITAL_ADMIN',
        entityType: 'HOSPITAL',
        entityId: hospital.id,
        metadata: {
          hospitalName: hospital.name,
          hospitalAdminEmail: email,
        },
      },
    })

    return res.status(201).json({
      message: 'Hospital admin created successfully.',
      hospital,
      user: {
        id: result.user.id,
        email: result.user.email,
        phone: result.user.phone,
        primaryRole: result.user.primaryRole,
        status: result.user.status,
      },
      staff: result.staff,
    })
  } catch (error) {
    console.error('Create hospital admin error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})