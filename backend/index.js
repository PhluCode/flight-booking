import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes     from './routes/auth.routes.js'
import flightsRoutes  from './routes/flights.routes.js'
import bookingsRoutes from './routes/bookings.routes.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth',     authRoutes)
app.use('/api',          flightsRoutes)   // /api/airports, /api/flights, /api/flights/:id/seats
app.use('/api/bookings', bookingsRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
