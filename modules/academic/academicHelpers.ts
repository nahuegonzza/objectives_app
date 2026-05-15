import type { ModuleEntry } from '@types';

export type AcademicEventType = 'exam' | 'task';
export type AcademicExamType = 'parcial' | 'final' | 'recuperatorio' | 'exposicion' | 'regular' | 'oral';
export type AcademicTaskPriority = 'alta' | 'media' | 'baja';
export type AcademicTaskDuration = 'corta' | 'media' | 'extensa' | 'lectura' | 'escritura' | 'codigo' | 'practica';

export const DEFAULT_ACADEMIC_EXAM_TYPES: AcademicTypeConfig[] = [
  { id: 'exam-parcial', key: 'parcial', label: 'Parcial', points: 3, color: '#0ea5e9' },
  { id: 'exam-final', key: 'final', label: 'Final', points: 4, color: '#22c55e' },
  { id: 'exam-recuperatorio', key: 'recuperatorio', label: 'Recuperatorio', points: 2, color: '#8b5cf6' },
  { id: 'exam-exposicion', key: 'exposicion', label: 'Exposición', points: 3, color: '#f97316' },
  { id: 'exam-regular', key: 'regular', label: 'Regular', points: 2, color: '#6366f1' },
  { id: 'exam-oral', key: 'oral', label: 'Oral', points: 3, color: '#d946ef' },
];

export const DEFAULT_ACADEMIC_TASK_TYPES: AcademicTypeConfig[] = [
  { id: 'task-corta', key: 'corta', label: 'Corta', points: 2, color: '#facc15' },
  { id: 'task-media', key: 'media', label: 'Media', points: 1.5, color: '#14b8a6' },
  { id: 'task-extensa', key: 'extensa', label: 'Extensa', points: 1, color: '#7c3aed' },
  { id: 'task-lectura', key: 'lectura', label: 'Lectura', points: 1.5, color: '#f97316' },
  { id: 'task-escritura', key: 'escritura', label: 'Escritura', points: 1.5, color: '#2563eb' },
  { id: 'task-codigo', key: 'codigo', label: 'Código', points: 2, color: '#0ea5e9' },
  { id: 'task-practica', key: 'practica', label: 'Práctica', points: 2, color: '#22c55e' },
];

const isTypeConfigArray = (value: unknown): value is AcademicTypeConfig[] =>
  Array.isArray(value) && value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as any).id === 'string' &&
      typeof (item as any).key === 'string' &&
      typeof (item as any).label === 'string' &&
      typeof (item as any).points === 'number' &&
      typeof (item as any).color === 'string'
  );

export function getAcademicExamTypes(config?: Record<string, unknown>): AcademicTypeConfig[] {
  const configExamTypes = (config?.examTypes as unknown);
  if (isTypeConfigArray(configExamTypes) && configExamTypes.length > 0) {
    return configExamTypes;
  }

  const legacyPoints = config?.examPoints as Record<string, number> | undefined;
  return DEFAULT_ACADEMIC_EXAM_TYPES.map((item) => ({
    ...item,
    points: legacyPoints?.[item.key] ?? item.points,
  }));
}

export function getAcademicTaskTypes(config?: Record<string, unknown>): AcademicTypeConfig[] {
  const configTaskTypes = (config?.taskTypes as unknown);
  if (isTypeConfigArray(configTaskTypes) && configTaskTypes.length > 0) {
    return configTaskTypes;
  }

  const legacyPoints = config?.taskPoints as Record<string, number> | undefined;
  return DEFAULT_ACADEMIC_TASK_TYPES.map((item) => ({
    ...item,
    points: legacyPoints?.[item.key] ?? item.points,
  }));
}

export function getAcademicExamTypeConfig(config: Record<string, unknown> | undefined, key: string | undefined): AcademicTypeConfig {
  return getAcademicExamTypes(config).find((item) => item.key === key) ?? DEFAULT_ACADEMIC_EXAM_TYPES[0];
}

export function getAcademicTaskTypeConfig(config: Record<string, unknown> | undefined, key: string | undefined): AcademicTypeConfig {
  return getAcademicTaskTypes(config).find((item) => item.key === key) ?? DEFAULT_ACADEMIC_TASK_TYPES[1];
}

