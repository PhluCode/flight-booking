import supabase from '../db.js'

function generateReference() {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export const createBooking = async ({ userId, flight_id, passengers, payment_method, total_price }) => {
  // 1. Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id:           userId,
      flight_id,
      booking_reference: generateReference(),
      status:            'confirmed',
      total_price,
    })
    .select()
    .single()
  if (bookingError) throw bookingError

  // 2. Insert passengers
  const { error: passengerError } = await supabase
    .from('passengers')
    .insert(passengers.map(p => ({
      booking_id:      booking.id,
      first_name:      p.first_name,
      last_name:       p.last_name,
      passport_number: p.passport_number,
      seat_number:     p.seat_number,
    })))
  if (passengerError) throw passengerError

  // 3. Mark seats as occupied
  for (const p of passengers) {
    await supabase
      .from('seats')
      .update({ status: 'occupied' })
      .eq('flight_id', flight_id)
      .eq('seat_number', p.seat_number)
  }

  // 4. Record payment
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      booking_id:     booking.id,
      amount:         total_price,
      status:         'paid',
      payment_method,
      paid_at:        new Date().toISOString(),
    })
  if (paymentError) throw paymentError

  return booking
}

export const getBookingsByUser = async (userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, booking_reference, status, total_price, created_at,
      flights (
        flight_number, departure_time,
        origin_airport:airports!flights_origin_airport_id_fkey ( code ),
        destination_airport:airports!flights_destination_airport_id_fkey ( code )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return data.map(b => ({
    id:                b.id,
    booking_reference: b.booking_reference,
    status:            b.status,
    total_price:       b.total_price,
    created_at:        b.created_at,
    flight_number:     b.flights.flight_number,
    departure_time:    b.flights.departure_time,
    origin_code:       b.flights.origin_airport.code,
    destination_code:  b.flights.destination_airport.code,
  }))
}

export const cancelBooking = async (bookingId, userId) => {
  // 1. Fetch booking + passenger seats to free them up
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('flight_id, passengers ( seat_number )')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .single()
  if (fetchError || !booking) throw new Error('Booking not found')

  // 2. Cancel booking
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
  if (updateError) throw updateError

  // 3. Free the seats
  const seatNumbers = booking.passengers.map(p => p.seat_number)
  await supabase
    .from('seats')
    .update({ status: 'available' })
    .eq('flight_id', booking.flight_id)
    .in('seat_number', seatNumbers)
}
