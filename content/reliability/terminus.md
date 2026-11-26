### Health checks

The Terminus integration provides **readiness/liveness** health checks. Health checks are crucial in complex backend setups. In web development, a health check usually consists of a dedicated address, for example, `https://my-website.com/health/readiness`.
A service or component of your infrastructure (e.g., [Kubernetes](https://kubernetes.io/)) checks this address continuously. Depending on the HTTP status code returned from a `GET` request to this address, the service takes action when it receives an "unhealthy" response.
Because the definition of "healthy" or "unhealthy" varies with the type of service you provide, the **Terminus** integration offers a set of **health indicators**.

For example, if your web server uses MongoDB to store its data, whether MongoDB is still up and running is vital information.
In that case, you can use the `MongooseHealthIndicator`. Once configured (as described below), your health check address returns
a healthy or unhealthy HTTP status code, depending on whether MongoDB is running.

#### Getting started

To get started with `@nestjs/terminus`, install the required dependency:

```bash
$ npm install --save @nestjs/terminus
```

#### Setting up a health check

A health check represents a summary of **health indicators**. A health indicator checks whether a service is in a healthy or unhealthy state. A health check is positive if all the assigned health indicators are up and running.

To get started with our first health check, let's create the `HealthModule` and add the `TerminusModule` to its `imports` array.

> info **Hint** To create the module using the [Nest CLI](/cli/overview), run the `$ nest g module health` command.

```typescript
@@filename(health.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule]
})
export class HealthModule {}
```

Health checks are executed by a [controller](/controllers), which you can generate with the [Nest CLI](/cli/overview).

```bash
$ nest g controller health
```

> info **Hint** We highly recommend enabling shutdown hooks in your application. When they are enabled, the Terminus integration uses this lifecycle event to report the `'shutting_down'` status and to apply the [graceful shutdown timeout](#graceful-shutdown-timeout). Learn more in the [application shutdown](/fundamentals/lifecycle-events#application-shutdown) section.

#### Liveness and readiness

Once you have installed `@nestjs/terminus`, imported the `TerminusModule`, and created a new controller, you are ready to create a health check.

Orchestrators such as Kubernetes ask two different questions, so most applications have two health checks:

- **Liveness**: is the process broken? If this check fails, the orchestrator restarts the container. Don't check dependencies here. A restart doesn't repair a database that is down.
- **Readiness**: can the application serve requests right now? If this check fails, the orchestrator stops sending traffic until the check passes again. Check the dependencies the application can't work without.

```typescript
@@filename(health.controller)
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, FetchHealthIndicator, DiskHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: FetchHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.http.pingCheck('payments', 'https://payments.example.com/health'),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }
}
@@switch
import { Controller, Dependencies, Get } from '@nestjs/common';
import { HealthCheckService, FetchHealthIndicator, DiskHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller('health')
@Dependencies(HealthCheckService, FetchHealthIndicator, DiskHealthIndicator)
export class HealthController {
  constructor(health, http, disk) {
    this.health = health;
    this.http = http;
    this.disk = disk;
  }

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.http.pingCheck('payments', 'https://payments.example.com/health'),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }
}
```

The liveness check has no indicators: an answer shows that the process is alive. You can still add indicators that only look at the process itself, such as the [memory health indicator](#memory-health-indicator).

If the payment API answers and less than 90% of the disk is used, the route at `http://localhost:3000/health/ready` returns
the following object with a `200` status code:

```json
{
  "status": "ok",
  "info": {
    "payments": { "status": "up", "responseTime": 87 },
    "storage": { "status": "up", "responseTime": 1 }
  },
  "error": {},
  "details": {
    "payments": { "status": "up", "responseTime": 87 },
    "storage": { "status": "up", "responseTime": 1 }
  }
}
```

The `@nestjs/terminus` package exports the type of this response object as `HealthCheckResult`.

|           |                                                                                                                                                                                             |                                      |
|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------|
| `status`  | If any health indicator failed, the status is `'error'`. If no indicator failed but at least one is `'degraded'`, the status is `'degraded'`. If the Nest application is shutting down but still accepting HTTP requests, the status is `'shutting_down'`. | `'error' \| 'ok' \| 'degraded' \| 'shutting_down'` |
| `info`    | Object containing information about each health indicator whose status is `'up'` or `'degraded'`, in other words, "still serving".                                                                              | `object`                             |
| `error`   | Object containing information about each health indicator whose status is `'down'`, in other words, "unhealthy".                                                                          | `object`                             |
| `details` | Object containing information about every health indicator.                                                                                                                                | `object`                             |

The status of the health check follows from its indicators:

| Indicators | `status` | HTTP status code |
|---|---|---|
| All `'up'` | `'ok'` | `200` |
| At least one `'degraded'`, none `'down'` | `'degraded'` | `200` |
| At least one `'down'` | `'error'` | `503` |

#### Built-in health indicators

Because many applications need similar health indicators, [`@nestjs/terminus`](https://github.com/nestjs/terminus) provides a set of predefined indicators:

| Indicator | Checks that | Required packages |
|---|---|---|
| [`FetchHealthIndicator`](#http-health-check) (replaces the deprecated `HttpHealthIndicator`) | an HTTP endpoint answers | none |
| [`TypeOrmHealthIndicator`](#typeorm-health-indicator) | the database answers a query | `@nestjs/typeorm`, `typeorm` |
| [`MongooseHealthIndicator`](#other-database-indicators) | the database answers a ping | `@nestjs/mongoose`, `mongoose` |
| [`SequelizeHealthIndicator`](#other-database-indicators) | the database answers a query | `@nestjs/sequelize`, `sequelize` |
| [`MikroOrmHealthIndicator`](#other-database-indicators) | the database answers a query | `@mikro-orm/nestjs`, `@mikro-orm/core` |
| [`PrismaHealthIndicator`](#other-database-indicators) | the database answers a query | `@prisma/client` |
| [`MicroserviceHealthIndicator`](#microservice-health-indicator) | a microservice transport connects | `@nestjs/microservices` |
| [`GRPCHealthIndicator`](#grpc-health-indicator) | a gRPC service reports `SERVING` | `@nestjs/microservices`, `@grpc/grpc-js`, `@grpc/proto-loader` |
| [`MemoryHealthIndicator`](#memory-health-indicator) | the process stays below a memory limit | none |
| [`DiskHealthIndicator`](#disk-health-indicator) | the disk stays below a usage limit | none |

Terminus only loads the packages of the indicators you inject.

#### HTTP health check

The `FetchHealthIndicator` checks an HTTP endpoint with the native `fetch()` function:

```typescript
@@filename(health.controller)
// Within the `HealthController`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
  ]);
}
```

If the address answers with a `2xx` status code within one second, the indicator is `'up'`.

##### Check for specific HTTP response codes

In certain cases, you might want to check for specific criteria and validate the response. For example, assume
`https://my-external-service.com` returns a `204` response code. With the `verify` option, you can
check for that response code specifically and treat all other codes as unhealthy.

`verify` is a function (sync or async) that receives the response and returns a boolean indicating whether
it is considered healthy (`true`) or unhealthy (`false`).

```typescript
@@filename(health.controller)
// Within the `HealthController`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () =>
      this.http.pingCheck('my-external-service', 'https://my-external-service.com', {
        verify: (res) => res.status === 204,
      }),
  ]);
}
```

If the service answers with an unhealthy response, the `statusCode` and `statusText` of that response are added to the result.

##### Use another HTTP client

By default, the request is sent with the native `fetch()` function. To use your own HTTP client, pass a function with the `fetch` option.

With [`@nestjs/http-client`](/application/http-client), pass the `request()` method:

```typescript
this.http.pingCheck('billing', 'https://billing.example.com/health', {
  fetch: this.httpClient.request,
});
```

The client throws on a `4xx` or `5xx` response, and by default retries some of them, such as a `503`, within the timeout of the check. To check such a response with `verify`, set `throwOnHttpError` and `retry` to `false`:

```typescript
this.http.pingCheck('billing', 'https://billing.example.com/health', {
  fetch: (url, init) => this.httpClient.request(url, { ...init, throwOnHttpError: false, retry: false }),
  verify: (res) => res.status === 503,
});
```

With `@nestjs/axios`, turn the Observable into a Promise:

```typescript
this.http.pingCheck('billing', 'https://billing.example.com/health', {
  fetch: (url, init) => lastValueFrom(this.httpService.request({ url, ...init })),
});
```

> warning **Warning** The `HttpHealthIndicator`, which requires the `@nestjs/axios` package, is deprecated. Use the `FetchHealthIndicator` instead.

#### TypeOrm health indicator

Terminus lets you add database checks to your health check. Before using this health indicator, read the
[database](/data/typeorm) chapter and make sure your application's database connection is established.

> info **Hint** Behind the scenes, the `TypeOrmHealthIndicator` executes a `SELECT 1` SQL command, which is commonly used to verify whether the database is still alive. For Oracle databases, it uses `SELECT 1 FROM DUAL`, and for SAP HANA, `SELECT now() FROM dummy`.

Inject the `TypeOrmHealthIndicator` into your `HealthController` and add it to the health check:

```typescript
@@filename(health.controller)
// Within the `HealthController`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.db.pingCheck('database').withTimeout('1s'),
  ]);
}
```

If your database is reachable, a `GET` request to `http://localhost:3000/health` returns the following JSON result:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up", "responseTime": 12 }
  },
  "error": {},
  "details": {
    "database": { "status": "up", "responseTime": 12 }
  }
}
```

If your application uses [multiple databases](/data/typeorm#multiple-databases), inject each
data source into your `HealthController`. Then, pass the data source reference to the `TypeOrmHealthIndicator` using the `connection` option.

```typescript
@@filename(health.controller)
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    @InjectDataSource('albumsConnection')
    private albumsConnection: DataSource,
    @InjectDataSource()
    private defaultConnection: DataSource,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('albums-database', { connection: this.albumsConnection }).withTimeout('1s'),
      () => this.db.pingCheck('database', { connection: this.defaultConnection }).withTimeout('1s'),
    ]);
  }
}
```


#### Other database indicators

The other database indicators work like the `TypeOrmHealthIndicator`. Inject the indicator and add its check:

```typescript
this.mongoose.pingCheck('mongodb');
this.sequelize.pingCheck('database');
this.mikroOrm.pingCheck('database');
this.prisma.pingCheck('database', this.prismaClient);
```

#### Disk health indicator

The `DiskHealthIndicator` checks how much storage is in use. To get started, inject the `DiskHealthIndicator`
into your `HealthController`. The following example checks the storage used by the path `/` (on Windows, use `C:\\`).
If more than 50% of the total storage space is used, the health check reports an unhealthy state.

```typescript
@@filename(health.controller)
// Within the `HealthController`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
  ]);
}
```

The `DiskHealthIndicator.checkStorage()` method can also check against a fixed amount of space.
The following example is unhealthy if the storage used by the path `/` exceeds 250GB.

```typescript
@@filename(health.controller)
// Within the `HealthController`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.disk.checkStorage('storage', { path: '/', threshold: '250gb' })
  ]);
}
```

#### Memory health indicator

Use the `MemoryHealthIndicator` to make sure your process doesn't exceed a certain memory limit.
The following example checks the heap of your process.

> info **Hint** The heap is the portion of memory where dynamically allocated memory resides. `checkHeap()` compares the `heapUsed` value reported by `process.memoryUsage()` (the V8 heap memory currently in use) against the given threshold: a number of bytes or a string such as `'512kb'`, `'150mb'` or `'2gb'`.

```typescript
@@filename(health.controller)
// Within the `HealthController`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.memory.checkHeap('memory_heap', '150mb'),
  ]);
}
```

You can also verify the RSS of your process with `MemoryHealthIndicator.checkRSS()`. The following example
returns an unhealthy response code if your process has more than 150MB allocated.

> info **Hint** RSS (Resident Set Size) shows how much memory is allocated to the process and held in RAM.
> It doesn't include memory that is swapped out. It does include memory from shared libraries, as long as the pages from
> those libraries are actually in memory, as well as all stack and heap memory.


```typescript
@@filename(health.controller)
// Within the `HealthController`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.memory.checkRSS('memory_rss', '150mb'),
  ]);
}
```


#### Microservice health indicator

The `MicroserviceHealthIndicator` checks that your application can connect to a [microservice transport](/microservices/basics), such as Redis, NATS, or TCP. It requires the `@nestjs/microservices` package and the package of the transport.

Pass the same `transport` and `options` that you use for the client of that transport. The following example checks a Redis server:

```typescript
@@filename(health.controller)
// Within the `HealthController`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () =>
      this.microservice.pingCheck<RedisOptions>('redis', {
        transport: Transport.REDIS,
        options: { host: 'localhost', port: 6379 },
      }),
  ]);
}
```

If the connection isn't established within one second, the indicator is `'down'`.

#### gRPC health indicator

The `GRPCHealthIndicator` checks a [gRPC](/microservices/grpc) service that implements the standard [gRPC health checking protocol](https://github.com/grpc/grpc/blob/master/doc/health-checking.md). It requires the `@nestjs/microservices`, `@grpc/grpc-js`, and `@grpc/proto-loader` packages.

The second argument is the name of the service to ask for. The indicator is `'up'` if the service reports `SERVING` within one second.

```typescript
@@filename(health.controller)
// Within the `HealthController`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () =>
      this.grpc.checkService<GrpcOptions>('hero_service', 'hero.health.v1', {
        url: 'localhost:5000',
      }),
  ]);
}
```

#### Custom health indicator

In some cases, the predefined health indicators provided by `@nestjs/terminus` don't cover all of your health check requirements. In that case, you can create a custom health indicator.

Most health indicators follow the same pattern: run an operation, then mark the indicator as `'up'` if it succeeds and as `'down'` if it fails. The `HealthIndicatorService` implements this pattern with `attempt()`. To show how an indicator is structured, we will create an example `QueueHealthIndicator`. It has the state `'up'` as long as the `emails` [queue](/application/queues) answers within one second.

```typescript
@@filename(queue.health)
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { Queue } from 'bullmq';

