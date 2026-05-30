import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Search from './pages/Search'
import FlightResults from './pages/FlightResults'
import SeatSelection from './pages/SeatSelection'
import PassengerDetails from './pages/PassengerDetails'
import BookingConfirmation from './pages/BookingConfirmation'
import MyBookings from './pages/MyBookings'

function PrivateRoute({ children, session }) {
  return session ? children : <Navigate to="/login" />
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return (
    <BrowserRouter>
      <Navbar session={session} />
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/"         element={<PrivateRoute session={session}><Search /></PrivateRoute>} />
        <Route path="/flights"  element={<PrivateRoute session={session}><FlightResults /></PrivateRoute>} />
        <Route path="/flights/:id/seats" element={<PrivateRoute session={session}><SeatSelection /></PrivateRoute>} />
        <Route path="/passengers" element={<PrivateRoute session={session}><PassengerDetails /></PrivateRoute>} />
        <Route path="/confirm"  element={<PrivateRoute session={session}><BookingConfirmation /></PrivateRoute>} />
        <Route path="/bookings" element={<PrivateRoute session={session}><MyBookings /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
