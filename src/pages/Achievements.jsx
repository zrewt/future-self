import { useEffect, useState } from 'react'
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../data/achievements'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import { useTheme } from '../hooks/useTheme'
import { fetchAchievementStats } from '../utils/achievementStats'
import Spinner from '../components/ui/Spinner'
import { getPathConfig } from '../data/paths'

// Explicit tier configs — no bg-clip-text, no Tailwind dark variants that get purged
const TIER_LIGHT = {
  bronze:    { bg: 'rgba(217,119,6,0.1)',   text: '#B45309', border: 'rgba(217,119,6,0.22)'   },
  silver:    { bg: 'rgba(100,116,139,0.1)',  text: '#475569', border: 'rgba(100,116,139,0.22)' },
  gold:      { bg: 'rgba(234,179,8,0.1)',   text: '#A16207', border: 'rgba(234,179,8,0.22)'   },
  legendary: { bg: 'rgba(124,58,237,0.1)',  text: '#6626d9', border: 'rgba(124,58,237,0.22)'  },
}

const TIER_DARK = {
  bronze:    { bg: 'rgba(217,119,6,0.14)',  text: '#FBB040', border: 'rgba(217,119,6,0.28)'   },
  silver:    { bg: 'rgba(148,163,184,0.1)', text: '#94A3B8', border: 'rgba(148,163,184,0.22)' },
  gold:      { bg: 'rgba(234,179,8,0.14)',  text: '#FCD34D', border: 'rgba(234,179,8,0.28)'   },
  legendary: { bg: 'rgba(127,90,240,0.14)', text: '#A882F5', border: 'rgba(127,90,240,0.28)'  },
}

const CATEGORY_LABELS = {
  streak:    'Streaks',
  sleep:     'Sleep',
  fitness:   'Fitness',
  nutrition: 'Nutrition',
  reading:   'Reading',
  focus:     'Focus',
  longevity: 'Longevity',
  xp:        'XP & levels',
}

export default function Achievements() {
  const { user, profile, earnedAchievements } = useUserStore()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const tierCfg = isDark ? TIER_DARK : TIER_LIGHT
  const pathConfig = getPathConfig(profile?.avatar_class)

  const [earnedDetails, setEarnedDetails] = useState({})
  const [stats, setStats]                 = useState(null)
  const [filter, setFilter]               = useState('all')
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [{ data }, s] = await Promise.all([
        supabase.from('achievements').select('achievement_key, earned_at').eq('user_id', user.id),
        fetchAchievementStats(user.id, useUserStore.getState().profile),
      ])
      const map = {}
      ;(data || []).forEach((a) => { map[a.achievement_key] = a.earned_at })
      setEarnedDetails(map)
      setStats(s)
      setLoading(false)
    }
    load()
  }, [user, earnedAchievements])

  if (loading || !stats) {
    return <div className="flex justify-center py-24"><Spinner /></div>
  }

  const earnedCount = ACHIEVEMENTS.filter(
    (a) => earnedAchievements.includes(a.key) || earnedDetails[a.key]
  ).length

  const filtered = filter === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => a.category === filter)

  const primaryHex = isDark ? '#00E87A' : '#7c3aed'

  return (
    <div className="animate-slide-up pb-6">
      {/* ── Header ── */}
      <header className="mb-4">
        <p className="section-title">Trophies</p>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-[#E8F0E0]">Achievements</h1>
        <p className="text-sm text-slate-500 dark:text-[#5A7050] font-medium mt-1">
          {earnedCount} / {ACHIEVEMENTS.length} unlocked
        </p>
        <p className="text-xs text-slate-400 dark:text-[#5A7050] font-semibold mt-0.5">
          {pathConfig.tone.achievementPrefix}
        </p>
        <div className="h-2 bg-slate-100 dark:bg-white/8 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(earnedCount / ACHIEVEMENTS.length) * 100}%`,
              background: isDark
                ? 'linear-gradient(90deg, #00E87A, #7F5AF0)'
                : 'linear-gradient(90deg, #ff7ac6, #7c3aed, #00cdb4)',
            }}
          />
        </div>
      </header>

      {/* ── Category filter pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {['all', ...ACHIEVEMENT_CATEGORIES].map((cat) => {
          const isActive = filter === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-150"
              style={{
                background: isActive
                  ? primaryHex
                  : isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                color: isActive
                  ? isDark ? '#0A0D08' : '#fff'
                  : isDark ? '#5A7050' : '#64748B',
                border: isActive
                  ? 'none'
                  : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(109,40,217,0.12)'}`,
              }}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
            </button>
          )
        })}
      </div>

      {/* ── Achievement grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((ach) => {
          const earned   = earnedAchievements.includes(ach.key) || earnedDetails[ach.key]
          const earnedAt = earnedDetails[ach.key]
          const prog     = ach.progress ? ach.progress(stats) : null
          const pct      = prog ? Math.min(100, Math.round((prog.current / prog.target) * 100)) : 0
          const tc       = tierCfg[ach.tier] || tierCfg.bronze

          return (
            <div
              key={ach.key}
              className="relative overflow-hidden rounded-3xl p-4 transition-all duration-200 border"
              style={{
                background: earned
                  ? isDark ? '#16201C' : '#FAF8FF'
                  : isDark ? '#111915' : '#FAFAFC',
                borderColor: earned
                  ? isDark ? 'rgba(94,234,212,0.22)' : 'rgba(124,58,237,0.22)'
                  : isDark ? 'rgba(148,163,184,0.12)' : 'rgba(109,40,217,0.10)',
                boxShadow: earned
                  ? isDark
                    ? '0 6px 18px rgba(0,0,0,0.2)'
                    : '0 4px 14px rgba(124,58,237,0.08)'
                  : 'none',
              }}
            >
              {earned && !isDark && (
                <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4]" />
              )}
              <div className="flex gap-3">
                <span
                  className="text-3xl"
                  style={{ filter: earned ? 'none' : 'grayscale(1)', opacity: earned ? 1 : 0.4 }}
                >
                  {ach.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold leading-tight"
                    style={{ color: earned ? (isDark ? '#E8F0E0' : '#1E293B') : (isDark ? '#5A7050' : '#94A3B8') }}
                  >
                    {ach.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: earned ? (isDark ? '#9DB890' : '#64748B') : (isDark ? '#5A7050' : '#94A3B8') }}
                  >
                    {ach.desc}
                  </p>

                  {/* Tier badge — explicit inline styles, visible in both modes */}
                  <span
                    className="inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{
                      background: tc.bg,
                      color: tc.text,
                      border: `1px solid ${tc.border}`,
                    }}
                  >
                    {ach.tier} · +{ach.xp} XP
                  </span>
                </div>

                {!earned && (
                  <span className="text-sm" style={{ opacity: 0.35 }}>🔒</span>
                )}
              </div>

              {/* Progress bar for unearned achievements */}
              {!earned && prog && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-bold mb-1"
                    style={{ color: isDark ? '#5A7050' : '#94A3B8' }}
                  >
                    <span>Progress</span>
                    <span className="tabular-nums">{prog.current} / {prog.target}</span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(109,40,217,0.08)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: isDark ? 'rgba(0,232,122,0.5)' : 'linear-gradient(90deg, rgba(255,122,198,0.7), rgba(124,58,237,0.7))',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Earned date */}
              {earned && earnedAt && (
                <p
                  className="text-[10px] font-semibold mt-2"
                  style={{ color: primaryHex }}
                >
                  Earned {new Date(earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
