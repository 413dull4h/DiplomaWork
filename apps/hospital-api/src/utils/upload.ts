import fs from 'fs'
import path from 'path'
import multer from 'multer'

const allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp']

function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function createImageUpload(folder: string) {
  const uploadsRoot = path.resolve(__dirname, '../../../../uploads')
  const destination = path.join(uploadsRoot, folder)

  ensureDirExists(destination)

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination)
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
      cb(null, safeName)
    },
  })

  return multer({
    storage,
    limits: {
      fileSize: 2 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
      if (!allowedImageMimeTypes.includes(file.mimetype)) {
        cb(new Error('Only JPG, PNG, and WEBP images are allowed.'))
        return
      }

      cb(null, true)
    },
  })
}

export const hospitalLogoUpload = createImageUpload('hospitals')
export const doctorAvatarUpload = createImageUpload('doctors')