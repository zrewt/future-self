/** Serving label scaling & per-item macro display (base serving × qty) */

const FRACTION_CHARS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.333, '⅔': 0.667 }

function parseLeadingAmount(str) {
  const s = str.trim()
  const mixed = s.match(/^(\d+)([½¼¾])/)
  if (mixed) return parseInt(mixed[1], 10) + FRACTION_CHARS[mixed[2]]

  if (/^[½¼¾⅓⅔]/.test(s)) return FRACTION_CHARS[s[0]]

  const num = s.match(/^(\d+(?:\.\d+)?)/)
  if (num) return parseFloat(num[1])

  return 1
}

function formatAmount(n) {
  const r = Math.round(n * 100) / 100
  if (r === 0.25) return '¼'
  if (r === 0.5) return '½'
  if (r === 0.75) return '¾'
  if (r > 0 && r % 1 === 0.5) return `${Math.floor(r)}½`
  if (Number.isInteger(r)) return String(r)
  return String(r)
}

/** Scale labels like "1 cup" → "0.5 cup", "½ cup dry" → "¼ cup dry", "1 oz (~14 halves)" → "0.5 oz (~7 halves)" */
export function scaleServingLabel(label, qty) {
  const base = label || '1 serving'
  if (!qty || qty === 1) return base

  let result = base

  result = result.replace(/\(~(\d+(?:\.\d+)?)\s+([^)]+)\)/g, (_, n, rest) => {
    const scaled = Math.round(parseFloat(n) * qty * 10) / 10
    const display = Number.isInteger(scaled) ? scaled : scaled
    return `(~${display} ${rest})`
  })

  const leading = result.match(/^(\d+(?:\.\d+)?|[½¼¾⅓⅔]|\d+[½¼¾])/)
  if (leading) {
    const amount = parseLeadingAmount(result) * qty
    const rest = result.slice(leading[0].length).trimStart()
    return rest ? `${formatAmount(amount)} ${rest}` : formatAmount(amount)
  }

  return `${formatAmount(qty)}× ${base}`
}

function round1(n) {
  return Math.round(n * 10) / 10
}

/** Base macros for exactly one serving label (before qty multiplier) */
export function getBaseServingMacros(food) {
  if (food.servingCalories != null) {
    return {
      calories: food.servingCalories,
      protein:  food.servingProtein  ?? 0,
      carbs:    food.servingCarbs    ?? 0,
      fat:      food.servingFat      ?? 0,
    }
  }

  const factor = (food.servingG ?? 150) / 100
  return {
    calories: Math.round((food.calories ?? 0) * factor),
    protein:  round1((food.protein  ?? 0) * factor),
    carbs:    round1((food.carbs    ?? 0) * factor),
    fat:      round1((food.fat      ?? 0) * factor),
  }
}

/** Display values after qty — label and macros always match */
export function getFoodDisplay(food) {
  const qty = food.qty ?? 1
  const baseLabel = food.servingLabel || food.unit || food.serving || '1 serving'
  const base = getBaseServingMacros(food)

  return {
    servingLabel: scaleServingLabel(baseLabel, qty),
    calories: Math.round(base.calories * qty),
    protein:  round1(base.protein * qty),
    carbs:    round1(base.carbs * qty),
    fat:      round1(base.fat * qty),
    qty,
  }
}

export function formatMacroLine(display) {
  const parts = [`${display.calories} kcal`]
  if (display.protein) parts.push(`P ${display.protein}g`)
  if (display.carbs)   parts.push(`C ${display.carbs}g`)
  if (display.fat)     parts.push(`F ${display.fat}g`)
  return parts.join(' · ')
}
