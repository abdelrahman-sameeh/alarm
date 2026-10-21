import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { Alarm, AlarmDraft } from '../domain/alarm'
import { DEFAULT_DAYS, nextOneTimeTimestamp, todayKey } from '../domain/alarm'
import { DEFAULT_ALARM_SETTINGS, type AlarmSettings } from '../domain/settings'
import { listenForNotificationActions, syncAlarmNotifications } from '../services/alarmScheduler'
import { AlarmStoreContext, type AlarmStoreValue } from './AlarmContext'

const STORAGE_KEY = 'alarm-masry:alarms-v2'
const SETTINGS_KEY = 'alarm-masry:settings-v1'
const DEFAULT_TIMES = [[4, 0], [4, 30], [5, 0], [5, 30], [6, 0], [6, 30]]

const initialAlarms: Alarm[] = DEFAULT_TIMES.map(([hour, minute], index) => ({
  id: 1000 + index,
  label: index < 2 ? 'صحيان الفجر' : 'ابدأ يومك',
  hour,
  minute,
  enabled: true,
  repeats: true,
  days: [...DEFAULT_DAYS],
  soundId: index === 0 ? 'adhan' : 'dawn',
}))

function loadAlarms() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialAlarms
    const parsed = JSON.parse(stored) as Alarm[]
    return normalizeAlarms(parsed)
  } catch {
    return initialAlarms
  }
}

function loadSettings(): AlarmSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    return stored
      ? { ...DEFAULT_ALARM_SETTINGS, ...JSON.parse(stored) as Partial<AlarmSettings> }
      : DEFAULT_ALARM_SETTINGS
  } catch {
    return DEFAULT_ALARM_SETTINGS
  }
}

function normalizeAlarms(alarms: Alarm[]) {
  const today = todayKey()
  const now = Date.now()
  return alarms.map((alarm) => {
    const skippedDate = alarm.skippedDate && alarm.skippedDate !== today
      ? undefined
      : alarm.skippedDate
    if (alarm.repeats) return { ...alarm, skippedDate, oneTimeAt: undefined }
    const oneTimeAt = alarm.oneTimeAt ?? nextOneTimeTimestamp(alarm.hour, alarm.minute)
    return {
      ...alarm,
      skippedDate: undefined,
      oneTimeAt,
      enabled: alarm.enabled && oneTimeAt > now,
    }
  })
}

export function AlarmStoreProvider({ children }: PropsWithChildren) {
  const [alarms, setAlarms] = useState<Alarm[]>(loadAlarms)
  const [settings, setSettings] = useState<AlarmSettings>(loadSettings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms))
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    const timer = window.setTimeout(() => void syncAlarmNotifications(alarms, settings), 350)
    return () => window.clearTimeout(timer)
  }, [alarms, settings])

  useEffect(() => {
    const refreshTimeSensitiveState = () => {
      setAlarms((current) => {
        const normalized = normalizeAlarms(current)
        return JSON.stringify(normalized) === JSON.stringify(current) ? current : normalized
      })
    }
    const timer = window.setInterval(refreshTimeSensitiveState, 60_000)
    document.addEventListener('visibilitychange', refreshTimeSensitiveState)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshTimeSensitiveState)
    }
  }, [])

  const addAlarm = useCallback((draft: AlarmDraft) => {
    const id = Math.floor(Date.now() / 1000) % 100_000_000
    setAlarms((current) => [...current, {
      ...draft,
      id,
      enabled: true,
      oneTimeAt: draft.repeats ? undefined : nextOneTimeTimestamp(draft.hour, draft.minute),
    }])
    return id
  }, [])

  const updateAlarm = useCallback((id: number, draft: AlarmDraft) => {
    setAlarms((current) => current.map((alarm) =>
      alarm.id === id
        ? {
            ...alarm,
            ...draft,
            oneTimeAt: draft.repeats ? undefined : nextOneTimeTimestamp(draft.hour, draft.minute),
            skippedDate: undefined,
          }
        : alarm,
    ))
  }, [])

  const toggleAlarm = useCallback((id: number) => {
    setAlarms((current) => current.map((alarm) =>
      alarm.id === id
        ? {
            ...alarm,
            enabled: !alarm.enabled,
            oneTimeAt: !alarm.enabled && !alarm.repeats
              ? nextOneTimeTimestamp(alarm.hour, alarm.minute)
              : alarm.oneTimeAt,
            skippedDate: undefined,
          }
        : alarm,
    ))
  }, [])

  const pauseAlarms = useCallback((ids: number[]) => {
    setAlarms((current) => current.map((alarm) =>
      ids.includes(alarm.id) ? { ...alarm, enabled: false, skippedDate: undefined } : alarm,
    ))
  }, [])

  const skipToday = useCallback((ids: number[]) => {
    setAlarms((current) => current.map((alarm) =>
      ids.includes(alarm.id)
        ? alarm.repeats
          ? { ...alarm, skippedDate: todayKey() }
          : { ...alarm, enabled: false, skippedDate: undefined }
        : alarm,
    ))
  }, [])

  const deleteAlarms = useCallback((ids: number[]) => {
    setAlarms((current) => current.filter((alarm) => !ids.includes(alarm.id)))
  }, [])

  const updateSettings = useCallback((patch: Partial<AlarmSettings>) => {
    setSettings((current) => ({
      ...current,
      ...patch,
      reminderMinutes: Math.min(180, Math.max(1, patch.reminderMinutes ?? current.reminderMinutes)),
    }))
  }, [])

  useEffect(() => {
    let stopListening: (() => void) | undefined
    void listenForNotificationActions((action, alarmId) => {
      if (action === 'skip_today') skipToday([alarmId])
      if (action === 'disable_alarm') pauseAlarms([alarmId])
    }).then((stop) => { stopListening = stop })
    return () => stopListening?.()
  }, [pauseAlarms, skipToday])

  const value = useMemo<AlarmStoreValue>(() => ({
    alarms,
    settings,
    updateSettings,
    addAlarm,
    updateAlarm,
    toggleAlarm,
    pauseAlarms,
    skipToday,
    deleteAlarms,
    getAlarm: (id) => alarms.find((alarm) => alarm.id === id),
  }), [alarms, settings, updateSettings, addAlarm, updateAlarm, toggleAlarm, pauseAlarms, skipToday, deleteAlarms])

  return <AlarmStoreContext.Provider value={value}>{children}</AlarmStoreContext.Provider>
}
