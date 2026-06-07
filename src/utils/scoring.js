// ── LEGACY HELPERS (kept for old logs) ────────────────────────────────────────
function legacyNutrition(log) {
  return Math.min(100, Math.round((log.meal_quality || 0) * 0.6 + ((log.water_ml || 0) / 3000) * 40))
}
function legacyFitness(log) {
  return Math.min(100, Math.round((log.exercise_intensity || 0) * 0.7 + (log.sleep_quality || 5) * 3))
}

// ── FOOD SCORING ───────────────────────────────────────────────────────────────
// Per-serving macros (servingG is grams per serving from foods.js)
function getServingMacros(food) {
  const g      = food.servingG ?? 150
  const factor = (g / 100) * (food.qty ?? 1)
  return {
    cal:  (food.calories ?? 0) * factor,
    pro:  (food.protein  ?? 0) * factor,
    carb: (food.carbs    ?? 0) * factor,
    fat:  (food.fat      ?? 0) * factor,
  }
}

// Dietary Inflammatory Index scores per food keyword
// Negative = anti-inflammatory (good for longevity)
// Positive = pro-inflammatory (bad)
// Source: Shivappa et al. 2014 DII framework + Blue Zone research
const DII = {
  // Strong anti-inflammatory
  salmon: -2.0, sardine: -2.0, tuna: -1.5, mackerel: -2.0,
  blueberr: -1.8, strawberr: -1.5, raspberry: -1.5, cherry: -1.4,
  spinach: -1.6, kale: -1.8, broccoli: -1.4, 'sweet potato': -1.2,
  walnut: -1.8, almond: -1.2, avocado: -1.3, olive: -1.5,
  turmeric: -2.0, ginger: -1.6, garlic: -1.4, 'green tea': -1.8,
  quinoa: -1.0, lentil: -1.2, chickpea: -1.0, 'black bean': -1.0,
  tomato: -1.2, mushroom: -0.8, 'bell pepper': -1.0, pepper: -0.9,
  // Moderate anti-inflammatory
  oat: -0.8, 'brown rice': -0.6, 'whole wheat': -0.5,
  apple: -0.7, orange: -0.8, mango: -0.7, pineapple: -0.6,
  kiwi: -0.8, carrot: -0.7, 'greek yogurt': -0.6, yogurt: -0.4,
  'cottage cheese': -0.3, egg: -0.3, chicken: -0.2, turkey: -0.2,
  edamame: -0.9, 'green pea': -0.7, asparagus: -0.8, zucchini: -0.6,
  cauliflower: -0.7, cabbage: -0.6, cucumber: -0.5, lettuce: -0.5,
  // Neutral / slight pro-inflammatory
  'white rice': 0.2, pasta: 0.3, 'white bread': 0.5,
  potato: 0.1, milk: 0.2, cheddar: 0.3, butter: 0.6,
  beef: 0.5, 'ground beef': 0.6, pork: 0.5, lamb: 0.6,
  // Pro-inflammatory (ultra-processed)
  chip: 1.8, soda: 1.5, cola: 1.5, cookie: 1.6,
  cake: 1.7, pizza: 1.2, burger: 1.4, fries: 1.6,
  donut: 1.8, 'milk chocolate': 1.2, candy: 1.8,
  popcorn: 1.0, muffin: 1.4, brownie: 1.6, 'hot dog': 1.8,
  nachos: 1.4, 'fried chicken': 1.3, 'ice cream': 1.2, pancake: 1.0,
}

function getDII(name) {
  const n = (name || '').toLowerCase()
  let best = null, bestLen = 0
  for (const [kw, score] of Object.entries(DII)) {
    if (n.includes(kw) && kw.length > bestLen) { best = score; bestLen = kw.length }
  }
  return best ?? 0
}

