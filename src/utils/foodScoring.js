/**
 * Qyven Food Scoring
 *
 * Two separate scores:
 *
 * 1. Food Quality
 *    - How nutritious is the food actually logged?
 *
 * 2. Food Longevity
 *    - How strongly does the meal align with long-term healthy
 *      dietary patterns?
 *
 * 100 is intentionally rare.
 */

import { getFoodDisplay } from './servingUnits'


// ── KEYWORDS ─────────────────────────────────────────────────────────────────

const UPF_KEYWORDS = [
  'chips',
  'soda',
  'cola',
  'cookie',
  'cake',
  'pizza',
  'burger',
  'fries',
  'donut',
  'candy',
  'chocolate bar',
  'ice cream',
  'hot dog',
  'nachos',
  'fried chicken',
  'muffin',
  'brownie',
  'nugget',
  'protein bar',
  'sugary cereal',
  'pop tart',
  'fast food',
  'energy drink',
  'cheeseburger',
  'french fries',
  'glazed donut',
  'candy bar',
  'buttered popcorn',
]


const LEGUME_KEYWORDS = [
  'lentil',
  'chickpea',
  'black bean',
  'kidney bean',
  'navy bean',
  'pinto bean',
  'white bean',
  'fava bean',
  'edamame',
  'hummus',
]


const WHOLE_GRAIN_KEYWORDS = [
  'oat',
  'brown rice',
  'quinoa',
  'whole wheat',
  'whole grain',
  'barley',
  'farro',
  'buckwheat',
  'millet',
  'rye',
  'bulgur',
]


const REFINED_GRAIN_KEYWORDS = [
  'white rice',
  'white bread',
  'pasta',
  'tortilla',
  'bagel',
  'croissant',
  'pancake',
  'waffle',
  'cracker',
  'pretzel',
]


const NUT_SEED_KEYWORDS = [
  'walnut',
  'almond',
  'cashew',
  'pistachio',
  'pecan',
  'chia',
  'flax',
  'hemp seed',
  'pumpkin seed',
  'sunflower seed',
  'brazil nut',
  'hazelnut',
]


const WHOLE_TIER_VERY_HIGH =
  LEGUME_KEYWORDS


const WHOLE_TIER_HIGH = [
  ...WHOLE_GRAIN_KEYWORDS,
  ...NUT_SEED_KEYWORDS,

  'blueberr',
  'strawberr',
  'raspberry',
  'blackberr',
  'kale',
  'spinach',
  'broccoli',
  'salmon',
  'sardine',
  'mackerel',
  'avocado',
  'sweet potato',
]


const WHOLE_TIER_MODERATE = [
  'apple',
  'banana',
  'orange',
  'mango',
  'grape',
  'peach',
  'pear',
  'cherry',
  'carrot',
  'tomato',
  'cucumber',
  'lettuce',
  'pepper',
  'onion',
  'celery',
  'zucchini',
  'asparagus',
  'cabbage',
  'cauliflower',
  'mushroom',
  'potato',
  'corn',
  'tofu',
  'tempeh',
  'egg',
]


const MICRONUTRIENT_KEYWORDS = [
  'kale',
  'spinach',
  'swiss chard',
  'collard',
  'arugula',
  'romaine',
  'watercress',
  'blueberr',
  'strawberr',
  'raspberry',
  'blackberr',
  'lentil',
  'chickpea',
  'black bean',
  'salmon',
  'sardine',
  'mackerel',
  'walnut',
  'almond',
  'broccoli',
]


const HEALTHY_FAT_KEYWORDS = [
  'walnut',
  'almond',
  'salmon',
  'sardine',
  'mackerel',
  'herring',
  'anchov',
  'olive oil',
  'avocado',
  'chia',
  'flax',
  'hemp seed',
  'pistachio',
]


const ANTI_INFLAM_KEYWORDS = [
  'blueberr',
  'strawberr',
  'raspberry',
  'blackberr',
  'kale',
  'spinach',
  'olive oil',
  'lentil',
  'chickpea',
  'black bean',
  'walnut',
  'salmon',
  'sardine',
  'broccoli',
  'turmeric',
  'ginger',
  'avocado',
]


const QUALITY_PROTEIN_KEYWORDS = [
  'salmon',
  'sardine',
  'mackerel',
  'tuna',
  'cod',
  'shrimp',
  'fish',
  'greek yogurt',
  'yogurt',
  'kefir',
  'lentil',
  'chickpea',
  'black bean',
  'kidney bean',
  'tofu',
  'tempeh',
  'turkey',
  'chicken breast',
  'egg',
]


