import { Router } from 'express'
import { prisma, MedicalDocumentVisibility } from '@careos/database'
import {
  requirePatientAuth,
  type AuthenticatedPatientRequest,
} from '../middleware/require-patient-auth'

export const patientMedicalDocumentsRouter = Router()

patientMedicalDocumentsRouter.use(requirePatientAuth)

patientMedicalDocumentsRouter.get(
  '/documents',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const documents = await prisma.medicalDocument.findMany({
        where: {
          patientId,
          visibility: MedicalDocumentVisibility.PATIENT_VISIBLE,
          deletedAt: null,
        },
        include: {
          hospital: true,
          appointment: true,
          encounter: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return res.json({
        documents,
      })
    } catch (error) {
      console.error('Patient list medical documents error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

patientMedicalDocumentsRouter.get(
  '/documents/:id',
  async (req: AuthenticatedPatientRequest, res) => {
    try {
      const patientId = req.user?.patientId

      if (!patientId) {
        return res.status(403).json({
          message: 'No patient assigned.',
        })
      }

      const document = await prisma.medicalDocument.findFirst({
        where: {
          id: req.params.id,
          patientId,
          visibility: MedicalDocumentVisibility.PATIENT_VISIBLE,
          deletedAt: null,
        },
        include: {
          hospital: true,
          appointment: true,
          encounter: true,
        },
      })

      if (!document) {
        return res.status(404).json({
          message: 'Medical document not found.',
        })
      }

      return res.json({
        document,
      })
    } catch (error) {
      console.error('Patient get medical document error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)