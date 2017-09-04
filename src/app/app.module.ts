import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
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
import { DependencyInjectionComponent } from './homepage/pages/advanced/dependency-injection/dependency-injection.component';
import { AsyncComponentsComponent } from './homepage/pages/advanced/async-components/async-components.component';
import { InterceptorsComponent } from './homepage/pages/interceptors/interceptors.component';
import { CircularDependencyComponent } from './homepage/pages/advanced/circular-dependency/circular-dependency.component';
import { UnitTestingComponent } from './homepage/pages/advanced/unit-testing/unit-testing.component';
import { E2eTestingComponent } from './homepage/pages/advanced/e2e-testing/e2e-testing.component';

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    PerfectScrollbarModule.forRoot({
      suppressScrollX: true,
    }),
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
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