const HEAVY_ANIMAL_KEYWORDS = [
  'beef',
  'steak',
  'sirloin',
  'ground beef',
  'lamb',
  'pork chop',
  'pork loin',
  'bacon',
  'ham',
  'sausage',
  'hot dog',
  'deli meat',
]


const RED_MEAT_KEYWORDS = [
  'beef',
  'steak',
  'sirloin',
  'ground beef',
  'lamb',
]


const PROCESSED_MEAT_KEYWORDS = [
  'bacon',
  'ham',
  'sausage',
  'hot dog',
  'deli meat',
  'salami',
  'pepperoni',
]


const FIBER_PER_100G = [
  ['oat', 10.1],
  ['blueberr', 2.4],
  ['walnut', 6.7],
  ['almond', 12.5],
  ['kale', 3.6],
  ['spinach', 2.2],
  ['broccoli', 2.6],
  ['lentil', 7.9],
  ['chickpea', 7.6],
  ['black bean', 8.7],
  ['apple', 2.4],
  ['quinoa', 2.8],
  ['brown rice', 1.8],
  ['white rice', 0.4],
  ['raspberry', 6.5],
  ['chia', 34.4],
  ['flax', 27.3],
  ['whole wheat', 7],
  ['green pea', 5.7],
  ['rye', 6.2],
]


// ── MATCHING ─────────────────────────────────────────────────────────────────

function matchesAny(name, keywords) {
  const n =
    (name || '')
      .toLowerCase()

  /*
   * Prevent "eggplant" from being interpreted as egg.
   */
  if (n.includes('eggplant')) {
    return false
  }

  return keywords.some(keyword => {
    if (keyword === 'egg') {
      return /\begg\b/.test(n)
    }

    return n.includes(keyword)
  })
}


// ── FOOD CLASSIFICATION ──────────────────────────────────────────────────────

function isUltraProcessed(food) {
  if (
    food.servingKey ===
    'processed_servings'
  ) {
    return true
  }

  return matchesAny(
    food.name,
    UPF_KEYWORDS
  )
}


function isPlant(food) {
  if (
    food.servingKey ===
      'vegetable_servings' ||
    food.servingKey ===
      'fruit_servings'
  ) {
    return true
  }

  if (
    matchesAny(
      food.name,
      HEAVY_ANIMAL_KEYWORDS
    )
  ) {
    return false
  }

  if (
    matchesAny(
      food.name,
      RED_MEAT_KEYWORDS
    )
  ) {
    return false
  }

  return matchesAny(
    food.name,
    [
      ...WHOLE_TIER_VERY_HIGH,
      ...WHOLE_TIER_HIGH,
      ...WHOLE_TIER_MODERATE,
      'garlic',
      'ginger',
      'turmeric',
    ]
  )
}


function wholeFoodTierPoints(food) {
  const name = food.name || ''

  if (
    food.servingKey ===
      'vegetable_servings' ||
    food.servingKey ===
      'fruit_servings'
  ) {
    if (
      matchesAny(
        name,
        [
          'kale',
          'spinach',
          'broccoli',
          'blueberr',
        ]
      )
    ) {
      return 4
    }

    return 3
  }

  if (
    matchesAny(
      name,
      WHOLE_TIER_VERY_HIGH
    )
  ) {
    return 5
  }

  if (
    matchesAny(
      name,
      WHOLE_TIER_HIGH
    )
  ) {
    return 4
  }

  if (
    matchesAny(
      name,
      WHOLE_TIER_MODERATE
    )
  ) {
    return 2
  }

  return 0
}


// ── FIBER ────────────────────────────────────────────────────────────────────

function estimateFiberGrams(food) {
  const name =
    (food.name || '')
      .toLowerCase()

  let per100 = 0

  for (
    const [keyword, value]
    of FIBER_PER_100G
  ) {
    if (name.includes(keyword)) {
      per100 = value
      break
    }
  }

  if (!per100) {
    if (
      food.servingKey ===
      'vegetable_servings'
    ) {
      per100 = 2.5
    } else if (
      food.servingKey ===
      'fruit_servings'
    ) {
      per100 = 2
    } else if (
      matchesAny(
        name,
        LEGUME_KEYWORDS
      )
    ) {
      per100 = 7
    } else if (
      matchesAny(
        name,
        WHOLE_GRAIN_KEYWORDS
      )
    ) {
      per100 = 6
    } else if (
      matchesAny(
        name,
        NUT_SEED_KEYWORDS
      )
    ) {
      per100 = 5
    } else if (
      matchesAny(
        name,
        REFINED_GRAIN_KEYWORDS
      )
    ) {
      per100 = 0.5
    }
  }

  const grams =
    (food.servingG ?? 150) *
    (food.qty ?? 1)

  return (
    per100 *
    (grams / 100)
  )
}


