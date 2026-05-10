import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  ChatMessageSenderRole,
  ChatMessageStatus,
  NotificationType,
} from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalChatsRouter = Router()

hospitalChatsRouter.use(requireHospitalAuth)

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
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
          },
        },
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
    hospitalDoctor: {
      select: {
        id: true,
        isActive: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
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

hospitalChatsRouter.get('/', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({
        message: 'No hospital assigned.',
      })
    }

    const threads = await prisma.chatThread.findMany({
      where: {
        hospitalId,
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
    console.error('Hospital list chats error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

hospitalChatsRouter.get(
  '/unread-count',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const userId = req.user?.userId

      if (!hospitalId || !userId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
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
            deletedAt: null,
          },
        },
      })

      return res.json({
        unreadCount,
      })
    } catch (error) {
      console.error('Hospital chat unread count error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalChatsRouter.get(
  '/:threadId/messages',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const thread = await prisma.chatThread.findFirst({
        where: {
          id: req.params.threadId,
          hospitalId,
          deletedAt: null,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  phone: true,
                  status: true,
                },
              },
            },
          },
          hospital: true,
          doctor: true,
          hospitalDoctor: {
            include: {
              department: true,
            },
          },
          appointment: true,
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
      console.error('Hospital list chat messages error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalChatsRouter.post(
  '/:threadId/messages',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const userId = req.user?.userId

      if (!hospitalId || !userId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
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
            senderRole: ChatMessageSenderRole.HOSPITAL_STAFF,
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
          const recipientUserIds = Array.from(
            new Set(
              [
                fullThread.patient.userId,
                fullThread.doctor?.userId,
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
                title: 'New hospital chat message',
                body: `${fullThread.hospital.name}: ${preview}`,
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
                  senderRole: ChatMessageSenderRole.HOSPITAL_STAFF,
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
      console.error('Hospital send chat message error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalChatsRouter.patch(
  '/:threadId/read',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const userId = req.user?.userId

      if (!hospitalId || !userId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const thread = await prisma.chatThread.findFirst({
        where: {
          id: req.params.threadId,
          hospitalId,
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
      console.error('Hospital mark chat read error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)