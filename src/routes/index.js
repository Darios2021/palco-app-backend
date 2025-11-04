// src/routes/index.js
import { Router } from 'express'
import authRoutes from './auth.js'
import peopleRoutes from './people.js'
import palcosRoutes from './palcos.js'

const r = Router()

r.use('/auth', authRoutes)     // <— ¡esto faltaba!
r.use('/people', peopleRoutes)
r.use('/palcos', palcosRoutes)

export default r
