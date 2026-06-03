const USDA_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search'
const USDA_KEY = 'b8jUqLMGgXpYnaO7r8Ve4gAvmLcPjQLx6XpD16F0'

const CATEGORY_KEYWORDS = {
  fruit_servings: ['apple', 'banana', 'orange', 'berry', 'mango', 'grape', 'peach', 'pear', 'melon', 'pineapple', 'strawberry', 'blueberry', 'kiwi', 'watermelon', 'fruit', 'cherry', 'plum', 'apricot', 'fig', 'lemon', 'lime'],
  vegetable_servings: ['broccoli', 'spinach', 'kale', 'carrot', 'salad', 'lettuce', 'tomato', 'cucumber', 'pepper', 'onion', 'celery', 'zucchini', 'asparagus', 'vegetable', 'veggie', 'cabbage', 'cauliflower', 'beet', 'radish', 'arugula', 'chard', 'leek', 'squash', 'sweet potato', 'pea'],
  protein_servings: ['chicken', 'beef', 'fish', 'salmon', 'tuna', 'egg', 'tofu', 'turkey', 'steak', 'shrimp', 'protein', 'yogurt', 'cheese', 'milk', 'lamb', 'pork', 'lentil', 'bean', 'cod', 'tilapia', 'crab', 'lobster', 'sardine', 'duck', 'bison', 'venison', 'tempeh', 'edamame'],
  processed_servings: ['chips', 'candy', 'soda', 'cookie', 'cake', 'pizza', 'burger', 'fries', 'donut', 'chocolate', 'ice cream', 'nugget', 'hot dog', 'crackers', 'popcorn', 'pretzel', 'bagel', 'muffin', 'brownie'],
}

export function detectServingKey(name) {
  const lower = name.toLowerCase()
  for (const [key, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return key
  }
  return null
}

// Words that indicate a processed/branded/prepared item — filter these out
const JUNK_WORDS = [
  'sauce', 'seasoning', 'flavored', 'flavour', 'seasoned', 'breaded',
  'frozen', 'canned', 'prepared', 'restaurant', 'fast food', 'brand',
  'mix', 'instant', 'powder', 'supplement', 'extract', 'concentrate',
  'baby food', 'infant', 'formula', 'drink', 'beverage', 'juice blend',
  'spread', 'dip', 'dressing', 'marinade', 'glaze', 'battered',
]

function isJunk(name) {
  const lower = name.toLowerCase()
  return JUNK_WORDS.some((w) => lower.includes(w))
}

function getNutrient(nutrients, name, unit) {
  const n = nutrients.find(
    (x) => x.nutrientName?.toLowerCase().includes(name) &&
      (!unit || x.unitName === unit)
  )
  return n ? Math.round(n.value) : null
}

function toTitleCase(str) {
  // Take everything before the first comma to drop long descriptors
  return str
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function scoreMatch(name, query) {
  const n = name.toLowerCase()
  const q = query.toLowerCase()
  // Exact match
  if (n === q) return 0
  // Starts with query
  if (n.startsWith(q)) return 1
  // First word matches
  if (n.split(' ')[0] === q.split(' ')[0]) return 2
  // Contains full query
  if (n.includes(q)) return 3
  // Contains first word of query
  if (n.includes(q.split(' ')[0])) return 4
  return 5
}

export async function searchFoods(query, signal) {
  const q = query.trim()
  if (q.length < 2) return []

  try {
    return await searchUSDA(q, signal)
  } catch (err) {
    if (err.name === 'AbortError') throw err
    // Silent fallback — return empty rather than showing junk
    return []
  }
}

async function searchUSDA(q, signal) {
  const params = new URLSearchParams({
    query: q,
    api_key: USDA_KEY,
    pageSize: '25', // fetch more so we can filter down to good ones
    dataType: 'Foundation,SR Legacy', // Foundation = real whole foods, SR Legacy = standard reference
  })

  const controller = signal
    ? undefined
    : new AbortController()

  const res = await fetch(`${USDA_URL}?${params}`, {
    signal: signal || controller?.signal,
  })

  if (!res.ok) throw new Error('USDA unavailable')

  const data = await res.json()

  const results = (data.foods || [])
    .filter((f) => f.description && !isJunk(f.description))
    .map((f) => {
      const nutrients = f.foodNutrients || []
      return {
        offCode: String(f.fdcId),
        name: toTitleCase(f.description),
        brand: '',
        calories: getNutrient(nutrients, 'energy', 'KCAL'),
        protein: getNutrient(nutrients, 'protein', 'G'),
        carbs: getNutrient(nutrients, 'carbohydrate', 'G'),
        fat: getNutrient(nutrients, 'total lipid', 'G'),
        category: f.foodCategory || '',
        score: scoreMatch(f.description, q),
      }
    })
    .sort((a, b) => a.score - b.score || a.name.length - b.name.length)
    .slice(0, 8)

  return results
}

export function foodToLogItem(product) {
  return {
    id: crypto.randomUUID(),
    name: product.name,
    brand: product.brand,
    calories: product.calories,
    protein: product.protein,
    carbs: product.carbs,
    fat: product.fat,
    serving: '100g',
    offCode: product.offCode,
    servingKey: detectServingKey(product.name),
  }
}