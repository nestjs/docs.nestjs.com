import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mqtt',
  templateUrl: './mqtt.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MqttComponent extends BasePageComponent {}
