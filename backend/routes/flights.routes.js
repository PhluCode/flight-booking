import { Router } from 'express'
import { getAirports, searchFlights, getSeats } from '../controllers/flights.controller.js'

const router = Router()

router.get('/airports',        getAirports)
router.get('/flights',         searchFlights)
router.get('/flights/:id/seats', getSeats)

export default router
