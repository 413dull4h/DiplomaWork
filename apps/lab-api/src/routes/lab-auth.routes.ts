import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma, LabStatus, RoleName, UserStatus } from '@careos/database'
import { signAccessToken } from '../utils/jwt'
import {
  requireLabAuth,
  type AuthenticatedLabRequest,
} from '../middleware/require-lab-auth'

export const labAuthRouter = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const allowedRoles = [
  RoleName.LAB_ADMIN,
  RoleName.LAB_STAFF,
  RoleName.LAB_TECHNICIAN,
]

labAuthRouter.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid login data.',
        errors: parsed.error.flatten(),
      })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
      include: {
        labStaff: {
          where: {
            isActive: true,
            deletedAt: null,
            lab: {
              status: LabStatus.APPROVED,
              isActive: true,
              deletedAt: null,
            },
          },
          include: {
            lab: true,
          },
        },
      },
    })

    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      })
    }

    if (!allowedRoles.includes(user.primaryRole)) {
      return res.status(403).json({
        message: 'This account does not have lab access.',
      })
    }

    const passwordOk = await bcrypt.compare(parsed.data.password, user.passwordHash)

    if (!passwordOk) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      })
    }

    const staff = user.labStaff[0]

    if (!staff) {
      return res.status(403).json({
        message: 'No approved lab assigned to this account.',
      })
    }

    const token = signAccessToken({
      userId: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
      labId: staff.labId,
      labStaffId: staff.id,
      staffRole: staff.staffRole,
    })

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    })

    return res.json({
      message: 'Lab login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        primaryRole: user.primaryRole,
        status: user.status,
      },
      lab: staff.lab,
      staff: {
        id: staff.id,
        staffRole: staff.staffRole,
      },
    })
  } catch (error) {
    console.error('Lab login error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

labAuthRouter.get('/me', requireLabAuth, async (req: AuthenticatedLabRequest, res) => {
  try {
    const userId = req.user?.userId
    const labId = req.user?.labId
    const labStaffId = req.user?.labStaffId

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        primaryRole: true,
        status: true,
        lastLoginAt: true,
      },
    })

    const staff = await prisma.labStaff.findFirst({
      where: {
        id: labStaffId,
        labId,
        deletedAt: null,
      },
      include: {
        lab: true,
      },
    })

    if (!user || !staff) {
      return res.status(404).json({
        message: 'Lab account not found.',
      })
    }

    return res.json({
      user,
      staff,
      lab: staff.lab,
    })
  } catch (error) {
    console.error('Lab me error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})