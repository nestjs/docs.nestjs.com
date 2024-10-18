### Suites (formerly Automock)

Suites is an opinionated and flexible testing meta-framework designed to enhance the software testing experience for backend systems. By bringing together a variety of testing tools into a unified framework, Suites streamlines the creation of reliable tests, helping to ensure the development of high-quality software.

> info **Hint** `Suites` is a third-party package and is not maintained by the NestJS core team. Please report any issues with the library to the [appropriate repository](https://github.com/suites-dev/suites).

#### Introduction

Inversion of Control (IoC) is a fundamental principle in the NestJS framework, enabling a modular, testable architecture. While NestJS offers built-in tools for creating testing modules, Suites provides an alternative approach that emphasizes testing isolated units or small groups of units together. Suites uses a virtual container for dependencies, where mocks are automatically generated, eliminating the need to manually replace each provider with a mock in the IoC (or DI) container. This approach can be used either in place of or alongside NestJS’s `Test.createTestingModule` method, offering more flexibility for unit testing based on your needs.

#### Installation

To use Suites with NestJS, install the necessary packages:

```bash
$ npm i -D @suites/unit @suites/di.nestjs @suites/doubles.jest
```

> info **Hint** `Suites` supports Vitest and Sinon as test doubles as well, `@suites/doubles.vitest` and `@suites/doubles.sinon` respectively.

#### Example and module setup

Consider a module setup for `CatsService` that includes `CatsApiService`, `CatsDAL`, `HttpClient`, and `Logger`. This
will be our base for the examples in this recipe:

```typescript
@@filename(cats.module)
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [HttpModule.register({ baseUrl: 'https://api.cats.com/' }), PrismaModule],
  providers: [CatsService, CatsApiService, CatsDAL, Logger],
  exports: [CatsService],
})
export class CatsModule {}
```

Both the `HttpModule` and `PrismaModule` are exporting providers to the host module.

Let's start by testing the `CatsHttpService` in isolation. This service is responsible for fetching cat data from an API and logging the operation.

```typescript
@@filename(cats-http.service)
@Injectable()
export class CatsHttpService {
  constructor(private httpClient: HttpClient, private logger: Logger) {}

  async fetchCats(): Promise<Cat[]> {
    this.logger.log('Fetching cats from the API');
    const response = await this.httpClient.get('/cats');
    return response.data;
  }
}
```

We want to isolate `CatsHttpService` and mock its dependencies, `HttpClient` and `Logger`. Suites allows us to do this
easily using the `.solitary()` method from `TestBed`.

```typescript
@@filename(cats-http.service.spec)
import { TestBed, Mocked } from '@suites/unit';

describe('Cats Http Service Unit Test', () => {
  let catsHttpService: CatsHttpService;
  let httpClient: Mocked<HttpClient>;
  let logger: Mocked<Logger>;

  beforeAll(async () => {
    // Isolate CatsHttpService and mock HttpClient and Logger
    const { unit, unitRef } = await TestBed.solitary(CatsHttpService).compile();

    catsHttpService = unit;
    httpClient = unitRef.get(HttpClient);
    logger = unitRef.get(Logger);
  });

  it('should fetch cats from the API and log the operation', async () => {
    const catsFixtures: Cat[] = [{ id: 1, name: 'Catty' }, { id: 2, name: 'Mitzy' }];
    httpClient.get.mockResolvedValue({ data: catsFixtures });

    const cats = await catsHttpService.fetchCats();

    expect(logger.log).toHaveBeenCalledWith('Fetching cats from the API');
    expect(httpClient.get).toHaveBeenCalledWith('/cats');
    expect(cats).toEqual<Cat[]>(catsFixtures);
  });
});
```

In the example above, Suites automatically mocks the dependencies of `CatsHttpService` using `TestBed.solitary()`. This makes the setup easier since you don’t have to manually mock each dependency.

- Auto-Mocking of Dependencies: Suites generates mocks for all dependencies of the unit being tested.
- Empty Behavior of Mocks: Initially, these mocks don’t have any predefined behavior. You’ll need to specify their behavior as needed for your tests.
- `unit` and `unitRef` properties:
  - `unit` refers to the actual instance of the class being tested, complete with its mocked dependencies.
  - `unitRef` is a reference that allows you to access the mocked dependencies.

#### Testing `CatsApiService` with `TestingModule`

For `CatsApiService`, we want to ensure that the `HttpModule` is properly imported and configured in the `CatsModule` host module. This includes verifying that the base URL (and other configurations) for `Axios` is set correctly.

In this case, we won’t use Suites; instead, we’ll use Nest’s `TestingModule` to test the actual configuration of `HttpModule`. We’ll utilize `nock` to mock HTTP requests without mocking the `HttpClient` in this scenario.

```typescript
@@filename(cats-api.service)
import { HttpClient } from '@nestjs/axios';

@Injectable()
export class CatsApiService {
  constructor(private httpClient: HttpClient) {}

  async getCatById(id: number): Promise<Cat> {
    const response = await this.httpClient.get(`/cats/${id}`);
    return response.data;
  }
}
```

We need to test `CatsApiService` with a real, unmocked `HttpClient` to ensure the DI and configuration of `Axios` (http)
are correct. This involves importing the `CatsModule` and using `nock` for HTTP request mocking.

```typescript
@@filename(cats-api.service.integration.test)
import { Test } from '@nestjs/testing';
import * as nock from 'nock';

describe('Cats Api Service Integration Test', () => {
  let catsApiService: CatsApiService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    }).compile();

    catsApiService = moduleRef.get(CatsApiService);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should fetch cat by id using real HttpClient', async () => {
    const catFixture: Cat = { id: 1, name: 'Catty' };

    nock('https://api.cats.com') // Making this URL identical to the one in HttpModule registration
      .get('/cats/1')
      .reply(200, catFixture);

    const cat = await catsApiService.getCatById(1);
    expect(cat).toEqual<Cat>(catFixture);
  });
});
```

#### Sociable Testing Example

Next, let's test `CatsService`, which depends on `CatsApiService` and `CatsDAL`. We'll mock `CatsApiService` and
expose `CatsDAL`.

```typescript
@@filename(cats.dal)
import { PrismaClient } from '@prisma/client';

@Injectable()
export class CatsDAL {
  constructor(private prisma: PrismaClient) {}

  async saveCat(cat: Cat): Promise<Cat> {
    return this.prisma.cat.create({data: cat});
  }
}
```

Next up, we have the `CatsService`, which depends on `CatsApiService` and `CatsDAL`:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    private catsApiService: CatsApiService,
    private catsDAL: CatsDAL
  ) {}

  async getAndSaveCat(id: number): Promise<Cat> {
    const cat = await this.catsApiService.getCatById(id);
    return this.catsDAL.saveCat(cat);
  }
}
```

And now, let's test `CatsService` using sociable testing with Suites:

```typescript
@@filename(cats.service.spec)
import { TestBed, Mocked } from '@suites/unit';
import { PrismaClient } from '@prisma/client';

