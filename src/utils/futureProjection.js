/**
 * Future Self Projection
 *
 * Qyven's projection is designed to answer:
 *
 * "If I keep showing up and improving my habits, where could I be?"
 *
 * REWRITTEN this session. The old model applied four multiplicative
 * dampeners (room-to-grow, pillar foundation, consistency, history
 * length) to a single "growth" number — early users got crushed even
 * with genuinely strong pillars, producing demotivating flat-lined
 * projections (e.g. 66 → 71 over 3 years for someone with 80s-90s
 * pillar scores).
 *
 * Key insight: currentFSS is now a SMOOTHED EMA (see calcCurrentSmoothedFSS
 * in trends.js) that deliberately lags behind real recent performance.
 * That means the gap between currentFSS and actual pillar strength isn't
 * speculative future improvement — it's ALREADY-EARNED performance the
 * smoothing hasn't caught up to yet. The projection now splits growth
 * into two honestly different kinds:
 *
 *   1. CATCH-UP  — EMA closing the gap to current real pillar strength.
 *      Near-certain if habits hold, resolves fast, barely dampened.
 *   2. IMPROVEMENT — growth beyond current pillar strength, genuinely
 *      speculative, resolves slowly, scaled by history + consistency.
 *
 * Principles (unchanged):
 * - Current FSS is the starting point.
 * - Short histories are conservative — but only for the IMPROVEMENT
 *   portion, not the catch-up portion.
 * - Projections always move upward unless the user is already near 97.
 */

import {
  calcNutritionFromServings,
  calcFitnessFromWorkout,
  calcSleepScore,
  calcHydrationScore,
  calcHabitsScore,
} from './scoring'

const MIN_DAYS_FOR_ANY_PROJECTION = 7

const DIMENSIONS = [
  { key: 'nutrition', label: 'Nutrition', weight: 0.25, calc: (log) => calcNutritionFromServings(log, []) },
  { key: 'fitness',   label: 'Fitness',   weight: 0.25, calc: (log) => calcFitnessFromWorkout(log) },
  { key: 'sleep',     label: 'Sleep',     weight: 0.20, calc: (log) => calcSleepScore(log) },
  { key: 'hydration', label: 'Hydration', weight: 0.15, calc: (log) => calcHydrationScore(log) },
  { key: 'habits',    label: 'Habits',    weight: 0.15, calc: (log) => calcHabitsScore(log) },
]

