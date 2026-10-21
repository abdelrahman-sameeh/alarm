export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type AlarmTone = {
  id: string;
  name: string;
  kind: 'built-in' | 'custom';
  uri?: string;
};

export type Alarm = {
  id: string;
  hour: number;
  minute: number;
  label: string;
  enabled: boolean;
  repeatDays: Weekday[];
  tone: AlarmTone;
  skippedDate?: string;
  createdAt: string;
};

export type AlarmDraft = Pick<Alarm, 'hour' | 'minute' | 'label' | 'repeatDays' | 'tone'>;

export const WEEKDAYS: { id: Weekday; short: string; label: string }[] = [
  { id: 6, short: 'س', label: 'السبت' },
  { id: 0, short: 'ح', label: 'الأحد' },
  { id: 1, short: 'ن', label: 'الاثنين' },
  { id: 2, short: 'ت', label: 'الثلاثاء' },
  { id: 3, short: 'ر', label: 'الأربعاء' },
  { id: 4, short: 'خ', label: 'الخميس' },
  { id: 5, short: 'ج', label: 'الجمعة' },
];

export const BUILT_IN_TONES: AlarmTone[] = [
  { id: 'adhan', name: 'الأذان', kind: 'built-in' },
  { id: 'fajr', name: 'فجر هادي', kind: 'built-in' },
  { id: 'breeze', name: 'نسمة', kind: 'built-in' },
  { id: 'classic', name: 'جرس كلاسيك', kind: 'built-in' },
  { id: 'digital', name: 'نغمة رقمية', kind: 'built-in' },
  { id: 'wake-up', name: 'صحصح', kind: 'built-in' },
];

const EVERY_DAY = WEEKDAYS.map((day) => day.id);

export function createStarterAlarms(): Alarm[] {
  return [
    [4, 0],
    [4, 30],
    [5, 0],
    [5, 30],
    [6, 0],
    [6, 30],
  ].map(([hour, minute], index) => ({
    id: `starter-${hour}-${minute}`,
    hour,
    minute,
    label: index < 2 ? 'اصحى براحة' : 'ميعاد القيام',
    enabled: true,
    repeatDays: EVERY_DAY,
    tone: BUILT_IN_TONES[index],
    createdAt: new Date().toISOString(),
  }));
}

export function sortAlarms(alarms: Alarm[]) {
  return [...alarms].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
}
