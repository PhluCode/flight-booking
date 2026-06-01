import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
function formatDuration(min) {
  return `${Math.floor(min / 60)}h ${min % 60}m`
}
function formatDate(str) {
  return new Date(str).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function FlightResults() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const origin      = params.get('origin')
  const destination = params.get('destination')
  const date        = params.get('date')
  const passengers  = parseInt(params.get('passengers') || 1)
  const tripType    = params.get('tripType') || 'oneway'
  const returnDate  = params.get('returnDate')
  const isReturnLeg = params.get('leg') === 'return'

  const [flights, setFlights]               = useState([])
  const [loading, setLoading]               = useState(true)
  const [selectedAirlines, setSelectedAirlines] = useState([])
  const [sortBy, setSortBy]                 = useState('price')

  useEffect(() => {
    api.get('/api/flights', { params: { origin, destination, date } })
      .then(res => {
        setFlights(res.data)
        const names = [...new Set(res.data.map(f => f.airline_name))]
        setSelectedAirlines(names)
      })
      .finally(() => setLoading(false))
  }, [])

  const airlines = useMemo(() => [...new Set(flights.map(f => f.airline_name))], [flights])

  const toggleAirline = (name) =>
    setSelectedAirlines(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    )

  const filtered = useMemo(() => {
    const list = flights.filter(f => selectedAirlines.includes(f.airline_name))
    if (sortBy === 'price')     return [...list].sort((a, b) => a.price - b.price)
    if (sortBy === 'departure') return [...list].sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time))
    if (sortBy === 'arrival')   return [...list].sort((a, b) => new Date(a.arrival_time)   - new Date(b.arrival_time))
    return list
  }, [flights, selectedAirlines, sortBy])

  const handleSelect = (flight) =>
    navigate(`/flights/${flight.id}/seats`, {
      state: { flight, passengers, tripType, returnDate, isReturnLeg },
    })

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── Header banner ── */}
      <div className="bg-blue-600 text-white py-5">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 text-xl font-bold">
              <span>{origin}</span>
              <span className="text-blue-300">&#8594;</span>
              <span>{destination}</span>
              <span className="text-xs font-semibold bg-white text-blue-600 px-2 py-0.5 rounded-full">
                {isReturnLeg ? 'Return Flight' : tripType === 'roundtrip' ? 'Round Trip' : 'One Way'}
              </span>
            </div>
            <p className="text-blue-200 text-sm mt-1">
              {formatDate(date)}
              &nbsp;&middot;&nbsp;{passengers} Passenger{passengers > 1 ? 's' : ''}
            </p>
            {isReturnLeg && (
              <p className="text-yellow-300 text-xs mt-1 font-medium">
                &#9673; Step 2 of 2 — Select your return flight
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition"
          >
            &#9998; Change Search
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6 items-start">

        {/* ── Sidebar ── */}
        <div className="w-52 shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700 text-sm">Airlines</h3>
              <button
                onClick={() => setSelectedAirlines([...airlines])}
                className="text-xs text-blue-500 hover:underline"
              >
                Reset
              </button>
            </div>

            {loading && <p className="text-xs text-gray-400">Loading...</p>}

            {airlines.map(airline => (
              <label key={airline} className="flex items-center gap-2 py-1.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedAirlines.includes(airline)}
                  onChange={() => toggleAirline(airline)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">{airline}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Results ── */}
        <div className="flex-1 min-w-0">

          {/* Sort bar */}
          <div className="bg-white rounded-xl shadow-sm px-4 py-3 mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {loading
                ? 'Searching for flights...'
                : `${filtered.length} flight${filtered.length !== 1 ? 's' : ''} found`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Sort by</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="price">Low Price</option>
                <option value="departure">Early Departure</option>
                <option value="arrival">Early Arrival</option>
              </select>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-3 animate-bounce">&#9992;</p>
              <p>Searching for flights...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm text-center py-20 text-gray-400">
              <p className="text-5xl mb-3">&#9992;</p>
              <p className="font-medium">No flights found</p>
              <p className="text-sm mt-1">Try a different date or route</p>
            </div>
          )}

          {/* Flight cards */}
          <div className="space-y-3">
            {filtered.map(flight => (
              <div
                key={flight.id}
                className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-6 hover:shadow-md transition"
              >
                {/* Airline info */}
                <div className="w-32 shrink-0">
                  <span className="inline-block text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full mb-1.5">
                    Economy
                  </span>
                  <p className="text-sm font-semibold text-gray-700 leading-tight">{flight.airline_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{flight.flight_number}</p>
                </div>

                {/* Route */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="text-center w-20">
                    <p className="text-2xl font-bold text-gray-800 leading-none">{formatTime(flight.departure_time)}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-1">{flight.origin_code}</p>
                  </div>

                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-400 mb-1.5">{formatDuration(flight.duration)}</p>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-px bg-gray-300" />
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    </div>
                    <p className="text-xs text-blue-500 font-medium mt-1.5">Direct</p>
                  </div>

                  <div className="text-center w-20">
                    <p className="text-2xl font-bold text-gray-800 leading-none">{formatTime(flight.arrival_time)}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-1">{flight.destination_code}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-14 bg-gray-100 shrink-0" />

                {/* Price */}
                <div className="text-right shrink-0 w-36">
                  <p className="text-xs text-gray-400">Start from</p>
                  <p className="text-2xl font-bold text-blue-600 leading-tight">
                    &#3647;{Number(flight.price).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mb-3">Price / Pax</p>
                  <button
                    onClick={() => handleSelect(flight)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
