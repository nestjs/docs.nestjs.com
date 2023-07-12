import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StorageService } from './services/storage.service';
import { DarkModeToggleComponent } from './components/dark-mode-toggle/dark-mode-toggle.component';
import { BannerCoursesAuthComponent } from './components/banner-courses-auth/banner-courses-auth.component';
import { BannerCoursesGraphQLCodeFirstComponent } from './components/banner-courses-graphql-cf/banner-courses-graphql-cf.component';
import { BannerDevtoolsComponent } from './components/banner-devtools/banner-devtools.component';
import { BannerCoursesComponent } from './components/banner-courses/banner-courses.component';
import { BannerEnterpriseComponent } from './components/banner-enterprise/banner-enterprise.component';
import { BannerShopComponent } from './components/banner-shop/banner-shop.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { TocComponent } from './components/toc/toc.component';
import { HeaderAnchorDirective } from './directives/header-anchor.directive';
import { ExtensionPipe } from './pipes/extension.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [
    ExtensionPipe,
    TabsComponent,
    TocComponent,
    HeaderAnchorDirective,
    BannerCoursesComponent,
    BannerEnterpriseComponent,
    BannerShopComponent,
    BannerCoursesGraphQLCodeFirstComponent,
    BannerDevtoolsComponent,
    BannerCoursesAuthComponent,
    DarkModeToggleComponent,
  ],
  exports: [
    ExtensionPipe,
    TabsComponent,
    TocComponent,
    HeaderAnchorDirective,
    BannerCoursesComponent,
    BannerEnterpriseComponent,
    BannerShopComponent,
    BannerCoursesGraphQLCodeFirstComponent,
    BannerDevtoolsComponent,
    BannerCoursesAuthComponent,
    DarkModeToggleComponent,
  ],
  providers: [StorageService],
})
export class SharedModule {}
