import { moduleDefinitions } from '../modules';
import type { ModuleDefinition, ModuleState } from '../types';

export interface ActiveModule extends ModuleState {
  definition?: ModuleDefinition;
}

export function parseModuleConfig(config: unknown): Record<string, unknown> {
  if (!config) return {};
  if (typeof config !== 'string') return config as Record<string, unknown>;

  try {
    let parsed: unknown = JSON.parse(config);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    return {};
  }
}

export async function getActiveModules(): Promise<ActiveModule[]> {
  try {
    const res = await fetch('/api/modules', { credentials: 'include' });
    if (!res.ok) return [];

    const modules = await res.json();
    return modules
      .filter((mod: any) => mod.active)
      .map((mod: any) => {
        const definition = moduleDefinitions.find((def) => def.slug === mod.slug);
        return {
          ...mod,
          config: parseModuleConfig(mod.config) || definition?.defaultConfig || {},
          definition,
        } as ActiveModule;
      });
  } catch (error) {
    return [];
  }
}
