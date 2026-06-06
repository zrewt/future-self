import { useRef, useState } from 'react'
import { calcFoodLongevityScore } from '../../utils/scoring'
import { useUserStore } from '../../store/useUserStore'

export default function ScoreCard({ profile, log, streak }) {
  const cardRef = useRef(null)
  const [sharing, setSharing] = useState(false)
  const [shareStatus, setShareStatus] = useState(null)
  const { recentScores } = useUserStore()

  const score = log?.future_self_score ?? 0
  const nutrition = log?.nutrition_score ?? 0
  const fitness = log?.fitness_score ?? 0
  const energy = log?.energy_score ?? 0
  const focus = log?.focus_score ?? 0
  const longevity = log?.longevity_score ?? 0
  const username = profile?.username || 'Qyven'
  const level = profile?.level || 1

  const loggedFoods = log?.log_details?.foods || []
  const foodLongevity = calcFoodLongevityScore(loggedFoods)
  const showFoodLongevity = foodLongevity !== null

  const allTimeBest = recentScores.length > 0 ? Math.max(...recentScores) : 0
  const isPersonalBest = score > 0 && score >= allTimeBest

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

  function buildShareText() {
    const longevityLine = showFoodLongevity ? `🧬 Food Longevity: ${foodLongevity}\n` : ''
    const pbLine = isPersonalBest ? `🏆 Personal best!\n` : ''
    return (
      `${getScoreEmoji(score)} My Qyven score today: ${score}/99\n\n` +
      pbLine +
      `🥗 Nutrition: ${nutrition}\n` +
      `🏋️ Fitness: ${fitness}\n` +
      `⚡ Energy: ${energy}\n` +
      `🎯 Focus: ${focus}\n` +
      `🛡️ Longevity: ${longevity}\n` +
      longevityLine +
      `🔥 Streak: ${streak} days\n\n` +
      `Building my future self on Qyven ✨\nqyven.vercel.app`
    )
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
        await navigator.share({ text })
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
        } catch {
          // silent
        }
      }
    }

    setSharing(false)
    setTimeout(() => setShareStatus(null), 2500)
  }

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const baseScores = [
    { label: 'Nutrition', value: nutrition, emoji: '🥗' },
    { label: 'Fitness', value: fitness, emoji: '🏋️' },
    { label: 'Energy', value: energy, emoji: '⚡' },
    { label: 'Focus', value: focus, emoji: '🎯' },
  ]

  function getShareButtonLabel() {
    if (sharing) return '⏳ Preparing…'
    if (shareStatus === 'shared') return '✓ Shared!'
    if (shareStatus === 'saved') return '✓ Image saved!'
    if (shareStatus === 'copied') return '✓ Copied!'
    if (typeof navigator !== 'undefined' && navigator.share) return '↑ Share my score'
    return '↓ Save image'
  }

  return (
    <div className="space-y-3">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#7F77DD] via-[#6366f1] to-[#14b8a6] text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-8 -translate-x-8" />

        {isPersonalBest && (
          <div className="relative mb-3 flex items-center justify-center gap-2 bg-white/20 rounded-2xl px-3 py-1.5">
            <span className="text-base">🏆</span>
            <p className="font-extrabold text-sm tracking-wide">Personal Best!</p>
          </div>
        )}

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

        <div className="grid grid-cols-2 gap-2 relative">
          {baseScores.map((s) => (
            <div key={s.label} className="bg-white/10 rounded-2xl px-3 py-2 flex items-center gap-2">
              <span className="text-lg">{s.emoji}</span>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase">{s.label}</p>
                <p className="text-white font-extrabold tabular-nums text-lg leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 relative">
          <div className="bg-white/10 rounded-2xl px-3 py-2 flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <div>
              <p className="text-white/60 text-[10px] font-bold uppercase">Longevity</p>
              <p className="text-white font-extrabold tabular-nums text-lg leading-tight">{longevity}</p>
            </div>
          </div>
          {showFoodLongevity && (
            <div className="bg-white/20 rounded-2xl px-3 py-2 flex items-center gap-2 ring-1 ring-white/30">
              <span className="text-lg">🧬</span>
              <div>
                <p className="text-white/70 text-[10px] font-bold uppercase">Food Longevity</p>
                <p className="text-white font-extrabold tabular-nums text-lg leading-tight">{foodLongevity}</p>
              </div>
            </div>
          )}
        </div>

        {streak > 0 && (
          <div className="mt-2 flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-2 relative">
            <span className="text-xl">🔥</span>
            <p className="font-bold text-sm">{streak} day streak — keep going</p>
          </div>
        )}

        {showFoodLongevity && (
          <div className="mt-2 flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-2 relative">
            <span className="text-base">🌿</span>
            <p className="text-white/80 text-xs font-medium">
              {foodLongevity >= 75
                ? 'Anti-inflammatory day — excellent food choices'
                : foodLongevity >= 55
                ? 'Good whole food base today'
                : 'Add more whole foods to boost longevity'}
            </p>
          </div>
        )}

        <p className="mt-3 text-center text-white/30 text-[10px] font-bold uppercase tracking-widest relative">
          qyven.vercel.app
        </p>
      </div>

      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {getShareButtonLabel()}
      </button>
    </div>
  )
}