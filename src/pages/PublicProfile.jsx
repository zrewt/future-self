import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { getLevelName } from '../utils/scoring'
import { ACHIEVEMENTS } from '../data/achievements'
import Spinner from '../components/ui/Spinner'

const PILLAR_COLORS = {
  fitness_score:    '#D85A30',
  nutrition_score:  '#1D9E75',
  energy_score:     '#EF9F27',
  focus_score:      '#7F77DD',
  longevity_score:  '#1D9E75',
}

const TIER_STYLES = {
  bronze:    'bg-amber-100 text-amber-800 border-amber-200',
  silver:    'bg-slate-100 text-slate-700 border-slate-200',
  gold:      'bg-yellow-100 text-yellow-800 border-yellow-200',
  legendary: 'bg-purple-100 text-purple-800 border-purple-200',
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-extrabold text-white tabular-nums mt-0.5" style={color ? { color } : {}}>
        {value}
      </p>
      {sub && <p className="text-white/50 text-[10px] font-semibold mt-0.5">{sub}</p>}
    </div>
  )
}

export default function PublicProfile() {
  const { username } = useParams()
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [data, setData]         = useState(null)

  useEffect(() => {
    if (!username) return

    async function load() {
      // 1. Find profile by username
      const { data: profile, error: profileErr } = await supabase
        .from('users_profile')
        .select('id, username, level, total_xp, current_streak, longest_streak, avatar_class')
        .ilike('username', username)
        .maybeSingle()

      if (profileErr || !profile) { setNotFound(true); setLoading(false); return }

      // 2. Fetch recent logs (last 7) and achievements in parallel
      const [logsRes, achRes] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('log_date, future_self_score, fitness_score, nutrition_score, energy_score, focus_score, longevity_score, is_perfect_day')
          .eq('user_id', profile.id)
          .order('log_date', { ascending: false })
          .limit(30),
        supabase
          .from('achievements')
          .select('achievement_key, earned_at')
          .eq('user_id', profile.id)
          .order('earned_at', { ascending: false })
          .limit(6),
      ])

      const logs         = logsRes.data  || []
      const earnedKeys   = (achRes.data  || []).map((a) => a.achievement_key)
      const earnedDates  = Object.fromEntries((achRes.data || []).map((a) => [a.achievement_key, a.earned_at]))

      // Best FSS and recent avg
      const bestFSS  = logs.reduce((m, l) => Math.max(m, l.future_self_score || 0), 0)
      const recentFSS = logs.length
        ? Math.round(logs.slice(0, 7).reduce((s, l) => s + (l.future_self_score || 0), 0) / Math.min(logs.length, 7))
        : 0

      // Pillar averages (last 30 days)
      const pillars = ['fitness_score','nutrition_score','energy_score','focus_score','longevity_score'].map((key) => ({
        key,
        label: key.replace('_score', '').charAt(0).toUpperCase() + key.replace('_score', '').slice(1),
        avg: logs.length
          ? Math.round(logs.reduce((s, l) => s + (l[key] || 0), 0) / logs.length)
          : 0,
        color: PILLAR_COLORS[key],
      }))

      // Recent streak chart (last 7 days)
      const last7 = logs.slice(0, 7).reverse()

      // Earned achievements with details
      const recentAchievements = earnedKeys
        .map((key) => {
          const def = ACHIEVEMENTS.find((a) => a.key === key)
          if (!def) return null
          return { ...def, earned_at: earnedDates[key] }
        })
        .filter(Boolean)
        .slice(0, 6)

      const perfectDays = logs.filter((l) => l.is_perfect_day).length

      setData({
        profile,
        bestFSS,
        recentFSS,
        pillars,
        last7,
        recentAchievements,
        totalLogs: logs.length,
        perfectDays,
      })
      setLoading(false)
    }

    load()
  }, [username])

  if (loading) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="app-bg min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Profile not found</h1>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          No Qyven user with username <span className="font-bold text-primary">@{username}</span>
        </p>
        <Link to="/login" className="btn-primary mt-6">
          Join Qyven
        </Link>
      </div>
    )
  }

  const { profile, bestFSS, recentFSS, pillars, last7, recentAchievements, totalLogs, perfectDays } = data
  const levelName = getLevelName(profile.level)
  const initial   = (profile.username || '?')[0].toUpperCase()

  function getFSSLabel(s) {
    if (s >= 85) return 'Elite 🔥'
    if (s >= 70) return 'Strong 💪'
    if (s >= 55) return 'Building 📈'
    if (s >= 40) return 'Rising ⚡'
    return 'Starting 🌱'
  }

  return (
    <div className="app-bg min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-8 pb-16">

        {/* ── Hero card ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#7F77DD] via-[#6366f1] to-[#14b8a6] text-white shadow-xl mb-4">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-8 -translate-x-8" />

          {/* Header */}
          <div className="flex items-center gap-4 mb-5 relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-extrabold shadow-md">
              {initial}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight">{profile.username}</h1>
              <p className="text-white/70 text-sm font-semibold">
                Lv.{profile.level} · {levelName}
              </p>
              <p className="text-white/50 text-xs font-medium mt-0.5">
                qyven.vercel.app/u/{profile.username}
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 relative mb-2">
            <StatCard label="Future Self Score" value={recentFSS} sub={getFSSLabel(recentFSS)} />
            <StatCard label="Best Score" value={bestFSS} sub="all time" />
            <StatCard label="Current Streak" value={`${profile.current_streak}🔥`} sub="days" />
            <StatCard label="Longest Streak" value={`${profile.longest_streak || 0}🔥`} sub="days" />
          </div>

          {/* Watermark */}
          <p className="text-center text-white/25 text-[10px] font-bold uppercase tracking-widest mt-3 relative">
            qyven.vercel.app
          </p>
        </div>

        {/* ── 7-day score chart ─────────────────────────────────────────── */}
        {last7.length > 0 && (
          <div className="glass-card p-4 mb-4">
            <p className="section-title mb-3">Last {last7.length} days</p>
            <div className="flex items-end gap-1.5 h-16">
              {last7.map((log, i) => {
                const pct = Math.max(4, (log.future_self_score || 0))
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${pct}%`,
                        background: pct >= 70 ? '#1D9E75' : pct >= 50 ? '#7F77DD' : '#EF9F27',
                        minHeight: '4px',
                      }}
                    />
                    <p className="text-[9px] text-slate-400 font-bold tabular-nums">
                      {log.future_self_score || 0}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-[9px] text-slate-400">
                {last7[0]?.log_date?.slice(5)}
              </p>
              <p className="text-[9px] text-slate-400">
                {last7[last7.length - 1]?.log_date?.slice(5)}
              </p>
            </div>
          </div>
        )}

        {/* ── Pillar breakdown ──────────────────────────────────────────── */}
        <div className="glass-card p-4 mb-4">
          <p className="section-title mb-3">30-day pillar averages</p>
          <div className="space-y-2">
            {pillars.sort((a, b) => b.avg - a.avg).map((p) => (
              <div key={p.key} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 w-20">{p.label}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${p.avg}%`, background: p.color }}
                  />
                </div>
                <span className="text-sm font-bold tabular-nums w-8 text-right text-slate-700 dark:text-slate-200">
                  {p.avg}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total logs',   value: totalLogs   },
            { label: 'Perfect days', value: perfectDays },
            { label: 'Level',        value: profile.level },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className="text-2xl font-extrabold bg-gradient-to-br from-primary to-primary-600 bg-clip-text text-transparent">
                {s.value}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wide">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Recent achievements ───────────────────────────────────────── */}
        {recentAchievements.length > 0 && (
          <div className="glass-card p-4 mb-6">
            <p className="section-title mb-3">Recent achievements</p>
            <div className="grid grid-cols-2 gap-2">
              {recentAchievements.map((ach) => (
                <div
                  key={ach.key}
                  className="flex items-center gap-2 rounded-2xl p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                >
                  <span className="text-2xl">{ach.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{ach.name}</p>
                    <span className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${TIER_STYLES[ach.tier]}`}>
                      {ach.tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <div className="glass-card p-5 text-center">
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">
            Track your Future Self Score
          </p>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Join {profile.username} on Qyven — the habit tracker that scores your day.
          </p>
          <Link to="/signup" className="btn-primary mt-4 inline-flex shadow-glow">
            Start for free →
          </Link>
          <p className="text-xs text-slate-400 mt-3">qyven.vercel.app</p>
        </div>
      </div>
    </div>
  )
}