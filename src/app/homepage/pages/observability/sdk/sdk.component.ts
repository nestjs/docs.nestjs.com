import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { HeaderAnchorDirective } from '../../../../shared/directives/header-anchor.directive';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

@Component({
  selector: 'app-observability-sdk',
  templateUrl: './sdk.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CopyButtonComponent,
    HeaderAnchorDirective,
    TabsComponent,
    ExtensionPipe,
  ],
})
export class ObservabilitySdkComponent extends BasePageComponent {}
