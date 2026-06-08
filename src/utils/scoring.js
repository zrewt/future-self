// ── LEGACY HELPERS ─────────────────────────────────────────────────────────────
function legacyNutrition(log) {
  return Math.min(100, Math.round((log.meal_quality || 0) * 0.6 + ((log.water_ml || 0) / 3000) * 40))
}
function legacyFitness(log) {
  return Math.min(100, Math.round((log.exercise_intensity || 0) * 0.7 + (log.sleep_quality || 5) * 3))
}

// ── FOOD TIER SYSTEM ───────────────────────────────────────────────────────────
// Arrays not Sets — so name.includes() works correctly
// Tier 1 = superfoods / Blue Zone staples        → base 90pts quality, 92pts longevity
// Tier 2 = excellent whole foods                 → base 76pts quality, 76pts longevity
// Tier 3 = good whole foods / lean proteins      → base 60pts quality, 55pts longevity
// Tier 4 = neutral / minimally processed         → base 38pts quality, 30pts longevity
// Tier 5 = ultra-processed / junk                → base 8pts  quality, 5pts  longevity

const TIER_1 = [
  'salmon','sardine','mackerel','herring',
  'kale','spinach','swiss chard','collard greens',
  'blueberr','strawberr','raspberry','blackberr','acai',
  'walnut',
  'broccoli','brussels sprout',
  'lentil','chickpea','black bean','kidney bean','navy bean','edamame',
  'garlic',
  'avocado','olive oil','turmeric','ginger','quinoa','sweet potato',
  'mushroom','tomato','pomegranate','cherry','tuna','sardines',
]

const TIER_2 = [
  'cauliflower','cabbage','asparagus','zucchini','cucumber','celery',
  'carrot','bell pepper','onion','leek','beet','artichoke',
  'lettuce','romaine','arugula','green pea','corn','squash','eggplant',
  'apple','orange','mango','pineapple','kiwi','peach','pear','plum',
  'grape','watermelon','cantaloupe','banana','fig','date',
  'almond','cashew','pistachio','pecan','brazil nut',
  'chia','flaxseed','pumpkin seed','sunflower seed',
  'cod','tilapia','shrimp','crab','oyster','scallop',
  'oat','brown rice','whole wheat','barley','farro','buckwheat',
  'greek yogurt','kefir','tempeh','tofu',
  'pinto bean','white bean','fava bean',
]

const TIER_3 = [
  'chicken breast','chicken thigh','turkey breast','turkey',
  'sirloin','tenderloin','pork loin',
  'egg white','whole egg','egg',
  'cottage cheese','yogurt','milk','mozzarella',
  'white rice','pasta','bread','tortilla','potato',
  'protein shake','protein powder','whey',
  'beef','ground beef','lamb','pork',
]

const TIER_4 = [
  'cheddar','cream cheese','butter','sour cream',
  'ham','bacon','sausage',
  'white bread','pancake','waffle','bagel',
  'orange juice','juice','sports drink',
  'cracker','pretzel',
]

const TIER_5 = [
  'chips','potato chips','soda','cola','diet coke','pepsi',
  'cookie','cake','pizza','burger','french fries','fries',
  'donut','candy','milk chocolate','ice cream','hot dog',
  'nachos','fried chicken','muffin','brownie','nugget',
  'energy drink','pop tart','popcorn','buttered popcorn',
]

const SUPERFOODS = [
  'salmon','sardine','mackerel','blueberr','walnut','kale','spinach',
  'broccoli','lentil','chickpea','black bean','garlic','turmeric',
  'ginger','avocado','olive oil','quinoa','sweet potato','tomato',
  'strawberr','raspberry','edamame','tempeh','brussels sprout',
]

function classifyFood(food) {
  const name = (food.name || '').toLowerCase()
  const key  = food.servingKey || ''

  // Processed category always Tier 5
  if (key === 'processed_servings') return 5

  // Check Tier 5 first — explicit junk overrides everything
  if (TIER_5.some((kw) => name.includes(kw))) return 5
  if (TIER_4.some((kw) => name.includes(kw))) return 4
  if (TIER_1.some((kw) => name.includes(kw))) return 1
  if (TIER_2.some((kw) => name.includes(kw))) return 2
  if (TIER_3.some((kw) => name.includes(kw))) return 3

  // Category fallbacks for unrecognised names
  if (key === 'vegetable_servings') return 2
  if (key === 'fruit_servings')     return 2
  if (key === 'protein_servings')   return 3

  return 4
}

function isSuperfood(name) {
  const n = (name || '').toLowerCase()
  return SUPERFOODS.some((kw) => n.includes(kw))
}

const TIER_QUALITY   = { 1: 90, 2: 76, 3: 60, 4: 38, 5: 8 }
const TIER_LONGEVITY = { 1: 92, 2: 76, 3: 55, 4: 30, 5: 5 }

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

// ── FOOD QUALITY SCORE (0–100) ─────────────────────────────────────────────────
// Weighted average of tier scores — each food weighted by qty
// Greek yogurt alone: Tier 2 = 76. Add pizza: drags average toward 8.
// Add 4+ good foods: small variety bonus.
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

  // Variety bonus: 3+ distinct Tier 1/2 foods = +3pts, 5+ = +5pts
  const goodNames = new Set(
    real.filter((f) => classifyFood(f) <= 2).map((f) => f.name?.toLowerCase().slice(0, 8))
  )
  const varietyBonus = goodNames.size >= 5 ? 5 : goodNames.size >= 3 ? 3 : 0

  return Math.min(100, Math.max(0, Math.round(total / weight) + varietyBonus))
}

// ── FOOD LONGEVITY SCORE (0–100) ───────────────────────────────────────────────
// Same weighted average using longevity-specific tier scores
// Superfood density adds up to +6 bonus on top
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

  const base     = Math.round(total / weight)
  const sfBonus  = Math.round(Math.min(sfQty / weight, 1) * 6)
  const upfExtra = Math.round((upfQty / weight) * 10) // extra penalty on top of tier score

  return Math.min(100, Math.max(0, base + sfBonus - upfExtra))
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