### Migrating from Express

An Express application can move to Nest one route at a time: Nest runs on your existing Express app, and both serve requests while you migrate.

A rewrite stops feature work until it catches up with the application it replaces. Here, nothing stops. The Express app keeps its routes, middleware and error handler, new endpoints are written in Nest, and existing ones move over when you next change them. Both answer on the same port, behind the same middleware, so clients, sessions and authentication don't notice, and every step can be deployed on its own.

#### Requirements

- **Express 5.** Nest's Express adapter drives an Express 5 application, and an Express 4 one fails as soon as Nest starts. Upgrade the app first, with Express's [migration guide](https://expressjs.com/en/guide/migrating-5.html) and its codemod, `npx @expressjs/codemod upgrade`.
- **TypeScript.** The Nest code on this page is TypeScript. If the Express app is written in JavaScript, its files can stay as they are: TypeScript's `allowJs` option compiles them with the rest.

A CommonJS app can stay CommonJS. Nest's packages are ESM, which a CommonJS application loads on the Node.js versions listed in the [migration guide](/migration-guide#esm-packages).

Install Nest next to Express:

```bash
$ npm i --save @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs
```

#### Run Nest on the Express app

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

#### Move a route

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

#### Share code between the two

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

#### Finish the migration

When the Express routers are empty, move what's left of the Express app into Nest: middleware into [Nest middleware](/middleware) or `app.use()`, and the error handler into an [exception filter](/exception-filters). Then delete the `legacy` folder, and create the application without an adapter argument:

```typescript
const app = await NestFactory.create(AppModule);
```
