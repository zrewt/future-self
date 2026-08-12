import { Link } from 'react-router-dom'
import { evaluateQuests } from '../../data/quests'
import { useUserStore } from '../../store/useUserStore'

export default function DailyQuests({ todayLog }) {
  const { profile } = useUserStore()

  // evaluateQuests reads screen_time_target_minutes off the log object itself
  // (see quests.js), but that value actually lives on the profile — merge it
  // in here so the Unplugged quest checks against the user's real saved target
  // instead of always falling back to the 180-minute default.
  const logForQuests = todayLog
    ? { ...todayLog, screen_time_target_minutes: profile?.screen_time_target_minutes }
    : todayLog

  const quests = evaluateQuests(logForQuests)
  const done = quests.filter((q) => q.done).length

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title">Daily quests</p>
        <span className="pill bg-amber/15 text-amber-800 dark:text-amber text-[10px]">
          {done}/{quests.length}
        </span>
      </div>
      <ul className="space-y-2">
        {quests.map((q) => (
          <li
            key={q.id}
            className={[
              'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm',
              q.done
                ? 'bg-teal/10 border border-teal/20'
                : 'bg-slate-50 dark:bg-white/5 border border-transparent dark:border-white/5',
            ].join(' ')}
          >
            <span className="text-lg">{q.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800">{q.name}</p>
              <p className="text-[10px] text-slate-500">{q.desc}</p>
            </div>
            <span className="text-[10px] font-bold text-primary shrink-0">+{q.xp}</span>
            <span
              className={[
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                q.done ? 'bg-teal text-white' : 'border-2 border-dashed border-slate-300 dark:border-slate-600',
              ].join(' ')}
            >
              {q.done ? '✓' : ''}
            </span>
          </li>
        ))}
      </ul>
      {!todayLog && (
        <Link to="/log" className="btn-primary w-full mt-3 text-sm !py-2.5">
          Log to complete quests
        </Link>
      )}
    </div>
  )
} 