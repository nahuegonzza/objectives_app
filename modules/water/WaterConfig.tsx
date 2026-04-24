'use client';

import { useState } from 'react';
import NumberInput from '@components/NumberInput';
import type { ActiveModule } from '@lib/modules';

interface WaterConfigProps {
  module: ActiveModule;
  onConfigChange: (config: any) => void;
}

export default function WaterConfig({ module, onConfigChange }: WaterConfigProps) {
  const [config, setConfig] = useState(module.config);

  const updateConfig = (key: string, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Meta diaria (vasos)
        </label>
        <NumberInput
          value={typeof config.dailyGoal === 'number' ? config.dailyGoal : 8}
          onCommit={(value) => updateConfig('dailyGoal', value)}
          min={1}
          step={1}
          ariaLabel="Meta diaria de vasos de agua"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Puntos por vaso
        </label>
        <NumberInput
          value={typeof config.pointsPerGlass === 'number' ? config.pointsPerGlass : 0.5}
          onCommit={(value) => updateConfig('pointsPerGlass', value)}
          min={0.1}
          step={0.1}
          ariaLabel="Puntos por vaso de agua"
        />
      </div>
    </div>
  );
}
