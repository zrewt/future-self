import { create } from 'zustand'
import { supabase } from '../services/supabase'
import { localDateISO } from '../utils/date'

async function fetchOrCreateProfile(userId, user) {
  const { data: existing } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (existing) return existing

  const username =
    user?.user_metadata?.username ||
    user?.email?.split('@')[0] ||
    'User'

  const { data: created, error } = await supabase
    .from('users_profile')
    .insert({ id: userId, username })
    .select()
    .single()

  if (error) {
    console.error('Could not create profile:', error.message)
    return null
  }

  return created
}

export function needsOnboarding(user, profile) {
  if (!user) return false
  const metaDone = user.user_metadata?.onboarding_complete === true
  return !profile || !metaDone
}

export const useUserStore = create((set, get) => ({
  user: null,
  profile: null,
  todayLog: null,
  recentScores: [],
  recentLogs: [],
  earnedAchievements: [],
  authReady: false,
  dataLoading: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setTodayLog: (todayLog) => set({ todayLog }),
  setRecentScores: (recentScores) => set({ recentScores }),
  setRecentLogs: (recentLogs) => set({ recentLogs }),
  setEarnedAchievements: (earnedAchievements) => set({ earnedAchievements }),
  setAuthReady: (authReady) => set({ authReady }),

  loadUserData: async (userId, { silent = false } = {}) => {
    if (!userId) return
    if (!silent) set({ dataLoading: true })

    const today = localDateISO()
    const user = get().user

    try {
      const profile = await fetchOrCreateProfile(userId, user)

      const [todayLogRes, logsRes, achievementsRes] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('log_date', today)
          .maybeSingle(),
        supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', userId)
          .order('log_date', { ascending: false })
          .limit(30),
        supabase.from('achievements').select('achievement_key').eq('user_id', userId),
      ])

      const todayLog = todayLogRes.error ? null : todayLogRes.data
      const recentLogs = logsRes.data || []
      const recentScores = recentLogs.map((r) => r.future_self_score)
      const earnedAchievements = (achievementsRes.data || []).map((a) => a.achievement_key)

      set({
        profile,
        todayLog,
        recentLogs,
        recentScores,
        earnedAchievements,
        dataLoading: false,
      })
    } catch (err) {
      console.error('loadUserData failed:', err)
      set({ dataLoading: false })
    }
  },

  reset: () =>
    set({
      user: null,
      profile: null,
      todayLog: null,
      recentScores: [],
      recentLogs: [],
      earnedAchievements: [],
      dataLoading: false,
    }),
}))
