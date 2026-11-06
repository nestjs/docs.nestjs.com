### Choosing an APM

There's no single best APM for every NestJS application: the right one depends on how much of your system is Nest, what you already run, and what you need to see besides the application itself. This chapter puts the tools people reach for side by side - [NestJS Observe](/observability/overview), OpenTelemetry, Sentry, Datadog, New Relic and Elastic APM - with the setup each one needs in a Nest application, what it can see of Nest once it's there, and when each one is the right call.

#### The short answer

- **NestJS Observe** for the NestJS services in your system, whether that's all of your backend or part of it: traces in your own vocabulary (`OrdersService.create`, not `express.middleware`) without running anything, joined through OpenTelemetry to the traces of services written in other languages.
- **OpenTelemetry** for the services that aren't Nest, or if you want one vendor-neutral standard across every service, Nest ones included.
- **Sentry** if errors across a web or mobile frontend and a backend are the main concern.
- **Datadog or New Relic** if you want one platform for several languages and real infrastructure, and have the people to run it.
- **Elastic APM** if you already run the Elastic Stack, or the data has to stay on infrastructure you control.

They aren't exclusive: NestJS Observe works on its own, or beside the OpenTelemetry or platform APM you already have (see [Using more than one](#using-more-than-one)).

#### What every APM needs from a Nest application

Most APM agents work by patching libraries as they load: the HTTP server, the router, the database driver. So the agent has to start before your application imports any of them, which in a Nest application means before `@nestjs/core` and before your `AppModule`.

There are two ways to get there: a preload flag on the `node` command (`--require` for CommonJS, `--import` plus a loader hook for ES modules), or an instrumentation file imported on the first line of `main.ts`. Starting an agent from inside a Nest module is fragile: by then Nest and some of the libraries the agent patches may already be loaded, and whatever loaded first goes unrecorded. Every vendor below says the same thing in its documentation: start it first.

The module format matters more than it used to. Up to Nest 11, `nest new` generated a CommonJS project. Nest 12's `nest new` generates ES modules, and for most agents ES modules mean an extra loader flag, sometimes with fewer libraries instrumented. Both command lines are given below where the vendor documents them.

#### NestJS Observe

NestJS Observe is the observability platform built for Nest specifically, by the NestJS team. One command, run in your project, sets it up:

```bash
$ npx @nestjs/observe link
```

