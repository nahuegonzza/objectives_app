'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Goal, GoalPayload } from '@types';
import { ICON_OPTIONS, getGoalIcon } from '@lib/goalIconsColors';
import NumberInput from '@components/NumberInput';
import UnifiedColorPicker from '@components/UnifiedColorPicker';
import UnsavedChangesModal from '@components/UnsavedChangesModal';

interface GoalFormProps {
  initialData?: Partial<Goal>;
  submitLabel?: string;
  onSubmit: (payload: GoalFormData) => Promise<{ success: boolean; message?: string }>;
  onSuccess?: () => void;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

interface GoalFormData extends GoalPayload {
  icon?: string;
  color?: string;
}

const initialState: GoalFormData = {
  title: '',
  description: '',
  type: 'BOOLEAN',
  icon: 'star',
  color: 'white',
  pointsIfTrue: 1,
  pointsIfFalse: 0,
  pointsPerUnit: 1,
  weekDays: []
};

function normalizeInitialData(data?: Partial<Goal>): GoalFormData {
  if (!data) return initialState;

  return {
    title: data.title ?? initialState.title,
    description: data.description ?? initialState.description,
    type: data.type ?? initialState.type,
    icon: data.icon ?? initialState.icon,
    color: data.color ?? initialState.color,
    order: data.order ?? initialState.order,
    pointsIfTrue: data.pointsIfTrue ?? initialState.pointsIfTrue,
    pointsIfFalse: data.pointsIfFalse ?? initialState.pointsIfFalse,
    pointsPerUnit: data.pointsPerUnit ?? initialState.pointsPerUnit,
    isActive: data.isActive ?? initialState.isActive,
    deactivatedAt: data.deactivatedAt ?? initialState.deactivatedAt,
    activatedAt: data.activatedAt ?? initialState.activatedAt,
    weekDays: Array.isArray(data.weekDays) ? data.weekDays : initialState.weekDays,
  };
}

const WEEK_DAYS = [
  { index: 0, label: 'D', full: 'Domingo' },
  { index: 1, label: 'L', full: 'Lunes' },
  { index: 2, label: 'M', full: 'Martes' },
  { index: 3, label: 'X', full: 'Miércoles' },
  { index: 4, label: 'J', full: 'Jueves' },
  { index: 5, label: 'V', full: 'Viernes' },
  { index: 6, label: 'S', full: 'Sábado' }
];

export default function GoalForm({ initialData, submitLabel = 'Guardar objetivo', onSubmit, onSuccess, onCancel, onDirtyChange }: GoalFormProps) {
  const [form, setForm] = useState<GoalFormData>(normalizeInitialData(initialData));
  const [status, setStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const iconButtonRef = useRef<HTMLButtonElement>(null);
  const iconOverlayRef = useRef<HTMLDivElement>(null);
  const [iconOverlayStyle, setIconOverlayStyle] = useState<Record<string, number>>({});

  const normalizedInitial = useMemo(() => normalizeForm(normalizeInitialData(initialData)), [initialData]);
  const normalizedCurrent = useMemo(() => normalizeForm(form), [form]);
  const isDirty = JSON.stringify(normalizedInitial) !== JSON.stringify(normalizedCurrent);

  useEffect(() => {
    const merged = normalizeInitialData(initialData);
    setForm(merged);
  }, [initialData]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useLayoutEffect(() => {
    if (!showIconPicker || !iconButtonRef.current) return;

    const updatePosition = () => {
      const rect = iconButtonRef.current!.getBoundingClientRect();
      const popupWidth = 240; // Más pequeño que antes
      const popupHeight = 200; // Altura fija con scroll
      const margin = 8;
      let top = rect.bottom + margin;
      if (top + popupHeight > window.innerHeight - margin) {
        top = rect.top - popupHeight - margin;
        if (top < margin) top = margin;
      }
      let left = rect.left;
      if (left + popupWidth > window.innerWidth - margin) {
        left = window.innerWidth - popupWidth - margin;
      }
      if (left < margin) left = margin;
      setIconOverlayStyle({ top, left, width: popupWidth });
    };

    updatePosition();
  }, [showIconPicker]);

  useEffect(() => {
    if (!showIconPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!iconButtonRef.current) return;
      if (iconButtonRef.current.contains(event.target as Node)) return;
      if (iconOverlayRef.current?.contains(event.target as Node)) return;
      setShowIconPicker(false);
    };

    const updatePosition = () => {
      if (!iconButtonRef.current) return;
      const rect = iconButtonRef.current.getBoundingClientRect();
      const popupWidth = 240;
      const popupHeight = 200;
      const margin = 8;
      let top = rect.bottom + margin;
      if (top + popupHeight > window.innerHeight - margin) {
        top = rect.top - popupHeight - margin;
        if (top < margin) top = margin;
      }
      let left = rect.left;
      if (left + popupWidth > window.innerWidth - margin) {
        left = window.innerWidth - popupWidth - margin;
      }
      if (left < margin) left = margin;
      setIconOverlayStyle({ top, left, width: popupWidth });
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showIconPicker]);

  function normalizeForm(value: GoalFormData) {
    return {
      ...value,
      weekDays: Array.isArray(value.weekDays) ? [...value.weekDays].sort() : []
    };
  }

  function toggleWeekDay(dayIndex: number) {
    const current = form.weekDays || [];
    const newDays = current.includes(dayIndex)
      ? current.filter(d => d !== dayIndex)
      : [...current, dayIndex].sort();
    setForm({ ...form, weekDays: newDays });
  }

  const handleToggleAllWeekDays = () => {
    const allDays = [0, 1, 2, 3, 4, 5, 6];
    setForm({ ...form, weekDays: form.weekDays?.length === 7 ? [] : allDays });
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    setStatus('Guardando objetivo...');
    setStatusType('success');

    try {
      const result = await onSubmit(form);
      if (result.success) {
        setStatus('✓ Cambios guardados');
        setStatusType('success');
        setShowIconPicker(false);
        if (!initialData) {
          setForm(initialState);
        }
        onSuccess?.();
        setTimeout(() => setStatus(''), 3000);
        return;
      }

      setStatus(result.message ?? '✗ No se pudo guardar');
      setStatusType('error');
    } catch (error) {
      setStatus(error instanceof Error ? `Error: ${error.message}` : 'Error desconocido');
      setStatusType('error');
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-emerald-500"
            placeholder="Ej. Leer 20 minutos"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
          <select
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value as GoalFormData['type'] })}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-emerald-500"
          >
            <option value="BOOLEAN">Hábito (Sí/No)</option>
            <option value="NUMERIC">Métrica (Número)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
        <textarea
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none transition focus:ring-2 focus:ring-emerald-500"
          placeholder="Detalles (opcional)"
          rows={2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="relative">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Icono</label>
          <button
            type="button"
            ref={iconButtonRef}
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="flex h-12 w-full items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-2xl outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Seleccionar icono"
          >
            {getGoalIcon(form.icon ?? 'star')}
          </button>
          {showIconPicker && typeof document !== 'undefined' && createPortal(
            <div
              ref={iconOverlayRef}
              className="fixed z-50 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 shadow-2xl max-h-52 overflow-y-auto"
              style={{
                top: iconOverlayStyle.top,
                left: iconOverlayStyle.left,
                width: iconOverlayStyle.width,
              }}
            >
              <div className="grid grid-cols-4 gap-2">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, icon: opt.key });
                      setShowIconPicker(false);
                    }}
                    className="text-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
                    aria-label={opt.label}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>

        <div className="relative">
          <UnifiedColorPicker
            label="Color"
            value={form.color ?? 'white'}
            onChange={(color) => setForm({ ...form, color })}
          />
        </div>

        <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
          {form.type === 'BOOLEAN' ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Puntos si ✔</label>
                <NumberInput
                  value={form.pointsIfTrue ?? 1}
                  onCommit={(value) => setForm({ ...form, pointsIfTrue: value })}
                  ariaLabel="Puntos si verdadero"
                  step={1}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Puntos si ✖</label>
                <NumberInput
                  value={form.pointsIfFalse ?? 0}
                  onCommit={(value) => setForm({ ...form, pointsIfFalse: value })}
                  ariaLabel="Puntos si falso"
                  step={1}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Puntos por unidad</label>
              <NumberInput
                value={form.pointsPerUnit ?? 1}
                onCommit={(value) => setForm({ ...form, pointsPerUnit: value })}
                ariaLabel="Puntos por unidad"
                step={0.1}
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Días de la semana {form.weekDays && form.weekDays.length > 0 ? `(seleccionados: ${form.weekDays.length})` : '(Todos los días)'}
          </label>
          <button
            type="button"
            onClick={handleToggleAllWeekDays}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {form.weekDays?.length === 7 ? 'Desactivar todos' : 'Activar todos'}
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {WEEK_DAYS.map((day) => {
            const isSelected = (form.weekDays || []).includes(day.index);
            return (
              <button
                key={day.index}
                type="button"
                onClick={() => toggleWeekDay(day.index)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
                title={day.full}
              >
                {day.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-center text-slate-500 dark:text-slate-400">
          {form.weekDays && form.weekDays.length > 0 && form.weekDays.length < 7
            ? `Este objetivo aparecerá solo los días: ${form.weekDays.map(d => WEEK_DAYS.find(wd => wd.index === d)?.full).join(', ')}`
            : 'Este objetivo aparecerá todos los días'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        {onCancel && (
          <button
            type="button"
            onClick={() => {
              if (!isDirty) {
                onCancel();
                return;
              }
              setShowUnsavedDialog(true);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition sm:w-auto"
        >
          {submitLabel}
        </button>
      </div>

      {status && (
        <p className={`text-sm font-medium ${statusType === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
          {status}
        </p>
      )}

      <UnsavedChangesModal
        open={showUnsavedDialog}
        onKeepEditing={() => setShowUnsavedDialog(false)}
        onDiscard={() => {
          setShowUnsavedDialog(false);
          onCancel?.();
        }}
      />
    </form>
  );
}
