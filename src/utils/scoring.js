function legacyNutrition(log) {
  return Math.min(100, Math.round((log.meal_quality || 0) * 0.6 + ((log.water_ml || 0) / 3000) * 40))
}

function legacyFitness(log) {
  return Math.min(100, Math.round((log.exercise_intensity || 0) * 0.7 + (log.sleep_quality || 5) * 3))
}

// ── SERVING-AWARE MACRO HELPERS ────────────────────────────────────────────────
function getFoodServingMacros(food) {
  const g      = food.servingG ?? 150
  const factor = g / 100
  const qty    = food.qty ?? 1
  return {
    calories: (food.calories ?? 0) * factor * qty,
    protein:  (food.protein  ?? 0) * factor * qty,
    carbs:    (food.carbs    ?? 0) * factor * qty,
    fat:      (food.fat      ?? 0) * factor * qty,
  }
}

// ── DIETARY INFLAMMATORY INDEX (DII) ──────────────────────────────────────────
// Based on Shivappa et al. 2014 — foods scored by their inflammatory effect
// Negative = anti-inflammatory (good), Positive = pro-inflammatory (bad)
// We map these to a 0-100 score

const FOOD_INFLAMMATORY_SCORES = {
  // Strong anti-inflammatory
  salmon:          -2.0,
  sardine:         -2.0,
  tuna:            -1.5,
  mackerel:        -2.0,
  blueberr:        -1.8,
  strawberr:       -1.5,
  raspberry:       -1.5,
  cherry:          -1.4,
  spinach:         -1.6,
  kale:            -1.8,
  broccoli:        -1.4,
  'sweet potato':  -1.2,
  walnut:          -1.8,
  almond:          -1.2,
  avocado:         -1.3,
  olive:           -1.5,
  turmeric:        -2.0,
  ginger:          -1.6,
  garlic:          -1.4,
  'green tea':     -1.8,
  quinoa:          -1.0,
  lentil:          -1.2,
  chickpea:        -1.0,
  'black bean':    -1.0,
  tomato:          -1.2,
  mushroom:        -0.8,
  'bell pepper':   -1.0,
  // Moderate anti-inflammatory
  oat:             -0.8,
  'brown rice':    -0.6,
  'whole wheat':   -0.5,
  apple:           -0.7,
  orange:          -0.8,
  mango:           -0.7,
  pineapple:       -0.6,
  kiwi:            -0.8,
  carrot:          -0.7,
  'greek yogurt':  -0.5,
  'cottage cheese':-0.3,
  egg:             -0.3,
  chicken:         -0.2,
  turkey:          -0.2,
  // Neutral / slight pro-inflammatory
  'white rice':     0.2,
  pasta:            0.3,
  'white bread':    0.5,
  potato:           0.1,
  'whole milk':     0.2,
  cheddar:          0.3,
  butter:           0.6,
  // Pro-inflammatory
  'beef':           0.5,
  'ground beef':    0.6,
  'pork':           0.5,
  'lamb':           0.6,
  // Strong pro-inflammatory (ultra-processed)
  chips:            1.8,
  'soda':           1.5,
  'cola':           1.5,
  cookie:           1.6,
  cake:             1.7,
  pizza:            1.2,
  burger:           1.4,
  fries:            1.6,
  donut:            1.8,
  'milk chocolate': 1.2,
  'candy':          1.8,
  popcorn:          1.0,
  muffin:           1.4,
  brownie:          1.6,
  'hot dog':        1.8,
  nachos:           1.4,
  'fried chicken':  1.3,
  'ice cream':      1.2,
  pancake:          1.0,
}

function getDIIScore(foodName) {
  const name = (foodName || '').toLowerCase()
  let best = null
  let bestLen = 0
  for (const [keyword, score] of Object.entries(FOOD_INFLAMMATORY_SCORES)) {
    if (name.includes(keyword) && keyword.length > bestLen) {
      best    = score
      bestLen = keyword.length
    }
  }
  return best ?? 0 // unknown food = neutral
}

// ── FOOD QUALITY SCORE ─────────────────────────────────────────────────────────
// Based on: NOVA processing level + Mediterranean diet adherence + fiber/micronutrient density
// NOT based on protein density (high protein ≠ longevity per Longo research)

