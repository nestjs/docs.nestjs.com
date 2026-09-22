### Raw body

One of the most common reasons to access the raw request body is webhook signature verification. Verifying a webhook signature usually requires the unparsed request body to calculate an HMAC hash.

> warning **Warning** This feature works only if the built-in global body parser middleware is enabled, i.e., you must not pass `bodyParser: false` when creating the application.

#### Use with Express

First, enable the option when creating your Nest Express application:

```typescript
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

// in the "bootstrap" function
const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  rawBody: true,
});
await app.listen(process.env.PORT ?? 3000);
```

To access the raw request body in a controller, type the request with the `RawBodyRequest` convenience interface, which exposes a `rawBody` field:

```typescript
import { Controller, Post, type RawBodyRequest, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller('cats')
class CatsController {
  @Post()
  create(@Req() req: RawBodyRequest<Request>) {
    const raw = req.rawBody; // returns a `Buffer`.
  }
}
```

#### Registering a different parser

By default, only the `json` and `urlencoded` parsers are registered. To use a different parser, register it explicitly.

For example, to register a `text` parser:

```typescript
app.useBodyParser('text');
```

> warning **Warning** Make sure you pass the correct application type to the `NestFactory.create()` call. For Express applications, the correct type is `NestExpressApplication`; otherwise, the `useBodyParser()` method won't be found.

#### Body parser size limit

If your application needs to parse bodies larger than the Express default of `100kb`, raise the limit:

```typescript
app.useBodyParser('json', { limit: '10mb' });
```

The `useBodyParser()` method respects the `rawBody` option passed in the application options.

#### Use with Fastify

First, enable the option when creating your Nest Fastify application:

```typescript
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

// in the "bootstrap" function
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
  {
    rawBody: true,
  },
);
await app.listen(process.env.PORT ?? 3000);
```

To access the raw request body in a controller, type the request with the `RawBodyRequest` convenience interface, which exposes a `rawBody` field:

```typescript
import { Controller, Post, type RawBodyRequest, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

@Controller('cats')
class CatsController {
  @Post()
  create(@Req() req: RawBodyRequest<FastifyRequest>) {
    const raw = req.rawBody; // returns a `Buffer`.
  }
}
```

#### Registering a different parser

By default, only the `application/json` and `application/x-www-form-urlencoded` parsers are registered. To use a different parser, register it explicitly.

For example, to register a `text/plain` parser:

```typescript
app.useBodyParser('text/plain');
```

> warning **Warning** Make sure you pass the correct application type to the `NestFactory.create()` call. For Fastify applications, the correct type is `NestFastifyApplication`; otherwise, the `useBodyParser()` method won't be found.

#### Body parser size limit

If your application needs to parse bodies larger than the Fastify default of 1 MiB, raise the limit:

```typescript
const bodyLimit = 10_485_760; // 10MiB
app.useBodyParser('application/json', { bodyLimit });
```

The `useBodyParser()` method respects the `rawBody` option passed in the application options.
