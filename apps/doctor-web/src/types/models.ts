export type RoleName =
  | 'PATIENT'
  | 'DOCTOR'
  | 'HOSPITAL_ADMIN'
  | 'HOSPITAL_STAFF'
  | 'PLATFORM_ADMIN'
  | 'SUPER_ADMIN'

export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED'
export type HospitalStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED'
export type AppointmentType = 'IN_PERSON' | 'TELECONSULT'
export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
export type AvailabilityAppointmentType = 'IN_PERSON' | 'TELECONSULT' | 'BOTH'
export type DayOfWeek =
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'

export type DoctorUser = {
  id: string
  email: string
  phone?: string | null
  primaryRole: RoleName
  status: UserStatus
  lastLoginAt?: string | null
  createdAt?: string
}

export type PatientUser = {
  id: string
  email?: string | null
  phone?: string | null
  status?: UserStatus
}

export type Address = {
  id: string
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
}

export type TeleconsultSession = {
  id: string
  appointmentId: string
  patientId: string
  hospitalId: string
  hospitalDoctorId: string
  doctorId: string
  providerType: string
  providerName?: string | null
  joinUrl: string
  hostUrl?: string | null
  status: string
  createdByUserId?: string | null
  startedAt?: string | null
  endedAt?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type Patient = {
  id: string
  userId?: string | null
  fullName: string
  dateOfBirth?: string | null
  gender?: string | null
  phone?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  medicalHistory?: string | null
  allergies?: string | null
  currentMedications?: string | null
  user?: PatientUser | null
  primaryAddress?: Address | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type Doctor = {
  id: string
  userId?: string | null
  fullName: string
  profileImageUrl?: string | null
  specialization?: string | null
  licenseNumber?: string | null
  yearsExperience?: number | null
  bio?: string | null
  consultationFee?: number | string | null
  languages?: string[] | string | null
  qualifications?: string[] | string | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  user?: DoctorUser | null
}

export type Hospital = {
  id: string
  name: string
  legalName?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  licenseNumber?: string | null
  status: HospitalStatus
  timeZone?: string | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type Department = {
  id: string
  hospitalId: string
  name: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type DoctorAvailability = {
  id: string
  hospitalDoctorId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  appointmentType: AvailabilityAppointmentType
  slotDurationMinutes: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type HospitalDoctor = {
  id: string
  hospitalId: string
  doctorId: string
  departmentId?: string | null
  isActive: boolean
  doctor?: Doctor
  hospital?: Hospital
  department?: Department | null
  availabilities?: DoctorAvailability[]
  createdAt?: string
  updatedAt?: string
}

export type Encounter = {
  id: string
  appointmentId: string
  patientId: string
  hospitalId: string
  hospitalDoctorId?: string | null
  doctorId: string
  departmentId?: string | null
  chiefComplaint?: string | null
  notes?: string | null
  diagnosis?: string | null
  prescription?: string | null
  followUpInstructions?: string | null
  appointment?: Appointment | null
  patient?: Patient | null
  hospital?: Hospital | null
  doctor?: Doctor | null
  department?: Department | null
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
}

export type Appointment = {
  id: string
  patientId: string
  hospitalId: string
  hospitalDoctorId: string
  teleconsultSession?: TeleconsultSession | null
  doctorId: string
  departmentId?: string | null
  appointmentType: AppointmentType
  scheduledDate?: string
  scheduledStart: string
  scheduledEnd: string
  status: AppointmentStatus
  reason?: string | null
  cancellationReason?: string | null
  patient?: Patient | null
  hospital?: Hospital | null
  hospitalDoctor?: HospitalDoctor | null
  doctor?: Doctor | null
  department?: Department | null
  encounter?: Encounter | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type DoctorLoginResponse = {
  message: string
  token: string
  user: DoctorUser
  doctor: Doctor
  hospital: Hospital
  department?: Department | null
  hospitalDoctorId: string
}

export type DoctorMeResponse = {
  user: DoctorUser | null
  doctor: Doctor
  hospital: Hospital
  department?: Department | null
  hospitalDoctorId: string
}

export type DoctorProfileResponse = {
  hospitalDoctor: HospitalDoctor
  doctor: Doctor
  hospital: Hospital
  department?: Department | null
  availabilities: DoctorAvailability[]
}

export type UpdateDoctorProfilePayload = {
  fullName: string
  bio?: string
  yearsExperience?: number
  consultationFee?: number
}

export type UpdateDoctorProfileResponse = {
  message: string
  doctor: Doctor
}

export type AvailabilityResponse = {
  availabilities: DoctorAvailability[]
}

export type DoctorDashboardResponse = {
  summary: {
    requested: number
    confirmed: number
    completed: number
    today: number
  }
  todayAppointments: Appointment[]
  upcomingAppointments: Appointment[]
}

export type DoctorAppointmentsResponse = {
  appointments: Appointment[]
}

export type DoctorAppointmentResponse = {
  appointment: Appointment
}

export type CreateEncounterPayload = {
  chiefComplaint?: string
  notes?: string
  diagnosis?: string
  prescription?: string
  followUpInstructions?: string
}

export type CreateEncounterResponse = {
  message: string
  encounter: Encounter
}

export type PatientRecordsResponse = {
  encounters: Encounter[]
}

export type ApiErrorShape = {
  message: string
  status?: number
  errors?: unknown
}
