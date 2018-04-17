import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mqtt',
  templateUrl: './mqtt.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MqttComponent extends BasePageComponent {
  get options() {
    return `
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.MQTT,
  options: {
    host: 'localhost',
    port: 1883,
  },
});`;
  }
}