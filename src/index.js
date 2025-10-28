import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import 'dotenv/config'

const app = express()
app.use(morgan('dev'))
app.use(express.json())

// --- CORS: permite múltiples orígenes: CORS_ORIGIN=URL1,URL2 ---
const allowlist = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true)                 // health/curl
    if (allowlist.length === 0 || allowlist.includes(origin)) return cb(null, true)
    return cb(new Error(`Not allowed by CORS: ${origin}`))
  },
  credentials: true,
}))
app.options('*', cors())

// --- Endpoints de prueba ---
app.get('/health', (_, res) => res.json({ ok: true }))
app.get('/api/hello', (_, res) => res.json({ msg: 'Backend OK ✅' }))

// 🔴 Unificar en 3000
const PORT = Number(process.env.PORT) || 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API escuchando en http://0.0.0.0:${PORT}`)
})
