import { computeFutureProjection } from '../../utils/projection'

export default function FutureProjectionCard({ recentScores, currentScore }) {
  const proj = computeFutureProjection(recentScores, currentScore)
  const d6 = proj.month6 - proj.current
  const d12 = proj.year1 - proj.current

  return (
    <div className="glass-card p-4 bg-gradient-to-br from-primary-50/80 via-white to-white dark:from-teal/10 dark:via-slate-950/40 dark:to-primary/10">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title">Future projection</p>
        <span className="pill bg-white/70 dark:bg-white/5 text-slate-500 dark:text-slate-300 text-[10px] border border-white/60 dark:border-white/10">
          Trajectory
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Now', score: proj.current, delta: null },
          { label: '6 mo', score: proj.month6, delta: d6 },
          { label: '1 yr', score: proj.year1, delta: d12 },
        ].map((c) => (
          <div key={c.label} className="metric-tile">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</p>
            <p className="text-2xl font-extrabold text-primary tabular-nums">{c.score}</p>
            {c.delta !== null && (
              <p className={`text-[10px] font-bold ${c.delta >= 0 ? 'text-teal' : 'text-coral'}`}>
                {c.delta >= 0 ? '↑' : '↓'} {c.delta >= 0 ? '+' : ''}
                {c.delta}
              </p>
            )}
          </div>
        ))}
      </div>
      {recentScores.length >= 3 ? (
        <ul className="space-y-1.5 border-t border-slate-100 dark:border-white/10 pt-3">
          {proj.drivers.slice(0, 4).map((d) => (
            <li key={d.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">{d.label}</span>
              <span className="font-bold text-slate-800 tabular-nums">
                {d.trend === 'up' ? '↑' : '→'} {d.value}%
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500 font-medium">Log 3+ days to unlock habit-based projections.</p>
      )}
    </div>
  )
}
