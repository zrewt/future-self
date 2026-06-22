import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import XPBar from '../components/XPBar'
import Spinner from '../components/ui/Spinner'
import { getLevelName } from '../utils/scoring'


export default function Profile() {
  const navigate  = useNavigate()
  const { user, profile, reset } = useUserStore()

  const [chartData, setChartData]   = useState([])
  const [stats, setStats]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [shareStatus, setShareStatus] = useState(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('log_date, future_self_score, nutrition_score, fitness_score, energy_score, focus_score, longevity_score, is_perfect_day')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true })
        .limit(30)

      if (!error && data) {
        setChartData(data.map((d) => ({
          date: d.log_date.slice(5),
          fss:  d.future_self_score,
          nut:  d.nutrition_score,
          fit:  d.fitness_score,
          nrg:  d.energy_score,
          foc:  d.focus_score,
          lon:  d.longevity_score,
        })))
        setStats({
          totalLogs:     data.length,
          perfectDays:   data.filter((d) => d.is_perfect_day).length,
          longestStreak: profile?.longest_streak ?? 0,
          bestFSS:       data.reduce((m, d) => Math.max(m, d.future_self_score || 0), 0),
          currentStreak: profile?.current_streak ?? 0,
        })
      }
      setLoading(false)
    }
    load()
  }, [user, profile?.longest_streak, profile?.current_streak])

  async function handleShare() {
    const url  = `${window.location.origin}/u/${profile.username}`
    const text = `Check out my Qyven profile — Level ${profile.level} with a ${profile.current_streak} day streak 🔥\n${url}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profile.username} on Qyven`, text, url })
        setShareStatus('shared')
      } else {
        await navigator.clipboard.writeText(url)
        setShareStatus('copied')
      }
    } catch { /* cancelled */ }
    setTimeout(() => setShareStatus(null), 2500)
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`)
      setShareStatus('link')
    } catch { /* silent */ }
    setTimeout(() => setShareStatus(null), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    reset()
    navigate('/login')
  }

  if (!profile) {
    return <div className="flex justify-center py-24"><Spinner /></div>
  }

  const initial   = (profile.username || '?')[0].toUpperCase()
  const levelName = getLevelName(profile.level)
  const publicURL = `${window.location.origin}/u/${profile.username}`

  const statItems = [
    { label: 'Total logs',    value: stats?.totalLogs     ?? 0, icon: '📋' },
    { label: 'Perfect days',  value: stats?.perfectDays   ?? 0, icon: '⭐' },
    { label: 'Best streak',   value: stats?.longestStreak ?? 0, icon: '🔥' },
    { label: 'Personal best', value: stats?.bestFSS       ?? 0, icon: '🏆' },
  ]

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up pb-10">

      {/* ── Profile hero ───────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-5 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-700 text-white flex items-center justify-center text-2xl font-extrabold shadow-md shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
                {profile.username}
              </h1>
              <p className="text-sm font-bold text-primary">
                Level {profile.level} · {levelName}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs font-bold text-slate-500">
                  🔥 {profile.current_streak} day streak
                </span>
                {(profile.streak_shields ?? 0) > 0 && (
                  <span className="text-xs font-bold text-primary">
                    🛡️ {profile.streak_shields} shield{profile.streak_shields > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            {/* FIX #1: Added missing <a */}
            <a
              href={publicURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded-full shrink-0"
            >
              View public →
            </a>
          </div>
        </div>
        <div className="px-5 pb-5">
          <XPBar totalXP={profile.total_xp} level={profile.level} />
        </div>
      </div>

      {/* ── Stats grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
              <span className="text-base">{s.icon}</span>
            </div>
            <p className="text-3xl font-extrabold bg-gradient-to-br from-primary to-primary-600 bg-clip-text text-transparent tabular-nums">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Share public profile ────────────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🌐</span>
          <p className="font-extrabold text-slate-900 dark:text-white text-sm">Your public profile</p>
        </div>
        <p className="text-xs text-slate-400 font-medium mb-1 truncate">{publicURL}</p>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
          Anyone with the link sees your streak, score, level, and achievements — a great way to share your progress.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="btn-primary flex-1 !py-2.5 text-sm"
          >
            {shareStatus === 'shared' ? '✓ Shared!' : shareStatus === 'copied' ? '✓ Copied!' : '↗ Share profile'}
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn-secondary !py-2.5 !px-3 text-sm"
            title="Copy link"
          >
            {shareStatus === 'link' ? '✓' : '🔗'}
          </button>
          {/* FIX #2: Added missing <a */}
          <a
            href={publicURL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary !py-2.5 !px-3 text-sm inline-flex items-center"
          >
            👁
          </a>
        </div>
      </div>

      {/* ── Score history chart ─────────────────────────────────────────── */}
      <div className="glass-card p-5">
        <p className="section-title mb-1">Score history</p>
        <p className="text-xs text-slate-400 font-medium mb-4">Last 30 days — Future Self Score</p>

        {loading ? (
          <div className="h-48 flex items-center justify-center"><Spinner /></div>
        ) : chartData.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm font-semibold text-slate-500">No logs yet — start logging to see your history here.</p>
          </div>
        ) : (
          <>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                  <defs>
                    <linearGradient id="fssGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7F77DD" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7F77DD" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
                    formatter={(v) => [v, 'Future Self']}
                  />
                  <Area type="monotone" dataKey="fss" stroke="#7F77DD" strokeWidth={2} fill="url(#fssGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pillar mini-chart below */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Pillar breakdown — last 30 days</p>
              <div style={{ width: '100%', height: 120 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={6} />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 11 }}
                    />
                    {[
                      { key: 'nut', color: '#1D9E75', label: 'Nutrition' },
                      { key: 'fit', color: '#D85A30', label: 'Fitness' },
                      { key: 'nrg', color: '#EF9F27', label: 'Energy' },
                      { key: 'foc', color: '#7F77DD', label: 'Focus' },
                    ].map((l) => (
                      <Area
                        key={l.key}
                        type="monotone"
                        dataKey={l.key}
                        name={l.label}
                        stroke={l.color}
                        strokeWidth={1.5}
                        fill="none"
                        dot={false}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Quick links ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/achievements" className="glass-card p-4 hover:shadow-card-hover transition-shadow">
          <span className="text-2xl block mb-2">🏆</span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">Earned</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">Achievements</p>
        </Link>
        <Link to="/challenges" className="glass-card p-4 hover:shadow-card-hover transition-shadow">
          <span className="text-2xl block mb-2">⚔️</span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">Active</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">Challenges</p>
        </Link>
        <Link to="/weekly" className="glass-card p-4 hover:shadow-card-hover transition-shadow">
          <span className="text-2xl block mb-2">📊</span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">Analysis</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">Weekly review</p>
        </Link>
        <Link to="/insights" className="glass-card p-4 hover:shadow-card-hover transition-shadow">
          <span className="text-2xl block mb-2">🔎</span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">Your data</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">Ask your data</p>
        </Link>
      </div>

      {/* ── Sign out ────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSignOut}
        className="btn-secondary w-full text-slate-500"
      >
        Sign out
      </button>
    </div>
  )
}