import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, Mail, LogIn } from 'lucide-react'
import { apiService } from '../services/api'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiService.login({ email, password })
      if (res?.success) {
        const redirectTo = (location.state as any)?.from || '/dashboard'
        navigate(redirectTo)
      } else {
        setError(res?.message || 'Invalid credentials')
      }
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 mb-3">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Sign in to your account</h1>
            <p className="mt-1 text-sm text-gray-500">Use your work email to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field pl-9"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input-field pl-9 pr-24"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-sm text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full inline-flex items-center justify-center"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          By continuing, you agree to our Terms and acknowledge our Privacy Policy.
        </p>
      </div>
    </div>
  )
}

export default Login


