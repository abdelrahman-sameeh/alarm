import type { AlarmSoundId } from '../domain/alarm'

export interface AlarmSound {
  id: AlarmSoundId
  name: string
  description: string
  file: string
  accent: string
}

export const ALARM_SOUNDS: AlarmSound[] = [
  { id: 'adhan', name: 'الأذان الأخير', description: 'رنة الأذان', file: '/alarm_adhan_v2.wav', accent: '#ededed' },
  { id: 'dawn', name: 'نسمة الفجر', description: 'بداية هادية بتعلى تدريجي', file: '/alarm_dawn_v2.wav', accent: '#d8d8d8' },
  { id: 'classic', name: 'الجرس الكلاسيك', description: 'جرس واضح للصحيان التقيل', file: '/alarm_classic_v2.wav', accent: '#c6c6c6' },
  { id: 'digital', name: 'ديجيتال', description: 'نبض سريع ومباشر', file: '/alarm_digital_v2.wav', accent: '#b5b5b5' },
  { id: 'gentle', name: 'صحيان براحة', description: 'نغمة ناعمة للصحيان الهادي', file: '/alarm_gentle_v2.wav', accent: '#a4a4a4' },
  { id: 'pulse', name: 'نبض قوي', description: 'تنبيه قوي ومتكرر', file: '/alarm_pulse_v2.wav', accent: '#939393' },
]

export function getSound(soundId: AlarmSoundId) {
  return ALARM_SOUNDS.find((sound) => sound.id === soundId) ?? ALARM_SOUNDS[0]
}
