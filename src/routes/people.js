// src/routes/people.js
import { Router } from 'express'
import { Op } from 'sequelize'
import { Person } from '../models/Person.js'

const r = Router()

// Listar
r.get('/', async (req, res, next) => {
  try {
    const rows = await Person.findAll({ order: [['id', 'DESC']] })
    res.json(rows)
  } catch (e) { next(e) }
})

// Crear
r.post('/', async (req, res, next) => {
  try {
    const { name, org, cargo, seat } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name required' })

    const row = await Person.create({ name, org, cargo, seat })
    res.status(201).json(row)
  } catch (e) { next(e) }
})

// Actualizar
r.put('/:id', async (req, res, next) => {
  try {
    const row = await Person.findByPk(req.params.id)
    if (!row) return res.status(404).json({ error: 'Not found' })

    // Solo campos permitidos
    const payload = (({ name, org, cargo, seat, present, presentAt }) =>
      ({ name, org, cargo, seat, present, presentAt }))(req.body || {})

    await row.update(payload)
    res.json(row)
  } catch (e) { next(e) }
})

// Borrar
r.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Person.destroy({ where: { id: req.params.id } })
    res.json({ deleted })
  } catch (e) { next(e) }
})

// Check-in por ID
r.post('/:id/checkin', async (req, res, next) => {
  try {
    const row = await Person.findByPk(req.params.id)
    if (!row) return res.status(404).json({ error: 'Not found' })
    await row.update({ present: true, presentAt: new Date() })
    res.json(row)
  } catch (e) { next(e) }
})

// Check-in por nombre exacto
r.post('/checkin/by-name', async (req, res, next) => {
  try {
    const { name } = req.body || {}
    if (!name) return res.status(400).json({ error: 'name required' })
    let row = await Person.findOne({ where: { name } })
    if (!row) row = await Person.create({ name })
    await row.update({ present: true, presentAt: new Date() })
    res.json(row)
  } catch (e) { next(e) }
})

// Búsqueda simple (name / org / cargo)
r.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim()
    const like = `%${q}%`

    const rows = await Person.findAll({
      where: {
        [Op.or]: [
          { name:  { [Op.like]: like } },
          { org:   { [Op.like]: like } },
          { cargo: { [Op.like]: like } },
        ],
      },
      order: [['name', 'ASC']],
      limit: 50,
    })
    res.json(rows)
  } catch (e) { next(e) }
})

export default r
