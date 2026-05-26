import * as trpcExpress from '@trpc/server/adapters/express'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import morgan from 'morgan'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { appRouter } from './trpc'
import { createContext } from './trpc/context'  

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5174

// Настройка для загрузки файлов
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOAD_DIR = path.join(__dirname, '../uploads/news')

// Создаём папку если её нет
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Настройка multer для сохранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, uniqueSuffix + ext)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB лимит
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const ext = path.extname(file.originalname).toLowerCase()
    const mime = allowedTypes.test(file.mimetype)
    if (mime && allowedTypes.test(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only images are allowed'))
    }
  }
})

// Middleware
app.use(morgan('dev'))
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true
  })
)
app.use(express.json())

// Раздаём статические файлы (загруженные картинки)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Эндпоинт для загрузки изображений (для TinyMCE)
app.post('/api/upload-image', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    const fileUrl = `http://localhost:${PORT}/uploads/news/${req.file.filename}`
    
    // TinyMCE ожидает такой формат ответа
    res.json({ location: fileUrl })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

// tRPC
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`❌ tRPC error on ${path}:`, error)
    }
  })
)

app.listen(PORT, () => {
  console.log(`🚀 tRPC server: http://localhost:${PORT}/trpc`)
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads`)
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
})