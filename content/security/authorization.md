### Authorization

`@nestjs/authorization` expresses permissions as **policies**: classes whose methods answer "may this user do this?". A policy is an ordinary provider, so it can inject services, and every check is type-checked against the policy method it calls. Policies work on any data shape, including the plain objects that Prisma, Drizzle and Kysely return.

In this tutorial, you'll add permissions to the API of an online store for cat food and supplies:

- Guests and customers browse published products. Staff also see drafts, and only staff edit the catalog.
- Customers see only their own orders. Staff see all of them.
- Only staff refund orders, only paid ones, and only up to a limit that finance sets per person. Nobody refunds an order that has shipped.
- Admins manage the catalog without restrictions.

Along the way, you'll see where each kind of check belongs (on the route or in the service), when a denial is a 401 and when it's a 403, and how to test policies.

#### Prerequisites

This tutorial continues the [Authentication](/security/authentication) tutorial: the store signs its users in with `@nestjs/authentication`, and this page decides what they may do. Install the package:

```bash
$ npm i --save @nestjs/authorization
```

If you're starting fresh, the files below are the sign-in code this page relies on: the Authentication tutorial's application once it [issues tokens to the mobile app](/security/authentication#issue-tokens-to-the-mobile-app), reduced to the mobile app's sign-in, a password for a bearer token. The user is the same plain object, as your ORM would return it:

```typescript
@@filename(src/users/user)
export type Role = 'customer' | 'staff' | 'admin';

export interface User {
  id: string;
  email: string;
  /** Whether the owner proved the address to us, e.g. by using a magic link. */
  emailVerified: boolean;
  roles: Role[];
}
```

Four demo accounts stand in for the users table: two customers (Alice and Bob), a staff member (Sam), and Ada, who is staff and an admin. Their ids are fixed, so the demo orders and the tests can refer to them:

```typescript
@@filename(src/users/demo-users)
import type { User } from './user.js';

/**
 * The demo accounts. They all sign in with the password "catnip4all", and the
 * seeded orders refer to their ids.
 */
export const alice: User = {
  id: '1f794c55-472e-42b9-8913-4114964ed6fb',
  email: 'alice@example.com',
  emailVerified: true,
  roles: ['customer'],
};

export const bob: User = {
  id: 'fc27b5c1-62b5-494e-9924-28a66d387fd1',
  email: 'bob@example.com',
  emailVerified: true,
  roles: ['customer'],
};

export const sam: User = {
  id: '208a223b-3503-4255-83e7-22d290e331c3',
  email: 'sam@example.com',
  emailVerified: true,
  roles: ['staff'],
};

export const ada: User = {
  id: 'ae34ca97-f82b-49ab-b332-8808f3b0e240',
  email: 'ada@example.com',
  emailVerified: true,
  roles: ['staff', 'admin'],
};

export const demoUsers = [alice, bob, sam, ada];
```

`UsersRepository` is the Authentication tutorial's, with the two methods this page needs. It seeds the demo accounts at startup, and only `User` objects leave it: the password hashes stay inside.

```typescript
@@filename(src/users/users.repository)
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { demoUsers } from './demo-users.js';
import type { User } from './user.js';

interface UserRow extends User {
  passwordHash: string | null;
}

/**
 * In-memory stand-in for your data layer (Prisma, Drizzle, TypeORM, ...).
 * Only `User` objects leave this class: password hashes stay inside.
 */
@Injectable()
export class UsersRepository implements OnModuleInit {
  private readonly rows = new Map<string, UserRow>();

  constructor(private readonly passwordHasher: PasswordHasher) {}

  async onModuleInit() {
    // Seeds the demo accounts, all with the password "catnip4all".
    const passwordHash = await this.passwordHasher.hash('catnip4all');
    for (const user of demoUsers) {
      this.rows.set(user.id, { ...user, passwordHash });
    }
  }

  async findById(id: string): Promise<User | null> {
    const row = this.rows.get(id);
    return row ? toUser(row) : null;
  }

  /** For password sign-in only. */
  async findCredentials(email: string): Promise<{ user: User; passwordHash: string | null } | null> {
    const row = this.findRow(email);
    return row ? { user: toUser(row), passwordHash: row.passwordHash } : null;
  }

  private findRow(email: string) {
    const normalized = normalize(email);
    return [...this.rows.values()].find((row) => row.email === normalized);
  }
}

const normalize = (email: string) => email.trim().toLowerCase();
const toUser = ({ id, email, emailVerified, roles }: UserRow): User => ({ id, email, emailVerified, roles: [...roles] });
```

```typescript
@@filename(src/users/users.module)
import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';

@Module({
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
```

The tokens are the ones the Authentication tutorial issues to its mobile app: short-lived JWT access tokens, described once by the `accessToken` options that the root module passes to `AuthenticationModule` below. The signing secret is the `JWT_SECRET` from the Authentication tutorial's `.env` file, at least 32 bytes:

```bash
# Generate with: openssl rand -base64 32
JWT_SECRET=
```

> info **Hint** The tutorial reads `process.env` directly, to stay short. In an application, load the environment through [`@nestjs/config`](/application/configuration) with a validation schema, so a missing secret stops the application at startup, and read it from `ConfigService`.

`JwtAuth` verifies the bearer token with the `accessToken` options, and loads the token's user. It registers itself with `AuthenticationRegistry` from its constructor, which is how the guard learns about it:

```typescript
@@filename(src/auth/jwt-auth.provider)
import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication';
import type { User } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class JwtAuth extends JwtBearerProvider<User> {
  constructor(
    private readonly usersRepository: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    // The key, issuer and audience come from the `accessToken` options.
    super({ realm: 'store' });
    // Adds this provider to the chain the guard runs for every request.
    registry.registerProvider(this);
  }

  // Called after the signature and claims checked out.
  // Returning null (the user was deleted) rejects the token.
  validate({ sub }: JwtClaims) {
    return sub ? this.usersRepository.findById(sub) : null;
  }
}
```

`CredentialsService` checks a password against the stored hash, with the package's `PasswordHasher`, and answers `null` for an unknown email and a wrong password alike, in the same time:

```typescript
@@filename(src/auth/credentials.service)
import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import type { User } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  /** The user, or `null` when the email or the password is wrong. */
  async verify(email: string, password: string): Promise<User | null> {
    const found = await this.usersRepository.findCredentials(email);
    // With no account (or no password), verify() checks a dummy hash, so the
    // response time does not reveal which emails are registered.
    const valid = await this.passwordHasher.verify(password, found?.passwordHash);
    if (!valid || !found?.passwordHash) {
      return null;
    }
    return found.user;
  }
}
```

`TokensController` exchanges an email and a password for tokens. Its request body is validated with whatever your application already uses. Every DTO on this page comes twice, as a class with decorators and as a Zod schema, so pick the style you have and skip the other listing:

```typescript
@@filename(src/auth/auth.dto)
import { IsEmail, IsString } from 'class-validator';

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

```typescript
@@filename(src/auth/auth.schemas)
import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email(),
  password: z.string(),
});
export type SignInDto = z.infer<typeof signInSchema>;
```

`TokenService.issue()` signs an access token with the same `accessToken` options, and returns it with a refresh token:

```typescript
@@filename(src/auth/tokens.controller)
import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { Public, TokenService } from '@nestjs/authentication';
import { SignInDto } from './auth.dto.js';
import { CredentialsService } from './credentials.service.js';

