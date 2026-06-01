import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Search from './pages/Search'
import FlightResults from './pages/FlightResults'
import SeatSelection from './pages/SeatSelection'
import PassengerDetails from './pages/PassengerDetails'
import BookingConfirmation from './pages/BookingConfirmation'
import MyBookings from './pages/MyBookings'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  if (user === undefined) return null  // loading
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/"         element={<PrivateRoute><Search /></PrivateRoute>} />
        <Route path="/flights"  element={<PrivateRoute><FlightResults /></PrivateRoute>} />
        <Route path="/flights/:id/seats" element={<PrivateRoute><SeatSelection /></PrivateRoute>} />
        <Route path="/passengers" element={<PrivateRoute><PassengerDetails /></PrivateRoute>} />
        <Route path="/confirm"  element={<PrivateRoute><BookingConfirmation /></PrivateRoute>} />
        <Route path="/bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
