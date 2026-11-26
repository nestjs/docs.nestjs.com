### Build an e-commerce backend in Node.js

Build an e-commerce backend in Node.js with NestJS and PostgreSQL: a product catalog, shopping carts, and a checkout that never oversells stock.

The shop has a product catalog that staff manage, a cart for every customer, and a checkout that turns the cart into an order without ever selling more than is in stock. Most of an e-commerce backend is ordinary CRUD. The parts that aren't are where money and stock change hands, so this tutorial spends its time there: prices in integer cents, prices frozen into each order, stock taken in the same statement that checks it, and checkouts that are safe when a customer double-clicks or a thousand customers want the last item.

By the end, the API will:

- Let anyone browse and search the catalog, and only staff create and edit products, with [`@nestjs/authorization`](/security/authorization), which denies any route that doesn't declare who may call it.
- Keep a cart per customer, priced at today's prices, and show which lines can't be bought right now.
- Check out in one database transaction: take the cart, take the stock, record the prices, or change nothing at all.
- Let customers cancel orders that haven't shipped, which puts the stock back, and let staff ship them.
- Prove, in a test against PostgreSQL, that ten customers racing for the last unit produce exactly one order.

It starts from the API of [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication), which signs users in with access and refresh tokens, validates requests with Zod, and keeps its data in PostgreSQL through Drizzle. This tutorial doesn't explain those parts again.

These are the endpoints, and the section that adds each one:

| Endpoint | Section |
| --- | --- |
| `POST /auth/sign-up`, `POST /auth/token`, `POST /auth/token/refresh`, `POST /auth/token/revoke`, `GET /me`, `GET /health/live`, `GET /health/ready` | [Start from the JWT API](/tutorials/ecommerce-backend#start-from-the-jwt-api) |
| `GET /products`, `GET /products/:id`, `POST /products`, `PATCH /products/:id` | [Let staff manage the catalog](/tutorials/ecommerce-backend#let-staff-manage-the-catalog) |
| `GET /cart`, `PUT /cart/items/:productId`, `DELETE /cart/items/:productId` | [Keep a cart](/tutorials/ecommerce-backend#keep-a-cart) |
| `POST /orders`, `GET /orders`, `GET /orders/:id` | [Check out without overselling](/tutorials/ecommerce-backend#check-out-without-overselling) |
| `POST /orders/:id/cancel`, `POST /orders/:id/ship` | [Cancel and ship orders](/tutorials/ecommerce-backend#cancel-and-ship-orders) |

> info **Hint** The finished application is on GitHub as [nestjs/example-ecommerce-backend](https://github.com/nestjs/example-ecommerce-backend), with its tests and a CI workflow.

#### Start from the JWT API

Create the project, and install everything this tutorial uses. These are the JWT tutorial's packages plus `@nestjs/authorization`. `nest new` also installs the [NestJS Observe SDK](/observability/sdk), `@nestjs/observe`, and wires it in; the application's own files keep it:

```bash
$ npm i -g @nestjs/cli
$ nest new shop-api --minimal
$ cd shop-api
$ npm uninstall @nestjs/platform-express @types/express
$ npm i --save @nestjs/platform-node zod @nestjs/config @nestjs/drizzle drizzle-orm@rc pg @nestjs/authentication @nestjs/authorization @nestjs/throttler @nestjs/swagger @nestjs/terminus
$ npm i --save-dev drizzle-kit@rc @types/pg @nestjs/testing vitest vite
```

Then take these files from the [finished JWT tutorial](/tutorials/rest-api-jwt-authentication#sign-users-in-with-jwts), as they are:

- `src/config.ts`, `src/main.ts`, `drizzle.config.ts` and `vitest.config.e2e.ts`
- everything under `src/auth/`, `src/users/` and `src/health/`
- `test/refresh-token.store.e2e-spec.ts`

Leave out `src/notes/` and the JWT tutorial's `drizzle/` folder: this application's first migration comes from its own schema, in the next section. Rename the notes to the shop where they're named: the `realm` in `JwtAuth` and the title of the OpenAPI document in `main.ts`. Add the test script to `package.json`:

```json
"test:e2e": "vitest run --config ./vitest.config.e2e.ts"
```

Finally, add the database's URL and a `JWT_SECRET` to `.env`, as in the JWT tutorial, with a database of the shop's own:

```bash
$ docker run -d --name shop-db -e POSTGRES_PASSWORD=shop -e POSTGRES_DB=shop -p 5432:5432 postgres:17
```

Its URL goes in `.env`, next to the signing secret:

```bash
DATABASE_URL=postgres://postgres:shop@localhost:5432/shop
# Generate with: openssl rand -base64 32
JWT_SECRET=
```

Customers and staff use the same sign-in, so a user now has a role:

```typescript
@@filename(src/users/user)
export type Role = 'customer' | 'staff';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
}
```

`UsersRepository` returns it with the other columns:

```typescript
@@filename(src/users/users.repository)
// ...
const columns = { id: users.id, email: users.email, role: users.role, createdAt: users.createdAt };
```

The role isn't in the access token. `JwtAuth.validate()` loads the user on every request, so promoting a user to staff, or demoting them, takes effect on their next request, not when their token expires.

#### Design the schema

The whole schema, in one file. The users and refresh tokens are the JWT tutorial's, with the role added:

```typescript
@@filename(src/database/schema)
import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['customer', 'staff'] }).notNull().default('customer'),
  createdAt: at('created_at').notNull().defaultNow(),
});

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    // Money in integer cents: no floating-point rounding.
    price: integer('price').notNull(),
    stock: integer('stock').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  (table) => [
    check('products_price_positive', sql`${table.price} > 0`),
    // The last line of defense against overselling.
    check('products_stock_not_negative', sql`${table.stock} >= 0`),
  ],
);

export const cartItems = pgTable(
  'cart_items',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.productId] })],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    status: text('status', { enum: ['placed', 'shipped', 'cancelled'] }).notNull(),
    total: integer('total').notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  (table) => [index('orders_user_id_created_at_idx').on(table.userId, table.createdAt)],
);

// What was bought, at the price it was bought at: later price changes don't rewrite past orders.
export const orderItems = pgTable(
  'order_items',
  {
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    name: text('name').notNull(),
    unitPrice: integer('unit_price').notNull(),
    quantity: integer('quantity').notNull(),
  },
  (table) => [primaryKey({ columns: [table.orderId, table.productId] })],
);

// What @nestjs/authentication keeps for refresh tokens, stored by their SHA-256.
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: text('id').primaryKey(),
    familyId: text('family_id').notNull(),
    userId: text('user_id').notNull(),
    createdAt: at('created_at').notNull(),
    expiresAt: at('expires_at').notNull(),
    familyExpiresAt: at('family_expires_at').notNull(),
    usedAt: at('used_at'),
    // A family is revoked when any of its tokens is.
    revoked: boolean('revoked').notNull().default(false),
    claims: jsonb('claims').$type<Record<string, unknown>>(),
  },
  (table) => [
    index('refresh_tokens_family_id_idx').on(table.familyId),
    index('refresh_tokens_user_id_idx').on(table.userId),
    index('refresh_tokens_family_expires_at_idx').on(table.familyExpiresAt),
  ],
);

export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
```

- **Prices are integers, in cents.** `19.99` can't be stored exactly as a floating-point number, and a total of many of them drifts. `1999` can.
- **An order item copies the product's name and price.** When staff change a price or rename a product, past orders keep what the customer paid for.
- **The cart is a table, keyed by user and product.** Setting a line's quantity is one upsert, and the same product can't appear twice.
- **Products are deactivated, not deleted.** Order items keep referring to them.
- **`stock` can't go below zero.** The checkout never tries, but if a future change gets it wrong, PostgreSQL refuses the write instead of storing a negative stock.

Generate the migration and apply it (see [Migrations](/data/drizzle#migrations)):

```bash
$ npx drizzle-kit generate --name=shop
$ npx drizzle-kit migrate
```

#### Let staff manage the catalog

[`@nestjs/authorization`](/security/authorization) expresses permissions as **policies**, classes whose methods answer "may this user do this?". Register its module right after `AuthenticationModule`: both register a global guard, and authorization's needs the user that authentication sets. With the shop's feature modules, the root module is:

```typescript
@@filename(src/app.module)
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { DrizzleModule } from '@nestjs/drizzle';
import { createObserveModule } from '@nestjs/observe';
import { ThrottlerGuard, ThrottlerModule, minutes, normalizeIp } from '@nestjs/throttler';
import { drizzle } from 'drizzle-orm/node-postgres';
import { accountEmail } from './auth/account-email.js';
import { AuthModule } from './auth/auth.module.js';
import { envSchema, type Env } from './config.js';
import { CartModule } from './cart/cart.module.js';
import { HealthModule } from './health/health.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { ProductsModule } from './products/products.module.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'shop-api',
    }),
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        drizzle,
        connection: config.get('DATABASE_URL', { infer: true }),
      }),
    }),
    AuthenticationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        accessToken: {
          key: config.get('JWT_SECRET', { infer: true }),
          issuer: 'shop-api',
          audience: 'shop-api',
          ttl: '15m',
        },
        refreshToken: { ttl: '30d', absoluteTtl: '90d' },
      }),
    }),
    // After AuthenticationModule: its guard reads the user that authentication sets.
    AuthorizationModule.forRoot(),
    ThrottlerModule.forRoot([
      // Per IP address, on every route.
      { name: 'default', ttl: minutes(1), limit: 100 },
      // Per email and IP address, wherever the request body names an account.
      {
        name: 'account',
        ttl: minutes(15),
        limit: 5,
        skipIf: (context) => !accountEmail(context.switchToHttp().getRequest()),
        getTracker: (req) => `${accountEmail(req)}|${normalizeIp(req.ip)}`,
      },
    ]),
    UsersModule,
    AuthModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

- **`ObserveModule` comes first** in `imports`, as the [SDK's quick start](/observability/sdk#quick-start) does: modules shut down in reverse order, so it stops last, and sends what the others recorded (see [Shutdown](/observability/sdk#shutdown)). `main.ts`, from the JWT tutorial, passes `ObserveInstrument` to Nest.
- **The key pair is empty until you link the project.** Without one, the SDK sends nothing, and says so at startup. `npx @nestjs/observe link` writes `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` into `.env`, and adds `--env-file .env` to the `start` scripts, so they're in the environment before `AppModule` is imported, when the SDK reads them (see [Linking from the terminal](/observability/sdk#linking-from-the-terminal)).

The authorization guard **denies by default**: a route runs only if it declares who may call it, with `@Can()` for a policy check, `@Can.Anyone()` for any caller that authentication let through, or `@Public()`, which counts as `@Can.Anyone()`. A route whose declaration was forgotten is closed, not open, and the module logs every such route at startup. The routes from the JWT tutorial under `/auth` and `/health` are `@Public()` already. `GET /me` is for any signed-in user:

```typescript
@@filename(src/users/me.controller)
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import type { User } from './user.js';

@Can.Anyone()
@Controller('me')
export class MeController {
  @Get()
  me(@CurrentUser() user: User) {
    return user;
  }
}
```

The catalog's policy has one ability: managing products. The user parameter accepts `null`, a guest, so the guard can call it on any route:

```typescript
@@filename(src/products/product.policy)
import { Policy } from '@nestjs/authorization';
import type { User } from '../users/user.js';

@Policy()
export class ProductPolicy {
  // `null` is a guest.
  manage(user: User | null) {
    return user?.role === 'staff';
  }
}
```

The request schemas. Prices are validated as whole numbers of cents, so `19.99` is a 400 rather than a rounding question:

```typescript
@@filename(src/products/products.schemas)
import { z } from 'zod';

const name = z.string().trim().min(1).max(200);
const description = z.string().max(5_000);
// In cents: 1999 is 19.99.
const price = z.number().int().positive().max(10_000_000);
const stock = z.number().int().min(0);

export const createProductSchema = z.object({ name, description: description.default(''), price, stock });
export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({ name, description, price, stock, active: z.boolean() }).partial();
export type UpdateProductDto = z.infer<typeof updateProductSchema>;

export const listProductsQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
```

As in the JWT tutorial, the update schema isn't derived from the create schema with `partial()`, which would keep the `description` default and clear the description on every update.

```typescript
@@filename(src/products/products.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq, ilike } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { products, type Product } from '../database/schema.js';
import type { CreateProductDto, ListProductsQuery, UpdateProductDto } from './products.schemas.js';

@Injectable()
export class ProductsService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  findAll({ q, limit, offset }: ListProductsQuery): Promise<Product[]> {
    return this.db
      .select()
      .from(products)
      .where(and(eq(products.active, true), q ? ilike(products.name, `%${escapeLike(q)}%`) : undefined))
      .orderBy(asc(products.name), asc(products.id))
      .limit(limit)
      .offset(offset);
  }

  async findOne(id: string): Promise<Product> {
    const [product] = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.active, true)));
    return product ?? notFound();
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const [product] = await this.db.insert(products).values(dto).returning();
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const [product] = await this.db.update(products).set(dto).where(eq(products.id, id)).returning();
    return product ?? notFound();
  }
}

function notFound(): never {
  throw new NotFoundException('Product not found');
}

/** `%` and `_` in the search are literal characters, not wildcards. */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);
```

The search goes through Drizzle's `ilike()`, which sends the pattern as a parameter, so it can't inject SQL. Escaping `%` and `_` keeps a search for `100%` from matching everything.

The read routes are `@Public()`, and the write routes check the policy before the handler runs. A guest gets a 401, which asks them to sign in, and a signed-in customer a 403, which says signing in won't help:

```typescript
@@filename(src/products/products.controller)
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ApiSecurity } from '@nestjs/swagger';
import { z } from 'zod';
import { ProductPolicy } from './product.policy.js';
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
  type CreateProductDto,
  type ListProductsQuery,
  type UpdateProductDto,
} from './products.schemas.js';
import { ProductsService } from './products.service.js';

const productId = { schema: z.uuid() };

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @ApiSecurity({})
  @Get()
  findAll(@Query({ schema: listProductsQuerySchema }) query: ListProductsQuery) {
    return this.productsService.findAll(query);
  }

  @Public()
  @ApiSecurity({})
  @Get(':id')
  findOne(@Param('id', productId) id: string) {
    return this.productsService.findOne(id);
  }

  @Can(ProductPolicy, 'manage')
  @Post()
  create(@Body({ schema: createProductSchema }) dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Can(ProductPolicy, 'manage')
  @Patch(':id')
  update(@Param('id', productId) id: string, @Body({ schema: updateProductSchema }) dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }
}
```

`@Can()` is type-checked against the policy, so a misspelled ability doesn't compile. Register the policy as a provider of its module; the authorization module finds it there:

```typescript
@@filename(src/products/products.module)
import { Module } from '@nestjs/common';
import { ProductPolicy } from './product.policy.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductPolicy],
})
export class ProductsModule {}
```

Sign-up creates customers. Promote the first staff member in the database (from then on, an admin screen of your own can do it):

```bash
$ docker exec shop-db psql -U postgres -d shop -c "UPDATE users SET role = 'staff' WHERE email = 'sam@example.com'"
```

#### Keep a cart

A cart line is a product and a quantity. Setting a quantity is an upsert on the table's primary key, so a repeated request leaves the same cart:

```typescript
@@filename(src/cart/cart.schemas)
import { z } from 'zod';

