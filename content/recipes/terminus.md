### Healthchecks (Terminus)

Terminus integration provides you with **readiness/liveness** health checks. Healthchecks are crucial when it comes to complex
backend setups. In a nutshell, a health check in the realm of web development usually consists of a special address, for example, `https://my-website.com/health/readiness`.
A service or a component of your infrastructure (e.g., Kubernetes) checks this address continuously. Depending on the HTTP status code returned from a `GET` request to this address the service will take action when it receives an "unhealthy" response.
Since the definition of "healthy" or "unhealthy" varies with the type of service you provide, the **Terminus** integration supports you with a
set of **health indicators**.

As an example, if your web server uses MongoDB to store its data, it would be vital information whether MongoDB is still up and running.
In that case, you can make use of the `MongooseHealthIndicator`. If configured correctly - more on that later - your health check address will return
a healthy or unhealthy HTTP status code, depending on whether MongoDB is running.

#### Getting started

To get started with `@nestjs/terminus` we need to install the required dependency.

```bash
$ npm install --save @nestjs/terminus
```

#### Setting up a Healthcheck

A health check represents a summary of **health indicators**. A health indicator executes a check of a service, whether it is in a healthy or unhealthy state. A health check is positive if all the assigned health indicators are up and running. Because a lot of applications will need similar health indicators, [`@nestjs/terminus`](https://github.com/nestjs/terminus) provides a set of predefined indicators, such as:

- `HttpHealthIndicator`
- `TypeOrmHealthIndicator`
- `MongooseHealthIndicator`
- `SequelizeHealthIndicator`
- `MicroserviceHealthIndicator`
- `GRPCHealthIndicator`
- `MemoryHealthIndicator`
- `DiskHealthIndicator`

To get started with our first health check, we need to import the `TerminusModule` into our `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule]
})
export class AppModule {}
```

Our healthcheck(s) can be executed using a [controller](/controllers), which can be easily set up using the [Nest CLI](cli/overview).

```bash
$ nest g controller health
```

> info **Info** It is highly recommended to enable shutdown hooks in your application. Terminus integration makes use of this lifecycle event if enabled. Read more about shutdown hooks [here](fundamentals/lifecycle-events#application-shutdown).

#### HTTP Healthcheck

Once we have installed `@nestjs/terminus`, imported our `TerminusModule` and created a new controller, we are ready to create a health check.

```typescript
@@filename(health.controller)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
  }
}
@@switch
@Controller('health')
@Dependencies(HealthCheckService, HttpHealthIndicator)
export class HealthController {
  constructor(
    private health,
    private http,
  ) { }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      async () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ])
  }
}
```

Our health check will now send a _GET_-request to the `https://docs.nestjs.com` address. If
we get a healthy response from that address, our route at `http://localhost:3000/health` will return
the following object with a 200 status code.

```json
{
  "status": "ok",
  "info": {
    "nestjs-docs": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "nestjs-docs": {
      "status": "up"
    }
  }
}
```

The interface of this response object can be accessed from the `@nestjs/terminus` package with the `HealthCheckResult` interface.

|           |                                                                                                                                                                                             |                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `status`  | If any health indicator failed the status will be `'error'`. If the NestJS app is shutting down but still accepting HTTP requests, the health check will have the `'shutting_down'` status. | `'error' \| 'ok' \| 'shutting_down'` |
| `info`    | Object containing information of each health indicator which is of status `'up'`, or in other words "healthy".                                                                              | `object`                             |
| `error`   | Object containing information of each health indicator which is of status `'down'`, or in other words "unhealthy".                                                                          | `object`                             |
| `details` | Object containing all information of each health indicator                                                                                                                                  | `object`                             |

#### TypeOrm health indicator

Terminus offers the capability to add database checks to your health check. In order to get started with this health indicator, you
should check out the [Database chapter](/techniques/sql) and make sure your database connection within your application is established.

> info **Hint** Behind the scenes the `TypeOrmHealthIndicator` simply executes a `SELECT 1`-SQL command which is often used to verify whether the database still alive. In case you are using an Oracle database it uses `SELECT 1 FROM DUAL`.

```typescript
@@filename(health.controller)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
@@switch
@Controller('health')
@Dependencies(HealthCheckService, TypeOrmHealthIndicator)
export class HealthController {
  constructor(
    private health,
    private db,
  ) { }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      async () => this.db.pingCheck('database'),
    ])
  }
}
```

If your database is reachable, you should now see the following JSON-result when requesting `http://localhost:3000` with a `GET` request:

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

In case your app uses [multiple databases](techniques/database#multiple-databases), you need to inject each
connection into your `HealthController`. Then, you can simply pass the connection reference to the `TypeOrmHealthIndicator`.

```typescript
@@filename(health.controller)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    @InjectConnection('albumsConnection')
    private albumsConnection: Connection,
    @InjectConnection()
    private defaultConnection: Connection,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('albums-database', { connection: this.albumsConnection }),
      () => this.db.pingCheck('database', { connection: this.defaultConnection }),
    ]);
  }
}
```

#### Custom health indicator

In some cases, the predefined health indicators provided by `@nestjs/terminus` do not cover all of your health check requirements. In that case, you can set up a custom health indicator according to your needs.

Let's get started by creating a service that will represent our custom indicator. To get a basic understanding of how an indicator is structured, we will create an example `DogHealthIndicator`. This service should have the state `'up'` if every `Dog` object has the type `'goodboy'`. If that condition is not satisfied then it should throw an error.

```typescript
@@filename(dog.health)
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

export interface Dog {
  name: string;
  type: string;
}

@Injectable()
export class DogHealthIndicator extends HealthIndicator {
  private dogs: Dog[] = [
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

The next thing we need to do is register the health indicator as a provider.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DogHealthIndicator } from './dog.health';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
  providers: [DogHealthIndicator]
})
export class AppModule { }
```

> info **Hint** In a real-world application the `DogHealthIndicator` should be provided in a separate module, for example, `DogModule`, which then will be imported by the `AppModule`.

The last required step is to add the now available health indicator in the required health check endpoint. For that, we go back to our `HealthController` and add it to our `check` function.

```typescript
@@filename(health.controller)
import { HealthCheckService } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { DogHealthIndicator } from './dog.health';

@Injectable()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private dogHealthIndicator: DogHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      async () => this.dogHealthIndicator.isHealthy('dog'),
    ])
  }
}
@@switch
import { HealthCheckService } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { DogHealthIndicator } from './dog.health';

@Injectable()
@Dependencies(HealthCheckService, DogHealthIndicator)
export class HealthController {
  constructor(
    private health,
    private dogHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      async () => this.dogHealthIndicator.isHealthy('dog'),
    ])
  }
}
```

#### Examples

Some working examples are available [here](https://github.com/nestjs/terminus/tree/master/sample).
