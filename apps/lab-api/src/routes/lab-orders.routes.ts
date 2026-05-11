import { Router } from 'express'
import { z } from 'zod'
import { prisma, LabOrderStatus } from '@careos/database'
import {
  requireLabAuth,
  type AuthenticatedLabRequest,
} from '../middleware/require-lab-auth'

export const labOrdersRouter = Router()

labOrdersRouter.use(requireLabAuth)

const listQuerySchema = z.object({
  status: z.nativeEnum(LabOrderStatus).optional(),
})

const rejectSchema = z.object({
  rejectionReason: z.string().min(2).optional(),
})

async function findLabOrder(labId: string, orderId: string) {
  return prisma.labOrder.findFirst({
    where: {
      id: orderId,
      labId,
      deletedAt: null,
    },
    include: {
      lab: true,
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
      appointment: true,
      encounter: true,
      items: {
        include: {
          labTest: true,
        },
      },
      reports: true,
    },
  })
}

labOrdersRouter.get('/', async (req: AuthenticatedLabRequest, res) => {
  try {
    const labId = req.user?.labId

    if (!labId) {
      return res.status(403).json({
        message: 'No lab assigned.',
      })
    }

    const parsed = listQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid order query.',
        errors: parsed.error.flatten(),
      })
    }

    const orders = await prisma.labOrder.findMany({
      where: {
        labId,
        status: parsed.data.status,
        deletedAt: null,
      },
      include: {
        patient: true,
        hospital: true,
        doctor: true,
        appointment: true,
        items: {
          include: {
            labTest: true,
          },
        },
        reports: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.json({
      orders,
    })
  } catch (error) {
    console.error('List lab orders error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

labOrdersRouter.get('/:id', async (req: AuthenticatedLabRequest, res) => {
  try {
    const labId = req.user?.labId

    if (!labId) {
      return res.status(403).json({
        message: 'No lab assigned.',
      })
    }

    const order = await findLabOrder(labId, req.params.id)

    if (!order) {
      return res.status(404).json({
        message: 'Lab order not found.',
      })
    }

    return res.json({
      order,
    })
  } catch (error) {
    console.error('Get lab order error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

labOrdersRouter.patch('/:id/accept', async (req: AuthenticatedLabRequest, res) => {
  try {
    const labId = req.user?.labId
    const userId = req.user?.userId

    if (!labId || !userId) {
      return res.status(403).json({
        message: 'No lab assigned.',
      })
    }

    const existing = await findLabOrder(labId, req.params.id)

    if (!existing) {
      return res.status(404).json({
        message: 'Lab order not found.',
      })
    }

    if (existing.status !== LabOrderStatus.REQUESTED) {
      return res.status(400).json({
        message: `Only REQUESTED orders can be accepted. Current status: ${existing.status}`,
      })
    }

    const order = await prisma.labOrder.update({
      where: {
        id: existing.id,
      },
      data: {
        status: LabOrderStatus.ACCEPTED,
        acceptedByUserId: userId,
      },
      include: {
        items: true,
        patient: true,
        hospital: true,
        doctor: true,
        lab: true,
      },
    })

    return res.json({
      message: 'Lab order accepted successfully.',
      order,
    })
  } catch (error) {
    console.error('Accept lab order error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

labOrdersRouter.patch('/:id/reject', async (req: AuthenticatedLabRequest, res) => {
  try {
    const labId = req.user?.labId
    const userId = req.user?.userId

    if (!labId || !userId) {
      return res.status(403).json({
        message: 'No lab assigned.',
      })
    }

    const parsed = rejectSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid rejection data.',
        errors: parsed.error.flatten(),
      })
    }

    const existing = await findLabOrder(labId, req.params.id)

    if (!existing) {
      return res.status(404).json({
        message: 'Lab order not found.',
      })
    }

    if (existing.status !== LabOrderStatus.REQUESTED) {
      return res.status(400).json({
        message: `Only REQUESTED orders can be rejected. Current status: ${existing.status}`,
      })
    }

    const order = await prisma.labOrder.update({
      where: {
        id: existing.id,
      },
      data: {
        status: LabOrderStatus.REJECTED,
        rejectedByUserId: userId,
        rejectionReason: parsed.data.rejectionReason,
      },
    })

    return res.json({
      message: 'Lab order rejected.',
      order,
    })
  } catch (error) {
    console.error('Reject lab order error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

labOrdersRouter.patch(
  '/:id/sample-collected',
  async (req: AuthenticatedLabRequest, res) => {
    try {
      const labId = req.user?.labId

      if (!labId) {
        return res.status(403).json({
          message: 'No lab assigned.',
        })
      }

      const existing = await findLabOrder(labId, req.params.id)

      if (!existing) {
        return res.status(404).json({
          message: 'Lab order not found.',
        })
      }

      if (
        ![LabOrderStatus.ACCEPTED, LabOrderStatus.SCHEDULED].includes(
          existing.status
        )
      ) {
        return res.status(400).json({
          message: `Only ACCEPTED or SCHEDULED orders can move to SAMPLE_COLLECTED. Current status: ${existing.status}`,
        })
      }

      const order = await prisma.labOrder.update({
        where: {
          id: existing.id,
        },
        data: {
          status: LabOrderStatus.SAMPLE_COLLECTED,
          sampleCollectedAt: new Date(),
        },
      })

      return res.json({
        message: 'Sample marked as collected.',
        order,
      })
    } catch (error) {
      console.error('Sample collected lab order error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

labOrdersRouter.patch(
  '/:id/in-progress',
  async (req: AuthenticatedLabRequest, res) => {
    try {
      const labId = req.user?.labId

      if (!labId) {
        return res.status(403).json({
          message: 'No lab assigned.',
        })
      }

      const existing = await findLabOrder(labId, req.params.id)

      if (!existing) {
        return res.status(404).json({
          message: 'Lab order not found.',
        })
      }

      if (
        ![
          LabOrderStatus.ACCEPTED,
          LabOrderStatus.SCHEDULED,
          LabOrderStatus.SAMPLE_COLLECTED,
        ].includes(existing.status)
      ) {
        return res.status(400).json({
          message: `Order cannot move to IN_PROGRESS from ${existing.status}`,
        })
      }

      const order = await prisma.labOrder.update({
        where: {
          id: existing.id,
        },
        data: {
          status: LabOrderStatus.IN_PROGRESS,
        },
      })

      return res.json({
        message: 'Lab order marked as in progress.',
        order,
      })
    } catch (error) {
      console.error('In progress lab order error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

labOrdersRouter.patch('/:id/complete', async (req: AuthenticatedLabRequest, res) => {
  try {
    const labId = req.user?.labId

    if (!labId) {
      return res.status(403).json({
        message: 'No lab assigned.',
      })
    }

    const existing = await findLabOrder(labId, req.params.id)

    if (!existing) {
      return res.status(404).json({
        message: 'Lab order not found.',
      })
    }

    if (existing.status !== LabOrderStatus.IN_PROGRESS) {
      return res.status(400).json({
        message: `Only IN_PROGRESS orders can be completed. Current status: ${existing.status}`,
      })
    }

    const order = await prisma.labOrder.update({
      where: {
        id: existing.id,
      },
      data: {
        status: LabOrderStatus.COMPLETED,
        completedAt: new Date(),
      },
    })

    return res.json({
      message: 'Lab order completed.',
      order,
    })
  } catch (error) {
    console.error('Complete lab order error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})