It prints a code that you approve in the dashboard (signing up first if you need to), then installs `@nestjs/observe`, registers `ObserveModule` in your root module, passes the `instrument` option to `NestFactory.create()`, and writes the API key into `.env`. Doing it by hand is the same three edits - see [Linking from the terminal](/observability/sdk#linking-from-the-terminal) and the [Quick start](/observability/sdk#quick-start). There's no preload flag: Nest hands the SDK every provider it creates through the `instrument` hook, so your own classes don't depend on load order, and the setup is the same for CommonJS and ES modules.

**What it sees of Nest:** every provider. Each method call on a controller, service, repository, guard, interceptor or pipe during a request, job or message becomes a span named the way you named it, so `PricingService.quote` is in the trace without anybody adding it. Queue consumers, `@Cron()` handlers, GraphQL resolvers and WebSocket gateways are recorded as what they are, and a BullMQ or Bull job shares a trace with the request that enqueued it. Queries through `pg`, `mysql2`, `mssql` and `mongodb` (so TypeORM, Drizzle, MikroORM, Mongoose and Prisma's `pg` and SQL Server adapters) and outbound HTTP calls show up under the method that made them.

**Where it's narrower than the rest:** it instruments NestJS on Node.js only. Services in other languages share its traces through OpenTelemetry (see [Using more than one](#using-more-than-one)), but their spans stay in your OpenTelemetry backend, since Observe doesn't ingest OTLP. It's hosted only, and it doesn't monitor infrastructure beyond each Node.js process's own runtime. Driver-level query detail covers `pg`, `mysql2`, `mssql` and `mongodb`; Redis and Kafka clients show up as spans when they're registered as Nest providers (the usual setup), and cloud SDK calls show up as the HTTP requests they make. It needs `@nestjs/core` 11.1.4 or later and Node.js 20.19 or later, with Express or Fastify.

Pick it for your NestJS services, all of your backend or some of it, when the question you keep asking is which of your own classes is slow. The Free plan needs no payment details, and the [live demo](https://www.observe-demo.nestjs.com/dashboard 'NestJS Observe live demo') shows the dashboard over a busy service's data with no signup.

#### OpenTelemetry

[OpenTelemetry](https://opentelemetry.io/ 'OpenTelemetry') is the vendor-neutral standard: you instrument once and send traces, metrics and logs to any backend that accepts OTLP - Jaeger, Grafana Tempo, or one of the many vendors that ingest it, Datadog, New Relic and Elastic among them. Setting it up in a Nest application is covered in [OpenTelemetry → Zero-code setup](/observability/opentelemetry#zero-code-setup).

**What it sees of Nest:** the HTTP server, the router, outbound calls and a wide range of drivers, through the Node.js auto-instrumentations. Its Nest instrumentation, `@opentelemetry/instrumentation-nestjs-core`, adds three kinds of span on NestJS 11 and earlier - application creation, the request context named `Controller.method`, and the route handler - and nothing for the providers underneath. Its current release (0.71.0) supports `@nestjs/core` below 12, so on NestJS 12 it adds no Nest spans at all.

Pick it for the services that aren't Nest, when you want to choose (and change) the backend yourself, or when the data has to stay on infrastructure you run. In a system with both, NestJS Observe joins its traces and can export the Nest services' spans to the same backend.

#### Sentry

Sentry is an error tracker first, with performance tracing built in. It has an official Nest SDK:

```typescript
@@filename(instrument)
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

```typescript
@@filename(main)
// This import comes before everything else
import './instrument';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
```

Then add `SentryModule.forRoot()` from `@sentry/nestjs/setup` to your root module's imports and, if you don't already have a catch-all exception filter, register `SentryGlobalFilter` as an `APP_FILTER` ahead of any other filters.

**What it sees of Nest:** more than any of the generic agents. Sentry's SDK creates spans for Nest's request pipeline - middleware, guards, pipes, interceptors, filters and route handlers, as long as they're `@Injectable()` - on top of HTTP and the common database drivers. Your service layer is still yours to instrument.

Pick it when errors are the main concern, especially across a web or mobile frontend and a backend. Sentry can also be self-hosted.

#### Datadog

Datadog's tracer, `dd-trace`, sends traces to a Datadog Agent you run next to your application, which forwards them on:

```bash
$ npm i dd-trace
$ DD_SERVICE=orders-api DD_ENV=production node --require dd-trace/init dist/main.js
```

For ES modules on Node.js 20.6 and later, there's a one-flag shorthand:

```bash
$ node --import dd-trace/initialize.mjs dist/main.js
```

**What it sees of Nest:** NestJS isn't among the web frameworks Datadog's Node.js tracer lists; its documentation mentions it as a framework with a custom entry point, which is about load order, not instrumentation. You get Express or Fastify, outbound calls, a wide range of drivers, and BullMQ (5.66 and up) as a supported library. A community package, `nestjs-ddtrace`, can wrap your controllers and providers in Datadog spans.

Pick it when you have more than one language and real infrastructure to watch next to the application.

#### New Relic

New Relic's Node.js agent reports straight to New Relic, with no collector to run for APM:

```bash
$ npm i newrelic
$ NEW_RELIC_APP_NAME=orders-api NEW_RELIC_LICENSE_KEY=... node -r newrelic dist/main.js
```

For ES modules, New Relic documents a loader alongside the preload, and a `newrelic.js` config file has to become `newrelic.cjs`:

```bash
$ node --import newrelic/esm-loader.mjs -r newrelic dist/main.js
```

**What it sees of Nest:** `@nestjs/core` is on New Relic's list of instrumented modules (version 10 and up), which names transactions after your Nest routes. Below that you get Express or Fastify, outbound HTTP, and drivers including `pg`, `mysql2`, `mongodb`, `ioredis` and Prisma (`@prisma/client` 5 and up). BullMQ and Bull aren't on the list, and your own providers aren't spans unless you add them. The current agent needs Node.js 22.16 or later.

Pick it when you want a full platform - APM, infrastructure, logs, browser - with Node.js as one of several languages.

#### Elastic APM

The Elastic APM Node.js agent sends traces to an APM Server and on into Elasticsearch, where Kibana shows them:

```bash
$ npm i elastic-apm-node
$ ELASTIC_APM_SERVICE_NAME=orders-api \
  ELASTIC_APM_SERVER_URL=https://apm.example.com:8200 \
  ELASTIC_APM_SECRET_TOKEN=... \
  node -r elastic-apm-node/start.js dist/main.js
```

For ES modules, the agent's support is described in its own documentation as incomplete and experimental: you add a loader, still start the agent separately, and only a subset of modules (`http`, Express, Fastify, `pg`, `ioredis` and a few others) is instrumented:

```bash
$ node -r elastic-apm-node/start.js --experimental-loader=elastic-apm-node/loader.mjs dist/main.js
```

**What it sees of Nest:** NestJS isn't in the agent's list of supported frameworks. It instruments the server underneath, so transactions are named after the route, and it records queries through `pg`, `mysql2`, `mongodb` and `ioredis`. Your controllers, services and repositories aren't spans unless you add them with the agent's API, and BullMQ and Bull aren't on its list. Elastic's own documentation now also suggests EDOT, its OpenTelemetry distribution for Node.js, which sees roughly what [OpenTelemetry](#opentelemetry) does.

Pick it when you already run the Elastic Stack, or when the data has to stay on infrastructure you control.

#### Side by side

|                                            | NestJS Observe                                             | Sentry                                                          | Datadog                                         | New Relic                                      | Elastic APM                                                       |
| ------------------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| Setup                                      | `npx @nestjs/observe link`, or one module and one option   | Instrument file imported first, module, filter                  | `--require dd-trace/init`, plus a Datadog Agent | `-r newrelic` and a license key                | `-r elastic-apm-node/start.js`, plus APM Server and Elasticsearch |
| ES modules (Nest 12's default)             | Same setup                                                 | See Sentry's documentation                                      | `--import dd-trace/initialize.mjs`              | `--import newrelic/esm-loader.mjs -r newrelic` | Experimental loader, subset of modules                            |
| Recognises Nest itself                     | Built for it                                               | Pipeline spans (guards, pipes, interceptors, filters, handlers) | Not listed                                      | `@nestjs/core` 10+ listed                      | Not listed                                                        |
| Your own providers as spans, automatically | Yes                                                        | No                                                              | Community package (`nestjs-ddtrace`)            | No                                             | No                                                                |
| BullMQ jobs                                | Yes, linked to the enqueuing request                       | Check for your setup                                            | Supported (5.66+)                               | Not listed                                     | Not listed                                                        |
| Something to run besides the app           | Nothing                                                    | Nothing (or self-host)                                          | Datadog Agent                                   | Nothing                                        | APM Server, Elasticsearch, Kibana (or Elastic Cloud)              |
| Self-hostable                              | No                                                         | Yes                                                             | No                                              | No                                             | Yes                                                               |
| Languages                                  | NestJS; other languages share its traces via OpenTelemetry | Many                                                            | Many                                            | Many                                           | Many                                                              |
| Infrastructure monitoring                  | No                                                         | No                                                              | Yes                                             | Yes                                            | Yes                                                               |

This chapter quotes no prices: per-host, per-seat, per-gigabyte and per-event models don't convert cleanly, and they change. Price your own traffic on each before you decide. NestJS Observe's plans are listed under [Subscribing](/observability/overview#subscribing).

#### How to choose

- **Already running Elastic, Datadog or New Relic for other services?** Add the Nest application to it, and know that you'll see the router and the drivers, not your providers. If that's not enough, NestJS Observe can sit next to it for the application layer.
- **Mainly worried about errors, especially on a frontend too?** Sentry.
- **Several languages in the request path that have to share one trace?** OpenTelemetry on the services that aren't Nest, and NestJS Observe on the ones that are: with `openTelemetry` and `otlp`, the Nest services join the same traces and export their spans, down to each provider method, to your OpenTelemetry backend, which shows the whole trace. A platform APM covers every service in one product, but sees the Nest services' router and drivers, not their providers.
- **Data has to stay on your own infrastructure?** Elastic, self-hosted Sentry, or OpenTelemetry with a backend you run.
- **A NestJS backend, no tracing today, and nobody has had the week to set it up?** That's the case NestJS Observe was built for: the setup above is the whole setup.

#### Using more than one

- **NestJS Observe beside OpenTelemetry:** with the SDK's `openTelemetry` option, a Nest service reads and sends W3C `traceparent` and joins the traces your other services share, and with `otlp` it also exports its spans - down to each provider method - to your OpenTelemetry backend. See [Running beside OpenTelemetry](/observability/opentelemetry#running-beside-opentelemetry).
- **NestJS Observe beside Datadog or New Relic:** keep the platform for infrastructure and your other services, turn on `openTelemetry`, and point `otlp` at the platform's OTLP endpoint, so the Nest service's provider spans land in its traces too.
- **NestJS Observe beside Sentry:** keep Sentry on the frontend and add NestJS Observe to the Nest backend.
