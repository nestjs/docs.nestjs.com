### Coming from Django

Nest covers most of what a Django developer reaches for in a backend: apps become modules, views become controllers, serializers become validated DTOs, and sign-in, permissions, email, file storage, translations, background jobs, caching and rate limiting come from first-party packages. What changes is the language, TypeScript, the runtime, Node.js, and one habit: Nest is split into packages that you install and import, and it ships no ORM and no admin of its own.

This page maps Django and Django REST Framework concepts to their Nest equivalents, with short code side by side. It ends with [what's different](/migrating/django#whats-different), which matters more than the syntax.

#### At a glance

| Django | Nest | Read more |
| --- | --- | --- |
| `django-admin startproject`, `manage.py runserver` | `nest new`, `npm run start:dev` | [First steps](/first-steps) |
| Apps and `INSTALLED_APPS` | Modules and their `imports` | [Modules](/modules) |
| Models and `makemigrations` / `migrate` | Drizzle or TypeORM schemas and their migration tools | [Drizzle](/data/drizzle), [TypeORM](/data/typeorm) |
| Views, viewsets and `urls.py` | Controllers with route decorators | [Controllers](/controllers) |
| Forms and DRF serializers | Pipes, with class-validator DTOs or a Standard Schema such as Zod | [Validation](/application/validation) |
| Shaping a response with a serializer | Return a plain object, or `ClassSerializerInterceptor` | [Serialization](/application/serialization) |
| Middleware | Middleware, guards and interceptors | [Middleware](/middleware) |
| `django.contrib.auth`, sessions, `login_required` | `@nestjs/authentication` | [Authentication](/security/authentication) |
| Permissions, DRF permission classes | `@nestjs/authorization` policies | [Authorization](/security/authorization) |
| `settings.py` and environment variables | `@nestjs/config` | [Configuration](/application/configuration) |
| `send_mail()`, `EmailMessage` | `@nestjs/mail` | [Mail](/application/mail) |
| `default_storage`, django-storages | `@nestjs/storage` | [File storage](/application/file-storage) |
| `gettext`, `.po` files, `LocaleMiddleware` | `@nestjs/i18n` | [Internationalization](/application/i18n) |
| Celery tasks | `@nestjs/bullmq` | [Queues](/application/queues) |
| Celery beat | `@nestjs/schedule`, with `@nestjs/locks` | [Task scheduling](/application/task-scheduling) |
| Signals | `@nestjs/event-emitter` | [Events](/application/events) |
| `transaction.on_commit()` | `@nestjs/outbox` | [Outbox](/reliability/outbox) |
| The cache framework, `cache_page` | `@nestjs/cache-manager` | [Caching](/data/caching) |
| DRF throttling | `@nestjs/throttler` | [Rate limiting](/security/rate-limiting) |
| `CsrfViewMiddleware` | `app.enableCsrfProtection()` | [CSRF protection](/security/csrf) |
| Templates and `render()` | A view engine and `@Render()` | [Model-View-Controller](/http/mvc) |
| Management commands, `manage.py shell` | Standalone applications, nest-commander, the REPL | [Standalone applications](/standalone-applications) |
| `TestCase`, `APIClient` | `@nestjs/testing` and Supertest | [Testing](/fundamentals/testing) |
| drf-spectacular | `@nestjs/swagger` | [OpenAPI](/openapi/introduction) |
| Django Channels | Gateways | [Gateways](/websockets/gateways) |
| The admin | No equivalent | [The admin](/migrating/django#the-admin) |

#### Start a project

`django-admin startproject` creates a project and `manage.py startapp` adds an app. The Nest CLI does both:

```bash
$ npm i -g @nestjs/cli
$ nest new orders-api
$ cd orders-api
$ nest generate resource orders
```

`npm run start:dev` starts the application and restarts it when a file changes, like `runserver`. `nest generate resource orders` creates a module with a controller, a service, DTOs and test files, the closest thing to `startapp` plus a DRF viewset. See [CLI usages](/cli/usages).

The entry point of a Nest application is `main.ts`, which plays the role of `manage.py runserver` and `wsgi.py` together:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

#### Apps become modules

A Django project lists its apps in `INSTALLED_APPS`, and Django finds their models, URLs and templates by convention. A Nest application is a tree of **modules**, and each one lists what it contains:

```typescript
@@filename(orders/orders.module)
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
```

The root module imports the feature modules, as `INSTALLED_APPS` lists the apps:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module.js';
import { ProductsModule } from './products/products.module.js';

@Module({
  imports: [OrdersModule, ProductsModule],
})
export class AppModule {}
```

Nothing is discovered. A controller that isn't listed in a module's `controllers` serves no routes, and a provider that isn't listed can't be injected.

Modules are also a boundary that Django apps don't have. In Django, any app can import any other app's models. In Nest, a provider is visible only inside its own module, unless the module lists it in `exports` and another module adds the module to its `imports`. See [Modules](/modules).

##### Services and dependency injection

Django has no dependency injection: a view imports the models and functions it needs. Nest code lives in **providers**, classes decorated with `@Injectable()`, and Nest creates them and passes them to the constructors that ask for them:

```typescript
@@filename(orders/orders.service)
import { Injectable } from '@nestjs/common';
import { Mailer } from '@nestjs/mail';
import { OrdersRepository } from './orders.repository.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly mailer: Mailer,
  ) {}
}
```

`private readonly` in the constructor declares and assigns the field in one step. The business logic that a Django project keeps in fat models or a `services.py` goes in providers like this one, and tests replace any of its dependencies without patching imports. See [Providers](/providers).

#### Models and migrations

Nest has no ORM of its own. Its first-party integrations are [Drizzle](/data/drizzle), where the schema is TypeScript and queries read like SQL, and [TypeORM](/data/typeorm), where models are decorated classes, closer to Django's. [Prisma](/data/prisma), [MikroORM](/data/mikroorm) and [Mongoose](/data/mongodb) work too.

A Django model:

```python
# orders/models.py
class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending"
        PAID = "paid"
        SHIPPED = "shipped"

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    total_cents = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
```

The same table with Drizzle:

```typescript
@@filename(database/schema)
import { integer, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

export const orderStatus = pgEnum('order_status', [
  'pending',
  'paid',
  'shipped',
]);

// `customers` is declared in this file too.
export const orders = pgTable('orders', {
  id: uuid().primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  status: orderStatus().notNull().default('pending'),
  totalCents: integer('total_cents').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
```

`makemigrations` becomes `npx drizzle-kit generate`, which writes SQL migration files from the changes to the schema, and `migrate` becomes `npx drizzle-kit migrate`. With TypeORM, `migration:generate` and `migration:run` do the same. See [Migrations](/data/drizzle#migrations).

Register the database once, in the root module:

```typescript
@@filename(app.module)
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './database/schema.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync({
      useFactory: () => ({
        drizzle,
        connection: process.env.DATABASE_URL!,
        schema,
      }),
    }),
  ],
})
export class AppModule {}
```

Queries go through the injected database. `Order.objects.filter(customer_id=..., status="pending")` becomes:

```typescript
@@filename(orders/orders.repository)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { orders } from '../database/schema.js';

