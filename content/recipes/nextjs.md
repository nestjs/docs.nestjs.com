### Next.js

A Next.js application can use Nest as its backend: one repository, one origin for the browser, and request schemas shared by both applications.

Route handlers and Server Actions are enough for a small backend. As it grows, with background jobs, webhooks, a public API, a mobile client or a team of its own, it needs the structure that Nest gives it: modules, dependency injection, guards, and validation on every route. This page sets up a Nest application next to a Next.js one:

- Both live in one repository, as npm workspaces.
- The browser calls `/api` on the Next.js origin, and Next.js passes the request on to Nest, so cookies work without CORS.
- Server Components call Nest directly.
- Zod schemas in a shared package validate a form in the browser and the same request in Nest.
- The route handlers you already have keep answering, and move to Nest one at a time.

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
$ npx create-next-app@latest apps/web --yes --disable-git --skip-install
$ npm install
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

`fallback` rewrites run after Next.js has checked all of its pages and route handlers, dynamic ones included. So an existing route handler, such as `src/app/api/health/route.ts` or `src/app/api/orders/[id]/route.ts`, keeps answering its requests, and only the rest reach Nest. An `/api` path that neither app has gets Nest's `404` response. An `afterFiles` rewrite would run before dynamic routes, and pass the requests of `src/app/api/orders/[id]/route.ts` to Nest.

> warning **Warning** Next.js reads `rewrites()` when it builds the application, so `API_URL` must be set for `next build`, not only for `next start`: a different value when the application starts doesn't change where its rewrites go. Set it for both, since Server Components read it at request time.

For development, set it in `apps/web/.env.development`:

```bash
API_URL=http://localhost:3001
```

#### Call Nest from Server Components

A Server Component runs on the Next.js server, so it can call Nest directly, without the rewrite. The browser's cookies don't go with that request unless you forward them, as the orders page does in `apps/web/src/app/orders/page.tsx`:

```typescript
@@filename(apps/web/src/app/orders/page.tsx)
import { cookies } from 'next/headers';
import type { Order } from '@acme/contracts';
import { OrderForm } from './order-form';

export default async function OrdersPage() {
  const response = await fetch(`${process.env.API_URL}/api/orders`, {
    headers: { cookie: (await cookies()).toString() },
  });
  if (!response.ok) {
    return <p>Sign in to see your orders.</p>;
  }
  const orders: Order[] = await response.json();
  return (
    <main>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            {order.productId} × {order.quantity} ({order.status})
          </li>
        ))}
      </ul>
      <OrderForm />
    </main>
  );
}
```

Server Actions and route handlers run on the Next.js server too, and call Nest the same way.

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

The package is compiled, so that both applications import plain JavaScript and its type declarations. Add Zod and TypeScript to it, add it to both applications, and build it (`npm run dev -w @acme/contracts` rebuilds it on every change):

```bash
$ npm i --save zod -w @acme/contracts
$ npm i --save-dev typescript -w @acme/contracts
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

In Next.js, a Client Component, `apps/web/src/app/orders/order-form.tsx`, checks the form with the same schema before it sends the request, through the rewrite, to Nest:

```typescript
@@filename(apps/web/src/app/orders/order-form.tsx)
'use client';

import { useState } from 'react';
import { createOrderSchema, type Order } from '@acme/contracts';

export function OrderForm() {
  const [error, setError] = useState<string>();
  const [order, setOrder] = useState<Order>();

  async function submit(formData: FormData) {
    const input = createOrderSchema.safeParse({
      productId: formData.get('productId'),
      quantity: Number(formData.get('quantity')),
    });
    if (!input.success) {
      setError(input.error.issues[0].message);
      return;
    }
    setError(undefined);
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input.data),
    });
    setOrder(await response.json());
  }

  return (
    <form action={submit}>
      <input name="productId" />
      <input name="quantity" type="number" defaultValue={1} />
      <button>Order</button>
      {error && <p>{error}</p>}
      {order && <p>Order {order.id} placed.</p>}
    </form>
  );
}
```

A request that skips the form, from a script or an older version of the app, is still checked, by Nest:

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

To run the three packages in development, start each in its own terminal:

```bash
$ npm run dev -w @acme/contracts
$ npm run start:dev -w api
$ npm run dev -w web
```

#### Move route handlers to Nest

Write new endpoints in Nest. To move one that a route handler serves, write it in Nest under the same path, and delete the route handler. The URL doesn't change, so neither does any client: the request that `src/app/api/orders/route.ts` used to answer now falls through the rewrite, and `OrdersController` answers it, under the `api` prefix. Because route handlers come before the rewrite, both can be in the code until you delete the route handler.

#### Deployment

The two applications deploy separately. The Next.js app goes wherever you deploy it today, built with `API_URL` set to Nest's address, and Nest runs anywhere Node.js does (see [Deployment](/deployment)). Other clients, such as a mobile app, call Nest's address directly, and need a [CORS](/security/cors) configuration only if they run in a browser on another origin.