describe('Cats Service Sociable Unit Test', () => {
  let catsService: CatsService;
  let prisma: Mocked<PrismaClient>;
  let catsApiService: Mocked<CatsApiService>;

  beforeAll(async () => {
    // Sociable test setup, exposing CatsDAL and mocking CatsApiService
    const { unit, unitRef } = await TestBed.sociable(CatsService)
      .expose(CatsDAL)
      .mock(CatsApiService)
      .final({ getCatById: async () => ({ id: 1, name: 'Catty' })})
      .compile();

    catsService = unit;
    prisma = unitRef.get(PrismaClient);
  });

  it('should get cat by id and save it', async () => {
    const catFixture: Cat = { id: 1, name: 'Catty' };
    prisma.cat.create.mockResolvedValue(catFixture);

    const savedCat = await catsService.getAndSaveCat(1);

    expect(prisma.cat.create).toHaveBeenCalledWith({ data: catFixture });
    expect(savedCat).toEqual(catFixture);
  });
});
```

In this example, we use the `.sociable()` method to set up the test environment. We utilize the `.expose()` method to allow real interactions with `CatsDAL`, while mocking `CatsApiService` with the `.mock()` method. The `.final()` method establishes fixed behavior for `CatsApiService`, ensuring consistent outcomes across tests.

This approach emphasizes testing `CatsService` with genuine interactions with `CatsDAL`, which involves handling `Prisma`. Suites will use `CatsDAL` as is, and only its dependencies, like `Prisma`, will be mocked in this case.

It's important to note that this approach is **solely for verifying behavior** and differs from loading the entire testing module. Sociable tests are valuable for confirming the behavior of units in isolation from their direct dependencies, especially when you want to focus on the behavior and interactions of units.

#### Integration Testing and Database

For `CatsDAL`, it's possible to test against a real database such as SQLite or PostgreSQL (for instance, using Docker Compose). However, for this example, we will mock `Prisma` and focus on sociable testing. The reason for mocking `Prisma` is to avoid I/O operations and concentrate on the behavior of `CatsService` in isolation. That said, you can also conduct tests with real I/O operations and a live database.

#### Sociable Unit Tests, Integration Tests, and Mocking

- Sociable Unit Tests: These focus on testing the interactions and behaviors between units while mocking their deeper dependencies. In this example, we mock `Prisma` and expose `CatsDAL`.

- Integration Tests: These involve real I/O operations and a fully configured dependency injection (DI) setup. Testing `CatsApiService` with `HttpModule` and `nock` is considered an integration test, as it verifies the real configuration and interactions of `HttpClient`. In this scenario, we will use Nest's `TestingModule` to load the actual module configuration.

**Exercise caution when using mocks.** Be sure to test I/O operations and DI configurations (especially when HTTP or database interactions are involved). After validating these components with integration tests, you can confidently mock them for sociable unit tests to focus on behavior and interactions. Suites sociable tests are geared towards verifying the behavior of units in isolation from their direct dependencies, while integration tests ensure that the overall system configuration and I/O operations function correctly.

#### Testing IoC Container Registration

It's essential to verify that your DI container is properly configured to prevent runtime errors. This includes ensuring that all providers, services, and modules are registered and injected correctly. Testing the DI container configuration helps catch misconfigurations early, preventing issues that might only arise at runtime.

To confirm that the IoC container is set up correctly, let's create an integration test that loads the actual module configuration and verifies that all providers are registered and injected properly.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CatsModule } from './cats.module';
import { CatsService } from './cats.service';

describe('Cats Module Integration Test', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    }).compile();
  });

  it('should resolve exported providers from the ioc container', () => {
    const catsService = moduleRef.get(CatsService);
    expect(catsService).toBeDefined();
  });
});
```