// Blue Zone staple foods (Longo + Buettner research)
const BLUE_ZONE_KEYWORDS = [
  'salmon','sardine','tuna','lentil','chickpea','black bean','walnut',
  'almond','olive','kale','spinach','broccoli','blueberr','strawberr',
  'raspberry','cherry','sweet potato','tomato','quinoa','avocado',
  'mushroom','garlic','ginger','turmeric','oat','brown rice','edamame',
  'bell pepper','asparagus','cauliflower','green pea',
]

function isBluezone(name) {
  const n = (name || '').toLowerCase()
  return BLUE_ZONE_KEYWORDS.some((kw) => n.includes(kw))
}

// ── FOOD QUALITY SCORE (0-100) ─────────────────────────────────────────────────
// Components: NOVA processing level + Mediterranean alignment + DII adjustment
// Runs in O(n) — no nested loops, fast for any reasonable food list
export function calcFoodQualityScore(foods) {
  if (!foods?.length) return null
  const real = foods.filter((f) => f.name)
  if (!real.length) return null

  let total = 0, weight = 0

  for (const food of real) {
    const key  = food.servingKey || ''
    const name = (food.name || '').toLowerCase()
    const qty  = food.qty ?? 1
    const dii  = getDII(name)

    // 1. NOVA processing level (0–45 pts)
    let nova = 0
    if      (key === 'vegetable_servings') nova = 45
    else if (key === 'fruit_servings')     nova = 42
    else if (key === 'protein_servings')   nova = 28
    else if (key === 'processed_servings') nova = 0
    else                                   nova = 20

    // 2. Blue Zone / Mediterranean alignment (0–35 pts)
    let med = 0
    if      (isBluezone(name))             med = 35
    else if (key === 'vegetable_servings') med = 28
    else if (key === 'fruit_servings')     med = 24
    else if (key === 'protein_servings')   med = 14
    else if (key === 'processed_servings') med = 0
    else                                   med = 10

    // 3. DII bonus/penalty (−20 to +15 pts)
    // Scale: -2.0 DII → +15pts, +2.0 DII → -20pts
    const diiPts = dii <= 0
      ? Math.round(dii * -7.5)   // anti-inflammatory bonus
      : Math.round(dii * -10)    // pro-inflammatory penalty

    const score = Math.max(0, Math.min(100, nova + med + diiPts))
    total  += score * qty
    weight += qty
  }

  return weight > 0 ? Math.min(100, Math.max(0, Math.round(total / weight))) : null
}

// ── FOOD LONGEVITY SCORE (0-100) ───────────────────────────────────────────────
// Based on DII average + Blue Zone adherence + NOVA ultra-processed ratio
export function calcFoodLongevityScore(foods) {
  if (!foods?.length) return null
  const real = foods.filter((f) => f.name)
  if (!real.length) return null

  let totalDII = 0, totalQty = 0, bzQty = 0, processedQty = 0

  for (const food of real) {
    const qty = food.qty ?? 1
    const key = food.servingKey || ''
    totalDII   += getDII(food.name) * qty
    totalQty   += qty
    if (isBluezone(food.name))         bzQty       += qty
    if (key === 'processed_servings')  processedQty += qty
  }

  if (totalQty === 0) return null

  // Component 1: DII (0–50 pts) — avg DII of -2 = 50pts, +2 = 0pts
  const avgDII   = totalDII / totalQty
  const diiScore = Math.max(0, Math.min(50, Math.round((2 - avgDII) / 4 * 50)))

  // Component 2: Blue Zone ratio (0–30 pts)
  const bzScore  = Math.round(Math.min(bzQty / totalQty, 1) * 30)

  // Component 3: Ultra-processed penalty (0–20 pts)
  const upfRatio     = processedQty / totalQty
  const upfScore     = Math.round(Math.max(0, 1 - upfRatio * 2) * 20)

  return Math.min(100, Math.max(0, diiScore + bzScore + upfScore))
}