const HORIZONS = [
  { label: '6 months', months: 6, days: 182 },
  { label: '1 year', months: 12, days: 365 },
  { label: '3 years', months: 36, days: 1095 },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function getRecencyWeight(ageDays) {
  if (ageDays <= 7) return 1
  if (ageDays <= 14) return 0.9
  if (ageDays <= 30) return 0.8
  if (ageDays <= 60) return 0.6
  return 0.35
}

function weightedAverage(values) {
  if (!values.length) return 0
  let total = 0
  let totalWeight = 0
  values.forEach(({ value, weight }) => {
    total += value * weight
    totalWeight += weight
  })
  return totalWeight ? total / totalWeight : 0
}

function calculateConsistency(logs) {
  if (logs.length < 3) return 0.55

  const scores = logs.slice(-14).map((log) => clamp(safeNumber(log.future_self_score), 0, 100))
  if (scores.length < 3) return 0.55

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length
  const deviation = Math.sqrt(variance)

  return clamp(1 - deviation / 20, 0, 1)
}

function calculatePillars(logs, latestDate) {
  return DIMENSIONS.map((dimension) => {
    const values = []

    logs.forEach((log) => {
      try {
        const score = safeNumber(dimension.calc(log), NaN)
        if (!Number.isFinite(score)) return

        const logDate = new Date(`${log.log_date}T12:00:00`)
        const age = daysBetween(logDate, latestDate)
        if (age > 45) return

        values.push({ value: clamp(score, 0, 100), weight: getRecencyWeight(age) })
      } catch {
        // Ignore malformed logs.
      }
    })

    const score = values.length ? weightedAverage(values) : 60

    return { ...dimension, score: Math.round(score) }
  })
}

/**
 * Weighted average across all pillars — represents what the user's
 * REAL recent habits already justify, independent of EMA smoothing lag.
 */
function calculatePillarWeightedAvg(pillars) {
  if (!pillars.length) return 0
  return pillars.reduce((sum, p) => sum + p.score * p.weight, 0)
}

/**
 * The gap between smoothed currentFSS and real pillar strength.
 * This is near-certain to resolve (the EMA catching up) if habits hold —
 * capped so a single anomalous pillar reading can't blow this up.
 */
function calcCatchUpGap(currentFSS, pillarWeightedAvg) {
  return clamp(pillarWeightedAvg - currentFSS, 0, 25)
}

/**
 * Room for genuine improvement BEYOND current pillar strength.
 * This is real speculation and stays conservative.
 */
function calcImprovementCeiling(currentFSS, pillarWeightedAvg) {
  const base = Math.max(pillarWeightedAvg, currentFSS)
  return clamp(97 - base, 3, 25)
}

/**
 * Confidence scales ONLY the improvement portion — history length and
 * consistency are genuinely relevant to "how much better could this get,"
 * but not to "will the EMA catch up to what's already true."
 */
function calculateConfidence(historyDays, consistency) {
  let base = 0.55
  if (historyDays >= 14) base = 0.68
  if (historyDays >= 30) base = 0.8
  if (historyDays >= 90) base = 0.92

  return clamp(base * (0.85 + consistency * 0.3), 0.4, 1)
}

/**
 * Calculate a projection at a given horizon, splitting catch-up (fast,
 * near-certain) from improvement (slow, confidence-scaled).
 */
/**
 * Calculate a projection at a given horizon, splitting catch-up (fast,
 * near-certain) from improvement (slow, confidence-scaled).
 *
 * TUNED this session: improvement time constant shortened 15 → 11 months
 * so the 3-year horizon credits near-full (~96%, up from ~91%) realization
 * of the improvement ceiling — legitimate for a 3-year window, not an
 * arbitrary bump. Interim caps loosened proportionally (0.35→0.45 at 6mo,
 * 0.55→0.68 at 1yr) so growth between horizons reads as a smooth climb
 * rather than flat-then-jump. Still fully derived from real pillar data,
 * still capped at 97, still monotonically non-decreasing.
 */
function calculateProjection({ currentFSS, catchUpGap, improvementCeiling, confidence, months }) {
  const catchUpProgress = 1 - Math.exp(-months / 3)     // resolves within ~6-9 months
  const improvementProgress = 1 - Math.exp(-months / 11) // was /15 — now ~96% resolved by 3yr

  const catchUpGain = catchUpGap * catchUpProgress
  const improvementGain = improvementCeiling * improvementProgress * confidence

  let gain = catchUpGain + improvementGain

  if (months <= 6) {
    gain = Math.min(gain, catchUpGap * 0.85 + improvementCeiling * 0.45 * confidence)
  }
  if (months <= 12) {
    gain = Math.min(gain, catchUpGap + improvementCeiling * 0.68 * confidence)
  }

  return clamp(Math.round(currentFSS + gain), currentFSS, 97)
}

/**
 * "What's shaping this" drivers — unchanged logic, still signals rather
 * than mathematical deductions from the projection.
 */
function calculateDrivers(pillars, currentFSS) {
  if (!pillars.length) return []

  const sorted = [...pillars].sort((a, b) => a.score - b.score)
  const weakest = sorted[0]
  const strongest = sorted[sorted.length - 1]
  const drivers = []

  if (weakest && weakest.score < currentFSS - 3) {
    drivers.push({
      key: weakest.key,
      label: weakest.label,
      delta: Math.max(2, Math.round((currentFSS - weakest.score) / 3)),
      type: 'opportunity',
    })
  }

  if (strongest && strongest.key !== weakest?.key && strongest.score >= 75) {
    drivers.push({
      key: strongest.key,
      label: strongest.label,
      delta: Math.max(2, Math.round((strongest.score - 70) / 4)),
      type: 'strength',
    })
  }

  const secondStrongest = [...pillars]
    .sort((a, b) => b.score - a.score)
    .find((pillar) => pillar.key !== strongest?.key && pillar.score >= 70)

  if (secondStrongest && drivers.length < 3) {
    drivers.push({
      key: secondStrongest.key,
      label: secondStrongest.label,
      delta: Math.max(1, Math.round((secondStrongest.score - 65) / 5)),
      type: 'strength',
    })
  }

  return drivers.slice(0, 3).map(({ key, label, delta }) => ({ key, label, delta }))
}

/**
 * Main projection function.
 */
export function projectFutureSelf(logs, actualCurrentFSS, currentStreak = 0) {
  const scored = (logs || []).filter(
    (log) =>
      log?.log_date &&
      log.future_self_score != null &&
      Number.isFinite(Number(log.future_self_score))
  )

  const byDate = new Map()
  scored.forEach((log) => byDate.set(log.log_date, log))

  const distinctLogs = [...byDate.values()].sort((a, b) => a.log_date.localeCompare(b.log_date))
  const historyDays = distinctLogs.length

  if (historyDays < MIN_DAYS_FOR_ANY_PROJECTION) {
    return { status: 'insufficient_data', historyDays }
  }

  const latestDate = new Date(`${distinctLogs[distinctLogs.length - 1].log_date}T12:00:00`)
  const currentFSS = clamp(safeNumber(actualCurrentFSS), 0, 100)

  const consistency = calculateConsistency(distinctLogs)
  const pillars = calculatePillars(distinctLogs, latestDate)
  const pillarWeightedAvg = calculatePillarWeightedAvg(pillars)

  const catchUpGap = calcCatchUpGap(currentFSS, pillarWeightedAvg)
  const improvementCeiling = calcImprovementCeiling(currentFSS, pillarWeightedAvg)
  const confidence = calculateConfidence(historyDays, consistency)

  const points = [{ label: 'Today', days: 0, score: Math.round(currentFSS) }]

  HORIZONS.forEach((horizon) => {
    const score = calculateProjection({
      currentFSS,
      catchUpGap,
      improvementCeiling,
      confidence,
      months: horizon.months,
    })
    points.push({ label: horizon.label, days: horizon.days, score })
  })

  // Absolute guarantee: future projections never go backwards.
  for (let i = 1; i < points.length; i++) {
    points[i].score = Math.max(points[i].score, points[i - 1].score)
  }

  const drivers = calculateDrivers(pillars, currentFSS)

  let tier = 'early'
  if (historyDays >= 90) tier = 'long-term'
  else if (historyDays >= 30) tier = 'growing'

  const weakestPillar = [...pillars].sort((a, b) => a.score - b.score)[0]
  const strongestPillar = [...pillars].sort((a, b) => b.score - a.score)[0]

  return {
    status: 'ok',
    tier,
    historyDays,
    currentFSS,
    currentStreak,
    points,
    drivers,
    insights: {
      consistency: Number(consistency.toFixed(2)),
      confidence: Number(confidence.toFixed(2)),
      catchUpGap: Math.round(catchUpGap),
      improvementCeiling: Math.round(improvementCeiling),
      pillarWeightedAvg: Math.round(pillarWeightedAvg),
      strongestPillar: strongestPillar?.key || null,
      weakestPillar: weakestPillar?.key || null,
      pillars: pillars.map((pillar) => ({ key: pillar.key, label: pillar.label, score: pillar.score })),
    },
  }
}