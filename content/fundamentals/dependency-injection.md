### Custom providers

Earlier chapters touched on various aspects of **dependency injection (DI)** and how Nest uses it. One example is [constructor-based](/providers#dependency-injection) dependency injection, which injects instances (often service providers) into classes. Dependency injection is built into the Nest core at a fundamental level. So far, we've explored only one main pattern. As your application grows more complex, you may need the full feature set of the DI system, so this chapter explores it in more detail.

#### DI fundamentals

Dependency injection is an [inversion of control (IoC)](https://en.wikipedia.org/wiki/Inversion_of_control) technique in which you delegate the instantiation of dependencies to the IoC container (in our case, the NestJS runtime system) instead of instantiating them imperatively in your own code. Let's examine what happens in this example from the [Providers](/providers) chapter.

First, we define a provider. The `@Injectable()` decorator marks the `CatsService` class as a provider.

```typescript
@@filename(cats.service)
import { Injectable } from '@nestjs/common';
import type { Cat } from './interfaces/cat.interface.js';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  findAll(): Cat[] {
    return this.cats;
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatsService {
  constructor() {
    this.cats = [];
  }

  findAll() {
    return this.cats;
  }
}
```

Then we request that Nest inject the provider into our controller class:

```typescript
@@filename(cats.controller)
import { Controller, Get } from '@nestjs/common';
import { CatsService } from './cats.service.js';
import type { Cat } from './interfaces/cat.interface.js';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
@@switch
import { Controller, Get, Dependencies } from '@nestjs/common';
import { CatsService } from './cats.service.js';

@Controller('cats')
@Dependencies(CatsService)
export class CatsController {
  constructor(catsService) {
    this.catsService = catsService;
  }

  @Get()
  async findAll() {
    return this.catsService.findAll();
  }
}
```

Finally, we register the provider with the Nest IoC container:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller.js';
import { CatsService } from './cats/cats.service.js';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class AppModule {}
```

Three key steps make this work:

1. In `cats.service.ts`, the `@Injectable()` decorator declares `CatsService` as a class that the Nest IoC container can manage.
2. In `cats.controller.ts`, `CatsController` declares a dependency on the `CatsService` token with constructor injection:

```typescript
  constructor(private catsService: CatsService)
```

3. In `app.module.ts`, we associate the token `CatsService` with the class `CatsService` from the `cats.service.ts` file. The <a href="/fundamentals/custom-providers#standard-providers">Standard providers</a> section below shows exactly how this association (also called _registration_) occurs.

When the Nest IoC container instantiates a `CatsController`, it first looks for any dependencies\*. When it finds the `CatsService` dependency, it looks up the `CatsService` token, which returns the `CatsService` class, per the registration step (#3 above). Assuming `SINGLETON` scope (the default), Nest then either creates an instance of `CatsService`, caches it, and returns it, or, if an instance is already cached, returns the existing one.

\*This explanation is simplified to illustrate the point. In reality, analyzing the code for dependencies is a sophisticated process that happens during application bootstrapping. One key property is that dependency analysis (or "creating the dependency graph") is **transitive**: in the example above, if `CatsService` itself had dependencies, those would be resolved too. The dependency graph ensures that dependencies are resolved in the correct order, essentially "bottom up". This mechanism relieves you from having to manage complex dependency graphs yourself.

<app-banner-courses></app-banner-courses>

#### Standard providers

Let's take a closer look at the `@Module()` decorator. In `app.module`, we declare:

```typescript
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
```

The `providers` property takes an array of providers. So far, we've supplied those providers as a list of class names. In fact, the syntax `providers: [CatsService]` is shorthand for the more complete syntax:

```typescript
providers: [
  {
    provide: CatsService,
    useClass: CatsService,
  },
];
```

This explicit construction shows the registration process: it associates the token `CatsService` with the class `CatsService`. The shorthand notation is a convenience for the most common use case, where the token is used to request an instance of the class with the same name.

#### Custom providers

Sometimes your requirements go beyond what _standard providers_ offer. For example:

- You want to create a custom instance instead of having Nest instantiate (or return a cached instance of) a class.
- You want to reuse an existing class in a second dependency.
- You want to override a class with a mock version for testing.

Nest lets you define custom providers to handle these cases, and offers several ways to define them. The following sections walk through each one.

> info **Hint** If you run into problems with dependency resolution, set the `NEST_DEBUG` environment variable to get extra dependency resolution logs during startup.

#### Value providers: `useValue`

The `useValue` syntax is useful for injecting a constant value, putting an external library into the Nest container, or replacing a real implementation with a mock object. For example, suppose you want Nest to use a mock `CatsService` for testing purposes:

```typescript
import { CatsService } from './cats.service.js';

const mockCatsService = {
  /* mock implementation
  ...
  */
};

@Module({
  imports: [CatsModule],
  providers: [
    {
      provide: CatsService,
      useValue: mockCatsService,
    },
  ],
})
export class AppModule {}
```

In this example, the `CatsService` token resolves to the `mockCatsService` mock object. `useValue` requires a value, in this case a literal object that has the same interface as the `CatsService` class it replaces. Because of TypeScript's [structural typing](https://www.typescriptlang.org/docs/handbook/type-compatibility.html), you can use any object with a compatible interface, including a literal object or a class instance created with `new`.

#### Non-class-based provider tokens

So far, we've used class names as our provider tokens (the value of the `provide` property in a provider listed in the `providers` array). This matches the standard pattern used with [constructor-based injection](/providers#dependency-injection), where the token is also a class name. (See <a href="/fundamentals/custom-providers#di-fundamentals">DI fundamentals</a> for a refresher on tokens.) Sometimes you need the flexibility to use strings or symbols as DI tokens. For example:

```typescript
import { connection } from './connection.js';

@Module({
  providers: [
    {
      provide: 'CONNECTION',
      useValue: connection,
    },
  ],
})
export class AppModule {}
```

In this example, we associate a string-valued token (`'CONNECTION'`) with a pre-existing `connection` object imported from an external file.

> warning **Notice** Besides strings, you can also use JavaScript [symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) or TypeScript [enums](https://www.typescriptlang.org/docs/handbook/enums.html) as token values.

The standard [constructor-based injection](/providers#dependency-injection) pattern **requires** the dependency to be declared with a class name. The `'CONNECTION'` custom provider, however, uses a string-valued token. To inject such a provider, use the `@Inject()` decorator, which takes a single argument: the token.

```typescript
@@filename()
@Injectable()
export class CatsRepository {
  constructor(@Inject('CONNECTION') connection: Connection) {}
}
@@switch
@Injectable()
@Dependencies('CONNECTION')
export class CatsRepository {
  constructor(connection) {}
}
```

> info **Hint** The `@Inject()` decorator is imported from the `@nestjs/common` package.

The examples above use the string `'CONNECTION'` directly for illustration. For clean code organization, define tokens in a separate file, such as `constants.ts`, and import them where needed, as you would with symbols or enums.

#### Interfaces and abstract classes

TypeScript types and interfaces are erased during compilation, so Nest can't reference them at runtime. An interface can describe the shape of a dependency, but it can't serve as a DI token by itself.

Because Nest resolves providers by runtime tokens, use a string or `Symbol` token when registering a provider for an interface:

```typescript
export interface LoggerService {
  log(message: string): void;
}

export const LOGGER_SERVICE = Symbol('LOGGER_SERVICE');

@Injectable()
export class PinoLoggerService implements LoggerService {
  log(message: string) {
    // implementation details
  }
}

@Module({
  providers: [
    {
      provide: LOGGER_SERVICE,
      useClass: PinoLoggerService,
    },
  ],
})
export class AppModule {}
```

To inject this provider, pass that token to the `@Inject()` decorator:

```typescript
@Injectable()
export class CatsService {
  constructor(
    @Inject(LOGGER_SERVICE)
    private readonly logger: LoggerService,
  ) {}
}
```

Abstract classes, unlike interfaces, exist at runtime. You can use an abstract class as both the TypeScript contract and the DI token:

```typescript
export abstract class LoggerService {
  abstract log(message: string): void;
}

@Injectable()
export class PinoLoggerService implements LoggerService {
  log(message: string) {
    // implementation details
  }
}

@Module({
  providers: [
    {
      provide: LoggerService,
      useClass: PinoLoggerService,
    },
  ],
})
export class AppModule {}
```

With an abstract class token, constructor-based injection uses the abstract class type directly and doesn't require `@Inject()`:

```typescript
@Injectable()
export class CatsService {
  constructor(private readonly logger: LoggerService) {}
}
```

Use string or `Symbol` tokens when the runtime DI token should be decoupled from a class. `Symbol` tokens are especially useful for libraries and larger applications: each symbol has a unique runtime identity, which avoids the accidental collisions that can occur when unrelated providers use the same string token. When using a symbol token, export it from a shared file and reuse the same symbol instance wherever the provider is registered and injected. Use an abstract class when one artifact should act as both the contract and the runtime token, and you prefer simpler constructor injection. A plain interface remains a good choice when the type is used only for compile-time checking and no DI token is needed.

#### Class providers: `useClass`

The `useClass` syntax lets you dynamically determine the class that a token resolves to. For example, suppose we have an abstract (or default) `ConfigService` class, and we want Nest to provide a different implementation of the configuration service depending on the current environment. The following code implements this strategy:

```typescript
const configServiceProvider = {
  provide: ConfigService,
  useClass:
    process.env.NODE_ENV === 'development'
      ? DevelopmentConfigService
      : ProductionConfigService,
};

@Module({
  providers: [configServiceProvider],
})
export class AppModule {}
```

Two details in this sample are worth noting. First, we define `configServiceProvider` as a literal object, then pass it in the module decorator's `providers` property. This is only code organization; it is functionally equivalent to the examples used so far in this chapter.

Second, we use the `ConfigService` class name as the token. For any class that depends on `ConfigService`, Nest injects an instance of the provided class (`DevelopmentConfigService` or `ProductionConfigService`), overriding any default implementation that may have been declared elsewhere (e.g., a `ConfigService` declared with an `@Injectable()` decorator).

#### Factory providers: `useFactory`

The `useFactory` syntax lets you create providers **dynamically**. The provider's value is whatever the factory function returns. The factory function can be as simple or as complex as needed. A simple factory may not depend on any other providers. A more complex factory can inject the providers it needs to compute its result. For the latter case, the factory provider syntax has a pair of related mechanisms:

1. The factory function can accept (optional) arguments.
2. The (optional) `inject` property accepts an array of providers that Nest resolves and passes as arguments to the factory function during instantiation. These providers can also be marked as optional. The two lists are correlated: Nest passes the instances from the `inject` list to the factory function as arguments, in the same order. The example below demonstrates this.

```typescript
@@filename()
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: MyOptionsProvider, optionalProvider?: string) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [MyOptionsProvider, { token: 'SomeOptionalProvider', optional: true }],
  //       \______________/             \__________________/
  //        This provider                The provider with this token
  //        is mandatory.                can resolve to `undefined`.
};

