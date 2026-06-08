/**
 * Health & longevity food scoring — transparent rubrics, 100 is rare.
 */

import { getFoodDisplay } from './servingUnits'

// ── Keyword sets ───────────────────────────────────────────────────────────────

const UPF_KEYWORDS = [
  'chips', 'soda', 'cola', 'cookie', 'cake', 'pizza', 'burger', 'fries',
  'donut', 'candy', 'chocolate bar', 'ice cream', 'hot dog', 'nachos',
  'fried chicken', 'muffin', 'brownie', 'nugget', 'protein bar',
  'sugary cereal', 'pop tart', 'fast food', 'energy drink', 'cheeseburger',
  'french fries', 'glazed donut', 'candy bar', 'buttered popcorn',
]

const LEGUME_KEYWORDS = [
  'lentil', 'chickpea', 'black bean', 'kidney bean', 'navy bean', 'pinto bean',
  'white bean', 'fava bean', 'edamame', 'hummus',
]

const WHOLE_GRAIN_KEYWORDS = [
  'oat', 'brown rice', 'quinoa', 'whole wheat', 'whole grain', 'barley',
  'farro', 'buckwheat', 'millet', 'rye', 'bulgur',
]

const REFINED_GRAIN_KEYWORDS = [
  'white rice', 'white bread', 'pasta', 'tortilla', 'bagel', 'croissant',
  'pancake', 'waffle', 'cracker', 'pretzel',
]

const NUT_SEED_KEYWORDS = [
  'walnut', 'almond', 'cashew', 'pistachio', 'pecan', 'chia', 'flax',
  'hemp seed', 'pumpkin seed', 'sunflower seed', 'brazil nut', 'hazelnut',
]

// Whole-food tier weights (quality score — prevents gaming with white rice)
const WHOLE_TIER_VERY_HIGH = LEGUME_KEYWORDS
const WHOLE_TIER_HIGH = [
  ...WHOLE_GRAIN_KEYWORDS,
  ...NUT_SEED_KEYWORDS,
  'blueberr', 'strawberr', 'raspberry', 'blackberr', 'kale', 'spinach',
  'broccoli', 'salmon', 'sardine', 'mackerel', 'avocado', 'sweet potato',
]
const WHOLE_TIER_MODERATE = [
  'apple', 'banana', 'orange', 'mango', 'grape', 'peach', 'pear', 'cherry',
  'carrot', 'tomato', 'cucumber', 'lettuce', 'pepper', 'onion', 'celery',
  'zucchini', 'asparagus', 'cabbage', 'cauliflower', 'mushroom', 'white rice',
  'potato', 'corn', 'tofu', 'tempeh',
]

const MICRONUTRIENT_KEYWORDS = [
  'kale', 'spinach', 'swiss chard', 'collard', 'arugula', 'romaine', 'watercress',
  'blueberr', 'strawberr', 'raspberry', 'blackberr', 'lentil', 'chickpea',
  'black bean', 'salmon', 'sardine', 'mackerel', 'walnut', 'almond', 'broccoli',
]

const HEALTHY_FAT_KEYWORDS = [
  'walnut', 'almond', 'salmon', 'sardine', 'mackerel', 'herring', 'anchov',
  'olive oil', 'avocado', 'chia', 'flax', 'hemp seed', 'pistachio',
]

const ANTI_INFLAM_KEYWORDS = [
  'blueberr', 'strawberr', 'raspberry', 'blackberr', 'kale', 'spinach',
  'olive oil', 'lentil', 'chickpea', 'black bean', 'walnut', 'salmon',
  'sardine', 'broccoli', 'turmeric', 'ginger', 'avocado',
]

const QUALITY_PROTEIN_KEYWORDS = [
  'salmon', 'sardine', 'mackerel', 'tuna', 'cod', 'shrimp', 'fish',
  'greek yogurt', 'yogurt', 'kefir', 'lentil', 'chickpea', 'black bean',
  'kidney bean', 'tofu', 'tempeh', 'turkey', 'chicken breast',
]

const ANIMAL_PROTEIN_KEYWORDS = [
  'egg', 'chicken', 'turkey', 'beef', 'steak', 'pork', 'lamb', 'fish',
  'salmon', 'tuna', 'shrimp', 'cod', 'sardine', 'yogurt', 'cheese', 'milk',
  'whey', 'protein shake', 'cottage',
]

const RED_MEAT_KEYWORDS = [
  'beef', 'steak', 'sirloin', 'ground beef', 'lamb', 'pork', 'bacon', 'ham', 'sausage',
]

