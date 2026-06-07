import { searchLocalFoods, getMacrosPerServing } from '../data/foods'

const CATEGORY_KEYWORDS = {
  fruit_servings:     ['apple','banana','orange','berry','mango','grape','peach','pear','melon','pineapple','strawberry','blueberry','blueberries','kiwi','watermelon','fruit','cherry','plum','raspberry','avocado','cantaloupe'],
  vegetable_servings: ['broccoli','spinach','kale','carrot','salad','lettuce','tomato','cucumber','pepper','onion','celery','zucchini','asparagus','vegetable','veggie','cabbage','cauliflower','mushroom','corn','peas','edamame','garlic','sweet potato'],
  protein_servings:   ['chicken','beef','fish','salmon','tuna','egg','tofu','turkey','steak','shrimp','protein','yogurt','cheese','milk','lamb','pork','lentil','bean','cod','tilapia','sardine','tempeh','chickpea','cottage'],
  processed_servings: ['chips','candy','soda','cookie','cake','pizza','burger','fries','donut','chocolate','ice cream','nugget','hot dog','popcorn','muffin','brownie','nachos','pancake','fried'],
}

export function detectServingKey(name) {
  const lower = name.toLowerCase()
  for (const [key, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return key
  }
  return null
}

export async function searchFoods(query, _signal) {
  return searchLocalFoods(query).map((f) => {
    const macros = getMacrosPerServing(f)
    return {
      offCode:  f.id,
      name:     f.name,
      brand:    '',
      calories: macros.calories,
      protein:  macros.protein,
      carbs:    macros.carbs,
      fat:      macros.fat,
      servingG: f.serving,
      unit:     f.unit,
      category: f.cat || '',
      // keep per-100g for scoring
      cal100g:  f.cal,
      p100g:    f.p,
      c100g:    f.c,
      f100g:    f.f,
    }
  })
}

export function foodToLogItem(product) {
  return {
    id:         crypto.randomUUID(),
    name:       product.name,
    brand:      '',
    calories:   product.cal100g ?? product.calories,
    protein:    product.p100g   ?? product.protein,
    carbs:      product.c100g   ?? product.carbs,
    fat:        product.f100g   ?? product.fat,
    servingG:   product.servingG ?? 150,
    unit:       product.unit ?? '1 serving',
    serving:    product.unit ?? '1 serving',
    offCode:    product.offCode,
    servingKey: detectServingKey(product.name),
    qty:        1,
  }
}