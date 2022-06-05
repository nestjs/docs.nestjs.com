### AutoMock

AutoMock is a standalone library for creating unit tests (specs). \
Using TypeScript's reflection mechanism, it is able to mock class dependencies
from the constructor level.

### Installation

Using AutoMock does not require any additional setup with Nest,
simply install it and start using it.

> info **info** Automock only supports `jest`, soon there will be support for `sinon` as well :)

```bash
$ npm i @automock/jest
```

### Examples

Consider the following service:

```ts
// cats.service.ts
import { Injectable } from '@nestjs/core';

@Injectable()
export class CatsService {
  public constructor(
    private readonly logger: Logger,
    private readonly httpService: HttpService,
    private readonly anotherService: AnotherService,
  ) {}

  public async getAllCats() {
    const cats = await this.httpService.get('http://localhost:3033/cats');
    this.logger.log(`Fetched all the cats!`)
    
    this.anotherService.doSomethingWithCats(cats);
  }
}
```

```ts
// cats.service.spec.ts
import { Spec } from '@automock/jest';
import { CatsService } from './cats.service';

import Mocked = jest.Mocked;

describe('Cats Service Spec', () => {
  let catsService: CatsService;
  let logger: Mocked<Logger>;
  let anotherService: Mocked<AnotherService>;
  
  beforeAll(() => {
    const { unit, unitRef } = Spec.create(CatsService)
      .mock(HttpService)
      .using({ get: async () => Promise.resolve([{ id: 1, name: 'Catty' }]), })
      .compile();
    
    catsService = unit;
    logger = unitRef.get(Logger);
    anotherService = unitRef.get(AnotherService);
  });

  describe('when getting all the cats', () => {
    beforeAll(async () => await catsService.getAllCats());

    test('then call the logger log', () => {
      expect(logger.log).toBeCalled();
    });

    test('then do something with fetched data', () => {
      expect(anotherService.doSomethingWithCats).toBeCalledWith([{ id: 1, name: 'Catty' }]);
    });
  });
});
```

Nest suggests some built in tools for creating tests, usually you need to use the `Test` \
factory from `@nestjs/testing` ([example]()) and create a new testing module. This technique \
is great for creating integration/e2e tests, simply loading the whole module which includes all \
the class dependencies

> info **info** `Mocked` is exported from `jest`
