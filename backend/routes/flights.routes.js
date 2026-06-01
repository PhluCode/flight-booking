import { Router } from 'express'
import { getAirports, searchFlights, getFlight, getSeats } from '../controllers/flights.controller.js'

const router = Router()

router.get('/airports',          getAirports)
router.get('/flights',           searchFlights)
router.get('/flights/:id/seats', getSeats)
router.get('/flights/:id',       getFlight)

export default router
