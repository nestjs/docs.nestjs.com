import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-basics',
  templateUrl: './basics.component.html',
  styleUrls: ['./basics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicsComponent extends BasePageComponent {
  get bootstrap() {
    return `
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';
import { Transport } from '@nestjs/microservices';

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
  return Observable.from([1, 2, 3]);
}`;
  }

  get streamingJs() {
    return `
@MessagePattern({ cmd: 'sum' })
sum(data) {
  return Observable.from([1, 2, 3]);
}`;
  }

  get clientDecorator() {
    return `
@Client({ transport: Transport.TCP, port: 5667 })
client: ClientProxy;`;
  }

  get sendMethod() {
    return `
@Get()
call(): Observable<number> {
  const pattern = { cmd: 'sum' };
  const data = [1, 2, 3, 4, 5];

  return this.client.send<number>(pattern, data);
}`;
  }

  get sendMethodJs() {
    return `
@Get()
call() {
  const pattern = { cmd: 'sum' };
  const data = [1, 2, 3, 4, 5];

  return this.client.send(pattern, data);
}`;
  }
}