@Injectable()
export class OrdersRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  findPending(customerId: string) {
    return this.db
      .select()
      .from(orders)
      .where(
        and(eq(orders.customerId, customerId), eq(orders.status, 'pending')),
      )
      .orderBy(desc(orders.createdAt));
  }
}
```

A query runs when it's awaited. There's no lazy `QuerySet` that a template evaluates later, so nothing queries the database by accident, and the N+1 problem shows up in your own code, where you can see it: load related rows with a join or with Drizzle's relational queries, as `select_related()` and `prefetch_related()` do. See [Relations](/data/drizzle#relations).

`transaction.atomic()` becomes a callback. Its queries commit when it resolves and roll back when it throws:

```typescript
@@filename(orders/orders.repository)
async place(customerId: string, items: NewOrderItem[]) {
  return this.db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({ customerId, totalCents: sumOf(items) })
      .returning();
    await tx
      .insert(orderItems)
      .values(items.map((item) => ({ ...item, orderId: order.id })));
    return order;
  });
}
```

Queries that belong to the transaction run through `tx`, not through the injected database. See [Drizzle transactions](/data/drizzle#drizzle-transactions).

#### Views and URLs become controllers

A Django REST Framework viewset and its router:

```python
# orders/views.py
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user.customer)

# urls.py
router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")
urlpatterns = [path("api/", include(router.urls))]
```

In Nest, a **controller** declares its routes with decorators, so there's no `urls.py`:

```typescript
@@filename(orders/orders.controller)
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from '../users/user.js';
import { CreateOrderDto } from './create-order.dto.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.ordersService.findForCustomer(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(user, id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.ordersService.place(user, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  cancel(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.cancel(user, id);
  }
}
```

The differences:

- `@Controller('orders')` is the URL prefix, and each method decorator adds a path. Route parameters are written `:id`, where Django uses a path converter in angle brackets. A global prefix such as `api` is set once with `app.setGlobalPrefix('api')`.
- Route and query parameters arrive as strings. A pipe such as `ParseUUIDPipe` or `ParseIntPipe` converts and checks one, like a path converter.
- A `POST` handler answers `201 Created` by default, and every other method `200 OK`. `@HttpCode()` changes it.
- A handler returns the body, and Nest serializes it as JSON. Handlers can be `async`. There's no `Response` object to build: set headers with `@Header()`, and throw an exception for an error status.
- `get_object_or_404()` becomes `throw new NotFoundException()` in the service. `HttpException` and its subclasses, such as `ConflictException` and `ForbiddenException`, become JSON error responses with their status. Any other exception becomes a `500`. See [Exception filters](/exception-filters).
- With `@nestjs/authentication`, every route requires a signed-in user unless it's marked `@Public()`, so `IsAuthenticated` is the default rather than a setting. See [Users, sign-in and permissions](/migrating/django#users-sign-in-and-permissions).

There are no generic viewsets: the five methods above are the whole of a `ModelViewSet`, written out. `nest generate resource` writes that boilerplate for you. Pagination and filtering are parameters you read and pass to the query.

#### Serializers become DTOs and pipes

A DRF serializer validates input and shapes output. In Nest, those are two separate jobs.

Input is validated by **pipes**. Describe the body with a [Standard Schema](https://standardschema.dev/) library such as Zod, and the parameter's type is inferred from the schema:

```python
# orders/serializers.py
class OrderItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, max_value=20)

