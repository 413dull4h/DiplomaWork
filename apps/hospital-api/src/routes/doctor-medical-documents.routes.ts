import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  AppointmentStatus,
  MedicalDocumentType,
  MedicalDocumentVisibility,
  NotificationChannel,
  NotificationType,
} from '@careos/database'
import {
  requireDoctorAuth,
  type AuthenticatedDoctorRequest,
} from '../middleware/require-doctor-auth'
import { medicalDocumentUpload } from '../utils/medical-document-upload'

export const doctorMedicalDocumentsRouter = Router()

doctorMedicalDocumentsRouter.use(requireDoctorAuth)

const uploadDocumentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.nativeEnum(MedicalDocumentType),
  visibility: z
    .nativeEnum(MedicalDocumentVisibility)
    .default(MedicalDocumentVisibility.PATIENT_VISIBLE),
})

function doctorCanUseAppointment(status: AppointmentStatus) {
  return [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED].includes(
    status
  )
}

doctorMedicalDocumentsRouter.post(
  '/appointments/:appointmentId/documents',
  medicalDocumentUpload.single('document'),
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const doctorId = req.user?.doctorId
      const hospitalDoctorId = req.user?.hospitalDoctorId
      const uploadedByUserId = req.user?.userId

      if (!hospitalId || !doctorId || !hospitalDoctorId || !uploadedByUserId) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'Document file is required.',
        })
      }

      const parsed = uploadDocumentSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid document data.',
          errors: parsed.error.flatten(),
        })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: req.params.appointmentId,
          hospitalId,
          doctorId,
          hospitalDoctorId,
          deletedAt: null,
        },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          hospital: true,
          doctor: true,
          department: true,
          encounter: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found for this doctor.',
        })
      }

      if (!doctorCanUseAppointment(appointment.status)) {
        return res.status(400).json({
          message: `Documents can only be uploaded for CONFIRMED or COMPLETED appointments. Current status: ${appointment.status}`,
        })
      }

      const document = await prisma.$transaction(async (tx) => {
        const createdDocument = await tx.medicalDocument.create({
          data: {
            patientId: appointment.patientId,
            hospitalId: appointment.hospitalId,
            uploadedByUserId,
            appointmentId: appointment.id,
            encounterId: appointment.encounter?.id ?? null,
            title: parsed.data.title,
            description: parsed.data.description,
            type: parsed.data.type,
            visibility: parsed.data.visibility,
            fileName: req.file!.filename,
            originalName: req.file!.originalname,
            mimeType: req.file!.mimetype,
            sizeBytes: req.file!.size,
            fileUrl: `/uploads/medical-documents/${req.file!.filename}`,
          },
          include: {
            patient: true,
            hospital: true,
            appointment: true,
            encounter: true,
          },
        })

        if (
          parsed.data.visibility === MedicalDocumentVisibility.PATIENT_VISIBLE &&
          appointment.patient.userId
        ) {
          await tx.notification.create({
            data: {
              recipientUserId: appointment.patient.userId,
              type: NotificationType.DOCUMENT_UPLOADED,
              title: 'New medical document uploaded',
              body: `${appointment.doctor.fullName} uploaded a medical document: ${createdDocument.title}.`,
              channel: NotificationChannel.IN_APP,
              entityType: 'MEDICAL_DOCUMENT',
              entityId: createdDocument.id,
              metadata: {
                documentId: createdDocument.id,
                patientId: appointment.patientId,
                hospitalId: appointment.hospitalId,
                doctorId: appointment.doctorId,
                appointmentId: appointment.id,
                type: createdDocument.type,
                fileUrl: createdDocument.fileUrl,
              },
            },
          })
        }

        await tx.auditLog.create({
          data: {
            userId: uploadedByUserId,
            action: 'DOCTOR_UPLOAD_MEDICAL_DOCUMENT',
            entityType: 'MEDICAL_DOCUMENT',
            entityId: createdDocument.id,
            metadata: {
              hospitalId,
              doctorId,
              hospitalDoctorId,
              patientId: appointment.patientId,
              appointmentId: appointment.id,
              visibility: createdDocument.visibility,
              type: createdDocument.type,
            },
          },
        })

        return createdDocument
      })

      return res.status(201).json({
        message: 'Medical document uploaded successfully.',
        document,
      })
    } catch (error) {
      console.error('Doctor upload medical document error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorMedicalDocumentsRouter.get(
  '/appointments/:appointmentId/documents',
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

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: req.params.appointmentId,
          hospitalId,
          doctorId,
          hospitalDoctorId,
          deletedAt: null,
        },
      })

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found for this doctor.',
        })
      }

      const documents = await prisma.medicalDocument.findMany({
        where: {
          appointmentId: appointment.id,
          hospitalId,
          patientId: appointment.patientId,
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
      console.error('Doctor appointment documents error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorMedicalDocumentsRouter.get(
  '/patients/:patientId/documents',
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

      const hasPatientAccess = await prisma.appointment.findFirst({
        where: {
          patientId: req.params.patientId,
          hospitalId,
          doctorId,
          hospitalDoctorId,
          deletedAt: null,
        },
      })

      if (!hasPatientAccess) {
        return res.status(403).json({
          message: 'Doctor does not have access to this patient.',
        })
      }

      const documents = await prisma.medicalDocument.findMany({
        where: {
          patientId: req.params.patientId,
          hospitalId,
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
      console.error('Doctor patient documents error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

doctorMedicalDocumentsRouter.delete(
  '/documents/:documentId',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const uploadedByUserId = req.user?.userId

      if (!hospitalId || !uploadedByUserId) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const existing = await prisma.medicalDocument.findFirst({
        where: {
          id: req.params.documentId,
          hospitalId,
          uploadedByUserId,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Document not found or not uploaded by this doctor.',
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
          userId: uploadedByUserId,
          action: 'DOCTOR_DELETE_MEDICAL_DOCUMENT',
          entityType: 'MEDICAL_DOCUMENT',
          entityId: document.id,
          metadata: {
            hospitalId,
            patientId: document.patientId,
            appointmentId: document.appointmentId,
          },
        },
      })

      return res.json({
        message: 'Document deleted successfully.',
      })
    } catch (error) {
      console.error('Doctor delete medical document error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)
