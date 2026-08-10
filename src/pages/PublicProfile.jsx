import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { supabase } from '../services/supabase'
import { getLevelName } from '../utils/scoring'
import { ACHIEVEMENTS } from '../data/achievements'
import { useTheme } from '../hooks/useTheme'
import Spinner from '../components/ui/Spinner'

// ── Tier badge styles — explicit colors, no bg-clip-text, work in both modes ──
const TIER_CONFIG = {
  bronze:    { bg: 'rgba(217,119,6,0.12)',  text: '#B45309', border: 'rgba(217,119,6,0.25)'  },
  silver:    { bg: 'rgba(100,116,139,0.12)', text: '#475569', border: 'rgba(100,116,139,0.25)' },
  gold:      { bg: 'rgba(234,179,8,0.12)',  text: '#A16207', border: 'rgba(234,179,8,0.25)'  },
  legendary: { bg: 'rgba(127,90,240,0.12)', text: '#6D44E0', border: 'rgba(127,90,240,0.25)' },
}

// Dark mode tier overrides — lighter text for dark backgrounds
const TIER_CONFIG_DARK = {
  bronze:    { bg: 'rgba(217,119,6,0.15)',  text: '#FBB040', border: 'rgba(217,119,6,0.3)'   },
  silver:    { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8', border: 'rgba(148,163,184,0.25)' },
  gold:      { bg: 'rgba(234,179,8,0.15)',  text: '#FCD34D', border: 'rgba(234,179,8,0.3)'   },
  legendary: { bg: 'rgba(127,90,240,0.15)', text: '#A882F5', border: 'rgba(127,90,240,0.3)'  },
}

function getFSSLabel(s) {
  if (s >= 85) return { text: 'Elite',    emoji: '🔥' }
  if (s >= 70) return { text: 'Strong',   emoji: '💪' }
  if (s >= 55) return { text: 'Building', emoji: '📈' }
  if (s >= 40) return { text: 'Rising',   emoji: '⚡' }
  return             { text: 'Starting',  emoji: '🌱' }
}

const PILLARS = [
  { key: 'fitness_score',   label: 'Fitness',   emoji: '🏋️', color: '#7F5AF0' },
  { key: 'nutrition_score', label: 'Nutrition',  emoji: '🥗', color: '#00E87A' },
  { key: 'energy_score',    label: 'Energy',     emoji: '💤', color: '#4DA6FF' },
  { key: 'focus_score',     label: 'Focus',      emoji: '🎯', color: '#FFB830' },
  { key: 'longevity_score', label: 'Longevity',  emoji: '🌿', color: '#FF5C5C' },
]

export default function PublicProfile() {
  const { username }          = useParams()
  const { theme }             = useTheme()
  const isDark                = theme === 'dark'
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [data, setData]       = useState(null)
  const [shareStatus, setShareStatus] = useState(null)

  useEffect(() => {
    if (!username) return
    async function load() {
      const { data: profile, error: profileErr } = await supabase
        .from('users_profile')
        .select('id, username, level, total_xp, current_streak, longest_streak')
        .ilike('username', username)
        .maybeSingle()

      if (profileErr || !profile) { setNotFound(true); setLoading(false); return }

      const [logsRes, achRes] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('log_date, future_self_score, fitness_score, nutrition_score, energy_score, focus_score, longevity_score, is_perfect_day')
          .eq('user_id', profile.id)
          .order('log_date', { ascending: false })
          .limit(30),
        supabase
          .from('achievements')
          .select('achievement_key, earned_at, tier')
          .eq('user_id', profile.id)
          .order('earned_at', { ascending: false })
          .limit(6),
      ])

      const logs      = logsRes.data || []
      const achData   = achRes.data  || []
      const chartData = [...logs].reverse().map((l) => ({
        date: l.log_date.slice(5),
        fss:  l.future_self_score,
      }))

      const bestFSS   = logs.reduce((m, l) => Math.max(m, l.future_self_score || 0), 0)
      const recentFSS = logs.length
        ? Math.round(logs.slice(0, 7).reduce((s, l) => s + (l.future_self_score || 0), 0) / Math.min(logs.length, 7))
        : 0

      const pillars = PILLARS.map((p) => ({
        ...p,
        avg: logs.length
          ? Math.round(logs.reduce((s, l) => s + (l[p.key] || 0), 0) / logs.length)
          : 0,
      })).sort((a, b) => b.avg - a.avg)

      const achievements = achData
        .map((a) => {
          const def = ACHIEVEMENTS.find((x) => x.key === a.achievement_key)
          return def ? { ...def, tier: a.tier || def.tier, earned_at: a.earned_at } : null
        })
        .filter(Boolean)

      setData({
        profile, bestFSS, recentFSS, pillars, chartData,
        achievements,
        totalLogs:   logs.length,
        perfectDays: logs.filter((l) => l.is_perfect_day).length,
      })
      setLoading(false)
    }
    load()
  }, [username])

  async function handleShare() {
    if (!data) return
    const url  = `https://qyven.vercel.app/u/${data.profile.username}`
    const text = `${data.profile.username} is Level ${data.profile.level} with a ${data.profile.current_streak} day streak on Qyven 🔥\n${url}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `${data.profile.username} on Qyven`, text, url })
        setShareStatus('shared')
      } else {
        await navigator.clipboard.writeText(url)
        setShareStatus('copied')
      }
    } catch { /* cancelled */ }
    setTimeout(() => setShareStatus(null), 2000)
  }

  if (loading) {
    return <div className="app-bg min-h-screen flex items-center justify-center"><Spinner /></div>
  }

  if (notFound) {
    return (
      <div className="app-bg min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-[#E8F0E0]">Profile not found</h1>
        <p className="text-sm text-slate-500 dark:text-[#5A7050] font-medium mt-2">
          No Qyven user found for <span className="font-bold text-[#7F5AF0] dark:text-[#00E87A]">@{username}</span>
        </p>
        <Link to="/signup" className="btn-primary mt-6">Join Qyven →</Link>
      </div>
    )
  }

  const { profile, bestFSS, recentFSS, pillars, chartData, achievements, totalLogs, perfectDays } = data
  const levelName  = getLevelName(profile.level)
  const initial    = (profile.username || '?')[0].toUpperCase()
  const fssLabel   = getFSSLabel(recentFSS)
  const topPillar  = pillars[0]

  // Primary accent per mode
  const primaryHex = isDark ? '#00E87A' : '#7F5AF0'

  const tooltipStyle = {
    background: isDark ? '#161C0F' : '#fff',
    border: `1px solid ${isDark ? 'rgba(0,232,122,0.15)' : '#e2e8f0'}`,
    borderRadius: 12,
    fontSize: 11,
    color: isDark ? '#E8F0E0' : '#0D1409',
  }

  const tierCfg = isDark ? TIER_CONFIG_DARK : TIER_CONFIG

  return (
    <div className="app-bg min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-8 pb-20 space-y-4">

        {/* ── Hero — gradient card ── */}
        <div
          className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #00E87A22 0%, #161C0F 40%, #7F5AF022 100%), linear-gradient(135deg, #1E2616, #0A0D08)'
              : 'linear-gradient(135deg, #7F5AF0, #6D44E0, #4DA6FF)',
          }}
        >
          {/* Subtle decorative circles — small and restrained */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-white/5 translate-y-8 -translate-x-8 pointer-events-none" />

          {/* Profile header */}
          <div className="flex items-center gap-4 mb-5 relative z-10">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-extrabold shadow-md shrink-0"
              style={{ background: isDark ? 'rgba(0,232,122,0.2)' : 'rgba(255,255,255,0.2)', color: isDark ? '#00E87A' : '#fff' }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight truncate" style={{ color: isDark ? '#E8F0E0' : '#fff' }}>
                {profile.username}
              </h1>
              <p className="text-sm font-semibold mt-0.5" style={{ color: isDark ? '#9DB890' : 'rgba(255,255,255,0.75)' }}>
                Lv.{profile.level} · {levelName}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: isDark ? '#5A7050' : 'rgba(255,255,255,0.45)' }}>
                qyven.vercel.app/u/{profile.username}
              </p>
            </div>
          </div>

          {/* Score + best */}
          <div className="grid grid-cols-2 gap-2 relative z-10 mb-3">
            {[
              { label: '7-day avg', value: recentFSS, sub: `${fssLabel.emoji} ${fssLabel.text}` },
              { label: 'Best score', value: bestFSS,  sub: '🏆 All time' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl px-4 py-3 text-center"
                style={{ background: isDark ? 'rgba(0,232,122,0.08)' : 'rgba(255,255,255,0.12)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isDark ? '#5A7050' : 'rgba(255,255,255,0.55)' }}>
                  {s.label}
                </p>
                <p className="text-4xl font-extrabold tabular-nums leading-tight mt-0.5" style={{ color: isDark ? '#E8F0E0' : '#fff' }}>
                  {s.value}
                </p>
                <p className="text-xs font-bold mt-0.5" style={{ color: isDark ? '#9DB890' : 'rgba(255,255,255,0.7)' }}>
                  {s.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Streak row */}
          <div
            className="rounded-2xl px-4 py-2.5 flex items-center justify-between relative z-10"
            style={{ background: isDark ? 'rgba(0,232,122,0.08)' : 'rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <p className="text-[10px] font-bold uppercase" style={{ color: isDark ? '#5A7050' : 'rgba(255,255,255,0.55)' }}>Current streak</p>
                <p className="text-lg font-extrabold tabular-nums" style={{ color: isDark ? '#E8F0E0' : '#fff' }}>{profile.current_streak} days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase" style={{ color: isDark ? '#5A7050' : 'rgba(255,255,255,0.55)' }}>Longest</p>
              <p className="text-lg font-extrabold tabular-nums" style={{ color: isDark ? '#E8F0E0' : '#fff' }}>{profile.longest_streak || 0} days</p>
            </div>
          </div>

          <p className="text-center text-[10px] font-bold uppercase tracking-widest mt-3 relative z-10" style={{ color: isDark ? '#5A7050' : 'rgba(255,255,255,0.3)' }}>
            qyven.vercel.app
          </p>
        </div>

        {/* ── Share button ── */}
        <button
          type="button"
          onClick={handleShare}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {shareStatus === 'shared' ? '✓ Shared!' : shareStatus === 'copied' ? '✓ Link copied!' : `↗ Share ${profile.username}'s profile`}
        </button>

        {/* ── Score chart ── */}
        {chartData.length > 3 && (
          <div className="glass-card p-5">
            <p className="section-title mb-1">Score history</p>
            <p className="text-xs text-slate-400 dark:text-[#5A7050] font-medium mb-3">Last 30 days</p>
            <div style={{ width: '100%', height: 140 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                  <defs>
                    <linearGradient id="pubFssGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={primaryHex} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={primaryHex} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: isDark ? '#5A7050' : '#94a3b8' }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'FSS']} />
                  <Area type="monotone" dataKey="fss" stroke={primaryHex} strokeWidth={2} fill="url(#pubFssGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Pillar breakdown ── */}
        <div className="glass-card p-5">
          <p className="section-title mb-3">Pillar averages · 30 days</p>
          <div className="space-y-2.5">
            {pillars.map((p) => (
              <div key={p.key} className="flex items-center gap-3">
                <span className="text-base w-6 shrink-0">{p.emoji}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-[#5A7050] w-20 shrink-0">{p.label}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.avg}%`, background: p.color }} />
                </div>
                <span className="text-sm font-extrabold tabular-nums w-8 text-right text-slate-700 dark:text-[#E8F0E0]">{p.avg}</span>
              </div>
            ))}
          </div>
          {topPillar && (
            <p className="text-xs text-slate-500 dark:text-[#5A7050] font-medium mt-3 pt-3 border-t border-slate-100 dark:border-white/6">
              💡 {profile.username}&apos;s strongest pillar is{' '}
              <span className="font-bold text-slate-700 dark:text-[#E8F0E0]">{topPillar.label}</span>
              {' '}— averaging {topPillar.avg} over the last 30 days.
            </p>
          )}
        </div>

        {/* ── Stats — fixed: no bg-clip-text, explicit color per mode ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total logs',   value: totalLogs,    icon: '📋' },
            { label: 'Perfect days', value: perfectDays,  icon: '⭐' },
            { label: 'Level',        value: profile.level, icon: '🎯' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <span className="text-xl block mb-1">{s.icon}</span>
              <p
                className="text-2xl font-extrabold tabular-nums"
                style={{ color: primaryHex }}
              >
                {s.value}
              </p>
              <p className="text-[9px] text-slate-500 dark:text-[#5A7050] mt-0.5 font-bold uppercase tracking-wide">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Achievements — fixed tier badges ── */}
        {achievements.length > 0 && (
          <div className="glass-card p-5">
            <p className="section-title mb-3">Recent achievements</p>
            <div className="grid grid-cols-2 gap-2">
              {achievements.map((ach) => {
                const tc = tierCfg[ach.tier] || tierCfg.bronze
                return (
                  <div
                    key={ach.key}
                    className="flex items-center gap-2.5 rounded-2xl p-3 border"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.04)' : '#F8F9FA',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E6DC',
                    }}
                  >
                    <span className="text-2xl shrink-0">{ach.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-[#E8F0E0] leading-tight truncate">
                        {ach.name}
                      </p>
                      {/* KEY FIX: explicit inline styles, no Tailwind dark variants that get purged */}
                      <span
                        className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full mt-1"
                        style={{
                          background: tc.bg,
                          color: tc.text,
                          border: `1px solid ${tc.border}`,
                        }}
                      >
                        {ach.tier}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="glass-card p-6 text-center">
          <p className="text-xl font-extrabold text-slate-900 dark:text-[#E8F0E0] mb-1">
            Want your own Future Self Score?
          </p>
          <p className="text-sm text-slate-500 dark:text-[#5A7050] font-medium leading-relaxed mb-4">
            {profile.username} is building their best self on Qyven — track habits, score your day, see your progress compound.
          </p>
          <Link to="/signup" className="btn-primary inline-flex px-8 py-3 text-base">
            Start for free →
          </Link>
          <p className="text-xs text-slate-400 dark:text-[#5A7050] mt-3">No credit card · takes 60 seconds</p>
        </div>

      </div>
    </div>
  )
}
