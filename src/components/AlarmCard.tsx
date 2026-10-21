import { Check, ChevronLeft, RotateCcw } from 'lucide-react'
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
  onToggle: () => void
}

export function AlarmCard({ alarm, selecting, selected, onSelect, onToggle }: AlarmCardProps) {
  const navigate = useNavigate()
  const formatted = formatTime(alarm.hour, alarm.minute)
  const skipped = alarm.skippedDate === todayKey()
  const sound = getSound(alarm.soundId)
  return (
    <article
      className={`alarm-card ${alarm.enabled ? '' : 'is-off'} ${selected ? 'is-selected' : ''}`}
      onClick={() => selecting ? onSelect() : navigate(`/alarm/${alarm.id}`)}
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
