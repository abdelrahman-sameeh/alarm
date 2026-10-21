import { Capacitor, registerPlugin } from '@capacitor/core'
import {
  LocalNotifications,
  Weekday,
  type LocalNotificationSchema,
} from '@capacitor/local-notifications'
import { getSound } from '../data/sounds'
import type { Alarm } from '../domain/alarm'
import { nextAlarmDate, todayKey } from '../domain/alarm'
import type { AlarmSettings } from '../domain/settings'

const IDS_KEY = 'alarm-masry:notification-ids'
const ACTION_TYPE_ID = 'ALARM_CONTROLS_V2'

interface AlarmSoundsPlugin {
  ensureBundledChannel(options: { soundName: string; label: string }): Promise<{ channelId?: string }>
  ensureCustomChannel(options: { dataUrl: string }): Promise<{ channelId?: string }>
}

const AlarmSounds = registerPlugin<AlarmSoundsPlugin>('AlarmSounds')

function isNative() {
  return Capacitor.isNativePlatform()
}

function notificationId(alarmId: number, dayOffset = 0, reminder = false) {
  const safeAlarmId = Math.abs(alarmId) % 10_000_000
  return safeAlarmId * 100 + (reminder ? 50 : 0) + dayOffset + 1
}

function nextWeekOccurrence(hour: number, minute: number) {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  date.setHours(hour, minute, 0, 0)
  return date
}

function subtractMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() - minutes * 60_000)
}

function weeklyReminderTime(day: number, hour: number, minute: number, minutesBefore: number) {
  const minutesInWeek = 7 * 24 * 60
  const alarmMinute = day * 24 * 60 + hour * 60 + minute
  const reminderMinute = (alarmMinute - minutesBefore + minutesInWeek) % minutesInWeek
  return {
    weekday: (Math.floor(reminderMinute / (24 * 60)) + 1) as Weekday,
    hour: Math.floor((reminderMinute % (24 * 60)) / 60),
    minute: reminderMinute % 60,
  }
}

async function clearPreviousNotifications() {
  const ids = JSON.parse(localStorage.getItem(IDS_KEY) ?? '[]') as number[]
  if (ids.length) {
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
  }
  localStorage.setItem(IDS_KEY, '[]')
}

async function prepareActionTypes() {
  await LocalNotifications.registerActionTypes({
    types: [{
      id: ACTION_TYPE_ID,
      actions: [
        { id: 'skip_today', title: 'تخطي النهارده' },
        { id: 'disable_alarm', title: 'إلغاء دائم' },
      ],
    }],
  })
}

export async function listenForNotificationActions(
  onAction: (action: 'skip_today' | 'disable_alarm', alarmId: number) => void,
) {
  if (!isNative()) return () => undefined
  await prepareActionTypes()
  const listener = await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    if (event.actionId !== 'skip_today' && event.actionId !== 'disable_alarm') return
    const notification = event.notification as LocalNotificationSchema & { data?: { alarmId?: number } }
    const alarmId = Number(notification.extra?.alarmId ?? notification.data?.alarmId)
    if (Number.isFinite(alarmId)) onAction(event.actionId, alarmId)
  })
  return () => void listener.remove()
}

export async function prepareNotifications() {
  if (!isNative()) return { ready: false, reason: 'web' as const }
  await prepareActionTypes()
  const permission = await LocalNotifications.checkPermissions()
  const result = permission.display === 'granted'
    ? permission
    : await LocalNotifications.requestPermissions()
  if (result.display !== 'granted') return { ready: false, reason: 'denied' as const }
  return { ready: true as const }
}

