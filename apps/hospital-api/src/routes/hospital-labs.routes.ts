import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import {
  prisma,
  LabDocumentType,
  LabStaffRole,
  LabStatus,
  LabType,
  RoleName,
  UserStatus,
} from '@careos/database'
import {
  requireHospitalAuth,
  type AuthenticatedHospitalRequest,
} from '../middleware/require-hospital-auth'
import { labDocumentUpload } from '../utils/lab-document-upload'

export const hospitalLabsRouter = Router()

hospitalLabsRouter.use(requireHospitalAuth)

const createAddressSchema = z.object({
  line1: z.string().min(2),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
})

const updateAddressSchema = createAddressSchema.partial()

const createLabSchema = z.object({
  name: z.string().min(2),
  legalName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  licenseNumber: z.string().optional(),
  accreditation: z.string().optional(),
  workingHours: z.string().optional(),
  description: z.string().optional(),
  address: createAddressSchema.optional(),
})

const updateLabSchema = createLabSchema.partial().extend({
  isActive: z.boolean().optional(),
  address: updateAddressSchema.optional(),
})

const createLabAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
})

const uploadDocSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.nativeEnum(LabDocumentType).default(LabDocumentType.OTHER),
})

async function getHospitalLab(hospitalId: string, labId: string) {
  return prisma.lab.findFirst({
    where: {
      id: labId,
      hospitalId,
      deletedAt: null,
    },
    include: {
      address: true,
    },
  })
}

function cleanAddressData(address: z.infer<typeof createAddressSchema>) {
  return {
    line1: address.line1,
    line2: address.line2 || undefined,
    city: address.city,
    state: address.state || undefined,
    postalCode: address.postalCode || undefined,
    country: address.country,
    latitude: address.latitude,
    longitude: address.longitude,
  }
}

function cleanPartialAddressData(address: z.infer<typeof updateAddressSchema>) {
  return {
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    latitude: address.latitude,
    longitude: address.longitude,
  }
}

hospitalLabsRouter.get('/labs', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({ message: 'No hospital assigned.' })
    }

    const labs = await prisma.lab.findMany({
      where: {
        hospitalId,
        deletedAt: null,
      },
      include: {
        address: true,
        staff: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                primaryRole: true,
                status: true,
              },
            },
          },
        },
        tests: {
          where: { deletedAt: null },
        },
        orders: true,
        reports: true,
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.json({ labs })
  } catch (error) {
    console.error('Hospital list labs error:', error)
    return res.status(500).json({ message: 'Something went wrong.' })
  }
})

hospitalLabsRouter.post('/labs', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({ message: 'No hospital assigned.' })
    }

    const parsed = createLabSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid lab data.',
        errors: parsed.error.flatten(),
      })
    }

    const lab = await prisma.$transaction(async (tx) => {
      let addressId: string | undefined

      if (parsed.data.address) {
        const address = await tx.address.create({
          data: cleanAddressData(parsed.data.address),
        })

        addressId = address.id
      }

      return tx.lab.create({
        data: {
          hospitalId,
          addressId,
          name: parsed.data.name,
          legalName: parsed.data.legalName,
          type: LabType.INTERNAL,
          status: LabStatus.APPROVED,
          contactEmail: parsed.data.contactEmail,
          contactPhone: parsed.data.contactPhone,
          licenseNumber: parsed.data.licenseNumber,
          accreditation: parsed.data.accreditation,
          workingHours: parsed.data.workingHours,
          description: parsed.data.description,
          isActive: true,
        },
        include: {
          address: true,
        },
      })
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_INTERNAL_LAB',
        entityType: 'LAB',
        entityId: lab.id,
        metadata: {
          hospitalId,
          labName: lab.name,
          addressId: lab.addressId,
        },
      },
    })

    return res.status(201).json({
      message: 'Lab created successfully.',
      lab,
    })
  } catch (error) {
    console.error('Hospital create lab error:', error)
    return res.status(500).json({ message: 'Something went wrong.' })
  }
})

hospitalLabsRouter.get('/labs/:id', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({ message: 'No hospital assigned.' })
    }

    const lab = await prisma.lab.findFirst({
      where: {
        id: req.params.id,
        hospitalId,
        deletedAt: null,
      },
      include: {
        address: true,
        staff: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                primaryRole: true,
                status: true,
              },
            },
          },
        },
        tests: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
        },
        reports: {
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found.' })
    }

    return res.json({ lab })
  } catch (error) {
    console.error('Hospital get lab error:', error)
    return res.status(500).json({ message: 'Something went wrong.' })
  }
})

hospitalLabsRouter.patch('/labs/:id', async (req: AuthenticatedHospitalRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId

    if (!hospitalId) {
      return res.status(403).json({ message: 'No hospital assigned.' })
    }

    const parsed = updateLabSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid lab data.',
        errors: parsed.error.flatten(),
      })
    }

    const existing = await getHospitalLab(hospitalId, req.params.id)

    if (!existing) {
      return res.status(404).json({ message: 'Lab not found.' })
    }

    const { address, ...labData } = parsed.data

    const lab = await prisma.$transaction(async (tx) => {
      let addressId = existing.addressId

      if (address) {
        if (addressId) {
          await tx.address.update({
            where: { id: addressId },
            data: cleanPartialAddressData(address),
          })
        } else {
          if (!address.line1 || !address.city || !address.country) {
            throw new Error(
              'Creating a new lab address requires line1, city, and country.'
            )
          }

          const newAddress = await tx.address.create({
            data: cleanAddressData({
              line1: address.line1,
              city: address.city,
              country: address.country,
              line2: address.line2,
              state: address.state,
              postalCode: address.postalCode,
              latitude: address.latitude,
              longitude: address.longitude,
            }),
          })

          addressId = newAddress.id
        }
      }

      return tx.lab.update({
        where: { id: existing.id },
        data: {
          ...labData,
          addressId,
        },
        include: {
          address: true,
        },
      })
    })

    return res.json({
      message: 'Lab updated successfully.',
      lab,
    })
  } catch (error) {
    console.error('Hospital update lab error:', error)

    const message =
      error instanceof Error
        ? error.message
        : 'Something went wrong.'

    return res.status(500).json({ message })
  }
})

