import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme/theme';

import { Alarm, AlarmDraft, AlarmTone, BUILT_IN_TONES, WEEKDAYS } from '../domain/alarm';
import { toArabicDigits } from '../domain/alarmTime';

type AlarmEditorModalProps = {
  alarm: Alarm | null;
  onClose(): void;
  onSave(draft: AlarmDraft): void;
};

type StepperProps = {
  label: string;
  value: string;
  onDecrease(): void;
  onIncrease(): void;
};

function Stepper({ label, onDecrease, onIncrease, value }: StepperProps) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <Pressable onPress={onIncrease} style={styles.stepperButton}>
        <MaterialCommunityIcons color={colors.textMuted} name="chevron-up" size={24} />
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable onPress={onDecrease} style={styles.stepperButton}>
        <MaterialCommunityIcons color={colors.textMuted} name="chevron-down" size={24} />
      </Pressable>
    </View>
  );
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-');
}

async function persistPickedTone(uri: string, name: string) {
  if (Platform.OS === 'web') return uri;

  const directory = new Directory(Paths.document, 'alarm-tones');
  if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
  const source = new File(uri);
  const destination = new File(directory, `${Date.now()}-${safeFileName(name)}`);
  source.copy(destination);
  return destination.uri;
}

export function AlarmEditorModal({ alarm, onClose, onSave }: AlarmEditorModalProps) {
  const [hour, setHour] = useState(alarm?.hour ?? 6);
  const [minute, setMinute] = useState(alarm?.minute ?? 0);
  const [label, setLabel] = useState(alarm?.label ?? 'ميعاد القيام');
  const [repeatDays, setRepeatDays] = useState<Alarm['repeatDays']>(
    alarm?.repeatDays ?? WEEKDAYS.map((day) => day.id),
  );
  const [tone, setTone] = useState<AlarmTone>(alarm?.tone ?? BUILT_IN_TONES[0]);
  const [customTone, setCustomTone] = useState<AlarmTone | null>(
    alarm?.tone.kind === 'custom' ? alarm.tone : null,
  );
  const player = useAudioPlayer(customTone?.uri ?? null);
  const playerStatus = useAudioPlayerStatus(player);

  const tones = useMemo(
    () => (customTone ? [...BUILT_IN_TONES, customTone] : BUILT_IN_TONES),
    [customTone],
  );

  function toggleDay(day: Alarm['repeatDays'][number]) {
    setRepeatDays((current) => {
      if (current.includes(day)) {
        return current.length === 1 ? current : current.filter((item) => item !== day);
      }
      return [...current, day];
    });
  }

  async function pickTone() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const uri = await persistPickedTone(asset.uri, asset.name);
      const pickedTone: AlarmTone = {
        id: `custom-${Date.now()}`,
        name: asset.name.replace(/\.[^/.]+$/, ''),
        kind: 'custom',
        uri,
      };
      setCustomTone(pickedTone);
      setTone(pickedTone);
    } catch {
      Alert.alert('مقدرناش نضيف النغمة', 'جرّب ملف صوت تاني بصيغة MP3 أو WAV.');
    }
  }

  function togglePreview() {
    if (playerStatus.playing) {
      player.pause();
      return;
    }
    if (playerStatus.currentTime >= playerStatus.duration && playerStatus.duration > 0) {
      player.seekTo(0);
    }
    player.play();
  }

  function save() {
    onSave({
      hour,
      minute,
      label: label.trim() || 'منبّه',
      repeatDays,
      tone,
    });
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.headerButton}>
              <MaterialCommunityIcons color={colors.textMuted} name="close" size={24} />
            </Pressable>
            <Text style={styles.title}>{alarm ? 'تعديل المنبّه' : 'منبّه جديد'}</Text>
            <Pressable onPress={save} style={[styles.headerButton, styles.saveButton]}>
              <MaterialCommunityIcons color={colors.background} name="check" size={24} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.timePicker}>
              <Stepper
                label="دقيقة"
                onDecrease={() => setMinute((value) => (value + 55) % 60)}
                onIncrease={() => setMinute((value) => (value + 5) % 60)}
                value={toArabicDigits(String(minute).padStart(2, '0'))}
              />
              <Text style={styles.colon}>:</Text>
              <Stepper
                label="ساعة"
                onDecrease={() => setHour((value) => (value + 23) % 24)}
                onIncrease={() => setHour((value) => (value + 1) % 24)}
                value={toArabicDigits(String(hour).padStart(2, '0'))}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>اسم المنبّه</Text>
              <TextInput
                maxLength={40}
                onChangeText={setLabel}
                placeholder="مثلاً: صلاة الفجر"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
                textAlign="right"
                value={label}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionHint}>لازم تختار يوم واحد على الأقل</Text>
                <Text style={styles.sectionTitle}>يتكرر إمتى؟</Text>
              </View>
              <View style={styles.daysRow}>
                {WEEKDAYS.map((day) => {
                  const selected = repeatDays.includes(day.id);
                  return (
                    <Pressable
                      accessibilityLabel={day.label}
                      key={day.id}
                      onPress={() => toggleDay(day.id)}
                      style={[styles.day, selected && styles.daySelected]}
                    >
                      <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day.short}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Pressable onPress={pickTone} style={styles.importButton}>
                  <MaterialCommunityIcons color={colors.primary} name="folder-music-outline" size={18} />
                  <Text style={styles.importText}>من الجهاز</Text>
                </Pressable>
                <Text style={styles.sectionTitle}>النغمة</Text>
              </View>
              <View style={styles.tonesList}>
                {tones.map((item) => {
                  const selected = tone.id === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setTone(item)}
                      style={[styles.toneRow, selected && styles.toneRowSelected]}
                    >
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                      <View style={styles.toneInfo}>
                        <Text style={styles.toneName}>{item.name}</Text>
                        <Text style={styles.toneKind}>
                          {item.kind === 'custom' ? 'ملف من جهازك' : 'نغمة مدمجة'}
                        </Text>
                      </View>
                      {item.kind === 'custom' ? (
                        <Pressable onPress={togglePreview} style={styles.previewButton}>
                          <MaterialCommunityIcons
                            color={colors.text}
                            name={playerStatus.playing ? 'pause' : 'play'}
                            size={18}
                          />
                        </Pressable>
                      ) : (
                        <MaterialCommunityIcons color={colors.textSubtle} name="music-note" size={20} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: 48,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  stepper: {
    alignItems: 'center',
  },
  stepperLabel: {
    marginBottom: spacing.xs,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  stepperButton: {
    width: 64,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 96,
    color: colors.text,
    fontSize: 58,
    fontWeight: '700',
    textAlign: 'center',
  },
  colon: {
    marginTop: 26,
    color: colors.primary,
    fontSize: 54,
    fontWeight: '700',
  },
  section: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  sectionHint: {
    color: colors.textSubtle,
    fontSize: 11,
  },
  input: {
    height: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
    fontSize: 16,
  },
  daysRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  day: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  daySelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dayText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  dayTextSelected: {
    color: colors.background,
  },
  importButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  importText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  tonesList: {
    gap: spacing.sm,
  },
  toneRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 13,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  toneRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  toneInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  toneName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  toneKind: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 11,
  },
  radio: {
    width: 21,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.textSubtle,
    borderRadius: radius.pill,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  previewButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
  },
});
