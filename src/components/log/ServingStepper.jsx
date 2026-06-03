export default function ServingStepper({ label, emoji, value, onChange, max = 10 }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xl">{emoji}</span>
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
        >
          −
        </button>
        <span className="w-8 text-center font-bold text-primary tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20"
        >
          +
        </button>
      </div>
    </div>
  )
}
