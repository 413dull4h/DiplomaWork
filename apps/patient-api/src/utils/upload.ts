import fs from 'fs'
import path from 'path'
import multer from 'multer'

const workspaceRoot = path.resolve(__dirname, '../../../../')
const uploadsRoot = path.join(workspaceRoot, 'uploads')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    })
  }
}

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and WEBP images are allowed.'))
  }

  cb(null, true)
}

export function createImageUpload(folder: string) {
  const uploadDir = path.join(uploadsRoot, folder)

  ensureDir(uploadDir)

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

  return multer({
    storage,
    limits: {
      fileSize: 2 * 1024 * 1024,
    },
    fileFilter,
  })
}

export const patientAvatarUpload = createImageUpload('patients')