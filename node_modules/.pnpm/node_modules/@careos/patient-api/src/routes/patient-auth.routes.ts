import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma, RoleName, UserStatus } from '@careos/database'
import { signAccessToken } from '../utils/jwt'
import {
  requirePatientAuth,
  type AuthenticatedPatientRequest,
} from '../middleware/require-patient-auth'

export const patientAuthRouter = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

patientAuthRouter.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid registration data.',
        errors: parsed.error.flatten(),
      })
    }

    const { email, password, fullName, phone, gender, dateOfBirth } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'A user with this email already exists.',
      })
    }

    const patientRole = await prisma.role.findUniqueOrThrow({
      where: {
        name: RoleName.PATIENT,
      },
    })

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          primaryRole: RoleName.PATIENT,
          status: UserStatus.ACTIVE,
        },
      })

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: patientRole.id,
        },
      })

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          fullName,
          phone,
          gender,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        },
      })

      return {
        user,
        patient,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: result.user.id,
        action: 'PATIENT_REGISTER',
        entityType: 'PATIENT',
        entityId: result.patient.id,
        metadata: {
          email: result.user.email,
          fullName: result.patient.fullName,
        },
      },
    })

    const token = signAccessToken({
      userId: result.user.id,
      email: result.user.email,
      primaryRole: result.user.primaryRole,
      patientId: result.patient.id,
    })

    return res.status(201).json({
      message: 'Patient registered successfully.',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        phone: result.user.phone,
        primaryRole: result.user.primaryRole,
        status: result.user.status,
      },
      patient: result.patient,
    })
  } catch (error) {
    console.error('Patient register error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

patientAuthRouter.post('/login', async (req, res) => {
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
      where: { email },
      include: {
        patient: true,
        userRoles: {
          include: {
            role: true,
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

    const isPatient =
      user.primaryRole === RoleName.PATIENT ||
      user.userRoles.some((userRole) => userRole.role.name === RoleName.PATIENT)

    if (!isPatient) {
      return res.status(403).json({
        message: 'Patient access required.',
      })
    }

    if (!user.patient) {
      return res.status(403).json({
        message: 'Patient profile not found.',
      })
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatches) {
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

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PATIENT_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        metadata: {
          email: user.email,
          patientId: user.patient.id,
        },
      },
    })

    const token = signAccessToken({
      userId: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
      patientId: user.patient.id,
    })

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        primaryRole: user.primaryRole,
        status: user.status,
      },
      patient: user.patient,
    })
  } catch (error) {
    console.error('Patient login error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

patientAuthRouter.get(
  '/me',
  requirePatientAuth,
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      if (!req.user || !req.user.patientId) {
        return res.status(401).json({
          message: 'Unauthorized.',
        })
      }

      const patient = await prisma.patient.findUnique({
        where: {
          id: req.user.patientId,
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
        user: patient.user,
        patient,
      })
    } catch (error) {
      console.error('Patient me error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)