// ── VARIETY ──────────────────────────────────────────────────────────────────

function varietyPoints(
  uniquePlantCount
) {
  if (uniquePlantCount >= 9) {
    return 10
  }

  if (uniquePlantCount >= 7) {
    return 8
  }

  if (uniquePlantCount >= 5) {
    return 6
  }

  if (uniquePlantCount >= 3) {
    return 4
  }

  if (uniquePlantCount >= 1) {
    return 2
  }

  return 0
}


// ── MEAL TOTALS ──────────────────────────────────────────────────────────────

function mealTotals(foods) {
  const real =
    foods.filter(
      food => food.name
    )

  let protein = 0
  let fiber = 0
  let wholePts = 0
  let upfCount = 0
  let microHits = 0
  let fatHits = 0
  let antiHits = 0
  let qualityProteinHits = 0

  let redMeatCount = 0
  let processedMeatCount = 0
  let refinedGrainCount = 0
  let heavyAnimalCount = 0

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
    const name =
      (food.name || '')
        .toLowerCase()

    const qty =
      Number(food.qty ?? 1)

    const display =
      getFoodDisplay(food)

    protein += display.protein
    fiber += estimateFiberGrams(food)

    const tierPts =
      wholeFoodTierPoints(food)

    if (tierPts > 0) {
      const key = name.trim()

      if (!wholeSeen.has(key)) {
        wholePts +=
          tierPts *
          Math.min(qty, 2)

        wholeSeen.add(key)
      }
    }

    if (
      isUltraProcessed(food)
    ) {
      upfCount += qty
    }

    if (
      matchesAny(
        name,
        REFINED_GRAIN_KEYWORDS
      )
    ) {
      refinedGrainCount += qty
    }

    if (
      matchesAny(
        name,
        LEGUME_KEYWORDS
      )
    ) {
      legumeCount += qty
    }

    if (
      matchesAny(
        name,
        WHOLE_GRAIN_KEYWORDS
      )
    ) {
      wholeGrainCount += qty
    }

    if (
      matchesAny(
        name,
        NUT_SEED_KEYWORDS
      )
    ) {
      nutSeedCount += qty
    }

    if (
      food.servingKey ===
        'vegetable_servings' ||
      food.servingKey ===
        'fruit_servings'
    ) {
      vegFruitCount += qty
    } else if (
      matchesAny(
        name,
        [
          'broccoli',
          'kale',
          'spinach',
          'apple',
          'blueberr',
          'carrot',
        ]
      )
    ) {
      vegFruitCount += qty
    }

    if (
      matchesAny(
        name,
        HEAVY_ANIMAL_KEYWORDS
      )
    ) {
      heavyAnimalCount += qty
    }

    if (
      matchesAny(
        name,
        RED_MEAT_KEYWORDS
      )
    ) {
      redMeatCount += qty
    }

    if (
      matchesAny(
        name,
        PROCESSED_MEAT_KEYWORDS
      )
    ) {
      processedMeatCount += qty
    }

    for (
      const keyword
      of MICRONUTRIENT_KEYWORDS
    ) {
      if (
        name.includes(keyword) &&
        !microSeen.has(keyword)
      ) {
        microSeen.add(keyword)
        microHits++
      }
    }

    for (
      const keyword
      of HEALTHY_FAT_KEYWORDS
    ) {
      if (
        name.includes(keyword) &&
        !fatSeen.has(keyword)
      ) {
        fatSeen.add(keyword)
        fatHits++
      }
    }

    for (
      const keyword
      of ANTI_INFLAM_KEYWORDS
    ) {
      if (
        name.includes(keyword) &&
        !antiSeen.has(keyword)
      ) {
        antiSeen.add(keyword)
        antiHits++
      }
    }

    for (
      const keyword
      of QUALITY_PROTEIN_KEYWORDS
    ) {
      if (
        name.includes(keyword) &&
        !proteinSeen.has(keyword)
      ) {
        proteinSeen.add(keyword)
        qualityProteinHits++
      }
    }

    if (
      isPlant(food)
    ) {
      uniquePlants.add(
        name.trim()
      )
    }
  }

  return {
    protein,
    fiber,
    wholePts,
    upfCount,
    microHits,
    fatHits,
    antiHits,
    qualityProteinHits,
    redMeatCount,
    processedMeatCount,
    refinedGrainCount,
    heavyAnimalCount,
    legumeCount,
    wholeGrainCount,
    nutSeedCount,
    vegFruitCount,
    uniquePlants:
      uniquePlants.size,
    itemCount:
      real.length,
  }
}


