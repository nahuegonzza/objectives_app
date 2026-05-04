'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Goal, GoalPayload } from '@types';
import { ICON_OPTIONS, COLOR_OPTIONS, getColorOption, getGoalIcon, isCustomColor } from '@lib/goalIconsColors';
import NumberInput from '@components/NumberInput';

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
    ...initialState,
    ...data,
    description: data.description ?? initialState.description,
    icon: data.icon ?? initialState.icon,
    color: data.color ?? initialState.color,
    pointsIfTrue: data.pointsIfTrue ?? initialState.pointsIfTrue,
    pointsIfFalse: data.pointsIfFalse ?? initialState.pointsIfFalse,
    pointsPerUnit: data.pointsPerUnit ?? initialState.pointsPerUnit,
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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRgbPicker, setShowRgbPicker] = useState(false);
  const [rgbColor, setRgbColor] = useState({ r: 255, g: 255, b: 255 });

  const normalizedInitial = useMemo(() => normalizeForm({ ...initialState, ...initialData }), [initialData]);
  const normalizedCurrent = useMemo(() => normalizeForm(form), [form]);
  const isDirty = JSON.stringify(normalizedInitial) !== JSON.stringify(normalizedCurrent);

  useEffect(() => {
    const merged = normalizeInitialData(initialData);
    setForm(merged);

    if (merged.color && isCustomColor(merged.color)) {
      const color = merged.color;
      if (color.startsWith('rgb(')) {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          setRgbColor({ r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) });
        }
      } else if (color.startsWith('#') && color.length === 7) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        setRgbColor({ r, g, b });
      }
    } else {
      setRgbColor({ r: 255, g: 255, b: 255 });
    }
  }, [initialData]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

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

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const normalizedValue = Math.max(0, Math.min(255, Math.round(value)));
    const nextRgb = { ...rgbColor, [component]: normalizedValue };
    setRgbColor(nextRgb);
    setForm({ ...form, color: `rgb(${nextRgb.r}, ${nextRgb.g}, ${nextRgb.b})` });
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Guardando objetivo...');
    setStatusType('success');

    try {
      const result = await onSubmit(form);
      if (result.success) {
        setStatus('✓ Cambios guardados');
        setStatusType('success');
        setShowIconPicker(false);
        setShowColorPicker(false);
        setShowRgbPicker(false);
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

  const selectedColor = getColorOption(form.color ?? 'white');

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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Icono</label>
          <button
            type="button"
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="flex h-12 w-full items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-2xl outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Seleccionar icono"
          >
            {getGoalIcon(form.icon ?? 'star')}
          </button>
          {showIconPicker && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 grid grid-cols-5 gap-2 z-20">
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
          )}
        </div>

        <div className="relative">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Color</label>
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex h-12 w-full items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Seleccionar color"
          >
            <span
              className="h-6 w-6 rounded-full border border-slate-300 dark:border-slate-600"
              style={{
                backgroundColor: selectedColor.bgColor,
                borderColor: selectedColor.borderColor
              }}
            />
          </button>
          {showColorPicker && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-4 z-20">
              <div className="grid grid-cols-6 gap-3">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, color: opt.key });
                      setShowColorPicker(false);
                      setShowRgbPicker(false);
                    }}
                    className="w-10 h-10 rounded-full border-2 transition-all hover:scale-110 focus:outline-none"
                    style={{
                      backgroundColor: opt.bgColor,
                      borderColor: opt.borderColor,
                      boxShadow: form.color === opt.key ? '0 0 0 3px rgba(16, 185, 129, 0.35)' : 'none'
                    }}
                    aria-label={opt.label}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setShowRgbPicker(!showRgbPicker)}
                  className="w-10 h-10 rounded-full border-2 border-slate-400 dark:border-slate-500 flex items-center justify-center text-[0.63rem] font-black text-slate-600 dark:text-slate-300 hover:scale-110 transition-all"
                  aria-label="RGB personalizado"
                >
                  RGB
                </button>
              </div>
              {showRgbPicker && (
                <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600">
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Rojo</label>
                      <NumberInput
                        value={rgbColor.r}
                        onCommit={(value) => handleRgbChange('r', value)}
                        min={0}
                        step={1}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Verde</label>
                      <NumberInput
                        value={rgbColor.g}
                        onCommit={(value) => handleRgbChange('g', value)}
                        min={0}
                        step={1}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Azul</label>
                      <NumberInput
                        value={rgbColor.b}
                        onCommit={(value) => handleRgbChange('b', value)}
                        min={0}
                        step={1}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="h-6 w-6 rounded-full border border-slate-300 dark:border-slate-500"
                      style={{ backgroundColor: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})` }}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">rgb({rgbColor.r}, {rgbColor.g}, {rgbColor.b})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, color: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})` });
                        setShowColorPicker(false);
                        setShowRgbPicker(false);
                      }}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
              if (!isDirty || window.confirm('Hay cambios sin guardar. ¿Deseas salir sin guardar?')) {
                onCancel();
              }
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
    </form>
  );
}
