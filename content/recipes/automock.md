### Automock

Automock is a standalone library for unit testing. Using TypeScript Reflection
API (`reflect-metadata`) internally to produce mock objects, Automock streamlines
test development by automatically mocking class external dependencies.

#### Introduction

The dependency injection container is an essential component of the Nest module system.
This container is utilized both during the testing phase and the application runtime. \
Unit tests vary from other types of tests, such as integration tests, in that they must
fully override providers/services within the DI container. External dependencies (providers)
of the so-called "unit" should be totally isolated. That is, all dependencies within
the DI container should be replaced by mock objects. \
As a result, loading the modules and replacing the providers inside them is a process that
loops back on itself. Automock tackles this issue by automatically mocking all the
external dependencies/providers, resulting in total isolation of the unit/class
under test.

#### Installation

```bash
$ npm i -D @automock/jest
```

Automock does not require any additional setup.

> info **info** Jest is the only test framework currently supported by Automock.
Sinon will shortly be released.

#### Example
Consider the following cats service, which takes three constructor parameters:
```ts
@@filename(cats.service)
import { Injectable } from '@nestjs/core';

@Injectable()
export class CatsService {
  constructor(
    private logger: Logger,
    private httpService: HttpService,
    private catsDal: CatsDal,
  ) {}

  async getAllCats() {
    const cats = await this.httpService.get('http://localhost:3000/api/cats');
    this.logger.log('successfully fetched all cats');
    
    this.catsDal.saveCats(cats);
  }
}
```

The service contains one public methods, `getAllCats`, which is the method
we use an example for the following unit test:

```ts
@@filename(cats.service.spec)
import { TestBed } from '@automock/jest';
import { CatsService } from './cats.service';

describe('Cats Service Unit Spec', () => {
  let underTest: CatsService;
  let logger: jest.Mocked<Logger>;
  let httpService: jest.Mocked<HttpService>;
  let catsDal: jest.Mocked<CatsDal>;
  
  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(CatsService)
      .mock(HttpService)
      .compile();

    underTest = unit;

    logger = unitRef.get(Logger);
    httpService = unitRef.get(HttpService);
    catsDal = unitRef.get(CatsDal);
  });

  describe('when getting all the cats', () => {
    test('then meet some expectations', async () => {
      httpService.mockResolvedValueOnce([{ id: 1, name: 'Catty' }]);
      await catsService.getAllCats();

      expect(logger.log).toBeCalled();
      expect(catsDal).toBeCalledWith([{ id: 1, name: 'Catty' }]);
    });
  });
});
```

> info **info** The jest.Mocked<Source> utility type returns the Source type
> wrapped with type definitions of Jest mock function. ([reference](https://jestjs.io/docs/mock-function-api/#jestmockedsource))

#### About `unit` and `unitRef`
Let's examine the following code:

```typescript
const { unit, unitRef } = Spec.create(CatsService).compile();
```

Calling `.compile()` returns an object with two properties, `unit`, and `unitRef`.

**`unitRef`** is a small container which holds the class external dependencies (that
has been replaced with mocks).
It has one method, `get()`, which returns the mocked dependency, thus,
it enables all the stubbing options from Jest.

**`unit`** is the actual unit under test, it's an instance of the tested class.

#### Handling Different Scenarios
Nest offers different ways to retrieve dependencies from the DI container:
Actual class, injection tokens, and forwardRef functions. They all can be
replaced with mocks using different techniques, in the next sections you
can understand how to deal with each scenario

##### Working with Interfaces
Consider the following `CatsService` which takes one param which is an instance
of the `Logger` interface.

```typescript
export interface Logger {
  log(message: string): void;
}

export class CatsService {
  constructor(private logger: Logger) {}
}
```

After compiling,

##### Working with Injection Tokens (`@Inject()`)
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam eget faucibus felis.
Integer feugiat rhoncus nibh, in elementum dolor sodales a. Pellentesque non luctus dolor,
id ultrices mauris. Nulla convallis diam rhoncus mauris ultrices malesuada.

##### Working with `forardRef()`

```typescript
export class HttpService {}

export class CatsService {
  constructor(@Inject(forwardRef(() => HttpService)) private httpService: HttpService) {}
}
```

#### More Information
Visit [Automock GitHub repository](https://github.com/omermorad/automock) for more
information.
