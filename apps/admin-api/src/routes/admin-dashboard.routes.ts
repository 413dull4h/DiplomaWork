import { Router } from 'express'
import {
  prisma,
  AppointmentStatus,
  HospitalStatus,
} from '@careos/database'
import { requireAdminAuth } from '../middleware/require-admin-auth'

export const adminDashboardRouter = Router()

adminDashboardRouter.use(requireAdminAuth)

adminDashboardRouter.get('/', async (_req, res) => {
  try {
    const [
      totalUsers,
      totalPatients,
      totalHospitals,
      approvedHospitals,
      pendingHospitals,
      suspendedHospitals,
      rejectedHospitals,
      totalDoctors,
      totalDepartments,
      totalAppointments,
      requestedAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      totalEncounters,
      recentHospitals,
      recentAppointments,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.patient.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.hospital.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.hospital.count({
        where: {
          status: HospitalStatus.APPROVED,
          deletedAt: null,
        },
      }),

      prisma.hospital.count({
        where: {
          status: HospitalStatus.PENDING,
          deletedAt: null,
        },
      }),

      prisma.hospital.count({
        where: {
          status: HospitalStatus.SUSPENDED,
          deletedAt: null,
        },
      }),

      prisma.hospital.count({
        where: {
          status: HospitalStatus.REJECTED,
          deletedAt: null,
        },
      }),

      prisma.doctor.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.hospitalDepartment.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.appointment.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.appointment.count({
        where: {
          status: AppointmentStatus.REQUESTED,
          deletedAt: null,
        },
      }),

      prisma.appointment.count({
        where: {
          status: AppointmentStatus.CONFIRMED,
          deletedAt: null,
        },
      }),

      prisma.appointment.count({
        where: {
          status: AppointmentStatus.COMPLETED,
          deletedAt: null,
        },
      }),

      prisma.appointment.count({
        where: {
          status: AppointmentStatus.CANCELLED,
          deletedAt: null,
        },
      }),

      prisma.appointment.count({
        where: {
          status: AppointmentStatus.NO_SHOW,
          deletedAt: null,
        },
      }),

      prisma.encounter.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.hospital.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          address: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),

      prisma.appointment.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          patient: true,
          hospital: true,
          doctor: true,
          department: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),

      prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              primaryRole: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ])

    return res.json({
      summary: {
        users: {
          total: totalUsers,
          patients: totalPatients,
        },
        hospitals: {
          total: totalHospitals,
          approved: approvedHospitals,
          pending: pendingHospitals,
          suspended: suspendedHospitals,
          rejected: rejectedHospitals,
        },
        clinical: {
          doctors: totalDoctors,
          departments: totalDepartments,
          encounters: totalEncounters,
        },
        appointments: {
          total: totalAppointments,
          requested: requestedAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          noShow: noShowAppointments,
        },
      },
      recent: {
        hospitals: recentHospitals,
        appointments: recentAppointments,
        auditLogs: recentAuditLogs,
      },
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})
