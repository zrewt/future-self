import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/useUserStore'
import XPBar from '../components/XPBar'
import { Card } from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import { getLevelName } from '../utils/scoring'

const LINES = [
  { key: 'fitness_score', name: 'Fitness', color: '#D85A30' },
  { key: 'nutrition_score', name: 'Nutrition', color: '#1D9E75' },
  { key: 'energy_score', name: 'Energy', color: '#EF9F27' },
  { key: 'focus_score', name: 'Focus', color: '#7F77DD' },
  { key: 'longevity_score', name: 'Longevity', color: '#1D9E75' },
  { key: 'future_self_score', name: 'Future Self', color: '#7F77DD' },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, reset } = useUserStore()

  const [chartData, setChartData] = useState([])
  const [stats, setStats] = useState({
    totalLogs: 0,
    perfectDays: 0,
    longestStreak: 0,
    bestFSS: 0,
  })

  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return

    async function load() {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: true })
        .limit(30)

      if (!error && data) {
        setChartData(
          data.map((d) => ({
            date: d.log_date.slice(5),
            fitness_score: d.fitness_score,
            nutrition_score: d.nutrition_score,
            energy_score: d.energy_score,
            focus_score: d.focus_score,
            longevity_score: d.longevity_score,
            future_self_score: d.future_self_score,
          }))
        )

        setStats({
          totalLogs: data.length,
          perfectDays: data.filter((d) => d.is_perfect_day).length,
          longestStreak: profile?.longest_streak ?? 0,
          bestFSS: data.reduce(
            (m, d) => Math.max(m, d.future_self_score || 0),
            0
          ),
        })
      }

      setLoading(false)
    }

    load()
  }, [user, profile?.longest_streak])

  async function handleShareProfile() {
    const url = `${window.location.origin}/u/${profile.username}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.username}'s Qyven Profile`,
          text: `Check out my Qyven profile — Level ${profile.level} with a ${profile.current_streak} day streak 🔥`,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      // user cancelled
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    reset()
    navigate('/login')
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const initial = (profile.username || '?')[0].toUpperCase()
  const levelName = getLevelName(profile.level)
  const publicURL = `${window.location.origin}/u/${profile.username}`

  return (
    <div className="space-y-5 animate-slide-up pb-8">

      {/* Avatar */}
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary-700 text-white flex items-center justify-center text-4xl font-extrabold shadow-glow">
          {initial}
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-5">
          {profile.username}
        </h1>

        <p className="pill bg-primary-50 text-primary-700 dark:bg-teal/10 dark:text-teal mt-2">
          Level {profile.level} · {levelName}
        </p>

        <Link to="/weekly" className="text-sm font-semibold text-primary mt-3 hover:underline">
          Weekly review →
        </Link>
      </div>

      {/* XP */}
      <Card>
        <XPBar totalXP={profile.total_xp} level={profile.level} />
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total logs', value: stats.totalLogs },
          { label: 'Perfect days', value: stats.perfectDays },
          { label: 'Best streak', value: stats.longestStreak },
          { label: 'Best score', value: stats.bestFSS },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className="text-2xl font-extrabold bg-gradient-to-br from-primary to-primary-600 bg-clip-text text-transparent">
              {s.value}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wide">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Share */}
      <div className="glass-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              Your public profile
            </p>

            <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
              {publicURL}
            </p>

            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Anyone with the link can see your streak, score, level and achievements.
            </p>
          </div>

          <span className="text-2xl shrink-0">🌐</span>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handleShareProfile}
            className="btn-primary flex-1 !py-2.5 text-sm"
          >
            {copied ? '✓ Copied!' : '↗ Share profile'}
          </button>

          <a
            href={publicURL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary !py-2.5 !px-4 text-sm inline-flex items-center justify-center"
          >
            Preview
          </a>
        </div>
      </div>

      {/* Chart */}
      <Card className="!p-4">
        <p className="section-title mb-4">Score history · 30 days</p>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Spinner className="w-8 h-8" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-12 font-medium">
            No logs yet — start logging!
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />

              {LINES.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2.5}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <button type="button" onClick={handleSignOut} className="btn-secondary w-full">
        Sign out
      </button>
    </div>
  )
}