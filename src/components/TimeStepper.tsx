import { Minus, Plus } from 'lucide-react'

interface TimeStepperProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

export function TimeStepper({ label, value, min, max, onChange }: TimeStepperProps) {
  const wrap = (next: number) => next > max ? min : next < min ? max : next
  return (
    <div className="time-stepper">
      <span>{label}</span>
      <button type="button" onClick={() => onChange(wrap(value + 1))} aria-label={`زود ${label}`}><Plus size={20} /></button>
      <input
        inputMode="numeric"
        type="number"
        min={min}
        max={max}
        step={1}
        value={String(value).padStart(2, '0')}
        onChange={(event) => onChange(wrap(Number(event.target.value) || 0))}
        aria-label={label}
      />
      <button type="button" onClick={() => onChange(wrap(value - 1))} aria-label={`قلل ${label}`}><Minus size={20} /></button>
    </div>
  )
}
