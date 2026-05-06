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
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalAuthRouter = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

hospitalAuthRouter.post('/login', async (req, res) => {
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
        userRoles: {
          include: {
            role: true,
          },
        },
        orgStaff: {
          include: {
            hospital: true,
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

    const isHospitalUser =
      user.primaryRole === RoleName.HOSPITAL_ADMIN ||
      user.primaryRole === RoleName.HOSPITAL_STAFF ||
      user.userRoles.some(
        (userRole) =>
          userRole.role.name === RoleName.HOSPITAL_ADMIN ||
          userRole.role.name === RoleName.HOSPITAL_STAFF
      )

    if (!isHospitalUser) {
      return res.status(403).json({
        message: 'Hospital access required.',
      })
    }

    const activeStaff = user.orgStaff.find((staff) => staff.isActive)

    if (!activeStaff) {
      return res.status(403).json({
        message: 'No active hospital assignment found.',
      })
    }

    if (activeStaff.hospital.status !== HospitalStatus.APPROVED) {
      return res.status(403).json({
        message: 'Hospital is not approved or currently unavailable.',
        hospitalStatus: activeStaff.hospital.status,
      })
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid credentials.',
      })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'HOSPITAL_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        metadata: {
          email: user.email,
          hospitalId: activeStaff.hospital.id,
          hospitalName: activeStaff.hospital.name,
        },
      },
    })

    const token = signAccessToken({
      userId: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
      hospitalId: activeStaff.hospital.id,
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
      hospital: {
        id: activeStaff.hospital.id,
        name: activeStaff.hospital.name,
        status: activeStaff.hospital.status,
        contactEmail: activeStaff.hospital.contactEmail,
        contactPhone: activeStaff.hospital.contactPhone,
      },
      staff: {
        id: activeStaff.id,
        staffRole: activeStaff.staffRole,
        isActive: activeStaff.isActive,
      },
    })
  } catch (error) {
    console.error('Hospital login error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

hospitalAuthRouter.get(
  '/me',
  requireHospitalAuth,
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      if (!req.user || !req.user.hospitalId) {
        return res.status(401).json({
          message: 'Unauthorized.',
        })
      }

      const staff = await prisma.orgStaff.findFirst({
        where: {
          userId: req.user.userId,
          hospitalId: req.user.hospitalId,
          isActive: true,
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
          hospital: true,
        },
      })

      if (!staff) {
        return res.status(404).json({
          message: 'Hospital staff record not found.',
        })
      }

      return res.json({
        user: staff.user,
        hospital: staff.hospital,
        staff: {
          id: staff.id,
          staffRole: staff.staffRole,
          isActive: staff.isActive,
        },
      })
    } catch (error) {
      console.error('Hospital me error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)