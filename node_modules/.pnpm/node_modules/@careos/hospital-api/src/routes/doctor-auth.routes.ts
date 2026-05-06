import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import {
  prisma,
  HospitalStatus,
  RoleName,
  UserStatus,
} from '@careos/database'
import { signAccessToken } from '../utils/jwt'
import {
  requireDoctorAuth,
  type AuthenticatedDoctorRequest,
} from '../middleware/require-doctor-auth'

export const doctorAuthRouter = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

doctorAuthRouter.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid email or password format.',
        errors: parsed.error.flatten(),
      })
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        doctor: {
          include: {
            hospitals: {
              where: {
                isActive: true,
                hospital: {
                  status: HospitalStatus.APPROVED,
                  deletedAt: null,
                },
              },
              include: {
                hospital: true,
                department: true,
              },
              take: 1,
            },
          },
        },
      },
    })

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials.',
      })
    }

    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({
        message: 'Account is not active.',
      })
    }

    if (user.primaryRole !== RoleName.DOCTOR) {
      return res.status(403).json({
        message: 'Doctor access required.',
      })
    }

    if (!user.doctor) {
      return res.status(403).json({
        message: 'Doctor profile is not linked to this account.',
      })
    }

    const hospitalDoctor = user.doctor.hospitals[0]

    if (!hospitalDoctor) {
      return res.status(403).json({
        message: 'Doctor is not assigned to an approved hospital.',
      })
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)

    if (!validPassword) {
      return res.status(401).json({
        message: 'Invalid credentials.',
      })
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    })

    const token = signAccessToken({
      userId: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
      doctorId: user.doctor.id,
      hospitalDoctorId: hospitalDoctor.id,
      hospitalId: hospitalDoctor.hospitalId,
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_DOCTOR',
        entityType: 'USER',
        entityId: user.id,
        metadata: {
          doctorId: user.doctor.id,
          hospitalDoctorId: hospitalDoctor.id,
          hospitalId: hospitalDoctor.hospitalId,
        },
      },
    })

    return res.json({
      message: 'Doctor login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        primaryRole: user.primaryRole,
        status: user.status,
      },
      doctor: user.doctor,
      hospital: hospitalDoctor.hospital,
      department: hospitalDoctor.department,
      hospitalDoctorId: hospitalDoctor.id,
    })
  } catch (error) {
    console.error('Doctor login error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

doctorAuthRouter.get(
  '/me',
  requireDoctorAuth,
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const hospitalDoctor = await prisma.hospitalDoctor.findFirst({
        where: {
          id: req.user?.hospitalDoctorId,
          hospitalId: req.user?.hospitalId,
          doctorId: req.user?.doctorId,
          isActive: true,
        },
        include: {
          doctor: {
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
          hospital: true,
          department: true,
        },
      })

      if (!hospitalDoctor) {
        return res.status(404).json({
          message: 'Doctor account not found.',
        })
      }

      return res.json({
        user: hospitalDoctor.doctor.user,
        doctor: hospitalDoctor.doctor,
        hospital: hospitalDoctor.hospital,
        department: hospitalDoctor.department,
        hospitalDoctorId: hospitalDoctor.id,
      })
    } catch (error) {
      console.error('Doctor me error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)