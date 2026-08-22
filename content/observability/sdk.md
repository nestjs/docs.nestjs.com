### SDK

The `@nestjs/observe` SDK is what gets your application's requests, jobs, errors, logs, and traces into your [NestJS Observe](https://www.observe.nestjs.com/ 'NestJS Observe') dashboard. It hooks into Nest's own request lifecycle - controllers, interceptors, resolvers, queue consumers - rather than bolting a generic Node.js agent onto the process, so most of what shows up in the dashboard needs no manual span wiring.

#### Installation

```bash
$ npm i @nestjs/observe
```

> warning **Warning** The SDK requires `@nestjs/core` v11.1.4 or later (it relies on the `instrument` application option introduced in that release), and `@nestjs/graphql` v13.4.4 or later if your application uses GraphQL. Earlier versions lack the hooks the SDK needs for proper instrumentation.

#### Quick start

The integration is three steps. First, call `createObserveModule()` once, typically in `app.module.ts` or another root-level file. It returns a matched pair - a Nest module and an `instrument` hook - bound to the same configuration:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY,
      appSecret: process.env.OBSERVE_APP_SECRET,
      serviceId: 'cats-app',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Second, import `ObserveModule.forRoot()` into your root module with at least a `serviceId` (shown above). Third, pass `ObserveInstrument` to `NestFactory.create()` so the SDK can attach to the application before it starts handling traffic:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

That's the whole integration. Once the application receives traffic, requests, errors, and traces start appearing in your project's dashboard within moments - no exporter to configure, no schema to design. The same `instrument` option is accepted by `NestFactory.createMicroservice()` and `NestFactory.createApplicationContext()`, so workers and standalone applications are instrumented the same way.

> info **Hint** `createObserveModule()` itself takes an options object that controls how trace ids are generated and how error source context is captured - see [Trace correlation](#trace-correlation) and [Error source context](#error-source-context) below. Everything else is configured through `ObserveModule.forRoot()`.

#### Authenticating and identifying the application

```typescript
ObserveModule.forRoot({
  appKey: process.env.OBSERVE_APP_KEY,
  appSecret: process.env.OBSERVE_APP_SECRET,
  serviceId: 'cats-app',
  serviceVersion: process.env.GIT_SHA,
});
```

| Option           | Type     | Default  | Description                                                                                                                                                                                                |
| ---------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appKey`         | `string` | -        | Generated from your project's **API Keys** page - see [First project](/observability/overview#first-project). Keep it out of source control.                                                              |
| `appSecret`      | `string` | -        | Issued alongside `appKey` from the same page. Keep it out of source control.                                                                                                                               |
| `serviceId`      | `string` | required | Identifies this application in your dashboard. If you run multiple instances of the same service, use something unique per instance (hostname, container id) so they're distinguishable in the Profiler. |
| `serviceVersion` | `string` | -        | Identifies the deployment - a semantic version, a commit hash, or any other identifier. Every request and job records the version that served it, which is what powers the **Releases** view.              |

Passing a `serviceVersion` is optional but strongly recommended: it is what lets the dashboard compare each version of an application against the one before it (error rate, latency, throughput side by side), so a regression introduced by a deploy is visible immediately rather than buried in a week-long chart.

<figure><img src="https://www.observe.nestjs.com/docs/sdk/deployments.png" alt="Releases" /></figure>

#### Asynchronous configuration

When the credentials come from a configuration provider rather than `process.env` directly, use `forRootAsync()` - it accepts the same `useFactory`/`inject`, `useClass`, and `useExisting` shapes as every other Nest dynamic module (a class implements `ObserveOptionsFactory` with a `createObserveOptions()` method), plus `extraProviders` and `global`:

```typescript
@@filename(app.module)
ObserveModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    appKey: config.getOrThrow('OBSERVE_APP_KEY'),
    appSecret: config.getOrThrow('OBSERVE_APP_SECRET'),
    serviceId: config.get('SERVICE_ID', 'cats-app'),
    serviceVersion: config.get('GIT_SHA'),
  }),
});
```

#### Associating users with telemetry

`getUserId` reads the incoming request and returns whatever identifier your system uses for a person - a user id, an account id, a tenant-scoped id. Set it once and the **Users** view populates automatically:

```typescript
ObserveModule.forRoot({
  // ...
  http: {
    getUserId: (req) => req.user?.id ?? 'anonymous',
  },
});
```

The same option exists on `rpc` (receiving the transport id and the `BaseRpcContext`), `grpc` (receiving the call object), and `graphql` (receiving the GraphQL context, for operations with no enclosing HTTP request), reading the transport's own context instead of an HTTP request. Reporting a user identifier is entirely optional - traffic without one still shows up everywhere except the per-user views. The dashboard treats the identifier as an opaque string and never tries to resolve it into a name or an email, so prefer an opaque internal id over anything personally identifying.

#### Runtime metrics and profiling

```typescript
ObserveModule.forRoot({
  // ...
  runtimeMetrics: true,
  runtimeMetricsInterval: 60000,
});
```

`runtimeMetrics` (default `true`) samples memory, CPU, garbage collection, and event loop latency on an interval (`runtimeMetricsInterval`, default `60000` ms) and feeds the **Profiler**. The same samples double as the application's heartbeat: a **Telemetry silence** alert fires when they stop arriving, which gives you lightweight uptime monitoring with no external probe.

#### Logs

```typescript
ObserveModule.forRoot({
  // ...
  forwardLogs: true,
  redaction: {
    enabled: true,
    keys: ['internalToken'],
    patterns: [/acct_[a-z0-9]{16}/gi],
  },
});
```

`forwardLogs` (default `false`) sends your application's log lines - anything written through Nest's `Logger` - to the dashboard, correlated to the trace that was active when each line was written. On an execution page, every line is placed on the trace's clock next to the span that was in flight when it was written. Log forwarding is available on Pro and above.

Turning `forwardLogs` on moves your log lines onto infrastructure you don't control, so redaction is on by default the moment it is:

| `redaction` field    | Type       | Default        | Description                                                                                                                                                                                                                                                              |
| -------------------- | ---------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`            | `boolean`  | `true`         | Whether log lines are scrubbed at all.                                                                                                                                                                                                                                   |
| `useDefaultPatterns` | `boolean`  | `true`         | Applies the built-in patterns: bearer tokens, JWTs, AWS key ids, PEM private keys, `key=value` secrets, and Luhn-valid card numbers. Disable only if you're replacing them wholesale with your own `patterns` - there's no supported case for forwarding logs unredacted. |
| `patterns`           | `RegExp[]` | -              | Extra patterns to mask, for secrets shaped in a way only your codebase knows - internal token prefixes, customer identifiers. Always applied as if global, so a match is never limited to the first occurrence in a line.                                                |
| `keys`               | `string[]` | -              | Extra attribute keys whose values are masked outright, on top of the built-in list. Compared case-insensitively and ignoring `-`/`_`, so `apiKey`, `api_key`, and `API-KEY` are one entry.                                                                               |
| `replacement`        | `string`   | `'[REDACTED]'` | Text substituted for anything matched.                                                                                                                                                                                                                                   |