export const setQuantitySchema = z.object({
  quantity: z.number().int().min(1).max(100),
});
export type SetQuantityDto = z.infer<typeof setQuantitySchema>;
```

The service reads the cart at today's prices, and sets a line with that upsert:

```typescript
@@filename(src/cart/cart.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { cartItems, products } from '../database/schema.js';

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  /** Whether checkout can take this line right now. */
  available: boolean;
}

export interface Cart {
  items: CartLine[];
  /** In cents, at today's prices. */
  total: number;
}

@Injectable()
export class CartService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async get(userId: string): Promise<Cart> {
    const rows = await this.db
      .select({
        productId: cartItems.productId,
        name: products.name,
        unitPrice: products.price,
        quantity: cartItems.quantity,
        active: products.active,
        stock: products.stock,
      })
      .from(cartItems)
      .innerJoin(products, eq(products.id, cartItems.productId))
      .where(eq(cartItems.userId, userId))
      .orderBy(asc(products.name));
    const items = rows.map(({ active, stock, ...line }) => ({ ...line, available: active && stock >= line.quantity }));
    const total = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    return { items, total };
  }

  async setQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
    const [product] = await this.db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.active, true)));
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    // Stock isn't reserved here: checkout checks it, in the same statement that takes it.
    await this.db
      .insert(cartItems)
      .values({ userId, productId, quantity })
      .onConflictDoUpdate({ target: [cartItems.userId, cartItems.productId], set: { quantity } });
    return this.get(userId);
  }

  async remove(userId: string, productId: string): Promise<Cart> {
    await this.db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
    return this.get(userId);
  }
}
```

The cart doesn't reserve stock. Reserving it when a customer adds an item would let abandoned carts hold the whole inventory; the cart shows `available: false` for a line that can't be bought right now, and the checkout is where the stock is actually taken. The cart is priced at today's prices, and the order at the prices of the moment of checkout.

Every signed-in user has a cart, so the controller declares `@Can.Anyone()`, and each query is scoped to the user from the token:

```typescript
@@filename(src/cart/cart.controller)
import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import { setQuantitySchema, type SetQuantityDto } from './cart.schemas.js';
import { CartService } from './cart.service.js';

