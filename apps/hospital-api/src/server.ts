import dotenv from 'dotenv'
dotenv.config()

import path from 'path'
import express from 'express'
import cors from 'cors'

import { hospitalAuthRouter } from './routes/hospital-auth.routes'
import { doctorAuthRouter } from './routes/doctor-auth.routes'

import {
  hospitalLabReportsRouter,
  doctorLabReportsRouter,
} from './routes/hospital-lab-reports.routes'

import { doctorChatsRouter } from './routes/doctor-chats.routes'
import { doctorNotificationsRouter } from './routes/doctor-notifications.routes'
import { doctorTeleconsultRouter } from './routes/doctor-teleconsult.routes'
import { doctorLabOrdersRouter } from './routes/doctor-lab-orders.routes'
import { doctorMedicalDocumentsRouter } from './routes/doctor-medical-documents.routes'
import { doctorRouter } from './routes/doctor.routes'

import { hospitalLabsRouter } from './routes/hospital-labs.routes'
import { hospitalNotificationsRouter } from './routes/hospital-notifications.routes'
import { hospitalReviewsRouter } from './routes/hospital-reviews.routes'
import { hospitalChatsRouter } from './routes/hospital-chats.routes'

import { hospitalAppointmentsRouter } from './routes/hospital-appointments.routes'
import { hospitalDoctorsRouter } from './routes/hospital-doctors.routes'
import { hospitalDoctorLocationsRouter } from './routes/hospital-doctor-locations.routes'

import { hospitalTeleconsultRouter } from './routes/hospital-teleconsult.routes'
import { hospitalProfileRouter } from './routes/hospital-profile.routes'
import { hospitalRouter } from './routes/hospital.routes'
import { hospitalDoctorAvailabilityRouter } from './routes/hospital-doctor-availability.routes'
import { hospitalEncountersRouter } from './routes/hospital-encounters.routes'
import { hospitalMedicalDocumentsRouter } from './routes/hospital-medical-documents.routes'
import { hospitalLocationsRouter } from './routes/hospital-locations.routes'

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

/**
 * Doctor-scoped routes.
 *
 * These must stay BEFORE:
 * - doctorRouter
 * - hospital admin/staff routes
 * - any broad /hospital router
 *
 * Reason:
 * Broad routers can accidentally catch /hospital/doctor/*
 * and reject valid doctor tokens as "Hospital access required".
 */
app.use('/hospital/doctor/chats', doctorChatsRouter)
app.use('/hospital/doctor/notifications', doctorNotificationsRouter)
app.use('/hospital/doctor', doctorTeleconsultRouter)
app.use('/hospital/doctor', doctorLabOrdersRouter)
app.use('/hospital/doctor', doctorLabReportsRouter)
app.use('/hospital/doctor', doctorMedicalDocumentsRouter)

/**
 * Generic protected doctor routes.
 *
 * Keep this AFTER specific doctor feature routes like:
 * /labs
 * /lab-reports
 * /appointments/:id/lab-orders
 */
app.use('/hospital/doctor', doctorRouter)

/**
 * Hospital-scoped feature routes.
 */
app.use('/hospital/notifications', hospitalNotificationsRouter)
app.use('/hospital/reviews', hospitalReviewsRouter)
app.use('/hospital/chats', hospitalChatsRouter)
app.use('/hospital', hospitalLabReportsRouter)
app.use('/hospital', hospitalLabsRouter)

/**
 * Hospital admin/staff routes.
 */
app.use('/hospital/appointments', hospitalAppointmentsRouter)
app.use('/hospital/doctors', hospitalDoctorsRouter)

/**
 * Hospital doctor-location routes.
 *
 * This router is mounted broadly on /hospital, so keep it AFTER
 * all /hospital/doctor feature routes.
 */
app.use('/hospital', hospitalDoctorLocationsRouter)

/**
 * Hospital teleconsult routes.
 *
 * Keep this before generic /hospital routes.
 */
app.use('/hospital', hospitalTeleconsultRouter)

/**
 * Generic hospital routes.
 *
 * These must stay near the bottom.
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