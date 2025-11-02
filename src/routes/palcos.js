// src/routes/palcos.js
import { Router } from 'express'
import { Op } from 'sequelize'
import { Palco } from '../models/Palco.js'
import { PalcoSeat } from '../models/PalcoSeat.js'
import { Person } from '../models/Person.js'

const r = Router()

/**
 * GET /api/palcos
 * Devuelve la lista de palcos activos ordenados para el frontend (tabs mobile)
 */
r.get('/', async (_req, res, next) => {
  try {
    const rows = await Palco.findAll({
      where: { activo: true },
      order: [['orden_visual', 'ASC']],
      attributes: ['id','code','nombre','prioridad','orden_visual'],
    })
    res.json(rows)
  } catch (e) { next(e) }
})

/**
 * GET /api/palcos/:id/seats
 * Devuelve todos los asientos de un palco, con estado y datos básicos de persona.
 * Esto alimenta el grid (botones verdes/amarillos/grises).
 */
r.get('/:id/seats', async (req, res, next) => {
  try {
    const palcoId = Number(req.params.id)

    const seats = await PalcoSeat.findAll({
      where: { palco_id: palcoId },
      order: [
        // orden visual: fila de arriba a abajo (Z->A). Ej G,F,E...A
        ['row_letter', 'DESC'],
        // dentro de la fila, asiento 1..12
        ['seat_number', 'ASC'],
      ],
    })

    // traigo las personas referenciadas en esos asientos en un solo query
    const personIds = [
      ...new Set(
        seats
          .map(s => s.assigned_to_person_id)
          .filter(Boolean)
      ),
    ]

    let peopleById = {}
    if (personIds.length) {
      const people = await Person.findAll({
        where: { id: { [Op.in]: personIds } },
        attributes: ['id','name','doc','org','cargo','present','presentAt','seat'],
      })
      for (const p of people) {
        peopleById[p.id] = p.toJSON()
      }
    }

    // armamos payload final asiento por asiento
    const payload = seats.map(s => {
      const seat = s.toJSON()
      const person = seat.assigned_to_person_id
        ? peopleById[seat.assigned_to_person_id] || null
        : null

      // status visual que usa el frontend:
      // - si esta marcado presente -> "present" (verde)
      // - sino si tiene persona asignada -> "assigned" (amarillo)
      // - sino -> "free" (gris)
      let status = 'free'
      if (seat.present) {
        status = 'present'
      } else if (seat.assigned_to_person_id) {
        status = 'assigned'
      }

      return {
        id: seat.id,
        seat_code: seat.seat_code,          // ej "C6"
        row_letter: seat.row_letter,        // ej "C"
        seat_number: seat.seat_number,      // ej 6
        status,                             // "present" | "assigned" | "free"
        present: !!seat.present,
        present_at: seat.present_at,
        person,
      }
    })

    res.json(payload)
  } catch (e) { next(e) }
})

/**
 * POST /api/seats/:seatId/assign
 * Body: { personId }
 * - asigna esa persona al asiento
 * - sincroniza person.seat
 * - deja el asiento en estado "assigned", no "present"
 */
r.post('/seats/:seatId/assign', async (req, res, next) => {
  try {
    const seatId = Number(req.params.seatId)
    const { personId } = req.body || {}
    if (!personId) {
      return res.status(400).json({ error: 'personId required' })
    }

    // buscamos asiento
    const seatRow = await PalcoSeat.findByPk(seatId)
    if (!seatRow) return res.status(404).json({ error: 'Seat not found' })

    // buscamos persona
    const personRow = await Person.findByPk(personId)
    if (!personRow) return res.status(404).json({ error: 'Person not found' })

    // update asiento
    await seatRow.update({
      assigned_to_person_id: personRow.id,
      present: false,
      present_at: null,
    })

    // sync campo seat en person (para compat con pantallas viejas)
    await personRow.update({
      seat: seatRow.seat_code,
      // NO marcamos presente acá, solo asignado
      present: false,
      presentAt: null,
    })

    res.json({
      ok: true,
      seat: seatRow,
      person: personRow,
    })
  } catch (e) { next(e) }
})


/**
 * POST /api/seats/:seatId/present
 * Marca que la persona asignada a ese asiento ingresó (check-in real).
 * - present=1 en palco_seats
 * - person.present=1 tambien
 */
r.post('/seats/:seatId/present', async (req, res, next) => {
  try {
    const seatId = Number(req.params.seatId)
    const seatRow = await PalcoSeat.findByPk(seatId)

    if (!seatRow) return res.status(404).json({ error: 'Seat not found' })
    if (!seatRow.assigned_to_person_id) {
      return res.status(400).json({ error: 'No person assigned to this seat' })
    }

    const now = new Date()

    // update asiento
    await seatRow.update({
      present: true,
      present_at: now,
    })

    // update persona
    const personRow = await Person.findByPk(seatRow.assigned_to_person_id)
    if (personRow) {
      await personRow.update({
        present: true,
        presentAt: now,
        seat: seatRow.seat_code,
      })
    }

    res.json({
      ok: true,
      seat: seatRow,
      person: personRow || null,
    })
  } catch (e) { next(e) }
})

/**
 * POST /api/seats/:seatId/release
 * Desasigna el asiento:
 * - libera el asiento para otra persona
 * - limpia present/present_at
 * - en la persona deja seat = NULL, present = 0
 */
r.post('/seats/:seatId/release', async (req, res, next) => {
  try {
    const seatId = Number(req.params.seatId)
    const seatRow = await PalcoSeat.findByPk(seatId)
    if (!seatRow) return res.status(404).json({ error: 'Seat not found' })

    const personId = seatRow.assigned_to_person_id

    // limpiamos asiento
    await seatRow.update({
      assigned_to_person_id: null,
      present: false,
      present_at: null,
    })

    // limpiamos persona asociada
    if (personId) {
      const personRow = await Person.findByPk(personId)
      if (personRow) {
        await personRow.update({
          seat: null,
          present: false,
          presentAt: null,
        })
      }
    }

    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default r
