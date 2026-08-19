import { useMemo, useState } from 'react'
import { buildBaselineLog, simulateFSS, WHATIF_LEVERS } from '../../utils/whatIfSimulator'

const LEVER_ORDER = ['sleep', 'workouts', 'veg', 'focus']

export default function WhatIfSimulator({ recentLogs, streakDays }) {
  const baseline = useMemo(() => buildBaselineLog(recentLogs), [recentLogs])
  const [deltas, setDeltas] = useState({ sleep: 0, workouts: 0, veg: 0, focus: 0 })

  const baselineResult = useMemo(
    () => (baseline ? simulateFSS(baseline, {}, streakDays) : null),
    [baseline, streakDays]
  )
  const simulatedResult = useMemo(
    () => (baseline ? simulateFSS(baseline, deltas, streakDays) : null),
    [baseline, deltas, streakDays]
  )

  if (!baseline) {
    return (
      <div className="rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7c3aed] dark:text-[#00E87A] mb-1">What-if simulator</p>
        <p className="text-sm text-slate-500 dark:text-[#5A7050] font-medium">
          Log at least 7 days to unlock — this simulates your Future Self Score against real habit changes, so it needs some real history first.
        </p>
      </div>
    )
  }

  const delta = simulatedResult.score - baselineResult.score
  const anyChange = Object.values(deltas).some((v) => v > 0)

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-4">
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4] dark:hidden" />

      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7c3aed] dark:text-[#00E87A] mb-1">What-if simulator</p>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-extrabold text-slate-900 dark:text-[#E8F0E0] tabular-nums">
          {baselineResult.score}{anyChange ? ` → ${simulatedResult.score}` : ''}
        </span>
        {anyChange && (
          <span className={`text-sm font-bold ${delta >= 0 ? 'text-[#00a591] dark:text-[#00E8C6]' : 'text-[#e0527a]'}`}>
            {delta >= 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-400 dark:text-[#5A7050] font-medium mb-4">
        A simulation based on your real averages — not a guarantee of a future score.
      </p>

      <div className="space-y-4">
        {LEVER_ORDER.map((key) => {
          const lever = WHATIF_LEVERS[key]
          const value = deltas[key]
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-[#B8C9AF]">{lever.label}</span>
                <span className="text-xs font-bold text-[#7c3aed] dark:text-[#00E87A] tabular-nums">
                  {value > 0 ? `+${value} ${lever.unit}` : 'no change'}
                </span>
              </div>
              <input
                type="range"
                min={lever.min}
                max={lever.max}
                step={lever.step}
                value={value}
                onChange={(e) =>
                  setDeltas((d) => ({ ...d, [key]: Number(e.target.value) }))
                }
              />
            </div>
          )
        })}
      </div>

      {anyChange && (
        <button
          type="button"
          onClick={() => setDeltas({ sleep: 0, workouts: 0, veg: 0, focus: 0 })}
          className="mt-4 text-xs font-bold text-slate-400 dark:text-[#5A7050] hover:text-slate-600 dark:hover:text-[#9DB890]"
        >
          Reset
        </button>
      )}
    </div>
  )
}