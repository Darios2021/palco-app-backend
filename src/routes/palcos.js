// src/routes/palcos.js
import { Router } from 'express'
import { Palco } from '../models/Palco.js'
import { PalcoSeat } from '../models/PalcoSeat.js'
import { Person } from '../models/Person.js'

const r = Router()

/* ============================================================
   GET /api/palcos
   Devuelve lista corta de palcos disponibles
   -> [ { id:1, name:"PALCO PRINCIPAL" }, ... ]
============================================================ */
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

/* ============================================================
   helper: arma estructura para el front

   agrupamos los asientos de un palco en filas:
   [
     { letter:'A', codes:['A1','A2','A3', ...] },
     { letter:'B', codes:['B1','B2', ...] },
     ...
   ]

   y además devolvemos matriz tipo:
   [
     ['A1','A2','A3',...],
     ['B1','B2','B3',...],
     ...
   ]
   (esto es lo que tu front usa como data.seats)
============================================================ */
function groupSeatsByRow(seats) {
  // seats: [{row:'A', col:1, code:'A1'}, ...] ya ordenados por row ASC, col ASC

  const byRow = {}
  for (const s of seats) {
    if (!byRow[s.row]) {
      byRow[s.row] = []
    }
    byRow[s.row].push({ col: s.col, code: s.code })
  }

  // ordenamos las filas por la letra (A,B,C... o H,I,J...)
  const rowLettersSorted = Object.keys(byRow).sort((a, b) => {
    // compara letra como string normal
    if (a < b) return -1
    if (a > b) return 1
    return 0
  })

  // Para cada fila: ordenamos las columnas por número y armamos output
  const rowsOut = rowLettersSorted.map(letter => {
    const list = byRow[letter].sort((a, b) => a.col - b.col)
    return {
      letter,
      codes: list.map(x => x.code),
    }
  })

  // matriz seatsMatrix = sólo los códigos, sin metadata
  const seatsMatrix = rowsOut.map(r => r.codes)

  return {
    rowsOut,                // [{letter:'A',codes:['A1','A2',...]}]
    seatsMatrix,            // [ ['A1','A2',...], ['B1','B2',...] ]
    rowLettersSorted,       // ['A','B','C', ...]
    maxCol: Math.max(
      0,
      ...rowsOut.map(r => r.codes.length)
    ),
  }
}

/* ============================================================
   GET /api/palcos/:palcoId/seats
   -> { palcoId, name, rows, cols, seats, status }

   status = { "A1":"present", "A2":"assigned", ... }
============================================================ */
r.get('/:palcoId/seats', async (req, res, next) => {
  try {
    const palcoId = Number(req.params.palcoId)

    // 1. Buscar el palco
    const palco = await Palco.findByPk(palcoId, {
      attributes: ['id', 'name'],
    })
    if (!palco) {
      return res.status(404).json({ error: 'Palco no encontrado' })
    }

    // 2. Buscar todos los asientos de ese palco
    const allSeats = await PalcoSeat.findAll({
      where: { palcoId },
      order: [
        ['row', 'ASC'],
        ['col', 'ASC'],
      ],
    })

    // Puede existir un palco sin asientos aún
    if (!allSeats.length) {
      return res.json({
        palcoId: palco.id,
        name: palco.name,
        rows: [],
        cols: 0,
        seats: [],
        status: {},
      })
    }

    // 3. Agrupar en filas y matriz
    const {
      rowsOut,
      seatsMatrix,
      rowLettersSorted,
      maxCol,
    } = groupSeatsByRow(allSeats)

    // 4. Armar status ocupación
    //    Buscamos todas las personas que estén sentadas en alguno de esos codes
    const seatCodes = allSeats.map(s => s.code)
    const people = await Person.findAll({
      where: { seat: seatCodes },
      attributes: ['id','name','seat','present','presentAt'],
    })

    const status = {}
    for (const p of people) {
      if (!p.seat) continue
      status[p.seat] = p.present ? 'present' : 'assigned'
    }

    res.json({
      palcoId: palco.id,
      name: palco.name,
      rows: rowLettersSorted,   // ej ['A','B','C']
      cols: maxCol,             // ej 12
      seats: seatsMatrix,       // ej [ ['A1','A2'...], ['B1','B2'...] ]
      status,                   // ej { A1:'present', B5:'assigned' }
    })
  } catch (e) {
    next(e)
  }
})

