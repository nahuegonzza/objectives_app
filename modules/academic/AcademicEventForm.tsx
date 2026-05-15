'use client';

import { useEffect, useState } from 'react';
import { getLocalDateString } from '@lib/dateHelpers';
import type { AcademicEvent, AcademicSubject, AcademicEventType, AcademicExamType, AcademicTaskPriority, AcademicTaskDuration } from './academicHelpers';
import UnsavedChangesModal from '@components/UnsavedChangesModal';

interface ValidationModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
}

function ValidationModal({ open, title = 'Datos obligatorios', description = 'Por favor completa todos los campos requeridos.', onClose }: ValidationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-[28px] bg-white dark:bg-slate-900 p-6 shadow-2xl shadow-slate-900/20">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

interface AcademicEventFormProps {
  subjects: AcademicSubject[];
  event?: AcademicEvent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: AcademicEvent) => Promise<void>;
  isSaving?: boolean;
}

export function AcademicEventForm({
  subjects,
  event: initialEvent,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: AcademicEventFormProps) {
  const [eventType, setEventType] = useState<AcademicEventType>('task');
  const [examType, setExamType] = useState<AcademicExamType>('parcial');
  const [priority, setPriority] = useState<AcademicTaskPriority>('media');
  const [estimatedDuration, setEstimatedDuration] = useState<AcademicTaskDuration>('media');
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [completed, setCompleted] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  // Función para detectar si hay cambios pendientes
  const hasUnsavedChanges = () => {
    const defaultSubjectId = subjects.length > 0 ? subjects[0].id : '';

    if (initialEvent) {
      // Modo edición: comparar con valores iniciales
      return (
        eventType !== initialEvent.type ||
        examType !== (initialEvent.examType || 'parcial') ||
        priority !== (initialEvent.priority || 'media') ||
        estimatedDuration !== (initialEvent.estimatedDuration || 'media') ||
        subjectId !== initialEvent.subjectId ||
        title !== initialEvent.title ||
        description !== initialEvent.description ||
        date !== initialEvent.date.slice(0, 10) ||
        completed !== initialEvent.completed
      );
    } else {
      // Modo creación: comparar con valores por defecto
      return (
        eventType !== 'task' ||
        examType !== 'parcial' ||
        priority !== 'media' ||
        estimatedDuration !== 'media' ||
        subjectId !== defaultSubjectId ||
        title !== '' ||
        description !== '' ||
        date !== getLocalDateString() ||
        completed !== false
      );
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedChangesModal(false);
    onClose();
  };

  const handleKeepEditing = () => {
    setShowUnsavedChangesModal(false);
  };

  useEffect(() => {
    if (initialEvent) {
      setEventType(initialEvent.type);
      setExamType(initialEvent.examType || 'parcial');
      setPriority(initialEvent.priority || 'media');
      setEstimatedDuration(initialEvent.estimatedDuration || 'media');
      setSubjectId(initialEvent.subjectId);
      setTitle(initialEvent.title);
      setDescription(initialEvent.description);
      setDate(initialEvent.date.slice(0, 10));
      setCompleted(initialEvent.completed);
    } else {
      setEventType('task');
      setExamType('parcial');
      setPriority('media');
      setEstimatedDuration('media');
      setSubjectId(subjects.length > 0 ? subjects[0].id : '');
      setTitle('');
      setDescription('');
      setDate(getLocalDateString());
      setCompleted(false);
    }
    setShowValidationModal(false);
    setShowUnsavedChangesModal(false);
  }, [initialEvent, isOpen, subjects]);

  const handleSave = async () => {
    if (!subjectId || !title) {
      setShowValidationModal(true);
      return;
    }

    const event: AcademicEvent = {
      id: initialEvent?.id || crypto.randomUUID(),
      subjectId,
      title,
      description,
      date: date,
      completed: completed,
      type: eventType,
      ...(eventType === 'exam' ? { examType } : { priority, estimatedDuration }),
    };

    await onSave(event);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {initialEvent ? 'Editar Evento' : 'Nuevo Evento'}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-950/40 dark:text-rose-200">
            Agrega primero una materia en la configuración para poder crear eventos.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Tipo de evento */}
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                Tipo de evento
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEventType('exam')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    eventType === 'exam'
                      ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'border border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Examen
                </button>
                <button
                  type="button"
                  onClick={() => setEventType('task')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    eventType === 'task'
                      ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'border border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Tarea
                </button>
              </div>
            </div>

            {/* Materia */}
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                Materia *
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              >
                <option value="">Selecciona una materia</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Título */}
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Análisis Matemático I"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              />
            </div>

            {/* Tipo de examen o prioridad de tarea */}
            {eventType === 'exam' ? (
              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                  Tipo de examen
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as AcademicExamType)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                >
                  <option value="parcial">Parcial</option>
                  <option value="final">Final</option>
                  <option value="recuperatorio">Recuperatorio</option>
                  <option value="exposicion">Exposición</option>
                  <option value="regular">Regular</option>
                  <option value="oral">Oral</option>
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                    Tipo de tarea
                  </label>
                  <select
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value as AcademicTaskDuration)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  >
                    <option value="corta">Corta (15-30 min)</option>
                    <option value="media">Media (30-60 min)</option>
                    <option value="extensa">Extensa (1-2 horas)</option>
                    <option value="lectura">Lectura</option>
                    <option value="escritura">Escritura</option>
                    <option value="codigo">Código/Programación</option>
                    <option value="practica">Práctica/Ejercicios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                    Prioridad
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as AcademicTaskPriority)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </>
            )}

            {/* Fecha */}
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Agrega detalles sobre este evento..."
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900 resize-none"
              />
            </div>

            {/* Checkbox de completado (solo para tareas) */}
            {eventType === 'task' && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="completed"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-950 dark:focus:ring-emerald-400"
                />
                <label htmlFor="completed" className="text-sm text-slate-700 dark:text-slate-300">
                  Marcar como completada
                </label>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || subjects.length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : initialEvent ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>

      <ValidationModal
        open={showValidationModal}
        title="Datos obligatorios"
        description="Por favor completa la materia y el título antes de guardar el evento."
        onClose={() => setShowValidationModal(false)}
      />

      <UnsavedChangesModal
        open={showUnsavedChangesModal}
        title="Cambios sin guardar"
        description="Tienes cambios sin guardar en este evento. Si cierras ahora, perderás los cambios no guardados."
        onKeepEditing={handleKeepEditing}
        onDiscard={handleDiscardChanges}
      />
    </div>
  );
}
