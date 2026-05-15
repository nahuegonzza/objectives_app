"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Reorder, useDragControls } from 'framer-motion';
import { getLocalDateString } from "@lib/dateHelpers";
import type { AcademicSubject, AcademicModuleConfig, AcademicTypeConfig } from "./academicHelpers";
import { getAcademicExamTypes, getAcademicTaskTypes } from "./academicHelpers";
import { useAcademicModule } from "./useAcademicModule";
import UnifiedColorPicker from '@components/UnifiedColorPicker';
import UnsavedChangesModal from '@components/UnsavedChangesModal';

interface AcademicConfigProps {
  config?: AcademicModuleConfig;
  moduleId?: string;
  moduleName?: string;
  onSave?: (newConfig: AcademicModuleConfig) => Promise<boolean>;
  onClose?: () => void;
}

// Icono simple para botón eliminar (igual que en MoodConfig)
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

// Top-level item component mirroring MoodStateReorderItem (no emoji)
function AcademicTypeReorderItemTop({
  type,
  isDragging,
  onDragStart,
  onDragEnd,
  onUpdate,
  onDelete,
}: {
  type: AcademicTypeConfig;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onUpdate: (id: string, field: keyof AcademicTypeConfig, value: string | number) => void;
  onDelete: (id: string) => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={type.id}
      value={type.id}
      layout={isDragging ? undefined : true}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 180, bounceDamping: 25, timeConstant: 20 }}
      whileDrag={{ scale: 1.02, boxShadow: '0 18px 40px rgba(5, 150, 105, 0.18)' }}
      onDragEnd={onDragEnd}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-2 pr-3 dark:border-slate-700/50 dark:bg-slate-800/50"
    >
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={type.label}
          onChange={(e) => onUpdate(type.id, 'label', e.target.value)}
          className="flex-1 min-w-0 bg-transparent py-2 text-base font-medium text-slate-700 outline-none dark:text-slate-200"
          placeholder="Nombre del tipo..."
        />
      </div>

      <input
        type="number"
        value={type.points}
        onChange={(e) => onUpdate(type.id, 'points', Number(e.target.value))}
        className="w-16 bg-transparent py-2 text-base font-medium text-slate-700 outline-none dark:text-slate-200 border border-slate-300 rounded px-2"
        placeholder="1"
        min="0"
        step="0.5"
      />

      <div className="flex items-center gap-2">
        <div className="min-w-[3rem]">
          <UnifiedColorPicker value={type.color} onChange={(color) => onUpdate(type.id, 'color', color)} />
        </div>
        <button
          type="button"
          onClick={() => onDelete(type.id)}
          className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <TrashIcon />
        </button>
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            onDragStart(type.id);
            dragControls.start(event, { snapToCursor: true });
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[#059669] transition hover:border-[#059669] hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 touch-none"
          aria-label="Arrastrar"
        >
          <span className="text-lg">≡</span>
        </button>
      </div>
    </Reorder.Item>
  );
}

