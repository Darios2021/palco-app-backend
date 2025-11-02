// src/routes/index.js
import { Router } from 'express'
import peopleRoutes from './people.js'
import palcosRoutes from './palcos.js'

const r = Router()

r.use('/people', peopleRoutes)
r.use('/palcos', palcosRoutes)

export default r
