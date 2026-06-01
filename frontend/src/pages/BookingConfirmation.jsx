import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../lib/api'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BookingConfirmation() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { flight, passengers, selectedSeats, passengerForms, tripType, returnDate, isReturnLeg } = state || {}
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('credit_card')

  const totalPrice = (flight?.price ?? 0) * (passengers ?? 1)
  const isRoundTrip = tripType === 'roundtrip'

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/api/bookings', {
        flight_id: flight.id,
        passengers: passengerForms.map((p, i) => ({ ...p, seat_number: selectedSeats[i] })),
        payment_method: paymentMethod,
        total_price: totalPrice,
      })

      // Round trip outbound confirmed → go select the return flight
      if (isRoundTrip && !isReturnLeg) {
        navigate(
          `/flights?origin=${flight.destination_code}&destination=${flight.origin_code}&date=${returnDate}&passengers=${passengers}&tripType=roundtrip&leg=return`
        )
      } else {
        navigate('/bookings')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Review & Confirm</h2>
        {isRoundTrip && (
          <p className="text-sm text-blue-500 mb-6">
            {isReturnLeg ? 'Step 2 of 2 — Return Flight' : 'Step 1 of 2 — Outbound Flight'}
          </p>
        )}

        {/* Flight summary */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-gray-500 text-xs uppercase mb-3">Flight</h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatTime(flight?.departure_time)}</p>
              <p className="text-xs text-gray-400">{flight?.origin_code}</p>
            </div>
            <div className="flex-1 text-center text-gray-400 text-xs">
              &#9992; {flight?.flight_number}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatTime(flight?.arrival_time)}</p>
              <p className="text-xs text-gray-400">{flight?.destination_code}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{formatDate(flight?.departure_time)}</p>
        </div>

        {/* Passengers */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-gray-500 text-xs uppercase mb-3">Passengers</h3>
          {passengerForms?.map((p, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{p.first_name} {p.last_name}</span>
              <span className="text-sm font-medium text-blue-600">Seat {selectedSeats?.[i]}</span>
            </div>
          ))}
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-gray-500 text-xs uppercase mb-3">Payment Method</h3>
          <div className="flex gap-3">
            {[
              { id: 'credit_card', label: 'Credit Card' },
              { id: 'promptpay',   label: 'PromptPay' },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={`flex-1 py-2 rounded-lg text-sm border transition ${
                  paymentMethod === m.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:border-blue-400'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-gray-600">Total ({passengers} passenger{passengers > 1 ? 's' : ''})</span>
          <span className="text-2xl font-bold text-blue-600">&#3647;{totalPrice.toLocaleString()}</span>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? 'Confirming...'
            : isRoundTrip && !isReturnLeg
              ? 'Confirm Outbound & Select Return Flight →'
              : 'Confirm & Pay'}
        </button>
      </div>
    </div>
  )
}