hospitalLabsRouter.post(
  '/labs/:id/admins',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({ message: 'No hospital assigned.' })
      }

      const parsed = createLabAdminSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid lab admin data.',
          errors: parsed.error.flatten(),
        })
      }

      const lab = await getHospitalLab(hospitalId, req.params.id)

      if (!lab) {
        return res.status(404).json({ message: 'Lab not found.' })
      }

      const existingUser = await prisma.user.findUnique({
        where: {
          email: parsed.data.email,
        },
      })

      if (existingUser) {
        return res.status(409).json({
          message: 'A user with this email already exists.',
        })
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, 12)

      const result = await prisma.$transaction(async (tx) => {
        const role = await tx.role.upsert({
          where: { name: RoleName.LAB_ADMIN },
          update: {},
          create: {
            name: RoleName.LAB_ADMIN,
            description: 'Lab administrator',
          },
        })

        const user = await tx.user.create({
          data: {
            email: parsed.data.email,
            phone: parsed.data.phone,
            passwordHash,
            status: UserStatus.ACTIVE,
            primaryRole: RoleName.LAB_ADMIN,
            userRoles: {
              create: {
                roleId: role.id,
              },
            },
          },
        })

        const staff = await tx.labStaff.create({
          data: {
            userId: user.id,
            labId: lab.id,
            staffRole: LabStaffRole.LAB_ADMIN,
            isActive: true,
          },
        })

        return { user, staff }
      })

      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'CREATE_LAB_ADMIN',
          entityType: 'LAB',
          entityId: lab.id,
          metadata: {
            hospitalId,
            labId: lab.id,
            labAdminUserId: result.user.id,
            email: result.user.email,
          },
        },
      })

      return res.status(201).json({
        message: 'Lab admin created successfully.',
        labAdmin: {
          userId: result.user.id,
          email: result.user.email,
          staffId: result.staff.id,
          labId: lab.id,
        },
      })
    } catch (error) {
      console.error('Hospital create lab admin error:', error)
      return res.status(500).json({ message: 'Something went wrong.' })
    }
  }
)

hospitalLabsRouter.post(
  '/labs/:id/documents',
  labDocumentUpload.single('document'),
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId
      const uploadedByUserId = req.user?.userId

      if (!hospitalId || !uploadedByUserId) {
        return res.status(403).json({ message: 'No hospital assigned.' })
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Document file is required.' })
      }

      const parsed = uploadDocSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid document data.',
          errors: parsed.error.flatten(),
        })
      }

      const lab = await getHospitalLab(hospitalId, req.params.id)

      if (!lab) {
        return res.status(404).json({ message: 'Lab not found.' })
      }

      const document = await prisma.labDocument.create({
        data: {
          labId: lab.id,
          uploadedByUserId,
          title: parsed.data.title,
          description: parsed.data.description,
          type: parsed.data.type,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          fileUrl: `/uploads/lab-documents/${req.file.filename}`,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: uploadedByUserId,
          action: 'UPLOAD_LAB_DOCUMENT',
          entityType: 'LAB_DOCUMENT',
          entityId: document.id,
          metadata: {
            hospitalId,
            labId: lab.id,
            type: document.type,
            fileUrl: document.fileUrl,
          },
        },
      })

      return res.status(201).json({
        message: 'Lab document uploaded successfully.',
        document,
      })
    } catch (error) {
      console.error('Hospital upload lab document error:', error)
      return res.status(500).json({ message: 'Something went wrong.' })
    }
  }
)

hospitalLabsRouter.get(
  '/labs/:id/documents',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({ message: 'No hospital assigned.' })
      }

      const lab = await getHospitalLab(hospitalId, req.params.id)

      if (!lab) {
        return res.status(404).json({ message: 'Lab not found.' })
      }

      const documents = await prisma.labDocument.findMany({
        where: {
          labId: lab.id,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return res.json({ documents })
    } catch (error) {
      console.error('Hospital list lab documents error:', error)
      return res.status(500).json({ message: 'Something went wrong.' })
    }
  }
)

hospitalLabsRouter.delete(
  '/labs/:id/documents/:documentId',
  async (req: AuthenticatedHospitalRequest, res) => {
    try {
      const hospitalId = req.user?.hospitalId

      if (!hospitalId) {
        return res.status(403).json({ message: 'No hospital assigned.' })
      }

      const lab = await getHospitalLab(hospitalId, req.params.id)

      if (!lab) {
        return res.status(404).json({ message: 'Lab not found.' })
      }

      const document = await prisma.labDocument.findFirst({
        where: {
          id: req.params.documentId,
          labId: lab.id,
          deletedAt: null,
        },
      })

      if (!document) {
        return res.status(404).json({ message: 'Lab document not found.' })
      }

      await prisma.labDocument.update({
        where: { id: document.id },
        data: {
          deletedAt: new Date(),
        },
      })

      return res.json({
        message: 'Lab document deleted successfully.',
      })
    } catch (error) {
      console.error('Hospital delete lab document error:', error)
      return res.status(500).json({ message: 'Something went wrong.' })
    }
  }
)