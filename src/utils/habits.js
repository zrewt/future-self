/**
 * Personalized Habits — Layer 1: tracking only.
 *
 * CRITICAL GUARDRAIL: nothing in this file feeds into scoring.js or
 * getFutureSelfBreakdown. Habits affect XP, weekly consistency, and
 * (later, once Goals/Achievements are wired up) progress tracking —
 * never the FSS composite. pillar_tag is stored for future use
 * (Layer 3 suggestions) but is not read by any scoring function.
 */

export const TRACKING_TYPES = {
    boolean:  { label: 'Yes / No', unit: null },
    minutes:  { label: 'Minutes',  unit: 'min' },
    times:    { label: 'Times',    unit: 'x' },
    amount:   { label: 'Amount',   unit: '' },
    distance: { label: 'Distance', unit: 'km' },
  }
  
  export const DIFFICULTY_XP = {
    easy: 10,
    moderate: 20,
    challenging: 30,
  }
  
  export const HABIT_CATEGORIES = [
    {
      key: 'fitness', label: '🏃 Fitness',
      presets: [
        { name: 'Run',       icon: '🏃', tracking_type: 'distance', target_value: 5,  target_unit: 'km',  pillar_tag: 'fitness' },
        { name: 'Walk',      icon: '🚶', tracking_type: 'minutes',  target_value: 30, target_unit: 'min', pillar_tag: 'fitness' },
        { name: 'Stretch',   icon: '🤸', tracking_type: 'boolean',  pillar_tag: 'fitness' },
        { name: 'Strength',  icon: '🏋️', tracking_type: 'boolean', pillar_tag: 'fitness' },
        { name: 'Mobility',  icon: '🧘‍♂️', tracking_type: 'minutes', target_value: 10, target_unit: 'min', pillar_tag: 'fitness' },
        { name: 'Sport',     icon: '⚽', tracking_type: 'boolean',  pillar_tag: 'fitness' },
      ],
    },
    {
      key: 'mind', label: '🧠 Mind',
      presets: [
        { name: 'Read',      icon: '📚', tracking_type: 'minutes', target_value: 20, target_unit: 'min', pillar_tag: 'focus' },
        { name: 'Meditate',  icon: '🧘', tracking_type: 'minutes', target_value: 10, target_unit: 'min', pillar_tag: 'focus' },
        { name: 'Journal',   icon: '✍️', tracking_type: 'boolean', pillar_tag: 'focus' },
        { name: 'Focus',     icon: '🎯', tracking_type: 'minutes', target_value: 30, target_unit: 'min', pillar_tag: 'focus' },
        { name: 'Learn',     icon: '💡', tracking_type: 'minutes', target_value: 20, target_unit: 'min', pillar_tag: 'focus' },
      ],
    },
    {
      key: 'health', label: '🥗 Health',
      presets: [
        { name: 'Vegetables', icon: '🥦', tracking_type: 'times',  target_value: 3,    target_unit: 'servings', pillar_tag: 'nutrition' },
        { name: 'Fruit',      icon: '🍎', tracking_type: 'times',  target_value: 2,    target_unit: 'servings', pillar_tag: 'nutrition' },
        { name: 'Water',      icon: '💧', tracking_type: 'amount', target_value: 2500, target_unit: 'ml',       pillar_tag: 'nutrition' },
        { name: 'Protein',    icon: '🥩', tracking_type: 'times',  target_value: 3,    target_unit: 'servings', pillar_tag: 'nutrition' },
        { name: 'Sleep',      icon: '😴', tracking_type: 'boolean', pillar_tag: 'energy' },
      ],
    },
    {
      key: 'personal', label: '🌱 Personal',
      presets: [
        { name: 'Wake up early',        icon: '🌅', tracking_type: 'boolean' },
        { name: 'Practice instrument',  icon: '🎸', tracking_type: 'minutes', target_value: 20, target_unit: 'min' },
        { name: 'Learn a language',     icon: '🇫🇷', tracking_type: 'minutes', target_value: 15, target_unit: 'min' },
        { name: 'Spend time outside',   icon: '🌳', tracking_type: 'boolean' },
      ],
    },
  ]
  
  export function xpForCompletion(habit) {
    return DIFFICULTY_XP[habit.difficulty] || DIFFICULTY_XP.moderate
  }
  
  export function isHabitLogComplete(habit, log) {
    if (!log) return false
    if (habit.tracking_type === 'boolean') return !!log.completed
  
    const target = Number(habit.target_value) || 0
    if (target <= 0) return Number(log.value) > 0
    return Number(log.value) >= target
  }
  
  /**
   * habitLogs is expected sorted newest-first (as returned by useUserStore).
   * Rolling 7-day window, not calendar week — consistent with the rest of
   * the app's "logged-day count" pattern (see comparePillarsWeekOverWeek).
   */
  export function getWeekProgress(habit, habitLogs) {
    const habitEntries = habitLogs.filter((l) => l.habit_id === habit.id).slice(0, 7)
    const completed = habitEntries.filter((l) => isHabitLogComplete(habit, l)).length
    const target = Math.min(habit.frequency_per_week || 7, 7)
    return { completed, target }
  }
  
  /**
   * Longer-window consistency % — for a future habit detail view.
   */
  export function getConsistency(habit, habitLogs, windowDays = 56) {
    const habitEntries = habitLogs.filter((l) => l.habit_id === habit.id).slice(0, windowDays)
    if (!habitEntries.length) return null
    const completed = habitEntries.filter((l) => isHabitLogComplete(habit, l)).length
    return Math.round((completed / habitEntries.length) * 100)
  }
  
  export function getTodayLogForHabit(habit, habitLogs, todayISO) {
    return habitLogs.find((l) => l.habit_id === habit.id && l.log_date === todayISO) || null
  }