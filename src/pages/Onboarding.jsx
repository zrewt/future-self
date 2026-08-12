import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'

const PATHS = [
  {
    id: 'athlete',
    label: 'Athlete',
    icon: '🏋️',
    desc: 'Strength, performance & movement',
  },
  {
    id: 'scholar',
    label: 'Scholar',
    icon: '📚',
    desc: 'Learning, focus & knowledge',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    icon: '⚖️',
    desc: 'A little better in every area',
  },
  {
    id: 'builder',
    label: 'Builder',
    icon: '🔨',
    desc: 'Habits, systems & consistency',
  },
]

const GOALS = [
  {
    label: 'Get fitter',
    pillar: 'fitness',
    icon: '🏃',
    desc: 'Build strength and endurance',
  },
  {
    label: 'Sleep better',
    pillar: 'energy',
    icon: '💤',
    desc: 'Improve recovery and energy',
  },
  {
    label: 'Eat healthier',
    pillar: 'nutrition',
    icon: '🥗',
    desc: 'Build better nutrition habits',
  },
  {
    label: 'Build focus',
    pillar: 'focus',
    icon: '🎯',
    desc: 'Improve concentration',
  },
  {
    label: 'Read more',
    pillar: 'focus',
    icon: '📚',
    desc: 'Learn something every day',
  },
  {
    label: 'Reduce stress',
    pillar: 'energy',
    icon: '🧘',
    desc: 'Create more calm and balance',
  },
  {
    label: 'Live longer',
    pillar: 'longevity',
    icon: '🌿',
    desc: 'Build habits that compound',
  },
  {
    label: 'Lose weight',
    pillar: 'nutrition',
    icon: '⚖️',
    desc: 'Work toward a healthier body',
  },
]

function pickFocusPillar(selectedGoals) {
  if (!selectedGoals.length) return 'fitness'

  const first = GOALS.find((goal) => goal.label === selectedGoals[0])

  return first?.pillar || 'fitness'
}

