import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { adminProfileRouter } from './routes/admin-profile.routes'
import { adminAuthRouter } from './routes/admin-auth.routes'
import { adminHospitalsRouter } from './routes/admin-hospitals.routes'
import { adminDashboardRouter } from './routes/admin-dashboard.routes'
import { adminUsersRouter } from './routes/admin-users.routes'
import { adminPatientsRouter } from './routes/admin-patients.routes'
import { adminAuditLogsRouter } from './routes/admin-audit-logs.routes'
import { adminAppointmentsRouter } from './routes/admin-appointments.routes'
import { adminReviewsRouter } from './routes/admin-reviews.routes'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'careOS Admin API',
    timestamp: new Date().toISOString(),
  })
})

app.use('/admin/reviews', adminReviewsRouter)
app.use('/admin/auth', adminAuthRouter)
app.use('/uploads', express.static('uploads'))
app.use('/admin/profile', adminProfileRouter)
app.use('/admin/dashboard', adminDashboardRouter)
app.use('/admin/users', adminUsersRouter)
app.use('/admin/patients', adminPatientsRouter)
app.use('/admin/audit-logs', adminAuditLogsRouter)
app.use('/admin/appointments', adminAppointmentsRouter)
app.use('/admin/hospitals', adminHospitalsRouter)

const port = process.env.PORT || 4001

app.listen(port, () => {
  console.log(`careOS Admin API running on http://localhost:${port}`)
})