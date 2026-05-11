import dotenv from 'dotenv'
dotenv.config()

import path from 'path'
import express from 'express'
import cors from 'cors'

import { patientAuthRouter } from './routes/patient-auth.routes'
import { patientProfileRouter } from './routes/patient-profile.routes'
import { patientDiscoveryRouter } from './routes/patient-discovery.routes'
import { patientAppointmentsRouter } from './routes/patient-appointments.routes'
import { patientRecordsRouter } from './routes/patient-records.routes'
import { patientNotificationsRouter } from './routes/patient-notifications.routes'
import { patientMedicalDocumentsRouter } from './routes/patient-medical-documents.routes'
import { patientChatsRouter } from './routes/patient-chats.routes'
import { patientLabOrdersRouter } from './routes/patient-lab-orders.routes'
import { patientLabReportsRouter } from './routes/patient-lab-reports.routes'

const app = express()

app.use(cors())
app.use(express.json())

const uploadsRoot = path.resolve(__dirname, '../../../uploads')
app.use('/uploads', express.static(uploadsRoot))

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'careOS Patient API',
    timestamp: new Date().toISOString(),
  })
})

app.use('/patient/auth', patientAuthRouter)

app.use('/patient', patientProfileRouter)
app.use('/patient', patientDiscoveryRouter)
app.use('/patient', patientAppointmentsRouter)
app.use('/patient', patientRecordsRouter)
app.use('/patient', patientMedicalDocumentsRouter)

app.use('/patient/notifications', patientNotificationsRouter)
app.use('/patient/chats', patientChatsRouter)

app.use('/patient/lab-orders', patientLabOrdersRouter)
app.use('/patient/lab-reports', patientLabReportsRouter)

const port = process.env.PORT || 4003

app.listen(port, () => {
  console.log(`careOS Patient API running on http://localhost:${port}`)
})