### Next.js

A Next.js application can use Nest as its backend: one repository, one origin for the browser, and request schemas shared by both applications.

Route handlers and Server Actions are enough for a small backend. As it grows, with background jobs, webhooks, a public API, a mobile client or a team of its own, it needs the structure that Nest gives it: modules, dependency injection, guards, and validation on every route. Next.js keeps rendering, and Nest takes over everything behind it:

| Next.js | Nest |
| --- | --- |
| Pages, layouts and Server Components | The API, and the business rules behind it |
| Forms, and the state of the browser | Validating what the forms send |
| Fetching data to render it | The database, and every other data source |
| | Sign-in, permissions, webhooks, queues, scheduled jobs |
| | Other clients, such as a mobile app |

This page sets up a Nest application next to a Next.js one, and then moves a backend from one to the other:

- Both live in one repository, as npm workspaces.
- The browser calls `/api` on the Next.js origin, and Next.js passes the request on to Nest, so cookies work without CORS.
- Zod schemas in a shared package validate a form in the browser and the same request in Nest.
- The route handlers you already have keep answering, and [move to Nest](/recipes/nextjs#migrate-a-nextjs-backend-to-nest) one at a time.

#### Project layout

```bash
acme/
├── apps/
│   ├── api/          # Nest
│   └── web/          # Next.js
├── packages/
│   └── contracts/    # schemas and types both apps use
└── package.json
```

The root `package.json` declares the workspaces:

```json
@@filename(package.json)
{
  "name": "acme",
  "private": true,
  "workspaces": ["apps/*", "packages/*"]
}
```

Create both applications without installing their packages, then install everything once, from the root:

```bash
$ npx @nestjs/cli new api --directory apps/api --skip-git --skip-install --package-manager npm
$ npx create-next-app@latest apps/web --yes --src-dir --disable-git --skip-install
$ npm install
```

`--skip-git` also leaves the Nest application without a `.gitignore`, so add one at the root of the repository:

```bash
node_modules
dist
.env
```

The Next.js development server takes port `3000`, so give Nest another one in `apps/api/src/main.ts`, and put its routes under `/api`, the path the browser will call:

```typescript
@@filename(apps/api/src/main)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3001);
}

await bootstrap();
```

#### Send `/api` to Nest

Next.js [rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites) pass a request on to another server and return its response, without the browser seeing a redirect. In `apps/web/next.config.ts`, send every `/api` request that the Next.js app doesn't answer itself to Nest:

```typescript
@@filename(apps/web/next.config)
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: `${process.env.API_URL}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
```

The browser talks to one origin, the Next.js one. A cookie that Nest sets, such as a session, is stored for that origin and sent back with every request to it, so it reaches Nest and Next.js alike, and Nest needs no [CORS](/security/cors) configuration.

`fallback` rewrites run after Next.js has checked all of its pages and route handlers, dynamic ones included. So an existing route handler, such as `src/app/api/orders/[id]/route.ts`, keeps answering its requests, and only the rest reach Nest. An `/api` path that neither app has gets Nest's `404` response. An `afterFiles` rewrite would run before dynamic routes, and pass that route handler's requests to Nest.

Set `API_URL` for development in `apps/web/.env.development`:

```bash
API_URL=http://localhost:3001
```

> warning **Warning** Next.js reads `rewrites()` when it builds the application, so `API_URL` must also be set for `next build`: a different value when the application starts doesn't change where its rewrites go.

Everything an API does goes through the rewrite untouched: cookies, raw request bodies for [webhook](/http/webhooks) signatures, [server-sent events](/http/server-sent-events) as they're written, and [WebSockets](/websockets/gateways) with the `ws` adapter. Two limits fail badly, with a `500` and no useful error: a request body over 10 MB, and a response that takes more than 30 seconds to start, such as a call to a language model. Raise them with two experimental options of Next.js:

```typescript
@@filename(apps/web/next.config)
const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: '100mb',
    proxyTimeout: 120_000,
  },
  // ...
};
```

Nest also sees the Next.js server as the client, so `req.ip` is its address, and anything that limits requests per IP address, such as [`@nestjs/throttler`](/security/rate-limiting), treats all your visitors as one. Next.js doesn't add `X-Forwarded-For` itself, but it passes on the one set by a load balancer in front of it. If you have one, call `app.set('trust proxy', 1)` on the `NestExpressApplication`. Without one, leave it off, or a visitor can claim any address.

#### Share schemas between the apps

Nest validates a request body against any [Standard Schema](https://standardschema.dev/) schema, such as a Zod one (see [Schema-based validation](/application/validation#schema-based-validation)). Put the schemas in a package of their own, `packages/contracts`, and the Next.js app validates its forms with the very schema that Nest checks the request against, and both use the types inferred from it.

```json
@@filename(packages/contracts/package.json)
{
  "name": "@acme/contracts",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^6.0.0"
  }
}
```

```json
@@filename(packages/contracts/tsconfig.json)
{
  "compilerOptions": {
    "module": "nodenext",
    "target": "es2023",
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true
  },
  "include": ["src"]
}
```

```typescript
@@filename(packages/contracts/src/index)
import { z } from 'zod';

