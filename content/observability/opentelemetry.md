### OpenTelemetry

[OpenTelemetry](https://opentelemetry.io/ 'OpenTelemetry') is the vendor-neutral standard for traces, metrics, and logs. You instrument an application once, send the data to any compatible backend - Jaeger, Grafana Tempo, or one of the many vendors that accept the OpenTelemetry protocol (OTLP) - and change backends later without touching application code.

For the Nest services in your system, whether that's all of your backend or part of it, you don't have to choose between it and [NestJS Observe](/observability/overview): Observe works on its own, or beside the OpenTelemetry you already have, and services written in other languages share its traces through OpenTelemetry. This page shows what each records for a Nest application, how to [run the two together](#running-beside-opentelemetry), and how to [set OpenTelemetry up](#zero-code-setup) in one.

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

- It instruments NestJS on Node.js only. Services written in other languages share its traces through OpenTelemetry: with the [`openTelemetry` option](#running-beside-opentelemetry), a Nest service joins the W3C traces they propagate in the `traceparent` header, and with [OTLP export](#exporting-spans-over-otlp) its spans land in the backend that holds theirs. Without the option, services are correlated through the `x-request-id` header (see [Distributed tracing](/observability/distributed-tracing)).
- It's a hosted service, and it doesn't ingest OTLP: spans from an OpenTelemetry SDK don't appear in Observe. It can export its own spans to your OpenTelemetry backend over OTLP, beside what it sends to Observe (see [Exporting spans over OTLP](#exporting-spans-over-otlp)).
- Its library instrumentation records a client wherever it's called. Observe instruments database drivers and HTTP clients that way, and other clients as providers: a Redis or Kafka client registered as one, as it almost always is in a Nest application, gets a span for each call, but a client created outside dependency injection isn't recorded.

So the two fit together. OpenTelemetry is the foundation when vendor neutrality, keeping telemetry on your own infrastructure, or every service's spans in one backend is a requirement. NestJS Observe gives your Nest services the framework-level view: on its own, or [beside OpenTelemetry](#running-beside-opentelemetry), in the same traces as the rest of your system.

For the full reasoning, see [NestJS and OpenTelemetry: why we instrument the framework itself](https://dev.to/nestjs/nestjs-and-opentelemetry-why-we-instrument-the-framework-instead-50i6).

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
- **Queue jobs and microservice messages stay in the request's trace in both tools.** From `@nestjs/observe` 0.3.23, a BullMQ or Bull job added while a request is handled, and a message sent through a client registered with `ClientsModule` over a transport that carries the trace id (TCP and Redis on `@nestjs/microservices` 12.0.4 or later; NATS, Kafka, RabbitMQ, MQTT 5, and gRPC on 12.3.3 or later), carry the request's W3C trace context beside its trace id. A consumer instrumented with OpenTelemetry, in any language, continues the trace from it. In a Nest service that runs the OpenTelemetry SDK, Observe hands the context to the SDK, which has no instrumentation for BullMQ or for Nest's TCP and Redis transports: the SDK's spans in the job or the handler, and the `traceparent` on the calls they make, belong to the request's trace, as the job and the handler do in Observe. Where an instrumentation does carry the trace - BullMQ's own [`bullmq-otel`](https://www.npmjs.com/package/bullmq-otel) add-on, or the SDK's gRPC instrumentation - the job's or the handler's spans nest under the span it opens for them (with `bullmq-otel`, from `@nestjs/observe` 0.3.24).

The trace id is shared. With [OTLP export](#exporting-spans-over-otlp) on, the Nest service's spans are too: your OpenTelemetry backend shows the whole trace, and Observe shows the Nest service's part. Without it, the backend shows the other services' part of a trace, and Observe the Nest service's. Observe writes a W3C trace id as a UUID, and either form works in Observe: `4bf92f3577b34da6a3ce929d0e0e4736` from Jaeger or Tempo finds the same trace as `4bf92f35-77b3-4da6-a3ce-929d0e0e4736`.

Without the option, Observe reads and sends `x-request-id` alone, and leaves any OpenTelemetry SDK in the process alone. Jobs and messages still stay in the trace in Observe: a BullMQ or Bull job added while a request is handled runs under that request's trace id, whether its worker runs in the same process or in another service, and so does a message sent over a microservice transport that carries the trace id on its own ([Distributed tracing](/observability/distributed-tracing) shows which transports do, from which version).

> info **Hint** The option works beside reporting to NestJS Observe. From `@nestjs/observe` 0.3.24, it's on from the moment the application starts, so a new instance's first requests stay in the traces around it; before 0.3.24, it turned on with the first batch the collector accepted. It stays on through outages and rate limits at the collector, so an outage at Observe doesn't split the traces running through your other services. It pauses, with a line in the log, only while the collector refuses the application's credentials or the SDK's worker is down. Requests handled in between are traced as with the option off. With `enabled: false`, or without credentials, it never turns on.

> warning **Warning** NestJS Observe and the OpenTelemetry SDK both hook the database drivers. The combination is tested with `pg`; try it with the drivers you use in a staging environment before production.

#### Exporting spans over OTLP

From `@nestjs/observe` 0.3.23, with the `openTelemetry` option on, Observe can also export the spans it records to your OpenTelemetry backend over OTLP/HTTP - an OpenTelemetry Collector, Jaeger, Grafana Tempo, or any vendor that accepts OTLP. The Nest service's part of a trace, down to the provider methods, then sits in the same waterfall as the services around it. Point the `otlp` option at the backend's OTLP/HTTP endpoint:

```typescript
ObserveModule.forRoot({
  // ...
  openTelemetry: true,
  otlp: {
    endpoint: 'http://localhost:4318',
  },
});
```

`otlp: true` reads the endpoint, headers, protocol, and service name from the standard `OTEL_EXPORTER_OTLP_*`, `OTEL_SERVICE_NAME`, and `OTEL_RESOURCE_ATTRIBUTES` variables instead; those variables never turn export on by themselves. The default encoding is `http/protobuf`, and `protocol: 'http/json'` switches to JSON. gRPC isn't supported, so point the endpoint at the backend's HTTP port, 4318 by convention.

Each request becomes a server span, under the caller's span when it arrived in a trace, and each queue job a consumer span. The controller, provider, and manual spans under it become internal spans, and database queries and outbound calls client spans; an outbound call's span is the parent of what the next service exports. Errors are recorded as the span's status and an `exception` event, redacted as they are for Observe. A request whose caller sampled its trace out isn't exported.

Export runs beside reporting to NestJS Observe, never instead of it, and every plan includes it:

- **Paid plans** export every trace the SDK records, whatever Observe then keeps of its own copy.
- **Free** exports what Observe keeps. Once your applications send 30,000 events in one UTC day, or the month's allowance is used, most waterfalls are paused, and the requests and jobs behind them are exported without the spans under them. Server errors, failed jobs, and anything over 1 s keep their full traces. While the collector can't be reached, what Observe keeps can't be known, so Free's export pauses a few minutes into the outage and resumes with the next batch the collector accepts.

> info **Hint** Export starts with the first batch the collector accepts, whose reply says what the application's plan includes, and the log says when it turns on. It pauses whenever the `openTelemetry` option does. Without the `openTelemetry` option, or without credentials, nothing is exported, and the SDK says why at startup.

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
