'use client';

import { useState } from 'react';
import type { AcademicSubject } from './academicHelpers';

interface AcademicConfigProps {
  config: Record<string, unknown>;
  onSave: (newConfig: Record<string, unknown>) => void;
  onClose: () => void;
}

export function AcademicConfig({ config, onSave, onClose }: AcademicConfigProps) {
  const [subjects, setSubjects] = useState<AcademicSubject[]>((config.subjects as AcademicSubject[]) || []);
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (id: string, field: keyof AcademicSubject, value: string) => {
    setSubjects((current) =>
      current.map((subject) => (subject.id === id ? { ...subject, [field]: value } : subject))
    );
  };

  const handleAddSubject = () => {
    const nextSubject: AcademicSubject = {
      id: crypto.randomUUID(),
      name: '',
      color: '#2563eb',
      semester: '1'
    };
    setSubjects((current) => [...current, nextSubject]);
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects((current) => current.filter((subject) => subject.id !== subjectId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      onSave({ subjects });
    } catch (error) {
      console.error('Error saving academic config:', error);
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
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            ✕
          </button>
        </div>

        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Configura tus materias y asigna los colores que se usarán en las tarjetas.
        </p>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Materias</h3>
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
            subjects.map((subject) => (
              <div key={subject.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_0.5fr_0.5fr_auto] dark:border-slate-700 dark:bg-slate-900">
              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Nombre</label>
                <input
                  value={subject.name}
                  onChange={(e) => handleFieldChange(subject.id, 'name', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  placeholder="Nombre de la materia"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Cuatrimestre</label>
                <input
                  value={subject.semester}
                  onChange={(e) => handleFieldChange(subject.id, 'semester', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  placeholder="Ej. 1º"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Color</label>
                <input
                  type="color"
                  value={subject.color}
                  onChange={(e) => handleFieldChange(subject.id, 'color', e.target.value)}
                  className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-1 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSubject(subject.id)}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-700/40 dark:bg-rose-950/50 dark:text-rose-300"
                >
                  Eliminar
                </button>
            </div>
          ))
        )}
      </div>

        <div className="mt-6 flex justify-end gap-3">
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
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
    </div>
  );
}
