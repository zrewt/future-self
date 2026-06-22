import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { supabase } from '../services/supabase'
import { getLevelName } from '../utils/scoring'
import { ACHIEVEMENTS } from '../data/achievements'
import Spinner from '../components/ui/Spinner'
import {
 CartesianGrid,
} from 'recharts'

const TIER_STYLES = {
  bronze:    'bg-amber-100 text-amber-800 border border-amber-200',
  silver:    'bg-slate-100 text-slate-700 border border-slate-200',
  gold:      'bg-yellow-100 text-yellow-800 border border-yellow-200',
  legendary: 'bg-purple-100 text-purple-800 border border-purple-200',
}

function getFSSLabel(s) {
  if (s >= 85) return { text: 'Elite', emoji: '🔥' }
  if (s >= 70) return { text: 'Strong', emoji: '💪' }
  if (s >= 55) return { text: 'Building', emoji: '📈' }
  if (s >= 40) return { text: 'Rising', emoji: '⚡' }
  return { text: 'Starting', emoji: '🌱' }
}

const PILLARS = [
  { key: 'fitness_score',   label: 'Fitness',   emoji: '🏋️', color: '#D85A30' },
  { key: 'nutrition_score', label: 'Nutrition',  emoji: '🥗', color: '#1D9E75' },
  { key: 'energy_score',    label: 'Sleep',      emoji: '💤', color: '#EF9F27' },
  { key: 'focus_score',     label: 'Focus',      emoji: '🎯', color: '#7F77DD' },
  { key: 'longevity_score', label: 'Longevity',  emoji: '🌿', color: '#14b8a6' },
]

export default function PublicProfile() {
  const { username }              = useParams()
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [data, setData]           = useState(null)
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
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Profile not found</h1>
        <p className="text-sm text-slate-500 font-medium mt-2">
          No Qyven user found for <span className="font-bold text-primary">@{username}</span>
        </p>
        <Link to="/signup" className="btn-primary mt-6 shadow-glow">Join Qyven →</Link>
      </div>
    )
  }

  const { profile, bestFSS, recentFSS, pillars, chartData, achievements, totalLogs, perfectDays } = data
  const levelName  = getLevelName(profile.level)
  const initial    = (profile.username || '?')[0].toUpperCase()
  const fssLabel   = getFSSLabel(recentFSS)
  const topPillar  = pillars[0]

  return (
    <div className="app-bg min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-8 pb-20 space-y-4">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#7F77DD] via-[#6366f1] to-[#14b8a6] text-white shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-12 translate-x-12 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-8 -translate-x-8 pointer-events-none" />

          {/* Profile header */}
          <div className="flex items-center gap-4 mb-5 relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-extrabold shadow-md shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight truncate">{profile.username}</h1>
              <p className="text-white/70 text-sm font-semibold">Lv.{profile.level} · {levelName}</p>
              <p className="text-white/40 text-xs font-medium mt-0.5">qyven.vercel.app/u/{profile.username}</p>
            </div>
          </div>

          {/* Score + streak */}
          <div className="grid grid-cols-2 gap-2 relative mb-3">
            <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">7-day avg</p>
              <p className="text-4xl font-extrabold tabular-nums text-white leading-tight mt-0.5">{recentFSS}</p>
              <p className="text-white/70 text-xs font-bold mt-0.5">{fssLabel.emoji} {fssLabel.text}</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3 text-center">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Best score</p>
              <p className="text-4xl font-extrabold tabular-nums text-white leading-tight mt-0.5">{bestFSS}</p>
              <p className="text-white/70 text-xs font-bold mt-0.5">🏆 All time</p>
            </div>
          </div>

          {/* Streak */}
          <div className="bg-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between relative">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase">Current streak</p>
                <p className="text-lg font-extrabold text-white tabular-nums">{profile.current_streak} days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] font-bold uppercase">Longest</p>
              <p className="text-lg font-extrabold text-white tabular-nums">{profile.longest_streak || 0} days</p>
            </div>
          </div>

          <p className="text-center text-white/25 text-[10px] font-bold uppercase tracking-widest mt-3 relative">
            qyven.vercel.app
          </p>
        </div>

        {/* ── Share this profile ─────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleShare}
          className="btn-primary w-full flex items-center justify-center gap-2 shadow-glow"
        >
          {shareStatus === 'shared' ? '✓ Shared!' : shareStatus === 'copied' ? '✓ Link copied!' : `↗ Share ${profile.username}'s profile`}
        </button>

        {/* ── Score chart ───────────────────────────────────────────────── */}
        {chartData.length > 3 && (
          <div className="glass-card p-5">
            <p className="section-title mb-1">Score history</p>
            <p className="text-xs text-slate-400 font-medium mb-3">Last 30 days — Future Self Score</p>
            <div style={{ width: '100%', height: 140 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                  <defs>
                    <linearGradient id="pubFssGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7F77DD" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#7F77DD" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 11 }}
                    formatter={(v) => [v, 'Future Self Score']}
                  />
                  <Area type="monotone" dataKey="fss" stroke="#7F77DD" strokeWidth={2} fill="url(#pubFssGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Pillar breakdown ──────────────────────────────────────────── */}
        <div className="glass-card p-5">
          <p className="section-title mb-3">Pillar averages · 30 days</p>
          <div className="space-y-2.5">
            {pillars.map((p) => (
              <div key={p.key} className="flex items-center gap-3">
                <span className="text-base w-6 shrink-0">{p.emoji}</span>
                <span className="text-xs font-bold text-slate-500 w-20 shrink-0">{p.label}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${p.avg}%`, background: p.color }}
                  />
                </div>
                <span className="text-sm font-extrabold tabular-nums w-8 text-right text-slate-700 dark:text-slate-200">{p.avg}</span>
              </div>
            ))}
          </div>
          {topPillar && (
            <p className="text-xs text-slate-500 font-medium mt-3 pt-3 border-t border-slate-100 dark:border-white/10">
              💡 {profile.username}'s strongest pillar is <span className="font-bold text-slate-700 dark:text-slate-200">{topPillar.label}</span> — averaging {topPillar.avg} over the last 30 days.
            </p>
          )}
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total logs',   value: totalLogs,   icon: '📋' },
            { label: 'Perfect days', value: perfectDays, icon: '⭐' },
            { label: 'Level',        value: profile.level, icon: '🎯' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <span className="text-xl block mb-1">{s.icon}</span>
              <p className="text-2xl font-extrabold bg-gradient-to-br from-primary to-primary-600 bg-clip-text text-transparent tabular-nums">
                {s.value}
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Achievements ──────────────────────────────────────────────── */}
        {achievements.length > 0 && (
          <div className="glass-card p-5">
            <p className="section-title mb-3">Recent achievements</p>
            <div className="grid grid-cols-2 gap-2">
              {achievements.map((ach) => (
                <div
                  key={ach.key}
                  className="flex items-center gap-2.5 rounded-2xl p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                >
                  <span className="text-2xl shrink-0">{ach.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">{ach.name}</p>
                    <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full mt-0.5 ${TIER_STYLES[ach.tier] || TIER_STYLES.bronze}`}>
                      {ach.tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <div className="glass-card p-6 text-center">
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
            Want your own Future Self Score?
          </p>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">
            {profile.username} is building their best self on Qyven — track habits, score your day, see your progress compound.
          </p>
          <Link
            to="/signup"
            className="btn-primary inline-flex shadow-glow px-8 py-3 text-base"
          >
            Start for free →
          </Link>
          <p className="text-xs text-slate-400 mt-3">No credit card · takes 60 seconds</p>
        </div>

      </div>
    </div>
  )
}