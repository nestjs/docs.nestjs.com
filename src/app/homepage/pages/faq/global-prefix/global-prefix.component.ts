import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-global-prefix',
  templateUrl: './global-prefix.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalPrefixComponent extends BasePageComponent {}
