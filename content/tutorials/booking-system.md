### Build a booking system in Node.js without double bookings

Build a booking and reservation system in Node.js with NestJS and PostgreSQL that never double-books, with free slots, time zones and cancellations.

The system has resources such as meeting rooms, which staff manage, a list of each day's free slots, and bookings that users make and cancel, with a guarantee that no two bookings of one resource ever overlap. The guarantee doesn't come from application code that looks for a conflict before it inserts, which two requests arriving together both pass. It comes from PostgreSQL: an exclusion constraint refuses the second of two overlapping bookings however they arrive, and the API turns that refusal into a `409 Conflict`.

By the end, the API will:

- Let anyone list the resources and their free slots for a day, and only staff create and edit resources, with [`@nestjs/authorization`](/security/authorization).
- Accept times as ISO 8601 strings with an offset, store them as instants in UTC, and return them in UTC.
- Refuse a booking that overlaps another one with a PostgreSQL exclusion constraint, which holds whatever the application does, and answer 409.
- Let users cancel a booking up to 24 hours before it starts, with one conditional update.
- Prove, in a test against PostgreSQL, that ten users racing for one slot get exactly one booking.

It starts from the API of [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication), which signs users in with access and refresh tokens, validates requests with Zod, and keeps its data in PostgreSQL through Drizzle. This tutorial doesn't explain those parts again.

These are the endpoints, and the section that adds each one:

