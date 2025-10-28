import { Router } from 'express'
import { loadDB, buildSeatsMatrix } from '../data/store.js'

const r = Router()

// GET /api/seats  -> { rows, cols, seats: [[A1...],[B1...]], status: { A1:'assigned'|'present' } }
r.get('/', async (_req, res, next) => {
  try {
    const db = await loadDB()
    const seats = buildSeatsMatrix(db.config.rows, db.config.cols)
    const status = {}
    for (const p of db.people) {
      if (!p.seat) continue
      status[p.seat] = p.present ? 'present' : 'assigned'
    }
    res.json({ rows: db.config.rows, cols: db.config.cols, seats, status })
  } catch (e) { next(e) }
})

export default r
