import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from 'recharts'
import { calcSmoothedFSSSeries, attachMilestones, comparePillarsMonthOverMonth } from '../../utils/trends'

const RANGES = [
  { key: 7, label: '7D' },
  { key: 30, label: '30D' },
  { key: 90, label: '90D' },
]

function tickInterval(range) {
  if (range === 90) return 13
  if (range === 30) return 6
  return 0
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  const date = new Date(`${label}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return (
    <div className="bg-white dark:bg-slate-900 border border-surface-border rounded-xl px-3 py-2 shadow-card text-xs">
      <p className="font-bold text-slate-800 dark:text-slate-100">{date}</p>
      <p className="text-primary font-extrabold tabular-nums">{point.value}</p>
      {point.milestone && <p className="text-teal font-semibold mt-0.5">🏆 Milestone day</p>}
    </div>
  )
}

// Builds the SAME smoothed-FSS series as the Dashboard's ScoreRing/Momentum
// (calcSmoothedFSSSeries — lifetime EMA over trendLogs), then trims to the
// selected display window. The EMA itself is always computed over full
// history first — trimming afterward means a 7D view still reflects the
// real long-term-smoothed value at each point, not a value recomputed from
// only 7 days of data (which would silently disagree with the ring again).
function buildSmoothedSeries(trendLogs, days) {
  const full = calcSmoothedFSSSeries(trendLogs)
  if (!full) return []

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  return full
    .filter((p) => new Date(`${p.date}T12:00:00`) >= cutoff)
    .map((p) => ({
      date: p.date,
      value: p.smoothedFSS,
      smoothed: p.smoothedFSS,
    }))
}

export default function TrendChart({ trendLogs, achievementEvents, userChallenges }) {
  const [range, setRange] = useState(30)

  const series = useMemo(() => {
    const base = buildSmoothedSeries(trendLogs, range)
    return attachMilestones(base, achievementEvents, userChallenges)
  }, [trendLogs, achievementEvents, userChallenges, range])

  const monthCompare = useMemo(() => comparePillarsMonthOverMonth(trendLogs), [trendLogs])

  const milestonePoints = series.filter((p) => p.milestone)

  if (series.length < 3) {
    return (
      <div className="glass-card p-5">
        <p className="section-title mb-1">Your trend</p>
        <p className="text-sm text-slate-500 font-medium">
          Log a few more days to unlock your trend chart — it'll show how your Future Self Score moves over time.
        </p>
      </div>
    )
  }

  const first = series[0]?.smoothed ?? 0
  const last = series[series.length - 1]?.smoothed ?? 0
  const overallDelta = Math.round((last - first) * 10) / 10

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="section-title">Your trend</p>
        <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                range === r.key ? 'bg-primary text-white' : 'text-slate-500'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{last}</p>
        <p className={`text-xs font-bold ${overallDelta >= 0 ? 'text-teal' : 'text-coral'}`}>
          {overallDelta >= 0 ? '↑' : '↓'} {overallDelta >= 0 ? '+' : ''}{overallDelta} over {range}d
        </p>
      </div>

      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer>
          <AreaChart data={series} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary, #7F77DD)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-primary, #7F77DD)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={(d) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              interval={tickInterval(range)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="smoothed"
              stroke="var(--color-primary, #7F77DD)"
              strokeWidth={2}
              fill="url(#trendFill)"
            />
            {milestonePoints.map((p) => (
              <ReferenceDot
                key={p.date}
                x={p.date}
                y={p.smoothed}
                r={4}
                fill="var(--color-teal, #2DD4BF)"
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {monthCompare && monthCompare.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase">This month vs last</p>
          {monthCompare.slice(0, 3).map((c) => (
            <div key={c.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">{c.label}</span>
              <span className="flex items-center gap-1.5 tabular-nums">
                <span className="text-slate-400">{c.lastMonth} →</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">{c.thisMonth}</span>
                <span className={`font-bold ${c.delta >= 0 ? 'text-teal' : 'text-coral'}`}>
                  {c.delta >= 0 ? '+' : ''}{c.delta}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}