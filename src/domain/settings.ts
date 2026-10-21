export interface AlarmSettings {
  reminderEnabled: boolean
  reminderMinutes: number
}

export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
  reminderEnabled: false,
  reminderMinutes: 10,
}
