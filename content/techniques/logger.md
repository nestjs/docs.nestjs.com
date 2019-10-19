### Logger

Nest comes with a built-in `Logger` which is used during application bootstrapping and several other circumstances, such as displaying caught exceptions. You can take more control of logging by, for example, disabling logging entirely or providing a custom implementation of the logger to handle messages on your own.

To disable logging, set the `logger` property to `false` in the (optional) options object passed as the second argument to the `NestFactory.create()` method.

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: false,
});
await app.listen(3000);
```

You can enable specific logging levels by setting the `logger` property to an array of strings specifying the log levels to display:

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: ['error', 'warn'],
});
await app.listen(3000);
```

Values in the array can be any combination of `'log'`, `'error'`, `'warn'`, `'debug'`, and `'verbose'`.

#### Custom logger

You can provide a custom logger implementation by passing an object that fulfills the `LoggerService` interface in the `logger` property. For example, you can tell Nest to use the built-in `console` function as follows.

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: console,
});
await app.listen(3000);
```

Creating your own logger is straightforward. Simply implement each of the `LoggerService` methods as shown below.

```typescript
import { LoggerService } from '@nestjs/common';

export class MyLogger implements LoggerService {
  log(message: string) {
    /* your implementation */
  }
  error(message: string, trace: string) {
    /* your implementation */
  }
  warn(message: string) {
    /* your implementation */
  }
  debug(message: string) {
    /* your implementation */
  }
  verbose(message: string) {
    /* your implementation */
  }
}
```

Then, supply an instance of `MyLogger` via the `logger` property of the options object.

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: new MyLogger(),
});
await app.listen(3000);
```

#### Extend built-in logger

Rather than writing a logger from scratch, you may be able to meet your needs by extending the built-in `Logger` class and overriding select behavior of the default implementation. Be sure to call `super` to delegate the call to the parent (built-in) class.

```typescript
import { Logger } from '@nestjs/common';

export class MyLogger extends Logger {
  error(message: string, trace: string) {
    // add your tailored logic here
    super.error(message, trace);
  }
}
```

#### Dependency injection

To enable dependency injection in your custom logger, create an injectable class that implements `LoggerService`. For example, you can create a `LoggerModule` as shown below.

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service.ts';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

Assuming you want to use `MyLogger` throughout the application, you'll import `LoggerModule` in at least one module, and Nest will take care of instantiating it. Then, to tell Nest to use the same instance of `MyLogger` across the whole app, including bootstrapping and error handling, use the following construction:

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: false,
});
app.useLogger(app.get(MyLogger));
await app.listen(3000);
```

Note that this construction will still use the default logger for initialization messages.
