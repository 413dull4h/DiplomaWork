import { Router } from 'express'
import {
  prisma,
  NotificationStatus,
} from '@careos/database'
import {
  requireDoctorAuth,
  type AuthenticatedDoctorRequest,
} from '../middleware/require-doctor-auth'
import { doctorNotificationsRouter } from './routes/doctor-notifications.routes'


export const doctorNotificationsRouter = Router()

doctorNotificationsRouter.use(requireDoctorAuth)

doctorNotificationsRouter.get(
  '/',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(403).json({
          message: 'Doctor account is not assigned.',
        })
      }

      const notifications = await prisma.notification.findMany({
        where: {
          recipientUserId: userId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      })

      return res.json({
        notifications,
      })
    } catch (error) {
      console.error('Doctor list notifications error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorNotificationsRouter.get(
  '/unread-count',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(403).json({
          message: 'Doctor account is not assigned.',
        })
      }

      const unreadCount = await prisma.notification.count({
        where: {
          recipientUserId: userId,
          status: NotificationStatus.UNREAD,
          deletedAt: null,
        },
      })

      return res.json({
        unreadCount,
      })
    } catch (error) {
      console.error('Doctor notification unread count error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorNotificationsRouter.patch(
  '/:notificationId/read',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(403).json({
          message: 'Doctor account is not assigned.',
        })
      }

      const notification = await prisma.notification.findFirst({
        where: {
          id: req.params.notificationId,
          recipientUserId: userId,
          deletedAt: null,
        },
      })

      if (!notification) {
        return res.status(404).json({
          message: 'Notification not found.',
        })
      }

      const updated = await prisma.notification.update({
        where: {
          id: notification.id,
        },
        data: {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      })

      return res.json({
        message: 'Notification marked as read.',
        notification: updated,
      })
    } catch (error) {
      console.error('Doctor mark notification read error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorNotificationsRouter.patch(
  '/read-all',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(403).json({
          message: 'Doctor account is not assigned.',
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
        message: 'All notifications marked as read.',
        updated: result.count,
      })
    } catch (error) {
      console.error('Doctor mark all notifications read error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)