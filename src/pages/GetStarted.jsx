import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  calcFutureSelfScore,
  calcSleepScore,
  calcHydrationScore,
  calcHabitsScore,
} from '../utils/scoring'

// ── Map assessment answers to approximate log values ─────────────────────────
// These produce REAL scores using the actual scoring engine — no fake numbers

function answersToScores(answers) {
  // activity → fitness_score proxy
  const fitnessMap = { 0: 8, 1: 28, 2: 55, 3: 78 }
  const fitness = fitnessMap[answers.activity ?? 1] ?? 28

  // nutrition rating → nutrition_score proxy
  const nutritionMap = { 0: 20, 1: 42, 2: 62, 3: 80 }
  const nutrition = nutritionMap[answers.nutrition ?? 1] ?? 42

  // sleep rating → sleep score via actual function
  const sleepHoursMap = { 0: 5.5, 1: 6.5, 2: 7.5, 3: 8.5 }
  const sleepQualityMap = { 0: 4, 1: 6, 2: 7, 3: 9 }
  const sleepLog = {
    sleep_hours: sleepHoursMap[answers.sleep ?? 1],
    sleep_quality: sleepQualityMap[answers.sleep ?? 1],
  }
  const sleep = calcSleepScore(sleepLog)

  // focus rating → hydration + habits proxy
  const focusMinMap = { 0: 10, 1: 30, 2: 60, 3: 90 }
  const hydrationLog = { water_ml: 2000 } // neutral assumption
  const hydration = calcHydrationScore(hydrationLog)

  const habitsLog = {
    focus_minutes: focusMinMap[answers.focus ?? 1],
    reading_minutes: 0,
    meditation_minutes: 0,
    mood: 5 + (answers.focus ?? 1),
  }
  const habits = calcHabitsScore(habitsLog)

  const fss = calcFutureSelfScore({ nutrition, fitness, sleep, hydration, habits }, 0)

  // pillar display scores
  const energy = Math.round(
    sleepLog.sleep_hours / 8 * 50 +
    sleepLog.sleep_quality * 4 +
    hydrationLog.water_ml / 3000 * 15
  )

  const longevity = Math.round(
    (sleepLog.sleep_hours / 8) * 30 +
    fitness   * 0.25 +
    nutrition * 0.25 +
    0.6 * 20
  )

  const focusScore = Math.round((focusMinMap[answers.focus ?? 1] / 90) * 60)

  return { fss, fitness, nutrition, sleep, energy, focus: focusScore, longevity, habits, hydration }
}

// Trajectory projection — simple linear with decay, no false promises
function buildTrajectory(startScore, goals) {
  const hasFitnessGoal   = goals?.includes('stronger') || goals?.includes('discipline')
  const hasNutritionGoal = goals?.includes('eat')
  const hasSleepGoal     = goals?.includes('sleep')
  const hasFocusGoal     = goals?.includes('focus') || goals?.includes('learn')

  const goalBoost = (hasFitnessGoal ? 3 : 0) + (hasNutritionGoal ? 2 : 0) +
                    (hasSleepGoal ? 2 : 0) + (hasFocusGoal ? 2 : 0)

  const d30  = Math.min(97, Math.round(startScore + Math.min(12 + goalBoost, 18)))
  const d180 = Math.min(97, Math.round(startScore + Math.min(20 + goalBoost * 1.5, 30)))
  const d365 = Math.min(97, Math.round(startScore + Math.min(28 + goalBoost * 2, 40)))

  return [
    { label: 'Today',    value: startScore },
    { label: '30 days',  value: d30 },
    { label: '6 months', value: d180 },
    { label: '1 year',   value: d365 },
  ]
}

