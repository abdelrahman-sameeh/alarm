import AsyncStorage from '@react-native-async-storage/async-storage';

import { Alarm } from '../domain/alarm';

const STORAGE_KEY = '@alarm/alarms/v1';

export interface AlarmRepository {
  load(): Promise<Alarm[] | null>;
  save(alarms: Alarm[]): Promise<void>;
}

export const asyncStorageAlarmRepository: AlarmRepository = {
  async load() {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (!value) return null;

    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as Alarm[]) : null;
  },

  async save(alarms) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  },
};
