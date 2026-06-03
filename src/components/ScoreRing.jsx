import { useEffect, useState } from 'react'

export default function ScoreRing({ score, color, size = 60, strokeWidth = 6, showNumber = true }) {
  const [animated, setAnimated] = useState(false)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(t)
  }, [score])

  return (
    <svg width={size} height={size} className="flex-shrink-0 drop-shadow-sm">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E8EAEF"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animated ? offset : circumference}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
      {showNumber && (
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-slate-800 font-bold"
          fontSize={size * 0.24}
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {score}
        </text>
      )}
    </svg>
  )
}
