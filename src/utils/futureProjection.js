/**
 * Future Self Projection
 *
 * Qyven's projection is designed to answer:
 *
 * "If I keep showing up and improving my habits, where could I be?"
 *
 * This is intentionally motivational rather than a literal statistical
 * forecast. Short-term fluctuations should NOT make someone's 3-year
 * Future Self collapse.
 *
 * Principles:
 * - Current FSS is the starting point.
 * - Recent consistency increases projected growth.
 * - Strong pillars increase projected growth.
 * - Weak pillars create opportunity for improvement.
 * - Short histories are conservative.
 * - Long-term projections have diminishing returns.
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
  {
    key: 'nutrition',
    label: 'Nutrition',
    weight: 0.25,
    calc: (log) => calcNutritionFromServings(log, []),
  },
  {
    key: 'fitness',
    label: 'Fitness',
    weight: 0.25,
    calc: (log) => calcFitnessFromWorkout(log),
  },
  {
    key: 'sleep',
    label: 'Sleep',
    weight: 0.20,
    calc: (log) => calcSleepScore(log),
  },
  {
    key: 'hydration',
    label: 'Hydration',
    weight: 0.15,
    calc: (log) => calcHydrationScore(log),
  },
  {
    key: 'habits',
    label: 'Habits',
    weight: 0.15,
    calc: (log) => calcHabitsScore(log),
  },
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
  return Math.round(
    (b.getTime() - a.getTime()) /
      (1000 * 60 * 60 * 24)
  )
}

/**
 * Give more importance to recent logs.
 */
function getRecencyWeight(ageDays) {
  if (ageDays <= 7) return 1
  if (ageDays <= 14) return 0.9
  if (ageDays <= 30) return 0.8
  if (ageDays <= 60) return 0.6
  return 0.35
}

/**
 * Weighted average.
 */
function weightedAverage(values) {
  if (!values.length) return 0

  let total = 0
  let totalWeight = 0

  values.forEach(({ value, weight }) => {
    total += value * weight
    totalWeight += weight
  })

  return totalWeight
    ? total / totalWeight
    : 0
}

/**
 * Calculate recent consistency.
 *
 * A user who repeatedly logs good days should get rewarded
 * more than someone who has one excellent day surrounded by
 * inconsistent behavior.
 */
function calculateConsistency(logs) {
  if (logs.length < 3) {
    return 0.55
  }

  const scores = logs
    .slice(-14)
    .map((log) =>
      clamp(
        safeNumber(log.future_self_score),
        0,
        100
      )
    )

  if (scores.length < 3) {
    return 0.55
  }

  const average =
    scores.reduce(
      (sum, score) => sum + score,
      0
    ) / scores.length

  const variance =
    scores.reduce(
      (sum, score) =>
        sum + Math.pow(score - average, 2),
      0
    ) / scores.length

  const deviation = Math.sqrt(variance)

  /**
   * Lower volatility = stronger consistency.
   */
  return clamp(
    1 - deviation / 20,
    0,
    1
  )
}

/**
 * Calculate each pillar's recent score.
 */
function calculatePillars(
  logs,
  latestDate
) {
  return DIMENSIONS.map((dimension) => {
    const values = []

    logs.forEach((log) => {
      try {
        const score = safeNumber(
          dimension.calc(log),
          NaN
        )

        if (!Number.isFinite(score)) {
          return
        }

        const logDate = new Date(
          `${log.log_date}T12:00:00`
        )

        const age = daysBetween(
          logDate,
          latestDate
        )

        if (age > 45) {
          return
        }

        values.push({
          value: clamp(score, 0, 100),
          weight: getRecencyWeight(age),
        })
      } catch {
        // Ignore malformed logs.
      }
    })

    const score = values.length
      ? weightedAverage(values)
      : 60

    return {
      ...dimension,
      score: Math.round(score),
    }
  })
}

/**
 * Calculate the user's "growth potential".
 *
 * This is the key motivational component.
 *
 * Users with a low FSS have more room to grow.
 * Users with strong pillars have a stronger foundation.
 * Consistency increases confidence.
 */
