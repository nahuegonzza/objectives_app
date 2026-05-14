import type { ModuleDefinition, ModuleEntry } from '@types';
import { AcademicDashboard } from './AcademicDashboard';
import { getAcademicEventsForCalendar, parseAcademicData, AcademicEvent } from './academicHelpers';

const defaultConfig = {
  examPoints: {
    parcial: 3,
    final: 4,
    recuperatorio: 2,
    exposicion: 3,
    regular: 2,
    oral: 3
  },
  taskPoints: {
    alta: 2,
    media: 1.5,
    baja: 1
  }
};

function getEventScore(event: AcademicEvent, config: Record<string, unknown>): number {
  if (!event.completed) return 0;

  const examPoints = (config.examPoints as Record<string, number>) || defaultConfig.examPoints;
  const taskPoints = (config.taskPoints as Record<string, number>) || defaultConfig.taskPoints;

  if (event.type === 'exam') {
    return examPoints[event.examType ?? 'parcial'] ?? 2;
  }

  return taskPoints[event.priority ?? 'media'] ?? 1;
}

export const academicModule: ModuleDefinition = {
  slug: 'academic',
  name: 'Gestión Universitaria',
  description: 'Seguimiento de materias, exámenes (parciales) y tareas con visualización diaria.',
  supportedEvents: ['academic_event'],
  defaultConfig,
  calculateScore: (entries: ModuleEntry[], config: Record<string, unknown>, targetDate?: string) => {
    const target = targetDate || new Date().toISOString().slice(0, 10);
    const targetKey = target.slice(0, 10);

    return entries.reduce((sum, entry) => {
      const entryDate = entry.date.slice(0, 10);
      if (entryDate !== targetKey) return sum;
      const data = parseAcademicData(entry.data);
      return data.events.reduce((eventSum, event) => eventSum + getEventScore(event, config), 0);
    }, 0);
  },
  Component: AcademicDashboard
};

export { getAcademicEventsForCalendar };
