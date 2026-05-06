export type HospitalStatus='PENDING'|'APPROVED'|'SUSPENDED'|'REJECTED'
export type UserStatus='ACTIVE'|'PENDING'|'SUSPENDED'|'DELETED'|'INACTIVE'
export type RoleName='HOSPITAL_ADMIN'|'HOSPITAL_STAFF'|'PLATFORM_ADMIN'|'SUPER_ADMIN'|'PATIENT'
export type StaffRole='HOSPITAL_ADMIN'|'RECEPTIONIST'|'NURSE'|'DOCTOR_COORDINATOR'|'HOSPITAL_STAFF'
export type DayOfWeek='MONDAY'|'TUESDAY'|'WEDNESDAY'|'THURSDAY'|'FRIDAY'|'SATURDAY'|'SUNDAY'
export type AvailabilityAppointmentType='IN_PERSON'|'TELECONSULT'|'BOTH'
export type AppointmentType='IN_PERSON'|'TELECONSULT'
export type AppointmentStatus='REQUESTED'|'CONFIRMED'|'COMPLETED'|'CANCELLED'|'NO_SHOW'
export interface Address{ id:string; line1:string; line2?:string|null; city:string; state?:string|null; postalCode?:string|null; country:string; createdAt?:string }
export interface HospitalUser{ id:string; email:string; phone?:string|null; primaryRole:RoleName; status:UserStatus; lastLoginAt?:string|null; createdAt?:string }
export interface HospitalStaff{ id:string; staffRole:StaffRole; isActive:boolean; user?:HospitalUser; hospital?:Hospital }
export interface HospitalDepartment{ id:string; hospitalId:string; name:string; description?:string|null; createdAt?:string }
export interface Hospital{ id:string; name:string; legalName?:string|null; contactPhone?:string|null; contactEmail?:string|null; licenseNumber?:string|null; status:HospitalStatus; timeZone?:string|null; address?:Address|null; departments?:HospitalDepartment[]; staff?:HospitalStaff[]; createdAt?:string; updatedAt?:string }
export interface Doctor{ id:string; fullName:string; specialization?:string|null; licenseNumber?:string|null; yearsExperience?:number|null; bio?:string|null; consultationFee?:string|number|null; createdAt?:string }
export interface DoctorAvailability{ id:string; hospitalDoctorId:string; dayOfWeek:DayOfWeek; startTime:string; endTime:string; slotDurationMinutes:number; appointmentType:AvailabilityAppointmentType; isActive:boolean; createdAt?:string }
export interface HospitalDoctor{ id:string; hospitalId:string; doctorId:string; departmentId?:string|null; isActive:boolean; doctor:Doctor; department?:HospitalDepartment|null; availabilities?:DoctorAvailability[]; createdAt?:string }
export interface Patient{ id:string; userId:string; fullName:string; dateOfBirth?:string|null; gender?:string|null; phone?:string|null; user?:HospitalUser; primaryAddress?:Address|null; medicalHistory?:string|null; allergies?:string|null; currentMedications?:string|null }
export interface Appointment{ id:string; patientId:string; hospitalId:string; hospitalDoctorId:string; doctorId:string; departmentId?:string|null; appointmentType:AppointmentType; scheduledDate:string; scheduledStart:string; scheduledEnd:string; status:AppointmentStatus; reason?:string|null; cancellationReason?:string|null; patient?:Patient; hospital?:Hospital; doctor?:Doctor; department?:HospitalDepartment|null; hospitalDoctor?:HospitalDoctor; encounter?:Encounter|null; createdAt?:string; updatedAt?:string }
export interface Encounter{ id:string; appointmentId:string; patientId:string; hospitalId:string; hospitalDoctorId:string; doctorId:string; departmentId?:string|null; chiefComplaint?:string|null; notes?:string|null; diagnosis?:string|null; prescription?:string|null; followUpInstructions?:string|null; appointment?:Appointment; patient?:Patient; hospital?:Hospital; doctor?:Doctor; department?:HospitalDepartment|null; createdAt?:string; updatedAt?:string }
export interface HospitalLoginRequest{ email:string; password:string } export interface HospitalLoginResponse{ message:string; token:string; user:HospitalUser; hospital:Hospital; staff:HospitalStaff }
export interface CreateDepartmentInput{ name:string; description?:string } export interface CreateDoctorInput{ fullName:string; specialization?:string; licenseNumber?:string; yearsExperience?:number; bio?:string; consultationFee?:number; departmentId?:string }
export interface CreateDoctorAvailabilityInput{ dayOfWeek:DayOfWeek; startTime:string; endTime:string; slotDurationMinutes:number; appointmentType:AvailabilityAppointmentType } export type UpdateDoctorAvailabilityInput=Partial<CreateDoctorAvailabilityInput>&{isActive?:boolean}
export interface CreateEncounterInput{ chiefComplaint?:string; notes?:string; diagnosis?:string; prescription?:string; followUpInstructions?:string } export type UpdateEncounterInput=CreateEncounterInput
export interface HealthResponse{ status:string; service:string; timestamp:string } export interface ApiError{ message:string; status?:number; details?:unknown }
