import db from './db.js'

// Clear existing data
db.exec(`
  DELETE FROM payments;  DELETE FROM passengers; DELETE FROM bookings;
  DELETE FROM seats;     DELETE FROM flights;    DELETE FROM airlines;
  DELETE FROM airports;  DELETE FROM users;
`)

// Airports
db.prepare('INSERT INTO airports (code, name, city, country) VALUES (?,?,?,?)').run('BKK', 'Suvarnabhumi Airport',        'Bangkok',    'Thailand')
db.prepare('INSERT INTO airports (code, name, city, country) VALUES (?,?,?,?)').run('DMK', 'Don Mueang Airport',           'Bangkok',    'Thailand')
db.prepare('INSERT INTO airports (code, name, city, country) VALUES (?,?,?,?)').run('CNX', 'Chiang Mai Airport',           'Chiang Mai', 'Thailand')
db.prepare('INSERT INTO airports (code, name, city, country) VALUES (?,?,?,?)').run('HKT', 'Phuket International Airport', 'Phuket',     'Thailand')
db.prepare('INSERT INTO airports (code, name, city, country) VALUES (?,?,?,?)').run('SIN', 'Changi Airport',               'Singapore',  'Singapore')

// Airlines
db.prepare('INSERT INTO airlines (code, name) VALUES (?,?)').run('TG', 'Thai Airways')
db.prepare('INSERT INTO airlines (code, name) VALUES (?,?)').run('FD', 'Thai AirAsia')
db.prepare('INSERT INTO airlines (code, name) VALUES (?,?)').run('SQ', 'Singapore Airlines')

// Helper: get IDs
const airport = (code) => db.prepare('SELECT id FROM airports WHERE code = ?').get(code).id
const airline = (code) => db.prepare('SELECT id FROM airlines WHERE code = ?').get(code).id

// Flights
const insertFlight = db.prepare(`
  INSERT INTO flights (flight_number, airline_id, origin_airport_id, destination_airport_id, departure_time, arrival_time, duration, price, total_seats, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 60, 'scheduled')
`)

