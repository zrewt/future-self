import { getXPForLevel, getXPForNextLevel } from '../utils/scoring'

export default function XPBar({ totalXP, level }) {
  const currentLevelXP = getXPForLevel(level)
  const nextLevelXP    = getXPForNextLevel(level)
  const progress = nextLevelXP > currentLevelXP
    ? ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    : 100

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-bold text-slate-700 dark:text-[#9DB890]">
          {totalXP.toLocaleString()}{' '}
          <span className="text-slate-400 dark:text-[#5A7050] font-semibold">XP</span>
        </span>
        <span className="
          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
          bg-[#7F5AF0]/10 text-[#7F5AF0]
          dark:bg-[#00E87A]/10 dark:text-[#00E87A]
        ">
          Level {level}
        </span>
      </div>

      <div className="relative h-2 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            background: 'linear-gradient(90deg, #7F5AF0, #A882F5)',
          }}
        />
        {/* Dark mode override via a sibling — avoids Tailwind purge issues */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out hidden dark:block"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            background: 'linear-gradient(90deg, #00E87A, #7F5AF0)',
            boxShadow: '0 0 8px rgba(0,232,122,0.5)',
          }}
        />
      </div>

      <p className="text-[11px] text-slate-400 dark:text-[#5A7050] mt-1.5 text-right">
        {(nextLevelXP - totalXP).toLocaleString()} XP to level {level + 1}
      </p>
    </div>
  )
}
