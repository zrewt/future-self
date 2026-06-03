import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { IconSparkles } from '../components/ui/Icons'

function normalizeEmail(value) {
  return value.trim().toLowerCase()
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    })
    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="glass-card p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-primary-700 text-white shadow-glow mb-4">
              <IconSparkles />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Qyven</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Sign in to continue your journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 font-medium">
                {error}
              </div>
            )}

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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            No account?{' '}
            <Link to="/signup" className="text-primary font-bold hover:text-primary-700 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}