export function getAcademicExamTypeLabel(config: Record<string, unknown> | undefined, key: string | undefined): string {
  return getAcademicExamTypeConfig(config, key).label;
}

export function getAcademicTaskTypeLabel(config: Record<string, unknown> | undefined, key: string | undefined): string {
  return getAcademicTaskTypeConfig(config, key).label;
}

export interface AcademicTypeConfig {
  id: string;
  key: string;
  label: string;
  points: number;
  color: string;
}

export interface AcademicModuleConfig {
  examTypes?: AcademicTypeConfig[];
  taskTypes?: AcademicTypeConfig[];
  examPoints?: Record<string, number>;
  taskPoints?: Record<string, number>;
  [key: string]: unknown;
}

export interface AcademicSubject {
  id: string;
  name: string;
  color: string;
  semester: string;
}

export interface AcademicEvent {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
  type: AcademicEventType;
  examType?: AcademicExamType;
  priority?: AcademicTaskPriority;
  estimatedDuration?: AcademicTaskDuration;
}

export interface AcademicData {
  subjects: AcademicSubject[];
  events: AcademicEvent[];
}

export interface AcademicCalendarEvent {
  title: string;
  start: string;
  end: string;
  color: string;
  type: AcademicEventType;
  description?: string;
  subjectName?: string;
}

export const DEFAULT_ACADEMIC_DATA: AcademicData = {
  subjects: [],
  events: []
};

export function parseAcademicData(data: string | null | undefined): AcademicData {
  if (!data) return DEFAULT_ACADEMIC_DATA;

  try {
    const parsed = JSON.parse(data);
    return {
      subjects: Array.isArray(parsed?.subjects) ? parsed.subjects : [],
      events: Array.isArray(parsed?.events) ? parsed.events : []
    };
  } catch (error) {
    return DEFAULT_ACADEMIC_DATA;
  }
}

export function getAcademicExamTypeLabel(type: AcademicExamType | undefined): string {
  switch (type) {
    case 'final':
      return 'Final';
    case 'recuperatorio':
      return 'Recuperatorio';
    case 'exposicion':
      return 'Exposición';
    case 'regular':
      return 'Regular';
    case 'oral':
      return 'Oral';
    case 'parcial':
    default:
      return 'Parcial';
  }
}

export function getAcademicEventLabel(event: AcademicEvent): string {
  if (event.type === 'exam') {
    return `${getAcademicExamTypeLabel(event.examType)} de ${event.title}`;
  }

  return `Entrega de ${event.title}`;
}

export function getAcademicEventColor(subject: AcademicSubject | undefined, event: AcademicEvent): string {
  if (subject?.color) return subject.color;

  return event.type === 'exam' ? '#f97316' : '#22c55e';
}

export function getAcademicEventsForCalendar(entries: ModuleEntry[]): AcademicCalendarEvent[] {
  return entries.flatMap((entry) => {
    const data = parseAcademicData(entry.data);
    return data.events.map((event) => {
      const subject = data.subjects.find((subjectItem) => subjectItem.id === event.subjectId);
      const title = subject ? `${subject.name} • ${getAcademicEventLabel(event)}` : getAcademicEventLabel(event);
      const color = getAcademicEventColor(subject, event);
      const startDate = event.date.slice(0, 10);

      return {
        title,
        start: startDate,
        end: startDate,
        color,
        type: event.type,
        description: event.description,
        subjectName: subject?.name
      };
    });
  });
}

export function getLatestAcademicSubjects(entries: ModuleEntry[], currentDate: string): AcademicSubject[] {
  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const currentEntry = sorted.find((entry) => entry.date.slice(0, 10) === currentDate);
  if (currentEntry) {
    const parsed = parseAcademicData(currentEntry.data);
    if (parsed.subjects.length) return parsed.subjects;
  }

  const fallbackEntry = sorted.find((entry) => {
    const parsed = parseAcademicData(entry.data);
    return parsed.subjects.length > 0;
  });

  return fallbackEntry ? parseAcademicData(fallbackEntry.data).subjects : [];
}

export function getAcademicEventsForDate(entries: ModuleEntry[], targetDate: string): AcademicEvent[] {
  const targetKey = targetDate.slice(0, 10);
  const entry = entries.find((entryItem) => entryItem.date.slice(0, 10) === targetKey);
  return entry ? parseAcademicData(entry.data).events : [];
}

