import type { ModuleDefinition } from '@types';
import WaterConfig from './WaterConfig';
import WaterDashboard from './WaterDashboard';

export const waterModule: ModuleDefinition = {
  slug: 'water',
  name: 'Agua',
  description: 'Rastrea tu consumo diario de agua',
  supportedEvents: ['agua_bebida'],
  defaultConfig: {
    dailyGoal: 8, // vasos
    pointsPerGlass: 0.5
  },
  ConfigComponent: WaterConfig,
  Component: WaterDashboard,
  calculateScore: (entries, config) => {
    const totalGlasses = entries.reduce((sum, entry) => {
      const data = JSON.parse(entry.data);
      return sum + (data.value || 0);
    }, 0);
    const points = totalGlasses * ((config.pointsPerGlass as number) || 0.5);
    const bonus = totalGlasses >= ((config.dailyGoal as number) || 8) ? 2 : 0;
    return points + bonus;
  }
};