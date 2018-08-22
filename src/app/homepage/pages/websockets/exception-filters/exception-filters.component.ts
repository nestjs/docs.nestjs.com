import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-exception-filters',
  templateUrl: './exception-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  get example() {
    return `
@UseFilters(new WsExceptionFilter())
@SubscribeMessage('events')
onEvent(client, data: any): WsResponse<any> {
  const event = 'events';
  return { event, data };
}`;
  }

  get inheritance() {
    return `
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}`;
  }

  get inheritanceJs() {
    return `
import { Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception, host) {
    super.catch(exception, host);
  }
}`;
  }
}
