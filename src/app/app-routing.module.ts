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
      }
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
