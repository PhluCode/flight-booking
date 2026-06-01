import * as flightsService from '../services/flights.service.js'

export const getAirports = async (req, res) => {
  try {
    const airports = await flightsService.getAllAirports()
    res.json(airports)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const searchFlights = async (req, res) => {
  try {
    const { origin, destination, date } = req.query
    const flights = await flightsService.findFlights({ origin, destination, date })
    res.json(flights)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getFlight = async (req, res) => {
  try {
    const flight = await flightsService.getFlightById(req.params.id)
    if (!flight) return res.status(404).json({ message: 'Flight not found' })
    res.json(flight)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getSeats = async (req, res) => {
  try {
    const seats = await flightsService.getSeatsByFlight(req.params.id)
    res.json(seats)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
