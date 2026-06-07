// ── LEGACY HELPERS ─────────────────────────────────────────────────────────────
function legacyNutrition(log) {
  return Math.min(100, Math.round((log.meal_quality || 0) * 0.6 + ((log.water_ml || 0) / 3000) * 40))
}
function legacyFitness(log) {
  return Math.min(100, Math.round((log.exercise_intensity || 0) * 0.7 + (log.sleep_quality || 5) * 3))
}

// ── FOOD TIER SYSTEM ───────────────────────────────────────────────────────────
// 5 tiers based on nutritional research consensus. Fast O(n) lookup.
// Tier 1 = 90pts base (superfoods / Blue Zone staples)
// Tier 2 = 78pts (excellent whole foods)
// Tier 3 = 62pts (good whole foods / lean proteins)
// Tier 4 = 40pts (neutral / minimally processed)
// Tier 5 = 10pts (ultra-processed / junk)

const TIER_1_SUPERFOODS = new Set([
  // Fatty fish (omega-3, longevity champion)
  'salmon','sardine','mackerel','tuna',
  // Dark leafy greens
  'kale','spinach','swiss chard','collard',
  // Berries (antioxidants, telomere research)
  'blueberr','strawberr','raspberry','blackberr','acai',
  // Longevity nuts
  'walnut',
  // Cruciferous
  'broccoli',
  // Legumes (Blue Zone staple #1)
  'lentil','chickpea','black bean','kidney bean','navy bean','edamame',
  // Alliums
  'garlic',
  // Specific superfoods
  'avocado','olive','turmeric','ginger','quinoa','sweet potato',
  'mushroom','tomato','pomegranate','cherry',
])

const TIER_2_EXCELLENT = new Set([
  // All other vegetables
  'broccoli','cauliflower','cabbage','brussels','asparagus','zucchini',
  'cucumber','celery','carrot','bell pepper','pepper','onion','leek',
  'beet','artichoke','lettuce','romaine','arugula','watercress',
  'green pea','corn','squash','eggplant',
  // Other fruits
  'apple','orange','mango','pineapple','kiwi','peach','pear','plum',
  'grape','watermelon','cantaloupe','apricot','fig','date','banana',
  // Nuts and seeds
  'almond','cashew','pistachio','pecan','hazelnut','brazil nut',
  'chia','flaxseed','hemp seed','pumpkin seed','sunflower seed',
  // Other fish / seafood
  'cod','tilapia','shrimp','crab','lobster','oyster','clam','scallop',
  // Whole grains
  'oat','brown rice','whole wheat','whole grain','barley','farro',
  'buckwheat','millet','rye',
  // Fermented / probiotic
  'greek yogurt','kefir','kimchi','sauerkraut','miso','tempeh','tofu',
  // Other legumes
  'pea','pinto bean','white bean','fava bean','soy',
])

const TIER_3_GOOD = new Set([
  // Lean poultry
  'chicken breast','chicken thigh','turkey breast','turkey',
  // Lean red meat
  'sirloin','tenderloin','pork loin',
  // Eggs
  'egg',
  // Dairy
  'cottage cheese','greek yogurt','yogurt','milk','mozzarella',
  // Refined grains (not whole)
  'white rice','pasta','bread','tortilla','potato',
  // Other protein
  'protein shake','protein powder','whey',
])

const TIER_4_NEUTRAL = new Set([
  // Higher fat dairy
  'cheddar','cheese','cream cheese','butter','sour cream',
  // Processed meats (light)
  'ground beef','beef','lamb','pork','ham','bacon',
  // Refined snacks (mild)
  'popcorn','cracker','pretzels',
  // Sugary drinks
  'orange juice','juice',
  // Other
  'white bread','pancake','waffle',
])

// Everything in processed_servings category + these keywords = Tier 5
const TIER_5_KEYWORDS = [
  'chips','soda','cola','cookie','cake','pizza','burger','fries',
  'donut','candy','chocolate','ice cream','hot dog','nachos',
  'fried chicken','muffin','brownie','nugget','taco bell',
  'fast food','energy drink','pop tart',
]

// Superfood bonus — these foods get an extra longevity boost on top of their tier
const SUPERFOOD_BONUS_KEYWORDS = [
  'salmon','sardine','mackerel','blueberr','walnut','kale','spinach',
  'broccoli','lentil','chickpea','black bean','garlic','turmeric',
  'ginger','avocado','olive','quinoa','sweet potato','tomato',
  'strawberr','raspberry','green tea','dark chocolate',
]

