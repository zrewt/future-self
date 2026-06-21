import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { QUESTION_CATEGORIES, answerQuestion, getAnsweredCount } from '../utils/dataQuestions'

const STATUS_STYLES = {
  good:      { ring: 'ring-teal/30',    bg: 'bg-teal/5',    badge: 'bg-teal/15 text-teal',       label: 'Looking good' },
  attention: { ring: 'ring-coral/30',   bg: 'bg-coral/5',   badge: 'bg-coral/15 text-coral',     label: 'Worth a look' },
  neutral:   { ring: 'ring-primary/20', bg: 'bg-primary/5', badge: 'bg-primary/10 text-primary', label: 'Neutral' },
}

function InsightCard({ q }) {
  const answer = answerQuestion(q.id, q._logs, q._profile)

  if (!answer) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-5 opacity-60">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{q.icon}</span>
          <p className="text-sm font-bold text-slate-500">{q.text}</p>
        </div>
        <p className="text-xs text-slate-400 font-medium">🔒 Needs more logging history to unlock</p>
      </div>
    )
  }

  const style = STATUS_STYLES[answer.status] || STATUS_STYLES.neutral

  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-900 ring-1 ${style.ring} ${style.bg} p-5 shadow-sm`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{q.icon}</span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide truncate">{q.text}</p>
        </div>
        <span className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-1 rounded-full shrink-0 ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {answer.stat && (
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">{answer.stat.value}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{answer.stat.label}</p>
        </div>
      )}

      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug mb-1">
        {answer.summary}
      </p>
      {answer.detail && (
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">{answer.detail}</p>
      )}

      {answer.recommendation && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10">
          <p className="text-[9px] font-extrabold text-primary uppercase tracking-wide mb-1">
            💡 How to improve
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {answer.recommendation}
          </p>
        </div>
      )}
    </div>
  )
}

export default function Insights() {
  const { trendLogs, profile } = useUserStore()
  const logs = trendLogs || []

  const answeredCount = useMemo(() => getAnsweredCount(logs, profile), [logs, profile])
  const totalCount = useMemo(
    () => QUESTION_CATEGORIES.reduce((s, c) => s + c.questions.length, 0),
    []
  )

  return (
    <div className="max-w-2xl mx-auto pb-8 animate-slide-up">
      <header className="mb-5">
        <Link to="/dashboard" className="text-xs font-bold text-primary mb-3 inline-block">
          ← Dashboard
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-title mb-1">Personal analysis report</p>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Your data, explained</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Every insight below is computed directly from your real logs — no AI, no guessing, just your actual numbers.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-extrabold text-primary tabular-nums">{answeredCount}/{totalCount}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">unlocked</p>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {QUESTION_CATEGORIES.map((cat) => (
          <section key={cat.id}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-base">{cat.icon}</span>
              <h2 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                {cat.label}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {cat.questions.map((q) => (
                <InsightCard key={q.id} q={{ ...q, _logs: logs, _profile: profile }} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {answeredCount < totalCount && (
        <div className="mt-6 glass-card p-5 text-center">
          <p className="text-sm font-bold text-slate-700">
            {totalCount - answeredCount} more insight{totalCount - answeredCount !== 1 ? 's' : ''} still locked
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Keep logging consistently — deeper patterns take more history to surface accurately.
          </p>
        </div>
      )}
    </div>
  )
}