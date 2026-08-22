import { useEffect, useMemo, useState } from 'react'
import { buildBaselineLog, rankScenarios, simulateScenario } from '../../utils/whatIfSimulator'

export default function WhatIfSimulator({ recentLogs, streakDays }) {
  const baseline = useMemo(() => buildBaselineLog(recentLogs), [recentLogs])
  const ranked = useMemo(
    () => (baseline ? rankScenarios(baseline, streakDays) : []),
    [baseline, streakDays]
  )

  const [activeKey, setActiveKey] = useState(null)
  const [value, setValue]         = useState(null)

  const activeScenario = ranked.find((s) => s.key === activeKey) || null

  // When a scenario becomes active (or ranked recomputes), default the
  // slider to its suggested target.
  useEffect(() => {
    if (activeScenario) setValue(activeScenario.target)
  }, [activeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const live = useMemo(() => {
    if (!baseline || !activeScenario || value == null) return null
    return simulateScenario(baseline, activeScenario, value, streakDays)
  }, [baseline, activeScenario, value, streakDays])

  if (!baseline) {
    return (
      <div className="rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7c3aed] dark:text-[#00E87A] mb-1">Shape Your Future</p>
        <p className="text-sm text-slate-500 dark:text-[#5A7050] font-medium">
          Log at least 7 days to unlock — this simulates your Future Self Score against real habit changes, so it needs some real history first.
        </p>
      </div>
    )
  }

  const biggest = ranked[0]
  const baselineScore = ranked[0] ? (live?.baselineScore ?? null) : null
  const currentFSS = live ? live.baselineScore : (ranked[0] ? simulateScenario(baseline, ranked[0], ranked[0].current, streakDays).baselineScore : 0)

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-4">
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4] dark:hidden" />

      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7c3aed] dark:text-[#00E87A] mb-1">Shape Your Future</p>
      <p className="text-[11px] text-slate-400 dark:text-[#5A7050] font-medium mb-4">
        See what could happen if you changed one part of your routine.
      </p>

      {/* ── No scenario selected: lead with the biggest opportunity ── */}
      {!activeScenario && biggest && (
        <div className="mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Your biggest opportunity</p>
          <div className="rounded-2xl bg-[#7c3aed]/5 dark:bg-[#00E87A]/5 border border-[#7c3aed]/15 dark:border-[#00E87A]/15 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{biggest.icon}</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-[#E8F0E0]">{biggest.label}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#9DB890] font-medium mb-3">
              You're currently averaging {biggest.formatValue(biggest.current)}. What if you tried {biggest.formatValue(biggest.target)}?
            </p>
            {biggest.impact > 0.05 ? (
              <button
                type="button"
                onClick={() => setActiveKey(biggest.key)}
                className="text-xs font-bold text-white px-4 py-2 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)' }}
              >
                Try it →
              </button>
            ) : (
              <p className="text-xs font-semibold text-[#00a591] dark:text-[#00E8C6]">
                You're already close to optimal here — nice work.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Active scenario: live slider ── */}
      {activeScenario && live && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setActiveKey(null)}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 mb-2"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{activeScenario.icon}</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-[#E8F0E0]">
              What if you {activeScenario.label.toLowerCase()}...
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-[#E8F0E0] tabular-nums">
              {live.baselineScore} → {live.simulatedScore}
            </span>
            <span className={`text-sm font-bold ${live.delta >= 0 ? 'text-[#00a591] dark:text-[#00E8C6]' : 'text-[#e0527a]'}`}>
              {live.delta >= 0 ? '+' : ''}{live.delta} Future Self
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
            <span>{activeScenario.formatValue(activeScenario.min)}</span>
            <span className="text-[#7c3aed] dark:text-[#00E87A]">{activeScenario.formatValue(value)}</span>
            <span>{activeScenario.formatValue(activeScenario.max)}</span>
          </div>
          <input
            type="range"
            min={activeScenario.min}
            max={activeScenario.max}
            step={activeScenario.step}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full"
          />

          <p className="text-[10px] text-slate-400 dark:text-[#5A7050] font-medium mt-3">
            Estimated impact — based on your recent habits and Qyven's scoring model, not a guarantee.
          </p>
        </div>
      )}

      {/* ── What would you change? — quick switcher ── */}
      <div className="mb-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">What would you change?</p>
        <div className="flex gap-2 flex-wrap">
          {ranked.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveKey(s.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeKey === s.key ? 'text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#9DB890]'
              }`}
              style={activeKey === s.key ? { background: 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)' } : undefined}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Biggest levers ranking ── */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/8">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">What's shaping your Future Self?</p>
        <div className="space-y-1.5">
          {ranked.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-[#B8C9AF] font-medium">{s.icon} {s.label}</span>
              <span className={`font-bold tabular-nums ${s.impact > 0.05 ? 'text-[#00a591] dark:text-[#00E8C6]' : 'text-slate-400'}`}>
                {s.impact > 0.05 ? `+${s.impact} potential` : 'Already strong'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}