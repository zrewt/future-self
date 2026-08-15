import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// AMBIENT BACKGROUND
// Matches Onboarding.jsx / Landing.jsx
// ─────────────────────────────────────────────────────────────────────────────

function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <div
        className="qyven-auth-blob"
        style={{
          top: -120,
          left: '-14%',
          width: 460,
          height: 460,
          background:
            'radial-gradient(circle, rgba(255,122,198,0.30) 0%, transparent 70%)',
          animationDelay: '0s',
        }}
      />

      <div
        className="qyven-auth-blob"
        style={{
          top: 120,
          right: '-16%',
          width: 420,
          height: 420,
          background:
            'radial-gradient(circle, rgba(124,58,237,0.26) 0%, transparent 70%)',
          animationDelay: '3s',
        }}
      />

      <div
        className="qyven-auth-blob"
        style={{
          bottom: -120,
          left: '14%',
          width: 400,
          height: 400,
          background:
            'radial-gradient(circle, rgba(0,205,180,0.26) 0%, transparent 70%)',
          animationDelay: '6s',
        }}
      />

      <style>{`
        .qyven-auth-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(18px);
          animation: qyvenAuthDrift 15s ease-in-out infinite;
        }

        @keyframes qyvenAuthDrift {
          0%, 100% {
            transform: translate3d(0,0,0) scale(1);
          }

          50% {
            transform: translate3d(28px,-32px,0) scale(1.1);
          }
        }

        @media (max-width: 640px) {
          .qyven-auth-blob {
            filter: blur(14px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .qyven-auth-blob {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}

function normalizeEmail(value) {
  return value.trim().toLowerCase()
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function friendlyAuthError(message) {
  if (
    message?.toLowerCase().includes('email') &&
    message?.toLowerCase().includes('invalid')
  ) {
    return 'That email looks valid here, but the auth server rejected it. Try retyping it without spaces, or use another email address.'
  }

  return message || 'Could not create your account. Try again.'
}

// Username must be 3–20 chars, letters/numbers/underscores only
function isValidUsername(value) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(value)
}

export default function Signup() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [usernameStatus, setUsernameStatus] = useState(null)
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
    const cleanEmail = normalizeEmail(email)

    if (!cleanUsername) {
      setError('Choose a username to continue.')
      return
    }

    if (!isValidUsername(cleanUsername)) {
      setError(
        'Username must be 3–20 characters: letters, numbers, or underscores only.'
      )
      return
    }

    if (usernameStatus === 'taken') {
      setError('That username is already taken. Pick another one.')
      return
    }

    if (usernameStatus === 'checking') {
      setError(
        'Still checking username availability — try again in a second.'
      )
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
      options: {
        data: {
          username: cleanUsername,
        },
      },
    })

    setLoading(false)

    if (authError) {
      if (
        authError.message?.toLowerCase().includes('unique') ||
        authError.message?.toLowerCase().includes('duplicate')
      ) {
        setError('That username was just taken. Please choose another.')
        setUsernameStatus('taken')
        return
      }

      setError(friendlyAuthError(authError.message))
      return
    }

    navigate('/onboarding')
  }

  function UsernameHint() {
    if (!username.trim()) return null

    if (usernameStatus === 'invalid') {
      return (
        <p className="mt-1 text-xs font-semibold text-coral">
          3–20 characters, letters/numbers/underscores only
        </p>
      )
    }

    if (usernameStatus === 'checking') {
      return (
        <p className="mt-1 text-xs font-semibold text-slate-400">
          Checking availability…
        </p>
      )
    }

    if (usernameStatus === 'available') {
      return (
        <p className="mt-1 text-xs font-semibold text-teal">
          ✓ {username.trim()} is available
        </p>
      )
    }

    if (usernameStatus === 'taken') {
      return (
        <p className="mt-1 text-xs font-semibold text-coral">
          ✗ That username is taken
        </p>
      )
    }

    return null
  }

// Keep ALL of your existing Signup logic:
// normalizeEmail
// isValidEmail
// friendlyAuthError
// isValidUsername
// Signup()
// UsernameHint()
// Supabase signup
//
// Replace ONLY your current return (...) with this:

return (
  <div
    className="relative min-h-screen overflow-hidden px-4 py-8 text-[#12111e] sm:px-6"
    style={{
      background:
        'radial-gradient(circle at 50% -5%, rgba(124,58,237,0.10), transparent 32%), radial-gradient(circle at 100% 45%, rgba(0,205,180,0.06), transparent 30%), #f5f3ff',
    }}
  >
    <AmbientBackground />

    <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
      <div className="grid w-full items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">

        {/* LEFT SIDE */}
        <div className="hidden lg:block">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-purple-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 text-sm">
              🚀
            </span>

            <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7c3aed]">
              Start with Qyven
            </span>
          </div>

          <h1 className="max-w-md text-5xl font-extrabold leading-[1.05] tracking-tight text-[#12111e]">
            Build the person
            <span className="block text-[#7c3aed]">
              you want to become.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-base font-medium leading-7 text-slate-500">
            Qyven turns your everyday habits into one clear picture of where
            you're heading.
          </p>

          {/* Mini journey */}
          <div className="mt-8 space-y-3">
            {[
              ['01', 'Create your account', 'Takes less than a minute'],
              ['02', 'Tell us about yourself', 'Personalize your experience'],
              ['03', 'Start building', 'Track your Future Self'],
            ].map(([number, title, description], index) => (
              <div
                key={number}
                className="flex items-center gap-4 rounded-2xl border border-[rgba(109,40,217,0.12)] bg-white/70 p-4 shadow-sm backdrop-blur"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-xs font-extrabold text-[#7c3aed]">
                  {number}
                </div>

                <div>
                  <p className="text-sm font-extrabold text-slate-700">
                    {title}
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-slate-400">
                    {description}
                  </p>
                </div>

                {index === 0 && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-[#7c3aed]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="mx-auto w-full max-w-md animate-slide-up">

          {/* Mobile brand */}
          <div className="mb-6 text-center lg:hidden">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-200 bg-gradient-to-br from-pink-100 to-purple-100 text-2xl shadow-sm">
              🚀
            </div>

            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7c3aed]">
              Qyven
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[rgba(109,40,217,0.18)] bg-white shadow-[0_20px_60px_rgba(109,40,217,0.10)]">

            {/* Header */}
            <div className="border-b border-[rgba(109,40,217,0.08)] px-6 pb-6 pt-7 sm:px-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7c3aed]">
                    Step 1 of 3
                  </p>

                  <h2 className="text-2xl font-extrabold tracking-tight text-[#12111e]">
                    Create your account
                  </h2>

                  <p className="mt-2 text-sm font-medium leading-5 text-slate-500">
                    Your Future Self journey starts here.
                  </p>
                </div>

                <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-lg sm:flex">
                  ✨
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6">
                <div className="h-1.5 overflow-hidden rounded-full bg-purple-50">
                  <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4]" />
                </div>

                <div className="mt-2 flex justify-between text-[9px] font-extrabold uppercase tracking-wider">
                  <span className="text-[#7c3aed]">Account</span>
                  <span className="text-slate-300">Profile</span>
                  <span className="text-slate-300">Goals</span>
                </div>
              </div>
            </div>

            {/* FORM */}
            <div className="px-6 py-6 sm:px-8">
              <form onSubmit={handleSubmit} className="space-y-5">

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500"
                  >
                    Username
                  </label>

                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.replace(/\s/g, ''))
                    }
                    className={[
                      'w-full rounded-2xl border bg-white px-4 py-4 text-[#12111e] outline-none transition-all placeholder:text-slate-400',
                      'focus:ring-2',
                      usernameStatus === 'taken' ||
                      usernameStatus === 'invalid'
                        ? 'border-coral/60 focus:border-coral focus:ring-coral/20'
                        : usernameStatus === 'available'
                        ? 'border-teal/60 focus:border-teal focus:ring-teal/20'
                        : 'border-[rgba(109,40,217,0.14)] focus:border-purple-400 focus:ring-purple-200',
                    ].join(' ')}
                    placeholder="yourname"
                    autoComplete="username"
                  />

                  <UsernameHint />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value.trimStart())
                    }
                    onBlur={(e) =>
                      setEmail(normalizeEmail(e.target.value))
                    }
                    className="w-full rounded-2xl border border-[rgba(109,40,217,0.14)] bg-white px-4 py-4 text-[#12111e] outline-none transition-all placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-[rgba(109,40,217,0.14)] bg-white px-4 py-4 text-[#12111e] outline-none transition-all placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />

                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className={`h-1 flex-1 rounded-full ${
                        password.length >= 6
                          ? 'bg-teal-400'
                          : 'bg-slate-100'
                      }`}
                    />
                    <span className="text-[10px] font-semibold text-slate-400">
                      6+ characters
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    usernameStatus === 'taken' ||
                    usernameStatus === 'invalid' ||
                    usernameStatus === 'checking'
                  }
                  className="btn-primary w-full py-4 shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Creating account…' : 'Create my account →'}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[rgba(109,40,217,0.08)]" />

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Qyven
                </span>

                <div className="h-px flex-1 bg-[rgba(109,40,217,0.08)]" />
              </div>

              <p className="mt-5 text-center text-sm font-medium text-slate-500">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-extrabold text-[#7c3aed] transition-colors hover:text-[#6d28d9]"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] font-medium text-slate-400">
            Qyven · Become your Future Self
          </p>
        </div>
      </div>
    </div>
  </div>
)
}