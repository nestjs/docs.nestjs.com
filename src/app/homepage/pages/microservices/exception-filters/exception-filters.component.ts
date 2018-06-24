import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-exception-filters',
  templateUrl: './exception-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MicroservicesExceptionFiltersComponent extends BasePageComponent {
  get rpcException() {
    return `
throw new RpcException('Invalid credentials.');`;
  }

  get exceptionResponse() {
    return `
{
  status: 'error',
  message: 'Invalid credentials.'
}`;
  }

  get rpcExceptionFilter() {
    return `
import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class ExceptionFilter implements RpcExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    return throwError(exception.getError());
  }
}`;
  }

  get rpcExceptionFilterJs() {
    return `
import { Catch, } from '@nestjs/common';
import { throwError } from 'rxjs';

@Catch(RpcException)
export class ExceptionFilter {
  catch(exception, host) {
    return throwError(exception.getError());
  }
}`;
  }

  get example() {
    return `
@UseFilters(new ExceptionFilter())
@MessagePattern({ cmd: 'sum' })
sum(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}`;
  }
}