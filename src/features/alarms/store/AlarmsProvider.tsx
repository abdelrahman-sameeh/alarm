import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { asyncStorageAlarmRepository } from '../data/alarmRepository';
import { Alarm, AlarmDraft, createStarterAlarms, sortAlarms } from '../domain/alarm';
import { localDateKey } from '../domain/alarmTime';

type AlarmsContextValue = {
  alarms: Alarm[];
  hydrated: boolean;
  addAlarm(draft: AlarmDraft): void;
  updateAlarm(id: string, draft: AlarmDraft): void;
  toggleAlarm(id: string): void;
  skipToday(ids: string[]): void;
  pause(ids: string[]): void;
  remove(ids: string[]): void;
};

const AlarmsContext = createContext<AlarmsContextValue | null>(null);

export function AlarmsProvider({ children }: PropsWithChildren) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    asyncStorageAlarmRepository
      .load()
      .then((savedAlarms) => setAlarms(sortAlarms(savedAlarms ?? createStarterAlarms())))
      .catch(() => setAlarms(createStarterAlarms()))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    asyncStorageAlarmRepository.save(alarms).catch(() => undefined);
  }, [alarms, hydrated]);

  const value = useMemo<AlarmsContextValue>(
    () => ({
      alarms,
      hydrated,
      addAlarm(draft) {
        const alarm: Alarm = {
          ...draft,
          id: `alarm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          enabled: true,
          createdAt: new Date().toISOString(),
        };
        setAlarms((current) => sortAlarms([...current, alarm]));
      },
      updateAlarm(id, draft) {
        setAlarms((current) =>
          sortAlarms(current.map((alarm) => (alarm.id === id ? { ...alarm, ...draft } : alarm))),
        );
      },
      toggleAlarm(id) {
        setAlarms((current) =>
          current.map((alarm) =>
            alarm.id === id
              ? { ...alarm, enabled: !alarm.enabled, skippedDate: undefined }
              : alarm,
          ),
        );
      },
      skipToday(ids) {
        const selected = new Set(ids);
        setAlarms((current) =>
          current.map((alarm) =>
            selected.has(alarm.id) ? { ...alarm, skippedDate: localDateKey() } : alarm,
          ),
        );
      },
      pause(ids) {
        const selected = new Set(ids);
        setAlarms((current) =>
          current.map((alarm) =>
            selected.has(alarm.id) ? { ...alarm, enabled: false, skippedDate: undefined } : alarm,
          ),
        );
      },
      remove(ids) {
        const selected = new Set(ids);
        setAlarms((current) => current.filter((alarm) => !selected.has(alarm.id)));
      },
    }),
    [alarms, hydrated],
  );

  return <AlarmsContext.Provider value={value}>{children}</AlarmsContext.Provider>;
}

export function useAlarms() {
  const value = useContext(AlarmsContext);
  if (!value) throw new Error('useAlarms must be used inside AlarmsProvider');
  return value;
}
