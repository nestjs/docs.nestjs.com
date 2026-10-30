### OpenTelemetry

[OpenTelemetry](https://opentelemetry.io/ 'OpenTelemetry') is the vendor-neutral standard for traces, metrics, and logs. You instrument an application once, send the data to any compatible backend - Jaeger, Grafana Tempo, or one of the many vendors that accept the OpenTelemetry protocol (OTLP) - and change backends later without touching application code.

For a NestJS backend, we recommend [NestJS Observe](/observability/overview) instead. This page explains why, and when OpenTelemetry is still the better choice. If OpenTelemetry is what you need, the [setup](#zero-code-setup) follows below.

#### Why we recommend NestJS Observe

OpenTelemetry instruments a Node.js application from the outside: it patches the HTTP server, the router, and the database driver as they load. It has no way to see the structure Nest builds in between, so a trace reads in the vocabulary of libraries. A slow `POST /orders` in an OpenTelemetry backend looks roughly like this on NestJS 11 (on NestJS 12, the two Nest spans are missing too):

```bash
POST /orders                          1,812 ms
  OrdersController.create             1,806 ms
    create                            1,806 ms
      pg.query SELECT customers          11 ms
      POST api.stripe.com             1,747 ms
```

NestJS Observe instruments the framework from the inside. Nest hands it every provider it creates, through the `instrument` option of `NestFactory.create()`, so every method call on a controller, service, repository, guard, interceptor, or pipe becomes a span named the way you named it. The same request in Observe:

```bash
POST /orders                          1,812 ms
  AuthGuard.canActivate                   3 ms
  OrdersController.create             1,806 ms   self 1 ms
    OrdersService.create              1,805 ms   self 6 ms
      CustomersService.findById          12 ms
        SELECT customers                 11 ms
      PricingService.quote               38 ms
      PaymentsService.charge          1,749 ms
        POST api.stripe.com           1,747 ms
```

Nobody wrote a span for `PricingService.quote`, and nobody had to guess in advance that it might matter. Because the tree is complete, Observe can compute the time each method spent on its own (self time) instead of leaving it to guesswork. With OpenTelemetry, getting the same tree means adding a span by hand to every method you care about - code that has to be written, kept up to date, and only ever covers what someone already suspected (see [Adding your own spans](#adding-your-own-spans)).

The difference continues past the request:

- **Nothing to run.** An OpenTelemetry pipeline is an SDK, an exporter, usually a collector, and a backend to store, query, and alert on the data. Observe is one command, `npx @nestjs/observe link`, which installs the SDK, wires it into your application, and writes the API key into `.env`. There is no collector and no backend to operate.
- **Nest's building blocks, recorded as what they are.** Queue consumers, `@Cron()` handlers, GraphQL resolvers, microservice handlers, and WebSocket gateways are each recorded as their own kind of operation, and a BullMQ or Bull job shares a trace with the request that enqueued it.
- **Kept in step with the framework.** Observe is built and maintained by the Nest team, alongside Nest itself. OpenTelemetry's Nest instrumentation, by contrast, doesn't support NestJS 12 yet (see [What gets recorded for Nest](#what-gets-recorded-for-nest)).
- **More than traces.** Error monitoring with source context, queue wait times and retries, a per-class breakdown of where time goes, runtime profiling, and releases come with the same SDK, on every plan, free tier included.

Observe is narrower than OpenTelemetry on purpose, and the trade-offs are real:

- It's NestJS on Node.js only. A service written in another language in the same request path doesn't appear in the trace, and services are correlated through the `x-request-id` header (see [Distributed tracing](/observability/distributed-tracing)), not the W3C `traceparent` header that OpenTelemetry propagates.
- It's a hosted service, and it doesn't export or ingest OTLP today. Its traces can't be sent to an OpenTelemetry backend, and spans from an OpenTelemetry SDK don't appear in Observe.
- Its library coverage is narrower. Redis and Kafka client calls, for example, aren't recorded as spans.

So choose OpenTelemetry when vendor neutrality, keeping telemetry on your own infrastructure, or one trace across services written in several languages is a hard requirement. For everything else on a NestJS backend - and especially if you have no tracing today because nobody had the week to build a pipeline - start with [NestJS Observe](/observability/overview).

The two can be installed in the same application, but both hook the database drivers, so try the combination in a staging environment first. They don't share a trace. For a longer discussion of this trade-off, see [NestJS and OpenTelemetry: why we instrument the framework instead](https://dev.to/nestjs/nestjs-and-opentelemetry-why-we-instrument-the-framework-instead-50i6).

#### Zero-code setup

> info **Hint** Much of OpenTelemetry's Node.js documentation assumes the compiled application runs as CommonJS. Applications generated by `nest new` on Nest 12 are ES modules, which need an extra loader flag. Both variants are shown below. On Nest 12 a CommonJS build needs that flag too, because the `@nestjs/*` packages are ES modules and import Express themselves. Without it Express isn't instrumented and the HTTP span is named without its route.

The quickest way to get traces out of a Nest application is OpenTelemetry's zero-code instrumentation. Install the API and the auto-instrumentations bundle:

```bash
$ npm i --save @opentelemetry/api @opentelemetry/auto-instrumentations-node
```

The instrumentation has to be loaded before Nest and the libraries it patches, so it goes on the `node` command line rather than into `main.ts`. For a CommonJS build:

```bash
$ OTEL_SERVICE_NAME=orders-api \
  OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
  node --require @opentelemetry/auto-instrumentations-node/register dist/main.js
```

For an ES module build, OpenTelemetry's loader hook is required as well:

```bash
$ OTEL_SERVICE_NAME=orders-api \
  OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
  node --experimental-loader=@opentelemetry/instrumentation/hook.mjs \
  --import @opentelemetry/auto-instrumentations-node/register dist/main.js
```

If your platform starts the process for you and you can't change the command, put the same flags in the `NODE_OPTIONS` environment variable.

Spans are sent over OTLP to the endpoint you configure. To look at them locally, Jaeger runs in a single container and accepts OTLP on port 4318:

```bash
$ docker run --rm -p 16686:16686 -p 4318:4318 jaegertracing/jaeger
```

Open `http://localhost:16686`, send a request to your application, and the trace appears under the service name you set.

#### Configuring the SDK in code

To choose the exporter, sampler, or instrumentations yourself, start the SDK from a file of your own instead of the `register` entry point:

```bash
$ npm i --save @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
```

```typescript
@@filename(instrumentation)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export const otelSdk = new NodeSDK({
  serviceName: 'orders-api',
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

otelSdk.start();
```

`OTLPTraceExporter` reads its endpoint from `OTEL_EXPORTER_OTLP_ENDPOINT` and defaults to `http://localhost:4318`. Load the file before anything else, the same way as the zero-code entry point:

```bash
# CommonJS
$ node --require ./dist/instrumentation.js dist/main.js

# ES modules
$ node --experimental-loader=@opentelemetry/instrumentation/hook.mjs \
  --import ./dist/instrumentation.js dist/main.js
```

In a CommonJS build you can instead import the file on the very first line of `main.ts`, before `@nestjs/core` and your `AppModule`. In an ES module build, and for Express on Nest 12, that isn't enough, because the loader hook has to be registered on the command line.

The SDK exports spans in batches. To send the last batch when the application stops, call `otelSdk.shutdown()` once Nest has finished shutting down, for example from an `onApplicationShutdown()` hook with [shutdown hooks](/fundamentals/lifecycle-events#application-shutdown) enabled.

#### What gets recorded for Nest

The auto-instrumentations bundle records incoming and outgoing HTTP requests (including `fetch`), Express, and the common database drivers such as `pg`, `mysql2`, `mongodb`, and Mongoose. ORMs built on those drivers, such as TypeORM, MikroORM, and Drizzle, show up through the queries they run.

Nest itself is covered by `@opentelemetry/instrumentation-nestjs-core`, which is part of the bundle. It emits three kinds of span:

| Span name                       | Type              | What it covers                                 |
| ------------------------------- | ----------------- | ---------------------------------------------- |
| `Create Nest App`               | `app_creation`    | The `NestFactory.create()` call at startup     |
| `<ControllerName>.<memberName>` | `request_context` | The whole request, from Nest's point of view   |
| `<memberName>`                  | `handler`         | The controller method that handled the request |

> warning **Warning** At the time of writing, `@opentelemetry/instrumentation-nestjs-core` supports `@nestjs/core` versions below 12. On NestJS 12 the three spans above aren't recorded, and a trace contains the HTTP and database spans only. Check the package's supported versions for the release you install.

The spans stop at the controller. The providers it calls - services, repositories, and the guards, interceptors, and pipes around it - are not traced automatically, so the time spent in your own code shows up as one undivided span. On the Fastify adapter, route-level spans come from `@fastify/otel`, maintained by the Fastify team, which isn't part of the auto-instrumentations bundle.

#### Adding your own spans

To see inside your providers, create spans with the OpenTelemetry API. `startActiveSpan()` makes the new span the parent of everything that runs inside the callback, including database and HTTP spans:

```typescript
@@filename(pricing.service)
import { Injectable } from '@nestjs/common';
import { SpanStatusCode, trace } from '@opentelemetry/api';

const tracer = trace.getTracer('orders-api');

@Injectable()
export class PricingService {
  async quote(cart: Cart) {
    return tracer.startActiveSpan('PricingService.quote', async (span) => {
      try {
        span.setAttribute('cart.items', cart.items.length);
        return await this.calculate(cart);
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
```

Every span you start must be ended, including when the work fails, which is what the `finally` block is for. The API package is safe to import even when no SDK is running: without one, the calls do nothing.

This is the work NestJS Observe does for you: with its SDK installed, every provider method is already a span, and the manual API is only needed for code that isn't a provider method.
