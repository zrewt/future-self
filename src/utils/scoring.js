// ─────────────────────────────────────────────────────────────────────────────
// QYVEN SCORING ENGINE
// ─────────────────────────────────────────────────────────────────────────────
// Philosophy:
//
// 1. FSS represents the quality of TODAY.
// 2. A new user should NOT be punished for having a short streak.
// 3. Consistency gives a small bonus instead of multiplying the entire score.
// 4. 70–80 = genuinely good day.
// 5. 80–90 = very strong day.
// 6. 90+ = exceptional.
// 7. 100 is reserved for an essentially perfect day.
// ─────────────────────────────────────────────────────────────────────────────


// ── LEGACY HELPERS ───────────────────────────────────────────────────────────

function legacyNutrition(log) {
  return Math.min(
    100,
    Math.round(
      (log.meal_quality || 0) * 0.6 +
      ((log.water_ml || 0) / 3000) * 40
    )
  )
}

function legacyFitness(log) {
  return Math.min(
    100,
    Math.round(
      (log.exercise_intensity || 0) * 0.7 +
      (log.sleep_quality || 5) * 3
    )
  )
}


// ── FOOD SCORING ─────────────────────────────────────────────────────────────

export {
  calcFoodQualityScore,
  calcFoodQualityBreakdown,
  calcFoodLongevityScore,
  calcFoodLongevityBreakdown,
  calcMealMacroTotals,
} from './foodScoring'

import {
  calcFoodQualityScore,
  calcFoodLongevityScore,
  calcMealMacroTotals,
} from './foodScoring'


// ── CURVE HELPERS ────────────────────────────────────────────────────────────

/*
 * Diminishing returns:
 * Strong gains early, progressively smaller gains later.
 */
function diminishing(amount, ceiling, k) {
  const a = Math.max(0, Number(amount) || 0)

  if (a <= 0) return 0

  return (ceiling * a) / (a + k)
}


/*
 * Sleep uses an optimal-range curve.
 *
 * 8–9 hours should be excellent.
 * Too little sleep hurts.
 * Excessively long sleep also gradually hurts.
 */
function sleepHoursCurve(
  hours,
  ceiling,
  center = 8.25,
  spread = 31.25
) {
  const h = Math.max(0, Number(hours) || 0)

  const raw =
    ceiling -
    (ceiling / spread) * Math.pow(h - center, 2)

  return Math.max(0, raw)
}


/*
 * Sleep quality modifies the hours score.
 *
 * Quality 0 → 55% of hours score
 * Quality 5 → 77.5%
 * Quality 10 → 100%
 *
 * This prevents someone from getting a perfect sleep score
 * simply by entering a large number of hours.
 */
function qualityFactor(quality) {
  const q = Math.max(
    0,
    Math.min(10, Number(quality) || 0)
  )

  return 0.55 + 0.45 * (q / 10)
}


// ── MACRO SUMMARY ────────────────────────────────────────────────────────────

export function calcMacroSummary(foods) {
  const totals = calcMealMacroTotals(foods)

  if (!totals) return null

  const {
    calories,
    protein,
    carbs,
    fat,
    fiber,
  } = totals

  return {
    calories,
    protein,
    carbs,
    fat,
    fiber,
  }
}


// ── NUTRITION ────────────────────────────────────────────────────────────────

/*
 * Nutrition combines:
 *
 * - fruit
 * - vegetables
 * - protein
 * - water
 * - actual food quality
 *
 * Servings provide a useful baseline.
 * Detailed food logging improves accuracy.
 */
export function calcNutritionFromServings(log, foods = []) {
  const fruit = Number(log.fruit_servings ?? 0)
  const veg = Number(log.vegetable_servings ?? 0)
  const protein = Number(log.protein_servings ?? 0)
  const processed = Number(log.processed_servings ?? 0)

  /*
   * Preserve compatibility with older logs.
   */
  if (
    fruit + veg + protein + processed === 0 &&
    (log.meal_quality || 0) > 0
  ) {
    return legacyNutrition(log)
  }

  const fruitPts = diminishing(fruit, 14, 2)
  const vegPts = diminishing(veg, 20, 3)
  const proteinPts = diminishing(protein, 16, 2.5)

  const waterPts = diminishing(
    Number(log.water_ml || 0),
    10,
    1400
  )

  /*
   * Processed food is a penalty, but it should not destroy
   * an otherwise healthy day.
   */
  const processedPenalty = diminishing(
    processed,
    10,
    2.5
  )

  let base =
    fruitPts +
    vegPts +
    proteinPts +
    waterPts -
    processedPenalty

  base = Math.min(
    60,
    Math.max(0, Math.round(base))
  )

  const foodQuality = calcFoodQualityScore(foods)

  /*
   * If detailed food data exists, blend it in.
   *
   * 30% behavioral serving data
   * 70% actual food quality
   */
  if (foodQuality == null) {
    return base
  }

  const blended = Math.round(
    base * 0.30 +
    foodQuality * 0.70
  )

  return Math.min(
    100,
    Math.max(base, blended)
  )
}


