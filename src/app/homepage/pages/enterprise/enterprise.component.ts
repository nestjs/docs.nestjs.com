import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-enterprise',
  templateUrl: './enterprise.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterpriseComponent extends BasePageComponent {}
