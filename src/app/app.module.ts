import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  PerfectScrollbarConfigInterface,
  PerfectScrollbarModule,
  PERFECT_SCROLLBAR_CONFIG,
} from 'ngx-perfect-scrollbar';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SocialWrapperComponent } from './common/social-wrapper/social-wrapper.component';
import { FooterComponent } from './homepage/footer/footer.component';
import { HeaderComponent } from './homepage/header/header.component';
import { HomepageComponent } from './homepage/homepage.component';
import { MenuItemComponent } from './homepage/menu/menu-item/menu-item.component';
import { MenuComponent } from './homepage/menu/menu.component';
import { NewsletterComponent } from './homepage/newsletter/newsletter.component';
import { MixinComponentsComponent } from './homepage/pages/advanced/mixin-components/mixin-components.component';
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
import { BasePageComponent } from './homepage/pages/page/page.component';
import { PipesComponent } from './homepage/pages/pipes/pipes.component';
import { SupportComponent } from './homepage/pages/support/support.component';
import { SharedModule } from './shared/shared.module';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
  wheelPropagation: true,
};

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    PerfectScrollbarModule,
    SharedModule,
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
    ComponentsComponent,
    ModulesComponent,
    MixinComponentsComponent,
    MiddlewaresComponent,
    PipesComponent,
    ExceptionFiltersComponent,
    GuardsComponent,
    InterceptorsComponent,
    CustomDecoratorsComponent,
    ApplicationContextComponent,
    MigrationComponent,
    SupportComponent,
    WhoUsesComponent,
    EnterpriseComponent,
    SocialWrapperComponent,
    NewsletterComponent,
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
