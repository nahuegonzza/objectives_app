import type { DailyScore, GoalEntryWithGoal, Event, ModuleEntry, ActiveModule } from '@types';
import { isGoalActiveOnDate } from '@lib/goalHelpers';

function normalizeGoalType(type: string) {
  if (type === 'HABIT') return 'BOOLEAN';
  if (type === 'OBJECTIVE') return 'NUMERIC';
  return type;
}

function scoreEntry(entry: GoalEntryWithGoal): number {
  const { goal } = entry;

  if (!goal) return 0;
  const dateKey = entry.date.slice(0, 10);
  if (!isGoalActiveOnDate(goal, dateKey)) return 0;

  const type = normalizeGoalType(goal.type);

  if (type === 'BOOLEAN') {
    return entry.valueBoolean ? Number(goal.pointsIfTrue ?? 1) : Number(goal.pointsIfFalse ?? 0);
  }

  if (type === 'NUMERIC') {
    return Number(entry.valueFloat ?? 0) * Number(goal.pointsPerUnit ?? 1);
  }

  return 0;
}

export function calculateDailyScore(entries: GoalEntryWithGoal[], events: Event[], moduleEntries: ModuleEntry[], activeModules: ActiveModule[], targetDate?: string): DailyScore {
  const points = entries.reduce((total, entry) => total + scoreEntry(entry), 0);

  let modulePoints = 0;
  for (const module of activeModules) {
    if (module.definition?.calculateScore) {
      const moduleModuleEntries = moduleEntries.filter((e) => e.moduleId === module.id);
      modulePoints += module.definition.calculateScore(moduleModuleEntries, module.config);
    }
  }

  const date = targetDate || new Date().toISOString();

  return {
    date,
    points: points + modulePoints,
    note: `Registros: ${entries.length}, Módulos: ${activeModules.length}`
  };
}
