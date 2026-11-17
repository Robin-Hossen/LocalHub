import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, Mail, Phone, LockKeyhole } from 'lucide-react'
import { registerCustomer } from '../../services/authService'

function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  })

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (formData.password !== formData.confirm_password) {
      setErrorMessage('Passwords do not match!')
      return
    }

    const nameParts = formData.full_name.trim().split(/\s+/)
    const first_name = nameParts[0]
    const last_name = nameParts.slice(1).join(' ')

    try {
      setLoading(true)

      await registerCustomer({
        first_name,
        last_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      })

      setSuccessMessage('Account created successfully! You can now login.')

      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
      })
    } catch (error) {
      const data = error.response?.data

      if (data && typeof data === 'object') {
        const messages = Object.entries(data)
          .map(([field, value]) =>
            `${field}: ${Array.isArray(value) ? value.join(', ') : value}`
          )
          .join(' | ')

        setErrorMessage(messages || 'Registration failed.')
      } else {
        setErrorMessage('Unable to connect to the server.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 text-center">
          Create Account
        </h2>

        <p className="text-gray-500 text-center mt-2">
          Join LocalHub today
        </p>

        {errorMessage && (
          <p className="mt-5 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="mt-5 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
            {successMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <div className="flex items-center border rounded-lg px-3">
              <UserRound size={18} className="text-gray-400" />
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full p-3 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <div className="flex items-center border rounded-lg px-3">
              <Mail size={18} className="text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full p-3 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <div className="flex items-center border rounded-lg px-3">
              <Phone size={18} className="text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone"
                className="w-full p-3 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="flex items-center border rounded-lg px-3">
              <LockKeyhole size={18} className="text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
                className="w-full p-3 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <div className="flex items-center border rounded-lg px-3">
              <LockKeyhole size={18} className="text-gray-400" />
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Confirm password"
                className="w-full p-3 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-lg font-semibold transition"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-green-700 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
