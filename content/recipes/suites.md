### Suites (formerly Automock)

Suites is an opinionated, flexible testing meta-framework aimed at elevating the software testing experience within backend systems. By integrating a wide array of testing tools into a cohesive framework, Suites simplifies the process of creating reliable tests, thereby ensuring the development of high-quality software.

`Suites` is a third-party package and is not managed by the NestJS core team. Please report any issues found with the library in the [appropriate repository](https://github.com/suites-dev/suites).

#### Introduction

Inversion of Control (IoC) is a cornerstone of the NestJS framework, enabling a modular and testable architecture. While NestJS provides built-in tools for creating testing modules, Suites offers an alternative approach that focuses on the behavior of isolated units or a few units together.

Suites operates with a virtual container for dependencies, where mocks are automatically generated. This means you don't need to manually replace each provider with a mock in the IoC (or DI) container. This approach can be used instead of or alongside the built-in `Test.createTestingModule` method, providing more flexibility in unit testing, depending on the case.

#### Installation

To use Suites with NestJS, install the necessary packages:

```bash
$ npm i -D @suites/unit @suites/di.nestjs @suites/doubles.jest
```

> `Suites` supports Vitest and Sinon as test doubles as well.

#### Example and Module Setup

**Base Module Setup**

Consider a module setup for `CatsService` that includes `CatsApiService`, `CatsDAL`, `HttpClient`, and `Logger`. This will be our base for the examples:

```typescript
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [HttpModule.forRoot({ baseUrl: 'https://api.cats.com/' }), PrismaModule],
  providers: [CatsService, CatsApiService, CatsDAL, Logger],
  exports: [CatsService],
})
export class CatsModule {
}
```

The `HttpModule` and the `PrismaModule` are both exporting providers to the host module.

#### Solitary Testing Example

**Example: Testing `CatsHttpService`**

Let's start by testing the `CatsHttpService` in isolation. This service fetches cat data from an API and logs the operation:

```typescript
@Injectable()
export class CatsHttpService {
  constructor(private httpClient: HttpClient, private logger: Logger) {
  }

  async fetchCats(): Promise<Cat[]> {
    this.logger.log('Fetching cats from the API');
    const response = await this.httpClient.get('/cats');
    return response.data;
  }
}
```

We want to isolate `CatsHttpService` and mock its dependencies, `HttpClient` and `Logger`. Suites allows us to do this easily using the `.solitary()` method from `TestBed`.

```typescript
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
    const mockCats: Cat[] = [{ id: 1, name: 'Catty' }, { id: 2, name: 'Mitzy' }];
    httpClient.get.mockResolvedValue({ data: mockCats });

    const cats = await catsHttpService.fetchCats();

    expect(logger.log).toHaveBeenCalledWith('Fetching cats from the API');
    expect(httpClient.get).toHaveBeenCalledWith('/cats');
    expect(cats).toEqual(mockCats);
  });
});
```

**Explanation**

In the above example, Suites automatically mocks the dependencies of `CatsHttpService` using `TestBed.solitary()`. This simplifies the setup, as you don't need to manually mock each dependency.

- **Auto-Mocking of Dependencies**: Suites generates mocks for all dependencies of the unit under test.
- **Empty Behavior of Mocks**: Initially, these mocks have no predefined behavior. You need to specify the behavior as required for your tests.
- **`unit` and `unitRef`** properties:
  - `unit` is the actual instance of the class under test, with its mocked dependencies.
  - `unitRef` is a reference that allows you to access the mocked dependencies.

#### Testing `CatsApiService` with `TestingModule`

**Example: Using HttpModule and Nock**

For `CatsApiService`, we want to verify that the `HttpModule` is correctly imported and configured in the `CatsModule` host module. This includes ensuring that the base URL for `Axios` is set correctly. We'll use `nock` to mock HTTP requests without mocking the `HttpClient`.

```typescript
import { HttpClient } from '@nestjs/axios';

@Injectable()
export class CatsApiService {
  constructor(private httpClient: HttpClient) {
  }

  async getCatById(id: number): Promise<Cat> {
    const response = await this.httpClient.get(`/cats/${id}`);
    return response.data;
  }
}
```

We need to test `CatsApiService` with a real, unmocked `HttpClient` to ensure the DI and configuration of `Axios` (http) are correct. This involves importing the `CatsModule` and using `nock` for HTTP request mocking.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import * as nock from 'nock';

describe('CatsApiService Integration Test', () => {
  let catsApiService: CatsApiService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CatsModule],
    }).compile();

    catsApiService = module.get(CatsApiService);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should fetch cat by id using real HttpClient', async () => {
    const catFixture: Cat = { id: 1, name: 'Catty' };

    nock('https://api.cats.com')
    .get('/cats/1')
    .reply(200, mockCat);

    const cat = await catsApiService.getCatById(1);
    expect(cat).toEqual(catFixture);
  });
});
```

#### Sociable Testing Example

**Example: Testing CatsService with Mocked Dependencies**

Next, let's test `CatsService`, which depends on `CatsApiService` and `CatsDAL`. We'll mock `CatsApiService` and expose `CatsDAL`.

```typescript
import { PrismaClient } from '@prisma/client';

