import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Search() {
  const navigate = useNavigate()
  const [airports, setAirports] = useState([])
  const [form, setForm] = useState({ origin: '', destination: '', date: '', passengers: 1 })

  useEffect(() => {
    api.get('/api/airports').then(res => setAirports(res.data))
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const { origin, destination, date, passengers } = form
    navigate(`/flights?origin=${origin}&destination=${destination}&date=${date}&passengers=${passengers}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-8 text-center text-white">
        <h1 className="text-4xl font-bold mb-2">Where do you want to fly?</h1>
        <p className="text-blue-200 text-lg">Search flights across Thailand and beyond</p>
      </div>

      {/* Search card */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">From</label>
              <select
                required
                value={form.origin}
                onChange={e => setForm({ ...form, origin: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select airport</option>
                {airports.map(a => (
                  <option key={a.id} value={a.code}>{a.code} — {a.city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">To</label>
              <select
                required
                value={form.destination}
                onChange={e => setForm({ ...form, destination: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select airport</option>
                {airports.map(a => (
                  <option key={a.id} value={a.code}>{a.code} — {a.city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
              <input
                type="date"
                required
                value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Passengers</label>
              <select
                value={form.passengers}
                onChange={e => setForm({ ...form, passengers: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4].map(n => (
                  <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
              >
                Search Flights
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
