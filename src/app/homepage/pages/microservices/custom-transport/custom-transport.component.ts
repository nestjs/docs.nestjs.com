import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-custom-transport',
  templateUrl: './custom-transport.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomTransportComponent extends BasePageComponent {
  get rabbitMqServer() {
    return `
import * as amqp from 'amqplib';
import { Server, CustomTransportStrategy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export class RabbitMQServer extends Server implements CustomTransportStrategy {
    private server: amqp.Connection = null;
    private channel: amqp.Channel = null;

    constructor(
      private readonly host: string,
      private readonly queue: string) {
        super();
      }

  public async listen(callback: () => void) {
    await this.init();
    this.channel.consume(\`\${this.queue}_sub\`, this.handleMessage.bind(this), {
      noAck: true,
    });
  }

  public close() {
    this.channel && this.channel.close();
    this.server && this.server.close();
  }

  private async handleMessage(message) {
    const { content } = message;
    const messageObj = JSON.parse(content.toString());

    const handlers = this.getHandlers();
    const pattern = JSON.stringify(messageObj.pattern);
    if (!this.messageHandlers[pattern]) {
        return;
    }

    const handler = this.messageHandlers[pattern];
    const response$ = this.transformToObservable(await handler(messageObj.data)) as Observable<any>;
    response$ && this.send(response$, (data) => this.sendMessage(data));
  }

  private sendMessage(message) {
    const buffer = Buffer.from(JSON.stringify(message));
    this.channel.sendToQueue(\`\${this.queue}_pub\`, buffer);
  }

  private async init() {
    this.server = await amqp.connect(this.host);
    this.channel = await this.server.createChannel();
    this.channel.assertQueue(\`\${this.queue}_sub\`, { durable: false });
    this.channel.assertQueue(\`\${this.queue}_pub\`, { durable: false });
  }
}`;
  }

  get rabbitMqServerJs() {
    return `
import * as amqp from 'amqplib';
import { Server, CustomStrategy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export class RabbitMQServer extends Server {
    constructor(host, queue) {
      super();

      this.host = host;
      this.queue = queue;
      this.server = null;
      this.channel = null;
    }

  async listen(callback) {
    await this.init();
    this.channel.consume(\`\${this.queue}_sub\`, this.handleMessage.bind(this), {
      noAck: true,
    });
  }

  close() {
    this.channel && this.channel.close();
    this.server && this.server.close();
  }

  async handleMessage(message) {
    const { content } = message;
    const messageObj = JSON.parse(content.toString());

    const handlers = this.getHandlers();
    const pattern = JSON.stringify(messageObj.pattern);
    if (!this.messageHandlers[pattern]) {
        return;
    }

    const handler = this.messageHandlers[pattern];
    const response$ = this.transformToObservable(await handler(messageObj.data));
    response$ && this.send(response$, (data) => this.sendMessage(data));
  }

  sendMessage(message) {
    const buffer = Buffer.from(JSON.stringify(message));
    this.channel.sendToQueue(\`\${this.queue}_pub\`, buffer);
  }

  async init() {
    this.server = await amqp.connect(this.host);
    this.channel = await this.server.createChannel();
    this.channel.assertQueue(\`\${this.queue}_sub\`, { durable: false });
    this.channel.assertQueue(\`\${this.queue}_pub\`, { durable: false });
  }
}`;
  }

  get setupServer() {
    return `
const app = await NestFactory.createMicroservice<CustomStrategy>(ApplicationModule, {
    strategy: new RabbitMQServer('amqp://localhost', 'channel'),
});`;
  }

  get rabbitMqClient() {
    return `
import * as amqp from 'amqplib';
import { ClientProxy } from '@nestjs/microservices';

export class RabbitMQClient extends ClientProxy {
  constructor(
    private readonly host: string,
    private readonly queue: string) {
      super();
    }

  protected async sendSingleMessage(messageObj, callback: (err, result, disposed?: boolean) => void) {
    const server = await amqp.connect(this.host);
    const channel = await server.createChannel();

    const { sub, pub } = this.getQueues();
    channel.assertQueue(sub, { durable: false });
    channel.assertQueue(pub, { durable: false });

    channel.consume(pub, (message) => this.handleMessage(message, server, callback), { noAck: true });
    channel.sendToQueue(sub, Buffer.from(JSON.stringify(messageObj)));
  }

  private handleMessage(message, server, callback: (err, result, disposed?: boolean) => void) {
    const { content } = message;
    const { err, response, disposed } = JSON.parse(content.toString());
    if (disposed) {
        server.close();
    }
    callback(err, response, disposed);
  }

  private getQueues() {
    return { pub: \`\${this.queue}_pub\`, sub: \`\${this.queue}_sub\` };
  }
}`;
  }

  get rabbitMqClientJs() {
    return `
import * as amqp from 'amqplib';
import { ClientProxy } from '@nestjs/microservices';

export class RabbitMQClient extends ClientProxy {
  constructor(host, queue) {
      super();

      this.host = host;
      this.queue = queue;
    }

  async sendSingleMessage(messageObj, callback) {
    const server = await amqp.connect(this.host);
    const channel = await server.createChannel();

    const { sub, pub } = this.getQueues();
    channel.assertQueue(sub, { durable: false });
    channel.assertQueue(pub, { durable: false });

    channel.consume(pub, (message) => this.handleMessage(message, server, callback), { noAck: true });
    channel.sendToQueue(sub, Buffer.from(JSON.stringify(messageObj)));
  }

  handleMessage(message, server, callback) {
    const { content } = message;
    const { err, response, disposed } = JSON.parse(content.toString());
    if (disposed) {
        server.close();
    }
    callback(err, response, disposed);
  }

  getQueues() {
    return { pub: \`\${this.queue}_pub\`, sub: \`\${this.queue}_sub\` };
  }
}`;
  }

  get rabbitMqClientNew() {
    return `
this.client = new RabbitMQClient('amqp://localhost', 'example');`;
  }
}
