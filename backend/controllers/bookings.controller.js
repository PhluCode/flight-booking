import * as bookingsService from '../services/bookings.service.js'

export const createBooking = (req, res) => {
  try {
    const { flight_id, passengers, payment_method, cabin_class } = req.body
    const booking = bookingsService.createBooking({
      userId: req.user.id, flight_id, passengers, payment_method, cabin_class,
    })
    res.status(201).json(booking)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

export const getMyBookings = (req, res) => {
  try {
    const bookings = bookingsService.getBookingsByUser(req.user.id)
    res.json(bookings)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

export const getBooking = (req, res) => {
  try {
    const booking = bookingsService.getBookingDetail(req.params.id, req.user.id)
    res.json(booking)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

export const cancelBooking = (req, res) => {
  try {
    bookingsService.cancelBooking(req.params.id, req.user.id)
    res.json({ message: 'Booking cancelled' })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

export const getRecommendations = (req, res) => {
  try {
    const recs = bookingsService.getRecommendations(req.user.id)
    res.json(recs)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}
