import { Router } from 'express'
import { createBooking, getMyBookings, getBooking, cancelBooking } from '../controllers/bookings.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/',      authenticate, createBooking)
router.get('/',       authenticate, getMyBookings)
router.get('/:id',    authenticate, getBooking)
router.delete('/:id', authenticate, cancelBooking)

export default router