| Endpoint | Section |
| --- | --- |
| `POST /auth/sign-up`, `POST /auth/token`, `POST /auth/token/refresh`, `POST /auth/token/revoke`, `GET /me`, `GET /health/live`, `GET /health/ready` | [Start from the JWT API](/tutorials/booking-system#start-from-the-jwt-api) |
| `GET /resources`, `GET /resources/:id`, `POST /resources`, `PATCH /resources/:id` | [Let staff manage resources](/tutorials/booking-system#let-staff-manage-resources) |
| `POST /bookings`, `GET /bookings`, `GET /bookings/:id` | [Book without double bookings](/tutorials/booking-system#book-without-double-bookings) |
| `GET /resources/:id/availability` | [List the free slots of a day](/tutorials/booking-system#list-the-free-slots-of-a-day) |
| `POST /bookings/:id/cancel` | [Cancel before the cutoff](/tutorials/booking-system#cancel-before-the-cutoff) |

> info **Hint** The finished application is on GitHub as [nestjs/example-booking-system](https://github.com/nestjs/example-booking-system), with its tests and a CI workflow.

#### Start from the JWT API

Create the project, and install everything this tutorial uses. These are the JWT tutorial's packages plus `@nestjs/authorization`:

```bash
$ npm i -g @nestjs/cli
$ nest new booking-api --minimal
$ cd booking-api
$ npm uninstall @nestjs/platform-express @types/express
$ npm i --save @nestjs/platform-node zod @nestjs/config @nestjs/drizzle drizzle-orm@rc pg @nestjs/authentication @nestjs/authorization @nestjs/throttler @nestjs/swagger @nestjs/terminus
$ npm i --save-dev drizzle-kit@rc @types/pg @nestjs/testing vitest vite
```

Then take these files from the [finished JWT tutorial](/tutorials/rest-api-jwt-authentication#sign-users-in-with-jwts), as they are:

- `src/config.ts`, `src/main.ts`, `drizzle.config.ts` and `vitest.config.e2e.ts`
- everything under `src/auth/`, `src/users/` and `src/health/`
- `test/refresh-token.store.e2e-spec.ts`

Leave out `src/notes/` and the JWT tutorial's `drizzle/` folder: this application's first migration comes from its own schema, in the next section. Rename the notes to the booking system where they're named: the `realm` in `JwtAuth` and the title of the OpenAPI document in `main.ts`. Add the test script to `package.json`:

```json
"test:e2e": "vitest run --config ./vitest.config.e2e.ts"
```

Finally, add the database's URL and a `JWT_SECRET` to `.env`, as in the JWT tutorial, with a database of the booking system's own:

```bash
$ docker run -d --name booking-db -e POSTGRES_PASSWORD=booking -e POSTGRES_DB=booking -p 5432:5432 postgres:17
```

Its URL goes in `.env`, next to the signing secret:

```bash
DATABASE_URL=postgres://postgres:booking@localhost:5432/booking
# Generate with: openssl rand -base64 32
JWT_SECRET=
```

Staff and the people who book use the same sign-in, so a user now has a role:

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

The role isn't in the access token. `JwtAuth.validate()` loads the user on every request, so promoting a user to staff, or demoting them, takes effect on their next request.

#### Design the schema

The whole schema, in one file. The users and refresh tokens are the JWT tutorial's, with the role added:

```typescript
@@filename(src/database/schema)
import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, pgTable, text, time, timestamp, uuid } from 'drizzle-orm/pg-core';

// timestamptz: an instant, stored in UTC, whatever offset the client sent.
const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['customer', 'staff'] }).notNull().default('customer'),
  createdAt: at('created_at').notNull().defaultNow(),
});

export const resources = pgTable(
  'resources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    // The IANA time zone of the opening hours, such as Europe/Warsaw.
    timeZone: text('time_zone').notNull(),
    // Local times of day, in `timeZone`.
    opensAt: time('opens_at').notNull(),
    closesAt: time('closes_at').notNull(),
    // The length of the slots that availability lists.
    slotMinutes: integer('slot_minutes').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  (table) => [check('resources_opens_before_closes', sql`${table.opensAt} < ${table.closesAt}`)],
);

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resources.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // The booking is the half-open range [startsAt, endsAt).
    startsAt: at('starts_at').notNull(),
    endsAt: at('ends_at').notNull(),
    status: text('status', { enum: ['confirmed', 'cancelled'] }).notNull().default('confirmed'),
    createdAt: at('created_at').notNull().defaultNow(),
    cancelledAt: at('cancelled_at'),
  },
  (table) => [
    check('bookings_ends_after_starts', sql`${table.endsAt} > ${table.startsAt}`),
    index('bookings_user_id_starts_at_idx').on(table.userId, table.startsAt),
    // The exclusion constraint that prevents double bookings is in a custom migration.
  ],
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

export type Resource = typeof resources.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
```

- **Times are `timestamptz` columns.** Despite its name, `timestamp with time zone` doesn't store a time zone: it stores an instant, in UTC, and converts whatever offset the client sent. A plain `timestamp` would store `10:00` without saying where, and two clients in different zones would mean different instants by it.
- **A booking is the half-open range from `startsAt` to `endsAt`**: it includes its start and excludes its end. A booking from 10:00 to 11:00 and one from 11:00 to 12:00 don't overlap, which is what people mean by back to back.
- **A resource keeps its opening hours as local times, with the time zone they're in.** A room in Warsaw opens at 09:00 Warsaw time all year, which is 08:00 UTC in winter and 07:00 UTC in summer. Storing `08:00 UTC` would be wrong for half the year.
- **Cancelled bookings stay in the table**, with a status. The history remains, and the constraint in the next section ignores them.
- **`ends_at` must be after `starts_at`.** PostgreSQL refuses a range whose end is before its start, and a booking of zero length would overlap nothing.

Generate the migration and apply it (see [Migrations](/data/drizzle#migrations)):

```bash
$ npx drizzle-kit generate --name=booking
$ npx drizzle-kit migrate
```

#### Make double bookings impossible

The obvious way to prevent double bookings is in the service: look for a confirmed booking of the resource that overlaps the new one, and insert only if there's none. Two requests for the same slot that arrive together both look, both find nothing, and both insert. A test at the end of this tutorial runs ten such requests against PostgreSQL: that version accepted between five and ten bookings of the one slot, in each of five runs.

PostgreSQL can enforce the rule itself, with an **exclusion constraint**. A unique constraint says that no two rows have equal values; an exclusion constraint generalizes it to any operator: no two rows of a resource may have overlapping time ranges. PostgreSQL checks it on every insert and update, whatever code sends them, including concurrent ones, and fails the statement that would break it.

Drizzle's schema language has no exclusion constraints, so `drizzle-kit generate` can't produce this one. Write it by hand, in a custom migration. `--custom` creates an empty migration that runs in order with the generated ones:

```bash
$ npx drizzle-kit generate --custom --name=no_double_bookings
```

Replace the contents of the new `drizzle/<timestamp>_no_double_bookings/migration.sql` with:

```sql
-- btree_gist lets a GiST index compare uuid columns with =.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
-- No two confirmed bookings of one resource may overlap. tstzrange() builds
-- half-open ranges, [starts_at, ends_at), so back-to-back bookings don't.
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (resource_id WITH =, tstzrange(starts_at, ends_at) WITH &&)
  WHERE (status = 'confirmed');
```

- **`resource_id WITH =, tstzrange(starts_at, ends_at) WITH &&`** reads: two rows conflict when their resources are equal and their time ranges overlap (`&&`). Bookings of different resources never conflict.
- **`tstzrange(starts_at, ends_at)`** builds the range from the two columns, so the table and the code keep working with plain timestamps. Its default bounds are `[)`, the half-open range: back-to-back bookings are allowed.
- **`WHERE (status = 'confirmed')`** limits the constraint to confirmed bookings. A cancelled booking no longer holds its slot, and a new booking may overlap it.
- **`btree_gist`** is needed because the constraint is enforced by a GiST index, and GiST can't compare `uuid` values with `=` without it. The extension ships with PostgreSQL. The constraint's index also serves the availability query of a later section.
- **The `statement-breakpoint` comment** separates the two statements, as in the migrations `drizzle-kit` generates.

Apply it. `drizzle-kit` doesn't read custom migrations, so it doesn't know about the constraint, and it won't generate a migration that drops it:

```bash
$ npx drizzle-kit migrate
$ npx drizzle-kit generate
No schema changes, nothing to migrate
```

#### Let staff manage resources

[`@nestjs/authorization`](/security/authorization) expresses permissions as **policies**, classes whose methods answer "may this user do this?". Register its module right after `AuthenticationModule`: both register a global guard, and authorization's needs the user that authentication sets. With the booking system's feature modules, the root module is:

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
import { BookingsModule } from './bookings/bookings.module.js';
import { envSchema, type Env } from './config.js';
import { HealthModule } from './health/health.module.js';
import { ResourcesModule } from './resources/resources.module.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'booking-api',
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
          issuer: 'booking-api',
          audience: 'booking-api',
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
    ResourcesModule,
    BookingsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

The authorization guard **denies by default**: a route runs only if it declares who may call it, with `@Can()` for a policy check, `@Can.Anyone()` for any caller that authentication let through, or `@Public()`, which counts as `@Can.Anyone()`. The routes from the JWT tutorial under `/auth` and `/health` are `@Public()` already. `GET /me` is for any signed-in user:

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

The resources' policy has one ability, managing them. The user parameter accepts `null`, a guest, so the guard can call it on any route:

```typescript
@@filename(src/resources/resource.policy)
import { Policy } from '@nestjs/authorization';
import type { User } from '../users/user.js';

@Policy()
export class ResourcePolicy {
  // `null` is a guest.
  manage(user: User | null) {
    return user?.role === 'staff';
  }
}
```

The request schemas, including the query string of the availability route that a later section adds:

```typescript
@@filename(src/resources/resources.schemas)
import { z } from 'zod';

const name = z.string().trim().min(1).max(200);
// Any IANA time zone the runtime knows, such as Europe/Warsaw.
const timeZone = z.string().refine(isTimeZone, 'Unknown time zone');
// A local time of day, HH:MM.
const timeOfDay = z.iso.time({ precision: -1 });
const slotMinutes = z.number().int().min(5).max(480);

export const createResourceSchema = z
  .object({ name, timeZone, opensAt: timeOfDay, closesAt: timeOfDay, slotMinutes })
  .refine((r) => r.opensAt < r.closesAt, { message: 'Must be after opensAt', path: ['closesAt'] });
export type CreateResourceDto = z.infer<typeof createResourceSchema>;

// The time zone and opening hours stay as created: changing them would leave
// existing bookings outside the hours.
export const updateResourceSchema = z.object({ name, slotMinutes, active: z.boolean() }).partial();
export type UpdateResourceDto = z.infer<typeof updateResourceSchema>;

export const availabilityQuerySchema = z.object({
  // A day in the resource's time zone.
  date: z.iso.date(),
});
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

function isTimeZone(value: string): boolean {
  // Names only: PostgreSQL reads an offset such as +01:00 the POSIX way, with the sign flipped.
  if (/^[+-]/.test(value)) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
```

`isTimeZone()` asks the runtime's time zone database, which accepts IANA names, their aliases and `UTC`. `Intl.supportedValuesOf('timeZone')` looks like the obvious list to check against, but it holds only canonical names, and leaves out `UTC`. The runtime also accepts an offset such as `+01:00`, which PostgreSQL's `AT TIME ZONE` reads as a POSIX offset, east and west swapped: a room created with `+01:00` would open two hours off, without an error, so offsets are refused.

```typescript
@@filename(src/resources/resources.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { resources, type Resource } from '../database/schema.js';
import type { CreateResourceDto, UpdateResourceDto } from './resources.schemas.js';

@Injectable()
export class ResourcesService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  findAll(): Promise<Resource[]> {
    return this.db.select().from(resources).where(eq(resources.active, true)).orderBy(asc(resources.name)).limit(100);
  }

  async findOne(id: string): Promise<Resource> {
    const [resource] = await this.db
      .select()
      .from(resources)
      .where(and(eq(resources.id, id), eq(resources.active, true)));
    return resource ?? notFound();
  }

  async create(dto: CreateResourceDto): Promise<Resource> {
    const [resource] = await this.db.insert(resources).values(dto).returning();
    return resource;
  }

  async update(id: string, dto: UpdateResourceDto): Promise<Resource> {
    const [resource] = await this.db.update(resources).set(dto).where(eq(resources.id, id)).returning();
    return resource ?? notFound();
  }
}

function notFound(): never {
  throw new NotFoundException('Resource not found');
}
```

Resources are deactivated rather than deleted, since bookings refer to them. The read routes are `@Public()`, and the write routes check the policy before the handler runs. A guest gets a 401, which asks them to sign in, and a signed-in user who isn't staff a 403, which says signing in won't help:

```typescript
@@filename(src/resources/resources.controller)
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ApiSecurity } from '@nestjs/swagger';
import { z } from 'zod';
import { ResourcePolicy } from './resource.policy.js';
import {
  createResourceSchema,
  updateResourceSchema,
  type CreateResourceDto,
  type UpdateResourceDto,
} from './resources.schemas.js';
import { ResourcesService } from './resources.service.js';

const resourceId = { schema: z.uuid() };

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Public()
  @ApiSecurity({})
  @Get()
  findAll() {
    return this.resourcesService.findAll();
  }

  @Public()
  @ApiSecurity({})
  @Get(':id')
  findOne(@Param('id', resourceId) id: string) {
    return this.resourcesService.findOne(id);
  }

  @Can(ResourcePolicy, 'manage')
  @Post()
  create(@Body({ schema: createResourceSchema }) dto: CreateResourceDto) {
    return this.resourcesService.create(dto);
  }

  @Can(ResourcePolicy, 'manage')
  @Patch(':id')
  update(@Param('id', resourceId) id: string, @Body({ schema: updateResourceSchema }) dto: UpdateResourceDto) {
    return this.resourcesService.update(id, dto);
  }
}
```

Register the policy as a provider of its module; the authorization module finds it there:

```typescript
@@filename(src/resources/resources.module)
import { Module } from '@nestjs/common';
import { ResourcePolicy } from './resource.policy.js';
import { ResourcesController } from './resources.controller.js';
import { ResourcesService } from './resources.service.js';

@Module({
  controllers: [ResourcesController],
  providers: [ResourcesService, ResourcePolicy],
})
export class ResourcesModule {}
```

Sign-up creates customers. Promote the first staff member in the database (from then on, an admin screen of your own can do it):

```bash
$ docker exec booking-db psql -U postgres -d booking -c "UPDATE users SET role = 'staff' WHERE email = 'sam@example.com'"
```

#### Book without double bookings

A booking request names the resource and two instants. Each instant must carry an offset, `Z` for UTC or one such as `+01:00`. A time without one, such as `2026-12-01T10:00:00`, means a different instant in every time zone, so it's a 400 rather than a guess:

```typescript
@@filename(src/bookings/bookings.schemas)
import { z } from 'zod';

// An instant with an explicit offset, such as 2026-12-01T10:00:00+01:00 or ...Z.
// A local time without one ("10:00 where?") is a 400.
const instant = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

export const createBookingSchema = z
  .object({ resourceId: z.uuid(), startsAt: instant, endsAt: instant })
  .refine((b) => b.endsAt > b.startsAt, { message: 'Must be after startsAt', path: ['endsAt'] });
export type CreateBookingDto = z.infer<typeof createBookingSchema>;
```

The handler receives `Date` objects, the schema's output. The OpenAPI document describes the input, strings in the `date-time` format.

When an insert breaks the constraint, PostgreSQL fails it with SQLSTATE `23P01`, `exclusion_violation`, and names the constraint. Drizzle wraps the driver's error in a `DrizzleQueryError`, whose message is the failed query, and keeps the driver's `DatabaseError` as its `cause`:

```typescript
@@filename(src/database/errors)
import { DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';

/** Whether a query failed because it would have violated the named exclusion constraint. */
export function isExclusionViolation(error: unknown, constraint: string): boolean {
  // Drizzle wraps the driver's error: the PostgreSQL error is its `cause`.
  const cause = error instanceof DrizzleQueryError ? error.cause : error;
  // 23P01 is exclusion_violation.
  return cause instanceof DatabaseError && cause.code === '23P01' && cause.constraint === constraint;
}
```

The service inserts the booking, and turns that one error into a 409:

```typescript
@@filename(src/bookings/bookings.service)
import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq, gt, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { isExclusionViolation } from '../database/errors.js';
import { bookings, resources, type Booking } from '../database/schema.js';
import type { CreateBookingDto } from './bookings.schemas.js';

@Injectable()
export class BookingsService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async create(userId: string, { resourceId, startsAt, endsAt }: CreateBookingDto): Promise<Booking> {
    // A time of day in the resource's time zone.
    const local = (instant: Date) => sql`(${instant}::timestamptz AT TIME ZONE ${resources.timeZone})`;
    try {
      // One statement: inserts the booking only if the resource is active and the
      // booking fits its opening hours. The exclusion constraint does the rest.
      const [booking] = await this.db
        .insert(bookings)
        .select((qb) =>
          qb
            .select({
              resourceId: resources.id,
              userId: sql`${userId}::uuid`.as('user_id'),
              startsAt: sql`${startsAt}::timestamptz`.as('starts_at'),
              endsAt: sql`${endsAt}::timestamptz`.as('ends_at'),
            })
            .from(resources)
            .where(
              and(
                eq(resources.id, resourceId),
                eq(resources.active, true),
                sql`${startsAt}::timestamptz > now()`,
                sql`${local(startsAt)}::date = ${local(endsAt)}::date`,
                sql`${local(startsAt)}::time >= ${resources.opensAt}`,
                sql`${local(endsAt)}::time <= ${resources.closesAt}`,
              ),
            )
            // Locks the resource's row: bookings of one resource take turns.
            .for('no key update'),
        )
        .returning();
      return booking ?? (await this.refuseBooking(resourceId));
    } catch (error) {
      if (isExclusionViolation(error, 'bookings_no_overlap')) {
        throw new ConflictException('The resource is already booked at that time');
      }
      throw error;
    }
  }

  findUpcoming(userId: string): Promise<Booking[]> {
    return this.db
      .select()
      .from(bookings)
      .where(and(eq(bookings.userId, userId), gt(bookings.endsAt, sql`now()`)))
      .orderBy(asc(bookings.startsAt))
      .limit(100);
  }

  async findOne(userId: string, id: string): Promise<Booking> {
    const [booking] = await this.db.select().from(bookings).where(this.owned(userId, id));
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private owned(userId: string, id: string) {
    return and(eq(bookings.id, id), eq(bookings.userId, userId));
  }

  /** Why the insert added no row: 404 for an unknown resource, 422 for times that don't fit. */
  private async refuseBooking(resourceId: string): Promise<never> {
    const [resource] = await this.db
      .select({ id: resources.id })
      .from(resources)
      .where(and(eq(resources.id, resourceId), eq(resources.active, true)));
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    throw new UnprocessableEntityException('A booking must start in the future, within the opening hours of one day');
  }
}
```

- **There's no check for overlapping bookings in the code.** The insert either commits or fails on the constraint, and the `catch` turns that failure into a 409, which tells the client the slot was taken and that another one may still be free. Any other database error stays a 500.
- **The insert is an `INSERT ... SELECT` from the resource's row.** It inserts a booking only when the resource is active and the booking starts in the future and fits the opening hours of one local day, so there's no read before the write. `AT TIME ZONE` converts each instant to the resource's local time with the offset valid on that date, so the hours mean the same in summer and winter.
- **The `SELECT` locks the resource's row** (`FOR NO KEY UPDATE`), so the bookings of one resource take turns; bookings of different resources don't wait for each other. The constraint alone keeps the data correct, but two inserts in flight at once can each wait for the other one's check, which PostgreSQL resolves after its deadlock timeout, one second by default, by aborting one of them with `40P01`, `deadlock detected`. Without the lock, that happened in 4 of 100 runs of the ten-user test, as a 500. With it, a second booking waits for the first to commit, then fails on the constraint at once. The lock is held for one statement.
- **No row inserted means 404 or 422.** `refuseBooking()` tells an unknown or inactive resource (404) from times that don't fit (422, a valid request the server can't carry out).

Every signed-in user can book, and sees only their own bookings:

```typescript
@@filename(src/bookings/bookings.controller)
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import { createBookingSchema, type CreateBookingDto } from './bookings.schemas.js';
import { BookingsService } from './bookings.service.js';

const bookingId = { schema: z.uuid() };

// Any signed-in user books, and sees only their own bookings.
@Can.Anyone()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body({ schema: createBookingSchema }) dto: CreateBookingDto) {
    return this.bookingsService.create(userId, dto);
  }

  @Get()
  findUpcoming(@CurrentUser('id') userId: string) {
    return this.bookingsService.findUpcoming(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id', bookingId) id: string) {
    return this.bookingsService.findOne(userId, id);
  }
}
```

The bookings module registers the controller and the service:

```typescript
@@filename(src/bookings/bookings.module)
import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
```

#### List the free slots of a day

Before booking, a user wants to see what's free. A resource's slots for a day are its opening hours cut into pieces of `slotMinutes`, and a slot is free when no confirmed booking overlaps it. PostgreSQL computes the whole list in one query: `generate_series()` produces the slots, and `NOT EXISTS` drops those that overlap a booking, with the same overlap test as the constraint. Add the method to `ResourcesService`:

```typescript
@@filename(src/resources/resources.service)
import { and, asc, eq, sql } from 'drizzle-orm';
import { bookings, resources, type Resource } from '../database/schema.js';
// ...

export interface Slot {
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class ResourcesService {
  // ...

  /** The free slots of one day, in the resource's time zone, that haven't started yet. */
  async availability(id: string, date: string): Promise<Slot[]> {
    const { timeZone, opensAt, closesAt, slotMinutes } = await this.findOne(id);
    const length = sql`make_interval(mins => ${slotMinutes})`;
    // The day's opening and closing times, as instants. AT TIME ZONE applies the
    // offset that is valid on that date, so a day with a DST change is right too.
    const opens = sql`(${date}::date + ${opensAt}::time) AT TIME ZONE ${timeZone}`;
    const closes = sql`(${date}::date + ${closesAt}::time) AT TIME ZONE ${timeZone}`;
    const slot = sql`slot`;

    return this.db
      .select({
        startsAt: sql`${slot}`.mapWith(bookings.startsAt),
        endsAt: sql`${slot} + ${length}`.mapWith(bookings.endsAt),
      })
      .from(sql`generate_series(${opens}, ${closes} - ${length}, ${length}) AS slot`)
      .where(
        and(
          sql`${slot} > now()`,
          // The same rule as the exclusion constraint: confirmed bookings, half-open ranges.
          sql`NOT EXISTS (
            SELECT 1 FROM ${bookings}
            WHERE ${bookings.resourceId} = ${id}
              AND ${bookings.status} = 'confirmed'
              AND tstzrange(${bookings.startsAt}, ${bookings.endsAt}) && tstzrange(${slot}, ${slot} + ${length})
          )`,
        ),
      )
      .orderBy(slot);
  }
}
```

- **The day is a day in the resource's time zone.** `2026-12-01` plus `09:00`, at `Europe/Warsaw`, is 08:00 UTC; in July, the same expression gives 07:00 UTC. On the day the clocks change, the series still runs from opening to closing time.
- **`mapWith(bookings.startsAt)`** decodes the computed columns the way Drizzle decodes a `timestamptz` column, so the slots are `Date` objects, like every other time the API returns.
- **The query can use the constraint's index.** It filters on the same resource, status and range expression as `bookings_no_overlap`, so PostgreSQL can look the bookings up in that index.
- **A free slot is a hint, not a reservation.** Between listing and booking, someone else can take it, and the booking then gets a 409. That's the constraint doing its job; the client lists the slots again.

The route is public, like the rest of the catalog:

```typescript
@@filename(src/resources/resources.controller)
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
// ...
import {
  availabilityQuerySchema,
  createResourceSchema,
  updateResourceSchema,
  type AvailabilityQuery,
  type CreateResourceDto,
  type UpdateResourceDto,
} from './resources.schemas.js';
// ...

  @Public()
  @ApiSecurity({})
  @Get(':id/availability')
  async availability(
    @Param('id', resourceId) id: string,
    @Query({ schema: availabilityQuerySchema }) { date }: AvailabilityQuery,
  ) {
    return { date, slots: await this.resourcesService.availability(id, date) };
  }
```

#### Cancel before the cutoff

Users may cancel a booking up to 24 hours before it starts. Like every state change in this application, cancelling is one conditional `UPDATE`: it changes the booking only if it belongs to the user, is still confirmed, and starts more than 24 hours from now, measured by the database's clock. Add to `BookingsService`:

```typescript
@@filename(src/bookings/bookings.service)
// ...

/** How long before its start a booking can still be cancelled. */
const CANCELLATION_CUTOFF = '24 hours';

@Injectable()
export class BookingsService {
  // ...

  /** The owner cancels a confirmed booking, up to the cutoff before it starts. */
  async cancel(userId: string, id: string): Promise<Booking> {
    // Conditional, and on the database's clock: of two cancellations, or one at
    // the moment of the cutoff, the WHERE clause decides.
    const [booking] = await this.db
      .update(bookings)
      .set({ status: 'cancelled', cancelledAt: sql`now()` })
      .where(
        and(
          this.owned(userId, id),
          eq(bookings.status, 'confirmed'),
          sql`${bookings.startsAt} > now() + ${CANCELLATION_CUTOFF}::interval`,
        ),
      )
      .returning();
    return booking ?? (await this.refuseCancel(userId, id));
  }

  // ...

  /** Why the cancellation changed nothing: 404 if the booking isn't theirs, 409 otherwise. */
  private async refuseCancel(userId: string, id: string): Promise<never> {
    const { status } = await this.findOne(userId, id);
    if (status === 'cancelled') {
      throw new ConflictException('Booking is already cancelled');
    }
    throw new ConflictException(`Bookings can't be cancelled less than ${CANCELLATION_CUTOFF} before they start`);
  }
}
```

A service that read the booking, checked its status and start in JavaScript, and then saved it would have a gap between the check and the write. Here the `WHERE` clause is the check. Once the status is `cancelled`, the constraint no longer counts the booking, so its slot is free for someone else in the same instant.

Cancelling changes an existing booking, so it answers 200, not 201:

```typescript
@@filename(src/bookings/bookings.controller)
import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
// ...

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser('id') userId: string, @Param('id', bookingId) id: string) {
    return this.bookingsService.cancel(userId, id);
  }
```

#### Try it

Start the application:

```bash
$ npm run start:dev
```

The dates below were in the future when this session was recorded; use dates ahead of today, and tomorrow's for the last example. Sign up a user and a staff member, and promote the staff member as shown above. Their tokens keep working after the promotion, since the role is read on every request (tokens and response bodies are shortened here and below):

```bash
$ curl localhost:3000/auth/sign-up --json '{"email":"ada@example.com","password":"correct horse battery"}'
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","refreshToken":"...","expiresIn":900}
$ ADA="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
$ SAM="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

Only staff add resources. This room is in Warsaw, open from 09:00 to 17:00 local time, in one-hour slots:

```bash
$ curl localhost:3000/resources -H "$ADA" --json '{"name":"Room A","timeZone":"Europe/Warsaw","opensAt":"09:00","closesAt":"17:00","slotMinutes":60}'
{"message":"Forbidden","statusCode":403}
$ curl localhost:3000/resources -H "$SAM" --json '{"name":"Room A","timeZone":"Europe/Warsaw","opensAt":"09:00","closesAt":"17:00","slotMinutes":60}'
{"id":"8bc932f4-1aa4-4ba1-a16d-0dca819ef5c8","name":"Room A","timeZone":"Europe/Warsaw","opensAt":"09:00:00","closesAt":"17:00:00","slotMinutes":60,"active":true,"createdAt":"2026-11-19T22:06:06.275Z"}
```

December 1 is a winter day in Warsaw, one hour ahead of UTC, so the room's eight slots run from 08:00 to 16:00 UTC:

```bash
$ curl "localhost:3000/resources/8bc932f4-1aa4-4ba1-a16d-0dca819ef5c8/availability?date=2026-12-01"
{"date":"2026-12-01","slots":[{"startsAt":"2026-12-01T08:00:00.000Z","endsAt":"2026-12-01T09:00:00.000Z"},{"startsAt":"2026-12-01T09:00:00.000Z","endsAt":"2026-12-01T10:00:00.000Z"},...,{"startsAt":"2026-12-01T15:00:00.000Z","endsAt":"2026-12-01T16:00:00.000Z"}]}
```

Ada books 10:00 to 11:00 Warsaw time, with the offset. The response has the same instant, in UTC:

```bash
$ curl localhost:3000/bookings -H "$ADA" --json '{"resourceId":"8bc932f4-1aa4-4ba1-a16d-0dca819ef5c8","startsAt":"2026-12-01T10:00:00+01:00","endsAt":"2026-12-01T11:00:00+01:00"}'
{"id":"f30a70ac-eec9-4f60-920d-2bd86f603e31","resourceId":"8bc932f4-1aa4-4ba1-a16d-0dca819ef5c8","userId":"d0276247-b9ac-4830-a774-fdb5f452f03c","startsAt":"2026-12-01T09:00:00.000Z","endsAt":"2026-12-01T10:00:00.000Z","status":"confirmed","createdAt":"2026-11-19T22:06:46.343Z","cancelledAt":null}
```

Sam can't book half an hour into it, but can book the next hour, which starts where Ada's ends. A time without an offset is a 400, and a booking that starts before the room opens a 422:

```bash
$ curl localhost:3000/bookings -H "$SAM" --json '{"resourceId":"8bc932f4-1aa4-4ba1-a16d-0dca819ef5c8","startsAt":"2026-12-01T09:30:00Z","endsAt":"2026-12-01T10:30:00Z"}'
{"message":"The resource is already booked at that time","error":"Conflict","statusCode":409}
$ curl localhost:3000/bookings -H "$SAM" --json '{"resourceId":"8bc932f4-1aa4-4ba1-a16d-0dca819ef5c8","startsAt":"2026-12-01T10:00:00Z","endsAt":"2026-12-01T11:00:00Z"}'
{"id":"db5a86fc-3015-4f22-8106-33b0f013dfce",...,"startsAt":"2026-12-01T10:00:00.000Z","endsAt":"2026-12-01T11:00:00.000Z","status":"confirmed",...}
$ curl localhost:3000/bookings -H "$SAM" --json '{"resourceId":"8bc932f4-1aa4-4ba1-a16d-0dca819ef5c8","startsAt":"2026-12-01T12:00:00","endsAt":"2026-12-01T13:00:00"}'
{"message":["startsAt: Invalid ISO datetime","endsAt: Invalid ISO datetime"],"error":"Bad Request","statusCode":400}
$ curl localhost:3000/bookings -H "$SAM" --json '{"resourceId":"8bc932f4-1aa4-4ba1-a16d-0dca819ef5c8","startsAt":"2026-12-01T07:00:00Z","endsAt":"2026-12-01T09:00:00Z"}'
{"message":"A booking must start in the future, within the opening hours of one day","error":"Unprocessable Entity","statusCode":422}
```

The two booked hours are gone from the free slots. On March 28, 2027, the day Poland moves its clocks forward, the same room opens at 07:00 UTC:

```bash
$ curl "localhost:3000/resources/8bc932f4-1aa4-4ba1-a16d-0dca819ef5c8/availability?date=2026-12-01"
{"date":"2026-12-01","slots":[{"startsAt":"2026-12-01T08:00:00.000Z","endsAt":"2026-12-01T09:00:00.000Z"},{"startsAt":"2026-12-01T11:00:00.000Z","endsAt":"2026-12-01T12:00:00.000Z"},...]}
$ curl "localhost:3000/resources/8bc932f4-1aa4-4ba1-a16d-0dca819ef5c8/availability?date=2027-03-28"
{"date":"2027-03-28","slots":[{"startsAt":"2027-03-28T07:00:00.000Z","endsAt":"2027-03-28T08:00:00.000Z"},...,{"startsAt":"2027-03-28T14:00:00.000Z","endsAt":"2027-03-28T15:00:00.000Z"}]}
```

Ada cancels her booking. Sam gets a 404 for it, as for a booking that doesn't exist, and it can be cancelled only once. Its hour is free again at once:

```bash
$ curl -X POST localhost:3000/bookings/f30a70ac-eec9-4f60-920d-2bd86f603e31/cancel -H "$SAM"
{"message":"Booking not found","error":"Not Found","statusCode":404}
$ curl -X POST localhost:3000/bookings/f30a70ac-eec9-4f60-920d-2bd86f603e31/cancel -H "$ADA"
{"id":"f30a70ac-eec9-4f60-920d-2bd86f603e31",...,"status":"cancelled","createdAt":"2026-11-19T22:06:46.343Z","cancelledAt":"2026-11-19T22:07:12.645Z"}
$ curl -X POST localhost:3000/bookings/f30a70ac-eec9-4f60-920d-2bd86f603e31/cancel -H "$ADA"
{"message":"Booking is already cancelled","error":"Conflict","statusCode":409}
$ curl localhost:3000/bookings -H "$SAM" --json '{"resourceId":"8bc932f4-1aa4-4ba1-a16d-0dca819ef5c8","startsAt":"2026-12-01T09:30:00Z","endsAt":"2026-12-01T10:00:00Z"}'
{"id":"32d1c620-05b3-4239-82b5-e0b4cbf45b99",...,"startsAt":"2026-12-01T09:30:00.000Z","endsAt":"2026-12-01T10:00:00.000Z","status":"confirmed",...}
```

A booking for tomorrow morning is past the cutoff as soon as it's made:

```bash
$ curl localhost:3000/bookings -H "$ADA" --json '{"resourceId":"8bc932f4-1aa4-4ba1-a16d-0dca819ef5c8","startsAt":"2026-11-20T10:00:00+01:00","endsAt":"2026-11-20T11:00:00+01:00"}'
{"id":"dc96c803-b64d-4c17-acf2-385b4c860a9c",...,"startsAt":"2026-11-20T09:00:00.000Z","endsAt":"2026-11-20T10:00:00.000Z","status":"confirmed",...}
$ curl -X POST localhost:3000/bookings/dc96c803-b64d-4c17-acf2-385b4c860a9c/cancel -H "$ADA"
{"message":"Bookings can't be cancelled less than 24 hours before they start","error":"Conflict","statusCode":409}
```

#### Test it

The guarantees that matter here are about concurrency, and an in-process database such as PGlite has a single connection, where requests never truly race. So these tests run against a real PostgreSQL server, through a connection pool, with `app.inject()` sending requests that run at the same time. The migrations, the custom one included, set up the database:

```typescript
@@filename(test/bookings.e2e-spec)
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
import { bookings, users } from '../src/database/schema.js';
import type { Role } from '../src/users/user.js';

// A real PostgreSQL with a pool, so concurrent bookings really race.
const url = process.env.TEST_DATABASE_URL;

// Three days from now, in UTC: in the future, and past the cancellation cutoff.
const day = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const at = (time: string) => `${day}T${time}:00Z`;

describe.skipIf(!url)('Booking API (e2e)', () => {
  const db = drizzle({ client: new Pool({ connectionString: url, max: 20 }) });
  let app: NestNodeApplication;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    await db.execute(sql`TRUNCATE users, resources, bookings, refresh_tokens CASCADE`);
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

  /** A room open 08:00 to 18:00 UTC, with one-hour slots. */
  async function createRoom() {
    const res = await app.inject({
      method: 'POST',
      url: '/resources',
      headers: await signUp(`staff-${crypto.randomUUID()}@example.com`, 'staff'),
      payload: { name: 'Room', timeZone: 'UTC', opensAt: '08:00', closesAt: '18:00', slotMinutes: 60 },
    });
    expect(res.statusCode).toBe(201);
    return res.json<{ id: string }>().id;
  }

  function book(headers: Record<string, string>, resourceId: string, startsAt: string, endsAt: string) {
    return app.inject({ method: 'POST', url: '/bookings', headers, payload: { resourceId, startsAt, endsAt } });
  }

  function cancel(headers: Record<string, string>, bookingId: string) {
    return app.inject({ method: 'POST', url: `/bookings/${bookingId}/cancel`, headers });
  }

  it('lets only staff create resources', async () => {
    const payload = { name: 'Room', timeZone: 'UTC', opensAt: '08:00', closesAt: '18:00', slotMinutes: 60 };
    const customer = await signUp('customer@example.com');
    expect((await app.inject({ method: 'POST', url: '/resources', payload })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/resources', headers: customer, payload })).statusCode).toBe(403);
  });

  it('books a slot exactly once when ten users race for it', async () => {
    const roomId = await createRoom();
    const racers = await Promise.all(Array.from({ length: 10 }, (_, i) => signUp(`racer${i}@example.com`)));

    const results = await Promise.all(racers.map((headers) => book(headers, roomId, at('10:00'), at('11:00'))));

    expect(results.map((res) => res.statusCode).sort()).toEqual([201, ...Array(9).fill(409)]);
    const rows = await db.select().from(bookings).where(eq(bookings.resourceId, roomId));
    expect(rows).toHaveLength(1);
  });

  it('accepts back-to-back bookings, and refuses overlapping ones', async () => {
    const roomId = await createRoom();
    const headers = await signUp('back-to-back@example.com');

    expect((await book(headers, roomId, at('10:00'), at('11:00'))).statusCode).toBe(201);
    // Ends exactly when the next one starts: the ranges are half-open.
    expect((await book(headers, roomId, at('11:00'), at('12:00'))).statusCode).toBe(201);
    expect((await book(headers, roomId, at('09:00'), at('10:00'))).statusCode).toBe(201);
    // Any overlap, even one minute, is refused.
    expect((await book(headers, roomId, at('11:59'), at('13:00'))).statusCode).toBe(409);

    const availability = await app.inject({ method: 'GET', url: `/resources/${roomId}/availability?date=${day}` });
    const { slots } = availability.json<{ slots: { startsAt: string }[] }>();
    const starts = slots.map((slot) => slot.startsAt.slice(11, 16));
    expect(starts).toEqual(['08:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']);
  });

  it('frees the slot when a booking is cancelled', async () => {
    const roomId = await createRoom();
    const ada = await signUp('ada@example.com');
    const bob = await signUp('bob@example.com');
    const booking = (await book(ada, roomId, at('14:00'), at('15:00'))).json<{ id: string }>();

    // Someone else's booking is a 404, as if it didn't exist.
    expect((await cancel(bob, booking.id)).statusCode).toBe(404);
    expect((await cancel(ada, booking.id)).json()).toMatchObject({ status: 'cancelled' });
    expect((await cancel(ada, booking.id)).statusCode).toBe(409);

    // The cancelled booking still overlaps, but the constraint only counts confirmed ones.
    expect((await book(bob, roomId, at('14:30'), at('15:30'))).statusCode).toBe(201);
  });

  it('refuses to cancel a booking that starts within the cutoff', async () => {
    const roomId = await createRoom();
    const headers = await signUp('late@example.com');
    const [{ id: userId }] = await db.select({ id: users.id }).from(users).where(eq(users.email, 'late@example.com'));
    // Inserted directly: it starts in an hour, whatever the room's opening hours.
    const [booking] = await db
      .insert(bookings)
      .values({
        resourceId: roomId,
        userId,
        startsAt: new Date(Date.now() + 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      })
      .returning();

    expect((await cancel(headers, booking.id)).statusCode).toBe(409);
    const [row] = await db.select().from(bookings).where(eq(bookings.id, booking.id));
    expect(row.status).toBe('confirmed');
  });
});
```

- **"books a slot exactly once"** sends ten bookings of the same hour at once, from ten users. One gets a 201 and nine a 409, and the table holds one booking.
- **"back-to-back"** books 10:00 to 11:00, then 11:00 to 12:00 and 09:00 to 10:00, which touch it without overlapping, then a booking that overlaps by one minute. The free slots that remain are the ones the bookings left.
- **"frees the slot"** checks that the constraint's `WHERE` clause works: once a booking is cancelled, an overlapping one succeeds.
- **"within the cutoff"** inserts a booking that starts in an hour straight into the table, since whether the API accepts it would depend on the time of day the test runs, and fails to cancel it.

Create a database of their own, since the tests truncate the tables, and run them:

```bash
$ docker exec booking-db psql -U postgres -c "CREATE DATABASE booking_test"
$ TEST_DATABASE_URL=postgres://postgres:booking@localhost:5432/booking_test npm run test:e2e -- --no-file-parallelism

 Test Files  2 passed (2)
      Tests  10 passed (10)
```

The JWT tutorial's refresh-token store test runs too. Both test files truncate tables of the same database, so `--no-file-parallelism` runs them one after the other.

Drop the constraint from the test database (`ALTER TABLE bookings DROP CONSTRAINT bookings_no_overlap`) and run the tests again: all ten racing users get a 201, and the back-to-back test's overlapping booking is accepted too.

#### Production checklist

Everything in the JWT tutorial's [checklist](/tutorials/rest-api-jwt-authentication#production-checklist) applies. For bookings in particular:

- **Ship the custom migration like any other.** `drizzle-kit migrate` runs it in order, as a release step. Its first statement creates `btree_gist`; if the role that runs migrations may not create extensions on your database, have an administrator create it once.
- **Clean up overlaps before adding the constraint to an existing table.** `ALTER TABLE ... ADD CONSTRAINT` fails, naming the two conflicting rows, if any confirmed bookings already overlap.
- **Keep times in UTC end to end.** Store `timestamptz`, return ISO 8601 with `Z`, and convert to a local time only for display, in the client. Keep time zones as IANA names, never as fixed offsets such as `+01:00`, which are wrong for half the year.
- **Map only your constraint's violation to a 409.** Every other database error is a defect and should stay a 500, so it's reported as one.
- **Give production its own Observe key pair, and know what a 409 means there.** Create the pair on the project's **API Keys** page, and set it as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the platform's environment: `start:prod` doesn't load `.env`. [NestJS Observe](/observability/error-monitoring) then lists every failed request in its Errors view, but an exception your code throws on purpose, such as this `ConflictException`, doesn't count as a new defect, and 4xx responses don't count against the error rate. A busy slot that many users try to book shows up as 409s, not as an alert. An unmapped `23P01`, or a `40P01` deadlock, is a 500, and does.
- **Watch the lock under load.** Bookings of one popular resource wait for each other on its row, for the length of one `INSERT`. Observe records the average and p95 latency of every route, so `POST /bookings` slowing down under a rush is visible.

#### What's next

- Hold a slot while the user pays: a booking with a `held` status and an `expires_at`. The constraint's `WHERE` clause can't compare with `now()`, since an index predicate must give the same answer every time, so an expired hold blocks its slot until a statement releases it. Release expired holds of the same resource in the booking's own statement or transaction, or from a [scheduled job](/application/task-scheduling).
- Send a confirmation and a reminder before each booking, outside the request: [Mail](/application/mail) and [Queues](/application/queues).
- Give staff a view of every booking of a resource, and let them cancel any of them, with another [policy](/security/authorization).
- See slow bookings and their SQL in production, request by request: [Observability](/observability/overview).
