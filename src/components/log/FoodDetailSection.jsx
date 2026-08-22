import { useEffect, useMemo, useState } from 'react'
import { searchFoods, foodToLogItem, detectServingKey } from '../../services/openFoodFacts'
import { useUserStore } from '../../store/useUserStore'
import { calcFoodQualityScore, calcFoodLongevityScore, calcMacroSummary } from '../../utils/scoring'
import { getFoodDisplay } from '../../utils/servingUnits'

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  other: 'Other',
}
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack', 'other']

function macroStr(food) {
  const d = getFoodDisplay(food)
  const parts = []
  if (d.calories) parts.push(`${d.calories} kcal`)
  if (food.protein  != null) parts.push(`P ${Math.round((food.protein  ?? 0) * ((food.servingG ?? 150) / 100) * (food.qty ?? 1) * 10) / 10}g`)
  if (food.carbs    != null) parts.push(`C ${Math.round((food.carbs    ?? 0) * ((food.servingG ?? 150) / 100) * (food.qty ?? 1) * 10) / 10}g`)
  if (food.fat      != null) parts.push(`F ${Math.round((food.fat      ?? 0) * ((food.servingG ?? 150) / 100) * (food.qty ?? 1) * 10) / 10}g`)
  return parts.length ? parts.join(' · ') : null
}

function qualityLabel(score) {
  if (score >= 82) return { text: 'Excellent 🌿',     color: 'text-teal' }
  if (score >= 68) return { text: 'Very good 👍',     color: 'text-teal' }
  if (score >= 54) return { text: 'Pretty solid',     color: 'text-primary' }
  if (score >= 38) return { text: 'Room to improve',  color: 'text-amber-600 dark:text-amber' }
  return               { text: 'High processed load', color: 'text-coral' }
}

function longevityLabel(score) {
  if (score >= 82) return { text: 'Anti-inflammatory 🔬', color: 'text-teal' }
  if (score >= 68) return { text: 'Strong longevity base', color: 'text-teal' }
  if (score >= 54) return { text: 'Good base',             color: 'text-primary' }
  if (score >= 38) return { text: 'Add whole foods',       color: 'text-amber-600 dark:text-amber' }
  return               { text: 'Low whole food ratio',     color: 'text-coral' }
}

