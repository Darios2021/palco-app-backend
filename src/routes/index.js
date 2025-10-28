// src/routes/index.js
import { Router } from 'express'
import people from './people.js'
import seats from './seats.js'

const router = Router()

// Quedan expuestas como:
//   GET /api/people
//   GET /api/seats
router.use('/people', people)
router.use('/seats', seats)

export default router