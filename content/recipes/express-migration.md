### Migrating from Express

An Express application can move to Nest one route at a time, with both serving requests, or all at once, in a single release. This page covers both.

#### Choose an approach

| Question | One route at a time | All at once |
| --- | --- | --- |
| How does it work? | Nest runs on your Express app, and routes move to it one by one | A new Nest application replaces the Express app in one release |
| What gets deployed? | Each moved route, on its own | Everything, once |
| What happens to feature work? | It continues, and new endpoints go into Nest | It waits, or gets written twice, until the switch |
| How do you go back? | Restore one route | Deploy the last Express release |
| Which Express version? | Express 5, so upgrade first | Any, since the Express app isn't touched |
| What about existing middleware? | It keeps running, for Nest's routes too | It moves to Nest with everything else |
| How long are there two styles in the code? | Until the last route moves | Never |

Move one route at a time when the application is large, when several people work on it, or when it can't wait. Move it all at once when it's small enough to review as one change and you can pin what it does with tests. That also suits a [coding agent](/recipes/express-migration#give-it-to-a-coding-agent), which can translate a whole application in one go, but can't tell on its own what must stay the same.

#### One route at a time

The Express app keeps its routes, middleware and error handler, new endpoints are written in Nest, and existing ones move over when you next change them. Both answer on the same port, behind the same middleware, so clients, sessions and authentication don't notice, and every step can be deployed on its own.

##### Requirements

- **Express 5.** Nest's Express adapter drives an Express 5 application, and an Express 4 one fails as soon as Nest starts. Upgrade the app first, with Express's [migration guide](https://expressjs.com/en/guide/migrating-5.html) and its codemod, `npx @expressjs/codemod upgrade`.
- **TypeScript.** The Nest code on this page is TypeScript. If the Express app is written in JavaScript, its files can stay as they are: TypeScript's `allowJs` option compiles them with the rest.

A CommonJS app can stay CommonJS. Nest's packages are ESM, which a CommonJS application loads on the Node.js versions listed in the [migration guide](/migration-guide#esm-packages).

Install Nest next to Express:

```bash
$ npm i --save @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs
```

##### Run Nest on the Express app

Nest normally creates its own Express app. Give it yours instead. Stop the Express app from listening, and export a function that builds it, so that tests can build their own:

```typescript
@@filename(legacy/app)
import express from 'express';
import { authenticate } from './auth.js';
import { errorHandler } from './errors.js';
import { ordersRouter } from './orders.router.js';

export function createLegacyApp() {
  const app = express();
  app.use(express.json());
  app.use(authenticate); // sets req.user
  app.use('/orders', ordersRouter);
  app.use(errorHandler);
  // app.listen(3000); <- Nest listens from now on
  return app;
}
```

Then pass it to the `ExpressAdapter`, and let Nest listen:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { createLegacyApp } from './legacy/app.js';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(createLegacyApp()),
  );
  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
```

Express runs its middleware and routes in the order they were added. Everything the Express app added comes first. Nest adds its routes when the application starts, in `listen()` or `init()`, and then a handler that answers the requests no route matched with a `404`. So:

- The Express routes answer as they did before.
- Nest's routes answer the requests the Express routes don't.
- Nest's routes see what the Express middleware put on the request, such as `req.user`, and the body its parsers read.
- A request for a route neither has gets Nest's `404` response.

> warning **Warning** Remove a catch-all `404` handler, such as `app.use((req, res) => res.status(404).send())`, from the Express app. It comes before Nest's routes, so it answers their requests too, and Nest's handler answers unknown routes in its place. Keep the error handler: an Express error handler only receives the errors of the middleware and routes added before it, so it keeps handling the Express routes' errors, while Nest's [exception filters](/exception-filters) handle the errors of Nest's.

Which part of the application runs for which routes:

| Part | Express routes | Nest routes |
| --- | --- | --- |
| Middleware added to the Express app (body parsers, sessions, authentication) | Yes | Yes |
| The Express app's error handler | Yes | No |
| Middleware added through Nest: [`MiddlewareConsumer`](/middleware), `app.use()`, `app.enableCors()` | No | Yes |
| [Guards](/guards), [interceptors](/interceptors), [pipes](/pipes) and [exception filters](/exception-filters) | No | Yes |

The middleware the Express app already runs is in front of Nest's routes as well, so a [guard](/guards) can check the user that the existing authentication middleware put on the request:

```typescript
@@filename(authenticated.guard)
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return Boolean(request.user);
  }
}
```

> info **Hint** With a [global prefix](/faq/global-prefix), Nest's `404` handler answers only the paths under the prefix. A path outside it that no Express route matches gets Express's default `404` page.

##### Move a route

Write new endpoints in Nest. To move an existing one, write it as a Nest route and delete it from the Express router. Because the Express routes come first, a Nest route with the same method and path doesn't answer until the Express one is gone, so both can be in the code until you're ready to switch:

```typescript
@@filename(orders/orders.controller)
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from '../authenticated.guard.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
@UseGuards(AuthenticatedGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
```

```typescript
@@filename(legacy/orders.router)
import express from 'express';
import { getOrder, listOrders } from './orders.handlers.js';

export const ordersRouter = express.Router();

ordersRouter.get('/', listOrders);
// ordersRouter.get('/:id', getOrder); <- deleted: Nest answers GET /orders/:id
```

`GET /orders` is still answered by Express, and `GET /orders/:id` falls through the Express router to Nest.

[End-to-end tests](/fundamentals/testing#end-to-end-testing) cover both kinds of route when the test application is built on the Express app too. Pass the adapter to `createNestApplication()`, and the same test checks a route before and after it moves:

```typescript
@@filename(test/orders.e2e-spec)
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ExpressAdapter } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { createLegacyApp } from '../src/legacy/app.js';