class CreateOrderSerializer(serializers.Serializer):
    items = OrderItemSerializer(many=True, allow_empty=False)
    note = serializers.CharField(max_length=500, required=False)
```

The same rules as a Zod schema, which also gives the DTO's type:

```typescript
@@filename(orders/create-order.schema)
import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.int().min(1).max(20),
      }),
    )
    .min(1),
  note: z.string().max(500).optional(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
```

Bind `StandardSchemaValidationPipe` once for the whole application, and pass the schema with the `schema` option of `@Body()`:

```typescript
@@filename(orders/orders.controller)
@Post()
create(
  @CurrentUser() user: User,
  @Body({ schema: createOrderSchema }) dto: CreateOrderDto,
) {
  return this.ordersService.place(user, dto);
}
```

An invalid body gets a `400 Bad Request` that lists every failed rule, as `serializer.is_valid(raise_exception=True)` does. Alternatively, write the DTO as a class with [class-validator](https://github.com/typestack/class-validator) decorators and bind `ValidationPipe`. That's closer to a declarative serializer class. See [Validation](/application/validation) for both pipes.

> warning **Warning** TypeScript types don't exist at runtime, so a type annotation alone validates nothing. Without a validation pipe, `@Body() dto: CreateOrderDto` receives whatever JSON the client sent. Bind one of the pipes globally.

Output needs no serializer. A handler returns a plain object, and its JSON is the response. To leave out a field, such as a password hash, don't select it, or return an object without it. If your handlers return class instances, `ClassSerializerInterceptor` applies `@Exclude()` and `@Expose()` from class-transformer, the closest thing to a serializer's `fields`. See [Serialization](/application/serialization).

#### Middleware, guards and interceptors

Django middleware wraps the whole request. Nest splits that role into components that run in this order:

| Nest | Runs | Django counterpart |
| --- | --- | --- |
| [Middleware](/middleware) | Before routing, with the raw request and response | Middleware's `process_request` |
| [Guards](/guards) | After routing, to decide whether the handler runs | `login_required`, DRF permission classes |
| [Interceptors](/interceptors) | Around the handler, with access to its result | Middleware that wraps `get_response`, decorators on views |
| [Pipes](/pipes) | On each argument, before the handler | Form and serializer validation |
| [Exception filters](/exception-filters) | When anything above throws | Middleware's `process_exception`, DRF's exception handler |

Guards and interceptors know which controller and method will run, which Django middleware doesn't, so they can read decorators on the handler, such as `@Public()`.

#### Users, sign-in and permissions

`django.contrib.auth` gives a project a `User` model, password hashing, sessions and permission tables. `@nestjs/authentication` gives the sign-in parts, and leaves the users to you.

- **Users are your table.** The package never reads it. It asks your code for a user by id, and your user is whatever type your application defines. There's no `AbstractUser` to extend and no swapping `AUTH_USER_MODEL`.
- **Passwords** are hashed with `PasswordHasher`, with scrypt at OWASP's parameters, the role of `make_password()` and `check_password()`. `verify()` takes as long for an unknown email as for a wrong password, and `needsRehash()` tells you when to upgrade an old hash, as Django does on sign-in.
- **Sessions** are server-side, in a secure, `HttpOnly` cookie, like `django.contrib.sessions` with the database backend. `SignInService.signIn()` is the counterpart of `login()`. The package keeps sessions in your database through a store you implement against its interfaces, where Django creates the table for you.
- **Every route is closed** from the moment the module is registered. `@Public()` opens one, which inverts `login_required`. `@CurrentUser()` injects the user, like `request.user`.
- **Flows Django leaves to django-allauth** come with the package: email verification, password reset links, TOTP two-factor authentication, magic links, sign-in with Google and other OpenID Connect providers, access and refresh tokens, and API keys.

The tutorial in [Authentication](/security/authentication) builds sign-up and sign-in step by step.

Permissions are code, not rows. Django stores `add_order`, `change_order` and friends per model, assigns them to groups, and checks them with `has_perm()`. `@nestjs/authorization` replaces those, and DRF's permission classes, with **policies**: classes whose methods decide whether a user may do something.

```python
# orders/permissions.py
class IsOrderOwnerOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        return user.is_staff or obj.customer_id == user.customer.id
```

The same check as a policy, with a staff-only refund next to it:

```typescript
@@filename(orders/order.policy)
import { Policy } from '@nestjs/authorization';
import type { User } from '../users/user.js';
import type { Order } from './order.js';

@Policy()
export class OrderPolicy {
  view(user: User | null, order: Order) {
    if (!user) {
      return false;
    }
    return user.roles.includes('staff') || order.customerId === user.id;
  }

  refund(user: User | null) {
    return !!user?.roles.includes('staff');
  }
}
```

A check that needs only the user goes on the route with `@Can(OrderPolicy, 'refund')`. A check that needs the record, the counterpart of `has_object_permission()`, goes in the service, after the record is loaded:

```typescript
@@filename(orders/orders.service)
async findOne(user: User, id: string) {
  const order = await this.ordersRepository.findById(id);
  if (!order) {
    throw new NotFoundException();
  }
  await this.authorizationService.authorize(OrderPolicy, 'view', user, order);
  return order;
}
```

`authorize()` throws when the policy denies, which answers `403`, or `401` to a guest. Like the authentication guard, the authorization guard denies by default, so a route that declares no check is closed. Roles and groups are fields of your user, stored as your application decides. See [Authorization](/security/authorization), and the [multi-tenant SaaS tutorial](/tutorials/multi-tenant-saas) for organizations, members and roles.

#### Settings become configuration

`settings.py` is Python that runs at startup, often reading `os.environ`. `@nestjs/config` reads `.env` files and environment variables, with the environment winning over the files, and validates them before the application starts:

```typescript
@@filename(app.module)
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: z.object({
        DATABASE_URL: z.url(),
        SMTP_URL: z.url(),
        DEBUG: z.stringbool().default(false),
      }),
    }),
  ],
})
export class AppModule {}
```

A setting is read with `ConfigService.get()`, or `getOrThrow()` for a required one, where Django code imports `settings`. There's no global settings object: each module that needs configuration injects `ConfigService` or a typed namespace made with `registerAs()`. See [Configuration](/application/configuration).

#### Email

`send_mail()` and `EmailMessage` become `Mailer` from `@nestjs/mail`. A mail is a class that renders a subject and a template, the counterpart of `render_to_string()` followed by `send_mail()`:

```python
# orders/emails.py
def send_order_confirmation(order):
    html = render_to_string("emails/order_confirmation.html", {"order": order})
    send_mail(
        f"Your order #{order.number}",
        strip_tags(html),
        None,
        [order.customer.email],
        html_message=html,
    )
