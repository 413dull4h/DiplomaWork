import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { patientAuthRouter } from './routes/patient-auth.routes'
import { patientProfileRouter } from './routes/patient-profile.routes'
import { patientDiscoveryRouter } from './routes/patient-discovery.routes'
import { patientAppointmentsRouter } from './routes/patient-appointments.routes'
import { patientRecordsRouter } from './routes/patient-records.routes'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'careOS Patient API',
    timestamp: new Date().toISOString(),
  })
})

app.use('/patient/auth', patientAuthRouter)
app.use('/patient', patientAppointmentsRouter)
app.use('/patient', patientDiscoveryRouter)
app.use('/patient', patientRecordsRouter)
app.use('/patient', patientProfileRouter)

const port = process.env.PORT || 4003

app.listen(port, () => {
  console.log(`careOS Patient API running on http://localhost:${port}`)
})