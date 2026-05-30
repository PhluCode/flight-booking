import * as bookingsService from '../services/bookings.service.js'

export const createBooking = async (req, res) => {
  try {
    // TODO: replace with req.user.id after auth middleware is added
    const userId = req.user?.id
    const { flight_id, passengers, payment_method, total_price } = req.body
    const booking = await bookingsService.createBooking({
      userId, flight_id, passengers, payment_method, total_price,
    })
    res.status(201).json(booking)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getMyBookings = async (req, res) => {
  try {
    // TODO: replace with req.user.id after auth middleware is added
    const userId = req.user?.id
    const bookings = await bookingsService.getBookingsByUser(userId)
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const cancelBooking = async (req, res) => {
  try {
    // TODO: replace with req.user.id after auth middleware is added
    const userId = req.user?.id
    await bookingsService.cancelBooking(req.params.id, userId)
    res.json({ message: 'Booking cancelled' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
