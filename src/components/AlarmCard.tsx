import { Check, ChevronLeft, RotateCcw } from 'lucide-react'
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSound } from '../data/sounds'
import type { Alarm } from '../domain/alarm'
import { formatRepeat, formatTime, todayKey } from '../domain/alarm'
import { Toggle } from './Toggle'

interface AlarmCardProps {
  alarm: Alarm
  selecting: boolean
  selected: boolean
  onSelect: () => void
  onStartSelection: () => void
  onToggle: () => void
}

export function AlarmCard({ alarm, selecting, selected, onSelect, onStartSelection, onToggle }: AlarmCardProps) {
  const navigate = useNavigate()
  const holdTimer = useRef<number | null>(null)
  const didLongPress = useRef(false)
  const formatted = formatTime(alarm.hour, alarm.minute)
  const skipped = alarm.skippedDate === todayKey()
  const sound = getSound(alarm.soundId)

  const cancelHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    holdTimer.current = null
  }

  const beginHold = (event: ReactPointerEvent<HTMLElement>) => {
    if (selecting || (event.target as HTMLElement).closest('button')) return
    didLongPress.current = false
    cancelHold()
    holdTimer.current = window.setTimeout(() => {
      didLongPress.current = true
      navigator.vibrate?.(35)
      onStartSelection()
    }, 480)
  }

  useEffect(() => cancelHold, [])

  return (
    <article
      className={`alarm-card ${alarm.enabled ? '' : 'is-off'} ${selected ? 'is-selected' : ''}`}
      onPointerDown={beginHold}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      onContextMenu={(event) => event.preventDefault()}
      onClick={() => {
        if (didLongPress.current) {
          didLongPress.current = false
          return
        }
        if (selecting) onSelect()
        else navigate(`/alarm/${alarm.id}`)
      }}
    >
      <div className="alarm-card-top">
        {selecting ? (
          <span className={`selection-box ${selected ? 'checked' : ''}`}>
            {selected && <Check size={16} strokeWidth={3} />}
          </span>
        ) : (
          <Toggle checked={alarm.enabled} onChange={onToggle} label={`تشغيل ${alarm.label}`} />
        )}
        <div className="alarm-time" dir="ltr"><span>{formatted.time}</span><small>{formatted.period}</small></div>
        {!selecting && <ChevronLeft className="card-chevron" size={20} />}
      </div>
      <div className="alarm-card-meta">
        <strong>{alarm.label}</strong><span>{formatRepeat(alarm)}</span>
        <span className="sound-dot" style={{ background: sound.accent }} /><span>{sound.name}</span>
      </div>
      {skipped && <div className="skip-badge"><RotateCcw size={14} /> متخطي النهارده بس</div>}
    </article>
  )
}
