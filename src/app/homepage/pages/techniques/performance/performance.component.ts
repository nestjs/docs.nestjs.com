import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformanceComponent extends BasePageComponent {
  get packages() {
    return `
$ npm i --save fastify fastify-formbody`;
  }

  get bootstrap() {
    return `
import { NestFactory, FastifyAdapter } from '@nestjs/core';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule, new FastifyAdapter());
  await app.listen(3000);
}
bootstrap();`;
  }

  get docker() {
    return `
await app.listen(3000, '0.0.0.0');
`;
  }
}
