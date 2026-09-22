### Logger

Nest comes with a built-in logger that is used during application bootstrapping and in several other circumstances, such as displaying caught exceptions (i.e., system logging). This functionality is provided by the `Logger` class in the `@nestjs/common` package. You can fully control the behavior of the logging system, including any of the following:

- disable logging entirely
- specify the level of detail (e.g., display errors, warnings, debug information, etc.)
- configure the formatting of log messages (raw, JSON, colorized, etc.)
- override the timestamp in the default logger (e.g., use the ISO 8601 standard as the date format)
- completely override the default logger
- customize the default logger by extending it
- use dependency injection to simplify composing and testing your application

You can also use the built-in logger, or create your own custom implementation, to log your own application-level events and messages.

The built-in logger is not only a development convenience. Combined with [JSON output](#json-logging), [structured logging params](#structured-logging-params), and the trace id that [NestJS Observe](#correlating-logs-with-requests) attaches to every line, it covers what most production applications need from a logger: one machine-readable record per line on stdout, queryable fields, log levels, and a way to tie each line back to the request that wrote it. Container platforms and log aggregators (CloudWatch, Cloud Logging, Datadog, Loki, Elasticsearch, and so on) ingest that output as-is, with no extra dependency in your application. The [Logging in production](#logging-in-production) section below shows the full setup.

Reach for a dedicated library such as [Pino](https://github.com/pinojs/pino) or [Winston](https://github.com/winstonjs/winston) when you need something the built-in logger deliberately leaves out: writing to files or other transports from inside the process, field redaction, or the last bit of throughput on very log-heavy services. See [Use external logger](#use-external-logger).

#### Basic customization

To disable logging, set the `logger` property to `false` in the (optional) Nest application options object, passed as the second argument to the `NestFactory.create()` method.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: false,
});
await app.listen(process.env.PORT ?? 3000);
```

To enable specific log levels, set the `logger` property to an array of strings specifying the log levels to display, as follows:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn'],
});
await app.listen(process.env.PORT ?? 3000);
```

Values in the array can be any combination of `'log'`, `'fatal'`, `'error'`, `'warn'`, `'debug'`, and `'verbose'`.

> info **Hint** Log levels in Nest cascade: providing a single log level (like `'log'`) automatically includes all higher-severity levels (`'warn'`, `'error'`, and `'fatal'`).

To disable colorized output, pass a `ConsoleLogger` instance with the `colors` property set to `false` as the value of the `logger` property:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    colors: false,
  }),
});
```

To configure a prefix for each log message, pass a `ConsoleLogger` instance with the `prefix` property set:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    prefix: 'MyApp', // Default is "Nest"
  }),
});
```

The following table lists all available options:

| Option            | Description                                                                                                                                                                                                                                                                                                                                          | Default                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `logLevels`       | Enabled log levels.                                                                                                                                                                                                                                                                                                                                  | `['log', 'fatal', 'error', 'warn', 'debug', 'verbose']` |
| `timestamp`       | If enabled, will print timestamp (time difference) between current and previous log message. Note: This option is not used when `json` is enabled.                                                                                                                                                                                                   | `false`                                        |
| `prefix`          | A prefix to be used for each log message. Note: This option is not used when `json` is enabled.                                                                                                                                                                                                                                                      | `Nest`                                         |
| `json`            | If enabled, will print the log message in JSON format.                                                                                                                                                                                                                                                                                               | `false`                                        |
| `colors`          | If enabled, will print the log message in color.                                                                                                                                                                                                                                                                                                     | `true` (`false` if `json` is enabled)          |
| `context`         | The context of the logger.                                                                                                                                                                                                                                                                                                                           | `undefined`                                    |
| `forceConsole`    | If enabled, will use `console.log`/`console.error` instead of `process.stdout.write`/`process.stderr.write`. Useful in test environments, such as Jest, that buffer console calls.                                                                                                                                                                     | `false`                                        |
| `compact`         | If enabled, will print the log message in a single line, even if it is an object with multiple properties. If set to a number, the most n inner elements are united on a single line as long as all properties fit into breakLength. Short array elements are also grouped together.                                                                 | `false` (`true` if `json` is enabled)          |
| `maxArrayLength`  | Specifies the maximum number of Array, TypedArray, Map, Set, WeakMap, and WeakSet elements to include when formatting. Set to null or Infinity to show all elements. Set to 0 or negative to show no elements. Ignored when `json` is enabled, colors are disabled, and `compact` is set to true as it produces a parseable JSON output.             | `100`                                          |
| `maxStringLength` | Specifies the maximum number of characters to include when formatting. Set to null or Infinity to show all elements. Set to 0 or negative to show no characters. Ignored when `json` is enabled, colors are disabled, and `compact` is set to true as it produces a parseable JSON output.                                                           | `10000`                                        |
| `sorted`          | If enabled, will sort keys while formatting objects. Can also be a custom sorting function. Ignored when `json` is enabled, colors are disabled, and `compact` is set to true as it produces a parseable JSON output.                                                                                                                                | `false`                                        |
| `depth`           | Specifies the number of times to recurse while formatting object. This is useful for inspecting large objects. To recurse up to the maximum call stack size pass Infinity or null. Ignored when `json` is enabled, colors are disabled, and `compact` is set to true as it produces a parseable JSON output.                                         | `5`                                            |
| `showHidden`      | If true, object's non-enumerable symbols and properties are included in the formatted result. WeakMap and WeakSet entries are also included as well as user defined prototype properties                                                                                                                                                             | `false`                                        |
| `breakLength`     | The length at which input values are split across multiple lines. Set to Infinity to format the input as a single line (in combination with "compact" set to true). Ignored when `json` is enabled, colors are disabled, and `compact` is set to true as it produces a parseable JSON output.                                                       | `Infinity` when `compact` is `true`, `80` otherwise |

