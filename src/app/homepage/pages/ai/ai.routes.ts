import { Routes } from '@angular/router';
import { AiOverviewComponent } from './overview/overview.component';
import { AiModelsComponent } from './models/models.component';
import { AiToolsComponent } from './tools/tools.component';
import { AiAgentsComponent } from './agents/agents.component';
import { AiTestingComponent } from './testing/testing.component';

export const AI_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    component: AiOverviewComponent,
    data: { title: 'AI - Overview' },
  },
  {
    path: 'models',
    component: AiModelsComponent,
    data: { title: 'AI - Models' },
  },
  {
    path: 'tools',
    component: AiToolsComponent,
    data: { title: 'AI - Tools' },
  },
  {
    path: 'agents',
    component: AiAgentsComponent,
    data: { title: 'AI - Agents' },
  },
  {
    path: 'testing',
    component: AiTestingComponent,
    data: { title: 'AI - Testing' },
  },
];
