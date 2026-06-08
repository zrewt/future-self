// ── LEGACY HELPERS ─────────────────────────────────────────────────────────────
function legacyNutrition(log) {
  return Math.min(100, Math.round((log.meal_quality || 0) * 0.6 + ((log.water_ml || 0) / 3000) * 40))
}
function legacyFitness(log) {
  return Math.min(100, Math.round((log.exercise_intensity || 0) * 0.7 + (log.sleep_quality || 5) * 3))
}

// ── FOOD TIER SYSTEM ───────────────────────────────────────────────────────────
// IMPORTANT: Check Tier 1 → 2 → 3 → 4 → 5 in that order.
// More specific keywords first so 'chicken breast' never matches 'fried chicken'.

const TIER_1 = [
  // Fatty fish
  'salmon', 'sardine', 'mackerel', 'herring',
  // Dark leafy greens
  'kale', 'spinach', 'swiss chard', 'collard green',
  // Berries
  'blueberri', 'blueberry', 'strawberri', 'strawberry',
  'raspberry', 'blackberri', 'blackberry', 'acai',
  // Longevity nuts
  'walnut',
  // Cruciferous
  'broccoli', 'brussels sprout',
  // Legumes
  'lentil', 'chickpea', 'black bean', 'kidney bean', 'navy bean', 'edamame',
  // Alliums
  'garlic',
  // Superfoods
  'avocado', 'olive oil', 'turmeric', 'ginger', 'quinoa', 'sweet potato',
  'mushroom', 'tomato', 'pomegranate', 'tuna',
]

const TIER_2 = [
  // Vegetables
  'cauliflower', 'cabbage', 'asparagus', 'zucchini', 'cucumber', 'celery',
  'carrot', 'bell pepper', 'onion', 'leek', 'beet', 'artichoke',
  'lettuce', 'romaine', 'arugula', 'green pea', 'corn', 'squash', 'eggplant',
  // Fruits
  'apple', 'orange', 'mango', 'pineapple', 'kiwi', 'peach', 'pear', 'plum',
  'grape', 'watermelon', 'cantaloupe', 'banana', 'fig', 'date', 'cherry',
  // Nuts and seeds
  'almond', 'cashew', 'pistachio', 'pecan', 'brazil nut',
  'chia seed', 'flaxseed', 'pumpkin seed', 'sunflower seed',
  // Seafood
  'cod', 'tilapia', 'shrimp', 'crab', 'oyster', 'scallop',
  // Whole grains
  'oat', 'brown rice', 'whole wheat', 'barley', 'farro', 'buckwheat',
  // Fermented / probiotic
  'greek yogurt', 'kefir', 'tempeh', 'tofu',
  // Legumes
  'pinto bean', 'white bean', 'fava bean',
]

const TIER_3 = [
  // Lean poultry — specific first so 'fried chicken' doesn't match here
  'chicken breast', 'chicken thigh', 'turkey breast', 'turkey',
  // Lean meats
  'sirloin steak', 'pork loin', 'lean beef',
  // Eggs
  'egg white', 'whole egg', 'large egg',
  // Dairy
  'cottage cheese', 'yogurt', 'whole milk', 'skim milk', 'mozzarella',
  // Grains
  'white rice', 'pasta', 'whole wheat bread', 'flour tortilla', 'potato',
  'protein shake', 'protein powder', 'whey',
]

const TIER_4 = [
  // Higher fat dairy
  'cheddar cheese', 'cream cheese', 'butter', 'sour cream',
  // Processed meats
  'ground beef', 'lamb', 'pork chop', 'ham', 'bacon', 'sausage',
  // Refined
  'white bread', 'pancake', 'waffle', 'bagel',
  'orange juice', 'sports drink',
  'cracker', 'pretzel',
]

const TIER_5 = [
  // Ultra-processed — specific multi-word first
  'potato chips', 'french fries', 'fried chicken', 'hot dog',
  'milk chocolate', 'dark chocolate',
  'ice cream', 'energy drink', 'pop tart', 'buttered popcorn',
  'chocolate cake', 'chocolate chip cookie',
  'glazed donut', 'blueberry muffin',
  // Then single words
  'chips', 'soda', 'cola', 'cookie', 'cake', 'pizza', 'burger',
  'donut', 'candy', 'nachos', 'muffin', 'brownie',
]

const SUPERFOODS = [
  'salmon', 'sardine', 'mackerel', 'blueberri', 'blueberry',
  'walnut', 'kale', 'spinach', 'broccoli', 'lentil', 'chickpea',
  'black bean', 'garlic', 'turmeric', 'ginger', 'avocado', 'olive oil',
  'quinoa', 'sweet potato', 'tomato', 'strawberri', 'strawberry',
  'raspberry', 'edamame', 'tempeh', 'brussels sprout',
]

// Longest-match wins — more specific keyword beats a shorter one
function findTier(name, tierArr) {
  let matched = false
  let bestLen = 0
  for (const kw of tierArr) {
    if (name.includes(kw) && kw.length > bestLen) {
      matched = true
      bestLen = kw.length
    }
  }
  return matched
}

function classifyFood(food) {
  const name = (food.name || '').toLowerCase()
  const key  = food.servingKey || ''

  // Category shortcut for processed
  if (key === 'processed_servings') return 5

  // Check in order 1 → 2 → 3 → 4 → 5
  // This means 'chicken breast' hits Tier 3 BEFORE Tier 5 ever sees 'chicken'
  if (findTier(name, TIER_1)) return 1
  if (findTier(name, TIER_2)) return 2
  if (findTier(name, TIER_3)) return 3
  if (findTier(name, TIER_4)) return 4
  if (findTier(name, TIER_5)) return 5

  // Category fallbacks for unknown foods
  if (key === 'vegetable_servings') return 2
  if (key === 'fruit_servings')     return 2
  if (key === 'protein_servings')   return 3

  return 4
}

