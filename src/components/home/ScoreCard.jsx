import { useRef, useState } from 'react'

export default function ScoreCard({ profile, log, streak }) {
  const cardRef = useRef(null)
  const [copying, setCopying] = useState(false)

  const score = log?.future_self_score ?? 0
  const nutrition = log?.nutrition_score ?? 0
  const fitness = log?.fitness_score ?? 0
  const energy = log?.energy_score ?? 0
  const focus = log?.focus_score ?? 0
  const username = profile?.username || 'Qyven'
  const level = profile?.level || 1

  function getScoreLabel(s) {
    if (s >= 85) return 'Elite'
    if (s >= 70) return 'Strong'
    if (s >= 55) return 'Building'
    if (s >= 40) return 'Rising'
    return 'Starting'
  }

  function getScoreEmoji(s) {
    if (s >= 85) return '🔥'
    if (s >= 70) return '💪'
    if (s >= 55) return '📈'
    if (s >= 40) return '⚡'
    return '🌱'
  }

  async function handleShare() {
    setCopying(true)

    const text =
      `${getScoreEmoji(score)} My Qyven score today: ${score}/99\n\n` +
      `🥗 Nutrition: ${nutrition}\n` +
      `🏋️ Fitness: ${fitness}\n` +
      `⚡ Energy: ${energy}\n` +
      `🎯 Focus: ${focus}\n` +
      `🔥 Streak: ${streak} days\n\n` +
      `Building my future self on Qyven ✨`

    try {
      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
        setTimeout(() => setCopying(false), 2000)
        return
      }
    } catch {
      // user cancelled
    }

    setCopying(false)
  }

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="space-y-3">
      {/* Visual card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#7F77DD] via-[#6366f1] to-[#14b8a6] text-white shadow-xl"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-8 -translate-x-8" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative">
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Qyven</p>
            <p className="font-extrabold text-lg">{username}</p>
            <p className="text-white/60 text-xs font-medium">Level {level} · {date}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs font-bold uppercase">Future Self</p>
            <p className="text-5xl font-extrabold tabular-nums leading-none">{score}</p>
            <p className="text-white/80 text-sm font-bold">{getScoreLabel(score)} {getScoreEmoji(score)}</p>
          </div>
        </div>

        {/* Score grid */}
        <div className="grid grid-cols-2 gap-2 relative">
          {[
            { label: 'Nutrition', value: nutrition, emoji: '🥗' },
            { label: 'Fitness', value: fitness, emoji: '🏋️' },
            { label: 'Energy', value: energy, emoji: '⚡' },
            { label: 'Focus', value: focus, emoji: '🎯' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-2xl px-3 py-2 flex items-center gap-2">
              <span className="text-lg">{s.emoji}</span>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase">{s.label}</p>
                <p className="text-white font-extrabold tabular-nums text-lg leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-2 relative">
            <span className="text-xl">🔥</span>
            <p className="font-bold text-sm">
              {streak} day streak — keep going
            </p>
          </div>
        )}
      </div>

      {/* Share button */}
      <button
        type="button"
        onClick={handleShare}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <span>{copying ? '✓ Copied!' : '↑ Share my score'}</span>
      </button>
    </div>
  )
}