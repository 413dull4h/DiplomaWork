import { z } from 'zod'

export const rejectOrderSchema = z.object({
  rejectionReason: z.string().min(2, 'Rejection reason is required.'),
})

export type RejectOrderFormValues = z.infer<typeof rejectOrderSchema>

export const reportUploadSchema = z.object({
  title: z.string().min(2, 'Report title is required.'),
  summary: z.string().optional(),
  status: z.enum(['DRAFT', 'FINAL', 'CORRECTED', 'CANCELLED']),
  resultData: z.string().optional(),
})

export type ReportUploadFormValues = z.infer<typeof reportUploadSchema>
