import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function PassengerDetails() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { flight, passengers, selectedSeats, tripType, returnDate, isReturnLeg } = state || {}

  const [forms, setForms] = useState(
    Array.from({ length: passengers }, () => ({
      first_name: '', last_name: '', passport_number: '',
    }))
  )

  const update = (i, field, value) =>
    setForms(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f))

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/confirm', { state: { flight, passengers, selectedSeats, passengerForms: forms, tripType, returnDate, isReturnLeg } })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Passenger Details</h2>
        <p className="text-gray-500 text-sm mb-6">Fill in details for all passengers</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {forms.map((form, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  {i + 1}
                </span>
                Passenger {i + 1}
                <span className="text-xs text-gray-400 ml-auto">
                  Seat: <span className="text-blue-600 font-semibold">{selectedSeats?.[i]}</span>
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                  <input
                    required
                    value={form.first_name}
                    onChange={e => update(i, 'first_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Somchai"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                  <input
                    required
                    value={form.last_name}
                    onChange={e => update(i, 'last_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Jaidee"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Passport / ID Number <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    value={form.passport_number}
                    onChange={e => update(i, 'passport_number', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="TH1234567"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            Review Booking &rarr;
          </button>
        </form>
      </div>
    </div>
  )
}
