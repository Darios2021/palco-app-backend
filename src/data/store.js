import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_FILE = join(__dirname, 'db.json')

const defaults = {
  config: {
    rows: (process.env.SEAT_ROWS || 'A,B,C,D').split(',').map(s => s.trim()),
    cols: Number(process.env.SEAT_COLS || 10)
  },
  people: []
}

async function ensureFile() {
  try {
    await mkdir(__dirname, { recursive: true })
    await readFile(DB_FILE, 'utf8')
  } catch {
    await writeFile(DB_FILE, JSON.stringify(defaults, null, 2), 'utf8')
  }
}

export async function loadDB() {
  await ensureFile()
  const raw = await readFile(DB_FILE, 'utf8')
  const data = JSON.parse(raw || '{}')
  return { ...defaults, ...data, config: { ...defaults.config, ...(data?.config || {}) } }
}

export async function saveDB(data) {
  await writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8')
}

export function buildSeatsMatrix(rows, cols) {
  return rows.map(r => Array.from({ length: cols }, (_, i) => `${r}${i + 1}`))
}