// ── Questions ─────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 'activity',
    text: 'How active are you right now?',
    sub: 'Think about the past 2 weeks.',
    options: [
      { label: 'Rarely moving',      emoji: '🛋️', value: 0 },
      { label: '1–2 days a week',    emoji: '🚶', value: 1 },
      { label: '3–4 days a week',    emoji: '🏃', value: 2 },
      { label: '5+ days a week',     emoji: '🔥', value: 3 },
    ],
  },
  {
    id: 'sleep',
    text: "How's your sleep lately?",
    sub: 'Be honest — your score depends on it.',
    options: [
      { label: 'Not great',    emoji: '😴', value: 0 },
      { label: 'Decent',       emoji: '🙂', value: 1 },
      { label: 'Pretty good',  emoji: '😌', value: 2 },
      { label: "I'm locked in",emoji: '⚡', value: 3 },
    ],
  },
  {
    id: 'nutrition',
    text: 'How would you rate your nutrition?',
    sub: 'Fruits, vegetables, protein — the basics.',
    options: [
      { label: 'Could be better', emoji: '🍟', value: 0 },
      { label: 'Getting there',   emoji: '🥙', value: 1 },
      { label: 'Pretty solid',    emoji: '🥗', value: 2 },
      { label: "I'm dialled in",  emoji: '🌱', value: 3 },
    ],
  },
  {
    id: 'focus',
    text: 'How focused are you lately?',
    sub: 'Deep work, reading, intentional time.',
    options: [
      { label: 'Struggling',     emoji: '😵', value: 0 },
      { label: 'Okay',           emoji: '😐', value: 1 },
      { label: 'Pretty focused', emoji: '🎯', value: 2 },
      { label: 'Locked in',      emoji: '🧠', value: 3 },
    ],
  },
  {
    id: 'goals',
    text: "What are you working toward?",
    sub: 'Pick everything that matters. This shapes your plan.',
    multi: true,
    options: [
      { label: 'Get stronger',      emoji: '💪', value: 'stronger' },
      { label: 'Eat healthier',     emoji: '🥗', value: 'eat' },
      { label: 'Sleep better',      emoji: '😴', value: 'sleep' },
      { label: 'Improve focus',     emoji: '🧠', value: 'focus' },
      { label: 'More energy',       emoji: '⚡', value: 'energy' },
      { label: 'Live longer',       emoji: '🧬', value: 'longevity' },
      { label: 'Learn and grow',    emoji: '📚', value: 'learn' },
      { label: 'Build discipline',  emoji: '🔥', value: 'discipline' },
    ],
  },
]

const PILLAR_COLORS = {
  fitness:   '#7F5AF0',
  nutrition: '#00E87A',
  energy:    '#4DA6FF',
  focus:     '#FFB830',
  longevity: '#FF5C5C',
}

