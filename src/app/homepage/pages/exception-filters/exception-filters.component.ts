import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-exception-filters',
  templateUrl: './exception-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExceptionFiltersComponent extends BasePageComponent {
  get errorResponse() {
    return `
{
  "statusCode": 500,
  "message": "Internal server error"
}`;
  }

  get createMethod() {
    return `
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
}
`;
  }

  get createMethodJs() {
    return `
@Post()
@Bind(Body())
async create(createCatDto) {
  throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
}
`;
  }

  get exceptionObj() {
    return `
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  throw new HttpException({
    status: HttpStatus.FORBIDDEN,
    error: 'This is a custom message',
  }, 403);
}
`;
  }

  get exceptionObjJs() {
    return `
@Post()
@Bind(Body())
async create(createCatDto) {
  throw new HttpException({
    status: HttpStatus.FORBIDDEN,
    error: 'This is a custom message',
  }, 403);
}
`;
  }

  get customResponse() {
    return `
{
  "status": 403,
  "error": "This is a custom message"
}`;
  }

  get forbiddenResponse() {
    return `
{
  "statusCode": 403,
  "message": "Forbidden"
}`;
  }

  get forbiddenException() {
    return `
export class ForbiddenException extends HttpException {
  constructor() {
    super('Forbidden', HttpStatus.FORBIDDEN);
  }
}`;
  }

  get forbiddenCreateMethod() {
    return `
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}`;
  }

  get forbiddenCreateMethodJs() {
    return `
@Post()
@Bind(Body())
async create(createCatDto) {
  throw new ForbiddenException();
}`;
  }

  get httpExceptionFilter() {
    return `
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}`;
  }

  get httpExceptionFilterJs() {
    return `
import { Catch } from '@nestjs/common';
import { HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}`;
  }

  get exceptionFilter() {
    return `
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}`;
  }

  get exceptionFilterJs() {
    return `
import { ExceptionFilter, Catch } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}`;
  }

  get forbiddenCreateMethodWithFilter() {
    return `
@Post()
@UseFilters(new HttpExceptionFilter())
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
`;
  }

  get forbiddenCreateMethodWithFilterJs() {
    return `
@Post()
@UseFilters(new HttpExceptionFilter())
@Bind(Body())
async create(createCatDto) {
  throw new ForbiddenException();
}
`;
  }

  get forbiddenCreateMethodWithFilterDi() {
    return `
@Post()
@UseFilters(HttpExceptionFilter)
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
`;
  }

  get forbiddenCreateMethodWithFilterDiJs() {
    return `
@Post()
@UseFilters(HttpExceptionFilter)
@Bind(Body())
async create(createCatDto) {
  throw new ForbiddenException();
}
`;
  }

  get controllerScopedFilter() {
    return `
@UseFilters(new HttpExceptionFilter())
export class CatsController {}`;
  }

  get globalScopedFilter() {
    return `
async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3000);
}
bootstrap();
`;
  }

  get getLoggerExceptionFilter() {
    return `
const app = await NestFactory.create(ApplicationModule);
const loggerFilter = app
  .select(LoggerModule)
  .get(LoggerExceptionFilter);

app.useGlobalFilters(loggerFilter);
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

  get globalModuleFilter() {
    return `
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class ApplicationModule {}`;
  }

  get inheritance() {
    return `
import { Catch, ArgumentsHost, HttpServer } from '@nestjs/common';
import { BaseExceptionFilter, HTTP_SERVER_REF } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  constructor(@Inject(HTTP_SERVER_REF) applicationRef: HttpServer) {
    super(applicationRef);
  }

  catch(exception: any, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}`;
  }

  get inheritanceJs() {
    return `
import { Catch } from '@nestjs/common';
import { BaseExceptionFilter, HTTP_SERVER_REF } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  constructor(@Inject(HTTP_SERVER_REF) applicationRef) {
    super(applicationRef);
  }

  catch(exception, host) {
    super.catch(exception, host);
  }
}`;
  }
}
