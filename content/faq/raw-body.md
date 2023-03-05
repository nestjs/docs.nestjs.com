### Raw body

One of the most common use-case for having access to the raw request body is performing webhook signature verifications. Usually to perform webhook signature validations the unserialized request body is required to calculate an HMAC hash.

> warning **Warning** This feature can be used only if the built-in global body parser middleware is enabled, ie., you must not pass `bodyParser: false` when creating the app.

#### Use with Express

First enable the option when creating your Nest Express application:

```typescript
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';


const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  rawBody: true,
});
await app.listen(3000);
```

To access the raw request body in a controller, a convenience interface `RawBodyRequest` is provided to expose a `rawBody` field on the request: use the interface `RawBodyRequest` type:

```typescript
import { Controller, Post, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('cats')
class CatsController {
  @Post()
  create(@Req() req: RawBodyRequest<Request>) {
    const raw = req.rawBody; // returns a `Buffer`.
  }
}
```

##### Registering a Different Parser Dynamically with Express Body Parser

By default, only `json` and `urlencoded` parsers are registered. If you want to register a different parser on the fly, you will need to do so explicitly.

For example, to register a `text` parser, you can use the following code:

```typescript
app.useBodyParser('text')
```

#### Use with Fastify

First enable the option when creating your Nest Fastify application:

```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
  {
    rawBody: true,
  }
);
await app.listen(3000);
```

To access the raw request body in a controller, a convenience interface `RawBodyRequest` is provided to expose a `rawBody` field on the request: use the interface `RawBodyRequest` type:

```typescript
import { Controller, Post, RawBodyRequest, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Controller('cats')
class CatsController {
  @Post()
  create(@Req() req: RawBodyRequest<FastifyRequest>) {
    const raw = req.rawBody; // returns a `Buffer`.
  }
}
```

##### Registering a Different Parser Dynamically with Fastify Body Parser

By default, only `application/json` and `application/x-www-form-urlencoded` parsers are registered. If you want to register a different parser on the fly, you will need to do so explicitly.

For example, to register a `text/plain` parser, you can use the following code:

```typescript
app.useBodyParser('text/plain')
```
