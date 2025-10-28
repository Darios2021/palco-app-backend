// src/db.js
import { Sequelize } from 'sequelize'

const {
  DB_DIALECT = 'mysql',
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_NAME = 'palco_db',
  DB_USER = 'palco',
  DB_PASS = '',
} = process.env

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: DB_DIALECT,
  logging: false,
  define: {
    freezeTableName: true,   // no pluraliza nombres
    underscored: true,       // created_at, updated_at
  },
})

export async function ensureConnection() {
  await sequelize.authenticate()
  console.log(`[DB] Conectado a ${DB_DIALECT}://${DB_HOST}:${DB_PORT}/${DB_NAME}`)
}
