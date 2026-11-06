### Nest vs Fastify, Express and Hono

Fastify, Express and Hono route requests to your handlers, and you choose or write what goes around them. Nest organizes the whole backend, with modules, dependency injection, guards, pipes and first-party packages, and it runs on top of Express, Fastify or Node's own `node:http`. So Nest doesn't replace Fastify or Express: they can be what it runs on. This page helps you choose.

#### When to use which

| What you're building | Better fit | Why |
| --- | --- | --- |
| A backend that will grow: more modules, more developers, a database, background jobs | Nest | Modules, dependency injection, guards and pipes give it one structure, and services are easy to test |
| An enterprise-grade system, with many teams and a long-lived codebase | Nest | Every team works in the same structure, and the core team offers [enterprise support](https://enterprise.nestjs.com) |
| A small API with authentication, validation and a database | Nest or Fastify | `nest new --minimal` starts from [one file](/cli/usages#one-file-projects), and first-party packages add the rest. Fastify does the same with plugins and less code around each route |
| Microservices over Kafka, RabbitMQ, NATS or gRPC | Nest | The [transports](/microservices/basics) are first-party and share one programming model |
| A service that will stay a few routes, such as a proxy or a webhook receiver | Fastify or Hono | There's nothing to organize |
| An API on Cloudflare Workers or another edge runtime | Hono | It's built on Web Standards and runs there natively. See [Cloudflare Workers](/faq/cloudflare-workers) |
| A Next.js frontend sharing route types with its API, with no code generation | Hono | Its RPC client infers types from the routes. With Nest, [a shared package](/recipes/nextjs) holds the schemas and types instead |
| An Express application that already works | Express, or Nest one route at a time | [Migrating from Express](/recipes/express-migration) runs both side by side |
| The highest request rate on routes that do very little | Fastify | It's a few percent ahead of Nest. See [Performance](/faq/nest-vs-fastify-express-hono#performance) |

#### What comes with each

| | Nest | Fastify | Express | Hono |
| --- | --- | --- | --- | --- |
| Modules and dependency injection | [Built in](/modules) | Encapsulated plugins, no container | You design it | You design it |
| Request validation | [Built-in pipes](/application/validation), with classes or any Standard Schema library | JSON Schema on each route, built in | Add a library | `@hono/zod-validator` or similar |
| Authentication | [`@nestjs/authentication`](/security/authentication) and [guards](/guards) | `@fastify/jwt` and other plugins | Passport or your own middleware | `hono/jwt` and other middleware |
| OpenAPI | [`@nestjs/swagger`](/openapi/introduction) | `@fastify/swagger` | Add a library | `@hono/zod-openapi` |
| WebSockets | [Gateways](/websockets/gateways), with Socket.IO or `ws` | `@fastify/websocket` | Add a library | Runtime helpers such as `@hono/node-ws` |
| Background jobs | [`@nestjs/bullmq`](/application/queues) | Add a library | Add a library | Add a library |
| Microservice transports | [`@nestjs/microservices`](/microservices/basics) | Add a library | Add a library | Add a library |
| Streaming | [Return a `Response` or a stream](/http/streaming-responses) | Send a stream from a handler | Write to the response | `streamSSE` and other helpers |
| Testing | [`@nestjs/testing`](/fundamentals/testing), which can replace providers | `fastify.inject()` | Add Supertest | `app.request()` |
| Types shared with a frontend | [A shared package](/recipes/nextjs) | Add a library | Add a library | RPC client built in |

#### How small a Nest application can be

`nest new my-api --minimal` generates an application whose code is one file, `src/main.ts`:

```typescript
@@filename(src/main)
import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

@Injectable()
class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}

@Controller()
class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

@Module({
  controllers: [AppController],
  providers: [AppService],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

It stays the same application as it grows. `nest g resource users` adds a module, and when `src/main.ts` gets long, you move the root module to its own file. See [One-file projects](/cli/usages#one-file-projects).

Fastify, Express and Hono start with fewer lines, which stays an advantage while the application stays small. As it grows, where authentication lives, how its parts share services, and how tests replace dependencies become yours to design. Nest decides those up front.

#### Performance

Requests per second on `GET /`, with each server answering `Hello world!`, using `wrk -t4 -c100` for 8 seconds after a 3-second warm-up, on Node.js 24.20. Each number is the median of 3 rounds:

| Server | `GET /` |
| --- | --- |
| Fastify | 57.1k |
| Nest on Node | 55.6k |
| Hono on Node | 53.1k |
| Nest on Fastify | 52.6k |
| Express | 37.0k |
| Nest on Express | 37.0k |

So with the [`NodeAdapter`](/http/performance#node-adapter), Nest handled about 3% fewer requests per second than plain Fastify, about 5% more than Hono on Node, and about 50% more than plain Express.

A separate round on an M1 Pro, with a route parameter and a JSON body:

| Server | `GET /users/:id` | `POST /echo` (JSON) |
| --- | --- | --- |
| Express | 35.6k | 30.1k |
| Fastify | 54.0k | 43.5k |
| Nest on Express | 34.5k | 28.2k |
| Nest on Fastify | 48.4k | 40.2k |
| Nest on Node | 51.0k | 42.4k |

Here Nest on Node came within 3-6% of plain Fastify and stayed 41-43% ahead of plain Express.

To run these yourself, follow the steps in [nestjs/nest#18063](https://github.com/nestjs/nest/pull/18063#reproducing-the-benchmark), which also have the servers for Hono, Koa, Elysia and AdonisJS. Other machines give different gaps, and Hono's number covers only Node, not the other runtimes it runs on.

These routes do almost no work. A route that queries a database or calls other services spends most of its time waiting for them, so for most applications these differences won't decide the choice.

#### Moving to Nest later

The choice doesn't have to be final:

- From Fastify, Nest runs on the same server through the `FastifyAdapter`, and your plugins keep working. See [Migrating from Fastify](/recipes/fastify-migration).
- From Express, routes move one at a time with both serving requests, or all at once. See [Migrating from Express](/recipes/express-migration).
