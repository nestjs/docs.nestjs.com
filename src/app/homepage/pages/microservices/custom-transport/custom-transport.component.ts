import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-custom-transport',
  templateUrl: './custom-transport.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomTransportComponent extends BasePageComponent {}
