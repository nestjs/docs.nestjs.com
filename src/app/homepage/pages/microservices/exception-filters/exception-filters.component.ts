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
import { Catch, RpcExceptionFilter } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import { RpcException } from '@nestjs/microservices';
import 'rxjs/add/observable/throw';

@Catch(RpcException)
export class ExceptionFilter implements RpcExceptionFilter {
  catch(exception: RpcException): Observable<any> {
    return Observable.throw(exception.getError());
  }
}`;
  }

  get rpcExceptionFilterJs() {
    return `
import { Catch } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import { RpcException } from '@nestjs/microservices';
import 'rxjs/add/observable/throw';

@Catch(RpcException)
export class ExceptionFilter {
  catch(exception) {
    return Observable.throw(exception.getError());
  }
}`;
  }
}