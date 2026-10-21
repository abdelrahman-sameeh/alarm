import { Music2, Pause, Play, Upload } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { ALARM_SOUNDS } from '../data/sounds'
import type { AlarmSoundId } from '../domain/alarm'
import { playCustomPreview, playPreview, stopPreview } from '../services/audioPreview'
import { formatArabicNumber, toArabicDigits } from '../utils/numbers'

export function SoundsPage() {
  const [playing, setPlaying] = useState<AlarmSoundId | null>(null)
  const [custom, setCustom] = useState<{ name: string; dataUrl: string } | null>(null)
  useEffect(() => () => stopPreview(), [])

  const toggleSound = async (soundId: AlarmSoundId) => {
    if (playing === soundId) { stopPreview(); setPlaying(null); return }
    const sound = ALARM_SOUNDS.find((item) => item.id === soundId)
    if (!sound) return
    await playPreview(sound)
    setPlaying(soundId)
  }

  const importSound = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setCustom({ name: file.name, dataUrl })
      void playCustomPreview(dataUrl)
      setPlaying('custom')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="page sounds-page">
      <header className="top-bar"><div><p className="eyebrow">اسمع قبل ما تختار</p><h1>الأصوات</h1></div><span className="header-icon"><Music2 size={24} /></span></header>
      <p className="page-intro">اختار صوت، شغّله أو وقفه من نفس الزر. تقدر كمان تضيف ملف صوت من جهازك.</p>
      <section className="sound-library">
        {ALARM_SOUNDS.map((sound, index) => (
          <article key={sound.id} className="sound-card">
            <span className="sound-number">{formatArabicNumber(index + 1, 2)}</span>
            <div className="sound-info"><strong>{sound.name}</strong><span>{sound.description}</span></div>
            <button type="button" className={`large-preview ${playing === sound.id ? 'playing' : ''}`} style={{ '--sound-color': sound.accent } as CSSProperties} onClick={() => void toggleSound(sound.id)}>
              {playing === sound.id ? <Pause size={20} /> : <Play size={20} />}<span>{playing === sound.id ? 'إيقاف' : 'تشغيل'}</span>
            </button>
          </article>
        ))}
        {custom && (
          <article className="sound-card custom-card">
            <span className="sound-number"><Music2 size={19} /></span>
            <div className="sound-info"><strong>{toArabicDigits(custom.name)}</strong><span>صوت من جهازك</span></div>
            <button type="button" className={`large-preview ${playing === 'custom' ? 'playing' : ''}`} onClick={() => {
              if (playing === 'custom') { stopPreview(); setPlaying(null) }
              else { void playCustomPreview(custom.dataUrl); setPlaying('custom') }
            }}>
              {playing === 'custom' ? <Pause size={20} /> : <Play size={20} />}<span>{playing === 'custom' ? 'إيقاف' : 'تشغيل'}</span>
            </button>
          </article>
        )}
      </section>
      <label className="upload-card"><span><Upload size={23} /></span><div><strong>ضيف صوت من جهازك</strong><small>MP٣ أو WAV</small></div><input type="file" accept="audio/*" onChange={(event) => importSound(event.target.files?.[0])} /></label>
    </div>
  )
}
