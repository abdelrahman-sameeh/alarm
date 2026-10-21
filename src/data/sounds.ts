import type { AlarmSoundId } from '../domain/alarm'

export interface AlarmSound {
  id: AlarmSoundId
  name: string
  description: string
  file: string
  accent: string
  repeatIntervalMinutes: number
}

export const ALARM_SOUNDS: AlarmSound[] = [
  { id: 'adhan', name: 'النداء الأخير', description: 'أذان محمد جازي عبدالله كامل', file: '/alarm_adhan_jazi_v3.mp3', accent: '#ededed', repeatIntervalMinutes: 5 },
  { id: 'dawn', name: 'نسمة الفجر', description: 'لحن هادي بيصحّيك تدريجي', file: '/alarm_dawn_v3.mp3', accent: '#d8d8d8', repeatIntervalMinutes: 1 },
  { id: 'classic', name: 'جرس كلاسيك', description: 'جرس واضح للصحيان التقيل', file: '/alarm_classic_v3.mp3', accent: '#c6c6c6', repeatIntervalMinutes: 1 },
  { id: 'digital', name: 'ديجيتال', description: 'تنبيه إلكتروني واضح', file: '/alarm_digital_v3.mp3', accent: '#b5b5b5', repeatIntervalMinutes: 1 },
  { id: 'gentle', name: 'صحيان براحة', description: 'لحن ناعم للصحيان الهادي', file: '/alarm_gentle_v3.mp3', accent: '#a4a4a4', repeatIntervalMinutes: 1 },
  { id: 'pulse', name: 'نبض قوي', description: 'تنبيه قوي للصحيان التقيل', file: '/alarm_pulse_v3.mp3', accent: '#939393', repeatIntervalMinutes: 1 },
]

export function getSound(soundId: AlarmSoundId) {
  return ALARM_SOUNDS.find((sound) => sound.id === soundId) ?? ALARM_SOUNDS[0]
}