#### JSON logging

JSON logging is essential for application observability and for integration with log management systems. To enable it, create a `ConsoleLogger` instance with its `json` property set to `true`, and pass it as the value of the `logger` property when creating the application instance:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    json: true,
  }),
});
```

This configuration outputs logs in a structured JSON format, which makes it easier to integrate with external systems such as log aggregators and cloud platforms. For example, platforms like **AWS ECS** (Elastic Container Service) natively support JSON logs, enabling features like:

- **Log filtering**: narrow down logs based on fields like log level, timestamp, or custom metadata.
- **Search and analysis**: use query tools to analyze and track trends in your application's behavior.

If you're using [NestJS Mau](https://mau.nestjs.com), JSON logging also lets you view logs in a well-organized, structured format, which is especially useful for debugging and performance monitoring.

> info **Note** When `json` is set to `true`, the `ConsoleLogger` automatically disables text colorization by setting the `colors` property to `false`. This ensures that the output remains valid JSON, free of formatting artifacts. For development, you can override this behavior by explicitly setting `colors` to `true`. Colorized JSON logs can make entries more readable during local debugging.

When JSON logging is enabled, the log output looks like this (on a single line):

```json
{
  "level": "log",
  "pid": 19096,
  "timestamp": 1607370779834,
  "message": "Starting Nest application...",
  "context": "NestFactory"
}
```

See the [pull request that introduced JSON logging](https://github.com/nestjs/nest/pull/14121) for more output variants.

#### Structured logging params

Log messages often need to carry metadata: a user id, a request duration, a correlation id. Starting with NestJS v12, plain objects passed **after** the first message argument are treated as structured params and attached to the same log entry instead of being emitted as separate log records.

```typescript
const logger = new Logger('UserService');
logger.log('User created', { userId: 1, email: 'foo@bar.com' });
```

In text mode, the params are appended inline to the same formatted line:

```plaintext
[Nest] 3785  - 02/26/2026, 10:04:41 AM     LOG [UserService] User created { userId: 1, email: 'foo@bar.com' }
```

When several plain objects are passed, they are merged into a single set of params:

```typescript
logger.log('Request handled', { method: 'GET' }, { path: '/api', duration: 42 });
```

```plaintext
[Nest] 3785  - 02/26/2026, 10:04:41 AM     LOG [UserService] Request handled { method: 'GET', path: '/api', duration: 42 }
```

In JSON mode, params are nested under a `params` key by default:

```json
{
  "level": "log",
  "pid": 3785,
  "timestamp": 1772089691769,
  "message": "User created",
  "context": "UserService",
  "params": { "userId": 1, "email": "foo@bar.com" }
}
```

To spread them into the root of the JSON object instead (which some log aggregators prefer), enable `flattenParams`:

```typescript
new ConsoleLogger({ json: true, flattenParams: true });
```

```json
{
  "level": "log",
  "pid": 3785,
  "timestamp": 1772089691769,
  "message": "User created",
  "context": "UserService",
  "userId": 1,
  "email": "foo@bar.com"
}
```

The relevant `ConsoleLogger` options are:

| Option             | Description                                                                                                   | Default |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ------- |
| `structuredParams` | If enabled, plain objects logged after the message are attached to the same entry as params.                  | `true`  |
| `flattenParams`    | If enabled, params are spread into the root of the JSON record instead of nested under `params`. JSON mode only; requires `structuredParams`. | `false` |

> info **Hint** Only **plain objects** are treated as params. Arrays, strings, numbers, class instances, and `null` are still logged as separate messages (a string passed as the *last* argument is still treated as the context), and a plain object passed as the *first* argument is still treated as the message itself. Set `structuredParams: false` to restore the pre-v12 behavior.

#### Logging in production

Put together, JSON output and structured params give you production-grade logs from the built-in logger alone:

```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    json: true,
    logLevels: ['log', 'warn', 'error', 'fatal'],
  }),
});
```

```typescript
// orders.service.ts
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  async capture(order: Order) {
    // ...
    this.logger.log('Payment captured', { orderId: order.id, amount: order.total });
  }
}
```

With [NestJS Observe](#correlating-logs-with-requests) installed, each line written during a request also carries that request's trace id, without changing a single log call:

```json
{"level":"log","pid":66803,"timestamp":1789978166281,"message":"Payment captured","context":"OrdersService","params":{"orderId":"ord_8f2a","amount":4200},"traceId":"0199a3f2-7c1e-7b40-9d2a-5e8f1c3b7a64"}
```

That single line is filterable by level and context, queryable by `orderId`, and joinable to every other line from the same request, which is the job most teams install a third-party logger to do. Write logs to stdout like this and let the platform (Docker, Kubernetes, ECS, Cloud Run, and so on) collect and ship them. That keeps rotation, buffering, and delivery out of your application process.

> info **Hint** Set `flattenParams: true` if your aggregator indexes top-level fields only, so `orderId` becomes a root-level field instead of `params.orderId`.

#### Using the logger for application logging

You can combine several of the techniques above to provide consistent behavior and formatting across both Nest system logging and your own application event/message logging.

A good practice is to instantiate the `Logger` class from `@nestjs/common` in each of your services, supplying the service name as the `context` argument of the `Logger` constructor:

```typescript
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log('Doing something...');
  }
}
```

In the default logger implementation, `context` is printed in square brackets, like `NestFactory` in the example below:

```bash
[Nest] 19096  - 12/08/2019, 7:12:59 AM     LOG [NestFactory] Starting Nest application...
```

If you supply a custom logger via `app.useLogger()`, Nest uses it internally, and calls made through `Logger` instances are delegated to it. Your code remains implementation agnostic, and you can substitute the default logger with your own by calling `app.useLogger()`.

For example, if you follow the steps in the <a href="application/logger#dependency-injection">Dependency injection</a> section below and call `app.useLogger(app.get(MyLogger))`, subsequent calls to `this.logger.log()` from `MyService` result in calls to the `log()` method of the `MyLogger` instance.

This is suitable for most cases. If you need more customization (like adding and calling custom methods), see the <a href="application/logger#injecting-a-custom-logger">Injecting a custom logger</a> section.

#### Logs with timestamps

To print a timestamp difference for every logged message, pass the optional `timestamp: true` setting when creating the logger instance:

```typescript
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name, { timestamp: true });

  doSomething() {
    this.logger.log('Doing something with timestamp here ->');
  }
}
```

This will produce output in the following format:

```bash
[Nest] 19096  - 04/19/2024, 7:12:59 AM     LOG [MyService] Doing something with timestamp here -> +5ms
```

Note the `+5ms` at the end of the line. For each log statement, the time elapsed since the previous message is calculated and displayed at the end of the line.

#### Custom implementation

You can provide a custom logger implementation for Nest to use for system logging by setting the `logger` property to an object that fulfills the `LoggerService` interface. For example, you can tell Nest to use the global JavaScript `console` object (which implements the `LoggerService` interface), as follows:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: console,
});
await app.listen(process.env.PORT ?? 3000);
```

