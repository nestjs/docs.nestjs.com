import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
    url: \`amqp://$\{conf.user}:\${conf.password}@\${conf.host}\`,
    queue: 'myqueue',
    queueOptions: { durable: false }
  },
});`;
  }

  get client() {
    return `
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        url: \`amqp://\${conf.user}:\${conf.password}@\${conf.host}\`,
        queue: 'myqueue',
        queueOptions: { durable: false }
      }
    });`;
  }

  get send() {
    return `
    let pattern = { cmd: 'doit' };
    this.client.send<MyInterfaceForMessage, MyInterfaceForReply>(pattern, 'myqueue').subscribe((x: MyInterfaceForReply) => {
      console.log('I got resp: ' + x);
    })`;
  }

}