export function AcademicConfig({
  config,
  moduleId,
  moduleName,
  onSave,
  onClose,
}: AcademicConfigProps) {
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"subjects" | "scoring">("subjects");
  const [error, setError] = useState('');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  // Configuración de scoring
  const [examTypes, setExamTypes] = useState<AcademicTypeConfig[]>([]);
  const [taskTypes, setTaskTypes] = useState<AcademicTypeConfig[]>([]);
  const [draggingExamId, setDraggingExamId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  // Cargar materias desde moduleEntries si moduleId está disponible
  const todayDate = getLocalDateString();
  const academicModule = useAcademicModule(
    moduleId || "",
    "academic",
    todayDate,
    config || {}
  );

  const initialSubjects = useMemo(
    () => academicModule.subjects ?? subjects,
    [academicModule.subjects, subjects]
  );

  const initialExamTypes = useMemo(() => getAcademicExamTypes(config), [config]);
  const initialTaskTypes = useMemo(() => getAcademicTaskTypes(config), [config]);

  const isDirty =
    JSON.stringify(subjects) !== JSON.stringify(initialSubjects) ||
    JSON.stringify(examTypes) !== JSON.stringify(initialExamTypes) ||
    JSON.stringify(taskTypes) !== JSON.stringify(initialTaskTypes);

  useEffect(() => {
    if (academicModule.subjects && academicModule.subjects.length > 0) {
      setSubjects(academicModule.subjects);
    }
  }, [academicModule.subjects]);

  useEffect(() => {
    setExamTypes(initialExamTypes);
    setTaskTypes(initialTaskTypes);
  }, [initialExamTypes, initialTaskTypes]);

  const handleFieldChange = (
    id: string,
    field: keyof AcademicSubject,
    value: string
  ) => {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === id ? { ...subject, [field]: value } : subject
      )
    );
  };

  const handleAddSubject = () => {
    const nextSubject: AcademicSubject = {
      id: crypto.randomUUID(),
      name: "",
      color: "#2563eb",
      semester: "1",
    };
    setSubjects((current) => [...current, nextSubject]);
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects((current) =>
      current.filter((subject) => subject.id !== subjectId)
    );
  };

  const handleExamTypeChange = (
    id: string,
    field: keyof AcademicTypeConfig,
    value: string | number
  ) => {
    setExamTypes((current) =>
      current.map((type) =>
        type.id === id ? { ...type, [field]: value } : type
      )
    );
  };

  const handleTaskTypeChange = (
    id: string,
    field: keyof AcademicTypeConfig,
    value: string | number
  ) => {
    setTaskTypes((current) =>
      current.map((type) =>
        type.id === id ? { ...type, [field]: value } : type
      )
    );
  };

  const handleAddExamType = () => {
    setExamTypes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        key: `examen_${Date.now()}`,
        label: '',
        points: 2,
        color: '#ffffff',
      },
    ]);
  };

  const handleAddTaskType = () => {
    setTaskTypes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        key: `tarea_${Date.now()}`,
        label: '',
        points: 1,
        color: '#ffffff',
      },
    ]);
  };

  const handleDeleteExamType = (typeId: string) => {
    // Safe deletion: update any module entries that reference this examType.key
    const type = examTypes.find((t) => t.id === typeId);
    if (!type) return;
    if (examTypes.length <= 1) return;
    setError('');
    (async () => {
      try {
        const res = await fetch('/api/moduleEntries?module=academic', { credentials: 'include' });
        if (res.ok) {
          const entries = await res.json();
          const entriesToUpdate = entries.filter((entry: any) => {
            try {
              const data = JSON.parse(entry.data);
              return Array.isArray(data.events) && data.events.some((e: any) => e.type === 'exam' && e.examType === type.key);
            } catch {
              return false;
            }
          });

          const updatePromises = entriesToUpdate.map((entry: any) => {
            try {
              const data = JSON.parse(entry.data);
              const newData = { ...data, events: data.events.map((e: any) => (e.type === 'exam' && e.examType === type.key ? { ...e, examType: undefined } : e)) };
              return fetch('/api/moduleEntries', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId: entry.moduleId, date: entry.date.slice(0, 10), data: newData }),
              });
            } catch {
              return Promise.resolve();
            }
          });

          await Promise.all(updatePromises);
        }
      } catch (err) {
        // ignore
      }
      setExamTypes((current) => current.filter((t) => t.id !== typeId));
    })();
  };

  const handleDeleteTaskType = (typeId: string) => {
    const type = taskTypes.find((t) => t.id === typeId);
    if (!type) return;
    if (taskTypes.length <= 1) return;
    setError('');
    (async () => {
      try {
        const res = await fetch('/api/moduleEntries?module=academic', { credentials: 'include' });
        if (res.ok) {
          const entries = await res.json();
          const entriesToUpdate = entries.filter((entry: any) => {
            try {
              const data = JSON.parse(entry.data);
              return Array.isArray(data.events) && data.events.some((e: any) => e.type === 'task' && e.estimatedDuration === type.key);
            } catch {
              return false;
            }
          });

          const updatePromises = entriesToUpdate.map((entry: any) => {
            try {
              const data = JSON.parse(entry.data);
              const newData = { ...data, events: data.events.map((e: any) => (e.type === 'task' && e.estimatedDuration === type.key ? { ...e, estimatedDuration: undefined } : e)) };
              return fetch('/api/moduleEntries', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId: entry.moduleId, date: entry.date.slice(0, 10), data: newData }),
              });
            } catch {
              return Promise.resolve();
            }
          });

          await Promise.all(updatePromises);
        }
      } catch (err) {
        // ignore
      }
      setTaskTypes((current) => current.filter((t) => t.id !== typeId));
    })();
  };

  const reorderById = <T extends { id: string }>(items: T[], nextIds: string[]) =>
    nextIds.map((id) => items.find((it) => it.id === id)).filter((it): it is T => Boolean(it));

  const handleExamTypesReorder = (nextIds: string[]) => {
    setExamTypes((current) => reorderById(current, nextIds));
  };

  const handleTaskTypesReorder = (nextIds: string[]) => {
    setTaskTypes((current) => reorderById(current, nextIds));
  };

  const handleDragStartExam = (id: string) => setDraggingExamId(id);
  const handleDragStartTask = (id: string) => setDraggingTaskId(id);

  const hasEmptyExamType = examTypes.some((t) => !t.label?.toString().trim());
  const canAddExamType = !hasEmptyExamType;
  const hasEmptyTaskType = taskTypes.some((t) => !t.label?.toString().trim());
  const canAddTaskType = !hasEmptyTaskType;

  const handleSave = async () => {
    if (hasEmptyExamType || hasEmptyTaskType) {
      setError('No se puede guardar mientras exista un tipo sin nombre.');
      return;
    }

    setSaving(true);
    try {
      const { examPoints, taskPoints, ...legacyConfig } = config || {};
      const newConfig: AcademicModuleConfig = {
        ...legacyConfig,
        examTypes,
        taskTypes,
      };

      // Primero guardar las materias si hay módulo ID
      if (moduleId && academicModule.saveSubjects) {
        await academicModule.saveSubjects(subjects);
      }

      // Luego guardar la configuración
      if (onSave) {
        const success = await onSave(newConfig);
        if (!success) {
          setError('No se pudo guardar la configuración.');
          return;
        }
      }

      onClose?.();
    } catch (error) {
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Subcomponent to mirror MoodConfig UI for each reorder item (no emoji)
  const AcademicTypeReorderItem: React.FC<{
    type: AcademicTypeConfig;
    isDragging: boolean;
    onDragStart: (id: string) => void;
    onDragEnd: () => void;
    onUpdate: (id: string, field: keyof AcademicTypeConfig, value: string | number) => void;
    onDelete: (id: string) => void;
  }> = ({ type, isDragging, onDragStart, onDragEnd, onUpdate, onDelete }) => {
    const dragControls = useDragControls();

    return (
      <Reorder.Item
        key={type.id}
        value={type.id}
        layout={isDragging ? undefined : true}
        dragListener={false}
        dragControls={dragControls}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 180, bounceDamping: 25, timeConstant: 20 }}
        whileDrag={{ scale: 1.02, boxShadow: '0 18px 40px rgba(5, 150, 105, 0.18)' }}
        onDragEnd={onDragEnd}
        className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-2 pr-3 dark:border-slate-700/50 dark:bg-slate-800/50"
      >
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={type.label}
            onChange={(e) => onUpdate(type.id, 'label', e.target.value)}
            className="flex-1 min-w-0 bg-transparent py-2 text-base font-medium text-slate-700 outline-none dark:text-slate-200"
            placeholder="Nombre del tipo..."
          />
        </div>

        <input
          type="number"
          value={type.points}
          onChange={(e) => onUpdate(type.id, 'points', Number(e.target.value))}
          className="w-16 bg-transparent py-2 text-base font-medium text-slate-700 outline-none dark:text-slate-200 border border-slate-300 rounded px-2"
          placeholder="1"
          min="0"
          step="0.5"
        />

        <div className="flex items-center gap-2">
          <div className="min-w-[3rem]">
            <UnifiedColorPicker value={type.color} onChange={(color) => onUpdate(type.id, 'color', color)} />
          </div>
          <button
            type="button"
            onClick={() => onDelete(type.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <TrashIcon />
          </button>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              onDragStart(type.id);
              dragControls.start(event, { snapToCursor: true });
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[#059669] transition hover:border-[#059669] hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 touch-none"
            aria-label="Arrastrar"
          >
            <span className="text-lg">≡</span>
          </button>
        </div>
      </Reorder.Item>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Configurar Gestión Universitaria
          </h2>
          <button
            onClick={() => {
              if (!isDirty) {
                onClose?.();
                return;
              }
              setShowUnsavedDialog(true);
            }}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab("subjects")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "subjects"
                ? "border-b-2 border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            Materias
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("scoring")}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "scoring"
                ? "border-b-2 border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            Puntuación
          </button>
        </div>

        {/* Tab: Subjects */}
        {activeTab === "subjects" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Tus Materias
              </h3>
              <button
                type="button"
                onClick={handleAddSubject}
                className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                + Nueva materia
              </button>
            </div>

            {subjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                Sin materias aún. Agrega una materia para empezar a planificar tus parciales y entregas.
              </div>
            ) : (
              <div className="space-y-3">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_0.5fr_0.5fr_auto] dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div>
                      <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        Nombre
                      </label>

              
                      <input
                        value={subject.name}
                        onChange={(e) =>
                          handleFieldChange(subject.id, "name", e.target.value)
                        }
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                        placeholder="Nombre de la materia"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        Cuatrimestre
                      </label>
                      <input
                        value={subject.semester}
                        onChange={(e) =>
                          handleFieldChange(subject.id, "semester", e.target.value)
                        }
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                        placeholder="Ej. 1º"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        Color
                      </label>
                      <div className="mt-1">
                        <UnifiedColorPicker
                          value={subject.color}
                          onChange={(color) =>
                            handleFieldChange(subject.id, "color", color)
                          }
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-700/40 dark:bg-rose-950/50 dark:text-rose-300"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Scoring */}
        {activeTab === "scoring" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Tipos de Examen</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Añade, edita y elimina los tipos de examen que se usarán en el módulo.</p>

                <div className="space-y-3 mt-3">
                  <Reorder.Group axis="y" values={examTypes.map((t) => t.id)} onReorder={handleExamTypesReorder} className="space-y-3">
                    {examTypes.map((type) => (
                      <AcademicTypeReorderItemTop
                        key={type.id}
                        type={type}
                        isDragging={draggingExamId === type.id}
                        onDragStart={handleDragStartExam}
                        onDragEnd={() => setDraggingExamId(null)}
                        onUpdate={(id, field, value) => handleExamTypeChange(id, field, value)}
                        onDelete={(id) => handleDeleteExamType(id)}
                      />
                    ))}
                  </Reorder.Group>
                </div>

                <button
                  type="button"
                  onClick={handleAddExamType}
                  disabled={!canAddExamType}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-bold text-slate-500 transition-colors hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                >
                  <span>+</span> Agregar tipo de examen
                </button>

                {!canAddExamType && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">Completa el tipo pendiente antes de crear uno nuevo o guardar.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Tipos de Tarea
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Configura aquí los tipos de tarea que usarás en el planificador.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTaskType}
                  className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                >
                  + Nuevo tipo de tarea
                </button>
              </div>
              <div>
                <div className="space-y-3 mt-3">
                  <Reorder.Group axis="y" values={taskTypes.map((t) => t.id)} onReorder={handleTaskTypesReorder} className="space-y-3">
                    {taskTypes.map((type) => (
                      <AcademicTypeReorderItemTop
                        key={type.id}
                        type={type}
                        isDragging={draggingTaskId === type.id}
                        onDragStart={handleDragStartTask}
                        onDragEnd={() => setDraggingTaskId(null)}
                        onUpdate={(id, field, value) => handleTaskTypeChange(id, field, value)}
                        onDelete={(id) => handleDeleteTaskType(id)}
                      />
                    ))}
                  </Reorder.Group>
                </div>

                <button
                  type="button"
                  onClick={handleAddTaskType}
                  disabled={!canAddTaskType}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-bold text-slate-500 transition-colors hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                >
                  <span>+</span> Agregar tipo de tarea
                </button>

                {!canAddTaskType && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">Completa el tipo pendiente antes de crear uno nuevo o guardar.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (!isDirty) {
                onClose?.();
                return;
              }
              setShowUnsavedDialog(true);
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || hasEmptyExamType || hasEmptyTaskType}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white">
            {error}
          </div>
        )}

        <UnsavedChangesModal
          open={showUnsavedDialog}
          onKeepEditing={() => setShowUnsavedDialog(false)}
          onDiscard={() => {
            setShowUnsavedDialog(false);
            onClose?.();
          }}
        />
      </div>
    </div>
  );
}

