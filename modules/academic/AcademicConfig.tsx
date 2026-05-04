"use client";

import { useEffect, useState } from "react";
import { getLocalDateString } from "@lib/dateHelpers";
import type { AcademicSubject } from "./academicHelpers";
import { useAcademicModule } from "./useAcademicModule";
import UnifiedColorPicker from '@components/UnifiedColorPicker';

interface AcademicConfigProps {
  config?: Record<string, unknown>;
  moduleId?: string;
  moduleName?: string;
  onSave?: (newConfig: Record<string, unknown>) => void;
  onClose?: () => void;
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
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Configuración de scoring
  const [examPointsPartial, setExamPointsPartial] = useState(
    ((config?.examPoints as any)?.parcial ?? 5).toString()
  );
  const [examPointsFinal, setExamPointsFinal] = useState(
    ((config?.examPoints as any)?.final ?? 8).toString()
  );
  const [examPointsRecuperatorio, setExamPointsRecuperatorio] = useState(
    ((config?.examPoints as any)?.recuperatorio ?? 6).toString()
  );
  const [taskPointsAlta, setTaskPointsAlta] = useState(
    ((config?.taskPoints as any)?.alta ?? 4).toString()
  );
  const [taskPointsMedia, setTaskPointsMedia] = useState(
    ((config?.taskPoints as any)?.media ?? 2).toString()
  );
  const [taskPointsBaja, setTaskPointsBaja] = useState(
    ((config?.taskPoints as any)?.baja ?? 1).toString()
  );

  // Cargar materias desde moduleEntries si moduleId está disponible
  const todayDate = getLocalDateString();
  const academicModule = useAcademicModule(
    moduleId || "",
    "academic",
    todayDate,
    config || {}
  );

  useEffect(() => {
    if (academicModule.subjects && academicModule.subjects.length > 0) {
      setSubjects(academicModule.subjects);
    }
  }, [academicModule.subjects]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const newConfig = {
        ...config,
        subjects,
        examPoints: {
          parcial: Number(examPointsPartial),
          final: Number(examPointsFinal),
          recuperatorio: Number(examPointsRecuperatorio),
        },
        taskPoints: {
          alta: Number(taskPointsAlta),
          media: Number(taskPointsMedia),
          baja: Number(taskPointsBaja),
        },
      };

      // Primero guardar las materias si hay módulo ID
      if (moduleId && academicModule.saveSubjects) {
        await academicModule.saveSubjects(subjects);
      }

      // Luego guardar la configuración
      if (onSave) {
        onSave(newConfig);
      }

      setMessage('✓ Configuración guardada');
      setMessageType('success');
    } catch (error) {
      console.error("Error saving academic config:", error);
      setMessage('Error al guardar');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🎓</span>
            Configurar Gestión Universitaria
          </h2>
          <button
            onClick={onClose}
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
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configura tus materias y asigna los colores que se usarán en las tarjetas.
            </p>

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
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configura cuántos puntos otorga cada tipo de evento.
            </p>

            <div>
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
                Puntos por Examen
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                    Parcial
                  </label>
                  <input
                    type="number"
                    value={examPointsPartial}
                    onChange={(e) => setExamPointsPartial(e.target.value)}
                    min="0"
                    max="20"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                    Final
                  </label>
                  <input
                    type="number"
                    value={examPointsFinal}
                    onChange={(e) => setExamPointsFinal(e.target.value)}
                    min="0"
                    max="20"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                    Recuperatorio
                  </label>
                  <input
                    type="number"
                    value={examPointsRecuperatorio}
                    onChange={(e) => setExamPointsRecuperatorio(e.target.value)}
                    min="0"
                    max="20"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
                Puntos por Tarea (por prioridad)
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                    Alta Prioridad
                  </label>
                  <input
                    type="number"
                    value={taskPointsAlta}
                    onChange={(e) => setTaskPointsAlta(e.target.value)}
                    min="0"
                    max="20"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                    Media Prioridad
                  </label>
                  <input
                    type="number"
                    value={taskPointsMedia}
                    onChange={(e) => setTaskPointsMedia(e.target.value)}
                    min="0"
                    max="20"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                    Baja Prioridad
                  </label>
                  <input
                    type="number"
                    value={taskPointsBaja}
                    onChange={(e) => setTaskPointsBaja(e.target.value)}
                    min="0"
                    max="20"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
        {message && (
          <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 ${
              messageType === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {message}
          </div>
        )}      </div>
    </div>
  );
}
