// Curated food database with real macros per 100g
// Sources: USDA Foundation Foods + standard nutrition references


export const FOODS = [
    // ── FRUITS ──────────────────────────────────────────────
    { id: 'apple',           name: 'Apple',                 cal: 52,  p: 0.3,  c: 14,  f: 0.2,  cat: 'fruit_servings' },
    { id: 'banana',          name: 'Banana',                cal: 89,  p: 1.1,  c: 23,  f: 0.3,  cat: 'fruit_servings' },
    { id: 'orange',          name: 'Orange',                cal: 47,  p: 0.9,  c: 12,  f: 0.1,  cat: 'fruit_servings' },
    { id: 'strawberry',      name: 'Strawberries',          cal: 32,  p: 0.7,  c: 8,   f: 0.3,  cat: 'fruit_servings' },
    { id: 'blueberry',       name: 'Blueberries',           cal: 57,  p: 0.7,  c: 14,  f: 0.3,  cat: 'fruit_servings' },
    { id: 'mango',           name: 'Mango',                 cal: 60,  p: 0.8,  c: 15,  f: 0.4,  cat: 'fruit_servings' },
    { id: 'grapes',          name: 'Grapes',                cal: 69,  p: 0.7,  c: 18,  f: 0.2,  cat: 'fruit_servings' },
    { id: 'watermelon',      name: 'Watermelon',            cal: 30,  p: 0.6,  c: 8,   f: 0.2,  cat: 'fruit_servings' },
    { id: 'pineapple',       name: 'Pineapple',             cal: 50,  p: 0.5,  c: 13,  f: 0.1,  cat: 'fruit_servings' },
    { id: 'peach',           name: 'Peach',                 cal: 39,  p: 0.9,  c: 10,  f: 0.3,  cat: 'fruit_servings' },
    { id: 'pear',            name: 'Pear',                  cal: 57,  p: 0.4,  c: 15,  f: 0.1,  cat: 'fruit_servings' },
    { id: 'cherry',          name: 'Cherries',              cal: 63,  p: 1.1,  c: 16,  f: 0.2,  cat: 'fruit_servings' },
    { id: 'kiwi',            name: 'Kiwi',                  cal: 61,  p: 1.1,  c: 15,  f: 0.5,  cat: 'fruit_servings' },
    { id: 'plum',            name: 'Plum',                  cal: 46,  p: 0.7,  c: 11,  f: 0.3,  cat: 'fruit_servings' },
    { id: 'cantaloupe',      name: 'Cantaloupe',            cal: 34,  p: 0.8,  c: 8,   f: 0.2,  cat: 'fruit_servings' },
    { id: 'raspberry',       name: 'Raspberries',           cal: 52,  p: 1.2,  c: 12,  f: 0.7,  cat: 'fruit_servings' },
    { id: 'avocado',         name: 'Avocado',               cal: 160, p: 2.0,  c: 9,   f: 15,   cat: 'fruit_servings' },
  
    // ── VEGETABLES ───────────────────────────────────────────
    { id: 'broccoli',        name: 'Broccoli',              cal: 34,  p: 2.8,  c: 7,   f: 0.4,  cat: 'vegetable_servings' },
    { id: 'spinach',         name: 'Spinach',               cal: 23,  p: 2.9,  c: 4,   f: 0.4,  cat: 'vegetable_servings' },
    { id: 'kale',            name: 'Kale',                  cal: 49,  p: 4.3,  c: 9,   f: 0.9,  cat: 'vegetable_servings' },
    { id: 'carrot',          name: 'Carrots',               cal: 41,  p: 0.9,  c: 10,  f: 0.2,  cat: 'vegetable_servings' },
    { id: 'tomato',          name: 'Tomato',                cal: 18,  p: 0.9,  c: 4,   f: 0.2,  cat: 'vegetable_servings' },
    { id: 'cucumber',        name: 'Cucumber',              cal: 16,  p: 0.7,  c: 4,   f: 0.1,  cat: 'vegetable_servings' },
    { id: 'lettuce',         name: 'Romaine Lettuce',       cal: 17,  p: 1.2,  c: 3,   f: 0.3,  cat: 'vegetable_servings' },
    { id: 'bell_pepper',     name: 'Bell Pepper',           cal: 31,  p: 1.0,  c: 6,   f: 0.3,  cat: 'vegetable_servings' },
    { id: 'onion',           name: 'Onion',                 cal: 40,  p: 1.1,  c: 9,   f: 0.1,  cat: 'vegetable_servings' },
    { id: 'garlic',          name: 'Garlic',                cal: 149, p: 6.4,  c: 33,  f: 0.5,  cat: 'vegetable_servings' },
    { id: 'sweet_potato',    name: 'Sweet Potato',          cal: 86,  p: 1.6,  c: 20,  f: 0.1,  cat: 'vegetable_servings' },
    { id: 'cauliflower',     name: 'Cauliflower',           cal: 25,  p: 1.9,  c: 5,   f: 0.3,  cat: 'vegetable_servings' },
    { id: 'celery',          name: 'Celery',                cal: 16,  p: 0.7,  c: 3,   f: 0.2,  cat: 'vegetable_servings' },
    { id: 'zucchini',        name: 'Zucchini',              cal: 17,  p: 1.2,  c: 3,   f: 0.3,  cat: 'vegetable_servings' },
    { id: 'asparagus',       name: 'Asparagus',             cal: 20,  p: 2.2,  c: 4,   f: 0.1,  cat: 'vegetable_servings' },
    { id: 'cabbage',         name: 'Cabbage',               cal: 25,  p: 1.3,  c: 6,   f: 0.1,  cat: 'vegetable_servings' },
    { id: 'mushroom',        name: 'Mushrooms',             cal: 22,  p: 3.1,  c: 3,   f: 0.3,  cat: 'vegetable_servings' },
    { id: 'corn',            name: 'Corn',                  cal: 86,  p: 3.3,  c: 19,  f: 1.4,  cat: 'vegetable_servings' },
    { id: 'green_peas',      name: 'Green Peas',            cal: 81,  p: 5.4,  c: 14,  f: 0.4,  cat: 'vegetable_servings' },
    { id: 'edamame',         name: 'Edamame',               cal: 122, p: 11,   c: 10,  f: 5,    cat: 'vegetable_servings' },
  
    // ── PROTEINS ─────────────────────────────────────────────
    { id: 'chicken_breast',  name: 'Chicken Breast',        cal: 165, p: 31,   c: 0,   f: 3.6,  cat: 'protein_servings' },
    { id: 'chicken_thigh',   name: 'Chicken Thigh',         cal: 209, p: 26,   c: 0,   f: 11,   cat: 'protein_servings' },
    { id: 'ground_beef',     name: 'Ground Beef (lean)',    cal: 215, p: 26,   c: 0,   f: 12,   cat: 'protein_servings' },
    { id: 'sirloin_steak',   name: 'Sirloin Steak',         cal: 207, p: 26,   c: 0,   f: 11,   cat: 'protein_servings' },
    { id: 'salmon',          name: 'Salmon',                cal: 208, p: 20,   c: 0,   f: 13,   cat: 'protein_servings' },
    { id: 'tuna',            name: 'Tuna',                  cal: 116, p: 26,   c: 0,   f: 1,    cat: 'protein_servings' },
    { id: 'shrimp',          name: 'Shrimp',                cal: 99,  p: 24,   c: 0,   f: 0.3,  cat: 'protein_servings' },
    { id: 'cod',             name: 'Cod',                   cal: 82,  p: 18,   c: 0,   f: 0.7,  cat: 'protein_servings' },
    { id: 'tilapia',         name: 'Tilapia',               cal: 96,  p: 20,   c: 0,   f: 1.7,  cat: 'protein_servings' },
    { id: 'whole_egg',       name: 'Egg (whole)',           cal: 155, p: 13,   c: 1,   f: 11,   cat: 'protein_servings' },
    { id: 'egg_white',       name: 'Egg White',             cal: 52,  p: 11,   c: 1,   f: 0.2,  cat: 'protein_servings' },
    { id: 'turkey_breast',   name: 'Turkey Breast',         cal: 135, p: 30,   c: 0,   f: 1,    cat: 'protein_servings' },
    { id: 'pork_loin',       name: 'Pork Loin',             cal: 182, p: 25,   c: 0,   f: 9,    cat: 'protein_servings' },
    { id: 'lamb',            name: 'Lamb',                  cal: 258, p: 25,   c: 0,   f: 17,   cat: 'protein_servings' },
    { id: 'tofu',            name: 'Tofu',                  cal: 76,  p: 8,    c: 2,   f: 4,    cat: 'protein_servings' },
    { id: 'tempeh',          name: 'Tempeh',                cal: 193, p: 19,   c: 9,   f: 11,   cat: 'protein_servings' },
    { id: 'greek_yogurt',    name: 'Greek Yogurt',          cal: 59,  p: 10,   c: 4,   f: 0.4,  cat: 'protein_servings' },
    { id: 'cottage_cheese',  name: 'Cottage Cheese',        cal: 98,  p: 11,   c: 3,   f: 4,    cat: 'protein_servings' },
    { id: 'black_beans',     name: 'Black Beans',           cal: 132, p: 9,    c: 24,  f: 0.5,  cat: 'protein_servings' },
    { id: 'lentils',         name: 'Lentils',               cal: 116, p: 9,    c: 20,  f: 0.4,  cat: 'protein_servings' },
    { id: 'chickpeas',       name: 'Chickpeas',             cal: 164, p: 9,    c: 27,  f: 2.6,  cat: 'protein_servings' },
    { id: 'cheddar',         name: 'Cheddar Cheese',        cal: 403, p: 25,   c: 1,   f: 33,   cat: 'protein_servings' },
    { id: 'whole_milk',      name: 'Whole Milk',            cal: 61,  p: 3.2,  c: 5,   f: 3.3,  cat: 'protein_servings' },
    { id: 'sardines',        name: 'Sardines',              cal: 208, p: 25,   c: 0,   f: 11,   cat: 'protein_servings' },
    { id: 'protein_shake',   name: 'Protein Shake',         cal: 120, p: 25,   c: 5,   f: 2,    cat: 'protein_servings' },
  
    // ── GRAINS & CARBS ───────────────────────────────────────
    { id: 'white_rice',      name: 'White Rice',            cal: 130, p: 2.7,  c: 28,  f: 0.3,  cat: null },
    { id: 'brown_rice',      name: 'Brown Rice',            cal: 112, p: 2.6,  c: 24,  f: 0.9,  cat: null },
    { id: 'oats',            name: 'Oats',                  cal: 389, p: 17,   c: 66,  f: 7,    cat: null },
    { id: 'pasta',           name: 'Pasta (cooked)',        cal: 158, p: 5.8,  c: 31,  f: 0.9,  cat: null },
    { id: 'white_bread',     name: 'White Bread',           cal: 265, p: 9,    c: 49,  f: 3,    cat: null },
    { id: 'whole_wheat_bread',name: 'Whole Wheat Bread',    cal: 247, p: 13,   c: 41,  f: 4,    cat: null },
    { id: 'potato',          name: 'Potato',                cal: 77,  p: 2,    c: 17,  f: 0.1,  cat: null },
    { id: 'quinoa',          name: 'Quinoa',                cal: 120, p: 4.4,  c: 22,  f: 1.9,  cat: null },
    { id: 'tortilla',        name: 'Flour Tortilla',        cal: 312, p: 8,    c: 51,  f: 8,    cat: null },
  
    // ── NUTS & FATS ──────────────────────────────────────────
    { id: 'almonds',         name: 'Almonds',               cal: 579, p: 21,   c: 22,  f: 50,   cat: null },
    { id: 'peanut_butter',   name: 'Peanut Butter',         cal: 588, p: 25,   c: 20,  f: 50,   cat: null },
    { id: 'walnuts',         name: 'Walnuts',               cal: 654, p: 15,   c: 14,  f: 65,   cat: null },
    { id: 'olive_oil',       name: 'Olive Oil',             cal: 884, p: 0,    c: 0,   f: 100,  cat: null },
    { id: 'butter',          name: 'Butter',                cal: 717, p: 0.9,  c: 0.1, f: 81,   cat: null },
    { id: 'cashews',         name: 'Cashews',               cal: 553, p: 18,   c: 30,  f: 44,   cat: null },
  
    // ── DAIRY ────────────────────────────────────────────────
    { id: 'skim_milk',       name: 'Skim Milk',             cal: 34,  p: 3.4,  c: 5,   f: 0.1,  cat: null },
    { id: 'plain_yogurt',    name: 'Yogurt (plain)',        cal: 61,  p: 3.5,  c: 5,   f: 3.3,  cat: null },
    { id: 'mozzarella',      name: 'Mozzarella',            cal: 280, p: 28,   c: 2,   f: 17,   cat: null },
    { id: 'cream_cheese',    name: 'Cream Cheese',          cal: 342, p: 6,    c: 4,   f: 34,   cat: null },
  
    // ── PROCESSED / TREATS ──────────────────────────────────
    { id: 'dark_chocolate',  name: 'Dark Chocolate',        cal: 546, p: 5,    c: 60,  f: 31,   cat: 'processed_servings' },
    { id: 'milk_chocolate',  name: 'Milk Chocolate',        cal: 535, p: 8,    c: 60,  f: 30,   cat: 'processed_servings' },
    { id: 'potato_chips',    name: 'Potato Chips',          cal: 536, p: 7,    c: 53,  f: 35,   cat: 'processed_servings' },
    { id: 'choc_chip_cookie',name: 'Chocolate Chip Cookie', cal: 488, p: 5,    c: 64,  f: 24,   cat: 'processed_servings' },
    { id: 'ice_cream',       name: 'Ice Cream (vanilla)',   cal: 207, p: 3.5,  c: 24,  f: 11,   cat: 'processed_servings' },
    { id: 'glazed_donut',    name: 'Glazed Donut',          cal: 452, p: 5,    c: 51,  f: 25,   cat: 'processed_servings' },
    { id: 'cheese_pizza',    name: 'Pizza (cheese)',        cal: 266, p: 11,   c: 33,  f: 10,   cat: 'processed_servings' },
    { id: 'cheeseburger',    name: 'Cheeseburger',          cal: 295, p: 17,   c: 24,  f: 14,   cat: 'processed_servings' },
    { id: 'french_fries',    name: 'French Fries',          cal: 312, p: 3.4,  c: 41,  f: 15,   cat: 'processed_servings' },
    { id: 'cola_soda',       name: 'Cola Soda',             cal: 37,  p: 0,    c: 10,  f: 0,    cat: 'processed_servings' },
    { id: 'candy_bar',       name: 'Candy Bar',             cal: 480, p: 5,    c: 64,  f: 22,   cat: 'processed_servings' },
    { id: 'buttered_popcorn',name: 'Popcorn (buttered)',    cal: 535, p: 8,    c: 56,  f: 29,   cat: 'processed_servings' },
    { id: 'pancakes',        name: 'Pancakes',              cal: 227, p: 6,    c: 28,  f: 10,   cat: 'processed_servings' },
    { id: 'blueberry_muffin',name: 'Blueberry Muffin',      cal: 377, p: 5,    c: 55,  f: 14,   cat: 'processed_servings' },
    { id: 'chocolate_cake',  name: 'Chocolate Cake',        cal: 371, p: 4,    c: 52,  f: 17,   cat: 'processed_servings' },
    { id: 'brownie',         name: 'Brownie',               cal: 406, p: 4,    c: 55,  f: 20,   cat: 'processed_servings' },
    { id: 'hot_dog',         name: 'Hot Dog',               cal: 290, p: 11,   c: 2,   f: 26,   cat: 'processed_servings' },
    { id: 'nachos',          name: 'Nachos',                cal: 306, p: 7,    c: 34,  f: 16,   cat: 'processed_servings' },
    { id: 'fried_chicken',   name: 'Fried Chicken',         cal: 320, p: 22,   c: 12,  f: 20,   cat: 'processed_servings' },
  
    // ── DRINKS ───────────────────────────────────────────────
    { id: 'black_coffee',    name: 'Black Coffee',          cal: 2,   p: 0.3,  c: 0,   f: 0,    cat: null },
    { id: 'orange_juice',    name: 'Orange Juice',          cal: 45,  p: 0.7,  c: 10,  f: 0.2,  cat: null },
  ]
  
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
  
    return scored.slice(0, 6)
  }