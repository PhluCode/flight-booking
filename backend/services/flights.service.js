import supabase from '../db.js'

export const getAllAirports = async () => {
  const { data, error } = await supabase
    .from('airports')
    .select('*')
    .order('city')
  if (error) throw error
  return data
}

export const findFlights = async ({ origin, destination, date }) => {
  // Step 1: resolve airport codes to IDs
  const { data: airports, error: airportError } = await supabase
    .from('airports')
    .select('id, code')
    .in('code', [origin, destination])
  if (airportError) throw airportError

  const originAirport = airports.find(a => a.code === origin)
  const destAirport   = airports.find(a => a.code === destination)
  if (!originAirport || !destAirport) return []

  // Step 2: search flights on that date
  const start = new Date(`${date}T00:00:00+07:00`).toISOString()
  const end   = new Date(`${date}T23:59:59+07:00`).toISOString()

  const { data, error } = await supabase
    .from('flights')
    .select(`
      id, flight_number, departure_time, arrival_time, duration, price, status,
      airlines ( name ),
      origin_airport:airports!flights_origin_airport_id_fkey ( code, city ),
      destination_airport:airports!flights_destination_airport_id_fkey ( code, city )
    `)
    .eq('origin_airport_id', originAirport.id)
    .eq('destination_airport_id', destAirport.id)
    .gte('departure_time', start)
    .lte('departure_time', end)
    .neq('status', 'cancelled')
    .order('departure_time')
  if (error) throw error

  // Flatten nested objects so frontend gets flat fields
  return data.map(f => ({
    id:               f.id,
    flight_number:    f.flight_number,
    airline_name:     f.airlines.name,
    departure_time:   f.departure_time,
    arrival_time:     f.arrival_time,
    duration:         f.duration,
    price:            f.price,
    status:           f.status,
    origin_code:      f.origin_airport.code,
    origin_city:      f.origin_airport.city,
    destination_code: f.destination_airport.code,
    destination_city: f.destination_airport.city,
  }))
}

export const getSeatsByFlight = async (flightId) => {
  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('flight_id', flightId)
    .order('seat_number')
  if (error) throw error
  return data
}
