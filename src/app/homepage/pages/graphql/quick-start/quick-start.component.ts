import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-quick-start',
  templateUrl: './quick-start.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickStartComponent extends BasePageComponent {}
