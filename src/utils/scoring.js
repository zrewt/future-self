function legacyNutrition(log) {
  return Math.min(100, Math.round((log.meal_quality || 0) * 0.6 + ((log.water_ml || 0) / 3000) * 40))
}

function legacyFitness(log) {
  return Math.min(100, Math.round((log.exercise_intensity || 0) * 0.7 + (log.sleep_quality || 5) * 3))
}

// ── SERVING-AWARE MACRO HELPERS ────────────────────────────────────────────────
// All scoring uses per-serving macros (servingG / 100 * per100g), not flat 100g

function getFoodServingMacros(food) {
  const g = food.servingG ?? 150
  const factor = g / 100
  return {
    calories: (food.calories ?? 0) * factor,
    protein:  (food.protein  ?? 0) * factor,
    carbs:    (food.carbs    ?? 0) * factor,
    fat:      (food.fat      ?? 0) * factor,
    qty:       food.qty ?? 1,
  }
}

// ── FOOD QUALITY SCORE ─────────────────────────────────────────────────────────
export function calcFoodQualityScore(foods = []) {
  if (!foods?.length) return null

  const realFoods = foods.filter((f) => f.calories != null || f.protein != null)
  if (!realFoods.length) return null

  let totalScore = 0
  let totalWeight = 0

  for (const food of realFoods) {
    const qty = food.qty ?? 1
    const m = getFoodServingMacros(food)
    const cal     = m.calories * qty
    const protein = m.protein  * qty
    const carbs   = m.carbs    * qty
    const fat     = m.fat      * qty
    const key     = food.servingKey || ''

    // Protein density per 100 kcal (ideal ≥ 8g)
    const proteinDensity = cal > 0 ? (protein / cal) * 100 : 0
    const proteinScore   = Math.min(proteinDensity / 8, 1) * 30

    // Calorie density penalty based on per-serving calories
    const calDensityScore = Math.max(0, (1 - Math.max(0, cal - 400) / 800)) * 20

    // Category bonus/penalty
    let categoryBonus = 0
    if      (key === 'fruit_servings')     categoryBonus = 20
    else if (key === 'vegetable_servings') categoryBonus = 25
    else if (key === 'protein_servings')   categoryBonus = 20
    else if (key === 'processed_servings') categoryBonus = -20

    // Macro balance
    const macroTotal   = protein + carbs + fat
    const macroBalance = macroTotal > 0
      ? Math.max(0, 1 - Math.abs(protein / macroTotal - 0.25) * 2) * 15
      : 0

    const foodScore = Math.max(0, proteinScore + calDensityScore + categoryBonus + macroBalance)
    totalScore  += foodScore
    totalWeight += 1
  }

  return Math.min(100, Math.max(0, Math.round(totalScore / totalWeight)))
}

// ── FOOD LONGEVITY SCORE ───────────────────────────────────────────────────────
export function calcFoodLongevityScore(foods = []) {
  if (!foods?.length) return null

  const realFoods = foods.filter((f) => f.calories != null || f.protein != null)
  if (!realFoods.length) return null

  const ANTI_INFLAMMATORY = [
    'salmon','sardine','tuna','blueberr','strawberr','raspberry',
    'spinach','kale','broccoli','avocado','walnut','olive',
    'turmeric','ginger','green tea','almond','quinoa','lentil',
    'chickpea','black bean','sweet potato','tomato','cherry',
  ]

  let wholeCount = 0
  let processedCount = 0
  let antiInflamCount = 0

  for (const food of realFoods) {
    const name = (food.name || '').toLowerCase()
    const key  = food.servingKey || ''
    const qty  = food.qty ?? 1

    if (key === 'processed_servings') processedCount += qty
    else wholeCount += qty

    if (ANTI_INFLAMMATORY.some((k) => name.includes(k))) antiInflamCount += qty
  }

  const total            = realFoods.reduce((s, f) => s + (f.qty ?? 1), 0)
  const wholeFoodRatio   = total > 0 ? wholeCount / total : 0
  const processedPenalty = Math.min(processedCount * 12, 48)
  const antiInflamBonus  = Math.min(antiInflamCount * 10, 40)

  const base = wholeFoodRatio * 60 + antiInflamBonus - processedPenalty
  return Math.min(100, Math.max(0, Math.round(base)))
}

