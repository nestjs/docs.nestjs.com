### HTTP adapters

Nest doesn't talk to an HTTP server directly. It goes through an **HTTP adapter**, whose primary job is to proxy middleware and handlers to the appropriate library-specific implementations. This makes Nest framework independent: your controllers, providers, guards, pipes, and filters run unchanged on each of the adapters below, and you can migrate from one to another.

| Adapter          | Package                    | Built on                                                                |
| ---------------- | -------------------------- | ----------------------------------------------------------------------- |
| `ExpressAdapter` | `@nestjs/platform-express` | [Express](https://expressjs.com/) (the default)                         |
| `FastifyAdapter` | `@nestjs/platform-fastify` | [Fastify](https://fastify.dev/)                                         |
| `NodeAdapter`    | `@nestjs/platform-node`    | The [`node:http`](https://nodejs.org/api/http.html) module of Node.js   |

> info **Hint** A framework adapter can only be implemented for a library that provides request/response pipeline processing similar to Express.

#### Choosing an adapter

Starting with NestJS v12.3, we recommend the `NodeAdapter`. It is the fastest of the three (see [Performance](/http/performance#performance)), and its request and response objects come with the Express-style helpers, so most Express middleware, and most code written for the Express adapter, work with it unchanged. Nest still uses Express when you don't pass an adapter, so you need to opt in, as shown in [Node adapter](/http/performance#node-adapter). In NestJS v13, the `NodeAdapter` will become the default.

Choose the `FastifyAdapter` to use Fastify plugins and features such as [route constraints](/http/performance#route-constraints). Stay on the `ExpressAdapter` if your application relies on Express APIs that the Node adapter doesn't implement (see [Express compatibility](/http/performance#express-compatibility)), or on a package that supports only Express.

#### Performance

In our benchmarks (`wrk` with 100 connections on Node.js 24, against a plain `GET` route, a `GET` route with a parameter, and a `POST` route with a JSON body), Nest handled about 50% more requests per second on the `NodeAdapter` than on the `ExpressAdapter`, and about 5% more than on the `FastifyAdapter`. To run the same benchmark on your machine, follow the steps in [nestjs/nest#18063](https://github.com/nestjs/nest/pull/18063#reproducing-the-benchmark).

Keep in mind that the adapter handles only a small part of each request. A route that queries a database or calls other services spends most of its time waiting for them, so the choice of adapter matters most for lightweight routes at high request rates.

#### Node adapter

The `NodeAdapter` runs Nest directly on the `node:http` module, with no other framework in between. First, install the required package:

```bash
$ npm i --save @nestjs/platform-node
```

Then pass a `NodeAdapter` instance to `NestFactory.create()`:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestNodeApplication, NodeAdapter } from '@nestjs/platform-node';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestNodeApplication>(
    AppModule,
    new NodeAdapter(),
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

The `NestNodeApplication` type gives you the platform-specific methods of the application object: `useBodyParser()`, `useStaticAssets()`, `setViewEngine()`, and `setBaseViewsDir()`.

##### Express compatibility

Requests and responses are instances of `NodeRequest` and `NodeResponse` (exported from `@nestjs/platform-node`). They extend Node's `IncomingMessage` and `ServerResponse` with the Express-style properties and methods that middleware, exception filters, and `@Res()` handlers usually rely on, such as `req.get()`, `req.is()`, `req.ip`, `req.ips`, `req.hostname`, `res.status()`, `res.send()`, `res.json()`, `res.set()`, `res.type()`, `res.cookie()`, `res.redirect()`, `res.sendFile()`, and `res.locals`. Middleware runs in an Express-style stack and uses the same `(req, res, next)` signature.

Popular Express middleware packages, such as `helmet`, `compression`, `cookie-parser`, `express-session`, `express-rate-limit`, `csrf-csrf`, `morgan`, and `passport` (along with the `@nestjs/passport` guards), work as they do with the Express adapter. When a chapter of this documentation shows separate instructions for Express and Fastify (for example, [Compression](/http/compression) or [Session](/http/session)), follow the Express ones.

The Node adapter deliberately differs from Express in a few places:

- Routes are matched by specificity, as with Fastify, rather than in the order they were registered.
- Paths are matched case-sensitively, for routes, middleware, and `exclude()` alike, as with Fastify.
- A string returned from a route handler is sent as `text/plain`, not `text/html`.
- `req.path` is the decoded path that the router matched, so a middleware that checks it sees the same path as the routes.
- `res.set()` and `res.type()` don't append `; charset=utf-8` to the `Content-Type` header.
- A route parameter longer than 100 characters doesn't match (see [Node adapter options](/http/performance#node-adapter-options)).
- A JSON body with `__proto__` or `constructor.prototype` keys is rejected (see [Body parsers](/http/performance#body-parsers)).

Some Express APIs are not available: `res.render()` (use the [`@Render()`](/http/mvc) decorator instead), `res.download()`, `res.format()`, `req.accepts()` and its variants, `req.route`, mounting an Express application with `app.use()`, and Express settings, for which the adapter takes [options](/http/performance#node-adapter-options) instead (`trustProxy` for the `trust proxy` setting, for example).

##### Node adapter options

As with Fastify, route parameters are capped at 100 characters. A request whose parameter is longer falls through to another matching route, if there is one (a wildcard route, for example), and gets a `414 URI Too Long` response otherwise. To change the limit, pass the `maxParamLength` option to the `NodeAdapter` constructor:

```typescript
new NodeAdapter({ maxParamLength: 500 });
```

Behind a reverse proxy or a load balancer, connections come from the proxy, so `req.ip` is the proxy's address, and `req.protocol` is `'http'` when the proxy terminates TLS. To read the client's address, protocol, and host from the `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Forwarded-Host` headers that a trusted proxy sets, pass the `trustProxy` option. As with Fastify, it takes `true` to trust every proxy, the addresses or subnets of your proxies (such as `'loopback'` or `'10.0.0.0/8'`, comma-separated or in an array), or a function that takes an address and its hop count and returns whether to trust it:

```typescript
new NodeAdapter({ trustProxy: 'loopback' });
```

`req.ip`, `req.ips`, `req.protocol`, `req.secure`, and `req.hostname` then work as they do with Express, and so does [sub-domain routing](/controllers#sub-domain-routing). Unlike the Express setting, the option takes no hop count: as with Fastify, a number trusts no proxy, since it cannot tell a proxy from a client that sends its own `X-Forwarded-For` header.

> warning **Warning** Trust only the proxies in front of your application. A client that can reach the application directly can send any `X-Forwarded-*` header.

By default, query strings are parsed into flat keys, as with Express and Fastify: `?filter[where][name]=John` gives a `filter[where][name]` key. To parse nested objects and arrays, pass the `querystringParser` option, as with Fastify. It is called with the query string, without the leading `?` (and with an empty string when the URL has none):

```typescript
import qs from 'qs';

new NodeAdapter({ querystringParser: (str) => qs.parse(str) });
```

##### Body parsers

The Node adapter comes with its own `json`, `urlencoded`, `text`, and `raw` body parsers, so it doesn't depend on the `body-parser` package. They take the same options as their `body-parser` counterparts, such as `limit`, `inflate`, `strict`, and `type`. As with Express, Nest registers the `json` and `urlencoded` parsers by default, and the `rawBody` option and the `useBodyParser()` method work as described in [Raw body](/faq/raw-body).

Like Fastify, the `json` parser rejects a body that tries to inject prototype properties: a body with a `__proto__` or `constructor.prototype` key gets a `400 Bad Request` response. To drop these keys instead, or to keep them (the `body-parser` behavior), set the `onProtoPoisoning` and `onConstructorPoisoning` options to `'remove'` or `'ignore'`. The `urlencoded` parser takes the same options.

```typescript
app.useBodyParser('json', { onProtoPoisoning: 'remove' });
```

##### Static assets and views

`useStaticAssets()` serves a directory with the [serve-static](https://www.npmjs.com/package/serve-static) package. It takes the options of that package, plus a `prefix`, as with Express. `setViewEngine()` accepts either the name of an engine, as with Express (see [Model-View-Controller](/http/mvc)), or the options object of `@fastify/view`, with the engine and the `templates` directory.

##### Other packages

- **File upload:** import `FileInterceptor()`, the other upload interceptors, and `MulterModule` from `@nestjs/platform-node` instead of `@nestjs/platform-express`. They are the same Multer-based interceptors, so the rest of the [File upload](/http/file-upload) chapter applies unchanged.
- **Serving a single-page application:** the `@nestjs/serve-static` package (v12.1.1 or later) serves the files through the adapter, so it doesn't need the `express` package. Its fallback route for client-side paths requires `@nestjs/platform-node` v12.3.1 or later.
- **GraphQL:** use the `@nestjs/apollo` driver (v14.1.1 or later), as with Express. The `@nestjs/mercurius` driver requires the Fastify adapter.

#### Fastify adapter

[Fastify](https://github.com/fastify/fastify) is a good alternative framework for Nest because it solves design issues in a similar way to Express. It comes with its own ecosystem of plugins. To use Fastify, choose the built-in `FastifyAdapter`, as shown below.

##### Installation

First, install the required package:

```bash
$ npm i --save @nestjs/platform-fastify
```

##### Adapter

Once the Fastify platform is installed, you can use the `FastifyAdapter`.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

By default, Fastify listens only on the `localhost` interface (see the [Fastify getting started guide](https://fastify.dev/docs/latest/Guides/Getting-Started/#your-first-server)). To accept connections on other hosts, specify `'0.0.0.0'` in the `listen()` call:

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.listen(3000, '0.0.0.0');
}
```

##### Platform specific packages

When you use the `FastifyAdapter`, Nest uses Fastify as the **HTTP provider**. This means that recipes that rely on Express may not work. Use Fastify-equivalent packages instead.

##### Redirect response

Fastify handles redirect responses slightly differently than Express. To redirect with Fastify, set the status code with `status()`, then call `redirect()` with the URL:

```typescript
@Get()
index(@Res() res) {
  res.status(302).redirect('/login');
}
```

##### Fastify options

You can pass options to the Fastify instance through the `FastifyAdapter` constructor. For example:

```typescript
new FastifyAdapter({ logger: true });
```

##### Middleware

Middleware functions receive the raw `req` and `res` objects instead of Fastify's wrappers. This is how the `@fastify/middie` package, which Nest uses under the hood, works. See the [Fastify middleware documentation](https://fastify.dev/docs/latest/Reference/Middleware/) for more information.

```typescript
@@filename(logger.middleware)
import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    console.log('Request...');
    next();
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware {
  use(req, res, next) {
    console.log('Request...');
    next();
  }
}
```

##### Route Config

Use the `@RouteConfig()` decorator to apply Fastify's [route config](https://fastify.dev/docs/latest/Reference/Routes/#config) feature.

```typescript
@RouteConfig({ output: 'hello world' })
@Get()
index(@Req() req) {
  return req.routeConfig.output;
}
```

##### Route Constraints

Use the `@RouteConstraints()` decorator to apply Fastify's [route constraints](https://fastify.dev/docs/latest/Reference/Routes/#constraints) feature.

```typescript
@RouteConstraints({ version: '1.2.x' })
newFeature() {
  return 'This works only for version >= 1.2.x';
}
```

> info **Hint** `@RouteConfig()` and `@RouteConstraints()` are imported from `@nestjs/platform-fastify`.

##### Example

A working example is available in the [nestjs/nest repository](https://github.com/nestjs/nest/tree/master/sample/10-fastify).

#### Express adapter

[Express](https://expressjs.com/) is widely used, well known, and has an enormous set of compatible middleware. Nest uses the `ExpressAdapter` from the `@nestjs/platform-express` package when you don't pass an adapter to `NestFactory.create()`, so no setup is required. To access the Express-specific methods of the application object, pass the `NestExpressApplication` type:

```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule);
```

To keep your application on Express once the `NodeAdapter` becomes the default, pass an `ExpressAdapter` instance explicitly:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```