const productId = { schema: z.uuid() };

// Every signed-in customer has a cart, and only sees their own.
@Can.Anyone()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  get(@CurrentUser('id') userId: string) {
    return this.cartService.get(userId);
  }

  @Put('items/:productId')
  setQuantity(
    @CurrentUser('id') userId: string,
    @Param('productId', productId) id: string,
    @Body({ schema: setQuantitySchema }) { quantity }: SetQuantityDto,
  ) {
    return this.cartService.setQuantity(userId, id, quantity);
  }

  @Delete('items/:productId')
  remove(@CurrentUser('id') userId: string, @Param('productId', productId) id: string) {
    return this.cartService.remove(userId, id);
  }
}
```

The cart module registers the controller and the service:

```typescript
@@filename(src/cart/cart.module)
import { Module } from '@nestjs/common';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';

@Module({
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
```

#### Check out without overselling

Checkout is where an e-commerce backend usually goes wrong. The obvious version reads the product, checks that `stock` is high enough, and writes the new stock. Two customers who check out at the same moment both read a stock of 1, both pass the check, and both get an order for the last unit. A test at the end of this tutorial runs ten such customers against PostgreSQL: that version accepted several orders for the single unit in every run.

The checkout below takes everything it needs with conditional statements, inside one transaction:

```typescript
@@filename(src/orders/orders.service)
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { cartItems, orderItems, orders, products, type Order, type OrderItem } from '../database/schema.js';

export type OrderWithItems = Order & { items: Omit<OrderItem, 'orderId'>[] };

@Injectable()
export class OrdersService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  /** Turns the user's cart into an order, or throws without changing anything. */
  checkout(userId: string): Promise<OrderWithItems> {
    return this.db.transaction(async (tx) => {
      // Taking the cart is the first statement. A second checkout of the same
      // cart waits for this transaction, then finds it empty.
      const taken = await tx.delete(cartItems).where(eq(cartItems.userId, userId)).returning();
      if (taken.length === 0) {
        throw new ConflictException('Your cart is empty');
      }
      // Lock products in one order across all checkouts, so two of them never deadlock.
      taken.sort((a, b) => a.productId.localeCompare(b.productId));

      const items: Omit<OrderItem, 'orderId'>[] = [];
      for (const { productId, quantity } of taken) {
        // Checks and takes the stock in one statement: no read-then-write window.
        const [product] = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${quantity}` })
          .where(and(eq(products.id, productId), eq(products.active, true), gte(products.stock, quantity)))
          .returning({ name: products.name, price: products.price });
        if (!product) {
          // Rolls back the whole transaction: the cart and the other products are untouched.
          throw new ConflictException(`Not enough stock for product ${productId}`);
        }
        items.push({ productId, name: product.name, unitPrice: product.price, quantity });
      }

      const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const [order] = await tx.insert(orders).values({ userId, status: 'placed', total }).returning();
      await tx.insert(orderItems).values(items.map((item) => ({ ...item, orderId: order.id })));
      return { ...order, items };
    });
  }

  // findMine(), findOne(), cancel() and ship() follow in the next section.
}
```

- **The stock is checked and taken by one `UPDATE`**, whose `WHERE` clause requires enough stock. PostgreSQL locks the row while it updates it, so a second checkout's `UPDATE` waits for the first transaction, then sees the stock it left. When there isn't enough, the statement changes no row and returns nothing, and the checkout throws.
- **Throwing rolls everything back.** `transaction()` from [Drizzle](/data/drizzle#drizzle-transactions) rolls back when its callback throws, so a checkout that fails on its third product leaves the first two products' stock and the whole cart as they were. Nest turns the `ConflictException` into a 409.
- **The cart is taken first, with `DELETE ... RETURNING`.** That's what makes a double-clicked checkout safe: the second request's `DELETE` waits for the first transaction's lock on the same rows, and once the first commits, it finds the cart empty and answers 409. One click, one order, with no idempotency key to manage.
- **Products are locked in the same order by every checkout.** Two carts with the same two products, taken in opposite orders, would each hold one row and wait for the other's, and PostgreSQL would abort one of them as a deadlock. Sorting by product id rules that out.
- **The prices come from the `UPDATE`'s `RETURNING`**, so the order records the price at the moment the stock was taken, not the price the cart showed earlier.
- **Every query goes through `tx`.** A query on the injected database instead would run on another connection of the pool, outside the transaction.

#### Cancel and ship orders

An order moves from `placed` to either `cancelled`, by its customer, or `shipped`, by staff. Both are conditional updates on the current status, so when a customer cancels at the moment a staff member ships, exactly one of them wins, and the other gets a 409. Cancelling also puts the stock back, in the same transaction. The rest of `OrdersService`:

```typescript
@@filename(src/orders/orders.service)
  findMine(userId: string): Promise<Order[]> {
    return this.db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(100);
  }

  async findOne(userId: string, id: string): Promise<OrderWithItems> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, userId)));
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return { ...order, items: await this.items(this.db, order.id) };
  }

  /** The owner cancels an order that hasn't shipped, and its stock goes back. */
  cancel(userId: string, id: string): Promise<Order> {
    return this.db.transaction(async (tx) => {
      // Conditional: of a cancel and a ship racing for the same order, one wins.
      const [order] = await tx
        .update(orders)
        .set({ status: 'cancelled' })
        .where(and(eq(orders.id, id), eq(orders.userId, userId), eq(orders.status, 'placed')))
        .returning();
      if (!order) {
        return this.refuse(tx, id, userId);
      }
      for (const { productId, quantity } of await this.items(tx, order.id)) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${quantity}` })
          .where(eq(products.id, productId));
      }
      return order;
    });
  }

  /** Staff mark a placed order as shipped. */
  async ship(id: string): Promise<Order> {
    const [order] = await this.db
      .update(orders)
      .set({ status: 'shipped' })
      .where(and(eq(orders.id, id), eq(orders.status, 'placed')))
      .returning();
    return order ?? this.refuse(this.db, id);
  }

  private items(db: Pick<NodePgDatabase, 'select'>, orderId: string) {
    return db
      .select({
        productId: orderItems.productId,
        name: orderItems.name,
        unitPrice: orderItems.unitPrice,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(orderItems.name));
  }

  /** Why a conditional update changed nothing: 404 if the order isn't there (or isn't theirs), 409 otherwise. */
  private async refuse(db: Pick<NodePgDatabase, 'select'>, id: string, userId?: string): Promise<never> {
    const [order] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(and(eq(orders.id, id), userId ? eq(orders.userId, userId) : undefined));
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    throw new ConflictException(`Order is already ${order.status}`);
  }
}
```

Another customer's order is a 404, like an order that doesn't exist. Shipping needs a second policy:

```typescript
@@filename(src/orders/order.policy)
import { Policy } from '@nestjs/authorization';
import type { User } from '../users/user.js';

@Policy()
export class OrderPolicy {
  ship(user: User | null) {
    return user?.role === 'staff';
  }
}
```

The controller checks that policy on the ship route. The other routes are for any signed-in customer, whose queries are scoped to them:

```typescript
@@filename(src/orders/orders.controller)
import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import { OrderPolicy } from './order.policy.js';
import { OrdersService } from './orders.service.js';

const orderId = { schema: z.uuid() };

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Checkout: the cart becomes an order.
  @Can.Anyone()
  @Post()
  checkout(@CurrentUser('id') userId: string) {
    return this.ordersService.checkout(userId);
  }

  @Can.Anyone()
  @Get()
  findMine(@CurrentUser('id') userId: string) {
    return this.ordersService.findMine(userId);
  }

  @Can.Anyone()
  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id', orderId) id: string) {
    return this.ordersService.findOne(userId, id);
  }

  @Can.Anyone()
  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser('id') userId: string, @Param('id', orderId) id: string) {
    return this.ordersService.cancel(userId, id);
  }

  @Can(OrderPolicy, 'ship')
  @Post(':id/ship')
  @HttpCode(200)
  ship(@Param('id', orderId) id: string) {
    return this.ordersService.ship(id);
  }
}
```

`POST /orders` creates an order and answers 201. Cancelling and shipping change an existing one, so they answer 200.

```typescript
@@filename(src/orders/orders.module)
import { Module } from '@nestjs/common';
import { OrderPolicy } from './order.policy.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderPolicy],
})
export class OrdersModule {}
```

#### Try it

Start the application:

```bash
$ npm run start:dev
```

Sign up a customer and a staff member, and promote the staff member as shown above. Their tokens keep working after the promotion, since the role is read on every request (tokens and response bodies are shortened here and below):

```bash
$ curl localhost:3000/auth/sign-up --json '{"email":"ada@example.com","password":"correct horse battery"}'
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","refreshToken":"...","expiresIn":900}
$ ADA="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
$ SAM="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

