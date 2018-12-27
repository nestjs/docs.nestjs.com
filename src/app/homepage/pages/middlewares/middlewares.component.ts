import { Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-middlewares',
  templateUrl: './middlewares.component.html',
})
export class MiddlewaresComponent extends BasePageComponent {
  get loggerMiddleware() {
    return `
import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  resolve(...args: any[]): MiddlewareFunction {
    return (req, res, next) => {
      console.log('Request...');
      next();
    };
  }
}`;
  }

  get loggerMiddlewareJs() {
    return `
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware {
  resolve(...args) {
    return (req, res, next) => {
      console.log('Request...');
      next();
    };
  }
}`;
  }

  get applicationModule() {
    return `
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats');
  }
}`;
  }

  get applicationModuleJs() {
    return `
import { Module } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class ApplicationModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats');
  }
}`;
  }

  get routeInfo() {
    return `
import { Module, NestModule, RequestMethod, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
  }
}`;
  }

  get routeInfoJs() {
    return `
import { Module, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class ApplicationModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
  }
}`;
  }

  get routeWildcards() {
    return `
forRoutes({ path: 'ab*cd', method: RequestMethod.ALL })`;
  }

  get applicationModuleByControllers() {
    return `
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(CatsController);
  }
}`;
  }

  get applicationModuleByControllersJs() {
    return `
import { Module } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class ApplicationModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(CatsController);
  }
}`;
  }

  get applicationModuleExclude() {
    return `
import { Module, NestModule, RequestMethod, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude(
        { path: 'cats', method: RequestMethod.GET },
        { path: 'cats', method: RequestMethod.POST },
      )
      .forRoutes(CatsController);
  }
}`;
  }

  get applicationModuleExcludeJs() {
    return `
import { Module, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class ApplicationModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude(
        { path: 'cats', method: RequestMethod.GET },
        { path: 'cats', method: RequestMethod.POST },
      )
      .forRoutes(CatsController);
  }
}`;
  }

  get applicationModuleWithMethod() {
    return `
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .with('ApplicationModule')
      .forRoutes(CatsController);
  }
}`;
  }

  get applicationModuleWithMethodJs() {
    return `
import { Module } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class ApplicationModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .with('ApplicationModule')
      .forRoutes(CatsController);
  }
}`;
  }

  get loggerMiddlewareWithArgs() {
    return `
import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  resolve(name: string): MiddlewareFunction {
    return (req, res, next) => {
      console.log(\`[\${name}\] Request...\`); // [ApplicationModule] Request...
      next();
    };
 }
}`;
  }

  get loggerMiddlewareWithArgsJs() {
    return `
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware {
  resolve(name) {
    return (req, res, next) => {
      console.log(\`[\${name}\] Request...\`); // [ApplicationModule] Request...
      next();
    };
 }
}`;
  }

  get defferedMiddleware() {
    return `
import { Injectable, NestMiddleware, MiddlewareFunction } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  async resolve(name: string): Promise<MiddlewareFunction> {
    await someAsyncJob();

    return async (req, res, next) => {
      await someAsyncJob();
      console.log(\`[\${name}\] Request...\`); // [ApplicationModule] Request...
      next();
    };
 }
}`;
  }

  get defferedMiddlewareJs() {
    return `
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware {
  async resolve(name) {
    await someAsyncJob();

    return async (req, res, next) => {
      await someAsyncJob();
      console.log(\`[\${name}\] Request...\`); // [ApplicationModule] Request...
      next();
    };
  }
}`;
  }

  get functionalMiddleware() {
    return `
export function logger(req, res, next) {
  console.log(\`Request...\`);
  next();
};`;
  }

  get applyFunctionalMiddleware() {
    return `
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { logger } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(logger)
      .forRoutes(CatsController);
  }
}`;
  }

  get applyFunctionalMiddlewareJs() {
    return `
import { Module } from '@nestjs/common';
import { logger } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class ApplicationModule {
  configure(consumer) {
    consumer
      .apply(logger)
      .forRoutes(CatsController);
  }
}`;
  }

  get applyMultipleMiddlewares() {
    return `
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(cors(), helmet(), logger)
      .forRoutes(CatsController);
  }
}`;
  }

  get applyMultipleMiddlewaresJs() {
    return `
@Module({
  imports: [CatsModule],
})
export class ApplicationModule {
  configure(consumer) {
      consumer
        .apply(cors(), helmet(), logger)
        .forRoutes(CatsController);
    }
  }`;
  }
}