> info **Hint** Even with `forwardLogs` off, the SDK augments `ConsoleLogger` so that every line carries the current trace id (`attachTraceIdToLogs`, see [Trace correlation](#trace-correlation)). That lets you correlate your own log aggregator with traces in the dashboard without shipping the log content anywhere.

#### Error source context

Errors that propagate out of a controller, resolver, job, or span are captured automatically. When `sourceContext` is enabled (the default), the SDK additionally reads the source lines around each in-app stack frame of a captured error and attaches them, which is what lets the dashboard show the failing code alongside the stack trace - for a failure that happened in production, on a build you may not have checked out.

```typescript
@@filename(app.module)
export const { ObserveModule, ObserveInstrument } = createObserveModule({
  sourceContext: {
    linesOfContext: 5,
    maxFrames: 5,
    sourceMaps: false,
  },
});
```

Note that this is an option of `createObserveModule()`, not `forRoot()`. Set `sourceContext: false` to disable it outright, or pass an object to tune the defaults:

| Option           | Type      | Default | Description                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `linesOfContext` | `number`  | `5`     | Lines read on either side of the frame's line.                                                                                                                                                                                                                                                                                                                                  |
| `maxFrames`      | `number`  | `5`     | How many in-app frames, counted from the top of the stack, get source attached - bounds the payload on deep stacks.                                                                                                                                                                                                                                                             |
| `sourceMaps`     | `boolean` | `false` | Resolves compiled frames back through source maps before reading source. Only needed if the process runs compiled output _without_ Node's own source map support (`--enable-source-maps` or `process.setSourceMapsEnabled(true)`); with that on, frames already carry original positions and this is redundant. Costs a map parse per compiled file on first touch, cached after. |

> warning **Warning** Enabling this ships fragments of your application's source code (usually just a few lines surrounding the error) to your dashboard, stored alongside the error. Frames inside `node_modules` and Node internals are never read - only application source - but turn it off if shipping any source is not acceptable for your codebase.

<figure><img src="https://www.observe.nestjs.com/docs/telemetry/error-with-source.png" alt="Error card with source context" /></figure>

#### Trace correlation

These are also options of `createObserveModule()` - they shape how requests get a trace id and how that id shows up in your own logs:

```typescript
@@filename(app.module)
import { randomUUID } from 'node:crypto';

export const { ObserveModule, ObserveInstrument } = createObserveModule({
  traceIdKey: 'traceId',
  traceIdGenerator: (req) => req.headers['x-request-id'] ?? randomUUID(),
  attachTraceIdToLogs: true,
});
```

| Option                | Type                       | Default                                                       | Description                                                                                                                         |
| --------------------- | -------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `traceIdKey`          | `string`                   | `'traceId'`                                                   | The key used to store the trace id in the request context, for later retrieval through `TracerService`.                            |
| `traceIdGenerator`    | `(req: unknown) => string` | Uses the `x-request-id` header if present, else a random UUID | Generates the trace id per request. Called with the request object for HTTP; for other protocols it receives the transport context. |
| `attachTraceIdToLogs` | `boolean`                  | `true`                                                        | Augments `ConsoleLogger` to include the trace id in log messages, so logs can be correlated with traces even without `forwardLogs`. |

Because the default generator adopts an incoming `x-request-id`, a chain of HTTP services already shares one trace with no extra configuration. Propagating across gRPC, `@nestjs/microservices` transports, and GraphQL takes a few lines - see [Distributed tracing](/observability/distributed-tracing).

#### Tags and custom attributes

`http`, `rpc`, `grpc`, `graphql`, and `jobs` each accept the same two options for attaching your own data to every request they cover:

| Option          | Applies                                                       | Description                                                                         |
| --------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `tags`          | The same static `Record<string, string>` to every request     | Good for constants that don't vary per call - `project`, `env`, `region`.           |
| `setAttributes` | A function of the request/call/job, returning key-value pairs | Good for anything that varies per call - a feature flag, a tenant id, a queue name. |

```typescript
ObserveModule.forRoot({
  // ...
  http: {
    tags: { project: 'cats-app', env: process.env.NODE_ENV ?? 'development' },
    setAttributes: (req) => ({
      'user-agent': req.headers['user-agent'],
      'client-ip': req.ip,
    }),
  },
  jobs: {
    setAttributes: (job) => ({ queueName: job.queueName, jobName: job.name }),
  },
});
```

Both show up as tags on the resulting request, job, or span, and are searchable and visible on its detail page. The function receives whatever the transport has: the request for `http`, the transport id and `BaseRpcContext` for `rpc`, the call object for `grpc`, the resolve info and GraphQL context for `graphql`, and `{{ '{' }} queueName, name, id {{ '}' }}` for `jobs`. To tag a single span from inside your code rather than every request, use `TracerService` - see [Manual instrumentation](/observability/manual-instrumentation).

> info **Hint** A GraphQL server is usually an HTTP endpoint, so its requests are already subject to the `http` options - `http.ignore` drops a request before the GraphQL layer sees it, and `http.getUserId` supplies the user for queries over HTTP. The `graphql` block tunes what happens _inside_ a request that was let through, per operation rather than per resolver, and `graphql.getUserId` is only consulted for operations that aren't already inside an HTTP trace - subscriptions over a WebSocket in particular.

#### Ignoring noisy operations

Every transport block has an `ignore` option that skips instrumentation entirely for calls that match - a health check endpoint, an internal probe, anything not worth a trace:

```typescript
ObserveModule.forRoot({
  // ...
  http: {
    ignore: ['/health', { method: 'GET', path: /^\/internal\// }],
  },
  rpc: {
    ignore: (transportId, ctx) =>
      ctx instanceof TcpContext && ctx.getPattern() === 'ping',
  },
  grpc: {
    ignore: (call) => call.getPath().endsWith('/Health/Check'),
  },
  graphql: {
    ignore: (info) => info.fieldName === 'healthcheck',
  },
});
```

`http.ignore` accepts an array of paths, `{{ '{' }} method, path {{ '}' }}` pairs (`path` can be a string or a `RegExp`), and plain `RegExp`s - or a single predicate function over the request. `rpc.ignore`, `grpc.ignore`, and `graphql.ignore` are predicates over the transport's own context (the `@nestjs/microservices` transport id and `BaseRpcContext`, the gRPC call object, and the GraphQL resolve info respectively). Matching a GraphQL field name skips the whole operation that field leads, not just that field - an operation is measured end to end, so it is traced or it is not.

This stops telemetry from being generated at all, which is a different tool from the dashboard's spend-control drop filters - those discard already-generated events at ingestion to save on billed volume. `ignore` is the right choice when you don't want a trace to exist; drop filters are the right choice when you want to tune cost on data the SDK is already producing.

`http` additionally takes `queryParamsObfuscateRegex`, a `RegExp` for masking sensitive query string values before they're sent. It is applied on top of the built-in redaction, which always masks well-known sensitive parameters (`token`, `password`, `code`, `signature`, and so on) whether or not this is set.

#### Trace sampling and batching

```typescript
ObserveModule.forRoot({
  // ...
  tracesSampleRate: 0.25,
  maxTracesPerBatch: 1000,
  flushInterval: 5000,
});
```

| Option              | Type                                                                       | Default | Description                                                                                               |
| ------------------- | -------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `tracesSampleRate`  | `number \| ((protocol: 'http' \| 'rpc' \| 'grpc' \| 'graphql', attributes) => boolean)` | `1.0`   | Fraction of traces sent, or a predicate for per-trace decisions. `1.0` sends everything; `0.1` sends 10%. |
| `maxTracesPerBatch` | `number`                                                                   | `1000`  | Caps how many traces go out per batch, to bound volume on high-traffic applications.                      |
| `flushInterval`     | `number` (ms)                                                              | `5000`  | How often the SDK batches and sends collected traces.                                                     |

Telemetry is buffered in the process and shipped on the flush interval rather than inline with each request. Sampling here decides what the SDK _produces_; the dashboard's per-project spend controls (span sampling, rate caps, drop filters) act on what it already sent, and can be changed without a redeploy.

#### Collector endpoint

```typescript
ObserveModule.forRoot({ endpoint: 'https://observe-api.nestjs.com' });
```

`endpoint` (default `'https://observe-api.nestjs.com'`) is the base URL of the collector, used for telemetry and profiles both so the two can never point at different places. Set the `OBSERVE_ENDPOINT` environment variable to override it without touching the config - which is how a local or self-hosted collector is usually pointed at.

#### Debugging the SDK itself

```typescript
ObserveModule.forRoot({ debug: true });
```

`debug` (default `false`) logs additional diagnostic information from the SDK to the console - useful while getting instrumentation working, not something to leave on in production.

#### Full configuration reference

Everything at a glance. Options under `createObserveModule()` must be set there; everything else goes to `forRoot()`/`forRootAsync()`.

| Where                   | Option                                | Purpose                                                                   |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| `createObserveModule()` | `sourceContext`                       | Attach source lines to error stack frames                                 |
| `createObserveModule()` | `traceIdKey`                          | Context key the trace id is stored under                                  |
| `createObserveModule()` | `traceIdGenerator`                    | How each request obtains its trace id                                     |
| `createObserveModule()` | `attachTraceIdToLogs`                 | Prefix `ConsoleLogger` output with the trace id                           |
| `forRoot()`             | `appKey`, `appSecret`                 | Project API key pair                                                      |
| `forRoot()`             | `endpoint`                            | Collector base URL (or `OBSERVE_ENDPOINT`)                                |
| `forRoot()`             | `serviceId`, `serviceVersion`         | Application and release identity                                          |
| `forRoot()`             | `http`, `rpc`, `grpc`, `graphql`, `jobs` | Per-transport `tags`, `setAttributes`, `getUserId`, `ignore`           |
| `forRoot()`             | `http.queryParamsObfuscateRegex`      | Mask sensitive query string values                                        |
| `forRoot()`             | `runtimeMetrics`, `runtimeMetricsInterval` | Profiler samples and heartbeat                                       |
| `forRoot()`             | `forwardLogs`, `redaction`            | Logs streaming and scrubbing                                              |
| `forRoot()`             | `tracesSampleRate`                    | Fraction (or predicate) of traces to send                                 |
| `forRoot()`             | `maxTracesPerBatch`, `flushInterval`  | Batching                                                                  |
| `forRoot()`             | `debug`                               | SDK diagnostics                                                           |

#### Where to go next

- [Manual instrumentation](/observability/manual-instrumentation) - add your own spans, capture handled errors, attach request-scoped attributes, and report custom metrics.
- [Distributed tracing](/observability/distributed-tracing) - keep one trace across HTTP, gRPC, microservice transports, and GraphQL.
- [Dashboard](/observability/dashboard) - what shows up once the SDK is running, and how the views relate to each other.