To implement your own custom logger, implement each of the methods of the `LoggerService` interface, as shown below:

```typescript
import { LoggerService, Injectable } from '@nestjs/common';

@Injectable()
export class MyLogger implements LoggerService {
  /**
   * Write a 'log' level log.
   */
  log(message: any, ...optionalParams: any[]) {}

  /**
   * Write a 'fatal' level log.
   */
  fatal(message: any, ...optionalParams: any[]) {}

  /**
   * Write an 'error' level log.
   */
  error(message: any, ...optionalParams: any[]) {}

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, ...optionalParams: any[]) {}

  /**
   * Write a 'debug' level log.
   */
  debug?(message: any, ...optionalParams: any[]) {}

  /**
   * Write a 'verbose' level log.
   */
  verbose?(message: any, ...optionalParams: any[]) {}
}
```

You can then supply an instance of `MyLogger` via the `logger` property of the Nest application options object:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new MyLogger(),
});
await app.listen(process.env.PORT ?? 3000);
```

This technique, while simple, doesn't use dependency injection for the `MyLogger` class. This can pose challenges, particularly for testing, and limits the reusability of `MyLogger`. For a better solution, see the <a href="application/logger#dependency-injection">Dependency injection</a> section below.

#### Extend built-in logger

Rather than writing a logger from scratch, you may be able to meet your needs by extending the built-in `ConsoleLogger` class and overriding selected behavior of the default implementation:

```typescript
import { ConsoleLogger } from '@nestjs/common';

