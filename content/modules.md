### Modules

A module is a class annotated with the `@Module()` decorator. The decorator provides metadata that **Nest** uses to organize and manage the application structure.

<figure><img class="illustrative-image" src="/assets/Modules_1.png" /></figure>

Every Nest application has at least one module, the **root module**. It is the starting point from which Nest builds the **application graph**, the internal structure Nest uses to resolve relationships and dependencies between modules and providers. A very small application may have only a root module, but most applications have multiple modules, each encapsulating a closely related set of **capabilities**. Modules are the **recommended** way to organize your components.

The `@Module()` decorator takes a single object with properties that describe the module:

|               |                                                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `providers`   | the providers that will be instantiated by the Nest injector and that may be shared at least across this module                                                                                          |
| `controllers` | the set of controllers defined in this module that must be instantiated                                                                                                                                  |
| `imports`     | the list of imported modules that export the providers required in this module                                                                                                                           |
| `exports`     | the subset of `providers` that this module provides and that should be available to other modules importing it. You can use either the provider itself or its token (the `provide` value)                |

A module **encapsulates** its providers by default: you can inject only providers that are part of the current module or that are explicitly exported by an imported module. A module's exported providers form its public interface, or API.

#### Feature modules

In our example, `CatsController` and `CatsService` are closely related and serve the same application domain, so it makes sense to group them into a feature module. A feature module organizes the code for a specific feature, which keeps boundaries clear. This becomes more important as the application or team grows, and it aligns with the [SOLID](https://en.wikipedia.org/wiki/SOLID) principles.

Next, we'll create a `CatsModule` that groups the controller and the service:

```typescript
@@filename(cats/cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller.js';
import { CatsService } from './cats.service.js';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

> info **Hint** To create a module with the CLI, run `$ nest g module cats`.

Above, we defined `CatsModule` in the `cats.module.ts` file and moved everything related to it into the `cats` directory. The last step is to import this module into the root module (`AppModule`, defined in the `app.module.ts` file):

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module.js';

@Module({
  imports: [CatsModule],
})
export class AppModule {}
```

The directory structure now looks like this:

<div class="file-tree">
  <div class="item">src</div>
  <div class="children">
    <div class="item">cats</div>
    <div class="children">
      <div class="item">dto</div>
      <div class="children">
        <div class="item">create-cat.dto.ts</div>
      </div>
      <div class="item">interfaces</div>
      <div class="children">
        <div class="item">cat.interface.ts</div>
      </div>
      <div class="item">cats.controller.ts</div>
      <div class="item">cats.module.ts</div>
      <div class="item">cats.service.ts</div>
    </div>
    <div class="item">app.module.ts</div>
    <div class="item">main.ts</div>
  </div>
</div>

#### Shared modules

In Nest, modules are **singletons** by default, so you can share the same instance of any provider between multiple modules.

<figure><img class="illustrative-image" src="/assets/Shared_Module_1.png" /></figure>

Every module is automatically a **shared module**: once created, it can be reused by any other module. Suppose you want to share an instance of `CatsService` between several other modules. To do so, first **export** the `CatsService` provider by adding it to the module's `exports` array:

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller.js';
import { CatsService } from './cats.service.js';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

Any module that imports `CatsModule` now has access to `CatsService` and shares the same instance with every other module that imports it.

Registering `CatsService` directly in every module that needs it would also work, but each module would then get its own separate instance of the service. Multiple instances increase memory usage and can cause unexpected behavior, such as inconsistent state if the service holds internal state.

Encapsulating `CatsService` in a module such as `CatsModule` and exporting it ensures that every module importing `CatsModule` reuses the same instance. This reduces memory consumption and makes behavior more predictable, because shared state and resources are managed in one place. Sharing services efficiently across the application is one of the key benefits of modularity and dependency injection.

<app-banner-devtools></app-banner-devtools>

#### Module re-exporting

As shown above, modules can export their internal providers. They can also re-export modules that they import. In the example below, `CommonModule` is both imported into **and** exported from `CoreModule`, which makes it available to any module that imports `CoreModule`.

```typescript
@Module({
  imports: [CommonModule],
  exports: [CommonModule],
})
export class CoreModule {}
```

#### Dependency injection

A module class can also **inject** providers (e.g., for configuration purposes):

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller.js';
import { CatsService } from './cats.service.js';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {
  constructor(private catsService: CatsService) {}
}
@@switch
import { Module, Dependencies } from '@nestjs/common';
import { CatsController } from './cats.controller.js';
import { CatsService } from './cats.service.js';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
@Dependencies(CatsService)
export class CatsModule {
  constructor(catsService) {
    this.catsService = catsService;
  }
}
```

However, module classes themselves cannot be injected as providers due to [circular dependencies](/fundamentals/circular-dependency).

#### Global modules

Importing the same set of modules everywhere can become tedious. In [Angular](https://angular.dev), `providers` are registered in the global scope and, once defined, are available everywhere. Nest, by contrast, encapsulates providers inside the module scope: you can't use a module's providers elsewhere without first importing the module that encapsulates them.

To make a set of providers available everywhere out of the box (e.g., helpers or database connections), make the module **global** with the `@Global()` decorator:

```typescript
import { Module, Global } from '@nestjs/common';
import { CatsController } from './cats.controller.js';
import { CatsService } from './cats.service.js';

@Global()
@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

The `@Global()` decorator makes the module global-scoped. Register global modules **only once**, typically in the root or core module. In the example above, the `CatsService` provider is available everywhere, and modules that inject it don't need to add `CatsModule` to their `imports` array.

> info **Hint** Making everything global is not a recommended design practice. Global modules reduce boilerplate, but the `imports` array makes a module's API available to other modules in a controlled, explicit way. This keeps the application structure maintainable, shares only the parts of a module that others need, and avoids unnecessary coupling between unrelated parts of the application.

#### Dynamic modules

Dynamic modules let you create modules that are configured at runtime. They are useful when a module's providers depend on options supplied by the module that imports it. For example, the following `FeatureFlagsModule` receives the application's feature flags through its static `forRoot()` method:

```typescript
@@filename(feature-flags.module)
import { DynamicModule, Module } from '@nestjs/common';
import { FEATURE_FLAGS } from './feature-flags.constants.js';
import { FeatureFlagsService } from './feature-flags.service.js';

@Module({
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {
  static forRoot(flags: Record<string, boolean>): DynamicModule {
    return {
      module: FeatureFlagsModule,
      providers: [{ provide: FEATURE_FLAGS, useValue: flags }],
    };
  }
}
@@switch
import { Module } from '@nestjs/common';
import { FEATURE_FLAGS } from './feature-flags.constants.js';
import { FeatureFlagsService } from './feature-flags.service.js';

@Module({
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {
  static forRoot(flags) {
    return {
      module: FeatureFlagsModule,
      providers: [{ provide: FEATURE_FLAGS, useValue: flags }],
    };
  }
}
```

The `FEATURE_FLAGS` injection token is a plain constant (`export const FEATURE_FLAGS = 'FEATURE_FLAGS';`), as described in [Non-class-based provider tokens](/fundamentals/custom-providers#non-class-based-provider-tokens).

> info **Hint** The `forRoot()` method may return a dynamic module either synchronously or asynchronously (i.e., via a `Promise`).

The properties returned by `forRoot()` **extend** (rather than override) the metadata defined in the `@Module()` decorator. The resulting module therefore has both the statically declared `FeatureFlagsService` and the dynamically registered `FEATURE_FLAGS` provider. Because they belong to the same module, the service can inject the flags:

```typescript
@@filename(feature-flags.service)
import { Inject, Injectable } from '@nestjs/common';
import { FEATURE_FLAGS } from './feature-flags.constants.js';

@Injectable()
export class FeatureFlagsService {
  constructor(
    @Inject(FEATURE_FLAGS) private readonly flags: Record<string, boolean>,
  ) {}

  isEnabled(flag: string): boolean {
    return this.flags[flag] ?? false;
  }
}
@@switch
import { Dependencies, Injectable } from '@nestjs/common';
import { FEATURE_FLAGS } from './feature-flags.constants.js';

@Injectable()
@Dependencies(FEATURE_FLAGS)
export class FeatureFlagsService {
  constructor(flags) {
    this.flags = flags;
  }

  isEnabled(flag) {
    return this.flags[flag] ?? false;
  }
}
```

The module exports only `FeatureFlagsService`, so the flags themselves stay an implementation detail of the module.

Import and configure the `FeatureFlagsModule` as follows:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module.js';

@Module({
  imports: [
    FeatureFlagsModule.forRoot({
      newCheckout: true,
      betaDashboard: false,
    }),
  ],
})
export class AppModule {}
```

Only the module that imports `FeatureFlagsModule.forRoot()` can inject `FeatureFlagsService`. Calling `forRoot()` again in another module would create a second, separately configured instance. To share a single instance, configure the module once and re-export it. To re-export a dynamic module, list the module class in the `exports` array, without calling `forRoot()` again:

```typescript
@@filename(core.module)
import { Module } from '@nestjs/common';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module.js';

@Module({
  imports: [
    FeatureFlagsModule.forRoot({
      newCheckout: true,
      betaDashboard: false,
    }),
  ],
  exports: [FeatureFlagsModule],
})
export class CoreModule {}
```

Every module that imports `CoreModule` can now inject `FeatureFlagsService`, and all of them share the same flags.

Alternatively, to register a dynamic module in the global scope, set the `global` property to `true` in the object returned by `forRoot()`. `FeatureFlagsService` then becomes injectable everywhere, without importing any module:

```typescript
return {
  global: true,
  module: FeatureFlagsModule,
  providers: [{ provide: FEATURE_FLAGS, useValue: flags }],
};
```

> warning **Warning** As mentioned above, making everything global **is not a good design decision**.

Options known only at runtime, such as values read by `ConfigService`, call for an asynchronous variant of `forRoot()`. The [Dynamic modules](/fundamentals/dynamic-modules) chapter covers this and more.

> info **Hint** To learn how to build highly customizable dynamic modules with `ConfigurableModuleBuilder`, see the [Configurable module builder](/fundamentals/dynamic-modules#configurable-module-builder) section.
