/**
 * Future Self Projection — trend-slope + dampening on the real, already-
 * stored future_self_score history. No parallel scoring formula is
 * created; this only extrapolates data that calcFutureSelfScore already
 * produced.
 *
 * FIXED BUG: the previous version regressed 5 raw dimensions independently
 * and dampened each one's slope PER HORIZON, then recombined into FSS at
 * each checkpoint separately. Since dimensions can have different-sign
 * slopes, the recombined mix could shift between horizons — causing the
 * non-monotonic "67 → 83 → 82 → 81" pattern. This version regresses the
 * SINGLE stored future_self_score directly and applies one closed-form,
 * monotonically-dampened cumulative extrapolation — mathematically
 * guaranteed not to reverse direction, since it's a single variable with a
 * fixed-sign slope.
 *
 * The 5-dimension regression is still computed, but only as a SECONDARY
 * "what's driving this" explanation — never the source of the displayed
 * trajectory numbers.
 */

import {
  calcNutritionFromServings,
  calcFitnessFromWorkout,
  calcSleepScore,
  calcHydrationScore,
  calcHabitsScore,
} from './scoring'

const MIN_DAYS_FOR_ANY_PROJECTION = 7
const DAMPEN_TAU_DAYS = 180 // larger = slope's effect decays more slowly

const DIMENSIONS = [
  { key: 'nutrition', label: 'Nutrition', weight: 0.25, calc: (log) => calcNutritionFromServings(log, []) },
  { key: 'fitness',   label: 'Fitness',   weight: 0.25, calc: (log) => calcFitnessFromWorkout(log) },
  { key: 'sleep',     label: 'Sleep',     weight: 0.20, calc: (log) => calcSleepScore(log) },
  { key: 'hydration', label: 'Hydration', weight: 0.15, calc: (log) => calcHydrationScore(log) },
  { key: 'habits',    label: 'Habits',    weight: 0.15, calc: (log) => calcHabitsScore(log) },
]

const HORIZONS = [
  { label: '6 months', days: 182 },
  { label: '1 year',   days: 365 },
  { label: '3 years',  days: 1095 },
]

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

// Ordinary least-squares slope/intercept over {x, y} points.
function linearRegression(points) {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  points.forEach(({ x, y }) => {
    sumX += x; sumY += y; sumXY += x * y; sumXX += x * x
  })

  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return { slope: 0, intercept: sumY / n }

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

// Closed-form integral of the instantaneous dampening curve
// 1/(1 + t/tau) from 0 to horizonDays, scaled by slope. Monotonic in
// horizonDays for any fixed-sign slope — this is what guarantees the
// projection can't reverse direction across horizons.
function dampenedCumulativeDelta(slope, horizonDays, tau) {
  if (horizonDays <= 0) return 0
  return slope * tau * Math.log((tau + horizonDays) / tau)
}

/**
 * `logs` = projectionLogs from useUserStore (raw fields + future_self_score,
 * up to 90 days). `actualCurrentFSS` = the real score shown on Dashboard
 * right now. `currentStreak` = profile.current_streak (unused in this
 * version's math directly, kept in the signature for API stability).
 *
 * Returns:
 *   { status: 'insufficient_data', historyDays }
 *   { status: 'ok', tier, historyDays, currentFSS, points: [...], drivers: [...] }
 */
export function projectFutureSelf(logs, actualCurrentFSS, currentStreak = 0) {
  const scored = (logs || []).filter((l) => l.log_date && l.future_self_score != null)
  const byDate = new Map()
  scored.forEach((l) => byDate.set(l.log_date, l))
  const distinctLogs = [...byDate.values()].sort((a, b) => a.log_date.localeCompare(b.log_date))

  const historyDays = distinctLogs.length
  if (historyDays < MIN_DAYS_FOR_ANY_PROJECTION) {
    return { status: 'insufficient_data', historyDays }
  }

  const firstDate = new Date(`${distinctLogs[0].log_date}T12:00:00`)

  // Primary trajectory: regress the REAL stored score directly.
  const scorePoints = distinctLogs.map((log) => ({
    x: daysBetween(firstDate, new Date(`${log.log_date}T12:00:00`)),
    y: log.future_self_score,
  }))
  const { slope: scoreSlope } = linearRegression(scorePoints)

  const points = [{ label: 'Today', days: 0, score: actualCurrentFSS }]
  HORIZONS.forEach((h) => {
    const delta = dampenedCumulativeDelta(scoreSlope, h.days, DAMPEN_TAU_DAYS)
    const displayedScore = Math.min(97, Math.max(0, Math.round(actualCurrentFSS + delta)))
    points.push({ label: h.label, days: h.days, score: displayedScore })
  })

  // Secondary explanation only: per-dimension regressions, same dampened
  // extrapolation, at the longest horizon — used purely for "what's
  // driving this," never for the numbers above.
  const longestHorizon = HORIZONS[HORIZONS.length - 1].days
  const drivers = DIMENSIONS.map((d) => {
    const dPoints = distinctLogs.map((log) => ({
      x: daysBetween(firstDate, new Date(`${log.log_date}T12:00:00`)),
      y: d.calc(log),
    }))
    const { slope: dSlope } = linearRegression(dPoints)
    const rawDelta = dampenedCumulativeDelta(dSlope, longestHorizon, DAMPEN_TAU_DAYS)
    return {
      key: d.key,
      label: d.label,
      // Weighted point contribution to actual FSS, not raw 0-100 movement.
      delta: Math.round(rawDelta * d.weight),
    }
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3)

  let tier
  if (historyDays < 30) tier = 'early'
  else if (historyDays < 90) tier = 'growing'
  else tier = 'long-term'

  return {
    status: 'ok',
    tier,
    historyDays,
    currentFSS: actualCurrentFSS,
    points,
    drivers,
  }
}