import dotenv from 'dotenv'
dotenv.config()

import path from 'path'
import express from 'express'
import cors from 'cors'

import { labAuthRouter } from './routes/lab-auth.routes'
import { labProfileRouter } from './routes/lab-profile.routes'
import { labTestsRouter } from './routes/lab-tests.routes'
import { labOrdersRouter } from './routes/lab-orders.routes'
import { labReportsRouter } from './routes/lab-reports.routes'

const app = express()

const uploadsRoot = path.resolve(__dirname, '../../../uploads')

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsRoot))

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'careOS Lab API',
    timestamp: new Date().toISOString(),
  })
})

app.use('/lab/auth', labAuthRouter)
app.use('/lab/profile', labProfileRouter)
app.use('/lab/tests', labTestsRouter)
app.use('/lab/orders', labOrdersRouter)
app.use('/lab', labReportsRouter)

const port = process.env.PORT || 4004

app.listen(port, () => {
  console.log(`careOS Lab API running on http://localhost:${port}`)
})