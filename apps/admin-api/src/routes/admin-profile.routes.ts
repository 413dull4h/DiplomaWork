import fs from 'fs'
import path from 'path'
import { Router } from 'express'
import { prisma } from '@careos/database'
import { createImageUpload } from '../utils/upload'
import {
  requireAdminAuth,
  type AuthenticatedAdminRequest,
} from '../middleware/require-admin-auth'

export const adminProfileRouter = Router()

adminProfileRouter.use(requireAdminAuth)

const avatarUpload = createImageUpload('admins')

function deleteLocalAdminAvatar(avatarUrl?: string | null) {
  if (!avatarUrl) {
    return
  }

  if (!avatarUrl.startsWith('/uploads/admins/')) {
    return
  }

  const filename = path.basename(avatarUrl)
  const filePath = path.join(process.cwd(), 'uploads', 'admins', filename)

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

adminProfileRouter.get('/', async (req: AuthenticatedAdminRequest, res) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(403).json({
        message: 'No admin user assigned.',
      })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        avatarUrl: true,
        status: true,
        primaryRole: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        message: 'Admin user not found.',
      })
    }

    return res.json({
      user,
    })
  } catch (error) {
    console.error('Get admin profile error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

adminProfileRouter.post(
  '/avatar',
  avatarUpload.single('avatar'),
  async (req: AuthenticatedAdminRequest, res) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(403).json({
          message: 'No admin user assigned.',
        })
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'Avatar image is required.',
        })
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      })

      if (!existingUser) {
        return res.status(404).json({
          message: 'Admin user not found.',
        })
      }

      deleteLocalAdminAvatar(existingUser.avatarUrl)

      const avatarUrl = `/uploads/admins/${req.file.filename}`

      const user = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          avatarUrl,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          avatarUrl: true,
          status: true,
          primaryRole: true,
          lastLoginAt: true,
          createdAt: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_ADMIN_AVATAR',
          entityType: 'USER',
          entityId: user.id,
          metadata: {
            avatarUrl,
          },
        },
      })

      return res.json({
        message: 'Admin avatar uploaded successfully.',
        avatarUrl,
        user,
      })
    } catch (error) {
      console.error('Upload admin avatar error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

adminProfileRouter.delete(
  '/avatar',
  async (req: AuthenticatedAdminRequest, res) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(403).json({
          message: 'No admin user assigned.',
        })
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      })

      if (!existingUser) {
        return res.status(404).json({
          message: 'Admin user not found.',
        })
      }

      deleteLocalAdminAvatar(existingUser.avatarUrl)

      const user = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          avatarUrl: null,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          avatarUrl: true,
          status: true,
          primaryRole: true,
          lastLoginAt: true,
          createdAt: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'DELETE_ADMIN_AVATAR',
          entityType: 'USER',
          entityId: user.id,
          metadata: {},
        },
      })

      return res.json({
        message: 'Admin avatar removed successfully.',
        user,
      })
    } catch (error) {
      console.error('Delete admin avatar error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)