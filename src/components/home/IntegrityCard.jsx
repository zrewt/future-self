import { computeIntegrityScore } from '../../utils/integrity'
import { useUserStore } from '../../store/useUserStore'

// Arc SVG for the integrity gauge
function IntegrityArc({ score }) {
  const size        = 80
  const strokeWidth = 7
  const radius      = (size - strokeWidth) / 2
  const circumference = Math.PI * radius // half circle
  const offset      = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference

  const color = score >= 85 ? '#1D9E75' : score >= 65 ? '#EF9F27' : '#D85A30'

  return (
    <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`} className="overflow-visible">
      {/* Track */}
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-100 dark:text-white/10"
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  )
}

export default function IntegrityCard({ compact = false }) {
  const { recentLogs, profile } = useUserStore()
  const integrity = computeIntegrityScore(recentLogs, profile)

  const tierColors = {
    high:     'text-teal',
    moderate: 'text-amber-600 dark:text-amber',
    low:      'text-coral',
  }
  const tierBg = {
    high:     'bg-teal/10 border-teal/20',
    moderate: 'bg-amber-50/60 dark:bg-amber/5 border-amber-200/40 dark:border-amber/20',
    low:      'bg-coral/5 border-coral/20',
  }

  // ── Compact variant (for dashboard hero tile) ──────────────────────────────
  if (compact) {
    return (
      <div className="metric-tile flex flex-col items-center justify-center gap-0.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase">Integrity</p>
        <p className={`text-2xl font-extrabold tabular-nums ${tierColors[integrity.tier]}`}>
          {integrity.score}%
        </p>
        <p className={`text-[9px] font-bold ${tierColors[integrity.tier]}`}>
          {integrity.tier === 'high' ? 'High' : integrity.tier === 'moderate' ? 'Moderate' : 'Low'}
        </p>
      </div>
    )
  }

  // ── Full card ──────────────────────────────────────────────────────────────
  return (
    <div className={`glass-card p-4 border ${tierBg[integrity.tier]}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="section-title">Future Self Integrity</p>
        <span className={`pill text-[10px] ${
          integrity.tier === 'high'
            ? 'bg-teal/10 text-teal'
            : integrity.tier === 'moderate'
            ? 'bg-amber-100/80 text-amber-700 dark:bg-amber/10 dark:text-amber'
            : 'bg-coral/10 text-coral'
        }`}>
          {integrity.label}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Arc gauge */}
        <div className="relative shrink-0 flex flex-col items-center">
          <IntegrityArc score={integrity.score} />
          <p className={`text-2xl font-extrabold tabular-nums -mt-1 ${tierColors[integrity.tier]}`}>
            {integrity.score}%
          </p>
        </div>

        {/* Context text */}
        <div className="flex-1 min-w-0">
          {integrity.tier === 'high' && (
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Your logs are consistent and realistic. High-confidence tracking leads to more accurate projections.
            </p>
          )}
          {integrity.tier === 'moderate' && (
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Good tracking. Log more consistently and don't hesitate to record imperfect days — that's what builds real confidence.
            </p>
          )}
          {integrity.tier === 'low' && (
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Keep logging daily, including bad days. Honest tracking is what makes your Future Self Score meaningful.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}