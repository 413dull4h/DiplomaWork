export type RoleName = 'PLATFORM_ADMIN' | 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'HOSPITAL_STAFF' | 'PATIENT'
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED' | 'INACTIVE'
export type HospitalStatus = 'APPROVED' | 'PENDING' | 'SUSPENDED' | 'REJECTED'
export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type AppointmentType = 'IN_PERSON' | 'TELECONSULT'

export interface ApiError {
  message: string
  status?: number
  details?: unknown
}

export interface AdminUser {
  id: string
  email: string
  phone?: string | null
  primaryRole: RoleName
  status: UserStatus
  lastLoginAt?: string | null
  createdAt?: string
}

export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminLoginResponse {
  message: string
  token: string
  user: AdminUser
}

export interface AuthSession {
  token: string
  user: AdminUser
}

export interface Address {
  id: string
  line1: string
  line2?: string | null
  city: string
  state?: string | null
  postalCode?: string | null
  country: string
  latitude?: number | null
  longitude?: number | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface HospitalDepartment {
  id: string
  hospitalId: string
  name: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface HospitalStaff {
  id: string
  userId: string
  hospitalId: string
  staffRole: string
  isActive: boolean
  user?: AdminUser
  createdAt?: string
  updatedAt?: string
}

export interface Hospital {
  id: string
  name: string
  legalName?: string | null
  addressId?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  licenseNumber?: string | null
  status: HospitalStatus
  timeZone?: string | null
  address?: Address | null
  departments?: HospitalDepartment[]
  staff?: HospitalStaff[]
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface CreateHospitalInput {
  name: string
  legalName?: string
  contactEmail?: string
  contactPhone?: string
  licenseNumber?: string
  timeZone?: string
  address?: {
    line1: string
    line2?: string
    city: string
    state?: string
    postalCode?: string
    country: string
  }
}

export interface CreateHospitalAdminInput {
  email: string
  password: string
  phone?: string
}

export interface DashboardSummary {
  users: { total: number; patients: number }
  hospitals: { total: number; approved: number; pending: number; suspended: number; rejected: number }
  clinical: { doctors: number; departments: number; encounters: number }
  appointments: { total: number; requested: number; confirmed: number; completed: number; cancelled: number; noShow: number }
}

export interface RecentAppointment {
  id: string
  patientId: string
  hospitalId: string
  hospitalDoctorId: string
  doctorId: string
  departmentId?: string | null
  appointmentType: AppointmentType
  scheduledDate: string
  scheduledStart: string
  scheduledEnd: string
  status: AppointmentStatus
  reason?: string | null
  cancellationReason?: string | null
  patient?: { id: string; fullName: string; phone?: string | null }
  hospital?: Hospital
  doctor?: { id: string; fullName: string; specialization?: string | null }
  department?: HospitalDepartment | null
  createdAt: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface AuditLog {
  id: string
  userId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  ipAddress?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  user?: AdminUser | null
}

export interface DashboardResponse {
  summary: DashboardSummary
  recent: {
    hospitals: Hospital[]
    appointments: RecentAppointment[]
    auditLogs: AuditLog[]
  }
}

export interface HealthResponse {
  status: string
  service: string
  timestamp: string
}
