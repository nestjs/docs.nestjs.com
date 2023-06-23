import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { DevtoolsOverviewComponent } from './overview/overview.component';
import { DevtoolsCiCdComponent } from './ci-cd/ci-cd.component';

const routes: Routes = [
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

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [DevtoolsCiCdComponent, DevtoolsOverviewComponent],
})
export class DevtoolsModule {}
