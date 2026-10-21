import type { AlarmSound } from '../data/sounds'

let customAudio: HTMLAudioElement | null = null

export function stopPreview() {
  customAudio?.pause()
  if (customAudio) customAudio.currentTime = 0
  customAudio = null
}

export async function playPreview(sound: AlarmSound) {
  stopPreview()
  customAudio = new Audio(sound.file)
  customAudio.loop = true
  await customAudio.play()
}

export async function playCustomPreview(dataUrl: string) {
  stopPreview()
  customAudio = new Audio(dataUrl)
  customAudio.loop = true
  await customAudio.play()
}
