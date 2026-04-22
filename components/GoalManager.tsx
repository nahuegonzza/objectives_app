'use client';

import { useEffect, useState } from 'react';
import type { Goal } from '@types';
import { ICON_OPTIONS, COLOR_OPTIONS, getGoalIcon, getColorOption } from '@lib/goalIconsColors';
import GoalForm from '@components/GoalForm';
import NumberInput from '@components/NumberInput';

export default function GoalManager() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Goal>>({});
  const [loading, setLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRgbPicker, setShowRgbPicker] = useState(false);
  const [rgbColor, setRgbColor] = useState({ r: 255, g: 255, b: 255 });
  const [showInactive, setShowInactive] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    setLoading(true);
    setStatusMessage('');
    try {
      const res = await fetch('/api/goals');
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
      setStatusMessage(error instanceof Error ? `Error cargando objetivos: ${error.message}` : 'Error cargando objetivos');
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateGoal(goalId: string) {
    if (!editForm.title || !editForm.type) return;

    const payload = {
      title: editForm.title,
      description: editForm.description,
      type: editForm.type,
      icon: editForm.icon,
      color: editForm.color,
      order: editForm.order,
      pointsIfTrue: editForm.pointsIfTrue,
      pointsIfFalse: editForm.pointsIfFalse,
      pointsPerUnit: editForm.pointsPerUnit,
      activatedAt: editForm.activatedAt
    };

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `HTTP error! status: ${response.status}`);
      }

      setStatusMessage('Objetivo actualizado correctamente');
      setStatusType('success');
    } catch (error) {
      console.error('Error updating goal:', error);
      setStatusMessage(error instanceof Error ? `Error actualizando objetivo: ${error.message}` : 'Error actualizando objetivo');
      setStatusType('error');
    } finally {
      setEditingGoalId(null);
      setEditForm({});
      loadGoals();
    }
  }

  async function handleDeleteGoal(goalId: string) {
    try {
      const response = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `HTTP error! status: ${response.status}`);
      }
      setStatusMessage('Objetivo eliminado correctamente');
      setStatusType('success');
    } catch (error) {
      console.error('Error deleting goal:', error);
      setStatusMessage(error instanceof Error ? `Error eliminando objetivo: ${error.message}` : 'Error eliminando objetivo');
      setStatusType('error');
    } finally {
      loadGoals();
    }
  }

  async function handleDeactivateGoal(goalId: string) {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `HTTP error! status: ${response.status}`);
      }
      setStatusMessage('Objetivo desactivado correctamente');
      setStatusType('success');
    } catch (error) {
      console.error('Error deactivating goal:', error);
      setStatusMessage(error instanceof Error ? `Error desactivando objetivo: ${error.message}` : 'Error desactivando objetivo');
      setStatusType('error');
    } finally {
      loadGoals();
    }
  }

  async function handleReactivateGoal(goalId: string) {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `HTTP error! status: ${response.status}`);
      }
      setStatusMessage('Objetivo reactivado correctamente');
      setStatusType('success');
    } catch (error) {
      console.error('Error reactivating goal:', error);
      setStatusMessage(error instanceof Error ? `Error reactivando objetivo: ${error.message}` : 'Error reactivando objetivo');
      setStatusType('error');
    } finally {
      loadGoals();
    }
  }

  async function moveGoal(goalId: string, direction: 'up' | 'down') {
    const currentGoal = goals.find((goal) => goal.id === goalId);
    if (!currentGoal || typeof currentGoal.order !== 'number') return;
    const currentOrder = currentGoal.order;

    const nextGoal = goals
      .filter((goal) => goal.id !== goalId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .find((goal) =>
        direction === 'up'
          ? (goal.order ?? 0) < currentOrder
          : (goal.order ?? 0) > currentOrder
      );

    if (!nextGoal) return;

    try {
      const updateResponse = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: nextGoal.order })
      });
      if (!updateResponse.ok) {
        const body = await updateResponse.json().catch(() => null);
        throw new Error(body?.error || `HTTP error! status: ${updateResponse.status}`);
      }

      const swapResponse = await fetch(`/api/goals/${nextGoal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: currentGoal.order })
      });
      if (!swapResponse.ok) {
        const body = await swapResponse.json().catch(() => null);
        throw new Error(body?.error || `HTTP error! status: ${swapResponse.status}`);
      }

      setStatusMessage('Orden de objetivos actualizado');
      setStatusType('success');
    } catch (error) {
      console.error('Error moving goal:', error);
      setStatusMessage(error instanceof Error ? `Error al mover objetivo: ${error.message}` : 'Error al mover objetivo');
      setStatusType('error');
    } finally {
      loadGoals();
    }
  }

  const sortedGoals = [...goals].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-lg">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Todos los Objetivos
            </h2>
            {statusMessage && (
              <p className={`mt-2 text-sm font-medium ${statusType === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                {statusMessage}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <span>{showCreateForm ? 'Cancelar' : 'Nuevo objetivo'}</span>
            </button>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
              {showInactive ? 'Inactivos' : 'Orden'}
            </span>
            <button
              type="button"
              onClick={() => setShowInactive(!showInactive)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                showInactive
                  ? 'bg-slate-600 text-white hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {showInactive ? '← Volver' : 'Ver Desactivados →'}
            </button>
          </div>
        </div>
        {showCreateForm && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
            <GoalForm onSuccess={() => {
              loadGoals();
              setShowCreateForm(false);
            }} />
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : sortedGoals.filter(g => {
          // Tratar isActive como true si no está definido (para compatibilidad con datos existentes)
          const isActive = g.isActive !== false;
          return showInactive ? !isActive : isActive;
        }).length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">
            {showInactive ? 'No hay objetivos desactivados.' : 'No hay objetivos creados aún.'}
          </p>
        ) : (
          <div className="space-y-4">
            {sortedGoals.filter(g => {
              // Tratar isActive como true si no está definido (para compatibilidad con datos existentes)
              const isActive = g.isActive !== false;
              return showInactive ? !isActive : isActive;
            }).map((goal) => {
              const icon = getGoalIcon(goal.icon);
              const isEditing = editingGoalId === goal.id;

              const colorOption = getColorOption(goal.color);

              return (
                <div 
                  key={goal.id} 
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 transition-all"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                          <input
                            value={editForm.title ?? ''}
                            onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
                          <select
                            value={editForm.type ?? 'BOOLEAN'}
                            onChange={(event) => setEditForm({ ...editForm, type: event.target.value as Goal['type'] })}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="BOOLEAN">Booleano</option>
                            <option value="NUMERIC">Numérico</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
                        <textarea
                          value={editForm.description ?? ''}
                          onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                          rows={2}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="relative">
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Icono</label>
                          <button
                            type="button"
                            onClick={() => setShowIconPicker(!showIconPicker)}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {getGoalIcon(editForm.icon ?? 'star')}
                          </button>
                          {showIconPicker && (
                            <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 grid grid-cols-5 gap-2 z-10">
                              {ICON_OPTIONS.map((opt) => (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => {
                                    setEditForm({ ...editForm, icon: opt.key });
                                    setShowIconPicker(false);
                                  }}
                                  className="text-2xl p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                  title={opt.label}
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
                            className="flex items-center gap-3 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <div 
                              className="w-6 h-6 rounded-full border-2"
                              style={{
                                backgroundColor: getColorOption(editForm.color as string)?.bgColor || '#ffffff',
                                borderColor: getColorOption(editForm.color as string)?.borderColor || '#e5e5e5'
                              }}
                            />
                            <span>{String(editForm.color && COLOR_OPTIONS.find(opt => opt.key === editForm.color) ? (editForm.color as string).charAt(0).toUpperCase() + (editForm.color as string).slice(1) : editForm.color ? 'Custom' : 'White')}</span>
                          </button>
                          {showColorPicker && (
                            <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-4 z-10">
                              <div className="grid grid-cols-6 gap-3">
                                {COLOR_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => {
                                      setEditForm({ ...editForm, color: opt.key });
                                      setShowColorPicker(false);
                                      setShowRgbPicker(false);
                                    }}
                                    className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none"
                                    style={{
                                      backgroundColor: opt.bgColor,
                                      borderColor: opt.borderColor,
                                      boxShadow: editForm.color === opt.key ? `0 0 0 3px rgb(16 185 129 / 0.5)` : 'none',
                                      opacity: editForm.color === opt.key ? 1 : 0.7
                                    }}
                                    title={opt.label}
                                    onMouseEnter={(e) => {
                                      const target = e.currentTarget as HTMLButtonElement;
                                      target.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                      const target = e.currentTarget as HTMLButtonElement;
                                      if (editForm.color !== opt.key) {
                                        target.style.opacity = '0.7';
                                      }
                                    }}
                                  />
                                ))}
                                <button
                                  type="button"
                                  onClick={() => setShowRgbPicker(!showRgbPicker)}
                                  className="w-8 h-8 rounded-full border-2 border-slate-400 dark:border-slate-500 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:scale-110 transition-all focus:outline-none"
                                  title="RGB Personalizado"
                                  style={{
                                    boxShadow: showRgbPicker ? `0 0 0 3px rgb(16 185 129 / 0.5)` : 'none'
                                  }}
                                >
                                  RGB
                                </button>
                              </div>
                              
                              {showRgbPicker && (
                                <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-600 rounded border border-slate-300 dark:border-slate-500">
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Rojo</label>
                                      <input
                                        type="range"
                                        min="0"
                                        max="255"
                                        value={rgbColor.r}
                                        onChange={(e) => {
                                          const newRgb = { ...rgbColor, r: parseInt(e.target.value) };
                                          setRgbColor(newRgb);
                                        }}
                                        className="w-full"
                                      />
                                      <span className="text-xs text-slate-600 dark:text-slate-400">{rgbColor.r}</span>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Verde</label>
                                      <input
                                        type="range"
                                        min="0"
                                        max="255"
                                        value={rgbColor.g}
                                        onChange={(e) => {
                                          const newRgb = { ...rgbColor, g: parseInt(e.target.value) };
                                          setRgbColor(newRgb);
                                        }}
                                        className="w-full"
                                      />
                                      <span className="text-xs text-slate-600 dark:text-slate-400">{rgbColor.g}</span>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Azul</label>
                                      <input
                                        type="range"
                                        min="0"
                                        max="255"
                                        value={rgbColor.b}
                                        onChange={(e) => {
                                          const newRgb = { ...rgbColor, b: parseInt(e.target.value) };
                                          setRgbColor(newRgb);
                                        }}
                                        className="w-full"
                                      />
                                      <span className="text-xs text-slate-600 dark:text-slate-400">{rgbColor.b}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <div 
                                        className="flex-1 h-8 rounded border-2 border-slate-300 dark:border-slate-500"
                                        style={{
                                          backgroundColor: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const hexColor = `#${[rgbColor.r, rgbColor.g, rgbColor.b]
                                            .map(x => {
                                              const hex = x.toString(16);
                                              return hex.length === 1 ? '0' + hex : hex;
                                            })
                                            .join('')
                                            .toUpperCase()}`;
                                          setEditForm({ ...editForm, color: hexColor });
                                          setShowColorPicker(false);
                                          setShowRgbPicker(false);
                                        }}
                                        className="px-3 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                                      >
                                        Aplicar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de inicio</label>
                          <input
                            type="date"
                            value={editForm.activatedAt ? editForm.activatedAt.slice(0, 10) : ''}
                            onChange={(event) => setEditForm({
                              ...editForm,
                              activatedAt: event.target.value ? new Date(event.target.value).toISOString() : undefined
                            })}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            {editForm.type === 'BOOLEAN' ? 'Puntos si ✔' : 'Puntos por unidad'}
                          </label>
                          <NumberInput
                            value={editForm.type === 'BOOLEAN' ? editForm.pointsIfTrue ?? 1 : editForm.pointsPerUnit ?? 1}
                            onCommit={(value) =>
                              setEditForm({
                                ...editForm,
                                ...(editForm.type === 'BOOLEAN'
                                  ? { pointsIfTrue: value }
                                  : { pointsPerUnit: value })
                              })
                            }
                            step={0.1}
                            ariaLabel={editForm.type === 'BOOLEAN' ? 'Puntos si verdadero' : 'Puntos por unidad'}
                          />
                        </div>

                        {editForm.type === 'BOOLEAN' && (
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Puntos si ✖
                            </label>
                            <NumberInput
                              value={editForm.pointsIfFalse ?? 0}
                              onCommit={(value) => setEditForm({ ...editForm, pointsIfFalse: value })}
                              step={0.1}
                              ariaLabel="Puntos si falso"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateGoal(goal.id)}
                          className="rounded-lg bg-emerald-600 dark:bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-700 transition"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGoalId(null);
                            setEditForm({});
                          }}
                          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <span className="text-3xl">{icon}</span>
                          <div 
                            className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900"
                            style={{
                              backgroundColor: colorOption?.bgColor || '#9ca3af',
                            }}
                            title={goal.color}
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate">{goal.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{goal.description ?? 'Sin descripción'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {goal.type === 'BOOLEAN'
                              ? `V: ${goal.pointsIfTrue ?? 1}, F: ${goal.pointsIfFalse ?? 0}`
                              : `${goal.pointsPerUnit ?? 1} pts/u`}
                          </p>
                          {goal.deactivatedAt && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              Desactivado: {new Date(goal.deactivatedAt).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          title="Editar"
                          type="button"
                          onClick={() => {
                            setEditingGoalId(goal.id);
                            setEditForm(goal);
                          }}
                          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                          ✏️
                        </button>
                        {!showInactive ? (
                          <>
                            <button
                              title="Desactivar"
                              type="button"
                              onClick={() => handleDeactivateGoal(goal.id)}
                              className="rounded-lg border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900 transition"
                            >
                              ⊘
                            </button>
                            <button
                              title="Mover arriba"
                              type="button"
                              onClick={() => moveGoal(goal.id, 'up')}
                              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                            >
                              ↑
                            </button>
                            <button
                              title="Mover abajo"
                              type="button"
                              onClick={() => moveGoal(goal.id, 'down')}
                              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                            >
                              ↓
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              title="Reactivar"
                              type="button"
                              onClick={() => handleReactivateGoal(goal.id)}
                              className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
                            >
                              ↻
                            </button>
                            <button
                              title="Eliminar permanentemente"
                              type="button"
                              onClick={() => {
                                if (confirm('¿Estás seguro de que quieres eliminar permanentemente este objetivo? Esta acción no se puede deshacer.')) {
                                  handleDeleteGoal(goal.id);
                                }
                              }}
                              className="rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 px-3 py-2 text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 transition"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
