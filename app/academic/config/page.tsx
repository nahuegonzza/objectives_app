'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@components/Navigation';
import { useSupabaseSession } from '@hooks/useSupabaseSession';
import { AcademicConfig } from '@modules/academic/AcademicConfig';
import { AcademicEventForm } from '@modules/academic/AcademicEventForm';
import { AcademicSubject } from '@modules/academic/academicHelpers';

export default function AcademicConfigPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSupabaseSession();

  // Estado local para simular la funcionalidad
  const [subjects, setSubjects] = useState<AcademicSubject[]>([
    { id: '1', name: 'Matemáticas', color: '#3B82F6' },
    { id: '2', name: 'Física', color: '#EF4444' },
    { id: '3', name: 'Programación', color: '#10B981' }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, sessionLoading, router]);

  const handleSaveSubjects = async (updatedSubjects: AcademicSubject[]) => {
    setIsSaving(true);
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubjects(updatedSubjects);
    setIsSaving(false);
  };

  const handleDeleteSubject = async (subjectId: string) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
  };

  const handleAddEvent = async (eventData: any) => {
    setIsSaving(true);
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    console.log('Evento agregado:', eventData);
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Cargando configuración académica...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configuración Académica</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Gestiona tus materias, exámenes y tareas universitarias
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            ← Volver
          </button>
        </div>

        <div className="space-y-8">
          <AcademicConfig
            subjects={subjects}
            onSaveSubjects={handleSaveSubjects}
            onDeleteSubject={handleDeleteSubject}
          />

          <AcademicEventForm
            subjects={subjects}
            onAddEvent={handleAddEvent}
            isSaving={isSaving}
          />

          {/* Resumen de eventos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Vista previa</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Esta es una vista previa de la configuración. Los datos se guardarán cuando integres con la API completa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}