@Injectable()
export class CatsDAL {
  constructor(private prisma: PrismaClient) {
  }

  async saveCat(cat: Cat): Promise<Cat> {
    return this.prisma.cat.create({ data: cat });
  }
}

@Injectable()
export class CatsService {
  constructor(
    private catsApiService: CatsApiService,
    private catsDAL: CatsDAL) {
  }

  async getAndSaveCat(id: number): Promise<Cat> {
    const cat = await this.catsApiService.getCatById(id);
    return this.catsDAL.saveCat(cat);
  }
}
```

```typescript
import { TestBed, Mocked } from '@suites/unit';

describe('Cats Service Sociable Unit Test', () => {
  let catsService: CatsService;
  let prisma: Mocked<PrismaClient>;
  let catsApiService: Mocked<CatsApiService>;

  beforeAll(async () => {
    // Sociable test setup, exposing CatsDAL and mocking CatsApiService
    const { unit, unitRef } = await TestBed.sociable(CatsService)
    .expose(CatsDAL)
    .mock(CatsApiService)
    .final({ getCatById: async () => ({ id: 1, name: 'Catty' }) })
    .compile();

    catsService = unit;
    prisma = unitRef.get(PrismaClient);
  });

  it('should get cat by id and save it', async () => {
    const mockCat: Cat = { id: 1, name: 'Catty' };
    prisma.cat.create.mockResolvedValue(mockCat);

    const savedCat = await catsService.getAndSaveCat(1);

    expect(prisma.cat.create).toHaveBeenCalledWith({ data: mockCat });
    expect(savedCat).toEqual(mockCat);
  });
});
```

**Explanation**

In this example, we use the `.sociable()` method to set up the test environment. The `.mock().final()` method defines fixed behavior for `CatsApiService`, ensuring consistent behavior across tests. This approach focuses on testing `CatsService` with real interactions with `CatsDAL`, which involves handling `Prisma`. It's important to clarify that this approach is for verifying behavior and can be set up for different scenarios. However, it's different from using `TestingModule`, which is needed to load at least once to verify the complete DI configuration.

#### Integration Testing and Database

For `CatsDAL`, it is possible to test against a real database like SQLite or PostgreSQL (e.g., using Docker Compose). However, for this example, we mock Prisma and focus on sociable testing.

#### Suites Differentiation

- **Sociable Tests**: Focus on testing the interactions between units while mocking deeper dependencies. In this example, we mock `Prisma` and expose `CatsDAL`.
- **Integration Tests**: Involve real I/O operations and fully configured DI. Testing `CatsApiService` with `HttpModule` and `nock` is an integration test, as it verifies the real configuration and interaction of `HttpClient`.

#### Best Practices

Be careful when using mocks. Ensure to test I/O operations and DI configurations when HTTP or database interactions are involved. After verifying these components with integration tests, you can safely mock them for sociable tests to focus on behavior and interactions. Suites sociable tests focus on verifying the behavior of units in isolation from their direct dependencies, while integration tests ensure that the overall system configuration and I/O operations are functioning correctly.

It's crucial to ensure that your DI container is correctly configured to avoid runtime errors. This involves verifying that all providers, services, and modules are registered and injected correctly. Testing the DI container configuration helps catch misconfigurations early and prevents issues that might only surface at runtime. Integration tests cover both I/O and DI configurations.

#### Verifying DI Container Configuration

According to Martin Fowler, it's crucial to ensure that your DI container is correctly configured to avoid runtime errors. This involves verifying that all providers, services, and modules are registered and injected correctly. Testing the DI container configuration helps catch misconfigurations early and prevents issues that might only surface at runtime.

#### Practical Implementation

To ensure that the DI container is correctly configured, follow these best practices:

1. **Integration Tests for DI Container**:
   Create integration tests that load the actual module configuration and verify that all providers are correctly registered and injected.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CatsModule } from './cats.module';
import { CatsService } from './cats.service';
import { CatsApiService } from './cats-api.service';
import { CatsDAL } from './cats-dal.service';
import { HttpClient } from './http-client.service';
import { Logger } from './logger.service';

describe('CatsModule Integration Test', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    }).compile();
  });

  it('should resolve CatsService and its dependencies from the DI container', async () => {
    const catsService = moduleRef.get<CatsService>(CatsService);
    expect(catsService).toBeDefined();

    const catsApiService = moduleRef.get<CatsApiService>(CatsApiService);
    expect(catsApiService).toBeDefined();

    const catsDAL = moduleRef.get<CatsDAL>(CatsDAL);
    expect(catsDAL).toBeDefined();

    const httpClient = moduleRef.get<HttpClient>(HttpClient);
    expect(httpClient).toBeDefined();

    const logger = moduleRef.get<Logger>(Logger);
    expect(logger).toBeDefined();
  });
});
```

