import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  LabOrderStatus,
  LabReportStatus,
  NotificationType,
} from '@careos/database'
import {
  requireLabAuth,
  type AuthenticatedLabRequest,
} from '../middleware/require-lab-auth'
import { labReportUpload } from '../utils/lab-report-upload'

export const labReportsRouter = Router()

labReportsRouter.use(requireLabAuth)

const createReportSchema = z.object({
  title: z.string().min(2),
  summary: z.string().optional(),
  status: z.nativeEnum(LabReportStatus).default(LabReportStatus.FINAL),
  resultData: z.string().optional(),
})

function parseResultData(value?: string) {
  if (!value) return undefined

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

labReportsRouter.post(
  '/orders/:orderId/reports',
  labReportUpload.single('report'),
  async (req: AuthenticatedLabRequest, res) => {
    try {
      const labId = req.user?.labId
      const uploadedByUserId = req.user?.userId

      if (!labId || !uploadedByUserId) {
        return res.status(403).json({
          message: 'No lab assigned.',
        })
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'Report file is required.',
        })
      }

      const parsed = createReportSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid report data.',
          errors: parsed.error.flatten(),
        })
      }

      const order = await prisma.labOrder.findFirst({
        where: {
          id: req.params.orderId,
          labId,
          deletedAt: null,
        },
        include: {
          lab: true,
          patient: {
            include: {
              user: true,
            },
          },
          hospital: true,
          doctor: true,
          appointment: true,
          encounter: true,
          items: true,
        },
      })

      if (!order) {
        return res.status(404).json({
          message: 'Lab order not found.',
        })
      }

      if (order.status !== LabOrderStatus.COMPLETED) {
        return res.status(400).json({
          message: `Report can only be uploaded after order is COMPLETED. Current status: ${order.status}`,
        })
      }

      const fileUrl = `/uploads/lab-reports/${req.file.filename}`

      const result = await prisma.$transaction(async (tx) => {
        const report = await tx.labReport.create({
          data: {
            labOrderId: order.id,
            labId: order.labId,
            patientId: order.patientId,
            hospitalId: order.hospitalId,
            doctorId: order.doctorId,
            appointmentId: order.appointmentId,
            encounterId: order.encounterId,
            uploadedByUserId,

            title: parsed.data.title,
            summary: parsed.data.summary,
            status: parsed.data.status,

            fileName: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            sizeBytes: req.file.size,
            fileUrl,

            resultData: parseResultData(parsed.data.resultData),
            finalizedAt:
              parsed.data.status === LabReportStatus.FINAL
                ? new Date()
                : undefined,
          },
          include: {
            labOrder: {
              include: {
                items: true,
              },
            },
            lab: true,
            patient: true,
            hospital: true,
            doctor: true,
          },
        })

        await tx.notification.create({
          data: {
            recipientUserId: order.patient.userId,
            type: NotificationType.DOCUMENT_UPLOADED,
            title: 'Lab report available',
            body: `${order.lab.name} uploaded your lab report: ${parsed.data.title}.`,
            entityType: 'LAB_REPORT',
            entityId: report.id,
            metadata: {
              labOrderId: order.id,
              labId: order.labId,
              hospitalId: order.hospitalId,
              doctorId: order.doctorId,
              appointmentId: order.appointmentId,
              encounterId: order.encounterId,
              fileUrl,
            },
          },
        })

        await tx.auditLog.create({
          data: {
            userId: uploadedByUserId,
            action: 'UPLOAD_LAB_REPORT',
            entityType: 'LAB_REPORT',
            entityId: report.id,
            metadata: {
              labOrderId: order.id,
              labId: order.labId,
              patientId: order.patientId,
              hospitalId: order.hospitalId,
              doctorId: order.doctorId,
              appointmentId: order.appointmentId,
            },
          },
        })

        return report
      })

      return res.status(201).json({
        message: 'Lab report uploaded successfully.',
        report: result,
      })
    } catch (error) {
      console.error('Upload lab report error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

labReportsRouter.get(
  '/orders/:orderId/reports',
  async (req: AuthenticatedLabRequest, res) => {
    try {
      const labId = req.user?.labId

      if (!labId) {
        return res.status(403).json({
          message: 'No lab assigned.',
        })
      }

      const order = await prisma.labOrder.findFirst({
        where: {
          id: req.params.orderId,
          labId,
          deletedAt: null,
        },
      })

      if (!order) {
        return res.status(404).json({
          message: 'Lab order not found.',
        })
      }

      const reports = await prisma.labReport.findMany({
        where: {
          labOrderId: order.id,
          labId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return res.json({
        reports,
      })
    } catch (error) {
      console.error('List lab reports error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

labReportsRouter.get('/reports/:id', async (req: AuthenticatedLabRequest, res) => {
  try {
    const labId = req.user?.labId

    if (!labId) {
      return res.status(403).json({
        message: 'No lab assigned.',
      })
    }

    const report = await prisma.labReport.findFirst({
      where: {
        id: req.params.id,
        labId,
        deletedAt: null,
      },
      include: {
        labOrder: {
          include: {
            items: true,
          },
        },
        lab: true,
        patient: true,
        hospital: true,
        doctor: true,
        appointment: true,
        encounter: true,
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
    console.error('Get lab report error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})