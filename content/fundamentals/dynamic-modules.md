### Dynamic modules

The [Modules chapter](/modules) covers the basics of Nest modules and includes a brief introduction to [dynamic modules](/modules#dynamic-modules). This chapter expands on the subject: what dynamic modules are, how to build them, and when to use them.

#### Introduction

Most code examples in the **Overview** section of the documentation use regular, or static, modules. Modules define groups of components, such as [providers](/providers) and [controllers](/controllers), that fit together as a modular part of an application. They provide an execution context, or scope, for these components. For example, providers defined in a module are visible to other members of the module without being exported. When a provider needs to be visible outside of a module, it is first exported from its host module, and then imported into its consuming module.

Consider a familiar example. First, a `UsersModule` provides and exports a `UsersService`. `UsersModule` is the **host** module for `UsersService`.

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

Next, an `AuthModule` imports `UsersModule`, which makes `UsersModule`'s exported providers available inside `AuthModule`:

```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

These constructs allow us to inject `UsersService` into, for example, the `AuthService` hosted in `AuthModule`:

```typescript
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}
  /*
    Implementation that makes use of this.usersService
  */
}
```

We'll refer to this as **static** module binding. All the information Nest needs to wire the modules together is declared in the host and consuming modules. Nest makes `UsersService` available inside `AuthModule` by:

1. Instantiating `UsersModule`, including transitively importing the modules that `UsersModule` itself consumes, and transitively resolving any dependencies (see [Custom providers](/fundamentals/custom-providers)).
2. Instantiating `AuthModule`, and making `UsersModule`'s exported providers available to components in `AuthModule` (as if they had been declared in `AuthModule`).
3. Injecting an instance of `UsersService` into `AuthService`.

#### Dynamic module use case

With static module binding, the consuming module has no way to **influence** how the providers of the host module are configured. This matters for general-purpose modules that need to behave differently for each consumer, much like a "plugin" that requires some configuration before it can be used.

As an example, consider a module that generates the public identifiers of your entities. Identifiers that start with a type prefix, such as `usr_` for users and `ord_` for orders, tell you at a glance what kind of entity they refer to. The generation logic is the same for every entity, and only the prefix differs. With static binding, an `IdGeneratorModule` could provide only one generator, configured one way for every module that imports it. What we need instead is for `UsersModule` and `OrdersModule` to each import the module with their own prefix.

This is where **dynamic modules** come into play. A dynamic module provides an API for importing one module into another and customizing the properties and behavior of that module at the time it is imported.

<app-banner-devtools></app-banner-devtools>

#### Dynamic module example

It's helpful to start from how the module looks from the consuming module's perspective, and then work backwards. A static import leaves no room to pass a prefix:

```typescript
import { Module } from '@nestjs/common';
import { IdGeneratorModule } from '../id-generator/id-generator.module.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [IdGeneratorModule],
  providers: [UsersService],
})
export class UsersModule {}
```

A dynamic import, on the other hand, passes an options object. Compare the `imports` arrays of the two examples:

```typescript
import { Module } from '@nestjs/common';
import { IdGeneratorModule } from '../id-generator/id-generator.module.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [IdGeneratorModule.register({ prefix: 'usr' })],
  providers: [UsersService],
})
export class UsersModule {}
```

Let's look at the moving parts of the dynamic example:

1. `IdGeneratorModule` is a normal class, so it must have a **static method** called `register()`. The method is static because it's called on the class, not on an **instance** of the class. The method can have any name, but by convention it's called `register()`, `forRoot()`, or `forFeature()` (see [Community guidelines](#community-guidelines)).
2. We define the `register()` method ourselves, so it can accept any arguments we like. Typically, as here, it accepts an options object.
3. The value returned by `register()` appears in the `imports` array, alongside module classes, so it must be something Nest can treat as a module.

In fact, `register()` returns a `DynamicModule`. A dynamic module is a module created at runtime. It has exactly the same properties as the metadata of a static module, plus one additional property called `module`. Here's a sample static module declaration, for comparison:

```typescript
@Module({
  imports: [DogsModule],
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
```

A dynamic module is an object with the same properties, plus the `module` property, which references the module class itself.

> info **Hint** For a dynamic module, all properties of the module options object are optional **except** `module`.

The job of the static `register()` method is therefore to return an object that implements the `DynamicModule` interface. Calling it provides a module to the `imports` array, much like listing a module class does in the static case. The difference is that the module's properties are specified programmatically instead of being fixed in the `@Module()` decorator.

Two more details complete the picture:

1. The `imports` array of the `@Module()` decorator accepts not only module classes (e.g., `imports: [UsersModule]`), but also the dynamic modules returned by static methods (e.g., `imports: [IdGeneratorModule.register(...)]`).
2. A dynamic module can itself import other modules. If it depends on providers from other modules, list them in its optional `imports` property, exactly as you would in the `@Module()` decorator of a static module.

With this in mind, here's a first version of the dynamic `IdGeneratorModule`:

```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { IdGenerator } from './id-generator.js';

@Module({})
export class IdGeneratorModule {
  static register(): DynamicModule {
    return {
      module: IdGeneratorModule,
      providers: [IdGenerator],
      exports: [IdGenerator],
    };
  }
}
```

Calling `IdGeneratorModule.register()` returns a `DynamicModule` object whose properties are essentially the same as those that, until now, we've provided as metadata through the `@Module()` decorator.

> info **Hint** Import `DynamicModule` from `@nestjs/common`.

This module isn't configurable yet, though. Let's address that next.

#### Module configuration

The consuming module passes the options to `register()`, as shown above. The question is how to get them to the component that needs them. `IdGeneratorModule` hosts and exports an injectable service, `IdGenerator`, and it's `IdGenerator` that needs the prefix. For now, the service hard-codes it:

```typescript
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

@Injectable()
export class IdGenerator {
  generate(): string {
    const options = { prefix: 'usr' };
    return `${options.prefix}_${randomUUID()}`;
  }
}
```

Our remaining task is to pass the `options` object from the `register()` method to `IdGenerator`, and we'll use _dependency injection_ to do it. This is the key point: `IdGeneratorModule` provides `IdGenerator`, and `IdGenerator` depends on an `options` object that is supplied only at runtime. So, at runtime, we first bind the `options` object to the Nest IoC container, and then let Nest inject it into `IdGenerator`. As the **Custom providers** chapter explains, providers can [be any value](/fundamentals/custom-providers#non-service-based-providers), not only services, so a plain `options` object works too.

First, describe the options with an interface, and define an injection token for them. A token defined as a constant (or a `Symbol`) in a separate file can be imported wherever it's needed:

```typescript
@@filename(id-generator.interfaces)
export interface IdGeneratorModuleOptions {
  prefix: string;
}

export const ID_GENERATOR_OPTIONS = 'ID_GENERATOR_OPTIONS';
```

Next, bind the options object to the IoC container in the static `register()` method. We are constructing a module dynamically, and one of the properties of a module is its list of providers, so we define the options object as a provider. Pay attention to the `providers` array:

```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { IdGenerator } from './id-generator.js';
import {
  ID_GENERATOR_OPTIONS,
  IdGeneratorModuleOptions,
} from './id-generator.interfaces.js';

@Module({})
export class IdGeneratorModule {
  static register(options: IdGeneratorModuleOptions): DynamicModule {
    return {
      module: IdGeneratorModule,
      providers: [
        {
          provide: ID_GENERATOR_OPTIONS,
          useValue: options,
        },
        IdGenerator,
      ],
      exports: [IdGenerator],
    };
  }
}
```

Now inject the options into `IdGenerator`. A provider registered with a non-class token is injected with the `@Inject()` decorator, as described in [Non-class-based provider tokens](/fundamentals/custom-providers#non-class-based-provider-tokens):

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ID_GENERATOR_OPTIONS,
  type IdGeneratorModuleOptions,
} from './id-generator.interfaces.js';

@Injectable()
export class IdGenerator {
  constructor(
    @Inject(ID_GENERATOR_OPTIONS)
    private readonly options: IdGeneratorModuleOptions,
  ) {}

  generate(): string {
    return `${this.options.prefix}_${randomUUID()}`;
  }
}
```

With that in place, each consuming module configures its own generator:

```typescript
@Module({
  imports: [IdGeneratorModule.register({ prefix: 'usr' })],
  providers: [UsersService],
})
export class UsersModule {}

@Module({
  imports: [IdGeneratorModule.register({ prefix: 'ord' })],
  providers: [OrdersService],
})
export class OrdersModule {}
```

`UsersService` and `OrdersService` both inject `IdGenerator`, but each receives its own instance, configured by the module that imported it: user identifiers start with `usr_`, and order identifiers with `ord_`.

#### Community guidelines

You may have seen methods like `forRoot()`, `register()`, and `forFeature()` in some of the `@nestjs/` packages, and wondered how they differ. There is no hard rule, but the `@nestjs/` packages follow these guidelines:

- `register()` configures a dynamic module for use only by the calling module, as our `IdGeneratorModule` does. For example, with `@nestjs/axios`, `HttpModule.register({{ '{' }} baseURL: 'someUrl' {{ '}' }})` configures an HTTP client for the calling module. Another module can call `HttpModule.register({{ '{' }} baseURL: 'somewhere else' {{ '}' }})` to get a differently configured client. You can do this in as many modules as you want.
- `forRoot()` configures a dynamic module once and reuses that configuration in multiple places (possibly without the consumers being aware of it). This is why an application has one `GraphQLModule.forRoot()`, one `TypeOrmModule.forRoot()`, and so on.
- `forFeature()` uses the configuration set up by `forRoot()`, but modifies some of it for the needs of the calling module (e.g., which repositories the module has access to, or the context a logger should use).

Each of these usually has an asynchronous counterpart, `registerAsync()`, `forRootAsync()`, and `forFeatureAsync()`, which means the same thing, but resolves the configuration through Nest's dependency injection.

#### Configurable module builder

Manually creating highly configurable dynamic modules that also expose asynchronous methods (`registerAsync()`, `forRootAsync()`, etc.) is complicated, especially for newcomers. To simplify this, Nest provides the `ConfigurableModuleBuilder` class, which constructs a module "blueprint" in a few lines of code.

As an example, let's convert the `IdGeneratorModule` above to use the `ConfigurableModuleBuilder`. It keeps the `IdGeneratorModuleOptions` interface, but the builder generates the injection token, so the `ID_GENERATOR_OPTIONS` constant is no longer needed.

Create a new file alongside `id-generator.module.ts`, named `id-generator.module-definition.ts`, and use the `ConfigurableModuleBuilder` to construct the `IdGeneratorModule` definition:

```typescript
@@filename(id-generator.module-definition)
import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { IdGeneratorModuleOptions } from './id-generator.interfaces.js';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<IdGeneratorModuleOptions>().build();
@@switch
import { ConfigurableModuleBuilder } from '@nestjs/common';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().build();
```

Next, change `id-generator.module.ts` to extend the generated `ConfigurableModuleClass`:

```typescript
import { Module } from '@nestjs/common';
import { IdGenerator } from './id-generator.js';
import { ConfigurableModuleClass } from './id-generator.module-definition.js';

@Module({
  providers: [IdGenerator],
  exports: [IdGenerator],
})
export class IdGeneratorModule extends ConfigurableModuleClass {}
```

As with any dynamic module, the metadata returned by the generated methods extends the metadata in the `@Module()` decorator, so `IdGenerator` is provided and exported alongside the generated options provider.

Finally, update `IdGenerator` to inject the generated options provider instead of the `ID_GENERATOR_OPTIONS` token:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IdGeneratorModuleOptions } from './id-generator.interfaces.js';
import { MODULE_OPTIONS_TOKEN } from './id-generator.module-definition.js';

@Injectable()
export class IdGenerator {
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: IdGeneratorModuleOptions,
  ) {}

  generate(): string {
    return `${this.options.prefix}_${randomUUID()}`;
  }
}
```

Extending `ConfigurableModuleClass` gives `IdGeneratorModule` not only the `register()` method (as the manual implementation did), but also `registerAsync()`, which lets consumers configure the module asynchronously. For example, the following factory reads the prefix with the `ConfigService` from [`@nestjs/config`](/application/configuration):

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IdGeneratorModule } from '../id-generator/id-generator.module.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    IdGeneratorModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        prefix: configService.getOrThrow<string>('USER_ID_PREFIX'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UsersService],
})
export class UsersModule {}
```

