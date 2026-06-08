/** Future projection & rule-based coach — habit trends, no AI */

import { buildAllScores } from './scoring'
import { parseLogDetails } from './logDetails'

function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function fssForLog(log, streakDays = 0) {
  const foods = parseLogDetails(log?.log_details).foods || []
  return buildAllScores(log, streakDays, foods).future_self_score
}

function baselineLog(logs, todayLog) {
  if (todayLog && Object.keys(todayLog).length) return { ...todayLog }
  if (logs?.length) return { ...logs[0] }
  return {}
}

/** Project a single pillar forward from recent weekly momentum */
function projectPillarGain(logs, scoreKey, days) {
  const last14 = (logs || []).slice(0, 14)
  const current = avg(last14.map((l) => l[scoreKey] || 0))

  if (last14.length < 2) {
    if (current >= 78) return 0
    return Math.max(1, Math.round((78 - current) * (days / 150)))
  }

  const last7 = last14.slice(0, 7)
  const prev7 = last14.slice(7, 14)
  const cur = avg(last7.map((l) => l[scoreKey] || 0))
  const prev = prev7.length ? avg(prev7.map((l) => l[scoreKey] || 0)) : cur
  const weeklyChange = cur - prev
  let gain = weeklyChange * (days / 7) * 0.8

  // Flat or negative trend — modest upside if there's room to grow
  if (gain < 2 && cur < 72) {
    gain = (72 - cur) * (days / 120)
  }

  return Math.max(0, Math.min(Math.round(gain), Math.round(100 - current)))
}

const BOTTLENECK_SCENARIOS = [
  {
    id: 'sleep',
    label: 'Sleep consistency',
    shortFix: 'sleep',
    isWeak(logs) {
      const n = logs.length || 1
      const hitRate = logs.filter((l) => Number(l.sleep_hours) >= 7).length / n
      const avgSleep = avg(logs.map((l) => Number(l.sleep_hours) || 0))
      return hitRate < 0.65 || avgSleep < 7
    },
    apply(log) {
      return {
        ...log,
        sleep_hours: Math.max(7.5, Number(log.sleep_hours) || 7.5),
        sleep_quality: Math.min(10, (log.sleep_quality || 5) + 2),
      }
    },
  },
  {
    id: 'workout',
    label: 'Workout consistency',
    shortFix: 'workouts',
    isWeak(logs) {
      const n = logs.length || 1
      const rate = logs.filter((l) => (l.workout_duration_min || 0) >= 20).length / n
      return rate < 0.45
    },
    apply(log) {
      return {
        ...log,
        exercise_type: !log.exercise_type || log.exercise_type === 'rest' ? 'gym' : log.exercise_type,
        workout_duration_min: Math.max(30, log.workout_duration_min || 0),
      }
    },
  },
  {
    id: 'nutrition',
    label: 'Nutrition quality',
    shortFix: 'nutrition',
    isWeak(logs) {
      return avg(logs.map((l) => l.nutrition_score || 0)) < 65
    },
    apply(log) {
      return {
        ...log,
        fruit_servings: Math.max(2, log.fruit_servings || 0),
        vegetable_servings: Math.max(4, log.vegetable_servings || 0),
        protein_servings: Math.max(2, log.protein_servings || 0),
        processed_servings: Math.min(1, log.processed_servings || 0),
        water_ml: Math.max(2500, log.water_ml || 0),
      }
    },
  },
  {
    id: 'focus',
    label: 'Deep work consistency',
    shortFix: 'focus habits',
    isWeak(logs) {
      return avg(logs.map((l) => l.focus_score || 0)) < 60
    },
    apply(log) {
      return {
        ...log,
        focus_minutes: Math.max(60, log.focus_minutes || 0),
        reading_minutes: Math.max(20, log.reading_minutes || 0),
        meditation_minutes: Math.max(10, log.meditation_minutes || 0),
      }
    },
  },
  {
    id: 'hydration',
    label: 'Hydration',
    shortFix: 'hydration',
    isWeak(logs) {
      return avg(logs.map((l) => Math.min((l.water_ml || 0) / 2500, 1))) < 0.7
    },
    apply(log) {
      return { ...log, water_ml: Math.max(2500, log.water_ml || 0) }
    },
  },
]