// ── MACRO SUMMARY ──────────────────────────────────────────────────────────────
export function calcMacroSummary(foods = []) {
  if (!foods?.length) return null

  const realFoods = foods.filter((f) => f.calories != null)
  if (!realFoods.length) return null

  return realFoods.reduce(
    (acc, f) => {
      const qty = f.qty ?? 1
      const m   = getFoodServingMacros(f)
      return {
        calories: acc.calories + Math.round(m.calories * qty),
        protein:  acc.protein  + Math.round(m.protein  * qty * 10) / 10,
        carbs:    acc.carbs    + Math.round(m.carbs    * qty * 10) / 10,
        fat:      acc.fat      + Math.round(m.fat      * qty * 10) / 10,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

// ── NUTRITION SCORE ────────────────────────────────────────────────────────────
export function calcNutritionFromServings(log, foods = []) {
  const fruit     = log.fruit_servings     ?? 0
  const veg       = log.vegetable_servings ?? 0
  const protein   = log.protein_servings   ?? 0
  const processed = log.processed_servings ?? 0

  if (fruit + veg + protein + processed === 0 && (log.meal_quality || 0) > 0) {
    return legacyNutrition(log)
  }

  let baseScore =
    (Math.min(fruit,     3) / 3)    * 25 +
    (Math.min(veg,       4) / 4)    * 30 +
    (Math.min(protein,   3) / 3)    * 30 +
    Math.min((log.water_ml || 0) / 2500, 1) * 15 -
    Math.min(processed, 5) * 8

  baseScore = Math.min(100, Math.max(0, Math.round(baseScore)))

  const foodQuality = calcFoodQualityScore(foods)
  if (foodQuality !== null) {
    return Math.min(100, Math.round(baseScore * 0.55 + foodQuality * 0.45))
  }

  return baseScore
}

const WORKOUT_TYPE_FACTOR = { gym: 1, run: 1.1, sport: 1.05, yoga: 0.85, rest: 0.25 }

export function calcFitnessFromWorkout(log) {
  const duration = log.workout_duration_min ?? 0
  const type     = log.exercise_type || 'rest'

  if (duration === 0 && type === 'rest' && !(log.exercise_intensity > 0)) return 0
  if (duration === 0 && (log.exercise_intensity || 0) > 0) return legacyFitness(log)

  const factor       = WORKOUT_TYPE_FACTOR[type] ?? 0.5
  const durationScore = Math.min(duration / 45, 1) * 75 * factor
  return Math.min(100, Math.round(durationScore + (log.sleep_quality || 5) * 1.5))
}

export function calcEnergyFromSleep(log) {
  const hours   = Number(log.sleep_hours) || 0
  const quality = log.sleep_quality || 5
  const mood    = log.mood || 5
  const water   = Math.min((log.water_ml || 0) / 3000, 1) * 15
  return Math.min(100, Math.round((hours / 8) * 50 + quality * 4 + mood * 2 + water))
}

export function calcFocusScore(log) {
  return Math.min(100, Math.round(
    ((log.focus_minutes     || 0) / 90) * 60 +
    ((log.reading_minutes   || 0) / 30) * 25 +
    ((log.meditation_minutes|| 0) / 10) * 15
  ))
}

export function calcLongevityScore(log, fitnessScore, nutritionScore, foods = []) {
  const base = Math.min(100, Math.round(
    (Number(log.sleep_hours || 0) / 8) * 30 +
    fitnessScore    * 0.25 +
    nutritionScore  * 0.25 +
    Math.min((log.water_ml || 0) / 3000, 1) * 20
  ))

  const foodLongevity = calcFoodLongevityScore(foods)
  if (foodLongevity !== null) {
    return Math.min(100, Math.round(base * 0.6 + foodLongevity * 0.4))
  }
  return base
}

export function calcFutureSelfScore(scores, streakDays) {
  const consistency = 0.7 + (Math.min(streakDays, 100) / 100) * 0.3
  const weighted =
    scores.fitness   * 0.25 +
    scores.nutrition * 0.20 +
    scores.energy    * 0.20 +
    scores.focus     * 0.15 +
    scores.longevity * 0.15 +
    scores.mood      * 0.05
  return Math.min(100, Math.round(weighted * consistency))
}

export function buildAllScores(log, streakDays = 0, foods = []) {
  const fitness          = calcFitnessFromWorkout(log)
  const nutrition        = calcNutritionFromServings(log, foods)
  const energy           = calcEnergyFromSleep(log)
  const focus            = calcFocusScore(log)
  const longevity        = calcLongevityScore(log, fitness, nutrition, foods)
  const mood             = (log.mood || 5) * 10
  const future_self_score = calcFutureSelfScore(
    { fitness, nutrition, energy, focus, longevity, mood },
    streakDays
  )
  return {
    fitness_score:      fitness,
    nutrition_score:    nutrition,
    energy_score:       energy,
    focus_score:        focus,
    longevity_score:    longevity,
    future_self_score,
    mood_score:         mood,
  }
}

export function getScoreBreakdown(scores, streakDays) {
  const consistency = 0.7 + (Math.min(streakDays, 100) / 100) * 0.3
  const weights = { fitness: 0.25, nutrition: 0.2, energy: 0.2, focus: 0.15, longevity: 0.15, mood: 0.05 }
  const items = [
    { key: 'fitness',   label: 'Fitness',   weight: weights.fitness,   value: scores.fitness   },
    { key: 'nutrition', label: 'Nutrition', weight: weights.nutrition, value: scores.nutrition },
    { key: 'energy',    label: 'Energy',    weight: weights.energy,    value: scores.energy    },
    { key: 'focus',     label: 'Focus',     weight: weights.focus,     value: scores.focus     },
    { key: 'longevity', label: 'Longevity', weight: weights.longevity, value: scores.longevity },
    { key: 'mood',      label: 'Mood',      weight: weights.mood,      value: scores.mood      },
  ]
  return items.map((item) => ({
    ...item,
    points:  Math.round(item.value * item.weight * consistency),
    percent: Math.round(item.weight * consistency * 100),
  }))
}

export function calcXP(log, streakDays, questXP = 0) {
  let base = 0
  const fitness   = calcFitnessFromWorkout(log)
  const nutrition = calcNutritionFromServings(log)

  if (fitness >= 50 || (log.workout_duration_min || 0) >= 20) base += 25
  if (nutrition >= 50)              base += 15
  if (Number(log.sleep_hours) >= 7.5) base += 20
  if ((log.water_ml     || 0) >= 2500) base += 10
  if ((log.focus_minutes|| 0) >= 60)   base += 20
  if ((log.reading_minutes||0) >= 20)  base += 15
  if ((log.meditation_minutes||0)>=10) base += 10
  if (log.is_perfect_day)              base += 50

  const streakBonus = Math.floor(streakDays / 7) * 5
  return base + streakBonus + questXP
}

export function isPerfectDay(log) {
  const scores = buildAllScores(log, 0)
  return (
    scores.nutrition_score >= 55 &&
    scores.fitness_score   >= 50 &&
    Number(log.sleep_hours) >= 7 &&
    (log.mood     || 0) >= 7 &&
    (log.water_ml || 0) >= 2000
  )
}

export function getLevelFromXP(totalXP) {
  for (let n = 1; n <= 99; n++) {
    if (totalXP < Math.floor(100 * Math.pow(n, 1.8))) return n
  }
  return 99
}

export function getLevelName(level) {
  if (level <=  4) return 'Initiate'
  if (level <=  9) return 'Builder'
  if (level <= 19) return 'Disciplined'
  if (level <= 34) return 'Elite'
  if (level <= 49) return 'Master'
  return 'Future Legend'
}

export function getXPForLevel(level) {
  if (level <= 1) return 0
  return Math.floor(100 * Math.pow(level - 1, 1.8))
}

export function getXPForNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.8))
}

export function calcProjection(recentScores, daysAhead) {
  if (!recentScores || recentScores.length < 3) return null
  let ema = recentScores[0]
  const alpha = 0.1
  for (const score of recentScores) ema = alpha * score + (1 - alpha) * ema
  const last7    = recentScores.slice(0, 7)
  const prev7    = recentScores.slice(7, 14)
  const avg7     = last7.reduce((a, b) => a + b, 0) / last7.length
  const avgPrev  = prev7.length ? prev7.reduce((a, b) => a + b, 0) / prev7.length : avg7
  const momentum = (avg7 - avgPrev) / 7
  const decay    = Math.max(0, (ema - 70) / 100)
  const projected = ema + momentum * daysAhead * (1 - decay)
  return Math.round(Math.min(99, Math.max(ema - 5, projected)))
}