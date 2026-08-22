### Distributed tracing

A **trace** is everything your applications recorded under a single trace id: the request or job that started it, and every span underneath. Within a single service this is automatic - the SDK generates a trace id when work starts, and every span underneath, including ones you add manually with [`TracerService`](/observability/manual-instrumentation), inherits it.

Across services it isn't automatic by default. A single user action that touches more than one service - an API call that fans out to a gRPC service, a job that calls back into another application - only shows up as **one trace** in your dashboard if every service involved ends up using the same trace id. Left unconfigured, each service mints its own via `traceIdGenerator` and the action shows up as several disconnected traces instead, one per service.

<figure><img src="https://www.observe.nestjs.com/docs/telemetry/service-flow.png" alt="Trace correlation across services" /></figure>

Forwarding the trace id is application code, not a dashboard setting. The pattern is always the same: the caller puts its current trace id on whatever channel the protocol has, and the callee's `traceIdGenerator` reads it back out. This page shows that for each transport.

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

Works with no extra configuration. The default `traceIdGenerator` is `(req) => req.headers['x-request-id'] ?? randomUUID()`, so a service adopts whatever `x-request-id` an incoming request carries instead of minting a new one. Forward the trace id as `x-request-id` on the outgoing request and the receiving service picks it up:

```typescript
fetch(url, {
  headers: { 'x-request-id': this.tracerService.currentTraceId() },
});
```

If you use the [HTTP module](/techniques/http-module), the same header can be added in an Axios request interceptor once, rather than at every call site:

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

#### Queue jobs (BullMQ)

Not currently propagatable. A job processor always starts its own new trace with a fresh random id, regardless of what trace was active when the job was enqueued - there's no `traceIdGenerator` hook for jobs the way there is for HTTP and RPC. Treat this as a current limitation rather than something to configure around. If you need to tie a job run back to the request that enqueued it, put the request's trace id in the job data and attach it as a tag from the processor:

```typescript
@@filename(orders.processor)
@Processor('orders')
export class OrdersProcessor extends WorkerHost {
  constructor(private readonly tracerService: TracerService) {
    super();
  }

  async process(job: Job<{ orderId: string; originTraceId: string }>) {
    const span = await this.tracerService.activeSpan();
    span.addTags({ originTraceId: job.data.originTraceId });
    // ...
  }
}
```

The job still gets its own trace, but the tag is searchable, so the path from a slow request to the job it kicked off is one search away.

#### What a trace looks like in the dashboard

Once services agree on a trace id, the trace detail page renders every execution that ran under it - across services, requests, and jobs - as one waterfall: nesting depth as indentation, duration as bar length, position as when the span ran. A few things worth knowing when reading it:

- **Self time** is the number that matters. A span's duration minus everything its children accounted for is the time the span spent in its own code. Ranking by total duration always puts the controller at the top (it contains everything); ranking by self time surfaces the repository call that actually burned the time. Every execution page carries a spans table sorted this way.
- **Overlapping children are flagged.** When a span's children sum to more than the span's own duration, they ran concurrently (`Promise.all`, a parallel fan-out) and the row says so.
- **Failing spans are marked**, and the execution page leads with an error card for the first span that threw - class, message, the trimmed stack trace with the throwing frame marked, and the source lines around it when [`sourceContext`](/observability/sdk#error-source-context) is on.
- **Logs sit on the trace's clock.** With `forwardLogs` enabled, each line is placed at its offset from the start of the trace and labelled with the span that was in flight when it was written; hovering a line marks that instant on the waterfall.

<figure><img src="https://www.observe.nestjs.com/docs/telemetry/traces.png" alt="Trace waterfall" /></figure>

From any failed or unusually slow execution, the **Copy agent prompt** button packages the whole page - context, error, stack trace with source, top spans by self time, and the logs - as a self-contained markdown prompt for a coding agent. See [Dashboard](/observability/dashboard#handing-a-failure-to-a-coding-agent).