```

In Nest, the mail class returns the subject, the template's name and the values the template reads:

```typescript
@@filename(notifications/order-confirmation.mail)
import { Injectable } from '@nestjs/common';
import type { Mailable } from '@nestjs/mail';
import type { Order } from '../orders/order.js';

@Injectable()
export class OrderConfirmationMail implements Mailable<{ order: Order }> {
  render({ order }: { order: Order }) {
    return {
      subject: `Your order #${order.number}`,
      template: 'order-confirmation',
      context: { order },
    };
  }
}
```

A service sends it with `mailer.send()`, and the type of `data` comes from the mail class:

```typescript
@@filename(orders/orders.service)
await this.mailer.send(OrderConfirmationMail, {
  to: { name: customer.name, address: customer.email },
  data: { order },
});
```

Templates escape every value, as Django's do. `FileMailTransport` writes each mail to a file in development, like the file email backend, and SMTP and Resend transports send it in production. In tests, `InMemoryMailTransport` keeps every mail, like `django.core.mail.outbox`. See [Mail](/application/mail).

#### Files

`default_storage` and django-storages become **disks** from `@nestjs/storage`: a local folder, S3, or an S3-compatible store such as R2, behind one API. `default_storage.save()` becomes `put()`, `.url()` stays `url()`, and a signed S3 link is `signedUrl()`:

```typescript
@@filename(invoices/invoices.service)
import { Injectable } from '@nestjs/common';
import { InjectDisk, StorageDisk } from '@nestjs/storage';

