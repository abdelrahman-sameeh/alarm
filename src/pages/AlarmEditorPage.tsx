import { ArrowRight, BellRing, Check, Pause, Play, Trash2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TimeStepper } from '../components/TimeStepper'
import { Toggle } from '../components/Toggle'
import { ALARM_SOUNDS } from '../data/sounds'
import type { AlarmDraft, AlarmSoundId } from '../domain/alarm'
import { DEFAULT_DAYS, WEEK_DAYS } from '../domain/alarm'
import { playCustomPreview, playPreview, stopPreview } from '../services/audioPreview'
import { useAlarms } from '../store/useAlarms'
import { formatArabicNumber, fromArabicDigits, toArabicDigits } from '../utils/numbers'

export function AlarmEditorPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getAlarm, addAlarm, updateAlarm, deleteAlarms, settings } = useAlarms()
  const alarm = id && id !== 'new' ? getAlarm(Number(id)) : undefined
  const [playing, setPlaying] = useState<AlarmSoundId | null>(null)
  const [draft, setDraft] = useState<AlarmDraft>(() => {
    const now = new Date()
    return {
      label: alarm?.label ?? 'منبه جديد',
      hour: alarm?.hour ?? now.getHours(),
      minute: alarm?.minute ?? now.getMinutes(),
      repeats: alarm?.repeats ?? false,
      days: alarm?.days ?? [...DEFAULT_DAYS],
      soundId: alarm?.soundId ?? 'dawn',
      ringCount: alarm?.ringCount,
      customSoundName: alarm?.customSoundName,
      customSoundDataUrl: alarm?.customSoundDataUrl,
    }
  })

  useEffect(() => () => stopPreview(), [])

  const setField = <K extends keyof AlarmDraft>(key: K, value: AlarmDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const toggleDay = (day: number) => {
    setField('days', draft.days.includes(day)
      ? draft.days.filter((value) => value !== day)
      : [...draft.days, day])
  }

  const previewSound = async (soundId: AlarmSoundId) => {
    if (playing === soundId) {
      stopPreview()
      setPlaying(null)
      return
    }
    const sound = ALARM_SOUNDS.find((item) => item.id === soundId)
    if (!sound) return
    await playPreview(sound)
    setPlaying(soundId)
  }

  const toggleCustomPreview = () => {
    if (playing === 'custom') {
      stopPreview()
      setPlaying(null)
    } else if (draft.customSoundDataUrl) {
      void playCustomPreview(draft.customSoundDataUrl)
      setPlaying('custom')
    }
  }

  const importSound = (file?: File) => {
    if (!file) return
    if (file.size > 2_000_000) {
      window.alert('اختار ملف أقل من ٢ ميجا عشان يفضل محفوظ جوه التطبيق.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setDraft((current) => ({ ...current, soundId: 'custom', customSoundName: file.name, customSoundDataUrl: dataUrl }))
      void playCustomPreview(dataUrl)
      setPlaying('custom')
    }
    reader.readAsDataURL(file)
  }

  const save = () => {
    if (draft.repeats && draft.days.length === 0) {
      window.alert('اختار يوم واحد على الأقل أو اقفل التكرار.')
      return
    }
    stopPreview()
    if (alarm) updateAlarm(alarm.id, draft)
    else addAlarm(draft)
    navigate('/', { replace: true })
  }

  return (
    <div className="page editor-page">
      <header className="editor-header">
        <button type="button" className="icon-button" onClick={() => navigate(-1)} aria-label="رجوع"><ArrowRight size={22} /></button>
        <h1>{alarm ? 'تعديل المنبه' : 'منبه جديد'}</h1>
        <button type="button" className="save-button" onClick={save}><Check size={19} /> حفظ</button>
      </header>

      <section className="time-editor-card">
        <TimeStepper label="الساعة" value={draft.hour} min={0} max={23} onChange={(value) => setField('hour', value)} />
        <span className="time-divider">:</span>
        <TimeStepper label="الدقيقة" value={draft.minute} min={0} max={59} onChange={(value) => setField('minute', value)} />
      </section>

      <section className="form-card">
        <label className="field-label" htmlFor="alarm-label">اسم المنبه</label>
        <input id="alarm-label" className="text-field" value={toArabicDigits(draft.label)} onChange={(event) => setField('label', toArabicDigits(event.target.value))} placeholder="مثلاً: صلاة الفجر" />
      </section>

      <section className="form-card repeat-card">
        <div className="setting-row">
          <div><strong>تكرار المنبه</strong><span>{draft.repeats ? 'هيتكرر في الأيام اللي تختارها' : 'هيرن مرة واحدة بس'}</span></div>
          <Toggle checked={draft.repeats} onChange={(value) => setField('repeats', value)} label="تكرار المنبه" />
        </div>
        {draft.repeats && (
          <div className="days-grid">
            {WEEK_DAYS.map((day) => (
              <button type="button" key={day.value} className={draft.days.includes(day.value) ? 'selected' : ''} onClick={() => toggleDay(day.value)} aria-label={day.label}>{day.short}</button>
            ))}
          </div>
        )}
      </section>

      <section className="form-card ring-count-card">
        <div className="setting-row">
          <div>
            <strong><BellRing size={17} /> عدد خاص للمنبه</strong>
            <span>{draft.ringCount === undefined
              ? `هيستخدم الافتراضي: ${formatArabicNumber(settings.defaultRingCount)} مرات`
              : 'اختار المنبه ده يرن كام مرة'}</span>
          </div>
          <Toggle
            checked={draft.ringCount !== undefined}
            onChange={(enabled) => setField('ringCount', enabled ? settings.defaultRingCount : undefined)}
            label="عدد رنات خاص"
          />
        </div>
        {draft.ringCount !== undefined && (
          <div className="count-options">
            <label htmlFor="alarm-ring-count">عدد مرات الرن</label>
            <div className="count-input-row">
              <input
                id="alarm-ring-count"
                type="text"
                inputMode="numeric"
                value={formatArabicNumber(draft.ringCount)}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => setField('ringCount', Math.min(10, Math.max(1, Number(fromArabicDigits(event.target.value)) || 1)))}
              />
              <span>مرة، والفاصل حسب مدة الصوت</span>
            </div>
            <div className="count-presets">
              {[1, 2, 3, 5, 10].map((count) => (
                <button type="button" className={draft.ringCount === count ? 'selected' : ''} key={count} onClick={() => setField('ringCount', count)}>
                  {formatArabicNumber(count)}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="form-card">
        <div className="form-title"><div><strong>صوت المنبه</strong><span>دوس تشغيل عشان تسمع الصوت</span></div></div>
        <div className="compact-sounds">
          {ALARM_SOUNDS.map((sound) => (
            <div key={sound.id} className={`sound-choice ${draft.soundId === sound.id ? 'selected' : ''}`}>
              <button type="button" className="sound-main" onClick={() => setField('soundId', sound.id)}>
                <span className="sound-color" style={{ background: sound.accent }} />
                <span><strong>{sound.name}</strong><small>{sound.description}</small></span>
              </button>
              <button type="button" className={`preview-button ${playing === sound.id ? 'playing' : ''}`} onClick={() => void previewSound(sound.id)} aria-label={playing === sound.id ? 'إيقاف الرنة' : 'تشغيل الرنة'}>
                {playing === sound.id ? <Pause size={18} /> : <Play size={18} />}
              </button>
            </div>
          ))}
          {draft.customSoundName && (
            <div className={`sound-choice ${draft.soundId === 'custom' ? 'selected' : ''}`}>
              <button type="button" className="sound-main" onClick={() => setField('soundId', 'custom')}>
                <span className="sound-color custom" /><span><strong>{toArabicDigits(draft.customSoundName)}</strong><small>من جهازك</small></span>
              </button>
              <button type="button" className={`preview-button ${playing === 'custom' ? 'playing' : ''}`} onClick={toggleCustomPreview}>
                {playing === 'custom' ? <Pause size={18} /> : <Play size={18} />}
              </button>
            </div>
          )}
        </div>
        <label className="upload-sound"><Upload size={18} /> إضافة صوت من الجهاز<input type="file" accept="audio/*" onChange={(event) => importSound(event.target.files?.[0])} /></label>
      </section>

      {alarm && (
        <button type="button" className="delete-alarm-button" onClick={() => { deleteAlarms([alarm.id]); navigate('/', { replace: true }) }}>
          <Trash2 size={19} /> حذف المنبه
        </button>
      )}
    </div>
  )
}
