import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
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
  ],
  exports: [ExtensionPipe, TabsComponent, TocComponent, HeaderAnchorDirective],
})
export class SharedModule {}
