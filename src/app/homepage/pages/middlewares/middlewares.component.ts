import { Component, OnInit } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-middlewares',
  templateUrl: './middlewares.component.html',
  styleUrls: ['./middlewares.component.scss']
})
export class MiddlewaresComponent extends BasePageComponent {
  get loggerMiddleware() {
    return `
import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';

@Middleware()
export class LoggerMiddleware implements NestMiddleware {
  resolve(...args: any[]): ExpressMiddleware {
    return (req, res, next) => {
      console.log('Request...');
      next();
    };
  }
}`;
  }

  get loggerMiddlewareJs() {
    return `
import { Middleware } from '@nestjs/common';

@Middleware()
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
import { Module, NestModule, MiddlewaresConsumer, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
    modules: [CatsModule],
})
export class ApplicationModule implements NestModule {
    configure(consumer: MiddlewaresConsumer): void {
        consumer.apply(LoggerMiddleware).forRoutes(
            { path: '/cats', method: RequestMethod.GET },
            { path: '/cats', method: RequestMethod.POST },
        );
    }
}`;
  }

  get applicationModuleJs() {
    return `
import { Module, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
    modules: [CatsModule],
})
export class ApplicationModule {
    configure(consumer) {
        consumer.apply(LoggerMiddleware).forRoutes(
            { path: '/cats', method: RequestMethod.GET },
            { path: '/cats', method: RequestMethod.POST },
        );
    }
}`;
  }

  get applicationModuleByControllers() {
    return `
import { Module, NestModule, MiddlewaresConsumer, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
    modules: [CatsModule],
})
export class ApplicationModule implements NestModule {
    configure(consumer: MiddlewaresConsumer): void {
        consumer.apply(LoggerMiddleware).forRoutes(CatsController);
    }
}`;
  }

  get applicationModuleByControllersJs() {
    return `
import { Module, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
    modules: [CatsModule],
})
export class ApplicationModule {
    configure(consumer) {
        consumer.apply(LoggerMiddleware).forRoutes(CatsController);
    }
}`;
  }

  get applicationModuleWithMethod() {
    return `
import { Module, NestModule, MiddlewaresConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
    modules: [CatsModule],
})
export class ApplicationModule implements NestModule {
    configure(consumer: MiddlewaresConsumer): void {
        consumer.apply(LoggerMiddleware)
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
    modules: [CatsModule],
})
export class ApplicationModule {
    configure(consumer) {
        consumer.apply(LoggerMiddleware)
            .with('ApplicationModule')
            .forRoutes(CatsController);
    }
}`;
  }

  get loggerMiddlewareWithArgs() {
    return `
import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';

@Middleware()
export class LoggerMiddleware implements NestMiddleware {
  resolve(name: string): ExpressMiddleware {
    return (req, res, next) => {
      console.log(\`[\${name}\] Request...\`); // [ApplicationModule] Request...
      next();
    };
 }
}`;
  }

  get loggerMiddlewareWithArgsJs() {
    return `
import { Middleware } from '@nestjs/common';

@Middleware()
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
import { Middleware, NestMiddleware, ExpressMiddleware } from '@nestjs/common';

@Middleware()
export class LoggerMiddleware implements NestMiddleware {
  async resolve(name: string): Promise<ExpressMiddleware> {
    await someAsyncFn();

    return async (req, res, next) => {
      await someAsyncFn();
      console.log(\`[\${name}\] Request...\`); // [ApplicationModule] Request...
      next();
    };
 }
}`;
  }

  get defferedMiddlewareJs() {
    return `
import { Middleware } from '@nestjs/common';

@Middleware()
export class LoggerMiddleware {
  async resolve(name) {
    await someAsyncFn();

    return async (req, res, next) => {
      await someAsyncFn();
      console.log(\`[\${name}\] Request...\`); // [ApplicationModule] Request...
      next();
    };
  }
}`;
  }

    get functionalMiddleware() {
        return `
export const loggerMiddleware = (req, res, next) => {
  console.log(\`Request...\`);
  next();
};`;
    }

    get applyFunctionalMiddleware() {
        return `
import { Module, NestModule, MiddlewaresConsumer } from '@nestjs/common';
import { loggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  modules: [CatsModule],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewaresConsumer): void {
    consumer.apply(loggerMiddleware).forRoutes(CatsController);
  }
}`;
    }

    get applyFunctionalMiddlewareJs() {
      return `
import { Module } from '@nestjs/common';
import { loggerMiddleware } from './common/middlewares/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  modules: [CatsModule],
})
export class ApplicationModule {
  configure(consumer) {
    consumer.apply(loggerMiddleware).forRoutes(CatsController);
  }
}`;
  }
}