### Testing

Automated testing is an essential part of any serious software development effort. Automation makes it easy to repeat individual tests or test suites quickly during development, which helps ensure that releases meet quality and performance goals. It increases coverage, gives developers a faster feedback loop, and ensures that tests run at critical points in the development lifecycle, such as source control check-in, feature integration, and version release.

These tests span a variety of types, including unit tests, end-to-end (e2e) tests, and integration tests. While the benefits are clear, setting them up can be tedious. Nest promotes development best practices, including effective testing, and includes the following features to help developers and teams build and automate tests. Nest:

- automatically scaffolds default unit tests for components and e2e tests for applications
- provides default tooling (such as a test runner that builds an isolated module/application loader)
- provides integration with [Vitest](https://vitest.dev/) and [Supertest](https://github.com/visionmedia/supertest) while remaining agnostic to testing tools
- makes the Nest dependency injection system available in the testing environment, so you can mock components without extra setup

You can use any **testing framework** you like, because Nest doesn't force any specific tooling. Replace the elements you need (such as the test runner), and you still benefit from Nest's ready-made testing facilities.

> info **Hint** Newly generated projects use Vitest by default. The testing APIs exposed by Nest don't depend on a specific runner, so the same patterns work with other tools as well.

#### Installation

To get started, install the required package:

```bash
$ npm i --save-dev @nestjs/testing
```

#### Unit testing

The following example tests two classes, `CatsController` and `CatsService`, with [Vitest](https://vitest.dev/). Vitest serves as the test runner and also provides assertion functions and test-double utilities for mocking, spying, and stubbing. This basic test instantiates the classes manually and checks that the controller and service fulfill their API contract.

```typescript
@@filename(cats.controller.spec)
import { vi } from 'vitest';
import { CatsController } from './cats.controller.js';
import { CatsService } from './cats.service.js';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      vi.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
@@switch
import { vi } from 'vitest';
import { CatsController } from './cats.controller.js';
import { CatsService } from './cats.service.js';

describe('CatsController', () => {
  let catsController;
  let catsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      vi.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
```

> info **Hint** Keep your test files near the classes they test. Test files should have a `.spec` or `.test` suffix.

Because the sample above is trivial, it doesn't test anything Nest-specific. It doesn't even use dependency injection (it passes an instance of `CatsService` to `catsController` directly). This form of testing, where you manually instantiate the classes being tested, is often called **isolated testing**, because it is independent of the framework. The following sections introduce more advanced capabilities that help you test applications that make more extensive use of Nest features.

#### Testing utilities

The `@nestjs/testing` package provides a set of utilities for a more robust testing process. Let's rewrite the previous example using the built-in `Test` class:

```typescript
@@filename(cats.controller.spec)
import { vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { CatsController } from './cats.controller.js';
import { CatsService } from './cats.service.js';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

    catsService = moduleRef.get(CatsService);
    catsController = moduleRef.get(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      vi.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
@@switch
import { vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { CatsController } from './cats.controller.js';
import { CatsService } from './cats.service.js';

describe('CatsController', () => {
  let catsController;
  let catsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

    catsService = moduleRef.get(CatsService);
    catsController = moduleRef.get(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      vi.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
```

The `Test` class provides an application execution context that essentially mocks the full Nest runtime, but gives you hooks for managing class instances, including mocking and overriding. Its `createTestingModule()` method takes a module metadata object as its argument (the same object you pass to the `@Module()` decorator) and returns a `TestingModuleBuilder` instance, which in turn provides a few methods. For unit tests, the important one is `compile()`. It bootstraps a module with its dependencies (similar to the way an application is bootstrapped in the conventional `main.ts` file using `NestFactory.create()`), and returns a `TestingModule` that is ready for testing.

> info **Hint** The `compile()` method is **asynchronous**, so you have to await it. Once the module is compiled, you can retrieve any **static** instance it declares (controllers and providers) using the `get()` method.

`TestingModule` exposes the same instance-resolution API as the [module reference](/fundamentals/module-ref) class, including the ability to dynamically resolve scoped providers (transient or request-scoped). Use the `resolve()` method for this (the `get()` method can only retrieve static instances).

```typescript
const moduleRef = await Test.createTestingModule({
  controllers: [CatsController],
  providers: [CatsService],
}).compile();

catsService = await moduleRef.resolve(CatsService);
```

> warning **Warning** The `resolve()` method returns a unique instance of the provider from its own **DI container sub-tree**. Each sub-tree has a unique context identifier. If you call this method more than once and compare the instance references, you'll see that they are not equal.

> info **Hint** Learn more about its features in the [module reference](/fundamentals/module-ref) chapter.

Instead of using the production version of a provider, you can override it with a [custom provider](/fundamentals/custom-providers) for testing purposes. For example, you can mock a database service instead of connecting to a live database. Overrides are covered in the [end-to-end testing](/fundamentals/testing#end-to-end-testing) section, but they're available for unit tests as well.

<app-banner-courses></app-banner-courses>

#### Auto mocking

Nest also lets you define a mock factory to apply to all of your missing dependencies. This is useful when a class has a large number of dependencies and mocking all of them would take a lot of time and setup. To use this feature, chain the `useMocker()` method onto `createTestingModule()`, passing a factory for your dependency mocks. The factory receives an optional token (any token that is valid for a Nest provider) and returns a mock implementation. The example below creates a specific mock for `CatsService` using `vi.fn()`.

```typescript
import { vi } from 'vitest';

describe('CatsController', () => {
  let controller: CatsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CatsController],
    })
      .useMocker((token) => {
        const results = ['test1', 'test2'];
        if (token === CatsService) {
          return { findAll: vi.fn().mockResolvedValue(results) };
        }
      })
      .compile();

    controller = moduleRef.get(CatsController);
  });
});
```

You can retrieve these mocks from the testing container as you would custom providers, e.g., `moduleRef.get(CatsService)`.

> info **Hint** You can also pass a reusable mock factory helper directly to `useMocker()` when you want to share test doubles across suites.

> info **Hint** `REQUEST` and `INQUIRER` providers cannot be auto-mocked, because they're already predefined in the context. However, you can _overwrite_ them using the custom provider syntax or the `overrideProvider()` method.

#### End-to-end testing

Unlike unit testing, which focuses on individual modules and classes, end-to-end (e2e) testing covers the interaction of classes and modules at a more aggregate level, closer to the kind of interaction that end users have with the production system. As an application grows, it becomes hard to manually test the end-to-end behavior of each API endpoint. Automated end-to-end tests help ensure that the overall behavior of the system is correct and meets project requirements. E2e tests use a configuration similar to the one covered in **unit testing**. In addition, Nest makes it easy to use the [Supertest](https://github.com/visionmedia/supertest) library to simulate HTTP requests.

```typescript
@@filename(cats.e2e-spec)
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module.js';
import { CatsService } from '../../src/cats/cats.service.js';
import { INestApplication } from '@nestjs/common';

describe('Cats', () => {
  let app: INestApplication;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET cats`, () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .expect({
        data: catsService.findAll(),
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
@@switch
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module.js';
import { CatsService } from '../../src/cats/cats.service.js';

describe('Cats', () => {
  let app;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET cats`, () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .expect({
        data: catsService.findAll(),
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

> info **Hint** If you use [Fastify](/http/performance) as your HTTP adapter, it requires a slightly different configuration and has built-in testing capabilities:
>
> ```ts
> let app: NestFastifyApplication;
>
> beforeAll(async () => {
>   app = moduleRef.createNestApplication<NestFastifyApplication>(
>     new FastifyAdapter(),
>   );
>
>   await app.init();
>   await app.getHttpAdapter().getInstance().ready();
> });
>
> it(`/GET cats`, () => {
>   return app
>     .inject({
>       method: 'GET',
>       url: '/cats',
>     })
>     .then((result) => {
>       expect(result.statusCode).toEqual(200);
>       expect(result.payload).toEqual(/* expectedPayload */);
>     });
> });
>
> afterAll(async () => {
>   await app.close();
> });
> ```

This example builds on the concepts described earlier. In addition to the `compile()` method, it uses the `createNestApplication()` method to instantiate a full Nest runtime environment.

One caveat: when your application is compiled with the `compile()` method, `HttpAdapterHost#httpAdapter` is still undefined, because no HTTP adapter or server has been created during the compilation phase. If your test requires the `httpAdapter`, use the `createNestApplication()` method to create the application instance, or refactor your project to avoid this dependency while the dependency graph is initialized.

Let's break down the example.

The test saves a reference to the running app in the `app` variable, so it can use it to simulate HTTP requests.

HTTP requests are simulated with the `request()` function from Supertest. To route these requests to the running Nest app, the test passes `request()` a reference to the HTTP listener that underlies Nest (which, in turn, may be provided by the Express platform). Hence the construction `request(app.getHttpServer())`. The call to `request()` returns a wrapped HTTP server, connected to the Nest app, which exposes methods to simulate an actual HTTP request. For example, `request(...).get('/cats')` initiates a request to the Nest app that is identical to an **actual** `GET /cats` HTTP request coming in over the network.

The example also provides an alternate (test-double) implementation of `CatsService` that returns a hard-coded value the test can check for. Use `overrideProvider()` to provide such an alternate implementation. Similarly, Nest provides the `overrideModule()`, `overrideGuard()`, `overrideInterceptor()`, `overrideFilter()`, and `overridePipe()` methods to override modules, guards, interceptors, filters, and pipes, respectively.

Each of the override methods (except `overrideModule()`) returns an object with three methods that mirror those described for [custom providers](/fundamentals/custom-providers):

- `useClass`: you supply a class that is instantiated to provide the instance that overrides the object (provider, guard, etc.).
- `useValue`: you supply an instance that overrides the object.
- `useFactory`: you supply a function that returns an instance that overrides the object.

`overrideModule()`, on the other hand, returns an object with the `useModule()` method, which you use to supply a module that overrides the original module:

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideModule(CatsModule)
  .useModule(AlternateCatsModule)
  .compile();
```

Each of these methods, in turn, returns the `TestingModuleBuilder` instance, so you can chain them with other methods in the [fluent style](https://en.wikipedia.org/wiki/Fluent_interface). Call `compile()` at the end of the chain to make Nest instantiate and initialize the module.

You may also want to provide a custom logger when the tests run (for example, on a CI server). Use the `setLogger()` method and pass an object that fulfills the `LoggerService` interface to tell the `TestingModuleBuilder` how to log during tests (by default, only "error" logs are written to the console).

The compiled module has several useful methods, as described in the following table:

<table>
  <tr>
    <td>
      <code>createNestApplication()</code>
    </td>
    <td>
      Creates and returns a Nest application (<code>INestApplication</code> instance) based on the given module.
      Note that you must manually initialize the application using the <code>init()</code> method.
    </td>
  </tr>
  <tr>
    <td>
      <code>createNestMicroservice()</code>
    </td>
    <td>
      Creates and returns a Nest microservice (<code>INestMicroservice</code> instance) based on the given module.
    </td>
  </tr>
  <tr>
    <td>
      <code>get()</code>
    </td>
    <td>
      Retrieves a static instance of a controller or provider (including guards, filters, etc.) available in the application context. Works like the same method of the <a href="/fundamentals/module-ref">module reference</a> class.
    </td>
  </tr>
  <tr>
     <td>
      <code>resolve()</code>
    </td>
    <td>
      Retrieves a dynamically created scoped instance (request or transient) of a controller or provider (including guards, filters, etc.) available in the application context. Works like the same method of the <a href="/fundamentals/module-ref">module reference</a> class.
    </td>
  </tr>
  <tr>
    <td>
      <code>select()</code>
    </td>
    <td>
      Navigates through the module's dependency graph; can be used to retrieve a specific instance from the selected module (used along with strict mode (<code>strict: true</code>) in the <code>get()</code> method).
    </td>
  </tr>
</table>

> info **Hint** Keep your e2e test files inside the `test` directory. Test files should have an `.e2e-spec` suffix.

#### Overriding globally registered enhancers

If you have a globally registered guard (or pipe, interceptor, or filter), you need to take a few more steps to override that enhancer. To recap, the original registration looks like this:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

This registers the guard as a "multi" provider through the `APP_*` token. To be able to replace `JwtAuthGuard` here, the registration needs to use an existing provider in this slot:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useExisting: JwtAuthGuard,
    // ^^^^^^^^ notice the use of 'useExisting' instead of 'useClass'
  },
  JwtAuthGuard,
],
```

> info **Hint** Change `useClass` to `useExisting` to reference a registered provider instead of having Nest instantiate it behind the token.

`JwtAuthGuard` is now visible to Nest as a regular provider that can be overridden when creating the `TestingModule`:

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(JwtAuthGuard)
  .useClass(MockAuthGuard)
  .compile();
```

All your tests now use `MockAuthGuard` on every request.

#### Testing request-scoped instances

[Request-scoped](/fundamentals/injection-scopes) providers are created uniquely for each incoming **request**, and the instance is garbage-collected after the request has been processed. This poses a problem, because you can't access a dependency injection sub-tree generated specifically for a tested request.

As shown in the sections above, the `resolve()` method retrieves a dynamically instantiated class. Also, as described in [resolving scoped providers](/fundamentals/module-ref#resolving-scoped-providers), you can pass a unique context identifier to control the lifecycle of a DI container sub-tree. You can combine the two in a testing context.

The strategy is to generate a context identifier beforehand and force Nest to use this particular ID to create a sub-tree for all incoming requests. This way, you can retrieve the instances created for a tested request.

To accomplish this, use `vi.spyOn()` on the `ContextIdFactory`:

```typescript
const contextId = ContextIdFactory.create();
vi
  .spyOn(ContextIdFactory, 'getByRequest')
  .mockImplementation(() => contextId);
```

You can now use the `contextId` to access a single generated DI container sub-tree for any subsequent request.

```typescript
catsService = await moduleRef.resolve(CatsService, contextId);
```
