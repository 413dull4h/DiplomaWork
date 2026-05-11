import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  AppointmentStatus,
  LabOrderSource,
  LabOrderStatus,
  LabStatus,
  LabType,
  SampleCollectionType,
} from '@careos/database'
import {
  requireDoctorAuth,
  type AuthenticatedDoctorRequest,
} from '../middleware/require-doctor-auth'

export const doctorLabOrdersRouter = Router()

doctorLabOrdersRouter.use(requireDoctorAuth)

const createLabOrderSchema = z.object({
  labId: z.string().uuid(),
  testIds: z.array(z.string().uuid()).min(1),
  collectionType: z
    .nativeEnum(SampleCollectionType)
    .default(SampleCollectionType.IN_CENTER),
  reason: z.string().optional(),
  clinicalNotes: z.string().optional(),
  scheduledAt: z.coerce.date().optional(),
})

function canCreateLabOrder(status: AppointmentStatus) {
  return [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED].includes(
    status
  )
}

function getDoctorScope(req: AuthenticatedDoctorRequest) {
  return {
    hospitalId: req.user?.hospitalId,
    doctorId: req.user?.doctorId,
    hospitalDoctorId: req.user?.hospitalDoctorId,
    userId: req.user?.userId,
  }
}

function isDoctorScopeReady(scope: ReturnType<typeof getDoctorScope>) {
  return Boolean(
    scope.hospitalId &&
      scope.doctorId &&
      scope.hospitalDoctorId &&
      scope.userId
  )
}

/**
 * GET /hospital/doctor/labs
 *
 * Doctor can view approved active labs available to their hospital:
 * - internal labs owned by the doctor hospital
 * - partner labs
 */
doctorLabOrdersRouter.get(
  '/labs',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const scope = getDoctorScope(req)

      if (!isDoctorScopeReady(scope)) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const labs = await prisma.lab.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          status: LabStatus.APPROVED,
          OR: [
            {
              hospitalId: scope.hospitalId,
            },
            {
              type: LabType.PARTNER,
            },
          ],
        },
        include: {
          address: true,
          tests: {
            where: {
              deletedAt: null,
              isActive: true,
            },
            orderBy: {
              name: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return res.json({
        labs,
      })
    } catch (error) {
      console.error('Doctor list labs error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

/**
 * GET /hospital/doctor/labs/:labId/tests
 *
 * Doctor can view test catalog for an available approved lab.
 */
doctorLabOrdersRouter.get(
  '/labs/:labId/tests',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const scope = getDoctorScope(req)

      if (!isDoctorScopeReady(scope)) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const lab = await prisma.lab.findFirst({
        where: {
          id: req.params.labId,
          deletedAt: null,
          isActive: true,
          status: LabStatus.APPROVED,
          OR: [
            {
              hospitalId: scope.hospitalId,
            },
            {
              type: LabType.PARTNER,
            },
          ],
        },
        include: {
          address: true,
        },
      })

      if (!lab) {
        return res.status(404).json({
          message: 'Approved internal/partner lab not found.',
        })
      }

      const tests = await prisma.labTest.findMany({
        where: {
          labId: lab.id,
          deletedAt: null,
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      })

      return res.json({
        lab,
        tests,
      })
    } catch (error) {
      console.error('Doctor list lab tests error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

/**
 * POST /hospital/doctor/appointments/:appointmentId/lab-orders
 *
 * Doctor creates lab order for their own appointment.
 */
doctorLabOrdersRouter.post(
  '/appointments/:appointmentId/lab-orders',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const scope = getDoctorScope(req)

      if (!isDoctorScopeReady(scope)) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const hospitalId = scope.hospitalId!
      const doctorId = scope.doctorId!
      const hospitalDoctorId = scope.hospitalDoctorId!
      const requestedByUserId = scope.userId!

      const parsed = createLabOrderSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid lab order data.',
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
          patient: true,
          hospital: true,
          doctor: true,
          hospitalDoctor: true,
          encounter: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found for this doctor.',
        })
      }

      if (!canCreateLabOrder(appointment.status)) {
        return res.status(400).json({
          message: `Lab orders can only be created for CONFIRMED or COMPLETED appointments. Current status: ${appointment.status}`,
        })
      }

      const lab = await prisma.lab.findFirst({
        where: {
          id: parsed.data.labId,
          status: LabStatus.APPROVED,
          isActive: true,
          deletedAt: null,
          OR: [
            {
              hospitalId,
            },
            {
              type: LabType.PARTNER,
            },
          ],
        },
      })

      if (!lab) {
        return res.status(404).json({
          message: 'Approved internal/partner lab not found.',
        })
      }

      const uniqueTestIds = [...new Set(parsed.data.testIds)]

      const tests = await prisma.labTest.findMany({
        where: {
          id: {
            in: uniqueTestIds,
          },
          labId: lab.id,
          isActive: true,
          deletedAt: null,
        },
      })

      if (tests.length !== uniqueTestIds.length) {
        return res.status(400).json({
          message: 'One or more selected tests are invalid for this lab.',
        })
      }

      const labOrder = await prisma.labOrder.create({
        data: {
          labId: lab.id,
          patientId: appointment.patientId,
          hospitalId: appointment.hospitalId,
          doctorId: appointment.doctorId,
          hospitalDoctorId: appointment.hospitalDoctorId,
          appointmentId: appointment.id,
          encounterId: appointment.encounter?.id,
          source: LabOrderSource.DOCTOR,
          status: LabOrderStatus.REQUESTED,
          collectionType: parsed.data.collectionType,
          requestedByUserId,
          reason: parsed.data.reason,
          clinicalNotes: parsed.data.clinicalNotes,
          scheduledAt: parsed.data.scheduledAt,
          items: {
            create: tests.map((test) => ({
              labTestId: test.id,
              testName: test.name,
              testCode: test.code,
              price: test.price,
            })),
          },
        },
        include: {
          lab: true,
          patient: true,
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

      await prisma.auditLog.create({
        data: {
          userId: requestedByUserId,
          action: 'CREATE_DOCTOR_LAB_ORDER',
          entityType: 'LAB_ORDER',
          entityId: labOrder.id,
          metadata: {
            hospitalId,
            doctorId,
            hospitalDoctorId,
            appointmentId: appointment.id,
            labId: lab.id,
            testIds: uniqueTestIds,
          },
        },
      })

      return res.status(201).json({
        message: 'Lab order created successfully.',
        labOrder,
      })
    } catch (error) {
      console.error('Doctor create lab order error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

/**
 * GET /hospital/doctor/appointments/:appointmentId/lab-orders
 *
 * Doctor lists lab orders for their own appointment.
 */
doctorLabOrdersRouter.get(
  '/appointments/:appointmentId/lab-orders',
  async (req: AuthenticatedDoctorRequest, res) => {
    try {
      const scope = getDoctorScope(req)

      if (!isDoctorScopeReady(scope)) {
        return res.status(403).json({
          message: 'Doctor account is not fully assigned.',
        })
      }

      const hospitalId = scope.hospitalId!
      const doctorId = scope.doctorId!
      const hospitalDoctorId = scope.hospitalDoctorId!

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

      const labOrders = await prisma.labOrder.findMany({
        where: {
          appointmentId: appointment.id,
          hospitalId,
          doctorId,
          hospitalDoctorId,
          deletedAt: null,
        },
        include: {
          lab: {
            include: {
              address: true,
            },
          },
          patient: true,
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
      console.error('Doctor list appointment lab orders error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)