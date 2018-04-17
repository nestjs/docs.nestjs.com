import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-migration',
  templateUrl: './migration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MigrationComponent extends BasePageComponent {
  get middlewares() {
    return `
// Before
consumer.apply(LoggerMiddleware).forRoutes(
  { path: '/cats', method: RequestMethod.GET },
  { path: '/cats', method: RequestMethod.POST },
);

// After
consumer.apply(LoggerMiddleware).forRoutes('cats');`;
  }

  get expressMiddleware() {
    return `
const app = await NestFactory.create(ApplicationModule);
app.get('cats', logger);`;
  }

  get filters() {
    return `
// Before
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, response) {}
}

// After
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    // ...
  }
}`;
  }

  get filtersJs() {
    return `
// Before
@Catch(HttpException)
export class HttpExceptionFilter {
  catch(exception, response) {}
}

// After
@Catch(HttpException)
export class HttpExceptionFilter {
  catch(exception, host) {
    const response = host.switchToHttp().getResponse();
    // ...
  }
}`;
  }

  get guards() {
    return `
// Before
@Guard()
export class RolesGuard implements CanActivate {
  canActivate(
    dataOrRequest,
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}

// After
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // const request = context.switchToHttp().getRequest();
    return true;
  }
}`;
  }

  get guardsJs() {
    return `
// Before
@Guard()
export class RolesGuard {
  canActivate(dataOrRequest, context) {
    return true;
  }
}

// After
@Injectable()
export class RolesGuard {
  canActivate(context) {
    // const request = context.switchToHttp().getRequest();
    return true;
  }
}`;
  }

  get interceptors() {
    return `
// Before
@Interceptor()
export class TransformInterceptor implements NestInterceptor {
  intercept(
    dataOrRequest,
    context: ExecutionContext,
    stream$: Observable<any>,
  ): Observable<any> {
    return stream$.map((data) => ({ data }));
  }
}

// After
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    call$: Observable<T>,
  ): Observable<Response<T>> {
    // const request = context.switchToHttp().getRequest();
    return call$.pipe(map(data => ({ data })));
  }
}`;
  }

  get interceptorsJs() {
    return `
// Before
@Interceptor()
export class TransformInterceptor {
  intercept(dataOrRequest, context, stream$) {
    return stream$.map((data) => ({ data }));
  }
}

// After
@Injectable()
export class TransformInterceptor {
  intercept(context, call$) {
    // const request = context.switchToHttp().getRequest();
    return call$.pipe(map(data => ({ data })));
  }
}`;
  }
}