// ── POINT TIERS ──────────────────────────────────────────────────────────────

function tierProtein(grams) {
  if (grams >= 30) return 20
  if (grams >= 20) return 15
  if (grams >= 10) return 10
  if (grams >= 5) return 5

  return 0
}


function tierFiber(grams) {
  if (grams >= 10) return 20
  if (grams >= 7) return 15
  if (grams >= 4) return 10
  if (grams >= 1) return 5

  return 0
}


function tierFiberLongevity(grams) {
  if (grams >= 12) return 20
  if (grams >= 9) return 17
  if (grams >= 6) return 13
  if (grams >= 3) return 7
  if (grams >= 1) return 3

  return 0
}


function sumLines(lines) {
  return lines.reduce(
    (sum, line) =>
      sum + line.points,
    0
  )
}


// ── EXCEPTIONAL MEAL ─────────────────────────────────────────────────────────

function isExceptionalLongevityMeal(
  totals,
  foods
) {
  const hasLegumes =
    totals.legumeCount > 0

  const multiVeg =
    totals.vegFruitCount >= 3 ||
    totals.uniquePlants >= 4

  const hasFruit =
    foods.some(food =>
      food.servingKey ===
        'fruit_servings' ||
      matchesAny(
        food.name,
        [
          'apple',
          'berr',
          'banana',
          'orange',
          'grape',
        ]
      )
    )

  const hasWholeGrain =
    totals.wholeGrainCount > 0

  const hasNuts =
    totals.nutSeedCount > 0

  const noHeavyAnimal =
    totals.heavyAnimalCount === 0

  const highFiber =
    totals.fiber >= 12

  const noRefined =
    totals.refinedGrainCount === 0

  return (
    hasLegumes &&
    multiVeg &&
    hasFruit &&
    hasWholeGrain &&
    hasNuts &&
    noHeavyAnimal &&
    highFiber &&
    noRefined
  )
}


// ── LONGEVITY CAPS ───────────────────────────────────────────────────────────

function applyLongevityCaps(
  raw,
  totals,
  foods
) {
  let score = raw

  /*
   * Large meal with no legumes:
   * small ceiling reduction.
   */
  if (
    !totals.legumeCount &&
    totals.itemCount >= 5 &&
    score > 93
  ) {
    score = Math.min(
      score,
      93
    )
  }

  /*
   * Heavy animal protein load.
   */
  if (
    totals.heavyAnimalCount >= 3 &&
    score > 88
  ) {
    score = Math.min(
      score,
      88
    )
  }

  /*
   * 95+ should require an unusually strong meal.
   */
  if (
    score > 95 &&
    !isExceptionalLongevityMeal(
      totals,
      foods
    )
  ) {
    score = Math.min(
      score,
      95
    )
  }

  return Math.max(
    0,
    Math.round(score)
  )
}


// ── FOOD QUALITY ─────────────────────────────────────────────────────────────

export function calcFoodQualityBreakdown(
  foods
) {
  if (!foods?.length) {
    return null
  }

  const totals =
    mealTotals(foods)

  if (!totals.itemCount) {
    return null
  }

  const lines = [
    {
      label: 'Protein',
      points: tierProtein(
        totals.protein
      ),
      max: 20,
    },

    {
      label: 'Fiber',
      points: tierFiber(
        totals.fiber
      ),
      max: 20,
    },

    {
      label: 'Whole Foods',
      points: Math.min(
        20,
        totals.wholePts
      ),
      max: 20,
    },

    {
      label: 'Processing',
      points: Math.max(
        0,
        20 -
          Math.round(
            totals.upfCount * 7
          )
      ),
      max: 20,
    },

    {
      label: 'Micronutrients',
      points: Math.min(
        10,
        Math.round(
          totals.microHits * 2.5
        )
      ),
      max: 10,
    },

    {
      label: 'Healthy Fats',
      points: Math.min(
        10,
        Math.round(
          totals.fatHits * 3.5
        )
      ),
      max: 10,
    },
  ]

  const score = Math.min(
    100,
    Math.max(
      0,
      sumLines(lines)
    )
  )

  return {
    score,
    lines,
  }
}


export function calcFoodQualityScore(
  foods
) {
  return (
    calcFoodQualityBreakdown(
      foods
    )?.score ?? null
  )
}


// ── FOOD LONGEVITY ───────────────────────────────────────────────────────────

