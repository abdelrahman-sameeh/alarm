import { formatArabicNumber } from '../utils/numbers'

export type AlarmSoundId =
  | 'adhan'
  | 'dawn'
  | 'classic'
  | 'digital'
  | 'gentle'
  | 'pulse'
  | 'custom'

export interface Alarm {
  id: number
  label: string
  hour: number
  minute: number
  enabled: boolean
  repeats: boolean
  days: number[]
  soundId: AlarmSoundId
  ringCount?: number
  oneTimeAt?: number
  customSoundName?: string
  customSoundDataUrl?: string
  skippedDate?: string
}

export interface AlarmDraft {
  label: string
  hour: number
  minute: number
  repeats: boolean
  days: number[]
  soundId: AlarmSoundId
  ringCount?: number
  customSoundName?: string
  customSoundDataUrl?: string
}

export const WEEK_DAYS = [
  { value: 6, short: 'س', label: 'السبت' },
  { value: 0, short: 'ح', label: 'الأحد' },
  { value: 1, short: 'ن', label: 'الاثنين' },
  { value: 2, short: 'ث', label: 'الثلاثاء' },
  { value: 3, short: 'ر', label: 'الأربعاء' },
  { value: 4, short: 'خ', label: 'الخميس' },
  { value: 5, short: 'ج', label: 'الجمعة' },
] as const

export const DEFAULT_DAYS = WEEK_DAYS.map((day) => day.value)

export function todayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatTime(hour: number, minute: number) {
  const normalizedHour = hour % 12 || 12
  return {
    time: `${formatArabicNumber(normalizedHour, 2)}:${formatArabicNumber(minute, 2)}`,
    period: hour < 12 ? 'ص' : 'م',
  }
}

export function formatRepeat(alarm: Alarm) {
  if (!alarm.repeats) return 'مرة واحدة'
  if (alarm.days.length === 7) return 'كل يوم'
  if (alarm.days.length === 0) return 'بدون أيام'
  return WEEK_DAYS.filter((day) => alarm.days.includes(day.value))
    .map((day) => day.label)
    .join('، ')
}

export function nextAlarmDate(alarm: Pick<Alarm, 'hour' | 'minute' | 'repeats' | 'days' | 'oneTimeAt'>) {
  const now = new Date()
  if (!alarm.repeats && typeof alarm.oneTimeAt === 'number') {
    return new Date(alarm.oneTimeAt)
  }
  const candidate = new Date(now)
  candidate.setHours(alarm.hour, alarm.minute, 0, 0)
  if (!alarm.repeats) {
    if (candidate <= now) candidate.setDate(candidate.getDate() + 1)
    return candidate
  }
  const days = alarm.days.length ? alarm.days : DEFAULT_DAYS
  for (let offset = 0; offset <= 7; offset += 1) {
    const next = new Date(candidate)
    next.setDate(candidate.getDate() + offset)
    if (days.includes(next.getDay()) && next > now) return next
  }
  return candidate
}

export function nextOneTimeTimestamp(hour: number, minute: number, now = new Date()) {
  const next = new Date(now)
  next.setHours(hour, minute, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next.getTime()
}

export function nextAlarmText(alarms: Alarm[]) {
  const active = alarms
    .filter((alarm) => alarm.enabled && alarm.skippedDate !== todayKey())
    .map((alarm) => ({ date: nextAlarmDate(alarm) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0]
  if (!active) return 'مفيش منبهات شغالة'
  const diffMinutes = Math.max(1, Math.round((active.date.getTime() - Date.now()) / 60000))
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  if (!hours) return `المنبه الجاي بعد ${formatArabicNumber(minutes)} دقيقة`
  if (!minutes) return `المنبه الجاي بعد ${formatArabicNumber(hours)} ساعة`
  return `المنبه الجاي بعد ${formatArabicNumber(hours)} ساعة و${formatArabicNumber(minutes)} دقيقة`
}
