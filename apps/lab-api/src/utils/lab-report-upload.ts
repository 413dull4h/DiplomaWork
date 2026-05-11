import fs from 'fs'
import path from 'path'
import multer from 'multer'

const uploadsRoot = path.resolve(__dirname, '../../../../uploads')
const labReportsDir = path.join(uploadsRoot, 'lab-reports')

if (!fs.existsSync(labReportsDir)) {
  fs.mkdirSync(labReportsDir, {
    recursive: true,
  })
}

function safeFileName(name: string) {
  return name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '')
    .slice(0, 120)
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, labReportsDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext)
    cb(null, `${Date.now()}-${safeFileName(base)}${ext}`)
  },
})

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

export const labReportUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Only PDF, JPG, PNG, and WEBP files are allowed.'))
    }

    cb(null, true)
  },
})