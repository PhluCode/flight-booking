import db from '../db.js'

export const getAllAirports = () => {
  return db.prepare('SELECT * FROM airports ORDER BY city').all()
}

export const findFlights = ({ origin, destination, date, cls }) => {
  if (cls) {
    return db.prepare(`
      SELECT
        f.id,
        f.flight_number,
        f.departure_time,
        f.arrival_time,
        f.duration,
        f.price,
        f.status,
        f.cabin_class,
        al.name  AS airline_name,
        o.code   AS origin_code,
        o.city   AS origin_city,
        d.code   AS destination_code,
        d.city   AS destination_city
      FROM flights f
      JOIN airlines al ON f.airline_id             = al.id
      JOIN airports o  ON f.origin_airport_id      = o.id
      JOIN airports d  ON f.destination_airport_id = d.id
      WHERE o.code = ?
        AND d.code = ?
        AND DATE(f.departure_time) = ?
        AND f.status != 'cancelled'
        AND LOWER(f.cabin_class) = LOWER(?)
      ORDER BY f.departure_time
    `).all(origin, destination, date, cls)
  }

  return db.prepare(`
    SELECT
      f.id,
      f.flight_number,
      f.departure_time,
      f.arrival_time,
      f.duration,
      f.price,
      f.status,
      f.cabin_class,
      al.name  AS airline_name,
      o.code   AS origin_code,
      o.city   AS origin_city,
      d.code   AS destination_code,
      d.city   AS destination_city
    FROM flights f
    JOIN airlines al ON f.airline_id             = al.id
    JOIN airports o  ON f.origin_airport_id      = o.id
    JOIN airports d  ON f.destination_airport_id = d.id
    WHERE o.code = ?
      AND d.code = ?
      AND DATE(f.departure_time) = ?
      AND f.status != 'cancelled'
    ORDER BY f.departure_time
  `).all(origin, destination, date)
}

export const getSeatsByFlight = (flightId) => {
  return db.prepare('SELECT * FROM seats WHERE flight_id = ? ORDER BY seat_number').all(flightId)
}
