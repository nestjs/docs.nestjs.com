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

As shown in the **Custom logger** section above, pass an instance of your extended logger via the logger property of the options object in `NestFactory.create()`.

#### Use built-in logger

To use the built-in logger **in your own code**, simply instantiate the `Logger` in your class, and take advantage of its optional `context` constructor argument, which allows you to pass in a string to uniquely identify the logging context. The context string will automatically be appended to your log message:

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];
  private readonly logger = new Logger('CatsService');

  findAll(): Cat[] {
    this.logger.warn('About to return cats!');
    return this.cats;
  }
}
```

If you've created a custom logger, or extended the base `Logger` class, and you instantiate the `Logger` class in some feature class (as shown above), your method calls on the `Logger` class access the customized logger class. With this construction, you get consistent customized logging behavior for both Nest system messages (bootstrap, error handling, etc.), and your own log messages (e.g., `this.logger.warn(...)` in the example above).

#### Dependency injection

To enable dependency injection in your custom logger, create a class that implements `LoggerService`. For example, you can create a `LoggerModule` as shown below, and provide `MyLogger` from that module.

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

Now, import `LoggerModule` from any module in the application, and Nest will take care of instantiating it. In this way, because your `MyLogger` class is part of a module, it can use dependency injection (for example, to inject a `ConfigService`). Finally, to tell Nest to use the same instance of `MyLogger` across the whole app, including bootstrapping and error handling, use the following construction.

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: false,
});
app.useLogger(app.get(MyLogger));
await app.listen(3000);
```

This uses the `get()` method on the `NestApplication` instance to retrieve the singleton instance of the `MyLogger` object. It's essentially a way to "inject" that instance from outside of a module context.

As shown earlier, you can also instantiate this `Logger` class in your feature classes to access the customized logger, thus ensuring consistent logging behavior across both Nest logging and application logging.

Note that this construction will still use the default logger for initialization messages.
