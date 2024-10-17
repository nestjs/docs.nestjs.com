### Performance (Fastify)

By default, Nest makes use of the [Express](https://expressjs.com/) framework. As mentioned earlier, Nest also provides compatibility with other libraries such as, for example, [Fastify](https://github.com/fastify/fastify). Nest achieves this framework independence by implementing a framework adapter whose primary function is to proxy middleware and handlers to appropriate library-specific implementations.

> info **Hint** Note that in order for a framework adapter to be implemented, the target library has to provide similar request/response pipeline processing as found in Express.

[Fastify](https://github.com/fastify/fastify) provides a good alternative framework for Nest because it solves design issues in a similar manner to Express. However, fastify is much **faster** than Express, achieving almost two times better benchmarks results. A fair question is why does Nest use Express as the default HTTP provider? The reason is that Express is widely-used, well-known, and has an enormous set of compatible middleware, which is available to Nest users out-of-the-box.

But since Nest provides framework-independence, you can easily migrate between them. Fastify can be a better choice when you place high value on very fast performance. To utilize Fastify, simply choose the built-in `FastifyAdapter` as shown in this chapter.

#### Installation

First, we need to install the required package:

```bash
$ npm i --save @nestjs/platform-fastify
```

#### Adapter

Once the Fastify platform is installed, we can use the `FastifyAdapter`.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

By default, Fastify listens only on the `localhost 127.0.0.1` interface ([read more](https://www.fastify.io/docs/latest/Guides/Getting-Started/#your-first-server)). If you want to accept connections on other hosts, you should specify `'0.0.0.0'` in the `listen()` call:

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

Keep in mind that when you use the `FastifyAdapter`, Nest uses Fastify as the **HTTP provider**. This means that each recipe that relies on Express may no longer work. You should, instead, use Fastify equivalent packages.

#### Redirect response

Fastify handles redirect responses slightly differently than Express. To do a proper redirect with Fastify, return both the status code and the URL, as follows:

```typescript
@Get()
index(@Res() res) {
  res.status(302).redirect('/login');
}
```

#### Fastify options

You can pass options into the Fastify constructor through the `FastifyAdapter` constructor. For example:

```typescript
new FastifyAdapter({ logger: true });
```

#### Middleware

Middleware functions retrieve the raw `req` and `res` objects instead of Fastify's wrappers. This is how the `middie` package works (that's used under the hood) and `fastify` - check out this [page](https://www.fastify.io/docs/latest/Reference/Middleware/) for more information,

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

You can use the [route config](https://fastify.dev/docs/latest/Reference/Routes/#config) feature of Fastify with the `@RouteConfig()` decorator.

```typescript
@RouteConfig({ output: 'hello world' })
@Get()
index(@Req() req) {
  return req.routeConfig.output;
}
```

#### Route Constraints

As of v10.3.0, `@nestjs/platform-fastify` supports [route constraints](https://fastify.dev/docs/latest/Reference/Routes/#constraints) feature of Fastify with `@RouteConstraints` decorator.

```typescript
@RouteConstraints({ version: '1.2.x' })
newFeature() {
  return 'This works only for version >= 1.2.x';
}
```

> info **Hint** `@RouteConfig()` and `@RouteConstraints` are imported from `@nestjs/platform-fastify`.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/10-fastify).
