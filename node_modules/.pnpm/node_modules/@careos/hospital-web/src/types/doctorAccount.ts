export type DoctorAccountUser = {
  id: string
  email: string
  phone?: string | null
  primaryRole?: string
  status?: string
}

export type DoctorAccountDepartment = {
  id: string
  name: string
  description?: string | null
}

export type DoctorAccountDoctor = {
  id: string
  fullName: string
  specialization?: string | null
  licenseNumber?: string | null
  userId?: string | null
}

export type HospitalDoctorForAccount = {
  id: string
  hospitalId?: string
  doctorId?: string
  departmentId?: string | null
  isActive?: boolean
  doctor?: DoctorAccountDoctor | null
  department?: DoctorAccountDepartment | null
}

export type CreateDoctorAccountPayload = {
  email: string
  password: string
  phone?: string
}

export type DoctorAccountResponse = {
  message: string
  doctorAccount: {
    userId: string
    email: string
    doctorId: string
    hospitalDoctorId: string
    hospitalId: string
    department?: DoctorAccountDepartment | null
  }
}