@Injectable()
export class InvoicesService {
  constructor(@InjectDisk('private') private readonly files: StorageDisk) {}

  async store(orderId: string, pdf: Buffer) {
    const key = `invoices/${orderId}.pdf`;
    await this.files.put(key, pdf, { contentType: 'application/pdf' });
    return this.files.signedUrl(key, { expiresIn: '15m' });
  }
}
```

Uploads stream straight onto a disk with `uploadToDisk()`, instead of passing through memory as a `FileField` upload does. See [File storage](/application/file-storage).

#### Translations

`gettext` and `.po` files become `@nestjs/i18n`, with a JSON catalog per locale and namespace. `_("Order not found")` becomes a typed key, so a misspelled key fails to compile:

```typescript
@@filename(orders/orders.service)
throw new NotFoundException(this.i18n.t('orders.notFound', { args: { id } }));
```

Plurals follow each language's rules, like `ngettext()`. The locale comes from the `Accept-Language` header, a query parameter, a cookie or the user's saved language, the job of `LocaleMiddleware`, and validation messages and exceptions are translated too. See [Internationalization](/application/i18n).

#### Background jobs, schedules and signals

A Celery task becomes a job on a BullMQ queue, which runs on Redis:

```python
# orders/tasks.py
@shared_task
def generate_invoice(order_id):
    ...