@Public()
@Controller('auth/token')
export class TokensController {
  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly tokenService: TokenService,
  ) {}

  @Post()
  @HttpCode(200)
  async issue(@Body() body: SignInDto) {
    const user = await this.credentialsService.verify(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.tokenService.issue(user.id, {
      method: 'password',
      // `amr` goes into this access token and into every refreshed one.
      claims: { amr: ['pwd'] },
    });
  }
}
```

With the Zod schema, the body parameter declares its schema instead of a class:

```typescript
@@filename(src/auth/tokens.controller)
import { signInSchema, type SignInDto } from './auth.schemas.js';
// ...
@Post()
@HttpCode(200)
async issue(@Body({ schema: signInSchema }) body: SignInDto) {
  // ...
}
```

> info **Hint** The DTOs are enforced only by a validation pipe: bind `ValidationPipe` globally, as an `APP_PIPE` provider of `AppModule` or with `useGlobalPipes()` in `main.ts`. With the Zod schemas, bind `StandardSchemaValidationPipe` the same way instead. An application uses one or the other. The [validation](/application/validation) page has the options of each.

```typescript
@@filename(src/auth/auth.module)
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { CredentialsService } from './credentials.service.js';
import { JwtAuth } from './jwt-auth.provider.js';
import { TokensController } from './tokens.controller.js';

@Module({
  imports: [UsersModule],
  controllers: [TokensController],
  providers: [JwtAuth, CredentialsService],
})
export class AuthModule {}
```

Authentication puts the signed-in `User` on `request.user`, and `@CurrentUser()` injects it into a handler. That's all authorization needs from it.

#### Register the authorization module

Import `AuthorizationModule` next to `AuthenticationModule` in the root module. `AuthenticationModule` is registered as in the Authentication tutorial, with the `accessToken` options; `JwtAuth` is a provider of `AuthModule`:

```typescript
@@filename(src/app.module)
import { Module } from '@nestjs/common';
import { AuthenticationModule } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    // Authentication first: its guard sets request.user, which authorization reads.
    AuthenticationModule.forRootAsync({
      useFactory: () => ({
        accessToken: {
          key: process.env.JWT_SECRET!,
          issuer: 'https://api.example.com',
          audience: 'mobile-app',
          ttl: '15m',
        },
      }),
    }),
    AuthorizationModule.forRoot(),
    AuthModule,
  ],
})
export class AppModule {}
```

`forRoot()` registers the module globally. It does three things:

- It provides `AuthorizationService`, which you inject wherever code checks a permission.
- It registers `AuthorizationGuard` as a global guard. The guard enforces the `@Can()` decorator you'll add in the next step. Handlers without `@Can()` pass through untouched, so `POST /auth/token` keeps working.
- It turns a denial that a service reports into a 401 or a 403, as [Tell guests from forbidden users, and expose permissions](/security/authorization#tell-guests-from-forbidden-users-and-expose-permissions) explains.

Both packages register a global guard, and **the import order matters**. Nest runs global guards in the order it scans modules, so `AuthenticationModule` has to come first. In the reverse order, the authorization guard would run before anything has set `request.user`, so every `@Can()` check would see a guest, and a signed-in staff member would get a 401 on a staff-only route. `AuthorizationModule` checks the order at startup: it recognizes `AuthenticationGuard` by a marker the guard carries, and when that guard comes second, the app refuses to start, with an error that names both guards and the fix.

> warning **Warning** Other authentication guards, such as a subclass of Passport's `AuthGuard()`, carry no such marker, so the check can only go by their class names. In the wrong order, it logs an error, the app starts, and every `@Can()` check treats signed-in users as guests. Register such a guard with `APP_GUARD`, not with `app.useGlobalGuards()`: Nest runs the guards added that way after every `APP_GUARD`, so they always come after the authorization guard, and the check can't see them.

> info **Hint** The guard reads the user from `request.user`, and from the equivalent places for WebSockets, microservices and GraphQL. With `@nestjs/authentication`, on a WebSocket or a `graphql-ws` socket, it's the user of each message or operation, not the socket's, as the [reference](/security/authorization#reference) explains. If your authentication stores the user elsewhere, pass a `getUser` function to `forRoot()`, or return one from a `forRootAsync()` factory when it needs a provider. If you authenticate with `@UseGuards()` rather than a global guard, pass `globalGuard: false` and list `AuthorizationGuard` after your authentication guard.

#### Write a policy for products

Products are plain objects too, identified by a slug and priced in cents, as in the Authentication tutorial:

```typescript
@@filename(src/products/product)
export interface Product {
  /** A slug, such as `salmon-kibble-2kg`. */
  id: string;
  name: string;
  /** In cents. */
  price: number;
  published: boolean;
}

export type ProductInput = Omit<Product, 'id'>;
```

A policy is a class decorated with `@Policy()`. Each method whose first parameter is the user and which returns `boolean` or `Promise<boolean>` is an **ability**. Only a literal `true` allows. Any other value denies, even a truthy one.

```typescript
@@filename(src/products/product.policy)
import { Policy } from '@nestjs/authorization';
import type { User } from '../users/user.js';
import type { Product } from './product.js';

const isStaff = (user: User | null) => !!user?.roles.includes('staff');

