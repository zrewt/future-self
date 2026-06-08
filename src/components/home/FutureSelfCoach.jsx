import { computeFutureSelfCoach } from '../../utils/projection'
import { useUserStore } from '../../store/useUserStore'

export default function FutureSelfCoach({ currentScore }) {
  const { recentLogs, todayLog, profile } = useUserStore()

  const coach = computeFutureSelfCoach(recentLogs, {
    todayLog,
    currentFSS: currentScore,
    streakDays: profile?.current_streak ?? 0,
  })

  const showPace = coach.pace.some((p) => p.delta > 0)

  return (
    <div className="glass-card p-4 bg-gradient-to-br from-slate-50/90 via-white to-primary-50/40 dark:from-slate-900/60 dark:via-slate-950/40 dark:to-teal/10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="section-title">Future Self Coach</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Projections from your last {recentLogs.length || 0} logs
          </p>
        </div>
        <span className="pill bg-white/70 dark:bg-white/5 text-slate-500 dark:text-slate-300 text-[10px] border border-white/60 dark:border-white/10">
          {coach.hasEnoughData ? 'Live' : 'Preview'}
        </span>
      </div>

      <div className="metric-tile bg-primary/10 mb-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase">Future Self Score</p>
        <p className="text-3xl font-extrabold text-primary tabular-nums">{coach.currentFSS}</p>
      </div>

      {coach.hasEnoughData ? (
        <>
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
              If you continue at this pace:
            </p>
            <ul className="space-y-2">
              {coach.pace.map((p) => (
                <li
                  key={p.label}
                  className="flex items-center justify-between text-sm bg-white/60 dark:bg-white/5 rounded-xl px-3 py-2 border border-slate-100/80 dark:border-white/10"
                >
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{p.label}</span>
                  <span className={`font-extrabold tabular-nums ${p.delta > 0 ? 'text-teal' : 'text-slate-400'}`}>
                    {p.delta > 0 ? `+${p.delta}` : '—'} in {p.days} days
                  </span>
                </li>
              ))}
            </ul>
            {!showPace && (
              <p className="text-[11px] text-slate-400 font-medium mt-2">
                Trends are flat — fixing your bottleneck below unlocks the biggest jump.
              </p>
            )}
          </div>

          {coach.bottleneck ? (
            <div className="rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/15 px-3 py-3">
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-white">Biggest bottleneck: </span>
                {coach.bottleneck.label}.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Fixing {coach.bottleneck.shortFix} alone would raise your projected score from{' '}
                <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {coach.bottleneck.currentFSS}
                </span>
                {' → '}
                <span className="font-extrabold text-primary tabular-nums">
                  {coach.bottleneck.projectedFSS}
                </span>
                .
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-medium rounded-2xl bg-teal/5 border border-teal/15 px-3 py-2.5">
              Habits look balanced — keep stacking consistency to push past {coach.currentFSS}.
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-slate-500 font-medium">
          Log {Math.max(0, 3 - recentLogs.length)} more day
          {3 - recentLogs.length !== 1 ? 's' : ''} to unlock pace projections and bottleneck analysis.
        </p>
      )}
    </div>
  )
}