The `registerAsync()` method takes an object with the following properties:

```typescript
{
  /**
   * Modules whose exported providers the factory, class, or existing
   * provider depends on.
   */
  imports?: ModuleMetadata['imports'];
  /**
   * Function returning options (or a Promise resolving to options) to configure the
   * module.
   */
  useFactory?: (...args: any[]) => Promise<ModuleOptions> | ModuleOptions;
  /**
   * Dependencies that a Factory may inject.
   */
  inject?: FactoryProvider['inject'];
  /**
   * Injection token resolving to a class that will be instantiated as a provider.
   * The class must implement the corresponding interface.
   */
  useClass?: Type<
    ConfigurableModuleOptionsFactory<ModuleOptions, FactoryClassMethodKey>
  >;
  /**
   * Injection token resolving to an existing provider. The provider must implement
   * the corresponding interface.
   */
  useExisting?: Type<
    ConfigurableModuleOptionsFactory<ModuleOptions, FactoryClassMethodKey>
  >;
  /**
   * List of parent module's providers that will be filtered to only provide necessary
   * providers for the 'inject' array.
   */
  provideInjectionTokensFrom?: Provider[];
}
```

Let's go through these properties one by one:

- `imports` - modules to import into the dynamic module, so that the factory, class, or existing provider can inject their exported providers. The example above imports `ConfigModule` to inject `ConfigService`.
- `useFactory` - a function that returns the options object. It can be either synchronous or asynchronous. To inject dependencies into the factory function, use the `inject` property. The example above uses this variant.
- `inject` - an array of dependencies to inject into the factory function. The order of the dependencies must match the order of the factory function's parameters.
- `useClass` - a class to instantiate as a provider. The class must implement the corresponding interface, which by default means providing a `create()` method that returns the options object. See [Custom options factory class](#custom-options-factory-class) below.
- `useExisting` - a variant of `useClass` that reuses an existing provider instead of instructing Nest to create a new instance of the class. The provider must implement the same interface as a `useClass` class (and so must provide the `create()` method, unless you change the method name, as described in [Custom options factory class](#custom-options-factory-class) below).
- `provideInjectionTokensFrom` - used together with `useFactory` (or `useExisting`) and `inject`: a list of providers from which Nest picks the ones listed in `inject` and registers them in the dynamic module. This is useful when a module passes its own options on to a nested module that it configures asynchronously.

Always choose exactly one of `useFactory`, `useClass`, and `useExisting`, as they are mutually exclusive.

#### Custom method key

By default, `ConfigurableModuleClass` provides the `register()` method and its `registerAsync()` counterpart. To use a different method name, use the `ConfigurableModuleBuilder#setClassMethodName` method. For example, if your module is meant to be configured once for the entire application, the [community guidelines](#community-guidelines) suggest `forRoot()`:

```typescript
@@filename(id-generator.module-definition)
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<IdGeneratorModuleOptions>()
    .setClassMethodName('forRoot')
    .build();
@@switch
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().setClassMethodName('forRoot').build();
```

This instructs `ConfigurableModuleBuilder` to generate a class that exposes `forRoot()` and `forRootAsync()` instead:

```typescript
@Module({
  imports: [
    IdGeneratorModule.forRoot({ prefix: 'id' }), // <-- note "forRoot" instead of "register"
    // or alternatively:
    // IdGeneratorModule.forRootAsync({
    //   useFactory: () => ({ prefix: 'id' }),
    //   inject: [...any extra dependencies...],
    // }),
  ],
})
export class AppModule {}
```

#### Custom options factory class

Because the `registerAsync()` method (or `forRootAsync()`, or any other name, depending on the configuration) lets consumers pass a provider definition that resolves to the module options, a consumer can also supply a class that constructs the options object:

```typescript
@Module({
  imports: [
    IdGeneratorModule.registerAsync({
      useClass: IdGeneratorConfigService,
    }),
  ],
})
export class UsersModule {}
```

By default, this class must provide a `create()` method that returns the module options. The `ConfigurableModuleOptionsFactory` interface, exported from `@nestjs/common`, describes this contract:

```typescript
import { ConfigurableModuleOptionsFactory, Injectable } from '@nestjs/common';
import type { IdGeneratorModuleOptions } from '../id-generator/id-generator.interfaces.js';

@Injectable()
export class IdGeneratorConfigService
  implements ConfigurableModuleOptionsFactory<IdGeneratorModuleOptions, 'create'>
{
  create(): IdGeneratorModuleOptions {
    return { prefix: 'usr' };
  }
}
```

If your library follows a different naming convention, instruct `ConfigurableModuleBuilder` to expect a different method, for example, `createIdGeneratorOptions`, with the `ConfigurableModuleBuilder#setFactoryMethodName` method:

```typescript
@@filename(id-generator.module-definition)
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<IdGeneratorModuleOptions>()
    .setFactoryMethodName('createIdGeneratorOptions')
    .build();
@@switch
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder()
    .setFactoryMethodName('createIdGeneratorOptions')
    .build();
```

Now the `IdGeneratorConfigService` class must expose the `createIdGeneratorOptions()` method instead of `create()`:

```typescript
@Module({
  imports: [
    IdGeneratorModule.registerAsync({
      useClass: IdGeneratorConfigService, // <-- this class must provide the "createIdGeneratorOptions" method
    }),
  ],
})
export class UsersModule {}
```

#### Extra options

In some cases, a module needs extra options that determine how it behaves, but that shouldn't be included in the `MODULE_OPTIONS_TOKEN` provider, because they are irrelevant to the providers registered within the module. A good example is an `isGlobal` flag: `IdGenerator` doesn't need to know whether its host module is registered as a global module.

For such options, use the `ConfigurableModuleBuilder#setExtras` method:

```typescript
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<IdGeneratorModuleOptions>()
    .setExtras(
      {
        isGlobal: false,
      },
      (definition, extras) => ({
        ...definition,
        global: extras.isGlobal,
      }),
    )
    .build();
```

The first argument passed to the `setExtras` method is an object with the default values of the extra properties. The second argument is a function that receives the auto-generated module definition (with `providers`, `exports`, etc.) and the `extras` object, which holds the extra properties (either specified by the consumer or the defaults). The function returns the modified module definition. In this example, the `extras.isGlobal` property is assigned to the `global` property of the module definition, which determines whether the module is global (see [Dynamic modules](/modules#dynamic-modules) in the Modules chapter).

Now, when importing this module, consumers can pass the additional `isGlobal` flag. For example, an application that uses one prefix for all of its identifiers can register the module once, globally:

```typescript
@Module({
  imports: [
    IdGeneratorModule.register({
      isGlobal: true,
      prefix: 'id',
    }),
  ],
})
export class AppModule {}
```

However, since `isGlobal` is declared as an extra property, it isn't part of the options object provided by `MODULE_OPTIONS_TOKEN`:

```typescript
@Injectable()
export class IdGenerator {
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: IdGeneratorModuleOptions,
  ) {
    // "options" object will not have the "isGlobal" property
    // ...
  }
}
```

#### Extending auto-generated methods

The auto-generated static methods (`register()`, `registerAsync()`, etc.) can be extended if needed, as follows:

```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { IdGenerator } from './id-generator.js';
import {
  ASYNC_OPTIONS_TYPE,
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from './id-generator.module-definition.js';

@Module({
  providers: [IdGenerator],
  exports: [IdGenerator],
})
export class IdGeneratorModule extends ConfigurableModuleClass {
  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    return {
      // your custom logic here
      ...super.register(options),
    };
  }

  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return {
      // your custom logic here
      ...super.registerAsync(options),
    };
  }
}
```

Note the `OPTIONS_TYPE` and `ASYNC_OPTIONS_TYPE` types, which must be exported from the module definition file:

```typescript
export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<IdGeneratorModuleOptions>().build();
```
