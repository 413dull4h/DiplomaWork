import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import {
  prisma,
  HospitalStatus,
  RoleName,
  UserStatus,
} from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalDoctorAccountsRouter = Router()

hospitalDoctorAccountsRouter.use(requireHospitalAuth)

const createDoctorAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
})

hospitalDoctorAccountsRouter.post(
  '/doctors/:hospitalDoctorId/account',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = createDoctorAccountSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid doctor account data.',
          errors: parsed.error.flatten(),
        })
      }

      const hospitalDoctor = await prisma.hospitalDoctor.findFirst({
        where: {
          id: req.params.hospitalDoctorId,
          hospitalId,
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
          doctor: true,
          hospital: true,
          department: true,
        },
      })

      if (!hospitalDoctor) {
        return res.status(404).json({
          message: 'Hospital doctor not found.',
        })
      }

      if (hospitalDoctor.doctor.userId) {
        return res.status(409).json({
          message: 'This doctor already has a login account.',
        })
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          email: parsed.data.email,
        },
      })

      if (existingUser) {
        return res.status(409).json({
          message: 'A user with this email already exists.',
        })
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, 12)

      const result = await prisma.$transaction(async (tx) => {
        const doctorRole = await tx.role.upsert({
          where: {
            name: RoleName.DOCTOR,
          },
          update: {},
          create: {
            name: RoleName.DOCTOR,
            description: 'Hospital-scoped doctor account',
          },
        })

        const user = await tx.user.create({
          data: {
            email: parsed.data.email,
            phone: parsed.data.phone,
            passwordHash,
            status: UserStatus.ACTIVE,
            primaryRole: RoleName.DOCTOR,
            userRoles: {
              create: {
                roleId: doctorRole.id,
              },
            },
          },
        })

        const doctor = await tx.doctor.update({
          where: {
            id: hospitalDoctor.doctorId,
          },
          data: {
            userId: user.id,
          },
        })

        return {
          user,
          doctor,
        }
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'CREATE_DOCTOR_ACCOUNT',
          entityType: 'DOCTOR',
          entityId: hospitalDoctor.doctorId,
          metadata: {
            hospitalId,
            hospitalDoctorId: hospitalDoctor.id,
            doctorId: hospitalDoctor.doctorId,
            email: result.user.email,
          },
        },
      })

      return res.status(201).json({
        message: 'Doctor account created successfully.',
        doctorAccount: {
          userId: result.user.id,
          email: result.user.email,
          doctorId: result.doctor.id,
          hospitalDoctorId: hospitalDoctor.id,
          hospitalId,
          department: hospitalDoctor.department,
        },
      })
    } catch (error) {
      console.error('Create doctor account error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)