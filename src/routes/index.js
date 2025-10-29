// src/routes/index.js
import { Router } from 'express'
import people from './people.js'
// import seats from './seats.js' // habilítalo si corresponde

const router = Router()

router.use('/people', people)
// router.use('/seats', seats)

export default router
