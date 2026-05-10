import { Router } from 'express'
import { z } from 'zod'
import { prisma, NotificationStatus } from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalNotificationsRouter = Router()

hospitalNotificationsRouter.use(requireHospitalAuth)

const listQuerySchema = z.object({
  status: z.nativeEnum(NotificationStatus).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

hospitalNotificationsRouter.get(
  '/',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(403).json({
          message: 'No user assigned.',
        })
      }

      const parsed = listQuerySchema.safeParse(req.query)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid notification query.',
          errors: parsed.error.flatten(),
        })
      }

      const notifications = await prisma.notification.findMany({
        where: {
          recipientUserId: userId,
          deletedAt: null,
          status: parsed.data.status,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: parsed.data.limit,
      })

      return res.json({
        notifications,
      })
    } catch (error) {
      console.error('Hospital list notifications error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalNotificationsRouter.get(
  '/unread-count',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(403).json({
          message: 'No user assigned.',
        })
      }

      const count = await prisma.notification.count({
        where: {
          recipientUserId: userId,
          status: NotificationStatus.UNREAD,
          deletedAt: null,
        },
      })

      return res.json({
        count,
      })
    } catch (error) {
      console.error('Hospital unread notification count error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalNotificationsRouter.patch(
  '/read-all',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(403).json({
          message: 'No user assigned.',
        })
      }

      const result = await prisma.notification.updateMany({
        where: {
          recipientUserId: userId,
          status: NotificationStatus.UNREAD,
          deletedAt: null,
        },
        data: {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      })

      return res.json({
        message: 'Notifications marked as read.',
        updated: result.count,
      })
    } catch (error) {
      console.error('Hospital mark all notifications read error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalNotificationsRouter.patch(
  '/:id/read',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(403).json({
          message: 'No user assigned.',
        })
      }

      const existing = await prisma.notification.findFirst({
        where: {
          id: req.params.id,
          recipientUserId: userId,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Notification not found.',
        })
      }

      const notification = await prisma.notification.update({
        where: {
          id: existing.id,
        },
        data: {
          status: NotificationStatus.READ,
          readAt: existing.readAt ?? new Date(),
        },
      })

      return res.json({
        message: 'Notification marked as read.',
        notification,
      })
    } catch (error) {
      console.error('Hospital mark notification read error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)