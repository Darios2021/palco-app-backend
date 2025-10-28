import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import 'dotenv/config'

import apiRoutes from './routes/index.js'            // monta /people y /seats
// Si no tenés middleware de errores, se usa el fallback interno.
import errorMiddleware from './middlewares/error.js' assert { type: 'json' } 
// ^ Si te da problema esta línea, borrala y queda el fallback.

const app = express()
app.use(morgan('dev'))
app.use(express.json())

// --- CORS (lista separada por comas en CORS_ORIGIN) ---
const allowlist = (process.env.CORS_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean)

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true) // health/curl
    if (!allowlist.length || allowlist.includes(origin)) return cb(null, true)
    return cb(new Error(`Not allowed by CORS: ${origin}`))
  },
  credentials: true,
}))
app.options('*', cors())

// --- Health & Ping ---
app.get('/health', (_, res) => res.json({ ok: true }))
app.get('/api/health', (_, res) => res.json({ ok: true }))  // útil para probar proxy
app.get('/api/hello', (_, res) => res.json({ msg: 'Backend OK ✅' }))

// --- API real bajo /api ---
app.use('/api', apiRoutes)

// 404 para rutas API no encontradas
app.use('/api', (req, res) => res.status(404).json({ error: 'Not Found' }))

// Manejo de errores (fallback simple si no tenés uno propio)
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

const PORT = Number(process.env.PORT) || 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API escuchando en http://0.0.0.0:${PORT}`)
})