// ── FITNESS ─────────────────────────────────────────────────────────────────

const WORKOUT_FACTOR = {
  gym: 1.00,
  run: 1.05,
  sport: 1.03,
  yoga: 0.90,
  rest: 0,
}

export function calcFitnessFromWorkout(log) {
  const duration = Math.max(
    0,
    Number(log.workout_duration_min) || 0
  )

  const type = log.exercise_type || 'rest'

  /*
   * Compatibility with old logs.
   */
  if (
    duration === 0 &&
    (log.exercise_intensity || 0) > 0
  ) {
    return legacyFitness(log)
  }

  if (duration === 0) {
    return 0
  }

  const factor =
    WORKOUT_FACTOR[type] ?? 1

  /*
   * 20–30 min = meaningful
   * 45–60 min = strong
   * 90+ min = still improves, but diminishing returns
   */
  const durationPts = diminishing(
    duration,
    100,
    35
  )

  return Math.min(
    100,
    Math.round(durationPts * factor)
  )
}


// ── ENERGY ───────────────────────────────────────────────────────────────────

export function calcEnergyFromSleep(log) {
  const hoursRaw = sleepHoursCurve(
    Number(log.sleep_hours) || 0,
    70
  )

  const sleepPart =
    hoursRaw *
    qualityFactor(log.sleep_quality)

  const moodPts = diminishing(
    Number(log.mood || 0),
    12,
    3
  )

  const waterPts = diminishing(
    Number(log.water_ml || 0),
    18,
    1400
  )

  return Math.min(
    100,
    Math.round(
      sleepPart +
      moodPts +
      waterPts
    )
  )
}


// ── FUTURE SELF PILLARS ──────────────────────────────────────────────────────

export function calcSleepScore(log) {
  const hours = Number(log.sleep_hours) || 0

  if (hours <= 0) return 0

  const hoursRaw = sleepHoursCurve(
    hours,
    100
  )

  const score =
    hoursRaw *
    qualityFactor(log.sleep_quality)

  return Math.min(
    100,
    Math.round(score)
  )
}


export function calcHydrationScore(log) {
  return Math.min(
    100,
    Math.round(
      diminishing(
        Number(log.water_ml || 0),
        100,
        1400
      )
    )
  )
}


export function calcHabitsScore(log) {
  const focusPts = diminishing(
    Number(log.focus_minutes || 0),
    42,
    30
  )

  const readingPts = diminishing(
    Number(log.reading_minutes || 0),
    24,
    12
  )

  const meditationPts = diminishing(
    Number(log.meditation_minutes || 0),
    18,
    8
  )

  const moodPts = diminishing(
    Number(log.mood || 0),
    16,
    3
  )

  return Math.min(
    100,
    Math.round(
      focusPts +
      readingPts +
      meditationPts +
      moodPts
    )
  )
}


// ── FOCUS ────────────────────────────────────────────────────────────────────

export function calcFocusScore(log) {
  const focusPts = diminishing(
    Number(log.focus_minutes || 0),
    55,
    32
  )

  const readingPts = diminishing(
    Number(log.reading_minutes || 0),
    28,
    14
  )

  const meditationPts = diminishing(
    Number(log.meditation_minutes || 0),
    17,
    7
  )

  return Math.min(
    100,
    Math.round(
      focusPts +
      readingPts +
      meditationPts
    )
  )
}


// ── LONGEVITY ────────────────────────────────────────────────────────────────

export function calcLongevityScore(
  log,
  fitnessScore,
  nutritionScore,
  foods = []
) {
  const sleepPts =
    sleepHoursCurve(
      Number(log.sleep_hours) || 0,
      22
    ) *
    qualityFactor(log.sleep_quality)

  const hydrationPts = diminishing(
    Number(log.water_ml || 0),
    13,
    1400
  )

  const base = Math.min(
    90,
    Math.round(
      sleepPts +
      fitnessScore * 0.22 +
      nutritionScore * 0.22 +
      hydrationPts
    )
  )

  const foodLongevity =
    calcFoodLongevityScore(foods)

  if (foodLongevity != null) {
    return Math.min(
      100,
      Math.round(
        base * 0.40 +
        foodLongevity * 0.60
      )
    )
  }

  return base
}