const FIBER_PER_100G = [
  ['oat', 10.1], ['blueberr', 2.4], ['walnut', 6.7], ['almond', 12.5],
  ['kale', 3.6], ['spinach', 2.2], ['broccoli', 2.6], ['lentil', 7.9],
  ['chickpea', 7.6], ['black bean', 8.7], ['apple', 2.4], ['quinoa', 2.8],
  ['brown rice', 1.8], ['white rice', 0.4], ['raspberry', 6.5], ['chia', 34.4],
  ['flax', 27.3], ['whole wheat', 7], ['green pea', 5.7],
]

function matchesAny(name, keywords) {
  const n = (name || '').toLowerCase()
  if (n.includes('eggplant')) return false
  return keywords.some((kw) => {
    if (kw === 'egg') return /\begg\b/.test(n)
    return n.includes(kw)
  })
}

function isUltraProcessed(food) {
  if (food.servingKey === 'processed_servings') return true
  return matchesAny(food.name, UPF_KEYWORDS)
}

function isPlant(food) {
  if (food.servingKey === 'vegetable_servings' || food.servingKey === 'fruit_servings') return true
  if (matchesAny(food.name, ANIMAL_PROTEIN_KEYWORDS)) return false
  if (matchesAny(food.name, RED_MEAT_KEYWORDS)) return false
  return matchesAny(food.name, [
    ...WHOLE_TIER_VERY_HIGH, ...WHOLE_TIER_HIGH, ...WHOLE_TIER_MODERATE,
    'garlic', 'ginger', 'turmeric',
  ])
}

function wholeFoodTierPoints(food) {
  const name = food.name || ''
  if (food.servingKey === 'vegetable_servings' || food.servingKey === 'fruit_servings') {
    if (matchesAny(name, ['kale', 'spinach', 'broccoli', 'blueberr'])) return 4
    return 3
  }
  if (matchesAny(name, WHOLE_TIER_VERY_HIGH)) return 5
  if (matchesAny(name, WHOLE_TIER_HIGH)) return 4
  if (matchesAny(name, WHOLE_TIER_MODERATE)) return 2
  return 0
}

function estimateFiberGrams(food) {
  const name = (food.name || '').toLowerCase()
  let per100 = 0

  for (const [kw, val] of FIBER_PER_100G) {
    if (name.includes(kw)) { per100 = val; break }
  }
  if (!per100) {
    if (food.servingKey === 'vegetable_servings') per100 = 2.5
    else if (food.servingKey === 'fruit_servings') per100 = 2
    else if (matchesAny(name, LEGUME_KEYWORDS)) per100 = 7
    else if (matchesAny(name, WHOLE_GRAIN_KEYWORDS)) per100 = 6
    else if (matchesAny(name, NUT_SEED_KEYWORDS)) per100 = 5
    else if (matchesAny(name, REFINED_GRAIN_KEYWORDS)) per100 = 0.5
  }

  const grams = (food.servingG ?? 150) * (food.qty ?? 1)
  return per100 * (grams / 100)
}

function varietyPoints(uniquePlantCount) {
  if (uniquePlantCount >= 9) return 10
  if (uniquePlantCount >= 7) return 8
  if (uniquePlantCount >= 5) return 6
  if (uniquePlantCount >= 3) return 4
  if (uniquePlantCount >= 1) return 2
  return 0
}

