import { useRef, useState } from 'react'
import { calcFoodLongevityScore } from '../../utils/scoring'
import { useUserStore } from '../../store/useUserStore'

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

function getGradient(s) {
  if (s >= 75) return 'from-teal-600 via-teal-500 to-primary'
  if (s >= 55) return 'from-primary via-primary-700 to-indigo-600'
  return 'from-slate-700 via-primary to-primary-700'
}

export default function ScoreCard({ profile, log, streak }) {
  const cardRef = useRef(null)
  const [sharing, setSharing] = useState(false)
  const [shareStatus, setShareStatus] = useState(null)
  const { recentScores } = useUserStore()

  const score     = log?.future_self_score ?? 0
  const nutrition = log?.nutrition_score   ?? 0
  const fitness   = log?.fitness_score     ?? 0
  const energy    = log?.energy_score      ?? 0
  const focus     = log?.focus_score       ?? 0
  const longevity = log?.longevity_score   ?? 0
  const username  = profile?.username || 'Qyven'
  const level     = profile?.level    || 1

  const loggedFoods    = log?.log_details?.foods || []
  const foodLongevity  = calcFoodLongevityScore(loggedFoods)
  const allTimeBest    = recentScores.length > 0 ? Math.max(...recentScores) : 0
  const isPersonalBest = score > 0 && score >= allTimeBest && recentScores.length >= 3
  const isPerfect      = log?.is_perfect_day

  const pillars = [
    { label: 'Nutrition', value: nutrition, emoji: '🥗' },
    { label: 'Fitness',   value: fitness,   emoji: '🏋️' },
    { label: 'Energy',    value: energy,    emoji: '⚡' },
    { label: 'Focus',     value: focus,     emoji: '🎯' },
    { label: 'Longevity', value: longevity, emoji: '🛡️' },
  ]

  const bestPillar  = [...pillars].sort((a, b) => b.value - a.value)[0]
  const worstPillar = [...pillars].sort((a, b) => a.value - b.value)[0]

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  function buildShareText() {
    const lines = [
      `${getScoreEmoji(score)} My Qyven score today: ${score}/99`,
      '',
      isPersonalBest ? `🏆 New personal best!` : null,
      isPerfect ? `⭐ Perfect day!` : null,
      `🔥 ${streak} day streak`,
      '',
      `💪 Best pillar: ${bestPillar.label} (${bestPillar.value})`,
      `📈 Focus area: ${worstPillar.label} (${worstPillar.value})`,
      '',
      `Building my future self on Qyven`,
      `qyven.vercel.app/u/${username}`,
    ].filter((l) => l !== null)
    return lines.join('\n')
  }

  async function captureCardAsBlob() {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    })
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  }

  async function handleShare() {
    if (sharing) return
    setSharing(true)
    try {
      const blob = await captureCardAsBlob()
      const file = new File([blob], 'qyven-score.png', { type: 'image/png' })
      const text = buildShareText()
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text })
        setShareStatus('shared')
      } else if (navigator.share) {
        await navigator.share({ text, url: `https://qyven.vercel.app/u/${username}` })
        setShareStatus('shared')
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'qyven-score.png'
        a.click()
        URL.revokeObjectURL(url)
        setShareStatus('saved')
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(buildShareText())
          setShareStatus('copied')
        } catch { /* silent */ }
      }
    }
    setSharing(false)
    setTimeout(() => setShareStatus(null), 2500)
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`https://qyven.vercel.app/u/${username}`)
      setShareStatus('link_copied')
      setTimeout(() => setShareStatus(null), 2000)
    } catch { /* silent */ }
  }

  function getShareLabel() {
    if (sharing)                       return '⏳ Preparing…'
    if (shareStatus === 'shared')      return '✓ Shared!'
    if (shareStatus === 'saved')       return '✓ Image saved!'
    if (shareStatus === 'copied')      return '✓ Text copied!'
    if (shareStatus === 'link_copied') return '✓ Link copied!'
    return navigator.share ? '↑ Share card' : '↓ Save image'
  }

  return (
    <div className="space-y-2">
      {/* ── Card (captured by html2canvas) ── */}
      <div
        ref={cardRef}
        className={`relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br ${getGradient(score)} text-white shadow-xl`}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-12 translate-x-12 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-white/5 translate-y-10 -translate-x-10 pointer-events-none" />

        {/* Badges */}
        {(isPersonalBest || isPerfect) && (
          <div className="flex gap-2 mb-3 relative">
            {isPersonalBest && (
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                <span className="text-sm">🏆</span>
                <p className="text-xs font-extrabold tracking-wide">Personal Best</p>
              </div>
            )}
            {isPerfect && (
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                <span className="text-sm">⭐</span>
                <p className="text-xs font-extrabold tracking-wide">Perfect Day</p>
              </div>
            )}
          </div>
        )}

        {/* Header: user + score */}
        <div className="flex items-start justify-between mb-4 relative">
          <div>
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-0.5">Qyven</p>
            <p className="font-extrabold text-xl leading-tight">{username}</p>
            <p className="text-white/60 text-xs font-medium mt-0.5">Lv.{level} · {date}</p>
            {streak > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-base">🔥</span>
                <p className="text-sm font-bold">{streak} day streak</p>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-0.5">Future Self</p>
            <p className="text-6xl font-extrabold tabular-nums leading-none">{score}</p>
            <p className="text-white/80 text-sm font-bold mt-0.5">
              {getScoreLabel(score)} {getScoreEmoji(score)}
            </p>
          </div>
        </div>

        {/* Pillar bars */}
        <div className="space-y-1.5 relative mb-3">
          {pillars.map((p) => (
            <div key={p.label} className="flex items-center gap-2">
              <span className="text-sm w-5 shrink-0">{p.emoji}</span>
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${p.value}%`, opacity: 0.7 + (p.value / 300) }}
                />
              </div>
              <span className="text-xs font-extrabold tabular-nums w-7 text-right text-white/90">{p.value}</span>
            </div>
          ))}
        </div>

        {/* Insight line */}
        <div className="bg-white/10 rounded-2xl px-3 py-2 relative">
          <p className="text-white/80 text-[11px] font-medium leading-relaxed">
            {score >= 75
              ? `${bestPillar.label} leading the way — this is what building looks like.`
              : score >= 55
              ? `${bestPillar.label} is your strongest today. ${worstPillar.label} is the next lever to pull.`
              : `${worstPillar.label} is the area to focus on. Every log is a step forward.`
            }
          </p>
        </div>

        <p className="mt-3 text-center text-white/30 text-[10px] font-bold uppercase tracking-widest relative">
          qyven.vercel.app
        </p>
      </div>

      {/* ── Share actions ── */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          className="btn-primary flex-1 !py-2.5 text-sm flex items-center justify-center gap-1.5 disabled:opacity-70"
        >
          {getShareLabel()}
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="btn-secondary !py-2.5 !px-3 text-sm"
          title="Copy profile link"
        >
          🔗
        </button>
      </div>
    </div>
  )
}