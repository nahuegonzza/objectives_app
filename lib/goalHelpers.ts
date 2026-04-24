import type { Goal } from '@types';

export function isGoalActiveOnDate(goal: Goal, dateString: string): boolean {
  const isActive = goal.isActive !== false;
  if (!isActive) return false;

  const activatedDateStr = goal.activatedAt ? goal.activatedAt.slice(0, 10) : null;
  const deactivatedDateStr = goal.deactivatedAt ? goal.deactivatedAt.slice(0, 10) : null;

  if (!activatedDateStr) {
    // Si no hay activatedAt, verificar weekDays
    return isGoalActiveOnWeekDay(goal, dateString);
  }
  if (dateString < activatedDateStr) return false;
  if (deactivatedDateStr && dateString >= deactivatedDateStr) return false;
  
  // Verificar weekDays
  return isGoalActiveOnWeekDay(goal, dateString);
}

function isGoalActiveOnWeekDay(goal: Goal, dateString: string): boolean {
  // Si no tiene weekDays definidos o está vacío, está activo todos los días
  if (!goal.weekDays || goal.weekDays.length === 0) {
    return true;
  }
  // Obtener el día de la semana (0=domingo, 6=sábado)
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  return goal.weekDays.includes(dayOfWeek);
}

export function doesGoalOverlapRange(goal: Goal, fromDate: string, toDate: string): boolean {
  const activatedDateStr = goal.activatedAt ? goal.activatedAt.slice(0, 10) : '0000-01-01';
  const deactivatedDateStr = goal.deactivatedAt ? goal.deactivatedAt.slice(0, 10) : '9999-12-31';
  return activatedDateStr <= toDate && deactivatedDateStr > fromDate;
}
