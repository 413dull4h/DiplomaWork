import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { hospitalAuthRouter } from './routes/hospital-auth.routes'
import { hospitalRouter } from './routes/hospital.routes'
import { hospitalDoctorsRouter } from './routes/hospital-doctors.routes'
import { hospitalDoctorAvailabilityRouter } from './routes/hospital-doctor-availability.routes'
import { hospitalAppointmentsRouter } from './routes/hospital-appointments.routes'
import { hospitalEncountersRouter } from './routes/hospital-encounters.routes'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'careOS Hospital API',
    timestamp: new Date().toISOString(),
  })
})

app.use('/hospital/auth', hospitalAuthRouter)
app.use('/hospital/appointments', hospitalAppointmentsRouter)
app.use('/hospital/doctors', hospitalDoctorsRouter)
app.use('/hospital', hospitalDoctorAvailabilityRouter)
app.use('/hospital', hospitalEncountersRouter)
app.use('/hospital', hospitalRouter)

const port = process.env.PORT || 4002

app.listen(port, () => {
  console.log(`careOS Hospital API running on http://localhost:${port}`)
})