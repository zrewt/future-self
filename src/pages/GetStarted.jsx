import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  calcFutureSelfScore,
  calcSleepScore,
  calcHydrationScore,
  calcHabitsScore,
} from '../utils/scoring'

// ─────────────────────────────────────────────────────────────────────────────
// SCORE ENGINE
// Uses the real Qyven scoring functions.
// Assessment answers are converted into reasonable baseline values.
// ─────────────────────────────────────────────────────────────────────────────

function answersToScores(answers) {
  const fitnessMap = {
    0: 8,
    1: 28,
    2: 55,
    3: 78,
  }

  const nutritionMap = {
    0: 20,
    1: 42,
    2: 62,
    3: 80,
  }

  const sleepHoursMap = {
    0: 5.5,
    1: 6.5,
    2: 7.5,
    3: 8.5,
  }

  const sleepQualityMap = {
    0: 4,
    1: 6,
    2: 7,
    3: 9,
  }

  const focusMinMap = {
    0: 10,
    1: 30,
    2: 60,
    3: 90,
  }

  const fitness = fitnessMap[answers.activity ?? 1] ?? 28
  const nutrition = nutritionMap[answers.nutrition ?? 1] ?? 42

  const sleepLog = {
    sleep_hours: sleepHoursMap[answers.sleep ?? 1],
    sleep_quality: sleepQualityMap[answers.sleep ?? 1],
  }

  const sleep = calcSleepScore(sleepLog)

  const hydrationLog = {
    water_ml: 2000,
  }

  const hydration = calcHydrationScore(hydrationLog)

  const habitsLog = {
    focus_minutes: focusMinMap[answers.focus ?? 1],
    reading_minutes: answers.learning ? 20 : 0,
    meditation_minutes: 0,
    mood: 5 + (answers.focus ?? 1),
  }

  const habits = calcHabitsScore(habitsLog)

  const fss = calcFutureSelfScore(
    {
      nutrition,
      fitness,
      sleep,
      hydration,
      habits,
    },
    0
  )

  const energy = Math.min(
    100,
    Math.round(
      (sleepLog.sleep_hours / 8) * 50 +
        sleepLog.sleep_quality * 4 +
        (hydrationLog.water_ml / 3000) * 15
    )
  )

  const longevity = Math.min(
    100,
    Math.round(
      (sleepLog.sleep_hours / 8) * 30 +
        fitness * 0.25 +
        nutrition * 0.25 +
        0.6 * 20
    )
  )

  const focusScore = Math.min(
    100,
    Math.round((focusMinMap[answers.focus ?? 1] / 90) * 60)
  )

  return {
    fss,
    fitness,
    nutrition,
    sleep,
    energy,
    focus: focusScore,
    longevity,
    habits,
    hydration,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAJECTORY
// Clearly framed as an estimate based on consistency.
// ─────────────────────────────────────────────────────────────────────────────

function buildTrajectory(startScore, goals = []) {
  const hasFitnessGoal =
    goals.includes('stronger') || goals.includes('discipline')

  const hasNutritionGoal = goals.includes('eat')
  const hasSleepGoal = goals.includes('sleep')
  const hasFocusGoal =
    goals.includes('focus') || goals.includes('learn')

  const goalBoost =
    (hasFitnessGoal ? 3 : 0) +
    (hasNutritionGoal ? 2 : 0) +
    (hasSleepGoal ? 2 : 0) +
    (hasFocusGoal ? 2 : 0)

  return [
    {
      label: 'Today',
      value: startScore,
    },
    {
      label: '30 days',
      value: Math.min(
        97,
        Math.round(startScore + Math.min(12 + goalBoost, 18))
      ),
    },
    {
      label: '6 months',
      value: Math.min(
        97,
        Math.round(startScore + Math.min(20 + goalBoost * 1.5, 30))
      ),
    },
    {
      label: '1 year',
      value: Math.min(
        97,
        Math.round(startScore + Math.min(28 + goalBoost * 2, 40))
      ),
    },
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 'activity',
    text: 'How active are you right now?',
    sub: 'Think about the past 2 weeks.',
    options: [
      {
        label: 'Rarely moving',
        emoji: '🛋️',
        value: 0,
      },
      {
        label: '1–2 days a week',
        emoji: '🚶',
        value: 1,
      },
      {
        label: '3–4 days a week',
        emoji: '🏃',
        value: 2,
      },
      {
        label: '5+ days a week',
        emoji: '🔥',
        value: 3,
      },
    ],
  },

  {
    id: 'sleep',
    text: "How's your sleep lately?",
    sub: 'Think about your usual week — not your best night.',
    options: [
      {
        label: 'Not great',
        emoji: '😴',
        value: 0,
      },
      {
        label: 'Decent',
        emoji: '🙂',
        value: 1,
      },
      {
        label: 'Pretty good',
        emoji: '😌',
        value: 2,
      },
      {
        label: "I'm locked in",
        emoji: '⚡',
        value: 3,
      },
    ],
  },

  {
    id: 'nutrition',
    text: 'How would you describe your eating habits?',
    sub: 'Think about what you usually eat in a normal week.',
    options: [
      {
        label: 'Mostly processed or takeout',
        emoji: '🍟',
        value: 0,
      },
      {
        label: 'A mix of healthy and processed',
        emoji: '🥙',
        value: 1,
      },
      {
        label: 'Mostly whole foods + good protein',
        emoji: '🥗',
        value: 2,
      },
      {
        label: 'Consistently balanced + nutrient-dense',
        emoji: '🌱',
        value: 3,
      },
    ],
  },

  {
    id: 'focus',
    text: 'How focused are you lately?',
    sub: 'Think deep work, reading and intentional time.',
    options: [
      {
        label: 'Struggling',
        emoji: '😵',
        value: 0,
      },
      {
        label: 'Okay',
        emoji: '😐',
        value: 1,
      },
      {
        label: 'Pretty focused',
        emoji: '🎯',
        value: 2,
      },
      {
        label: 'Locked in',
        emoji: '🧠',
        value: 3,
      },
    ],
  },

  {
    id: 'learning',
    text: 'Are you intentionally learning or growing?',
    sub: 'Reading, studying, building skills or learning something new.',
    options: [
      {
        label: 'Not really',
        emoji: '📱',
        value: 0,
      },
      {
        label: 'Sometimes',
        emoji: '📖',
        value: 1,
      },
      {
        label: 'Almost every day',
        emoji: '🧠',
        value: 2,
      },
      {
        label: 'It is a major priority',
        emoji: '🚀',
        value: 3,
      },
    ],
  },

  {
    id: 'goals',
    text: 'What are you working toward?',
    sub: 'Pick everything that matters to you.',
    multi: true,
    options: [
      {
        label: 'Get stronger',
        emoji: '💪',
        value: 'stronger',
      },
      {
        label: 'Eat healthier',
        emoji: '🥗',
        value: 'eat',
      },
      {
        label: 'Sleep better',
        emoji: '😴',
        value: 'sleep',
      },
      {
        label: 'Improve focus',
        emoji: '🧠',
        value: 'focus',
      },
      {
        label: 'More energy',
        emoji: '⚡',
        value: 'energy',
      },
      {
        label: 'Live longer',
        emoji: '🧬',
        value: 'longevity',
      },
      {
        label: 'Learn and grow',
        emoji: '📚',
        value: 'learn',
      },
      {
        label: 'Build discipline',
        emoji: '🔥',
        value: 'discipline',
      },
    ],
  },
]

const PILLAR_COLORS = {
  fitness: '#7F5AF0',
  nutrition: '#00E87A',
  energy: '#4DA6FF',
  focus: '#FFB830',
  longevity: '#FF5C5C',
}

// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function CountUp({ target, duration = 1400 }) {
  const [val, setVal] = useState(0)

  useEffect(() => {
    let start = null
    let frame

    const step = (ts) => {
      if (!start) start = ts

      const progress = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)

      setVal(Math.round(ease * target))

      if (progress < 1) {
        frame = requestAnimationFrame(step)
      }
    }

    frame = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return <>{val}</>
}

function PulseLine({ color = '#00E87A' }) {
  return (
    <svg
      width="100%"
      height="28"
      viewBox="0 0 300 28"
      preserveAspectRatio="none"
      style={{ opacity: 0.5 }}
    >
      <path
        d="M0,14 L40,14 L55,14 L65,4 L75,24 L82,2 L90,26 L97,14 L120,14 L180,14 L195,7 L205,21 L213,10 L221,18 L228,14 L300,14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AMBIENT BACKGROUND
// Soft drifting brand-color blobs, matching Landing.jsx's ambient treatment.
// Drop as the first child of any `position: relative; overflow: hidden`
// wrapper; content after it needs `position: relative; z-index: 1` to sit
// above it.
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
        className="qyven-onb-blob"
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
        className="qyven-onb-blob"
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
        className="qyven-onb-blob"
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
        .qyven-onb-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(18px);
          animation: qyvenOnbDrift 15s ease-in-out infinite;
        }
        @keyframes qyvenOnbDrift {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(28px,-32px,0) scale(1.1); }
        }
        @media (max-width: 640px) {
          .qyven-onb-blob { filter: blur(14px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .qyven-onb-blob { animation: none !important; }
        }
      `}</style>
    </div>
  )
}

function CheckIcon() {
  return (
    <span
      className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
      style={{
        background: 'rgba(0,205,180,0.14)',
        color: '#00cdb4',
      }}
    >
      ✓
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONALIZED PLAN
// ─────────────────────────────────────────────────────────────────────────────

function buildPlan(answers, scores) {
  const goals = answers.goals || []

  const plan = []

  if (goals.includes('sleep') || scores.sleep < 70) {
    plan.push({
      icon: '😴',
      title: 'Protect your sleep',
      action: 'Aim for a consistent bedtime and 7–9 hours tonight.',
      pillar: 'Sleep',
    })
  }

  if (goals.includes('stronger') || scores.fitness < 60) {
    plan.push({
      icon: '💪',
      title: 'Move your body',
      action: 'Complete a 20–30 minute workout or active walk.',
      pillar: 'Fitness',
    })
  }

  if (goals.includes('eat') || scores.nutrition < 60) {
    plan.push({
      icon: '🥗',
      title: 'Upgrade one meal',
      action: 'Build one meal around protein, plants and minimally processed foods.',
      pillar: 'Nutrition',
    })
  }

  if (
    goals.includes('focus') ||
    goals.includes('learn') ||
    scores.focus < 60
  ) {
    plan.push({
      icon: '🧠',
      title: 'Create focused time',
      action: 'Do one uninterrupted 25-minute focus session.',
      pillar: 'Focus',
    })
  }

  if (goals.includes('energy') || scores.energy < 65) {
    plan.push({
      icon: '⚡',
      title: 'Start hydrated',
      action: 'Drink a glass of water when you wake up and keep water nearby.',
      pillar: 'Energy',
    })
  }

  if (goals.includes('discipline')) {
    plan.push({
      icon: '🔥',
      title: 'Keep one promise',
      action: 'Choose one small habit and complete it even when you do not feel like it.',
      pillar: 'Discipline',
    })
  }

  if (goals.includes('longevity')) {
    plan.push({
      icon: '🧬',
      title: 'Think long term',
      action: 'Choose one behavior today that your future self will thank you for.',
      pillar: 'Longevity',
    })
  }

  const fallback = [
    {
      icon: '🚶',
      title: 'Move for 20 minutes',
      action: 'Take a walk, stretch or do a short workout.',
      pillar: 'Fitness',
    },
    {
      icon: '🥗',
      title: 'Make one better meal',
      action: 'Choose whole foods and include a solid protein source.',
      pillar: 'Nutrition',
    },
    {
      icon: '🧠',
      title: 'Do one focused session',
      action: 'Put your phone away and focus for 25 minutes.',
      pillar: 'Focus',
    },
  ]

  return [...plan, ...fallback].slice(0, 3)
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function GetStarted() {
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [scores, setScores] = useState(null)
  const [trajectory, setTrajectory] = useState(null)
  const [phase, setPhase] = useState('questions')
  const [plan, setPlan] = useState([])

  const totalQ = QUESTIONS.length
  const currentQ = QUESTIONS[qIndex]

  // ───────────────────────────────────────────────────────────────────────────
  // ANSWERS
  // ───────────────────────────────────────────────────────────────────────────

  function handleSingleAnswer(value) {
    const newAnswers = {
      ...answers,
      [currentQ.id]: value,
    }

    setAnswers(newAnswers)

    setTimeout(() => {
      if (qIndex < totalQ - 1) {
        setQIndex((prev) => prev + 1)
      } else {
        finishAssessment(newAnswers)
      }
    }, 180)
  }

  function handleMultiToggle(value) {
    const current = answers[currentQ.id] || []

    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]

    setAnswers({
      ...answers,
      [currentQ.id]: next,
    })
  }

  function handleMultiContinue() {
    if ((answers[currentQ.id] || []).length === 0) return

    if (qIndex < totalQ - 1) {
      setQIndex((prev) => prev + 1)
    } else {
      finishAssessment(answers)
    }
  }

  function finishAssessment(finalAnswers) {
    setPhase('calculating')

    setTimeout(() => {
      const calculatedScores = answersToScores(finalAnswers)

      const calculatedTrajectory = buildTrajectory(
        calculatedScores.fss,
        finalAnswers.goals || []
      )

      const personalizedPlan = buildPlan(
        finalAnswers,
        calculatedScores
      )

      setScores(calculatedScores)
      setTrajectory(calculatedTrajectory)
      setPlan(personalizedPlan)
      setPhase('reveal')
    }, 1800)
  }

  function goBack() {
    if (qIndex > 0) {
      setQIndex((prev) => prev - 1)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PILLARS
  // ───────────────────────────────────────────────────────────────────────────

  const pillarsDisplay = useMemo(() => {
    if (!scores) return []

    return [
      {
        label: 'Fitness',
        value: scores.fitness,
        color: PILLAR_COLORS.fitness,
        icon: '🏋️',
      },
      {
        label: 'Nutrition',
        value: scores.nutrition,
        color: PILLAR_COLORS.nutrition,
        icon: '🥗',
      },
      {
        label: 'Energy',
        value: scores.energy,
        color: PILLAR_COLORS.energy,
        icon: '⚡',
      },
      {
        label: 'Focus',
        value: scores.focus,
        color: PILLAR_COLORS.focus,
        icon: '🎯',
      },
      {
        label: 'Longevity',
        value: scores.longevity,
        color: PILLAR_COLORS.longevity,
        icon: '🧬',
      },
    ]
  }, [scores])

  const sortedPillars = [...pillarsDisplay].sort(
    (a, b) => b.value - a.value
  )

  const strongest = sortedPillars[0]
  const weakest = sortedPillars[sortedPillars.length - 1]

  // ───────────────────────────────────────────────────────────────────────────
  // CALCULATING
  // ───────────────────────────────────────────────────────────────────────────

  if (phase === 'calculating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden" style={{ background: '#f5f3ff' }}>
        <AmbientBackground />
        <div className="w-full max-w-sm relative z-10">
          <div
            className="mx-auto mb-7 w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(0,205,180,0.14), rgba(124,58,237,0.14))',
              border: '1px solid rgba(0,205,180,0.22)',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}
          >
            🧬
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-[#00cdb4] mb-2">
            Almost there
          </p>

          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
            Building your Future Self
          </h2>

          <p className="text-sm text-slate-500 mb-8">
            Turning your answers into a personal starting point.
          </p>

          <div className="space-y-3 text-left">
            {[
              'Understanding your habits',
              'Calculating your baseline',
              'Finding your biggest opportunity',
              'Building your first plan',
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm font-semibold text-slate-600"
                style={{
                  animation: `fadeIn 0.5s ${index * 0.35}s both`,
                }}
              >
                <CheckIcon />
                {item}
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulseGlow {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 0 rgba(0,205,180,0);
            }
            50% {
              transform: scale(1.04);
              box-shadow: 0 0 35px rgba(0,205,180,0.18);
            }
          }
        `}</style>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCORE REVEAL
  // ───────────────────────────────────────────────────────────────────────────

  if (phase === 'reveal') {
    return (
      <div className="min-h-screen px-4 py-8 relative overflow-hidden" style={{ background: '#f5f3ff' }}>
        <AmbientBackground />
        <div className="max-w-md mx-auto space-y-5 relative z-10">
          <div className="text-center pt-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00cdb4] mb-2">
              Your baseline
            </p>

            <h1 className="text-3xl font-extrabold text-slate-900">
              Meet your Future Self Score
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              This is your starting point — not a final destination.
            </p>
          </div>

          <div
            className="rounded-[28px] p-7 text-center relative overflow-hidden"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(109,40,217,0.10)',
              boxShadow:
                '0 20px 60px rgba(109,40,217,0.12), 0 8px 24px rgba(109,40,217,0.06)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background:
                  'linear-gradient(90deg, #ff7ac6, #7c3aed, #00cdb4)',
              }}
            />

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af] mb-3">
              Starting point
            </p>

            <div
              className="text-[92px] font-black tabular-nums leading-none"
              style={{
                background:
                  'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <CountUp target={scores.fss} />
            </div>

            <p className="text-[#6b7280] font-semibold text-sm mt-2">
              Future Self Score
            </p>

            <div className="mt-5">
              <PulseLine color="#7c3aed" />
            </div>

            <div className="mt-5 space-y-3">
              {pillarsDisplay.map((pillar) => (
                <div
                  key={pillar.label}
                  className="flex items-center gap-3"
                >
                  <span className="w-5 text-sm">
                    {pillar.icon}
                  </span>

                  <span className="w-16 text-left text-[11px] font-bold text-[#6b7280]">
                    {pillar.label}
                  </span>

                  <div className="flex-1 h-1.5 rounded-full bg-[rgba(109,40,217,0.08)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pillar.value}%`,
                        background: pillar.color,
                        boxShadow: `0 0 8px ${pillar.color}77`,
                      }}
                    />
                  </div>

                  <span
                    className="w-7 text-right text-xs font-extrabold tabular-nums"
                    style={{ color: pillar.color }}
                  >
                    {pillar.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(109,40,217,0.10)", boxShadow: "0 4px 14px rgba(109,40,217,0.06)" }}>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#00cdb4] mb-2">
                Strongest
              </p>

              <p className="font-extrabold text-lg text-slate-900">
                {strongest?.icon} {strongest?.label}
              </p>

              <p
                className="text-2xl font-black mt-1"
                style={{ color: strongest?.color }}
              >
                {strongest?.value}
              </p>
            </div>

            <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(109,40,217,0.10)", boxShadow: "0 4px 14px rgba(109,40,217,0.06)" }}>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#FFB830] mb-2">
                Biggest opportunity
              </p>

              <p className="font-extrabold text-lg text-slate-900">
                {weakest?.icon} {weakest?.label}
              </p>

              <p
                className="text-2xl font-black mt-1"
                style={{ color: weakest?.color }}
              >
                {weakest?.value}
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 text-sm leading-relaxed text-[#6b7280]"
            style={{
              background: 'rgba(109,40,217,0.035)',
              border: '1px solid rgba(109,40,217,0.08)',
            }}
          >
            Your score is simply a snapshot of where you are today.
            What matters is what happens next.
          </div>

          <button
            type="button"
            onClick={() => setPhase('trajectory')}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white"
            style={{
              background:
                'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
              boxShadow:
                '0 8px 30px rgba(124,58,237,0.28)',
            }}
          >
            See where you're heading →
          </button>

          <p className="text-center text-[11px] text-slate-400">
            Based on your answers. Not medical advice.
          </p>
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRAJECTORY
  // ───────────────────────────────────────────────────────────────────────────

  if (phase === 'trajectory') {
    const maxVal = Math.max(...trajectory.map((item) => item.value))

    return (
      <div className="min-h-screen px-4 py-8 relative overflow-hidden" style={{ background: '#f5f3ff' }}>
        <AmbientBackground />
        <div className="max-w-md mx-auto space-y-5 relative z-10">
          <div className="text-center pt-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00cdb4] mb-2">
              Your trajectory
            </p>

            <h1 className="text-3xl font-extrabold text-slate-900">
              You have room to grow.
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Consistency is what changes the trajectory.
            </p>
          </div>

          <div
            className="rounded-[28px] p-6"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(109,40,217,0.10)',
              boxShadow: '0 20px 50px rgba(109,40,217,0.10)',
            }}
          >
            <div className="flex items-end justify-between gap-3 h-48">
              {trajectory.map((item, index) => (
                <div
                  key={item.label}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-2"
                >
                  <span
                    className="text-lg font-black tabular-nums"
                    style={{
                      color:
                        index === 0 ? '#9ca3af' : '#00cdb4',
                    }}
                  >
                    {item.value}
                  </span>

                  <div
                    className="w-full rounded-xl transition-all duration-1000"
                    style={{
                      height: `${Math.max(
                        24,
                        Math.round((item.value / maxVal) * 120)
                      )}px`,
                      background:
                        index === 0
                          ? 'rgba(109,40,217,0.10)'
                          : 'linear-gradient(180deg, #00cdb4, #7c3aed)',
                      boxShadow:
                        index === 0
                          ? 'none'
                          : '0 0 14px rgba(0,205,180,0.25)',
                    }}
                  />

                  <span className="text-[10px] font-bold text-[#9ca3af] text-center">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <PulseLine color="#7c3aed" />
            </div>

            <p className="text-[10px] text-[#9ca3af] text-center mt-2">
              Illustrative estimate based on consistent habits — not a guarantee.
            </p>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              background: `${weakest?.color}0D`,
              border: `1px solid ${weakest?.color}2B`,
            }}
          >
            <p
              className="text-[10px] uppercase tracking-widest font-bold mb-2"
              style={{ color: weakest?.color }}
            >
              Your biggest opportunity
            </p>

            <p className="text-xl font-extrabold text-slate-900">
              {weakest?.icon} {weakest?.label}
            </p>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Improving your {weakest?.label?.toLowerCase()} consistency
              could make one of the biggest differences to your overall
              baseline.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPhase('plan')}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white"
            style={{
              background:
                'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
              boxShadow:
                '0 8px 30px rgba(124,58,237,0.28)',
            }}
          >
            Build my 7-day plan →
          </button>

          <button
            type="button"
            onClick={() => setPhase('reveal')}
            className="w-full py-2 text-sm font-semibold text-[#9ca3af]"
          >
            ← Back to my score
          </button>
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PERSONALIZED PLAN
  // ───────────────────────────────────────────────────────────────────────────

  if (phase === 'plan') {
    return (
      <div className="min-h-screen px-4 py-8 relative overflow-hidden" style={{ background: '#f5f3ff' }}>
        <AmbientBackground />
        <div className="max-w-md mx-auto space-y-5 relative z-10">
          <div className="text-center pt-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00cdb4] mb-2">
              Your first 7 days
            </p>

            <h1 className="text-3xl font-extrabold text-slate-900">
              Start smaller. Stay consistent.
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Based on your answers, these are the highest-value places to start.
            </p>
          </div>

          <div className="space-y-3">
            {plan.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="rounded-2xl p-5 flex gap-4"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(109,40,217,0.10)',
                  boxShadow: '0 4px 14px rgba(109,40,217,0.06)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{
                    background: 'rgba(0,205,180,0.10)',
                  }}
                >
                  {item.icon}
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#00cdb4] mb-1">
                    Day {index + 1} · {item.pillar}
                  </p>

                  <h3 className="font-extrabold text-lg text-slate-900">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {item.action}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(0,205,180,0.06))',
              border: '1px solid rgba(124,58,237,0.14)',
            }}
          >
            <p className="text-2xl mb-2">🎯</p>

            <p className="font-extrabold text-slate-900">
              Your goal isn't perfection.
            </p>

            <p className="text-sm text-slate-500 mt-1">
              It's proving to yourself that you can show up consistently.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPhase('firstAction')}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white"
            style={{
              background:
                'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
              boxShadow:
                '0 8px 30px rgba(124,58,237,0.28)',
            }}
          >
            Start my first action →
          </button>

          <button
            type="button"
            onClick={() => setPhase('trajectory')}
            className="w-full py-2 text-sm font-semibold text-[#9ca3af]"
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FIRST ACTION
  // ───────────────────────────────────────────────────────────────────────────

  if (phase === 'firstAction') {
    const firstAction = plan[0]

    return (
      <div className="min-h-screen flex items-center px-4 py-10 relative overflow-hidden" style={{ background: '#f5f3ff' }}>
        <AmbientBackground />
        <div className="max-w-md mx-auto w-full relative z-10">
          <div className="text-center mb-7">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00cdb4] mb-3">
              Your first move
            </p>

            <h1 className="text-4xl font-black text-slate-900 leading-tight">
              Don't just plan it.
              <br />
              <span
                style={{
                  background:
                    'linear-gradient(90deg, #ff7ac6, #7c3aed, #00cdb4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Start it.
              </span>
            </h1>
          </div>

          <div
            className="rounded-[30px] p-7 text-center"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(109,40,217,0.10)',
              boxShadow: '0 20px 60px rgba(109,40,217,0.12)',
            }}
          >
            <div className="text-6xl mb-5">
              {firstAction?.icon || '🎯'}
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-[#00cdb4] mb-2">
              Your first action
            </p>

            <h2 className="text-2xl font-extrabold text-slate-900">
              {firstAction?.title || 'Take one positive action'}
            </h2>

            <p className="text-[#6b7280] mt-3 leading-relaxed">
              {firstAction?.action ||
                'Do one small thing today that moves you forward.'}
            </p>

            <div
              className="mt-6 p-4 rounded-2xl text-left"
              style={{
                background: 'rgba(109,40,217,0.035)',
                border: '1px solid rgba(109,40,217,0.08)',
              }}
            >
              <div className="flex items-start gap-3">
                <CheckIcon />

                <p className="text-sm text-[#6b7280] leading-relaxed">
                  Qyven works by turning small daily actions into visible
                  progress over time.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPhase('signup')}
            className="w-full mt-5 py-4 rounded-2xl font-bold text-sm text-white"
            style={{
              background:
                'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
              boxShadow:
                '0 8px 30px rgba(124,58,237,0.28)',
            }}
          >
            Save my progress with Qyven →
          </button>

          <p className="text-center text-xs text-[#9ca3af] mt-3">
            Your assessment is ready to save.
          </p>
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SIGNUP
  // ───────────────────────────────────────────────────────────────────────────

  if (phase === 'signup') {
    return (
      <div className="min-h-screen flex items-center px-4 py-10 relative overflow-hidden" style={{ background: '#f5f3ff' }}>
        <AmbientBackground />
        <div className="max-w-md w-full mx-auto relative z-10">
          <div
            className="rounded-2xl p-4 flex items-center gap-4 mb-6"
            style={{
              background: 'rgba(0,205,180,0.08)',
              border: '1px solid rgba(0,205,180,0.18)',
            }}
          >
            <div
              className="text-4xl font-black tabular-nums"
              style={{
                background:
                  'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {scores?.fss}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#00cdb4]">
                Your score is ready
              </p>

              <p className="text-sm font-semibold text-[#6b7280]">
                Create an account to keep your progress.
              </p>
            </div>
          </div>

          <div className="text-center mb-7">
            <h1 className="text-3xl font-extrabold text-slate-900">
              Your Future Self starts here.
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Save your baseline, track your habits and watch your progress.
            </p>
          </div>

          <div
            className="rounded-3xl p-5 mb-5"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(109,40,217,0.10)',
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#9ca3af] mb-4">
              What you'll unlock
            </p>

            <div className="space-y-3">
              {[
                'Your personalized Future Self Score',
                'Daily habit and progress tracking',
                'XP, streaks and levels',
                'Personalized insights and goals',
                'Your Future Self trajectory',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm font-semibold text-slate-700"
                >
                  <CheckIcon />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/signup"
            state={{
              fromAssessment: true,
              scores,
              answers,
              trajectory,
              plan,
            }}
            className="flex items-center justify-center w-full py-4 rounded-2xl font-bold text-sm text-white"
            style={{
              background:
                'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
              boxShadow:
                '0 8px 30px rgba(124,58,237,0.28)',
            }}
          >
            Create my free account →
          </Link>

          <Link
            to="/login"
            className="flex items-center justify-center w-full py-3 mt-2 text-sm font-semibold text-[#6b7280]"
          >
            Already have an account? Log in
          </Link>

          <p className="text-center text-[11px] text-[#9ca3af] mt-3">
            Free · No credit card · Your assessment is saved when you sign up
          </p>
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // QUESTIONS
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen px-4 py-7 flex flex-col relative overflow-hidden" style={{ background: '#f5f3ff' }}>
      <AmbientBackground />
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col relative z-10">
        {/* HEADER */}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00cdb4]">
                Qyven
              </p>

              <p className="text-sm font-bold text-slate-900 mt-1">
                Build your Future Self
              </p>
            </div>

            <p className="text-xs font-bold text-slate-400">
              {qIndex + 1} / {totalQ}
            </p>
          </div>

          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((qIndex + 1) / totalQ) * 100}%`,
                background:
                  'linear-gradient(90deg, #ff7ac6, #7c3aed, #00cdb4)',
              }}
            />
          </div>
        </div>

        {/* QUESTION */}

        <div className="flex-1">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900 leading-[1.08]">
              {currentQ.text}
            </h2>

            {currentQ.sub && (
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {currentQ.sub}
              </p>
            )}
          </div>

          {/* SINGLE SELECT */}

          {!currentQ.multi && (
            <div className="space-y-3">
              {currentQ.options.map((option) => {
                const selected =
                  answers[currentQ.id] === option.value

                return (
                  <button
                    key={`${option.label}-${option.value}`}
                    type="button"
                    onClick={() =>
                      handleSingleAnswer(option.value)
                    }
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-left border transition-all duration-150"
                    style={{
                      background: selected
                        ? 'rgba(0,205,180,0.08)'
                        : '#ffffff',
                      borderColor: selected
                        ? 'rgba(0,205,180,0.45)'
                        : 'rgba(109,40,217,0.16)',
                      boxShadow: selected
                        ? '0 4px 14px rgba(0,205,180,0.14)'
                        : '0 2px 8px rgba(109,40,217,0.06)',
                      transform: selected
                        ? 'translateY(-1px)'
                        : 'none',
                    }}
                  >
                    <span className="text-2xl w-9 text-center">
                      {option.emoji}
                    </span>

                    <span className="font-semibold text-slate-800">
                      {option.label}
                    </span>

                    {selected && (
                      <span className="ml-auto text-[#00cdb4] font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* MULTI SELECT */}

          {currentQ.multi && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {currentQ.options.map((option) => {
                  const selected = (
                    answers[currentQ.id] || []
                  ).includes(option.value)

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        handleMultiToggle(option.value)
                      }
                      className="relative flex flex-col items-start gap-3 p-4 rounded-2xl text-left border transition-all duration-150 min-h-[112px]"
                      style={{
                        background: selected
                          ? 'rgba(0,205,180,0.08)'
                          : '#ffffff',
                        borderColor: selected
                          ? 'rgba(0,205,180,0.45)'
                          : 'rgba(109,40,217,0.16)',
                        boxShadow: selected
                          ? '0 4px 14px rgba(0,205,180,0.14)'
                          : '0 2px 8px rgba(109,40,217,0.06)',
                      }}
                    >
                      <span className="text-2xl">
                        {option.emoji}
                      </span>

                      <span className="font-semibold text-sm text-slate-800 leading-tight">
                        {option.label}
                      </span>

                      {selected && (
                        <span className="absolute top-3 right-3 text-[#00cdb4] font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={handleMultiContinue}
                disabled={
                  (answers[currentQ.id] || []).length === 0
                }
                className="w-full py-4 rounded-2xl font-bold text-sm text-white mt-5 disabled:opacity-30"
                style={{
                  background:
                    'linear-gradient(135deg, #7c3aed, #00cdb4)',
                  boxShadow:
                    '0 8px 24px rgba(124,58,237,0.24)',
                }}
              >
                Continue →
              </button>
            </>
          )}
        </div>

        {/* BACK */}

        {qIndex > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="mt-7 py-2 text-center text-sm text-slate-400 font-semibold"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}
