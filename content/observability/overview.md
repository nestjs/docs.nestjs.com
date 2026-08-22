### Overview

[NestJS Observe](https://www.observe.nestjs.com/ 'NestJS Observe') is the official, auto-instrumented observability platform for NestJS applications. Install the SDK, add an API key, and your application starts streaming requests, background jobs, errors, logs, and traces to your dashboard - no manual span wiring, no collector to run, no schema to design, no dashboards to build by hand.

> info **Hint** This chapter covers how to instrument a NestJS application with the `@nestjs/observe` SDK and what that instrumentation gives you. If you are looking for the dashboard itself, head over to [observe.nestjs.com](https://www.observe.nestjs.com/ 'NestJS Observe').

#### What makes it different

Generic Node.js APM agents attach to the HTTP server and the database driver and leave everything in between as a black box. NestJS Observe is built around Nest's own request lifecycle - controllers, guards, interceptors, pipes, resolvers, queue consumers - so the telemetry is expressed in the vocabulary you wrote the code in: `OrdersService.recalculate`, not `POST /orders`. That is also why it can show time spent per NestJS **class and method**, not only per route, and why a trace waterfall from an unmodified application already reads like a call graph.

The SDK attaches to the framework through the `instrument` application option of `NestFactory.create()` (available since `@nestjs/core` v11.1.4), so it sees every controller, provider, resolver, and queue consumer as Nest wires them - no process-wide patching, and nothing to import before the rest of your code.

#### What it offers

Once the SDK is running, every plan - including the free tier - gives you:

- **Request monitoring** for HTTP, GraphQL, gRPC, and `@nestjs/microservices` transports: throughput, latency (average and p95), failure rate per operation, and a detail page for every single execution.
- **Distributed tracing** with a waterfall of every span a request ran, self-time ranking to find where the time actually went, and correlation across services once a trace id is propagated (see [Distributed tracing](/observability/distributed-tracing)).
- **Error monitoring** with the stack trace, the source lines around the failing frame, and server-side grouping of occurrences into defects.
- **Jobs** - queue consumers and cron runs (for example, BullMQ) get the same treatment as requests, plus queue wait time and retry attempts.
- **Services** - a per-class, per-method breakdown of own time vs. total time across your application.
- **Runtime profiling** - CPU, memory, event loop delay and utilization, and garbage collection, sampled from inside the process and compared per instance.
- **Releases** - every request and job records the version that served it, so a regression introduced by a deploy is visible immediately.
- **Custom metrics** - counters, gauges, and summaries reported from your own code.
- **Users** - per-user activity, grouped into the actions they actually performed, when your application reports a user identifier.
- **Copy agent prompt** - one click turns a failed request, slow job, or failing trace into a self-contained prompt for a coding agent.

Paid plans add **logs streaming** (correlated to traces, with redaction on by default), **alerting** (thresholds, anomaly detection, absence detection, Slack/webhook/email channels), **issues**, team management, and - on the higher tiers - **SSO**, **SLOs** with error budgets and burn-rate alerts, and a read-only **MCP server** so an MCP-compatible agent can query your telemetry directly (see [MCP server](/observability/mcp-server)).

#### How it is organized

NestJS Observe organizes your telemetry in three layers:

- A **team** is a collection of users. Every project belongs to exactly one team, and team membership is how you grant someone access to more than one project at a time. Subscriptions are managed per team.
- A **project** is a collection of applications that ship together, typically one per product or environment (e.g. `storefront-production`, `storefront-staging`). Projects are what alerts, issues, SLOs, and API keys are scoped to.
- An **application** is a single NestJS service - a REST API, a worker, a microservice - instrumented with the SDK and reporting into a project. A project usually has more than one application (a web API and the queue workers behind it, for example), so you can see them as one system while still filtering down to either.

<figure><img src="https://www.observe.nestjs.com/docs/overview/projects.png" alt="Projects overview" /></figure>

Every project member has one of three access levels - **Read**, **Write**, or **Admin** - controlling whether they can view telemetry, create alert rules, applications, and API keys, or manage members and spend controls.

#### Subscribing

Sign up at [observe.nestjs.com](https://www.observe.nestjs.com/ 'NestJS Observe'). The **Free** plan needs no payment details and already includes error monitoring, distributed tracing, and auto-instrumentation, so you can instrument an application and see real traces before deciding whether you need more.

Usage is metered in **Observability Events (OEs)** - one per request, background job run, error, log entry, or trace span your applications report. These compound rather than collapse: a request that ran three database spans, wrote two log lines, and raised one error is seven events. Your plan sets a monthly allowance of included events, a retention window, and which features are unlocked:

| Plan       | Included events / month | Retention  | Logs & alerts | SSO & SLOs |
| ---------- | ----------------------: | ---------- | ------------- | ---------- |
| Free       |                    300k | 3 days     | ✗             | ✗          |
| Pro        |                     25M | 30 days    | ✓             | ✗          |
| Scale      |                    200M | 90 days    | ✓             | ✓          |
| Enterprise |              Negotiated | Negotiated | ✓             | ✓          |

Free has a hard monthly limit - once it is reached, ingestion is rejected until the next period. Pro and Scale allow overage instead of a hard stop, billed per additional million events, so a busy month doesn't mean lost telemetry. Annual billing is discounted against the monthly price. For current prices, seat counts, and overage rates, see the [pricing page](https://www.observe.nestjs.com/ 'NestJS Observe').

To upgrade, open **Billing → Manage subscription** for the team that owns your projects. From the same area, the **Usage** page tracks your Observability Events against the allowance, broken down by project, and lets you set **quota notifications** (up to five thresholds, e.g. 50%, 80%, 100%) to get an email the moment usage crosses one.

> info **Hint** Ingestion volume is controllable without a redeploy through per-project **spend controls**: trace-coherent span sampling, a per-minute rate cap, and drop filters for known-noisy traffic like `/health*`. Errors are never sampled or dropped by these controls. You can also stop telemetry from being generated at all on the SDK side - see [Ignoring noisy operations](/observability/sdk#ignoring-noisy-operations).

#### First project

1. **Create a project** and give it a name.
2. **Add an application** to it. An application needs nothing beyond a name - the routes it serves, the jobs it processes, and the metrics it reports are all discovered from the telemetry the SDK sends.
3. **Generate an API key** from the project's **API Keys** page. Each key has a name (one for local development, one for CI, one for production) and an optional expiration date. The key pair (`appKey` and `appSecret`) is shown once, at creation, so copy it into your secrets store right away. Keys are scoped to a project: every application whose telemetry should land in that project uses the same key.
4. **Instrument your application** by following the [SDK](/observability/sdk) chapter. Telemetry starts appearing within moments of your application receiving traffic.

<figure><img src="https://www.observe.nestjs.com/docs/applications/api-keys.png" alt="API keys" /></figure>

> warning **Warning** Treat `appKey` and `appSecret` like any other credential: read them from environment variables or a secrets manager, never commit them to source control. Revoke a key from the same page at any time - any application still using it will stop being able to send telemetry.

#### Where to go next

- [SDK](/observability/sdk) - installation, the three-line quick start, and every configuration option.
- [Manual instrumentation](/observability/manual-instrumentation) - custom spans, handled errors, request-scoped attributes, and custom metrics.
- [Distributed tracing](/observability/distributed-tracing) - propagating a trace id across HTTP, gRPC, microservice transports, and GraphQL.
- [Dashboard](/observability/dashboard) - what each view shows once telemetry is flowing, and how alerts, SLOs, and issues build on it.
- [MCP server](/observability/mcp-server) - querying your telemetry from Claude Code, Cursor, VS Code, or your own agent.
