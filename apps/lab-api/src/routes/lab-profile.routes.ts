import { Router } from 'express'
import {
  requireLabAuth,
  type AuthenticatedLabRequest,
} from '../middleware/require-lab-auth'
import { prisma } from '@careos/database'

export const labProfileRouter = Router()

labProfileRouter.use(requireLabAuth)

labProfileRouter.get('/', async (req: AuthenticatedLabRequest, res) => {
  try {
    const labId = req.user?.labId

    if (!labId) {
      return res.status(403).json({
        message: 'No lab assigned.',
      })
    }

    const lab = await prisma.lab.findFirst({
      where: {
        id: labId,
        deletedAt: null,
      },
      include: {
        address: true,
        hospital: {
          select: {
            id: true,
            name: true,
            status: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
        staff: {
          where: {
            deletedAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                primaryRole: true,
                status: true,
              },
            },
          },
        },
      },
    })

    if (!lab) {
      return res.status(404).json({
        message: 'Lab not found.',
      })
    }

    return res.json({
      lab,
    })
  } catch (error) {
    console.error('Lab profile error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})