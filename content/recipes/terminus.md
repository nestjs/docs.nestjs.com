### Health checks (Terminus)

The [terminus](https://github.com/godaddy/terminus) offers hooks to react on graceful shutdowns and supports you creating proper [Kubernetes](https://kubernetes.io/) readiness / liveness checks for any HTTP application. The module [@nestjs/terminus](https://github.com/nestjs/terminus) integrates the terminus library with the Nest ecosystem.

#### Getting started

To get started with `@nestjs/terminus` we need to install the required dependencies.

```bash
$ npm install --save @nestjs/terminus @godaddy/terminus
```

#### Setting up a health check

A health check represents a summary of **health indicators**. A health indicator executes a check of a service, whether it is in a healthy state or not. A health check is positive, if all the assigned health indicators are up and running. Because a lot of applications will need similar health indicators, [@nestjs/terminus](https://github.com/nestjs/terminus) provides a set of predefined health indicators, such as:

- `DNSHealthIndicator`
- `TypeOrmHealthIndicator`
- `MongooseHealthIndicator`
- `MicroserviceHealthIndicator`
- `MemoryHealthIndicator`
- `DiskHealthIndicator`

#### DNS Health Check

The first step to get started with our first health check, is to setup a service which will associate health indicators to an endpoint.

```typescript
@@filename(terminus-options.service)
import {
  TerminusEndpoint,
  TerminusOptionsFactory,
  DNSHealthIndicator,
  TerminusModuleOptions
} from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TerminusOptionsService implements TerminusOptionsFactory {
  constructor(
    private readonly dns: DNSHealthIndicator,
  ) {}

  createTerminusOptions(): TerminusModuleOptions {
    const healthEndpoint: TerminusEndpoint = {
      url: '/health',
      healthIndicators: [
        async () => this.dns.pingCheck('google', 'https://google.com'),
      ],
    };
    return {
      endpoints: [healthEndpoint],
    };
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { DNSHealthIndicator } from '@nestjs/terminus';

@Injectable()
@Dependencies(DNSHealthIndicator)
export class TerminusOptionsService {
  constructor(dns) {
    this.dns = dns;
  }

  createTerminusOptions() {
    const healthEndpoint = {
      url: '/health',
      healthIndicators: [
        async () => this.dns.pingCheck('google', 'https://google.com'),
      ],
    };
    return {
      endpoints: [healthEndpoint],
    };
  }
}
```

Once we have set up our `TerminusOptionsService`, we can import the `TerminusModule` into the root `ApplicationModule`. The `TerminusOptionsService` will provide the settings, which in turn will be used by the `TerminusModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TerminusOptionsService } from './terminus-options.service';

@Module({
  imports: [
    TerminusModule.forRootAsync({
      useClass: TerminusOptionsService,
    }),
  ],
})
export class ApplicationModule { }
```

> info **Hint** If done correctly, Nest will expose the defined health check(s), which are reachable through a GET request to the defined route. For example `curl -X GET 'http://localhost:3000/health'`

#### Custom health indicator

In some cases, the predefined health indicators provided by `@nestjs/terminus` do not cover all of your health check requirements. In this case you can set up a custom health indicator according to your needs.

Let's get started by creating a service which will represent our custom health indicator. To get a basic understanding how a health indicator is structured, we will create an example `DogHealthIndicator`. This health indicator should have the state "up", if every `Dog` object has the type `goodboy`, otherwise it will throw an error, which then the health indicator will be seen as "down".

```typescript
@@filename(dog.health)
import { Injectable } from '@nestjs/common';
import { HealthCheckError } from '@godaddy/terminus';
import { HealthIndicatorResult } from '@nestjs/terminus';

export interface Dog {
  name: string;
  type: string;
}

@Injectable()
export class DogHealthIndicator extends HealthIndicator {
  private readonly dogs: Dog[] = [
    { name: 'Fido', type: 'goodboy' },
    { name: 'Rex', type: 'badboy' },
  ];

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const badboys = this.dogs.filter(dog => dog.type === 'badboy');
    const isHealthy = badboys.length === 0;
    const result = this.getStatus(key, isHealthy, { badboys: badboys.length });

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('Dogcheck failed', result);
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { HealthCheckError } from '@godaddy/terminus';

@Injectable()
export class DogHealthIndicator extends HealthIndicator {
  dogs = [
    { name: 'Fido', type: 'goodboy' },
    { name: 'Rex', type: 'badboy' },
  ];

  async isHealthy(key) {
    const badboys = this.dogs.filter(dog => dog.type === 'badboy');
    const isHealthy = badboys.length === 0;
    const result = this.getStatus(key, isHealthy, { badboys: badboys.length });

    if (isHealthy) {
      return result;
    }
    throw new HealthCheckError('Dogcheck failed', result);
  }
}
```

The next thing we need to do is registering the health indicator as a provider.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TerminusOptions } from './terminus-options.service';
import { DogHealthIndicator } from './dog.health.ts';

@Module({
  imports: [
    TerminusModule.forRootAsync({
      imports: [ApplicationModule],
      useClass: TerminusOptionsService,
    }),
  ],
  providers: [DogHealthIndicator],
  exports: [DogHealthIndicator],
})
export class ApplicationModule { }
```

> info **Hint** In a real world application the `DogHealthIndicator` should be provided in a separate module, for example `DogsModule`, which then will be imported by the `ApplicationModule`. But keep in mind to add the `DogHealthIndicator` to the `exports` array of the `DogModule` and add the `DogModule` in `imports` array of the `TerminusModule.forRootAsync()` parameter object.

The last required thing to do is to add the now available health indicator in the required health check endpoint. For that we go back to our `TerminusOptionsService` and implement it to the `/health` endpoint.

```typescript
@@filename(terminus-options.service)
import {
  TerminusEndpoint,
  TerminusOptionsFactory,
  DNSHealthIndicator,
  TerminusModuleOptions
} from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TerminusOptionsService implements TerminusOptionsFactory {
  constructor(
    private readonly dogHealthIndicator: DogHealthIndicator
  ) {}

  createTerminusOptions(): TerminusModuleOptions {
    const healthEndpoint: TerminusEndpoint = {
      url: '/health',
      healthIndicators: [
        async () => this.dogHealthIndicator.isHealthy('dog'),
      ],
    };
    return {
      endpoints: [healthEndpoint],
    };
  }
}
@@switch
import { DogHealthIndicator } from '../dog/dog.health';
import { Injectable, Dependencies } from '@nestjs/common';

@Injectable()
@Dependencies(DogHealthIndicator)
export class TerminusOptionsService {
  constructor(dogHealthIndicator) {
    this.dogHealthIndicator = dogHealthIndicator;
  }

  createTerminusOptions() {
    const healthEndpoint = {
      url: '/health',
      healthIndicators: [
        async () => this.dogHealthIndicator.isHealthy('dog'),
      ],
    };
    return {
      endpoints: [healthEndpoint],
    };
  }
}
```

If everything has been done correctly, the `/health` endpoint should respond with a `503` response code and the following data.

```json
{
  "status": "error",
  "error": {
    "dog": {
      "status": "down",
      "badboys": 1
    }
  }
}
```

You can view working examples in the `@nestjs/terminus` [repository](https://github.com/nestjs/terminus/tree/master/sample).


#### Custom Logger

The `Terminus` module automatically logs every error during a health check request. By default, it will use the globally defined Nest logger.
You can read more about the global logger in the [Logger chapter](https://docs.nestjs.com/techniques/logger).
In some cases, you want to handle the logs of `Terminus` explicitly. In this case, the `TerminusModule.forRoot[Async]` function offers an option
for a custom logger.

```typescript

TerminusModule.forRootAsync({
  logger: (message: string, error: Error) => console.error(message, error),
  endpoints: [
    ...
  ]
})

```

The logger can also be disabled by setting the logger option to `null`.

```typescript

TerminusModule.forRootAsync({
  logger: null,
  endpoints: [
    ...
  ]
})

```

