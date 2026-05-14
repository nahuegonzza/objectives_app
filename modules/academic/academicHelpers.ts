import type { ModuleEntry } from '@types';

export type AcademicEventType = 'exam' | 'task';
export type AcademicExamType = 'parcial' | 'final' | 'recuperatorio' | 'exposicion' | 'regular' | 'oral';
export type AcademicTaskPriority = 'alta' | 'media' | 'baja';
export type AcademicTaskDuration = 'corta' | 'media' | 'extensa' | 'lectura' | 'escritura' | 'codigo' | 'practica';

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
    console.error('Error parsing academic module data', error);
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
