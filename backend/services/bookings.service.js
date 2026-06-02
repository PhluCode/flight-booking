import db from '../db.js'
import { ensureSeats } from './flights.service.js'

function generateReference() {
  return 'AERIS-' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

/* =========================================================
   createBooking — the transactional checkout.
   Gatekeeper Pattern: never trust the client. We re-read the
   flight price from the DB and re-check seat availability
   *inside* the transaction, so the recorded total and the
   seats can't be tampered with from the browser.
   ========================================================= */
export const createBooking = ({ userId, flight_id, passengers, payment_method, cabin_class }) => {
  if (!Array.isArray(passengers) || passengers.length === 0) {
    const e = new Error('At least one passenger is required'); e.status = 400; throw e
  }

  // 0. The user the token points to must still exist (clearer than a raw FK error)
  if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(userId)) {
    const e = new Error('Your session has expired. Please log in again.'); e.status = 401; throw e
  }

  // 1. Flight must exist and be bookable (checked before the txn so we can
  //    lazily generate its seats — ensureSeats runs its own transaction).
  const flight = db.prepare('SELECT id, price, status FROM flights WHERE id = ?').get(flight_id)
  if (!flight || flight.status === 'cancelled') {
    const e = new Error('Flight not available'); e.status = 404; throw e
  }
  ensureSeats(flight_id)

  db.exec('BEGIN')
  try {
    // 2. Re-validate every chosen seat is real AND still free (concurrency-safe).
    //    Premium (business) seats add a fee — computed here, never trusted from the client.
    const SEAT_PREMIUM = 1000
    let seatFees = 0
    for (const p of passengers) {
      if (!p.seat_number) { const e = new Error('Seat is required'); e.status = 400; throw e }
      const seat = db.prepare(
        'SELECT status, class FROM seats WHERE flight_id = ? AND seat_number = ?'
      ).get(flight_id, p.seat_number)
      if (!seat) { const e = new Error(`Seat ${p.seat_number} does not exist`); e.status = 400; throw e }
      if (seat.status === 'occupied') {
        const e = new Error(`Seat ${p.seat_number} is already taken`); e.status = 409; throw e
      }
      if (seat.class === 'business') seatFees += SEAT_PREMIUM
    }

    // 3. Server computes the real total — the client's number is ignored
    const total_price = flight.price * passengers.length + seatFees

    const { lastInsertRowid: bookingId } = db.prepare(`
      INSERT INTO bookings (user_id, flight_id, booking_reference, status, cabin_class, total_price)
      VALUES (?, ?, ?, 'confirmed', ?, ?)
    `).run(userId, flight_id, generateReference(), cabin_class || 'Economy', total_price)

    for (const p of passengers) {
      db.prepare(`
        INSERT INTO passengers (booking_id, first_name, last_name, passport_number, seat_number)
        VALUES (?, ?, ?, ?, ?)
      `).run(bookingId, p.first_name, p.last_name, p.passport_number ?? null, p.seat_number)

      db.prepare("UPDATE seats SET status = 'occupied' WHERE flight_id = ? AND seat_number = ?")
        .run(flight_id, p.seat_number)
    }

    // 4. Record the (simulated) payment — assignment says "bypass the payment process"
    db.prepare(`
      INSERT INTO payments (booking_id, amount, status, payment_method, paid_at)
      VALUES (?, ?, 'paid', ?, datetime('now'))
    `).run(bookingId, total_price, payment_method || 'card')

    db.exec('COMMIT')
    return db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId)
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export const getBookingsByUser = (userId) => {
  return db.prepare(`
    SELECT
      b.id, b.booking_reference, b.status, b.cabin_class, b.total_price, b.created_at,
      f.flight_number, f.departure_time, f.arrival_time, f.duration, f.gate,
      al.code AS airline_code,
      al.name AS airline_name,
      o.code  AS origin_code,
      d.code  AS destination_code,
      (SELECT COUNT(*)    FROM passengers p WHERE p.booking_id = b.id)            AS passenger_count,
      (SELECT seat_number FROM passengers p WHERE p.booking_id = b.id LIMIT 1)    AS seat
    FROM bookings b
    JOIN flights  f ON b.flight_id              = f.id
    JOIN airlines al ON f.airline_id            = al.id
    JOIN airports o ON f.origin_airport_id      = o.id
    JOIN airports d ON f.destination_airport_id = d.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(userId)
}

/* Full detail for the e-ticket view (booking + flight + passengers + payment) */
export const getBookingDetail = (bookingId, userId) => {
  const booking = db.prepare(`
    SELECT
      b.id, b.booking_reference, b.status, b.cabin_class, b.total_price, b.created_at,
      f.flight_number, f.departure_time, f.arrival_time, f.duration, f.gate, f.stops,
      al.code AS airline_code,
      al.name AS airline_name,
      o.code  AS origin_code,  o.city AS origin_city,  o.name AS origin_name,
      d.code  AS destination_code, d.city AS destination_city, d.name AS destination_name
    FROM bookings b
    JOIN flights  f ON b.flight_id              = f.id
    JOIN airlines al ON f.airline_id            = al.id
    JOIN airports o ON f.origin_airport_id      = o.id
    JOIN airports d ON f.destination_airport_id = d.id
    WHERE b.id = ? AND b.user_id = ?
  `).get(bookingId, userId)

  if (!booking) { const e = new Error('Booking not found'); e.status = 404; throw e }

  booking.passengers = db.prepare(
    'SELECT first_name, last_name, passport_number, seat_number FROM passengers WHERE booking_id = ?'
  ).all(bookingId)
  booking.payment = db.prepare(
    'SELECT amount, status, payment_method, paid_at FROM payments WHERE booking_id = ?'
  ).get(bookingId)

  return booking
}

export const cancelBooking = (bookingId, userId) => {
  db.exec('BEGIN')
  try {
    const booking = db.prepare(
      'SELECT id, flight_id FROM bookings WHERE id = ? AND user_id = ?'
    ).get(bookingId, userId)
    if (!booking) { const e = new Error('Booking not found'); e.status = 404; throw e }

    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(bookingId)

    const passengers = db.prepare('SELECT seat_number FROM passengers WHERE booking_id = ?').all(bookingId)
    for (const p of passengers) {
      db.prepare("UPDATE seats SET status = 'available' WHERE flight_id = ? AND seat_number = ?")
        .run(booking.flight_id, p.seat_number)
    }

    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export const getRecommendations = (userId) => {
  return db.prepare(`SELECT
  dest.code        AS destination_code,
  dest.city        AS destination_city,
  dest.country     AS destination_country,
  COUNT(*)         AS popularity          -- how many similar users flew there
FROM bookings b
JOIN flights  f    ON b.flight_id              = f.id
JOIN airports dest ON f.destination_airport_id = dest.id
WHERE b.user_id IN (

    -- STEP 2: find users who share at least one destination with me
    SELECT DISTINCT b2.user_id
    FROM bookings b2
    JOIN flights  f2  ON b2.flight_id              = f2.id
    JOIN airports d2  ON f2.destination_airport_id = d2.id
    WHERE d2.code IN (

        -- STEP 1: my own booked destinations
        SELECT a.code
        FROM bookings b3
        JOIN flights  f3 ON b3.flight_id              = f3.id
        JOIN airports a  ON f3.destination_airport_id = a.id
        WHERE b3.user_id = ?          -- current user
    )
    AND b2.user_id != ?               -- exclude myself

)
AND b.user_id != ?                    -- exclude myself

-- STEP 3: exclude places I've already been
AND dest.code NOT IN (
    SELECT a2.code
    FROM bookings b4
    JOIN flights  f4 ON b4.flight_id              = f4.id
    JOIN airports a2 ON f4.destination_airport_id = a2.id
    WHERE b4.user_id = ?
)

GROUP BY dest.code, dest.city, dest.country
ORDER BY popularity DESC
LIMIT 5
`).all(userId, userId, userId, userId)
}
