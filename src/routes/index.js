// src/routes/index.js
import { Router } from 'express'
import people from './people.js'
// import seats from './seats.js' // si querés también

const router = Router()
router.use('/people', people)
// router.use('/seats', seats)

export default router