function classifyFood(food) {
  const name = (food.name || '').toLowerCase()
  const key  = food.servingKey || ''

  // Ultra-processed category always Tier 5
  if (key === 'processed_servings') return 5
  if (TIER_5_KEYWORDS.some((kw) => name.includes(kw))) return 5

  // Check tiers in order
  for (const kw of TIER_1_SUPERFOODS) { if (name.includes(kw)) return 1 }
  for (const kw of TIER_2_EXCELLENT)  { if (name.includes(kw)) return 2 }
  for (const kw of TIER_3_GOOD)       { if (name.includes(kw)) return 3 }
  for (const kw of TIER_4_NEUTRAL)    { if (name.includes(kw)) return 4 }

  // Category fallbacks for unrecognised foods
  if (key === 'vegetable_servings') return 2
  if (key === 'fruit_servings')     return 2
  if (key === 'protein_servings')   return 3

  return 4 // unknown = neutral
}

const TIER_QUALITY_SCORE = { 1: 92, 2: 78, 3: 62, 4: 38, 5: 8 }
const TIER_LONGEVITY_SCORE = { 1: 95, 2: 80, 3: 58, 4: 32, 5: 5 }

function isSuperfood(name) {
  const n = (name || '').toLowerCase()
  return SUPERFOOD_BONUS_KEYWORDS.some((kw) => n.includes(kw))
}

// ── MACRO HELPERS ──────────────────────────────────────────────────────────────
function getServingMacros(food) {
  const factor = ((food.servingG ?? 150) / 100) * (food.qty ?? 1)
  return {
    cal:  (food.calories ?? 0) * factor,
    pro:  (food.protein  ?? 0) * factor,
    carb: (food.carbs    ?? 0) * factor,
    fat:  (food.fat      ?? 0) * factor,
  }
}

// ── FOOD QUALITY SCORE (0–100) ─────────────────────────────────────────────────
// Weighted average of tier scores across all foods
// Superfoods get +6 bonus, UPF drag the average down hard
export function calcFoodQualityScore(foods) {
  if (!foods?.length) return null
  const real = foods.filter((f) => f.name)
  if (!real.length) return null

  let total = 0, weight = 0

  for (const food of real) {
    const qty   = food.qty ?? 1
    const tier  = classifyFood(food)
    let score   = TIER_QUALITY_SCORE[tier]

    // Superfood bonus
    if (isSuperfood(food.name)) score = Math.min(100, score + 6)

    // Variety bonus — meal with 4+ different tier-1/2 foods gets +3
    total  += score * qty
    weight += qty
  }

  // Variety bonus: 4+ distinct good foods (tier 1 or 2) adds 4 pts to the whole meal
  const goodFoods = real.filter((f) => classifyFood(f) <= 2)
  const uniqueGoodNames = new Set(goodFoods.map((f) => f.name?.toLowerCase().trim()))
  const varietyBonus = uniqueGoodNames.size >= 4 ? 4 : uniqueGoodNames.size >= 2 ? 2 : 0

  const base = weight > 0 ? Math.round(total / weight) : 0
  return Math.min(100, Math.max(0, base + varietyBonus))
}

// ── FOOD LONGEVITY SCORE (0–100) ───────────────────────────────────────────────
// Based on: tier longevity scores + superfood density + UPF penalty
// Chicken breast (tier 3) gets 58 — good, not great, which is accurate
// Salmon + broccoli + blueberries gets 90+ — which the research supports
export function calcFoodLongevityScore(foods) {
  if (!foods?.length) return null
  const real = foods.filter((f) => f.name)
  if (!real.length) return null

  let total = 0, weight = 0
  let superfoodQty = 0, totalQty = 0, tier5Qty = 0

  for (const food of real) {
    const qty  = food.qty ?? 1
    const tier = classifyFood(food)
    let score  = TIER_LONGEVITY_SCORE[tier]

    total  += score * qty
    weight += qty
    totalQty += qty

    if (isSuperfood(food.name)) superfoodQty += qty
    if (tier === 5) tier5Qty += qty
  }

  const base = weight > 0 ? Math.round(total / weight) : 0

  // Superfood density bonus (up to +8)
  const sfRatio     = totalQty > 0 ? superfoodQty / totalQty : 0
  const sfBonus     = Math.round(sfRatio * 8)

  // UPF penalty (each UPF item hurts more as proportion grows)
  const upfRatio    = totalQty > 0 ? tier5Qty / totalQty : 0
  const upfPenalty  = Math.round(upfRatio * 15)

  return Math.min(100, Math.max(0, base + sfBonus - upfPenalty))
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
    (Math.min(fruit,     3) / 3) * 25 +
    (Math.min(veg,       4) / 4) * 30 +
    (Math.min(protein,   3) / 3) * 30 +
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
  return Math.min(100, Math.round(Math.min(duration / 45, 1) * 75 * factor + (log.sleep_quality || 5) * 1.5))
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