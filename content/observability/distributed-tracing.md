### Distributed tracing

A **trace** is everything your applications recorded under a single trace id: the request or job that started it, and every span underneath. Within a single service this is automatic - the SDK generates a trace id when work starts, and every span underneath, including ones you add manually with [`TracerService`](/observability/manual-instrumentation), inherits it.

Across services it depends on the channel. HTTP calls and queue jobs carry the trace id on their own; gRPC and the microservice transports need it forwarded. A single user action that touches more than one service - an API call that fans out to a gRPC service, a message sent to another application over a microservice transport - only shows up as **one trace** in your dashboard if every service involved ends up using the same trace id. Left unconfigured, each service mints its own via `traceIdGenerator` and the action shows up as several disconnected traces instead, one per service.

<figure><img src="https://www.observe.nestjs.com/docs/telemetry/service-flow.webp" alt="Trace correlation across services" /></figure>

Where forwarding is needed it is application code, not a dashboard setting, and the pattern is always the same: the caller puts its current trace id on whatever channel the protocol has, and the callee's `traceIdGenerator` reads it back out. This page shows that for each transport.

#### Reading the current trace id

To forward a trace id downstream, a service first needs to read the one it's currently running under. `TracerService.currentTraceId()` returns it directly:

```typescript
@@filename(orders.service)
import { Injectable } from '@nestjs/common';
import { TracerService } from '@nestjs/observe';

@Injectable()
export class OrdersService {
  constructor(private readonly tracerService: TracerService) {}

  async report(orderId: string) {
    const traceId = this.tracerService.currentTraceId();
    // ...forward traceId to the next service
  }
}
```

It reads from the same context store as `getAttribute()`/`setAttribute()`, but unlike those it doesn't throw outside a traced context - it returns `null`, so code that forwards a trace id from startup hooks or other untraced paths doesn't need a `try`/`catch` just to propagate an id that isn't there yet. Guard for `null` before setting a header if that can happen in your code.

#### HTTP to HTTP

Automatic in both directions. On the way in, the default `traceIdGenerator` adopts a well-formed `x-request-id` header and otherwise mints a time-ordered UUID (v7). On the way out, the SDK adds the current trace id as `x-request-id` to outbound requests that don't already carry one - so a call from one instrumented service to another lands in the same trace with no application code.

