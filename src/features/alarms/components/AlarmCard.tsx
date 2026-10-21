import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/theme';

import { Alarm } from '../domain/alarm';
import { formatAlarmTime, isSkippedToday, repeatLabel } from '../domain/alarmTime';

type AlarmCardProps = {
  alarm: Alarm;
  selected: boolean;
  selectionMode: boolean;
  onPress(): void;
  onLongPress(): void;
  onToggle(): void;
};

export function AlarmCard({
  alarm,
  selected,
  selectionMode,
  onPress,
  onLongPress,
  onToggle,
}: AlarmCardProps) {
  const { time, period } = formatAlarmTime(alarm.hour, alarm.minute);
  const skipped = isSkippedToday(alarm);
  const subdued = !alarm.enabled || skipped;

  return (
    <Pressable
      accessibilityLabel={`منبّه ${time} ${period}`}
      accessibilityRole="button"
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.topRow}>
        {selectionMode ? (
          <View style={[styles.selectionCircle, selected && styles.selectionCircleSelected]}>
            {selected ? <MaterialCommunityIcons color={colors.background} name="check" size={17} /> : null}
          </View>
        ) : (
          <Switch
            accessibilityLabel={alarm.enabled ? 'إيقاف المنبّه' : 'تشغيل المنبّه'}
            onValueChange={onToggle}
            thumbColor={alarm.enabled ? colors.background : colors.textMuted}
            trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
            value={alarm.enabled}
          />
        )}

        <View style={styles.timeWrap}>
          <Text style={[styles.period, subdued && styles.textDisabled]}>{period}</Text>
          <Text style={[styles.time, subdued && styles.textDisabled]}>{time}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.statusDot, alarm.enabled && !skipped && styles.statusDotActive]} />
        <Text numberOfLines={1} style={[styles.label, subdued && styles.textDisabled]}>
          {alarm.label}
        </Text>
      </View>

      <View style={styles.chipsRow}>
        {skipped ? (
          <View style={[styles.chip, styles.skippedChip]}>
            <MaterialCommunityIcons color={colors.primary} name="weather-night" size={14} />
            <Text style={[styles.chipText, styles.skippedText]}>متخطّي النهارده</Text>
          </View>
        ) : null}
        <View style={styles.chip}>
          <MaterialCommunityIcons color={colors.textMuted} name="repeat" size={14} />
          <Text style={styles.chipText}>{repeatLabel(alarm.repeatDays)}</Text>
        </View>
        <View style={styles.chip}>
          <MaterialCommunityIcons color={colors.textMuted} name="music-note" size={14} />
          <Text numberOfLines={1} style={styles.chipText}>
            {alarm.tone.name}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  cardPressed: {
    opacity: 0.86,
  },
  topRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  time: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  period: {
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: '700',
  },
  textDisabled: {
    color: colors.textSubtle,
  },
  selectionCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.textSubtle,
    borderRadius: radius.pill,
  },
  selectionCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.textSubtle,
  },
  statusDotActive: {
    backgroundColor: colors.success,
  },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    maxWidth: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  skippedChip: {
    backgroundColor: colors.primarySoft,
  },
  skippedText: {
    color: colors.primary,
  },
});
