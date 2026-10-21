import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alarm.masry',
  appName: 'alarm',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'alarm_notification',
      iconColor: '#E7E8E6',
    },
  },
}

export default config
