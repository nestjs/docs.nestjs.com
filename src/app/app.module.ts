import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  PerfectScrollbarConfigInterface,
  PerfectScrollbarModule,
  PERFECT_SCROLLBAR_CONFIG,
} from 'ngx-perfect-scrollbar';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderAnchorDirective } from './common/directives/header-anchor.directive';
import { FooterComponent } from './homepage/footer/footer.component';
import { HeaderComponent } from './homepage/header/header.component';
import { HomepageComponent } from './homepage/homepage.component';
import { MenuItemComponent } from './homepage/menu/menu-item/menu-item.component';
import { MenuComponent } from './homepage/menu/menu.component';
import { HierarchicalInjectorComponent } from './homepage/pages/advanced/hierarchical-injector/hierarchical-injector.component';
import { MixinComponentsComponent } from './homepage/pages/advanced/mixin-components/mixin-components.component';
import { CliModule } from './homepage/pages/cli/cli.module';
import { ComponentsComponent } from './homepage/pages/components/components.component';
import { ControllersComponent } from './homepage/pages/controllers/controllers.component';
import { CustomDecoratorsComponent } from './homepage/pages/custom-decorators/custom-decorators.component';
import { WhoUsesComponent } from './homepage/pages/discover/who-uses/who-uses.component';
import { ExceptionFiltersComponent } from './homepage/pages/exception-filters/exception-filters.component';
import { ExecutionContextComponent } from './homepage/pages/execution-context/execution-context.component';
import { ExpressInstanceComponent } from './homepage/pages/faq/express-instance/express-instance.component';
import { GlobalPrefixComponent } from './homepage/pages/faq/global-prefix/global-prefix.component';
import { HybridApplicationComponent } from './homepage/pages/faq/hybrid-application/hybrid-application.component';
import { LifecycleEventsComponent } from './homepage/pages/faq/lifecycle-events/lifecycle-events.component';
import { MultipleServersComponent } from './homepage/pages/faq/multiple-servers/multiple-servers.component';
import { FirstStepsComponent } from './homepage/pages/first-steps/first-steps.component';
import { AsyncComponentsComponent } from './homepage/pages/fundamentals/async-components/async-components.component';
import { CircularDependencyComponent } from './homepage/pages/fundamentals/circular-dependency/circular-dependency.component';
import { DependencyInjectionComponent } from './homepage/pages/fundamentals/dependency-injection/dependency-injection.component';
import { E2eTestingComponent } from './homepage/pages/fundamentals/e2e-testing/e2e-testing.component';
import { PlatformAgnosticismComponent } from './homepage/pages/fundamentals/platform-agnosticism/platform-agnosticism.component';
import { UnitTestingComponent } from './homepage/pages/fundamentals/unit-testing/unit-testing.component';
import { GuardsInterceptorsComponent } from './homepage/pages/graphql/guards-interceptors/guards-interceptors.component';
import { IdeComponent } from './homepage/pages/graphql/ide/ide.component';
import { MutationsComponent } from './homepage/pages/graphql/mutations/mutations.component';
import { QuickStartComponent } from './homepage/pages/graphql/quick-start/quick-start.component';
import { ResolversMapComponent } from './homepage/pages/graphql/resolvers-map/resolvers-map.component';
import { ScalarsComponent } from './homepage/pages/graphql/scalars/scalars.component';
import { SchemaStitchingComponent } from './homepage/pages/graphql/schema-stitching/schema-stitching.component';
import { SubscriptionsComponent } from './homepage/pages/graphql/subscriptions/subscriptions.component';
import { GuardsComponent } from './homepage/pages/guards/guards.component';
import { InterceptorsComponent } from './homepage/pages/interceptors/interceptors.component';
import { IntroductionComponent } from './homepage/pages/introduction/introduction.component';
import { BasicsComponent } from './homepage/pages/microservices/basics/basics.component';
import { CustomTransportComponent } from './homepage/pages/microservices/custom-transport/custom-transport.component';
import { MicroservicesExceptionFiltersComponent } from './homepage/pages/microservices/exception-filters/exception-filters.component';
import { GrpcComponent } from './homepage/pages/microservices/grpc/grpc.component';
import { MicroservicesGuardsComponent } from './homepage/pages/microservices/guards/guards.component';
import { MicroservicesInterceptorsComponent } from './homepage/pages/microservices/interceptors/interceptors.component';
import { MqttComponent } from './homepage/pages/microservices/mqtt/mqtt.component';
import { NatsComponent } from './homepage/pages/microservices/nats/nats.component';
import { MicroservicesPipesComponent } from './homepage/pages/microservices/pipes/pipes.component';
import { RabbitMQComponent } from './homepage/pages/microservices/rabbitmq/rabbitmq.component';
import { RedisComponent } from './homepage/pages/microservices/redis/redis.component';
import { MiddlewaresComponent } from './homepage/pages/middlewares/middlewares.component';
import { MigrationComponent } from './homepage/pages/migration/migration.component';
import { ModulesComponent } from './homepage/pages/modules/modules.component';
import { BasePageComponent } from './homepage/pages/page/page.component';
import { PipesComponent } from './homepage/pages/pipes/pipes.component';
import { CqrsComponent } from './homepage/pages/recipes/cqrs/cqrs.component';
import { MockgooseComponent } from './homepage/pages/recipes/mockgoose/mockgoose.component';
import { MongodbComponent } from './homepage/pages/recipes/mongodb/mongodb.component';
import { PassportComponent } from './homepage/pages/recipes/passport/passport.component';
import { PrismaComponent } from './homepage/pages/recipes/prisma/prisma.component';
import { SqlSequelizeComponent } from './homepage/pages/recipes/sql-sequelize/sql-sequelize.component';
import { SqlTypeormComponent } from './homepage/pages/recipes/sql-typeorm/sql-typeorm.component';
import { SwaggerComponent } from './homepage/pages/recipes/swagger/swagger.component';
import { SupportComponent } from './homepage/pages/support/support.component';
import { AuthenticationComponent } from './homepage/pages/techniques/authentication/authentication.component';
import { CachingComponent } from './homepage/pages/techniques/caching/caching.component';
import { CompressionComponent } from './homepage/pages/techniques/compression/compression.component';
import { ConfigurationComponent } from './homepage/pages/techniques/configuration/configuration.component';
import { FileUploadComponent } from './homepage/pages/techniques/file-upload/file-upload.component';
import { HotReloadComponent } from './homepage/pages/techniques/hot-reload/hot-reload.component';
import { HttpModuleComponent } from './homepage/pages/techniques/http-module/http-module.component';
import { LoggerComponent } from './homepage/pages/techniques/logger/logger.component';
import { MongoComponent } from './homepage/pages/techniques/mongo/mongo.component';
import { MvcComponent } from './homepage/pages/techniques/mvc/mvc.component';
import { PerformanceComponent } from './homepage/pages/techniques/performance/performance.component';
import { SecurityComponent } from './homepage/pages/techniques/security/security.component';
import { SerializationComponent } from './homepage/pages/techniques/serialization/serialization.component';
import { SqlComponent } from './homepage/pages/techniques/sql/sql.component';
import { ValidationComponent } from './homepage/pages/techniques/validation/validation.component';
import { AdapterComponent } from './homepage/pages/websockets/adapter/adapter.component';
import { WsExceptionFiltersComponent } from './homepage/pages/websockets/exception-filters/exception-filters.component';
import { GatewaysComponent } from './homepage/pages/websockets/gateways/gateways.component';
import { WsGuardsComponent } from './homepage/pages/websockets/guards/guards.component';
import { WsInterceptorsComponent } from './homepage/pages/websockets/interceptors/interceptors.component';
import { WsPipesComponent } from './homepage/pages/websockets/pipes/pipes.component';
import { TocComponent } from './homepage/toc/toc.component';
import { TabsComponent } from './shared/components/tabs/tabs.component';
import { ExtensionPipe } from './shared/pipes/extension.pipe';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
  wheelPropagation: true,
};

@NgModule({
  imports: [BrowserModule, AppRoutingModule, PerfectScrollbarModule, CliModule],
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
    HeaderAnchorDirective,
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
    PrismaComponent,
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
    PlatformAgnosticismComponent,
    ScalarsComponent,
    AuthenticationComponent,
    SecurityComponent,
    LoggerComponent,
    PerformanceComponent,
    FileUploadComponent,
    HttpModuleComponent,
    HotReloadComponent,
    ConfigurationComponent,
    MigrationComponent,
    MqttComponent,
    GrpcComponent,
    RabbitMQComponent,
    NatsComponent,
    SupportComponent,
    TocComponent,
    CompressionComponent,
    ValidationComponent,
    CachingComponent,
    SerializationComponent,
    WhoUsesComponent,
  ],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
  ],
})
export class AppModule {}
