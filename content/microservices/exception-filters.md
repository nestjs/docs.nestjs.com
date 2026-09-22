### Exception filters

The only difference between the HTTP [exception filter](/exception-filters) layer and the corresponding microservices layer is that microservices should throw `RpcException` instead of `HttpException`.

```typescript
throw new RpcException('Invalid credentials.');
```

> info **Hint** The `RpcException` class is imported from the `@nestjs/microservices` package.

Nest handles the thrown exception and returns an `error` object with the following structure:

```json
{
  "status": "error",
  "message": "Invalid credentials."
}
```

If you pass an object to the `RpcException` constructor instead of a string, Nest returns that object as is.

> warning **Warning** An event handler has no response stream. An error that a filter rethrows for an `@EventPattern()` handler never reaches the producer, so handle the error inside the filter.

#### Filters

Microservice exception filters behave like HTTP exception filters, with one difference: the `catch()` method must return an `Observable`.

```typescript
@@filename(rpc-exception.filter)
import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class ExceptionFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    return throwError(() => exception.getError());
  }
}
@@switch
import { Catch } from '@nestjs/common';
import { throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class ExceptionFilter {
  catch(exception, host) {
    return throwError(() => exception.getError());
  }
}
```

> warning **Warning** Global exception filters registered on the main HTTP application don't apply to microservices connected to a [hybrid application](/faq/hybrid-application) unless you set the `inheritAppConfig` option. See [sharing configuration](/faq/hybrid-application#sharing-configuration).

The following example uses a manually instantiated method-scoped filter. As with HTTP-based applications, you can also use controller-scoped filters (i.e., prefix the controller class with a `@UseFilters()` decorator).

```typescript
@@filename()
@UseFilters(new ExceptionFilter())
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@UseFilters(new ExceptionFilter())
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```

#### Inheritance

Typically, you'll create fully customized exception filters tailored to your application's requirements. In some cases, however, you may want to extend the **core exception filter** and override its behavior based on certain factors.

To delegate exception processing to the base filter, extend `BaseRpcExceptionFilter` and call the inherited `catch()` method.

```typescript
@@filename()
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter extends BaseRpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    return super.catch(exception, host);
  }
}
@@switch
import { Catch } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter extends BaseRpcExceptionFilter {
  catch(exception, host) {
    return super.catch(exception, host);
  }
}
```

The above implementation is only a shell that demonstrates the approach. Your implementation of the extended exception filter would include your own **business logic** (e.g., handling various conditions).
