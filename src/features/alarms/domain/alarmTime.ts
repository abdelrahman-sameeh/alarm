import { Alarm, WEEKDAYS } from './alarm';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toArabicDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatAlarmTime(hour: number, minute: number) {
  const period = hour < 12 ? 'ص' : 'م';
  const displayHour = hour % 12 || 12;
  return {
    time: `${toArabicDigits(displayHour)}:${toArabicDigits(String(minute).padStart(2, '0'))}`,
    period,
  };
}

export function repeatLabel(days: Alarm['repeatDays']) {
  if (days.length === 7) return 'كل يوم';
  if (days.length === 0) return 'مرة واحدة';
  if (days.length === 5 && ([0, 1, 2, 3, 4] as const).every((day) => days.includes(day))) {
    return 'أيام الشغل';
  }
  return WEEKDAYS.filter((day) => days.includes(day.id))
    .map((day) => day.short)
    .join('، ');
}

export function isSkippedToday(alarm: Alarm, now = new Date()) {
  return alarm.skippedDate === localDateKey(now);
}

export function getNextOccurrence(alarm: Alarm, from = new Date()) {
  if (!alarm.enabled || alarm.repeatDays.length === 0) return null;

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(from);
    candidate.setDate(from.getDate() + offset);
    candidate.setHours(alarm.hour, alarm.minute, 0, 0);

    if (!alarm.repeatDays.includes(candidate.getDay() as Alarm['repeatDays'][number])) continue;
    if (candidate.getTime() <= from.getTime()) continue;
    if (offset === 0 && isSkippedToday(alarm, from)) continue;
    return candidate;
  }

  return null;
}

export function getNextAlarm(alarms: Alarm[], from = new Date()) {
  return alarms
    .map((alarm) => ({ alarm, date: getNextOccurrence(alarm, from) }))
    .filter((item): item is { alarm: Alarm; date: Date } => item.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null;
}

export function nextAlarmLabel(alarms: Alarm[], from = new Date()) {
  const next = getNextAlarm(alarms, from);
  if (!next) return 'مفيش منبّهات جاية';

  const tomorrow = new Date(from);
  tomorrow.setDate(from.getDate() + 1);
  const dayLabel =
    localDateKey(next.date) === localDateKey(from)
      ? 'النهارده'
      : localDateKey(next.date) === localDateKey(tomorrow)
        ? 'بكره'
        : WEEKDAYS.find((day) => day.id === next.date.getDay())?.label;
  const { time, period } = formatAlarmTime(next.alarm.hour, next.alarm.minute);
  return `المنبّه الجاي ${dayLabel} ${time} ${period}`;
}