#### Comparison Between Solitary, Sociable, Integration, and E2E Testing

#### Solitary Unit Tests

- **Focus**: Test single unit (class) in full isolation.
- **Use Case**: Testing `CatsHttpService`.
- **Tools**: Suites' `TestBed.solitary()` method.
- **Example**: Mocking `HttpClient` and testing `CatsHttpService`.

#### Sociable Unit Tests

- **Focus**: Verify interactions between units while mocking deeper dependencies.
- **Use Case**: Testing `CatsService` with a mocked `CatsApiService` and exposing `CatsDAL`.
- **Tools**: Suites' `TestBed.sociable()` method.
- **Example**: Mocking `Prisma` and testing `CatsService`.

#### Integration Tests

- **Focus**: Involve real I/O operations and fully configured modules (IoC container).
- **Use Case**: Testing `CatsApiService` with `HttpModule` and `nock`.
- **Tools**: Nest's `TestingModule`.
- **Example**: Testing the real configuration and interaction of `HttpClient`.

#### E2E Tests

- **Focus**: Cover the interaction of classes and modules at a more aggregate level.
- **Use Case**: Testing the full behavior of the system from the perspective of the end-user.
- **Tools**: Nest's `TestingModule`, `supertest`.
- **Example**: Testing the `CatsModule` using `supertest` to simulate HTTP requests.

Refer to the [NestJS official testing guide](https://docs.nestjs.com/fundamentals/testing#end-to-end-testing) for more
details on setting up and running E2E tests.