/* ============================================================
   POST /api/palcos/:palcoId/seats
   Crear asiento(s) en un palco

   Body modos:
   1) asiento puntual:
      {
        "rowLetter": "A",
        "seatNumber": 13
      }
      → crea "A13" (row='A', col=13, code='A13')

   2) fila completa:
      {
        "rowLetter": "R",
        "seatNumber": 10,
        "mode": "fullRow"
      }
      → crea R1..R10 de una. (R1,R2,...R10)

   Devuelve { ok:true, created: N } ó { ok:false,... }
============================================================ */
r.post('/:palcoId/seats', async (req, res, next) => {
  try {
    const palcoId = Number(req.params.palcoId)
    const { rowLetter, seatNumber, mode } = req.body

    if (!rowLetter || !seatNumber) {
      return res.status(400).json({ ok: false, error: 'rowLetter y seatNumber son requeridos' })
    }

    const row = String(rowLetter).trim().toUpperCase()

    // caso fila completa
    if (mode === 'fullRow') {
      const count = Number(seatNumber)
      if (!Number.isInteger(count) || count <= 0) {
        return res.status(400).json({ ok: false, error: 'seatNumber inválido para fullRow' })
      }

      const bulkPayload = []
      for (let i = 1; i <= count; i++) {
        bulkPayload.push({
          palcoId,
          row,
          col: i,
          code: `${row}${i}`,
        })
      }

      await PalcoSeat.bulkCreate(bulkPayload, { ignoreDuplicates: true })
      return res.json({ ok: true, created: bulkPayload.length })
    }

    // caso asiento puntual
    const colNum = Number(seatNumber)
    if (!Number.isInteger(colNum) || colNum <= 0) {
      return res.status(400).json({ ok: false, error: 'seatNumber inválido' })
    }

    const code = `${row}${colNum}`

    const seat = await PalcoSeat.create({
      palcoId,
      row,
      col: colNum,
      code,
    })

    return res.json({ ok: true, seat })
  } catch (e) {
    next(e)
  }
})

/* ============================================================
   DELETE /api/palcos/:palcoId/seats/:code
   Borra un asiento puntual de ese palco.
   También debería (lógicamente) liberar a la persona que lo ocupa,
   si hay alguien sentado ahí.
============================================================ */
r.delete('/:palcoId/seats/:code', async (req, res, next) => {
  try {
    const palcoId = Number(req.params.palcoId)
    const code = String(req.params.code).trim().toUpperCase()

    // 1. liberar persona si estaba usando este asiento
    const person = await Person.findOne({ where: { seat: code } })
    if (person) {
      await person.update({
        seat: null,
        present: false,
      })
    }

    // 2. borrar el asiento físico
    const deletedCount = await PalcoSeat.destroy({
      where: { palcoId, code },
    })

    if (!deletedCount) {
      return res.status(404).json({
        ok: false,
        message: 'Asiento no encontrado en este palco',
      })
    }

    res.json({
      ok: true,
      removed: code,
    })
  } catch (e) {
    next(e)
  }
})

/* ============================================================
   POST /api/palcos/palco-seat/:seatId/present
   Marca PRESENTE a la persona que tiene asignado ese asiento.
   (atajo operativo tipo control de ingreso rápido)
============================================================ */
r.post('/palco-seat/:seatId/present', async (req, res, next) => {
  try {
    const seatId = Number(req.params.seatId)

    const seat = await PalcoSeat.findByPk(seatId)
    if (!seat) {
      return res.status(404).json({ error: 'Asiento no existe' })
    }

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

/* ============================================================
   POST /api/palcos/palco-seat/:seatId/release
   Libera ese asiento:
   - a la persona sentada ahí se le quita el seat
   - y se marca present = false (ya no está adentro)
============================================================ */
r.post('/palco-seat/:seatId/release', async (req, res, next) => {
  try {
    const seatId = Number(req.params.seatId)

    const seat = await PalcoSeat.findByPk(seatId)
    if (!seat) {
      return res.status(404).json({ error: 'Asiento no existe' })
    }

    const person = await Person.findOne({ where: { seat: seat.code } })
    if (!person) {
      // asiento ya estaba libre
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
