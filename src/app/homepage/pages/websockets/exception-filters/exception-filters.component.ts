import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-exception-filters',
  templateUrl: './exception-filters.component.html',
  styleUrls: ['./exception-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WsExceptionFiltersComponent extends BasePageComponent {
  get wsException() {
    return `
throw new WsException('Invalid credentials.');`;
  }

  get exceptionResponse() {
    return `
{
  status: 'error',
  message: 'Invalid credentials.'
}`;
  }

  get wsExceptionFilter() {
    return `
import { Catch, WsExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch(WsException)
export class ExceptionFilter implements WsExceptionFilter {
  catch(exception: WsException, client) {
    client.emit('exception', {
      status: 'error',
      message: \`It's a message from the exception filter\`,
    });
  }
}`;
  }
}