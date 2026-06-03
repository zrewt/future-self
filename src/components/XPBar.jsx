import { getXPForLevel, getXPForNextLevel } from '../utils/scoring'

export default function XPBar({ totalXP, level }) {
  const currentLevelXP = getXPForLevel(level)
  const nextLevelXP = getXPForNextLevel(level)
  const progress = nextLevelXP > currentLevelXP
    ? ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    : 100

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-bold text-slate-800">
          {totalXP.toLocaleString()} <span className="text-slate-400 font-semibold">XP</span>
        </span>
        <span className="pill bg-primary-50 text-primary-700 dark:bg-teal/10 dark:text-teal">Level {level}</span>
      </div>
      <div className="relative h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-primary-400 to-primary-300 dark:from-teal dark:via-primary dark:to-amber transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5 text-right">
        {(nextLevelXP - totalXP).toLocaleString()} XP to level {level + 1}
      </p>
    </div>
  )
}
