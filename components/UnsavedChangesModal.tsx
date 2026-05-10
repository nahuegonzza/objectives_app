'use client';

interface UnsavedChangesModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

export default function UnsavedChangesModal({
  open,
  title = 'Cambios sin guardar',
  description = 'Tienes cambios sin guardar. Si cierras ahora, perderás los cambios no guardados.',
  onKeepEditing,
  onDiscard,
}: UnsavedChangesModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-[28px] bg-white dark:bg-slate-900 p-6 shadow-2xl shadow-slate-900/20">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onKeepEditing}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Seguir editando
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Cerrar sin guardar
          </button>
        </div>
      </div>
    </div>
  );
}
