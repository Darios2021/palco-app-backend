import { Router } from 'express'
import { loadDB, saveDB, buildSeatsMatrix } from '../data/store.js'

const r = Router()
const BadRequest = (m)=>Object.assign(new Error(m),{status:400})
const NotFound = (m)=>Object.assign(new Error(m),{status:404})

function flatSeats(cfg){ return buildSeatsMatrix(cfg.rows, cfg.cols).flat() }
function seatExists(code, cfg){ return !code || flatSeats(cfg).includes(code) }
function seatAvailable(code, people, ignoreId=null){
  if (!code) return true
  const holder = people.find(p => p.seat === code)
  return !holder || holder.id === ignoreId
}

// GET /api/people
r.get('/', async (_req, res, next) => {
  try {
    const db = await loadDB()
    res.json(db.people.sort((a,b)=>b.id-a.id))
  } catch(e){ next(e) }
})

// POST /api/people
r.post('/', async (req, res, next) => {
  try {
    const db = await loadDB()
    const { name, doc='', org='', seat='' } = req.body || {}
    if (!name?.trim()) throw BadRequest('El nombre es obligatorio')
    if (seat) {
      if (!seatExists(seat, db.config)) throw BadRequest('El asiento no existe')
      if (!seatAvailable(seat, db.people)) throw BadRequest('El asiento ya está asignado')
    }
    const id = Date.now()
    const row = {
      id,
      name: name.trim(),
      doc: String(doc).trim(),
      org: String(org).trim(),
      seat: String(seat).trim(),
      present: false,
      presentAt: null       // <<< NUEVO: timestamp de ingreso
    }
    db.people.unshift(row)
    await saveDB(db)
    res.status(201).json(row)
  } catch(e){ next(e) }
})

// PUT /api/people/:id
r.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const db = await loadDB()
    const idx = db.people.findIndex(p => p.id === id)
    if (idx < 0) throw NotFound('Persona no encontrada')

    const nextRow = { ...db.people[idx], ...(req.body || {}) }
    if (!nextRow.name?.trim()) throw BadRequest('El nombre es obligatorio')
    if (nextRow.seat) {
      if (!seatExists(nextRow.seat, db.config)) throw BadRequest('El asiento no existe')
      if (!seatAvailable(nextRow.seat, db.people, id)) throw BadRequest('El asiento ya está asignado')
    }
    db.people[idx] = nextRow
    await saveDB(db)
    res.json(nextRow)
  } catch(e){ next(e) }
})

// DELETE /api/people/:id
r.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const db = await loadDB()
    const before = db.people.length
    db.people = db.people.filter(p => p.id !== id)
    if (db.people.length === before) throw NotFound('Persona no encontrada')
    await saveDB(db)
    res.json({ ok:true })
  } catch(e){ next(e) }
})

// POST /api/people/:id/checkin
r.post('/:id/checkin', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const db = await loadDB()
    const p = db.people.find(x => x.id === id)
    if (!p) throw NotFound('Persona no encontrada')
    p.present = true
    p.presentAt = new Date().toISOString()   // <<< guarda hora de ingreso
    await saveDB(db)
    res.json(p)
  } catch(e){ next(e) }
})

// POST /api/people/checkin/by-name {name}
r.post('/checkin/by-name', async (req, res, next) => {
  try {
    const { name } = req.body || {}
    if (!name?.trim()) throw BadRequest('Nombre requerido')
    const db = await loadDB()
    const q = name.trim().toLowerCase()
    const p = db.people.find(x => x.name.toLowerCase() === q)
    if (!p) throw NotFound('No existe asignación para este nombre')
    p.present = true
    p.presentAt = new Date().toISOString()   // <<< guarda hora de ingreso
    await saveDB(db)
    res.json(p)
  } catch(e){ next(e) }
})

export default r
