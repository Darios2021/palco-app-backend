// src/db.js
import { Sequelize } from 'sequelize'
import 'dotenv/config'

const DIALECT = process.env.DB_DIALECT || 'mysql'
const HOST    = process.env.DB_HOST || 'localhost'
const PORT    = Number(process.env.DB_PORT || 3306)
const DBNAME  = process.env.DB_NAME || 'palco_db'
const USER    = process.env.DB_USER || 'root'
const PASS    = process.env.DB_PASS || ''

export const sequelize = new Sequelize(DBNAME, USER, PASS, {
  host: HOST,
  port: PORT,
  dialect: DIALECT,
  logging: false,
  dialectOptions: { multipleStatements: true },
  define: {
    underscored: false,     // 👈 muy importante: columnas camelCase (createdAt, userId)
    freezeTableName: false, // usa tableName definido en cada modelo
  },
})

/** Compatibilidad: algunos módulos esperan getDB() */
export function getDB() {
  return sequelize
}

/** Conexión con reintentos (para CapRover + MySQL) */
export async function ensureConnection(retries = 20, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await sequelize.authenticate()
      console.log('[DB] Conectado ✔')
      return
    } catch (err) {
      const left = retries - i
      console.error(`[DB] Falló intento ${i}: ${err.message} — reintenta en ${delayMs}ms (${left} restantes)`)
      if (left <= 0) throw err
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
}