generate_invoice.delay(order.id)
```

In Nest, a processor class takes the queue's jobs:

```typescript
@@filename(invoices/invoice.processor)
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

@Processor('invoices')
export class InvoiceProcessor extends WorkerHost {
  async process(job: Job<{ orderId: string }>) {
    // ...
  }
}
```

A service adds a job to the queue it injects, as `delay()` does in Celery:

```typescript
@@filename(orders/orders.service)
// constructor(@InjectQueue('invoices') private readonly invoices: Queue) {}
await this.invoices.add('generate', { orderId: order.id });
```

The processor is a provider, so it injects services like any other class. Workers run in the application's process, or in a separate one that starts the same modules. See [Queues](/application/queues).

Celery beat becomes `@Cron()` from `@nestjs/schedule`, on a method of any provider. A scheduled method runs on every instance of the application, so add `@OnOneInstance()` from `@nestjs/locks` where only one should run it. See [Task scheduling](/application/task-scheduling) and [Distributed locks](/reliability/locks).

Signals become events: `EventEmitter2.emit()` and `@OnEvent()` from `@nestjs/event-emitter`. There are no model signals such as `post_save`, because there's no model layer to send them. Emit an event from the service that saved the row. See [Events](/application/events).

`transaction.on_commit()` is the usual way to send an email or enqueue a job only once the order is saved. `@nestjs/outbox` goes a step further: it writes the message in the same transaction as the order, and delivers it after the commit, retrying until it's sent, even if the process stops in between. See [Outbox](/reliability/outbox).

#### Caching, rate limiting and CSRF

- **Caching**: `@nestjs/cache-manager` gives an injectable cache with `get()`, `set()` and `del()`, like `django.core.cache`, and `CacheInterceptor` caches responses, like `cache_page`. See [Caching](/data/caching).
- **Rate limiting**: `@nestjs/throttler` limits requests per client and time window, like DRF's throttle classes, with `@Throttle()` and `@SkipThrottle()` per route. See [Rate limiting](/security/rate-limiting).
- **CSRF**: `app.enableCsrfProtection()` refuses state-changing requests from other origins, judged by the `Sec-Fetch-Site` and `Origin` headers, so forms and API clients need no token. See [CSRF protection](/security/csrf).

#### Templates

Most Nest applications are APIs, with the pages rendered by a frontend. To render HTML on the server as Django views do, set a view engine, such as Handlebars, and return the template's context from a handler decorated with `@Render()`:

```typescript
@@filename(products/products.controller)
@Get(':slug')
@Render('products/detail')
findOne(@Param('slug') slug: string) {
  return this.productsService.findBySlug(slug);
}
```

See [Model-View-Controller](/http/mvc).

#### Management commands and the shell

A management command becomes a script that starts the application's modules without the HTTP server, a **standalone application**:

```typescript
@@filename(scripts/close-stale-carts)
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { CartsService } from '../carts/carts.service.js';

const app = await NestFactory.createApplicationContext(AppModule);
await app.get(CartsService).closeStale();
await app.close();
```

For commands with arguments, options and help text, as `BaseCommand` gives, use [nest-commander](/recipes/nest-commander). `manage.py shell` becomes the [REPL](/recipes/repl), where every provider of the application is at hand: `await get(OrdersService).findOne(...)`. See [Standalone applications](/standalone-applications).

#### The admin

Nest has no admin. It's the one Django battery without a counterpart, and the biggest difference for a team that runs its back office in the Django admin. The usual options are:

- A third-party admin panel. [AdminJS](https://adminjs.co/) has a Nest integration.
- A database GUI for the people who only browse and fix rows.
- Internal pages in your frontend, on the same API and policies as the rest of the application, which keeps one permission model.

#### Testing

Django's `TestCase` and `APIClient` become a testing module and [Supertest](https://github.com/ladjs/supertest). This test creates only the controller, with a fake service:

```typescript
@@filename(orders/orders.controller.spec)
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { vi } from 'vitest';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

