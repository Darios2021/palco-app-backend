import { Person } from './models/Person.js'

function* seatCodes(rows = ['A','B','C','D'], cols = 10) {
  for (const r of rows) for (let i = 1; i <= cols; i++) yield `${r}${i}`
}

export async function seedIfEmpty() {
  const n = await Person.count()
  if (n > 0) {
    console.log(`[SEED] Tabla person ya tiene ${n} filas.`)
    return
  }

  const names = ['Juan Pérez','María López','Carlos Gómez','Ana Fernández','Luis Morales']
  const orgs = ['PFA','D-8','Operativo Central','CIMe','Tribuna Segura']
  const cargos = ['Agente','Inspector','Oficial','Supervisor','Operador']
  const seats = [...seatCodes(['A','B','C','D'], 10)]
  const rows = names.map((name, i) => ({
    name,
    doc: `DNI${30000000 + i}`,
    org: orgs[i % orgs.length],
    cargo: cargos[i % cargos.length],
    seat: seats[i],
    present: i % 2 === 0,
    presentAt: i % 2 === 0 ? new Date() : null,
  }))

  await Person.bulkCreate(rows)
  console.log(`[SEED] Insertadas ${rows.length} personas de prueba.`)
}