export function calcFoodLongevityBreakdown(
  foods
) {
  if (!foods?.length) {
    return null
  }

  const totals =
    mealTotals(foods)

  if (!totals.itemCount) {
    return null
  }

  const plantPts = Math.min(
    30,
    Math.round(
      totals.uniquePlants * 3.5 +
      Math.min(
        totals.vegFruitCount,
        4
      ) * 2
    )
  )

  const fiberPts =
    tierFiberLongevity(
      totals.fiber
    )

  const antiPts = Math.min(
    15,
    totals.antiHits * 3
  )

  const varietyPts =
    varietyPoints(
      totals.uniquePlants
    )

  /*
   * Quality protein is positive.
   */
  const proteinPts = Math.min(
    15,
    totals.qualityProteinHits * 4
  )

  /*
   * Processing starts at 10.
   * It can reach 0 for a heavily processed meal.
   */
  let processingPts = 10

  processingPts -= Math.min(
    10,
    Math.round(
      totals.upfCount * 5
    )
  )

  const deductions = []

  /*
   * Refined grains.
   */
  if (
    totals.refinedGrainCount > 0 &&
    totals.wholeGrainCount === 0
  ) {
    deductions.push({
      label: 'Refined grains',
      points: -Math.min(
        5,
        Math.round(
          totals.refinedGrainCount * 2
        )
      ),
      max: 0,
      deduction: true,
    })
  }

  /*
   * Red meat.
   */
  if (
    totals.redMeatCount > 0
  ) {
    deductions.push({
      label: 'Red meat',
      points: -Math.min(
        4,
        Math.round(
          totals.redMeatCount * 2
        )
      ),
      max: 0,
      deduction: true,
    })
  }

  /*
   * Processed meat.
   */
  if (
    totals.processedMeatCount > 0
  ) {
    deductions.push({
      label: 'Processed meat',
      points: -Math.min(
        8,
        Math.round(
          totals.processedMeatCount * 4
        )
      ),
      max: 0,
      deduction: true,
    })
  }

  /*
   * Heavy animal protein load.
   */
  if (
    totals.heavyAnimalCount >= 3 &&
    totals.legumeCount === 0
  ) {
    deductions.push({
      label: 'High red meat load',
      points: -Math.min(
        6,
        Math.round(
          (totals.heavyAnimalCount - 2) *
            3
        )
      ),
      max: 0,
      deduction: true,
    })
  }

  /*
   * Don't punish a normal small meal for lacking legumes.
   */
  if (
    !totals.legumeCount &&
    totals.itemCount >= 5
  ) {
    deductions.push({
      label: 'No legumes',
      points: -2,
      max: 0,
      deduction: true,
    })
  }

  const positiveLines = [
    {
      label: 'Plants',
      points: plantPts,
      max: 30,
    },

    {
      label: 'Fiber',
      points: fiberPts,
      max: 20,
    },

    {
      label: 'Protein Quality',
      points: proteinPts,
      max: 15,
    },

    {
      label: 'Anti-inflammatory',
      points: antiPts,
      max: 15,
    },

    {
      label: 'Variety',
      points: varietyPts,
      max: 10,
    },

    {
      label: 'Processing',
      points: processingPts,
      max: 10,
    },
  ]

  const lines = [
    ...positiveLines,
    ...deductions,
  ]

  const raw =
    sumLines(lines)

  const score =
    applyLongevityCaps(
      raw,
      totals,
      foods
    )

  return {
    score,
    lines,
    raw,
  }
}


export function calcFoodLongevityScore(
  foods
) {
  return (
    calcFoodLongevityBreakdown(
      foods
    )?.score ?? null
  )
}


// ── MACROS ───────────────────────────────────────────────────────────────────

export function calcMealMacroTotals(
  foods
) {
  if (!foods?.length) {
    return null
  }

  const real =
    foods.filter(
      food =>
        food.name &&
        food.calories != null
    )

  if (!real.length) {
    return null
  }

  return real.reduce(
    (acc, food) => {
      const display =
        getFoodDisplay(food)

      return {
        calories:
          acc.calories +
          display.calories,

        protein:
          Math.round(
            (
              acc.protein +
              display.protein
            ) * 10
          ) / 10,

        carbs:
          Math.round(
            (
              acc.carbs +
              display.carbs
            ) * 10
          ) / 10,

        fat:
          Math.round(
            (
              acc.fat +
              display.fat
            ) * 10
          ) / 10,

        fiber:
          Math.round(
            (
              acc.fiber +
              estimateFiberGrams(
                food
              )
            ) * 10
          ) / 10,
      }
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    }
  )
}