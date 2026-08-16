import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { QUESTION_CATEGORIES, answerQuestion, getAnsweredCount } from '../utils/dataQuestions'
import { getPathConfig } from '../data/paths'

// Flattened once at module scope — used to look up a question by id when
// building the path-priority "For you" section below.
const ALL_QUESTIONS = QUESTION_CATEGORIES.flatMap((cat) =>
  cat.questions.map((q) => ({ ...q, category: cat.label, categoryIcon: cat.icon }))
)

const STATUS_STYLES = {
  good:      { border: 'border-[#00b8a0]/25 dark:border-[#00E8C6]/20', wash: 'bg-[#00b8a0]/[0.045] dark:bg-[#00E8C6]/[0.06]', badge: 'bg-[#00b8a0]/10 text-[#00806f] dark:bg-[#00E8C6]/10 dark:text-[#00E8C6]', label: 'Looking good' },
  attention: { border: 'border-[#e0527a]/25 dark:border-[#FF7AC6]/25', wash: 'bg-[#e0527a]/[0.045] dark:bg-[#FF7AC6]/[0.07]', badge: 'bg-[#e0527a]/10 text-[#b8305a] dark:bg-[#FF7AC6]/10 dark:text-[#FF9BD6]', label: 'Worth a look' },
  neutral:   { border: 'border-[#7c3aed]/20 dark:border-[#7F5AF0]/30', wash: 'bg-[#7c3aed]/[0.035] dark:bg-[#7F5AF0]/[0.08]', badge: 'bg-[#7c3aed]/10 text-[#6626d9] dark:bg-[#7F5AF0]/15 dark:text-[#C4B5FD]', label: 'In range' },
}

function InsightCard({ q }) {
  const answer = answerQuestion(q.id, q._logs, q._profile)

  if (!answer) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 opacity-90 dark:border-[#3B3654] dark:bg-[#141220]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{q.icon}</span>
          <p className="text-sm font-bold text-slate-600 dark:text-[#9DB890]">{q.text}</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-[#7B9470] font-medium">🔒 Needs more logging history to unlock</p>
      </div>
    )
  }

  const style = STATUS_STYLES[answer.status] || STATUS_STYLES.neutral

  return (
    <article className={`rounded-2xl border ${style.border} ${style.wash} p-5 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-colors duration-200 hover:shadow-[0_8px_20px_rgba(15,23,42,0.07)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.18)]`}>
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
        <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/[0.07]">
          <p className="text-[9px] font-extrabold text-[#7c3aed] dark:text-[#00E8C6] uppercase tracking-wide mb-1">
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

  // Path-priority section (avatar_class / "path" personalization). Falls
  // back to the 'balanced' config via getPathConfig if no path is set yet
  // (e.g. pre-personalization signups) — see data/paths.js.
  const pathConfig = useMemo(() => getPathConfig(profile?.avatar_class), [profile?.avatar_class])
  const priorityQuestions = useMemo(
    () => pathConfig.priorityQuestionIds
      .map((id) => ALL_QUESTIONS.find((q) => q.id === id))
      .filter(Boolean),
    [pathConfig]
  )
  const anyPriorityAnswerable = useMemo(
    () => priorityQuestions.some((q) => answerQuestion(q.id, logs, profile) != null),
    [priorityQuestions, logs, profile]
  )

  return (
    <div className="max-w-2xl mx-auto pb-8 animate-slide-up">
      <header className="relative overflow-hidden mb-6 rounded-3xl border border-[rgba(109,40,217,0.10)] bg-white p-5 shadow-[0_6px_20px_rgba(109,40,217,0.08)] sm:p-6 dark:border-[#302D45] dark:bg-[#141220] dark:shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
        <div className="absolute top-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r from-[#ff7ac6] via-[#7c3aed] to-[#00cdb4] dark:hidden" />
        <Link to="/dashboard" className="inline-flex items-center rounded-lg px-1 py-1 text-xs font-bold text-[#7c3aed] transition-colors hover:bg-[#7c3aed]/5 dark:text-[#00E8C6] dark:hover:bg-[#00E8C6]/10">
          ← Dashboard
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7c3aed] dark:text-[#00E8C6] mb-1">Data insights</p>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-[#E8F0E0]">Your data, explained</h1>
            <p className="text-xs text-slate-600 dark:text-[#9DB890] mt-1 max-w-sm leading-relaxed">
              Every insight below is computed directly from your real logs — no AI, no guessing, just your actual numbers.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-extrabold text-[#7c3aed] dark:text-[#00E8C6] tabular-nums">{answeredCount}/{totalCount}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-[#5A7050] uppercase">unlocked</p>
          </div>
        </div>
      </header>

      {/* ── For you (path-priority, from avatar_class) ── */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs dark:hidden"
            style={{ background: 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)' }}
          >
            <span className="text-white text-[11px]">🎯</span>
          </span>
          <span className="text-base hidden dark:inline">🎯</span>
          <h2 className="text-xs font-extrabold text-slate-700 dark:text-[#C9D9C0] uppercase tracking-wide">
            {pathConfig.label} focus
          </h2>
        </div>
        {anyPriorityAnswerable ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {priorityQuestions.map((q) => (
              <InsightCard key={q.id} q={{ ...q, _logs: logs, _profile: profile }} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#7c3aed]/20 bg-[#7c3aed]/[0.035] p-5 dark:border-[#3B3654] dark:bg-[#141220]">
            <p className="text-xs text-slate-500 dark:text-[#7B9470] font-medium leading-relaxed">
              {pathConfig.emptyStateCopy}
            </p>
          </div>
        )}
      </section>

      <div className="space-y-6">
        {QUESTION_CATEGORIES.map((cat) => (
          <section key={cat.id}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#7c3aed]/10 dark:bg-transparent text-sm">{cat.icon}</span>
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
        <div className="mt-6 rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[#141220] dark:border-[#302D45] p-5 text-center">
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
