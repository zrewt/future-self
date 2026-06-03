import { useState } from 'react'
import { getScoreBreakdown } from '../../utils/scoring'

export default function ScoreBreakdown({ scores, streakDays }) {
  const [open, setOpen] = useState(false)

  if (!scores?.future_self_score && scores?.future_self_score !== 0) return null

  const scoreInput = {
    fitness: scores.fitness_score ?? 0,
    nutrition: scores.nutrition_score ?? 0,
    energy: scores.energy_score ?? 0,
    focus: scores.focus_score ?? 0,
    longevity: scores.longevity_score ?? 0,
    mood: (scores.mood ?? 5) * 10,
  }

  const items = getScoreBreakdown(scoreInput, streakDays)
  const total = scores.future_self_score ?? items.reduce((s, i) => s + i.points, 0)

  return (
    <div className="glass-card p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="section-title">Future Self Score</p>
          <p className="text-3xl font-extrabold text-primary tabular-nums">{total}</p>
        </div>
        <span className="text-xs font-bold text-primary">{open ? 'Hide' : 'How it works'} ▼</span>
      </button>
      {open && (
        <ul className="mt-4 space-y-2 border-t border-slate-100 dark:border-white/10 pt-3">
          {items.map((item) => (
            <li key={item.key}>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>
                  {item.label} ({item.percent}% weight)
                </span>
                <span className="tabular-nums">+{item.points} pts</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/70 dark:bg-teal/80 rounded-full"
                  style={{ width: `${Math.min(100, item.value)}%` }}
                />
              </div>
            </li>
          ))}
          <p className="text-[10px] text-slate-400 pt-2 leading-relaxed">
            Streak multiplier boosts your score when you log consistently ({streakDays} day streak).
          </p>
        </ul>
      )}
    </div>
  )
}
