import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import { useTheme } from '../hooks/useTheme'
import XPBar from '../components/XPBar'
import Spinner from '../components/ui/Spinner'
import { getLevelName } from '../utils/scoring'

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, reset } = useUserStore()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [chartData, setChartData]     = useState([])
  const [stats, setStats]             = useState(null)
  const [loading, setLoading]         = useState(true)
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

  // Chart colors that work in both modes
  const tooltipStyle = {
    background: isDark ? '#161C0F' : '#fff',
    border: `1px solid ${isDark ? 'rgba(0,232,122,0.15)' : '#e2e8f0'}`,
    borderRadius: 12,
    fontSize: 12,
    color: isDark ? '#E8F0E0' : '#0D1409',
  }

  const statItems = [
    { label: 'Total logs',    value: stats?.totalLogs     ?? 0, icon: '📋' },
    { label: 'Perfect days',  value: stats?.perfectDays   ?? 0, icon: '⭐' },
    { label: 'Best streak',   value: stats?.longestStreak ?? 0, icon: '🔥' },
    { label: 'Personal best', value: stats?.bestFSS       ?? 0, icon: '🏆' },
  ]

  // Primary color per mode
  const primaryHex  = isDark ? '#00E87A' : '#7F5AF0'
  const primaryRgba = isDark ? 'rgba(0,232,122,' : 'rgba(127,90,240,'

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up pb-10">

      {/* ── Profile hero — clean, no circle gradients ── */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 pb-4">
          <div className="flex items-center gap-4">
            {/* Avatar — flat pill, no gradient blobs */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shrink-0"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #00E87A, #7F5AF0)'
                  : 'linear-gradient(135deg, #7F5AF0, #6D44E0)',
                boxShadow: isDark
                  ? '0 4px 20px rgba(0,232,122,0.35)'
                  : '0 4px 20px rgba(127,90,240,0.35)',
              }}
            >
              {initial}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-[#E8F0E0] truncate">
                {profile.username}
              </h1>
              <p className="text-sm font-bold" style={{ color: primaryHex }}>
                Level {profile.level} · {levelName}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-[#5A7050]">
                  🔥 {profile.current_streak} day streak
                </span>
                {(profile.streak_shields ?? 0) > 0 && (
                  <span className="text-xs font-bold" style={{ color: primaryHex }}>
                    🛡️ {profile.streak_shields} shield{profile.streak_shields > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <a
              href={publicURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-full shrink-0"
              style={{
                color: primaryHex,
                background: isDark ? 'rgba(0,232,122,0.1)' : 'rgba(127,90,240,0.1)',
              }}
            >
              View public →
            </a>
          </div>
        </div>
        <div className="px-5 pb-5">
          <XPBar totalXP={profile.total_xp} level={profile.level} />
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-slate-400 dark:text-[#5A7050] uppercase tracking-wide">{s.label}</p>
              <span className="text-base">{s.icon}</span>
            </div>
            <p
              className="text-3xl font-extrabold tabular-nums"
              style={{ color: primaryHex }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Share public profile ── */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🌐</span>
          <p className="font-extrabold text-slate-900 dark:text-[#E8F0E0] text-sm">Your public profile</p>
        </div>
        <p className="text-xs text-slate-400 dark:text-[#5A7050] font-medium mb-1 truncate">{publicURL}</p>
        <p className="text-xs text-slate-500 dark:text-[#5A7050] font-medium leading-relaxed mb-3">
          Anyone with the link sees your streak, score, level, and achievements.
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

      {/* ── Score history chart ── */}
      <div className="glass-card p-5">
        <p className="section-title mb-1">Score history</p>
        <p className="text-xs text-slate-400 dark:text-[#5A7050] font-medium mb-4">Last 30 days — Future Self Score</p>

        {loading ? (
          <div className="h-48 flex items-center justify-center"><Spinner /></div>
        ) : chartData.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm font-semibold text-slate-500 dark:text-[#5A7050]">No logs yet — start logging to see your history here.</p>
          </div>
        ) : (
          <>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                  <defs>
                    <linearGradient id="fssGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={primaryHex} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={primaryHex} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: isDark ? '#5A7050' : '#94a3b8' }}
                    axisLine={false} tickLine={false} interval={6}
                  />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [v, 'Future Self']}
                  />
                  <Area
                    type="monotone" dataKey="fss"
                    stroke={primaryHex} strokeWidth={2}
                    fill="url(#fssGrad)" dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pillar mini-chart */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/6">
              <p className="text-[10px] font-bold text-slate-400 dark:text-[#5A7050] uppercase tracking-wide mb-3">
                Pillar breakdown — last 30 days
              </p>
              <div style={{ width: '100%', height: 120 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: isDark ? '#5A7050' : '#94a3b8' }}
                      axisLine={false} tickLine={false} interval={6}
                    />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={tooltipStyle} />
                    {[
                      { key: 'nut', color: '#00E87A', label: 'Nutrition' },
                      { key: 'fit', color: '#7F5AF0', label: 'Fitness' },
                      { key: 'nrg', color: '#4DA6FF', label: 'Energy' },
                      { key: 'foc', color: '#FFB830', label: 'Focus' },
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

      {/* ── Quick links ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/achievements" className="glass-card p-4 hover:shadow-card-hover transition-shadow">
          <span className="text-2xl block mb-2">🏆</span>
          <p className="text-xs font-bold text-slate-500 dark:text-[#5A7050] uppercase tracking-wide mb-0.5">Earned</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-[#E8F0E0]">Achievements</p>
        </Link>
        <Link to="/challenges" className="glass-card p-4 hover:shadow-card-hover transition-shadow">
          <span className="text-2xl block mb-2">⚔️</span>
          <p className="text-xs font-bold text-slate-500 dark:text-[#5A7050] uppercase tracking-wide mb-0.5">Active</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-[#E8F0E0]">Challenges</p>
        </Link>
        <Link to="/weekly" className="glass-card p-4 hover:shadow-card-hover transition-shadow">
          <span className="text-2xl block mb-2">📊</span>
          <p className="text-xs font-bold text-slate-500 dark:text-[#5A7050] uppercase tracking-wide mb-0.5">Analysis</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-[#E8F0E0]">Weekly review</p>
        </Link>
        <Link to="/insights" className="glass-card p-4 hover:shadow-card-hover transition-shadow">
          <span className="text-2xl block mb-2">🔎</span>
          <p className="text-xs font-bold text-slate-500 dark:text-[#5A7050] uppercase tracking-wide mb-0.5">Your data</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-[#E8F0E0]">Ask your data</p>
        </Link>
      </div>

      {/* ── Sign out ── */}
      <button
        type="button"
        onClick={handleSignOut}
        className="
          w-full inline-flex items-center justify-center gap-2
          font-semibold rounded-2xl py-3.5 px-6 border
          transition-all duration-200 active:scale-[0.97]
          bg-transparent
          border-slate-200 dark:border-white/10
          text-slate-500 dark:text-[#5A7050]
          hover:bg-slate-50 dark:hover:bg-white/5
          hover:text-slate-700 dark:hover:text-[#9DB890]
        "
      >
        Sign out
      </button>
    </div>
  )
}