export default function FoodDetailSection({
  foods,
  onChange,
  onServingDetected,
  onServingRemoved,
  activeMeal = null,   // NEW — 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
}) {
  const { savedMeals, addSavedMeal, deleteSavedMeal } = useUserStore()

  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState([])
  const [searching,   setSearching]   = useState(false)
  const [searchError, setSearchError] = useState('')
  const [customName,  setCustomName]  = useState('')
  const [tab,         setTab]         = useState('search')
  const [savingMeal,  setSavingMeal]  = useState(false)
  const [newMealName, setNewMealName] = useState('')

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setSearchError(''); return }

    const ctrl  = new AbortController()
    const timer = setTimeout(async () => {
      setSearching(true)
      setSearchError('')
      try {
        const items = await searchFoods(query, ctrl.signal)
        setResults(items)
        if (!items.length) setSearchError('No results — try adding manually below')
      } catch (err) {
        if (err.name !== 'AbortError') {
          setSearchError('Search failed — add manually below')
          setResults([])
        }
      } finally { setSearching(false) }
    }, 400)

    return () => { clearTimeout(timer); ctrl.abort() }
  }, [query])

  const analysis = useMemo(() => {
    if (!foods.length) return null
    const fq = calcFoodQualityScore(foods)
    const fl = calcFoodLongevityScore(foods)
    const fm = calcMacroSummary(foods)
    return { fq, fl, fm }
  }, [foods])

  // Group added foods by meal for display — 'other'/unset lands last
  const groupedFoods = useMemo(() => {
    const groups = {}
    for (const f of foods) {
      const key = f.meal && MEAL_LABELS[f.meal] ? f.meal : 'other'
      if (!groups[key]) groups[key] = []
      groups[key].push(f)
    }
    return MEAL_ORDER
      .filter((k) => groups[k]?.length)
      .map((k) => ({ meal: k, items: groups[k] }))
  }, [foods])

  function addFood(item) {
    const servingKey = item.servingKey || detectServingKey(item.name)
    const food = { ...item, qty: 1, servingKey, meal: activeMeal || item.meal || null }
    onChange([...foods, food])
    setQuery('')
    setResults([])
    if (servingKey && onServingDetected) onServingDetected(servingKey)
  }

  function updateQty(id, qty) {
    const clamped = Math.max(0.5, Math.round(qty * 2) / 2)
    onChange(foods.map((f) => f.id === id ? { ...f, qty: clamped } : f))
  }

  function setMeal(id, meal) {
    onChange(foods.map((f) => f.id === id ? { ...f, meal } : f))
  }

  function removeFood(id) {
    const food = foods.find((f) => f.id === id)
    onChange(foods.filter((f) => f.id !== id))
    if (food?.servingKey && onServingRemoved) onServingRemoved(food.servingKey)
  }

  function addCustom() {
    const name = customName.trim()
    if (!name) return
    const servingKey = detectServingKey(name)
    addFood({
      id: crypto.randomUUID(),
      name,
      brand: '',
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      servingG: 150,
      unit: '1 serving',
      serving: '1 serving',
      servingKey,
      qty: 1,
    })
    setCustomName('')
  }

  async function handleSaveMeal() {
    const name = newMealName.trim()
    if (!name || !foods.length) return
    await addSavedMeal(name, foods)
    setNewMealName('')
    setSavingMeal(false)
  }

  function loadMeal(meal) {
    const newFoods = (meal.foods || []).map((f) => ({ ...f, id: crypto.randomUUID(), meal: activeMeal || f.meal || null }))
    onChange([...foods, ...newFoods])
    newFoods.forEach((f) => {
      if (f.servingKey && onServingDetected) onServingDetected(f.servingKey)
    })
    setTab('search')
  }

  return (
    <div className="space-y-3">

      <div className="flex gap-2">
        {[
          { key: 'search', label: '🔍 Search' },
          { key: 'saved',  label: `🍱 Saved${savedMeals?.length ? ` (${savedMeals.length})` : ''}` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === t.key
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <>
          <p className="text-xs text-slate-500 font-medium">
            Scores reflect health & longevity — not calorie targets.
          </p>

          {groupedFoods.length > 0 && (
            <div className="space-y-3">
              {groupedFoods.map((group) => (
                <div key={group.meal}>
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 mb-1.5">
                    {MEAL_LABELS[group.meal]}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map((f) => (
                      <li
                        key={f.id}
                        className="bg-primary-50/50 dark:bg-white/5 border border-primary-100/60 dark:border-white/10 rounded-2xl px-3 py-2.5"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg shrink-0">🍽️</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {f.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {getFoodDisplay(f).servingLabel}
                              {macroStr(f) ? ` · ${macroStr(f)}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFood(f.id)}
                            className="text-slate-400 hover:text-red-400 text-sm font-bold px-1 shrink-0"
                          >×</button>
                        </div>

                        <div className="flex items-center gap-2 mt-2 ml-7 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Qty</span>
                          <button
                            type="button"
                            onClick={() => updateQty(f.id, (f.qty ?? 1) - 0.5)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors"
                          >−</button>
                          <span className="text-sm font-extrabold text-primary tabular-nums w-8 text-center">
                            {f.qty ?? 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(f.id, (f.qty ?? 1) + 0.5)}
                            className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors"
                          >+</button>
                          <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                            {f.unit || 'serving'}
                          </span>
                          <select
                            value={f.meal || 'other'}
                            onChange={(e) => setMeal(f.id, e.target.value)}
                            className="ml-auto text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1"
                          >
                            {MEAL_ORDER.map((m) => (
                              <option key={m} value={m}>{MEAL_LABELS[m]}</option>
                            ))}
                          </select>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {foods.length >= 2 && !savingMeal && (
            <button
              type="button"
              onClick={() => setSavingMeal(true)}
              className="text-xs font-bold text-primary underline"
            >
              + Save as meal
            </button>
          )}
          {savingMeal && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newMealName}
                onChange={(e) => setNewMealName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveMeal())}
                placeholder="e.g. Morning bowl…"
                className="input-field text-sm flex-1"
                autoFocus
              />
              <button type="button" onClick={handleSaveMeal}
                className="btn-primary !py-2 !px-3 text-xs shrink-0">Save</button>
              <button type="button" onClick={() => setSavingMeal(false)}
                className="btn-secondary !py-2 !px-3 text-xs shrink-0">✕</button>
            </div>
          )}

          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. chicken breast, kale, oats…"
              className="input-field text-sm pr-10"
              autoComplete="off"
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            )}
          </div>

          {searchError && <p className="text-xs text-coral font-medium">{searchError}</p>}

          {results.length > 0 && (
            <ul className="max-h-52 overflow-y-auto rounded-2xl border border-surface-border bg-white dark:bg-slate-900 shadow-card divide-y divide-slate-100 dark:divide-white/10">
              {results.map((p) => (
                <li key={p.offCode}>
                  <button
                    type="button"
                    onClick={() => addFood(foodToLogItem(p))}
                    className="w-full text-left px-3 py-2.5 hover:bg-primary-50/40 dark:hover:bg-white/5 transition-colors"
                  >
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {p.unit}
                      {p.calories != null ? ` · ${p.calories} kcal` : ''}
                      {p.protein  != null ? ` · P ${p.protein}g`    : ''}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
              placeholder="Or type a meal manually…"
              className="input-field text-sm flex-1"
            />
            <button type="button" onClick={addCustom}
              className="btn-secondary !py-2.5 !px-4 text-sm shrink-0">Add</button>
          </div>

          {analysis && (
            <div className="mt-1 p-3 rounded-2xl bg-primary-50/60 dark:bg-white/5 border border-primary-100/60 dark:border-white/10 space-y-2">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                Food analysis
              </p>
              <div className="grid grid-cols-2 gap-2">
                {analysis.fq != null && (
                  <div className="bg-white/70 dark:bg-white/5 rounded-xl px-3 py-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Food Quality</p>
                    <p className="text-xl font-extrabold text-primary tabular-nums">{analysis.fq}</p>
                    <p className={`text-[10px] font-medium ${qualityLabel(analysis.fq).color}`}>
                      {qualityLabel(analysis.fq).text}
                    </p>
                  </div>
                )}
                {analysis.fl != null && (
                  <div className="bg-white/70 dark:bg-white/5 rounded-xl px-3 py-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Longevity</p>
                    <p className="text-xl font-extrabold text-teal tabular-nums">{analysis.fl}</p>
                    <p className={`text-[10px] font-medium ${longevityLabel(analysis.fl).color}`}>
                      {longevityLabel(analysis.fl).text}
                    </p>
                  </div>
                )}
              </div>
              {analysis.fm && (
                <div className="grid grid-cols-4 gap-1 text-center">
                  {[
                    { label: 'kcal',    value: analysis.fm.calories },
                    { label: 'protein', value: `${analysis.fm.protein}g` },
                    { label: 'carbs',   value: `${analysis.fm.carbs}g`   },
                    { label: 'fat',     value: `${analysis.fm.fat}g`     },
                  ].map((m) => (
                    <div key={m.label} className="bg-white/70 dark:bg-white/5 rounded-xl py-1.5">
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">{m.value}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{m.label}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-400 font-medium">
                Meal totals · affects nutrition & longevity scores
              </p>
            </div>
          )}
        </>
      )}

      {tab === 'saved' && (
        <div className="space-y-2">
          {!savedMeals?.length ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🍱</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No saved meals yet</p>
              <p className="text-xs text-slate-400 mt-1">Add 2+ foods then tap "Save as meal"</p>
            </div>
          ) : (
            savedMeals.map((meal) => {
              const totalCal = (meal.foods || []).reduce((s, f) => {
                const factor = ((f.servingG ?? 150) / 100) * (f.qty ?? 1)
                return s + Math.round((f.calories ?? 0) * factor)
              }, 0)
              return (
                <div
                  key={meal.id}
                  className={`glass-card p-3 transition-opacity ${meal._saving ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{meal.name}</p>
                        {meal._saving && <span className="text-[10px] text-slate-400">Saving…</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {(meal.foods || []).length} items · ~{totalCal} kcal
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {(meal.foods || []).map((f) => f.name).join(', ')}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => loadMeal(meal)}
                        disabled={meal._saving}
                        className="btn-primary !py-1.5 !px-3 text-xs"
                      >Add</button>
                      <button
                        type="button"
                        onClick={() => deleteSavedMeal(meal.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-400 text-xs font-bold flex items-center justify-center hover:bg-red-100"
                      >×</button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}