// ── Animated score counter ────────────────────────────────────────────────────
function CountUp({ target, duration = 1400 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return <>{val}</>
}

// ── Pulse line SVG ────────────────────────────────────────────────────────────
function PulseLine({ color = '#00E87A' }) {
  return (
    <svg width="100%" height="28" viewBox="0 0 300 28" preserveAspectRatio="none" style={{ opacity: 0.5 }}>
      <path
        d="M0,14 L40,14 L55,14 L65,4 L75,24 L82,2 L90,26 L97,14 L120,14 L180,14 L195,7 L205,21 L213,10 L221,18 L228,14 L300,14"
        fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GetStarted() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(0) // 0=questions, then score reveal screens
  const [qIndex, setQIndex]   = useState(0)
  const [answers, setAnswers] = useState({})
  const [scores, setScores]   = useState(null)
  const [trajectory, setTrajectory] = useState(null)
  const [phase, setPhase]     = useState('questions') // questions | calculating | reveal | trajectory | plan | signup

  const totalQ    = QUESTIONS.length
  const currentQ  = QUESTIONS[qIndex]
  const progress  = Math.round((qIndex / totalQ) * 100)

  function handleSingleAnswer(value) {
    const newAnswers = { ...answers, [currentQ.id]: value }
    setAnswers(newAnswers)
    if (qIndex < totalQ - 1) {
      setQIndex(qIndex + 1)
    } else {
      finishAssessment(newAnswers)
    }
  }

  function handleMultiToggle(value) {
    const current = answers[currentQ.id] || []
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    setAnswers({ ...answers, [currentQ.id]: next })
  }

  function handleMultiContinue() {
    if (qIndex < totalQ - 1) {
      setQIndex(qIndex + 1)
    } else {
      finishAssessment(answers)
    }
  }

  function finishAssessment(finalAnswers) {
    setPhase('calculating')
    setTimeout(() => {
      const s = answersToScores(finalAnswers)
      const t = buildTrajectory(s.fss, finalAnswers.goals || [])
      setScores(s)
      setTrajectory(t)
      setPhase('reveal')
    }, 2200)
  }

  const pillarsDisplay = scores ? [
    { label: 'Fitness',   value: scores.fitness,   color: PILLAR_COLORS.fitness,   icon: '🏋️' },
    { label: 'Nutrition', value: scores.nutrition,  color: PILLAR_COLORS.nutrition, icon: '🥗' },
    { label: 'Energy',    value: scores.energy,     color: PILLAR_COLORS.energy,    icon: '💤' },
    { label: 'Focus',     value: scores.focus,      color: PILLAR_COLORS.focus,     icon: '🎯' },
    { label: 'Longevity', value: scores.longevity,  color: PILLAR_COLORS.longevity, icon: '🌿' },
  ] : []

  const sortedPillars   = [...pillarsDisplay].sort((a, b) => b.value - a.value)
  const strongest       = sortedPillars[0]
  const weakest         = sortedPillars[sortedPillars.length - 1]

  // ── CALCULATING ─────────────────────────────────────────────────────────────
  if (phase === 'calculating') {
    return (
      <div className="app-bg min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          <div className="inline-block text-5xl animate-bounce mb-4">🧬</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-[#E8F0E0] mb-2">
            Building your Future Self...
          </h2>
          <p className="text-slate-500 dark:text-[#5A7050] text-sm">Calculating your starting score</p>
        </div>
        <div className="w-64 space-y-3 text-left">
          {['Goals ✓', 'Current habits ✓', 'Lifestyle baseline ✓', 'Calculating score…'].map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-3 text-sm font-medium"
              style={{
                color: i < 3 ? '#00E87A' : '#9DB890',
                animation: `fadeIn 0.4s ${i * 0.4}s both`,
              }}
            >
              <span>{item}</span>
            </div>
          ))}
        </div>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    )
  }

  // ── SCORE REVEAL ────────────────────────────────────────────────────────────
  if (phase === 'reveal') {
    return (
      <div className="app-bg min-h-screen px-4 py-10">
        <div className="max-w-md mx-auto space-y-5">
          <div className="text-center mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#7F5AF0] dark:text-[#00E87A] mb-2">
              Your result
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-[#E8F0E0]">
              Your Future Self Score
            </h1>
          </div>

          {/* Big score card */}
          <div
            className="rounded-3xl p-8 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0A0D08 0%, #1E2616 100%)',
              border: '1px solid rgba(0,232,122,0.2)',
              boxShadow: '0 0 60px rgba(0,232,122,0.15), 0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #00E87A, #7F5AF0)' }} />
            <p className="text-xs font-bold uppercase tracking-widest text-[#5A7050] mb-3">Starting point</p>
            <div
              className="text-8xl font-extrabold tabular-nums leading-none mb-2"
              style={{
                background: 'linear-gradient(135deg, #00E87A, #7F5AF0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <CountUp target={scores.fss} />
            </div>
            <p className="text-[#9DB890] text-sm font-semibold mb-1">Future Self Score</p>
            <PulseLine color="#00E87A" />

            {/* Pillar bars */}
            <div className="mt-5 space-y-2.5 text-left">
              {pillarsDisplay.map((p) => (
                <div key={p.label} className="flex items-center gap-3">
                  <span className="text-sm w-5">{p.icon}</span>
                  <span className="text-xs font-bold text-[#5A7050] w-16 shrink-0">{p.label}</span>
                  <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${p.value}%`,
                        background: p.color,
                        transition: 'width 1.4s cubic-bezier(0.16,1,0.3,1)',
                        boxShadow: `0 0 6px ${p.color}88`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-extrabold tabular-nums w-7 text-right" style={{ color: p.color }}>
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Insight cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#00C466] mb-1">Strongest</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-[#E8F0E0]">
                {strongest?.icon} {strongest?.label}
              </p>
              <p className="text-2xl font-extrabold tabular-nums" style={{ color: strongest?.color }}>
                {strongest?.value}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFB830] mb-1">Opportunity</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-[#E8F0E0]">
                {weakest?.icon} {weakest?.label}
              </p>
              <p className="text-2xl font-extrabold tabular-nums" style={{ color: weakest?.color }}>
                {weakest?.value}
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 text-sm text-[#9DB890] leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            Your score isn't a judgment. It's a starting point — and every logged day moves it.
          </div>

          <button
            type="button"
            onClick={() => setPhase('trajectory')}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white"
            style={{
              background: 'linear-gradient(135deg, #00E87A, #7F5AF0)',
              boxShadow: '0 4px 20px rgba(0,232,122,0.35)',
            }}
          >
            See where you could go →
          </button>

          <p className="text-center text-xs text-slate-400 dark:text-[#5A7050]">
            Based on your answers — not medical advice
          </p>
        </div>
      </div>
    )
  }

  // ── TRAJECTORY ──────────────────────────────────────────────────────────────
  if (phase === 'trajectory') {
    const maxVal = Math.max(...trajectory.map(t => t.value))
    return (
      <div className="app-bg min-h-screen px-4 py-10">
        <div className="max-w-md mx-auto space-y-5">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#7F5AF0] dark:text-[#00E87A] mb-2">
              Your trajectory
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-[#E8F0E0] mb-1">
              Where could you go?
            </h1>
            <p className="text-sm text-slate-500 dark:text-[#5A7050]">
              Based on your starting point and consistent daily habits.
            </p>
          </div>

          {/* Trajectory visual */}
          <div
            className="rounded-3xl p-6 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0A0D08, #1E2616)', border: '1px solid rgba(0,232,122,0.15)' }}
          >
            <div className="flex items-end justify-between gap-3 mb-4">
              {trajectory.map((t, i) => (
                <div key={t.label} className="flex-1 flex flex-col items-center gap-2">
                  <span
                    className="text-lg font-extrabold tabular-nums"
                    style={{ color: i === 0 ? '#9DB890' : '#00E87A' }}
                  >
                    {t.value}
                  </span>
                  <div
                    className="w-full rounded-xl transition-all duration-1000"
                    style={{
                      height: `${Math.round((t.value / maxVal) * 120)}px`,
                      background: i === 0
                        ? 'rgba(255,255,255,0.1)'
                        : `linear-gradient(180deg, #00E87A ${100 - Math.round((t.value / maxVal) * 100)}%, #7F5AF0 100%)`,
                      boxShadow: i > 0 ? '0 0 12px rgba(0,232,122,0.3)' : 'none',
                    }}
                  />
                  <span className="text-[10px] font-bold text-[#5A7050] text-center leading-tight">{t.label}</span>
                </div>
              ))}
            </div>
            <PulseLine color="#00E87A" />
            <p className="text-[10px] text-[#5A7050] text-center mt-2">
              Estimate based on consistency — not a guarantee
            </p>
          </div>

          {/* Biggest opportunity */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: `${weakest?.color}12`,
              border: `1px solid ${weakest?.color}30`,
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: weakest?.color }}>
              Your biggest opportunity
            </p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-[#E8F0E0] mb-1">
              {weakest?.icon} {weakest?.label}
            </p>
            <p className="text-sm text-slate-500 dark:text-[#5A7050]">
              Improving your {weakest?.label?.toLowerCase()} consistency could have the biggest impact on your overall score.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPhase('signup')}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white"
            style={{
              background: 'linear-gradient(135deg, #00E87A, #7F5AF0)',
              boxShadow: '0 4px 20px rgba(0,232,122,0.35)',
            }}
          >
            Save my Future Self →
          </button>

          <button
            type="button"
            onClick={() => setPhase('reveal')}
            className="w-full py-3 text-sm font-semibold text-slate-400 dark:text-[#5A7050]"
          >
            ← Back to my score
          </button>
        </div>
      </div>
    )
  }

  // ── SIGNUP ──────────────────────────────────────────────────────────────────
  if (phase === 'signup') {
    return (
      <div className="app-bg min-h-screen flex flex-col items-center justify-center px-4 py-10">
        <div className="max-w-md w-full space-y-5">
          {/* Score reminder */}
          <div
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: 'rgba(0,232,122,0.08)', border: '1px solid rgba(0,232,122,0.2)' }}
          >
            <div
              className="text-3xl font-extrabold tabular-nums shrink-0"
              style={{ color: '#00E87A' }}
            >
              {scores?.fss}
            </div>
            <div>
              <p className="text-xs font-bold text-[#00C466]">Your Future Self Score</p>
              <p className="text-sm font-semibold text-[#9DB890]">Create your account to save it</p>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-[#E8F0E0] mb-1">
              Save your Future Self.
            </h1>
            <p className="text-sm text-slate-500 dark:text-[#5A7050]">
              Free account. No credit card. Your score waits for you.
            </p>
          </div>

          {/* Auth buttons — link to existing signup with state */}
          <div className="space-y-3">
            <Link
              to="/signup"
              state={{ fromAssessment: true, scores, answers }}
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl font-bold text-sm text-white"
              style={{
                background: 'linear-gradient(135deg, #00E87A, #7F5AF0)',
                boxShadow: '0 4px 20px rgba(0,232,122,0.35)',
              }}
            >
              Continue with Email →
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl font-semibold text-sm border"
              style={{
                background: 'transparent',
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#9DB890',
              }}
            >
              Already have an account? Log in
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-[#5A7050]">
            Free · No credit card · Works on any device
          </p>
        </div>
      </div>
    )
  }

  // ── QUESTIONS ────────────────────────────────────────────────────────────────
  return (
    <div className="app-bg min-h-screen px-4 py-8 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#7F5AF0] dark:text-[#00E87A]">
              Building your Future Self
            </p>
            <p className="text-xs font-bold text-slate-400 dark:text-[#5A7050]">
              {qIndex + 1} / {totalQ}
            </p>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((qIndex) / totalQ) * 100}%`,
                background: 'linear-gradient(90deg, #7F5AF0, #00E87A)',
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-[#E8F0E0] mb-1 leading-tight">
            {currentQ.text}
          </h2>
          {currentQ.sub && (
            <p className="text-sm text-slate-500 dark:text-[#5A7050] mb-6">{currentQ.sub}</p>
          )}

          {/* Single select */}
          {!currentQ.multi && (
            <div className="space-y-3">
              {currentQ.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSingleAnswer(opt.value)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-150 border"
                  style={{
                    background: answers[currentQ.id] === opt.value
                      ? 'rgba(127,90,240,0.1)'
                      : 'rgba(255,255,255,0.04)',
                    borderColor: answers[currentQ.id] === opt.value
                      ? 'rgba(127,90,240,0.4)'
                      : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="font-semibold text-slate-800 dark:text-[#E8F0E0]">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Multi select */}
          {currentQ.multi && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {currentQ.options.map((opt) => {
                  const selected = (answers[currentQ.id] || []).includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleMultiToggle(opt.value)}
                      className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-150 border"
                      style={{
                        background: selected ? 'rgba(0,232,122,0.1)' : 'rgba(255,255,255,0.04)',
                        borderColor: selected ? 'rgba(0,232,122,0.4)' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="font-semibold text-sm text-slate-800 dark:text-[#E8F0E0]">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={handleMultiContinue}
                disabled={(answers[currentQ.id] || []).length === 0}
                className="w-full py-4 rounded-2xl font-bold text-sm text-white disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #7F5AF0, #6D44E0)',
                  boxShadow: '0 4px 16px rgba(127,90,240,0.4)',
                }}
              >
                Continue →
              </button>
            </>
          )}
        </div>

        {/* Back */}
        {qIndex > 0 && (
          <button
            type="button"
            onClick={() => setQIndex(qIndex - 1)}
            className="mt-6 text-center text-sm text-slate-400 dark:text-[#5A7050] font-semibold"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}