async function notificationAudio(alarm: Alarm) {
  if (alarm.soundId !== 'custom') {
    const sound = getSound(alarm.soundId)
    const soundName = sound.file.replace(/^\//, '')
    if (Capacitor.getPlatform() === 'android') {
      try {
        const result = await AlarmSounds.ensureBundledChannel({ soundName, label: sound.name })
        if (result.channelId) return { channelId: result.channelId }
      } catch {
        // Fall back to Capacitor's per-sound notification channel.
      }
    }
    return { sound: soundName }
  }
  if (!alarm.customSoundDataUrl || Capacitor.getPlatform() !== 'android') return {}
  try {
    const result = await AlarmSounds.ensureCustomChannel({ dataUrl: alarm.customSoundDataUrl })
    return result.channelId ? { channelId: result.channelId } : {}
  } catch {
    return {}
  }
}

function alarmNotification(
  alarm: Alarm,
  id: number,
  audio: Awaited<ReturnType<typeof notificationAudio>>,
  schedule: NonNullable<LocalNotificationSchema['schedule']>,
): LocalNotificationSchema {
  return {
    id,
    title: alarm.label || 'المنبه بيرن',
    body: 'قوم يا بطل، معادك جه',
    ...audio,
    actionTypeId: ACTION_TYPE_ID,
    schedule,
    isExactNotification: true,
    foreground: true,
    autoCancel: true,
    extra: { alarmId: alarm.id },
  }
}

function reminderNotification(
  alarm: Alarm,
  id: number,
  minutesBefore: number,
  schedule: NonNullable<LocalNotificationSchema['schedule']>,
): LocalNotificationSchema {
  return {
    id,
    title: `فاضل ${minutesBefore} دقيقة على المنبه`,
    body: alarm.label || 'جهّز نفسك، المنبه قرب',
    actionTypeId: ACTION_TYPE_ID,
    schedule,
    isExactNotification: true,
    foreground: true,
    autoCancel: true,
    extra: { alarmId: alarm.id, reminder: true },
  }
}

export async function syncAlarmNotifications(alarms: Alarm[], settings: AlarmSettings) {
  if (!isNative()) return
  const permission = await prepareNotifications()
  if (!permission.ready) return

  await clearPreviousNotifications()
  const notifications: LocalNotificationSchema[] = []
  const ids: number[] = []

  for (const alarm of alarms.filter((item) => item.enabled)) {
    const audio = await notificationAudio(alarm)
    if (!alarm.repeats) {
      const alarmAt = nextAlarmDate(alarm)
      const id = notificationId(alarm.id)
      ids.push(id)
      notifications.push(alarmNotification(
        alarm,
        id,
        audio,
        { at: alarmAt, allowWhileIdle: true },
      ))

      const reminderAt = subtractMinutes(alarmAt, settings.reminderMinutes)
      if (settings.reminderEnabled && reminderAt > new Date()) {
        const reminderId = notificationId(alarm.id, 0, true)
        ids.push(reminderId)
        notifications.push(reminderNotification(
          alarm,
          reminderId,
          settings.reminderMinutes,
          { at: reminderAt, allowWhileIdle: true },
        ))
      }
      continue
    }

    for (const [index, day] of alarm.days.entries()) {
      const skippedToday = alarm.skippedDate === todayKey() && day === new Date().getDay()
      const alarmAt = skippedToday ? nextWeekOccurrence(alarm.hour, alarm.minute) : null
      const id = notificationId(alarm.id, index)
      ids.push(id)
      notifications.push(alarmNotification(
        alarm,
        id,
        audio,
        alarmAt
          ? { at: alarmAt, allowWhileIdle: true }
          : {
              on: {
                weekday: (day + 1) as Weekday,
                hour: alarm.hour,
                minute: alarm.minute,
              },
              allowWhileIdle: true,
            },
      ))

      if (settings.reminderEnabled) {
        const reminderId = notificationId(alarm.id, index, true)
        const reminderTime = weeklyReminderTime(
          day,
          alarm.hour,
          alarm.minute,
          settings.reminderMinutes,
        )
        ids.push(reminderId)
        notifications.push(reminderNotification(
          alarm,
          reminderId,
          settings.reminderMinutes,
          alarmAt
            ? { at: subtractMinutes(alarmAt, settings.reminderMinutes), allowWhileIdle: true }
            : { on: reminderTime, allowWhileIdle: true },
        ))
      }
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
