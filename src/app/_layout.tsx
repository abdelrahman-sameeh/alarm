import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AlarmsProvider } from '@/features/alarms/store/AlarmsProvider';
import { colors } from '@/theme/theme';

export default function RootLayout() {
  return (
    <AlarmsProvider>
      <Stack
        screenOptions={{
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}
      />
      <StatusBar style="light" />
    </AlarmsProvider>
  );
}
