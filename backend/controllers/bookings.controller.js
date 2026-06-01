import * as bookingsService from '../services/bookings.service.js'

export const createBooking = (req, res) => {
  try {
    const { flight_id, passengers, payment_method, total_price } = req.body
    const booking = bookingsService.createBooking({
      userId: req.user.id, flight_id, passengers, payment_method, total_price,
    })
    res.status(201).json(booking)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getMyBookings = (req, res) => {
  try {
    const bookings = bookingsService.getBookingsByUser(req.user.id)
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const cancelBooking = (req, res) => {
  try {
    bookingsService.cancelBooking(req.params.id, req.user.id)
    res.json({ message: 'Booking cancelled' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
