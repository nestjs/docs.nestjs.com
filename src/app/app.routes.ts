import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
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
import { DeploymentComponent } from './homepage/pages/deployment/deployment.component';
import { WEBSOCKETS_ROUTES } from './homepage/pages/websockets/websockets.routes';
import { MICROSERVICES_ROUTES } from './homepage/pages/microservices/microservices.routes';
import { DEVTOOLS_ROUTES } from './homepage/pages/devtools/devtools.routes';
import { CLI_ROUTES } from './homepage/pages/cli/cli-routing.routes';
import { FAQ_ROUTES } from './homepage/pages/faq/faq-routing.module';
import { SECURITY_ROUTES } from './homepage/pages/security/security.module';
import { TECHNIQUES_ROUTES } from './homepage/pages/techniques/techniques.routes';
import { OPENAPI_ROUTES } from './homepage/pages/openapi/openapi.module';
import { FUNDAMENTALS_ROUTES } from './homepage/pages/fundamentals/fundamentals.routes';
import { RECIPES_ROUTES } from './homepage/pages/recipes/recipes.routes';
import { GRAPHQL_ROUTES } from './homepage/pages/graphql/graphql.routes';

export const routes: Routes = [
  {
    path: '',
    component: HomepageComponent,
    children: [
      { path: '', component: IntroductionComponent },
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
      { path: 'components', redirectTo: 'providers' },
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
      { path: 'pipes', component: PipesComponent, data: { title: 'Pipes' } },
      { path: 'guards', component: GuardsComponent, data: { title: 'Guards' } },
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
      { path: 'application-context', redirectTo: 'standalone-applications' },
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
        path: 'deployment',
        component: DeploymentComponent,
        data: { title: 'Deployment' },
      },
      {
        path: 'support',
        component: SupportComponent,
        data: { title: 'Support' },
      },
      {
        path: 'consulting',
        component: EnterpriseComponent,
        resolve: { url: 'externalUrlRedirectResolver' },
        canActivate: [RedirectGuard],
        data: { externalUrl: 'https://enterprise.nestjs.com' },
      },
      { path: 'enterprise', redirectTo: 'consulting' },
      {
        path: 'enterprise',
        component: EnterpriseComponent,
        data: { title: 'Official Support' },
      },
      {
        path: 'fundamentals',
        children: FUNDAMENTALS_ROUTES,
      },
      {
        path: 'techniques',
        children: TECHNIQUES_ROUTES,
      },
      {
        path: 'security',
        children: SECURITY_ROUTES,
      },
      {
        path: 'graphql',
        children: GRAPHQL_ROUTES,
      },
      {
        path: 'websockets',
        children: WEBSOCKETS_ROUTES,
      },
      {
        path: 'microservices',
        children: MICROSERVICES_ROUTES,
      },
      {
        path: 'recipes',
        children: RECIPES_ROUTES,
      },
      {
        path: 'faq',
        children: FAQ_ROUTES,
      },
      {
        path: 'cli',
        children: CLI_ROUTES,
      },
      {
        path: 'openapi',
        children: OPENAPI_ROUTES,
      },
      {
        path: 'devtools',
        children: DEVTOOLS_ROUTES,
      },
    ],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

export const RoutingModule = RouterModule.forRoot(routes, {
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled',
  preloadingStrategy: PreloadAllModules,
  onSameUrlNavigation: 'reload',
});
