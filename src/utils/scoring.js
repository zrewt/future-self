// ── LEGACY HELPERS ─────────────────────────────────────────────────────────────
function legacyNutrition(log) {
  return Math.min(100, Math.round((log.meal_quality || 0) * 0.6 + ((log.water_ml || 0) / 3000) * 40))
}
function legacyFitness(log) {
  return Math.min(100, Math.round((log.exercise_intensity || 0) * 0.7 + (log.sleep_quality || 5) * 3))
}

// ── FOOD TIER SYSTEM ───────────────────────────────────────────────────────────
// Tiers align with NOVA processing groups, Blue Zone staples, Mediterranean /
// DASH patterns, and WHO guidance on processed meat & ultra-processed foods.
// Scoring is additive — healthy foods always raise your score; only UPF drags down.

const TIER_1_SUPERFOODS = new Set([
  // Fatty fish — omega-3, PREDIMED / cardiovascular evidence
  'salmon','sardine','mackerel','herring','anchov',
  // Dark leafy greens — micronutrient density
  'kale','spinach','swiss chard','collard','watercress','arugula',
  // Berries — polyphenols, cognitive / cardiometabolic research
  'blueberr','strawberr','raspberry','blackberr','acai',
  // Nuts — Blue Zone staple
  'walnut','almond',
  // Cruciferous — sulforaphane, strong whole-food evidence
  'broccoli','brussels','cabbage','cauliflower',
  // Legumes — Blue Zone #1 protein source
  'lentil','chickpea','black bean','kidney bean','navy bean','edamame',
  // Alliums
  'garlic',
  // Other high-evidence whole foods
  'avocado','olive','turmeric','ginger','quinoa','sweet potato',
  'pomegranate','cherry',
])

const TIER_2_EXCELLENT = new Set([
  // Vegetables
  'asparagus','zucchini','cucumber','celery','carrot','bell pepper',
  'onion','leek','beet','artichoke','lettuce','romaine',
  'green pea','corn','squash','eggplant','mushroom','tomato',
  // Fruits
  'apple','orange','mango','pineapple','kiwi','peach','pear','plum',
  'grape','watermelon','cantaloupe','apricot','fig','date','banana',
  // Nuts & seeds
  'cashew','pistachio','pecan','hazelnut','brazil nut',
  'chia','flaxseed','hemp seed','pumpkin seed','sunflower seed',
  // Seafood & lean poultry — DASH / Mediterranean protein sources
  'cod','tilapia','shrimp','crab','lobster','oyster','clam','scallop','tuna',
  'chicken breast','chicken thigh','turkey breast','turkey',
  // Whole grains & fermented foods
  'oat','brown rice','whole wheat','whole grain','barley','farro',
  'buckwheat','millet','rye',
  'greek yogurt','kefir','kimchi','sauerkraut','miso','tempeh','tofu',
  'pea','pinto bean','white bean','fava bean','soy',
  // Eggs & lean dairy — nutrient-dense, minimally processed
  'egg','egg white','cottage cheese','mozzarella',
])

// Quality tier 2, but longevity tier 3 — fine protein, weak Blue Zone / anti-inflammatory signal
const LONGEVITY_ANIMAL_PROTEIN = new Set([
  'egg','egg white','chicken breast','chicken thigh','turkey breast','turkey',
  'cod','tilapia','shrimp','crab','lobster','oyster','clam','scallop','tuna',
  'sirloin','tenderloin','pork loin','ground beef','cottage cheese','mozzarella',
  'greek yogurt','yogurt','milk','whey','protein shake','protein powder',
])

const TIER_3_GOOD = new Set([
  // Lean red meat — fine in moderation (Mediterranean pattern)
  'sirloin','tenderloin','pork loin','ground beef',
  // Dairy
  'yogurt','milk',
  // Refined grains & starchy sides
  'white rice','pasta','bread','tortilla','potato',
  // Supplements / shakes
  'protein shake','protein powder','whey',
])

const TIER_4_LIMIT = new Set([
  // Higher-fat dairy & red meat — limit per WHO / AHA guidance
  'cheddar','cheese','cream cheese','butter','sour cream',
  'beef','steak','lamb','pork','ham','bacon',
  'popcorn','cracker','pretzel',
  'orange juice','juice',
  'white bread','pancake','waffle',
])

const TIER_5_KEYWORDS = [
  'chips','soda','cola','cookie','cake','pizza','burger','fries',
  'donut','candy','chocolate bar','ice cream','hot dog','nachos',
  'fried chicken','muffin','brownie','nugget','taco bell',
  'fast food','energy drink','pop tart','twinkie','doritos',
]

const SUPERFOOD_BONUS_KEYWORDS = [
  'salmon','sardine','mackerel','blueberr','walnut','kale','spinach',
  'broccoli','lentil','chickpea','black bean','garlic','turmeric',
  'ginger','avocado','olive','quinoa','sweet potato','tomato',
  'strawberr','raspberry',
]