describe('Orders', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication(new ExpressAdapter(createLegacyApp()));
    await app.init();
  });

  it('lists orders (Express)', () => {
    return request(app.getHttpServer()).get('/orders').expect(200);
  });

  it('returns one order (Nest)', () => {
    return request(app.getHttpServer())
      .get('/orders/ord_1001')
      .set('Authorization', 'Bearer test-token')
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

##### Share code between the two

The Express app already has objects that Nest code needs, such as a database pool, repositories, or a mailer. Register them as [value providers](/fundamentals/custom-providers#value-providers-usevalue), so that Nest injects the same instances the Express code uses:

```typescript
@@filename(legacy/legacy.module)
import { Global, Module } from '@nestjs/common';
import { OrdersRepository, ordersRepository } from './orders.repository.js';

@Global()
@Module({
  providers: [{ provide: OrdersRepository, useValue: ordersRepository }],
  exports: [OrdersRepository],
})
export class LegacyModule {}
```

Import `LegacyModule` once in `AppModule`, and any provider can inject `OrdersRepository` by its class.

It works the other way too. Once `NestFactory.create()` returns, `app.get()` returns any provider, so a route that stays in Express can call logic that has already moved into a Nest service. Add the route before `listen()`, and it comes before Nest's routes like the rest of the Express app:

```typescript
@@filename(main)
const legacyApp = createLegacyApp();
const app = await NestFactory.create(AppModule, new ExpressAdapter(legacyApp));
legacyApp.use('/reports', reportsRouter(app.get(ReportsService)));
await app.listen(process.env.PORT ?? 3000);
```

##### Finish the migration

When the Express routers are empty, move what's left of the Express app into Nest: middleware into [Nest middleware](/middleware) or `app.use()`, and the error handler into an [exception filter](/exception-filters). Then delete the `legacy` folder, and create the application without an adapter argument:

```typescript
const app = await NestFactory.create(AppModule);
```

#### All at once

A new Nest application replaces the Express app in one release. Until then the Express app stays as it is, on whichever version of Express it runs, and it's the reference for what the new application must do.

Most of the risk isn't in the translation, because a wrong translation usually fails loudly. It's in what changes without an error: a status code, the shape of an error response, how a query string is parsed. So the migration starts with tests that notice those changes.

##### Pin the API with tests

Write tests that know only URLs, so that the same tests run against both applications. Go through every router and `app.use()` call, and cover each route's status code, body and important headers, for failures as well as successes:

```typescript
import assert from 'node:assert/strict';
import { test } from 'node:test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test('creating an order answers 200', async () => {
  const res = await fetch(`${BASE}/api/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ total: 10 }),
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'pending');
});

