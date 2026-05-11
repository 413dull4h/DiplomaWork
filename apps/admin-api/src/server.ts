import dotenv from 'dotenv'
dotenv.config()

import path from 'path'
import express from 'express'
import cors from 'cors'

import { adminAuthRouter } from './routes/admin-auth.routes'
import { adminProfileRouter } from './routes/admin-profile.routes'
import { adminDashboardRouter } from './routes/admin-dashboard.routes'
import { adminHospitalsRouter } from './routes/admin-hospitals.routes'
import { adminUsersRouter } from './routes/admin-users.routes'
import { adminPatientsRouter } from './routes/admin-patients.routes'
import { adminAuditLogsRouter } from './routes/admin-audit-logs.routes'
import { adminAppointmentsRouter } from './routes/admin-appointments.routes'
import { adminReviewsRouter } from './routes/admin-reviews.routes'
import { adminLabsRouter } from './routes/admin-labs.routes'

const app = express()

// Serve both upload locations:
// 1. Root shared uploads folder: /uploads
// 2. Admin API local uploads folder: /apps/admin-api/uploads
const rootUploads = path.resolve(__dirname, '../../../uploads')
const appUploads = path.resolve(__dirname, '../uploads')

app.use(cors())
app.use(express.json())

app.use('/uploads', express.static(rootUploads))
app.use('/uploads', express.static(appUploads))

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'careOS Admin API',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Public/auth routes
 */
app.use('/admin/auth', adminAuthRouter)

/**
 * Protected admin routes
 */
app.use('/admin/profile', adminProfileRouter)
app.use('/admin/dashboard', adminDashboardRouter)
app.use('/admin/hospitals', adminHospitalsRouter)
app.use('/admin/users', adminUsersRouter)
app.use('/admin/patients', adminPatientsRouter)
app.use('/admin/appointments', adminAppointmentsRouter)
app.use('/admin/audit-logs', adminAuditLogsRouter)
app.use('/admin/reviews', adminReviewsRouter)
app.use('/admin', adminLabsRouter)

const port = process.env.PORT || 4001

app.listen(port, () => {
  console.log(`careOS Admin API running on http://localhost:${port}`)
})