// Additive points per logged item (not averaged — adding healthy food never lowers score)
const TIER_QUALITY_GAIN   = { 1: 34, 2: 24, 3: 16, 4: 5,  5: 0 }
const TIER_UPF_PENALTY    = { 1: 0,  2: 0,  3: 0,  4: 0,  5: 38 }

const MEAL_QUALITY_BASE     = 42
const SUPERFOOD_BONUS       = 8
const BALANCED_MEAL_BONUS   = 8   // produce + protein on same day (Healthy Eating Plate)
const VARIETY_BONUS_PER     = 4   // per unique tier-1/2 food, max 12

// Longevity uses its own tiers — plant-forward, Blue Zone weighted; 90+ needs diverse plants
const LONGEVITY_TIER_GAIN     = { 1: 22, 2: 14, 3: 14, 4: 2,  5: 0 }
const LONGEVITY_SUPER_BONUS   = 6
const LONGEVITY_BASE          = 45
const LONGEVITY_VARIETY_PER   = 5   // per unique plant food (tier 1–2), max 15
const LONGEVITY_PLANT_BONUS   = { 2: 6, 3: 12, 4: 18 } // 2+, 3+, 4+ plant foods
const LONGEVITY_SINGLE_CAP    = { 1: 82, 2: 72, 3: 62, 4: 48, 5: 12 }

function classifyFood(food) {
  const name = (food.name || '').toLowerCase()
  const key  = food.servingKey || ''

  if (name.includes('eggplant')) return 2

  if (key === 'processed_servings') return 5
  if (TIER_5_KEYWORDS.some((kw) => name.includes(kw))) return 5

  for (const kw of TIER_1_SUPERFOODS) { if (name.includes(kw)) return 1 }
  for (const kw of TIER_2_EXCELLENT)  { if (name.includes(kw)) return 2 }
  for (const kw of TIER_3_GOOD)       { if (name.includes(kw)) return 3 }
  for (const kw of TIER_4_LIMIT)      { if (name.includes(kw)) return 4 }

  if (key === 'vegetable_servings') return 2
  if (key === 'fruit_servings')     return 2
  if (key === 'protein_servings')   return 2

  return 3
}

function isSuperfood(name) {
  const n = (name || '').toLowerCase()
  return SUPERFOOD_BONUS_KEYWORDS.some((kw) => n.includes(kw))
}

function isAnimalProteinName(name) {
  const n = (name || '').toLowerCase()
  if (n.includes('eggplant')) return false

  for (const kw of LONGEVITY_ANIMAL_PROTEIN) {
    if (kw === 'egg' || kw === 'egg white') {
      if (n.includes('egg white')) return true
      if (/\begg\b/.test(n)) return true
      continue
    }
    if (n.includes(kw)) return true
  }
  return false
}

function isPlantFood(food) {
  const key = food.servingKey
  if (key === 'vegetable_servings' || key === 'fruit_servings') return true
  if (isAnimalProteinName(food.name)) return false
  return classifyLongevityTier(food) <= 2
}

function classifyLongevityTier(food) {
  const name = (food.name || '').toLowerCase()
  const key  = food.servingKey || ''

  if (name.includes('eggplant')) return 2

  if (key === 'processed_servings') return 5
  if (TIER_5_KEYWORDS.some((kw) => name.includes(kw))) return 5

  for (const kw of TIER_1_SUPERFOODS) { if (name.includes(kw)) return 1 }
  for (const kw of TIER_2_EXCELLENT) {
    if (name.includes(kw) && !isAnimalProteinName(name)) return 2
  }
  if (isAnimalProteinName(name)) return 3
  if (classifyFood(food) === 3) return 3
  if (classifyFood(food) === 4) return 4

  if (key === 'vegetable_servings' || key === 'fruit_servings') return 2
  if (key === 'protein_servings') return 3

  return 3
}

function effectiveQty(qty) {
  const q = qty ?? 1
  if (q <= 1) return 1
  return 1 + (q - 1) * 0.55
}

function hasProduce(foods) {
  return foods.some((f) => {
    const key = f.servingKey
    if (key === 'vegetable_servings' || key === 'fruit_servings') return true
    const tier = classifyFood(f)
    return tier <= 2 && key !== 'protein_servings'
  })
}

function hasProteinSource(foods) {
  return foods.some((f) => {
    if (f.servingKey === 'protein_servings') return true
    const tier = classifyFood(f)
    return tier <= 3 && !['vegetable_servings', 'fruit_servings'].includes(f.servingKey)
  })
}

