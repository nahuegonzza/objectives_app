'use client';

import { useState } from 'react';
import type { Goal } from '@types';
import GoalForm from '@components/GoalForm';
import UnsavedChangesModal from '@components/UnsavedChangesModal';

interface GoalEditModalProps {
  goal: Goal | null;
  onSave: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  onSuccess: () => void;
  onClose: () => void;
}

export function GoalEditModal({ goal, onSave, onSuccess, onClose }: GoalEditModalProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  if (!goal) return null;

  const handleClose = () => {
    if (!isDirty) {
      onClose();
      return;
    }
    setShowUnsavedDialog(true);
  };

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
            onClick={handleClose}
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
              return { success: true };
            } catch (error) {
              return {
                success: false,
                message: error instanceof Error ? error.message : 'Error al guardar el objetivo'
              };
            }
          }}
          onSuccess={onSuccess}
          onCancel={onClose}
          onDirtyChange={setIsDirty}
        />

        <UnsavedChangesModal
          open={showUnsavedDialog}
          onKeepEditing={() => setShowUnsavedDialog(false)}
          onDiscard={() => {
            setShowUnsavedDialog(false);
            onClose();
          }}
        />

      </div>
    </div>
  );
}