describe('OrdersController', () => {
  let app: INestApplication;
  const ordersService = { findForCustomer: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('lists orders', async () => {
    ordersService.findForCustomer.mockResolvedValue([]);
    await request(app.getHttpServer()).get('/orders').expect(200, []);
  });
});
```

For a test of the whole application, import `AppModule` and replace providers with `overrideProvider()`. Nest doesn't create a test database for you, as Django's test runner does: point `DATABASE_URL` at a test database, apply the migrations before the tests run, and empty the tables between tests. New projects use [Vitest](https://vitest.dev/) as the test runner. See [Testing](/fundamentals/testing).

#### OpenAPI and health checks

drf-spectacular becomes `@nestjs/swagger`, which builds the document from controllers, DTOs and Zod schemas and serves Swagger UI, the counterpart of DRF's browsable API. See [OpenAPI](/openapi/introduction).

Health endpoints come from `@nestjs/terminus`, with indicators for databases, HTTP dependencies, disk and memory. See [Health checks](/reliability/terminus). For traces, errors and metrics of the running application, see [NestJS Observe](/observability/overview).

#### What's different

The mappings above hold for structure. These are the differences that change how you write code.

**One process serves many requests at once.** A Django deployment runs several worker processes or threads under Gunicorn or uWSGI, and each one handles one request at a time. Node.js runs your code on one thread, and while a request waits for the database, others run. Database drivers and HTTP clients are asynchronous, so I/O is `await`ed, as in Django's async views but everywhere. A forgotten `await` doesn't block: it lets the code continue before the query has finished. CPU-heavy work in a handler, such as resizing an image, stalls every other request in the process, so move it to a [queue](/application/queues) or a worker thread, and run several processes or containers to use several cores.

**No thread-local request.** Code outside the handler can't reach the request through a global. Pass the user to the service, or read per-request state from `AsyncLocalStorage`, which follows the request through `await`s. See [Async local storage](/recipes/async-local-storage).

**Everything is wired explicitly.** Django finds models, admin classes, management commands and templates by convention, and an app works once it's in `INSTALLED_APPS`. In Nest, nothing is configured because a package is installed, and nothing runs because a file exists: each module is imported, and each controller and provider listed. What an application does at startup can be read from its modules.

**Batteries are separate packages.** Django is one package, released as a whole. Nest's core and each first-party package are installed separately with npm, so a project carries only what it uses. Upgrade them together, since they're released for the same major version of Nest.

**Types are a compile-time check.** A type annotation describes the shape you expect, and the compiler checks your code against it. It checks nothing at runtime: a request body, a database row from a raw query or a queue message is whatever was sent. Only a [validation pipe](/application/validation) or a schema checks data at the boundary.

**Decorators are functions.** `@Controller()` and `@Injectable()` look like Python decorators, and they're functions too, but they don't wrap the class: they record metadata that Nest reads when the application starts. Dependency injection reads the constructor parameter types that the TypeScript compiler records (`emitDecoratorMetadata`), which generated projects enable for you.

**Numbers are doubles.** JavaScript's `number` is a 64-bit float, and there's no `Decimal`. Keep money in integer cents, or use a decimal library and your database's `numeric` type, which most drivers return as a string.

**ES modules and npm.** Nest 12 packages are ES modules, and a project generated as ESM imports local files with a `.js` extension, even from `.ts` files, because that's the name of the compiled file. npm and `package.json` take the place of pip and `requirements.txt` or `pyproject.toml`, and `tsc` or [SWC](/recipes/swc) compiles the code before it runs. See [ESM packages](/migration-guide#esm-packages).