// ── FUTURE SELF SCORE ────────────────────────────────────────────────────────

/*
 * IMPORTANT:
 *
 * The old system multiplied the entire score by:
 *
 *   0.65 → 1.00
 *
 * depending on streak.
 *
 * This meant a fantastic first day could become a mediocre
 * FSS simply because the user had no streak.
 *
 * Qyven now scores the QUALITY OF TODAY first.
 *
 * Consistency is a SMALL bonus.
 *
 * 0 days  → +0
 * 5 days  → +1
 * 10 days → +2
 * ...
 * 30 days → +6
 */
export function calcFutureSelfScore(
  scores,
  streakDays = 0
) {
  const composite =
    Number(scores.nutrition || 0) * 0.25 +
    Number(scores.fitness || 0) * 0.25 +
    Number(scores.sleep || 0) * 0.20 +
    Number(scores.hydration || 0) * 0.15 +
    Number(scores.habits || 0) * 0.15

  const consistencyBonus = Math.min(
    6,
    Math.floor(
      Math.max(0, streakDays) / 5
    )
  )

  /*
   * Exceptional days can reach 100.
   * 100 requires essentially perfect pillar scores.
   */
  return Math.min(
    100,
    Math.round(
      composite +
      consistencyBonus
    )
  )
}


// ── FSS BREAKDOWN ────────────────────────────────────────────────────────────

export function getFutureSelfBreakdown(
  log,
  foods = [],
  streakDays = 0
) {
  const nutrition =
    calcNutritionFromServings(log, foods)

  const fitness =
    calcFitnessFromWorkout(log)

  const sleep =
    calcSleepScore(log)

  const hydration =
    calcHydrationScore(log)

  const habits =
    calcHabitsScore(log)

  const consistencyBonus = Math.min(
    6,
    Math.floor(
      Math.max(0, streakDays) / 5
    )
  )

  const items = [
    {
      key: 'nutrition',
      label: 'Nutrition',
      weight: 0.25,
      value: nutrition,
    },
    {
      key: 'fitness',
      label: 'Fitness',
      weight: 0.25,
      value: fitness,
    },
    {
      key: 'sleep',
      label: 'Sleep',
      weight: 0.20,
      value: sleep,
    },
    {
      key: 'hydration',
      label: 'Hydration',
      weight: 0.15,
      value: hydration,
    },
    {
      key: 'habits',
      label: 'Habits',
      weight: 0.15,
      value: habits,
    },
  ].map(item => ({
    ...item,

    /*
     * "points" represents the contribution to FSS,
     * before the consistency bonus.
     */
    points: Math.round(
      item.value * item.weight
    ),

    percent: Math.round(
      item.weight * 100
    ),
  }))

  const score =
    calcFutureSelfScore(
      {
        nutrition,
        fitness,
        sleep,
        hydration,
        habits,
      },
      streakDays
    )

  return {
    score,
    items,
    consistencyBonus,
  }
}


// ── BUILD ALL SCORES ─────────────────────────────────────────────────────────

export function buildAllScores(
  log,
  streakDays = 0,
  foods = []
) {
  const fitness =
    calcFitnessFromWorkout(log)

  const nutrition =
    calcNutritionFromServings(
      log,
      foods
    )

  const energy =
    calcEnergyFromSleep(log)

  const focus =
    calcFocusScore(log)

  const longevity =
    calcLongevityScore(
      log,
      fitness,
      nutrition,
      foods
    )

  const mood =
    Math.min(
      100,
      Math.max(
        0,
        Number(log.mood || 0) * 10
      )
    )

  const fss =
    getFutureSelfBreakdown(
      log,
      foods,
      streakDays
    )

  return {
    fitness_score: fitness,
    nutrition_score: nutrition,
    energy_score: energy,
    focus_score: focus,
    longevity_score: longevity,
    future_self_score: fss.score,
    mood_score: mood,
  }
}


// ── SCORE BREAKDOWN ──────────────────────────────────────────────────────────

