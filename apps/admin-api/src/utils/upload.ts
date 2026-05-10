import fs from 'fs'
import path from 'path'
import multer from 'multer'

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']

export function createImageUpload(folder: string) {
  const uploadDir = path.join(process.cwd(), 'uploads', folder)

  fs.mkdirSync(uploadDir, {
    recursive: true,
  })

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir)
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
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
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Only JPG, PNG, and WEBP images are allowed.'))
      }

      cb(null, true)
    },
  })
}
