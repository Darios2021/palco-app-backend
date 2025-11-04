// src/index.js
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import 'dotenv/config'

import { ensureConnection, sequelize } from './db.js'
import './models/Person.js'
import './models/Palco.js'
import './models/PalcoSeat.js'
import './models/User.js'
import './models/RefreshToken.js'
import { seedIfEmpty } from './seed.js'
import apiRoutes from './routes/index.js'

const app = express()
app.use(morgan('dev'))
app.use(express.json())

/* ===================== CORS robusto ===================== *
 * CORS_ORIGIN admite varios orígenes separados por coma o espacio.
 * Ej: CORS_ORIGIN="https://palco-app-frontend.cingulado.org, http://localhost:5173"
 * También soporta comodín de subdominio: "*.cingulado.org"
 */
function normUrl(u) {
  if (!u) return ''
  try {
    const url = new URL(u)
    const isHttps = url.protocol === 'https:'
    const isHttp  = url.protocol === 'http:'
    const defaultPort =
      (isHttps && url.port === '443') || (isHttp && url.port === '80')
    const hostPort = defaultPort
      ? url.hostname
      : `${url.hostname}${url.port ? ':' + url.port : ''}`
    return `${url.protocol}//${hostPort}`
  } catch {
    return String(u).replace(/\/+$/, '')
  }
}

const rawAllow = (process.env.CORS_ORIGIN || '')
  .split(/[,\s]+/)
  .map(s => s.trim())
  .filter(Boolean)

const allowlist = rawAllow.map(normUrl)

function matchesWildcard(origin, pattern) {
  if (!pattern.startsWith('*.')) return false
  const suf = pattern.slice(1) // ".cingulado.org"
  return origin.endsWith(suf)
}

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true) // permitir curl/Postman
    const o = normUrl(origin)
    const ok =
      allowlist.includes(o) ||
      allowlist.some(p => matchesWildcard(o, p))
    return ok ? cb(null, true) : cb(new Error('Not allowed by CORS: ' + origin))
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With']
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
/* =================== /CORS robusto ====================== */

// Health check
app.get('/health', (_, res) => res.json({ ok: true }))
app.get('/api/health', (_, res) => res.json({ ok: true }))
app.get('/api/hello', (_, res) => res.json({ msg: 'Backend OK ✅' }))

// DB ping
app.get('/api/db/ping', async (_req, res) => {
  try {
    await sequelize.authenticate()
    const [rows] = await sequelize.query('SELECT 1 AS ok')
    res.json({ ok: true, db: rows?.[0]?.ok === 1 })
  } catch (err) {
    console.error('[DB/PING]', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// API principal
app.use('/api', apiRoutes)

// 404 API
app.use('/api', (_req, res) =>
  res.status(404).json({ error: 'Not Found' })
)

// Error genérico
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  })
})

const PORT = Number(process.env.PORT) || 3000

const start = async () => {
  try {
    await ensureConnection()
    await sequelize.sync()
    await seedIfEmpty()
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ API escuchando en http://0.0.0.0:${PORT}`)
    })
  } catch (err) {
    console.error('❌ No se pudo iniciar:', err)
    process.exit(1)
  }
}

start()
