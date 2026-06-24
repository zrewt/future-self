import { useState, useEffect, useRef } from 'react'
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

// username must be 3–20 chars, letters/numbers/underscores only
function isValidUsername(value) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value)
}

export default function Signup() {
  const navigate = useNavigate()
  const [username, setUsername]           = useState('')
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)

  // username availability state
  const [usernameStatus, setUsernameStatus] = useState(null) // null | 'checking' | 'available' | 'taken' | 'invalid'
  const debounceRef = useRef(null)

  useEffect(() => {
    const trimmed = username.trim()

    if (!trimmed) {
      setUsernameStatus(null)
      return
    }

    if (!isValidUsername(trimmed)) {
      setUsernameStatus('invalid')
      return
    }

    setUsernameStatus('checking')
    clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from('users_profile')
        .select('id')
        .eq('username', trimmed)
        .maybeSingle()

      if (error) {
        setUsernameStatus(null)
        return
      }
      setUsernameStatus(data ? 'taken' : 'available')
    }, 450)

    return () => clearTimeout(debounceRef.current)
  }, [username])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const cleanUsername = username.trim()
    const cleanEmail    = normalizeEmail(email)

    if (!cleanUsername) {
      setError('Choose a username to continue.')
      return
    }
    if (!isValidUsername(cleanUsername)) {
      setError('Username must be 3–20 characters: letters, numbers, or underscores only.')
      return
    }
    if (usernameStatus === 'taken') {
      setError('That username is already taken. Pick another one.')
      return
    }
    if (usernameStatus === 'checking') {
      setError('Still checking username availability — try again in a second.')
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
      // Catch the rare race-condition duplicate at the DB level
      if (authError.message?.toLowerCase().includes('unique') ||
          authError.message?.toLowerCase().includes('duplicate')) {
        setError('That username was just taken. Please choose another.')
        setUsernameStatus('taken')
        return
      }
      setError(friendlyAuthError(authError.message))
      return
    }

    navigate('/onboarding')
  }

  // Render the username status indicator
  function UsernameHint() {
    if (!username.trim()) return null
    if (usernameStatus === 'invalid') {
      return (
        <p className="text-xs font-semibold text-coral mt-1">
          3–20 characters, letters/numbers/underscores only
        </p>
      )
    }
    if (usernameStatus === 'checking') {
      return <p className="text-xs font-semibold text-slate-400 mt-1">Checking availability…</p>
    }
    if (usernameStatus === 'available') {
      return <p className="text-xs font-semibold text-teal mt-1">✓ {username.trim()} is available</p>
    }
    if (usernameStatus === 'taken') {
      return <p className="text-xs font-semibold text-coral mt-1">✗ That username is taken</p>
    }
    return null
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="glass-card p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-teal to-primary text-white text-3xl shadow-glow mb-4">
              🚀
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Join Qyven</h1>
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
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                className={`input-field ${
                  usernameStatus === 'taken' || usernameStatus === 'invalid'
                    ? 'border-coral/60 focus:ring-coral/30'
                    : usernameStatus === 'available'
                    ? 'border-teal/60 focus:ring-teal/30'
                    : ''
                }`}
                placeholder="yourname"
                autoComplete="username"
              />
              <UsernameHint />
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
                autoComplete="email"
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
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking'}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
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
