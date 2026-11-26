### Build a multi-tenant SaaS backend in Node.js

Build a multi-tenant SaaS backend in Node.js with NestJS and PostgreSQL: organizations, roles, email invitations, and every query scoped to its tenant.

The application has organizations that users create and join, members with the roles owner, admin and member, and projects that belong to one organization and that nobody outside it can see. A multi-tenant backend is ordinary CRUD with one rule that must never break: a request only ever touches the data of its own tenant. This tutorial spends its time on that rule, and on the few places where getting it right takes more than a `WHERE` clause: invitations, role changes, and the last owner of an organization.

By the end, the API will:

- Take the organization from the route, as in `/orgs/:orgId/projects`, and check the caller's membership once per request, in a guard that answers 404 to anyone who isn't a member.
- Put the organization's id in the `WHERE` clause of every query, so an id from another tenant finds nothing.
- Invite people by email with [`@nestjs/mail`](/application/mail), through links that work once, and only for the address they were sent to.
- Change roles and remove members with conditional statements, so an organization never loses its last owner, even when two owners step down at the same moment.
- Record every change to an organization's members and invitations, and every deleted project, in an audit log, in the same transaction as the change.
- Build the projects' service once per organization, in a durable DI sub-tree, with the organization's id fixed when it's created.
- Prove the tenant boundary and the last-owner rule in tests against PostgreSQL.

It starts from the API of [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication), which signs users in with access and refresh tokens, validates requests with Zod, and keeps its data in PostgreSQL through Drizzle. This tutorial doesn't explain those parts again.

These are the endpoints, and the section that adds each one:

| Endpoint | Section |
| --- | --- |
| `POST /auth/sign-up`, `POST /auth/token`, `POST /auth/token/refresh`, `POST /auth/token/revoke`, `GET /me`, `GET /health/live`, `GET /health/ready` | [Start from the JWT API](/tutorials/multi-tenant-saas#start-from-the-jwt-api) |
| `POST /orgs`, `GET /orgs`, `GET /orgs/:orgId/audit-events` | [Create organizations](/tutorials/multi-tenant-saas#create-organizations) |
| `GET /orgs/:orgId/projects`, `POST /orgs/:orgId/projects`, `GET /orgs/:orgId/projects/:projectId`, `DELETE /orgs/:orgId/projects/:projectId` | [Scope every query to the organization](/tutorials/multi-tenant-saas#scope-every-query-to-the-organization) |
| `GET /orgs/:orgId/members`, `PATCH /orgs/:orgId/members/:userId`, `DELETE /orgs/:orgId/members/:userId` | [Never lose the last owner](/tutorials/multi-tenant-saas#never-lose-the-last-owner) |
| `POST /orgs/:orgId/invitations`, `POST /invitations/accept` | [Invite members by email](/tutorials/multi-tenant-saas#invite-members-by-email) |

> info **Hint** The finished application is on GitHub as [nestjs/example-multi-tenant-saas](https://github.com/nestjs/example-multi-tenant-saas), with its tests and a CI workflow.

#### Start from the JWT API

Create the project, and install everything this tutorial uses. These are the JWT tutorial's packages plus `@nestjs/mail`:

```bash
$ npm i -g @nestjs/cli
$ nest new saas-api --minimal
$ cd saas-api
$ npm uninstall @nestjs/platform-express @types/express
$ npm i --save @nestjs/platform-node zod @nestjs/config @nestjs/drizzle drizzle-orm@rc pg @nestjs/authentication @nestjs/mail @nestjs/throttler @nestjs/swagger @nestjs/terminus
$ npm i --save-dev drizzle-kit@rc @types/pg @nestjs/testing vitest vite
```

Then take these files from the [finished JWT tutorial](/tutorials/rest-api-jwt-authentication#sign-users-in-with-jwts), as they are:

- `src/main.ts`, `drizzle.config.ts` and `vitest.config.e2e.ts`
- everything under `src/auth/`, `src/users/` and `src/health/`
- `test/refresh-token.store.e2e-spec.ts`

Leave out `src/notes/` and the JWT tutorial's `drizzle/` folder: this application's first migration comes from its own schema, in the next section. Rename the notes to the new application where they're named: the `realm` in `JwtAuth` and the title of the OpenAPI document in `main.ts`. Add the test script to `package.json`:

```json
"test:e2e": "vitest run --config ./vitest.config.e2e.ts"
```

Start a PostgreSQL server with a database of the application's own:

```bash
$ docker run -d --name saas-db -e POSTGRES_PASSWORD=saas -e POSTGRES_DB=saas -p 5432:5432 postgres:17
```

Add its URL and a `JWT_SECRET` to `.env`, as in the JWT tutorial:

```bash
DATABASE_URL=postgres://postgres:saas@localhost:5432/saas
# Generate with: openssl rand -base64 32
JWT_SECRET=
```

Invitation emails link to your frontend, so the configuration gains its address:

```typescript
@@filename(src/config)
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.url(),
  // Signs the access tokens: at least 32 bytes.
  JWT_SECRET: z.string().min(32),
  // The browser origins allowed to call the API, comma-separated. None by default.
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
    .pipe(z.array(z.url())),
  // Where the frontend lives: invitation links point there.
  APP_URL: z.url().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;
```

The root module is the JWT tutorial's, with this tutorial's feature modules, the mail module, which [Invite members by email](/tutorials/multi-tenant-saas#invite-members-by-email) explains, and a strategy for durable providers, which [Give each organization its own DI sub-tree](/tutorials/multi-tenant-saas#give-each-organization-its-own-di-sub-tree) explains:

```typescript
@@filename(src/app.module)
import { Module, StandardSchemaValidationPipe, type OnModuleInit } from '@nestjs/common';
import { APP_GUARD, APP_PIPE, ContextIdFactory } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { DrizzleModule } from '@nestjs/drizzle';
import { LogMailTransport, MailModule } from '@nestjs/mail';
import { createObserveModule } from '@nestjs/observe';
import { ThrottlerGuard, ThrottlerModule, minutes, normalizeIp } from '@nestjs/throttler';
import { drizzle } from 'drizzle-orm/node-postgres';
import { accountEmail } from './auth/account-email.js';
import { AuthModule } from './auth/auth.module.js';
import { envSchema, type Env } from './config.js';
import { HealthModule } from './health/health.module.js';
import { InvitationsModule } from './invitations/invitations.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { OrganizationContextIdStrategy } from './tenancy/organization-context-id.strategy.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'saas-api',
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
          issuer: 'saas-api',
          audience: 'saas-api',
          ttl: '15m',
        },
        refreshToken: { ttl: '30d', absoluteTtl: '90d' },
      }),
    }),
    MailModule.forRoot({
      // Development: logs each mail, its links included, instead of sending it.
      transport: new LogMailTransport(),
      from: 'SaaS API <no-reply@example.com>',
    }),
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
    OrganizationsModule,
    ProjectsModule,
    InvitationsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    // Before the first request: one DI sub-tree per organization, for durable providers.
    ContextIdFactory.apply(new OrganizationContextIdStrategy());
  }
}
```

#### Design the schema

The whole schema, in one file. The users and refresh tokens are the JWT tutorial's:

```typescript
@@filename(src/database/schema)
import { boolean, index, jsonb, pgTable, primaryKey, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: at('created_at').notNull().defaultNow(),
});

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: at('created_at').notNull().defaultNow(),
});

// Who belongs to which organization, and as what.
export const memberships = pgTable(
  'memberships',
  {
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['owner', 'admin', 'member'] }).notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  (table) => [
    // What the guard looks up on every request.
    primaryKey({ columns: [table.orgId, table.userId] }),
    // "My organizations".
    index('memberships_user_id_idx').on(table.userId),
  ],
);

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role', { enum: ['admin', 'member'] }).notNull(),
    // The SHA-256 of the token in the link: a copy of this table invites nobody.
    tokenHash: text('token_hash').notNull().unique(),
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: at('expires_at').notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  // One open invitation per address and organization: inviting again replaces it.
  (table) => [unique('invitations_org_id_email_key').on(table.orgId, table.email)],
);

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
    updatedAt: at('updated_at').notNull().defaultNow(),
  },
  (table) => [index('projects_org_id_created_at_idx').on(table.orgId, table.createdAt)],
);

// Who changed what, written in the same transaction as the change.
export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id),
    action: text('action').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  (table) => [index('audit_events_org_id_created_at_idx').on(table.orgId, table.createdAt)],
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

export type Role = (typeof memberships.$inferSelect)['role'];
export type Project = typeof projects.$inferSelect;
```

- **A membership is keyed by organization and user.** The guard in the next section looks one up on every request, and that's a primary-key read. A user can't belong to an organization twice.
- **Every table a tenant owns has an `org_id`, and its index starts with it.** Every query of those tables filters on it, so every query can use the index.
- **Invitations store a hash of their token**, as the JWT tutorial's refresh tokens do. Someone who reads the table, or a backup of it, can't accept an invitation with what they find there.
- **The audit log is a table like the others**, written by the same transactions as the changes it records.
- **Deleting an organization cascades** to its memberships, projects, invitations and audit events. Nothing in this tutorial deletes one, but when you add it, nothing of the tenant is left behind.

Generate the migration and apply it (see [Migrations](/data/drizzle#migrations)):

```bash
$ npx drizzle-kit generate --name=saas
$ npx drizzle-kit migrate
```

#### Resolve the organization from the route

Every route that belongs to an organization has its id in the path: `/orgs/:orgId/projects`, `/orgs/:orgId/members`. Before any of them runs, something has to answer two questions: is the signed-in user a member of that organization, and is their role enough for this route? A [guard](/guards) answers both, with one query, and leaves the answer on the request for the handler.

The membership's type, and two decorators to go with the guard. `@MinRole()` declares the lowest role a route accepts, as [Setting roles per handler](/guards#setting-roles-per-handler) describes, and `@CurrentMembership()` is a [param decorator](/custom-decorators#param-decorators) that injects what the guard loaded:

```typescript
@@filename(src/organizations/membership)
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../database/schema.js';

export type { Role };

/** The signed-in user's membership in the organization of the route. */
export interface Membership {
  orgId: string;
  userId: string;
  role: Role;
}

/** The lowest role a route accepts: `@MinRole('admin')` lets admins and owners in. */
export const MinRole = Reflector.createDecorator<Role>();

/** The membership that `OrganizationGuard` loaded for this request. */
export const CurrentMembership = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Membership => context.switchToHttp().getRequest().membership,
);
```

The guard looks up the membership for the route's `:orgId`, checks the role the route asks for, and leaves the membership on the request:

```typescript
@@filename(src/organizations/organization.guard)
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import { memberships } from '../database/schema.js';
import type { User } from '../users/user.js';
import { MinRole, type Membership, type Role } from './membership.js';

const rank: Record<Role, number> = { member: 1, admin: 2, owner: 3 };
const uuid = z.uuid();

/** Resolves `:orgId` to the signed-in user's membership, once per request. */
@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectDrizzle() private readonly db: NodePgDatabase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ params: { orgId?: string }; user: User; membership?: Membership }>();
    const orgId = request.params.orgId;
    // Guards run before pipes, so the id isn't validated yet.
    if (!uuid.safeParse(orgId).success) {
      throw notFound();
    }
    const [membership] = await this.db
      .select({ orgId: memberships.orgId, userId: memberships.userId, role: memberships.role })
      .from(memberships)
      .where(and(eq(memberships.orgId, orgId!), eq(memberships.userId, request.user.id)));
    // Not a member: the organization might as well not exist.
    if (!membership) {
      throw notFound();
    }
    const required = this.reflector.getAllAndOverride(MinRole, [context.getHandler(), context.getClass()]) ?? 'member';
    if (rank[membership.role] < rank[required]) {
      throw new ForbiddenException(`Requires the ${required} role`);
    }
    request.membership = membership;
    return true;
  }
}

const notFound = () => new NotFoundException('Organization not found');
```

- **The guard runs after authentication.** Nest runs global guards first, so by the time a controller's `@UseGuards()` runs, `@nestjs/authentication` has verified the token and set `request.user`.
- **The id is validated in the guard.** Guards run before pipes, so the `schema` option of `@Param()` hasn't checked `orgId` yet. Without the check, `/orgs/not-a-uuid/projects` would reach PostgreSQL, which rejects the string for a `uuid` column, and the client would get a 500.
- **A non-member gets a 404**, the same answer as an organization that doesn't exist, as for other users' notes in the JWT tutorial. A 403 would confirm that the id belongs to someone.
- **A member whose role is too low gets a 403.** They know the organization exists; the status tells them that their role, not their sign-in, is the problem.
- **`getAllAndOverride()` reads the method's `@MinRole()` first, then the class's.** A controller can set a default for its routes, and a route can raise it. Without either, any member gets in.

Each controller below applies the guard with `@UseGuards(OrganizationGuard)`. Nest instantiates it in the controller's module and injects its dependencies there, so it needs no provider entry.

> info **Hint** Why a guard, and not a policy of [`@nestjs/authorization`](/security/authorization)? That package's global guard runs before a controller's guards, so a `@Can()` check couldn't use the membership this guard loads, and it denies with a 403 where a non-member should get a 404. Once permissions grow beyond a ladder of roles, call a policy from your services with the membership as an argument, as [Check orders record by record](/security/authorization#check-orders-record-by-record) does with an order.

#### Create organizations

Changes to who belongs to an organization, and as what, go into its audit log, and so do deleted projects. Each entry is written by the change's own transaction: if the change rolls back, so does its entry, and every change that committed has one. A helper makes the rule visible at each call:

```typescript
@@filename(src/audit/audit)
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { auditEvents } from '../database/schema.js';

export type AuditEntry = Pick<typeof auditEvents.$inferInsert, 'orgId' | 'actorId' | 'action' | 'data'>;

/** Records a change. Pass the change's transaction: the entry commits, or rolls back, with it. */
export async function audit(tx: Pick<NodePgDatabase, 'insert'>, entry: AuditEntry): Promise<void> {
  await tx.insert(auditEvents).values(entry);
}
```

Creating an organization takes a name, and changing a member's role takes the new role:

```typescript
@@filename(src/organizations/organizations.schemas)
import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;

export const changeRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
});
export type ChangeRoleDto = z.infer<typeof changeRoleSchema>;
```

The service creates organizations, lists the signed-in user's, and reads an organization's audit log:

```typescript
@@filename(src/organizations/organizations.service)
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { asc, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { audit } from '../audit/audit.js';
import { auditEvents, memberships, organizations } from '../database/schema.js';

const columns = {
  id: organizations.id,
  name: organizations.name,
  createdAt: organizations.createdAt,
  role: memberships.role,
};

@Injectable()
export class OrganizationsService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  /** Creates an organization, with its creator as the first owner. */
  create(userId: string, name: string) {
    return this.db.transaction(async (tx) => {
      const [organization] = await tx.insert(organizations).values({ name }).returning();
      await tx.insert(memberships).values({ orgId: organization.id, userId, role: 'owner' });
      await audit(tx, { orgId: organization.id, actorId: userId, action: 'organization.created', data: { name } });
      return { ...organization, role: 'owner' as const };
    });
  }

  /** The organizations the user belongs to, with their role in each. */
  findMine(userId: string) {
    return this.db
      .select(columns)
      .from(memberships)
      .innerJoin(organizations, eq(organizations.id, memberships.orgId))
      .where(eq(memberships.userId, userId))
      .orderBy(asc(organizations.name));
  }

  auditLog(orgId: string) {
    return this.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.orgId, orgId))
      .orderBy(desc(auditEvents.createdAt))
      .limit(100);
  }
}
```

- **Creating an organization is one transaction**: the organization, its first owner, and the audit entry. An organization without an owner can't be left behind by a failure halfway.
- **`GET /orgs` starts from the user's memberships**, so it lists the organizations they belong to, and nothing else, without a guard.

```typescript
@@filename(src/organizations/organizations.controller)
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { CurrentMembership, MinRole, type Membership } from './membership.js';
import { OrganizationGuard } from './organization.guard.js';
import { createOrganizationSchema, type CreateOrganizationDto } from './organizations.schemas.js';
import { OrganizationsService } from './organizations.service.js';

@Controller('orgs')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body({ schema: createOrganizationSchema }) dto: CreateOrganizationDto) {
    return this.organizationsService.create(userId, dto.name);
  }

  @Get()
  findMine(@CurrentUser('id') userId: string) {
    return this.organizationsService.findMine(userId);
  }

  @UseGuards(OrganizationGuard)
  @MinRole('admin')
  @Get(':orgId/audit-events')
  auditLog(@CurrentMembership() { orgId }: Membership) {
    return this.organizationsService.auditLog(orgId);
  }
}
```

`POST /orgs` and `GET /orgs` have no `:orgId`, so they don't take the guard: any signed-in user can create an organization. The audit log's route does, and it's for admins and owners.

#### Scope every query to the organization

Projects belong to an organization. A new project takes a name and an optional description:

```typescript
@@filename(src/projects/projects.schemas)
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5_000).default(''),
});
export type CreateProjectDto = z.infer<typeof createProjectSchema>;
```

Every query in the service takes the organization's id, and puts it in the `WHERE` clause next to the project's id:

```typescript
@@filename(src/projects/projects.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { audit } from '../audit/audit.js';
import { projects, type Project } from '../database/schema.js';
import type { Membership } from '../organizations/membership.js';
import type { CreateProjectDto } from './projects.schemas.js';

@Injectable()
export class ProjectsService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  findAll(orgId: string): Promise<Project[]> {
    return this.db
      .select()
      .from(projects)
      .where(eq(projects.orgId, orgId))
      .orderBy(desc(projects.createdAt), desc(projects.id))
      .limit(100);
  }

  async findOne(orgId: string, id: string): Promise<Project> {
    const [project] = await this.db.select().from(projects).where(this.inOrg(orgId, id));
    return project ?? notFound();
  }

  async create(orgId: string, dto: CreateProjectDto): Promise<Project> {
    const [project] = await this.db
      .insert(projects)
      .values({ ...dto, orgId })
      .returning();
    return project;
  }

  remove({ orgId, userId }: Membership, id: string): Promise<void> {
    return this.db.transaction(async (tx) => {
      const [project] = await tx.delete(projects).where(this.inOrg(orgId, id)).returning();
      if (!project) {
        notFound();
      }
      await audit(tx, {
        orgId,
        actorId: userId,
        action: 'project.deleted',
        data: { projectId: id, name: project.name },
      });
    });
  }

  /** The project, if it belongs to the organization: another tenant's project is as missing as one that doesn't exist. */
  private inOrg(orgId: string, id: string) {
    return and(eq(projects.id, id), eq(projects.orgId, orgId));
  }
}

function notFound(): never {
  throw new NotFoundException('Project not found');
}
```

The controller takes the organization's id from the membership the guard loaded:

```typescript
@@filename(src/projects/projects.controller)
import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentMembership, MinRole, type Membership } from '../organizations/membership.js';
import { OrganizationGuard } from '../organizations/organization.guard.js';
import { createProjectSchema, type CreateProjectDto } from './projects.schemas.js';
import { ProjectsService } from './projects.service.js';

const projectId = { schema: z.uuid() };

// Every member reads and creates projects; only admins and owners delete them.
@UseGuards(OrganizationGuard)
@Controller('orgs/:orgId/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@CurrentMembership() { orgId }: Membership) {
    return this.projectsService.findAll(orgId);
  }

  @Get(':projectId')
  findOne(@CurrentMembership() { orgId }: Membership, @Param('projectId', projectId) id: string) {
    return this.projectsService.findOne(orgId, id);
  }

  @Post()
  create(@CurrentMembership() { orgId }: Membership, @Body({ schema: createProjectSchema }) dto: CreateProjectDto) {
    return this.projectsService.create(orgId, dto);
  }

  @MinRole('admin')
  @Delete(':projectId')
  @HttpCode(204)
  remove(@CurrentMembership() membership: Membership, @Param('projectId', projectId) id: string) {
    return this.projectsService.remove(membership, id);
  }
}
```

Register the controller and the service in the projects module:

```typescript
@@filename(src/projects/projects.module)
import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
```

The two checks protect different things, and each one needs the other:

- **The guard** checks that the user belongs to the organization in the URL.
- **The `WHERE` clause** checks that the project belongs to that organization. Without it, a member of Acme could read Globex's project through `/orgs/<Acme's id>/projects/<Globex's project id>`: the guard would let them in, since they belong to Acme, and the query would find the project by its id alone.

The organization id comes from the membership the guard loaded, not from the URL, so the handlers can't use an id the guard didn't check. The next section moves the id into the service itself. Another tenant's project is a 404, like one that doesn't exist. Deleting a project needs an admin, and writes an audit entry in the same transaction as the `DELETE`.

#### Give each organization its own DI sub-tree

`ProjectsService` is a singleton, and every one of its methods takes the organization's id. Nest can also build a provider for one organization, with the id fixed when it's created: a [durable provider](/fundamentals/provider-scopes#durable-providers). A request-scoped provider is built again for every request. A durable one is built once per group of requests, here once per organization, and reused for the group's later requests. A **context id strategy** tells Nest which group a request belongs to:

```typescript
@@filename(src/tenancy/organization-context-id.strategy)
import { ContextIdFactory, type ContextId, type ContextIdResolver, type ContextIdStrategy } from '@nestjs/core';
import { z } from 'zod';

/** What durable providers get as `REQUEST`: only what the strategy puts here. */
export interface OrganizationPayload {
  orgId: string | null;
}

const uuid = z.uuid();

/** One DI sub-tree per organization, for the requests of `/orgs/:orgId/...`. */
export class OrganizationContextIdStrategy implements ContextIdStrategy {
  // Least recently used first.
  private readonly trees = new Map<string, { contextId: ContextId; payload: OrganizationPayload }>();

  constructor(private readonly maxTrees = 1_000) {}

  attach(contextId: ContextId, request: { params?: { orgId?: string } }): ContextIdResolver {
    // Runs before every guard, authentication included: this is still the client's input.
    const orgId = request.params?.orgId?.toLowerCase();
    if (!orgId || !uuid.safeParse(orgId).success) {
      // No organization: this request's own sub-tree, durable providers included.
      return { resolve: () => contextId, payload: { orgId: null } };
    }
    let tree = this.trees.get(orgId);
    if (tree) {
      this.trees.delete(orgId); // set again below, as the most recently used
    } else {
      tree = { contextId: ContextIdFactory.create(), payload: { orgId } };
    }
    this.trees.set(orgId, tree);
    if (this.trees.size > this.maxTrees) {
      // Forget the least recently used organization: its instances can be garbage-collected.
      this.trees.delete(this.trees.keys().next().value!);
    }
    const durable = tree.contextId;
    return { resolve: (info) => (info.isTreeDurable ? durable : contextId), payload: tree.payload };
  }
}
```

- **`attach()` reads `request.params.orgId`.** On the Node adapter, the route's parameters are already set when it runs: logging `request.params` from `attach()` showed the `orgId` of every `/orgs/:orgId/projects` request.
- **It runs before every guard, authentication included**, so the id is still the client's input. Only a UUID gets a tree of its own. Anything else gets the request's own context id, so nothing durable is shared or kept for it.
- **The number of trees is capped.** The example in the chapter keeps a `Map` that grows with every new id, and anyone, signed in or not, can send made-up UUIDs. Past `maxTrees`, the strategy forgets the organization it used least recently. Nest keeps a provider's instances in a `WeakMap` keyed by the context id object (`InstanceWrapper` in `@nestjs/core`), so a forgotten organization's instances can be garbage-collected once its last request has finished. In a run with `--expose-gc` and a cap of two, the evicted organization's instance was collected, and its next request built a new one.
- **The payload is what durable providers get as `REQUEST`**, and it holds only what the strategy puts there: the organization's id. The signed-in user isn't in it, and neither is anything else from the request.
- **Only requests that reach a request-scoped controller call `attach()`.** The routes under `/auth`, `/me` and `/orgs` (without an id) are served by singletons, and never do.

Register the strategy once, before the first request. `AppModule` does it in `onModuleInit()`, so the end-to-end tests, which don't run `main.ts`, get it too:

```typescript
@@filename(src/app.module)
import { Module, StandardSchemaValidationPipe, type OnModuleInit } from '@nestjs/common';
import { APP_GUARD, APP_PIPE, ContextIdFactory } from '@nestjs/core';
import { OrganizationContextIdStrategy } from './tenancy/organization-context-id.strategy.js';
// ...

@Module({
  // ...
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    // Before the first request: one DI sub-tree per organization, for durable providers.
    ContextIdFactory.apply(new OrganizationContextIdStrategy());
  }
}
```

`ProjectsService` becomes durable. It injects `REQUEST`, takes the organization's id from it in its constructor, and adds it to every query itself:

```typescript
@@filename(src/projects/projects.service)
import { Inject, Injectable, Logger, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { audit } from '../audit/audit.js';
import { projects, type Project } from '../database/schema.js';
import type { OrganizationPayload } from '../tenancy/organization-context-id.strategy.js';
import type { CreateProjectDto } from './projects.schemas.js';

/** One instance per organization, built with its id: no caller can pass another one. */
@Injectable({ scope: Scope.REQUEST, durable: true })
export class ProjectsService {
  private readonly orgId: string;

  constructor(
    // The strategy's payload, not the HTTP request: this instance serves every request of the organization.
    @Inject(REQUEST) { orgId }: OrganizationPayload,
    @InjectDrizzle() private readonly db: NodePgDatabase,
  ) {
    // Not a valid organization id: built for this request alone, which the guard would refuse anyway.
    if (!orgId) {
      throw new NotFoundException('Organization not found');
    }
    this.orgId = orgId;
    new Logger(ProjectsService.name).log(`Created for organization ${orgId}`);
  }

  findAll(): Promise<Project[]> {
    return this.db
      .select()
      .from(projects)
      .where(eq(projects.orgId, this.orgId))
      .orderBy(desc(projects.createdAt), desc(projects.id))
      .limit(100);
  }

  async findOne(id: string): Promise<Project> {
    const [project] = await this.db.select().from(projects).where(this.inOrg(id));
    return project ?? notFound();
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const [project] = await this.db
      .insert(projects)
      .values({ ...dto, orgId: this.orgId })
      .returning();
    return project;
  }

  remove(actorId: string, id: string): Promise<void> {
    return this.db.transaction(async (tx) => {
      const [project] = await tx.delete(projects).where(this.inOrg(id)).returning();
      if (!project) {
        notFound();
      }
      await audit(tx, {
        orgId: this.orgId,
        actorId,
        action: 'project.deleted',
        data: { projectId: id, name: project.name },
      });
    });
  }

  private inOrg(id: string) {
    return and(eq(projects.id, id), eq(projects.orgId, this.orgId));
  }
}

function notFound(): never {
  throw new NotFoundException('Project not found');
}
```

Its methods no longer take the id, so the controller stops passing it:

```typescript
@@filename(src/projects/projects.controller)
import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { z } from 'zod';
import { MinRole } from '../organizations/membership.js';
import { OrganizationGuard } from '../organizations/organization.guard.js';
import { createProjectSchema, type CreateProjectDto } from './projects.schemas.js';
import { ProjectsService } from './projects.service.js';

const projectId = { schema: z.uuid() };

// Durable too, through ProjectsService: one instance per organization.
// Every member reads and creates projects; only admins and owners delete them.
@UseGuards(OrganizationGuard)
@Controller('orgs/:orgId/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':projectId')
  findOne(@Param('projectId', projectId) id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  create(@Body({ schema: createProjectSchema }) dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @MinRole('admin')
  @Delete(':projectId')
  @HttpCode(204)
  remove(@CurrentUser('id') userId: string, @Param('projectId', projectId) id: string) {
    return this.projectsService.remove(userId, id);
  }
}
```

Restart the application, and list the projects of two organizations six times, interleaved, as a member of both. The `BOB`, `ACME` and `GLOBEX` variables are set as in [Try it](/tutorials/multi-tenant-saas#try-it):

```bash
$ for org in $ACME $ACME $GLOBEX $ACME $GLOBEX $GLOBEX; do curl -s -o /dev/null -w '%{http_code} ' localhost:3000/orgs/$org/projects -H "$BOB"; done
200 200 200 200 200 200
```

The application's log has one line per organization, from each service's constructor at the organization's first request:

```bash
LOG [ProjectsService] Created for organization dcf74914-8aff-4ea0-938f-8054466e6e4b
LOG [ProjectsService] Created for organization a679e0ce-fb7c-449e-89d9-644c25f82783
```

- **Durability bubbles up.** `ProjectsController` depends on a durable provider and on nothing else that's request-scoped, so it's durable too: one instance per organization, built with the service at the organization's first request, as the hint in [Durable providers](/fundamentals/provider-scopes#durable-providers) describes. The other controllers and services stay singletons. A provider that injected a request-scoped provider that isn't durable would make everything that depends on it request-scoped, built for every request.
- **What it costs.** Every request to the projects routes now runs `attach()` and a `Map` lookup, and the first request of each organization builds its controller and service. A request-scoped service would build both for every request (see [Performance](/fundamentals/provider-scopes#performance)). This tutorial didn't measure the difference.
- **The constructor runs before the guards.** Nest builds a request-scoped controller and its dependencies before it runs any guard. For an id that isn't a UUID, the constructor throws the 404 the guard would answer. For a well-formed id of an organization that doesn't exist, or a request without a token, the tree is built, and the guards then refuse the request. The cap bounds how many such trees there are.
- **The tree is a cache, not an authorization boundary.** `OrganizationGuard` still decides whether the caller may use the organization, from the same route parameter the strategy reads. They must read the same one: with a strategy that put every organization in one tree, the tenant test at the end of this tutorial fails, because Bob reads Acme's project through Globex's URL, which his membership of Globex lets him use.
- **Nothing that belongs to a user or a request goes into a durable provider.** Every request of the organization shares the instance, so a field one request sets is what the next one reads, whoever sends it. Take the user as an argument, as `remove()` takes the actor's id from `@CurrentUser()`, which reads the request being handled even in a durable controller. In a request-scoped provider that isn't durable, `REQUEST` is the HTTP request itself, with the payload's fields assigned to it, but its constructor runs before the guards as well: `request.user` is still empty there, and set by the time a handler calls a method.

With one database, passing the id, as in the previous section, keeps queries just as scoped, and every provider a singleton. A durable tree pays off when each organization needs an object of its own that's worth building once, such as a connection pool to the organization's own database, created in the same constructor.

#### Never lose the last owner

Owners and admins manage the members. The rules:

- Admins change the roles of members and admins, and remove them. Only owners make owners, and only owners change or remove an owner.
- An organization always has at least one owner.

The second rule is the hard one. The obvious version counts the owners, and demotes only if there are two or more. Two owners who step down at the same moment both count two owners, both demotions go ahead, and the organization has none. A conditional `UPDATE` with the count in its `WHERE` clause doesn't help either: the two statements update different rows, so neither waits for the other, and each one's count still sees two owners. A [test](/tutorials/multi-tenant-saas#test-it) at the end of this tutorial runs ten such races: without the lock below, nine or ten of the ten organizations ended up with no owner, in every run.

The fix is to take the organization's row lock before touching its memberships. Changes to one organization's memberships then run one at a time, and each one sees what the previous one committed:

```typescript
@@filename(src/organizations/members.service)
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq, exists, ne, or, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { alias } from 'drizzle-orm/pg-core';
import { audit } from '../audit/audit.js';
import { memberships, organizations, users } from '../database/schema.js';
import type { Membership, Role } from './membership.js';

const others = alias(memberships, 'others');

@Injectable()
export class MembersService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  findAll(orgId: string) {
    return this.db
      .select({ userId: users.id, email: users.email, role: memberships.role, joinedAt: memberships.createdAt })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.orgId, orgId))
      .orderBy(asc(users.email));
  }

  changeRole(actor: Membership, userId: string, role: Role) {
    return this.db.transaction(async (tx) => {
      const manager = await this.lock(tx, actor);
      if (role === 'owner' && manager.role !== 'owner') {
        throw new ForbiddenException('Only owners can make owners');
      }
      const [member] = await tx
        .update(memberships)
        .set({ role })
        .where(
          and(
            this.manageable(manager, userId),
            // Demoting an owner needs another owner to stay.
            role === 'owner' ? undefined : this.leavesAnOwner(tx),
          ),
        )
        .returning();
      if (!member) {
        return this.refuse(tx, manager, userId);
      }
      await audit(tx, {
        orgId: actor.orgId,
        actorId: actor.userId,
        action: 'member.role_changed',
        data: { userId, role },
      });
      return member;
    });
  }

  remove(actor: Membership, userId: string) {
    return this.db.transaction(async (tx) => {
      const manager = await this.lock(tx, actor);
      const [member] = await tx
        .delete(memberships)
        .where(and(this.manageable(manager, userId), this.leavesAnOwner(tx)))
        .returning();
      if (!member) {
        return this.refuse(tx, manager, userId);
      }
      await audit(tx, { orgId: actor.orgId, actorId: actor.userId, action: 'member.removed', data: { userId } });
    });
  }

  /**
   * Locks the organization's row until the transaction ends, so changes to its
   * memberships run one at a time, each seeing the one before it. Returns the
   * actor's membership as it is now: the guard read it before the lock.
   */
  private async lock(tx: Pick<NodePgDatabase, 'select'>, actor: Membership): Promise<Membership> {
    await tx
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, actor.orgId))
      .for('update');
    // A statement of its own, so it sees what committed while it waited for the lock.
    const [current] = await tx
      .select({ role: memberships.role })
      .from(memberships)
      .where(and(eq(memberships.orgId, actor.orgId), eq(memberships.userId, actor.userId)));
    if (!current) {
      throw new NotFoundException('Organization not found');
    }
    if (current.role === 'member') {
      throw new ForbiddenException('Requires the admin role');
    }
    return { ...actor, role: current.role };
  }

  /** The member's row, if the actor may change it: admins change admins and members, owners anyone. */
  private manageable(actor: Membership, userId: string) {
    return and(
      eq(memberships.orgId, actor.orgId),
      eq(memberships.userId, userId),
      actor.role === 'owner' ? undefined : ne(memberships.role, 'owner'),
    );
  }

  /** True unless the row is the organization's last owner. */
  private leavesAnOwner(tx: Pick<NodePgDatabase, 'select'>) {
    return or(
      ne(memberships.role, 'owner'),
      exists(
        tx
          .select({ one: sql`1` })
          .from(others)
          .where(
            and(eq(others.orgId, memberships.orgId), eq(others.role, 'owner'), ne(others.userId, memberships.userId)),
          ),
      ),
    );
  }

  /** Why a change matched no row: 404, 403 or 409. */
  private async refuse(tx: Pick<NodePgDatabase, 'select'>, actor: Membership, userId: string): Promise<never> {
    const [member] = await tx
      .select({ role: memberships.role })
      .from(memberships)
      .where(and(eq(memberships.orgId, actor.orgId), eq(memberships.userId, userId)));
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (member.role === 'owner' && actor.role !== 'owner') {
      throw new ForbiddenException('Only owners can change owners');
    }
    throw new ConflictException('An organization needs at least one owner');
  }
}
```

- **`lock()` runs first in every membership change.** `SELECT ... FOR UPDATE` on the organization's row makes a second change of the same organization wait until the first one commits. Only membership changes take the lock, and only for their own organization: reads, project writes and other organizations don't wait.
- **The actor's role is read again under the lock.** The guard read it when the request started, and another change may have demoted or removed the actor since. With the guard's copy, in an organization with three owners, Ada could remove Bob while Bob demotes Ada, and both would succeed, though neither order of the two allows it. Under PostgreSQL's default isolation level, each statement sees the data committed before it started, so the read after the lock sees the change that held it. An actor who is no longer an admin or an owner gets a 403, and one who is no longer a member a 404.
- **The rules about the target are in the statement's `WHERE` clause**: its current role, and whether another owner remains. The `UPDATE` also starts after the lock is granted, so when two owners step down at once, the second one's subquery sees the first one's demotion, and the second demotion changes no row.
- **No row changed: `refuse()` says why**, reading under the same lock: 404 when the user isn't a member, 403 when an admin touched an owner, and 409 when the change would leave no owner.
- **The audit entry is written only when a row changed**, by the same transaction. A refused change records nothing, and if writing the entry fails, the change rolls back with it.

```typescript
@@filename(src/organizations/members.controller)
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentMembership, MinRole, type Membership } from './membership.js';
import { MembersService } from './members.service.js';
import { OrganizationGuard } from './organization.guard.js';
import { changeRoleSchema, type ChangeRoleDto } from './organizations.schemas.js';

const userId = { schema: z.uuid() };

@UseGuards(OrganizationGuard)
@Controller('orgs/:orgId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  findAll(@CurrentMembership() { orgId }: Membership) {
    return this.membersService.findAll(orgId);
  }

  @MinRole('admin')
  @Patch(':userId')
  changeRole(
    @CurrentMembership() actor: Membership,
    @Param('userId', userId) id: string,
    @Body({ schema: changeRoleSchema }) { role }: ChangeRoleDto,
  ) {
    return this.membersService.changeRole(actor, id, role);
  }

  @MinRole('admin')
  @Delete(':userId')
  @HttpCode(204)
  remove(@CurrentMembership() actor: Membership, @Param('userId', userId) id: string) {
    return this.membersService.remove(actor, id);
  }
}
```

Register both controllers and both services in the organizations module:

```typescript
@@filename(src/organizations/organizations.module)
import { Module } from '@nestjs/common';
import { MembersController } from './members.controller.js';
import { MembersService } from './members.service.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  controllers: [OrganizationsController, MembersController],
  providers: [OrganizationsService, MembersService],
})
export class OrganizationsModule {}
```

#### Invite members by email

An admin invites someone by their email address. The invitation mail holds a link with a token, and following it adds the signed-in user to the organization. [`@nestjs/mail`](/application/mail) sends it. The root module registered `MailModule` with `LogMailTransport`, which logs every mail, links included, instead of sending it. In production, switch to SMTP or an email API, as [Send in production](/application/mail#send-in-production) shows; the module warns at startup when `NODE_ENV` is `production` and the transport is one for development.

A mail class renders the invitation. It's small enough to write inline with the `html` tagged template, which escapes every value it inserts, so an organization named `<b>Acme</b>` arrives as text, not markup:

```typescript
@@filename(src/invitations/invitation.mail)
import { Injectable } from '@nestjs/common';
import { html, type Mailable } from '@nestjs/mail';

export interface InvitationMailData {
  organization: string;
  invitedBy: string;
  url: string;
}

@Injectable()
export class InvitationMail implements Mailable<InvitationMailData> {
  render({ organization, invitedBy, url }: InvitationMailData) {
    return {
      subject: `Join ${organization}`,
      // `html` escapes every value: an organization named <script> stays text.
      html: html`
        <p>${invitedBy} invited you to join ${organization}.</p>
        <p><a href="${url}">Accept the invitation</a></p>
        <p>The link works once, within 7 days.</p>
      `,
    };
  }
}
```

An invitation names an address and a role, and accepting one takes the token from the link:

```typescript
@@filename(src/invitations/invitations.schemas)
import { z } from 'zod';

export const createInvitationSchema = z.object({
  // Stored as users.email is, so the accepting user's address matches it.
  email: z.email().transform((email) => email.normalize('NFC').toLowerCase()),
  // Owners are made, not invited: see PATCH /orgs/:orgId/members/:userId.
  role: z.enum(['admin', 'member']).default('member'),
});
export type CreateInvitationDto = z.infer<typeof createInvitationSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(1).max(100),
});
export type AcceptInvitationDto = z.infer<typeof acceptInvitationSchema>;
```

The service creates the invitation and sends the mail, and spends the token when someone accepts:

```typescript
@@filename(src/invitations/invitations.service)
import { createHash, randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDrizzle } from '@nestjs/drizzle';
import { Mailer } from '@nestjs/mail';
import { and, eq, gt } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { audit } from '../audit/audit.js';
import type { Env } from '../config.js';
import { invitations, memberships, organizations } from '../database/schema.js';
import type { Membership } from '../organizations/membership.js';
import type { User } from '../users/user.js';
import { InvitationMail } from './invitation.mail.js';
import type { CreateInvitationDto } from './invitations.schemas.js';

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const columns = {
  id: invitations.id,
  email: invitations.email,
  role: invitations.role,
  expiresAt: invitations.expiresAt,
  createdAt: invitations.createdAt,
};

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class InvitationsService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly mailer: Mailer,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async invite(actor: Membership, inviter: User, { email, role }: CreateInvitationDto) {
    const token = randomBytes(32).toString('base64url');
    const values = { role, tokenHash: hash(token), invitedBy: actor.userId, expiresAt: new Date(Date.now() + TTL_MS) };

    const { invitation, organization } = await this.db.transaction(async (tx) => {
      // Inviting the same address again replaces the token: the earlier link stops working.
      const [invitation] = await tx
        .insert(invitations)
        .values({ ...values, orgId: actor.orgId, email })
        .onConflictDoUpdate({
          target: [invitations.orgId, invitations.email],
          set: { ...values, createdAt: new Date() },
        })
        .returning(columns);
      const [organization] = await tx
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, actor.orgId));
      await audit(tx, { orgId: actor.orgId, actorId: actor.userId, action: 'invitation.sent', data: { email, role } });
      return { invitation, organization };
    });

    // After the commit, never inside the transaction: it would hold its connection
    // and locks for as long as the mail server takes to answer.
    const url = new URL('/invitations/accept', this.config.get('APP_URL', { infer: true }));
    url.searchParams.set('token', token);
    await this.mailer.send(InvitationMail, {
      to: email,
      data: { organization: organization.name, invitedBy: inviter.email, url: url.href },
    });
    return invitation;
  }

  /** Spends the token: the signed-in user joins the organization it was sent for. */
  accept(user: User, token: string) {
    return this.db.transaction(async (tx) => {
      // Taking the invitation is the first statement: of two requests with the same
      // token, one deletes the row and the other finds nothing.
      const [invitation] = await tx
        .delete(invitations)
        .where(
          and(
            eq(invitations.tokenHash, hash(token)),
            // Only for the address it was sent to, so a forwarded link is useless.
            eq(invitations.email, user.email),
            gt(invitations.expiresAt, new Date()),
          ),
        )
        .returning();
      if (!invitation) {
        throw new NotFoundException('Invitation not found or expired');
      }
      // Already a member: keep the role they have.
      const [joined] = await tx
        .insert(memberships)
        .values({ orgId: invitation.orgId, userId: user.id, role: invitation.role })
        .onConflictDoNothing()
        .returning();
      if (joined) {
        await audit(tx, {
          orgId: invitation.orgId,
          actorId: user.id,
          action: 'member.joined',
          data: { invitationId: invitation.id, role: invitation.role },
        });
      }
      const [membership] = await tx
        .select({ orgId: memberships.orgId, userId: memberships.userId, role: memberships.role })
        .from(memberships)
        .where(and(eq(memberships.orgId, invitation.orgId), eq(memberships.userId, user.id)));
      return membership;
    });
  }
}
```

- **The token is 32 random bytes, and only its SHA-256 is stored.** The token itself exists in the mail and nowhere else.
- **Inviting the same address again replaces the invitation**, with an upsert on the organization and the address. The earlier link stops working, since its hash is gone.
- **The mail is sent after the transaction commits.** Sending inside it would keep the transaction open, holding its connection and locks, for as long as the mail server takes to answer. If the send fails, the client gets an error and the invitation exists, so inviting again sends a fresh link. When a mail must never be lost, send it through the outbox instead, as [Send after the order commits](/application/mail#send-after-the-order-commits) shows.
- **Accepting takes the invitation with `DELETE ... RETURNING`, as its first statement.** Two requests with the same token can't both get the row: the second one waits for the first one's transaction, and then finds nothing. The token is spent exactly once, with nothing to mark as used.
- **The invitation is only for the address it was sent to.** The `DELETE` matches the signed-in user's email too, so a forwarded link doesn't let someone else join, and doesn't spend the invitation either. Expired invitations match nothing.
- **Accepting when you're already a member keeps your role.** `onConflictDoNothing()` leaves the existing membership as it is, rather than turning an owner into a member.

Inviting takes an admin. Accepting takes any signed-in user, so its route is outside `/orgs/:orgId`:

```typescript
@@filename(src/invitations/invitations.controller)
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { CurrentMembership, MinRole, type Membership } from '../organizations/membership.js';
import { OrganizationGuard } from '../organizations/organization.guard.js';
import type { User } from '../users/user.js';
import {
  acceptInvitationSchema,
  createInvitationSchema,
  type AcceptInvitationDto,
  type CreateInvitationDto,
} from './invitations.schemas.js';
import { InvitationsService } from './invitations.service.js';

@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @UseGuards(OrganizationGuard)
  @MinRole('admin')
  @Post('orgs/:orgId/invitations')
  invite(
    @CurrentMembership() actor: Membership,
    @CurrentUser() user: User,
    @Body({ schema: createInvitationSchema }) dto: CreateInvitationDto,
  ) {
    return this.invitationsService.invite(actor, user, dto);
  }

  // No :orgId and no guard: the user isn't a member yet. The token says which organization.
  @Post('invitations/accept')
  @HttpCode(200)
  accept(@CurrentUser() user: User, @Body({ schema: acceptInvitationSchema }) { token }: AcceptInvitationDto) {
    return this.invitationsService.accept(user, token);
  }
}
```

Register the controller, the service and the mail class in the invitations module:

```typescript
@@filename(src/invitations/invitations.module)
import { Module } from '@nestjs/common';
import { InvitationMail } from './invitation.mail.js';
import { InvitationsController } from './invitations.controller.js';
import { InvitationsService } from './invitations.service.js';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationMail],
})
export class InvitationsModule {}
```

The request body of `POST /orgs/:orgId/invitations` names an email, so the JWT tutorial's `account` throttler counts it, per invited address and IP address: an admin can invite one address five times in 15 minutes, which is also a fair limit on how much mail one inbox gets from you.

#### Try it

Start the application:

```bash
$ npm run start
```

Sign up Ada, Bob and Carol, as in the JWT tutorial, and keep their access tokens (shortened here and below):

```bash
$ curl localhost:3000/auth/sign-up --json '{"email":"ada@example.com","password":"correct horse battery"}'
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","refreshToken":"...","expiresIn":900}
$ ADA="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
$ BOB="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
$ CAROL="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

Ada creates Acme, and Bob creates Globex. Each one is the owner of the organization they created:

```bash
$ curl localhost:3000/orgs -H "$ADA" --json '{"name":"Acme"}'
{"id":"1a01c225-98f1-405b-8603-91b4598b2862","name":"Acme","createdAt":"2026-11-19T22:02:34.959Z","role":"owner"}
$ curl localhost:3000/orgs -H "$BOB" --json '{"name":"Globex"}'
{"id":"3bde374d-da6b-496b-8ddc-5accb192b6ec","name":"Globex","createdAt":"2026-11-19T22:02:34.999Z","role":"owner"}
$ ACME=1a01c225-98f1-405b-8603-91b4598b2862
$ GLOBEX=3bde374d-da6b-496b-8ddc-5accb192b6ec
```

Ada adds a project to Acme. For Bob, Acme doesn't exist, and from Globex's routes, neither does Acme's project:

```bash
$ curl localhost:3000/orgs/$ACME/projects -H "$ADA" --json '{"name":"Website redesign"}'
{"id":"49b827a9-2fca-403b-bb6e-d31a461fa796","orgId":"1a01c225-98f1-405b-8603-91b4598b2862","name":"Website redesign","description":"","createdAt":"2026-11-19T22:02:35.036Z","updatedAt":"2026-11-19T22:02:35.036Z"}
$ PROJECT=49b827a9-2fca-403b-bb6e-d31a461fa796
$ curl -i localhost:3000/orgs/$ACME/projects -H "$BOB"
HTTP/1.1 404 Not Found
{"message":"Organization not found","error":"Not Found","statusCode":404}
$ curl localhost:3000/orgs/$GLOBEX/projects/$PROJECT -H "$BOB"
{"message":"Project not found","error":"Not Found","statusCode":404}
$ curl localhost:3000/orgs/not-a-uuid/projects -H "$BOB"
{"message":"Organization not found","error":"Not Found","statusCode":404}
```

Ada invites Bob as an admin, and Carol as a member. The response doesn't contain the token; only the mail does:

```bash
$ curl localhost:3000/orgs/$ACME/invitations -H "$ADA" --json '{"email":"bob@example.com","role":"admin"}'
{"id":"7645d709-4b9d-4165-b0d3-f0ebfdd46451","email":"bob@example.com","role":"admin","expiresAt":"2026-11-26T22:02:35.113Z","createdAt":"2026-11-19T22:02:35.114Z"}
$ curl localhost:3000/orgs/$ACME/invitations -H "$ADA" --json '{"email":"carol@example.com"}'
{"id":"ccf6b16b-419d-43ca-b4c0-ddf073b89ffe","email":"carol@example.com","role":"member","expiresAt":"2026-11-26T22:02:35.138Z","createdAt":"2026-11-19T22:02:35.139Z"}
```

The application's log shows each mail, with its text part at the `debug` level:

```bash
LOG [LogMailTransport] "Join Acme" to bob@example.com
DEBUG [LogMailTransport] ada@example.com invited you to join Acme.

Accept the invitation (http://localhost:5173/invitations/accept?token=CqkmdRyycidnm9PMyB9nxIDoepD3rn0E-b7YctKK6u4)

The link works once, within 7 days.
```

Carol can't use Bob's link. Bob can, once:

```bash
$ curl localhost:3000/invitations/accept -H "$CAROL" --json '{"token":"CqkmdRyycidnm9PMyB9nxIDoepD3rn0E-b7YctKK6u4"}'
{"message":"Invitation not found or expired","error":"Not Found","statusCode":404}
$ curl localhost:3000/invitations/accept -H "$BOB" --json '{"token":"CqkmdRyycidnm9PMyB9nxIDoepD3rn0E-b7YctKK6u4"}'
{"orgId":"1a01c225-98f1-405b-8603-91b4598b2862","userId":"da02b285-ec5c-419e-a6e4-9efaa8e3d87f","role":"admin"}
$ curl localhost:3000/invitations/accept -H "$BOB" --json '{"token":"CqkmdRyycidnm9PMyB9nxIDoepD3rn0E-b7YctKK6u4"}'
{"message":"Invitation not found or expired","error":"Not Found","statusCode":404}
$ curl localhost:3000/orgs -H "$BOB"
[{"id":"1a01c225-98f1-405b-8603-91b4598b2862","name":"Acme","createdAt":"2026-11-19T22:02:34.959Z","role":"admin"},{"id":"3bde374d-da6b-496b-8ddc-5accb192b6ec","name":"Globex","createdAt":"2026-11-19T22:02:34.999Z","role":"owner"}]
```

Carol accepts her invitation the same way. As a member, she sees the members, and can't invite anyone:

```bash
$ curl localhost:3000/orgs/$ACME/members -H "$CAROL"
[{"userId":"e506ea03-5119-42d3-ad94-8c07e4a9f7c5","email":"ada@example.com","role":"owner","joinedAt":"2026-11-19T22:02:34.959Z"},{"userId":"da02b285-ec5c-419e-a6e4-9efaa8e3d87f","email":"bob@example.com","role":"admin","joinedAt":"2026-11-19T22:02:36.215Z"},{"userId":"b25e382d-62c2-47c5-8f58-3680c6af6dc1","email":"carol@example.com","role":"member","joinedAt":"2026-11-19T22:02:36.266Z"}]
$ curl localhost:3000/orgs/$ACME/invitations -H "$CAROL" --json '{"email":"dave@example.com"}'
{"message":"Requires the admin role","error":"Forbidden","statusCode":403}
$ ADA_ID=e506ea03-5119-42d3-ad94-8c07e4a9f7c5
$ BOB_ID=da02b285-ec5c-419e-a6e4-9efaa8e3d87f
$ CAROL_ID=b25e382d-62c2-47c5-8f58-3680c6af6dc1
```

Bob, an admin, can't make an owner or touch one. Ada, the only owner, can't step down until there's another:

```bash
$ curl -X PATCH localhost:3000/orgs/$ACME/members/$CAROL_ID -H "$BOB" --json '{"role":"owner"}'
{"message":"Only owners can make owners","error":"Forbidden","statusCode":403}
$ curl -X PATCH localhost:3000/orgs/$ACME/members/$ADA_ID -H "$BOB" --json '{"role":"member"}'
{"message":"Only owners can change owners","error":"Forbidden","statusCode":403}
$ curl -X PATCH localhost:3000/orgs/$ACME/members/$ADA_ID -H "$ADA" --json '{"role":"admin"}'
{"message":"An organization needs at least one owner","error":"Conflict","statusCode":409}
$ curl -X PATCH localhost:3000/orgs/$ACME/members/$BOB_ID -H "$ADA" --json '{"role":"owner"}'
{"orgId":"1a01c225-98f1-405b-8603-91b4598b2862","userId":"da02b285-ec5c-419e-a6e4-9efaa8e3d87f","role":"owner","createdAt":"2026-11-19T22:02:36.215Z"}
$ curl -X PATCH localhost:3000/orgs/$ACME/members/$ADA_ID -H "$ADA" --json '{"role":"admin"}'
{"orgId":"1a01c225-98f1-405b-8603-91b4598b2862","userId":"e506ea03-5119-42d3-ad94-8c07e4a9f7c5","role":"admin","createdAt":"2026-11-19T22:02:34.959Z"}
$ curl -X PATCH localhost:3000/orgs/$ACME/members/$BOB_ID -H "$BOB" --json '{"role":"admin"}'
{"message":"An organization needs at least one owner","error":"Conflict","statusCode":409}
```

Bob, now the owner, removes Carol, and Ada, an admin, deletes the project (both answer `204 No Content`). The audit log has every change, newest first, and nothing for the requests that were refused:

```bash
$ curl -X DELETE localhost:3000/orgs/$ACME/members/$CAROL_ID -H "$BOB"
$ curl -X DELETE localhost:3000/orgs/$ACME/projects/$PROJECT -H "$ADA"
$ curl -s localhost:3000/orgs/$ACME/audit-events -H "$BOB" | jq -c '.[] | {action, data}'
{"action":"project.deleted","data":{"name":"Website redesign","projectId":"49b827a9-2fca-403b-bb6e-d31a461fa796"}}
{"action":"member.removed","data":{"userId":"b25e382d-62c2-47c5-8f58-3680c6af6dc1"}}
{"action":"member.role_changed","data":{"role":"admin","userId":"e506ea03-5119-42d3-ad94-8c07e4a9f7c5"}}
{"action":"member.role_changed","data":{"role":"owner","userId":"da02b285-ec5c-419e-a6e4-9efaa8e3d87f"}}
{"action":"member.joined","data":{"role":"member","invitationId":"ccf6b16b-419d-43ca-b4c0-ddf073b89ffe"}}
{"action":"member.joined","data":{"role":"admin","invitationId":"7645d709-4b9d-4165-b0d3-f0ebfdd46451"}}
{"action":"invitation.sent","data":{"role":"member","email":"carol@example.com"}}
{"action":"invitation.sent","data":{"role":"admin","email":"bob@example.com"}}
{"action":"organization.created","data":{"name":"Acme"}}
```

Each entry also has its `id`, the `orgId`, the `actorId` of who made the change, and `createdAt`.

#### Test it

The guarantees that matter here are about tenants and races: a member of one organization gets nothing of another's, an invitation is spent once, and two owners can't step down into an organization with no owner. An in-process database such as PGlite has a single connection, where requests never truly race, so these tests run against a real PostgreSQL server, through a connection pool, with `app.inject()` sending requests that run at the same time. The mail transport is replaced by `InMemoryMailTransport`, which keeps the mails it receives, so the test can follow the link in the invitation (see [Testing](/application/mail#testing) in the mail chapter):

```typescript
@@filename(test/organizations.e2e-spec)
import { fileURLToPath } from 'node:url';
import { Logger } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { getDrizzleToken } from '@nestjs/drizzle';
import { InMemoryMailTransport, MailTransport } from '@nestjs/mail';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { AppModule } from '../src/app.module.js';
import { auditEvents, memberships } from '../src/database/schema.js';

// A real PostgreSQL with a pool, so concurrent requests really race.
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('SaaS API (e2e)', () => {
  const db = drizzle({ client: new Pool({ connectionString: url, max: 20 }) });
  const mailbox = new InMemoryMailTransport();
  let app: NestNodeApplication;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    await db.execute(sql`TRUNCATE users, organizations, refresh_tokens CASCADE`);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(db)
      // scrypt at the default cost takes 128 MiB and a few hundred ms per hash.
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      // Keeps the mails, so the test can follow the invitation link.
      .overrideProvider(MailTransport)
      .useValue(mailbox)
      .compile();
    app = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter());
    await app.init();
  });

  afterAll(() => app.close()); // closes the pool too

  let clients = 0;

  /** Signs a user up, and returns their id and a function that sends requests as them. */
  async function signUp(name: string) {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email: `${name}@example.com`, password: 'correct horse battery' },
      // Sign-up is rate-limited per IP address: each user gets one of their own.
      remoteAddress: `10.0.0.${++clients}`,
    });
    const headers = { authorization: `Bearer ${res.json<{ accessToken: string }>().accessToken}` };
    const me = await app.inject({ method: 'GET', url: '/me', headers });
    const send = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, payload?: object) =>
      app.inject({ method, url, headers, payload });
    return { id: me.json<{ id: string }>().id, send };
  }

  async function createOrganization(owner: Awaited<ReturnType<typeof signUp>>, name: string) {
    const res = await owner.send('POST', '/orgs', { name });
    expect(res.statusCode).toBe(201);
    return res.json<{ id: string }>().id;
  }

  it("keeps each organization's data to its members", async () => {
    const ada = await signUp('ada');
    const bob = await signUp('bob');
    const acme = await createOrganization(ada, 'Acme');
    const globex = await createOrganization(bob, 'Globex');
    const project = (await ada.send('POST', `/orgs/${acme}/projects`, { name: 'Roadmap' })).json<{ id: string }>();

    // Through Acme's routes: Bob isn't a member, so Acme doesn't exist for him.
    for (const path of ['/members', '/projects', `/projects/${project.id}`, '/audit-events']) {
      expect((await bob.send('GET', `/orgs/${acme}${path}`)).statusCode).toBe(404);
    }
    // Through his own organization's routes: the WHERE clause doesn't find Acme's project.
    expect((await bob.send('GET', `/orgs/${globex}/projects/${project.id}`)).statusCode).toBe(404);
    expect((await bob.send('DELETE', `/orgs/${globex}/projects/${project.id}`)).statusCode).toBe(404);
    expect((await bob.send('GET', '/orgs/not-a-uuid/projects')).statusCode).toBe(404);

    expect((await ada.send('GET', `/orgs/${acme}/projects/${project.id}`)).json()).toMatchObject({ name: 'Roadmap' });
  });

  /** The organizations a ProjectsService was created for, while `run` ran. */
  async function projectsServicesCreated(run: () => Promise<unknown>) {
    const log = vi.spyOn(Logger.prototype, 'log');
    try {
      await run();
      return log.mock.calls.map(([message]) => String(message)).filter((m) => m.startsWith('Created for organization'));
    } finally {
      log.mockRestore();
    }
  }

  it('builds one ProjectsService per organization, and reuses it', async () => {
    const ada = await signUp('ada-durable');
    const initech = await createOrganization(ada, 'Initech');

    const created = await projectsServicesCreated(() =>
      Promise.all(Array.from({ length: 5 }, () => ada.send('GET', `/orgs/${initech}/projects`))),
    );

    expect(created).toEqual([`Created for organization ${initech}`]);
  });

  it("never serves one organization's requests from another's instance", async () => {
    const ada = await signUp('ada-two-orgs');
    const [hooli, piedPiper] = await Promise.all([
      createOrganization(ada, 'Hooli'),
      createOrganization(ada, 'Pied Piper'),
    ]);

    // Interleaved, at the same time: five projects in each organization.
    const created = await projectsServicesCreated(() =>
      Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          ada.send('POST', `/orgs/${i % 2 ? piedPiper : hooli}/projects`, { name: `Project ${i}` }),
        ),
      ),
    );

    expect(created.sort()).toEqual([hooli, piedPiper].sort().map((id) => `Created for organization ${id}`));
    for (const orgId of [hooli, piedPiper]) {
      const list = (await ada.send('GET', `/orgs/${orgId}/projects`)).json<{ orgId: string }[]>();
      expect(list).toHaveLength(5);
      expect(list.every((project) => project.orgId === orgId)).toBe(true);
    }
  });

  it('invites by email, with a link that works once, for its recipient only', async () => {
    const ada = await signUp('ada-inviter');
    const carol = await signUp('carol');
    const dave = await signUp('dave');
    const acme = await createOrganization(ada, 'Acme');

    expect((await ada.send('POST', `/orgs/${acme}/invitations`, { email: 'carol@example.com' })).statusCode).toBe(201);
    const mail = mailbox.assertSent({ to: 'carol@example.com', subject: 'Join Acme' });
    const token = mail.link('/invitations/accept').searchParams.get('token');

    // Someone the link was forwarded to can't use it.
    expect((await dave.send('POST', '/invitations/accept', { token })).statusCode).toBe(404);
    // Accepted twice at once: one request spends the token.
    const results = await Promise.all([1, 2].map(() => carol.send('POST', '/invitations/accept', { token })));
    expect(results.map((res) => res.statusCode).sort()).toEqual([200, 404]);

    expect((await carol.send('GET', `/orgs/${acme}/projects`)).statusCode).toBe(200);
    // A member doesn't invite, delete projects or change roles.
    expect((await carol.send('POST', `/orgs/${acme}/invitations`, { email: 'eve@example.com' })).statusCode).toBe(403);
    expect((await carol.send('PATCH', `/orgs/${acme}/members/${carol.id}`, { role: 'admin' })).statusCode).toBe(403);
  });

  it('never leaves an organization without an owner', async () => {
    const ada = await signUp('ada-owner');
    const bob = await signUp('bob-owner');
    // Ten organizations, each with two owners who step down at the same moment.
    const orgs = await Promise.all(Array.from({ length: 10 }, (_, i) => createOrganization(ada, `Org ${i}`)));
    await db.insert(memberships).values(orgs.map((orgId) => ({ orgId, userId: bob.id, role: 'owner' as const })));

    const results = await Promise.all(
      orgs.flatMap((orgId) => [
        ada.send('PATCH', `/orgs/${orgId}/members/${ada.id}`, { role: 'admin' }),
        bob.send('PATCH', `/orgs/${orgId}/members/${bob.id}`, { role: 'admin' }),
      ]),
    );

    for (const [i, orgId] of orgs.entries()) {
      expect([results[2 * i].statusCode, results[2 * i + 1].statusCode].sort()).toEqual([200, 409]);
      const owners = await db
        .select()
        .from(memberships)
        .where(and(eq(memberships.orgId, orgId), eq(memberships.role, 'owner')));
      expect(owners).toHaveLength(1);
      // The refused demotion wrote nothing to the audit log.
      const changes = await db
        .select()
        .from(auditEvents)
        .where(and(eq(auditEvents.orgId, orgId), eq(auditEvents.action, 'member.role_changed')));
      expect(changes).toHaveLength(1);
    }
  });
  it('lets only current owners change owners', async () => {
    const ada = await signUp('ada-third');
    const bob = await signUp('bob-third');
    const carol = await signUp('carol-third');
    // Ten organizations with three owners each. Ada removes Bob while Bob demotes Ada.
    const orgs = await Promise.all(Array.from({ length: 10 }, (_, i) => createOrganization(ada, `Trio ${i}`)));
    await db
      .insert(memberships)
      .values(orgs.flatMap((orgId) => [bob.id, carol.id].map((userId) => ({ orgId, userId, role: 'owner' as const }))));

    const results = await Promise.all(
      orgs.flatMap((orgId) => [
        ada.send('DELETE', `/orgs/${orgId}/members/${bob.id}`),
        bob.send('PATCH', `/orgs/${orgId}/members/${ada.id}`, { role: 'member' }),
      ]),
    );

    // Whichever ran second was no longer allowed to: Bob had been removed, or Ada demoted.
    for (const [i] of orgs.entries()) {
      const statuses = [results[2 * i].statusCode, results[2 * i + 1].statusCode];
      expect(statuses.filter((status) => status < 300)).toHaveLength(1);
    }
  });
});
```

- **The tenant test tries both ways in.** Through Acme's URLs, the guard stops Bob. Through his own organization's URLs, the guard lets him in, and only the `WHERE` clause stands between him and Acme's project.
- **The durable-provider tests count the services that were created**, by spying on `Logger`: five requests for one organization create one, and ten interleaved requests for two organizations create one for each, while each organization's projects stay its own. Make `ProjectsService` request-scoped but not durable, and both fail, with one service per request.
- **The race tests run ten races at once**, two requests per organization. In the first, both owners step down; the test then checks the database: one owner left in each, and one audit entry for the one demotion that happened. In the second, Ada removes Bob while Bob demotes Ada, with Carol as a third owner, so only the re-read of the actor's role can stop the second request.
- **The extra owner memberships are inserted directly**, to set the races up in one statement. Everything the tests check goes through the API.

Create a database of their own, since the tests truncate the tables, and run them. The JWT tutorial's [refresh-token store test](/tutorials/rest-api-jwt-authentication#test-it) applies here unchanged, and both files truncate tables of the same database, so run them one after the other:

```bash
$ docker exec saas-db psql -U postgres -c "CREATE DATABASE saas_test"
$ TEST_DATABASE_URL=postgres://postgres:saas@localhost:5432/saas_test npm run test:e2e -- --no-file-parallelism

 Test Files  2 passed (2)
      Tests  11 passed (11)
```

Remove `FOR UPDATE` from `lock()`, and both race tests fail: both owners step down, and nine or ten of the ten organizations are left with no owner. Keep the lock but use the guard's role instead of the one `lock()` reads, and the second test fails: Bob is removed, and Ada is demoted by him anyway.

#### Production checklist

Everything in the JWT tutorial's [checklist](/tutorials/rest-api-jwt-authentication#production-checklist) applies. For a multi-tenant backend in particular:

- **Put every tenant-owned query behind the organization id.** The rule in this tutorial is that the id comes from the membership the guard loaded, or from a durable provider built for the route parameter the guard checked, and goes into the `WHERE` clause of every statement. Review new queries for it, and keep a test like the tenant test above for every new resource.
- **Consider row-level security as a second line of defense.** PostgreSQL can refuse rows of other tenants even to a query that forgot its `WHERE` clause, with a policy on `org_id` that reads a setting your code sets per transaction (`set_config('app.org_id', ..., true)`). Superusers bypass it, and so does the owner of a table unless the table forces it, so the application then connects as a role of its own. See [Row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
- **Rate-limit per tenant after the membership check, not before.** The throttler's guard is global, so it runs before `OrganizationGuard`, and before authentication. A throttler tracker keyed by the `:orgId` of the URL would let anyone, member or not, use up an organization's budget. Count per organization where the membership is known: in the guard, or in a service, with a store shared by all instances.
- **Send invitations with a real transport, and through the outbox when they must not be lost.** `LogMailTransport` writes the invitation links into the logs; logs are shipped and kept, so it's for development only. See [Send in production](/application/mail#send-in-production) and [Send after the order commits](/application/mail#send-after-the-order-commits).
- **Delete expired invitations.** Accepting ignores them, but they stay in the table. A daily job with [`@nestjs/schedule`](/application/task-scheduling) that deletes rows past `expires_at` is enough.
- **Keep the audit log append-only.** Nothing in the application updates or deletes audit events. Grant the application's database role `INSERT` and `SELECT` on `audit_events` only, so a bug or a stolen connection can't rewrite history either.
- **Keep membership transactions short.** They hold the organization's lock until they commit. Nothing in them waits on anything but the database, and the invitation mail goes out after the commit; keep it that way.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the platform's environment: `start:prod` doesn't load `.env`. [NestJS Observe](/observability/overview) then records every request with a trace of its spans, SQL statements included. To see which users and tenants are affected, its `getUserId` option populates the **Users** view with per-user activity (see [Associating users with telemetry](/observability/sdk#associating-users-with-telemetry)), and a tag on the request's span, added with `TracerService`, makes the organization id visible in the dashboard (see [Tags and custom attributes](/observability/sdk#tags-and-custom-attributes)).

#### What's next

- Give roles finer permissions, record by record: [Authorization](/security/authorization).
- Send the invitation from a queue, with retries, outside the request: [Mail](/application/mail) and [Queues](/application/queues).
- Let members sign in with Google, or with their company's Microsoft directory: [Authentication](/security/authentication#add-sign-in-with-google).
- See per-tenant activity, slow routes and errors in production: [Observability](/observability/overview).
- Build an e-commerce backend on the same foundation: [Build an e-commerce backend](/tutorials/ecommerce-backend).