const flights = [
  // ── Jun 1 ──
  ['TG100', 'TG', 'BKK', 'CNX', '2026-06-01 07:00:00', '2026-06-01 08:05:00',  65, 1800],
  ['FD110', 'FD', 'BKK', 'CNX', '2026-06-01 11:00:00', '2026-06-01 12:05:00',  65, 1100],
  ['TG112', 'TG', 'BKK', 'CNX', '2026-06-01 15:00:00', '2026-06-01 16:05:00',  65, 1900],
  ['FD114', 'FD', 'BKK', 'CNX', '2026-06-01 18:30:00', '2026-06-01 19:35:00',  65, 1050],
  ['TG102', 'TG', 'CNX', 'BKK', '2026-06-01 09:30:00', '2026-06-01 10:35:00',  65, 1800],
  ['TG103', 'TG', 'CNX', 'BKK', '2026-06-01 13:00:00', '2026-06-01 14:05:00',  65, 1900],
  ['FD115', 'FD', 'CNX', 'BKK', '2026-06-01 17:00:00', '2026-06-01 18:05:00',  65, 1100],
  ['FD117', 'FD', 'CNX', 'BKK', '2026-06-01 20:00:00', '2026-06-01 21:05:00',  65,  980],
  ['FD300', 'FD', 'BKK', 'HKT', '2026-06-01 08:00:00', '2026-06-01 09:25:00',  85, 1200],
  ['TG310', 'TG', 'BKK', 'HKT', '2026-06-01 12:00:00', '2026-06-01 13:25:00',  85, 1900],
  ['FD312', 'FD', 'BKK', 'HKT', '2026-06-01 16:00:00', '2026-06-01 17:25:00',  85, 1150],
  ['FD302', 'FD', 'HKT', 'BKK', '2026-06-01 10:30:00', '2026-06-01 11:55:00',  85, 1200],
  ['FD315', 'FD', 'HKT', 'BKK', '2026-06-01 14:00:00', '2026-06-01 15:25:00',  85, 1150],
  ['TG317', 'TG', 'HKT', 'BKK', '2026-06-01 18:00:00', '2026-06-01 19:25:00',  85, 1900],
  ['TG410', 'TG', 'BKK', 'SIN', '2026-06-01 10:00:00', '2026-06-01 12:20:00', 140, 3500],
  ['FD412', 'FD', 'BKK', 'SIN', '2026-06-01 14:00:00', '2026-06-01 16:20:00', 140, 3200],
  ['SQ414', 'SQ', 'BKK', 'SIN', '2026-06-01 16:30:00', '2026-06-01 18:50:00', 140, 4800],
  ['TG416', 'TG', 'SIN', 'BKK', '2026-06-01 14:00:00', '2026-06-01 16:20:00', 140, 3800],
  ['SQ418', 'SQ', 'SIN', 'BKK', '2026-06-01 20:00:00', '2026-06-01 22:20:00', 140, 4600],
  // ── Jun 2 ──
  ['TG120', 'TG', 'BKK', 'CNX', '2026-06-02 07:00:00', '2026-06-02 08:05:00',  65, 1800],
  ['FD122', 'FD', 'BKK', 'CNX', '2026-06-02 11:00:00', '2026-06-02 12:05:00',  65, 1100],
  ['TG124', 'TG', 'BKK', 'CNX', '2026-06-02 17:00:00', '2026-06-02 18:05:00',  65, 1750],
  ['TG125', 'TG', 'CNX', 'BKK', '2026-06-02 09:30:00', '2026-06-02 10:35:00',  65, 1800],
  ['FD127', 'FD', 'CNX', 'BKK', '2026-06-02 14:00:00', '2026-06-02 15:05:00',  65, 1100],
  ['FD129', 'FD', 'CNX', 'BKK', '2026-06-02 19:00:00', '2026-06-02 20:05:00',  65,  980],
  ['TG320', 'TG', 'BKK', 'HKT', '2026-06-02 08:30:00', '2026-06-02 09:55:00',  85, 1800],
  ['FD322', 'FD', 'BKK', 'HKT', '2026-06-02 13:00:00', '2026-06-02 14:25:00',  85, 1200],
  ['FD323', 'FD', 'HKT', 'BKK', '2026-06-02 11:00:00', '2026-06-02 12:25:00',  85, 1200],
  ['TG325', 'TG', 'HKT', 'BKK', '2026-06-02 16:00:00', '2026-06-02 17:25:00',  85, 1800],
  ['TG420', 'TG', 'BKK', 'SIN', '2026-06-02 10:00:00', '2026-06-02 12:20:00', 140, 3500],
  ['SQ422', 'SQ', 'BKK', 'SIN', '2026-06-02 17:00:00', '2026-06-02 19:20:00', 140, 4700],
  ['SQ423', 'SQ', 'SIN', 'BKK', '2026-06-02 09:00:00', '2026-06-02 11:20:00', 140, 4500],
  ['FD501', 'FD', 'DMK', 'CNX', '2026-06-02 06:30:00', '2026-06-02 07:40:00',  70, 1100],
  // ── Jun 3 ──
  ['TG130', 'TG', 'BKK', 'CNX', '2026-06-03 09:00:00', '2026-06-03 10:05:00',  65, 1800],
  ['FD132', 'FD', 'BKK', 'CNX', '2026-06-03 13:00:00', '2026-06-03 14:05:00',  65, 1100],
  ['FD134', 'FD', 'BKK', 'CNX', '2026-06-03 19:00:00', '2026-06-03 20:05:00',  65,  990],
  ['TG133', 'TG', 'CNX', 'BKK', '2026-06-03 07:30:00', '2026-06-03 08:35:00',  65, 1800],
  ['FD135', 'FD', 'CNX', 'BKK', '2026-06-03 12:00:00', '2026-06-03 13:05:00',  65, 1100],
  ['FD137', 'FD', 'CNX', 'BKK', '2026-06-03 17:30:00', '2026-06-03 18:35:00',  65, 1050],
  ['FD330', 'FD', 'BKK', 'HKT', '2026-06-03 07:30:00', '2026-06-03 08:55:00',  85, 1200],
  ['TG332', 'TG', 'BKK', 'HKT', '2026-06-03 15:00:00', '2026-06-03 16:25:00',  85, 1900],
  ['FD331', 'FD', 'HKT', 'BKK', '2026-06-03 08:00:00', '2026-06-03 09:25:00',  85, 1300],
  ['TG333', 'TG', 'HKT', 'BKK', '2026-06-03 14:00:00', '2026-06-03 15:25:00',  85, 1900],
  ['SQ430', 'SQ', 'BKK', 'SIN', '2026-06-03 09:00:00', '2026-06-03 11:20:00', 140, 4200],
  ['TG432', 'TG', 'BKK', 'SIN', '2026-06-03 14:00:00', '2026-06-03 16:20:00', 140, 3600],
  ['TG433', 'TG', 'SIN', 'BKK', '2026-06-03 16:00:00', '2026-06-03 18:20:00', 140, 3800],
  // ── Jun 4 ──
  ['TG140', 'TG', 'BKK', 'CNX', '2026-06-04 08:00:00', '2026-06-04 09:05:00',  65, 1800],
  ['FD142', 'FD', 'BKK', 'CNX', '2026-06-04 12:00:00', '2026-06-04 13:05:00',  65, 1050],
  ['TG144', 'TG', 'BKK', 'CNX', '2026-06-04 18:00:00', '2026-06-04 19:05:00',  65, 1700],
  ['TG141', 'TG', 'CNX', 'BKK', '2026-06-04 10:00:00', '2026-06-04 11:05:00',  65, 1800],
  ['FD143', 'FD', 'CNX', 'BKK', '2026-06-04 15:00:00', '2026-06-04 16:05:00',  65, 1050],
  ['FD145', 'FD', 'CNX', 'BKK', '2026-06-04 20:00:00', '2026-06-04 21:05:00',  65,  950],
  ['TG340', 'TG', 'BKK', 'HKT', '2026-06-04 09:00:00', '2026-06-04 10:25:00',  85, 1900],
  ['FD342', 'FD', 'BKK', 'HKT', '2026-06-04 14:00:00', '2026-06-04 15:25:00',  85, 1150],
  ['FD341', 'FD', 'HKT', 'BKK', '2026-06-04 12:00:00', '2026-06-04 13:25:00',  85, 1200],
  ['TG343', 'TG', 'HKT', 'BKK', '2026-06-04 17:30:00', '2026-06-04 18:55:00',  85, 1900],
  ['TG440', 'TG', 'BKK', 'SIN', '2026-06-04 11:00:00', '2026-06-04 13:20:00', 140, 3500],
  ['SQ441', 'SQ', 'SIN', 'BKK', '2026-06-04 10:00:00', '2026-06-04 12:20:00', 140, 4600],
  // ── Jun 5 ──
  ['TG150', 'TG', 'BKK', 'CNX', '2026-06-05 07:30:00', '2026-06-05 08:35:00',  65, 1800],
  ['FD152', 'FD', 'BKK', 'CNX', '2026-06-05 11:30:00', '2026-06-05 12:35:00',  65, 1100],
  ['FD154', 'FD', 'BKK', 'CNX', '2026-06-05 16:00:00', '2026-06-05 17:05:00',  65, 1000],
  ['TG151', 'TG', 'CNX', 'BKK', '2026-06-05 09:00:00', '2026-06-05 10:05:00',  65, 1800],
  ['FD153', 'FD', 'CNX', 'BKK', '2026-06-05 14:00:00', '2026-06-05 15:05:00',  65, 1100],
  ['FD155', 'FD', 'CNX', 'BKK', '2026-06-05 18:30:00', '2026-06-05 19:35:00',  65,  980],
  ['FD350', 'FD', 'BKK', 'HKT', '2026-06-05 08:00:00', '2026-06-05 09:25:00',  85, 1200],
  ['TG352', 'TG', 'BKK', 'HKT', '2026-06-05 14:30:00', '2026-06-05 15:55:00',  85, 1850],
  ['FD351', 'FD', 'HKT', 'BKK', '2026-06-05 10:00:00', '2026-06-05 11:25:00',  85, 1200],
  ['TG353', 'TG', 'HKT', 'BKK', '2026-06-05 16:30:00', '2026-06-05 17:55:00',  85, 1850],
  ['SQ450', 'SQ', 'BKK', 'SIN', '2026-06-05 13:00:00', '2026-06-05 15:20:00', 140, 4200],
  ['FD452', 'FD', 'BKK', 'SIN', '2026-06-05 08:00:00', '2026-06-05 10:20:00', 140, 3100],
  ['SQ451', 'SQ', 'SIN', 'BKK', '2026-06-05 09:00:00', '2026-06-05 11:20:00', 140, 4500],
]

for (const [num, al, orig, dest, dep, arr, dur, price] of flights) {
  insertFlight.run(num, airline(al), airport(orig), airport(dest), dep, arr, dur, price)
}

// Generate seats for every flight (rows 1-10, cols A-F)
const insertSeat = db.prepare("INSERT OR IGNORE INTO seats (flight_id, seat_number, class, status) VALUES (?, ?, ?, 'available')")
const allFlights = db.prepare('SELECT id FROM flights').all()
const cols = ['A','B','C','D','E','F']

for (const { id } of allFlights) {
  for (let row = 1; row <= 10; row++) {
    for (const col of cols) {
      insertSeat.run(id, `${row}${col}`, row <= 2 ? 'business' : 'economy')
    }
  }
}

console.log(`Seeded: ${allFlights.length} flights, ${allFlights.length * 60} seats`)
console.log('Done! Run: npm run dev')
