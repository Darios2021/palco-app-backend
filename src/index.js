import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import 'dotenv/config'

import { ensureConnection, sequelize } from './db.js'
import './models/Person.js'
import { seedIfEmpty } from './seed.js'   // 🟢 agregamos el seed
import apiRoutes from './routes/index.js'

const app = express()
app.use(morgan('dev'))
app.use(express.json())

// CORS
const allowlist = (process.env.CORS_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean)

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true)
    if (!allowlist.length || allowlist.includes(origin)) return cb(null, true)
    return cb(new Error(`Not allowed by CORS: ${origin}`))
  },
  credentials: true,
}))
app.options('*', cors())

// Health
app.get('/health', (_, res) => res.json({ ok: true }))
app.get('/api/health', (_, res) => res.json({ ok: true }))
app.get('/api/hello', (_, res) => res.json({ msg: 'Backend OK ✅' }))

// API
app.use('/api', apiRoutes)

// 404 API
app.use('/api', (req, res) => res.status(404).json({ error: 'Not Found' }))

// Error genérico
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

const PORT = Number(process.env.PORT) || 3000

const start = async () => {
  await ensureConnection()
  await sequelize.sync()
  await seedIfEmpty()                    // 🟢 carga datos si la tabla está vacía
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API escuchando en http://0.0.0.0:${PORT}`)
  })
}

start().catch(err => {
  console.error('No se pudo iniciar:', err)
  process.exit(1)
})
