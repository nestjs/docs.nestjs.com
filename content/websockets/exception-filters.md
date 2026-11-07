### Exception filters

The WebSockets exceptions layer works like the HTTP [exception filter](/exception-filters) layer, with one difference: instead of throwing `HttpException`, throw `WsException`.

```typescript
throw new WsException('Invalid credentials.');
```

> info **Hint** The `WsException` class is imported from the `@nestjs/websockets` package.

When a handler throws the exception above, Nest catches it and emits an `exception` message to the client with the following structure:

```typescript
{
  status: 'error',
  message: 'Invalid credentials.',
  cause: {
    pattern: 'events', // pattern of the message that caused the exception
    data: { name: 'Nest' }, // payload of that message
  },
}
```

The `cause` property lets the client associate the error with the message that triggered it. If you pass an object (rather than a string) to the `WsException` constructor, Nest emits that object as is. Any exception that isn't a `WsException` produces the same structure, with `'Internal server error'` as the message. With the `ws` adapter, which has no named events, the client receives a JSON string of the form `{{ '{' }} "event": "exception", "data": ... {{ '}' }}` instead.

> info **Hint** With socket.io, the client must listen for the `exception` event (e.g., `socket.on('exception', (error) => console.log(error))`). If it doesn't, the error is not visible on the client. Tools such as Postman need a listener registered for this event name as well.

#### Filters

WebSocket exception filters behave the same way as HTTP exception filters. The following example uses a manually instantiated method-scoped filter. As with HTTP-based applications, you can also use gateway-scoped filters (i.e., decorate the gateway class with `@UseFilters()`).

```typescript
@@filename()
@UseFilters(new BaseWsExceptionFilter())
@SubscribeMessage('events')
onEvent(@MessageBody() data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@UseFilters(new BaseWsExceptionFilter())
@Bind(MessageBody())
@SubscribeMessage('events')
onEvent(data) {
  const event = 'events';
  return { event, data };
}
```

> info **Hint** The `BaseWsExceptionFilter` class is imported from the `@nestjs/websockets` package. It is the filter Nest applies by default. To customize the behavior, create your own filter as shown in the [Inheritance](#inheritance) section below.

> warning **Warning** Global exception filters (registered with `app.useGlobalFilters()` or the `APP_FILTER` token) don't apply to gateways. Bind WebSocket exception filters at the gateway or method level with `@UseFilters()`.

#### Inheritance

Typically, you'll create fully customized exception filters tailored to your application requirements. However, sometimes you may want to extend the **core exception filter** and override its behavior based on certain factors.

To delegate exception processing to the base filter, extend `BaseWsExceptionFilter` and call the inherited `catch()` method.

```typescript
@@filename()
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}
@@switch
import { Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception, host) {
    super.catch(exception, host);
  }
}
```

The implementation above is only a shell that demonstrates the approach. A real extended exception filter would add your own **business logic** (e.g., handling various conditions).

The `BaseWsExceptionFilter` constructor accepts an options object. Set `includeCause` to `false` to omit the `cause` property from error messages, or pass a `causeFactory(pattern, data)` function to control its shape.
