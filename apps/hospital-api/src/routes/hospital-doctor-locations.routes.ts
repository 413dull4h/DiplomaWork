import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'

export const hospitalDoctorLocationsRouter = Router()

hospitalDoctorLocationsRouter.use(requireHospitalAuth)

const assignDoctorLocationSchema = z.object({
  locationId: z.string().uuid().nullable(),
})

hospitalDoctorLocationsRouter.patch(
  '/doctors/:hospitalDoctorId/location',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({
          message: 'No hospital assigned.',
        })
      }

      const parsed = assignDoctorLocationSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid doctor location data.',
          errors: parsed.error.flatten(),
        })
      }

      const hospitalDoctor = await prisma.hospitalDoctor.findFirst({
        where: {
          id: req.params.hospitalDoctorId,
          hospitalId,
          isActive: true,
          doctor: {
            deletedAt: null,
          },
        },
        include: {
          doctor: true,
          department: true,
          location: {
            include: {
              address: true,
            },
          },
        },
      })

      if (!hospitalDoctor) {
        return res.status(404).json({
          message: 'Hospital doctor not found.',
        })
      }

      if (parsed.data.locationId) {
        const location = await prisma.hospitalLocation.findFirst({
          where: {
            id: parsed.data.locationId,
            hospitalId,
            deletedAt: null,
            isActive: true,
          },
        })

        if (!location) {
          return res.status(404).json({
            message: 'Hospital location not found.',
          })
        }
      }

      const updatedHospitalDoctor = await prisma.hospitalDoctor.update({
        where: {
          id: hospitalDoctor.id,
        },
        data: {
          locationId: parsed.data.locationId,
        },
        include: {
          doctor: true,
          department: {
            include: {
              location: {
                include: {
                  address: true,
                },
              },
            },
          },
          location: {
            include: {
              address: true,
            },
          },
          availabilities: {
            where: {
              deletedAt: null,
            },
            orderBy: [
              {
                dayOfWeek: 'asc',
              },
              {
                startTime: 'asc',
              },
            ],
          },
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'ASSIGN_DOCTOR_LOCATION',
          entityType: 'HOSPITAL_DOCTOR',
          entityId: updatedHospitalDoctor.id,
          metadata: {
            hospitalId,
            hospitalDoctorId: updatedHospitalDoctor.id,
            doctorId: updatedHospitalDoctor.doctorId,
            doctorName: updatedHospitalDoctor.doctor.fullName,
            departmentId: updatedHospitalDoctor.departmentId,
            locationId: updatedHospitalDoctor.locationId,
          },
        },
      })

      return res.json({
        message: 'Doctor location updated successfully.',
        hospitalDoctor: updatedHospitalDoctor,
      })
    } catch (error) {
      console.error('Assign doctor location error:', error)

      return res.status(500).json({
        message: 'Something went wrong.',
      })
    }
  }
)