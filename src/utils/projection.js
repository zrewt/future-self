function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

// ── FUTURE PROJECTION (used by FutureProjectionCard) ──────────────────────────
export function computeFutureProjection(logs, currentScore = 0) {
  const current = Math.round(currentScore || 0)

  if (!logs?.length) {
    return { current, month6: current, year1: current, momentum: 0, drivers: [] }
  }

  const last30 = logs.slice(0, 30)
  const last7  = last30.slice(0, 7)
  const prev7  = last30.slice(7, 14)

  const sleepConsistency = last30.filter((l) => Number(l.sleep_hours) >= 7).length / last30.length
  const workoutFrequency = last30.filter((l) =>
    (l.workout_duration_min || 0) >= 20 || (l.exercise_type && l.exercise_type !== 'rest')
  ).length / last30.length
  const nutritionAvg = avg(last30.map((l) => l.nutrition_score || 0)) / 100
  const focusAvg     = avg(last30.map((l) => l.focus_score || 0)) / 100
  const waterAvg     = avg(last30.map((l) => Math.min((l.water_ml || 0) / 2500, 1)))

  const fss7        = avg(last7.map((l) => l.future_self_score || 0))
  const fssPrev7    = prev7.length ? avg(prev7.map((l) => l.future_self_score || 0)) : fss7
  const rawMomentum = (fss7 - fssPrev7) / 7
  const momentum    = Math.max(-0.05, Math.min(0.05, rawMomentum))

  // Habit ceiling — what score your habits are capable of sustaining
  const habitCeiling = Math.min(92, Math.round(
    sleepConsistency * 22 +
    workoutFrequency * 20 +
    nutritionAvg     * 20 +
    focusAvg         * 18 +
    waterAvg         * 10 +
    30
  ))

  function project(daysAhead) {
    const gap = habitCeiling - current
    if (gap <= 0) {
      const decline = habitCeiling >= current ? 0 : Math.round((current - habitCeiling) * 0.15)
      return Math.max(current - decline, habitCeiling)
    }
    const ratePerMonth   = 0.08
    const months         = daysAhead / 30
    const improvement    = Math.round(gap * (1 - Math.pow(1 - ratePerMonth, months)))
    const momentumContrib = Math.round(momentum * daysAhead * 0.3)
    return Math.min(habitCeiling, Math.max(current - 2, current + improvement + momentumContrib))
  }

  const drivers = [
    { label: 'Sleep consistency', value: Math.round(sleepConsistency * 100), trend: sleepConsistency >= 0.6 ? 'up' : 'flat' },
    { label: 'Workout frequency', value: Math.round(workoutFrequency * 100), trend: workoutFrequency >= 0.4 ? 'up' : 'flat' },
    { label: 'Nutrition avg',     value: Math.round(nutritionAvg * 100),     trend: nutritionAvg >= 0.55 ? 'up' : 'flat' },
    { label: 'Focus avg',         value: Math.round(focusAvg * 100),         trend: focusAvg >= 0.5 ? 'up' : 'flat' },
    { label: 'Hydration',         value: Math.round(waterAvg * 100),         trend: waterAvg >= 0.7 ? 'up' : 'flat' },
  ]

  return {
    current,
    month6: project(180),
    year1:  project(365),
    momentum: Math.round(rawMomentum * 10) / 10,
    drivers,
    habitCeiling,
  }
}

// ── FUTURE SELF COACH (used by FutureSelfCoach component) ─────────────────────
export function computeFutureSelfCoach(logs, { todayLog, currentFSS, streakDays } = {}) {
  const hasEnoughData = logs?.length >= 3

  if (!hasEnoughData) {
    return {
      hasEnoughData: false,
      currentFSS: currentFSS || 0,
      pace: [],
      bottleneck: null,
    }
  }

  const last30 = logs.slice(0, 30)
  const last7  = last30.slice(0, 7)
  const prev7  = last30.slice(7, 14)

  // ── Per-pillar trends ────────────────────────────────────────────────────
  const pillars = [
    { key: 'fitness_score',   label: 'Fitness',   weight: 0.25, shortFix: 'fitness' },
    { key: 'nutrition_score', label: 'Nutrition', weight: 0.20, shortFix: 'nutrition' },
    { key: 'energy_score',    label: 'Energy',    weight: 0.20, shortFix: 'sleep & energy' },
    { key: 'focus_score',     label: 'Focus',     weight: 0.15, shortFix: 'focus habits' },
    { key: 'longevity_score', label: 'Longevity', weight: 0.15, shortFix: 'longevity' },
  ]

  // ── Pace projections ─────────────────────────────────────────────────────
  // For each pillar, calculate 30/60/90 day realistic delta
  // based on recent trend, capped at realistic improvement rates
  const pace = pillars
    .map((p) => {
      const recent  = avg(last7.map((l) => l[p.key] || 0))
      const prev    = prev7.length ? avg(prev7.map((l) => l[p.key] || 0)) : recent
      const trend   = recent - prev // positive = improving

      // Realistic improvement: trend * time * dampening
      // Max gain per pillar capped at 15pts in 30 days, 25 in 60, 35 in 90
      const delta30 = Math.min(15,  Math.max(0, Math.round(trend * 2.5)))
      const delta60 = Math.min(25,  Math.max(0, Math.round(trend * 4.5)))
      const delta90 = Math.min(35,  Math.max(0, Math.round(trend * 6.0)))

      // Pick the most meaningful timeframe (first non-zero)
      if (delta30 > 0) return { label: p.label, delta: delta30, days: 30 }
      if (delta60 > 0) return { label: p.label, delta: delta60, days: 60 }
      if (delta90 > 0) return { label: p.label, delta: delta90, days: 90 }
      return { label: p.label, delta: 0, days: 30 }
    })
    .filter((p) => p.delta > 0) // only show pillars with positive trend
    .slice(0, 3)

  // ── Bottleneck detection ──────────────────────────────────────────────────
  // Find the pillar with the lowest avg score that has room to improve
  const pillarAvgs = pillars.map((p) => ({
    ...p,
    avg: Math.round(avg(last30.map((l) => l[p.key] || 0))),
  }))

  // Weakest pillar = lowest avg, only if meaningfully below 70
  const weakest = pillarAvgs
    .filter((p) => p.avg < 70)
    .sort((a, b) => a.avg - b.avg)[0]

  let bottleneck = null
  if (weakest) {
    // How much would FSS improve if this pillar went to 75?
    const improvement   = 75 - weakest.avg
    const fssDelta      = Math.round(improvement * weakest.weight)
    const projectedFSS  = Math.min(99, currentFSS + fssDelta)

    if (fssDelta >= 2) {
      bottleneck = {
        label:        `${weakest.label} habits`,
        shortFix:     weakest.shortFix,
        currentFSS,
        projectedFSS,
      }
    }
  }

  return {
    hasEnoughData: true,
    currentFSS: currentFSS || 0,
    pace,
    bottleneck,
  }
}