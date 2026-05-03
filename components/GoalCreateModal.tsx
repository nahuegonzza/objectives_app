'use client';

import GoalForm from '@components/GoalForm';

interface GoalCreateModalProps {
  onClose: () => void;
  onCreateSuccess: () => void;
}

export default function GoalCreateModal({ onClose, onCreateSuccess }: GoalCreateModalProps) {
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
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <GoalForm
          onSuccess={() => {
            onCreateSuccess();
          }}
        />
      </div>
    </div>
  );
}
