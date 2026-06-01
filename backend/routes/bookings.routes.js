import { Router } from 'express'
import { createBooking, getMyBookings, cancelBooking } from '../controllers/bookings.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/',      authenticate, createBooking)
router.get('/',       authenticate, getMyBookings)
router.delete('/:id', authenticate, cancelBooking)

export default router
