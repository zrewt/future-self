import { useState } from 'react'
import { getFutureSelfBreakdown } from '../../utils/scoring'
import { parseLogDetails } from '../../utils/logDetails'

export default function ScoreBreakdown({ log, streakDays = 0 }) {
  const [open, setOpen] = useState(false)

  if (!log?.future_self_score && log?.future_self_score !== 0) return null

  const foods = parseLogDetails(log.log_details).foods || []
  const { score, items, multiplier } = getFutureSelfBreakdown(log, foods, streakDays)

  return (
    <div className="glass-card p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="section-title">Future Self Score</p>
          <p className="text-3xl font-extrabold text-primary tabular-nums">{score}</p>
        </div>
        <span className="text-xs font-bold text-primary">{open ? 'Hide' : 'How it works'} ▼</span>
      </button>

      {open && (
        <div className="mt-4 border-t border-slate-100 dark:border-white/10 pt-3 space-y-3">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Your whole day — nutrition, movement, sleep, water, and habits — not just food.
          </p>

          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={item.key}>
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  <span>{item.label}</span>
                  <span className="tabular-nums">
                    <span className="text-slate-800 dark:text-slate-100 font-extrabold">{item.value}</span>
                    <span className="text-slate-400 font-medium ml-1.5">→ +{item.points} pts</span>
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/70 dark:bg-teal/80 rounded-full"
                    style={{ width: `${Math.min(100, item.value)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <p className="text-[10px] text-slate-400 pt-1 leading-relaxed">
            Weighted average × {multiplier.toFixed(2)} streak multiplier ({streakDays} day streak).
            Scores above 95 are rare — they require strong performance across all pillars.
          </p>
        </div>
      )}
    </div>
  )
}
