import { AlarmClock, Ban, CalendarOff, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlarmCard } from '../components/AlarmCard'
import { nextAlarmText } from '../domain/alarm'
import { useAlarms } from '../store/useAlarms'
import { formatArabicNumber } from '../utils/numbers'

export function HomePage() {
  const navigate = useNavigate()
  const { alarms, settings, toggleAlarm, skipToday, pauseAlarms, deleteAlarms } = useAlarms()
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const summary = useMemo(() => nextAlarmText(alarms), [alarms])

  const closeSelection = () => { setSelecting(false); setSelected([]) }
  const runAction = (action: (ids: number[]) => void) => { action(selected); closeSelection() }

  return (
    <div className="page home-page">
      <header className="top-bar">
        <div><p className="eyebrow">صباح الفل</p><h1>منبهاتك</h1></div>
        <button type="button" className="text-button" onClick={() => selecting ? closeSelection() : setSelecting(true)}>
          {selecting ? <><X size={18} /> إلغاء</> : 'تحديد'}
        </button>
      </header>
      <section className="next-alarm-card">
        <span className="next-icon"><AlarmClock size={24} /></span>
        <div><small>جاهزين للصحيان</small><strong>{summary}</strong></div><span className="status-pulse" />
      </section>
      <div className="section-heading"><span>{formatArabicNumber(alarms.length)} منبهات</span>{selecting && <strong>{formatArabicNumber(selected.length)} متحدد</strong>}</div>
      <section className="alarm-list">
        {alarms.map((alarm) => (
          <AlarmCard
            key={alarm.id}
            alarm={alarm}
            ringCount={alarm.ringCount ?? settings.defaultRingCount}
            selecting={selecting}
            selected={selected.includes(alarm.id)}
            onSelect={() => setSelected((current) => current.includes(alarm.id)
              ? current.filter((selectedId) => selectedId !== alarm.id)
              : [...current, alarm.id])}
            onStartSelection={() => { setSelecting(true); setSelected([alarm.id]) }}
            onToggle={() => toggleAlarm(alarm.id)}
          />
        ))}
        {!alarms.length && <div className="empty-state"><AlarmClock size={42} /><h2>لسه مفيش منبهات</h2><p>ضيف أول منبه وخلي بكرة أهدى.</p></div>}
      </section>
      {!selecting && <button type="button" className="fab" onClick={() => navigate('/alarm/new')}><Plus size={26} /><span>منبه جديد</span></button>}
      {selecting && (
        <div className="selection-actions">
          <button type="button" disabled={!selected.length} onClick={() => runAction(skipToday)}><CalendarOff size={20} /><span>النهارده بس</span></button>
          <button type="button" disabled={!selected.length} onClick={() => runAction(pauseAlarms)}><Ban size={20} /><span>إيقاف دائم</span></button>
          <button className="danger" type="button" disabled={!selected.length} onClick={() => runAction(deleteAlarms)}><Trash2 size={20} /><span>حذف</span></button>
        </div>
      )}
    </div>
  )
}
