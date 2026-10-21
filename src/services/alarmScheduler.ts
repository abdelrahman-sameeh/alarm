import { Capacitor, registerPlugin } from '@capacitor/core'
import {
  LocalNotifications,
  Weekday,
  type LocalNotificationSchema,
} from '@capacitor/local-notifications'
import type { Alarm } from '../domain/alarm'
import { nextAlarmDate, todayKey } from '../domain/alarm'

const IDS_KEY = 'alarm-masry:notification-ids'

interface AlarmSoundsPlugin {
  ensureCustomChannel(options: { dataUrl: string }): Promise<{ channelId?: string }>
}

const AlarmSounds = registerPlugin<AlarmSoundsPlugin>('AlarmSounds')

function isNative() {
  return Capacitor.isNativePlatform()
}

function notificationId(alarmId: number, dayOffset = 0) {
  return alarmId * 10 + dayOffset + 1
}

function nextWeekOccurrence(hour: number, minute: number) {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  date.setHours(hour, minute, 0, 0)
  return date
}

async function clearPreviousNotifications() {
  const ids = JSON.parse(localStorage.getItem(IDS_KEY) ?? '[]') as number[]
  if (ids.length) {
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
  }
  localStorage.setItem(IDS_KEY, '[]')
}

export async function prepareNotifications() {
  if (!isNative()) return { ready: false, reason: 'web' as const }
  const permission = await LocalNotifications.checkPermissions()
  const result = permission.display === 'granted'
    ? permission
    : await LocalNotifications.requestPermissions()
  if (result.display !== 'granted') return { ready: false, reason: 'denied' as const }
  return { ready: true as const }
}

async function notificationAudio(alarm: Alarm) {
  if (alarm.soundId !== 'custom') return { sound: `${alarm.soundId}.wav` }
  if (!alarm.customSoundDataUrl || Capacitor.getPlatform() !== 'android') return {}
  try {
    const result = await AlarmSounds.ensureCustomChannel({ dataUrl: alarm.customSoundDataUrl })
    return result.channelId ? { channelId: result.channelId } : {}
  } catch {
    return {}
  }
}

export async function syncAlarmNotifications(alarms: Alarm[]) {
  if (!isNative()) return
  const permission = await prepareNotifications()
  if (!permission.ready) return

  await clearPreviousNotifications()
  const notifications: LocalNotificationSchema[] = []
  const ids: number[] = []

  for (const alarm of alarms.filter((item) => item.enabled)) {
    const audio = await notificationAudio(alarm)
    if (!alarm.repeats) {
      const id = notificationId(alarm.id)
      ids.push(id)
      notifications.push({
        id,
        title: alarm.label || 'المنبه بيرن',
        body: 'قوم يا بطل، معادك جه',
        ...audio,
        schedule: { at: nextAlarmDate(alarm), allowWhileIdle: true },
        isExactNotification: true,
        foreground: true,
        autoCancel: true,
        extra: { alarmId: alarm.id },
      })
      continue
    }

    for (const [index, day] of alarm.days.entries()) {
      const id = notificationId(alarm.id, index)
      const skippedToday = alarm.skippedDate === todayKey() && day === new Date().getDay()
      ids.push(id)
      notifications.push({
        id,
        title: alarm.label || 'المنبه بيرن',
        body: 'قوم يا بطل، معادك جه',
        ...audio,
        schedule: skippedToday
          ? { at: nextWeekOccurrence(alarm.hour, alarm.minute), allowWhileIdle: true }
          : {
              on: {
                weekday: (day + 1) as Weekday,
                hour: alarm.hour,
                minute: alarm.minute,
              },
              allowWhileIdle: true,
            },
        isExactNotification: true,
        foreground: true,
        autoCancel: true,
        extra: { alarmId: alarm.id },
      })
    }
  }

  if (notifications.length) await LocalNotifications.schedule({ notifications })
  localStorage.setItem(IDS_KEY, JSON.stringify(ids))
}

export async function openExactAlarmSettings() {
  if (isNative()) await LocalNotifications.changeExactNotificationSetting()
}

export async function exactAlarmStatus() {
  if (!isNative()) return 'web'
  const result = await LocalNotifications.checkExactNotificationSetting()
  return result.exact_alarm
}
