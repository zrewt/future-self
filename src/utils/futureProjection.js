/**
 * Future Self Projection — trend-slope + dampening logic on real FSS
 * composite dimensions (nutrition, fitness, sleep, hydration, habits),
 * fed into the real, unmodified calcFutureSelfScore. No parallel scoring
 * formula is ever created.
 *
 * IMPORTANT: these five dimensions are NOT the same as the five displayed
 * pillar scores (nutrition_score, fitness_score, energy_score, focus_score,
 * longevity_score) — see the Phase 2 note in whatIfSimulator.js. "Sleep"
 * here means calcSleepScore, "Habits" means calcHabitsScore — different
 * formulas from the energy/focus pillars shown elsewhere in the app.
 *
 * "Today" in the output is always the user's REAL current FSS — the
 * regression is only ever used to compute a DELTA from trend data, which
 * is then added to the real score. This guarantees the projection card
 * never shows a "today" number that contradicts the Dashboard hero card.
 */

import {
    calcNutritionFromServings,
    calcFitnessFromWorkout,
    calcSleepScore,
    calcHydrationScore,
    calcHabitsScore,
    calcFutureSelfScore,
  } from './scoring'
  
  const MIN_DAYS_FOR_ANY_PROJECTION = 7
  const DAMPEN_TAU_DAYS = 180 // larger = slope effect decays more slowly
  
  const DIMENSION_WEIGHTS = {
    nutrition: 0.25,
    fitness: 0.25,
    sleep: 0.20,
    hydration: 0.15,
    habits: 0.15,
  }
  
  const DIMENSIONS = [
    {
      key: 'nutrition',
      label: 'Nutrition',
      calc: (log) => calcNutritionFromServings(log, []),
    },
    {
      key: 'fitness',
      label: 'Fitness',
      calc: (log) => calcFitnessFromWorkout(log),
    },
    {
      key: 'sleep',
      label: 'Sleep',
      calc: (log) => calcSleepScore(log),
    },
    {
      key: 'hydration',
      label: 'Hydration',
      calc: (log) => calcHydrationScore(log),
    },
    {
      key: 'habits',
      label: 'Habits',
      calc: (log) => calcHabitsScore(log),
    },
  ]
  
  const HORIZONS = [
    { label: '6 months', days: 182 },
    { label: '1 year', days: 365 },
    { label: '3 years', days: 1095 },
  ]
  
  function daysBetween(a, b) {
    return Math.round(
      (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
    )
  }
  
  function clamp(v) {
    return Math.min(100, Math.max(0, v))
  }
  
  // Ordinary least-squares slope/intercept over {x, y} points.
  function linearRegression(points) {
    const n = points.length
    if (n < 2) {
      return {
        slope: 0,
        intercept: points[0]?.y ?? 0,
      }
    }
  
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0
  
    points.forEach(({ x, y }) => {
      sumX += x
      sumY += y
      sumXY += x * y
      sumXX += x * x
    })
  
    const denom = n * sumXX - sumX * sumX
  
    if (denom === 0) {
      return {
        slope: 0,
        intercept: sumY / n,
      }
    }
  
    const slope = (n * sumXY - sumX * sumY) / denom
    const intercept = (sumY - slope * sumX) / n
  
    return {
      slope,
      intercept,
    }
  }
  
  function dampen(horizonDays) {
    return 1 / (1 + horizonDays / DAMPEN_TAU_DAYS)
  }
  
  /**
   * `logs` = projectionLogs from useUserStore (raw fields, up to 90 days).
   * `actualCurrentFSS` = the real score shown on Dashboard right now.
   * `currentStreak` = profile.current_streak.
   *
   * Returns:
   *   { status: 'insufficient_data' }
   *   { status: 'ok', tier, historyDays, currentFSS, points: [...], drivers: [...] }
   */
  export function projectFutureSelf(
    logs,
    actualCurrentFSS,
    currentStreak = 0
  ) {
    const scored = (logs || []).filter((l) => l.log_date)
  
    // One entry per day (should already be unique per user/day, but guard anyway)
    const byDate = new Map()
  
    scored.forEach((l) => {
      byDate.set(l.log_date, l)
    })
  
    const distinctLogs = [...byDate.values()].sort((a, b) =>
      a.log_date.localeCompare(b.log_date)
    )
  
    const historyDays = distinctLogs.length
  
    if (historyDays < MIN_DAYS_FOR_ANY_PROJECTION) {
      return {
        status: 'insufficient_data',
        historyDays,
      }
    }
  
    const firstDate = new Date(`${distinctLogs[0].log_date}T12:00:00`)
    const today = new Date()
    const xToday = daysBetween(firstDate, today)
  
    // Regression per dimension
    const regressions = {}
  
    DIMENSIONS.forEach((d) => {
      const points = distinctLogs.map((log) => ({
        x: daysBetween(
          firstDate,
          new Date(`${log.log_date}T12:00:00`)
        ),
        y: d.calc(log),
      }))
  
      regressions[d.key] = linearRegression(points)
    })
  
    const dimensionsToday = {}
  
    DIMENSIONS.forEach((d) => {
      const { slope, intercept } = regressions[d.key]
  
      dimensionsToday[d.key] = clamp(
        intercept + slope * xToday
      )
    })
  
    const streakToday = currentStreak
  
    const scoreRegToday = calcFutureSelfScore(
      dimensionsToday,
      streakToday
    )
  
    const points = [
      {
        label: 'Today',
        days: 0,
        score: actualCurrentFSS,
      },
    ]
  
    let lastHorizonDrivers = []
  
    HORIZONS.forEach((h) => {
      const dimensionsFuture = {}
  
      DIMENSIONS.forEach((d) => {
        const { slope } = regressions[d.key]
  
        const extra =
          slope *
          h.days *
          dampen(h.days)
  
        dimensionsFuture[d.key] = clamp(
          dimensionsToday[d.key] + extra
        )
      })
  
      const streakFuture = Math.min(
        100,
        currentStreak + h.days
      )
  
      const scoreRegFuture = calcFutureSelfScore(
        dimensionsFuture,
        streakFuture
      )
  
      const delta = scoreRegFuture - scoreRegToday
  
      const displayedScore = Math.min(
        97,
        Math.max(
          0,
          Math.round(actualCurrentFSS + delta)
        )
      )
  
      points.push({
        label: h.label,
        days: h.days,
        score: displayedScore,
      })
  
      // Use the longest horizon's per-dimension weighted deltas
      // as the "what's driving this" breakdown.
      //
      // The delta shown here represents the estimated contribution
      // to the actual FSS, rather than the raw 0–100 movement of
      // the underlying dimension.
      //
      // Example:
      // Habits +21 raw movement × 15% weight = +3 FSS points.
      if (h.days === HORIZONS[HORIZONS.length - 1].days) {
        lastHorizonDrivers = DIMENSIONS.map((d) => {
          const rawDelta =
            dimensionsFuture[d.key] -
            dimensionsToday[d.key]
  
          return {
            key: d.key,
            label: d.label,
  
            // Weighted point contribution to the actual FSS.
            // This prevents confusing values such as "+21 from habits"
            // when habits only contributes 15% of the overall score.
            delta: Math.round(
              rawDelta * DIMENSION_WEIGHTS[d.key]
            ),
          }
        }).sort(
          (a, b) =>
            Math.abs(b.delta) - Math.abs(a.delta)
        )
      }
    })
  
    let tier
  
    if (historyDays < 30) {
      tier = 'early'
    } else if (historyDays < 90) {
      tier = 'growing'
    } else {
      tier = 'long-term'
    }
  
    return {
      status: 'ok',
      tier,
      historyDays,
      currentFSS: actualCurrentFSS,
      points,
      drivers: lastHorizonDrivers.slice(0, 3),
    }
  }