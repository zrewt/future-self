import { searchLocalFoods } from '../data/foods'

const CATEGORY_KEYWORDS = {
  fruit_servings: ['apple', 'banana', 'orange', 'berry', 'mango', 'grape', 'peach', 'pear', 'melon', 'pineapple', 'strawberry', 'blueberry', 'kiwi', 'watermelon', 'fruit', 'cherry', 'plum', 'raspberry', 'avocado', 'cantaloupe'],
  vegetable_servings: ['broccoli', 'spinach', 'kale', 'carrot', 'salad', 'lettuce', 'tomato', 'cucumber', 'pepper', 'onion', 'celery', 'zucchini', 'asparagus', 'vegetable', 'veggie', 'cabbage', 'cauliflower', 'mushroom', 'corn', 'peas', 'edamame', 'garlic', 'sweet potato'],
  protein_servings: ['chicken', 'beef', 'fish', 'salmon', 'tuna', 'egg', 'tofu', 'turkey', 'steak', 'shrimp', 'protein', 'yogurt', 'cheese', 'milk', 'lamb', 'pork', 'lentil', 'bean', 'cod', 'tilapia', 'sardine', 'tempeh', 'chickpea', 'cottage'],
  processed_servings: ['chips', 'candy', 'soda', 'cookie', 'cake', 'pizza', 'burger', 'fries', 'donut', 'chocolate', 'ice cream', 'nugget', 'hot dog', 'popcorn', 'muffin', 'brownie', 'nachos', 'pancake', 'fried'],
}

export function detectServingKey(name) {
  const lower = name.toLowerCase()
  for (const [key, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return key
  }
  return null
}

export async function searchFoods(query, _signal) {
  return searchLocalFoods(query).map((f) => ({
    offCode: f.id,
    name: f.name,
    brand: '',
    calories: f.cal,
    protein: f.p,
    carbs: f.c,
    fat: f.f,
    category: f.cat || '',
  }))
}

export function foodToLogItem(product) {
  return {
    id: crypto.randomUUID(),
    name: product.name,
    brand: '',
    calories: product.calories,
    protein: product.protein,
    carbs: product.carbs,
    fat: product.fat,
    serving: '100g',
    offCode: product.offCode,
    servingKey: detectServingKey(product.name),
  }
}