import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import db from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, 'seed-data.sql')

if (!fs.existsSync(sqlPath)) {
  console.error('seed-data.sql not found in backend folder')
  process.exit(1)
}

const sql = fs.readFileSync(sqlPath, 'utf8')

try {
  db.exec(sql)
  console.log('Seed applied successfully to', path.join(__dirname, 'database.db'))
} catch (err) {
  console.error('Failed to apply seed:', err)
  process.exit(1)
}
