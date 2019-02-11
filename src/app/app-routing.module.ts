import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { environment } from '../environments/environment';
import { HomepageComponent } from './homepage/homepage.component';
import { ComponentsComponent } from './homepage/pages/components/components.component';
import { ControllersComponent } from './homepage/pages/controllers/controllers.component';
import { CustomDecoratorsComponent } from './homepage/pages/custom-decorators/custom-decorators.component';
import { WhoUsesComponent } from './homepage/pages/discover/who-uses/who-uses.component';
import { ExceptionFiltersComponent } from './homepage/pages/exception-filters/exception-filters.component';
import { ExecutionContextComponent } from './homepage/pages/execution-context/execution-context.component';
import { FirstStepsComponent } from './homepage/pages/first-steps/first-steps.component';
import { GuardsComponent } from './homepage/pages/guards/guards.component';
import { InterceptorsComponent } from './homepage/pages/interceptors/interceptors.component';
import { IntroductionComponent } from './homepage/pages/introduction/introduction.component';
import { MiddlewaresComponent } from './homepage/pages/middlewares/middlewares.component';
import { MigrationComponent } from './homepage/pages/migration/migration.component';
import { ModulesComponent } from './homepage/pages/modules/modules.component';
import { PipesComponent } from './homepage/pages/pipes/pipes.component';
import { SupportComponent } from './homepage/pages/support/support.component';

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
        data: { title: 'First steps' },
      },
      {
        path: 'controllers',
        component: ControllersComponent,
        data: { title: 'Controllers' },
      },
      {
        path: 'components',
        redirectTo: 'providers',
      },
      {
        path: 'providers',
        component: ComponentsComponent,
        data: { title: 'Providers' },
      },
      {
        path: 'modules',
        component: ModulesComponent,
        data: { title: 'Modules' },
      },
      {
        path: 'middleware',
        component: MiddlewaresComponent,
        data: { title: 'Middleware' },
      },
      {
        path: 'pipes',
        component: PipesComponent,
        data: { title: 'Pipes' },
      },
      {
        path: 'guards',
        component: GuardsComponent,
        data: { title: 'Guards' },
      },
      {
        path: 'exception-filters',
        component: ExceptionFiltersComponent,
        data: { title: 'Exception filters' },
      },
      {
        path: 'interceptors',
        component: InterceptorsComponent,
        data: { title: 'Interceptors' },
      },
      {
        path: 'custom-decorators',
        component: CustomDecoratorsComponent,
        data: { title: 'Custom decorators' },
      },
      {
        path: 'execution-context',
        component: ExecutionContextComponent,
        data: { title: 'Execution Context' },
      },
      {
        path: 'discover/companies',
        component: WhoUsesComponent,
        data: { title: 'Discover - Who is using Nest?' },
      },
      {
        path: 'migration-guide',
        component: MigrationComponent,
        data: { title: 'Migration guide - FAQ' },
      },
      {
        path: 'support',
        component: SupportComponent,
        data: { title: 'Support' },
      },
      {
        path: 'fundamentals',
        loadChildren:
          './homepage/pages/fundamentals/fundamentals.module#FundamentalsModule',
      },
      {
        path: 'techniques',
        loadChildren:
          './homepage/pages/techniques/techniques.module#TechniquesModule',
      },
      {
        path: 'graphql',
        loadChildren: './homepage/pages/graphql/graphql.module#GraphqlModule',
      },
      {
        path: 'websockets',
        loadChildren:
          './homepage/pages/websockets/websockets.module#WebsocketsModule',
      },
      {
        path: 'microservices',
        loadChildren:
          './homepage/pages/microservices/microservices.module#MicroservicesModule',
      },
      {
        path: 'recipes',
        loadChildren: './homepage/pages/recipes/recipes.module#RecipesModule',
      },
      {
        path: 'faq',
        loadChildren: './homepage/pages/faq/faq.module#FaqModule',
      },
      {
        path: 'cli',
        loadChildren: './homepage/pages/cli/cli.module#CliModule',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      enableTracing: !environment.production,
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
