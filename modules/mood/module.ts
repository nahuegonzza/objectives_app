import type { ModuleDefinition, ModuleEntry } from '@types';
import { MoodDashboard } from './MoodDashboard';
import { MoodHistory } from './MoodHistory';

export const moodModule: ModuleDefinition = {
  slug: 'mood',
  name: 'Estado',
  description: 'Registra tu estado de ánimo diario: feliz, triste, enfermo, etc.',
  supportedEvents: ['mood_entry'],
  defaultConfig: {
    // Estados por defecto que el usuario puede modificar
    states: [
      { id: 'happy', title: 'Contento', emoji: '😊', color: '#22c55e' },
      { id: 'sad', title: 'Triste', emoji: '😢', color: '#3b82f6' },
      { id: 'sick', title: 'Enfermo', emoji: '🤒', color: '#ef4444' },
      { id: 'tired', title: 'Cansado', emoji: '😴', color: '#f59e0b' },
      { id: 'energetic', title: 'Enérgico', emoji: '⚡', color: '#a855f7' },
      { id: 'calm', title: 'Tranquilo', emoji: '😌', color: '#06b6d4' },
    ],
    maxPoints: 1, // Un punto por registrar cualquier estado
  },
  calculateScore: (entries: ModuleEntry[], config: Record<string, unknown>, targetDate?: string) => {
    const target = targetDate || new Date().toISOString().slice(0, 10);
    
    const todayEntry = entries.find(e => {
      const entryDate = e.date.slice(0, 10);
      return entryDate === target;
    });
    
    // Si hay una entrada para el día, dar puntos
    if (todayEntry) {
      return (config.maxPoints as number) || 1;
    }
    
    return 0;
  },
  Component: MoodDashboard,
  HistoryComponent: MoodHistory,
};