@Policy()
export class ProductPolicy {
  // `null` is a guest. Everyone sees published products; staff also see drafts.
  view(user: User | null, product: Product) {
    return product.published || isStaff(user);
  }

  viewDrafts(user: User | null) {
    return isStaff(user);
  }

  create(user: User | null) {
    return isStaff(user);
  }

  update(user: User | null) {
    return isStaff(user);
  }
}
```

The type of the user parameter is a decision. `User | null` means the ability also runs for guests, who arrive as `null`. Guests can browse the catalog, so every ability here accepts `null`, and `view` and `viewDrafts` give guests a real answer.

`ProductsService` uses the policy in two ways. `can()` resolves to `true` or `false`; here it decides whether the listing includes drafts. `authorize()` throws when the ability denies, so `findOne()` never returns a draft to someone who may not see it.

```typescript
@@filename(src/products/products.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '@nestjs/authorization';
import type { User } from '../users/user.js';
import type { Product, ProductInput } from './product.js';
import { ProductPolicy } from './product.policy.js';

@Injectable()
export class ProductsService {
  // Stands in for your products table.
  private readonly products: Product[] = [
    { id: 'salmon-kibble-2kg', name: 'Salmon kibble, 2 kg', price: 2499, published: true },
    { id: 'clumping-litter-10l', name: 'Clumping litter, 10 l', price: 1599, published: true },
    { id: 'heated-cat-bed', name: 'Heated cat bed', price: 5499, published: false },
  ];

  constructor(private readonly authorizationService: AuthorizationService) {}

  async findAll(user: User | null) {
    const withDrafts = await this.authorizationService.can(ProductPolicy, 'viewDrafts', user);
    return withDrafts ? this.products : this.products.filter((product) => product.published);
  }

  async findOne(user: User | null, id: string) {
    const product = this.find(id);
    await this.authorizationService.authorize(ProductPolicy, 'view', user, product);
    return product;
  }

  create(input: ProductInput) {
    const product = { ...input, id: slug(input.name) };
    this.products.push(product);
    return product;
  }

  update(id: string, changes: Partial<ProductInput>) {
    return Object.assign(this.find(id), changes);
  }

  remove(id: string) {
    this.products.splice(this.products.indexOf(this.find(id)), 1);
  }

  private find(id: string) {
    const product = this.products.find((product) => product.id === id);
    if (!product) {
      throw new NotFoundException();
    }
    return product;
  }
}

/** `Sisal scratching post` → `sisal-scratching-post`. */
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
```

Creating and updating products doesn't depend on a particular record, so those checks go on the route. The bodies of those routes are DTOs, as classes or as Zod schemas; an update takes any subset of a new product's fields:

```typescript
@@filename(src/products/products.dto)
import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsPositive()
  price: number;

  @IsBoolean()
  published: boolean;
}

/** Any subset of the fields above. */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

```typescript
@@filename(src/products/products.schemas)
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  published: z.boolean(),
});
export type CreateProductDto = z.infer<typeof createProductSchema>;

/** Any subset of the fields above. */
export const updateProductSchema = createProductSchema.partial();
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
```

`@Can(ProductPolicy, 'create')` makes the guard call `create(user)` before the handler runs:

```typescript
@@filename(src/products/products.controller)
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import type { User } from '../users/user.js';
import { ProductPolicy } from './product.policy.js';
import { CreateProductDto, UpdateProductDto } from './products.dto.js';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Authenticate({ optional: true })
  findAll(@CurrentUser() user: User | null) {
    return this.productsService.findAll(user);
  }

  @Get(':id')
  @Authenticate({ optional: true })
  findOne(@CurrentUser() user: User | null, @Param('id') id: string) {
    return this.productsService.findOne(user, id);
  }

  @Post()
  @Can(ProductPolicy, 'create')
  create(@Body() input: CreateProductDto) {
    return this.productsService.create(input);
  }

  @Patch(':id')
  @Can(ProductPolicy, 'update')
  update(@Param('id') id: string, @Body() changes: UpdateProductDto) {
    return this.productsService.update(id, changes);
  }
}
```

With the Zod schemas, the body parameters declare their schema instead of a class:

```typescript
@@filename(src/products/products.controller)
import { createProductSchema, updateProductSchema, type CreateProductDto, type UpdateProductDto } from './products.schemas.js';
// ...
@Post()
@Can(ProductPolicy, 'create')
create(@Body({ schema: createProductSchema }) input: CreateProductDto) {
  return this.productsService.create(input);
}

@Patch(':id')
@Can(ProductPolicy, 'update')
update(@Param('id') id: string, @Body({ schema: updateProductSchema }) changes: UpdateProductDto) {
  return this.productsService.update(id, changes);
}
```

Whether a route admits guests is authentication's decision, not the policy's. The read routes use `@Authenticate()` with `optional: true`: a request with a valid token gets its user, and a request without one continues with `null`, which is what `@CurrentUser()` then injects. Without the decorator, guests would get a 401 before any policy ran. With `@Public()` instead, authentication would ignore the token entirely, so Sam would browse as a guest and never see drafts.

`@Can()` is type-checked. A misspelled ability doesn't compile:

```typescript
@Post()
@Can(ProductPolicy, 'craete')
// error TS2345: Argument of type '"craete"' is not assignable to parameter of type '"create" | "viewDrafts" | "update"'.
create(@Body() input: CreateProductDto) {}
```

The error lists the abilities that do work on a route. `@Can(ProductPolicy, 'view')` fails the same way. `@Can()` accepts only abilities that can be called with the user alone and whose user parameter accepts `null`: the guard has no product to pass, and it can't know whether a route has a user. Checks that need a record belong in the service, as in `findOne()`.

Finally, register the policy as a provider of its feature module:

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

Add `ProductsModule` to the `imports` of `AppModule`. `@Policy()` also makes the class injectable, and the authorization module discovers every policy provider in the app, wherever it's registered. Alternatively, list policies in the `policies` option of `AuthorizationModule.forRoot()`.

> info **Hint** If a `@Can()` points at a policy nobody registered, the app refuses to start, and the error names the handler.

#### Check orders record by record

An order is the Authentication tutorial's: it belongs to a customer, by `userId`, and moves through a few states:

```typescript
@@filename(src/orders/order)
export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  /** In cents. */
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'refunded';
}
```

Whether Alice may view one of Bob's orders depends on that order, so these abilities take the order as a second argument:

