'use client';

import { useState, useEffect } from 'react';
import type { Goal } from '@types';
import { ICON_OPTIONS, COLOR_OPTIONS, getGoalIcon, getColorOption } from '@lib/goalIconsColors';
import NumberInput from '@components/NumberInput';

interface GoalEditModalProps {
  goal: Goal | null;
  onSave: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  onClose: () => void;
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

export function GoalEditModal({ goal, onSave, onClose }: GoalEditModalProps) {
  const [form, setForm] = useState<Partial<Goal>>({});
  const [saving, setSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRgbPicker, setShowRgbPicker] = useState(false);
  const [rgbColor, setRgbColor] = useState({ r: 255, g: 255, b: 255 });

  useEffect(() => {
    if (goal) {
      setForm(goal);
      // Parse RGB color if it's a custom color
      if (goal.color && goal.color.startsWith('rgb(')) {
        const match = goal.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          setRgbColor({
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3])
          });
        }
      }
    }
  }, [goal]);

  if (!goal) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(goal.id, form);
      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleWeekDay = (dayIndex: number) => {
    const current = form.weekDays || [];
    const newDays = current.includes(dayIndex)
      ? current.filter(d => d !== dayIndex)
      : [...current, dayIndex].sort();
    setForm({ ...form, weekDays: newDays });
  };

  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgbColor, [component]: value };
    setRgbColor(newRgb);
    setForm({ ...form, color: `rgb(${newRgb.r}, ${newRgb.g}, ${newRgb.b})` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all">

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🎯</span>
            Editar Objetivo
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
              <input
                value={form.title ?? ''}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Nombre del objetivo"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
              <select
                value={form.type ?? 'BOOLEAN'}
                onChange={(event) => setForm({ ...form, type: event.target.value as Goal['type'] })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="BOOLEAN">Sí/No</option>
                <option value="NUMERIC">Numérico</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
            <textarea
              value={form.description ?? ''}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Descripción opcional"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Icono</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-left outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <span className="text-lg">{getGoalIcon(form.icon || 'star')}</span>
                  <span className="text-slate-900 dark:text-white">{form.icon || 'star'}</span>
                </button>
                {showIconPicker && (
                  <div className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-lg">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, icon });
                          setShowIconPicker(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-600"
                      >
                        <span className="text-lg">{getGoalIcon(icon)}</span>
                        <span className="text-slate-900 dark:text-white">{icon}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Color</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-left outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <div
                    className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600"
                    style={{ backgroundColor: form.color || '#ffffff' }}
                  />
                  <span className="text-slate-900 dark:text-white">{getColorOption(form.color || 'white').label}</span>
                </button>
                {showColorPicker && (
                  <div className="absolute top-full z-10 mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-lg">
                    <button
                      type="button"
                      onClick={() => setShowRgbPicker(true)}
                      className="flex w-full items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600 bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
                      <span className="text-slate-900 dark:text-white">Color personalizado</span>
                    </button>
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, color: color.value });
                          setShowColorPicker(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-600"
                      >
                        <div
                          className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600"
                          style={{ backgroundColor: color.value }}
                        />
                        <span className="text-slate-900 dark:text-white">{color.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {showRgbPicker && (
            <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Color personalizado</h4>
                <button
                  type="button"
                  onClick={() => setShowRgbPicker(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Rojo</label>
                  <NumberInput
                    value={rgbColor.r}
                    onChange={(value) => handleRgbChange('r', value)}
                    min={0}
                    max={255}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Verde</label>
                  <NumberInput
                    value={rgbColor.g}
                    onChange={(value) => handleRgbChange('g', value)}
                    min={0}
                    max={255}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Azul</label>
                  <NumberInput
                    value={rgbColor.b}
                    onChange={(value) => handleRgbChange('b', value)}
                    min={0}
                    max={255}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded border border-slate-300 dark:border-slate-600"
                  style={{ backgroundColor: form.color }}
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">{form.color}</span>
              </div>
            </div>
          )}

          {form.type === 'BOOLEAN' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Puntos si completado</label>
                <NumberInput
                  value={form.pointsIfTrue ?? 1}
                  onChange={(value) => setForm({ ...form, pointsIfTrue: value })}
                  min={0}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Puntos si no completado</label>
                <NumberInput
                  value={form.pointsIfFalse ?? 0}
                  onChange={(value) => setForm({ ...form, pointsIfFalse: value })}
                  min={0}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {form.type === 'NUMERIC' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Puntos por unidad</label>
              <NumberInput
                value={form.pointsPerUnit ?? 1}
                onChange={(value) => setForm({ ...form, pointsPerUnit: value })}
                min={0}
                className="w-full"
              />
            </div>
          )}

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">Días de la semana</label>
            <div className="flex gap-2">
              {WEEK_DAYS.map((day) => (
                <button
                  key={day.index}
                  type="button"
                  onClick={() => toggleWeekDay(day.index)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition ${
                    (form.weekDays || []).includes(day.index)
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                  title={day.full}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
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
    </div>
  );
}