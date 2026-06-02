import db from '../db.js'

export const getAllAirports = () => {
  return db.prepare('SELECT * FROM airports ORDER BY city').all()
}

const FLIGHT_SELECT = `
  SELECT
    f.id,
    f.flight_number,
    f.departure_time,
    f.arrival_time,
    f.duration,
    f.price,
    f.stops,
    f.gate,
    f.status,
    f.total_seats,
    f.cabin_class,
    al.code  AS airline_code,
    al.name  AS airline_name,
    o.code   AS origin_code,
    o.city   AS origin_city,
    d.code   AS destination_code,
    d.city   AS destination_city,
    f.total_seats - (SELECT COUNT(*) FROM seats s WHERE s.flight_id = f.id AND s.status = 'occupied') AS seats_available
  FROM flights f
  JOIN airlines al ON f.airline_id             = al.id
  JOIN airports o  ON f.origin_airport_id      = o.id
  JOIN airports d  ON f.destination_airport_id = d.id
`

export const findFlights = ({ origin, destination, date }) => {
  return db.prepare(`
    ${FLIGHT_SELECT}
    WHERE o.code = ?
      AND d.code = ?
      AND DATE(f.departure_time) = ?
      AND f.status != 'cancelled'
    ORDER BY f.departure_time
  `).all(origin, destination, date)
}

export const getFlightById = (id) => {
  return db.prepare(`${FLIGHT_SELECT} WHERE f.id = ?`).get(id)
}

const SEAT_COLS = ['A', 'B', 'C', 'H', 'J', 'K']
const SEAT_ROWS = 30
const PREMIUM_SET = new Set([1, 2, 12, 13, 17, 18])

export const ensureSeats = (flightId) => {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM seats WHERE flight_id = ?').get(flightId)
  if (n > 0) return
  const insert = db.prepare(
    "INSERT OR IGNORE INTO seats (flight_id, seat_number, class, status) VALUES (?, ?, ?, 'available')"
  )
  db.exec('BEGIN')
  try {
    for (let row = 1; row <= SEAT_ROWS; row++) {
      for (const col of SEAT_COLS) {
        insert.run(flightId, `${row}${col}`, PREMIUM_SET.has(row) ? 'business' : 'economy')
      }
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export const getSeatsByFlight = (flightId) => {
  ensureSeats(flightId)
  return db.prepare('SELECT * FROM seats WHERE flight_id = ? ORDER BY seat_number').all(flightId)
}
