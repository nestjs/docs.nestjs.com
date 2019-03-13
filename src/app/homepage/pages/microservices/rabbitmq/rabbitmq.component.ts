import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-rabbitmq',
  templateUrl: './rabbitmq.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RabbitMQComponent extends BasePageComponent {}
