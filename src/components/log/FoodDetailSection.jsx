import { useEffect, useState } from 'react'
import { searchFoods, foodToLogItem } from '../../services/openFoodFacts'

export default function FoodDetailSection({ foods, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [customName, setCustomName] = useState('')

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setSearchError('')
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setSearching(true)
      setSearchError('')
      try {
        const items = await searchFoods(query, controller.signal)
        setResults(items)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setSearchError('Search failed — try again or add manually')
          setResults([])
        }
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  function addFood(item) {
    onChange([...foods, item])
    setQuery('')
    setResults([])
  }

  function addCustom() {
    const name = customName.trim()
    if (!name) return
    addFood({
      id: crypto.randomUUID(),
      name,
      brand: '',
      calories: null,
      serving: '1 serving',
    })
    setCustomName('')
  }

  function removeFood(id) {
    onChange(foods.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 font-medium leading-relaxed">
        Powered by Open Food Facts — search packaged foods or add your own.
      </p>

      {foods.length > 0 && (
        <ul className="space-y-2">
          {foods.map((f) => (
            <li
              key={f.id}
              className="flex items-start gap-2 bg-primary-50/50 border border-primary-100/60 rounded-2xl px-3 py-2.5"
            >
              <span className="text-lg shrink-0">🍽️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{f.name}</p>
                <p className="text-xs text-slate-500">
                  {[f.brand, f.serving, f.calories != null ? `~${f.calories} kcal/100g` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFood(f.id)}
                className="text-slate-400 hover:text-coral text-sm font-bold px-1"
                aria-label="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods…"
          className="input-field text-sm pr-10"
          autoComplete="off"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        )}
      </div>

      {searchError && <p className="text-xs text-coral font-medium">{searchError}</p>}

      {results.length > 0 && (
        <ul className="max-h-48 overflow-y-auto rounded-2xl border border-surface-border bg-white shadow-card divide-y divide-slate-100">
          {results.map((p) => (
            <li key={p.offCode}>
              <button
                type="button"
                onClick={() => addFood(foodToLogItem(p))}
                className="w-full text-left px-3 py-2.5 hover:bg-primary-50/40 transition-colors"
              >
                <p className="text-sm font-semibold text-slate-800 line-clamp-1">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.brand}
                  {p.calories != null ? ` · ~${p.calories} kcal/100g` : ''}
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
          placeholder="Or type a meal…"
          className="input-field text-sm flex-1"
        />
        <button type="button" onClick={addCustom} className="btn-secondary !py-2.5 !px-4 text-sm shrink-0">
          Add
        </button>
      </div>
    </div>
  )
}
