import type { ModuleDefinition, ModuleEntry } from '@types';
import { SleepDashboard } from './SleepDashboard';
import { SleepHistory } from './SleepHistory';

export const sleepModule: ModuleDefinition = {
  slug: 'sleep',
  name: 'Sueño',
  description: 'Control de duración y calidad de sueño con eventos que alimentan el score.',
  supportedEvents: ['sleep_hours', 'sleep_quality'],
  defaultConfig: {
    idealHours: 8,
    maxPoints: 2,
    toleranceMinutes: 30,
    penaltyMode: 'automatic', // 'automatic' or 'manual'
    penaltyPerHour: 1, // for manual mode
  },
  calculateScore: (entries: ModuleEntry[], config: Record<string, unknown>, targetDate?: string) => {
    // Usar la fecha objetivo proporcionada o hoy por defecto
    const target = targetDate || new Date().toISOString().slice(0, 10);
    
    const todayEntry = entries.find(e => {
      const entryDate = e.date.slice(0, 10); // Extract YYYY-MM-DD from ISO string
      return entryDate === target;
    });
    if (!todayEntry) return 0;

    const data = JSON.parse(todayEntry.data);
    const bedtime = data.bedtime || '';
    const waketime = data.waketime || '';
    const naps = Array.isArray(data.naps) ? data.naps : [];

    let totalHours = 0;
    if (bedtime && waketime) {
      const bed = new Date(`1970-01-01T${bedtime}:00`);
      const wake = new Date(`1970-01-01T${waketime}:00`);
      if (wake < bed) wake.setDate(wake.getDate() + 1);
      totalHours += (wake.getTime() - bed.getTime()) / (1000 * 60 * 60);
    }

    for (const nap of naps) {
      if (!nap?.start || !nap?.end) continue;
      const napStart = new Date(`1970-01-01T${nap.start}:00`);
      const napEnd = new Date(`1970-01-01T${nap.end}:00`);
      const end = napEnd < napStart ? new Date(napEnd.setDate(napEnd.getDate() + 1)) : napEnd;
      totalHours += (end.getTime() - napStart.getTime()) / (1000 * 60 * 60);
    }

    if (totalHours === 0) return 0;

    const idealHours = (config.idealHours as number) || 8;
    const maxPoints = (config.maxPoints as number) || 2;
    const toleranceMinutes = (config.toleranceMinutes as number) ?? 30;
    const penaltyMode = (config.penaltyMode as string) || 'automatic';
    const penaltyPerHour = (config.penaltyPerHour as number) || 1;

    const diff = Math.abs(totalHours - idealHours);
    const toleranceHours = toleranceMinutes / 60;
    const adjustedDiff = Math.max(0, diff - toleranceHours);
    const penalty = penaltyMode === 'automatic' ? adjustedDiff : penaltyPerHour * adjustedDiff;

    // Permitir puntos negativos
    return maxPoints - penalty;
  },
  Component: SleepDashboard,
  HistoryComponent: SleepHistory,
};
