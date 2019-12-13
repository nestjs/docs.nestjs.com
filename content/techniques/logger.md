### Logger

Nest comes with a built-in text-based `Logger` which is used during application bootstrapping and several other circumstances, such as displaying caught exceptions. You can fully control the behavior of the logging system, including any of the following:

- disable logging entirely
- specify the log level of detail (e.g., display errors, warnings, debug information, etc.)
- completely override the default logger
- customize the default logger by extending it
- make use of dependency injection to simplify composing and testing your application
- make use of the built-in, or your own custom implementation of, the logger to log your own application-level events and messages

You can also make use of any `Node.js` logging package, such as [Winston](https://github.com/winstonjs/winston) to implement a completely custom, production grade logging system.

#### Basic logger customization

To disable logging, set the `logger` property to `false` in the (optional) Nest application options object passed as the second argument to the `NestFactory.create()` method.

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: false
});
await app.listen(3000);
```

To enable specific logging levels, set the `logger` property to an array of strings specifying the log levels to display:

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: ["error", "warn"]
});
await app.listen(3000);
```

Values in the array can be any combination of `'log'`, `'error'`, `'warn'`, `'debug'`, and `'verbose'`.

#### Custom logger implementation

You can provide a custom logger implementation to be used by Nest for system logging by setting the value of the `logger` property to an object that fulfills the `LoggerService` interface. For example, you can tell Nest to use the built-in global JavaScript `console` function (which implements the `LoggerService` interface) as follows:

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: console
});
await app.listen(3000);
```

Implementing your own custom logger is straightforward. Simply implement each of the methods of the `LoggerService` interface as shown below.

```typescript
import { LoggerService } from "@nestjs/common";

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

You can then supply an instance of `MyLogger` via the `logger` property of the Nest application options object.

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: new MyLogger()
});
await app.listen(3000);
```

This technique, while simple, doesn't utilize dependency injection for the `MyLogger` class. This can pose some challenges, particularly for testing. For a better solution, see the <a href="logger#dependency-injection">Dependency Injection</a> section below.

#### Extend built-in logger

Rather than writing a logger from scratch, you may be able to meet your needs by extending the built-in `Logger` class and overriding selected behavior of the default implementation. You can use such an extended logger in your feature modules as described in the <a href="logger#using-the-logger-for-application-logging">Using the logger for application logging</a> section below. If also you plan to provide your extended logger to Nest for system logging (as shown in the previous section), you should take care to call `super` to delegate the specific log method call to the parent (built-in) class.

```typescript
import { Logger } from "@nestjs/common";

export class MyLogger extends Logger {
  error(message: string, trace: string) {
    // add your tailored logic here
    super.error(message, trace);
  }
}
```

You can pass an instance of your extended logger via the `logger` property of the application options object (as shown in the <a href="logger#custom-logger-implementation">Custom logger implementation</a> section above), or use the technique shown below in the <a href="logger#dependency-injection">Dependency Injection</a> section.

#### Dependency injection

To enable dependency injection for your custom logger, create a class that implements `LoggerService` and register that class as a provider in a module. For example, you can

1. Define a `MyLogger` class that either extends the built-in `Logger` or completely overrides it, as shown in previous sections.
2. Create a `LoggerModule` as shown below, and provide `MyLogger` from that module.

```typescript
import { Module } from "@nestjs/common";
import { MyLogger } from "./my-logger.service";

@Module({
  providers: [MyLogger],
  exports: [MyLogger]
})
export class LoggerModule {}
```

With this construct, you are now providing your custom logger for use by any other module. Because your `MyLogger` class is part of a module, it can use dependency injection (for example, to inject a `ConfigService`). There's one more technique needed to provide this custom logger for use by the Nest system across the application (e.g., for bootstrapping and error handling).

Because application instantiation (`NestFactory.create()`) happens outside the context of any module, it doesn't participate in the normal Dependency Injection phase of initialization. So we must ensure that at least one application module imports the `LoggerModule` to trigger Nest to instantiate a singleton instance of our `MyLogger` class. We can then instruct Nest to use the same singleton instance of `MyLogger` with the following construction:

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: false
});
app.useLogger(app.get(MyLogger));
await app.listen(3000);
```

Here we use the `get()` method on the `NestApplication` instance to retrieve the singleton instance of the `MyLogger` object. This technique is essentially a way to "inject" an instance of a logger for use by Nest. (Note that when using this technique, Nest will still use the default built-in logger for runtime system initialization messages.)

You can also inject this `MyLogger` provider in your feature classes to access the customized logger, thus ensuring consistent logging behavior across both Nest logging and application logging. See <a href="logger#using-the-logger-for-application-logging">Using custom logger for application logging</a> below for more information.

#### Using the logger for application logging

We can combine several of the techniques above to provide consistent text logging across both Nest system log messages and our own application event/message logging. In this section, we'll achieve this with the following steps:

1. By extending the built-in logger, we'll customize the `context` portion of the log message (e.g., the phrase `NestFactory` in square brackets in the log line shown below).

```bash
[Nest] 19096   - 12/08/2019, 7:12:59 AM   [NestFactory] Starting Nest application...
```

2. We inject a [transient](fundamentals/injection-scopes) instance of the `Logger` into our feature module so that each one has its own custom context.
3. We supply this extended logger for Nest to use for system logging.

To start, extend the built-in logger with code like this. We supply the `scope` option, specifying a [transient](fundamentals/injection-scopes) scope, as configuration metadata for the logger class to ensure that we'll have a unique instance of the `Logger` in each feature module. In this example, we do not extend the individual `Logger` methods (like `log()`, `warn()`, etc.), though you may choose to do so if you would like:

```typescript
Import { Injectable, Scope } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger extends Logger {}
```

Create a `LoggerModule` like this:

```typescript
import { Module } from "@nestjs/common";
import { MyLogger } from "./my-logger.service";

@Module({
  providers: [MyLogger],
  exports: [MyLogger]
})
export class LoggerModule {}
```

Import the `LoggerModule` into your feature module, and set the logger context, like this:

```typescript
import { Injectable } from "@nestjs/common";
import { MyLogger } from "./my-logger.service";

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  constructor(private readonly myLogger: MyLogger) {
    this.myLogger.setContext("CatsService");
  }

  findAll(): Cat[] {
    this.myLogger.warn("About to return cats!");
    return this.cats;
  }
}
```

Finally, instruct Nest to use an instance of the custom logger in your `main.ts` file like this. Of course in this example, we haven't actually customized the logger behavior (by extending the `Logger` methods like `log()`, `warn()`, etc.), so this step isn't actually needed. But it **would** be needed if you added custom logic to those methods and wanted Nest to use the same implementation.

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: false
});
app.useLogger(new MyLogger());
await app.listen(3000);
```

#### Use external logger

Production applications often have specific logging requirements, including advanced filtering, formatting and centralized logging. Nest's built-in logger is useful for monitoring Nest system behavior, and can also be used for basic formatted text logging of your feature modules while in development, but production applications often take advantage of dedicated logging modules like [Winston](https://github.com/winstonjs/winston). As with any standard `Node.js` application, you can take full advantage of such modules in Nest.
