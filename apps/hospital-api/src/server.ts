import dotenv from 'dotenv'
dotenv.config()

import path from 'path'
import express from 'express'
import cors from 'cors'

import { doctorMedicalDocumentsRouter } from './routes/doctor-medical-documents.routes'
import { hospitalAuthRouter } from './routes/hospital-auth.routes'
import { doctorAuthRouter } from './routes/doctor-auth.routes'
import { hospitalNotificationsRouter } from './routes/hospital-notifications.routes'
import { doctorNotificationsRouter } from './routes/doctor-notifications.routes'
import { hospitalReviewsRouter } from './routes/hospital-reviews.routes'
import { hospitalChatsRouter } from './routes/hospital-chats.routes'
import { doctorChatsRouter } from './routes/doctor-chats.routes'
import { doctorRouter } from './routes/doctor.routes'
import { hospitalLocationsRouter } from './routes/hospital-locations.routes'
import { hospitalDoctorLocationsRouter } from './routes/hospital-doctor-locations.routes'


import { hospitalTeleconsultRouter } from './routes/hospital-teleconsult.routes'
import { doctorTeleconsultRouter } from './routes/doctor-teleconsult.routes'

import { hospitalProfileRouter } from './routes/hospital-profile.routes'
import { hospitalRouter } from './routes/hospital.routes'
import { hospitalDoctorsRouter } from './routes/hospital-doctors.routes'
import { hospitalDoctorAvailabilityRouter } from './routes/hospital-doctor-availability.routes'
import { hospitalAppointmentsRouter } from './routes/hospital-appointments.routes'
import { hospitalEncountersRouter } from './routes/hospital-encounters.routes'
import { hospitalMedicalDocumentsRouter } from './routes/hospital-medical-documents.routes'

const app = express()

const uploadsRoot = path.resolve(__dirname, '../../../uploads')

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsRoot))

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'careOS Hospital API',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Public auth routes.
 */
app.use('/hospital/auth', hospitalAuthRouter)
app.use('/hospital/doctor-auth', doctorAuthRouter)
app.use('/hospital', hospitalDoctorLocationsRouter)
/**
 * Doctor-scoped routes.
 * These must stay BEFORE the broader /hospital/doctor router.
 */
app.use('/hospital/doctor/chats', doctorChatsRouter)
app.use('/hospital/doctor/notifications', doctorNotificationsRouter)
app.use('/hospital/doctor', doctorTeleconsultRouter)

/**
 * Hospital-scoped feature routes.
 */
app.use('/hospital/notifications', hospitalNotificationsRouter)
app.use('/hospital/reviews', hospitalReviewsRouter)
app.use('/hospital/chats', hospitalChatsRouter)

/**
 * Protected doctor routes.
 */
app.use('/hospital/doctor', doctorRouter)
app.use('/hospital/doctor', doctorMedicalDocumentsRouter)

/**
 * Hospital admin/staff routes.
 */
app.use('/hospital/appointments', hospitalAppointmentsRouter)
app.use('/hospital/doctors', hospitalDoctorsRouter)

/**
 * Hospital teleconsult routes.
 * Keep this BEFORE generic /hospital routes.
 */
app.use('/hospital', hospitalTeleconsultRouter)

/**
 * Generic hospital routes must stay near the bottom.
 */
app.use('/hospital', hospitalProfileRouter)
app.use('/hospital', hospitalDoctorAvailabilityRouter)
app.use('/hospital', hospitalEncountersRouter)
app.use('/hospital', hospitalMedicalDocumentsRouter)
app.use('/hospital', hospitalLocationsRouter)
app.use('/hospital', hospitalRouter)

const port = process.env.PORT || 4002

app.listen(port, () => {
  console.log(`careOS Hospital API running on http://localhost:${port}`)
})