import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const ROWS = Array.from({ length: 10 }, (_, i) => i + 1)
const COLS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function SeatSelection() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [seats, setSeats] = useState([])
  const [selected, setSelected] = useState([])

  const { flight, passengers } = state || { passengers: 1 }

  useEffect(() => {
    api.get(`/api/flights/${id}/seats`).then(res => setSeats(res.data))
  }, [id])

  const getSeat = (row, col) => seats.find(s => s.seat_number === `${row}${col}`)

  const toggleSeat = (seatNumber) => {
    const seat = seats.find(s => s.seat_number === seatNumber)
    if (!seat || seat.status === 'occupied') return

    setSelected(prev => {
      if (prev.includes(seatNumber)) return prev.filter(s => s !== seatNumber)
      if (prev.length >= passengers) return prev
      return [...prev, seatNumber]
    })
  }

  const getSeatClass = (row, col) => {
    const seatNumber = `${row}${col}`
    const seat = getSeat(row, col)
    const isSelected = selected.includes(seatNumber)
    const isBusiness = row <= 2

    if (isSelected)              return 'bg-blue-500 text-white border-blue-600'
    if (seat?.status === 'occupied') return 'bg-red-100 border-red-300 text-red-400 cursor-not-allowed'
    if (isBusiness)              return 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 cursor-pointer'
    return 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100 cursor-pointer'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Select Seats</h2>
        <p className="text-gray-500 text-sm mb-4">
          Choose {passengers} seat{passengers > 1 ? 's' : ''}
        </p>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-green-50 border border-green-300 inline-block" /> Economy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-yellow-50 border border-yellow-300 inline-block" /> Business
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-red-100 border border-red-300 inline-block" /> Occupied
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-blue-500 inline-block" /> Your selection
          </span>
        </div>

        {/* Seat map */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Column headers */}
          <div className="grid grid-cols-7 gap-1 mb-3 text-center text-xs font-semibold text-gray-400">
            <div />
            {COLS.map(c => <div key={c}>{c}</div>)}
          </div>

          {/* Row divider label */}
          <div className="text-xs text-gray-400 text-center mb-1 col-span-7">— Business Class —</div>

          {ROWS.map(row => (
            <div key={row}>
              {row === 3 && (
                <div className="text-xs text-gray-400 text-center my-2">— Economy Class —</div>
              )}
              <div className="grid grid-cols-7 gap-1 mb-1">
                <div className="text-center text-xs text-gray-400 flex items-center justify-center">{row}</div>
                {COLS.map(col => (
                  <div
                    key={col}
                    className={`rounded text-xs h-8 flex items-center justify-center font-medium border transition select-none ${getSeatClass(row, col)}`}
                    onClick={() => toggleSeat(`${row}${col}`)}
                  >
                    {row}{col}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Selected:{' '}
            <span className="font-semibold text-blue-600">
              {selected.length > 0 ? selected.join(', ') : 'None'}
            </span>
          </p>
          <button
            onClick={() => navigate('/passengers', { state: { flight, passengers, selectedSeats: selected } })}
            disabled={selected.length !== passengers}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
          >
            Continue &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
