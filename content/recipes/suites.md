### Suites

[Suites](https://suites.dev) is an [open-source](https://github.com/suites-dev/suites) unit-testing framework for TypeScript dependency injection frameworks. It is used as an **alternative** to manually creating mocks, verbose test setup with multiple mock configurations, or working with untyped test doubles (like mocks and stubs).

Suites reads metadata from nestjs services at runtime and automatically generates fully-typed mocks for all dependencies.
This removes boilerplate mock setup and ensures type-safe tests. While Suites can be used alongside `Test.createTestingModule()`, it excels at focused unit testing.
Use `Test.createTestingModule()` when validating module wiring, decorators, guards, and interceptors.
Use Suites for fast unit tests with automatic mock generation.

For more information on module-based testing, see the [testing fundamentals](/fundamentals/testing) chapter.

> info **Note** `Suites` is a third-party package and is not maintained by the NestJS core team. Please report any issues to the [appropriate repository](https://github.com/suites-dev/suites).

#### Getting started

This guide demonstrates using Suites to test NestJS services. It covers both isolated testing (all dependencies mocked) and sociable testing (selected real implementations).

#### Install Suites

Verify NestJS runtime dependencies are installed:

```bash
$ npm install @nestjs/common @nestjs/core reflect-metadata
```

Install Suites core, the NestJS adapter, and the doubles adapter:

```bash
$ npm install --save-dev @suites/unit @suites/di.nestjs @suites/doubles.jest
```

The doubles adapter (`@suites/doubles.jest`) provides wrappers around Jest's mocking capabilities. It exposes `mock()` and `stub()` functions that create type-safe test doubles.

Ensure Jest and TypeScript are available:

```bash
$ npm install --save-dev ts-jest @types/jest jest typescript
```

<details><summary>Expand if you're using Vitest</summary>

```bash
$ npm install --save-dev @suites/unit @suites/di.nestjs @suites/doubles.vitest
```

</details>

<details><summary>Expand if you're using Sinon</summary>

```bash
$ npm install --save-dev @suites/unit @suites/di.nestjs @suites/doubles.sinon
```

</details>

> info **Hint** Make sure to have `"emitDecoratorMetadata": true` in your tsconfig `compilerOptions` (nestJS standard) 

#### Set up type definitions

Create `global.d.ts` at your project root:

```typescript
/// <reference types="@suites/doubles.jest/unit" />
/// <reference types="@suites/di.nestjs/types" />
```

#### Create a sample service

This guide uses a simple `UserService` with two dependencies:

```typescript
@@filename(user.repository)
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository {
  async findById(id: string): Promise<User | null> {
    // Database query
  }

  async save(user: User): Promise<User> {
    // Database save
  }
}
```
```typescript
@@filename(user.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    private repository: UserRepository,
    private logger: Logger,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    this.logger.log(`Found user ${id}`);
    return user;
  }

  async create(email: string, name: string): Promise<User> {
    const user = { id: generateId(), email, name };
    await this.repository.save(user);
    this.logger.log(`Created user ${user.id}`);
    return user;
  }
}
```

#### Write a unit test

Use `TestBed.solitary()` to create isolated tests with all dependencies mocked:

```typescript
@@filename(user.service.spec)
import { TestBed, type Mocked } from '@suites/unit';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { Logger } from '@nestjs/common';

describe('User Service Unit Spec', () => {
  let userService: UserService;
  let repository: Mocked<UserRepository>;
  let logger: Mocked<Logger>;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(UserService).compile();

    userService = unit;
    repository = unitRef.get(UserRepository);
    logger = unitRef.get(Logger);
  });

  it('should find user by id', async () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test' };
    repository.findById.mockResolvedValue(user);

    const result = await userService.findById('1');

    expect(result).toEqual(user);
    expect(logger.log).toHaveBeenCalled();
  });
});
```

`TestBed.solitary()` analyzes the constructor and creates typed mocks for all dependencies.
The `Mocked<T>` type provides IntelliSense support for mock configuration.

#### Pre-compile mock configuration

Configure mock behavior before compilation using `.mock().impl()`:

```typescript
@@filename(user.service.spec)
import { TestBed } from '@suites/unit';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

describe('User Service Unit Spec - pre-configured', () => {
  let unit: UserService;
  let repository: Mocked<UserRepository>;
  
  beforeAll(async () => {
    const { unit: underTest, unitRef } = await TestBed.solitary(UserService)
      .mock(UserRepository)
      .impl(stubFn => ({
        findById: stubFn().mockResolvedValue({ id: '1', email: 'test@example.com', name: 'Test' })
      }))
      .compile();
    
    repository = unitRef.get(UserRepository);
    unit = underTest;
  })
  
  it('should find user with pre-configured mock', async () => {
    const result = await unit.findById('1');
    
    expect(repository.findById).toHaveBeenCalled();
    expect(result.email).toBe('test@example.com');
  });
});
```

The `stubFn` parameter corresponds to the installed doubles adapter (`jest.fn()` for Jest, `vi.fn()` for Vitest, `sinon.stub()` for Sinon).

#### Testing with real dependencies

Use `TestBed.sociable()` with `.expose()` to use real implementations for specific dependencies:

```typescript
@@filename(user.service.spec)
import { TestBed, Mocked } from '@suites/unit';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { Logger } from '@nestjs/common';

describe('UserService - with real logger', () => {
  let userService: UserService;
  let repository: Mocked<UserRepository>;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.sociable(UserService)
      .expose(Logger)
      .compile();

    userService = unit;
    repository = unitRef.get(UserRepository);
  });

  it('should log when finding user', async () => {
    const user = { id: '1', email: 'test@example.com' };
    repository.findById.mockResolvedValue(user);

    await userService.findById('1');

    // Logger actually executes, no mock needed
  });
});
```

`.expose(Logger)` instantiates `Logger` with its real implementation while keeping other dependencies mocked.

#### Token-based dependencies

Suites handles custom injection tokens (strings or symbols):

```typescript
@@filename(config.service)
import { Injectable, Inject } from '@nestjs/common';

export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';

@Injectable()
export class ConfigService {
  constructor(
    @Inject(CONFIG_OPTIONS) private options: { apiKey: string },
  ) {}

  getApiKey(): string {
    return this.options.apiKey;
  }
}
```

Access token-based dependencies with `unitRef.get()`:

```typescript
@@filename(config.service.spec)
import { TestBed } from '@suites/unit';
import { ConfigService, CONFIG_OPTIONS, ConfigOptions } from './config.service';

describe('Config Service Unit Spec', () => {
  let configService: ConfigService;
  let options: ConfigOptions;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(ConfigService).compile();
    configService = unit;

    options = unitRef.get<ConfigOptions>(CONFIG_OPTIONS);
  });

  it('should return api key', () => { ... });
});
```

#### Using mock() and stub() directly

For those who prefer direct control without `TestBed`, the doubles adapter package provides `mock()` and `stub()` functions:

```typescript
@@filename(user.service.spec)
import { mock } from '@suites/unit';
import { UserRepository } from './user.repository';

describe('User Service Unit Spec', () => {
  it('should work with direct mocks', async () => {
    const repository = mock<UserRepository>();
    const logger = mock<Logger>();

    const service = new UserService(repository, logger);

    // ...
  });
});
```

`mock()` creates a typed mock object, and `stub()` wraps the underlying mocking library (Jest in this example) to provide methods like `mockResolvedValue()`
These functions come from the installed doubles adapter (`@suites/doubles.jest`), which adapts the native mocking capabilities of the test framework.

> info **Hint** The `mock()` function is an alternative to `createMock` from `@golevelup/ts-jest`. Both create typed mock objects. See the [testing fundamentals](/fundamentals/testing#auto-mocking) chapter for more on `createMock`.

#### Summary

**Use `Test.createTestingModule()` for:**
- Validating module configuration and provider wiring
- Testing decorators, guards, interceptors, and pipes
- Verifying dependency injection across modules
- Testing full application context with middleware

**Use Suites for:**
- Fast unit tests focused on business logic
- Automatic mock generation for multiple dependencies
- Type-safe test doubles with IntelliSense

Organize tests by purpose: use Suites for unit tests verifying individual service behavior, and use `Test.createTestingModule()` for integration tests verifying module configuration.

For more information:
- [Suites Documentation](https://suites.dev/docs)
- [Suites GitHub Repository](https://github.com/suites-dev/suites)
- [NestJS Testing Documentation](/fundamentals/testing)
