### Health Checks (Terminus)

The JavaScript library [@godaddy/terminus](https://github.com/godaddy/terminus) offers hooks to react on graceful shutdowns and supports you creating proper [Kubernetes](https://kubernetes.io/) readiness / liveness checks for any HTTP application. The module [@nestjs/terminus](https://github.com/nestjs/terminus) integrates the terminus library with the NestJS ecosystem. To get started with `@nestjs/terminus` we need to install the required dependencies.

```bash
$ npm install --save @nestjs/terminus @godaddy/terminus
```

#### Setting up a Health Check

A health check represents a summary of **health indicators**. A health indicator executes a check of a service, whether it is in a healthy state or not. A health check is positive, if all the assigned health indicators are up and running. Because a lot of applications will need similar health indicators, [@nestjs/terminus](https://github.com/nestjs/terminus) provides a set of predefined health indicators, such as:

- DatabaseHealthIndicator
- DNSHealthIndicator

The first step to get started with our first health check, is to setup a service which will associate health indicators to an endpoint.

```typescript
@@filename(terminus-options.service)
import {
  TerminusEndpoint,
  TerminusOptionsFactory,
  DNSHealthIndicator,
  TerminusModuleOptions
} from '@nestjs/terminus';

class TerminusOptionsService implements TerminusOptionsFactory {
  constructor(
    @Inject(DNSHealthIndicator) private readonly dns: DNSHealthIndicator,
  ) { }

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
```

Once we have set up our `HealthService`, we can import the `TerminusModule` into the root `ApplicationModule`. The `HealthService` will all provide the settings, which will be used by the `TerminusModule`

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TerminusOptions } from './terminus-options.service';

@Module({
  imports: [
    TerminusModule.forRootAsync({
      useClass: TerminusOptionsService,
    }),
  ],
})
export class ApplicationModule {}
```

> info **Hint** If done correctly Nest will expose the defined health check(s), which are reachable through a GET request to the defined route. For example `curl -X GET 'http://localhost:3000/health'`

#### Creating a custom Health Indicator

In some cases the predefined health indicators provided by `@nestjs/terminus` do not cover all of your health check requirements. In this case you can set up a custom health indicator according to your needs.

Lets get started by creating a service which will represent our custom health indicator. To get a basic understanding how a health indicator is structured, we will create an example `DogHealthIndicator`. This health indicator should have the state "up", if every `Dog` object has the type `goodboy`, otherwise it will throw an error, which then the health indicator will be seen as "down".

```typescript
@@filename(dog.health)
import { Injectable } from '@nestjs/common';
import { HealthCheckError } from '@godaddy/terminus';
import { HealthIndicatorResult } from '@brunnerlivio/terminus';

export interface Dog {
  name: string;
  type: string;
}

@Injectable()
export class DogHealthIndicator {
  private readonly dogs: Dog[] = [
    { name: 'Fido', type: 'goodboy' },
    { name: 'Rex', type: 'badboy' },
  ];

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const badboys = this.dogs.filter(dog => dog.type === 'badboy');
    const status = badboys.length > 0 ? 'down' : 'up';

    const result = {
      [key]: { status, badboys: badboys.length },
    };

    if (status === 'down') {
      throw new HealthCheckError('Dogcheck failed', result);
    }
    return result;
  }
}
```

The next thing we need to do is registering the health indicator as a provider.

```typescript
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TerminusOptions } from './terminus-options.service';
import { DogHealthIndicator } from './dog.health.ts';

@Module({
  providers: [DogHealthIndicator],
  exports: [DogHealthIndicator]
  imports: [
    TerminusModule.forRootAsync({
      imports: [ApplicationModule],
      useClass: TerminusOptionsService,
    }),
  ],
})
export class ApplicationModule {}
```

> error **Hint** In a real world application the `DogHealthIndicator` should be provided in a separate Module, for example `DogModule`, which then get imported by the `ApplicationModule`. But keep in mind to add the `DogHealthIndicator` to the `exports` array of the `DogModule` and add the `DogModule` in `imports` array of the `TerminusModule.forRootAsync()` parameter object.

The last required thing to do is to add the now available health indicator in the required health check endpoint. For that we go back to our `TerminusOptionsService` and implement it to the `/health` endpoint.

```typescript
  TerminusEndpoint,
  TerminusOptionsFactory,
  DNSHealthIndicator,
  TerminusModuleOptions
} from '@nestjs/terminus';

class TerminusOptionsService implements TerminusOptionsFactory {
  constructor(
    @Inject(DogHealthIndicator) private readonly dogHealthIndicator: DogHealthIndicator
  ) { }

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
