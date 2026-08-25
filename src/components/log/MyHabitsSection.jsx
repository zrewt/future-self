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
  getHabitStep,
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

function SuggestedHabitCard() {
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
  }

  function handleDismiss() {
    dismissForAWeek()
    setDismissed(true)
  }

  return (
    <div className="rounded-2xl bg-[#6D5CE7]/5 dark:bg-[#00E87A]/5 border border-[#6D5CE7]/15 dark:border-[#00E87A]/15 p-4 mb-3">
      <p className="text-[10px] font-bold text-[#6D5CE7] dark:text-[#00E87A] uppercase tracking-wide mb-2">
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
          className="btn-primary !py-2 !px-4 text-xs"
        >
          {adding ? 'Adding…' : 'Add habit'}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="btn-ghost !py-2 !px-3 text-xs"
        >
          Not now
        </button>
      </div>
    </div>
  )
}

function HabitRow({ habit, habitLogs, onEdit }) {
  const { logHabitProgress } = useUserStore()
  const [showWhy, setShowWhy] = useState(false)
  const today = localDateISO()
  const todayLog = getTodayLogForHabit(habit, habitLogs, today)
  const done = isHabitLogComplete(habit, todayLog)
  const { completed, target } = getWeekProgress(habit, habitLogs)
  const step = getHabitStep(habit)

  function toggleBoolean(e) {
    e.stopPropagation()
    logHabitProgress(habit, done ? 0 : 1, !done)
  }

  function adjustValue(e, delta) {
    e.stopPropagation()
    const current = todayLog?.value || 0
    const next = Math.max(0, current + delta)
    const nextDone = habit.target_value ? next >= habit.target_value : next > 0
    logHabitProgress(habit, next, nextDone)
  }

  return (
    <div className="py-3 border-b border-slate-100 dark:border-[#29263B] last:border-b-0">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => onEdit(habit)}
      >
        <span className="text-xl shrink-0">{habit.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{habit.name}</p>
            {habit.one_time && (
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide shrink-0">One-time</span>
            )}
            {habit.reason && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowWhy((v) => !v) }}
                className="text-[10px] text-[#6D5CE7] dark:text-[#00E87A] font-bold shrink-0"
              >
                💡 Why
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {habit.one_time
              ? 'Tap to edit or delete'
              : `${completed}/${target} this week`}
            {habit.tracking_type !== 'boolean' && todayLog?.value ? ` · ${todayLog.value}${TRACKING_TYPES[habit.tracking_type].unit || ''} today` : ''}
          </p>
        </div>
        {habit.tracking_type === 'boolean' ? (
          <button
            key={String(done)}
            type="button"
            onClick={toggleBoolean}
            className={`icon-btn w-8 h-8 text-sm font-bold shrink-0 ${
              done
                ? 'text-white bg-[#6D5CE7] dark:bg-[#00E87A] success-burst'
                : 'bg-slate-100 dark:bg-[#242033] text-slate-300 dark:text-[#5A5570]'
            }`}
          >
            ✓
          </button>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => adjustValue(e, -step)}
              className="icon-btn w-7 h-7 bg-slate-100 dark:bg-[#242033] text-slate-600 dark:text-[#C3C5DE] text-sm font-bold"
            >
              −
            </button>
            <span className="text-xs font-extrabold text-[#6D5CE7] dark:text-[#00E87A] tabular-nums w-8 text-center">{todayLog?.value || 0}</span>
            <button
              type="button"
              onClick={(e) => adjustValue(e, step)}
              className="icon-btn w-7 h-7 bg-[#6D5CE7]/10 dark:bg-[#00E87A]/10 text-[#6D5CE7] dark:text-[#00E87A] text-sm font-bold"
            >
              +
            </button>
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

// Shared form for both creating a custom habit and editing an existing one.
function HabitForm({ initial, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    icon: initial?.icon || '⭐',
    tracking_type: initial?.tracking_type || 'boolean',
    target_value: initial?.target_value ?? '',
    target_unit: initial?.target_unit || '',
    frequency_per_week: initial?.frequency_per_week || 7,
    difficulty: initial?.difficulty || 'moderate',
    pillar_tag: initial?.pillar_tag || null,
    one_time: initial?.one_time || false,
  })

  function toggleOneTime() {
    setForm((f) => ({
      ...f,
      one_time: !f.one_time,
      // One-time tasks are just "did you do it" — force boolean tracking
      // so there's no weekly-frequency concept to configure.
      tracking_type: !f.one_time ? 'boolean' : f.tracking_type,
    }))
  }

  function handleSave() {
    onSave({
      name: form.name,
      icon: form.icon || '⭐',
      tracking_type: form.tracking_type,
      target_value: form.tracking_type === 'boolean' ? null : (form.target_value ? Number(form.target_value) : null),
      target_unit: form.tracking_type === 'boolean' ? null : (form.target_unit || null),
      frequency_per_week: form.one_time ? 1 : (Number(form.frequency_per_week) || 7),
      difficulty: form.difficulty || 'moderate',
      pillar_tag: form.pillar_tag || null,
      one_time: form.one_time,
    })
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

      <button
        type="button"
        onClick={toggleOneTime}
        className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold border transition-all duration-150 ease-spring ${
          form.one_time
            ? 'bg-[#6D5CE7]/10 dark:bg-[#00E87A]/10 border-[#6D5CE7]/30 dark:border-[#00E87A]/30 text-[#6D5CE7] dark:text-[#00E87A]'
            : 'bg-slate-50 dark:bg-[#242033] border-slate-200 dark:border-[#3A3650] text-slate-500 dark:text-[#9EA1BD]'
        }`}
      >
        <span>One-time task (doesn't repeat)</span>
        <span className={`w-9 h-5 rounded-full relative transition-all ${form.one_time ? 'bg-[#6D5CE7] dark:bg-[#00E87A]' : 'bg-slate-300 dark:bg-[#3A3650]'}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.one_time ? 'left-4' : 'left-0.5'}`} />
        </span>
      </button>

      {!form.one_time && (
        <div>
          <label className="text-xs font-semibold text-slate-500">How do you want to track it?</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.entries(TRACKING_TYPES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                data-selected={form.tracking_type === key}
                onClick={() => setForm((f) => ({ ...f, tracking_type: key }))}
                className={`chip px-3 py-1.5 text-xs ${
                  form.tracking_type === key ? '' : 'bg-slate-100 dark:bg-[#242033] text-slate-600 dark:text-[#C3C5DE]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!form.one_time && form.tracking_type !== 'boolean' && (
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

      {!form.one_time && (
        <div>
          <label className="text-xs font-semibold text-slate-500">Frequency (days/week)</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                data-selected={form.frequency_per_week === n}
                onClick={() => setForm((f) => ({ ...f, frequency_per_week: n }))}
                className={`chip w-9 h-9 text-xs ${
                  form.frequency_per_week === n ? '' : 'bg-slate-100 dark:bg-[#242033] text-slate-600 dark:text-[#C3C5DE]'
                }`}
              >
                {n}×
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-slate-500">Difficulty</label>
        <div className="flex gap-2 mt-1">
          {Object.entries(DIFFICULTY_XP).map(([key, xp]) => (
            <button
              key={key}
              type="button"
              data-selected={form.difficulty === key}
              onClick={() => setForm((f) => ({ ...f, difficulty: key }))}
              className={`chip px-3 py-1.5 text-xs capitalize ${
                form.difficulty === key ? '' : 'bg-slate-100 dark:bg-[#242033] text-slate-600 dark:text-[#C3C5DE]'
              }`}
            >
              {key} · {xp} XP
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary !py-2 !px-4 text-xs">Cancel</button>
        <button
          type="button"
          disabled={!form.name.trim()}
          onClick={handleSave}
          className="btn-primary !py-2 !px-4 text-xs flex-1"
        >
          {onDelete ? 'Save changes' : 'Add habit'}
        </button>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-full text-xs font-bold text-[#e0527a] py-2"
        >
          🗑️ Delete habit
        </button>
      )}
    </div>
  )
}

function AddHabitFlow({ onClose }) {
  const { addHabit } = useUserStore()
  const [step, setStep] = useState('browse')

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
                  onClick={async () => {
                    await addHabit({ ...preset, difficulty: 'moderate', one_time: false })
                    onClose()
                  }}
                  className="chip px-3 py-1.5 text-xs bg-slate-100 dark:bg-[#242033] text-slate-600 dark:text-[#C3C5DE] hover:bg-[#6D5CE7]/10 hover:text-[#6D5CE7] dark:hover:bg-[#00E87A]/10 dark:hover:text-[#00E87A]"
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
          className="text-xs font-bold text-[#6D5CE7] dark:text-[#00E87A] underline"
        >
          ✨ Create your own
        </button>
      </div>
    )
  }

  return (
    <HabitForm
      onSave={async (habitData) => { await addHabit(habitData); onClose() }}
      onCancel={() => setStep('browse')}
    />
  )
}

function EditHabitFlow({ habit, onClose }) {
  const { updateHabit, archiveHabit } = useUserStore()

  return (
    <HabitForm
      initial={habit}
      onSave={async (habitData) => { await updateHabit(habit.id, habitData); onClose() }}
      onCancel={onClose}
      onDelete={async () => { await archiveHabit(habit.id); onClose() }}
    />
  )
}

export default function MyHabitsSection() {
  const { habits, habitLogs } = useUserStore()
  const [adding, setAdding] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="label-text mb-0">My Habits</span>
        {!editingHabit && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="text-xs font-bold text-[#6D5CE7] dark:text-[#00E87A]"
          >
            {adding ? '✕ Close' : '+ Add habit'}
          </button>
        )}
      </div>

      {!adding && !editingHabit && <SuggestedHabitCard />}

      {habits.length === 0 && !adding && !editingHabit && (
        <p className="text-xs text-slate-500 font-medium py-3">
          Add habits for what YOU'RE working on — not just the core pillars.
        </p>
      )}

      {!adding && !editingHabit && habits.map((habit) => (
        <HabitRow key={habit.id} habit={habit} habitLogs={habitLogs} onEdit={setEditingHabit} />
      ))}

      {adding && <AddHabitFlow onClose={() => setAdding(false)} />}
      {editingHabit && <EditHabitFlow habit={editingHabit} onClose={() => setEditingHabit(null)} />}
    </div>
  )
}