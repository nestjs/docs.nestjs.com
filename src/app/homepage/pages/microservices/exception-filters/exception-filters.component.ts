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
import { Observable } from 'rxjs/Observable';
import { RpcException } from '@nestjs/microservices';
import { _throw } from 'rxjs/observable/throw';

@Catch(RpcException)
export class ExceptionFilter implements RpcExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    return _throw(exception.getError());
  }
}`;
  }

  get rpcExceptionFilterJs() {
    return `
import { Catch, } from '@nestjs/common';
import { _throw } from 'rxjs/observable/throw';

@Catch(RpcException)
export class ExceptionFilter {
  catch(exception, host) {
    return _throw(exception.getError());
  }
}`;
  }
}