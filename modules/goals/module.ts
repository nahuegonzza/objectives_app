import { ModuleDefinition } from '@types';

export const goalsModule: ModuleDefinition = {
  slug: 'goals',
  name: 'Objetivos',
  description: 'Gestión de habitos y métricas',
  supportedEvents: [],
  defaultConfig: {},
  Component: () => null, // Placeholder, el GoalTracker se renderiza por separado
  ConfigComponent: () => null,
};