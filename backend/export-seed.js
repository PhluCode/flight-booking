import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'
import db from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, 'seed-data.sql')

const TABLE_ORDER = [
  'users',
  'airports',
  'airlines',
  'flights',
  'seats',
  'bookings',
  'passengers',
  'payments',
]

function listTables() {
  const rows = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  `).all()
  return rows.map(r => r.name)
}

function quoteIdent(name) {
  return `"${name.replace(/"/g, '""')}"`
}

function getColumns(table) {
  const rows = db.prepare(`PRAGMA table_info(${quoteIdent(table)})`).all()
  return rows.map(r => r.name)
}

function exportTable(table) {
  const columns = getColumns(table)
  if (!columns.length) return { columns: [], rows: [] }

  const colSql = columns.map(quoteIdent).join(', ')
  const rows = db.prepare(`SELECT ${colSql} FROM ${quoteIdent(table)}`).all()
  return { columns, rows }
}

const tables = listTables()
const ordered = [
  ...TABLE_ORDER.filter(t => tables.includes(t)),
  ...tables.filter(t => !TABLE_ORDER.includes(t)).sort(),
]

const lines = []
lines.push('BEGIN TRANSACTION;')
lines.push(`-- Exported at ${new Date().toISOString()}`)
lines.push('')

for (const table of ordered) {
  lines.push(`DELETE FROM ${quoteIdent(table)};`)
}
lines.push('DELETE FROM sqlite_sequence;')
lines.push('')

function toSqlValue(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'bigint') return v.toString()
  if (typeof v === 'boolean') return v ? '1' : '0'
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) {
    const buf = Buffer.from(v)
    return `X'${buf.toString('hex')}'`
  }
  return `'${String(v).replace(/'/g, "''")}'`
}

for (const table of ordered) {
  const entry = exportTable(table)
  if (!entry.columns.length || !entry.rows.length) continue

  const columns = entry.columns.map(quoteIdent).join(', ')
  const insertPrefix = `INSERT INTO ${quoteIdent(table)} (${columns}) VALUES `

  for (const row of entry.rows) {
    const values = entry.columns.map(c => toSqlValue(row[c])).join(', ')
    lines.push(insertPrefix + `(${values});`)
  }
  lines.push('')
}

lines.push('COMMIT;')
lines.push('')
fs.writeFileSync(outPath, lines.join('\n'))
console.log(`Exported ${ordered.length} tables to ${outPath}`)
