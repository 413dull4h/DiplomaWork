import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  ChatMessageSenderRole,
  ChatMessageStatus,
  ChatThreadType,
  NotificationType,
  UserStatus,
} from '@careos/database'
import {
  requirePatientAuth,
  type AuthenticatedPatientRequest,
} from '../middleware/require-patient-auth'

export const patientChatsRouter = Router()

patientChatsRouter.use(requirePatientAuth)

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

patientChatsRouter.get('/', async (req: AuthenticatedPatientRequest, res) => {
  try {
    const patientId = req.user?.patientId

    if (!patientId) {
      return res.status(403).json({
        message: 'No patient assigned.',
      })
    }

    const threads = await prisma.chatThread.findMany({
      where: {
        patientId,
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
    console.error('Patient list chats error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

patientChatsRouter.get(
  '/unread-count',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId
      const userId = req.user?.userId

      if (!patientId || !userId) {
        return res.status(403).json({
          message: 'No patient assigned.',
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
            patientId,
            deletedAt: null,
          },
        },
      })

      return res.json({
        unreadCount,
      })
    } catch (error) {
      console.error('Patient chat unread count error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientChatsRouter.post(
  '/appointments/:appointmentId/thread',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId
      const userId = req.user?.userId

      if (!patientId || !userId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: req.params.appointmentId,
          patientId,
          deletedAt: null,
        },
        include: {
          hospital: true,
          doctor: true,
          hospitalDoctor: true,
          department: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found.',
        })
      }

      const thread = await prisma.chatThread.upsert({
        where: {
          appointmentId: appointment.id,
        },
        update: {},
        create: {
          type: ChatThreadType.APPOINTMENT,
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          hospitalId: appointment.hospitalId,
          doctorId: appointment.doctorId,
          hospitalDoctorId: appointment.hospitalDoctorId,
          createdByUserId: userId,
          subject: `${appointment.hospital.name} appointment chat`,
        },
        include: includeThreadDetails(),
      })

      return res.status(201).json({
        message: 'Chat thread ready.',
        thread,
      })
    } catch (error) {
      console.error('Patient create appointment chat thread error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientChatsRouter.get(
  '/:threadId/messages',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const thread = await prisma.chatThread.findFirst({
        where: {
          id: req.params.threadId,
          patientId,
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
      console.error('Patient list chat messages error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientChatsRouter.post(
  '/:threadId/messages',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId
      const userId = req.user?.userId

      if (!patientId || !userId) {
        return res.status(403).json({
          message: 'No patient assigned.',
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
          patientId,
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
            senderRole: ChatMessageSenderRole.PATIENT,
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
                fullThread.doctor?.userId,
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
                title: 'New patient chat message',
                body: `${fullThread.patient.fullName}: ${preview}`,
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
                  senderRole: ChatMessageSenderRole.PATIENT,
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
      console.error('Patient send chat message error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientChatsRouter.patch(
  '/:threadId/read',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId
      const userId = req.user?.userId

      if (!patientId || !userId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const thread = await prisma.chatThread.findFirst({
        where: {
          id: req.params.threadId,
          patientId,
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
      console.error('Patient mark chat read error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)