Outbound propagation covers `fetch` and `undici` on every supported Node version, and clients built on `node:http` - axios, got, the [HTTP module](/techniques/http-module) - on Node 22.12 and later, which is the first release that lets a header be added after the request object is created. To limit which hosts receive the header, or switch it off, see [`outgoing.http.propagateTraceId`](/observability/sdk#database-queries-and-outbound-http).

On an older Node version with an axios-based client, forward the id yourself in a request interceptor, once:

```typescript
@@filename(orders.module)
@Module({
  imports: [HttpModule, ObserveModule],
})
export class OrdersModule implements OnModuleInit {
  constructor(
    private readonly httpService: HttpService,
    private readonly tracerService: TracerService,
  ) {}

  onModuleInit() {
    this.httpService.axiosRef.interceptors.request.use((config) => {
      config.headers['x-request-id'] = this.tracerService.currentTraceId();
      return config;
    });
  }
}
```

> info **Hint** Many reverse proxies and load balancers (nginx, Envoy, AWS ALB) can be configured to set `x-request-id` on every inbound request. When they do, the trace id in your dashboard matches the request id in your proxy's access logs with no further work.

#### gRPC

gRPC has no headers, only metadata. The caller attaches the trace id as metadata, and the gRPC service overrides `traceIdGenerator` to read it back out, since the default generator only checks HTTP headers:

```typescript
@@filename(caller)
import { Metadata } from '@grpc/grpc-js';

const metadata = new Metadata();
metadata.set('x-request-id', this.tracerService.currentTraceId());
this.heroesService.findOne({ id: 1 }, metadata);
```

```typescript
@@filename(app.module)
import { randomUUID } from 'node:crypto';

// gRPC service - passed to createObserveModule(), not forRoot()
export const { ObserveModule, ObserveInstrument } = createObserveModule({
  traceIdGenerator: (call) => {
    const inbound = call.metadata?.get?.('x-request-id')?.[0];
    return typeof inbound === 'string' && inbound.length > 0
      ? inbound
      : randomUUID(); // no id was propagated - this call started its own trace
  },
});
```

See the [gRPC](/microservices/grpc) chapter for how metadata is read and written on both sides of a call.

#### TCP, Redis, NATS, and other microservice transports

The `@nestjs/microservices` transports have no metadata channel, only a message payload, so the trace id has to travel as a field inside the payload itself:

```typescript
@@filename(caller)
this.client.send('orders.report', {
  ...payload,
  traceId: this.tracerService.currentTraceId(),
});
```

```typescript
@@filename(app.module)
import { randomUUID } from 'node:crypto';

// receiving service
export const { ObserveModule, ObserveInstrument } = createObserveModule({
  traceIdGenerator: (ctx) => ctx.getData()?.traceId ?? randomUUID(),
});
```

The generator receives the transport's context object, so the same shape works for request-response (`send()`) and event-based (`emit()`) messages alike.

> warning **Warning** A service that only receives RPC calls still has a `traceIdGenerator` that expects an HTTP request by default. In a [hybrid application](/faq/hybrid-application) that serves both HTTP and a microservice transport, write the generator defensively - check for `headers` first, then fall back to the payload.

#### GraphQL

No extra configuration is needed when the GraphQL server sits behind the same service's HTTP layer - it automatically joins whatever trace the HTTP agent already opened for that request, which may itself have been propagated via `x-request-id` as above. Only a GraphQL server with no enclosing HTTP trace - a subscription over a raw WebSocket with no HTTP agent involved, for example - needs to think about this separately, and there's no built-in propagation hook for that case today.

#### Queue jobs (BullMQ and Bull)

Automatic. When a job is added from inside a traced operation - a request handler, an RPC handler, another job - the SDK stamps the current trace id onto the job's options, and the processor that picks the job up runs under that id instead of minting its own. The request and every job it enqueued render as one trace, with no application code involved:

```typescript
@@filename(orders.controller)
@Post()
async create(@Body() dto: CreateOrderDto) {
  const order = await this.ordersService.create(dto);
  // The job inherits this request's trace id
  await this.ordersQueue.add('send-confirmation', { orderId: order.id });
  return order;
}
```

This works the same way for `@nestjs/bullmq` and `@nestjs/bull`, for `add()` and `addBulk()`, and whether the worker runs in the same process as the producer or in a separate service - the id travels through Redis with the job. A retried job keeps the id it was enqueued with, so every attempt lands in the same trace.

Two cases deliberately start a trace of their own:

- **Repeatable jobs and `@nestjs/schedule` handlers.** A schedule outlives the operation that registered it, so each firing is its own trace rather than an ever-growing one attached to whichever request happened to set the schedule up.
- **Jobs added outside any traced operation** - from a bootstrap hook or a plain script. There is no trace to inherit.

> info **Hint** The trace id is stored under the `observeTraceId` job option. To attach a job to a trace the SDK did not see - one enqueued by a non-Nest producer, for example - set that option yourself when adding the job.

> warning **Warning** Trace inheritance for jobs requires `@nestjs/observe` 0.3.0 or later on **both** the service that adds the job and the service that processes it. With an older producer, jobs carry no id and each run opens its own trace, as before.

#### What a trace looks like in the dashboard

Once services agree on a trace id, the trace detail page renders every execution that ran under it - across services, requests, and jobs - as one waterfall: nesting depth as indentation, duration as bar length, position as when the span ran. A few things worth knowing when reading it:

- **Self time** is the number that matters. A span's duration minus everything its children accounted for is the time the span spent in its own code. Ranking by total duration always puts the controller at the top (it contains everything); ranking by self time surfaces the repository call that actually burned the time. Every execution page carries a spans table sorted this way.
- **Overlapping children are flagged.** When a span's children sum to more than the span's own duration, they ran concurrently (`Promise.all`, a parallel fan-out) and the row says so.
- **Failing spans are marked**, and the execution page leads with an error card for the first span that threw - class, message, the trimmed stack trace with the throwing frame marked, and the source lines around it when [`sourceContext`](/observability/sdk#error-source-context) is on.
- **Logs sit on the trace's clock.** With `forwardLogs` enabled, each line is placed at its offset from the start of the trace and labeled with the span that was in flight when it was written; hovering a line marks that instant on the waterfall.

<figure><img src="https://www.observe.nestjs.com/docs/telemetry/traces.webp" alt="Trace waterfall" /></figure>

From any failed or unusually slow execution, the **Copy agent prompt** button packages the whole page - context, error, stack trace with source, top spans by self time, and the logs - as a self-contained markdown prompt for a coding agent. See [Dashboard](/observability/dashboard#handing-a-failure-to-a-coding-agent).
