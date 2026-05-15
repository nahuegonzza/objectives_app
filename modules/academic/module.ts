import type { ModuleDefinition, ModuleEntry } from '@types';
import { AcademicDashboard } from './AcademicDashboard';
import {
  getAcademicEventsForCalendar,
  parseAcademicData,
  AcademicEvent,
  AcademicModuleConfig,
  getAcademicExamTypeConfig,
  getAcademicTaskTypeConfig,
  DEFAULT_ACADEMIC_EXAM_TYPES,
  DEFAULT_ACADEMIC_TASK_TYPES,
} from './academicHelpers';

const defaultConfig: AcademicModuleConfig = {
  examTypes: DEFAULT_ACADEMIC_EXAM_TYPES,
  taskTypes: DEFAULT_ACADEMIC_TASK_TYPES,
};

function getEventScore(event: AcademicEvent, config: Record<string, unknown>): number {
  if (!event.completed) return 0;

  const examTypes = (config?.examTypes as { key: string; points: number }[]) ?? undefined;
  const taskTypes = (config?.taskTypes as { key: string; points: number }[]) ?? undefined;

  if (event.type === 'exam') {
    if (Array.isArray(examTypes) && examTypes.length > 0) {
      return getAcademicExamTypeConfig(config, event.examType ?? 'parcial').points ?? 2;
    }
    const legacyExamPoints = (config?.examPoints as Record<string, number>) || defaultConfig.examTypes?.reduce((acc, item) => {
      acc[item.key] = item.points;
      return acc;
    }, {} as Record<string, number>);
    return legacyExamPoints[event.examType ?? 'parcial'] ?? 2;
  }

  if (Array.isArray(taskTypes) && taskTypes.length > 0) {
    return getAcademicTaskTypeConfig(config, event.estimatedDuration ?? 'media').points ?? 1;
  }

  const legacyTaskPoints = (config?.taskPoints as Record<string, number>) || { alta: 2, media: 1.5, baja: 1 };
  return legacyTaskPoints[event.priority ?? 'media'] ?? 1;
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