test('errors keep their shape', async () => {
  const res = await fetch(`${BASE}/api/orders/nope`, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), {
    error: { code: 'ORDER_NOT_FOUND', message: 'Order nope not found' },
  });
});
```

Run them against the Express app until they all pass, before writing any Nest code:

```bash
$ BASE_URL=http://localhost:3000 node --test test/contract.test.mjs
```

##### Translate the application

Create the Nest application with `nest new` next to the Express one, and move each router to a controller:

| Express | Nest |
| --- | --- |
| `express.Router()` for a resource | A [controller](/controllers) in a [module](/modules) (`nest generate resource`) |
| `router.get('/:id', handler)` | `@Get(':id')` on a method |
| `req.params`, `req.query`, `req.body` | `@Param()`, `@Query()`, `@Body()` |
| Validating `req.body` by hand | A [schema or a DTO](/application/validation), or keep the check if the tests pin its status and message |
| Authentication middleware that sets `req.user` | A [guard](/guards) that sets it, and a [custom decorator](/custom-decorators) that reads it |
| `requireRole('admin')` | Metadata on the route, read by a guard |
| `router.param('id', load)` | A [pipe](/pipes): `@Param('id', OrderByIdPipe)`. Guards run before pipes, so authentication still comes first |
| `res.json(x)` | `return x`, with `@HttpCode()` when the status isn't the default |
| `res.status(204).end()` | `@HttpCode(204)`, and return nothing |
| `res.redirect(301, url)` | `@Redirect(url, 301)` |
| `res.cookie()` | `@Res({{ '{' }} passthrough: true {{ '}' }}) res`, then `res.cookie()` and `return` as usual |
| `res.type()`, `res.attachment()` | `@Header()` |
| `res.write()` | `@Res() res`, then write to it as in Express |
| `next(err)` | `throw err`, handled by an [exception filter](/exception-filters) |
| The error handler and catch-all `404` | One global exception filter |
| `app.use(helmet())` | `app.use(helmet())` |
| `app.use(cors(options))` | `app.enableCors(options)` |
| `express.static(dir)` | `app.useStaticAssets(dir, {{ '{' }} prefix {{ '}' }})` |
| `multer(options).single('file')` | `@UseInterceptors(FileInterceptor('file', options))` and `@UploadedFile()` |
| Modules holding a database pool or a mailer | [Value providers](/fundamentals/custom-providers#value-providers-usevalue), at first, then services |

A router with authentication, a role check and a parameter handler becomes:

```typescript
@@filename(orders/orders.controller)
@Controller('api/orders')
@UseGuards(AuthGuard, RoleGuard)
export class OrdersController {
  @Post()
  @HttpCode(200) // Express answered 200, and a client depends on it
  create(@CurrentUser() user: User, @Body() body?: CreateOrderBody) {
    const { total, tags } = body ?? {};
    if (typeof total !== 'number' || total <= 0) {
      throw new ApiError(422, 'INVALID_TOTAL', 'total must be a positive number');
    }
    return createOrder(user.id, total, tags);
  }

  @Get('summary') // Declared before ':orderId', which would match it too
  @Role('admin')
  summary() {
    return { total: orders.size };
  }