function calculateGrowthPotential(
  currentFSS,
  pillars,
  consistency,
  historyDays
) {
  /**
   * Base potential.
   *
   * At FSS 59, there is significant room to improve.
   */
  const roomToGrow =
    Math.max(
      0,
      90 - currentFSS
    )

  /**
   * Don't let room alone create an absurd projection.
   */
  const roomFactor =
    clamp(
      roomToGrow / 40,
      0.35,
      1.15
    )

  /**
   * Pillar foundation.
   */
  const averagePillarScore =
    pillars.length
      ? pillars.reduce(
          (sum, pillar) =>
            sum + pillar.score * pillar.weight,
          0
        )
      : currentFSS

  const foundationFactor =
    clamp(
      averagePillarScore / 70,
      0.65,
      1.15
    )

  /**
   * Consistency bonus.
   */
  const consistencyFactor =
    0.85 +
    consistency * 0.3

  /**
   * More history = more confidence.
   */
  let historyFactor = 0.75

  if (historyDays >= 14) {
    historyFactor = 0.85
  }

  if (historyDays >= 30) {
    historyFactor = 0.95
  }

  if (historyDays >= 90) {
    historyFactor = 1
  }

  const potential =
    roomFactor *
    foundationFactor *
    consistencyFactor *
    historyFactor

  return clamp(
    potential,
    0.55,
    1.25
  )
}

/**
 * Calculate the maximum believable improvement
 * based on the user's current score and history.
 */
function getMaximumGrowth(
  currentFSS,
  historyDays
) {
  /**
   * Short history:
   * Keep things exciting but conservative.
   */
  if (historyDays < 14) {
    return clamp(
      12 - currentFSS * 0.03,
      7,
      10
    )
  }

  if (historyDays < 30) {
    return clamp(
      16 - currentFSS * 0.04,
      9,
      14
    )
  }

  if (historyDays < 90) {
    return clamp(
      21 - currentFSS * 0.05,
      11,
      18
    )
  }

  return clamp(
    25 - currentFSS * 0.06,
    13,
    21
  )
}

/**
 * Calculate a projection at a given horizon.
 *
 * Growth is front-loaded:
 *
 * 6 months = meaningful improvement
 * 1 year   = more improvement
 * 3 years  = biggest opportunity
 *
 * But growth slows as the user approaches their ceiling.
 */
function calculateProjection(
  currentFSS,
  maximumGrowth,
  growthPotential,
  months
) {
  /**
   * Saturating curve.
   *
   * This means:
   *
   * 6mo: meaningful
   * 1yr: larger
   * 3yr: larger still
   *
   * without creating absurd exponential growth.
   */
  const timeProgress =
    1 -
    Math.exp(
      -months / 15
    )

  let gain =
    maximumGrowth *
    timeProgress *
    growthPotential

  /**
   * Keep the first horizon from jumping too aggressively.
   */
  if (months <= 6) {
    gain = Math.min(
      gain,
      maximumGrowth * 0.45
    )
  }

  if (months <= 12) {
    gain = Math.min(
      gain,
      maximumGrowth * 0.72
    )
  }

  return clamp(
    Math.round(
      currentFSS + gain
    ),
    currentFSS,
    97
  )
}

/**
 * Create the most useful "what's shaping this" drivers.
 *
 * These are NOT mathematical deductions from the projection.
 * They're signals designed to tell the user where their attention
 * should go.
 */
function calculateDrivers(
  pillars,
  currentFSS
) {
  if (!pillars.length) {
    return []
  }

  const sorted = [...pillars].sort(
    (a, b) =>
      a.score - b.score
  )

  /**
   * Biggest opportunity.
   */
  const weakest = sorted[0]

  /**
   * Strongest pillar.
   */
  const strongest =
    sorted[sorted.length - 1]

  const drivers = []

  if (
    weakest &&
    weakest.score <
      currentFSS - 3
  ) {
    drivers.push({
      key: weakest.key,
      label: weakest.label,
      delta: Math.max(
        2,
        Math.round(
          (currentFSS -
            weakest.score) /
            3
        )
      ),
      type: 'opportunity',
    })
  }

  if (
    strongest &&
    strongest.key !== weakest?.key &&
    strongest.score >= 75
  ) {
    drivers.push({
      key: strongest.key,
      label: strongest.label,
      delta: Math.max(
        2,
        Math.round(
          (strongest.score -
            70) /
            4
        )
      ),
      type: 'strength',
    })
  }

  /**
   * Add another strong pillar if useful.
   */
  const secondStrongest =
    [...pillars]
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .find(
        (pillar) =>
          pillar.key !==
          strongest?.key &&
          pillar.score >= 70
      )

  if (
    secondStrongest &&
    drivers.length < 3
  ) {
    drivers.push({
      key: secondStrongest.key,
      label: secondStrongest.label,
      delta: Math.max(
        1,
        Math.round(
          (secondStrongest.score -
            65) /
            5
        )
      ),
      type: 'strength',
    })
  }

  return drivers
    .slice(0, 3)
    .map(
      ({
        key,
        label,
        delta,
      }) => ({
        key,
        label,
        delta,
      })
    )
}

