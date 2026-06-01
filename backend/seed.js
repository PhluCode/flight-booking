import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'
import db from './db.js'

/* =========================================================
   seed.js — rebuilds the demo database.
   Generates flights for EVERY airport pair (both directions)
   so any origin/destination the user picks returns results.
   Durations & prices are derived from real coordinates, so
   the data looks believable without hand-writing each route.
   Run with:  npm run seed
   ========================================================= */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedPath = path.join(__dirname, 'seed-data.sql')

function importFromSql(filePath) {
  const sql = fs.readFileSync(filePath, 'utf-8')
  db.exec(sql)
}

if (fs.existsSync(seedPath)) {
  importFromSql(seedPath)
  console.log(`Seeded from ${seedPath}`)
  process.exit(0)
}

// ---- Clear existing data (children first for FK integrity) ----
// NOTE: the users table is deliberately KEPT so that registered accounts (and
// their saved JWT tokens) survive a re-seed — otherwise a re-seed would delete
// the user a token points to and every booking would fail with a FK error.
db.exec(`
  DELETE FROM payments;  DELETE FROM passengers; DELETE FROM bookings;
  DELETE FROM seats;     DELETE FROM flights;    DELETE FROM airlines;
  DELETE FROM airports;
`)
// reset AUTOINCREMENT counters for the wiped tables only (NOT users)
try { db.exec("DELETE FROM sqlite_sequence WHERE name != 'users'") } catch {}

// ---- Demo user (password is hashed with bcrypt — never stored plain) ----
const passwordHash = bcrypt.hashSync('password123', 10)
db.prepare(
  'INSERT OR IGNORE INTO users (full_name, email, password_hash, phone) VALUES (?, ?, ?, ?)'
).run('Demo User', 'user@example.com', passwordHash, '0123456789')

// ---- Airports (18, international) with coordinates [lat, lon] ----
const AIRPORTS = [
  // code, name, city, country, lat, lon
  ['BKK', 'Suvarnabhumi Airport',          'Bangkok',          'Thailand',        13.69, 100.75],
  ['DMK', 'Don Mueang Airport',            'Bangkok',          'Thailand',        13.91, 100.61],
  ['CNX', 'Chiang Mai Airport',            'Chiang Mai',       'Thailand',        18.77,  98.96],
  ['HKT', 'Phuket International Airport',   'Phuket',           'Thailand',         8.11,  98.31],
  ['HDY', 'Hat Yai International Airport',  'Hat Yai',          'Thailand',         6.93, 100.39],
  ['USM', 'Samui Airport',                 'Koh Samui',        'Thailand',         9.55, 100.06],
  ['SIN', 'Changi Airport',                'Singapore',        'Singapore',        1.36, 103.99],
  ['KUL', 'Kuala Lumpur Intl Airport',     'Kuala Lumpur',     'Malaysia',         2.74, 101.71],
  ['HKG', 'Hong Kong Intl Airport',        'Hong Kong',        'Hong Kong',       22.31, 113.91],
  ['HND', 'Tokyo Haneda Airport',          'Tokyo',            'Japan',           35.55, 139.78],
  ['NRT', 'Tokyo Narita Airport',          'Tokyo',            'Japan',           35.77, 140.39],
  ['ICN', 'Incheon Intl Airport',          'Seoul',            'South Korea',     37.46, 126.44],
  ['TPE', 'Taoyuan Intl Airport',          'Taipei',           'Taiwan',          25.08, 121.23],
  ['SGN', 'Tan Son Nhat Airport',          'Ho Chi Minh City', 'Vietnam',         10.82, 106.65],
  ['DXB', 'Dubai Intl Airport',            'Dubai',            'UAE',             25.25,  55.36],
  ['LHR', 'Heathrow Airport',              'London',           'United Kingdom',  51.47,  -0.45],
  ['CDG', 'Charles de Gaulle Airport',     'Paris',            'France',          49.01,   2.55],
  ['SYD', 'Kingsford Smith Airport',       'Sydney',           'Australia',      -33.94, 151.18],
]
const insertAirport = db.prepare('INSERT INTO airports (code, name, city, country) VALUES (?,?,?,?)')
for (const [code, name, city, country] of AIRPORTS) insertAirport.run(code, name, city, country)

// quick coordinate lookup
const COORD = {}
for (const [code, , , country, lat, lon] of AIRPORTS) COORD[code] = { country, lat, lon }
const THAI = new Set(AIRPORTS.filter(a => a[3] === 'Thailand').map(a => a[0]))

// ---- Airlines (10) ----
const AIRLINES = [
  ['TG', 'Thai Airways'],     ['FD', 'Thai AirAsia'],
  ['TR', 'Scoot'],            ['SQ', 'Singapore Airlines'],
  ['CX', 'Cathay Pacific'],   ['BR', 'EVA Air'],
  ['JL', 'Japan Airlines'],   ['KE', 'Korean Air'],
  ['EK', 'Emirates'],         ['QF', 'Qantas'],
]
const insertAirline = db.prepare('INSERT INTO airlines (code, name) VALUES (?,?)')
for (const a of AIRLINES) insertAirline.run(...a)