Only staff add products:

```bash
$ curl localhost:3000/products -H "$ADA" --json '{"name":"Mechanical keyboard","price":12900,"stock":5}'
{"message":"Forbidden","statusCode":403}
$ curl localhost:3000/products -H "$SAM" --json '{"name":"Mechanical keyboard","description":"Hot-swappable switches","price":12900,"stock":5}'
{"id":"afffc03b-9142-4761-be96-84e6da07f8d4","name":"Mechanical keyboard","description":"Hot-swappable switches","price":12900,"stock":5,"active":true,"createdAt":"2026-11-19T20:04:12.673Z"}
$ curl localhost:3000/products -H "$SAM" --json '{"name":"Wrist rest","price":19.99,"stock":1}'
{"message":["price: Invalid input: expected int, received number"],"error":"Bad Request","statusCode":400}
```

Fill the cart and check out (with a wrist rest added the same way, at 1999 cents):

```bash
$ curl -X PUT localhost:3000/cart/items/afffc03b-9142-4761-be96-84e6da07f8d4 -H "$ADA" --json '{"quantity":2}'
{"items":[{"productId":"afffc03b-9142-4761-be96-84e6da07f8d4","name":"Mechanical keyboard","unitPrice":12900,"quantity":2,"available":true}],"total":25800}
$ curl -X POST localhost:3000/orders -H "$ADA"
{"id":"02ebc117-957f-4566-a2bb-e343afb01854","userId":"ed17ba4e-4d43-4aa4-9116-c6eda67ec2a7","status":"placed","total":27799,"createdAt":"2026-11-19T20:04:25.979Z","items":[{"productId":"afffc03b-...","name":"Mechanical keyboard","unitPrice":12900,"quantity":2},{"productId":"dc51c8f1-...","name":"Wrist rest","unitPrice":1999,"quantity":1}]}
$ curl -X POST localhost:3000/orders -H "$ADA"
{"message":"Your cart is empty","error":"Conflict","statusCode":409}
```