@Module({
  providers: [
    connectionProvider,
    MyOptionsProvider, // class-based provider
    // { provide: 'SomeOptionalProvider', useValue: 'anything' },
  ],
})
export class AppModule {}
@@switch
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider, optionalProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [MyOptionsProvider, { token: 'SomeOptionalProvider', optional: true }],
  //       \______________/            \__________________/
  //        This provider               The provider with this token
  //        is mandatory.               can resolve to `undefined`.
};

@Module({
  providers: [
    connectionProvider,
    MyOptionsProvider, // class-based provider
    // { provide: 'SomeOptionalProvider', useValue: 'anything' },
  ],
})
export class AppModule {}
```

#### Alias providers: `useExisting`

The `useExisting` syntax lets you create aliases for existing providers, which gives you two ways to access the same provider. In the example below, the (string-based) token `'AliasedLoggerService'` is an alias for the (class-based) token `LoggerService`. Assume we have two different dependencies, one on `'AliasedLoggerService'` and one on `LoggerService`. If both dependencies are specified with `SINGLETON` scope, they both resolve to the same instance.

```typescript
@Injectable()
class LoggerService {
  /* implementation details */
}

const loggerAliasProvider = {
  provide: 'AliasedLoggerService',
  useExisting: LoggerService,
};

@Module({
  providers: [LoggerService, loggerAliasProvider],
})
export class AppModule {}
```

#### Non-service based providers

Providers often supply services, but they aren't limited to that. A provider can supply **any** value. For example, a provider can supply a configuration object based on the current environment:

```typescript
const configFactory = {
  provide: 'CONFIG',
  useFactory: () => {
    return process.env.NODE_ENV === 'development' ? devConfig : prodConfig;
  },
};

@Module({
  providers: [configFactory],
})
export class AppModule {}
```

#### Export custom provider

Like any provider, a custom provider is scoped to its declaring module. To make it visible to other modules, you must export it, using either its token or the full provider object.

The following example exports the provider by its token:

```typescript
@@filename()
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],
})
export class AppModule {}
@@switch
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],
})
export class AppModule {}
```

Alternatively, export the full provider object:

```typescript
@@filename()
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class AppModule {}
@@switch
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class AppModule {}
```
