export const FOODS = [
  // FRUITS
  { id: 'apple',           name: 'Apple',               cal: 52,  p: 0.3,  c: 14,  f: 0.2,  cat: 'fruit_servings',     serving: 182, unit: '1 medium' },
  { id: 'banana',          name: 'Banana',              cal: 89,  p: 1.1,  c: 23,  f: 0.3,  cat: 'fruit_servings',     serving: 118, unit: '1 medium' },
  { id: 'orange',          name: 'Orange',              cal: 47,  p: 0.9,  c: 12,  f: 0.1,  cat: 'fruit_servings',     serving: 131, unit: '1 medium' },
  { id: 'strawberry',      name: 'Strawberries',        cal: 32,  p: 0.7,  c: 8,   f: 0.3,  cat: 'fruit_servings',     serving: 152, unit: '1 cup' },
  { id: 'blueberry',       name: 'Blueberries',         cal: 57,  p: 0.7,  c: 14,  f: 0.3,  cat: 'fruit_servings',     serving: 148, unit: '1 cup' },
  { id: 'mango',           name: 'Mango',               cal: 60,  p: 0.8,  c: 15,  f: 0.4,  cat: 'fruit_servings',     serving: 165, unit: '1 cup sliced' },
  { id: 'grapes',          name: 'Grapes',              cal: 69,  p: 0.7,  c: 18,  f: 0.2,  cat: 'fruit_servings',     serving: 92,  unit: '½ cup' },
  { id: 'watermelon',      name: 'Watermelon',          cal: 30,  p: 0.6,  c: 8,   f: 0.2,  cat: 'fruit_servings',     serving: 280, unit: '2 cups diced' },
  { id: 'pineapple',       name: 'Pineapple',           cal: 50,  p: 0.5,  c: 13,  f: 0.1,  cat: 'fruit_servings',     serving: 165, unit: '1 cup chunks' },
  { id: 'peach',           name: 'Peach',               cal: 39,  p: 0.9,  c: 10,  f: 0.3,  cat: 'fruit_servings',     serving: 150, unit: '1 medium' },
  { id: 'pear',            name: 'Pear',                cal: 57,  p: 0.4,  c: 15,  f: 0.1,  cat: 'fruit_servings',     serving: 178, unit: '1 medium' },
  { id: 'cherry',          name: 'Cherries',            cal: 63,  p: 1.1,  c: 16,  f: 0.2,  cat: 'fruit_servings',     serving: 138, unit: '1 cup' },
  { id: 'kiwi',            name: 'Kiwi',                cal: 61,  p: 1.1,  c: 15,  f: 0.5,  cat: 'fruit_servings',     serving: 69,  unit: '1 medium' },
  { id: 'plum',            name: 'Plum',                cal: 46,  p: 0.7,  c: 11,  f: 0.3,  cat: 'fruit_servings',     serving: 66,  unit: '1 medium' },
  { id: 'cantaloupe',      name: 'Cantaloupe',          cal: 34,  p: 0.8,  c: 8,   f: 0.2,  cat: 'fruit_servings',     serving: 177, unit: '1 cup diced' },
  { id: 'raspberry',       name: 'Raspberries',         cal: 52,  p: 1.2,  c: 12,  f: 0.7,  cat: 'fruit_servings',     serving: 123, unit: '1 cup' },
  { id: 'avocado',         name: 'Avocado',             cal: 160, p: 2.0,  c: 9,   f: 15,   cat: 'fruit_servings',     serving: 150, unit: '1 medium' },

  // VEGETABLES
  { id: 'broccoli',        name: 'Broccoli',            cal: 34,  p: 2.8,  c: 7,   f: 0.4,  cat: 'vegetable_servings', serving: 91,  unit: '1 cup chopped' },
  { id: 'spinach',         name: 'Spinach',             cal: 23,  p: 2.9,  c: 4,   f: 0.4,  cat: 'vegetable_servings', serving: 30,  unit: '1 cup raw' },
  { id: 'kale',            name: 'Kale',                cal: 49,  p: 4.3,  c: 9,   f: 0.9,  cat: 'vegetable_servings', serving: 67,  unit: '1 cup chopped' },
  { id: 'carrot',          name: 'Carrots',             cal: 41,  p: 0.9,  c: 10,  f: 0.2,  cat: 'vegetable_servings', serving: 61,  unit: '1 medium' },
  { id: 'tomato',          name: 'Tomato',              cal: 18,  p: 0.9,  c: 4,   f: 0.2,  cat: 'vegetable_servings', serving: 123, unit: '1 medium' },
  { id: 'cucumber',        name: 'Cucumber',            cal: 16,  p: 0.7,  c: 4,   f: 0.1,  cat: 'vegetable_servings', serving: 119, unit: '½ cucumber' },
  { id: 'lettuce',         name: 'Romaine Lettuce',     cal: 17,  p: 1.2,  c: 3,   f: 0.3,  cat: 'vegetable_servings', serving: 47,  unit: '1 cup shredded' },
  { id: 'bell_pepper',     name: 'Bell Pepper',         cal: 31,  p: 1.0,  c: 6,   f: 0.3,  cat: 'vegetable_servings', serving: 119, unit: '1 medium' },
  { id: 'onion',           name: 'Onion',               cal: 40,  p: 1.1,  c: 9,   f: 0.1,  cat: 'vegetable_servings', serving: 110, unit: '1 medium' },
  { id: 'sweet_potato',    name: 'Sweet Potato',        cal: 86,  p: 1.6,  c: 20,  f: 0.1,  cat: 'vegetable_servings', serving: 130, unit: '1 medium' },
  { id: 'cauliflower',     name: 'Cauliflower',         cal: 25,  p: 1.9,  c: 5,   f: 0.3,  cat: 'vegetable_servings', serving: 107, unit: '1 cup chopped' },
  { id: 'celery',          name: 'Celery',              cal: 16,  p: 0.7,  c: 3,   f: 0.2,  cat: 'vegetable_servings', serving: 101, unit: '1 cup chopped' },
  { id: 'zucchini',        name: 'Zucchini',            cal: 17,  p: 1.2,  c: 3,   f: 0.3,  cat: 'vegetable_servings', serving: 124, unit: '1 medium' },
  { id: 'asparagus',       name: 'Asparagus',           cal: 20,  p: 2.2,  c: 4,   f: 0.1,  cat: 'vegetable_servings', serving: 134, unit: '5 spears' },
  { id: 'cabbage',         name: 'Cabbage',             cal: 25,  p: 1.3,  c: 6,   f: 0.1,  cat: 'vegetable_servings', serving: 89,  unit: '1 cup shredded' },
  { id: 'mushroom',        name: 'Mushrooms',           cal: 22,  p: 3.1,  c: 3,   f: 0.3,  cat: 'vegetable_servings', serving: 96,  unit: '1 cup sliced' },
  { id: 'corn',            name: 'Corn',                cal: 86,  p: 3.3,  c: 19,  f: 1.4,  cat: 'vegetable_servings', serving: 154, unit: '1 ear' },
  { id: 'green_peas',      name: 'Green Peas',          cal: 81,  p: 5.4,  c: 14,  f: 0.4,  cat: 'vegetable_servings', serving: 145, unit: '1 cup' },
  { id: 'edamame',         name: 'Edamame',             cal: 122, p: 11,   c: 10,  f: 5,    cat: 'vegetable_servings', serving: 155, unit: '1 cup shelled' },
  { id: 'garlic',          name: 'Garlic',              cal: 149, p: 6.4,  c: 33,  f: 0.5,  cat: 'vegetable_servings', serving: 9,   unit: '3 cloves' },

  // PROTEINS
  { id: 'chicken_breast',  name: 'Chicken Breast',      cal: 165, p: 31,   c: 0,   f: 3.6,  cat: 'protein_servings',   serving: 174, unit: '6 oz cooked' },
  { id: 'chicken_thigh',   name: 'Chicken Thigh',       cal: 209, p: 26,   c: 0,   f: 11,   cat: 'protein_servings',   serving: 116, unit: '1 thigh' },
  { id: 'ground_beef',     name: 'Ground Beef (lean)',  cal: 215, p: 26,   c: 0,   f: 12,   cat: 'protein_servings',   serving: 113, unit: '4 oz cooked' },
  { id: 'sirloin_steak',   name: 'Sirloin Steak',       cal: 207, p: 26,   c: 0,   f: 11,   cat: 'protein_servings',   serving: 170, unit: '6 oz' },
  { id: 'salmon',          name: 'Salmon',              cal: 208, p: 20,   c: 0,   f: 13,   cat: 'protein_servings',   serving: 178, unit: '6 oz fillet' },
  { id: 'tuna',            name: 'Tuna',                cal: 116, p: 26,   c: 0,   f: 1,    cat: 'protein_servings',   serving: 142, unit: '1 can drained' },
  { id: 'shrimp',          name: 'Shrimp',              cal: 99,  p: 24,   c: 0,   f: 0.3,  cat: 'protein_servings',   serving: 85,  unit: '3 oz' },
  { id: 'cod',             name: 'Cod',                 cal: 82,  p: 18,   c: 0,   f: 0.7,  cat: 'protein_servings',   serving: 180, unit: '6 oz fillet' },
  { id: 'tilapia',         name: 'Tilapia',             cal: 96,  p: 20,   c: 0,   f: 1.7,  cat: 'protein_servings',   serving: 170, unit: '6 oz fillet' },
  { id: 'whole_egg',       name: 'Egg (whole)',         cal: 155, p: 13,   c: 1,   f: 11,   cat: 'protein_servings',   serving: 50,  unit: '1 large egg' },
  { id: 'egg_white',       name: 'Egg White',           cal: 52,  p: 11,   c: 1,   f: 0.2,  cat: 'protein_servings',   serving: 33,  unit: '1 egg white' },
  { id: 'turkey_breast',   name: 'Turkey Breast',       cal: 135, p: 30,   c: 0,   f: 1,    cat: 'protein_servings',   serving: 85,  unit: '3 oz' },
  { id: 'pork_loin',       name: 'Pork Loin',           cal: 182, p: 25,   c: 0,   f: 9,    cat: 'protein_servings',   serving: 113, unit: '4 oz' },
  { id: 'lamb',            name: 'Lamb',                cal: 258, p: 25,   c: 0,   f: 17,   cat: 'protein_servings',   serving: 113, unit: '4 oz' },
  { id: 'tofu',            name: 'Tofu',                cal: 76,  p: 8,    c: 2,   f: 4,    cat: 'protein_servings',   serving: 126, unit: '½ block' },
  { id: 'tempeh',          name: 'Tempeh',              cal: 193, p: 19,   c: 9,   f: 11,   cat: 'protein_servings',   serving: 84,  unit: '3 oz' },
  { id: 'greek_yogurt',    name: 'Greek Yogurt',        cal: 59,  p: 10,   c: 4,   f: 0.4,  cat: 'protein_servings',   serving: 227, unit: '1 cup' },
  { id: 'cottage_cheese',  name: 'Cottage Cheese',      cal: 98,  p: 11,   c: 3,   f: 4,    cat: 'protein_servings',   serving: 226, unit: '1 cup' },
  { id: 'black_beans',     name: 'Black Beans',         cal: 132, p: 9,    c: 24,  f: 0.5,  cat: 'protein_servings',   serving: 172, unit: '1 cup cooked' },
  { id: 'lentils',         name: 'Lentils',             cal: 116, p: 9,    c: 20,  f: 0.4,  cat: 'protein_servings',   serving: 198, unit: '1 cup cooked' },
  { id: 'chickpeas',       name: 'Chickpeas',           cal: 164, p: 9,    c: 27,  f: 2.6,  cat: 'protein_servings',   serving: 164, unit: '1 cup cooked' },
  { id: 'cheddar',         name: 'Cheddar Cheese',      cal: 403, p: 25,   c: 1,   f: 33,   cat: 'protein_servings',   serving: 28,  unit: '1 oz slice' },
  { id: 'whole_milk',      name: 'Whole Milk',          cal: 61,  p: 3.2,  c: 5,   f: 3.3,  cat: 'protein_servings',   serving: 244, unit: '1 cup' },
  { id: 'sardines',        name: 'Sardines',            cal: 208, p: 25,   c: 0,   f: 11,   cat: 'protein_servings',   serving: 92,  unit: '1 can' },
  { id: 'protein_shake',   name: 'Protein Shake',       cal: 120, p: 25,   c: 5,   f: 2,    cat: 'protein_servings',   serving: 300, unit: '1 scoop + water' },

  // GRAINS
  { id: 'white_rice',      name: 'White Rice',          cal: 130, p: 2.7,  c: 28,  f: 0.3,  cat: null, serving: 186, unit: '1 cup cooked' },
  { id: 'brown_rice',      name: 'Brown Rice',          cal: 112, p: 2.6,  c: 24,  f: 0.9,  cat: null, serving: 195, unit: '1 cup cooked' },
  { id: 'oats',            name: 'Oats',                cal: 389, p: 17,   c: 66,  f: 7,    cat: null, serving: 40,  unit: '½ cup dry' },
  { id: 'pasta',           name: 'Pasta (cooked)',      cal: 158, p: 5.8,  c: 31,  f: 0.9,  cat: null, serving: 140, unit: '1 cup cooked' },
  { id: 'white_bread',     name: 'White Bread',         cal: 265, p: 9,    c: 49,  f: 3,    cat: null, serving: 25,  unit: '1 slice' },
  { id: 'whole_wheat_bread',name: 'Whole Wheat Bread',  cal: 247, p: 13,   c: 41,  f: 4,    cat: null, serving: 28,  unit: '1 slice' },
  { id: 'potato',          name: 'Potato',              cal: 77,  p: 2,    c: 17,  f: 0.1,  cat: null, serving: 173, unit: '1 medium' },
  { id: 'quinoa',          name: 'Quinoa',              cal: 120, p: 4.4,  c: 22,  f: 1.9,  cat: null, serving: 185, unit: '1 cup cooked' },
  { id: 'tortilla',        name: 'Flour Tortilla',      cal: 312, p: 8,    c: 51,  f: 8,    cat: null, serving: 45,  unit: '1 medium' },

  // NUTS & FATS
  { id: 'almonds',         name: 'Almonds',             cal: 579, p: 21,   c: 22,  f: 50,   cat: null, serving: 28,  unit: '1 oz (~23 nuts)' },
  { id: 'peanut_butter',   name: 'Peanut Butter',       cal: 588, p: 25,   c: 20,  f: 50,   cat: null, serving: 32,  unit: '2 tbsp' },
  { id: 'walnuts',         name: 'Walnuts',             cal: 654, p: 15,   c: 14,  f: 65,   cat: null, serving: 28,  unit: '1 oz (~14 halves)' },
  { id: 'olive_oil',       name: 'Olive Oil',           cal: 884, p: 0,    c: 0,   f: 100,  cat: null, serving: 14,  unit: '1 tbsp' },
  { id: 'butter',          name: 'Butter',              cal: 717, p: 0.9,  c: 0.1, f: 81,   cat: null, serving: 14,  unit: '1 tbsp' },
  { id: 'cashews',         name: 'Cashews',             cal: 553, p: 18,   c: 30,  f: 44,   cat: null, serving: 28,  unit: '1 oz (~18 nuts)' },

  // DAIRY
  { id: 'skim_milk',       name: 'Skim Milk',           cal: 34,  p: 3.4,  c: 5,   f: 0.1,  cat: null, serving: 244, unit: '1 cup' },
  { id: 'plain_yogurt',    name: 'Yogurt (plain)',      cal: 61,  p: 3.5,  c: 5,   f: 3.3,  cat: null, serving: 245, unit: '1 cup' },
  { id: 'mozzarella',      name: 'Mozzarella',          cal: 280, p: 28,   c: 2,   f: 17,   cat: null, serving: 28,  unit: '1 oz' },
  { id: 'cream_cheese',    name: 'Cream Cheese',        cal: 342, p: 6,    c: 4,   f: 34,   cat: null, serving: 29,  unit: '2 tbsp' },

  // PROCESSED
  { id: 'dark_chocolate',  name: 'Dark Chocolate',      cal: 546, p: 5,    c: 60,  f: 31,   cat: 'processed_servings', serving: 40,  unit: '2 squares' },
  { id: 'milk_chocolate',  name: 'Milk Chocolate',      cal: 535, p: 8,    c: 60,  f: 30,   cat: 'processed_servings', serving: 40,  unit: '2 squares' },
  { id: 'potato_chips',    name: 'Potato Chips',        cal: 536, p: 7,    c: 53,  f: 35,   cat: 'processed_servings', serving: 28,  unit: '1 oz bag' },
  { id: 'choc_chip_cookie',name: 'Choc Chip Cookie',    cal: 488, p: 5,    c: 64,  f: 24,   cat: 'processed_servings', serving: 16,  unit: '1 cookie' },
  { id: 'ice_cream',       name: 'Ice Cream',           cal: 207, p: 3.5,  c: 24,  f: 11,   cat: 'processed_servings', serving: 132, unit: '½ cup' },
  { id: 'glazed_donut',    name: 'Glazed Donut',        cal: 452, p: 5,    c: 51,  f: 25,   cat: 'processed_servings', serving: 60,  unit: '1 donut' },
  { id: 'cheese_pizza',    name: 'Pizza (cheese)',      cal: 266, p: 11,   c: 33,  f: 10,   cat: 'processed_servings', serving: 107, unit: '1 slice' },
  { id: 'cheeseburger',    name: 'Cheeseburger',        cal: 295, p: 17,   c: 24,  f: 14,   cat: 'processed_servings', serving: 113, unit: '1 burger' },
  { id: 'french_fries',    name: 'French Fries',        cal: 312, p: 3.4,  c: 41,  f: 15,   cat: 'processed_servings', serving: 117, unit: 'medium serving' },
  { id: 'cola_soda',       name: 'Cola Soda',           cal: 37,  p: 0,    c: 10,  f: 0,    cat: 'processed_servings', serving: 355, unit: '1 can' },
  { id: 'candy_bar',       name: 'Candy Bar',           cal: 480, p: 5,    c: 64,  f: 22,   cat: 'processed_servings', serving: 52,  unit: '1 bar' },
  { id: 'buttered_popcorn',name: 'Buttered Popcorn',    cal: 535, p: 8,    c: 56,  f: 29,   cat: 'processed_servings', serving: 113, unit: 'medium bag' },
  { id: 'pancakes',        name: 'Pancakes',            cal: 227, p: 6,    c: 28,  f: 10,   cat: 'processed_servings', serving: 110, unit: '2 medium' },
  { id: 'blueberry_muffin',name: 'Blueberry Muffin',    cal: 377, p: 5,    c: 55,  f: 14,   cat: 'processed_servings', serving: 113, unit: '1 muffin' },
  { id: 'chocolate_cake',  name: 'Chocolate Cake',      cal: 371, p: 4,    c: 52,  f: 17,   cat: 'processed_servings', serving: 95,  unit: '1 slice' },
  { id: 'brownie',         name: 'Brownie',             cal: 406, p: 4,    c: 55,  f: 20,   cat: 'processed_servings', serving: 56,  unit: '1 brownie' },
  { id: 'hot_dog',         name: 'Hot Dog',             cal: 290, p: 11,   c: 2,   f: 26,   cat: 'processed_servings', serving: 98,  unit: '1 hot dog' },
  { id: 'nachos',          name: 'Nachos',              cal: 306, p: 7,    c: 34,  f: 16,   cat: 'processed_servings', serving: 113, unit: 'small serving' },
  { id: 'fried_chicken',   name: 'Fried Chicken',       cal: 320, p: 22,   c: 12,  f: 20,   cat: 'processed_servings', serving: 140, unit: '1 piece' },

  // DRINKS
  { id: 'black_coffee',    name: 'Black Coffee',        cal: 2,   p: 0.3,  c: 0,   f: 0,    cat: null, serving: 240, unit: '1 cup' },
  { id: 'orange_juice',    name: 'Orange Juice',        cal: 45,  p: 0.7,  c: 10,  f: 0.2,  cat: null, serving: 240, unit: '1 cup' },
]

export function getMacrosPerServing(food) {
  const factor = food.serving / 100
  return {
    calories: Math.round((food.cal ?? 0) * factor),
    protein:  Math.round((food.p   ?? 0) * factor * 10) / 10,
    carbs:    Math.round((food.c   ?? 0) * factor * 10) / 10,
    fat:      Math.round((food.f   ?? 0) * factor * 10) / 10,
  }
}

export function searchLocalFoods(query) {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []

  const scored = FOODS
    .map((food) => {
      const name = food.name.toLowerCase()
      const idWords = food.id.replace(/_/g, ' ')
      let score = 99

      if (name === q || idWords === q) score = 0
      else if (name.startsWith(q) || idWords.startsWith(q)) score = 1
      else if (name.split(' ')[0] === q.split(' ')[0]) score = 2
      else if (name.includes(q)) score = 3
      else if (q.split(' ').some((w) => w.length > 2 && (name.includes(w) || idWords.includes(w)))) score = 4
      else return null

      return { ...food, _score: score }
    })
    .filter(Boolean)
    .sort((a, b) => a._score - b._score || a.name.length - b.name.length)

  return scored.slice(0, 8)
}