import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { IconSparkles } from '../components/ui/Icons'

function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      <div
        className="qyven-auth-blob"
        style={{
          top: -140,
          left: '-12%',
          width: 480,
          height: 480,
          background:
            'radial-gradient(circle, rgba(255,122,198,0.28) 0%, transparent 70%)',
        }}
      />

      <div
        className="qyven-auth-blob"
        style={{
          top: 80,
          right: '-14%',
          width: 440,
          height: 440,
          background:
            'radial-gradient(circle, rgba(124,58,237,0.23) 0%, transparent 70%)',
          animationDelay: '3s',
        }}
      />

      <div
        className="qyven-auth-blob"
        style={{
          bottom: -150,
          left: '18%',
          width: 430,
          height: 430,
          background:
            'radial-gradient(circle, rgba(0,205,180,0.20) 0%, transparent 70%)',
          animationDelay: '6s',
        }}
      />

      <style>{`
        .qyven-auth-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(20px);
          animation: qyvenAuthDrift 15s ease-in-out infinite;
        }

        @keyframes qyvenAuthDrift {
          0%, 100% {
            transform: translate3d(0,0,0) scale(1);
          }
          50% {
            transform: translate3d(25px,-30px,0) scale(1.08);
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

          {/* LEFT — BRAND STORY */}
          <div className="hidden lg:block">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-purple-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-[#7c3aed]">
                ✦
              </span>

              <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7c3aed]">
                Qyven
              </span>
            </div>

            <h1 className="max-w-md text-5xl font-extrabold leading-[1.05] tracking-tight text-[#12111e]">
              Your future self
              <span className="block text-[#7c3aed]">
                is still waiting.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-base font-medium leading-7 text-slate-500">
              Keep building the habits that compound into a stronger,
              healthier, more focused version of you.
            </p>

            <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
              {[
                ['01', 'Track'],
                ['02', 'Improve'],
                ['03', 'Compound'],
              ].map(([number, label]) => (
                <div
                  key={number}
                  className="rounded-2xl border border-[rgba(109,40,217,0.14)] bg-white/75 p-4 shadow-sm backdrop-blur"
                >
                  <p className="text-[10px] font-extrabold text-[#7c3aed]">
                    {number}
                  </p>

                  <p className="mt-1 text-sm font-extrabold text-slate-700">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — LOGIN */}
          <div className="mx-auto w-full max-w-md animate-slide-up">
            {/* Mobile brand */}
            <div className="mb-6 text-center lg:hidden">
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-200 bg-gradient-to-br from-pink-100 to-purple-100 text-[#7c3aed] shadow-sm">
                <IconSparkles />
              </div>

              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7c3aed]">
                Qyven
              </p>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[rgba(109,40,217,0.18)] bg-white shadow-[0_20px_60px_rgba(109,40,217,0.10)]">
              {/* Card header */}
              <div className="border-b border-[rgba(109,40,217,0.08)] px-6 pb-6 pt-7 sm:px-8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7c3aed]">
                      Welcome back
                    </p>

                    <h2 className="text-2xl font-extrabold tracking-tight text-[#12111e]">
                      Continue your journey
                    </h2>

                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Sign in to pick up where you left off.
                    </p>
                  </div>

                  <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-lg sm:flex">
                    ✨
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="px-6 py-6 sm:px-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-700">
                      {error}
                    </div>
                  )}

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
                      onChange={(e) => setEmail(e.target.value.trimStart())}
                      onBlur={(e) =>
                        setEmail(normalizeEmail(e.target.value))
                      }
                      className="w-full rounded-2xl border border-[rgba(109,40,217,0.14)] bg-white px-4 py-4 text-[#12111e] outline-none transition-all placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="block text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500"
                      >
                        Password
                      </label>
                    </div>

                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-[rgba(109,40,217,0.14)] bg-white px-4 py-4 text-[#12111e] outline-none transition-all placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-4 shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? 'Signing in…' : 'Sign in →'}
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
                  New to Qyven?{' '}
                  <Link
                    to="/signup"
                    className="font-extrabold text-[#7c3aed] transition-colors hover:text-[#6d28d9]"
                  >
                    Create your account
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