import { Router } from 'express'
import { prisma } from '@careos/database'
import {
  requirePatientAuth,
  type AuthenticatedPatientRequest,
} from '../middleware/require-patient-auth'

export const patientLabReportsRouter = Router()

patientLabReportsRouter.use(requirePatientAuth)

patientLabReportsRouter.get(
  '/',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const reports = await prisma.labReport.findMany({
        where: {
          patientId,
          deletedAt: null,
        },
        include: {
          lab: true,
          hospital: true,
          doctor: true,
          appointment: true,
          encounter: true,
          labOrder: {
            include: {
              items: {
                include: {
                  labTest: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return res.json({
        reports,
      })
    } catch (error) {
      console.error('Patient list lab reports error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientLabReportsRouter.get(
  '/:id',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const report = await prisma.labReport.findFirst({
        where: {
          id: req.params.id,
          patientId,
          deletedAt: null,
        },
        include: {
          lab: true,
          hospital: true,
          doctor: true,
          appointment: true,
          encounter: true,
          labOrder: {
            include: {
              items: {
                include: {
                  labTest: true,
                },
              },
            },
          },
        },
      })

      if (!report) {
        return res.status(404).json({
          message: 'Lab report not found.',
        })
      }

      return res.json({
        report,
      })
    } catch (error) {
      console.error('Patient get lab report error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)