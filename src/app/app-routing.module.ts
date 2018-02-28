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
import { DependencyInjectionComponent } from './homepage/pages/fundamentals/dependency-injection/dependency-injection.component';
import { AsyncComponentsComponent } from './homepage/pages/fundamentals/async-components/async-components.component';
import { CircularDependencyComponent } from './homepage/pages/fundamentals/circular-dependency/circular-dependency.component';
import { UnitTestingComponent } from './homepage/pages/fundamentals/unit-testing/unit-testing.component';
import { E2eTestingComponent } from './homepage/pages/fundamentals/e2e-testing/e2e-testing.component';
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
import { MongodbComponent } from './homepage/pages/recipes/mongodb/mongodb.component';
import { SqlSequelizeComponent } from './homepage/pages/recipes/sql-sequelize/sql-sequelize.component';
import { PassportComponent } from './homepage/pages/recipes/passport/passport.component';
import { CqrsComponent } from './homepage/pages/recipes/cqrs/cqrs.component';
import { MockgooseComponent } from './homepage/pages/recipes/mockgoose/mockgoose.component';
import { CustomDecoratorsComponent } from './homepage/pages/custom-decorators/custom-decorators.component';
import { SwaggerComponent } from './homepage/pages/recipes/swagger/swagger.component';
import { ExecutionContextComponent } from './homepage/pages/execution-context/execution-context.component';
import { QuickStartComponent } from './homepage/pages/graphql/quick-start/quick-start.component';
import { ResolversMapComponent } from './homepage/pages/graphql/resolvers-map/resolvers-map.component';
import { MutationsComponent } from './homepage/pages/graphql/mutations/mutations.component';
import { SubscriptionsComponent } from './homepage/pages/graphql/subscriptions/subscriptions.component';
import { SchemaStitchingComponent } from './homepage/pages/graphql/schema-stitching/schema-stitching.component';
import { GuardsInterceptorsComponent } from './homepage/pages/graphql/guards-interceptors/guards-interceptors.component';
import { IdeComponent } from './homepage/pages/graphql/ide/ide.component';
import { MvcComponent } from './homepage/pages/techniques/mvc/mvc.component';
import { SqlComponent } from './homepage/pages/techniques/sql/sql.component';
import { MongoComponent } from './homepage/pages/techniques/mongo/mongo.component';
import { CliComponent } from './homepage/pages/cli/cli.component';

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
        data: { title: 'First Steps' },
      },
      {
        path: 'controllers',
        component: ControllersComponent,
        data: { title: 'Controllers' },
      },
      {
        path: 'components',
        component: ComponentsComponent,
        data: { title: 'Components' },
      },
      {
        path: 'modules',
        component: ModulesComponent,
        data: { title: 'Modules' },
      },
      {
        path: 'middlewares',
        component: MiddlewaresComponent,
        data: { title: 'Middlewares' },
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
        data: { title: 'Exception Filters' },
      },
      {
        path: 'interceptors',
        component: InterceptorsComponent,
        data: { title: 'Interceptors' },
      },
      {
        path: 'custom-decorators',
        component: CustomDecoratorsComponent,
        data: { title: 'Custom Decorators' },
      },
      {
        path: 'fundamentals/dependency-injection',
        component: DependencyInjectionComponent,
        data: { title: 'Dependency Injection' },
      },
      {
        path: 'fundamentals/async-components',
        component: AsyncComponentsComponent,
        data: { title: 'Async Components' },
      },
      {
        path: 'advanced/mixins',
        component: MixinComponentsComponent,
        data: { title: 'Mixin Class' },
      },
      {
        path: 'advanced/hierarchical-injector',
        component: HierarchicalInjectorComponent,
        data: { title: 'Hierarchical Injector' },
      },
      {
        path: 'fundamentals/circular-dependency',
        component: CircularDependencyComponent,
        data: { title: 'Circular Dependency' },
      },
      {
        path: 'fundamentals/unit-testing',
        component: UnitTestingComponent,
        data: { title: 'Unit Testing' },
      },
      {
        path: 'fundamentals/e2e-testing',
        component: E2eTestingComponent,
        data: { title: 'E2E Testing' },
      },
      {
        path: 'execution-context',
        component: ExecutionContextComponent,
        data: { title: 'Execution Context' },
      },
      {
        path: 'graphql/quick-start',
        component: QuickStartComponent,
        data: { title: 'GraphQL - Quick Start' },
      },
      {
        path: 'graphql/resolvers-map',
        component: ResolversMapComponent,
        data: { title: 'GraphQL - Resolvers Map' },
      },
      {
        path: 'graphql/mutations',
        component: MutationsComponent,
        data: { title: 'GraphQL - Mutations' },
      },
      {
        path: 'graphql/subscriptions',
        component: SubscriptionsComponent,
        data: { title: 'GraphQL - Subscriptions' },
      },
      {
        path: 'graphql/guards-interceptors',
        component: GuardsInterceptorsComponent,
        data: { title: 'GraphQL - Guards & Interceptors' },
      },
      {
        path: 'graphql/ide',
        component: IdeComponent,
        data: { title: 'GraphQL - IDE' },
      },
      {
        path: 'graphql/schema-stitching',
        component: SchemaStitchingComponent,
        data: { title: 'GraphQL - Schema Stitching' },
      },
      {
        path: 'websockets/gateways',
        component: GatewaysComponent,
        data: { title: 'Gateways' },
      },
      {
        path: 'websockets/pipes',
        component: WsPipesComponent,
        data: { title: 'Pipes - Gateways' },
      },
      {
        path: 'websockets/exception-filters',
        component: WsExceptionFiltersComponent,
        data: { title: 'Exception Filters - Gateways' },
      },
      {
        path: 'websockets/guards',
        component: WsGuardsComponent,
        data: { title: 'Guards - Gateways' },
      },
      {
        path: 'websockets/interceptors',
        component: WsInterceptorsComponent,
        data: { title: 'Interceptors - Gateways' },
      },
      {
        path: 'websockets/adapter',
        component: AdapterComponent,
        data: { title: 'Adapter - Gateways' },
      },
      {
        path: 'microservices/basics',
        component: BasicsComponent,
        data: { title: 'Microservices' },
      },
      {
        path: 'microservices/redis',
        component: RedisComponent,
        data: { title: 'Redis - Microservices' },
      },
      {
        path: 'microservices/pipes',
        component: MicroservicesPipesComponent,
        data: { title: 'Pipes - Microservices' },
      },
      {
        path: 'microservices/exception-filters',
        component: MicroservicesExceptionFiltersComponent,
        data: { title: 'Exception Filters - Microservices' },
      },
      {
        path: 'microservices/guards',
        component: MicroservicesGuardsComponent,
        data: { title: 'Guards - Microservices' },
      },
      {
        path: 'microservices/interceptors',
        component: MicroservicesInterceptorsComponent,
        data: { title: 'Interceptors - Microservices' },
      },
      {
        path: 'microservices/custom-transport',
        component: CustomTransportComponent,
        data: { title: 'Custom Transport - Microservices' },
      },
      {
        path: 'recipes/sql-typeorm',
        component: SqlTypeormComponent,
        data: { title: 'SQL (TypeORM)' },
      },
      {
        path: 'recipes/mongodb',
        component: MongodbComponent,
        data: { title: 'MongoDB (Mongoose)' },
      },
      {
        path: 'recipes/mockgoose',
        component: MockgooseComponent,
        data: { title: 'MongoDB E2E Testing (Mongoose + Mockgoose)' },
      },
      {
        path: 'recipes/passport',
        redirectTo: 'techniques/authentication',
      },
      {
        path: 'techniques/authentication',
        component: PassportComponent,
        data: { title: 'Authentication' },
      },
      {
        path: 'recipes/sql-sequelize',
        component: SqlSequelizeComponent,
        data: { title: 'SQL (Sequelize)' },
      },
      {
        path: 'recipes/cqrs',
        component: CqrsComponent,
        data: { title: 'CQRS' },
      },
      {
        path: 'recipes/swagger',
        component: SwaggerComponent,
        data: { title: 'OpenAPI (Swagger)' },
      },
      {
        path: 'techniques/mvc',
        component: MvcComponent,
        data: { title: 'MVC' },
      },
      {
        path: 'techniques/mvc',
        component: MvcComponent,
        data: { title: 'MVC' },
      },
      {
        path: 'techniques/sql',
        component: SqlComponent,
        data: { title: 'SQL' },
      },
      {
        path: 'techniques/mongodb',
        component: MongoComponent,
        data: { title: 'MongoDB' },
      },
      {
        path: 'faq/express-instance',
        component: ExpressInstanceComponent,
        data: { title: 'Express Instance - FAQ' },
      },
      {
        path: 'faq/global-prefix',
        component: GlobalPrefixComponent,
        data: { title: 'Global Prefix - FAQ' },
      },
      {
        path: 'faq/lifecycle-events',
        component: LifecycleEventsComponent,
        data: { title: 'Lifecycle Events - FAQ' },
      },
      {
        path: 'faq/hybrid-application',
        component: HybridApplicationComponent,
        data: { title: 'Hybrid Application - FAQ' },
      },
      {
        path: 'faq/multiple-servers',
        component: MultipleServersComponent,
        data: { title: 'HTTPS & Multiple Servers - FAQ' },
      },
      {
        path: 'cli',
        component: CliComponent,
        data: {
          title: 'CLI'
        }
      }
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
    }),
  ],
  exports: [ RouterModule ],
})
export class AppRoutingModule {
}