#### Comparison Between Sociable, Integration, and E2E Testing

#### Sociable Tests

- **Focus**: Verify interactions between units while mocking deeper dependencies.
- **Use Case**: Testing `CatsService` with a mocked `CatsApiService` and exposing `CatsDAL`.
- **Tools**: Suites' `.sociable()` method.
- **Example**: Mocking `Prisma` and testing `CatsService`.

#### Integration Tests

- **Focus**: Involve real I/O operations and fully configured DI.
- **Use Case**: Testing `CatsApiService` with `HttpModule` and `nock`.
- **Tools**: Nest's `TestingModule`.
- **Example**: Testing the real configuration and interaction of `HttpClient`.

#### E2E Tests

- **Focus**: Cover the interaction of classes and modules at a more aggregate level.
- **Use Case**: Testing the full behavior of the system from the perspective of the end-user.
- **Tools**: Nest's `TestingModule`, `Supertest`.
- **Example**: Testing the `CatsModule` using `Supertest` to simulate HTTP requests.

Refer to the [NestJS official testing guide](https://docs.nestjs.com/fundamentals/testing#end-to-end-testing) for more details on setting up and running E2E tests.

#### Conclusion

By combining solitary, sociable, and integration tests, and emphasizing the importance of verifying the DI container configuration, you can create a robust testing strategy for your NestJS applications. This approach aligns well with Martin Fowler's guidance and helps ensure that all aspects of your application are thoroughly tested, reducing the risk of runtime errors and improving maintainability.

For more comprehensive examples and detailed usage, please visit the [Suites documentation](https://suites.dev/docs/getting-started/examples).
