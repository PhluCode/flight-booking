import { Router } from 'express'
import { createBooking, getMyBookings, cancelBooking } from '../controllers/bookings.controller.js'

const router = Router()

router.post('/',    createBooking)
router.get('/',     getMyBookings)
router.delete('/:id', cancelBooking)

export default router
