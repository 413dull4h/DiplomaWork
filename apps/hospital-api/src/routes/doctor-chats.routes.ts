import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  ChatMessageSenderRole,
  ChatMessageStatus,
  NotificationType,
  UserStatus,
} from '@careos/database'
import {
  requireDoctorAuth,
  type AuthenticatedDoctorRequest,
} from '../middleware/require-doctor-auth'

export const doctorChatsRouter = Router()

doctorChatsRouter.use(requireDoctorAuth)

const sendMessageSchema = z.object({
  body: z.string().min(1).max(3000),
})

function includeThreadDetails() {
  return {
    patient: {
      select: {
        id: true,
        fullName: true,
        profileImageUrl: true,
      },
    },
    hospital: {
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    },
    doctor: {
      select: {
        id: true,
        fullName: true,
        specialization: true,
        profileImageUrl: true,
      },
    },
    appointment: {
      select: {
        id: true,
        status: true,
        appointmentType: true,
        scheduledStart: true,
        scheduledEnd: true,
        reason: true,
      },
    },
    messages: {
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
      take: 1,
      include: {
        senderUser: {
          select: {
            id: true,
            email: true,
            primaryRole: true,
          },
        },
      },
    },
  }
}

doctorChatsRouter.get('/', async (req: AuthenticatedDoctorRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId
    const doctorId = req.user?.doctorId
    const hospitalDoctorId = req.user?.hospitalDoctorId

    if (!hospitalId || !doctorId || !hospitalDoctorId) {
      return res.status(403).json({
        message: 'Doctor account is not fully assigned.',
      })
    }

    const threads = await prisma.chatThread.findMany({
      where: {
        hospitalId,
        doctorId,
        hospitalDoctorId,
        deletedAt: null,
      },
      include: includeThreadDetails(),
      orderBy: [
        {
          lastMessageAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    })

    return res.json({
      threads,
    })
  } catch (error) {
    console.error('Doctor list chats error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

doctorChatsRouter.get(
  '/unread-count',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const doctorId = req.user?.doctorId
      const hospitalDoctorId = req.user?.hospitalDoctorId
      const userId = req.user?.userId

      if (!hospitalId || !doctorId || !hospitalDoctorId || !userId) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const unreadCount = await prisma.chatMessage.count({
        where: {
          status: ChatMessageStatus.SENT,
          deletedAt: null,
          senderUserId: {
            not: userId,
          },
          thread: {
            hospitalId,
            doctorId,
            hospitalDoctorId,
            deletedAt: null,
          },
        },
      })

      return res.json({
        unreadCount,
      })
    } catch (error) {
      console.error('Doctor chat unread count error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorChatsRouter.get(
  '/:threadId/messages',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const doctorId = req.user?.doctorId
      const hospitalDoctorId = req.user?.hospitalDoctorId

      if (!hospitalId || !doctorId || !hospitalDoctorId) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const thread = await prisma.chatThread.findFirst({
        where: {
          id: req.params.threadId,
          hospitalId,
          doctorId,
          hospitalDoctorId,
          deletedAt: null,
        },
      })

      if (!thread) {
        return res.status(404).json({
          message: 'Chat thread not found.',
        })
      }

      const messages = await prisma.chatMessage.findMany({
        where: {
          threadId: thread.id,
          deletedAt: null,
        },
        include: {
          senderUser: {
            select: {
              id: true,
              email: true,
              primaryRole: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      return res.json({
        thread,
        messages,
      })
    } catch (error) {
      console.error('Doctor list chat messages error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorChatsRouter.post(
  '/:threadId/messages',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const doctorId = req.user?.doctorId
      const hospitalDoctorId = req.user?.hospitalDoctorId
      const userId = req.user?.userId

      if (!hospitalId || !doctorId || !hospitalDoctorId || !userId) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const parsed = sendMessageSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid message data.',
          errors: parsed.error.flatten(),
        })
      }

      const thread = await prisma.chatThread.findFirst({
        where: {
          id: req.params.threadId,
          hospitalId,
          doctorId,
          hospitalDoctorId,
          deletedAt: null,
          isClosed: false,
        },
      })

      if (!thread) {
        return res.status(404).json({
          message: 'Open chat thread not found.',
        })
      }

      const message = await prisma.$transaction(async (tx) => {
        const created = await tx.chatMessage.create({
          data: {
            threadId: thread.id,
            senderUserId: userId,
            senderRole: ChatMessageSenderRole.DOCTOR,
            body: parsed.data.body,
            status: ChatMessageStatus.SENT,
          },
          include: {
            senderUser: {
              select: {
                id: true,
                email: true,
                primaryRole: true,
              },
            },
          },
        })

        await tx.chatThread.update({
          where: {
            id: thread.id,
          },
          data: {
            lastMessageAt: created.createdAt,
          },
        })

        const fullThread = await tx.chatThread.findUnique({
          where: {
            id: thread.id,
          },
          include: {
            patient: true,
            hospital: true,
            doctor: true,
            appointment: true,
          },
        })

        if (fullThread) {
          const hospitalStaff = await tx.orgStaff.findMany({
            where: {
              hospitalId: fullThread.hospitalId,
              isActive: true,
              user: {
                status: UserStatus.ACTIVE,
                deletedAt: null,
              },
            },
            select: {
              userId: true,
            },
          })

          const recipientUserIds = Array.from(
            new Set(
              [
                fullThread.patient.userId,
                ...hospitalStaff.map((staff) => staff.userId),
              ].filter((recipientUserId) => {
                return Boolean(recipientUserId) && recipientUserId !== userId
              }) as string[]
            )
          )

          if (recipientUserIds.length > 0) {
            const preview =
              parsed.data.body.length > 120
                ? `${parsed.data.body.slice(0, 120)}...`
                : parsed.data.body

            await tx.notification.createMany({
              data: recipientUserIds.map((recipientUserId) => ({
                recipientUserId,
                type: NotificationType.SYSTEM,
                title: 'New doctor chat message',
                body: `${fullThread.doctor?.fullName || 'Doctor'}: ${preview}`,
                entityType: 'CHAT_THREAD',
                entityId: fullThread.id,
                metadata: {
                  threadId: fullThread.id,
                  messageId: created.id,
                  appointmentId: fullThread.appointmentId,
                  patientId: fullThread.patientId,
                  hospitalId: fullThread.hospitalId,
                  doctorId: fullThread.doctorId,
                  hospitalDoctorId: fullThread.hospitalDoctorId,
                  senderRole: ChatMessageSenderRole.DOCTOR,
                },
              })),
            })
          }
        }

        return created
      })

      return res.status(201).json({
        message: 'Message sent.',
        chatMessage: message,
      })
    } catch (error) {
      console.error('Doctor send chat message error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorChatsRouter.patch(
  '/:threadId/read',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const doctorId = req.user?.doctorId
      const hospitalDoctorId = req.user?.hospitalDoctorId
      const userId = req.user?.userId

      if (!hospitalId || !doctorId || !hospitalDoctorId || !userId) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const thread = await prisma.chatThread.findFirst({
        where: {
          id: req.params.threadId,
          hospitalId,
          doctorId,
          hospitalDoctorId,
          deletedAt: null,
        },
      })

      if (!thread) {
        return res.status(404).json({
          message: 'Chat thread not found.',
        })
      }

      const result = await prisma.chatMessage.updateMany({
        where: {
          threadId: thread.id,
          senderUserId: {
            not: userId,
          },
          status: ChatMessageStatus.SENT,
          deletedAt: null,
        },
        data: {
          status: ChatMessageStatus.READ,
          readAt: new Date(),
        },
      })

      return res.json({
        message: 'Thread marked as read.',
        updated: result.count,
      })
    } catch (error) {
      console.error('Doctor mark chat read error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)