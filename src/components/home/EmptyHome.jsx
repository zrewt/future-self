import { Link } from 'react-router-dom'

const CARDS = [
  {
    icon: '🔥',
    title: 'Streaks',
    body: 'Log every day to build your streak. Longer streaks multiply your Future Self Score.',
  },
  {
    icon: '⚡',
    title: 'XP & levels',
    body: 'Complete habits and daily quests to earn XP. Level up and unlock new titles.',
  },
  {
    icon: '🔮',
    title: 'Future Self Score',
    body: 'One number that blends fitness, nutrition, energy, focus, and longevity from your logs.',
  },
]

export default function EmptyHome() {
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="glass-card p-6 text-center bg-gradient-to-br from-primary-50 to-white">
        <p className="text-4xl mb-2">👋</p>
        <h2 className="text-xl font-extrabold text-slate-900">Welcome to Future Self</h2>
        <p className="text-sm text-slate-500 mt-2 font-medium max-w-sm mx-auto">
          Your Duolingo for self-improvement. Log once today to start earning XP and building momentum.
        </p>
        <Link to="/log" className="btn-primary mt-5 inline-flex shadow-glow">
          Log your first day
        </Link>
      </div>
      {CARDS.map((c) => (
        <div key={c.title} className="glass-card p-4 flex gap-4">
          <span className="text-2xl">{c.icon}</span>
          <div>
            <p className="font-bold text-slate-900">{c.title}</p>
            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{c.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
