import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { BannerCoursesComponent } from './components/banner-courses/banner-courses.component';
import { BannerEnterpriseComponent } from './components/banner-enterprise/banner-enterprise.component';
import { BannerShopComponent } from './components/banner-shop/banner-shop.component';
import { TocComponent } from './components/toc/toc.component';
import { HeaderAnchorDirective } from './directives/header-anchor.directive';
import { ExtensionPipe } from './pipes/extension.pipe';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, PerfectScrollbarModule],
  declarations: [
    ExtensionPipe,
    TocComponent,
    HeaderAnchorDirective,
    BannerCoursesComponent,
    BannerEnterpriseComponent,
    BannerShopComponent,
  ],
  exports: [
    ExtensionPipe,
    TocComponent,
    HeaderAnchorDirective,
    BannerCoursesComponent,
    BannerEnterpriseComponent,
    BannerShopComponent,
  ],
})
export class SharedModule {}
