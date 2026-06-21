import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { answerQuestion, getSuggestedQuestions, getAnsweredCount, QUESTION_CATEGORIES } from '../../utils/dataQuestions'

const STATUS_DOT = {
  good: 'bg-teal',
  attention: 'bg-coral',
  neutral: 'bg-primary',
}

export default function AskYourData({ trendLogs, profile }) {
  const logs = trendLogs || []
  const suggested = useMemo(() => getSuggestedQuestions(logs, profile, 2), [logs, profile])
  const answeredCount = useMemo(() => getAnsweredCount(logs, profile), [logs, profile])
  const totalCount = useMemo(() => QUESTION_CATEGORIES.reduce((s, c) => s + c.questions.length, 0), [])

  if (!suggested.length) {
    return (
      <div className="glass-card p-5">
        <p className="section-title mb-1">📋 Personal analysis</p>
        <p className="text-sm text-slate-500 font-medium">
          Keep logging — once you've built up some history, this turns your data into real, specific insights about what's working.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="section-title mb-0.5">📋 Personal analysis</p>
          <p className="text-[10px] text-slate-400 font-bold">{answeredCount}/{totalCount} insights unlocked</p>
        </div>
        <Link to="/insights" className="text-[10px] font-extrabold text-primary bg-primary/10 px-2.5 py-1.5 rounded-full">
          Full report →
        </Link>
      </div>

      <div className="space-y-2">
        {suggested.map((q) => {
          const answer = answerQuestion(q.id, logs, profile)
          if (!answer) return null
          return (
            <Link
              key={q.id}
              to="/insights"
              className="block px-3 py-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[answer.status] || STATUS_DOT.neutral}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">{q.text}</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">{answer.summary}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}