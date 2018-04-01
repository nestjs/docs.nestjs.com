import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {
  PERFECT_SCROLLBAR_CONFIG,
  PerfectScrollbarConfigInterface,
  PerfectScrollbarModule
} from 'ngx-perfect-scrollbar';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomepageComponent } from './homepage/homepage.component';
import { HeaderComponent } from './homepage/header/header.component';
import { FooterComponent } from './homepage/footer/footer.component';
import { MenuComponent } from './homepage/menu/menu.component';
import { MenuItemComponent } from './homepage/menu/menu-item/menu-item.component';
import { IntroductionComponent } from './homepage/pages/introduction/introduction.component';
import { FirstStepsComponent } from './homepage/pages/first-steps/first-steps.component';
import { ControllersComponent } from './homepage/pages/controllers/controllers.component';
import { BasePageComponent } from './homepage/pages/page/page.component';
import { MatchHeightDirective } from './common/directives/match-height.directive';
import { ComponentsComponent } from './homepage/pages/components/components.component';
import { ModulesComponent } from './homepage/pages/modules/modules.component';
import { MiddlewaresComponent } from './homepage/pages/middlewares/middlewares.component';
import { PipesComponent } from './homepage/pages/pipes/pipes.component';
import { ExceptionFiltersComponent } from './homepage/pages/exception-filters/exception-filters.component';
import { GuardsComponent } from './homepage/pages/guards/guards.component';
import { DependencyInjectionComponent } from './homepage/pages/fundamentals/dependency-injection/dependency-injection.component';
import { AsyncComponentsComponent } from './homepage/pages/fundamentals/async-components/async-components.component';
import { InterceptorsComponent } from './homepage/pages/interceptors/interceptors.component';
import { CircularDependencyComponent } from './homepage/pages/fundamentals/circular-dependency/circular-dependency.component';
import { UnitTestingComponent } from './homepage/pages/fundamentals/unit-testing/unit-testing.component';
import { E2eTestingComponent } from './homepage/pages/fundamentals/e2e-testing/e2e-testing.component';
import { GatewaysComponent } from './homepage/pages/websockets/gateways/gateways.component';
import { AdapterComponent } from './homepage/pages/websockets/adapter/adapter.component';
import { WsExceptionFiltersComponent } from './homepage/pages/websockets/exception-filters/exception-filters.component';
import { WsInterceptorsComponent } from './homepage/pages/websockets/interceptors/interceptors.component';
import { WsGuardsComponent } from './homepage/pages/websockets/guards/guards.component';
import { WsPipesComponent } from './homepage/pages/websockets/pipes/pipes.component';
import { BasicsComponent } from './homepage/pages/microservices/basics/basics.component';
import { RedisComponent } from './homepage/pages/microservices/redis/redis.component';
import { CustomTransportComponent } from './homepage/pages/microservices/custom-transport/custom-transport.component';
import { MicroservicesInterceptorsComponent } from './homepage/pages/microservices/interceptors/interceptors.component';
import { MicroservicesGuardsComponent } from './homepage/pages/microservices/guards/guards.component';
import { MicroservicesPipesComponent } from './homepage/pages/microservices/pipes/pipes.component';
import { MicroservicesExceptionFiltersComponent } from './homepage/pages/microservices/exception-filters/exception-filters.component';
import { ExpressInstanceComponent } from './homepage/pages/faq/express-instance/express-instance.component';
import { GlobalPrefixComponent } from './homepage/pages/faq/global-prefix/global-prefix.component';
import { LifecycleEventsComponent } from './homepage/pages/faq/lifecycle-events/lifecycle-events.component';
import { HybridApplicationComponent } from './homepage/pages/faq/hybrid-application/hybrid-application.component';
import { MultipleServersComponent } from './homepage/pages/faq/multiple-servers/multiple-servers.component';
import { HierarchicalInjectorComponent } from './homepage/pages/advanced/hierarchical-injector/hierarchical-injector.component';
import { SqlTypeormComponent } from './homepage/pages/recipes/sql-typeorm/sql-typeorm.component';
import { MixinComponentsComponent } from './homepage/pages/advanced/mixin-components/mixin-components.component';
import { SqlSequelizeComponent } from './homepage/pages/recipes/sql-sequelize/sql-sequelize.component';
import { MongodbComponent } from './homepage/pages/recipes/mongodb/mongodb.component';
import { PassportComponent } from './homepage/pages/recipes/passport/passport.component';
import { SwaggerComponent } from './homepage/pages/recipes/swagger/swagger.component';
import { CqrsComponent } from './homepage/pages/recipes/cqrs/cqrs.component';
import { TabsComponent } from './shared/components/tabs/tabs.component';
import { ExtensionPipe } from './shared/pipes/extension.pipe';
import { MockgooseComponent } from './homepage/pages/recipes/mockgoose/mockgoose.component';
import { CustomDecoratorsComponent } from './homepage/pages/custom-decorators/custom-decorators.component';
import { ExecutionContextComponent } from './homepage/pages/execution-context/execution-context.component';
import { QuickStartComponent } from './homepage/pages/graphql/quick-start/quick-start.component';
import { ResolversMapComponent } from './homepage/pages/graphql/resolvers-map/resolvers-map.component';
import { MutationsComponent } from './homepage/pages/graphql/mutations/mutations.component';
import { SubscriptionsComponent } from './homepage/pages/graphql/subscriptions/subscriptions.component';
import { SchemaStitchingComponent } from './homepage/pages/graphql/schema-stitching/schema-stitching.component';
import { GuardsInterceptorsComponent } from './homepage/pages/graphql/guards-interceptors/guards-interceptors.component';
import { IdeComponent } from './homepage/pages/graphql/ide/ide.component';
import { SqlComponent } from './homepage/pages/techniques/sql/sql.component';
import { MvcComponent } from './homepage/pages/techniques/mvc/mvc.component';
import { MongoComponent } from './homepage/pages/techniques/mongo/mongo.component';
import { CliModule } from './homepage/pages/cli/cli.module';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
  wheelPropagation: true,
};

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    PerfectScrollbarModule,
    CliModule
  ],
  declarations: [
    AppComponent,
    HomepageComponent,
    HeaderComponent,
    FooterComponent,
    MenuComponent,
    MenuItemComponent,
    IntroductionComponent,
    FirstStepsComponent,
    ControllersComponent,
    BasePageComponent,
    MatchHeightDirective,
    ComponentsComponent,
    ModulesComponent,
    MiddlewaresComponent,
    PipesComponent,
    ExceptionFiltersComponent,
    GuardsComponent,
    DependencyInjectionComponent,
    AsyncComponentsComponent,
    InterceptorsComponent,
    CircularDependencyComponent,
    UnitTestingComponent,
    E2eTestingComponent,
    GatewaysComponent,
    AdapterComponent,
    WsPipesComponent,
    WsInterceptorsComponent,
    WsGuardsComponent,
    WsExceptionFiltersComponent,
    BasicsComponent,
    RedisComponent,
    CustomTransportComponent,
    MicroservicesExceptionFiltersComponent,
    MicroservicesPipesComponent,
    MicroservicesInterceptorsComponent,
    MicroservicesGuardsComponent,
    ExpressInstanceComponent,
    GlobalPrefixComponent,
    LifecycleEventsComponent,
    HybridApplicationComponent,
    MultipleServersComponent,
    HierarchicalInjectorComponent,
    SqlTypeormComponent,
    MixinComponentsComponent,
    SqlSequelizeComponent,
    MongodbComponent,
    MockgooseComponent,
    PassportComponent,
    SwaggerComponent,
    CqrsComponent,
    TabsComponent,
    ExtensionPipe,
    CustomDecoratorsComponent,
    ExecutionContextComponent,
    QuickStartComponent,
    ResolversMapComponent,
    MutationsComponent,
    SubscriptionsComponent,
    SchemaStitchingComponent,
    GuardsInterceptorsComponent,
    IdeComponent,
    SqlComponent,
    MvcComponent,
    MongoComponent,
  ],
  bootstrap: [
    AppComponent
  ],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ]
})
export class AppModule {}
