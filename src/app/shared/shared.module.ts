import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { TabsComponent } from './components/tabs/tabs.component';
import { TocComponent } from './components/toc/toc.component';
import { HeaderAnchorDirective } from './directives/header-anchor.directive';
import { ExtensionPipe } from './pipes/extension.pipe';

@NgModule({
  imports: [CommonModule, PerfectScrollbarModule],
  declarations: [
    ExtensionPipe,
    TabsComponent,
    TocComponent,
    HeaderAnchorDirective,
  ],
  exports: [ExtensionPipe, TabsComponent, TocComponent, HeaderAnchorDirective],
})
export class SharedModule {}
