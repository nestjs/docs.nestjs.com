### Cloudflare Workers

Cloudflare Workers and Nest solve different problems, and many systems use both. Workers run small functions across Cloudflare's network, close to each user, with no server to keep running. Nest organizes a backend, usually a long-running Node.js process. This page helps you choose.

#### When to use which

| What you're building | Better fit | Why |
| --- | --- | --- |
| Logic in front of a site or an API: redirects, A/B tests, rewriting headers, checking a token | Workers | It runs close to every user, before a request reaches your origin |
| A small API with a few routes, and traffic that comes in spikes or barely at all | Workers | It costs nothing while idle, and there's no server to run |
| A backend with many modules, or several developers working on it | Nest | Modules, dependency injection, guards and pipes give it one structure, and services are easy to test |
| A relational database with transactions and a connection pool | Nest | A long-running process keeps its pool. A Worker reaches a database through Hyperdrive or D1 |
| Background jobs that run for minutes, or queue consumers | Nest | [Queues](/application/queues) and [scheduled jobs](/application/task-scheduling) run in your process. Workers have Queues, Cron Triggers and Workflows, which are Cloudflare's own |
| Heavy CPU or memory work, or native Node.js modules | Nest | A Worker's isolate has limits, listed below |
| WebSockets with many rooms | Either | Nest has [gateways](/websockets/gateways), and Workers have Durable Objects |
| Something that has to run on another cloud, or on your own servers | Nest | It runs anywhere Node.js does, while Worker bindings such as KV and D1 tie the code to Cloudflare |

Cloudflare [lists its limits](https://developers.cloudflare.com/workers/platform/limits/), which may change. At the time of writing, an isolate gets 128 MB of memory and one second to start, and a request gets 30 seconds of CPU time by default, up to 5 minutes on a paid plan.

#### Use both

A Worker can sit in front of a Nest application: it answers what it can at the edge, and passes the rest on. Cookies, headers and bodies go through unchanged:

```typescript
@@filename(worker)
interface Env {
  API_ORIGIN: string;
}

export default {
  fetch(request: Request, env: Env) {
    const { pathname, search } = new URL(request.url);
    if (pathname.startsWith('/api/')) {
      return fetch(`${env.API_ORIGIN}${pathname}${search}`, request);
    }
    return new Response(`Hello from ${request.cf?.colo ?? 'the edge'}`);
  },
};
```

Nest then runs on any Node.js host (see [Deployment](/deployment)), including [Cloudflare Containers](https://developers.cloudflare.com/containers/), which run a container image alongside your Workers.

#### Can Nest run on a Worker?

It can, but Nest doesn't officially support it, and it's rarely the best of both. Workers implement `node:http`, so the Express adapter starts in `workerd`. An application with a controller and a provider comes to about 500 KB gzipped. What to expect:

- **Dependency injection needs `@Inject()`.** Workers bundle with esbuild, which doesn't emit decorator metadata, so a dependency needs its token named, as with `constructor(@Inject(TodosService) todos: TodosService)`.
- **Optional packages have to be aliased.** Nest loads packages such as `class-validator` and `@nestjs/microservices` only if they're installed, and the bundler tries to resolve them anyway.
- **The application bootstraps in every new isolate**, and that time counts against the startup limit. State in memory isn't shared between isolates.
- **Some features aren't available**, such as [WebSocket gateways](/websockets/gateways), [shutdown hooks](/fundamentals/lifecycle-events) and TCP [microservice transports](/microservices/basics).

If you want Workers for most of the backend, a framework written for them is a better fit. If you want Nest, run it where it gets a long-running process, and put a Worker in front.
