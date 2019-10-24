### Testing

Automated testing is considered an essential part of any serious software development effort. Automation makes it easy to repeat individual tests or test suites quickly and easily during development. This helps ensure that releases meet quality and performance goals. Automation helps increase coverage and provides a faster feedback loop to developers. Automation both increases the productivity of individual developers and ensures that tests are run at critical development lifecycle junctures, such as source code control check-in, feature integration, and version release.

Such tests often span a variety of types, including unit tests, end-to-end (e2e) tests, integration tests, and so on. While the benefits are unquestionable, it can be tedious to set them up. Nest strives to promote development best practices, including effective testing, so it includes features such as the following to help developers and teams build and automate tests. Nest:

- automatically scaffolds default unit tests for components and e2e tests for applications
- provides default tooling (such as a test runner that builds an isolated module/application loader)
- provides integration with [Jest](https://github.com/facebook/jest) and [Supertest](https://github.com/visionmedia/supertest) out-of-the-box, while remaining agnostic to testing tools
- makes the Nest dependency injection system available in the testing environment for easily mocking components

As mentioned, you can use any **testing framework** that you like, as Nest doesn't force any specific tooling. Simply replace the elements needed (such as the test runner), and you will still enjoy the benefits of Nest's ready-made testing facilities.

#### Installation

To get started, first install the required package:

```bash
$ npm i --save-dev @nestjs/testing
```

#### Unit testing

In the following example, we test two classes: `CatsController` and `CatsService`. As mentioned, [Jest](https://github.com/facebook/jest) is provided as the default testing framework. It serves as a test-runner and also provides assert functions and test-double utilities that help with mocking, spying, etc. In the following basic test, we manually instantiate these classes, and ensure that the controller and service fulfill their API contract.

```typescript
@@filename(cats.controller.spec)
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

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
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
@@switch
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

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
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
```

> info **Hint** Keep your test files located near the classes they test. Testing files should have a `.spec` or `.test` suffix.

Because the above sample is trivial, we aren't really testing anything Nest-specific. Indeed, we aren't even using dependency injection (notice that we pass an instance of `CatsService` to our `catsController`). This form of testing - where we manually instantiate the classes being tested - is often called **isolated testing** as it is independent from the framework. Let's introduce some more advanced capabilities that help you test applications that make more extensive use of Nest features.

#### Testing utilities

The `@nestjs/testing` package provides a set of utilities that enable a more robust testing process. Let's rewrite the previous example using the built-in `Test` class:

```typescript
@@filename(cats.controller.spec)
import { Test } from '@nestjs/testing';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

    catsService = module.get<CatsService>(CatsService);
    catsController = module.get<CatsController>(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
@@switch
import { Test } from '@nestjs/testing';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController;
  let catsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

    catsService = module.get(CatsService);
    catsController = module.get(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
```

The `Test` class is useful for providing an application execution context that essentially mocks the full Nest runtime, but gives you hooks that make it easy to manage class instances, including mocking and overriding. The `Test` class has a `createTestingModule()` method that takes a module metadata object as its argument (the same object you pass to the `@Module()` decorator). This method returns a `TestingModule` instance which in turn provides a few methods. For unit tests, the important one is the `compile()` method. This method bootstraps a module with its dependencies (similar to the way an application is bootstrapped in the conventional `main.ts` file using `NestFactory.create()`), and returns a module that is ready for testing.

> info **Hint** The `compile()` method is **asynchronous** and therefore has to be awaited. Once the module is compiled you can retrieve any instance it declares (controllers and providers) using the `get()` method.

Instead of using the production version of any provider, you can override it with a [custom provider](/fundamentals/custom-providers) for testing purposes. For example, you can mock a database service instead of connecting to a live database. We'll cover overrides in the next section, but they're available for unit tests as well.

#### End-to-end testing

Unlike unit testing, which focuses on individual modules and classes, end-to-end (e2e) testing covers the interaction of classes and modules at a more aggregate level -- closer to the kind of interaction that end-users will have with the production system. As an application grows, it becomes hard to manually test the end-to-end behavior of each API endpoint. Automated end-to-end tests help us ensure that the overall behavior of the system is correct and meets project requirements. To perform e2e tests we use a similar configuration to the one we just covered in **unit testing**. In addition, Nest makes it easy to use the [Supertest](https://github.com/visionmedia/supertest) library to simulate HTTP requests.

```typescript
@@filename(cats.e2e-spec)
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';
import { INestApplication } from '@nestjs/common';

describe('Cats', () => {
  let app: INestApplication;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = module.createNestApplication();
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
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';
import { INestApplication } from '@nestjs/common';

describe('Cats', () => {
  let app: INestApplication;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = module.createNestApplication();
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

In this example, we build on some of the concepts described earlier. In addition to the `compile()` method we used earlier, we now use the `createNestApplication()` method to instantiate a full Nest runtime environment. We save a reference to the running app in our `app` variable so we can use it to simulate HTTP requests.

We simulate HTTP tests using the `request()` function from Supertest. We want these HTTP requests to route to our running Nest app, so we pass the `request()` function a reference to the HTTP listener that underlies Nest (which, in turn, may be provided by the Express platform). Hence the construction `request(app.getHttpServer())`. The call to `request()` hands us a wrapped HTTP Server, now connected to the Nest app, which exposes methods to simulate an actual HTTP request. For example, using `request(...).get('/cats')` will initiate a request to the Nest app that is identical to an **actual** HTTP request like `get '/cats`' coming in over the network.

In this example, we also provide an alternate (test-double) implementation of the `CatsService` which simply returns a hard-coded value that we can test for. Use `overrideProvider()` to provide such an alternate implementation. Similarly, Nest provides methods to override guards, interceptors, filters and pipes with the`overrideGuard()`, `overrideInterceptor()`, `overrideFilter()`, and `overridePipe()` methods respectively.

Each of the override methods returns an object with 3 different methods that mirror those described for [custom providers](http://localhost:4200/fundamentals/custom-providers):

- `useClass`: you supply a class that will be instantiated to provide the instance to override the object (provider, guard, etc.).
- `useValue`: you supply an instance that will override the object.
- `useFactory`: you supply a function that returns an instance that will override the object.

Each of the override method types, in turn, returns the `TestingModule` instance, and can thus be chained with other methods in the [fluent style](https://en.wikipedia.org/wiki/Fluent_interface). You should use `compile()` at the end of such a chain to cause Nest to instantiate and initialize the module.

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
      Retrieves an instance of a controller or provider (including guards, filters, etc.) available in the application context.
    </td>
  </tr>
  <tr>
    <td>
      <code>select()</code>
    </td>
    <td>
      Navigates through the module's dependency graph; can be used to retrieve a specific instance from the selected module (used along with strict mode (<code>strict: true</code>) in <code>get()</code> method).
    </td>
  </tr>
</table>

> info **Hint** Keep your e2e test files inside the `e2e` directory. The testing files should have a `.e2e-spec` or `.e2e-test` suffix.