export function calcFoodQualityScore(foods = []) {
  if (!foods?.length) return null

  const realFoods = foods.filter((f) => f.calories != null || f.protein != null || f.name)
  if (!realFoods.length) return null

  let totalScore  = 0
  let totalWeight = 0

  for (const food of realFoods) {
    const key  = food.servingKey || ''
    const name = (food.name || '').toLowerCase()
    const qty  = food.qty ?? 1
    const m    = getFoodServingMacros(food)

    // ── 1. NOVA processing level (0-40 pts) ───────────────────────────────────
    // Based on NOVA classification research — processing level is independent predictor
    let novaScore = 0
    if      (key === 'vegetable_servings') novaScore = 40  // unprocessed whole foods
    else if (key === 'fruit_servings')     novaScore = 38
    else if (key === 'protein_servings')   novaScore = 25  // minimally processed
    else if (key === 'processed_servings') novaScore = 0   // ultra-processed
    else                                   novaScore = 18  // grains/other — minimally processed

    // ── 2. Mediterranean / Blue Zone alignment (0-30 pts) ────────────────────
    // Longo longevity diet: legumes, fish, nuts, olive oil, vegetables, whole grains
    let medScore = 0
    const LONGEVITY_FOODS = ['salmon','sardine','tuna','lentil','chickpea','black bean','walnut','almond','olive','quinoa','kale','spinach','broccoli','blueberr','strawberr']
    const LIMIT_FOODS     = ['beef','ground beef','pork','lamb','butter','cream cheese']

    if (LONGEVITY_FOODS.some((k) => name.includes(k)))  medScore = 30
    else if (key === 'vegetable_servings')               medScore = 25
    else if (key === 'fruit_servings')                   medScore = 20
    else if (key === 'protein_servings')                 medScore = 12
    else if (LIMIT_FOODS.some((k) => name.includes(k))) medScore = 5
    else if (key === 'processed_servings')               medScore = 0
    else                                                 medScore = 10

    // ── 3. Fiber & micronutrient proxy (0-20 pts) ────────────────────────────
    // High carb from whole foods = fiber = gut health = longevity
    // We use carb-to-calorie ratio as fiber proxy for whole plant foods
    let fiberScore = 0
    if (key === 'vegetable_servings' || key === 'fruit_servings') {
      const carbRatio = m.calories > 0 ? (m.carbs / m.calories) * 400 : 0
      fiberScore = Math.min(20, Math.round(carbRatio))
    } else if (key === 'protein_servings') {
      fiberScore = name.includes('bean') || name.includes('lentil') || name.includes('chickpea') ? 18 : 5
    } else if (key === 'processed_servings') {
      fiberScore = 0
    } else {
      fiberScore = 8 // grains — some fiber
    }

    // ── 4. DII inflammatory penalty/bonus (−20 to +10 pts) ───────────────────
    const dii = getDIIScore(name)
    const diiPoints = Math.round(dii * -8) // anti-inflammatory adds pts, pro subtracts

    // ── Final food score ──────────────────────────────────────────────────────
    const foodScore = Math.max(0, Math.min(100,
      novaScore + medScore + fiberScore + diiPoints
    ))

    totalScore  += foodScore * qty
    totalWeight += qty
  }

  return Math.min(100, Math.max(0, Math.round(totalScore / totalWeight)))
}

// ── FOOD LONGEVITY SCORE ───────────────────────────────────────────────────────
// Based on: DII (Dietary Inflammatory Index) + Blue Zone food patterns + NOVA
// This is the most research-backed longevity score possible from food names alone

