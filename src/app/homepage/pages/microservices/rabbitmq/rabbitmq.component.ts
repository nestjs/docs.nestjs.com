import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-rabbitmq',
  templateUrl: './rabbitmq.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RabbitMQComponent extends BasePageComponent {
  get options() {
    return `
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.RMQ,
  options: {
    urls: [\`amqp://localhost:5672\`],
    queue: 'my_queue',
    queueOptions: { durable: false },
  },
});`;
  }
}