/**
 * Main projection function.
 */
export function projectFutureSelf(
  logs,
  actualCurrentFSS,
  currentStreak = 0
) {
  const scored = (logs || [])
    .filter(
      (log) =>
        log?.log_date &&
        log.future_self_score != null &&
        Number.isFinite(
          Number(
            log.future_self_score
          )
        )
    )

  /**
   * One record per day.
   */
  const byDate = new Map()

  scored.forEach((log) => {
    byDate.set(
      log.log_date,
      log
    )
  })

  const distinctLogs =
    [...byDate.values()].sort(
      (a, b) =>
        a.log_date.localeCompare(
          b.log_date
        )
    )

  const historyDays =
    distinctLogs.length

  if (
    historyDays <
    MIN_DAYS_FOR_ANY_PROJECTION
  ) {
    return {
      status: 'insufficient_data',
      historyDays,
    }
  }

  const latestDate =
    new Date(
      `${distinctLogs[
        distinctLogs.length - 1
      ].log_date}T12:00:00`
    )

  const currentFSS =
    clamp(
      safeNumber(
        actualCurrentFSS
      ),
      0,
      100
    )

  /**
   * ---------------------------------------------------------
   * ANALYZE USER
   * ---------------------------------------------------------
   */

  const consistency =
    calculateConsistency(
      distinctLogs
    )

  const pillars =
    calculatePillars(
      distinctLogs,
      latestDate
    )

  const growthPotential =
    calculateGrowthPotential(
      currentFSS,
      pillars,
      consistency,
      historyDays
    )

  const maximumGrowth =
    getMaximumGrowth(
      currentFSS,
      historyDays
    )

  /**
   * ---------------------------------------------------------
   * PROJECT FUTURE
   * ---------------------------------------------------------
   */

  const points = [
    {
      label: 'Today',
      days: 0,
      score: Math.round(
        currentFSS
      ),
    },
  ]

  HORIZONS.forEach(
    (horizon) => {
      const score =
        calculateProjection(
          currentFSS,
          maximumGrowth,
          growthPotential,
          horizon.months
        )

      points.push({
        label: horizon.label,
        days: horizon.days,
        score,
      })
    }
  )

  /**
   * Absolute guarantee:
   * future projections never go backwards.
   */
  for (
    let i = 1;
    i < points.length;
    i++
  ) {
    points[i].score =
      Math.max(
        points[i].score,
        points[i - 1].score
      )
  }

  /**
   * ---------------------------------------------------------
   * DRIVERS
   * ---------------------------------------------------------
   */

  const drivers =
    calculateDrivers(
      pillars,
      currentFSS
    )

  /**
   * ---------------------------------------------------------
   * CONFIDENCE
   * ---------------------------------------------------------
   */

  let tier

  if (historyDays < 30) {
    tier = 'early'
  } else if (historyDays < 90) {
    tier = 'growing'
  } else {
    tier = 'long-term'
  }

  /**
   * ---------------------------------------------------------
   * EXTRA INSIGHTS
   * ---------------------------------------------------------
   *
   * These aren't currently required by FutureProjection.jsx,
   * but they're useful for the next version of the UI.
   */

  const weakestPillar =
    [...pillars].sort(
      (a, b) =>
        a.score - b.score
    )[0]

  const strongestPillar =
    [...pillars].sort(
      (a, b) =>
        b.score - a.score
    )[0]

  return {
    status: 'ok',

    tier,

    historyDays,

    currentFSS,

    currentStreak,

    points,

    drivers,

    insights: {
      consistency: Number(
        consistency.toFixed(2)
      ),

      growthPotential: Number(
        growthPotential.toFixed(2)
      ),

      maximumGrowth: Math.round(
        maximumGrowth
      ),

      strongestPillar:
        strongestPillar?.key ||
        null,

      weakestPillar:
        weakestPillar?.key ||
        null,

      pillars:
        pillars.map(
          (pillar) => ({
            key: pillar.key,
            label: pillar.label,
            score: pillar.score,
          })
        ),
    },
  }
}