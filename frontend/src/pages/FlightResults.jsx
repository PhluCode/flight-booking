import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(minutes) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export default function FlightResults() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)

  const passengers = parseInt(params.get('passengers') || 1)

  useEffect(() => {
    api.get('/api/flights', {
      params: {
        origin:      params.get('origin'),
        destination: params.get('destination'),
        date:        params.get('date'),
      },
    })
      .then(res => setFlights(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (flight) => {
    navigate(`/flights/${flight.id}/seats`, { state: { flight, passengers } })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800">
          {params.get('origin')} &rarr; {params.get('destination')}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {params.get('date')} &middot; {passengers} passenger{passengers > 1 ? 's' : ''}
        </p>

        {loading && <p className="text-center text-gray-400 py-16">Searching flights...</p>}

        {!loading && flights.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">&#9992;</p>
            <p>No flights found for this route.</p>
          </div>
        )}

        <div className="space-y-4">
          {flights.map(flight => (
            <div
              key={flight.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {flight.flight_number}
                  </span>
                  <span className="text-xs text-gray-400">{flight.airline_name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{formatTime(flight.departure_time)}</p>
                    <p className="text-xs text-gray-400">{flight.origin_code}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-400">{formatDuration(flight.duration)}</p>
                    <div className="flex items-center gap-1 my-1">
                      <div className="flex-1 h-px bg-gray-300" />
                      <span className="text-gray-400 text-xs">&#9992;</span>
                      <div className="flex-1 h-px bg-gray-300" />
                    </div>
                    <p className="text-xs text-gray-400">Direct</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{formatTime(flight.arrival_time)}</p>
                    <p className="text-xs text-gray-400">{flight.destination_code}</p>
                  </div>
                </div>
              </div>

              <div className="ml-6 text-right">
                <p className="text-xl font-bold text-blue-600">
                  &#3647;{(flight.price * passengers).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mb-2">total</p>
                <button
                  onClick={() => handleSelect(flight)}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
