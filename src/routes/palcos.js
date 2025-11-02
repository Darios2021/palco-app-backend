// src/routes/palcos.js
import { Router } from 'express'
import { Op } from 'sequelize'
import { Palco } from '../models/Palco.js'
import { PalcoSeat } from '../models/PalcoSeat.js'
import { Person } from '../models/Person.js'

const r = Router()

// ==== helper: arma estructura filas -> asientos ====
function buildRowsWithStatus(seats, peopleBySeatCode) {
  // seats: filas de PalcoSeat
  // peopleBySeatCode: { "A1": person || undefined }

  const byRow = {} // { "A": [ { seat_code, status, person }, ...], "B": [...] }

  for (const s of seats) {
    const code = s.seat_code
    const p = peopleBySeatCode[code]

    let status = 'free'
    if (p) {
      status = p.present ? 'present' : 'assigned'
    }

    if (!byRow[s.row_letter]) {
      byRow[s.row_letter] = []
    }

    byRow[s.row_letter].push({
      seat_code: code,
      seat_number: s.seat_number,
      status,
      person: p
        ? {
            id: p.id,
            name: p.name,
            doc: p.doc,
            org: p.org,
            cargo: p.cargo,
            seat: p.seat,
            present: p.present,
            presentAt: p.presentAt,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          }
        : null,
    })
  }

  // Orden visual:
  // - filas descendente (G,F,E...) para que la más "atrás" aparezca arriba si así lo diseñaste
  // - dentro de cada fila, asiento ascendente (1,2,3...)
  const rowsOut = Object.keys(byRow)
    .sort((a, b) => {
      if (a === b) return 0
      return a < b ? 1 : -1 // invierte orden alfabético
    })
    .map(letter => {
      const seatsSorted = byRow[letter].sort(
        (s1, s2) => s1.seat_number - s2.seat_number
      )
      return {
        row_letter: letter,
        seats: seatsSorted,
      }
    })

  return rowsOut
}

// ======================================
// GET /api/palcos
// Devuelve lista de palcos (id + nombre)
// ======================================
r.get('/', async (_req, res, next) => {
  try {
    // intentamos leer de DB Palco
    // si aún no tenés tabla Palco poblada,
    // devolvemos un fallback hardcode.

    const palcos = await Palco.findAll({
      order: [['id', 'ASC']],
    }).catch(() => null)

    if (palcos && palcos.length) {
      return res.json(
        palcos.map(p => ({
          id: p.id,
          name: p.name,
        }))
      )
    }

    // fallback si la tabla está vacía o no existe
    return res.json([
      { id: 1, name: 'PALCO PRINCIPAL' },
      { id: 2, name: 'PALCO A' },
      { id: 3, name: 'PALCO B' },
    ])
  } catch (e) {
    next(e)
  }
})

// ======================================================
// GET /api/palcos/:id/seats
// Devuelve TODA la grilla del palco con estado de cada seat
// ======================================================
r.get('/:id/seats', async (req, res, next) => {
  try {
    const palcoId = Number(req.params.id)

    // 1. obtenemos todos los asientos físicos de ese palco
    const seats = await PalcoSeat.findAll({
      where: { palco_id: palcoId },
      order: [
        ['row_letter', 'DESC'],
        ['seat_number', 'ASC'],
      ],
    })

    if (!seats || seats.length === 0) {
      return res.status(404).json({
        error: 'Palco no encontrado o sin asientos',
      })
    }

    // 2. de esos asientos, qué códigos tengo?
    const codes = seats.map(s => s.seat_code)

    // 3. traigo las personas sentadas en esos códigos
    const people = await Person.findAll({
      where: { seat: { [Op.in]: codes } },
    })

    // 4. indexo por seat_code
    const peopleBySeatCode = {}
    for (const p of people) {
      peopleBySeatCode[p.seat] = p.toJSON()
    }

    // 5. armo estructura de salida
    const rowsOut = buildRowsWithStatus(seats, peopleBySeatCode)

    res.json({
      palco_id: palcoId,
      rows: rowsOut,
    })
  } catch (e) {
    next(e)
  }
})

// ======================================================
// POST /api/palcos/palco-seat/:seatId/present
// Marca PRESENTE a la persona sentada en ese asiento
// ======================================================
r.post('/palco-seat/:seatId/present', async (req, res, next) => {
  try {
    const seatId = Number(req.params.seatId)

    // 1. buscamos el asiento físico
    const seatRow = await PalcoSeat.findByPk(seatId)
    if (!seatRow) {
      return res.status(404).json({ error: 'Asiento no existe' })
    }

    // 2. buscamos la persona que ocupa ese seat_code
    const person = await Person.findOne({
      where: { seat: seatRow.seat_code },
    })

    if (!person) {
      return res
        .status(404)
        .json({ error: 'No hay persona asignada a este asiento' })
    }

    // 3. la marcamos presente
    await person.update({
      present: true,
      presentAt: new Date(),
    })

    return res.json(person)
  } catch (e) {
    next(e)
  }
})

// ======================================================
// POST /api/palcos/palco-seat/:seatId/release
// Libera asiento: quita seat y pone present=false
// ======================================================
r.post('/palco-seat/:seatId/release', async (req, res, next) => {
  try {
    const seatId = Number(req.params.seatId)

    // 1. buscamos el asiento físico
    const seatRow = await PalcoSeat.findByPk(seatId)
    if (!seatRow) {
      return res.status(404).json({ error: 'Asiento no existe' })
    }

    // 2. buscamos la persona que ocupa ese seat_code
    const person = await Person.findOne({
      where: { seat: seatRow.seat_code },
    })

    if (!person) {
      // nadie sentado -> ya liberado
      return res.json({ released: true, person: null })
    }

    // 3. desasignamos asiento y marcamos como no presente
    await person.update({
      seat: null,
      present: false,
      presentAt: null,
    })

    return res.json({
      released: true,
      person,
    })
  } catch (e) {
    next(e)
  }
})

export default r
