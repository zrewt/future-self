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
        value: false,
      },
      {
        label: 'Sometimes',
        emoji: '📖',
        value: true,
      },
      {
        label: 'Almost every day',
        emoji: '🧠',
        value: true,
      },
      {
        label: 'It is a major priority',
        emoji: '🚀',
        value: true,
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

function CheckIcon() {
  return (
    <span
      className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
      style={{
        background: 'rgba(0,232,122,0.15)',
        color: '#00E87A',
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
      <div className="app-bg min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-full max-w-sm">
          <div
            className="mx-auto mb-7 w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(0,232,122,0.15), rgba(127,90,240,0.15))',
              border: '1px solid rgba(0,232,122,0.2)',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}
          >
            🧬
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-[#00E87A] mb-2">
            Almost there
          </p>

          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-[#E8F0E0] mb-3">
            Building your Future Self
          </h2>

          <p className="text-sm text-slate-500 dark:text-[#5A7050] mb-8">
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
                className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-[#9DB890]"
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
              box-shadow: 0 0 0 rgba(0,232,122,0);
            }
            50% {
              transform: scale(1.04);
              box-shadow: 0 0 35px rgba(0,232,122,0.18);
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
      <div className="app-bg min-h-screen px-4 py-8">
        <div className="max-w-md mx-auto space-y-5">
          <div className="text-center pt-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00E87A] mb-2">
              Your baseline
            </p>

            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-[#E8F0E0]">
              Meet your Future Self Score
            </h1>

            <p className="text-sm text-slate-500 dark:text-[#5A7050] mt-2">
              This is your starting point — not a final destination.
            </p>
          </div>

          <div
            className="rounded-[28px] p-7 text-center relative overflow-hidden"
            style={{
              background:
                'linear-gradient(145deg, #0A0D08 0%, #151C11 55%, #10150D 100%)',
              border: '1px solid rgba(0,232,122,0.18)',
              boxShadow:
                '0 0 70px rgba(0,232,122,0.12), 0 25px 70px rgba(0,0,0,0.35)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background:
                  'linear-gradient(90deg, #7F5AF0, #00E87A)',
              }}
            />

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A7050] mb-3">
              Starting point
            </p>

            <div
              className="text-[92px] font-black tabular-nums leading-none"
              style={{
                background:
                  'linear-gradient(135deg, #00E87A, #7F5AF0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <CountUp target={scores.fss} />
            </div>

            <p className="text-[#9DB890] font-semibold text-sm mt-2">
              Future Self Score
            </p>

            <div className="mt-5">
              <PulseLine />
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

                  <span className="w-16 text-left text-[11px] font-bold text-[#71836A]">
                    {pillar.label}
                  </span>

                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
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
            <div className="glass-card rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#00C466] mb-2">
                Strongest
              </p>

              <p className="font-extrabold text-lg text-slate-900 dark:text-[#E8F0E0]">
                {strongest?.icon} {strongest?.label}
              </p>

              <p
                className="text-2xl font-black mt-1"
                style={{ color: strongest?.color }}
              >
                {strongest?.value}
              </p>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#FFB830] mb-2">
                Biggest opportunity
              </p>

              <p className="font-extrabold text-lg text-slate-900 dark:text-[#E8F0E0]">
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
            className="rounded-2xl p-4 text-sm leading-relaxed text-[#8FA084]"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
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
                'linear-gradient(135deg, #00E87A, #7F5AF0)',
              boxShadow:
                '0 8px 30px rgba(0,232,122,0.22)',
            }}
          >
            See where you're heading →
          </button>

          <p className="text-center text-[11px] text-slate-400 dark:text-[#53624E]">
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
      <div className="app-bg min-h-screen px-4 py-8">
        <div className="max-w-md mx-auto space-y-5">
          <div className="text-center pt-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00E87A] mb-2">
              Your trajectory
            </p>

            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-[#E8F0E0]">
              You have room to grow.
            </h1>

            <p className="text-sm text-slate-500 dark:text-[#5A7050] mt-2">
              Consistency is what changes the trajectory.
            </p>
          </div>

          <div
            className="rounded-[28px] p-6"
            style={{
              background:
                'linear-gradient(145deg, #0A0D08, #161D11)',
              border: '1px solid rgba(0,232,122,0.15)',
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
                        index === 0 ? '#9DB890' : '#00E87A',
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
                          ? 'rgba(255,255,255,0.1)'
                          : 'linear-gradient(180deg, #00E87A, #7F5AF0)',
                      boxShadow:
                        index === 0
                          ? 'none'
                          : '0 0 18px rgba(0,232,122,0.18)',
                    }}
                  />

                  <span className="text-[10px] font-bold text-[#5A7050] text-center">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <PulseLine />
            </div>

            <p className="text-[10px] text-[#53624E] text-center mt-2">
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

            <p className="text-xl font-extrabold text-slate-900 dark:text-[#E8F0E0]">
              {weakest?.icon} {weakest?.label}
            </p>

            <p className="text-sm text-slate-500 dark:text-[#71836A] mt-2 leading-relaxed">
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
                'linear-gradient(135deg, #00E87A, #7F5AF0)',
              boxShadow:
                '0 8px 30px rgba(0,232,122,0.22)',
            }}
          >
            Build my 7-day plan →
          </button>

          <button
            type="button"
            onClick={() => setPhase('reveal')}
            className="w-full py-2 text-sm font-semibold text-[#5A7050]"
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
      <div className="app-bg min-h-screen px-4 py-8">
        <div className="max-w-md mx-auto space-y-5">
          <div className="text-center pt-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00E87A] mb-2">
              Your first 7 days
            </p>

            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-[#E8F0E0]">
              Start smaller. Stay consistent.
            </h1>

            <p className="text-sm text-slate-500 dark:text-[#5A7050] mt-2">
              Based on your answers, these are the highest-value places to start.
            </p>
          </div>

          <div className="space-y-3">
            {plan.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="rounded-2xl p-5 flex gap-4"
                style={{
                  background: 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{
                    background: 'rgba(0,232,122,0.08)',
                  }}
                >
                  {item.icon}
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#00C466] mb-1">
                    Day {index + 1} · {item.pillar}
                  </p>

                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-[#E8F0E0]">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 dark:text-[#71836A] mt-1 leading-relaxed">
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
                'linear-gradient(135deg, rgba(127,90,240,0.08), rgba(0,232,122,0.07))',
              border: '1px solid rgba(127,90,240,0.16)',
            }}
          >
            <p className="text-2xl mb-2">🎯</p>

            <p className="font-extrabold text-slate-900 dark:text-[#E8F0E0]">
              Your goal isn't perfection.
            </p>

            <p className="text-sm text-slate-500 dark:text-[#71836A] mt-1">
              It's proving to yourself that you can show up consistently.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPhase('firstAction')}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white"
            style={{
              background:
                'linear-gradient(135deg, #00E87A, #7F5AF0)',
              boxShadow:
                '0 8px 30px rgba(0,232,122,0.22)',
            }}
          >
            Start my first action →
          </button>

          <button
            type="button"
            onClick={() => setPhase('trajectory')}
            className="w-full py-2 text-sm font-semibold text-[#5A7050]"
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
      <div className="app-bg min-h-screen flex items-center px-4 py-10">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-7">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00E87A] mb-3">
              Your first move
            </p>

            <h1 className="text-4xl font-black text-slate-900 dark:text-[#E8F0E0] leading-tight">
              Don't just plan it.
              <br />
              <span
                style={{
                  background:
                    'linear-gradient(90deg, #00E87A, #7F5AF0)',
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
              background:
                'linear-gradient(145deg, #0A0D08, #171E12)',
              border: '1px solid rgba(0,232,122,0.18)',
              boxShadow: '0 20px 70px rgba(0,0,0,0.35)',
            }}
          >
            <div className="text-6xl mb-5">
              {firstAction?.icon || '🎯'}
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-[#00E87A] mb-2">
              Your first action
            </p>

            <h2 className="text-2xl font-extrabold text-[#E8F0E0]">
              {firstAction?.title || 'Take one positive action'}
            </h2>

            <p className="text-[#8FA084] mt-3 leading-relaxed">
              {firstAction?.action ||
                'Do one small thing today that moves you forward.'}
            </p>

            <div
              className="mt-6 p-4 rounded-2xl text-left"
              style={{
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-start gap-3">
                <CheckIcon />

                <p className="text-sm text-[#9DB890] leading-relaxed">
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
                'linear-gradient(135deg, #00E87A, #7F5AF0)',
              boxShadow:
                '0 8px 30px rgba(0,232,122,0.22)',
            }}
          >
            Save my progress with Qyven →
          </button>

          <p className="text-center text-xs text-[#53624E] mt-3">
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
      <div className="app-bg min-h-screen flex items-center px-4 py-10">
        <div className="max-w-md w-full mx-auto">
          <div
            className="rounded-2xl p-4 flex items-center gap-4 mb-6"
            style={{
              background: 'rgba(0,232,122,0.07)',
              border: '1px solid rgba(0,232,122,0.16)',
            }}
          >
            <div
              className="text-4xl font-black tabular-nums"
              style={{ color: '#00E87A' }}
            >
              {scores?.fss}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#00C466]">
                Your score is ready
              </p>

              <p className="text-sm font-semibold text-[#9DB890]">
                Create an account to keep your progress.
              </p>
            </div>
          </div>

          <div className="text-center mb-7">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-[#E8F0E0]">
              Your Future Self starts here.
            </h1>

            <p className="text-sm text-slate-500 dark:text-[#71836A] mt-2">
              Save your baseline, track your habits and watch your progress.
            </p>
          </div>

          <div
            className="rounded-3xl p-5 mb-5"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#5A7050] mb-4">
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
                  className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-[#B3C3AC]"
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
                'linear-gradient(135deg, #00E87A, #7F5AF0)',
              boxShadow:
                '0 8px 30px rgba(0,232,122,0.22)',
            }}
          >
            Create my free account →
          </Link>

          <Link
            to="/login"
            className="flex items-center justify-center w-full py-3 mt-2 text-sm font-semibold text-[#71836A]"
          >
            Already have an account? Log in
          </Link>

          <p className="text-center text-[11px] text-[#53624E] mt-3">
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
    <div className="app-bg min-h-screen px-4 py-7 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* HEADER */}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00E87A]">
                Qyven
              </p>

              <p className="text-sm font-bold text-slate-900 dark:text-[#E8F0E0] mt-1">
                Build your Future Self
              </p>
            </div>

            <p className="text-xs font-bold text-slate-400 dark:text-[#5A7050]">
              {qIndex + 1} / {totalQ}
            </p>
          </div>

          <div className="h-1.5 bg-slate-100 dark:bg-white/[0.07] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((qIndex + 1) / totalQ) * 100}%`,
                background:
                  'linear-gradient(90deg, #7F5AF0, #00E87A)',
              }}
            />
          </div>
        </div>

        {/* QUESTION */}

        <div className="flex-1">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900 dark:text-[#E8F0E0] leading-[1.08]">
              {currentQ.text}
            </h2>

            {currentQ.sub && (
              <p className="text-sm text-slate-500 dark:text-[#71836A] mt-2 leading-relaxed">
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
                        ? 'rgba(0,232,122,0.08)'
                        : 'rgba(255,255,255,0.035)',
                      borderColor: selected
                        ? 'rgba(0,232,122,0.38)'
                        : 'rgba(255,255,255,0.07)',
                      transform: selected
                        ? 'translateY(-1px)'
                        : 'none',
                    }}
                  >
                    <span className="text-2xl w-9 text-center">
                      {option.emoji}
                    </span>

                    <span className="font-semibold text-slate-800 dark:text-[#E8F0E0]">
                      {option.label}
                    </span>

                    {selected && (
                      <span className="ml-auto text-[#00E87A] font-bold">
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
                          ? 'rgba(0,232,122,0.08)'
                          : 'rgba(255,255,255,0.035)',
                        borderColor: selected
                          ? 'rgba(0,232,122,0.38)'
                          : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <span className="text-2xl">
                        {option.emoji}
                      </span>

                      <span className="font-semibold text-sm text-slate-800 dark:text-[#E8F0E0] leading-tight">
                        {option.label}
                      </span>

                      {selected && (
                        <span className="absolute top-3 right-3 text-[#00E87A] font-bold">
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
                    'linear-gradient(135deg, #7F5AF0, #00C466)',
                  boxShadow:
                    '0 8px 24px rgba(127,90,240,0.2)',
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
            className="mt-7 py-2 text-center text-sm text-slate-400 dark:text-[#5A7050] font-semibold"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}