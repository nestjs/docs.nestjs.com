import { Routes } from '@angular/router';
import { DevtoolsOverviewComponent } from './overview/overview.component';
import { DevtoolsCiCdComponent } from './ci-cd/ci-cd.component';

export const DEVTOOLS_ROUTES: Routes = [
  {
    path: 'overview',
    component: DevtoolsOverviewComponent,
    data: { title: 'Devtools - Overview' },
  },
  {
    path: 'ci-cd-integration',
    component: DevtoolsCiCdComponent,
    data: { title: 'Devtools - CI/CD integration' },
  },
];
