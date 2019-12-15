import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-kafka',
  templateUrl: './kafka.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KafkaComponent extends BasePageComponent {}
