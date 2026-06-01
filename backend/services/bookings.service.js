import db from '../db.js'

function generateReference() {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export const createBooking = ({ userId, flight_id, passengers, payment_method, total_price }) => {
  db.exec('BEGIN')
  try {
    const { lastInsertRowid: bookingId } = db.prepare(`
      INSERT INTO bookings (user_id, flight_id, booking_reference, status, total_price)
      VALUES (?, ?, ?, 'confirmed', ?)
    `).run(userId, flight_id, generateReference(), total_price)

    for (const p of passengers) {
      db.prepare(`
        INSERT INTO passengers (booking_id, first_name, last_name, passport_number, seat_number)
        VALUES (?, ?, ?, ?, ?)
      `).run(bookingId, p.first_name, p.last_name, p.passport_number ?? null, p.seat_number)

      db.prepare(`UPDATE seats SET status = 'occupied' WHERE flight_id = ? AND seat_number = ?`)
        .run(flight_id, p.seat_number)
    }

    db.prepare(`
      INSERT INTO payments (booking_id, amount, status, payment_method, paid_at)
      VALUES (?, ?, 'paid', ?, datetime('now'))
    `).run(bookingId, total_price, payment_method)

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
      b.id, b.booking_reference, b.status, b.total_price, b.created_at,
      f.flight_number, f.departure_time, f.arrival_time, f.duration,
      o.code AS origin_code,
      d.code AS destination_code
    FROM bookings b
    JOIN flights  f ON b.flight_id              = f.id
    JOIN airports o ON f.origin_airport_id      = o.id
    JOIN airports d ON f.destination_airport_id = d.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(userId)
}

export const cancelBooking = (bookingId, userId) => {
  db.exec('BEGIN')
  try {
    const booking = db.prepare(
      'SELECT id, flight_id FROM bookings WHERE id = ? AND user_id = ?'
    ).get(bookingId, userId)
    if (!booking) throw new Error('Booking not found')

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
