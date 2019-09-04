### Logger

Nest comes with a default implementation of internal `Logger` which is used during the instantiation process as well as in several different situations, such as **occurred exception**, and so forth. However, sometimes you might want to either disable logging entirely or provide a custom implementation and handle messages on your own. In order to turn off a logger, we use the Nest application options object.

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: false,
});
await app.listen(3000);
```

You can also enable only certain types of logging:

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: ['error', 'warn'],
});
await app.listen(3000);
```

In some scenarios, we might want to use a different logger under the hood. In order to do that, we have to pass an object that fulfills `LoggerService` interface. An example could be a built-in `console`.

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: console,
});
await app.listen(3000);
```

But it's not an apt idea. However, we can create our own logger easily.

```typescript
import { LoggerService } from '@nestjs/common';

export class MyLogger implements LoggerService {
  log(message: string) {}
  error(message: string, trace: string) {}
  warn(message: string) {}
  debug(message: string) {}
  verbose(message: string) {}
}
```

Then, we can apply `MyLogger` instance directly:

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: new MyLogger(),
});
await app.listen(3000);
```

#### Extend built-in logger

Lot of use cases require creating your own logger. You don't have to entirely reinvent the wheel though. Simply extend built-in `Logger` class to partially override the default implementation, and use `super` to delegate the call to the parent class.

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

If you want to enable dependency injection in your logger, you have to make the `MyLogger` class a part of the real application. For instance, you can create a `LoggerModule`.

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service.ts';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

Once `LoggerModule` is imported anywhere, the framework will take charge of creating an instance of your logger. Now, to use the same instance of a logger across the whole app, including bootstrapping and error handling stuff, use following construction:

```typescript
const app = await NestFactory.create(ApplicationModule, {
  logger: false,
});
app.useLogger(app.get(MyLogger));
await app.listen(3000);
```

The only downside of this solution is that your first initialization messages won't be handled by your logger instance, though, it shouldn't really matter at this point.
