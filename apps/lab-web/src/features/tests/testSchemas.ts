import { z } from 'zod'

export const testCategories = [
  'PATHOLOGY',
  'RADIOLOGY',
  'CARDIOLOGY',
  'MICROBIOLOGY',
  'BIOCHEMISTRY',
  'HEMATOLOGY',
  'IMMUNOLOGY',
  'GENERAL',
  'OTHER',
] as const

export const sampleTypes = ['BLOOD', 'URINE', 'STOOL', 'SWAB', 'SPUTUM', 'TISSUE', 'IMAGING', 'ECG', 'OTHER'] as const

export const testSchema = z.object({
  name: z.string().min(2, 'Test name is required.'),
  code: z.string().min(1, 'Test code is required.'),
  category: z.enum(testCategories),
  sampleType: z.enum(sampleTypes),
  price: z.coerce.number().positive().optional().or(z.literal('').transform(() => undefined)),
  turnaroundTimeHours: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  patientInstructions: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type TestFormValues = z.infer<typeof testSchema>
