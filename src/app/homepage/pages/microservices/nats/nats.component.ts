import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-nats',
  templateUrl: './nats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NatsComponent extends BasePageComponent {}