@Injectable()
export class QueueHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @InjectQueue('emails') private readonly queue: Queue,
  ) {}

  isHealthy(key: string) {
    return this.healthIndicatorService
      .check(key)
      .attempt(() => this.queue.getWaitingCount())
      .withSuccessData((waiting) => ({ waiting }))
      .withTimeout('1s');
  }
}
@@switch
import { getQueueToken } from '@nestjs/bullmq';
import { Injectable, Dependencies } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

@Injectable()
@Dependencies(HealthIndicatorService, getQueueToken('emails'))
export class QueueHealthIndicator {
  constructor(healthIndicatorService, queue) {
    this.healthIndicatorService = healthIndicatorService;
    this.queue = queue;
  }

  isHealthy(key) {
    return this.healthIndicatorService
      .check(key)
      .attempt(() => this.queue.getWaitingCount())
      .withSuccessData((waiting) => ({ waiting }))
      .withTimeout('1s');
  }
}
```

`attempt()` accepts a sync or async function and marks the indicator as `'up'` once it resolves. `withSuccessData()` receives the value the function returned and chooses the data that is added to the result (see [Additional data](#additional-data)). If the function throws, the indicator is marked as `'down'` and the error message is added to the result. In both cases, the time the function took is reported as `responseTime`. `withTimeout()` limits the time the attempt can take (see [Configuring a check](#configuring-a-check)).

Next, register the health indicator as a provider:

```typescript
@@filename(health.module)
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { QueueHealthIndicator } from './queue.health.js';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule, BullModule.registerQueue({ name: 'emails' })],
  providers: [QueueHealthIndicator],
})
export class HealthModule {}
```

The last step is to add the new health indicator to the health check endpoint:

```typescript
@@filename(health.controller)
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Controller, Get } from '@nestjs/common';
import { QueueHealthIndicator } from './queue.health.js';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private queueHealthIndicator: QueueHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.queueHealthIndicator.isHealthy('queue'),
    ]);
  }
}
@@switch
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Controller, Dependencies, Get } from '@nestjs/common';
import { QueueHealthIndicator } from './queue.health.js';

