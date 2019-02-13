import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-gateways',
  templateUrl: './gateways.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GatewaysComponent extends BasePageComponent {}