Three keyboards are left. A cart that asks for four can't be checked out, and keeps its line:

```bash
$ curl -X PUT localhost:3000/cart/items/afffc03b-9142-4761-be96-84e6da07f8d4 -H "$ADA" --json '{"quantity":4}'
$ curl -X POST localhost:3000/orders -H "$ADA"
{"message":"Not enough stock for product afffc03b-9142-4761-be96-84e6da07f8d4","error":"Conflict","statusCode":409}
$ curl localhost:3000/cart -H "$ADA"
{"items":[{"productId":"afffc03b-9142-4761-be96-84e6da07f8d4","name":"Mechanical keyboard","unitPrice":12900,"quantity":4,"available":false}],"total":51600}
```

Staff raise the price. The order keeps the price it was placed at. Cancelling it puts its stock back, and it can be cancelled only once:

```bash
$ curl -X PATCH localhost:3000/products/afffc03b-9142-4761-be96-84e6da07f8d4 -H "$SAM" --json '{"price":14900}'
$ curl localhost:3000/orders/02ebc117-957f-4566-a2bb-e343afb01854 -H "$ADA"
{"id":"02ebc117-...","status":"placed","total":27799,...,"items":[{"productId":"afffc03b-...","name":"Mechanical keyboard","unitPrice":12900,"quantity":2},...]}
$ curl -X POST localhost:3000/orders/02ebc117-957f-4566-a2bb-e343afb01854/cancel -H "$ADA"
{"id":"02ebc117-957f-4566-a2bb-e343afb01854","userId":"ed17ba4e-4d43-4aa4-9116-c6eda67ec2a7","status":"cancelled","total":27799,"createdAt":"2026-11-19T20:04:25.979Z"}
$ curl -X POST localhost:3000/orders/02ebc117-957f-4566-a2bb-e343afb01854/cancel -H "$ADA"
{"message":"Order is already cancelled","error":"Conflict","statusCode":409}
```

