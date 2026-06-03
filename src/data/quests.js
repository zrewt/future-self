/** Daily quests — reset each calendar day; XP on log save */

export const DAILY_QUESTS = [
  {
    id: 'water_2l',
    name: 'Hydration',
    desc: 'Drink 2L water',
    icon: '💧',
    xp: 15,
    check: (log) => (log?.water_ml || 0) >= 2000,
  },
  {
    id: 'sleep_8h',
    name: 'Full rest',
    desc: 'Sleep 8+ hours',
    icon: '💤',
    xp: 20,
    check: (log) => Number(log?.sleep_hours) >= 8,
  },
  {
    id: 'read_10',
    name: 'Reader',
    desc: 'Read 10 minutes',
    icon: '📚',
    xp: 15,
    check: (log) => (log?.reading_minutes || 0) >= 10,
  },
  {
    id: 'workout_20',
    name: 'Move',
    desc: 'Workout 20+ min',
    icon: '🏋️',
    xp: 25,
    check: (log) =>
      (log?.workout_duration_min || 0) >= 20 ||
      (log?.exercise_type && log.exercise_type !== 'rest'),
  },
  {
    id: 'focus_30',
    name: 'Deep work',
    desc: 'Focus 30 minutes',
    icon: '🎯',
    xp: 20,
    check: (log) => (log?.focus_minutes || 0) >= 30,
  },
  {
    id: 'veggies_3',
    name: 'Greens',
    desc: '3+ vegetable servings',
    icon: '🥬',
    xp: 15,
    check: (log) => (log?.vegetable_servings || 0) >= 3,
  },
]

export function getCompletedQuestIds(log) {
  const stored = log?.log_details?.quests_completed
  if (Array.isArray(stored)) return stored
  return []
}

export function evaluateQuests(log) {
  return DAILY_QUESTS.map((q) => ({
    ...q,
    done: q.check(log),
  }))
}

export function questXPForLog(log, previouslyCompleted = []) {
  let xp = 0
  const prev = new Set(previouslyCompleted)
  for (const q of DAILY_QUESTS) {
    if (q.check(log) && !prev.has(q.id)) xp += q.xp
  }
  return xp
}

export function newlyCompletedQuestIds(log, previouslyCompleted = []) {
  const prev = new Set(previouslyCompleted)
  return DAILY_QUESTS.filter((q) => q.check(log) && !prev.has(q.id)).map((q) => q.id)
}
