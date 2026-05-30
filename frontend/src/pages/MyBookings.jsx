import { useState, useEffect } from 'react'
import api from '../lib/api'

function StatusBadge({ status }) {
  const styles = {
    confirmed: 'bg-green-100 text-green-700',
    pending:   'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-600',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = () => {
    setLoading(true)
    api.get('/api/bookings')
      .then(res => setBookings(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBookings() }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    await api.delete(`/api/bookings/${id}`)
    fetchBookings()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">My Bookings</h2>

        {loading && <p className="text-center text-gray-400 py-16">Loading...</p>}

        {!loading && bookings.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">&#127915;</p>
            <p>No bookings yet.</p>
          </div>
        )}

        <div className="space-y-4">
          {bookings.map(b => (
            <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">
                    {b.origin_code} &rarr; {b.destination_code}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(b.departure_time).toLocaleString('en-GB')}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={b.status} />
                  <p className="text-sm font-bold text-blue-600 mt-1">
                    &#3647;{Number(b.total_price).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Ref:{' '}
                  <span className="font-mono font-semibold text-gray-700">{b.booking_reference}</span>
                  &nbsp;&middot;&nbsp;{b.flight_number}
                </p>
                {b.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
