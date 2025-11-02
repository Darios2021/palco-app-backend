// src/routes/index.js
import { Router } from 'express'

// Rutas existentes
import peopleRoutes from './people.js'

// NUEVO: rutas de palcos
import palcosRoutes from './palcos.js'

const r = Router()

// /api/people -> alta/baja/edición/listado/checkin
r.use('/people', peopleRoutes)

// /api/palcos -> asientos, marcar presente, liberar
r.use('/palcos', palcosRoutes)

// sanity check
r.get('/', (_req, res) => {
  res.json({ ok: true, msg: 'API root' })
})

export default r
