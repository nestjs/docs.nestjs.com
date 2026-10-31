### OpenTelemetry

[OpenTelemetry](https://opentelemetry.io/ 'OpenTelemetry') is the vendor-neutral standard for traces, metrics, and logs. You instrument an application once, send the data to any compatible backend - Jaeger, Grafana Tempo, or one of the many vendors that accept the OpenTelemetry protocol (OTLP) - and change backends later without touching application code.

On a NestJS backend, you don't have to choose between it and [NestJS Observe](/observability/overview): Observe works on its own, or beside the OpenTelemetry you already have. This page shows what each records for a Nest application, how to [run the two together](#running-beside-opentelemetry), and how to [set OpenTelemetry up](#zero-code-setup) in one.

#### What NestJS Observe adds

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

OpenTelemetry covers ground that Observe deliberately doesn't:

- It's NestJS on Node.js only. A service written in another language in the same request path doesn't appear in Observe. By default, services are correlated through the `x-request-id` header (see [Distributed tracing](/observability/distributed-tracing)). To take part in the traces OpenTelemetry propagates in the W3C `traceparent` header, turn on the [`openTelemetry` option](#running-beside-opentelemetry).
- It's a hosted service, and it doesn't export or ingest OTLP today. Its traces can't be sent to an OpenTelemetry backend, and spans from an OpenTelemetry SDK don't appear in Observe.
- Its library coverage is narrower. Redis and Kafka client calls, for example, aren't recorded as spans.

So the two fit together. OpenTelemetry is the foundation when vendor neutrality, keeping telemetry on your own infrastructure, or every service's spans in one backend is a requirement. NestJS Observe gives your Nest services the framework-level view: on its own, or [beside OpenTelemetry](#running-beside-opentelemetry), in the same traces as the rest of your system.

For the reasoning behind instrumenting the framework itself, see [NestJS and OpenTelemetry: why we instrument the framework instead](https://dev.to/nestjs/nestjs-and-opentelemetry-why-we-instrument-the-framework-instead-50i6).

#### Running beside OpenTelemetry

NestJS Observe can cover the Nest services in a system that otherwise runs OpenTelemetry, and it can run in a Nest application next to the OpenTelemetry SDK. For either, turn on the `openTelemetry` option:

```typescript
ObserveModule.forRoot({
  // ...
  openTelemetry: true,
});
```

With it on:

- **A request in a W3C trace keeps that trace's id.** When a request arrives with a `traceparent` header - from a service instrumented with OpenTelemetry, in any language, or from a mesh or load balancer that traces - Observe reports it under that trace id, so it has the id the rest of the trace has in your OpenTelemetry backend. An `x-request-id` header is kept only when it names the same trace, which is what another service running Observe sends. An unrelated one, such as the id Envoy and Istio stamp on every request, gives way.
- **Calls out of the service carry the trace on.** Each outbound call sends a `traceparent` beside `x-request-id`, with the call's own span as the parent, and passes on the caller's `tracestate` and sampling decision, so the next service's spans nest under the call. This covers `fetch` and `undici` on every supported Node.js version, and clients built on `node:http` on Node.js 22.12 and later.
- **An OpenTelemetry SDK in the same process sets the trace.** Observe reports each request under the trace id of the span the SDK opened for it, including a request that starts a trace, and leaves `traceparent` on outbound calls to the SDK. A request then has one trace id in both tools, and every call carries exactly one `traceparent`. The SDK keeps recording its spans, and Observe adds the provider-level ones. If the SDK propagates B3 instead of W3C Trace Context, Observe follows its trace all the same, and adds a `traceparent` in that trace beside the B3 headers.

The trace id is shared, the spans are not. Observe doesn't export its spans over OTLP or ingest spans from an OpenTelemetry SDK, so your OpenTelemetry backend shows the other services' part of a trace, and Observe shows the Nest service's. Observe writes a W3C trace id as a UUID: `4bf92f3577b34da6a3ce929d0e0e4736` in Jaeger or Tempo is `4bf92f35-77b3-4da6-a3ce-929d0e0e4736` in Observe. The option covers HTTP; microservice transports, gRPC, and queue jobs carry the trace id as described in [Distributed tracing](/observability/distributed-tracing). Without the option, Observe reads and sends `x-request-id` alone, and leaves any OpenTelemetry SDK in the process alone.

> info **Hint** The option works only while the SDK is reporting to NestJS Observe. It turns on with the first batch the collector accepts after the application starts, and pauses, with a line in the log, while the collector refuses the application's credentials, after a minute in which no batch got through, or while the SDK's worker is down. Requests handled in between are traced as with the option off. With `enabled: false`, or without credentials, it never turns on.

> warning **Warning** NestJS Observe and the OpenTelemetry SDK both hook the database drivers. The combination is tested with `pg`; try it with the drivers you use in a staging environment before production.

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
