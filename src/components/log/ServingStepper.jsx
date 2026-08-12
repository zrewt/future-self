import React from 'react'

const SERVING_OPTIONS = [0, 1, 2, 3, 4]

export default function ServingStepper({
  label,
  emoji,
  value = 0,
  onChange,
}) {
  const currentValue = Number(value) || 0

  const isProcessed = label.toLowerCase().includes('processed')

  const options = isProcessed
    ? [
        { value: 0, label: 'None' },
        { value: 1, label: 'A little' },
        { value: 2, label: 'Some' },
        { value: 3, label: 'A lot' },
        { value: 4, label: 'A ton' },
      ]
    : [
        { value: 0, label: 'None' },
        { value: 1, label: '1 serving' },
        { value: 2, label: '2 servings' },
        { value: 3, label: '3 servings' },
        { value: 4, label: '4+' },
      ]

  function handleSelect(option) {
    onChange(option)
  }

  return (
    <div className="py-3 border-b border-slate-100 last:border-b-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>

          <div>
            <p className="text-sm font-bold text-slate-800">
              {label}
            </p>

            <p className="text-[10px] text-slate-400 font-medium">
              {isProcessed
                ? 'How much did you have?'
                : 'How many servings?'}
            </p>
          </div>
        </div>

        {/* Current selection */}
        <span className="text-xs font-extrabold text-primary">
          {isProcessed
            ? options[currentValue]?.label || 'A lot'
            : currentValue === 0
              ? 'None'
              : currentValue >= 4
                ? '4+ servings'
                : `${currentValue} ${currentValue === 1 ? 'serving' : 'servings'}`}
        </span>
      </div>

      {/* Serving choices */}
      <div className="grid grid-cols-5 gap-1.5">
        {options.map((option) => {
          const active =
            option.value === currentValue ||
            (option.value === 4 && currentValue >= 4)

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`
                min-h-[42px]
                rounded-xl
                px-1
                text-[10px]
                font-bold
                leading-tight
                transition-all
                duration-150
                border
                ${
                  active
                    ? 'bg-primary text-white border-primary shadow-sm scale-[0.98]'
                    : 'bg-slate-50 text-slate-500 border-surface-border hover:bg-primary/5 hover:border-primary/30'
                }
              `}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}