import { habitModule } from './habits/module';
import { financeModule } from './finance/module';
import { gymModule } from './gym/module';
import { sleepModule } from './sleep/module';
import { workModule } from './work/module';
import { waterModule } from './water/module';
import { moodModule } from './mood/module';

export const moduleDefinitions = [habitModule, financeModule, gymModule, sleepModule, workModule, waterModule, moodModule] as const;
