export type ApiEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED'
export type RoleName =
  | 'PATIENT'
  | 'DOCTOR'
  | 'LAB_ADMIN'
  | 'LAB_STAFF'
  | 'LAB_TECHNICIAN'
  | 'HOSPITAL_ADMIN'
  | 'HOSPITAL_STAFF'
  | 'PLATFORM_ADMIN'
  | 'SUPER_ADMIN'

export type LabStaffRole = 'LAB_ADMIN' | 'LAB_TECHNICIAN' | 'SAMPLE_COLLECTOR' | 'REPORT_MANAGER'
export type LabStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED'
export type LabType = 'INTERNAL' | 'INDEPENDENT' | 'PARTNER'
export type TestCategory =
  | 'PATHOLOGY'
  | 'RADIOLOGY'
  | 'CARDIOLOGY'
  | 'MICROBIOLOGY'
  | 'BIOCHEMISTRY'
  | 'HEMATOLOGY'
  | 'IMMUNOLOGY'
  | 'GENERAL'
  | 'OTHER'
export type SampleType = 'BLOOD' | 'URINE' | 'STOOL' | 'SWAB' | 'SPUTUM' | 'TISSUE' | 'IMAGING' | 'ECG' | 'OTHER'

export type LabOrderSource = 'DOCTOR' | 'HOSPITAL' | 'PATIENT_DIRECT'
export type LabOrderStatus =
  | 'NEW'
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'SAMPLE_COLLECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'MISSED'
export type SampleCollectionType = 'IN_CENTER' | 'HOME_COLLECTION'
export type LabReportStatus = 'DRAFT' | 'FINAL' | 'CORRECTED' | 'CANCELLED'
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED'

export type AuthUser = {
  id: string
  email: string
  phone?: string | null
  primaryRole: RoleName
  status: UserStatus
  lastLoginAt?: string | null
}

export type Address = {
  id: string
  line1: string
  line2?: string | null
  city: string
  state?: string | null
  postalCode?: string | null
  country: string
  latitude?: number | null
  longitude?: number | null
}

export type HospitalSummary = {
  id: string
  name: string
  status?: string
  contactEmail?: string | null
  contactPhone?: string | null
}

export type LabProfile = {
  id: string
  hospitalId?: string | null
  addressId?: string | null
  name: string
  legalName?: string | null
  type: LabType
  status: LabStatus
  contactPhone?: string | null
  contactEmail?: string | null
  licenseNumber?: string | null
  accreditation?: string | null
  workingHours?: string | null
  description?: string | null
  isActive: boolean
  address?: Address | null
  hospital?: HospitalSummary | null
  staff?: LabStaff[]
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type LabStaff = {
  id: string
  userId: string
  labId: string
  staffRole: LabStaffRole
  isActive: boolean
  user?: AuthUser
}

export type AuthResponse = {
  message?: string
  token: string
  user: AuthUser
  lab: LabProfile
  staff: Pick<LabStaff, 'id' | 'staffRole'>
}

export type TestCatalogItem = {
  id: string
  labId: string
  name: string
  code: string
  category: TestCategory
  sampleType: SampleType
  price?: string | number | null
  turnaroundTimeHours?: number | null
  patientInstructions?: string | null
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type PatientSummary = {
  id: string
  userId: string
  fullName: string
  dateOfBirth?: string | null
  gender?: string | null
  phone?: string | null
  profileImageUrl?: string | null
  medicalHistory?: string | null
  allergies?: string | null
  currentMedications?: string | null
}

export type DoctorSummary = {
  id: string
  fullName: string
  specialization?: string | null
  profileImageUrl?: string | null
  licenseNumber?: string | null
}

export type AppointmentSummary = {
  id: string
  appointmentType: 'IN_PERSON' | 'TELECONSULT'
  scheduledDate: string
  scheduledStart: string
  scheduledEnd: string
  status: string
  reason?: string | null
}

export type EncounterSummary = {
  id: string
  chiefComplaint?: string | null
  notes?: string | null
  diagnosis?: string | null
  prescription?: string | null
  followUpInstructions?: string | null
}

export type LabOrderItem = {
  id: string
  labOrderId: string
  labTestId: string
  testName: string
  testCode?: string | null
  price?: string | number | null
  labTest?: TestCatalogItem
}

export type LabReport = {
  id: string
  labOrderId: string
  labId: string
  patientId: string
  hospitalId?: string | null
  doctorId?: string | null
  appointmentId?: string | null
  encounterId?: string | null
  uploadedByUserId?: string | null
  title: string
  summary?: string | null
  status: LabReportStatus
  fileName?: string | null
  originalName?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  fileUrl?: string | null
  resultData?: unknown
  finalizedAt?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  lab?: LabProfile
  patient?: PatientSummary
  hospital?: HospitalSummary
  doctor?: DoctorSummary
  appointment?: AppointmentSummary
  encounter?: EncounterSummary
  labOrder?: LabOrder
}

export type LabOrder = {
  id: string
  labId: string
  patientId: string
  hospitalId?: string | null
  doctorId?: string | null
  hospitalDoctorId?: string | null
  appointmentId?: string | null
  encounterId?: string | null
  source: LabOrderSource
  status: LabOrderStatus
  collectionType: SampleCollectionType
  requestedByUserId?: string | null
  acceptedByUserId?: string | null
  rejectedByUserId?: string | null
  reason?: string | null
  clinicalNotes?: string | null
  rejectionReason?: string | null
  scheduledAt?: string | null
  sampleCollectedAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  lab?: LabProfile
  patient?: PatientSummary
  hospital?: HospitalSummary
  doctor?: DoctorSummary
  appointment?: AppointmentSummary
  encounter?: EncounterSummary
  items: LabOrderItem[]
  reports: LabReport[]
}

export type Notification = {
  id: string
  recipientUserId: string
  type: string
  title: string
  body: string
  status: NotificationStatus
  channel: string
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, unknown> | null
  readAt?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type DashboardSummary = {
  totalTests: number
  requestedOrders: number
  acceptedOrders: number
  sampleCollectedOrders: number
  inProgressOrders: number
  completedOrders: number
  rejectedOrders: number
  pendingReportUploads: number
  recentOrders: LabOrder[]
}

export type FileAsset = {
  fileName?: string | null
  originalName?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  fileUrl?: string | null
}
