import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail } from 'lucide-react'
import { loginCustomer } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { login, user, isAuthenticated, isLoadingUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
  if (!isAuthenticated || isLoadingUser || !user?.role) {
    return
  }

  switch (user.role) {
    case 'ADMIN':
    case 'OPERATIONS':
      navigate('/admin', { replace: true })
      break

    case 'DELIVERY':
      navigate('/delivery', { replace: true })
      break

    case 'CUSTOMER':
      navigate('/', { replace: true })
      break

    default:
      break
  }
}, [isAuthenticated, isLoadingUser, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    try {
      setLoading(true)

      const tokens = await loginCustomer({
        email: email.trim(),
        password,
      })

      login(tokens, email.trim())

      navigate('/')
    } catch (error) {
      if (error.response?.status === 401) {
        setErrorMessage('Invalid email or password.')
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
          Welcome Back
        </h2>

        <p className="text-gray-500 text-center mt-2">
          Login to your LocalHub account
        </p>

        {errorMessage && (
          <p className="mt-5 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>

            <div className="flex items-center border rounded-lg px-3">
              <Mail size={18} className="text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full p-3 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <div className="flex items-center border rounded-lg px-3">
              <LockKeyhole size={18} className="text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-green-700 font-semibold">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
