import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar({ session }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-wide">&#9992; SkyBook</Link>
        {session && (
          <div className="flex items-center gap-6 text-sm">
            <Link to="/bookings" className="hover:text-blue-200">My Bookings</Link>
            <button
              onClick={handleLogout}
              className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-50 font-medium"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
