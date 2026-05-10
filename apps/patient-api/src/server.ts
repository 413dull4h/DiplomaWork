import dotenv from 'dotenv'
dotenv.config()

import path from 'path'
import express from 'express'
import cors from 'cors'
import { patientReviewsRouter } from './routes/patient-reviews.routes'

import { patientNotificationsRouter } from './routes/patient-notifications.routes'
import { patientAuthRouter } from './routes/patient-auth.routes'
import { patientProfileRouter } from './routes/patient-profile.routes'
import { patientDiscoveryRouter } from './routes/patient-discovery.routes'
import { patientAppointmentsRouter } from './routes/patient-appointments.routes'
import { patientRecordsRouter } from './routes/patient-records.routes'
import { patientMedicalDocumentsRouter } from './routes/patient-medical-documents.routes'
import { patientChatsRouter } from './routes/patient-chats.routes'

const app = express()

const uploadsRoot = path.resolve(__dirname, '../../../uploads')

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsRoot))

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'careOS Patient API',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Public auth routes.
 */
app.use('/patient/auth', patientAuthRouter)
app.use('/patient/reviews', patientReviewsRouter)
app.use('/patient/chats', patientChatsRouter)
/**
 * Protected patient routes.
 */
app.use('/patient/notifications', patientNotificationsRouter)
app.use('/patient', patientMedicalDocumentsRouter)
app.use('/patient', patientAppointmentsRouter)
app.use('/patient', patientDiscoveryRouter)
app.use('/patient', patientRecordsRouter)
app.use('/patient', patientProfileRouter)

const port = process.env.PORT || 4003

app.listen(port, () => {
  console.log(`careOS Patient API running on http://localhost:${port}`)
})