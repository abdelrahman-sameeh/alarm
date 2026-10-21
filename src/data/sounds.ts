import type { AlarmSoundId } from '../domain/alarm'

export interface AlarmSound {
  id: AlarmSoundId
  name: string
  description: string
  file: string
  accent: string
}

export const ALARM_SOUNDS: AlarmSound[] = [
  { id: 'adhan', name: 'الأذان', description: 'تنبيه هادي مستوحى من مقام الأذان', file: '/adhan.wav', accent: '#d4ff6a' },
  { id: 'dawn', name: 'نسمة الفجر', description: 'بداية هادية بتعلى تدريجي', file: '/dawn.wav', accent: '#8ee3ff' },
  { id: 'classic', name: 'الجرس الكلاسيك', description: 'جرس واضح للصحيان التقيل', file: '/classic.wav', accent: '#ffcb66' },
  { id: 'digital', name: 'ديجيتال', description: 'نبض سريع ومباشر', file: '/digital.wav', accent: '#bf9bff' },
  { id: 'gentle', name: 'صحيان براحة', description: 'نغمة ناعمة للصحيان الهادي', file: '/gentle.wav', accent: '#8ff0c6' },
  { id: 'pulse', name: 'نبض قوي', description: 'تنبيه قوي ومتكرر', file: '/pulse.wav', accent: '#ff7b88' },
]

export function getSound(soundId: AlarmSoundId) {
  return ALARM_SOUNDS.find((sound) => sound.id === soundId) ?? ALARM_SOUNDS[0]
}