// ── MACRO SUMMARY ──────────────────────────────────────────────────────────────
// Uses real serving sizes + qty — updates instantly since it's pure math
export function calcMacroSummary(foods) {
  if (!foods?.length) return null
  const real = foods.filter((f) => f.calories != null)
  if (!real.length) return null

  return real.reduce(
    (acc, f) => {
      const m = getServingMacros(f)
      return {
        calories: acc.calories + Math.round(m.cal),
        protein:  Math.round((acc.protein + m.pro)  * 10) / 10,
        carbs:    Math.round((acc.carbs   + m.carb) * 10) / 10,
        fat:      Math.round((acc.fat     + m.fat)  * 10) / 10,
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

  let base =
    (Math.min(fruit,     3) / 3) * 25 +
    (Math.min(veg,       4) / 4) * 30 +
    (Math.min(protein,   3) / 3) * 30 +
    Math.min((log.water_ml || 0) / 2500, 1) * 15 -
    Math.min(processed, 5) * 8

  base = Math.min(100, Math.max(0, Math.round(base)))

  const fq = calcFoodQualityScore(foods)
  return fq != null
    ? Math.min(100, Math.round(base * 0.5 + fq * 0.5))
    : base
}

// ── FITNESS ────────────────────────────────────────────────────────────────────
const WORKOUT_FACTOR = { gym: 1, run: 1.1, sport: 1.05, yoga: 0.85, rest: 0.25 }

export function calcFitnessFromWorkout(log) {
  const duration = log.workout_duration_min ?? 0
  const type     = log.exercise_type || 'rest'
  if (duration === 0 && type === 'rest' && !(log.exercise_intensity > 0)) return 0
  if (duration === 0 && (log.exercise_intensity || 0) > 0) return legacyFitness(log)
  const factor = WORKOUT_FACTOR[type] ?? 0.5
  return Math.min(100, Math.round(Math.min(duration / 45, 1) * 75 * factor + (log.sleep_quality || 5) * 1.5))
}

// ── ENERGY ─────────────────────────────────────────────────────────────────────
export function calcEnergyFromSleep(log) {
  const hours   = Number(log.sleep_hours) || 0
  const quality = log.sleep_quality || 5
  const mood    = log.mood || 5
  const water   = Math.min((log.water_ml || 0) / 3000, 1) * 15
  return Math.min(100, Math.round((hours / 8) * 50 + quality * 4 + mood * 2 + water))
}

// ── FOCUS ──────────────────────────────────────────────────────────────────────
export function calcFocusScore(log) {
  return Math.min(100, Math.round(
    ((log.focus_minutes      || 0) / 90) * 60 +
    ((log.reading_minutes    || 0) / 30) * 25 +
    ((log.meditation_minutes || 0) / 10) * 15
  ))
}

// ── LONGEVITY ──────────────────────────────────────────────────────────────────
export function calcLongevityScore(log, fitnessScore, nutritionScore, foods = []) {
  const base = Math.min(100, Math.round(
    (Number(log.sleep_hours || 0) / 8) * 30 +
    fitnessScore   * 0.25 +
    nutritionScore * 0.25 +
    Math.min((log.water_ml || 0) / 3000, 1) * 20
  ))
  const fl = calcFoodLongevityScore(foods)
  return fl != null
    ? Math.min(100, Math.round(base * 0.55 + fl * 0.45))
    : base
}

// ── FUTURE SELF SCORE ──────────────────────────────────────────────────────────
export function calcFutureSelfScore(scores, streakDays) {
  const c = 0.7 + (Math.min(streakDays, 100) / 100) * 0.3
  return Math.min(100, Math.round((
    scores.fitness   * 0.25 +
    scores.nutrition * 0.20 +
    scores.energy    * 0.20 +
    scores.focus     * 0.15 +
    scores.longevity * 0.15 +
    scores.mood      * 0.05
  ) * c))
}

// ── BUILD ALL ──────────────────────────────────────────────────────────────────
export function buildAllScores(log, streakDays = 0, foods = []) {
  const fitness   = calcFitnessFromWorkout(log)
  const nutrition = calcNutritionFromServings(log, foods)
  const energy    = calcEnergyFromSleep(log)
  const focus     = calcFocusScore(log)
  const longevity = calcLongevityScore(log, fitness, nutrition, foods)
  const mood      = (log.mood || 5) * 10
  return {
    fitness_score:      fitness,
    nutrition_score:    nutrition,
    energy_score:       energy,
    focus_score:        focus,
    longevity_score:    longevity,
    future_self_score:  calcFutureSelfScore({ fitness, nutrition, energy, focus, longevity, mood }, streakDays),
    mood_score:         mood,
  }
}

// ── SCORE BREAKDOWN ────────────────────────────────────────────────────────────
export function getScoreBreakdown(scores, streakDays) {
  const c = 0.7 + (Math.min(streakDays, 100) / 100) * 0.3
  return [
    { key: 'fitness',   label: 'Fitness',   weight: 0.25, value: scores.fitness   },
    { key: 'nutrition', label: 'Nutrition', weight: 0.20, value: scores.nutrition },
    { key: 'energy',    label: 'Energy',    weight: 0.20, value: scores.energy    },
    { key: 'focus',     label: 'Focus',     weight: 0.15, value: scores.focus     },
    { key: 'longevity', label: 'Longevity', weight: 0.15, value: scores.longevity },
    { key: 'mood',      label: 'Mood',      weight: 0.05, value: scores.mood      },
  ].map((item) => ({
    ...item,
    points:  Math.round(item.value * item.weight * c),
    percent: Math.round(item.weight * c * 100),
  }))
}

// ── XP ─────────────────────────────────────────────────────────────────────────
export function calcXP(log, streakDays, questXP = 0) {
  let base = 0
  if (calcFitnessFromWorkout(log) >= 50 || (log.workout_duration_min || 0) >= 20) base += 25
  if (calcNutritionFromServings(log) >= 50) base += 15
  if (Number(log.sleep_hours) >= 7.5)        base += 20
  if ((log.water_ml      || 0) >= 2500)      base += 10
  if ((log.focus_minutes || 0) >= 60)        base += 20
  if ((log.reading_minutes  || 0) >= 20)     base += 15
  if ((log.meditation_minutes || 0) >= 10)   base += 10
  if (log.is_perfect_day)                    base += 50
  return base + Math.floor(streakDays / 7) * 5 + questXP
}

// ── PERFECT DAY ────────────────────────────────────────────────────────────────
export function isPerfectDay(log) {
  const s = buildAllScores(log, 0)
  return (
    s.nutrition_score >= 55 &&
    s.fitness_score   >= 50 &&
    Number(log.sleep_hours) >= 7 &&
    (log.mood     || 0) >= 7 &&
    (log.water_ml || 0) >= 2000
  )
}

// ── LEVEL UTILS ────────────────────────────────────────────────────────────────
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
  return level <= 1 ? 0 : Math.floor(100 * Math.pow(level - 1, 1.8))
}

export function getXPForNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.8))
}

export function calcProjection(recentScores, daysAhead) {
  if (!recentScores || recentScores.length < 3) return null
  let ema = recentScores[0]
  for (const s of recentScores) ema = 0.1 * s + 0.9 * ema
  const last7   = recentScores.slice(0, 7)
  const prev7   = recentScores.slice(7, 14)
  const avg7    = last7.reduce((a, b) => a + b, 0) / last7.length
  const avgPrev = prev7.length ? prev7.reduce((a, b) => a + b, 0) / prev7.length : avg7
  const momentum = (avg7 - avgPrev) / 7
  const decay    = Math.max(0, (ema - 70) / 100)
  return Math.round(Math.min(99, Math.max(ema - 5, ema + momentum * daysAhead * (1 - decay))))
}