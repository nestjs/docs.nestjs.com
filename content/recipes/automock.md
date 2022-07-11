### AutoMock

#### Philosophy
AutoMock is a stand-alone library. It allows complete isolation of class-dependencies
during unit-testing. Automock provides on-the-fly, small DI container that contains
only the class dependencies, or rather - a mock for each class dependency.
By using the TypeScript reflection mechanism, AutoMock can to emit class metadata,
(specifically using `@Injectable` decorator), and thus can perform different manipulations
on the class dependencies.

AutoMock cuts a lot of time when writing unit tests, and in addition, it also creates
uniformity in the test writing style. It is important to say that AutoMock is intended
for unit-tests only, and is not suitable for other types of tests, such as integration tests.


#### Installation

AutoMock does not require any additional setup with Nest,
simply install it and start using it.

```bash
$ npm i @automock/jest
```

> info **info** AutoMock only supports `jest`, soon there will be support for `sinon`

#### Example

Consider the following cats service, which takes three different class
(constructor) parameters:

```ts
@@filename(cats.service)
import { Injectable } from '@nestjs/core';

@Injectable()
export class CatsService {
  constructor(
    private logger: Logger,
    private httpService: HttpService,
    private fooService: FooService,
  ) {}

  public async getAllCats() {
    const cats = await this.httpService.get('http://localhost:3000/api/cats');
    this.logger.log('Fetched all the cats!')
    
    this.fooService.doSomethingWithCats(cats);
  }
}
```

The following example shows how to create a unit-test for this service.

```ts
@@filename(cats.service.spec)
import { Spec } from '@automock/jest';
import { CatsService } from './cats.service';

import Mocked = jest.Mocked;

describe('Cats Service Spec', () => {
  let catsService: CatsService;
  let logger: Mocked<Logger>;
  let fooService: Mocked<FooService>;
  
  beforeAll(() => {
    const { unit, unitRef } = Spec.create(CatsService)
      .mock(HttpService)
      .using({ get: async () => Promise.resolve([{ id: 1, name: 'Catty' }]), })
      .compile();
    
    catsService = unit;
    logger = unitRef.get(Logger);
    fooService = unitRef.get(FooService);
  });

  describe('when getting all the cats', () => {
    beforeAll(async () => await catsService.getAllCats());

    test('then call the logger log', () => {
      expect(logger.log).toBeCalled();
    });

    test('then do something with fetched data', () => {
      expect(fooService.doSomethingWithCats).toBeCalledWith([{ id: 1, name: 'Catty' }]);
    });
  });
});
```

> info **Hint** The `Mocked` type is imported directly from `Jest` namespace.

#### Handling different scenarios
Vivamus at pellentesque turpis. Praesent tincidunt, tellus eu ultricies faucibus,
nulla velit venenatis risus, sollicitudin sollicitudin dolor lectus in dui.
Integer nec lacus eu lacus sodales efficitur sed nec ligula.

##### Working with interfaces
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam eget faucibus felis.
Integer feugiat rhoncus nibh, in elementum dolor sodales a. Pellentesque non luctus dolor,
id ultrices mauris. Nulla convallis diam rhoncus mauris ultrices malesuada.

##### Working with `forardRef()`
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam eget faucibus felis.
Integer feugiat rhoncus nibh, in elementum dolor sodales a. Pellentesque non luctus dolor,
id ultrices mauris. Nulla convallis diam rhoncus mauris ultrices malesuada.

##### Working with injection tokens
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam eget faucibus felis.
Integer feugiat rhoncus nibh, in elementum dolor sodales a. Pellentesque non luctus dolor,
id ultrices mauris. Nulla convallis diam rhoncus mauris ultrices malesuada.

##### Working with `forardRef()`
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam eget faucibus felis.
Integer feugiat rhoncus nibh, in elementum dolor sodales a. Pellentesque non luctus dolor,
id ultrices mauris. Nulla convallis diam rhoncus mauris ultrices malesuada.


#### What's the difference from Nest's built-in testing tools?

Nest suggests some built in tools for creating tests, usually you need to use the `Test` \
factory from `@nestjs/testing` ([example]()) and create a new testing module. This technique \
is great for creating integration/e2e tests, simply loading the whole module which includes all \
the class dependencies


#### More Information

Visit the [AutoMock docs site](https://automock.dev/docs) for more information, examples, and API documentation.

