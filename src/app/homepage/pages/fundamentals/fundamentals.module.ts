import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AsyncComponentsComponent } from './async-components/async-components.component';
import { CircularDependencyComponent } from './circular-dependency/circular-dependency.component';
import { DependencyInjectionComponent } from './dependency-injection/dependency-injection.component';
import { PlatformAgnosticismComponent } from './platform-agnosticism/platform-agnosticism.component';
import { UnitTestingComponent } from './unit-testing/unit-testing.component';

const routes: Routes = [
  {
    path: 'dependency-injection',
    redirectTo: 'custom-providers',
  },
  {
    path: 'custom-providers',
    component: DependencyInjectionComponent,
    data: { title: 'Custom providers' },
  },
  {
    path: 'platform-agnosticism',
    component: PlatformAgnosticismComponent,
    data: { title: 'Platform agnosticism' },
  },
  {
    path: 'async-components',
    redirectTo: 'async-providers',
  },
  {
    path: 'async-providers',
    component: AsyncComponentsComponent,
    data: { title: 'Async providers' },
  },
  {
    path: 'unit-testing',
    redirectTo: 'testing',
  },
  {
    path: 'e2e-testing',
    redirectTo: 'testing',
  },
  {
    path: 'testing',
    component: UnitTestingComponent,
    data: { title: 'Testing' },
  },
  {
    path: 'circular-dependency',
    component: CircularDependencyComponent,
    data: { title: 'Circular Dependency' },
  },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    AsyncComponentsComponent,
    PlatformAgnosticismComponent,
    DependencyInjectionComponent,
    UnitTestingComponent,
    CircularDependencyComponent,
  ],
})
export class FundamentalsModule {}
