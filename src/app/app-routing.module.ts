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
import { GatewaysComponent } from './homepage/pages/websockets/gateways/gateways.component';
import { AdapterComponent } from './homepage/pages/websockets/adapter/adapter.component';
import { WsInterceptorsComponent } from './homepage/pages/websockets/interceptors/interceptors.component';
import { WsExceptionFiltersComponent } from './homepage/pages/websockets/exception-filters/exception-filters.component';
import { WsGuardsComponent } from './homepage/pages/websockets/guards/guards.component';
import { WsPipesComponent } from './homepage/pages/websockets/pipes/pipes.component';
import { BasicsComponent } from './homepage/pages/microservices/basics/basics.component';
import { RedisComponent } from './homepage/pages/microservices/redis/redis.component';
import { MicroservicesPipesComponent } from './homepage/pages/microservices/pipes/pipes.component';
import { MicroservicesExceptionFiltersComponent } from './homepage/pages/microservices/exception-filters/exception-filters.component';
import { MicroservicesGuardsComponent } from './homepage/pages/microservices/guards/guards.component';
import { MicroservicesInterceptorsComponent } from './homepage/pages/microservices/interceptors/interceptors.component';
import { CustomTransportComponent } from './homepage/pages/microservices/custom-transport/custom-transport.component';
import { HierarchicalInjectorComponent } from './homepage/pages/advanced/hierarchical-injector/hierarchical-injector.component';
import { MixinComponentsComponent } from './homepage/pages/advanced/mixin-components/mixin-components.component';
import { SqlTypeormComponent } from './homepage/pages/recipes/sql-typeorm/sql-typeorm.component';
import { ExpressInstanceComponent } from './homepage/pages/faq/express-instance/express-instance.component';
import { GlobalPrefixComponent } from './homepage/pages/faq/global-prefix/global-prefix.component';
import { LifecycleEventsComponent } from './homepage/pages/faq/lifecycle-events/lifecycle-events.component';
import { HybridApplicationComponent } from './homepage/pages/faq/hybrid-application/hybrid-application.component';
import { MultipleServersComponent } from './homepage/pages/faq/multiple-servers/multiple-servers.component';

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
        path: 'advanced/mixins',
        component: MixinComponentsComponent,
      },
      {
        path: 'advanced/hierarchical-injector',
        component: HierarchicalInjectorComponent,
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
      {
        path: 'websockets/gateways',
        component: GatewaysComponent,
      },
      {
        path: 'websockets/pipes',
        component: WsPipesComponent,
      },
      {
        path: 'websockets/exception-filters',
        component: WsExceptionFiltersComponent,
      },
      {
        path: 'websockets/guards',
        component: WsGuardsComponent,
      },
      {
        path: 'websockets/interceptors',
        component: WsInterceptorsComponent,
      },
      {
        path: 'websockets/adapter',
        component: AdapterComponent,
      },
      {
        path: 'microservices/basics',
        component: BasicsComponent,
      },
      {
        path: 'microservices/redis',
        component: RedisComponent,
      },
      {
        path: 'microservices/pipes',
        component: MicroservicesPipesComponent,
      },
      {
        path: 'microservices/exception-filters',
        component: MicroservicesExceptionFiltersComponent,
      },
      {
        path: 'microservices/guards',
        component: MicroservicesGuardsComponent,
      },
      {
        path: 'microservices/interceptors',
        component: MicroservicesInterceptorsComponent,
      },
      {
        path: 'microservices/custom-transport',
        component: CustomTransportComponent,
      },
      {
        path: 'recipes/sql-typeorm',
        component: SqlTypeormComponent,
      },
      {
        path: 'faq/express-instance',
        component: ExpressInstanceComponent,
      },
      {
        path: 'faq/global-prefix',
        component: GlobalPrefixComponent,
      },
      {
        path: 'faq/lifecycle-events',
        component: LifecycleEventsComponent,
      },
      {
        path: 'faq/hybrid-application',
        component: HybridApplicationComponent,
      },
      {
        path: 'faq/multiple-servers',
        component: MultipleServersComponent,
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
