import fs from 'fs'
import path from 'path'
import multer from 'multer'

const workspaceRoot = path.resolve(__dirname, '../../../../')
const uploadDir = path.join(workspaceRoot, 'uploads', 'medical-documents')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  })
}

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname)
    const safeBaseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 40)

    cb(null, `${Date.now()}-${safeBaseName}${extension}`)
  },
})

export const medicalDocumentUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Only PDF, JPG, PNG, and WEBP files are allowed.'))
    }

    cb(null, true)
  },
})