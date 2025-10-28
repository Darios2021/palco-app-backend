import { Router } from 'express'
import people from './people.js'
import seats from './seats.js'

const router = Router()

router.use('/people', people) // GET /api/people
router.use('/seats', seats)   // GET /api/seats

export default router
