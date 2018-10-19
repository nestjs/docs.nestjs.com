import { ChangeDetectionStrategy, Component } from '@angular/core';
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

  get inheritance() {
    return `
import { Logger } from '@nestjs/common';

export class MyLogger extends Logger {
  error(message: string, trace: string) {
    // add your custom business logic
    super.error(message, trace);
  }
}`;
  }

  get loggerModule() {
    return `
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service.ts';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {};`;
  }

  get useLoggerDi() {
    return `
const app = await NestFactory.create(ApplicationModule, {
  logger: false,
});
app.useLogger(app.get(MyLogger));
await app.listen(3000);`;
  }
}