function findBottleneck(logs, todayLog, currentFSS, streakDays) {
  const base = baselineLog(logs, todayLog)
  const current = currentFSS || fssForLog(base, streakDays)

  let best = null

  for (const scenario of BOTTLENECK_SCENARIOS) {
    if (!scenario.isWeak(logs)) continue

    const improved = scenario.apply(base)
    const projected = fssForLog(improved, streakDays)
    const delta = projected - current

    if (delta < 2) continue
    if (!best || delta > best.delta) {
      best = {
        label: scenario.label,
        shortFix: scenario.shortFix,
        currentFSS: current,
        projectedFSS: projected,
        delta,
      }
    }
  }

  // All habits solid — point at lowest pillar avg for growth
  if (!best && logs.length) {
    const pillars = [
      { label: 'Fitness consistency', key: 'fitness_score', shortFix: 'fitness' },
      { label: 'Nutrition quality', key: 'nutrition_score', shortFix: 'nutrition' },
      { label: 'Sleep & energy', key: 'energy_score', shortFix: 'sleep' },
      { label: 'Focus habits', key: 'focus_score', shortFix: 'focus' },
      { label: 'Longevity habits', key: 'longevity_score', shortFix: 'longevity' },
    ]
    const weakest = pillars
      .map((p) => ({ ...p, avg: avg(logs.map((l) => l[p.key] || 0)) }))
      .sort((a, b) => a.avg - b.avg)[0]

    if (weakest && weakest.avg < 80) {
      const gap = Math.min(12, Math.round((80 - weakest.avg) * 0.35))
      best = {
        label: weakest.label,
        shortFix: weakest.shortFix,
        currentFSS: current,
        projectedFSS: Math.min(99, current + Math.max(3, gap)),
        delta: Math.max(3, gap),
      }
    }
  }

  return best
}

/** Rule-based coach: pace projections + top bottleneck */
export function computeFutureSelfCoach(logs, { todayLog = null, currentFSS = 0, streakDays = 0 } = {}) {
  const current = Math.round(currentFSS || fssForLog(baselineLog(logs, todayLog), streakDays))
  const hasEnoughData = (logs?.length || 0) >= 3

  const pace = [
    { label: 'Energy', key: 'energy_score', days: 30 },
    { label: 'Focus', key: 'focus_score', days: 60 },
    { label: 'Fitness', key: 'fitness_score', days: 90 },
  ].map((p) => ({
    ...p,
    delta: hasEnoughData ? projectPillarGain(logs, p.key, p.days) : 0,
  }))

  const bottleneck = hasEnoughData
    ? findBottleneck(logs, todayLog, current, streakDays)
    : null

  return {
    currentFSS: current,
    hasEnoughData,
    pace,
    bottleneck,
  }
}
export function computeFutureProjection(logs, currentScore = 0) {
  const current = currentScore || 0

  if (!logs?.length) {
    return {
      current,
      month6: current,
      year1: current,
      momentum: 0,
      drivers: [],
    }
  }

  const last30 = logs.slice(0, 30)
  const last7 = last30.slice(0, 7)
  const prev7 = last30.slice(7, 14)

  const sleepConsistency =
    last30.filter((l) => Number(l.sleep_hours) >= 7).length / last30.length
  const workoutFrequency =
    last30.filter(
      (l) =>
        (l.workout_duration_min || 0) >= 20 ||
        (l.exercise_type && l.exercise_type !== 'rest')
    ).length / last30.length
  const nutritionAvg = avg(last30.map((l) => l.nutrition_score || 0)) / 100
  const focusAvg = avg(last30.map((l) => l.focus_score || 0)) / 100
  const waterAvg = avg(last30.map((l) => Math.min((l.water_ml || 0) / 2500, 1)))

  const habitStrength =
    sleepConsistency * 0.25 +
    workoutFrequency * 0.25 +
    nutritionAvg * 0.2 +
    focusAvg * 0.15 +
    waterAvg * 0.15

  const fss7 = avg(last7.map((l) => l.future_self_score || 0))
  const fssPrev7 = prev7.length ? avg(prev7.map((l) => l.future_self_score || 0)) : fss7
  const momentum = (fss7 - fssPrev7) / 7

  const lift6 = habitStrength * 10 + momentum * 120
  const lift12 = habitStrength * 18 + momentum * 200

  const month6 = Math.round(Math.min(99, Math.max(current - 3, current + lift6)))
  const year1 = Math.round(Math.min(99, Math.max(current - 5, current + lift12)))

  const drivers = [
    { label: 'Sleep consistency', value: Math.round(sleepConsistency * 100), trend: sleepConsistency >= 0.6 ? 'up' : 'flat' },
    { label: 'Workout frequency', value: Math.round(workoutFrequency * 100), trend: workoutFrequency >= 0.4 ? 'up' : 'flat' },
    { label: 'Nutrition avg', value: Math.round(nutritionAvg * 100), trend: nutritionAvg >= 0.55 ? 'up' : 'flat' },
    { label: 'Focus avg', value: Math.round(focusAvg * 100), trend: focusAvg >= 0.5 ? 'up' : 'flat' },
    { label: 'Hydration', value: Math.round(waterAvg * 100), trend: waterAvg >= 0.7 ? 'up' : 'flat' },
  ]

  return {
    current: Math.round(current),
    month6,
    year1,
    momentum: Math.round(momentum * 10) / 10,
    drivers,
  }
}
