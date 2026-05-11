import { Router } from 'express'
import { z } from 'zod'
import {
  prisma,
  LabTestCategory,
  SampleType,
} from '@careos/database'
import {
  requireLabAuth,
  type AuthenticatedLabRequest,
} from '../middleware/require-lab-auth'

export const labTestsRouter = Router()

labTestsRouter.use(requireLabAuth)

const createLabTestSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
  category: z.nativeEnum(LabTestCategory).default(LabTestCategory.GENERAL),
  sampleType: z.nativeEnum(SampleType).default(SampleType.BLOOD),
  price: z.coerce.number().positive().optional(),
  turnaroundTimeHours: z.coerce.number().int().positive().optional(),
  patientInstructions: z.string().optional(),
  description: z.string().optional(),
})

const updateLabTestSchema = createLabTestSchema.partial().extend({
  isActive: z.boolean().optional(),
})

labTestsRouter.get('/', async (req: AuthenticatedLabRequest, res) => {
  try {
    const labId = req.user?.labId

    if (!labId) {
      return res.status(403).json({
        message: 'No lab assigned.',
      })
    }

    const tests = await prisma.labTest.findMany({
      where: {
        labId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return res.json({
      tests,
    })
  } catch (error) {
    console.error('List lab tests error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

labTestsRouter.post('/', async (req: AuthenticatedLabRequest, res) => {
  try {
    const labId = req.user?.labId

    if (!labId) {
      return res.status(403).json({
        message: 'No lab assigned.',
      })
    }

    const parsed = createLabTestSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid lab test data.',
        errors: parsed.error.flatten(),
      })
    }

    const existing = await prisma.labTest.findFirst({
      where: {
        labId,
        code: parsed.data.code,
        deletedAt: null,
      },
    })

    if (existing) {
      return res.status(409).json({
        message: 'A test with this code already exists in this lab.',
      })
    }

    const test = await prisma.labTest.create({
      data: {
        labId,
        name: parsed.data.name,
        code: parsed.data.code,
        category: parsed.data.category,
        sampleType: parsed.data.sampleType,
        price: parsed.data.price ? parsed.data.price.toString() : undefined,
        turnaroundTimeHours: parsed.data.turnaroundTimeHours,
        patientInstructions: parsed.data.patientInstructions,
        description: parsed.data.description,
      },
    })

    return res.status(201).json({
      message: 'Lab test created successfully.',
      test,
    })
  } catch (error) {
    console.error('Create lab test error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})

labTestsRouter.patch('/:id', async (req: AuthenticatedLabRequest, res) => {
  try {
    const labId = req.user?.labId

    if (!labId) {
      return res.status(403).json({
        message: 'No lab assigned.',
      })
    }

    const parsed = updateLabTestSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid lab test data.',
        errors: parsed.error.flatten(),
      })
    }

    const existing = await prisma.labTest.findFirst({
      where: {
        id: req.params.id,
        labId,
        deletedAt: null,
      },
    })

    if (!existing) {
      return res.status(404).json({
        message: 'Lab test not found.',
      })
    }

    if (parsed.data.code && parsed.data.code !== existing.code) {
      const duplicate = await prisma.labTest.findFirst({
        where: {
          labId,
          code: parsed.data.code,
          deletedAt: null,
          NOT: {
            id: existing.id,
          },
        },
      })

      if (duplicate) {
        return res.status(409).json({
          message: 'A test with this code already exists in this lab.',
        })
      }
    }

    const test = await prisma.labTest.update({
      where: {
        id: existing.id,
      },
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        category: parsed.data.category,
        sampleType: parsed.data.sampleType,
        price:
          parsed.data.price !== undefined
            ? parsed.data.price.toString()
            : undefined,
        turnaroundTimeHours: parsed.data.turnaroundTimeHours,
        patientInstructions: parsed.data.patientInstructions,
        description: parsed.data.description,
        isActive: parsed.data.isActive,
      },
    })

    return res.json({
      message: 'Lab test updated successfully.',
      test,
    })
  } catch (error) {
    console.error('Update lab test error:', error)

    return res.status(500).json({
      message: 'Something went wrong.',
    })
  }
})