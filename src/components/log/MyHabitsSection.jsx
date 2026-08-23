import { useMemo, useState } from 'react'
import { useUserStore } from '../../store/useUserStore'
import { localDateISO } from '../../utils/date'
import {
  HABIT_CATEGORIES,
  TRACKING_TYPES,
  DIFFICULTY_XP,
  getWeekProgress,
  getTodayLogForHabit,
  isHabitLogComplete,
} from '../../utils/habits'
import { getSuggestedHabit } from '../../utils/habitSuggestions'

const DISMISS_KEY = 'qyven_habit_suggestion_dismissed_until'

function isDismissed() {
  const until = localStorage.getItem(DISMISS_KEY)
  if (!until) return false
  return new Date(until) > new Date()
}

function dismissForAWeek() {
  const until = new Date()
  until.setDate(until.getDate() + 7)
  localStorage.setItem(DISMISS_KEY, until.toISOString())
}

function SuggestedHabitCard({ onAdded }) {
  const { recentLogs, profile, habits, addHabit } = useUserStore()
  const [dismissed, setDismissed] = useState(isDismissed())
  const [adding, setAdding] = useState(false)

  const suggestion = useMemo(
    () => getSuggestedHabit(recentLogs, profile?.current_streak || 0, habits),
    [recentLogs, profile?.current_streak, habits]
  )

  if (dismissed || !suggestion) return null

  async function handleAdd() {
    setAdding(true)
    await addHabit({ ...suggestion.habit, reason: suggestion.reason })
    setAdding(false)
    onAdded?.()
  }

  function handleDismiss() {
    dismissForAWeek()
    setDismissed(true)
  }

  return (
    <div className="rounded-2xl bg-[#7c3aed]/5 dark:bg-[#00E87A]/5 border border-[#7c3aed]/15 dark:border-[#00E87A]/15 p-4 mb-3">
      <p className="text-[10px] font-bold text-[#7c3aed] dark:text-[#00E87A] uppercase tracking-wide mb-2">
        One habit to consider
      </p>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{suggestion.habit.icon}</span>
        <span className="text-sm font-extrabold text-slate-900 dark:text-[#E8F0E0]">{suggestion.habit.name}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-[#9DB890] font-medium mb-3 leading-relaxed">
        {suggestion.reason}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="text-xs font-bold text-white px-4 py-2 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)' }}
        >
          {adding ? 'Adding…' : 'Add habit'}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs font-bold text-slate-400 dark:text-[#5A7050] px-3 py-2"
        >
          Not now
        </button>
      </div>
    </div>
  )
}

function HabitRow({ habit, habitLogs }) {
  const { logHabitProgress } = useUserStore()
  const [showWhy, setShowWhy] = useState(false)
  const today = localDateISO()
  const todayLog = getTodayLogForHabit(habit, habitLogs, today)
  const done = isHabitLogComplete(habit, todayLog)
  const { completed, target } = getWeekProgress(habit, habitLogs)

  function toggleBoolean() {
    logHabitProgress(habit, done ? 0 : 1, !done)
  }

  function adjustValue(delta) {
    const current = todayLog?.value || 0
    const next = Math.max(0, current + delta)
    const nextDone = habit.target_value ? next >= habit.target_value : next > 0
    logHabitProgress(habit, next, nextDone)
  }

  const step = habit.tracking_type === 'distance' ? 0.5 : habit.tracking_type === 'amount' ? 250 : 5

  return (
    <div className="py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">{habit.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{habit.name}</p>
            {habit.reason && (
              <button
                type="button"
                onClick={() => setShowWhy((v) => !v)}
                className="text-[10px] text-[#7c3aed] font-bold shrink-0"
              >
                💡 Why
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {completed}/{target} this week
            {habit.tracking_type !== 'boolean' && todayLog?.value ? ` · ${todayLog.value}${TRACKING_TYPES[habit.tracking_type].unit || ''} today` : ''}
          </p>
        </div>
        {habit.tracking_type === 'boolean' ? (
          <button
            type="button"
            onClick={toggleBoolean}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all shrink-0 ${
              done ? 'text-white' : 'bg-slate-100 text-slate-300'
            }`}
            style={done ? { background: 'linear-gradient(135deg, #ff7ac6, #7c3aed, #00cdb4)' } : undefined}
          >
            ✓
          </button>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button" onClick={() => adjustValue(-step)} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-sm font-bold">−</button>
            <span className="text-xs font-extrabold text-[#7c3aed] tabular-nums w-8 text-center">{todayLog?.value || 0}</span>
            <button type="button" onClick={() => adjustValue(step)} className="w-7 h-7 rounded-lg bg-[#7c3aed]/10 text-[#7c3aed] text-sm font-bold">+</button>
          </div>
        )}
      </div>
      {showWhy && habit.reason && (
        <p className="text-[11px] text-slate-500 dark:text-[#9DB890] font-medium mt-2 ml-9 italic leading-relaxed">
          {habit.reason}
        </p>
      )}
    </div>
  )
}

function AddHabitFlow({ onClose }) {
  const { addHabit } = useUserStore()
  const [step, setStep] = useState('browse')
  const [form, setForm] = useState({
    name: '', icon: '⭐', tracking_type: 'boolean',
    target_value: '', target_unit: '', frequency_per_week: 7,
    difficulty: 'moderate', pillar_tag: null,
  })

  async function saveHabit(habitData) {
    await addHabit({
      name: habitData.name,
      icon: habitData.icon || '⭐',
      tracking_type: habitData.tracking_type,
      target_value: habitData.target_value ? Number(habitData.target_value) : null,
      target_unit: habitData.target_unit || null,
      frequency_per_week: Number(habitData.frequency_per_week) || 7,
      difficulty: habitData.difficulty || 'moderate',
      pillar_tag: habitData.pillar_tag || null,
    })
    onClose()
  }

  if (step === 'browse') {
    return (
      <div className="space-y-4">
        {HABIT_CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <p className="text-xs font-bold text-slate-500 mb-2">{cat.label}</p>
            <div className="flex flex-wrap gap-2">
              {cat.presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => saveHabit({ ...preset, difficulty: 'moderate' })}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 hover:bg-[#7c3aed]/10 hover:text-[#7c3aed] transition-colors"
                >
                  {preset.icon} {preset.name}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setStep('custom')}
          className="text-xs font-bold text-[#7c3aed] underline"
        >
          ✨ Create your own
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-slate-500">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Practice guitar"
          className="input-field text-sm mt-1"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500">How do you want to track it?</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {Object.entries(TRACKING_TYPES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              onClick={() => setForm((f) => ({ ...f, tracking_type: key }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                form.tracking_type === key ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {form.tracking_type !== 'boolean' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">Target</label>
            <input
              type="number"
              value={form.target_value}
              onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value }))}
              placeholder="30"
              className="input-field text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Unit</label>
            <input
              type="text"
              value={form.target_unit}
              onChange={(e) => setForm((f) => ({ ...f, target_unit: e.target.value }))}
              placeholder={TRACKING_TYPES[form.tracking_type].unit || 'e.g. pages'}
              className="input-field text-sm mt-1"
            />
          </div>
        </div>
      )}
      <div>
        <label className="text-xs font-semibold text-slate-500">Frequency (days/week)</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setForm((f) => ({ ...f, frequency_per_week: n }))}
              className={`w-9 h-9 rounded-full text-xs font-bold ${
                form.frequency_per_week === n ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {n}×
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500">Difficulty</label>
        <div className="flex gap-2 mt-1">
          {Object.entries(DIFFICULTY_XP).map(([key, xp]) => (
            <button
              key={key}
              type="button"
              onClick={() => setForm((f) => ({ ...f, difficulty: key }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${
                form.difficulty === key ? 'bg-[#7c3aed] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {key} · {xp} XP
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={() => setStep('browse')} className="btn-secondary !py-2 !px-4 text-xs">← Back</button>
        <button
          type="button"
          disabled={!form.name.trim()}
          onClick={() => saveHabit(form)}
          className="btn-primary !py-2 !px-4 text-xs flex-1"
        >
          Add habit
        </button>
      </div>
    </div>
  )
}

export default function MyHabitsSection() {
  const { habits, habitLogs } = useUserStore()
  const [adding, setAdding] = useState(false)

  return (
    <div className="rounded-3xl bg-white border border-[rgba(109,40,217,0.10)] shadow-[0_4px_16px_rgba(109,40,217,0.06)] dark:bg-[rgba(20,18,32,0.92)] dark:border-[#29263B] p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="label-text mb-0">My Habits</span>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="text-xs font-bold text-[#7c3aed]"
        >
          {adding ? '✕ Close' : '+ Add habit'}
        </button>
      </div>

      {!adding && <SuggestedHabitCard />}

      {habits.length === 0 && !adding && (
        <p className="text-xs text-slate-500 font-medium py-3">
          Add habits for what YOU'RE working on — not just the core pillars.
        </p>
      )}

      {!adding && habits.map((habit) => (
        <HabitRow key={habit.id} habit={habit} habitLogs={habitLogs} />
      ))}

      {adding && <AddHabitFlow onClose={() => setAdding(false)} />}
    </div>
  )
}