export const PRESET_WORKOUTS = [
    { id: 'upper_body',   name: 'Upper Body',    emoji: '💪', type: 'gym',   duration: 45 },
    { id: 'lower_body',   name: 'Lower Body',    emoji: '🦵', type: 'gym',   duration: 45 },
    { id: 'full_body',    name: 'Full Body',     emoji: '🏋️', type: 'gym',   duration: 60 },
    { id: 'run_5k',       name: '5K Run',        emoji: '🏃', type: 'run',   duration: 30 },
    { id: 'run_10k',      name: '10K Run',       emoji: '🏃', type: 'run',   duration: 60 },
    { id: 'hiit',         name: 'HIIT',          emoji: '⚡', type: 'gym',   duration: 20 },
    { id: 'yoga_flow',    name: 'Yoga Flow',     emoji: '🧘', type: 'yoga',  duration: 30 },
    { id: 'sport_game',   name: 'Sport / Game',  emoji: '⚽', type: 'sport', duration: 60 },
    { id: 'walk',         name: 'Walk',          emoji: '🚶', type: 'run',   duration: 30 },
    { id: 'swim',         name: 'Swim',          emoji: '🏊', type: 'sport', duration: 45 },
    { id: 'cycling',      name: 'Cycling',       emoji: '🚴', type: 'sport', duration: 45 },
    { id: 'rest_day',     name: 'Rest Day',      emoji: '😴', type: 'rest',  duration: 0  },
  ]
  
  const STORAGE_KEY = 'qyven_saved_workouts'
  
  export function getSavedWorkouts() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch { return [] }
  }
  
  export function saveWorkout(workout) {
    const saved = getSavedWorkouts().filter((w) => w.id !== workout.id)
    saved.unshift(workout)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.slice(0, 10))) } catch {}
  }
  
  export function deleteSavedWorkout(id) {
    const saved = getSavedWorkouts().filter((w) => w.id !== id)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)) } catch {}
  }