export function calcFoodLongevityScore(foods = []) {
  if (!foods?.length) return null

  const realFoods = foods.filter((f) => f.name || f.calories != null)
  if (!realFoods.length) return null

  let totalDII    = 0
  let totalQty    = 0
  let blueZoneHits = 0
  let processedQty = 0

  // Blue Zone staples per Longo + Buettner research
  const BLUE_ZONE_FOODS = [
    'salmon','sardine','tuna','lentil','chickpea','black bean','walnut',
    'almond','olive','kale','spinach','broccoli','blueberr','strawberr',
    'raspberry','cherry','sweet potato','tomato','quinoa','avocado',
    'mushroom','garlic','ginger','turmeric','green tea','oat','brown rice',
  ]

  for (const food of realFoods) {
    const name = (food.name || '').toLowerCase()
    const qty  = food.qty ?? 1
    const key  = food.servingKey || ''

    totalDII += getDIIScore(name) * qty
    totalQty += qty

    if (BLUE_ZONE_FOODS.some((k) => name.includes(k))) blueZoneHits += qty
    if (key === 'processed_servings') processedQty += qty
  }

  if (totalQty === 0) return null

  // ── Component 1: DII score (0-50 pts) ────────────────────────────────────
  // Average DII ranges roughly -2 to +2 per food
  // Map -2 = 50pts (very anti-inflammatory), +2 = 0pts (very pro-inflammatory)
  const avgDII    = totalDII / totalQty
  const diiScore  = Math.max(0, Math.min(50, Math.round((2 - avgDII) / 4 * 50)))

  // ── Component 2: Blue Zone adherence (0-30 pts) ───────────────────────────
  const bzRatio   = Math.min(blueZoneHits / totalQty, 1)
  const bzScore   = Math.round(bzRatio * 30)

  // ── Component 3: Ultra-processed penalty (0-20 pts available, 0 if bad) ──
  // Each UPF item costs points — research shows dose-response relationship
  const processedRatio  = processedQty / totalQty
  const processingScore = Math.round(Math.max(0, 1 - processedRatio * 2) * 20)

  const total = diiScore + bzScore + processingScore

  return Math.min(100, Math.max(0, total))
}

// ── MACRO SUMMARY ──────────────────────────────────────────────────────────────
export function calcMacroSummary(foods = []) {
  if (!foods?.length) return null

  const realFoods = foods.filter((f) => f.calories != null)
  if (!realFoods.length) return null

  return realFoods.reduce(
    (acc, f) => {
      const m = getFoodServingMacros(f)
      return {
        calories: acc.calories + Math.round(m.calories),
        protein:  Math.round((acc.protein  + m.protein)  * 10) / 10,
        carbs:    Math.round((acc.carbs    + m.carbs)    * 10) / 10,
        fat:      Math.round((acc.fat      + m.fat)      * 10) / 10,
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
    return Math.min(100, Math.round(baseScore * 0.5 + foodQuality * 0.5))
  }

  return baseScore
}

const WORKOUT_TYPE_FACTOR = { gym: 1, run: 1.1, sport: 1.05, yoga: 0.85, rest: 0.25 }

export function calcFitnessFromWorkout(log) {
  const duration = log.workout_duration_min ?? 0
  const type     = log.exercise_type || 'rest'

  if (duration === 0 && type === 'rest' && !(log.exercise_intensity > 0)) return 0
  if (duration === 0 && (log.exercise_intensity || 0) > 0) return legacyFitness(log)

  const factor        = WORKOUT_TYPE_FACTOR[type] ?? 0.5
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
    ((log.focus_minutes      || 0) / 90) * 60 +
    ((log.reading_minutes    || 0) / 30) * 25 +
    ((log.meditation_minutes || 0) / 10) * 15
  ))
}

export function calcLongevityScore(log, fitnessScore, nutritionScore, foods = []) {
  const base = Math.min(100, Math.round(
    (Number(log.sleep_hours || 0) / 8) * 30 +
    fitnessScore   * 0.25 +
    nutritionScore * 0.25 +
    Math.min((log.water_ml || 0) / 3000, 1) * 20
  ))

  const foodLongevity = calcFoodLongevityScore(foods)
  if (foodLongevity !== null) {
    // Food longevity gets 45% weight when real foods are logged — it's the most direct longevity signal
    return Math.min(100, Math.round(base * 0.55 + foodLongevity * 0.45))
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
  const fitness           = calcFitnessFromWorkout(log)
  const nutrition         = calcNutritionFromServings(log, foods)
  const energy            = calcEnergyFromSleep(log)
  const focus             = calcFocusScore(log)
  const longevity         = calcLongevityScore(log, fitness, nutrition, foods)
  const mood              = (log.mood || 5) * 10
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
  if (nutrition >= 50)                base += 15
  if (Number(log.sleep_hours) >= 7.5) base += 20
  if ((log.water_ml      || 0) >= 2500) base += 10
  if ((log.focus_minutes || 0) >= 60)   base += 20
  if ((log.reading_minutes||0) >= 20)   base += 15
  if ((log.meditation_minutes||0) >= 10) base += 10
  if (log.is_perfect_day)               base += 50

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