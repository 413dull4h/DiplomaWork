import { z } from 'zod'

export const editDoctorProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  bio: z.string().max(1000, 'Bio must be 1000 characters or fewer.').optional().or(z.literal('')),
  yearsExperience: z.coerce.number().min(0, 'Years of experience cannot be negative.').max(70, 'Years of experience cannot exceed 70.'),
  consultationFee: z.coerce.number().min(0, 'Consultation fee cannot be negative.'),
})

export type EditDoctorProfileForm = z.infer<typeof editDoctorProfileSchema>
