import { financeModule } from './finance/module';
import { gymModule } from './gym/module';
import { sleepModule } from './sleep/module';
import { workModule } from './work/module';
import { waterModule } from './water/module';
import { moodModule } from './mood/module';
import { academicModule } from './academic/module';
import { goalsModule } from './goals/module';

export const moduleDefinitions = [financeModule, gymModule, sleepModule, workModule, waterModule, moodModule, academicModule, goalsModule] as const;
