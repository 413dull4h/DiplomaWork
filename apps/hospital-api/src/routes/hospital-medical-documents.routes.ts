import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  MedicalDocumentType,
  MedicalDocumentVisibility,
  NotificationType,
} from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'
import { medicalDocumentUpload } from '../utils/medical-document-upload'

export const hospitalMedicalDocumentsRouter = Router()

hospitalMedicalDocumentsRouter.use(requireHospitalAuth)

const createDocumentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.nativeEnum(MedicalDocumentType).default(MedicalDocumentType.OTHER),
  visibility: z
    .nativeEnum(MedicalDocumentVisibility)
    .default(MedicalDocumentVisibility.PATIENT_VISIBLE),
  appointmentId: z.string().uuid().optional(),
  encounterId: z.string().uuid().optional(),
})

hospitalMedicalDocumentsRouter.get(
  '/patients/:patientId/documents',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const documents = await prisma.medicalDocument.findMany({
        where: {
          hospitalId,
          patientId: req.params.patientId,
          deletedAt: null,
        },
        include: {
          patient: true,
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
      console.error('Hospital list medical documents error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalMedicalDocumentsRouter.post(
  '/patients/:patientId/documents',
  medicalDocumentUpload.single('document'),
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const uploadedByUserId = req.user?.userId

      if (!hospitalId || !uploadedByUserId) {
        return res.status(403).json({
          message: 'No hospital user assigned.',
        })
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'Document file is required.',
        })
      }

      const parsed = createDocumentSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid document data.',
          errors: parsed.error.flatten(),
        })
      }

      const patient = await prisma.patient.findFirst({
        where: {
          id: req.params.patientId,
          deletedAt: null,
        },
      })

      if (!patient) {
        return res.status(404).json({
          message: 'Patient not found.',
        })
      }

      if (parsed.data.appointmentId) {
        const appointment = await prisma.appointment.findFirst({
          where: {
            id: parsed.data.appointmentId,
            hospitalId,
            patientId: patient.id,
            deletedAt: null,
          },
        })

        if (!appointment) {
          return res.status(404).json({
            message: 'Appointment not found for this hospital and patient.',
          })
        }
      }

      if (parsed.data.encounterId) {
        const encounter = await prisma.encounter.findFirst({
          where: {
            id: parsed.data.encounterId,
            hospitalId,
            patientId: patient.id,
            deletedAt: null,
          },
        })

        if (!encounter) {
          return res.status(404).json({
            message: 'Encounter not found for this hospital and patient.',
          })
        }
      }

      const fileUrl = `/uploads/medical-documents/${req.file.filename}`

      const document = await prisma.medicalDocument.create({
        data: {
          patientId: patient.id,
          hospitalId,
          uploadedByUserId,
          appointmentId: parsed.data.appointmentId,
          encounterId: parsed.data.encounterId,
          title: parsed.data.title,
          description: parsed.data.description,
          type: parsed.data.type,
          visibility: parsed.data.visibility,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          fileUrl,
        },
        include: {
          patient: true,
          hospital: true,
          appointment: true,
          encounter: true,
        },
      })

      if (document.visibility === MedicalDocumentVisibility.PATIENT_VISIBLE) {
        await prisma.notification.create({
          data: {
            recipientUserId: patient.userId,
            type: NotificationType.DOCUMENT_UPLOADED,
            title: 'New medical document uploaded',
            body: `${document.hospital.name} uploaded a medical document: ${document.title}.`,
            entityType: 'MEDICAL_DOCUMENT',
            entityId: document.id,
            metadata: {
              documentId: document.id,
              patientId: document.patientId,
              hospitalId: document.hospitalId,
              type: document.type,
              fileUrl: document.fileUrl,
            },
          },
        })
      }

      await prisma.auditLog.create({
        data: {
          userId: uploadedByUserId,
          action: 'UPLOAD_MEDICAL_DOCUMENT',
          entityType: 'MEDICAL_DOCUMENT',
          entityId: document.id,
          metadata: {
            hospitalId,
            patientId: patient.id,
            title: document.title,
            type: document.type,
            fileUrl: document.fileUrl,
          },
        },
      })

      return res.status(201).json({
        message: 'Medical document uploaded successfully.',
        document,
      })
    } catch (error) {
      console.error('Hospital upload medical document error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalMedicalDocumentsRouter.delete(
  '/documents/:id',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const existing = await prisma.medicalDocument.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Medical document not found.',
        })
      }

      const document = await prisma.medicalDocument.update({
        where: {
          id: existing.id,
        },
        data: {
          deletedAt: new Date(),
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'DELETE_MEDICAL_DOCUMENT',
          entityType: 'MEDICAL_DOCUMENT',
          entityId: document.id,
          metadata: {
            hospitalId,
            patientId: document.patientId,
          },
        },
      })

      return res.json({
        message: 'Medical document deleted successfully.',
      })
    } catch (error) {
      console.error('Hospital delete medical document error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)