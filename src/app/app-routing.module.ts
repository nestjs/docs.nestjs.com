import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { ApplicationContextComponent } from './homepage/pages/application-context/application-context.component';
import { ComponentsComponent } from './homepage/pages/components/components.component';
import { ControllersComponent } from './homepage/pages/controllers/controllers.component';
import { CustomDecoratorsComponent } from './homepage/pages/custom-decorators/custom-decorators.component';
import { WhoUsesComponent } from './homepage/pages/discover/who-uses/who-uses.component';
import { EnterpriseComponent } from './homepage/pages/enterprise/enterprise.component';
import { ExceptionFiltersComponent } from './homepage/pages/exception-filters/exception-filters.component';
import { FirstStepsComponent } from './homepage/pages/first-steps/first-steps.component';
import { GuardsComponent } from './homepage/pages/guards/guards.component';
import { InterceptorsComponent } from './homepage/pages/interceptors/interceptors.component';
import { IntroductionComponent } from './homepage/pages/introduction/introduction.component';
import { MiddlewaresComponent } from './homepage/pages/middlewares/middlewares.component';
import { MigrationComponent } from './homepage/pages/migration/migration.component';
import { ModulesComponent } from './homepage/pages/modules/modules.component';
import { PipesComponent } from './homepage/pages/pipes/pipes.component';
import { SupportComponent } from './homepage/pages/support/support.component';
import { RedirectGuard } from './shared/guards/redirect.guard';

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
        path: 'standalone-applications',
        component: ApplicationContextComponent,
        data: { title: 'Standalone applications' },
      },
      {
        path: 'application-context',
        redirectTo: 'standalone-applications',
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
        path: 'consulting',
        component: EnterpriseComponent,
        resolve: {
          url: 'externalUrlRedirectResolver',
        },
        canActivate: [RedirectGuard],
        data: {
          externalUrl: 'https://enterprise.nestjs.com',
        },
      },
      {
        path: 'enterprise',
        redirectTo: 'consulting',
      },
      {
        path: 'enterprise',
        component: EnterpriseComponent,
        data: { title: 'Official Support' },
      },
      {
        path: 'fundamentals',
        loadChildren: () =>
          import('./homepage/pages/fundamentals/fundamentals.module').then(
            (m) => m.FundamentalsModule,
          ),
      },
      {
        path: 'techniques',
        loadChildren: () =>
          import('./homepage/pages/techniques/techniques.module').then(
            (m) => m.TechniquesModule,
          ),
      },
      {
        path: 'security',
        loadChildren: () =>
          import('./homepage/pages/security/security.module').then(
            (m) => m.SecurityModule,
          ),
      },
      {
        path: 'graphql',
        loadChildren: () =>
          import('./homepage/pages/graphql/graphql.module').then(
            (m) => m.GraphqlModule,
          ),
      },
      {
        path: 'websockets',
        loadChildren: () =>
          import('./homepage/pages/websockets/websockets.module').then(
            (m) => m.WebsocketsModule,
          ),
      },
      {
        path: 'microservices',
        loadChildren: () =>
          import('./homepage/pages/microservices/microservices.module').then(
            (m) => m.MicroservicesModule,
          ),
      },
      {
        path: 'recipes',
        loadChildren: () =>
          import('./homepage/pages/recipes/recipes.module').then(
            (m) => m.RecipesModule,
          ),
      },
      {
        path: 'faq',
        loadChildren: () =>
          import('./homepage/pages/faq/faq.module').then((m) => m.FaqModule),
      },
      {
        path: 'cli',
        loadChildren: () =>
          import('./homepage/pages/cli/cli.module').then((m) => m.CliModule),
      },
      {
        path: 'openapi',
        loadChildren: () =>
          import('./homepage/pages/openapi/openapi.module').then(
            (m) => m.OpenApiModule,
          ),
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
    // enableTracing: !environment.production,
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled',
    preloadingStrategy: PreloadAllModules,
    relativeLinkResolution: 'legacy'
}),
  ],
  providers: [RedirectGuard],
  exports: [RouterModule],
})
export class AppRoutingModule {}
