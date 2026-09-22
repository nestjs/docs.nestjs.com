### Providers

Providers are a core concept in Nest. Many of the basic Nest classes, such as services, repositories, factories, and helpers, can be treated as providers. The main idea behind a provider is that it can be **injected** as a dependency, which lets objects form relationships with each other. The Nest runtime takes care of "wiring up" these objects.

<figure><img class="illustrative-image" src="/assets/Components_1.png" /></figure>

In the previous chapter, we built a basic `CatsController`. Controllers should handle HTTP requests and delegate more complex tasks to **providers**. In their simplest form, providers are plain JavaScript classes listed in the `providers` array of a module. For more details, see the [Modules](/modules) chapter.

> info **Hint** Nest lets you design and organize dependencies in an object-oriented way, so it's good practice to follow the [SOLID principles](https://en.wikipedia.org/wiki/SOLID).

#### Services

Let's start by creating a `CatsService`. This service handles data storage and retrieval for the `CatsController`. Because it encapsulates application logic, it's a natural candidate for a provider.

```typescript
@@filename(cats.service)
import { Injectable } from '@nestjs/common';
import type { Cat } from './interfaces/cat.interface.js';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  create(cat: Cat) {
    this.cats.push(cat);
  }

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

  create(cat) {
    this.cats.push(cat);
  }

  findAll() {
    return this.cats;
  }
}
```

> info **Hint** To create a service with the CLI, run `$ nest g service cats`.

`CatsService` is a basic class with one property and two methods. The key addition is the `@Injectable()` decorator. It attaches metadata to the class, declaring that `CatsService` can be managed by the Nest [IoC](https://en.wikipedia.org/wiki/Inversion_of_control) container.

The example also uses a `Cat` interface:

```typescript
@@filename(interfaces/cat.interface)
export interface Cat {
  name: string;
  age: number;
  breed: string;
}
```

Now that we have a service to store and retrieve cats, let's use it in the `CatsController`:

```typescript
@@filename(cats.controller)
import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto.js';
import { CatsService } from './cats.service.js';
import type { Cat } from './interfaces/cat.interface.js';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
@@switch
import { Controller, Get, Post, Body, Bind, Dependencies } from '@nestjs/common';
import { CatsService } from './cats.service.js';

@Controller('cats')
@Dependencies(CatsService)
export class CatsController {
  constructor(catsService) {
    this.catsService = catsService;
  }

  @Post()
  @Bind(Body())
  async create(createCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll() {
    return this.catsService.findAll();
  }
}
```

`CatsService` is **injected** through the class constructor. The next section explains how Nest resolves it.

#### Dependency injection

Nest is built around the **dependency injection** design pattern. For an introduction to the concept, see the [Angular documentation](https://angular.dev/guide/di).

Nest resolves dependencies by their type. In the example below, Nest resolves `catsService` by supplying an instance of `CatsService`. With the default (singleton) scope, Nest creates the instance once and shares it with every class that depends on it. Nest then passes the instance to the controller's constructor:

```typescript
constructor(private catsService: CatsService) {}
```

This single line does two things:

- The `private` keyword makes `catsService` a TypeScript **parameter property**: it declares a `catsService` member on the class and assigns the constructor argument to it, so you don't have to write `this.catsService = catsService` yourself.
- The `CatsService` type annotation is what Nest resolves against. At compile time, TypeScript emits the constructor's parameter types as metadata, and the container reads that metadata to determine which provider to supply.

> warning **Warning** Because resolution relies on the emitted type, the annotation must refer to something that exists at runtime, that is, a **class**. Interfaces and type aliases are erased during compilation. If `AppConfig` is an interface, `constructor(private config: AppConfig)` leaves Nest with no token to look up, and the application fails at startup with a "Nest can't resolve dependencies" error. The same happens when you import a class with `import type`, because the import is erased as well. To inject something that isn't a class, register it under a token and inject it explicitly with `@Inject()`, as described in [Custom providers](/fundamentals/custom-providers#interfaces-and-abstract-classes).

#### Scopes

By default, a provider's lifetime ("scope") matches the application lifecycle. When the application bootstraps, Nest resolves every dependency, which means every provider is instantiated. Likewise, when the application shuts down, every provider is destroyed. You can also give a provider a different scope, for example, make it **request-scoped** so that its lifetime is tied to an individual request. See the [Injection scopes](/fundamentals/injection-scopes) chapter for details.

<app-banner-courses></app-banner-courses>

#### Custom providers

Nest has a built-in inversion of control (IoC) container that manages the relationships between providers. The container underpins dependency injection and supports more than the class-based providers shown so far: you can also define providers with plain values, classes, and synchronous or asynchronous factories. For examples, see the [Custom providers](/fundamentals/custom-providers) chapter.

#### Optional providers

Some dependencies are not always required. For example, a class might depend on a **configuration object** but fall back to default values when none is provided. Such a dependency is optional, and its absence should not cause an error.

To mark a dependency as optional, apply the `@Optional()` decorator to the constructor parameter:

```typescript
import { Injectable, Optional, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  constructor(@Optional() @Inject('HTTP_OPTIONS') private httpClient: T) {}
}
```

This example injects a custom provider, so it passes the `HTTP_OPTIONS` custom **token** to `@Inject()`. The previous examples used constructor-based injection, where each dependency is identified by its class in the constructor signature. For more on custom providers and their tokens, see the [Custom providers](/fundamentals/custom-providers) chapter.

`@Optional()` only affects what happens when the provider is _missing_: if nothing is registered under `HTTP_OPTIONS`, Nest injects `undefined` instead of failing at startup. The class is therefore responsible for the fallback, typically by merging the injected value, if any, over a set of defaults.

#### Property-based injection

The examples so far use constructor-based injection, where providers are injected through the constructor. In some cases, **property-based injection** is more convenient. For example, if a base class depends on one or more providers, passing them up through `super()` from every subclass becomes cumbersome. Instead, you can apply the `@Inject()` decorator directly to a property:

```typescript
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  @Inject('HTTP_OPTIONS')
  private readonly httpClient: T;
}
```

> warning **Warning** If your class doesn't extend another class, prefer **constructor-based** injection. The constructor states explicitly which dependencies the class requires, which makes the code easier to follow than properties annotated with `@Inject()`.

#### Provider registration

With a provider (`CatsService`) and a consumer (`CatsController`) in place, you need to register the service with Nest so that it can perform the injection. To do so, add the service to the `providers` array of the `@Module()` decorator in the module file (`app.module.ts`):

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

Nest can now resolve the dependencies of the `CatsController` class.

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
<div class="item">cats.service.ts</div>
</div>
<div class="item">app.module.ts</div>
<div class="item">main.ts</div>
</div>
</div>

#### Manual instantiation

So far, Nest has resolved dependencies automatically. In some cases, you may need to step outside the dependency injection system and retrieve or instantiate providers manually. Two techniques cover these cases:

- To retrieve existing instances or instantiate providers dynamically, use `ModuleRef`, described in the [Module reference](/fundamentals/module-ref) chapter.
- To get providers within the `bootstrap()` function (e.g., for standalone applications or to use a configuration service during bootstrapping), see [Standalone applications](/standalone-applications).
