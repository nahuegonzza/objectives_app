'use client';

import { useEffect, useMemo, useState } from 'react';
import { getLocalDateString } from '@lib/dateHelpers';
import { parseAcademicData, DEFAULT_ACADEMIC_DATA, getLatestAcademicSubjects, AcademicSubject, AcademicEvent, AcademicTaskPriority } from './academicHelpers';
import type { ModuleEntry } from '@types';

interface UseAcademicModuleResult {
  loading: boolean;
  error: string | null;
  subjects: AcademicSubject[];
  todayEvents: AcademicEvent[];
  upcomingEvents: AcademicEvent[];
  pastEvents: AcademicEvent[];
  allEvents: AcademicEvent[];
  moduleEntries: ModuleEntry[];
  isSaving: boolean;
  saveSubjects: (updatedSubjects: AcademicSubject[]) => Promise<void>;
  addEvent: (event: AcademicEvent) => Promise<void>;
  toggleEventCompleted: (event: AcademicEvent) => Promise<void>;
  discardEvent: (event: AcademicEvent) => Promise<void>;
  deleteSubject: (subjectId: string) => Promise<void>;
}

export function useAcademicModule(
  moduleId: string,
  moduleSlug: string,
  selectedDate: string,
  config: Record<string, unknown>
): UseAcademicModuleResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allEntries, setAllEntries] = useState<ModuleEntry[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [todayEvents, setTodayEvents] = useState<AcademicEvent[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const todayKey = selectedDate.slice(0, 10);

  const getEventWeight = (event: AcademicEvent) => {
    if (event.type === 'exam') {
      switch (event.examType) {
        case 'final':
          return 0;
        case 'recuperatorio':
          return 1;
        case 'parcial':
        default:
          return 2;
      }
    } else {
      // task
      switch (event.priority) {
        case 'alta':
          return 3;
        case 'media':
          return 4;
        case 'baja':
        default:
          return 5;
      }
    }
  };

  const sortAcademicEvents = (events: AcademicEvent[]) => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.date.slice(0, 10)).getTime();
      const dateB = new Date(b.date.slice(0, 10)).getTime();
      if (dateA !== dateB) return dateA - dateB;

      const weightA = getEventWeight(a);
      const weightB = getEventWeight(b);
      if (weightA !== weightB) return weightA - weightB;

      return a.title.localeCompare(b.title);
    });
  };

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/moduleEntries?module=${moduleSlug}`, { cache: 'no-store', credentials: 'include' });
        if (!res.ok) {
          throw new Error('No se pudieron cargar los datos académicos');
        }

        const entries: ModuleEntry[] = await res.json();
        setAllEntries(entries);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setLoading(false);
      }
    }

    if (moduleId) {
      loadEntries();
    }
  }, [moduleId, moduleSlug, selectedDate]);

  useEffect(() => {
    const currentEntry = allEntries.find((entry) => entry.date.slice(0, 10) === todayKey);
    const subjectSource = getLatestAcademicSubjects(allEntries, todayKey);
    setSubjects(subjectSource);
    if (currentEntry) {
      setTodayEvents(sortAcademicEvents(parseAcademicData(currentEntry.data).events));
    } else {
      setTodayEvents([]);
    }
  }, [allEntries, todayKey]);

  const allEvents = useMemo(() => {
    return allEntries.flatMap((entry) => parseAcademicData(entry.data).events);
  }, [allEntries]);

  const upcomingEvents = useMemo(() => {
    const today = new Date(todayKey);
    return sortAcademicEvents(
      allEvents.filter((event) => {
        const eventDate = new Date(event.date.slice(0, 10));
        return eventDate > today;
      })
    );
  }, [allEvents, todayKey]);

  const pastEvents = useMemo(() => {
    const today = new Date(todayKey);
    return sortAcademicEvents(
      allEvents.filter((event) => {
        const eventDate = new Date(event.date.slice(0, 10));
        return eventDate < today && !event.completed;
      })
    );
  }, [allEvents, todayKey]);

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/moduleEntries?module=${moduleSlug}`, { cache: 'no-store', credentials: 'include' });
      if (!res.ok) throw new Error('No se pudieron recargar los datos académicos');
      const entries: ModuleEntry[] = await res.json();
      setAllEntries(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async (date: string, entrySubjects: AcademicSubject[], entryEvents: AcademicEvent[]) => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await fetch('/api/moduleEntries', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          date,
          data: { subjects: entrySubjects, events: entryEvents }
        })
      });

      if (!result.ok) {
        const json = await result.json().catch(() => null);
        throw new Error(json?.error || 'Error guardando los datos académicos');
      }

      const savedEntry: ModuleEntry = await result.json();
      setAllEntries((previous) => {
        const filtered = previous.filter((entry) => entry.id !== savedEntry.id);
        return [...filtered, savedEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSubjects = async (updatedSubjects: AcademicSubject[]) => {
    const currentEntry = allEntries.find((entry) => entry.date.slice(0, 10) === todayKey);
    const currentEvents = currentEntry ? parseAcademicData(currentEntry.data).events : [];
    setSubjects(updatedSubjects);
    await saveEntry(selectedDate, updatedSubjects, currentEvents);
  };

  const addEvent = async (event: AcademicEvent) => {
    const entryDate = event.date.slice(0, 10) || getLocalDateString();
    const targetEntry = allEntries.find((entry) => entry.date.slice(0, 10) === entryDate);
    const existingData = targetEntry ? parseAcademicData(targetEntry.data) : DEFAULT_ACADEMIC_DATA;
    const eventExistsInTarget = existingData.events.some((currentEvent) => currentEvent.id === event.id);

    const nextEvents = eventExistsInTarget
      ? existingData.events.map((currentEvent) => (currentEvent.id === event.id ? event : currentEvent))
      : [...existingData.events, event];

    const subjectsToSave = existingData.subjects.length ? existingData.subjects : subjects;

    const originalEntry = allEntries.find((entry) =>
      parseAcademicData(entry.data).events.some((currentEvent) => currentEvent.id === event.id)
    );

    if (originalEntry && originalEntry.date.slice(0, 10) !== entryDate) {
      const originalData = parseAcademicData(originalEntry.data);
      const updatedOriginalEvents = originalData.events.filter((currentEvent) => currentEvent.id !== event.id);
      await saveEntry(originalEntry.date.slice(0, 10), originalData.subjects, updatedOriginalEvents);
    }

    await saveEntry(entryDate, subjectsToSave, nextEvents);
  };

  const toggleEventCompleted = async (event: AcademicEvent) => {
    // Optimistic update
    const entryDate = event.date.slice(0, 10);
    const targetEntry = allEntries.find((entry) => entry.date.slice(0, 10) === entryDate);
    const existingData = targetEntry ? parseAcademicData(targetEntry.data) : DEFAULT_ACADEMIC_DATA;

    // Update local state immediately
    const updatedEvents = existingData.events.map((currentEvent) =>
      currentEvent.id === event.id ? { ...currentEvent, completed: !currentEvent.completed } : currentEvent
    );

    // Update local state
    const updatedEntries = allEntries.map(entry =>
      entry.date.slice(0, 10) === entryDate
        ? { ...entry, data: JSON.stringify({ subjects: existingData.subjects, events: updatedEvents }) }
        : entry
    );
    setAllEntries(updatedEntries);

    try {
      await saveEntry(entryDate, existingData.subjects, updatedEvents);
    } catch (err) {
      // Revert on error
      setAllEntries(allEntries);
      setError(err instanceof Error ? err.message : 'Error inesperado');
    }
  };

  const discardEvent = async (event: AcademicEvent) => {
    const entryDate = event.date.slice(0, 10);
    const targetEntry = allEntries.find((entry) => entry.date.slice(0, 10) === entryDate);
    const existingData = targetEntry ? parseAcademicData(targetEntry.data) : DEFAULT_ACADEMIC_DATA;
    const updatedEvents = existingData.events.filter((currentEvent) => currentEvent.id !== event.id);
    await saveEntry(entryDate, existingData.subjects, updatedEvents);
  };

  const deleteSubject = async (subjectId: string) => {
    const currentEntry = allEntries.find((entry) => entry.date.slice(0, 10) === todayKey);
    const existingData = currentEntry ? parseAcademicData(currentEntry.data) : DEFAULT_ACADEMIC_DATA;
    const updatedSubjects = existingData.subjects.filter((subject) => subject.id !== subjectId);
    const updatedEvents = existingData.events.filter((event) => event.subjectId !== subjectId);
    setSubjects(updatedSubjects);
    await saveEntry(selectedDate, updatedSubjects, updatedEvents);
  };

  return {
    loading,
    error,
    subjects,
    todayEvents,
    upcomingEvents,
    pastEvents,
    allEvents,
    moduleEntries: allEntries,
    isSaving,
    saveSubjects,
    addEvent,
    toggleEventCompleted,
    discardEvent,
    deleteSubject
  };
}
