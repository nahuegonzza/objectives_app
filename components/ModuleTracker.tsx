'use client';

import { useEffect, useState } from 'react';
import { moduleDefinitions } from '../modules';
import { parseModuleConfig } from '../lib/modules';
import type { ActiveModule } from '../lib/modules';

export default function ModuleTracker() {
  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModules() {
      try {
        const res = await fetch('/api/modules');
        const modules = await res.json();
        const active = modules.filter((m: any) => m.active);
        // Combine with definitions
        const withDefinitions = active.map((mod: any) => {
          const definition = moduleDefinitions.find(d => d.slug === mod.slug);
          return {
            ...mod,
            config: parseModuleConfig(mod.config) || definition?.defaultConfig || {},
            definition,
          };
        });
        setActiveModules(withDefinitions);
      } catch (error) {
        console.error('Error loading modules', error);
      } finally {
        setLoading(false);
      }
    }
    loadModules();
  }, []);

  if (loading) return <div>Loading modules...</div>;

  return (
    <div className="space-y-4">
      {activeModules.map((module) => {
        const Component = module.definition?.Component;
        if (!Component) return null;

        return (
          <Component
            key={module.slug}
            config={module.config}
            module={module}
          />
        );
      })}
    </div>
  );
}