A customer can't ship an order (403), staff can't ship a cancelled one (409), and another customer gets a 404 for it.

#### Test it

The guarantees that matter here are about concurrency, and an in-process database such as PGlite has a single connection, where requests never truly race. So these tests run against a real PostgreSQL server, through a connection pool, with `app.inject()` sending requests that run at the same time. Create a database of their own, since the tests truncate the tables:

```typescript
@@filename(test/checkout.e2e-spec)
import { fileURLToPath } from 'node:url';
import { PasswordHasher } from '@nestjs/authentication';
import { getDrizzleToken } from '@nestjs/drizzle';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { AppModule } from '../src/app.module.js';
import { products, users } from '../src/database/schema.js';
import type { Role } from '../src/users/user.js';

// A real PostgreSQL with a pool, so concurrent checkouts really race.
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('Shop API (e2e)', () => {
  const db = drizzle({ client: new Pool({ connectionString: url, max: 20 }) });
  let app: NestNodeApplication;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    await db.execute(sql`TRUNCATE users, products, refresh_tokens CASCADE`);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(db)
      // scrypt at the default cost takes 128 MiB and a few hundred ms per hash.
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .compile();
    app = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter());
    await app.init();
  });

  afterAll(() => app.close()); // closes the pool too

  let clients = 0;

  /** Signs a user up, and returns the headers that authenticate as them. */
  async function signUp(email: string, role: Role = 'customer') {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password: 'correct horse battery' },
      // Each user signs up from an address of their own, as they would in
      // production: sign-up is rate-limited per IP address.
      remoteAddress: `10.0.0.${++clients}`,
    });
    await db.update(users).set({ role }).where(eq(users.email, email));
    return { authorization: `Bearer ${res.json<{ accessToken: string }>().accessToken}` };
  }

  async function createProduct(stock: number) {
    const res = await app.inject({
      method: 'POST',
      url: '/products',
      headers: await signUp(`staff-${crypto.randomUUID()}@example.com`, 'staff'),
      payload: { name: 'Limited edition keycaps', price: 9900, stock },
    });
    expect(res.statusCode).toBe(201);
    return res.json<{ id: string }>().id;
  }

  it('lets only staff edit the catalog', async () => {
    const payload = { name: 'Desk mat', price: 2500, stock: 10 };
    const customer = await signUp('customer@example.com');
    expect((await app.inject({ method: 'POST', url: '/products', payload })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/products', headers: customer, payload })).statusCode).toBe(403);
  });

  it('sells the last unit exactly once', async () => {
    const productId = await createProduct(1);
    const buyers = await Promise.all(Array.from({ length: 10 }, (_, i) => signUp(`buyer${i}@example.com`)));
    for (const headers of buyers) {
      await app.inject({ method: 'PUT', url: `/cart/items/${productId}`, headers, payload: { quantity: 1 } });
    }

    const results = await Promise.all(buyers.map((headers) => app.inject({ method: 'POST', url: '/orders', headers })));

    expect(results.map((res) => res.statusCode).sort()).toEqual([201, ...Array(9).fill(409)]);
    const [{ stock }] = await db.select({ stock: products.stock }).from(products).where(eq(products.id, productId));
    expect(stock).toBe(0);
  });

  it('places one order when the same cart is checked out twice at once', async () => {
    const productId = await createProduct(10);
    const headers = await signUp('double-click@example.com');
    await app.inject({ method: 'PUT', url: `/cart/items/${productId}`, headers, payload: { quantity: 2 } });

    const results = await Promise.all([1, 2].map(() => app.inject({ method: 'POST', url: '/orders', headers })));

    expect(results.map((res) => res.statusCode).sort()).toEqual([201, 409]);
    const orders = await app.inject({ method: 'GET', url: '/orders', headers });
    expect(orders.json()).toHaveLength(1);
  });

  it('puts the stock back when an order is cancelled', async () => {
    const productId = await createProduct(3);
    const headers = await signUp('cancel@example.com');
    await app.inject({ method: 'PUT', url: `/cart/items/${productId}`, headers, payload: { quantity: 3 } });
    const order = (await app.inject({ method: 'POST', url: '/orders', headers })).json<{ id: string }>();

    const cancelled = await app.inject({ method: 'POST', url: `/orders/${order.id}/cancel`, headers });
    expect(cancelled.json()).toMatchObject({ status: 'cancelled' });
    const product = await app.inject({ method: 'GET', url: `/products/${productId}` });
    expect(product.json()).toMatchObject({ stock: 3 });
    expect((await app.inject({ method: 'POST', url: `/orders/${order.id}/cancel`, headers })).statusCode).toBe(409);
  });
});
```

