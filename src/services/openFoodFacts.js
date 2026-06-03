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

// These words in a food name mean it's not a raw ingredient
const EXCLUDE_WORDS = [
  'dried', 'dehydrated', 'concentrate', 'powder', 'freeze-dried',
  'sauce', 'seasoning', 'flavored', 'flavour', 'seasoned', 'breaded',
  'frozen', 'canned', 'prepared', 'restaurant', 'fast food',
  'mix', 'instant', 'supplement', 'extract', 'syrup', 'juice',
  'baby food', 'infant', 'formula', 'drink', 'beverage',
  'spread', 'dip', 'dressing', 'marinade', 'glaze', 'battered',
  'pickled', 'smoked', 'salted', 'sweetened', 'coated',
]

function isExcluded(name) {
  const lower = name.toLowerCase()
  return EXCLUDE_WORDS.some((w) => lower.includes(w))
}

function getNutrient(nutrients, name, unit) {
  const n = nutrients.find(
    (x) =>
      x.nutrientName?.toLowerCase().includes(name) &&
      (!unit || x.unitName === unit)
  )
  return n != null ? Math.round(n.value) : null
}

// Clean name: take only first segment before comma, title case
function cleanName(raw) {
  return raw
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// Score how well a food name matches the query — lower is better
function matchScore(name, query) {
  const n = name.toLowerCase()
  const q = query.toLowerCase()
  const words = n.split(/\s+/)
  if (n === q) return 0
  if (words[0] === q || words.slice(0, 2).join(' ') === q) return 1
  if (n.startsWith(q)) return 2
  if (n.includes(q)) return 3
  return 4
}

// After cleaning names, deduplicate — keep the entry with most complete macros
function deduplicate(foods) {
  const seen = new Map()
  for (const food of foods) {
    const key = food.name.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, food)
    } else {
      // Replace if this one has more macro data
      const existing = seen.get(key)
      const existingScore = [existing.calories, existing.protein, existing.carbs, existing.fat].filter(v => v != null).length
      const newScore = [food.calories, food.protein, food.carbs, food.fat].filter(v => v != null).length
      if (newScore > existingScore) seen.set(key, food)
    }
  }
  return Array.from(seen.values())
}

export async function searchFoods(query, signal) {
  const q = query.trim()
  if (q.length < 2) return []

  const params = new URLSearchParams({
    query: q,
    api_key: USDA_KEY,
    pageSize: '50', // fetch a lot so we have enough after filtering
    dataType: 'Foundation,SR Legacy',
  })

  try {
    const res = await fetch(`${USDA_URL}?${params}`, { signal })
    if (!res.ok) throw new Error('USDA unavailable')
    const data = await res.json()

    const results = (data.foods || [])
      .filter((f) => f.description && !isExcluded(f.description))
      .map((f) => {
        const nutrients = f.foodNutrients || []
        const name = cleanName(f.description)
        return {
          offCode: String(f.fdcId),
          name,
          brand: '',
          calories: getNutrient(nutrients, 'energy', 'KCAL'),
          protein: getNutrient(nutrients, 'protein', 'G'),
          carbs: getNutrient(nutrients, 'carbohydrate', 'G'),
          fat: getNutrient(nutrients, 'total lipid', 'G'),
          category: f.foodCategory || '',
          _score: matchScore(f.description, q),
        }
      })
      // Only keep foods with at least calories OR protein data
      .filter((f) => f.calories != null || f.protein != null)
      // Sort by match quality first, then name length (shorter = more specific)
      .sort((a, b) => a._score - b._score || a.name.length - b.name.length)

    // Deduplicate by cleaned name, keeping best macro data
    const deduped = deduplicate(results)

    return deduped.slice(0, 6)
  } catch (err) {
    if (err.name === 'AbortError') throw err
    return []
  }
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