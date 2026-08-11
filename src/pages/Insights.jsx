import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { QUESTION_CATEGORIES, answerQuestion, getAnsweredCount } from '../utils/dataQuestions'

const STATUS_STYLES = {
  good:      { border: 'border-teal/25 dark:border-green/25',      wash: 'bg-teal/[0.045] dark:bg-green/[0.07]',     badge: 'bg-teal/15 text-teal dark:bg-green/15 dark:text-green', label: 'Looking good' },
  attention: { border: 'border-coral/25 dark:border-coral/30',     wash: 'bg-coral/[0.045] dark:bg-coral/[0.08]',    badge: 'bg-coral/15 text-coral dark:bg-coral/15 dark:text-coral', label: 'Worth a look' },
  neutral:   { border: 'border-primary/20 dark:border-primary/35', wash: 'bg-primary/[0.035] dark:bg-primary/[0.09]', badge: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300', label: 'Neutral' },
}

function InsightCard({ q }) {
  const answer = answerQuestion(q.id, q._logs, q._profile)

  if (!answer) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/55 p-5 opacity-80 dark:border-green/20 dark:bg-white/[0.025]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{q.icon}</span>
          <p className="text-sm font-bold text-slate-600 dark:text-[#9DB890]">{q.text}</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-[#5A7050] font-medium">🔒 Needs more logging history to unlock</p>
      </div>
    )
  }

  const style = STATUS_STYLES[answer.status] || STATUS_STYLES.neutral

  return (
    <article className={`rounded-2xl border ${style.border} ${style.wash} p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover dark:shadow-card-dark`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{q.icon}</span>
          <p className="text-xs font-bold text-slate-600 dark:text-[#9DB890] uppercase tracking-wide truncate">{q.text}</p>
        </div>
        <span className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-1 rounded-full shrink-0 ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {answer.stat && (
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-3xl font-extrabold text-slate-900 dark:text-[#E8F0E0] tabular-nums">{answer.stat.value}</p>
          <p className="text-[10px] font-bold text-slate-400 dark:text-[#5A7050] uppercase">{answer.stat.label}</p>
        </div>
      )}

      <p className="text-sm font-bold text-slate-800 dark:text-[#E8F0E0] leading-snug mb-1">
        {answer.summary}
      </p>
      {answer.detail && (
        <p className="text-xs text-slate-600 dark:text-[#9DB890] font-medium leading-relaxed mb-3">{answer.detail}</p>
      )}

      {answer.recommendation && (
        <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-green/10">
          <p className="text-[9px] font-extrabold text-primary uppercase tracking-wide mb-1">
            💡 How to improve
          </p>
          <p className="text-xs text-slate-600 dark:text-[#B8C9AF] font-medium leading-relaxed">
            {answer.recommendation}
          </p>
        </div>
      )}
    </article>
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
      <header className="glass-card mb-5 p-5 sm:p-6">
        <Link to="/dashboard" className="inline-flex items-center rounded-lg px-1 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/10 dark:hover:bg-green/10">
          ← Dashboard
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-title mb-1">Personal analysis report</p>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-[#E8F0E0]">Your data, explained</h1>
            <p className="text-xs text-slate-600 dark:text-[#9DB890] mt-1 max-w-sm leading-relaxed">
              Every insight below is computed directly from your real logs — no AI, no guessing, just your actual numbers.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-extrabold text-primary tabular-nums">{answeredCount}/{totalCount}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-[#5A7050] uppercase">unlocked</p>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {QUESTION_CATEGORIES.map((cat) => (
          <section key={cat.id}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-base">{cat.icon}</span>
              <h2 className="text-xs font-extrabold text-slate-700 dark:text-[#C9D9C0] uppercase tracking-wide">
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
          <p className="text-sm font-bold text-slate-700 dark:text-[#E8F0E0]">
            {totalCount - answeredCount} more insight{totalCount - answeredCount !== 1 ? 's' : ''} still locked
          </p>
          <p className="text-xs text-slate-600 dark:text-[#9DB890] font-medium mt-1">
            Keep logging consistently — deeper patterns take more history to surface accurately.
          </p>
        </div>
      )}
    </div>
  )
}
