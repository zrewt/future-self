import { useMemo } from 'react'
import { projectFutureSelf } from '../../utils/futureProjection'

const TIER_COPY = {
  early:      'Early projection — becomes more informative as you build history.',
  growing:    'Growing confidence, based on your recent pattern.',
  'long-term':'Long-term projection, based on your logged history.',
}

export default function FutureProjection({ projectionLogs, currentFSS, currentStreak }) {
  const result = useMemo(
    () => projectFutureSelf(projectionLogs, currentFSS, currentStreak),
    [projectionLogs, currentFSS, currentStreak]
  )

  if (result.status === 'insufficient_data') {
    const remaining = 7 - result.historyDays
    return (
      <div className="rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7c3aed] dark:text-[#00E87A] mb-1">Future Self projection</p>
        <p className="text-sm text-slate-500 dark:text-[#5A7050] font-medium">
          Your Future Self is still taking shape. Log {remaining > 0 ? `${remaining} more day${remaining !== 1 ? 's' : ''}` : 'a bit more'} to unlock your first projection.
        </p>
      </div>
    )
  }

  const { tier, points, drivers } = result

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-4">
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4] dark:hidden" />

      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7c3aed] dark:text-[#00E87A] mb-1">Future Self projection</p>
      <p className="text-[11px] text-slate-400 dark:text-[#5A7050] font-medium mb-3">
        {TIER_COPY[tier]} Projected trajectory if your current pattern continues — an estimate, not a guarantee.
      </p>

      <div className="flex items-stretch gap-1.5 mb-4">
        {points.map((p, i) => (
          <div key={p.label} className="flex-1 flex flex-col items-center">
            <div className="rounded-2xl bg-slate-50 dark:bg-[#141220] border border-slate-100 dark:border-[#29263B] w-full py-3 flex flex-col items-center">
              <span className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-[#E8F0E0]">{p.score}</span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-[#5A7050] uppercase tracking-wide mt-0.5">{p.label}</span>
            </div>
            {i < points.length - 1 && (
              <span className="text-slate-300 dark:text-[#3A3650] text-xs my-0.5">→</span>
            )}
          </div>
        ))}
      </div>

      {drivers.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 dark:text-[#5A7050] uppercase tracking-wide mb-1.5">
            What's shaping this trajectory
          </p>
          {drivers.map((d) => (
            <div key={d.key} className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-[#9DB890] font-medium">{d.label}</span>
              <span className={`font-bold tabular-nums ${d.delta >= 0 ? 'text-[#00a591] dark:text-[#00E8C6]' : 'text-[#e0527a]'}`}>
                {d.delta >= 0 ? '+' : ''}{d.delta}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}