import { computeFutureProjection } from '../../utils/projection'

export default function FutureProjectionCard({ recentScores, currentScore }) {
  // recentScores is an array of numbers — we need full log objects for projection
  // but the component only gets scores. We build minimal log objects from scores.
  // Full logs are used in WeeklyReview; here we use score-based projection.
  const hasEnoughData = recentScores?.length >= 3

  const proj = computeFutureProjection(
    // Build minimal log objects from recent scores for the projection engine
    (recentScores || []).map((s) => ({
      future_self_score: s,
      // Estimate sub-scores proportionally from FSS
      // These are approximations — real sub-scores would need full logs
      sleep_hours:           s >= 60 ? 7.5 : 6.5,
      workout_duration_min:  s >= 60 ? 35 : 10,
      exercise_type:         s >= 60 ? 'gym' : 'rest',
      nutrition_score:       Math.round(s * 0.9),
      focus_score:           Math.round(s * 0.85),
      water_ml:              s >= 60 ? 2500 : 1500,
    })),
    currentScore
  )

  const d6  = proj.month6 - proj.current
  const d12 = proj.year1  - proj.current

  return (
    <div className="glass-card p-4 bg-gradient-to-br from-primary-50/80 via-white to-white dark:from-teal/10 dark:via-slate-950/40 dark:to-primary/10">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title">Future projection</p>
        <span className="pill bg-white/70 dark:bg-white/5 text-slate-500 dark:text-slate-300 text-[10px] border border-white/60 dark:border-white/10">
          {hasEnoughData ? 'Live' : 'Preview'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Now',   score: proj.current, delta: null },
          { label: '6 mo',  score: proj.month6,  delta: d6   },
          { label: '1 yr',  score: proj.year1,   delta: d12  },
        ].map((c) => (
          <div key={c.label} className="metric-tile">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</p>
            <p className="text-2xl font-extrabold text-primary tabular-nums">{c.score}</p>
            {c.delta !== null && (
              <p className={`text-[10px] font-bold ${c.delta > 0 ? 'text-teal' : c.delta < 0 ? 'text-coral' : 'text-slate-400'}`}>
                {c.delta > 0 ? `↑ +${c.delta}` : c.delta < 0 ? `↓ ${c.delta}` : '→ steady'}
              </p>
            )}
          </div>
        ))}
      </div>

      {hasEnoughData ? (
        <>
          <ul className="space-y-1.5 border-t border-slate-100 dark:border-white/10 pt-3">
            {proj.drivers.slice(0, 4).map((d) => (
              <li key={d.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">{d.label}</span>
                <span className={`font-bold tabular-nums ${d.trend === 'up' ? 'text-teal' : 'text-slate-400'}`}>
                  {d.trend === 'up' ? '↑' : '→'} {d.value}%
                </span>
              </li>
            ))}
          </ul>
          {proj.habitCeiling && (
            <p className="text-[10px] text-slate-400 font-medium mt-2 pt-2 border-t border-slate-100 dark:border-white/10">
              Based on your current habits, your ceiling is ~{proj.habitCeiling}.
              {proj.habitCeiling > proj.current
                ? ` Keep going — you have ${proj.habitCeiling - proj.current} pts of room to grow.`
                : ' Maintain your habits to hold this score.'}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-slate-500 font-medium border-t border-slate-100 dark:border-white/10 pt-3">
          Log {Math.max(0, 3 - (recentScores?.length || 0))} more day{3 - (recentScores?.length || 0) !== 1 ? 's' : ''} to unlock live projections.
        </p>
      )}
    </div>
  )
}