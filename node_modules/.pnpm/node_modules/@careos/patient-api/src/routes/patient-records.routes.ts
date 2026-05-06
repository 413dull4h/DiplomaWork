import { Router } from 'express'
import { prisma } from '@careos/database'
import {
  requirePatientAuth,
  type AuthenticatedPatientRequest,
} from '../middleware/require-patient-auth'

export const patientRecordsRouter = Router()

patientRecordsRouter.use(requirePatientAuth)

patientRecordsRouter.get('/records', async (req: AuthenticatedPatientRequest, res) => {
  try {
    const patientId = req.user?.patientId

    if (!patientId) {
      return res.status(403).json({
        message: 'No patient assigned.',
      })
    }

    const encounters = await prisma.encounter.findMany({
      where: {
        patientId,
        deletedAt: null,
      },
      include: {
        appointment: true,
        hospital: true,
        doctor: true,
        department: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.json({
      encounters,
    })
  } catch (error) {
    console.error('Patient records error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

patientRecordsRouter.get(
  '/records/:encounterId',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const encounter = await prisma.encounter.findFirst({
        where: {
          id: req.params.encounterId,
          patientId,
          deletedAt: null,
        },
        include: {
          appointment: true,
          hospital: true,
          doctor: true,
          department: true,
        },
      })

      if (!encounter) {
        return res.status(404).json({
          message: 'Record not found.',
        })
      }

      return res.json({
        encounter,
      })
    } catch (error) {
      console.error('Patient record detail error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)