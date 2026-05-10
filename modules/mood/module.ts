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
      { id: 'happy', title: 'Contento', emoji: '😊', color: '#22c55e', points: 1 },
      { id: 'sad', title: 'Triste', emoji: '😢', color: '#3b82f6', points: 1 },
      { id: 'sick', title: 'Enfermo', emoji: '🤒', color: '#ef4444', points: 1 },
      { id: 'tired', title: 'Cansado', emoji: '😴', color: '#f59e0b', points: 1 },
      { id: 'energetic', title: 'Enérgico', emoji: '⚡', color: '#a855f7', points: 1 },
      { id: 'calm', title: 'Tranquilo', emoji: '😌', color: '#06b6d4', points: 1 },
    ],
    maxPoints: 1, // Un punto por registrar cualquier estado
  },
  calculateScore: (entries: ModuleEntry[], config: Record<string, unknown>, targetDate?: string) => {
    const target = targetDate || new Date().toISOString().slice(0, 10);
    
    const todayEntry = entries.find(e => {
      const entryDate = e.date.slice(0, 10);
      return entryDate === target;
    });
    
    if (todayEntry) {
      const data = JSON.parse(todayEntry.data);
      const moodId = data.moodId;
      
      // Si no hay moodId seleccionado, devolver 0 puntos
      if (!moodId) {
        return 0;
      }
      
      const states = config.states as Array<{ id: string; points: number }>;
      const selectedState = states?.find(s => s.id === moodId);
      return selectedState?.points || 0; // Cambiar fallback de 1 a 0
    }
    
    return 0;
  },
  Component: MoodDashboard,
  HistoryComponent: MoodHistory,
};