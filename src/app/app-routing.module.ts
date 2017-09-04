import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { environment } from '../environments/environment';
import { HomepageComponent } from './homepage/homepage.component';
import { IntroductionComponent } from './homepage/pages/introduction/introduction.component';
import { FirstStepsComponent } from './homepage/pages/first-steps/first-steps.component';
import { ControllersComponent } from './homepage/pages/controllers/controllers.component';
import { ComponentsComponent } from './homepage/pages/components/components.component';
import { ModulesComponent } from './homepage/pages/modules/modules.component';
import { MiddlewaresComponent } from './homepage/pages/middlewares/middlewares.component';
import { PipesComponent } from './homepage/pages/pipes/pipes.component';
import { GuardsComponent } from './homepage/pages/guards/guards.component';
import { ExceptionFiltersComponent } from './homepage/pages/exception-filters/exception-filters.component';
import { InterceptorsComponent } from './homepage/pages/interceptors/interceptors.component';
import { DependencyInjectionComponent } from './homepage/pages/advanced/dependency-injection/dependency-injection.component';
import { AsyncComponentsComponent } from './homepage/pages/advanced/async-components/async-components.component';
import { CircularDependencyComponent } from './homepage/pages/advanced/circular-dependency/circular-dependency.component';
import { UnitTestingComponent } from './homepage/pages/advanced/unit-testing/unit-testing.component';
import { E2eTestingComponent } from './homepage/pages/advanced/e2e-testing/e2e-testing.component';

const routes: Routes = [
  {
    path: '',
    component: HomepageComponent,
    children: [
      {
        path: '',
        component: IntroductionComponent,
      },
      {
        path: 'first-steps',
        component: FirstStepsComponent,
      },
      {
        path: 'controllers',
        component: ControllersComponent,
      },
      {
        path: 'components',
        component: ComponentsComponent,
      },
      {
        path: 'modules',
        component: ModulesComponent,
      },
      {
        path: 'middlewares',
        component: MiddlewaresComponent,
      },
      {
        path: 'pipes',
        component: PipesComponent,
      },
      {
        path: 'guards',
        component: GuardsComponent,
      },
      {
        path: 'exception-filters',
        component: ExceptionFiltersComponent,
      },
      {
        path: 'interceptors',
        component: InterceptorsComponent,
      },
      {
        path: 'advanced/dependency-injection',
        component: DependencyInjectionComponent,
      },
      {
        path: 'advanced/async-components',
        component: AsyncComponentsComponent,
      },
      {
        path: 'advanced/circular-dependency',
        component: CircularDependencyComponent,
      },
      {
        path: 'advanced/unit-testing',
        component: UnitTestingComponent,
      },
      {
        path: 'advanced/e2e-testing',
        component: E2eTestingComponent,
      },
    ]
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes,
      {
        enableTracing: !environment.production,
      },
    ),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
