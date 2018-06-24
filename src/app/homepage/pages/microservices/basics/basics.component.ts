import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-basics',
  templateUrl: './basics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicsComponent extends BasePageComponent {
  get bootstrap() {
    return `
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(ApplicationModule, {
    transport: Transport.TCP,
  });
  app.listen(() => console.log('Microservice is listening'));
}
bootstrap();
`;
  }

  get mathController() {
    return `
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  sum(data: number[]): number {
    return (data || []).reduce((a, b) => a + b);
  }
}`;
  }

  get mathControllerJs() {
    return `
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  sum(data) {
    return (data || []).reduce((a, b) => a + b);
  }
}`;
  }

  get streaming() {
    return `
@MessagePattern({ cmd: 'sum' })
sum(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}`;
  }

  get streamingJs() {
    return `
@MessagePattern({ cmd: 'sum' })
sum(data) {
  return from([1, 2, 3]);
}`;
  }

  get asyncPromise() {
    return `
@MessagePattern({ cmd: 'sum' })
async sum(data: number[]): Promise<number> {
  return (data || []).reduce((a, b) => a + b);
}`;
  }

  get asyncPromiseJs() {
    return `
@MessagePattern({ cmd: 'sum' })
async sum(data) {
  return (data || []).reduce((a, b) => a + b);
}`;
  }

  get clientDecorator() {
    return `
@Client({ transport: Transport.TCP })
client: ClientProxy;`;
  }

  get sendMethod() {
    return `
@Get()
call(): Observable<number> {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send<number>(pattern, payload);
}`;
  }

  get clientProxy() {
    return `
constructor() {
  this.client = ClientProxyFactory.create({
    transport: Transport.TCP
  });
}`;
  }

  get connect() {
    return `
async onModuleInit() {
  await this.client.connect();
}`;
  }

  get sendMethodJs() {
    return `
@Get()
call() {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send(pattern, payload);
}`;
  }
}