function scoreFoods(foods, { base, tierGain, upfPenalty, superBonus, balancedBonus }) {
  let score = base
  let penalty = 0
  const seenNames = new Set()

  for (const food of foods) {
    const tier = classifyFood(food)
    const qty  = effectiveQty(food.qty)
    const nameKey = (food.name || '').toLowerCase().trim()
    const repeatFactor = seenNames.has(nameKey) ? 0.65 : 1
    seenNames.add(nameKey)

    if (tier === 5) {
      penalty += upfPenalty * qty
      continue
    }

    score += tierGain[tier] * qty * repeatFactor
    if (superBonus && isSuperfood(food.name) && tier <= 2) {
      score += superBonus * Math.min(qty, 1.5)
    }
  }

  const goodFoods = foods.filter((f) => classifyFood(f) <= 2)
  const uniqueGood = new Set(goodFoods.map((f) => (f.name || '').toLowerCase().trim()))
  score += Math.min(12, uniqueGood.size * VARIETY_BONUS_PER)

  if (balancedBonus && hasProduce(foods) && hasProteinSource(foods)) {
    score += balancedBonus
  }

  return Math.min(100, Math.max(0, Math.round(score - penalty)))
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
// Additive model: each whole food adds points; ultra-processed subtracts.
// Adding chicken breast or broccoli always increases (or holds) your score.
export function calcFoodQualityScore(foods) {
  if (!foods?.length) return null
  const real = foods.filter((f) => f.name)
  if (!real.length) return null

  return scoreFoods(real, {
    base: MEAL_QUALITY_BASE,
    tierGain: TIER_QUALITY_GAIN,
    upfPenalty: TIER_UPF_PENALTY[5],
    superBonus: SUPERFOOD_BONUS,
    balancedBonus: BALANCED_MEAL_BONUS,
  })
}

// ── FOOD LONGEVITY SCORE (0–100) ───────────────────────────────────────────────
// Plant-forward & Blue Zone weighted. One egg ≈ low-60s; 90+ needs diverse plants.
export function calcFoodLongevityScore(foods) {
  if (!foods?.length) return null
  const real = foods.filter((f) => f.name)
  if (!real.length) return null

  let score = LONGEVITY_BASE
  let penalty = 0
  const seenPlants = new Set()

  for (const food of real) {
    const tier = classifyLongevityTier(food)
    const qty  = effectiveQty(food.qty)

    if (tier === 5) {
      penalty += (TIER_UPF_PENALTY[5] + 6) * qty
      continue
    }

    score += LONGEVITY_TIER_GAIN[tier] * qty
    if (isSuperfood(food.name) && tier === 1) {
      score += LONGEVITY_SUPER_BONUS * Math.min(qty, 1.5)
    }

    if (isPlantFood(food)) {
      seenPlants.add((food.name || '').toLowerCase().trim())
    }
  }

  const plantCount = seenPlants.size
  score += Math.min(15, plantCount * LONGEVITY_VARIETY_PER)
  if (plantCount >= 4) score += LONGEVITY_PLANT_BONUS[4]
  else if (plantCount >= 3) score += LONGEVITY_PLANT_BONUS[3]
  else if (plantCount >= 2) score += LONGEVITY_PLANT_BONUS[2]

  // Animal protein alongside plants — small bonus only with 2+ plant foods
  const hasAnimal = real.some((f) => isAnimalProteinName(f.name) || f.servingKey === 'protein_servings')
  if (hasAnimal && plantCount >= 2) score += 4

  score -= penalty

  if (real.length === 1) {
    const onlyTier = classifyLongevityTier(real[0])
    score = Math.min(score, LONGEVITY_SINGLE_CAP[onlyTier] ?? 64)
  } else if (plantCount < 2) {
    score = Math.min(score, 78)
  } else if (plantCount < 3) {
    score = Math.min(score, 88)
  }

  return Math.min(100, Math.max(0, Math.round(score)))
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
function calcServingNutrition(log) {
  const fruit     = log.fruit_servings     ?? 0
  const veg       = log.vegetable_servings ?? 0
  const protein   = log.protein_servings   ?? 0
  const processed = log.processed_servings ?? 0

  if (fruit + veg + protein + processed === 0 && (log.meal_quality || 0) > 0) {
    return legacyNutrition(log)
  }

  return Math.min(100, Math.max(0, Math.round(
    (Math.min(fruit,     3) / 3) * 25 +
    (Math.min(veg,       4) / 4) * 30 +
    (Math.min(protein,   3) / 3) * 30 +
    Math.min((log.water_ml || 0) / 2500, 1) * 15 -
    Math.min(processed, 5) * 8
  )))
}

export function calcNutritionFromServings(log, foods = []) {
  const servingScore = calcServingNutrition(log)
  const fq = calcFoodQualityScore(foods)

  if (fq == null) return servingScore

  // Food log is primary when present; never let a healthy add-on drag below serving progress
  const blended = Math.round(servingScore * 0.25 + fq * 0.75)
  return Math.min(100, Math.max(servingScore, blended))
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