const STEP_INFO = [
  {
    number: '01',
    title: 'About you',
    short: 'Your profile',
  },
  {
    number: '02',
    title: 'Your path',
    short: 'Your direction',
  },
  {
    number: '03',
    title: 'Your goals',
    short: 'Your priorities',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, profile, setProfile } = useUserStore()

  const [step, setStep] = useState(1)

  const [username, setUsername] = useState(
    profile?.username || user?.user_metadata?.username || ''
  )

  const [avatarClass, setAvatarClass] = useState(
    profile?.avatar_class || 'balanced'
  )

  const [goals, setGoals] = useState([])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const progress = (step / 3) * 100

  function toggleGoal(goal) {
    setGoals((prev) => {
      if (prev.includes(goal)) {
        return prev.filter((item) => item !== goal)
      }

      if (prev.length >= 3) {
        return prev
      }

      return [...prev, goal]
    })
  }

  function continueFromStep1() {
    if (!username.trim()) {
      setError('Please enter your name.')
      return
    }

    setError('')
    setStep(2)
  }

  function continueFromStep2() {
    setError('')
    setStep(3)
  }

  function goBack() {
    setError('')
    setStep((prev) => Math.max(1, prev - 1))
  }

  async function finish() {
    if (!user) return

    if (!username.trim()) {
      setError('Please enter your name.')
      setStep(1)
      return
    }

    if (!goals.length) {
      setError('Choose at least one goal to continue.')
      return
    }

    setError('')
    setLoading(true)

    const focusPillar = pickFocusPillar(goals)

    const { data: savedProfile, error: profileError } = await supabase
      .from('users_profile')
      .upsert(
        {
          id: user.id,
          username: username.trim(),
          avatar_class: avatarClass,
          focus_pillar: focusPillar,
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (profileError) {
      setLoading(false)
      setError(profileError.message)
      return
    }

    const { data: authData, error: authError } =
      await supabase.auth.updateUser({
        data: {
          onboarding_complete: true,
          goals,
        },
      })

    if (authError) {
      setLoading(false)
      setError(authError.message)
      return
    }

    const { setUser, loadUserData } = useUserStore.getState()

    if (authData?.user) {
      setUser(authData.user)
    }

    setProfile(savedProfile)

    await loadUserData(user.id, { silent: true })

    setLoading(false)

    navigate('/dashboard')
  }

  const selectedPath =
    PATHS.find((path) => path.id === avatarClass) || PATHS[2]

  const focusPillar = pickFocusPillar(goals)

  return (
    <div
      className="min-h-screen px-4 py-7 text-white sm:py-9 md:py-12"
      style={{
        background:
          'radial-gradient(circle at 50% -5%, rgba(127,90,240,0.20), transparent 32%), radial-gradient(circle at 100% 45%, rgba(0,232,198,0.06), transparent 30%), #08080d',
      }}
    >
      <div className="mx-auto w-full max-w-xl">
        {/* HEADER */}
        <div className="mb-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#A78BFA]">
                Qyven
              </p>

              <p className="mt-1 text-sm font-bold text-white">
                Build your Future Self
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Step
              </p>

              <p className="text-sm font-extrabold text-zinc-300">
                {step}{' '}
                <span className="text-zinc-700">
                  / 3
                </span>
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="relative">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF7AC6] via-[#7F5AF0] to-[#00E8C6] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-3">
              {STEP_INFO.map((item, index) => {
                const active = step >= index + 1

                return (
                  <div
                    key={item.number}
                    className={[
                      'flex items-center gap-1.5',
                      index === 1
                        ? 'justify-center'
                        : index === 2
                        ? 'justify-end'
                        : 'justify-start',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'text-[10px] font-extrabold',
                        active ? 'text-[#A78BFA]' : 'text-zinc-700',
                      ].join(' ')}
                    >
                      {item.number}
                    </span>

                    <span
                      className={[
                        'hidden text-[10px] font-bold sm:inline',
                        active ? 'text-zinc-400' : 'text-zinc-700',
                      ].join(' ')}
                    >
                      {item.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
            {error}
          </div>
        )}

        {/* STEP 1 — NAME */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="px-1 sm:px-2">
              <div className="mb-9">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-400/20 bg-gradient-to-br from-pink-500/10 to-purple-500/15 text-2xl">
                  👋
                </div>

                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#A78BFA]">
                  Let&apos;s make this yours
                </p>

                <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                  What should we call you?
                </h1>

                <p className="max-w-lg text-sm font-medium leading-6 text-zinc-400 sm:text-base">
                  Your name will personalize your Qyven experience and appear
                  on your dashboard.
                </p>
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-zinc-400"
                >
                  Your name
                </label>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      continueFromStep1()
                    }
                  }}
                  className="mb-5 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-purple-500/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-purple-500/10"
                  placeholder="e.g. Benny"
                  autoFocus
                  maxLength={30}
                />

                <button
                  type="button"
                  onClick={continueFromStep1}
                  disabled={!username.trim()}
                  className="btn-primary w-full shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue →
                </button>

                <p className="mt-4 text-center text-[11px] font-medium text-zinc-500">
                  You can change this later.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — PATH */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#A78BFA]">
                Your direction
              </p>

              <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                Who are you becoming?
              </h1>

              <p className="text-sm font-medium leading-relaxed text-zinc-400 md:text-base">
                Choose the path that feels closest to the person you want to
                become. This helps personalize your experience.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3">
              {PATHS.map((path) => {
                const selected = avatarClass === path.id

                return (
                  <button
                    key={path.id}
                    type="button"
                    onClick={() => setAvatarClass(path.id)}
                    className={[
                      'relative rounded-3xl border p-5 text-left transition-all duration-200 focus:outline-none',
                      selected
                        ? 'border-purple-500/60 bg-purple-500/10 ring-1 ring-purple-500/40 shadow-[0_0_30px_rgba(127,90,240,0.10)]'
                        : 'border-white/[0.08] bg-white/[0.035] hover:border-purple-500/30 hover:bg-white/[0.055]',
                    ].join(' ')}
                  >
                    {selected && (
                      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#7F5AF0] text-xs font-extrabold text-white">
                        ✓
                      </span>
                    )}

                    <span className="mb-4 block text-3xl">
                      {path.icon}
                    </span>

                    <p className="font-extrabold text-white">
                      {path.label}
                    </p>

                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-zinc-500">
                      {path.desc}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-xl">
                {selectedPath.icon}
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-600">
                  Your path
                </p>

                <p className="text-sm font-extrabold text-zinc-200">
                  {selectedPath.label}
                </p>
              </div>

              <span className="text-xs font-extrabold text-[#A78BFA]">
                Selected
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="btn-secondary flex-1"
              >
                Back
              </button>

              <button
                type="button"
                onClick={continueFromStep2}
                className="btn-primary flex-1"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — GOALS */}
        {step === 3 && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#A78BFA]">
                    Your priorities
                  </p>

                  <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                    What do you want to improve?
                  </h1>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs font-extrabold text-zinc-400">
                    {goals.length}/3
                  </p>

                  <p className="text-[10px] font-medium text-zinc-600">
                    selected
                  </p>
                </div>
              </div>

              <p className="text-sm font-medium leading-relaxed text-zinc-400 md:text-base">
                Pick up to 3. Your first choice becomes your main focus inside
                Qyven.
              </p>
            </div>

            <div className="mb-6 space-y-2.5">
              {GOALS.map((goal) => {
                const selected = goals.includes(goal.label)
                const isFirst = goals[0] === goal.label

                return (
                  <button
                    key={goal.label}
                    type="button"
                    onClick={() => toggleGoal(goal.label)}
                    className={[
                      'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none',
                      selected
                        ? isFirst
                          ? 'border-purple-500/60 bg-purple-500/10 ring-1 ring-purple-500/30'
                          : 'border-purple-500/30 bg-purple-500/[0.06]'
                        : 'border-white/[0.08] bg-white/[0.035] hover:border-purple-500/25 hover:bg-white/[0.05]',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-all',
                        selected
                          ? 'bg-purple-500/15'
                          : 'bg-white/[0.05]',
                      ].join(' ')}
                    >
                      {goal.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-zinc-100">
                        {goal.label}
                      </p>

                      <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
                        {goal.desc}
                      </p>
                    </div>

                    {isFirst && (
                      <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#A78BFA]">
                        Main
                      </span>
                    )}

                    {!isFirst && selected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7F5AF0] text-xs font-extrabold text-white">
                        ✓
                      </span>
                    )}

                    {!selected && goals.length < 3 && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-xs font-bold text-zinc-600">
                        +
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Personalized preview */}
            {goals.length > 0 && (
              <div className="mb-5 rounded-3xl border border-purple-500/10 bg-gradient-to-r from-purple-500/10 via-purple-500/[0.03] to-cyan-500/[0.08] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-lg">
                    🎯
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-extrabold text-zinc-200">
                      Your Qyven experience is taking shape
                    </p>

                    <p className="text-[11px] font-medium leading-relaxed text-zinc-500">
                      Your main focus will be{' '}
                      <span className="font-extrabold capitalize text-[#A78BFA]">
                        {focusPillar}
                      </span>
                      . You&apos;ll still track all five pillars, but this one
                      will get extra attention.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
              <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-zinc-600">
                Your setup
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-zinc-600">
                    Name
                  </p>

                  <p className="mt-0.5 truncate text-sm font-extrabold text-zinc-200">
                    {username || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-zinc-600">
                    Path
                  </p>

                  <p className="mt-0.5 text-sm font-extrabold text-zinc-200">
                    {selectedPath.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Back
              </button>

              <button
                type="button"
                onClick={finish}
                disabled={loading || goals.length === 0}
                className="btn-primary flex-[1.6] shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? 'Setting up Qyven…' : 'Start my journey 🚀'}
              </button>
            </div>

            <p className="mt-4 text-center text-[10px] font-medium text-zinc-600">
              You can change your goals and path anytime from your profile.
            </p>
          </div>
        )}

        {/* Bottom brand */}
        <div className="mt-10 text-center">
          <p className="text-[11px] font-medium text-zinc-600">
            Qyven · Become your Future Self
          </p>
        </div>
      </div>
    </div>
  )
}