import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-nats',
  templateUrl: './nats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NatsComponent extends BasePageComponent {
  get options() {
    return `
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.NATS,
  options: {
    url: 'nats://localhost:4222',
  },
});`;
  }
}