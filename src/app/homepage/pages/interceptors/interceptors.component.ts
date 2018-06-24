import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-interceptors',
  templateUrl: './interceptors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterceptorsComponent extends BasePageComponent {
  get loggingInterceptor() {
    return `
import { Injectable, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    call$: Observable<any>,
  ): Observable<any> {
    console.log('Before...');
  
    const now = Date.now();
    return call$.pipe(
      tap(() => console.log(\`After... \${Date.now() - now\}ms\`)),
    );
  }
}`;
  }

  get loggingInterceptorJs() {
    return `
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor {
  intercept(context, call$) {
    console.log('Before...');

    const now = Date.now();
    return call$.pipe(
      tap(() => console.log(\`After... \${Date.now() - now\}ms\`)),
    );
  }
}`;
  }

  get useLoggingInterceptor() {
    return `
@UseInterceptors(LoggingInterceptor)
export class CatsController {}`;
  }

  get useLoggingInterceptorWithInstance() {
    return `
@UseInterceptors(new LoggingInterceptor())
export class CatsController {}`;
  }

  get consoleOutput() {
    return `
Before...
After... 1ms`;
  }

  get globalScopedInterceptorModule() {
    return `
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class ApplicationModule {}`;
  }

  get transformInterceptor() {
    return `
import { Injectable, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    call$: Observable<T>,
  ): Observable<Response<T>> {
    return call$.pipe(map(data => ({ data })));
  }
}`;
  }

  get transformInterceptorJs() {
    return `
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor {
  intercept(context, call$) {
    return call$.pipe(map(data => ({ data })));
  }
}`;
  }

  get nullTransformInterceptor() {
    return `
import { Injectable, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeNullInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    call$: Observable<any>,
  ): Observable<any> {
    return call$.pipe(map(value => value === null ? '' : value ));
  }
}`;
  }

  get nullTransformInterceptorJs() {
    return `
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeNullInterceptor {
  intercept(context, call$) {
    return call$.pipe(map(value => value === null ? '' : value ));
  }
}`;
  }

  get dataResponse() {
    return `
{
    "data": []
}`;
  }

  get cacheInterceptor() {
    return `
import { Injectable, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { of } from 'rxjs/observable/of';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    call$: Observable<any>,
  ): Observable<any> {
    const isCached = true;
    if (isCached) {
      return of([]);
    }
    return call$;
  }
}`;
  }

  get cacheInterceptorJs() {
    return `
import { Injectable } from '@nestjs/common';
import { of } from 'rxjs/observable/of';

@Injectable()
export class CacheInterceptor {
  intercept(context, call$) {
    const isCached = true;
    if (isCached) {
      return of([]);
    }
    return call$;
  }
}`;
  }

  get exceptionMapping() {
    return `
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { _throw } from 'rxjs/observable/throw';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    call$: Observable<any>,
  ): Observable<any> {
    return call$.pipe(
      catchError(err =>
        _throw(new HttpException('Message', HttpStatus.BAD_GATEWAY)),
      ),
    );
  }
}`;
  }

  get exceptionMappingJs() {
    return `
import { Injectable, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { catchError } from 'rxjs/operators';
import { _throw } from 'rxjs/observable/throw';

@Injectable()
export class ErrorsInterceptor {
  intercept(context, call$) {
    return call$.pipe(
      catchError(err =>
        _throw(new HttpException('Message', HttpStatus.BAD_GATEWAY)),
      ),
    );
  }
}`;
  }

  get globalInterceptors() {
    return `
const app = await NestFactory.create(ApplicationModule);
app.useGlobalInterceptors(new LoggingInterceptor());`;
  }

  get getEventsInterceptor() {
    return `
const app = await NestFactory.create(ApplicationModule);
const eventsInterceptor = app
  .select(EventsModule)
  .get(EventsInterceptor);

app.useGlobalInterceptors(eventsInterceptor);
`;
  }

  get argumentsHost() {
    return `
export interface ArgumentsHost {
  getArgs<T extends Array<any> = any[]>(): T;
  getArgByIndex<T = any>(index: number): T;
  switchToRpc(): RpcArgumentsHost;
  switchToHttp(): HttpArgumentsHost;
  switchToWs(): WsArgumentsHost;
}`;
  }

  get executionContext() {
    return `
export interface ExecutionContext extends ArgumentsHost {
  getClass<T = any>(): Type<T>;
  getHandler(): Function;
}`;
  }

  get timeoutInterceptor() {
    return `
import { Injectable, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    call$: Observable<any>,
  ): Observable<any> {
    return call$.pipe(timeout(5000))
  }
}`;
  }

  get timeoutInterceptorJs() {
    return `
import { Injectable } from '@nestjs/common';
import { timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor {
  intercept(context, call$) {
    return call$.pipe(timeout(5000))
  }
}`;
  }
}