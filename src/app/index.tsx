import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlarmCard } from '@/features/alarms/components/AlarmCard';
import { AlarmEditorModal } from '@/features/alarms/components/AlarmEditorModal';
import { BulkActionBar } from '@/features/alarms/components/BulkActionBar';
import { Alarm, AlarmDraft } from '@/features/alarms/domain/alarm';
import { isSkippedToday, nextAlarmLabel, toArabicDigits } from '@/features/alarms/domain/alarmTime';
import { useAlarms } from '@/features/alarms/store/AlarmsProvider';
import { colors, radius, spacing } from '@/theme/theme';

export default function HomeScreen() {
  const { addAlarm, alarms, hydrated, pause, remove, skipToday, toggleAlarm, updateAlarm } =
    useAlarms();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);

  const selectionMode = selectedIds.size > 0;
  const activeCount = alarms.filter((alarm) => alarm.enabled && !isSkippedToday(alarm)).length;
  const nextLabel = useMemo(() => nextAlarmLabel(alarms), [alarms]);

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startSelection(id: string) {
    Haptics.selectionAsync().catch(() => undefined);
    setSelectedIds(new Set([id]));
  }

  function selectRemainingToday() {
    const now = new Date();
    const nowInMinutes = now.getHours() * 60 + now.getMinutes();
    const remaining = alarms
      .filter(
        (alarm) =>
          alarm.enabled &&
          alarm.repeatDays.includes(now.getDay() as Alarm['repeatDays'][number]) &&
          alarm.hour * 60 + alarm.minute > nowInMinutes &&
          !isSkippedToday(alarm, now),
      )
      .map((alarm) => alarm.id);

    if (remaining.length === 0) {
      Alert.alert('كله تمام', 'مفيش منبّهات تانية شغالة النهارده.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setSelectedIds(new Set(remaining));
  }

  function completeBulkAction(action: (ids: string[]) => void) {
    action([...selectedIds]);
    setSelectedIds(new Set());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }

  function confirmDelete() {
    Alert.alert(
      'نحذف المنبّهات؟',
      `هتحذف ${toArabicDigits(selectedIds.size)} منبّه نهائي ومش هينفع ترجعهم.`,
      [
        { text: 'لأ، سيبهم', style: 'cancel' },
        {
          text: 'احذف',
          style: 'destructive',
          onPress: () => completeBulkAction(remove),
        },
      ],
    );
  }

  function openNewAlarm() {
    setEditingAlarm(null);
    setEditorVisible(true);
  }

  function openAlarm(alarm: Alarm) {
    setEditingAlarm(alarm);
    setEditorVisible(true);
  }

  function saveAlarm(draft: AlarmDraft) {
    if (editingAlarm) updateAlarm(editingAlarm.id, draft);
    else addAlarm(draft);
    setEditorVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, selectionMode && styles.contentWithBar]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {selectionMode ? (
            <>
              <Pressable onPress={() => setSelectedIds(new Set())} style={styles.roundButton}>
                <MaterialCommunityIcons color={colors.text} name="close" size={22} />
              </Pressable>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>وضع التحديد</Text>
                <Text style={styles.headerTitle}>مختار {toArabicDigits(selectedIds.size)}</Text>
              </View>
              <Pressable
                onPress={() => setSelectedIds(new Set(alarms.map((alarm) => alarm.id)))}
                style={styles.textButton}
              >
                <Text style={styles.textButtonLabel}>اختار الكل</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                accessibilityLabel="تحديد كل المنبّهات"
                disabled={alarms.length === 0}
                onPress={() => setSelectedIds(new Set(alarms.map((alarm) => alarm.id)))}
                style={styles.roundButton}
              >
                <MaterialCommunityIcons color={colors.textMuted} name="format-list-checks" size={22} />
              </Pressable>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>صباح الفل</Text>
                <Text style={styles.headerTitle}>منبّهاتك</Text>
              </View>
              <View style={styles.brandMark}>
                <MaterialCommunityIcons color={colors.background} name="alarm" size={23} />
              </View>
            </>
          )}
        </View>

        {!selectionMode ? (
          <LinearGradient colors={['#302416', '#181A1E']} style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons color={colors.primary} name="weather-sunset-up" size={25} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>صحيت خلاص؟</Text>
                <Text style={styles.heroSubtitle}>اختار كل المنبّهات اللي فاضلة النهارده بضغطة</Text>
              </View>
            </View>
            <Pressable
              onPress={selectRemainingToday}
              style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color={colors.background} name="check-all" size={20} />
              <Text style={styles.heroButtonText}>حدد اللي جاي</Text>
            </Pressable>
          </LinearGradient>
        ) : null}

        <View style={styles.summaryRow}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{toArabicDigits(activeCount)} شغّال</Text>
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>{nextLabel}</Text>
            <Text style={styles.summaryHint}>دوس مطوّل على أي منبّه عشان تختار أكتر من واحد</Text>
          </View>
        </View>

        <View style={styles.list}>
          {alarms.length ? (
            alarms.map((alarm) => (
              <AlarmCard
                alarm={alarm}
                key={alarm.id}
                onLongPress={() => startSelection(alarm.id)}
                onPress={() => (selectionMode ? toggleSelected(alarm.id) : openAlarm(alarm))}
                onToggle={() => toggleAlarm(alarm.id)}
                selected={selectedIds.has(alarm.id)}
                selectionMode={selectionMode}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons color={colors.primary} name="alarm-plus" size={30} />
              </View>
              <Text style={styles.emptyTitle}>مفيش منبّهات لسه</Text>
              <Text style={styles.emptyText}>ضيف أول منبّه وخلي الباقي علينا.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {!selectionMode ? (
        <Pressable
          accessibilityLabel="إضافة منبّه"
          onPress={openNewAlarm}
          style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons color={colors.background} name="plus" size={28} />
        </Pressable>
      ) : (
        <BulkActionBar
          count={selectedIds.size}
          onDelete={confirmDelete}
          onPause={() => completeBulkAction(pause)}
          onSkipToday={() => completeBulkAction(skipToday)}
        />
      )}

      {editorVisible ? (
        <AlarmEditorModal
          alarm={editingAlarm}
          onClose={() => setEditorVisible(false)}
          onSave={saveAlarm}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 108,
  },
  contentWithBar: {
    paddingBottom: 190,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    marginTop: 2,
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
  },
  roundButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  textButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  textButtonLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  brandMark: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  hero: {
    overflow: 'hidden',
    gap: spacing.md,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4A3520',
    borderRadius: radius.lg,
  },
  heroGlow: {
    position: 'absolute',
    top: -55,
    right: -35,
    width: 150,
    height: 150,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 181, 91, 0.1)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  heroCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
  heroButton: {
    height: 46,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  heroButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '900',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  summaryHint: {
    marginTop: 4,
    color: colors.textSubtle,
    fontSize: 11,
    textAlign: 'right',
  },
  liveBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  liveText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.primary,
    shadowColor: colors.primaryStrong,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 9,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