export function getScoreBreakdown(
  scores,
  streakDays = 0
) {
  const items = [
    {
      key: 'nutrition',
      label: 'Nutrition',
      weight: 0.25,
      value: scores.nutrition ?? 0,
    },
    {
      key: 'fitness',
      label: 'Fitness',
      weight: 0.25,
      value: scores.fitness ?? 0,
    },
    {
      key: 'sleep',
      label: 'Sleep',
      weight: 0.20,
      value: scores.sleep ?? 0,
    },
    {
      key: 'hydration',
      label: 'Hydration',
      weight: 0.15,
      value: scores.hydration ?? 0,
    },
    {
      key: 'habits',
      label: 'Habits',
      weight: 0.15,
      value: scores.habits ?? 0,
    },
  ]

  return items.map(item => ({
    ...item,
    points: Math.round(
      item.value * item.weight
    ),
    percent: Math.round(
      item.weight * 100
    ),
  }))
}


// ── XP ──────────────────────────────────────────────────────────────────────

export function calcXP(
  log,
  streakDays,
  questXP = 0,
  foods = []
) {
  let base = 0

  if (
    calcFitnessFromWorkout(log) >= 50 ||
    (log.workout_duration_min || 0) >= 20
  ) {
    base += 25
  }

  if (
    calcNutritionFromServings(
      log,
      foods
    ) >= 50
  ) {
    base += 15
  }

  if (
    Number(log.sleep_hours) >= 7.5
  ) {
    base += 20
  }

  if (
    (log.water_ml || 0) >= 2500
  ) {
    base += 10
  }

  if (
    (log.focus_minutes || 0) >= 60
  ) {
    base += 20
  }

  if (
    (log.reading_minutes || 0) >= 20
  ) {
    base += 15
  }

  if (
    (log.meditation_minutes || 0) >= 10
  ) {
    base += 10
  }

  if (log.is_perfect_day) {
    base += 50
  }

  return (
    base +
    Math.floor(
      Math.max(0, streakDays || 0) / 7
    ) * 5 +
    questXP
  )
}


// ── PERFECT DAY ──────────────────────────────────────────────────────────────

/*
 * A Perfect Day should be difficult but realistic.
 *
 * We intentionally don't require every pillar to be 90+.
 * A person can have an excellent day without being "perfect"
 * in every measurable category.
 */
export function isPerfectDay(
  log,
  foods = []
) {
  const scores =
    buildAllScores(
      log,
      0,
      foods
    )

  return (
    scores.nutrition_score >= 35 &&
    scores.fitness_score >= 52 &&
    Number(log.sleep_hours) >= 7.5 &&
    Number(log.mood || 0) >= 7 &&
    Number(log.water_ml || 0) >= 2200
  )
}


// ── LEVELS ───────────────────────────────────────────────────────────────────

export function getLevelFromXP(totalXP) {
  const xp = Math.max(
    0,
    Number(totalXP) || 0
  )

  for (let n = 1; n <= 99; n++) {
    if (
      xp <
      Math.floor(
        100 * Math.pow(n, 1.8)
      )
    ) {
      return n
    }
  }

  return 99
}


export function getLevelName(level) {
  if (level <= 4) {
    return 'Initiate'
  }

  if (level <= 9) {
    return 'Builder'
  }

  if (level <= 19) {
    return 'Disciplined'
  }

  if (level <= 34) {
    return 'Elite'
  }

  if (level <= 49) {
    return 'Master'
  }

  return 'Future Legend'
}


export function getXPForLevel(level) {
  return level <= 1
    ? 0
    : Math.floor(
        100 *
        Math.pow(
          level - 1,
          1.8
        )
      )
}


export function getXPForNextLevel(level) {
  return Math.floor(
    100 *
    Math.pow(
      level,
      1.8
    )
  )
}


// ── PROJECTION ───────────────────────────────────────────────────────────────

export function calcProjection(
  recentScores,
  daysAhead
) {
  if (
    !recentScores ||
    recentScores.length < 3
  ) {
    return null
  }

  let ema = recentScores[0]

  for (
    const score of recentScores
  ) {
    ema =
      0.1 * score +
      0.9 * ema
  }

  const last7 =
    recentScores.slice(0, 7)

  const prev7 =
    recentScores.slice(7, 14)

  const avg7 =
    last7.reduce(
      (a, b) => a + b,
      0
    ) / last7.length

  const avgPrev =
    prev7.length
      ? prev7.reduce(
          (a, b) => a + b,
          0
        ) / prev7.length
      : avg7

  const momentum =
    (avg7 - avgPrev) / 7

  const decay =
    Math.max(
      0,
      (ema - 70) / 100
    )

  return Math.round(
    Math.min(
      99,
      Math.max(
        ema - 5,
        ema +
          momentum *
            daysAhead *
            (1 - decay)
      )
    )
  )
}