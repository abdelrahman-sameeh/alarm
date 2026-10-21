import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alarm.masry',
  appName: 'Alarm Masry',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'alarm_notification',
      iconColor: '#D7FF68',
    },
  },
}

export default config