@Controller('health')
@Dependencies(HealthCheckService, QueueHealthIndicator)
export class HealthController {
  constructor(health, queueHealthIndicator) {
    this.health = health;
    this.queueHealthIndicator = queueHealthIndicator;
  }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.queueHealthIndicator.isHealthy('queue'),
    ]);
  }
}
```

If the queue answers in time, the health check returns the following result:

```json
{
  "status": "ok",
  "info": {
    "queue": { "status": "up", "waiting": 3, "responseTime": 4 }
  },
  "error": {},
  "details": {
    "queue": { "status": "up", "waiting": 3, "responseTime": 4 }
  }
}
```

> info **Hint** Terminus executes attempts itself, so you can pass an attempt to `health.check([...])` either directly (`this.queueHealthIndicator.isHealthy('queue')`) or wrapped in a function, as in the example above.

##### Explicit control with up() and down()

Sometimes "healthy" means more than "the operation didn't throw". To decide the state yourself, return `up()` or `down()` directly instead of using `attempt()`. The following indicator is only healthy while the cache is connected.

```typescript
@@filename(cache.health)
@Injectable()
export class CacheHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly cache: CacheService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    const isConnected = await this.cache.isConnected();

    if (!isConnected) {
      return indicator.down('cache unreachable');
    }

    return indicator.up();
  }
}
```

Both `up()` and `down()` accept either an object with additional data, which is appended to the result, or a string, which is added as the `message` property.

##### Degraded state

Not every problem justifies taking the application out of rotation. An unreachable cache, for example, slows the application down but doesn't break it. For such cases, an indicator can return `degraded()`. A degraded indicator doesn't fail the health check: it is listed under `info`, the overall status becomes `'degraded'`, and the HTTP status code stays `200`. Orchestrators keep routing traffic, while the state remains visible in monitoring.

```typescript
@@filename(cache.health)
// Within the `CacheHealthIndicator`-class
if (!isConnected) {
  return indicator.degraded('cache unreachable, serving without cache');
}
```

```json
{
  "status": "degraded",
  "info": {
    "cache": { "status": "degraded", "message": "cache unreachable, serving without cache" }
  },
  "error": {},
  "details": {
    "cache": { "status": "degraded", "message": "cache unreachable, serving without cache" }
  }
}
```

Like `up()` and `down()`, `degraded()` accepts either an object with additional data or a message string. As soon as any indicator is `'down'`, the overall status is `'error'` regardless of degraded indicators.

> warning **Warning** A health indicator built with `up()`, `down()`, and `degraded()` reports its state by returning one of them. An error thrown by such an indicator is treated as a bug, not an unhealthy state: it aborts the whole health check and results in a `500` response instead of a `503`. If your indicator wraps an operation that may throw, use `attempt()`, which translates a thrown error into a `'down'` state.

#### Configuring a check

Every check built with `attempt()` returns a `HealthCheckAttempt`. This includes your custom indicators as well as the built-in indicators, except the deprecated `HttpHealthIndicator`. Before the attempt is executed, you can configure it by chaining the methods below. The order in which you chain them doesn't matter.

Every time value takes milliseconds or a string such as `'200ms'`, `'2s'` or `'15m'`.

##### Timeouts

`withTimeout()` limits the time the attempt can take. Once the time is up, the indicator is marked as `'down'` and the `AbortSignal` that your function receives as the `signal` property of its argument is aborted. Pass that `signal` to the underlying operation, for example to `fetch()`, so that it is canceled as well, rather than lingering in the background.

```typescript
@@filename(health.controller)
// Within the `HealthController`-class
@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.db.pingCheck('database').withTimeout('1.5s'),
    () => this.queueHealthIndicator.isHealthy('queue'),
  ]);
}
```

If the queue from the custom indicator doesn't answer within one second, the health check responds with the following result:

```json
{
  "status": "error",
  "info": {
    "database": { "status": "up", "responseTime": 12 }
  },
  "error": {
    "queue": { "status": "down", "message": "timeout of 1000ms exceeded", "responseTime": 1001 }
  },
  "details": {
    "database": { "status": "up", "responseTime": 12 },
    "queue": { "status": "down", "message": "timeout of 1000ms exceeded", "responseTime": 1001 }
  }
}
```

> warning **Warning** The `timeout` option of the built-in database, microservice, and gRPC indicators (e.g., `this.db.pingCheck('database', {{ '{' }} timeout: 1500 {{ '}' }})`) is deprecated. Chain `.withTimeout()` on the returned attempt instead.

##### Caching

Orchestrators typically poll health checks every few seconds, and some checks are too expensive to run on every request. `cacheFor()` caches the result of an attempt for the given time. While a fresh result exists, the function isn't executed again, and concurrent health checks share a single in-flight execution. The cache is shared across requests and keyed by the indicator key.

```typescript
@@filename(health.controller)
// Within the `HealthController`-class
@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.db.pingCheck('database').withTimeout('1.5s').cacheFor('5s'),
  ]);
}
```

Results served from the cache are marked with `cachedResponse: true`:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up", "responseTime": 12, "cachedResponse": true }
  },
  "error": {},
  "details": {
    "database": { "status": "up", "responseTime": 12, "cachedResponse": true }
  }
}
```

