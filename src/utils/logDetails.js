/** @typedef {{ id: string, name: string, brand?: string, calories?: number|null, serving?: string, offCode?: string }} FoodItem */
/** @typedef {{ foods: FoodItem[], exercise: object, sleep: object, water: object, focus: object, reading: object, meditation: object, mood: object }} LogDetails */

export function emptyLogDetails() {
  return {
    foods: [],
    exercise: { name: '', duration_min: '', notes: '' },
    sleep: { bedtime: '', wake_time: '', notes: '' },
    water: { notes: '' },
    focus: { activity: '' },
    reading: { title: '', pages: '' },
    meditation: { style: '' },
    mood: { note: '' },
  }
}

export function parseLogDetails(raw) {
  const base = emptyLogDetails()
  if (!raw || typeof raw !== 'object') return base

  return {
    foods: Array.isArray(raw.foods) ? raw.foods : [],
    exercise: { ...base.exercise, ...(raw.exercise || {}) },
    sleep: { ...base.sleep, ...(raw.sleep || {}) },
    water: { ...base.water, ...(raw.water || {}) },
    focus: { ...base.focus, ...(raw.focus || {}) },
    reading: { ...base.reading, ...(raw.reading || {}) },
    meditation: { ...base.meditation, ...(raw.meditation || {}) },
    mood: { ...base.mood, ...(raw.mood || {}) },
  }
}

export function countDetails(details) {
  let n = 0
  if (details.foods?.length) n += details.foods.length
  if (details.exercise?.name || details.exercise?.notes) n += 1
  if (details.sleep?.bedtime || details.sleep?.wake_time || details.sleep?.notes) n += 1
  if (details.water?.notes) n += 1
  if (details.focus?.activity) n += 1
  if (details.reading?.title) n += 1
  if (details.meditation?.style) n += 1
  if (details.mood?.note) n += 1
  return n
}

export function hasDetailContent(raw) {
  return countDetails(parseLogDetails(raw)) > 0
}