function isSuperfood(name) {
  const n = (name || '').toLowerCase()
  return SUPERFOODS.some((kw) => n.includes(kw))
}

const TIER_QUALITY   = { 1: 90, 2: 76, 3: 62, 4: 38, 5: 8 }
const TIER_LONGEVITY = { 1: 92, 2: 76, 3: 58, 4: 30, 5: 5 }

// ── SERVING MACROS ─────────────────────────────────────────────────────────────
function getServingMacros(food) {
  const factor = ((food.servingG ?? 150) / 100) * (food.qty ?? 1)
  return {
    cal:  (food.calories ?? 0) * factor,
    pro:  (food.protein  ?? 0) * factor,
    carb: (food.carbs    ?? 0) * factor,
    fat:  (food.fat      ?? 0) * factor,
  }
}

// ── FOOD QUALITY SCORE ─────────────────────────────────────────────────────────
export function calcFoodQualityScore(foods) {
  if (!foods?.length) return null
  const real = foods.filter((f) => f.name)
  if (!real.length) return null

  let total = 0, weight = 0

  for (const food of real) {
    const qty  = food.qty ?? 1
    const tier = classifyFood(food)
    let score  = TIER_QUALITY[tier]
    if (isSuperfood(food.name)) score = Math.min(100, score + 5)
    total  += score * qty
    weight += qty
  }

  const goodNames = new Set(
    real
      .filter((f) => classifyFood(f) <= 2)
      .map((f) => (f.name || '').toLowerCase().slice(0, 10))
  )
  const varietyBonus = goodNames.size >= 5 ? 5 : goodNames.size >= 3 ? 3 : 0

  return Math.min(100, Math.max(0, Math.round(total / weight) + varietyBonus))
}

// ── FOOD LONGEVITY SCORE ───────────────────────────────────────────────────────
export function calcFoodLongevityScore(foods) {
  if (!foods?.length) return null
  const real = foods.filter((f) => f.name)
  if (!real.length) return null

  let total = 0, weight = 0, sfQty = 0, upfQty = 0

  for (const food of real) {
    const qty  = food.qty ?? 1
    const tier = classifyFood(food)
    total  += TIER_LONGEVITY[tier] * qty
    weight += qty
    if (isSuperfood(food.name)) sfQty  += qty
    if (tier === 5)             upfQty += qty
  }

  const base    = Math.round(total / weight)
  const sfBonus = Math.round(Math.min(sfQty / weight, 1) * 6)
  const upfHit  = Math.round((upfQty / weight) * 10)

  return Math.min(100, Math.max(0, base + sfBonus - upfHit))
}

// ── MACRO SUMMARY ──────────────────────────────────────────────────────────────
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
    (Math.min(fruit,   3) / 3) * 25 +
    (Math.min(veg,     4) / 4) * 30 +
    (Math.min(protein, 3) / 3) * 30 +
    Math.min((log.water_ml || 0) / 2500, 1) * 15 -
    Math.min(processed, 5) * 8

  base = Math.min(100, Math.max(0, Math.round(base)))

  const fq = calcFoodQualityScore(foods)
  return fq != null ? Math.min(100, Math.round(base * 0.5 + fq * 0.5)) : base
}

// ── FITNESS ────────────────────────────────────────────────────────────────────
const WORKOUT_FACTOR = { gym: 1, run: 1.1, sport: 1.05, yoga: 0.85, rest: 0.25 }

export function calcFitnessFromWorkout(log) {
  const duration = log.workout_duration_min ?? 0
  const type     = log.exercise_type || 'rest'
  if (duration === 0 && type === 'rest' && !(log.exercise_intensity > 0)) return 0
  if (duration === 0 && (log.exercise_intensity || 0) > 0) return legacyFitness(log)
  const factor = WORKOUT_FACTOR[type] ?? 0.5
  return Math.min(100, Math.round(
    Math.min(duration / 45, 1) * 75 * factor + (log.sleep_quality || 5) * 1.5
  ))
}

// ── ENERGY ─────────────────────────────────────────────────────────────────────
export function calcEnergyFromSleep(log) {
  return Math.min(100, Math.round(
    (Number(log.sleep_hours || 0) / 8) * 50 +
    (log.sleep_quality || 5) * 4 +
    (log.mood || 5) * 2 +
    Math.min((log.water_ml || 0) / 3000, 1) * 15
  ))
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
    fitness_score:     fitness,
    nutrition_score:   nutrition,
    energy_score:      energy,
    focus_score:       focus,
    longevity_score:   longevity,
    future_self_score: calcFutureSelfScore({ fitness, nutrition, energy, focus, longevity, mood }, streakDays),
    mood_score:        mood,
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
  if (Number(log.sleep_hours) >= 7.5)          base += 20
  if ((log.water_ml       || 0) >= 2500)        base += 10
  if ((log.focus_minutes  || 0) >= 60)          base += 20
  if ((log.reading_minutes|| 0) >= 20)          base += 15
  if ((log.meditation_minutes||0) >= 10)        base += 10
  if (log.is_perfect_day)                       base += 50
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

// ── LEVELS ─────────────────────────────────────────────────────────────────────
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