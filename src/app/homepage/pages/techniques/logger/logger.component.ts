import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoggerComponent extends BasePageComponent {
  get logger() {
    return `
const app = await NestFactory.create(ApplicationModule, {
  logger: false,
});
await app.listen(3000);`;
  }

  get console() {
    return `
const app = await NestFactory.create(ApplicationModule, {
  logger: console,
});
await app.listen(3000);`;
  }

  get myLogger() {
    return `
import { LoggerService } from '@nestjs/common';

export class MyLogger implements LoggerService {
  log(message: string) {}
  error(message: string, trace: string) {}
  warn(message: string) {}
}`;
  }

  get useMyLogger() {
    return `
const app = await NestFactory.create(ApplicationModule, {
  logger: new MyLogger(),
});
await app.listen(3000);`;
  }
}