  @Get(':orderId')
  findOne(@CurrentUser() user: User, @Param('orderId', OrderByIdPipe) order: Order) {
    if (user.role !== 'admin' && order.userId !== user.id) {
      throw new ApiError(403, 'FORBIDDEN', 'Not your order');
    }
    return order;
  }
}
```

##### Keep what would change without an error

These are the differences that compile, start and look right, and that your tests have to catch:

| In Express | In a Nest application | To keep the old behavior |
| --- | --- | --- |
| `res.json()` answers `200`, on a `POST` too | A `POST` handler answers `201` | `@HttpCode(200)` |
| Errors have the shape your handler gives them | `{{ '{' }} statusCode, message, error {{ '}' }}` | A global exception filter |
| An unknown route gets your `404` | `NotFoundException`, with Nest's body | The same filter |
| Malformed JSON reaches your handler as `entity.parse.failed` | `BadRequestException`, which a malformed URL such as `/orders/%FF` also raises | The same filter |
| A JSON body over 100 kB reaches your handler as `entity.too.large` | An `HttpException` with status `413` | The same filter |
| A multer error reaches your handler as `MulterError` | `FileInterceptor` raises `PayloadTooLargeException` for a size error, and a `400` for most others | The same filter, or run multer yourself |
| Only the body formats you added a parser for are read | JSON and URL-encoded bodies are both read | `bodyParser: false` in `NestFactory.create()`, then `app.use(express.json())` |
| `router.use(authenticate)` also answers for paths with no route under it | A guard runs only on routes that exist, so those paths get a `404` | Keep it as a middleware, with `consumer.apply(authenticate).forRoutes('api/orders/{{ '{' }}*path{{ '}' }}')`, if clients can tell |
| `router.param()` runs before a route's own middleware, so a missing record is a `404` for anyone | Every guard runs before any pipe, so `requireRole` answers first, with a `403` | Check the role in the handler, after the pipe, if clients can tell |
| On Express 4, `?min[total]=10` is `{{ '{' }} min: {{ '{' }} total: '10' {{ '}' }} {{ '}' }}` | Express 5's parser gives `{{ '{' }} 'min[total]': '10' {{ '}' }}` | `app.set('query parser', 'extended')` |
| On Express 4, a request with no body has `req.body` as `{{ '{' }}{{ '}' }}` | `@Body()` is `undefined`, so destructuring it throws | `body ?? {{ '{' }}{{ '}' }}` |
| `res.json('1.2.3')` sends a JSON string | Returning a string sends `text/html` | `@Res() res`, then `res.json('1.2.3')` |

Route paths have to change too, but those fail loudly: `/search/:term?` stops the application at startup, and needs `search{{ '{' }}/:term{{ '}' }}`. A wildcard needs a name, `assets/*path`, and `@Param('path')` gives its segments as an array. `assets/*path` doesn't match `/assets/` with nothing after it, so use `assets/{{ '{' }}*path{{ '}' }}` if Express 4 answered that path.

Coming from Express 4 also brings Express 5's own small changes, which tests that compare exact bytes will find: `charset=utf-8` where static files said `UTF-8`, and a different body on redirects. No client should depend on those, so accept them rather than pinning old versions of Express's libraries to reproduce them.

The filter and `main.ts` hold most of it. They must keep your error shape for every error, including the ones Nest raises itself, so check which of them your tests expect. This filter, for example, reports any `BadRequestException` as malformed JSON:

```typescript
@@filename(common/api-exception.filter)
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const send = (status: number, code: string, message: string) =>
      response.status(status).json({ error: { code, message } });

    if (exception instanceof ApiError) {
      return send(exception.status, exception.code, exception.message);
    }
    if (exception instanceof NotFoundException) {
      return send(404, 'NOT_FOUND', `No route for ${request.method} ${request.path}`);
    }
    if (exception instanceof BadRequestException) {
      return send(400, 'BAD_JSON', 'Malformed JSON');
    }
    if (exception instanceof PayloadTooLargeException) {
      return send(413, 'FILE_TOO_LARGE', 'File too large');
    }
    if (exception instanceof HttpException) {
      return send(exception.getStatus(), 'ERROR', exception.message);
    }
    console.error(exception);
    return send(500, 'INTERNAL', 'Something went wrong');
  }
}
```

```typescript
@@filename(main)
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('query parser', 'extended');
  app.use(helmet());
  app.enableCors({ origin: 'https://shop.example.com', credentials: true });
  app.useStaticAssets(join(import.meta.dirname, '..', 'public'), { prefix: '/static' });
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
```

##### Switch over

Run the same tests against the Nest application, and fix the application rather than the tests:

```bash
$ BASE_URL=http://localhost:3001 node --test test/contract.test.mjs
```

When they pass, deploy it in place of the Express app, and keep the last Express release deployable until the new one has served real traffic.

#### Give it to a coding agent

Either approach works with a coding agent, and all at once is the better fit when the application is small enough to review in one change. Point the agent at this page and hold it to the tests, so that it can't declare success on code that merely compiles:

```bash
Migrate this Express application to NestJS all at once, following
https://docs.nestjs.com/recipes/express-migration.md.

1. Before changing anything, write black-box HTTP tests that cover every
   route: status codes, bodies and important headers, failures included.
   Run them against the Express app until they all pass.
2. Build the Nest application next to it, using the page's translation table.
3. Check every row of "Keep what would change without an error".
4. Run the same tests against the Nest application. Don't edit a test to
   make it pass. If behavior has to change, stop and tell me.
```