export const createOrderSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderSchema = createOrderSchema.extend({
  id: z.string(),
  status: z.enum(['pending', 'paid', 'shipped']),
});
export type Order = z.infer<typeof orderSchema>;
```

The package is compiled, so that both applications import plain JavaScript and its type declarations. Add it to both applications, and build it (`npm run dev -w @acme/contracts` rebuilds it on every change):

```bash
$ npm install
$ npm i --save @acme/contracts -w api -w web
$ npm run build -w @acme/contracts
```

In Nest, bind the `StandardSchemaValidationPipe` and pass the schema to `@Body()`:

```typescript
@@filename(apps/api/src/main)
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  await app.listen(process.env.PORT ?? 3001);
}

await bootstrap();
```

```typescript
@@filename(apps/api/src/orders/orders.controller)
import { Body, Controller, Get, Post } from '@nestjs/common';
import { createOrderSchema, type CreateOrderInput, type Order } from '@acme/contracts';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Post()
  create(@Body({ schema: createOrderSchema }) input: CreateOrderInput): Promise<Order> {
    return this.ordersService.create(input);
  }
}
```

In Next.js, a form checks its input with the same schema before it sends anything:

```typescript
const input = createOrderSchema.safeParse({
  productId: formData.get('productId'),
  quantity: Number(formData.get('quantity')),
});
if (!input.success) {
  setError(input.error.issues[0].message);
  return;
}
await fetch('/api/orders', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(input.data),
});
```

A request that doesn't come from your form, from a script or an older version of the app, is still checked, by Nest:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "productId: Too small: expected string to have >=1 characters",
    "quantity: Too big: expected number to be <=20"
  ]
}
```

To run everything with one command, add `concurrently` to the root, and two scripts to its `package.json`. The shared package has to be built before the applications that import it:

```bash
$ npm i --save-dev concurrently
```

```json
@@filename(package.json)
{
  "scripts": {
    "dev": "npm run build -w @acme/contracts && concurrently -n contracts,api,web \"npm run dev -w @acme/contracts\" \"npm run start:dev -w api\" \"npm run dev -w web\"",
    "build": "npm run build -w @acme/contracts && npm run build -w api && npm run build -w web"
  }
}
```

#### Sign users in

Sign-in belongs to Nest, since the API is what it protects. [`@nestjs/authentication`](/security/authentication) keeps the session in an `HttpOnly` cookie, and a form signs in by posting to `/api/auth/sign-in` through the rewrite, like any other request from the browser. That chapter builds it, and one setting is specific to running behind Next.js.

The module ignores a session cookie on a `POST` from another origin, and refuses sign-ins from one, to stop cross-site request forgery. Behind a rewrite, Nest's own host is `localhost:3001` while the browser's `Origin` is `http://localhost:3000`. Browsers that send `Sec-Fetch-Site` pass anyway, but a client that sends only `Origin` gets a `403`. So name the Next.js origin as trusted:

```typescript
@@filename(apps/api/src/app.module)
AuthenticationModule.forRoot({
  session: {
    absoluteTtl: '14d',
    idleTtl: '3d',
    trustedOrigins: [process.env.WEB_ORIGIN ?? 'http://localhost:3000'],
  },
}),
```

Requests from any other origin are still refused.

#### Call Nest from the Next.js server

Server Components and Server Actions run on the Next.js server, so they call Nest directly, without the rewrite. The browser's cookies don't go with those requests unless you forward them, so put that in one helper:

```typescript
@@filename(apps/web/src/lib/api)
import { cookies } from 'next/headers';

/** Calls Nest from the Next.js server, on behalf of the browser that made the request. */
export async function api(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('cookie', (await cookies()).toString());
  return fetch(`${process.env.API_URL}/api${path}`, { ...init, headers });
}
```

```typescript
@@filename(apps/web/src/app/orders/page.tsx)
import { redirect } from 'next/navigation';
import type { Order } from '@acme/contracts';
import { api } from '@/lib/api';

export default async function OrdersPage() {
  const response = await api('/orders');
  if (response.status === 401) {
    redirect('/sign-in');
  }
  const orders: Order[] = await response.json();
  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>
          {order.productId} × {order.quantity} ({order.status})
        </li>
      ))}
    </ul>
  );
}
```

> warning **Warning** A page that fetches without reading cookies may be rendered during `next build`, so Nest has to be reachable from the build, or it fails with `fetch failed`.

#### Migrate a Next.js backend to Nest

Next.js's own [backend guide](https://nextjs.org/docs/app/guides/backend-for-frontend) says that its backend capabilities "are not a full backend replacement". A Next.js backend works well until it has to be one, and past that point a separate backend can be the simpler of the two.

##### Why it can be simpler

It isn't less code. The same four endpoints (list, create, read and cancel an order, for a signed-in user) came to about the same number of lines in route handlers as in a Nest controller and service. What changes is what you have to remember:

| | Route handlers | Nest |
| --- | --- | --- |
| Checking the session | In every handler, four times here. A handler that forgets is public | Once, in a [global guard](/security/authentication). A new route answers `401` until you mark it `@Public()` |
| Validating a body | Each handler parses it and builds its own `400` | `@Body({{ '{' }} schema {{ '}' }})`, and the handler only runs with valid input |
| A missing record | Each handler builds its own `404`, and a helper can't end the request for it | `throw new NotFoundException()` from anywhere, such as a service |
| Testing the logic | Handlers read `cookies()`, which throws `was called outside a request scope`, so a test has to mock `next/headers` | A service is a class: `new OrdersService()`, with no HTTP and no mocks of the framework |
| Finding an endpoint | One file per path, with the path in the folder names | One controller per resource |
| Scheduled jobs | Nothing built in, so a platform has to call a URL | `@Cron()`, in the same process as the rest of the application |
| WebSockets | Won't work where handlers are deployed as lambda functions, says the same guide | [Gateways](/websockets/gateways) |

Here's one of those four endpoints in both. As a route handler:

```typescript
@@filename(apps/web/src/app/api/orders/[id]/cancel/route.ts)
import { NextResponse } from 'next/server';
import { db, getSession } from '@/lib/backend';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const order = db.find(id);
  if (!order || order.userId !== session.userId) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  order.status = 'cancelled';
  return NextResponse.json(order);
}
```

The other handlers repeat its first lines. In Nest, the guard has already checked the session, and the service holds the rule, where the other methods can reuse it and a test can reach it:

```typescript
@@filename(apps/api/src/orders/orders.controller)
@Post(':id/cancel')
@HttpCode(200)
cancel(@CurrentUser() user: User, @Param('id') id: string) {
  return this.ordersService.cancel(user.id, id);
}
```