##### Slow checks

A dependency that still answers, but slowly, isn't `'down'`. `degradedAfter()` marks an attempt as `'degraded'` instead of `'up'` if it succeeds but takes the given time or longer. Combine it with `withTimeout()` to decide when slow becomes `'down'`.

```typescript
@@filename(health.controller)
// Within the `HealthController`-class
@Get()
@HealthCheck()
check() {
  return this.health.check([
    // < 200ms: up, 200-1000ms: degraded, > 1000ms: down
    () => this.db.pingCheck('database').degradedAfter('200ms').withTimeout('1s'),
  ]);
}
```

If the database answers after 800 milliseconds, the health check still responds with the status code `200`, but reports the `'degraded'` state (see [Degraded state](#degraded-state)):

```json
{
  "status": "degraded",
  "info": {
    "database": { "status": "degraded", "responseTime": 800 }
  },
  "error": {},
  "details": {
    "database": { "status": "degraded", "responseTime": 800 }
  }
}
```

##### Non-critical checks

Some dependencies aren't required to serve requests. If the `emails` queue is unreachable, for example, emails are sent later, but the application still works. You want to see the problem in the health check, but the orchestrator shouldn't take the application out of rotation. `degradedOnFailure()` marks a failed attempt as `'degraded'` instead of `'down'`. This applies to thrown errors as well as to timeouts. The error message stays in the result.

```typescript
@@filename(health.controller)
// Within the `HealthController`-class
@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.db.pingCheck('database').withTimeout('1.5s'),
    () => this.queueHealthIndicator.isHealthy('queue').degradedOnFailure(),
  ]);
}
```

If the queue doesn't answer in time, the health check responds with the status code `200` and the following result:

```json
{
  "status": "degraded",
  "info": {
    "database": { "status": "up", "responseTime": 12 },
    "queue": { "status": "degraded", "message": "timeout of 1000ms exceeded", "responseTime": 1001 }
  },
  "error": {},
  "details": {
    "database": { "status": "up", "responseTime": 12 },
    "queue": { "status": "degraded", "message": "timeout of 1000ms exceeded", "responseTime": 1001 }
  }
}
```

You can combine both methods on the same attempt. A slow attempt and a failed attempt are then both `'degraded'`; only the failed one has a `message`.

##### Additional data

Three methods add your own data to the result of a check:

- `withData()` adds static data to every result, such as the team that owns a dependency.
- `withSuccessData()` picks data from the value returned by the attempt function, when the check succeeds.
- `withFailureData()` picks data from the error, when the check fails.

```typescript
this.healthIndicatorService
  .check('payments')
  .attempt(() => this.payments.ping())
  .withData({ owner: 'team-billing' })
  .withSuccessData((result) => ({ region: result.region }))
  .withFailureData((error) => ({ code: (error as PaymentError).code }));
```

If the payment service refuses the connection, the result looks like this:

```json
{
  "status": "error",
  "info": {},
  "error": {
    "payments": { "status": "down", "message": "connect ECONNREFUSED 10.0.0.7:443", "owner": "team-billing", "code": "ECONNREFUSED", "responseTime": 4 }
  },
  "details": {
    "payments": { "status": "down", "message": "connect ECONNREFUSED 10.0.0.7:443", "owner": "team-billing", "code": "ECONNREFUSED", "responseTime": 4 }
  }
}
```

`withSuccessData()` and `withFailureData()` accept a sync or async function, or an object. The methods also work on the built-in indicators, for example `this.db.pingCheck('database').withData({{ '{' }} owner: 'team-billing' {{ '}' }})`.

Keep the following in mind when you add data:

- Calls to the same method are merged, and the last one wins.
- The keys `status`, `responseTime`, and `cachedResponse` are reserved by Terminus. In your data, they are ignored and a warning is logged once per indicator.

#### Logging

By default, Terminus logs an error when a health check fails. When a graceful shutdown timeout is configured, it also logs the progress of the shutdown. The `TerminusModule.forRoot()` method gives you more control over how errors are logged, and lets you take over logging entirely.

This section walks you through creating a custom logger, `TerminusLogger`. This logger extends the built-in `ConsoleLogger`,
so you can choose which parts of the logger to override.

> info **Hint** To learn more about custom loggers in Nest, see [injecting a custom logger](/application/logger#injecting-a-custom-logger).


```typescript
@@filename(terminus-logger.service)
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class TerminusLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: any[]): void;
  error(
    message: unknown,
    stack?: unknown,
    context?: unknown,
    ...rest: unknown[]
  ): void {
    // Override how error messages are logged here
  }
}
```

Once you have created your custom logger, pass it to `TerminusModule.forRoot()`:

```typescript
@@filename(health.module)
@Module({
imports: [
  TerminusModule.forRoot({
    logger: TerminusLogger,
  }),
],
})
export class HealthModule {}
```


To suppress all log messages from Terminus, including error messages, set the `logger` option to `false`:

```typescript
@@filename(health.module)
@Module({
imports: [
  TerminusModule.forRoot({
    logger: false,
  }),
],
})
export class HealthModule {}
```



You can also configure how health check errors are displayed in your logs.

| Error Log Style          | Description                                                                                                                        | Example                                                              |
|:------------------|:-----------------------------------------------------------------------------------------------------------------------------------|:---------------------------------------------------------------------|
| `json`  (default) | Prints a summary of the health check result as a JSON object when a check fails                                                    | <figure><img src="/assets/Terminus_Error_Log_Json.png" /></figure>   |
| `pretty`          | Prints a summary of the health check result in formatted boxes when a check fails, highlighting successful and failed results      | <figure><img src="/assets/Terminus_Error_Log_Pretty.png" /></figure> |

To change the log style, use the `errorLogStyle` configuration option:

```typescript
@@filename(health.module)
@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
    }),
  ]
})
export class HealthModule {}
```

#### Graceful shutdown timeout

If your application needs to postpone its shutdown, Terminus can handle it for you with the `gracefulShutdownTimeoutMs` option (in milliseconds, `0` by default).
This setting is particularly useful with an orchestrator such as Kubernetes.
By setting a delay slightly longer than the readiness check interval, you can achieve zero downtime when shutting down containers: as soon as a termination signal is received, the health check reports `'shutting_down'` with a `503` status code, so the orchestrator stops routing new traffic while the application finishes in-flight requests during the delay.

```typescript
@@filename(health.module)
@Module({
  imports: [
    TerminusModule.forRoot({
      gracefulShutdownTimeoutMs: 1000,
    }),
  ]
})
export class HealthModule {}
```

> warning **Warning** The delay is only applied on `SIGTERM`, which is the signal orchestrators such as Kubernetes send when stopping a container. Other signals (e.g. `SIGINT` from `Ctrl+C`) still switch the health check to `'shutting_down'` but shut the application down immediately. Make sure [shutdown hooks](/fundamentals/lifecycle-events#application-shutdown) are enabled; otherwise, Terminus never receives the signal.

#### Swagger documentation

If the `@nestjs/swagger` package is installed, the `@HealthCheck()` decorator documents the endpoint for you. It describes the `200` and the `503` response and registers two schemas that all your health check endpoints share: `TerminusHealthCheckResult` and `TerminusHealthIndicatorResult`.

To turn the documentation off for an endpoint, set the `swaggerDocumentation` option to `false`:

```typescript
@@filename(health.controller)
// Within the `HealthController`-class
@Get()
@HealthCheck({ swaggerDocumentation: false })
check() {
  return this.health.check([]);
}
```

#### Bundling

Terminus loads its optional peer dependencies (for example, `@nestjs/typeorm` or `@nestjs/mongoose`) with `import()`, so that bundlers can include them. If your build keeps `node_modules` external, which is the default of the Nest CLI, you don't need to do anything.

If you bundle your application together with its dependencies, the bundler also looks for the optional peer dependencies that you haven't installed, and the build fails. Mark those packages as external. For example, with esbuild:

```typescript
await build({
  entryPoints: ['dist/main.js'],
  bundle: true,
  platform: 'node',
  external: ['@nestjs/mongoose', '@nestjs/sequelize', '@mikro-orm/core'],
});
```

With webpack or Rspack, use the `externals` option or the `IgnorePlugin`. Rollup, Rolldown, and Vite keep packages they can't resolve external by default.

The `@nestjs/swagger` package is the exception: Terminus loads it with `require()`, which only webpack follows. With other bundlers, keep `@nestjs/swagger` external, or the health check endpoints are missing in the [Swagger documentation](#swagger-documentation). They are also missing in a CommonJS bundle built with esbuild, its default output for `platform: 'node'`, because Terminus can't load the package there.

#### Testing

To test how your application reports a failing dependency, replace the indicator in an [end-to-end test](/fundamentals/testing#end-to-end-testing):

```typescript
const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(QueueHealthIndicator)
  .useValue({
    isHealthy: () => ({ queue: { status: 'down', message: 'queue unreachable' } }),
  })
  .compile();

const app = moduleRef.createNestApplication();
await app.init();

await request(app.getHttpServer()).get('/health').expect(503);
```

> info **Hint** `@nestjs/terminus` is published as ES modules. If your tests run on Jest, see the [migration guide](/migration-guide#testing-stack).

#### Observability

A health check answers one question for the orchestrator: should this instance get traffic? It doesn't tell you which route got slower after the last deploy, or what the instance that failed its readiness probe was busy with. [NestJS Observe](https://www.observe.nestjs.com/?ref=docs-terminus 'NestJS Observe'), our official observability platform, records the rest - requests, jobs, errors, queries, and traces, plus CPU, memory, and event loop delay sampled from inside each instance - and two of its settings work alongside the checks in this chapter.

Probes call the health endpoint every few seconds, and left in, they bury real traffic in the request metrics. Leave them out with the SDK's `http.ignore` option (see [Ignoring noisy operations](/observability/sdk#ignoring-noisy-operations)):

```typescript
@@filename(app.module)
ObserveModule.forRoot({
  // ...
  http: { ignore: ['/health'] },
});
```

A passing liveness check also doesn't mean anything is being served. For an application that runs around the clock, a built-in alert emails you when it goes quiet or its error rate turns unusual, on every plan including the free tier. See the [Observability](/observability/overview) chapter.

#### More examples

The [kitchen sink sample](https://github.com/nestjs/terminus/tree/master/sample/000-kitchen-sink-app) is a small application that combines most of this chapter: a liveness and a readiness check, built-in and custom health indicators, the `'degraded'` state, and tests. It needs no database.

More working examples, one per built-in health indicator, are available in the [Terminus samples directory](https://github.com/nestjs/terminus/tree/master/sample).