// ---- Lookups ----
const airportId = (code) => db.prepare('SELECT id FROM airports WHERE code = ?').get(code).id
const airlineId = (code) => db.prepare('SELECT id FROM airlines WHERE code = ?').get(code).id
const airportIds = Object.fromEntries(AIRPORTS.map(a => [a[0], airportId(a[0])]))
const airlineIds = Object.fromEntries(AIRLINES.map(a => [a[0], airlineId(a[0])]))

// ---- Great-circle distance (km) ----
function distanceKm(a, b) {
  const R = 6371, toRad = (d) => d * Math.PI / 180
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon)
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// airline pool by route type
const DOMESTIC = ['TG', 'FD']
const REGIONAL = ['TG', 'FD', 'TR', 'SQ', 'CX', 'BR', 'JL', 'KE']
const LONGHAUL = ['TG', 'EK', 'QF', 'SQ', 'CX']
function poolFor(from, to, dist) {
  if (THAI.has(from) && THAI.has(to)) return DOMESTIC
  if (dist > 5500) return LONGHAUL
  return REGIONAL
}

// ---- Config ----
const DAYS = 14                       // 2026-06-01 .. 2026-06-14
const START = new Date('2026-06-01')
const FLIGHTS_PER_ROUTE_PER_DAY = 10  // guarantees "10 results for every search"
const SEAT_ROWS = 30                  // 30 x 6 = 180 seats / flight
const SEAT_COLS = ['A', 'B', 'C', 'H', 'J', 'K']   // airline-style lettering (skips I, etc.)
const TOTAL_SEATS = SEAT_ROWS * SEAT_COLS.length
// NOTE: seats are created on demand (see flights.service.ensureSeats) so the
// DB stays small — we don't pre-generate 180 seats for all 42k+ flights.
// depart times spread across the day (~06:00–21:30)
const SLOTS = [360, 465, 570, 660, 750, 840, 930, 1035, 1140, 1290]

const insertFlight = db.prepare(`
  INSERT INTO flights
    (flight_number, airline_id, origin_airport_id, destination_airport_id,
     departure_time, arrival_time, duration, price, stops, gate, total_seats, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
`)

const pad = (n) => String(n).padStart(2, '0')
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`

// all ordered airport pairs (both directions)
const codes = AIRPORTS.map(a => a[0])
const pairs = []
for (const from of codes) for (const to of codes) if (from !== to) pairs.push([from, to])

let flightCount = 0
const flightNoCounter = {}

db.exec('BEGIN')
try {
  for (let day = 0; day < DAYS; day++) {
    for (const [from, to] of pairs) {
      const dist = distanceKm(COORD[from], COORD[to])
      const baseDur = Math.round(dist / 13) + 35           // ~780 km/h + buffer
      const basePrice = dist * 2.4 + 700                   // THB
      const pool = poolFor(from, to, dist)

      for (let i = 0; i < FLIGHTS_PER_ROUTE_PER_DAY; i++) {
        const al = pool[i % pool.length]

        const dep = new Date(START)
        dep.setDate(dep.getDate() + day)
        dep.setHours(0, SLOTS[i % SLOTS.length], 0, 0)

        const stops = dist > 4500 && i % 4 === 0 ? 1 : 0
        const duration = baseDur + (i % 3) * 10 + stops * 70
        const arr = new Date(dep.getTime() + duration * 60000)
        const price = Math.round(basePrice * (0.85 + (i % 5) * 0.07) / 10) * 10
        const gate = SEAT_COLS[i % SEAT_COLS.length] + (1 + (i % 9))

        flightNoCounter[al] = (flightNoCounter[al] || 100) + 1
        const flightNumber = `${al}${flightNoCounter[al]}`

        insertFlight.run(
          flightNumber, airlineIds[al], airportIds[from], airportIds[to],
          fmt(dep), fmt(arr), duration, price, stops, gate, TOTAL_SEATS
        )
        flightCount++
      }
    }
  }
  db.exec('COMMIT')
} catch (err) {
  db.exec('ROLLBACK')
  throw err
}

console.log(`Seeded: ${AIRPORTS.length} airports, ${AIRLINES.length} airlines`)
console.log(`        ${flightCount} flights (seats created on demand, ${TOTAL_SEATS}/flight)`)
console.log(`        ${pairs.length} routes x ${DAYS} days x ${FLIGHTS_PER_ROUTE_PER_DAY} flights`)
console.log(`        Date window: 2026-06-01 .. 2026-06-${pad(DAYS)}`)
console.log('Done! Run: npm run dev')
