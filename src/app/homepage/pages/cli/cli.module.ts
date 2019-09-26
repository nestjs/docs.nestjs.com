import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from './../../../shared/shared.module';
import { CliOverviewComponent } from './overview/overview.component';
import { CliUsagesComponent } from './usages/usages.component';
import { CliWorkspacesComponent } from './workspaces/workspaces.component';
import { CliLibrariesComponent } from './libraries/libaries.component';

const routes: Routes = [
  {
    path: 'overview',
    component: CliOverviewComponent,
    data: {
      title: 'Overview - CLI',
    },
  },
  {
    path: 'workspaces',
    component: CliWorkspacesComponent,
    data: {
      title: 'Workspaces - CLI',
    },
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
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    CliOverviewComponent,
    CliWorkspacesComponent,
    CliUsagesComponent,
    CliLibrariesComponent,
  ],
})
export class CliModule {}
