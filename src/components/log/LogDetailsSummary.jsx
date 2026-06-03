import { parseLogDetails } from '../../utils/logDetails'

export default function LogDetailsSummary({ logDetails, compact = false }) {
  const d = parseLogDetails(logDetails)

  const lines = []

  if (d.foods?.length) {
    const names = d.foods.map((f) => f.name).slice(0, 3)
    const extra = d.foods.length > 3 ? ` +${d.foods.length - 3}` : ''
    lines.push({ icon: '🥗', text: `${names.join(', ')}${extra}` })
  }

  if (d.exercise?.name) {
    lines.push({
      icon: '🏋️',
      text: [d.exercise.name, d.exercise.duration_min && `${d.exercise.duration_min} min`]
        .filter(Boolean)
        .join(' · '),
    })
  }

  if (d.sleep?.bedtime || d.sleep?.wake_time) {
    lines.push({
      icon: '💤',
      text: [d.sleep.bedtime && `Bed ${d.sleep.bedtime}`, d.sleep.wake_time && `Up ${d.sleep.wake_time}`]
        .filter(Boolean)
        .join(' · '),
    })
  }

  if (d.focus?.activity) lines.push({ icon: '🎯', text: d.focus.activity })
  if (d.reading?.title) {
    lines.push({
      icon: '📚',
      text: [d.reading.title, d.reading.pages && `${d.reading.pages} pp`].filter(Boolean).join(' · '),
    })
  }
  if (d.meditation?.style) lines.push({ icon: '🧘', text: d.meditation.style })
  if (d.mood?.note) lines.push({ icon: '💭', text: d.mood.note })

  if (!lines.length) return null

  if (compact) {
    return (
      <p className="text-xs text-slate-500 mt-1 truncate">
        {lines.map((l) => l.text).join(' · ')}
      </p>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
      <p className="section-title">Logged details</p>
      {lines.map((l, i) => (
        <p key={i} className="text-sm text-slate-600 flex gap-2">
          <span>{l.icon}</span>
          <span className="line-clamp-2">{l.text}</span>
        </p>
      ))}
    </div>
  )
}
