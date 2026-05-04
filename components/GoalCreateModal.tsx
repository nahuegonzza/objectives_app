'use client';

import { useState, useEffect } from 'react';
import GoalForm from '@components/GoalForm';

interface GoalCreateModalProps {
  onClose: () => void;
  onCreateSuccess: () => void;
}

export default function GoalCreateModal({ onClose, onCreateSuccess }: GoalCreateModalProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">🎯 Nuevo objetivo</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Crea un objetivo sin salir de la página y mantén tu flujo visual consistente.</p>
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
          submitLabel="Crear objetivo"
          onSubmit={async (payload) => {
            try {
              const response = await fetch('/api/goals', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });

              if (response.ok) {
                setMessage('✓ Objetivo creado');
                setMessageType('success');
                onCreateSuccess();
                return { success: true, message: 'Objetivo creado con éxito' };
              }

              const body = await response.json().catch(() => null);
              return { success: false, message: body?.error || body?.message || 'No se pudo crear el objetivo' };
            } catch (error) {
              return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
            }
          }}
          onSuccess={onCreateSuccess}
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
