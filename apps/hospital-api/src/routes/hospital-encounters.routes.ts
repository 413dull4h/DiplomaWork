import { Router } from 'express'
import { z } from 'zod'
import { prisma, AppointmentStatus } from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalEncountersRouter = Router()

hospitalEncountersRouter.use(requireHospitalAuth)

const encounterSchema = z.object({
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
  prescription: z.string().optional(),
  followUpInstructions: z.string().optional(),
})

hospitalEncountersRouter.post(
  '/appointments/:appointmentId/encounter',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = encounterSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid encounter data.',
          errors: parsed.error.flatten(),
        })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: req.params.appointmentId,
          hospitalId,
          deletedAt: null,
        },
        include: {
          encounter: true,
          patient: true,
          doctor: true,
          department: true,
          hospital: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({
          message: 'Appointment not found.',
        })
      }

      if (appointment.encounter) {
        return res.status(409).json({
          message: 'Encounter already exists for this appointment.',
        })
      }

      if (appointment.status !== AppointmentStatus.CONFIRMED) {
        return res.status(400).json({
          message: `Only CONFIRMED appointments can create an encounter. Current status: ${appointment.status}`,
        })
      }

      const result = await prisma.$transaction(async (tx) => {
        const encounter = await tx.encounter.create({
          data: {
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            hospitalId: appointment.hospitalId,
            hospitalDoctorId: appointment.hospitalDoctorId,
            doctorId: appointment.doctorId,
            departmentId: appointment.departmentId,
            chiefComplaint: parsed.data.chiefComplaint,
            notes: parsed.data.notes,
            diagnosis: parsed.data.diagnosis,
            prescription: parsed.data.prescription,
            followUpInstructions: parsed.data.followUpInstructions,
          },
          include: {
            appointment: true,
            patient: true,
            hospital: true,
            doctor: true,
            department: true,
          },
        })

        await tx.appointment.update({
          where: {
            id: appointment.id,
          },
          data: {
            status: AppointmentStatus.COMPLETED,
          },
        })

        return encounter
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'CREATE_HOSPITAL_ENCOUNTER',
          entityType: 'ENCOUNTER',
          entityId: result.id,
          metadata: {
            hospitalId,
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
          },
        },
      })

      return res.status(201).json({
        message: 'Encounter created successfully.',
        encounter: result,
      })
    } catch (error) {
      console.error('Create encounter error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalEncountersRouter.get(
  '/patients/:patientId/records',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const encounters = await prisma.encounter.findMany({
        where: {
          hospitalId,
          patientId: req.params.patientId,
          deletedAt: null,
        },
        include: {
          appointment: true,
          patient: true,
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
      console.error('Hospital patient records error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalEncountersRouter.get(
  '/encounters/:id',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const encounter = await prisma.encounter.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          deletedAt: null,
        },
        include: {
          appointment: true,
          patient: true,
          hospital: true,
          doctor: true,
          department: true,
        },
      })

      if (!encounter) {
        return res.status(404).json({
          message: 'Encounter not found.',
        })
      }

      return res.json({
        encounter,
      })
    } catch (error) {
      console.error('Get hospital encounter error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

hospitalEncountersRouter.patch(
  '/encounters/:id',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = encounterSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid encounter data.',
          errors: parsed.error.flatten(),
        })
      }

      const existing = await prisma.encounter.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          deletedAt: null,
        },
      })

      if (!existing) {
        return res.status(404).json({
          message: 'Encounter not found.',
        })
      }

      const encounter = await prisma.encounter.update({
        where: {
          id: existing.id,
        },
        data: parsed.data,
        include: {
          appointment: true,
          patient: true,
          hospital: true,
          doctor: true,
          department: true,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'UPDATE_HOSPITAL_ENCOUNTER',
          entityType: 'ENCOUNTER',
          entityId: encounter.id,
          metadata: {
            hospitalId,
            patientId: encounter.patientId,
            appointmentId: encounter.appointmentId,
          },
        },
      })

      return res.json({
        message: 'Encounter updated successfully.',
        encounter,
      })
    } catch (error) {
      console.error('Update encounter error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)