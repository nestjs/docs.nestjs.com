import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AsyncComponentsComponent } from './async-components/async-components.component';
import { CircularDependencyComponent } from './circular-dependency/circular-dependency.component';
import { DependencyInjectionComponent } from './dependency-injection/dependency-injection.component';
import { DynamicModulesComponent } from './dynamic-modules/dynamic-modules.component';
import { LifecycleEventsComponent } from './lifecycle-events/lifecycle-events.component';
import { ModuleRefComponent } from './module-reference/module-reference.component';
import { ExecutionContextComponent } from './execution-context/execution-context.component';
import { PlatformAgnosticismComponent } from './platform-agnosticism/platform-agnosticism.component';
import { ProviderScopesComponent } from './provider-scopes/provider-scopes.component';
import { UnitTestingComponent } from './unit-testing/unit-testing.component';

const routes: Routes = [
  {
    path: 'dynamic-modules',
    component: DynamicModulesComponent,
    data: { title: 'Dynamic modules' },
  },
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
    path: 'module-ref',
    component: ModuleRefComponent,
    data: { title: 'Module reference' },
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
    path: 'injection-scopes',
    component: ProviderScopesComponent,
    data: { title: 'Injection scopes' },
  },
  {
    path: 'execution-context',
    component: ExecutionContextComponent,
    data: { title: 'Execution context' },
  },
  {
    path: 'lifecycle-events',
    component: LifecycleEventsComponent,
    data: { title: 'Lifecycle events' },
  },
  {
    path: 'circular-dependency',
    component: CircularDependencyComponent,
    data: { title: 'Circular Dependency' },
  },
];

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    AsyncComponentsComponent,
    PlatformAgnosticismComponent,
    DependencyInjectionComponent,
    DynamicModulesComponent,
    UnitTestingComponent,
    CircularDependencyComponent,
    ExecutionContextComponent,
    ProviderScopesComponent,
    LifecycleEventsComponent,
    ModuleRefComponent,
  ],
})
export class FundamentalsModule {}
