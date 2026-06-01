import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Search() {
  const navigate = useNavigate()
  const [airports, setAirports] = useState([])
  const [tripType, setTripType] = useState('oneway')
  const [form, setForm] = useState({
    origin: '', destination: '', date: '', returnDate: '', passengers: 1,
  })

  useEffect(() => {
    api.get('/api/airports').then(res => setAirports(res.data))
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const { origin, destination, date, returnDate, passengers } = form
    const base = `/flights?origin=${origin}&destination=${destination}&date=${date}&passengers=${passengers}&tripType=${tripType}`
    navigate(tripType === 'roundtrip' ? `${base}&returnDate=${returnDate}` : base)
  }

  const today = new Date().toISOString().split('T')[0]
  const isRound = tripType === 'roundtrip'

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase mb-1'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-8 text-center text-white">
        <h1 className="text-4xl font-bold mb-2">Where do you want to fly?</h1>
        <p className="text-blue-200 text-lg">Search flights across Thailand and beyond</p>
      </div>

      {/* Search card */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6">

          {/* Trip type toggle */}
          <div className="flex gap-2 mb-5">
            {['oneway', 'roundtrip'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setTripType(type)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                  tripType === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-500 border-gray-300 hover:border-blue-400'
                }`}
              >
                {type === 'oneway' ? 'One Way' : 'Round Trip'}
              </button>
            ))}
          </div>

          {/* Fields — 4 cols for one way, 5 cols for round trip */}
          <form
            onSubmit={handleSubmit}
            className={`grid grid-cols-1 gap-4 ${isRound ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}
          >
            <div>
              <label className={labelCls}>From</label>
              <select required value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} className={inputCls}>
                <option value="">Select airport</option>
                {airports.map(a => <option key={a.id} value={a.code}>{a.code} — {a.city}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>To</label>
              <select required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className={inputCls}>
                <option value="">Select airport</option>
                {airports.map(a => <option key={a.id} value={a.code}>{a.code} — {a.city}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Departure</label>
              <input
                type="date" required value={form.date} min={today}
                onChange={e => setForm({ ...form, date: e.target.value, returnDate: '' })}
                className={inputCls}
              />
            </div>

            {isRound && (
              <div>
                <label className={labelCls}>Return</label>
                <input
                  type="date" required value={form.returnDate} min={form.date || today}
                  onChange={e => setForm({ ...form, returnDate: e.target.value })}
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <label className={labelCls}>Passengers</label>
              <select value={form.passengers} onChange={e => setForm({ ...form, passengers: parseInt(e.target.value) })} className={inputCls}>
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>

            <div className={isRound ? 'md:col-span-5' : 'md:col-span-4'}>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition">
                Search Flights
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