```typescript
@@filename(apps/api/src/orders/orders.service)
findOne(userId: string, id: string) {
  const order = this.rows.get(id);
  if (!order || order.userId !== userId) {
    throw new NotFoundException();
  }
  return order;
}

cancel(userId: string, id: string) {
  const order = this.findOne(userId, id);
  order.status = 'cancelled';
  return order;
}
```

```typescript
@@filename(apps/api/src/orders/orders.service.spec)
it("doesn't let another user cancel an order", () => {
  const orders = new OrdersService();
  const { id } = orders.create('u1', { productId: 'kibble', quantity: 1 });
  expect(() => orders.cancel('u2', id)).toThrow(NotFoundException);
});
```

You can get part of the way with helpers: a `withSession()` wrapper, then one for validation, then one that turns errors into responses. That's a reasonable step, and it's also writing your own guards, pipes and exception filters.

It does cost something. There's a second application to deploy, a rewrite to configure, and a network hop between a Server Component and its data. If your backend is a few handlers with one client and no background work, stay on route handlers.

##### What goes where

Write new endpoints in Nest, and move the existing ones when you next change them. Each piece of a Next.js backend has a place to go:

| In Next.js | In Nest |
| --- | --- |
| A route handler | A [controller](/controllers) method |
| A database query in a Server Component or a Server Action | A [service](/providers) behind an endpoint, called through `api()` |
| `getSession()` at the top of every handler | The global guard of [`@nestjs/authentication`](/security/authentication), and `@CurrentUser()` |
| Checking `request.json()` by hand | `@Body({{ '{' }} schema {{ '}' }})` |
| Role checks inside handlers | [`@nestjs/authorization`](/security/authorization) |
| A webhook route handler that reads `request.text()` | `@VerifyWebhook()` from [`@nestjs/webhooks`](/http/webhooks) |
| A cron route called by the platform | `@Cron()` from [`@nestjs/schedule`](/application/task-scheduling) |
| Work started with `after()`, such as sending email | A [queue](/application/queues), and [`@nestjs/mail`](/application/mail) |

##### Move one route

Write the endpoint in Nest under the same path, and delete the route handler. The URL doesn't change, so neither does any client. Because route handlers come before the rewrite, both can be in the code until you delete the route handler.

Then check what a client can see:

- **The status code.** `NextResponse.json()` answers `200` on a `POST`, and a Nest `POST` answers `201` unless you add `@HttpCode(200)`.
- **The shape of an error**, which is now `{{ '{' }} statusCode, message, error {{ '}' }}`. A [global exception filter](/recipes/express-migration#keep-what-would-change-without-an-error) keeps the old shape if clients depend on it.
- **Dynamic segments.** `[id]` becomes `:id`, and a catch-all `[...path]` becomes `*path`, whose `@Param('path')` is an array of segments.

##### Move queries out of pages

A Server Component or a Server Action that queries the database directly makes a request instead, and the query moves to a Nest service:

```typescript
@@filename(apps/web/src/app/orders/actions)
'use server';

import { revalidatePath } from 'next/cache';
import { createOrderSchema } from '@acme/contracts';
import { api } from '@/lib/api';

export async function placeOrder(formData: FormData) {
  const input = createOrderSchema.parse({
    productId: formData.get('productId'),
    quantity: Number(formData.get('quantity')),
  });
  const response = await api('/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('The order was refused.');
  }
  revalidatePath('/orders');
}
```

When nothing in `apps/web` imports the database client any more, remove it from the Next.js application, so that a page can't go around the API.

#### Deployment

The two applications deploy separately. Whatever the platform, the order is the same: build `@acme/contracts`, then the applications, with `API_URL` set for `next build`.

Nest runs anywhere Node.js does (see [Deployment](/deployment)). If you deploy the Next.js application on Vercel, set `API_URL` in its environment to Nest's address. Vercel can [deploy Nest](https://vercel.com/docs/frameworks/backend/nestjs) too, as a project of its own. Other clients, such as a mobile app, call Nest's address directly, and need a [CORS](/security/cors) configuration only if they run in a browser on another origin.
