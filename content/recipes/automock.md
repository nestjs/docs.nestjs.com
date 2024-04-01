### Automock

Automock is a powerful standalone library designed for unit testing. It leverages the TypeScript Reflection API
internally to generate mock objects, simplifying the process of testing by automatically mocking external dependencies
of classes. Automock enables you to streamline test development and focus on writing robust and efficient unit tests.

> info **info** `Automock` is a third party package and is not managed by the NestJS core team.
> Please, report any issues found with the library in the [appropriate repository](https://github.com/automock/automock)

#### Introduction

The Dependency Injection (DI) container is a foundational element of the Nest module system, integral to both application
runtime and testing phases. In unit tests, mock dependencies are essential for isolating and assessing the behavior of
specific components. However, the manual configuration and management of these mock objects can be intricate and prone to
errors.

Automock offers a streamlined solution. Rather than interacting with the actual Nest DI container, Automock introduces a
virtual container where dependencies are automatically mocked. This approach bypasses the manual task of substituting each
provider in the DI container with mock implementations. With Automock, the generation of mock objects for all dependencies
is automated, simplifying the unit test setup process.

#### Installation

Automock support both Jest and Sinon. Just install the appropriate package for your testing framework of choice.
Furthermore, you need to install the `@automock/adapters.nestjs` (as Automock supports other adapters).

```bash
$ npm i -D @automock/jest @automock/adapters.nestjs
```

Or, for Sinon:

```bash
$ npm i -D @automock/sinon @automock/adapters.nestjs
```

#### Example

The example provided here showcase the integration of Automock with Jest. However, the same principles
and functionality applies for Sinon.

Consider the following `CatService` class that depends on a `Database` class to fetch cats. We'll mock
the `Database` class to test the `CatsService` class in isolation.

```typescript
@Injectable()
export class Database {
  getCats(): Promise<Cat[]> { ... }
}

@Injectable()
class CatsService {
  constructor(private database: Database) {}

  async getAllCats(): Promise<Cat[]> {
    return this.database.getCats();
  }
}
```

Let's set up a unit test for the `CatsService` class.

We'll use the `TestBed` from the `@automock/jest` package to create our test environment.

```typescript
import { TestBed } from '@automock/jest';

describe('Cats Service Unit Test', () => {
  let catsService: CatsService;
  let database: jest.Mocked<Database>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(CatsService).compile();

    catsService = unit;
    database = unitRef.get(Database);
  });

  it('should retrieve cats from the database', async () => {
    const mockCats: Cat[] = [{ id: 1, name: 'Catty' }, { id: 2, name: 'Mitzy' }];
    database.getCats.mockResolvedValue(mockCats);

    const cats = await catsService.getAllCats();

    expect(database.getCats).toHaveBeenCalled();
    expect(cats).toEqual(mockCats);
  });
});
```

In the test setup, we:

1. Create a test environment for `CatsService` using `TestBed.create(CatsService).compile()`.
2. Obtain the actual instance of `CatsService` and a mocked instance of `Database` using `unit`
   and `unitRef.get(Database)`, respectively.
3. We mock the `getCats` method of the `Database` class to return a predefined list of cats.
4. We then call the `getAllCats` method of `CatsService` and verify that it correctly interacts with the `Database`
   class and returns the expected cats.

**Adding a Logger**

Let's extend our example by adding a `Logger` interface and integrating it into the `CatsService` class.

```typescript
@Injectable()
class Logger {
  log(message: string): void { ... }
}

@Injectable()
class CatsService {
  constructor(private database: Database, private logger: Logger) {}

  async getAllCats(): Promise<Cat[]> {
    this.logger.log('Fetching all cats..');
    return this.database.getCats();
  }
}
```

Now, when you set up your test, you'll also need to mock the `Logger` dependency:

```typescript
beforeAll(() => {
  let logger: jest.Mocked<Logger>;
  const { unit, unitRef } = TestBed.create(CatsService).compile();

  catsService = unit;
  database = unitRef.get(Database);
  logger = unitRef.get(Logger);
});

it('should log a message and retrieve cats from the database', async () => {
  const mockCats: Cat[] = [{ id: 1, name: 'Catty' }, { id: 2, name: 'Mitzy' }];
  database.getCats.mockResolvedValue(mockCats);

  const cats = await catsService.getAllCats();

  expect(logger.log).toHaveBeenCalledWith('Fetching all cats..');
  expect(database.getCats).toHaveBeenCalled();
  expect(cats).toEqual(mockCats);
});
```

**Using `.mock().using()` for Mock Implementation**

Automock provides a more declarative way to specify mock implementations using the `.mock().using()` method chain.
This allows you to define the mock behavior directly when setting up the `TestBed`.

Here's how you can modify the test setup to use this approach:

```typescript
beforeAll(() => {
  const mockCats: Cat[] = [{ id: 1, name: 'Catty' }, { id: 2, name: 'Mitzy' }];

  const { unit, unitRef } = TestBed.create(CatsService)
    .mock(Database)
    .using({ getCats: async () => mockCats })
    .compile();

  catsService = unit;
  database = unitRef.get(Database);
});
```

In this approach, we've eliminated the need to manually mock the `getCats` method in the test body.
Instead, we've defined the mock behavior directly in the test setup using `.mock().using()`.

#### Dependency References and Instance Access

When utilizing `TestBed`, the `compile()` method returns an object with two important properties: `unit` and `unitRef`.
These properties provide access to the instance of the class under test and references to its dependencies, respectively.

`unit` - The unit property represents the actual instance of the class under test. In our example, it corresponds to an
instance of the `CatsService` class. This allows you to directly interact with the class and invoke its methods during
your test scenarios.

`unitRef` - The unitRef property serves as a reference to the dependencies of the class under test. In our example, it
refers to the `Logger` dependency used by the `CatsService`. By accessing `unitRef`, you can retrieve the automatically
generated mock object for the dependency. This enables you to stub methods, define behaviors, and assert method
invocations on the mock object.

#### Working with Different Providers

Providers are one of the most important elements in Nest. You can think of many of the default Nest classes as
providers, including services, repositories, factories, helpers, and so on. A provider's primary function is to take the
form of an
`Injectable` dependency.

Consider the following `CatsService`, it takes one parameter, which is an instance of the following `Logger` interface:

```typescript
export interface Logger {
  log(message: string): void;
}

@Injectable()
export class CatsService {
  constructor(private logger: Logger) {}
}
```

TypeScript's Reflection API does not support interface reflection yet. Nest solves this issue with string/symbol-based
injection tokens (see [Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers)):

```typescript
export const MyLoggerProvider = {
  provide: 'LOGGER_TOKEN',
  useValue: { ... },
}

@Injectable()
export class CatsService {
  constructor(@Inject('LOGGER_TOKEN') readonly logger: Logger) {}
}
```

Automock follows this practice and lets you provide a string-based (or symbol-based) token instead of providing the actual
class in the `unitRef.get()` method:

```typescript
const { unit, unitRef } = TestBed.create(CatsService).compile();

let loggerMock: jest.Mocked<Logger> = unitRef.get('LOGGER_TOKEN');
```

#### More Information

Visit [Automock GitHub repository](https://github.com/automock/automock), or [Automock website](https://automock.dev) for more information.
