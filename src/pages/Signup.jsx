import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

function normalizeEmail(value) {
  return value.trim().toLowerCase()
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function friendlyAuthError(message) {
  if (message?.toLowerCase().includes('email') && message?.toLowerCase().includes('invalid')) {
    return 'That email looks valid here, but the auth server rejected it. Try retyping it without spaces, or use another email address.'
  }
  return message || 'Could not create your account. Try again.'
}

export default function Signup() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleanUsername = username.trim()
    const cleanEmail = normalizeEmail(email)

    if (!cleanUsername) {
      setError('Choose a username to continue.')
      return
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Enter a valid email address, like james@gmail.com.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { username: cleanUsername } },
    })

    setLoading(false)

    if (authError) {
      setError(friendlyAuthError(authError.message))
      return
    }

    navigate('/onboarding')
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="glass-card p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-teal to-primary text-white text-3xl shadow-glow mb-4">
              🚀
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Join Future Self</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Start building your best self</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="label-text">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="yourname"
              />
            </div>

            <div>
              <label className="label-text">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value.trimStart())}
                onBlur={(e) => setEmail(normalizeEmail(e.target.value))}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="label-text">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