```typescript
@@filename(src/orders/order.policy)
import { Policy } from '@nestjs/authorization';
import type { User } from '../users/user.js';
import type { Order } from './order.js';

@Policy()
export class OrderPolicy {
  viewAll(user: User) {
    return user.roles.includes('staff');
  }

  // Customers see their own orders; staff see everyone's.
  view(user: User, order: Order) {
    return order.userId === user.id || user.roles.includes('staff');
  }

  // Staff refund paid orders. Pending, shipped and refunded orders
  // can't be refunded by anyone.
  refund(user: User, order: Order) {
    return user.roles.includes('staff') && order.status === 'paid';
  }
}
```

These abilities take `User`, not `User | null`. Every orders route requires a signed-in user, and an ability that only services call may say so. The compiler then makes callers rule out a missing user before they check.

Four demo orders stand in for the orders table, with fixed ids like the demo accounts: Alice has a paid and a shipped order, Bob a paid one of five bags of salmon kibble (124.95, which matters when [a policy injects a service](/security/authorization#inject-a-service-into-a-policy)) and a pending one:

```typescript
@@filename(src/orders/demo-orders)
import { alice, bob } from '../users/demo-users.js';
import type { Order } from './order.js';

/** The demo orders: Alice has a paid and a shipped one, Bob a paid and a pending one. */
export const alicePaid: Order = {
  id: 'b69f25e7-db50-4abe-86d3-2ef2bd148009',
  userId: alice.id,
  items: [{ productId: 'salmon-kibble-2kg', quantity: 1 }],
  total: 2499,
  status: 'paid',
};

export const aliceShipped: Order = {
  id: 'd626a0c1-4122-4f83-ab7a-b009c26f35c7',
  userId: alice.id,
  items: [{ productId: 'clumping-litter-10l', quantity: 1 }],
  total: 1599,
  status: 'shipped',
};

export const bobPaid: Order = {
  id: '0ea8343b-879d-4b83-884b-6d5bb02f802f',
  userId: bob.id,
  items: [{ productId: 'salmon-kibble-2kg', quantity: 5 }],
  total: 12495,
  status: 'paid',
};

export const bobPending: Order = {
  id: '7e7023d3-cb2a-48d2-8c4e-20c07e6b8c06',
  userId: bob.id,
  items: [{ productId: 'clumping-litter-10l', quantity: 1 }],
  total: 1599,
  status: 'pending',
};

export const demoOrders = [alicePaid, aliceShipped, bobPaid, bobPending];
```

`OrdersService` loads the order, then authorizes against it:

```typescript
@@filename(src/orders/orders.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '@nestjs/authorization';
import type { User } from '../users/user.js';
import { demoOrders } from './demo-orders.js';
import type { Order } from './order.js';
import { OrderPolicy } from './order.policy.js';

@Injectable()
export class OrdersService {
  // Stands in for your orders table: copies, since a refund changes an order's status.
  private readonly orders: Order[] = demoOrders.map((order) => ({ ...order }));

  constructor(private readonly authorizationService: AuthorizationService) {}

  async findAll(user: User) {
    // Filter lists in the query; policies check one record at a time.
    return (await this.authorizationService.can(OrderPolicy, 'viewAll', user))
      ? this.orders
      : this.orders.filter((order) => order.userId === user.id);
  }

  async findOne(user: User, id: string) {
    const order = this.find(id);
    await this.authorizationService.authorize(OrderPolicy, 'view', user, order);
    return order;
  }

  async refund(user: User, id: string) {
    const order = this.find(id);
    await this.authorizationService.authorize(OrderPolicy, 'refund', user, order);
    // Refund the payment through the payment provider here, then record it.
    order.status = 'refunded';
    return order;
  }

  private find(id: string) {
    const order = this.orders.find((order) => order.id === id);
    if (!order) {
      throw new NotFoundException();
    }
    return order;
  }
}
```

Everything after the policy class is typed from the ability's signature: the ability name, the user and the order. A misspelled ability, a missing order, or an object that isn't an `Order` doesn't compile, and neither does a user that might be `null`:

```typescript
async show(user: User | null, order: Order) {
  await this.authorizationService.authorize(OrderPolicy, 'view', user, order);
  // error TS2345: Argument of type 'User | null' is not assignable to parameter of type 'User'.
}
```

The listing doesn't check orders one by one. It asks a question the query can use (may this user see every order?) and filters in the database. Checking each row after loading all of them would fetch too much and break pagination.

Checking in the service rather than in the controller means every caller gets the same rules: a controller, a GraphQL resolver, or a queue worker that processes refund requests.

The controller passes the signed-in user along. The Authentication tutorial's `OrdersService` read it from `AuthenticationContext` instead; here it's a parameter, so the service's signature says whose permissions a check is about, and a queue worker can call it for a given user:

```typescript
@@filename(src/orders/orders.controller)
import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from '../users/user.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.ordersService.findAll(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ordersService.findOne(user, id);
  }

  @Post(':id/refund')
  @HttpCode(200)
  refund(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ordersService.refund(user, id);
  }
}
```

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

Add `OrdersModule` to the `imports` of `AppModule`. Alice now gets her two orders from `GET /orders`, and a 403 from `GET /orders/:id` for one of Bob's.

> info **Hint** A 403 confirms that the order exists. If that matters, for example when ids are sequential and guessable, check with `can()` and throw a `NotFoundException` instead.

#### Let admins through with `before()`

Admins may do anything with the catalog, including deleting products, which nobody else may do. Rather than adding an admin check to every ability, give the policy a `before()` hook:

```typescript
@@filename(src/products/product.policy)
import { Policy, type PolicyBefore } from '@nestjs/authorization';
import type { User } from '../users/user.js';
import type { Product } from './product.js';

const isStaff = (user: User | null) => !!user?.roles.includes('staff');

@Policy()
export class ProductPolicy implements PolicyBefore<User> {
  // Admins pass every check below, including abilities added later.
  before(user: User | null) {
    if (user?.roles.includes('admin')) {
      return true;
    }
  }

  // `null` is a guest. Everyone sees published products; staff also see drafts.
  view(user: User | null, product: Product) {
    return product.published || isStaff(user);
  }

  viewDrafts(user: User | null) {
    return isStaff(user);
  }

  create(user: User | null) {
    return isStaff(user);
  }

  update(user: User | null) {
    return isStaff(user);
  }

  // Nobody but admins, who get through in before().
  delete(_user: User | null) {
    return false;
  }
}
```

`before()` runs ahead of every ability of its policy, for route checks and service checks alike. It receives the user, the ability name, and the ability's arguments. Return `true` to allow, `false` to deny, or nothing to let the ability decide. Guests reach `before()` too, so its user parameter must accept `null`. `before(user: User)` doesn't compile, whether or not the class implements `PolicyBefore<User>`.

Add the route that uses the new ability to `ProductsController`, and import `Delete` and `HttpCode` from `@nestjs/common`:

```typescript
@@filename(src/products/products.controller)
@Delete(':id')
@HttpCode(204)
@Can(ProductPolicy, 'delete')
remove(@Param('id') id: string) {
  this.productsService.remove(id);
}
```

Sam now gets a 403 from `DELETE /products/clumping-litter-10l`, and Ada gets a 204.

> warning **Warning** `before()` skips every ability of its policy, including rules that should bind everyone. That's why `OrderPolicy` gets no admin bypass: "nobody refunds a shipped order" has to hold for Ada too. If a policy needs both, check the ability name that `before()` receives, and return nothing for the abilities it must not skip. Implement `PolicyBefore<User, Ability<OrderPolicy>>` and type the name as `Ability<OrderPolicy>`, so a misspelled exclusion doesn't compile.

#### Inject a service into a policy

Finance caps how much each staff member may refund on their own: 100.00 by default, more for some people. The limits live outside the policy, in a service that would read a table or a config service:

```typescript
@@filename(src/orders/refund-limits.service)
import { Injectable } from '@nestjs/common';
import { ada } from '../users/demo-users.js';
import type { User } from '../users/user.js';

@Injectable()
export class RefundLimitsService {
  // Per-person limits set by finance, in cents, by user id. Stands in for a table or a config service.
  private readonly limits = new Map<string, number>([[ada.id, 100_000]]);

  async maxRefundFor(user: User): Promise<number> {
    return this.limits.get(user.id) ?? 10_000;
  }
}
```

Because a policy is a provider, it injects the service through its constructor. The `refund` ability becomes `async`:

```typescript
@@filename(src/orders/order.policy)
import { Policy } from '@nestjs/authorization';
import type { User } from '../users/user.js';
import type { Order } from './order.js';
import { RefundLimitsService } from './refund-limits.service.js';

@Policy()
export class OrderPolicy {
  constructor(private readonly refundLimitsService: RefundLimitsService) {}

  viewAll(user: User) {
    return user.roles.includes('staff');
  }

  // Customers see their own orders; staff see everyone's.
  view(user: User, order: Order) {
    return order.userId === user.id || user.roles.includes('staff');
  }

  // Staff refund paid orders up to their limit. Pending, shipped and
  // refunded orders can't be refunded by anyone.
  async refund(user: User, order: Order) {
    if (!user.roles.includes('staff') || order.status !== 'paid') {
      return false;
    }
    return order.total <= (await this.refundLimitsService.maxRefundFor(user));
  }
}
```

`authorize()`, `can()` and the guard all await async abilities, so `OrdersService` doesn't change. Register the service next to the policy:

```typescript
@@filename(src/orders/orders.module)
import { Module } from '@nestjs/common';
import { OrderPolicy } from './order.policy.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { RefundLimitsService } from './refund-limits.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderPolicy, RefundLimitsService],
})
export class OrdersModule {}
```

Since `OrderPolicy` is registered in `OrdersModule`, it can inject that module's providers. A policy listed in the `policies` option of `forRoot()` lives in the authorization module instead, and needs the `imports` option to reach its dependencies.

Bob's paid order comes to 124.95. Sam (limit 100.00) now gets a 403 when he tries to refund it, and Ada (limit 1,000.00) succeeds.

> warning **Warning** Policies must be singletons. A request-scoped or transient policy, or one that depends on a request-scoped provider, throws at startup. Keep per-request state out of policies, and pass what an ability needs as arguments.

#### Tell guests from forbidden users, and expose permissions

A denied request gets a 401 or a 403, depending on who is asking and where:

| Caller         | Route                                                                          | Status                                             | Comes from                             |
| -------------- | ------------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------------------- |
| Guest          | Requires sign-in (the default), such as `POST /products` or `GET /orders`      | 401, with `WWW-Authenticate: Bearer realm="store"` | Authentication, before any policy runs |
| Guest          | Optional authentication, and the policy denies `null`, such as a draft product | 401                                                | Authorization                          |
| Signed-in user | The policy denies, such as Alice on `POST /products` or on one of Bob's orders | 403                                                | Authorization                          |

Authorization never decides whether a route needs a user; that's authentication's job. When a policy denies a guest, the package answers 401 ("sign in and try again") rather than 403 ("never"), because signing in might change the answer.

`authorize()` itself throws an `AuthorizationError`, whose `reason` is `unauthenticated` or `forbidden`, and whose `status` is the matching 401 or 403. It isn't an HTTP exception, because the same service also runs in queue workers and WebSocket gateways. When the error leaves a handler, `AuthorizationModule` turns it into the `UnauthorizedException` or `ForbiddenException` that the guard throws, with the same bodies, so exception filters and clients handle both like any other HTTP error. In WebSocket gateways and microservice handlers, it becomes a `WsException` or an `RpcException`. The 403 body doesn't name the ability.

`can()` never throws on a denial. It resolves to `false` for guests and forbidden users alike, which makes it the tool for shaping responses. Give each order a `canRefund` flag, so the frontend shows the refund button without duplicating the rules:

```typescript
@@filename(src/orders/orders.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '@nestjs/authorization';
import type { User } from '../users/user.js';
import { demoOrders } from './demo-orders.js';
import type { Order } from './order.js';
import { OrderPolicy } from './order.policy.js';

export type OrderView = Order & { canRefund: boolean };

@Injectable()
export class OrdersService {
  // Stands in for your orders table: copies, since a refund changes an order's status.
  private readonly orders: Order[] = demoOrders.map((order) => ({ ...order }));

  constructor(private readonly authorizationService: AuthorizationService) {}

  async findAll(user: User): Promise<OrderView[]> {
    // Filter lists in the query; policies check one record at a time.
    const orders = (await this.authorizationService.can(OrderPolicy, 'viewAll', user))
      ? this.orders
      : this.orders.filter((order) => order.userId === user.id);
    return Promise.all(orders.map((order) => this.toView(user, order)));
  }

  async findOne(user: User, id: string): Promise<OrderView> {
    const order = this.find(id);
    await this.authorizationService.authorize(OrderPolicy, 'view', user, order);
    return this.toView(user, order);
  }

  async refund(user: User, id: string): Promise<OrderView> {
    const order = this.find(id);
    await this.authorizationService.authorize(OrderPolicy, 'refund', user, order);
    // Refund the payment through the payment provider here, then record it.
    order.status = 'refunded';
    return this.toView(user, order);
  }

  private async toView(user: User, order: Order): Promise<OrderView> {
    return { ...order, canRefund: await this.authorizationService.can(OrderPolicy, 'refund', user, order) };
  }

  private find(id: string) {
    const order = this.orders.find((order) => order.id === id);
    if (!order) {
      throw new NotFoundException();
    }
    return order;
  }
}
```

The flag comes from the same `refund` ability that `POST /orders/:id/refund` enforces, so the button and the endpoint can't disagree. Sam sees `canRefund: true` on Alice's paid order and `false` on Bob's, which is over his limit. Ada sees `true` on both.

#### Try it

Start the application with the `.env` file that holds the signing secret:

```bash
$ npm run start:dev -- --env-file .env
```

In another terminal, sign in as Alice, Sam and Ada. `--json` (curl 7.82 or later) sends a `POST` with a JSON body, and the `token` helper uses [jq](https://jqlang.org/) to extract the access token:

```bash
$ token() { curl -s localhost:3000/auth/token --json "{\"email\":\"$1@example.com\",\"password\":\"catnip4all\"}" | jq -r .accessToken; }
$ ALICE=$(token alice) SAM=$(token sam) ADA=$(token ada)
```

Guests see published products. Staff see the draft too:

```bash
$ curl localhost:3000/products
[{"id":"salmon-kibble-2kg","name":"Salmon kibble, 2 kg","price":2499,"published":true},{"id":"clumping-litter-10l","name":"Clumping litter, 10 l","price":1599,"published":true}]

$ curl -s localhost:3000/products -H "Authorization: Bearer $SAM" | jq -c '.[] | {id, published}'
{"id":"salmon-kibble-2kg","published":true}
{"id":"clumping-litter-10l","published":true}
{"id":"heated-cat-bed","published":false}
```

The draft itself is a 401 for a guest and a 403 for a customer. Response headers are trimmed here and below:

```bash
$ curl -i localhost:3000/products/heated-cat-bed
HTTP/1.1 401 Unauthorized
{"message":"Unauthorized","statusCode":401}

$ curl -i localhost:3000/products/heated-cat-bed -H "Authorization: Bearer $ALICE"
HTTP/1.1 403 Forbidden
{"message":"Forbidden","statusCode":403}
```

Only staff add products. Authentication stops the guest, and `@Can()` stops Alice:

```bash
$ curl -i localhost:3000/products --json '{"name":"Sisal scratching post","price":3999,"published":false}'
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="store"
{"message":"Unauthorized","statusCode":401}

$ curl -i localhost:3000/products -H "Authorization: Bearer $ALICE" --json '{"name":"Sisal scratching post","price":3999,"published":false}'
HTTP/1.1 403 Forbidden
{"message":"Forbidden","statusCode":403}

$ curl localhost:3000/products -H "Authorization: Bearer $SAM" --json '{"name":"Sisal scratching post","price":3999,"published":false}'
{"name":"Sisal scratching post","price":3999,"published":false,"id":"sisal-scratching-post"}
```

Alice sees her own orders and can refund neither. Sam sees every order, with his own `canRefund` flags. Bob's paid order is off limits to Alice:

```bash
$ curl -s localhost:3000/orders -H "Authorization: Bearer $ALICE" | jq -c '.[] | {id, status, canRefund}'
{"id":"b69f25e7-db50-4abe-86d3-2ef2bd148009","status":"paid","canRefund":false}
{"id":"d626a0c1-4122-4f83-ab7a-b009c26f35c7","status":"shipped","canRefund":false}

$ curl -s localhost:3000/orders -H "Authorization: Bearer $SAM" | jq -c '.[] | {id, status, total, canRefund}'
{"id":"b69f25e7-db50-4abe-86d3-2ef2bd148009","status":"paid","total":2499,"canRefund":true}
{"id":"d626a0c1-4122-4f83-ab7a-b009c26f35c7","status":"shipped","total":1599,"canRefund":false}
{"id":"0ea8343b-879d-4b83-884b-6d5bb02f802f","status":"paid","total":12495,"canRefund":false}
{"id":"7e7023d3-cb2a-48d2-8c4e-20c07e6b8c06","status":"pending","total":1599,"canRefund":false}

$ curl -i localhost:3000/orders/0ea8343b-879d-4b83-884b-6d5bb02f802f -H "Authorization: Bearer $ALICE"
HTTP/1.1 403 Forbidden
{"message":"Forbidden","statusCode":403}
```

Sam refunds Alice's paid order, but not her shipped one, and not Bob's, which is over his limit. Ada can't refund the shipped order either, but Bob's is within her limit:

```bash
$ curl -s -X POST localhost:3000/orders/b69f25e7-db50-4abe-86d3-2ef2bd148009/refund -H "Authorization: Bearer $SAM" | jq -c '{id, status, canRefund}'
{"id":"b69f25e7-db50-4abe-86d3-2ef2bd148009","status":"refunded","canRefund":false}

$ curl -i -X POST localhost:3000/orders/d626a0c1-4122-4f83-ab7a-b009c26f35c7/refund -H "Authorization: Bearer $SAM"
HTTP/1.1 403 Forbidden
{"message":"Forbidden","statusCode":403}

$ curl -i -X POST localhost:3000/orders/0ea8343b-879d-4b83-884b-6d5bb02f802f/refund -H "Authorization: Bearer $SAM"
HTTP/1.1 403 Forbidden
{"message":"Forbidden","statusCode":403}

$ curl -i -X POST localhost:3000/orders/d626a0c1-4122-4f83-ab7a-b009c26f35c7/refund -H "Authorization: Bearer $ADA"
HTTP/1.1 403 Forbidden
{"message":"Forbidden","statusCode":403}

$ curl -s -X POST localhost:3000/orders/0ea8343b-879d-4b83-884b-6d5bb02f802f/refund -H "Authorization: Bearer $ADA" | jq -c '{id, status, canRefund}'
{"id":"0ea8343b-879d-4b83-884b-6d5bb02f802f","status":"refunded","canRefund":false}
```

Only an admin deletes a product:

```bash
$ curl -i -X DELETE localhost:3000/products/clumping-litter-10l -H "Authorization: Bearer $SAM"
HTTP/1.1 403 Forbidden
{"message":"Forbidden","statusCode":403}

$ curl -i -X DELETE localhost:3000/products/clumping-litter-10l -H "Authorization: Bearer $ADA"
HTTP/1.1 204 No Content
```

#### Testing

An end-to-end test boots the whole app, signs in through the real endpoint, and checks the rules over HTTP. As in the Authentication tutorial, scrypt is slow on purpose, so the test overrides `PasswordHasher` with a cheaper one, and the application reads `JWT_SECRET` at bootstrap, so the test configuration provides one:

```typescript
@@filename(vitest.config)
export default defineConfig({
  // ...
  test: {
    // ...
    env: {
      JWT_SECRET: 'test-only-jwt-secret-of-at-least-32-bytes',
    },
  },
});
```

```typescript
@@filename(test/orders.e2e-spec)
import type { INestApplication } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { alicePaid, aliceShipped, bobPaid } from '../src/orders/demo-orders.js';

describe('Orders (e2e)', () => {
  let app: INestApplication;

  const signIn = async (email: string) => {
    const { body } = await request(app.getHttpServer())
      .post('/auth/token')
      .send({ email, password: 'catnip4all' })
      .expect(200);
    return `Bearer ${body.accessToken}`;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      // scrypt is slow on purpose; the tests don't need it to be.
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 11 }))
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });

  afterAll(() => app.close());

  it('asks guests to sign in', async () => {
    await request(app.getHttpServer()).get('/orders').expect(401);
  });

  it('shows customers only their own orders', async () => {
    const alice = await signIn('alice@example.com');
    const { body } = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', alice)
      .expect(200);
    expect(body.map((order: { id: string }) => order.id)).toEqual([alicePaid.id, aliceShipped.id]);

    await request(app.getHttpServer()).get(`/orders/${bobPaid.id}`).set('Authorization', alice).expect(403);
  });

  it('lets staff refund a paid order once, within their limit', async () => {
    const sam = await signIn('sam@example.com');
    const refund = (id: string) =>
      request(app.getHttpServer()).post(`/orders/${id}/refund`).set('Authorization', sam);

    await refund(alicePaid.id).expect(200);
    await refund(alicePaid.id).expect(403); // already refunded
    await refund(aliceShipped.id).expect(403); // shipped
    await refund(bobPaid.id).expect(403); // over Sam's limit
  });
});
```

A policy is a plain class, so its rules are easy to unit-test without Nest. Construct the policy yourself and control its dependencies; the demo accounts and orders double as fixtures:

```typescript
@@filename(src/orders/order.policy.spec)
import { vi } from 'vitest';
import { alice, sam } from '../users/demo-users.js';
import { alicePaid, bobPaid } from './demo-orders.js';
import { OrderPolicy } from './order.policy.js';
import { RefundLimitsService } from './refund-limits.service.js';

describe('OrderPolicy', () => {
  // No Nest here: a policy is a class, so construct it yourself.
  const refundLimits = new RefundLimitsService();
  const policy = new OrderPolicy(refundLimits);

  it('shows customers only their own orders', () => {
    expect(policy.view(alice, alicePaid)).toBe(true);
    expect(policy.view(alice, bobPaid)).toBe(false);
    expect(policy.view(sam, bobPaid)).toBe(true);
  });

  it('lets staff refund paid orders up to their limit', async () => {
    vi.spyOn(refundLimits, 'maxRefundFor').mockResolvedValue(5000);

    expect(await policy.refund(sam, { ...alicePaid, total: 5000 })).toBe(true);
    expect(await policy.refund(sam, { ...alicePaid, total: 5001 })).toBe(false);
    expect(await policy.refund(alice, alicePaid)).toBe(false);
  });

  it('refuses refunds on orders that are not paid', async () => {
    for (const status of ['pending', 'shipped', 'refunded'] as const) {
      expect(await policy.refund(sam, { ...alicePaid, status })).toBe(false);
    }
  });
});
```

Calling an ability directly skips `before()`. The hook is just another method, so test it the same way, for example `expect(new ProductPolicy().before(ada)).toBe(true)`. To test the hook and the ability together, go through `AuthorizationService`, and to test the 401/403 mapping too, go through HTTP, as the end-to-end test does.

A service test sits in between: the real policy and `AuthorizationModule`, without HTTP or signing in. Outside a handler, a denial stays an `AuthorizationError`:

```typescript
@@filename(src/orders/orders.service.spec)
import { Test } from '@nestjs/testing';
import { AuthorizationError, AuthorizationModule } from '@nestjs/authorization';
import { alice, sam } from '../users/demo-users.js';
import { alicePaid, bobPaid } from './demo-orders.js';
import { OrderPolicy } from './order.policy.js';
import { OrdersService } from './orders.service.js';
import { RefundLimitsService } from './refund-limits.service.js';

describe('OrdersService', () => {
  let orders: OrdersService;

  beforeEach(async () => {
    // The real policy and module, no HTTP and no sign-in.
    const moduleRef = await Test.createTestingModule({
      imports: [AuthorizationModule.forRoot()],
      providers: [OrdersService, OrderPolicy, RefundLimitsService],
    }).compile();
    orders = moduleRef.get(OrdersService);
  });

  it("keeps Bob's order from Alice", async () => {
    await expect(orders.findOne(alice, bobPaid.id)).rejects.toThrow(AuthorizationError);
  });

  it('refunds within the limit only', async () => {
    await expect(orders.refund(sam, bobPaid.id)).rejects.toMatchObject({ reason: 'forbidden', ability: 'refund' });
    expect((await orders.refund(sam, alicePaid.id)).status).toBe('refunded');
  });
});
```

To replace a policy in a bigger test, override it like any provider, for example `.overrideProvider(OrderPolicy).useValue(...)`: every check, on routes and in services, runs against the override.

#### Production checklist

- **Keep authentication ahead of authorization.** With `AuthenticationModule`, the wrong import order stops the app at startup. With another authentication guard, it only logs an error, so have an end-to-end test sign in and call a `@Can()` route. Two registrations always run after the authorization guard, whatever the import order: a request-scoped `APP_GUARD` (the startup check says so) and `app.useGlobalGuards()` (it can't). Register authentication as a singleton `APP_GUARD`.
- **Give every protected endpoint a check.** The global guard lets handlers without `@Can()` through, so an endpoint with neither `@Can()` nor an `authorize()` call in its service is open to every signed-in user. Review new routes for one or the other.
- **Connect microservices with `inheritAppConfig: true`.** In a hybrid app, Nest runs the app's global guards and interceptors on message handlers only when `connectMicroservice()` gets that option. Without it, `@Can()` on a message handler isn't enforced, and a denial from `authorize()` reaches the client as an internal error instead of a 401 or 403.
- **Put record checks in services**, after loading the record, so that controllers, resolvers and queue workers share them.
- **Don't cache responses by URL on routes that check records.** A cache such as Nest's `CacheInterceptor` answers before the handler runs, so it would serve Bob's order to Alice without asking `OrderPolicy`. Cache below the check, or per user.
- **Filter lists in the query** with a question the query can use, like `viewAll`, rather than loading every row and checking each one.
- **Re-check state when you write.** Authorization reads the order before the refund, and two concurrent requests can both see `paid`. Make the write conditional (update the status only where it's still `paid`), and send the payment provider an idempotency key, so a retry never refunds twice.
- **Choose between 403 and 404** for records whose existence is sensitive, such as other customers' orders when IDs are sequential.
- **Keep policies stateless.** They're singletons shared by all requests.
- **Watch the cost of `can()` flags.** Each flag runs the ability once per row, including any async work. Cache slow lookups like refund limits, or load them once per request.
- **Load secrets from configuration.** Read the JWT secret (at least 32 bytes) from a secret manager or `ConfigService`, not from code.
- **Check with `can()` in your own guards and middleware.** They run before any handler, so an `AuthorizationError` thrown there isn't turned into a 401 or a 403. It becomes a 500.
- **Audit denials.** Responses don't say which check refused a caller. Subscribe to `AuthorizationEvents` to log the policy, the ability and the user's ID for every denial. Each event carries the user and the record as the policy saw them, so log the fields you need rather than the whole event.

#### Reference

##### Module options

`AuthorizationModule.forRoot()` takes these options. `forRootAsync()` takes `policies`, `imports`, `globalGuard` and `isGlobal` at the top level, next to `useFactory`, and its factory returns `getUser`.

| Option | Default | Description |
| --- | --- | --- |
| `getUser` | `defaultGetUser` | A function that receives the `ExecutionContext` and returns the current user, or a promise of it. See [Register the authorization module](/security/authorization#register-the-authorization-module). |
| `policies` | none | Policies to register in the authorization module itself. A `@Policy()` provider of any module is found without being listed. |
| `imports` | none | Modules whose exported providers the `policies` inject. |
| `globalGuard` | `true` | Register `AuthorizationGuard` as a global guard. With `false`, apply it with `@UseGuards()` after your authentication guard. |
| `isGlobal` | `true` | Register the module globally. |

`defaultGetUser` reads the user from these places. `null`, `undefined` and `false` all mean a guest.

| Context | Source |
| --- | --- |
| HTTP | `request.user` |
| GraphQL | the user authentication recorded for this operation, else `req.user` on the GraphQL context |
| WebSockets | the user authentication recorded for this message, else `client.user`, then `client.data.user` |
| Microservices | `user` on the transport context, never the message payload |

A WebSocket client is the connection, not the message, and over `graphql-ws` the `req` on the GraphQL context is the socket's upgrade request, which every operation on the socket shares. So `client.user` and `req.user` hold whichever message or operation authenticated last. `@nestjs/authentication` also leaves a function on the client and on `req`, under `Symbol.for('nestjs.authentication.userOf')`, which takes the `ExecutionContext` and answers with the user of that message or operation: `null` for an anonymous one, as every `@Public()` one is, or `undefined` when it has no answer. `defaultGetUser` asks it first. A `@Public()` message or operation is therefore a guest for `@Can()`, even on a socket whose handshake signed in, and a session that a sign-out everywhere revoked no longer counts. A `getUser` of your own that reads `client.user` or `req.user` on these transports sees the socket's last user instead; other authentication packages can leave the same function to be asked.

##### Events

`AuthorizationEvents` exposes every denial on its `events$` observable, and publishes it on a diagnostics channel. `can()` resolving to `false` isn't a denial and emits nothing.

| Event type | Channel | When |
| --- | --- | --- |
| `denied` | `nestjs:authorization:denied` | `@Can()` or `authorize()` refused a caller |

The `AuthorizationDeniedEvent` payload has these fields:

- `type`: `'denied'`.
- `policy` and `ability`: the policy class name and the ability that denied, such as `OrderPolicy` and `refund`.
- `reason`: `'unauthenticated'` for a guest, `'forbidden'` for a signed-in user.
- `user`: the user the policy saw, `null` for a guest.
- `args`: the ability's arguments after the user, such as the record. Empty for `@Can()`.
- `handler`: the handler `@Can()` guarded, such as `ProductsController.create`. Absent for `authorize()`.

##### Errors

`authorize()` throws an `AuthorizationError` with `reason`, `status`, `policy` and `ability`. When it leaves a handler, or when `@Can()` denies, the caller gets the transport's own error, whose body never names the policy or the ability. See [Tell guests from forbidden users, and expose permissions](/security/authorization#tell-guests-from-forbidden-users-and-expose-permissions).

| `reason` | `status` | HTTP | GraphQL `extensions.code` | WebSockets and microservices |
| --- | --- | --- | --- | --- |
| `unauthenticated` | 401 | `UnauthorizedException` | `UNAUTHENTICATED` | `WsException` or `RpcException` with `statusCode: 401` |
| `forbidden` | 403 | `ForbiddenException` | `FORBIDDEN` | `WsException` or `RpcException` with `statusCode: 403` |

Over `graphql-ws`, the client gets the error's message, `Unauthorized` or `Forbidden`, without `extensions.code`: the Apollo driver adds the codes in its error formatting, which doesn't run on that transport.

An `AuthorizationError` thrown outside a handler, such as in your own guard or middleware, isn't mapped and becomes a 500.
