import { Router } from 'express'
import { register, getMe } from '../controllers/auth.controller.js'

const router = Router()

router.post('/register', register)
router.get('/me',        getMe)

export default router
