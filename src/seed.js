// src/seed.js
import { Person } from './models/Person.js'
import { Palco } from './models/Palco.js'
import { PalcoSeat } from './models/PalcoSeat.js'

export async function seedIfEmpty() {
  // ====== SEED PALCOS / ASIENTOS ======
  const palcoCount = await Palco.count()
  const seatCount = await PalcoSeat.count()

  if (palcoCount === 0) {
    console.log('[SEED] Creando palcos iniciales...')
    await Palco.bulkCreate([
      { id: 1, name: 'PALCO PRINCIPAL' },
      { id: 2, name: 'PALCO A' },
      { id: 3, name: 'PALCO B' },
    ])
  }

  if (seatCount === 0) {
    console.log('[SEED] Generando asientos por palco...')

    // Config base (ajustá filas/cols si tu palco real es diferente)
    const layout = {
      rows: ['A', 'B', 'C', 'D'],
      cols: 12,
    }

    const seatsToCreate = []

    // Palco 1,2,3 todos con mismo layout inicial
    for (const palcoId of [1, 2, 3]) {
      for (const rowLetter of layout.rows) {
        for (let c = 1; c <= layout.cols; c++) {
          seatsToCreate.push({
            palcoId,
            code: `${rowLetter}${c}`,
            row: rowLetter,
            col: c,
          })
        }
      }
    }

    await PalcoSeat.bulkCreate(seatsToCreate)
  }

  // ====== SEED PERSONS (solo si está vacío) ======
  const peopleCount = await Person.count()
  if (peopleCount === 0) {
    console.log('[SEED] Insertando personas demo...')

    await Person.bulkCreate([
      {
        name: 'CAROLINA CONTRERAS',
        doc: '40254119',
        org: 'PFA',
        seat: 'C5',
        present: false,
        presentAt: null,
      },
      {
        name: 'NICOLAS CORTEZ',
        doc: '65454354354',
        org: 'PFA',
        seat: 'A6',
        present: true,
        presentAt: new Date(),
      },
      // ...agregá acá más si querés
    ])
  } else {
    console.log(`[SEED] Tabla person ya tiene ${peopleCount} filas.`)
  }
}
