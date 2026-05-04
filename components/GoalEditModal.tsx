'use client';

import { useState, useEffect } from 'react';
import type { Goal } from '@types';
import GoalForm from '@components/GoalForm';

interface GoalEditModalProps {
  goal: Goal | null;
  onSave: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  onClose: () => void;
}

export function GoalEditModal({ goal, onSave, onClose }: GoalEditModalProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!goal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all">

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">🎯 Editar objetivo</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Actualiza los detalles del objetivo y guarda los cambios.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isDirty || window.confirm('Hay cambios sin guardar. ¿Deseas cerrar sin guardar?')) {
                onClose();
              }
            }}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <GoalForm
          initialData={goal}
          submitLabel="Guardar"
          onSubmit={async (payload) => {
            try {
              await onSave(goal.id, payload);
              setMessage('✓ Objetivo actualizado');
              setMessageType('success');
              return { success: true };
            } catch (error) {
              setMessage('Error al guardar');
              setMessageType('error');
              return {
                success: false,
                message: error instanceof Error ? error.message : 'Error al guardar el objetivo'
              };
            }
          }}
          onSuccess={onClose}
          onCancel={onClose}
          onDirtyChange={setIsDirty}
        />

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
        )}
      </div>
    </div>
  );
}