function mealTotals(foods) {
  const real = foods.filter((f) => f.name)
  let protein = 0
  let fiber = 0
  let wholePts = 0
  let upfCount = 0
  let microHits = 0
  let fatHits = 0
  let antiHits = 0
  let qualityProteinHits = 0
  let redMeatCount = 0
  let refinedGrainCount = 0
  let animalProteinCount = 0
  let legumeCount = 0
  let wholeGrainCount = 0
  let nutSeedCount = 0
  let vegFruitCount = 0
  const uniquePlants = new Set()
  const wholeSeen = new Set()

  const microSeen = new Set()
  const fatSeen = new Set()
  const antiSeen = new Set()
  const proteinSeen = new Set()

  for (const food of real) {
    const name = (food.name || '').toLowerCase()
    const qty = food.qty ?? 1
    const display = getFoodDisplay(food)

    protein += display.protein
    fiber += estimateFiberGrams(food)

    const tierPts = wholeFoodTierPoints(food)
    if (tierPts > 0) {
      const key = name.trim()
      if (!wholeSeen.has(key)) {
        wholePts += tierPts * Math.min(qty, 2)
        wholeSeen.add(key)
      }
    }

    if (isUltraProcessed(food)) upfCount += qty
    if (matchesAny(name, REFINED_GRAIN_KEYWORDS)) refinedGrainCount += qty
    if (matchesAny(name, LEGUME_KEYWORDS)) legumeCount += qty
    if (matchesAny(name, WHOLE_GRAIN_KEYWORDS)) wholeGrainCount += qty
    if (matchesAny(name, NUT_SEED_KEYWORDS)) nutSeedCount += qty
    if (food.servingKey === 'vegetable_servings' || food.servingKey === 'fruit_servings') {
      vegFruitCount += qty
    } else if (matchesAny(name, ['broccoli', 'kale', 'spinach', 'apple', 'blueberr', 'carrot'])) {
      vegFruitCount += qty
    }
    if (matchesAny(name, ANIMAL_PROTEIN_KEYWORDS)) animalProteinCount += qty

    for (const kw of MICRONUTRIENT_KEYWORDS) {
      if (name.includes(kw) && !microSeen.has(kw)) { microSeen.add(kw); microHits++ }
    }
    for (const kw of HEALTHY_FAT_KEYWORDS) {
      if (name.includes(kw) && !fatSeen.has(kw)) { fatSeen.add(kw); fatHits++ }
    }
    for (const kw of ANTI_INFLAM_KEYWORDS) {
      if (name.includes(kw) && !antiSeen.has(kw)) { antiSeen.add(kw); antiHits++ }
    }
    for (const kw of QUALITY_PROTEIN_KEYWORDS) {
      if (name.includes(kw) && !proteinSeen.has(kw)) { proteinSeen.add(kw); qualityProteinHits++ }
    }
    if (matchesAny(name, RED_MEAT_KEYWORDS)) redMeatCount += qty

    if (isPlant(food)) uniquePlants.add(name.trim())
  }

  return {
    protein, fiber, wholePts, upfCount, microHits, fatHits,
    antiHits, qualityProteinHits, redMeatCount, refinedGrainCount,
    animalProteinCount, legumeCount, wholeGrainCount, nutSeedCount,
    vegFruitCount, uniquePlants: uniquePlants.size,
    itemCount: real.length,
  }
}

function tierProtein(grams) {
  if (grams >= 30) return 20
  if (grams >= 20) return 15
  if (grams >= 10) return 10
  if (grams >= 5)  return 5
  return 0
}

function tierFiber(grams) {
  if (grams >= 10) return 20
  if (grams >= 7)  return 15
  if (grams >= 4)  return 10
  if (grams >= 1)  return 5
  return 0
}

function tierFiberLongevity(grams) {
  if (grams >= 12) return 20
  if (grams >= 9)  return 17
  if (grams >= 6)  return 13
  if (grams >= 3)  return 7
  if (grams >= 1)  return 3
  return 0
}

function sumLines(lines) {
  return lines.reduce((s, l) => s + l.points, 0)
}

function isExceptionalLongevityMeal(t, foods) {
  const hasLegumes = t.legumeCount > 0
  const multiVeg = t.vegFruitCount >= 3 || t.uniquePlants >= 4
  const hasFruit = foods.some((f) =>
    f.servingKey === 'fruit_servings' || matchesAny(f.name, ['apple', 'berr', 'banana', 'orange', 'grape'])
  )
  const hasWholeGrain = t.wholeGrainCount > 0
  const hasNuts = t.nutSeedCount > 0
  const lowAnimal = t.animalProteinCount <= 1
  const highFiber = t.fiber >= 12
  const noRefined = t.refinedGrainCount === 0

  return hasLegumes && multiVeg && hasFruit && hasWholeGrain && hasNuts && lowAnimal && highFiber && noRefined
}

function applyLongevityCaps(raw, t, foods) {
  let score = raw

  if (!t.legumeCount && score > 91) score = Math.min(score, 91)
  if (t.animalProteinCount >= 2 && !t.legumeCount && score > 88) score = Math.min(score, 88)
  if (t.refinedGrainCount > 0 && !t.wholeGrainCount && score > 89) score = Math.min(score, 89)
  if (t.animalProteinCount >= 3 && score > 86) score = Math.min(score, 86)

  if (score > 94 && !isExceptionalLongevityMeal(t, foods)) score = Math.min(score, 94)
  if (score > 97 && !isExceptionalLongevityMeal(t, foods)) score = Math.min(score, 97)
  if (score >= 100 && !isExceptionalLongevityMeal(t, foods)) score = 99

  return Math.max(0, Math.round(score))
}

