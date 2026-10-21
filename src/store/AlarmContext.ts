import { createContext } from 'react'
import type { Alarm, AlarmDraft } from '../domain/alarm'
import type { AlarmSettings } from '../domain/settings'

export interface AlarmStoreValue {
  alarms: Alarm[]
  settings: AlarmSettings
  updateSettings: (settings: Partial<AlarmSettings>) => void
  addAlarm: (draft: AlarmDraft) => number
  updateAlarm: (id: number, draft: AlarmDraft) => void
  toggleAlarm: (id: number) => void
  pauseAlarms: (ids: number[]) => void
  skipToday: (ids: number[]) => void
  deleteAlarms: (ids: number[]) => void
  getAlarm: (id: number) => Alarm | undefined
}

export const AlarmStoreContext = createContext<AlarmStoreValue | null>(null)
