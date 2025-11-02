// src/routes/palcos.js
import { Router } from 'express'
import { Palco } from '../models/Palco.js'
import { PalcoSeat } from '../models/PalcoSeat.js'
import { Person } from '../models/Person.js'

const r = Router()

// GET /api/palcos
// -> lista rápida de palcos disponibles
r.get('/', async (_req, res, next) => {
  try {
    const palcos = await Palco.findAll({
      attributes: ['id', 'name'],
      order: [['id', 'ASC']],
    })
    res.json(palcos)
  } catch (e) {
    next(e)
  }
})

/**
 * Helper:
 * arma matriz tipo:
 * rows = ['A','B','C','D']
 * cols = 12
 * seats = [
 *   ['A1','A2',...],
 *   ['B1','B2',...],
 *   ...
 * ]
 */
function buildMatrix(rowsArr, maxCols) {
  return rowsArr.map(rowLetter => {
    const fila = []
    for (let c = 1; c <= maxCols; c++) {
      fila.push(`${rowLetter}${c}`)
    }
    return fila
  })
}

// GET /api/palcos/:palcoId/seats
// -> { palcoId, name, rows, cols, seats, status }
r.get('/:palcoId/seats', async (req, res, next) => {
  try {
    const palcoId = Number(req.params.palcoId)

    // buscamos el palco
    const palco = await Palco.findByPk(palcoId, {
      attributes: ['id', 'name'],
    })
    if (!palco) {
      return res.status(404).json({ error: 'Palco no encontrado' })
    }

    // traemos todos los asientos de ese palco
    const allSeats = await PalcoSeat.findAll({
      where: { palcoId },
      order: [
        ['row', 'ASC'],
        ['col', 'ASC'],
      ],
    })

    if (!allSeats.length) {
      return res.status(404).json({ error: 'Palco no encontrado o sin asientos' })
    }

    // calculo filas únicas y cols máximas
    const rowSet = new Set()
    let maxCol = 0
    for (const s of allSeats) {
      rowSet.add(s.row)
      if (s.col > maxCol) maxCol = s.col
    }
    const rowsArr = Array.from(rowSet).sort() // ['A','B','C','D', ...]

    // matriz visual
    const seatsMatrix = buildMatrix(rowsArr, maxCol)

    // status { "A1": "assigned"|"present", ... }
    //  - buscamos personas que matchean esos codes
    const seatCodes = allSeats.map(s => s.code)
    const people = await Person.findAll({
      where: { seat: seatCodes },
    })

    const status = {}
    for (const p of people) {
      if (!p.seat) continue
      status[p.seat] = p.present ? 'present' : 'assigned'
    }

    res.json({
      palcoId: palco.id,
      name: palco.name,
      rows: rowsArr,
      cols: maxCol,
      seats: seatsMatrix,
      status,
    })
  } catch (e) {
    next(e)
  }
})

/**
 * POST /api/palcos/palco-seat/:seatId/present
 * Marca PRESENTE a la persona sentada ahí.
 * - seatId es el ID interno de palco_seat
 * - actualiza la Person correspondiente (por code)
 */
r.post('/palco-seat/:seatId/present', async (req, res, next) => {
  try {
    const seatId = Number(req.params.seatId)

    // buscamos el asiento
    const seat = await PalcoSeat.findByPk(seatId)
    if (!seat) {
      return res.status(404).json({ error: 'Asiento no existe' })
    }

    // buscamos la persona que tiene ese asiento asignado
    const person = await Person.findOne({ where: { seat: seat.code } })
    if (!person) {
      return res.status(404).json({ error: 'No hay persona asignada a ese asiento' })
    }

    await person.update({
      present: true,
      presentAt: new Date(),
    })

    res.json(person)
  } catch (e) {
    next(e)
  }
})

/**
 * POST /api/palcos/palco-seat/:seatId/release
 * Libera el asiento:
 * - le saca el seat a la persona
 * - y pone present = false
 */
r.post('/palco-seat/:seatId/release', async (req, res, next) => {
  try {
    const seatId = Number(req.params.seatId)

    const seat = await PalcoSeat.findByPk(seatId)
    if (!seat) {
      return res.status(404).json({ error: 'Asiento no existe' })
    }

    const person = await Person.findOne({ where: { seat: seat.code } })
    if (!person) {
      // no hay persona en ese asiento -> nada que liberar
      return res.json({ ok: true, released: true, note: 'Asiento ya libre' })
    }

    await person.update({
      seat: null,
      present: false,
    })

    res.json(person)
  } catch (e) {
    next(e)
  }
})

export default r
