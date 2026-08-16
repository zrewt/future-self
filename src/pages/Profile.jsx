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

const SCREEN_TIME_MIN = 30
const SCREEN_TIME_MAX = 720

function formatScreenTime(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, setProfile, reset } = useUserStore()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [chartData, setChartData]     = useState([])
  const [stats, setStats]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [shareStatus, setShareStatus] = useState(null)

  const [screenTimeTarget, setScreenTimeTarget] = useState(180)
  const [savingTarget, setSavingTarget]          = useState(false)
  const [targetSavedAt, setTargetSavedAt]        = useState(null)

  useEffect(() => {
    if (profile?.screen_time_target_minutes != null) {
      setScreenTimeTarget(profile.screen_time_target_minutes)
    }
  }, [profile?.screen_time_target_minutes])

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

  async function handleSaveScreenTimeTarget() {
    if (!user) return
    setSavingTarget(true)
    const { error } = await supabase
      .from('users_profile')
      .update({ screen_time_target_minutes: screenTimeTarget })
      .eq('id', user.id)
    if (!error) {
      setProfile({ ...profile, screen_time_target_minutes: screenTimeTarget })
      setTargetSavedAt(new Date())
    }
    setSavingTarget(false)
    setTimeout(() => setTargetSavedAt(null), 2500)
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

  const tooltipStyle = {
    background: isDark ? '#161C0F' : '#fff',
    border: `1px solid ${isDark ? 'rgba(0,232,122,0.15)' : 'rgba(109,40,217,0.14)'}`,
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

  const primaryHex   = isDark ? '#00E87A' : '#7c3aed'
  const targetDirty  = screenTimeTarget !== (profile.screen_time_target_minutes ?? 180)

  // Shared branded card recipe — white, purple-tinted border/shadow in light
  // mode; existing dark surface in dark mode. Matches every other page.
  const cardClass = 'rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B]'

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-slide-up pb-10">

      <div className={`relative overflow-hidden ${cardClass}`}>
        <div className="absolute top-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4] dark:hidden" />
        <div className="p-5 pb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shrink-0"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #00E87A, #7F5AF0)'
                  : 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)',
                boxShadow: isDark
                  ? '0 4px 20px rgba(0,232,122,0.35)'
                  : '0 4px 20px rgba(124,58,237,0.32)',
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
    background: isDark
      ? 'rgba(0,232,122,0.1)'
      : 'rgba(124,58,237,0.1)',
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

      <div className="grid grid-cols-2 gap-3">
        {statItems.map((s) => (
          <div key={s.label} className={`${cardClass} p-4`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-slate-400 dark:text-[#5A7050] uppercase tracking-wide">{s.label}</p>
              <span className="text-base">{s.icon}</span>
            </div>
            <p className="text-3xl font-extrabold tabular-nums" style={{ color: primaryHex }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className={`${cardClass} p-5`}>
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
            className="flex-1 !py-2.5 text-sm rounded-2xl font-semibold text-white transition-all dark:bg-gradient-to-br dark:from-[#00E87A] dark:to-[#7F5AF0]"
            style={{ background: isDark ? undefined : 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)', boxShadow: isDark ? undefined : '0 4px 16px rgba(124,58,237,0.28)' }}
          >
            {shareStatus === 'shared' ? '✓ Shared!' : shareStatus === 'copied' ? '✓ Copied!' : '↗ Share profile'}
          </button>
          <button type="button" onClick={handleCopyLink} className="btn-secondary !py-2.5 !px-3 text-sm" title="Copy link">
            {shareStatus === 'link' ? '✓' : '🔗'}
          </button>
          <a href={publicURL} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-2.5 !px-3 text-sm inline-flex items-center">
            👁
          </a>
        </div>
      </div>

      <div className={`${cardClass} p-5`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">📵</span>
          <p className="font-extrabold text-slate-900 dark:text-[#E8F0E0] text-sm">Screen time goal</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-[#5A7050] font-medium leading-relaxed mb-4">
          Stay under this on your daily log to complete the Unplugged quest and build toward the Digital Minimalist achievements.
        </p>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 dark:text-[#5A7050] uppercase tracking-wide">Target</span>
          <span className="text-lg font-extrabold tabular-nums" style={{ color: primaryHex }}>
            {formatScreenTime(screenTimeTarget)}
          </span>
        </div>
        <input
          type="range"
          min={SCREEN_TIME_MIN}
          max={SCREEN_TIME_MAX}
          step={15}
          value={screenTimeTarget}
          onChange={(e) => setScreenTimeTarget(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: primaryHex }}
        />
        <div className="flex justify-between text-[10px] font-semibold text-slate-400 dark:text-[#5A7050] mt-1 mb-3">
          <span>30m</span>
          <span>12h</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {[60, 120, 180, 240, 360].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setScreenTimeTarget(mins)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{
                background: screenTimeTarget === mins ? primaryHex : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(109,40,217,0.06)'),
                color: screenTimeTarget === mins ? '#fff' : (isDark ? '#9DB890' : '#475569'),
              }}
            >
              {formatScreenTime(mins)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSaveScreenTimeTarget}
          disabled={savingTarget || !targetDirty}
          className="w-full !py-2.5 text-sm rounded-2xl font-bold text-white transition-all disabled:opacity-50 dark:bg-gradient-to-br dark:from-[#00E87A] dark:to-[#7F5AF0]"
          style={{ background: isDark ? undefined : 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)', boxShadow: isDark ? undefined : '0 4px 16px rgba(124,58,237,0.26)' }}
        >
          {savingTarget ? 'Saving…' : targetSavedAt ? '✓ Saved' : 'Save target'}
        </button>
      </div>

      <div className={`${cardClass} p-5`}>
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
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(109,40,217,0.06)'} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: isDark ? '#5A7050' : '#94a3b8' }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Future Self']} />
                  <Area type="monotone" dataKey="fss" stroke={primaryHex} strokeWidth={2} fill="url(#fssGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/6">
              <p className="text-[10px] font-bold text-slate-400 dark:text-[#5A7050] uppercase tracking-wide mb-3">
                Pillar breakdown — last 30 days
              </p>
              <div style={{ width: '100%', height: 120 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: isDark ? '#5A7050' : '#94a3b8' }} axisLine={false} tickLine={false} interval={6} />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip contentStyle={tooltipStyle} />
                    {[
                      { key: 'nut', color: '#00b8a0', label: 'Nutrition' },
                      { key: 'fit', color: '#7c3aed', label: 'Fitness' },
                      { key: 'nrg', color: '#3b82c4', label: 'Energy' },
                      { key: 'foc', color: '#d97706', label: 'Focus' },
                    ].map((l) => (
                      <Area key={l.key} type="monotone" dataKey={l.key} name={l.label} stroke={l.color} strokeWidth={1.5} fill="none" dot={false} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/achievements" className={`${cardClass} p-4 hover:border-[#7c3aed]/25 transition-colors`}>
          <span className="text-2xl block mb-2">🏆</span>
          <p className="text-xs font-bold text-slate-500 dark:text-[#5A7050] uppercase tracking-wide mb-0.5">Earned</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-[#E8F0E0]">Achievements</p>
        </Link>
        <Link to="/challenges" className={`${cardClass} p-4 hover:border-[#7c3aed]/25 transition-colors`}>
          <span className="text-2xl block mb-2">⚔️</span>
          <p className="text-xs font-bold text-slate-500 dark:text-[#5A7050] uppercase tracking-wide mb-0.5">Active</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-[#E8F0E0]">Challenges</p>
        </Link>
        <Link to="/weekly" className={`${cardClass} p-4 hover:border-[#7c3aed]/25 transition-colors`}>
          <span className="text-2xl block mb-2">📊</span>
          <p className="text-xs font-bold text-slate-500 dark:text-[#5A7050] uppercase tracking-wide mb-0.5">Analysis</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-[#E8F0E0]">Weekly review</p>
        </Link>
        <Link to="/insights" className={`${cardClass} p-4 hover:border-[#7c3aed]/25 transition-colors`}>
          <span className="text-2xl block mb-2">🔎</span>
          <p className="text-xs font-bold text-slate-500 dark:text-[#5A7050] uppercase tracking-wide mb-0.5">Your data</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-[#E8F0E0]">Ask your data</p>
        </Link>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="
          w-full inline-flex items-center justify-center gap-2
          font-semibold rounded-2xl py-3.5 px-6 border
          transition-all duration-200 active:scale-[0.97]
          bg-transparent
          border-[rgba(109,40,217,0.14)] dark:border-white/10
          text-slate-500 dark:text-[#5A7050]
          hover:bg-[#7c3aed]/5 dark:hover:bg-white/5
          hover:text-slate-700 dark:hover:text-[#9DB890]
        "
      >
        Sign out
      </button>
    </div>
  )
}
