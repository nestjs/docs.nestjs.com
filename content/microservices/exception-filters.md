### Exception filters

The only difference between HTTP exception filter layer and corresponding microservices layer is that instead of throwing `HttpException`, you should rather use `RpcException`.

```typescript
throw new RpcException('Invalid credentials.');
```

> info **Hint** The `RpcException` class is imported from the `@nestjs/microservices` package.

Nest will handle thrown exception and as a result, returns the `error` object with the following structure:

```json
{
  "status": "error",
  "message": "Invalid credentials."
}
```

#### Filters

The exception filters work in the same fashion as the primary ones, with a one, small difference. The `catch()` method has to return an `Observable`.

```typescript
@@filename(rpc-exception.filter)
import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class ExceptionFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    return throwError(exception.getError());
  }
}
@@switch
import { Catch } from '@nestjs/common';
import { throwError } from 'rxjs';

@Catch(RpcException)
export class ExceptionFilter {
  catch(exception, host) {
    return throwError(exception.getError());
  }
}
```

> **Warning** It is impossible to set up the microservice exception filters globally when the hybrid application feature is being used.

Here is an example that makes use of a manually instantiated method-scoped filter (class-scoped works too):

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

Typically, you'll create fully customized exception filters crafted to fulfill your application requirements. There might be use-cases though when you would like to reuse an already implemented, **core exception filter**, and override the behavior based on certain factors.

In order to delegate exception processing to the base filter, you need to extend `BaseExceptionFilter` and call inherited `catch()` method. Besides, `HttpServer` reference has to be injected and passed to the `super()` call.

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

Obviously, you should enhance above implementation with your tailored **business** logic (e.g. add various conditions).
