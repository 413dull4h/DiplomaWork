import { Router } from 'express'
import {
  prisma,
} from '@careos/database'
import {
  requirePatientAuth,
  type AuthenticatedPatientRequest,
} from '../middleware/require-patient-auth'

export const patientLabOrdersRouter = Router()

patientLabOrdersRouter.use(requirePatientAuth)

/**
 * GET /patient/lab-orders
 *
 * Patient sees their own lab orders:
 * - doctor-issued orders
 * - hospital-issued orders
 * - patient-direct orders if added later
 */
patientLabOrdersRouter.get(
  '/',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'Patient profile is not assigned.',
        })
      }

      const labOrders = await prisma.labOrder.findMany({
        where: {
          patientId,
          deletedAt: null,
        },
        include: {
          lab: {
            include: {
              address: true,
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
          reports: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return res.json({
        labOrders,
      })
    } catch (error) {
      console.error('Patient list lab orders error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

/**
 * GET /patient/lab-orders/:id
 *
 * Patient sees one of their own lab orders.
 */
patientLabOrdersRouter.get(
  '/:id',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'Patient profile is not assigned.',
        })
      }

      const labOrder = await prisma.labOrder.findFirst({
        where: {
          id: req.params.id,
          patientId,
          deletedAt: null,
        },
        include: {
          lab: {
            include: {
              address: true,
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
          reports: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      })

      if (!labOrder) {
        return res.status(404).json({
          message: 'Lab order not found.',
        })
      }

      return res.json({
        labOrder,
      })
    } catch (error) {
      console.error('Patient get lab order error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)