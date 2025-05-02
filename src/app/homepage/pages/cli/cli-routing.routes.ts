import { Routes } from '@angular/router';
import { CliLibrariesComponent } from './libraries/libraries.component';
import { CliOverviewComponent } from './overview/overview.component';
import { CliUsagesComponent } from './usages/usages.component';
import { CliWorkspacesComponent } from './workspaces/workspaces.component';
import { CliScriptsComponent } from './scripts/scripts.component';

export const CLI_ROUTES: Routes = [
  {
    path: 'overview',
    component: CliOverviewComponent,
    data: {
      title: 'Overview - CLI',
    },
  },
  {
    path: 'monorepo',
    component: CliWorkspacesComponent,
    data: {
      title: 'Workspaces - CLI',
    },
  },
  {
    path: 'workspaces',
    redirectTo: 'monorepo',
  },
  {
    path: 'libraries',
    component: CliLibrariesComponent,
    data: {
      title: 'Libraries - CLI',
    },
  },
  {
    path: 'usages',
    component: CliUsagesComponent,
    data: {
      title: 'Usage - CLI',
    },
  },
  {
    path: 'scripts',
    component: CliScriptsComponent,
    data: {
      title: 'Scripts - CLI',
    },
  },
];
