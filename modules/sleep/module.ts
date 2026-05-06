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
    const hours = Number(data.hours || 0);
    const bedtime = data.bedtime || '';
    const waketime = data.waketime || '';

    // Si ambos horarios son iguales (no hay registro), 0 puntos
    if (bedtime === waketime) return 0;
    
    // Si no hay horas registradas, 0 puntos directamente
    if (hours === 0) return 0;

    const idealHours = (config.idealHours as number) || 8;
    const maxPoints = (config.maxPoints as number) || 2;
    const toleranceMinutes = (config.toleranceMinutes as number) ?? 30;
    const penaltyMode = (config.penaltyMode as string) || 'automatic';
    const penaltyPerHour = (config.penaltyPerHour as number) || 1;

    const diff = Math.abs(hours - idealHours);
    const toleranceHours = toleranceMinutes / 60;
    const adjustedDiff = Math.max(0, diff - toleranceHours);
    const penalty = penaltyMode === 'automatic' ? adjustedDiff : penaltyPerHour * adjustedDiff;

    // Permitir puntos negativos
    return maxPoints - penalty;
  },
  Component: SleepDashboard,
  HistoryComponent: SleepHistory,
};