Create the test database once, then run the suite:

```bash
$ docker exec shop-db psql -U postgres -c "CREATE DATABASE shop_test"
$ TEST_DATABASE_URL=postgres://postgres:shop@localhost:5432/shop_test npm run test:e2e

 Test Files  1 passed (1)
      Tests  4 passed (4)
```

Replace the stock `UPDATE` in `checkout()` with a read, a check in JavaScript and a write, and "sells the last unit exactly once" fails: several of the ten customers get an order.

The JWT tutorial's [refresh-token store test](/tutorials/rest-api-jwt-authentication#test-it) applies here unchanged. Both test files truncate tables of the same database, so run them one after the other, with `npm run test:e2e -- --no-file-parallelism`.

#### Production checklist

Everything in the JWT tutorial's [checklist](/tutorials/rest-api-jwt-authentication#production-checklist) applies. For the shop in particular:

- **Size the connection pool for checkout.** Each checkout holds a connection for the length of its transaction, and checkouts of a popular product queue on its row lock. Keep transactions short: nothing in `checkout()` waits on anything but the database, and it should stay that way. Call a payment provider before or after the transaction, never inside it.
- **Take payment with an idempotency key.** A checkout is safe to retry because the cart is gone after the first one. A payment isn't: a retried charge charges twice. The provider's API takes a key; send the order's id. To make your own payment endpoint safe to retry, see [Idempotency keys](/reliability/idempotency).
- **Never trust a price from the client.** The order's prices come from the `products` table at the moment of checkout. A client that sends a price or a total is ignored by construction here; keep it that way when you add discounts.
- **Keep deactivating products instead of deleting them.** Order items refer to them.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the platform's environment: `start:prod` doesn't load `.env`. Then watch checkout: lock waits on a popular product show up as slow checkouts, not as errors. [NestJS Observe](/observability/overview) records every request with a trace of its spans, SQL statements included, and p95 latency per route, so a checkout that slows down under a sale is visible before customers complain.
- **Give staff accounts a second factor.** A staff token can rewrite the catalog's prices. See [Add two-factor authentication](/security/authentication#add-two-factor-authentication), and require it on staff routes with `@Authenticate()`.

#### What's next

- Take payments, and mark orders paid from the provider's webhook: [Accept payments with webhooks](/tutorials/payments-webhooks).
- Send order confirmations, outside the request: [Mail](/application/mail) and [Queues](/application/queues). To send an event only once the order's transaction has committed, use the [transactional outbox](/reliability/outbox).
- Let customers see per-order permissions, or give staff finer roles: [Authorization](/security/authorization).
- See slow checkouts and lock waits in production, request by request: [Observability](/observability/overview).
