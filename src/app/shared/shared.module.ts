import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StorageService } from './services/storage.service';
import { ThemeModeToggleComponent } from './components/theme-mode-toggle/theme-mode-toggle.component';
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
import { CopyButtonComponent } from './components/copy-button/copy-button.component';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [CommonModule, ClipboardModule, MatIconModule],
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
    ThemeModeToggleComponent,
    CopyButtonComponent,
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
    ThemeModeToggleComponent,
    CopyButtonComponent
  ],
  providers: [StorageService],
})
export class SharedModule {}