// ── Food Quality (100 pts) ───────────────────────────────────────────────────

export function calcFoodQualityBreakdown(foods) {
  if (!foods?.length) return null
  const t = mealTotals(foods)
  if (!t.itemCount) return null

  const lines = [
    { label: 'Protein',        points: tierProtein(t.protein),           max: 20 },
    { label: 'Fiber',          points: tierFiber(t.fiber),               max: 20 },
    { label: 'Whole Foods',    points: Math.min(20, t.wholePts),         max: 20 },
    { label: 'Processing',     points: Math.max(0, 20 - Math.round(t.upfCount * 8)), max: 20 },
    { label: 'Micronutrients', points: Math.min(10, Math.round(t.microHits * 2.5)), max: 10 },
    { label: 'Healthy Fats',   points: Math.min(10, Math.round(t.fatHits * 3.5)),   max: 10 },
  ]

  const score = Math.min(100, Math.max(0, sumLines(lines)))
  return { score, lines }
}

export function calcFoodQualityScore(foods) {
  return calcFoodQualityBreakdown(foods)?.score ?? null
}

// ── Longevity (100 pts — 100 is rare) ──────────────────────────────────────────

export function calcFoodLongevityBreakdown(foods) {
  if (!foods?.length) return null
  const t = mealTotals(foods)
  if (!t.itemCount) return null

  const plantPts = Math.min(30, Math.round(t.uniquePlants * 3.5 + Math.min(t.vegFruitCount, 4) * 2))
  const fiberPts = tierFiberLongevity(t.fiber)

  let proteinPts = Math.min(15, t.qualityProteinHits * 4)
  if (t.redMeatCount > 0) proteinPts = Math.max(0, proteinPts - Math.round(t.redMeatCount * 5))

  const antiPts = Math.min(15, t.antiHits * 3)
  const varietyPts = varietyPoints(t.uniquePlants)

  let processingPts = 10
  processingPts -= Math.min(10, Math.round(t.upfCount * 5))

  const deductions = []
  if (t.refinedGrainCount > 0) {
    deductions.push({
      label: 'Refined grains',
      points: -Math.min(8, Math.round(t.refinedGrainCount * 3)),
      max: 0,
      deduction: true,
    })
  }
  if (t.animalProteinCount >= 2 && t.legumeCount === 0) {
    deductions.push({
      label: 'Animal protein load',
      points: -Math.min(8, 3 + Math.round((t.animalProteinCount - 1) * 2)),
      max: 0,
      deduction: true,
    })
  }
  if (t.redMeatCount > 0) {
    deductions.push({
      label: 'Red meat',
      points: -Math.min(6, Math.round(t.redMeatCount * 4)),
      max: 0,
      deduction: true,
    })
  }
  if (!t.legumeCount && t.itemCount >= 3) {
    deductions.push({
      label: 'No legumes',
      points: -3,
      max: 0,
      deduction: true,
    })
  }

  const positiveLines = [
    { label: 'Plants',            points: plantPts,      max: 30 },
    { label: 'Fiber',             points: fiberPts,      max: 20 },
    { label: 'Protein Quality',   points: proteinPts,    max: 15 },
    { label: 'Anti-inflammatory', points: antiPts,       max: 15 },
    { label: 'Variety',           points: varietyPts,    max: 10 },
    { label: 'Processing',        points: processingPts, max: 10 },
  ]

  const lines = [...positiveLines, ...deductions]
  const raw = sumLines(lines)
  const score = applyLongevityCaps(raw, t, foods)

  return { score, lines, raw }
}

export function calcFoodLongevityScore(foods) {
  return calcFoodLongevityBreakdown(foods)?.score ?? null
}

export function calcMealMacroTotals(foods) {
  if (!foods?.length) return null
  const real = foods.filter((f) => f.name && f.calories != null)
  if (!real.length) return null

  return real.reduce(
    (acc, f) => {
      const d = getFoodDisplay(f)
      return {
        calories: acc.calories + d.calories,
        protein:  Math.round((acc.protein + d.protein) * 10) / 10,
        carbs:    Math.round((acc.carbs + d.carbs) * 10) / 10,
        fat:      Math.round((acc.fat + d.fat) * 10) / 10,
        fiber:    Math.round((acc.fiber + estimateFiberGrams(f)) * 10) / 10,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  )
}
