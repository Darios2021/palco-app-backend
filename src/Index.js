import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
// import rutas...
const app = express()

app.use(morgan('dev'))
app.use(express.json())

// --- CORS: permite múltiples orígenes desde .env ---
const allowlist = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, cb) {
    // sin origin (curl, health-check) -> permitir
    if (!origin) return cb(null, true)
    if (allowlist.length === 0 || allowlist.includes(origin)) return cb(null, true)
    return cb(new Error(`Not allowed by CORS: ${origin}`))
  },
  credentials: true,
}))
// Preflight
app.options('*', cors())

// endpoints
app.get('/api/health', (req, res) => res.send('OK'))
// app.use('/api', rutas)

const PORT = process.env.PORT || 3001
// IMPORTANTe: escuchar en todas las interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API escuchando en http://0.0.0.0:${PORT}`)
})