export class MyLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    // add your tailored logic here
    super.error(...arguments);
  }
}
```

You can use such an extended logger in your feature modules as described in the <a href="application/logger#using-the-logger-for-application-logging">Using the logger for application logging</a> section above.

You can tell Nest to use your extended logger for system logging by passing an instance of it via the `logger` property of the application options object (as shown in the <a href="application/logger#custom-implementation">Custom implementation</a> section above), or by using the technique shown in the <a href="application/logger#dependency-injection">Dependency injection</a> section below. If you do so, call `super`, as shown in the sample code above, to delegate the log method call to the parent (built-in) class so that Nest can rely on the built-in features it expects.

<app-banner-courses></app-banner-courses>

#### Dependency injection

For more advanced logging functionality, take advantage of dependency injection. For example, you may want to inject a `ConfigService` into your logger to customize it, and in turn inject your custom logger into other controllers and/or providers. To enable dependency injection for your custom logger, create a class that implements `LoggerService` and register that class as a provider in a module. For example, you can:

1. Define a `MyLogger` class that either extends the built-in `ConsoleLogger` or completely overrides it, as shown in the previous sections. Be sure to implement the `LoggerService` interface.
2. Create a `LoggerModule` as shown below, and provide `MyLogger` from that module.

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service.js';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

With this construct, your custom logger is available to any other module. Because your `MyLogger` class is part of a module, it can use dependency injection (for example, to inject a `ConfigService`). One more step is needed for Nest to use this custom logger for system logging (e.g., for bootstrapping and error handling).

Because application instantiation (`NestFactory.create()`) happens outside the context of any module, it doesn't participate in the normal dependency injection phase of initialization. So you must ensure that at least one application module imports the `LoggerModule`, which triggers Nest to instantiate a singleton instance of the `MyLogger` class.

You can then instruct Nest to use the same singleton instance of `MyLogger` with the following construction:

```typescript
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(app.get(MyLogger));
await app.listen(process.env.PORT ?? 3000);
```

> info **Note** In the example above, `bufferLogs` is set to `true` so that all logs are buffered until a custom logger is attached (`MyLogger` in this case) and the application initialization process either completes or fails. If initialization fails, Nest falls back to the original `ConsoleLogger` to print any reported error messages. You can also set `autoFlushLogs` to `false` (default `true`) to flush logs manually with the `Logger.flush()` method.

Here, the `get()` method of the `NestApplication` instance retrieves the singleton instance of `MyLogger`. This technique is essentially a way to "inject" a logger instance for use by Nest. The `app.get()` call depends on that instance first being instantiated through a module import, as described above.

You can also inject this `MyLogger` provider into your feature classes, ensuring consistent logging behavior across both Nest system logging and application logging. See <a href="application/logger#using-the-logger-for-application-logging">Using the logger for application logging</a> and <a href="application/logger#injecting-a-custom-logger">Injecting a custom logger</a> below for more information.

#### Injecting a custom logger

To start, extend the built-in logger with code like the following. The `scope` option, supplied as configuration metadata for the `ConsoleLogger` subclass, specifies a [transient](/fundamentals/injection-scopes) scope so that each consumer gets its own logger instance. This is important because each module sets a unique context on its logger via `setContext()` — with a singleton, that call would overwrite the context across the entire app. In this example, we do not extend the individual `ConsoleLogger` methods (like `log()`, `warn()`, etc.), though you may choose to do so.

```typescript
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger extends ConsoleLogger {
  customLog() {
    this.log('Please feed the cat!');
  }
}
```

Next, create a `LoggerModule` with a construction like this:

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service.js';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

Next, import the `LoggerModule` into your feature module. Because `MyLogger` extends `ConsoleLogger`, you can use its `setContext()` method and start using the context-aware custom logger, like this:

```typescript
import { Injectable } from '@nestjs/common';
import { MyLogger } from './my-logger.service.js';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  constructor(private myLogger: MyLogger) {
    // Due to transient scope, CatsService has its own unique instance of MyLogger,
    // so setting context here will not affect other instances in other services
    this.myLogger.setContext('CatsService');
  }

  findAll(): Cat[] {
    // You can call all the default methods
    this.myLogger.warn('About to return cats!');
    // And your custom methods
    this.myLogger.customLog();
    return this.cats;
  }
}
```

Finally, instruct Nest to use an instance of the custom logger in your `main.ts` file, as shown below. This example doesn't customize the logger behavior (by overriding `ConsoleLogger` methods like `log()`, `warn()`, etc.), so this step isn't strictly needed here. It **is** needed if you add custom logic to those methods and want Nest to use the same implementation.

```typescript
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(new MyLogger());
await app.listen(process.env.PORT ?? 3000);
```

> info **Hint** Alternatively, instead of setting `bufferLogs` to `true`, you could temporarily disable the logger with the `logger: false` option. Be aware that if you pass `logger: false` to `NestFactory.create()`, nothing is logged until you call `useLogger()`, so you may miss important initialization errors. If you don't mind some initial messages being logged with the default logger, omit the `logger: false` option.

#### Correlating logs with requests

Centralizing logs solves storage, not investigation. Once every instance ships to the same place, the hard part becomes reconstructing a *single* request out of thousands of interleaved lines. That is why so much production debugging is really the work of inventing a correlation id, threading it through every log call, and hoping nothing on the path forgot to pass it along.

[NestJS Observe](https://www.observe.nestjs.com/ 'NestJS Observe') removes that bookkeeping. Turn on `forwardLogs` and every line written through Nest's `Logger` is captured with the trace it was written in already attached:

```typescript
ObserveModule.forRoot({
  serviceId: 'orders-api',
  forwardLogs: true,
});
```

You keep calling `this.logger.log()` with an `orderId` param exactly as before: no correlation id to generate, no context object to thread through your service layer. On an execution page, the logs for that one request are then placed on the trace's own clock, each line sitting next to the span that was in flight when it was written, so "the retry warning fired *before* the timeout, not after" is something you can see instead of infer from timestamps across three log streams.

Structured logging params carry through as well, so `orderId` stays a queryable field rather than being flattened into the message text. Log lines are also alertable in their own right, for example: "tell me when `payment declined` appears more than 10 times in 15 minutes".

If you would rather keep log content in your own aggregator, you do not have to forward anything. Even with `forwardLogs` off, the SDK augments `ConsoleLogger` so every line written during a request carries that request's trace id: on a line of its own beneath the message in the default format, and as a `traceId` field with [JSON logging](#json-logging) enabled:

```json
{"level":"log","pid":66803,"timestamp":1789978166281,"message":"Payment captured","context":"OrdersService","traceId":"0199a3f2-7c1e-7b40-9d2a-5e8f1c3b7a64"}
```

That id is enough to jump from a line in your existing stack to the full trace in the dashboard. It is on by default and controlled by the `attachTraceIdToLogs` option (see [Trace correlation](/observability/sdk#trace-correlation)). Lines written outside a request (during bootstrap, for example) are left as they are. The augmentation applies to Nest's built-in `ConsoleLogger` only, so if you replace it with an [external logger](#use-external-logger), read the id yourself with `TracerService.currentTraceId()`. See the [SDK reference](/observability/sdk#logs) for forwarding and its redaction settings.

The trace id is not the only thing that lives for the length of a request. The SDK keeps an `AsyncLocalStorage` store for every request, job, and message it instruments, and `TracerService` exposes it through `setAttribute()` and `getAttribute()`. That is the natural place for the user or tenant a request is acting for, readable from anywhere downstream without threading it through every call. See [Request-scoped attributes](/observability/manual-instrumentation#request-scoped-attributes), and the [Async local storage](/recipes/async-local-storage) recipe for how it compares to a store you set up yourself.

#### Use external logger

As [Logging in production](#logging-in-production) shows, the built-in logger already covers structured, centralized logging for most applications. Some requirements still call for a dedicated library such as [Pino](https://github.com/pinojs/pino) or [Winston](https://github.com/winstonjs/winston): multiple in-process transports (files, syslog, HTTP), redaction of sensitive fields, custom serializers, or the lowest possible overhead on services that log at very high volume. As with any standard Node.js application, you can take full advantage of such modules in Nest: implement the `LoggerService` interface as described in [Custom implementation](#custom-implementation), or use a community integration.
