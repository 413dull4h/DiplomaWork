import { Router } from 'express'
import { prisma } from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'
import {
  requireDoctorAuth,
  type AuthenticatedDoctorRequest,
} from '../middleware/require-doctor-auth'

export const hospitalLabReportsRouter = Router()
export const doctorLabReportsRouter = Router()

hospitalLabReportsRouter.use(requireHospitalAuth)
doctorLabReportsRouter.use(requireDoctorAuth)

/**
 * Hospital staff/admin: list lab reports for this hospital.
 */
hospitalLabReportsRouter.get(
  '/lab-reports',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const reports = await prisma.labReport.findMany({
        where: {
          hospitalId,
          deletedAt: null,
        },
        include: {
          lab: true,
          patient: true,
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
      console.error('Hospital list lab reports error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

/**
 * Hospital staff/admin: get one lab report for this hospital.
 */
hospitalLabReportsRouter.get(
  '/lab-reports/:id',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const report = await prisma.labReport.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          deletedAt: null,
        },
        include: {
          lab: true,
          patient: true,
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
      console.error('Hospital get lab report error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

/**
 * Doctor: list lab reports for reports connected to this doctor.
 */
doctorLabReportsRouter.get(
  '/lab-reports',
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

      const reports = await prisma.labReport.findMany({
        where: {
          hospitalId,
          doctorId,
          labOrder: {
            hospitalDoctorId,
          },
          deletedAt: null,
        },
        include: {
          lab: true,
          patient: true,
          hospital: true,
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
      console.error('Doctor list lab reports error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)

/**
 * Doctor: get one lab report connected to this doctor.
 */
doctorLabReportsRouter.get(
  '/lab-reports/:id',
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

      const report = await prisma.labReport.findFirst({
        where: {
          id: req.params.id,
          hospitalId,
          doctorId,
          labOrder: {
            hospitalDoctorId,
          },
          deletedAt: null,
        },
        include: {
          lab: true,
          patient: true,
          hospital: true,
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
      console.error('Doctor get lab report error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)