### Performance (Fastify)

By default, Nest uses the [Express](https://expressjs.com/) framework. Nest is also compatible with other libraries, such as [Fastify](https://github.com/fastify/fastify). It achieves this framework independence through a framework adapter, whose primary job is to proxy middleware and handlers to the appropriate library-specific implementations.

> info **Hint** A framework adapter can only be implemented for a library that provides request/response pipeline processing similar to Express.

[Fastify](https://github.com/fastify/fastify) is a good alternative framework for Nest because it solves design issues in a similar way to Express. However, Fastify is significantly **faster** than Express, achieving nearly twice the benchmark results. Nest still uses Express as the default HTTP provider because Express is widely used, well known, and has an enormous set of compatible middleware, which is available to Nest users out of the box.

Because Nest is framework independent, you can migrate between the two. Fastify can be a better choice when raw speed is a priority. To use Fastify, choose the built-in `FastifyAdapter`, as shown in this chapter.

#### Installation

First, install the required package:

```bash
$ npm i --save @nestjs/platform-fastify
```

#### Adapter

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

#### Platform specific packages

When you use the `FastifyAdapter`, Nest uses Fastify as the **HTTP provider**. This means that recipes that rely on Express may not work. Use Fastify-equivalent packages instead.

#### Redirect response

Fastify handles redirect responses slightly differently than Express. To redirect with Fastify, set the status code with `status()`, then call `redirect()` with the URL:

```typescript
@Get()
index(@Res() res) {
  res.status(302).redirect('/login');
}
```

#### Fastify options

You can pass options to the Fastify instance through the `FastifyAdapter` constructor. For example:

```typescript
new FastifyAdapter({ logger: true });
```

#### Middleware

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

#### Route Config

Use the `@RouteConfig()` decorator to apply Fastify's [route config](https://fastify.dev/docs/latest/Reference/Routes/#config) feature.

```typescript
@RouteConfig({ output: 'hello world' })
@Get()
index(@Req() req) {
  return req.routeConfig.output;
}
```

#### Route Constraints

Use the `@RouteConstraints()` decorator to apply Fastify's [route constraints](https://fastify.dev/docs/latest/Reference/Routes/#constraints) feature.

```typescript
@RouteConstraints({ version: '1.2.x' })
newFeature() {
  return 'This works only for version >= 1.2.x';
}
```

> info **Hint** `@RouteConfig()` and `@RouteConstraints()` are imported from `@nestjs/platform-fastify`.

#### Example

A working example is available in the [nestjs/nest repository](https://github.com/nestjs/nest/tree/master/sample/10-fastify).
