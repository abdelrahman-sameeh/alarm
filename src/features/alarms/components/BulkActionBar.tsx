import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/theme';

type BulkActionBarProps = {
  count: number;
  onSkipToday(): void;
  onPause(): void;
  onDelete(): void;
};

type ActionProps = {
  danger?: boolean;
  icon: 'weather-night' | 'pause-circle-outline' | 'trash-can-outline';
  label: string;
  onPress(): void;
};

function Action({ danger, icon, label, onPress }: ActionProps) {
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <View style={[styles.actionIcon, danger && styles.dangerIcon]}>
        <MaterialCommunityIcons color={color} name={icon} size={22} />
      </View>
      <Text style={[styles.actionText, danger && styles.dangerText]}>{label}</Text>
    </Pressable>
  );
}

export function BulkActionBar({ count, onDelete, onPause, onSkipToday }: BulkActionBarProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.count}>مختار {count}</Text>
      <View style={styles.actions}>
        <Action icon="weather-night" label="النهارده بس" onPress={onSkipToday} />
        <Action icon="pause-circle-outline" label="إيقاف دايم" onPress={onPause} />
        <Action danger icon="trash-can-outline" label="حذف" onPress={onDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    left: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 14,
  },
  count: {
    marginBottom: spacing.sm,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  action: {
    minWidth: 82,
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  dangerIcon: {
    backgroundColor: colors.dangerSoft,
  },
  actionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  dangerText: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.6,
  },
});
