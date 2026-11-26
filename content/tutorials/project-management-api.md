### Build a project-management API in Node.js

Build a project-management API in Node.js with NestJS: projects, tasks and comments, per-record permissions, live updates over SSE, and due-date reminders.

The API serves a project-management tool for teams: projects with members, tasks with a status, an assignee and a due date, comments, live updates in the browser, and reminders before tasks are due. Most of it is CRUD. The parts that aren't are where several people work on the same records at once, so this tutorial spends its time there: permissions checked against each record, status changes that can't overwrite each other, a task list that pages correctly while it changes, and a stream that carries only a user's own projects.

By the end, the API will:

- Check every request against the record it touches, with [`@nestjs/authorization`](/security/authorization) policies: project members read, the assignee or a project admin changes a task, and only its author edits a comment. Someone outside a project gets a 404 for everything in it.
- Move tasks between `todo`, `in_progress` and `done` with conditional updates, so two people moving the same card at once can't both win.
- List a project's tasks filtered by status, assignee and due date, with keyset pagination and an index for each way the list is read.
- Push every change to the project's members over [Server-Sent Events](/http/server-sent-events), fed by [`@nestjs/event-emitter`](/application/events).
- Remind assignees of tasks due within a day, from a scheduled job that runs on one instance with [`@nestjs/locks`](/reliability/locks).
- Prove the races, the stream and the reminders in tests against PostgreSQL.

It starts from the API of [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication), which signs users in with access and refresh tokens, validates requests with Zod, and keeps its data in PostgreSQL through Drizzle. This tutorial doesn't explain those parts again.

These are the endpoints, and the section that adds each one:

| Endpoint | Section |
| --- | --- |
| `POST /auth/sign-up`, `POST /auth/token`, `POST /auth/token/refresh`, `POST /auth/token/revoke`, `GET /me`, `GET /health/live`, `GET /health/ready` | [Start from the JWT API](/tutorials/project-management-api#start-from-the-jwt-api) |
| `POST /projects`, `GET /projects`, `GET /projects/:projectId/members`, `POST /projects/:projectId/members` | [Share projects with their members](/tutorials/project-management-api#share-projects-with-their-members) |
| `POST /projects/:projectId/tasks`, `GET /projects/:projectId/tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `POST /tasks/:id/status` | [Add tasks](/tutorials/project-management-api#add-tasks) |
| `GET /tasks/:taskId/comments`, `POST /tasks/:taskId/comments`, `PATCH /comments/:id` | [Comment on tasks](/tutorials/project-management-api#comment-on-tasks) |
| `GET /projects/:projectId/events` | [Stream changes with server-sent events](/tutorials/project-management-api#stream-changes-with-server-sent-events) |

> info **Hint** The finished application is on GitHub as [nestjs/example-project-management-api](https://github.com/nestjs/example-project-management-api), with its tests and a CI workflow.

#### Start from the JWT API

Create the project, and install everything this tutorial uses. These are the JWT tutorial's packages plus `@nestjs/authorization`, `@nestjs/event-emitter`, `@nestjs/schedule` and `@nestjs/locks`:

```bash
$ npm i -g @nestjs/cli
$ nest new projects-api --minimal
$ cd projects-api
$ npm uninstall @nestjs/platform-express @types/express
$ npm i --save @nestjs/platform-node zod @nestjs/config @nestjs/drizzle drizzle-orm@rc pg @nestjs/authentication @nestjs/authorization @nestjs/event-emitter @nestjs/schedule @nestjs/locks @nestjs/throttler @nestjs/swagger @nestjs/terminus
$ npm i --save-dev drizzle-kit@rc @types/pg @nestjs/testing vitest vite
```

Then take these files from the [finished JWT tutorial](/tutorials/rest-api-jwt-authentication#sign-users-in-with-jwts), as they are:

- `src/config.ts`, `src/main.ts`, `drizzle.config.ts` and `vitest.config.e2e.ts`
- everything under `src/auth/`, `src/users/` and `src/health/`
- `test/refresh-token.store.e2e-spec.ts`

Leave out `src/notes/` and the JWT tutorial's `drizzle/` folder: this application's first migration comes from its own schema, in the next section. Rename the notes to the projects where they're named: the `realm` in `JwtAuth` and the title of the OpenAPI document in `main.ts`. Add the test script to `package.json`:

```json
"test:e2e": "vitest run --config ./vitest.config.e2e.ts"
```

Finally, add the database's URL and a `JWT_SECRET` to `.env`, as in the JWT tutorial, with a database of the application's own:

```bash
$ docker run -d --name projects-db -e POSTGRES_PASSWORD=projects -e POSTGRES_DB=projects -p 5432:5432 postgres:17
```

Its URL goes in `.env`, next to the signing secret:

```bash
DATABASE_URL=postgres://postgres:projects@localhost:5432/projects
# Generate with: openssl rand -base64 32
JWT_SECRET=
```

Adding a member to a project goes by email, so `UsersRepository` gets a method that finds a user by their address:

```typescript
@@filename(src/users/users.repository)
// ...
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db.select(columns).from(users).where(eq(users.email, normalize(email)));
    return user ?? null;
  }
```

#### Design the schema

The whole schema, in one file. The users and refresh tokens are the JWT tutorial's:

```typescript
@@filename(src/database/schema)
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  foreignKey,
  index,
  jsonb,
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const ms = (name: string) => timestamp(name, { withTimezone: true, mode: 'date', precision: 3 });

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: at('created_at').notNull().defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: at('created_at').notNull().defaultNow(),
});

export const projectMembers = pgTable(
  'project_members',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['admin', 'member'] }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.userId] }),
    // "My projects" looks memberships up by user.
    index('project_members_user_id_idx').on(table.userId),
  ],
);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    status: text('status', { enum: ['todo', 'in_progress', 'done'] }).notNull().default('todo'),
    assigneeId: uuid('assignee_id'),
    dueAt: at('due_at'),
    remindedAt: at('reminded_at'),
    // To the millisecond, like a JavaScript Date, so a page cursor round-trips exactly.
    createdAt: ms('created_at').notNull().defaultNow(),
    updatedAt: ms('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // The assignee is a member of the task's project, whatever the application does.
    foreignKey({
      name: 'tasks_assignee_is_member_fk',
      columns: [table.projectId, table.assigneeId],
      foreignColumns: [projectMembers.projectId, projectMembers.userId],
    }),
    // One index per way the list is read: all tasks, by status, by assignee.
    index('tasks_project_id_created_at_idx').on(table.projectId, table.createdAt, table.id),
    index('tasks_project_id_status_created_at_idx').on(table.projectId, table.status, table.createdAt, table.id),
    index('tasks_project_id_assignee_id_created_at_idx').on(
      table.projectId,
      table.assigneeId,
      table.createdAt,
      table.id,
    ),
    // The reminder job's scan: open tasks that haven't been reminded yet.
    index('tasks_due_at_unreminded_idx')
      .on(table.dueAt)
      .where(sql`${table.remindedAt} is null and ${table.status} <> 'done'`),
  ],
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
    updatedAt: at('updated_at').notNull().defaultNow(),
  },
  (table) => [index('comments_task_id_created_at_idx').on(table.taskId, table.createdAt)],
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

// What @nestjs/locks keeps, through DrizzleLockStore: one row per lock key.
export const locks = pgTable('locks', {
  key: text('key').primaryKey(),
  /** The holder's id; null once released. */
  owner: text('owner'),
  fencingToken: bigint('fencing_token', { mode: 'number' }).notNull(),
  /** On the database's clock: every instance agrees on it. */
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

/** Fencing tokens for every key: a sequence never goes back, so they only grow. */
export const locksFencingTokenSeq = pgSequence('locks_fencing_token_seq');

export type Project = typeof projects.$inferSelect;
export type Membership = typeof projectMembers.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Comment = typeof comments.$inferSelect;
```

- **A membership is a row of `project_members`**, keyed by project and user, with the user's role in that project: `admin` or `member`. Roles belong to the membership, not to the user, so Ada can run one project and be a member of another.
- **The assignee is a member, by a foreign key.** `tasks_assignee_is_member_fk` points `(project_id, assignee_id)` at `project_members`, so PostgreSQL refuses a task assigned to someone outside its project, whatever the code does. When `assignee_id` is null, the key isn't checked, and the task is unassigned.
- **`created_at` of a task is stored to the millisecond.** The list's page cursor carries it, and a JavaScript `Date` holds milliseconds while PostgreSQL's default is microseconds. A cursor that dropped the microseconds would skip the tasks created within the same millisecond; [Page through the list](/tutorials/project-management-api#page-through-the-list) explains it.
- **Each way the task list is read has an index**: all of a project's tasks, those with a status, and those of an assignee, each in the order the list pages through them. The reminder job has a partial index of its own, holding only the open tasks that haven't been reminded yet, so it stays small however many tasks are done.
- **`locks` and its sequence are for `@nestjs/locks`**, which keeps its leases in the application's database. They are the tables of [Keep locks in your database](/reliability/locks#keep-locks-in-your-database).

Generate the migration and apply it (see [Migrations](/data/drizzle#migrations)):

```bash
$ npx drizzle-kit generate --name=projects
$ npx drizzle-kit migrate
```

#### Share projects with their members

Register the modules this tutorial adds in the root module, with the feature modules of the sections that follow:

```typescript
@@filename(src/app.module)
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { DrizzleModule } from '@nestjs/drizzle';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LocksModule } from '@nestjs/locks';
import { createObserveModule } from '@nestjs/observe';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule, minutes, normalizeIp } from '@nestjs/throttler';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ActivityModule } from './activity/activity.module.js';
import { accountEmail } from './auth/account-email.js';
import { AuthModule } from './auth/auth.module.js';
import { envSchema, type Env } from './config.js';
import { DrizzleLockStore } from './database/drizzle-lock.store.js';
import { HealthModule } from './health/health.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'projects-api',
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
          issuer: 'projects-api',
          audience: 'projects-api',
          ttl: '15m',
        },
        refreshToken: { ttl: '30d', absoluteTtl: '90d' },
      }),
    }),
    // After AuthenticationModule: its guard reads the user that authentication sets.
    AuthorizationModule.forRoot(),
    // `task.*` and `comment.*` listeners need wildcards.
    EventEmitterModule.forRoot({ wildcard: true }),
    ScheduleModule.forRoot(),
    LocksModule.forRoot(),
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
    ProjectsModule,
    TasksModule,
    ActivityModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    DrizzleLockStore,
  ],
})
export class AppModule {}
```

- `AuthorizationModule` comes right after `AuthenticationModule`. Both register a global guard, and authorization's needs the user that authentication sets. Its guard **denies by default**: a route runs only if it declares who may call it, with `@Can()`, `@Can.Anyone()`, or `@Public()`. The JWT tutorial's routes under `/auth` and `/health` are `@Public()` already.
- `EventEmitterModule` has wildcards on, for the stream's listeners. `ScheduleModule` and `LocksModule` run the reminder job, and `DrizzleLockStore` keeps the job's lease in PostgreSQL. They come up in their own sections below.

`GET /me` is for any signed-in user:

```typescript
@@filename(src/users/me.controller)
import { Can } from '@nestjs/authorization';
// ...

@Can.Anyone()
@Controller('me')
export class MeController {
  // ...
}
```

##### Policies on memberships

Who may do what in a project depends on the user's membership of it, so the project policy takes the membership as its record:

```typescript
@@filename(src/projects/project.policy)
import { Policy } from '@nestjs/authorization';
import type { Membership } from '../database/schema.js';
import type { User } from '../users/user.js';

/** `membership` is the user's membership of the project, or `null` if they have none. */
@Policy()
export class ProjectPolicy {
  // Members see the project, its tasks and their comments.
  view(user: User, membership: Membership | null) {
    return membership?.userId === user.id;
  }

  // Admins add members.
  manage(user: User, membership: Membership | null) {
    return membership?.userId === user.id && membership.role === 'admin';
  }
}
```

The abilities take `User`, not `User | null`: every route of this API requires a signed-in user. Services call them, after loading the membership, as the authorization chapter does with [orders record by record](/security/authorization#check-orders-record-by-record). `MembershipsService` loads the user's membership and checks it, for every service that works inside a project:

```typescript
@@filename(src/projects/memberships.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '@nestjs/authorization';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { projectMembers, type Membership } from '../database/schema.js';
import type { User } from '../users/user.js';
import { ProjectPolicy } from './project.policy.js';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly authorizationService: AuthorizationService,
  ) {}

  /** The user's membership of the project. A project they may not see is a 404, as if it didn't exist. */
  async access(user: User, projectId: string): Promise<Membership | null> {
    const [membership = null] = await this.db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)));
    await this.check(user, membership, 'Project not found');
    return membership;
  }

  /** Throws a 404 with `message` unless `membership` lets the user see its project. */
  async check(user: User, membership: Membership | null, message: string): Promise<void> {
    if (!(await this.authorizationService.can(ProjectPolicy, 'view', user, membership))) {
      throw new NotFoundException(message);
    }
  }
}
```

A user who isn't a member of a project gets a 404 for it, the same answer as for a project that doesn't exist; a 403 would confirm that it exists. `can()` resolves to `false` on a denial instead of throwing, so the service throws the 404 itself. Members who aren't allowed something get a 403 from `authorize()`, which [the authorization module turns into a `ForbiddenException`](/security/authorization#tell-guests-from-forbidden-users-and-expose-permissions): they know the project is there, and signing in again won't help.

##### Projects and members

A project has a name, and a member is added by email, as an admin or a member:

```typescript
@@filename(src/projects/projects.schemas)
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
});
export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export const addMemberSchema = z.object({
  email: z.email(),
  role: z.enum(['admin', 'member']).default('member'),
});
export type AddMemberDto = z.infer<typeof addMemberSchema>;
```

The service creates projects and lists their members, and checks the project's policy before adding a member:

```typescript
@@filename(src/projects/projects.service)
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '@nestjs/authorization';
import { InjectDrizzle } from '@nestjs/drizzle';
import { asc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { projectMembers, projects, users } from '../database/schema.js';
import type { User } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';
import { MembershipsService } from './memberships.service.js';
import { ProjectPolicy } from './project.policy.js';
import type { AddMemberDto, CreateProjectDto } from './projects.schemas.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly memberships: MembershipsService,
    private readonly authorizationService: AuthorizationService,
    private readonly usersRepository: UsersRepository,
  ) {}

  /** Creates the project with its creator as its first admin, or neither. */
  create(user: User, dto: CreateProjectDto) {
    return this.db.transaction(async (tx) => {
      const [project] = await tx.insert(projects).values(dto).returning();
      await tx.insert(projectMembers).values({ projectId: project.id, userId: user.id, role: 'admin' });
      return { ...project, role: 'admin' as const };
    });
  }

  /** The projects the user is a member of, with their role in each. */
  findMine(user: User) {
    return this.db
      .select({ id: projects.id, name: projects.name, createdAt: projects.createdAt, role: projectMembers.role })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, user.id))
      .orderBy(asc(projects.name));
  }

  async members(user: User, projectId: string) {
    await this.memberships.access(user, projectId);
    return this.db
      .select({ userId: users.id, email: users.email, role: projectMembers.role })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(asc(users.email));
  }

  async addMember(user: User, projectId: string, { email, role }: AddMemberDto) {
    const membership = await this.memberships.access(user, projectId);
    await this.authorizationService.authorize(ProjectPolicy, 'manage', user, membership);
    const member = await this.usersRepository.findByEmail(email);
    if (!member) {
      throw new NotFoundException('No user with this email');
    }
    const [added] = await this.db
      .insert(projectMembers)
      .values({ projectId, userId: member.id, role })
      .onConflictDoNothing()
      .returning();
    if (!added) {
      throw new ConflictException('Already a member');
    }
    return { userId: member.id, email: member.email, role: added.role };
  }
}
```

- **A project and its first admin are created in one transaction.** A project without a member would be visible to nobody, and nobody could ever add one.
- **`addMember()` checks `manage` against the caller's own membership**: it loads it with `access()`, which also answers 404 to non-members, then asks the policy whether that membership is an admin's.
- **Adding someone twice is a 409**, from `onConflictDoNothing()` on the membership's primary key: of two admins adding the same user at once, one adds them and the other learns they're already there. Changing a role isn't in this tutorial, because it brings a rule of its own: a project must always keep an admin.

Every route checks permissions in the service, so the controller declares `@Can.Anyone()`. Without it, the authorization guard would deny them all:

```typescript
@@filename(src/projects/projects.controller)
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import type { User } from '../users/user.js';
import { addMemberSchema, createProjectSchema, type AddMemberDto, type CreateProjectDto } from './projects.schemas.js';
import { ProjectsService } from './projects.service.js';

const projectId = { schema: z.uuid() };

// Every route checks the caller's membership in the service.
@Can.Anyone()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body({ schema: createProjectSchema }) dto: CreateProjectDto) {
    return this.projectsService.create(user, dto);
  }

  @Get()
  findMine(@CurrentUser() user: User) {
    return this.projectsService.findMine(user);
  }

  @Get(':projectId/members')
  members(@CurrentUser() user: User, @Param('projectId', projectId) id: string) {
    return this.projectsService.members(user, id);
  }

  @Post(':projectId/members')
  addMember(
    @CurrentUser() user: User,
    @Param('projectId', projectId) id: string,
    @Body({ schema: addMemberSchema }) dto: AddMemberDto,
  ) {
    return this.projectsService.addMember(user, id, dto);
  }
}
```

The projects module registers the controller, the services and the policy, and exports the memberships for the other modules:

```typescript
@@filename(src/projects/projects.module)
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { MembershipsService } from './memberships.service.js';
import { ProjectPolicy } from './project.policy.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';

@Module({
  imports: [UsersModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, MembershipsService, ProjectPolicy],
  exports: [MembershipsService],
})
export class ProjectsModule {}
```

`ProjectsModule` exports `MembershipsService`, for the tasks, comments and the stream.

#### Add tasks

The request schemas:

```typescript
@@filename(src/tasks/tasks.schemas)
import { z } from 'zod';

const title = z.string().trim().min(1).max(200);
const description = z.string().max(10_000);
const status = z.enum(['todo', 'in_progress', 'done']);
// An instant with its offset, such as 2026-12-01T17:00:00Z.
const instant = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

export const createTaskSchema = z.object({
  title,
  description: description.default(''),
  assigneeId: z.uuid().optional(),
  dueAt: instant.optional(),
});
export type CreateTaskDto = z.infer<typeof createTaskSchema>;

// `null` unassigns a task or clears its due date. Strict: a `status` here is a 400, not ignored.
export const updateTaskSchema = z
  .strictObject({ title, description, assigneeId: z.uuid().nullable(), dueAt: instant.nullable() })
  .partial();
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;

export const commentSchema = z.object({
  body: z.string().trim().min(1).max(5_000),
});
export type CommentDto = z.infer<typeof commentSchema>;

// The client says which status it moves the task from: the status it showed the user.
export const moveTaskSchema = z
  .object({ from: status, to: status })
  .refine(({ from, to }) => from !== to, { message: 'from and to must differ', path: ['to'] });
export type MoveTaskDto = z.infer<typeof moveTaskSchema>;

export interface TaskCursor {
  createdAt: string;
  id: string;
}

const cursorSchema = z.tuple([z.iso.datetime(), z.uuid()]);

/** The position after the last task of a page, opaque to the client. */
export const encodeCursor = ({ createdAt, id }: { createdAt: Date; id: string }) =>
  Buffer.from(JSON.stringify([createdAt.toISOString(), id])).toString('base64url');

const cursor = z.string().max(200).transform((value, ctx): TaskCursor => {
  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(value, 'base64url').toString());
  } catch {}
  const parsed = cursorSchema.safeParse(decoded);
  if (!parsed.success) {
    ctx.addIssue({ code: 'custom', message: 'Invalid cursor' });
    return z.NEVER;
  }
  const [createdAt, id] = parsed.data;
  return { createdAt, id };
});

export const listTasksQuerySchema = z.object({
  status: status.optional(),
  assigneeId: z.uuid().optional(),
  dueBefore: instant.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  after: cursor.optional(),
});
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
```

- **`assigneeId` and `dueAt` take `null` in an update**, which unassigns the task or clears its due date. The other fields aren't nullable: a `null` title is a 400.
- **The update schema is strict.** `z.strictObject()` refuses keys it doesn't know, so a `PATCH` with a `status` is a 400 that names the key, rather than a 200 that quietly ignored it. Status changes have their own endpoint.
- **Instants carry their offset.** `z.iso.datetime()` with the `offset` option accepts `2026-12-01T17:00:00+01:00` and `2026-12-01T16:00:00Z`, and refuses a date without a time, whose time zone would be a guess.
- **The cursor is opaque to the client**, a base64url string, and validated like any other input: one that doesn't decode to a timestamp and an id is a 400.

##### Who may change a task

Any member adds tasks and comments. Changing a task is for its assignee and the project's admins, which depends on the task and on the user's membership of its project, so the ability takes both:

```typescript
@@filename(src/tasks/task.policy)
import { Policy } from '@nestjs/authorization';
import type { Membership, Task } from '../database/schema.js';
import type { User } from '../users/user.js';

@Policy()
export class TaskPolicy {
  // The assignee or a project admin changes a task. `membership` is the user's, in the task's project.
  update(user: User, task: Task, membership: Membership | null) {
    if (membership?.userId !== user.id || membership.projectId !== task.projectId) {
      return false;
    }
    return membership.role === 'admin' || task.assigneeId === user.id;
  }
}
```

The service loads each task together with the user's membership of its project, in one query, and checks the policies against what it loaded:

```typescript
@@filename(src/tasks/tasks.service)
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '@nestjs/authorization';
import { InjectDrizzle } from '@nestjs/drizzle';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, desc, eq, lt, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DatabaseError } from 'pg';
import type { ProjectActivity } from '../activity/project-activity.js';
import { projectMembers, tasks, type Task } from '../database/schema.js';
import { MembershipsService } from '../projects/memberships.service.js';
import type { User } from '../users/user.js';
import { TaskPolicy } from './task.policy.js';
import {
  encodeCursor,
  type CreateTaskDto,
  type ListTasksQuery,
  type MoveTaskDto,
  type UpdateTaskDto,
} from './tasks.schemas.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly memberships: MembershipsService,
    private readonly authorizationService: AuthorizationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Any member adds a task to the project. */
  async create(user: User, projectId: string, dto: CreateTaskDto): Promise<Task> {
    await this.memberships.access(user, projectId);
    const [task] = await this.db
      .insert(tasks)
      .values({ ...dto, projectId })
      .returning()
      .catch(assigneeNotMember);
    this.emit({ type: 'task.created', projectId, data: task });
    return task;
  }

  /** A page of the project's tasks, newest first. */
  async list(user: User, projectId: string, { status, assigneeId, dueBefore, limit, after }: ListTasksQuery) {
    await this.memberships.access(user, projectId);
    const rows = await this.db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.projectId, projectId),
          status ? eq(tasks.status, status) : undefined,
          assigneeId ? eq(tasks.assigneeId, assigneeId) : undefined,
          dueBefore ? lt(tasks.dueAt, dueBefore) : undefined,
          // Keyset pagination: the tasks after the cursor's, in the index's order.
          after
            ? sql`(${tasks.createdAt}, ${tasks.id}) < (${after.createdAt}::timestamptz, ${after.id}::uuid)`
            : undefined,
        ),
      )
      .orderBy(desc(tasks.createdAt), desc(tasks.id))
      .limit(limit + 1);
    const items = rows.slice(0, limit);
    return { items, nextCursor: rows.length > limit ? encodeCursor(items[items.length - 1]) : null };
  }

  async findOne(user: User, id: string): Promise<Task> {
    return (await this.load(user, id)).task;
  }

  /** The assignee or an admin changes the task's fields. */
  async update(user: User, id: string, dto: UpdateTaskDto): Promise<Task> {
    const { task, membership } = await this.load(user, id);
    await this.authorizationService.authorize(TaskPolicy, 'update', user, task, membership);
    const [updated] = await this.db
      .update(tasks)
      // A new due date gets a new reminder.
      .set({ ...dto, remindedAt: dto.dueAt === undefined ? undefined : null, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning()
      .catch(assigneeNotMember);
    if (!updated) {
      throw new NotFoundException('Task not found');
    }
    this.emit({ type: 'task.updated', projectId: updated.projectId, data: updated });
    return updated;
  }

  /** Moves the task from the status the client saw to another, or answers 409 if it has moved since. */
  async move(user: User, id: string, { from, to }: MoveTaskDto): Promise<Task> {
    const { task, membership } = await this.load(user, id);
    await this.authorizationService.authorize(TaskPolicy, 'update', user, task, membership);
    // Conditional: of two moves from the same status, one wins.
    const [moved] = await this.db
      .update(tasks)
      .set({ status: to, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.status, from)))
      .returning();
    if (!moved) {
      throw new ConflictException(`Task is no longer ${from}`);
    }
    this.emit({ type: 'task.updated', projectId: moved.projectId, data: moved });
    return moved;
  }

  /** The task with the user's membership of its project, in one query. */
  async load(user: User, id: string) {
    const [row] = await this.db
      .select({ task: tasks, membership: projectMembers })
      .from(tasks)
      .leftJoin(projectMembers, and(eq(projectMembers.projectId, tasks.projectId), eq(projectMembers.userId, user.id)))
      .where(eq(tasks.id, id));
    if (!row) {
      throw new NotFoundException('Task not found');
    }
    // A task in a project the user isn't in is as missing as one that doesn't exist.
    await this.memberships.check(user, row.membership, 'Task not found');
    return row;
  }

  private emit(activity: ProjectActivity) {
    this.eventEmitter.emit(activity.type, activity);
  }
}

/** The assignee foreign key's violation as a 400, rather than a 500. */
function assigneeNotMember(error: unknown): never {
  const cause = error instanceof Error ? error.cause : undefined;
  if (cause instanceof DatabaseError && cause.constraint === 'tasks_assignee_is_member_fk') {
    throw new BadRequestException('The assignee is not a member of this project');
  }
  throw error;
}
```

- **`load()` is one query**: the task, left-joined with the caller's row of `project_members`. A missing task and a task in someone else's project are the same 404.
- **The emitter is called after the write has returned**, so nothing announces a change the database refused. The stream that listens comes in [its own section](/tutorials/project-management-api#stream-changes-with-server-sent-events).
- **An assignee outside the project is a 400.** The foreign key refuses the write, and `assigneeNotMember()` turns that one constraint's violation into a `BadRequestException`. Drizzle wraps the driver's error, so the constraint's name is on its `cause`. Any other database error still reaches the client as a 500, as it should.
- **A new due date clears `reminded_at`**, so the assignee is reminded of the new date too.

##### Move a task without losing a change

Two people look at the same board. Bob drags a task from `todo` to `in_progress` and, at the same moment, Ada drags it from `todo` to `done`. With an `UPDATE` that only sets the status, both requests succeed, the last one wins, and one of them is looking at a board that is wrong without knowing it.

So the client says which status it moves the task **from**: the one it showed the user. `move()` makes that the condition of its `UPDATE`, and when the task has left that status in the meantime, the statement changes nothing and the client gets a 409, which tells it to reload the task and let the user decide again. The status is checked in the statement that writes, not in the policy's earlier read: PostgreSQL locks the row for the update, so of ten moves from `todo` at once, exactly one finds the task still in `todo`. The [test](/tutorials/project-management-api#test-it) at the end runs those ten.

##### Page through the list

`list()` reads a page of a project's tasks, newest first, with any of the filters. It pages with a **cursor** rather than an offset. With `offset=20`, a task created while the user reads the first page shifts every task down by one, so the second page repeats one; and PostgreSQL has to read and discard every row before the offset, so deep pages get slower. A cursor names the last task of the page instead, by its `created_at` and its id, and the next page is the tasks that sort after it:

```sql
(created_at, id) < ($1, $2)  -- ORDER BY created_at DESC, id DESC
```

The id is in the cursor because `created_at` alone isn't unique: tasks inserted by one statement share it. And the cursor's `created_at` must be exactly the stored one, which is why the column is stored to the millisecond. With PostgreSQL's default precision, a task created at `21:54:53.387412` would get a cursor of `21:54:53.387`, and the tasks of that millisecond that sort after it would never appear on a page.

The query's `WHERE` and `ORDER BY` match an index, so PostgreSQL reads one page of index entries however deep the page is, with the cursor in the index condition. With 100,000 tasks in 50 projects, `EXPLAIN` shows each list reading its own index, backward: `tasks_project_id_status_created_at_idx` for a board's `todo` column, `tasks_project_id_assignee_id_created_at_idx` for an assignee's tasks, and `tasks_project_id_created_at_idx` for a later page of the whole list. The reminder job's scan uses `tasks_due_at_unreminded_idx`.

`dueBefore` filters the rows each index returns, rather than having an index of its own: it narrows a list, but a list sorted by due date would need a cursor on a column that can be null. A list that pages by due date is the same technique with `(due_at, id)`, and an index to match.

```typescript
@@filename(src/tasks/tasks.controller)
import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import type { User } from '../users/user.js';
import {
  createTaskSchema,
  listTasksQuerySchema,
  moveTaskSchema,
  updateTaskSchema,
  type CreateTaskDto,
  type ListTasksQuery,
  type MoveTaskDto,
  type UpdateTaskDto,
} from './tasks.schemas.js';
import { TasksService } from './tasks.service.js';

const uuid = { schema: z.uuid() };

// Every route checks the caller's permissions in the service, against the task.
@Can.Anyone()
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('projects/:projectId/tasks')
  create(
    @CurrentUser() user: User,
    @Param('projectId', uuid) projectId: string,
    @Body({ schema: createTaskSchema }) dto: CreateTaskDto,
  ) {
    return this.tasksService.create(user, projectId, dto);
  }

  @Get('projects/:projectId/tasks')
  list(
    @CurrentUser() user: User,
    @Param('projectId', uuid) projectId: string,
    @Query({ schema: listTasksQuerySchema }) query: ListTasksQuery,
  ) {
    return this.tasksService.list(user, projectId, query);
  }

  @Get('tasks/:id')
  findOne(@CurrentUser() user: User, @Param('id', uuid) id: string) {
    return this.tasksService.findOne(user, id);
  }

  @Patch('tasks/:id')
  update(@CurrentUser() user: User, @Param('id', uuid) id: string, @Body({ schema: updateTaskSchema }) dto: UpdateTaskDto) {
    return this.tasksService.update(user, id, dto);
  }

  @Post('tasks/:id/status')
  @HttpCode(200)
  move(@CurrentUser() user: User, @Param('id', uuid) id: string, @Body({ schema: moveTaskSchema }) dto: MoveTaskDto) {
    return this.tasksService.move(user, id, dto);
  }
}
```

`POST /tasks/:id/status` changes an existing task, so it answers 200 rather than 201.

#### Comment on tasks

Only its author edits a comment. The record is enough for that, so the ability takes just the comment:

```typescript
@@filename(src/tasks/comment.policy)
import { Policy } from '@nestjs/authorization';
import type { Comment } from '../database/schema.js';
import type { User } from '../users/user.js';

@Policy()
export class CommentPolicy {
  // Only its author edits a comment: an admin can't edit someone else's either.
  edit(user: User, comment: Comment) {
    return comment.authorId === user.id;
  }
}
```

Its body schema, `commentSchema`, is in `tasks.schemas.ts` above. The service:

```typescript
@@filename(src/tasks/comments.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthorizationService } from '@nestjs/authorization';
import { InjectDrizzle } from '@nestjs/drizzle';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, asc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ProjectActivity } from '../activity/project-activity.js';
import { comments, projectMembers, tasks, type Comment } from '../database/schema.js';
import { MembershipsService } from '../projects/memberships.service.js';
import type { User } from '../users/user.js';
import { CommentPolicy } from './comment.policy.js';
import type { CommentDto } from './tasks.schemas.js';
import { TasksService } from './tasks.service.js';

@Injectable()
export class CommentsService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly tasksService: TasksService,
    private readonly memberships: MembershipsService,
    private readonly authorizationService: AuthorizationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** The task's comments, oldest first, for members of its project. */
  async list(user: User, taskId: string): Promise<Comment[]> {
    await this.tasksService.load(user, taskId);
    return this.db.select().from(comments).where(eq(comments.taskId, taskId)).orderBy(asc(comments.createdAt)).limit(200);
  }

  /** Any member comments on a task. */
  async create(user: User, taskId: string, { body }: CommentDto): Promise<Comment> {
    const { task } = await this.tasksService.load(user, taskId);
    const [comment] = await this.db.insert(comments).values({ taskId, authorId: user.id, body }).returning();
    this.emit({ type: 'comment.created', projectId: task.projectId, data: comment });
    return comment;
  }

  /** Only the author edits a comment. */
  async update(user: User, id: string, { body }: CommentDto): Promise<Comment> {
    const [row] = await this.db
      .select({ comment: comments, projectId: tasks.projectId, membership: projectMembers })
      .from(comments)
      .innerJoin(tasks, eq(tasks.id, comments.taskId))
      .leftJoin(projectMembers, and(eq(projectMembers.projectId, tasks.projectId), eq(projectMembers.userId, user.id)))
      .where(eq(comments.id, id));
    if (!row) {
      throw new NotFoundException('Comment not found');
    }
    await this.memberships.check(user, row.membership, 'Comment not found');
    await this.authorizationService.authorize(CommentPolicy, 'edit', user, row.comment);
    const [updated] = await this.db
      .update(comments)
      .set({ body, updatedAt: new Date() })
      .where(and(eq(comments.id, id), eq(comments.authorId, user.id)))
      .returning();
    if (!updated) {
      throw new NotFoundException('Comment not found');
    }
    this.emit({ type: 'comment.updated', projectId: row.projectId, data: updated });
    return updated;
  }

  private emit(activity: ProjectActivity) {
    this.eventEmitter.emit(activity.type, activity);
  }
}
```

The order of the checks in `update()` decides the status code: someone outside the project gets a 404, as for every record of a project, and a member who isn't the author gets a 403. The author is in the `UPDATE`'s `WHERE` clause too, so the statement can't change someone else's comment whatever happened before it.

```typescript
@@filename(src/tasks/comments.controller)
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { z } from 'zod';
import type { User } from '../users/user.js';
import { commentSchema, type CommentDto } from './tasks.schemas.js';
import { CommentsService } from './comments.service.js';

const uuid = { schema: z.uuid() };

@Can.Anyone()
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('tasks/:taskId/comments')
  list(@CurrentUser() user: User, @Param('taskId', uuid) taskId: string) {
    return this.commentsService.list(user, taskId);
  }

  @Post('tasks/:taskId/comments')
  create(@CurrentUser() user: User, @Param('taskId', uuid) taskId: string, @Body({ schema: commentSchema }) dto: CommentDto) {
    return this.commentsService.create(user, taskId, dto);
  }

  @Patch('comments/:id')
  update(@CurrentUser() user: User, @Param('id', uuid) id: string, @Body({ schema: commentSchema }) dto: CommentDto) {
    return this.commentsService.update(user, id, dto);
  }
}
```

`TasksModule` registers the tasks, the comments, their policies, and the reminder job of a later section:

```typescript
@@filename(src/tasks/tasks.module)
import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module.js';
import { CommentPolicy } from './comment.policy.js';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { RemindersJob } from './reminders.job.js';
import { TaskPolicy } from './task.policy.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [ProjectsModule],
  controllers: [TasksController, CommentsController],
  providers: [TasksService, CommentsService, TaskPolicy, CommentPolicy, RemindersJob],
})
export class TasksModule {}
```

#### Stream changes with server-sent events

A board that doesn't update itself shows changes only on a reload. [Server-Sent Events](/http/server-sent-events) push them: the browser keeps one HTTP response open, and the server writes an event to it for every change. The services already emit an event for each change through `EventEmitter2`; the stream listens to them.

An event says what changed, in which project, and carries the record as the database returned it:

```typescript
@@filename(src/activity/project-activity)
import type { Comment, Task } from '../database/schema.js';

/** Something that changed in a project, emitted after the change was written. */
export type ProjectActivity =
  | { type: 'task.created' | 'task.updated'; projectId: string; data: Task }
  | { type: 'comment.created' | 'comment.updated'; projectId: string; data: Comment };
```

The activity service listens for those events, and gives each project's stream only its own:

```typescript
@@filename(src/activity/activity.service)
import { Injectable, type MessageEvent } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { filter, interval, map, merge, of, Subject, type Observable } from 'rxjs';
import type { ProjectActivity } from './project-activity.js';

@Injectable()
export class ActivityService {
  // One listener for the whole application; each stream filters it.
  private readonly activity$ = new Subject<ProjectActivity>();

  @OnEvent('task.*')
  onTask(activity: ProjectActivity) {
    this.activity$.next(activity);
  }

  @OnEvent('comment.*')
  onComment(activity: ProjectActivity) {
    this.activity$.next(activity);
  }

  /** The project's activity as server-sent events. */
  stream(projectId: string): Observable<MessageEvent> {
    return merge(
      // Tells the client the stream is open: changes from here on reach it.
      of({ comment: 'connected' }),
      this.activity$.pipe(
        filter((activity) => activity.projectId === projectId),
        map(({ type, data }) => ({ type, data })),
      ),
      // Proxies close connections that stay silent; a comment every 20 seconds keeps it open.
      interval(20_000).pipe(map(() => ({ comment: 'keep-alive' }))),
    );
  }
}
```

- **There's one listener for the whole application.** `@OnEvent()` registers `onTask()` and `onComment()` once, at startup, and they push every event into a `Subject`; each open stream subscribes to it and keeps its own project's events. Adding a listener to the emitter for each connection instead would pass `maxListeners`, ten by default, with the eleventh browser tab, and EventEmitter2 would warn about a memory leak.
- **`type` becomes the event's name**, so a browser listens with `addEventListener('task.updated', ...)`, and `data` is sent as JSON (see [Usage](/http/server-sent-events#usage)).
- **The first message is a comment, `: connected`.** It tells the client, and the test at the end, that the stream is subscribed: changes from that moment on reach it. Comments are ignored by `EventSource`.
- **A comment every 20 seconds keeps the connection open** through proxies that close a silent response. When the client goes away, Nest unsubscribes from the `Observable`, which stops the interval and the subscription to the `Subject` ([Client disconnection](/http/server-sent-events#client-disconnection)).

The stream is for members of the project only. The obvious place for that check is the handler, as in the other controllers, but an `@Sse()` route sends its headers as soon as the handler is called: when an async handler then throws a `NotFoundException`, the client gets a `200` and a stream whose only event is `event: error` with `data: Project not found`. A guard runs before that, so its exception is a real 404:

```typescript
@@filename(src/activity/project-member.guard)
import { Injectable, NotFoundException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { z } from 'zod';
import { MembershipsService } from '../projects/memberships.service.js';
import type { User } from '../users/user.js';

/**
 * Checks that the user is a member of the route's project before the handler runs.
 * An `@Sse()` route sends its headers before an async handler settles, so a 404
 * thrown there would reach the client as an `error` event on a 200 stream.
 */
@Injectable()
export class ProjectMemberGuard implements CanActivate {
  constructor(private readonly memberships: MembershipsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user, params } = context.switchToHttp().getRequest<{ user: User; params: { projectId: string } }>();
    // Guards run before pipes, so the id isn't validated yet.
    if (!z.uuid().safeParse(params.projectId).success) {
      throw new NotFoundException('Project not found');
    }
    await this.memberships.access(user, params.projectId);
    return true;
  }
}
```

The controller puts that guard in front of the stream:

```typescript
@@filename(src/activity/activity.controller)
import { Controller, Param, Sse, UseGuards, type MessageEvent } from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import type { Observable } from 'rxjs';
import { ActivityService } from './activity.service.js';
import { ProjectMemberGuard } from './project-member.guard.js';

@Can.Anyone()
@UseGuards(ProjectMemberGuard)
@Controller('projects/:projectId/events')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  // Only members get here: ProjectMemberGuard checked the project before the stream started.
  @Sse()
  stream(@Param('projectId') projectId: string): Observable<MessageEvent> {
    return this.activityService.stream(projectId);
  }
}
```

The activity module registers the controller and the service, and imports the projects module for the guard's membership check:

```typescript
@@filename(src/activity/activity.module)
import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module.js';
import { ActivityController } from './activity.controller.js';
import { ActivityService } from './activity.service.js';

@Module({
  imports: [ProjectsModule],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}
```

`ProjectMemberGuard` runs after the global guards, so the user is signed in by then, and it reuses `MembershipsService.access()`, so the stream and the rest of the API answer non-members alike. The handler itself only returns the `Observable`.

> info **Hint** The browser's `EventSource` can't send an `Authorization` header, and this API takes its access tokens from that header. In the browser, read the stream with `fetch()`, which sends the header and returns the body as a stream, as the test at the end does, or with a library that wraps it.

#### Remind assignees before tasks are due

Once a minute, a job reminds the assignee of every open task due within a day. [`@nestjs/schedule`](/application/task-scheduling) runs it, and with more than one instance of the API, it runs on every instance: [`@OnOneInstance()`](/application/task-scheduling#running-on-several-instances) from `@nestjs/locks` keeps it on one. The instances agree on which one through a lock store they share, and the package defines the store's contract and leaves the store to the application. Take `DrizzleLockStore` from [Keep locks in your database](/reliability/locks#keep-locks-in-your-database), the Drizzle version, and save it as `src/database/drizzle-lock.store.ts`. It works on the `locks` table and sequence of the schema above. Make one change: the chapter's application has a `Database` type of its own, from `./drizzle.js`, so import `NodePgDatabase` from `drizzle-orm/node-postgres` in its place, and type the constructor's `db` parameter with it.

Each of the store's methods is one conditional statement, so of any number of instances racing for a lock, exactly one gets it; the chapter explains each. The store registers itself from its constructor, and `AppModule` lists it as a provider. At startup, the locks module logs the store it uses:

```bash
LOG [LocksModule] LocksStorage: DrizzleLockStore
```

The job:

```typescript
@@filename(src/tasks/reminders.job)
import { Injectable, Logger } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { OnOneInstance } from '@nestjs/locks';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, isNull, lte, ne, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { tasks, users } from '../database/schema.js';

@Injectable()
export class RemindersJob {
  private readonly logger = new Logger(RemindersJob.name);

  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  /** Reminds assignees of open tasks due within a day, once per task. Returns how many it sent. */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'task-reminders' })
  @OnOneInstance({ key: 'tasks:due-reminders' })
  async sendReminders(): Promise<number> {
    // Claims the tasks in the statement that finds them: of two runs at once, each task goes to one.
    const due = await this.db
      .update(tasks)
      .set({ remindedAt: new Date() })
      .from(users)
      .where(
        and(
          eq(users.id, tasks.assigneeId),
          isNull(tasks.remindedAt),
          ne(tasks.status, 'done'),
          lte(tasks.dueAt, sql`now() + interval '1 day'`),
        ),
      )
      .returning({ id: tasks.id, title: tasks.title, dueAt: tasks.dueAt, email: users.email });
    for (const task of due) {
      // Send the email here, for example with @nestjs/mail.
      this.logger.log(`Reminder to ${task.email}: "${task.title}" is due ${task.dueAt?.toISOString()}`);
    }
    return due.length;
  }
}
```

- **The job claims the tasks in the statement that finds them.** `UPDATE ... SET reminded_at = now() WHERE reminded_at IS NULL ... RETURNING` both selects the due tasks and marks them, so of two runs that overlap, each task is returned to one of them. A `SELECT` followed by an `UPDATE` would hand the same tasks to both, and the test at the end shows it: three overlapping runs of that version sent three reminders for one task.
- **`@OnOneInstance()` keeps the scan on one instance.** The first instance whose scheduler fires the job takes its lease, and the others skip their ticks. When that instance stops, another one takes the job over at its next tick (see [Run each job on one instance](/reliability/locks#run-each-job-on-one-instance)). The claim makes duplicates impossible on its own; the lease saves the other instances the work, and keeps the job's runs, and its logs, in one place.
- **A reminder is claimed before it's sent.** If sending fails, that reminder is lost rather than sent twice. For email, send it with [`@nestjs/mail`](/application/mail), from a [queue](/application/queues) that retries.
- **Missed ticks catch up by themselves.** The job takes everything that is due, not "the last minute's" tasks, so a tick that didn't run is covered by the next one.

The [last step of Try it](/tutorials/project-management-api#try-it) shows a reminder going out.

#### Try it

Start the application:

```bash
$ npm run start:dev
```

Sign up Ada, Bob and Eve, as in the JWT tutorial, and keep their access tokens in variables (tokens and long bodies are shortened here and below):

```bash
$ curl localhost:3000/auth/sign-up --json '{"email":"ada@example.com","password":"correct horse battery"}'
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","refreshToken":"...","expiresIn":900}
$ ADA="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
$ BOB="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
$ EVE="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

Ada creates a project, and is its admin. Eve, who isn't in it, gets a 404 for it. Ada adds Bob, who can see the members but can't add anyone himself:

```bash
$ curl localhost:3000/projects -H "$ADA" --json '{"name":"Website relaunch"}'
{"id":"b1dddeba-0a00-4997-9ed4-eec8e255e2fa","name":"Website relaunch","createdAt":"2026-11-19T22:15:10.624Z","role":"admin"}
$ PROJECT=b1dddeba-0a00-4997-9ed4-eec8e255e2fa
$ curl -i localhost:3000/projects/$PROJECT/tasks -H "$EVE"
HTTP/1.1 404 Not Found
{"message":"Project not found","error":"Not Found","statusCode":404}
$ curl localhost:3000/projects/$PROJECT/members -H "$ADA" --json '{"email":"bob@example.com"}'
{"userId":"c1ffc2db-5cf3-4835-b05a-1e0daf80903b","email":"bob@example.com","role":"member"}
$ curl -i localhost:3000/projects/$PROJECT/members -H "$BOB" --json '{"email":"eve@example.com"}'
HTTP/1.1 403 Forbidden
{"message":"Forbidden","statusCode":403}
$ curl localhost:3000/projects/$PROJECT/members -H "$BOB"
[{"userId":"8290d579-c516-4f78-9688-7bae25ba082c","email":"ada@example.com","role":"admin"},{"userId":"c1ffc2db-5cf3-4835-b05a-1e0daf80903b","email":"bob@example.com","role":"member"}]
```

A task can't be assigned to Eve, who isn't a member. Ada assigns it to Bob instead, and Bob adds one of his own:

```bash
$ curl localhost:3000/projects/$PROJECT/tasks -H "$ADA" --json '{"title":"Write the launch post","assigneeId":"8e73d73c-58e6-419a-a717-c77d845a6b9c"}'
{"message":"The assignee is not a member of this project","error":"Bad Request","statusCode":400}
$ curl localhost:3000/projects/$PROJECT/tasks -H "$ADA" --json '{"title":"Write the launch post","assigneeId":"c1ffc2db-5cf3-4835-b05a-1e0daf80903b","dueAt":"2026-12-01T17:00:00+01:00"}'
{"id":"b9690f26-f034-4985-b635-2bd112d5b132","projectId":"b1dddeba-...","title":"Write the launch post","description":"","status":"todo","assigneeId":"c1ffc2db-...","dueAt":"2026-12-01T16:00:00.000Z","remindedAt":null,"createdAt":"2026-11-19T22:15:10.951Z","updatedAt":"2026-11-19T22:15:10.951Z"}
$ curl localhost:3000/projects/$PROJECT/tasks -H "$BOB" --json '{"title":"Fix the footer links"}'
{"id":"a77318f3-3f27-4bb0-bc4b-fe8c0c12057b",...,"title":"Fix the footer links","description":"","status":"todo","assigneeId":null,...}
```

Bob created the second task, but nobody is assigned to it and Bob isn't an admin, so he can't change it. And the status isn't a field of the update:

```bash
$ curl -i -X PATCH localhost:3000/tasks/a77318f3-3f27-4bb0-bc4b-fe8c0c12057b -H "$BOB" --json '{"title":"Fix footer links"}'
HTTP/1.1 403 Forbidden
{"message":"Forbidden","statusCode":403}
$ curl -X PATCH localhost:3000/tasks/b9690f26-f034-4985-b635-2bd112d5b132 -H "$BOB" --json '{"status":"done"}'
{"message":["Unrecognized key: \"status\""],"error":"Bad Request","statusCode":400}
```

Bob starts his task. Ada, whose board still showed it in `todo`, tries to close it from there, and is told to look again:

```bash
$ curl -X POST localhost:3000/tasks/b9690f26-f034-4985-b635-2bd112d5b132/status -H "$BOB" --json '{"from":"todo","to":"in_progress"}'
{"id":"b9690f26-f034-4985-b635-2bd112d5b132",...,"status":"in_progress",...,"updatedAt":"2026-11-19T22:15:11.149Z"}
$ curl -X POST localhost:3000/tasks/b9690f26-f034-4985-b635-2bd112d5b132/status -H "$ADA" --json '{"from":"todo","to":"done"}'
{"message":"Task is no longer todo","error":"Conflict","statusCode":409}
```

The list, filtered, then a page at a time:

```bash
$ curl "localhost:3000/projects/$PROJECT/tasks?status=in_progress&assigneeId=c1ffc2db-5cf3-4835-b05a-1e0daf80903b" -H "$ADA"
{"items":[{"id":"b9690f26-f034-4985-b635-2bd112d5b132",...,"title":"Write the launch post",...,"status":"in_progress",...}],"nextCursor":null}
$ curl "localhost:3000/projects/$PROJECT/tasks?limit=1" -H "$ADA"
{"items":[{"id":"a77318f3-3f27-4bb0-bc4b-fe8c0c12057b",...,"title":"Fix the footer links",...}],"nextCursor":"WyIyMDI2LTExLTE5VDIyOjE1OjExLjAzOVoiLCJhNzczMThmMy0zZjI3LTRiYjAtYmM0Yi1mZThjMGMxMjA1N2IiXQ"}
$ curl "localhost:3000/projects/$PROJECT/tasks?limit=1&after=WyIyMDI2LTExLTE5VDIyOjE1OjExLjAzOVoiLCJhNzczMThmMy0zZjI3LTRiYjAtYmM0Yi1mZThjMGMxMjA1N2IiXQ" -H "$ADA"
{"items":[{"id":"b9690f26-f034-4985-b635-2bd112d5b132",...,"title":"Write the launch post",...}],"nextCursor":null}
$ curl "localhost:3000/projects/$PROJECT/tasks?dueBefore=2026-12-24&after=abc" -H "$ADA"
{"message":["dueBefore: Invalid ISO datetime","after: Invalid cursor"],"error":"Bad Request","statusCode":400}
```

Bob comments. Ada is an admin, and still can't edit his comment:

```bash
$ curl localhost:3000/tasks/b9690f26-f034-4985-b635-2bd112d5b132/comments -H "$BOB" --json '{"body":"First draft is in the doc."}'
{"id":"022d3d18-54e4-41ec-936e-8ab377731af8","taskId":"b9690f26-...","authorId":"c1ffc2db-...","body":"First draft is in the doc.","createdAt":"2026-11-19T22:15:11.352Z","updatedAt":"2026-11-19T22:15:11.352Z"}
$ curl -X PATCH localhost:3000/comments/022d3d18-54e4-41ec-936e-8ab377731af8 -H "$ADA" --json '{"body":"Rewritten"}'
{"message":"Forbidden","statusCode":403}
```

The stream answers Eve with a plain 404, and a request without a token with a 401, before any stream starts. Ada opens it (`-N` turns off curl's buffering), and in another terminal Bob closes his task and comments on it:

```bash
$ curl -i localhost:3000/projects/$PROJECT/events -H "$EVE"
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8
{"message":"Project not found","error":"Not Found","statusCode":404}
$ curl -N localhost:3000/projects/$PROJECT/events -H "$ADA"
: connected

event: task.updated
id: 1
data: {"id":"b9690f26-f034-4985-b635-2bd112d5b132",...,"status":"done",...,"updatedAt":"2026-11-19T22:15:12.507Z"}

event: comment.created
id: 2
data: {"id":"8970ada9-2ce4-4a7f-9144-e12069fbd9a0","taskId":"b9690f26-...","authorId":"c1ffc2db-...","body":"Published.",...}
```

Any member reads a task's comments, oldest first, and Eve gets a 404 for them:

```bash
$ curl localhost:3000/tasks/b9690f26-f034-4985-b635-2bd112d5b132/comments -H "$BOB"
[{"id":"022d3d18-54e4-41ec-936e-8ab377731af8",...,"body":"First draft is in the doc.",...},{"id":"8970ada9-2ce4-4a7f-9144-e12069fbd9a0",...,"body":"Published.",...}]
$ curl -i localhost:3000/tasks/b9690f26-f034-4985-b635-2bd112d5b132/comments -H "$EVE"
HTTP/1.1 404 Not Found
{"message":"Task not found","error":"Not Found","statusCode":404}
```

Last, a task due within a day. At the first tick after startup, the instance takes the job's lease, and at the first tick after the task exists, the job reminds Bob, once:

```bash
$ curl localhost:3000/projects/$PROJECT/tasks -H "$ADA" --json '{"title":"Send the newsletter","assigneeId":"c1ffc2db-5cf3-4835-b05a-1e0daf80903b","dueAt":"2026-11-20T01:00:00Z"}'
{"id":"e0b29e6d-cc14-4251-a64e-61fbe530e072",...,"title":"Send the newsletter",...,"dueAt":"2026-11-20T01:00:00.000Z","remindedAt":null,...}
```

The log shows the lease being taken, and the reminder:

```bash
LOG [Locks] RemindersJob.sendReminders runs on this instance (lease "tasks:due-reminders:owner", fencing token 1)
LOG [RemindersJob] Reminder to bob@example.com: "Send the newsletter" is due 2026-11-20T01:00:00.000Z
```

#### Test it

As in the e-commerce tutorial, the guarantees that matter here are about concurrency, and an in-process database such as PGlite has a single connection, where requests never truly race. So the tests run against a real PostgreSQL server, through a connection pool. The stream test reads a real HTTP response, so the application listens on a free port, and the others send requests with `app.inject()`:

```typescript
@@filename(test/projects.e2e-spec)
import { fileURLToPath } from 'node:url';
import { PasswordHasher } from '@nestjs/authentication';
import { getDrizzleToken } from '@nestjs/drizzle';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { onTestFinished } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { tasks } from '../src/database/schema.js';
import { RemindersJob } from '../src/tasks/reminders.job.js';

// A real PostgreSQL with a pool, so concurrent requests really race.
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('Project management API (e2e)', () => {
  const db = drizzle({ client: new Pool({ connectionString: url, max: 20 }) });
  let app: NestNodeApplication;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    await db.execute(sql`TRUNCATE users, projects, refresh_tokens, locks CASCADE`);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(db)
      // scrypt at the default cost takes 128 MiB and a few hundred ms per hash.
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .compile();
    app = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter());
    // The stream test reads a real response, so the application listens.
    await app.listen(0, '127.0.0.1');
    // The test runs the reminder job itself.
    app.get(SchedulerRegistry).getCronJob('task-reminders').stop();
  });

  afterAll(() => app.close()); // closes the pool too

  let clients = 0;

  /** Signs a user up. Each user has an address of their own: requests are rate-limited per IP address. */
  async function signUp(name: string) {
    const remoteAddress = `10.0.0.${++clients}`;
    const payload = { email: `${name}@example.com`, password: 'correct horse battery' };
    const res = await app.inject({ method: 'POST', url: '/auth/sign-up', payload, remoteAddress });
    const headers = { authorization: `Bearer ${res.json<{ accessToken: string }>().accessToken}` };
    const me = await app.inject({ method: 'GET', url: '/me', headers, remoteAddress });
    return { id: me.json<{ id: string }>().id, headers, remoteAddress };
  }
  type Client = Awaited<ReturnType<typeof signUp>>;

  const call = ({ headers, remoteAddress }: Client, method: 'GET' | 'POST' | 'PATCH', url: string, payload?: object) =>
    app.inject({ method, url, headers, remoteAddress, payload });

  /** A project of `admin`'s, with `members` added. */
  async function createProject(admin: Client, ...members: string[]) {
    const { id } = (await call(admin, 'POST', '/projects', { name: 'Website relaunch' })).json<{ id: string }>();
    for (const name of members) {
      await call(admin, 'POST', `/projects/${id}/members`, { email: `${name}@example.com` });
    }
    return id;
  }

  async function createTask(client: Client, projectId: string, payload: object = {}) {
    const res = await call(client, 'POST', `/projects/${projectId}/tasks`, { title: 'Write the launch post', ...payload });
    return res.json<{ id: string }>().id;
  }

  let ada: Client, bob: Client, carol: Client, eve: Client;
  beforeAll(async () => {
    [ada, bob, carol, eve] = await Promise.all(['ada', 'bob', 'carol', 'eve'].map(signUp));
  });

  it('checks every request against the project, the task or the comment', async () => {
    const projectId = await createProject(ada, 'bob', 'carol');
    const taskId = await createTask(ada, projectId, { assigneeId: bob.id });
    const rename = (client: Client) => call(client, 'PATCH', `/tasks/${taskId}`, { title: 'Write the launch post, v2' });

    expect((await call(eve, 'GET', `/projects/${projectId}/tasks`)).statusCode).toBe(404); // not a member
    expect((await call(bob, 'POST', `/projects/${projectId}/members`, { email: 'eve@example.com' })).statusCode).toBe(403);
    expect((await rename(eve)).statusCode).toBe(404);
    expect((await rename(carol)).statusCode).toBe(403); // a member, but not the assignee
    expect((await rename(bob)).statusCode).toBe(200);
    expect((await rename(ada)).statusCode).toBe(200); // an admin
    expect((await call(ada, 'PATCH', `/tasks/${taskId}`, { assigneeId: eve.id })).statusCode).toBe(400);

    const comment = await call(carol, 'POST', `/tasks/${taskId}/comments`, { body: 'Looks good' });
    const commentUrl = `/comments/${comment.json<{ id: string }>().id}`;
    expect((await call(bob, 'GET', `/tasks/${taskId}/comments`)).json()).toHaveLength(1);
    expect((await call(eve, 'GET', `/tasks/${taskId}/comments`)).statusCode).toBe(404);
    expect((await call(ada, 'PATCH', commentUrl, { body: 'Edited by an admin' })).statusCode).toBe(403);
    expect((await call(carol, 'PATCH', commentUrl, { body: 'Looks great' })).statusCode).toBe(200);
  });

  it('moves a task once when ten moves from the same status race', async () => {
    const projectId = await createProject(ada, 'bob');
    const taskId = await createTask(ada, projectId, { assigneeId: bob.id });

    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        call(i % 2 ? ada : bob, 'POST', `/tasks/${taskId}/status`, { from: 'todo', to: i % 2 ? 'in_progress' : 'done' }),
      ),
    );

    expect(results.map((res) => res.statusCode).sort()).toEqual([200, ...Array(9).fill(409)]);
  });

  it('pages through tasks created at the same instant without gaps or repeats', async () => {
    const projectId = await createProject(ada);
    // One statement: all five rows get the same created_at.
    await db.insert(tasks).values(Array.from({ length: 5 }, (_, i) => ({ projectId, title: `Task ${i}`, description: '' })));

    const seen: string[] = [];
    let after = '';
    do {
      const res = await call(ada, 'GET', `/projects/${projectId}/tasks?limit=2${after && `&after=${after}`}`);
      const page = res.json<{ items: { id: string }[]; nextCursor: string | null }>();
      seen.push(...page.items.map((task) => task.id));
      after = page.nextCursor ?? '';
    } while (after);

    expect(new Set(seen).size).toBe(5);
    expect(seen).toHaveLength(5);
  });

  it("streams a project's changes to its members, and nobody else's", async () => {
    const [projectA, projectB] = [await createProject(ada, 'bob'), await createProject(ada)];
    const [taskA, taskB] = [await createTask(ada, projectA), await createTask(ada, projectB)];

    expect((await fetch(`${await app.getUrl()}/projects/${projectA}/events`, { headers: eve.headers })).status).toBe(404);

    const stream = await openStream(bob, projectA);
    await stream.readUntil(': connected');
    // A change in a project Bob isn't in, then one in his.
    await call(ada, 'PATCH', `/tasks/${taskB}`, { title: 'Not for Bob' });
    await call(ada, 'PATCH', `/tasks/${taskA}`, { title: 'For Bob' });

    const received = await stream.readUntil(`"id":"${taskA}"`);
    expect(received).toContain('event: task.updated');
    expect(received).not.toContain(taskB);
  });

  it('reminds each assignee once, however many runs overlap', async () => {
    const job = app.get(RemindersJob);
    await job.sendReminders(); // takes the job's lease: from here on, every call on this instance runs
    const projectId = await createProject(ada, 'bob');
    const dueAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await createTask(ada, projectId, { assigneeId: bob.id, dueAt });
    const doneTask = await createTask(ada, projectId, { assigneeId: bob.id, dueAt });
    await call(bob, 'POST', `/tasks/${doneTask}/status`, { from: 'todo', to: 'done' });

    const sent = await Promise.all([1, 2, 3].map(() => job.sendReminders()));

    expect(sent.reduce((sum, count) => sum + count, 0)).toBe(1);
    expect(await job.sendReminders()).toBe(0);
  });

  /** Opens a project's event stream as `client`. */
  async function openStream(client: Client, projectId: string) {
    const controller = new AbortController();
    // Closed when the test ends, pass or fail: an open response would keep app.close() waiting.
    onTestFinished(() => controller.abort());
    const url = `${await app.getUrl()}/projects/${projectId}/events`;
    const res = await fetch(url, { headers: client.headers, signal: controller.signal });
    const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
    let received = '';
    return {
      /** Reads until `text` has arrived, and returns everything received. */
      async readUntil(text: string) {
        while (!received.includes(text)) {
          const { value, done } = await reader.read();
          if (done) {
            throw new Error('The stream ended');
          }
          received += value;
        }
        return received;
      },
    };
  }
});
```

- **Every user sends their requests from an address of their own**, as in production: sign-up is limited to 10 an hour per IP address, and every route to 100 a minute.
- **The cron is stopped** through `SchedulerRegistry` (see [Dynamic cron jobs](/application/task-scheduling#dynamic-cron-jobs)), so the test calls the job when it chooses, and a tick at the turn of a minute can't claim the test's tasks first. The first call takes the job's lease; after that, every call on this instance runs, so the three calls really overlap.
- **The stream is closed when its test ends**, pass or fail: an open response would keep `app.close()` waiting for it.

Create a database for the tests, since they truncate the tables, and run them with the JWT tutorial's refresh-token store test, one file after the other:

```bash
$ docker exec projects-db psql -U postgres -c "CREATE DATABASE projects_test"
$ TEST_DATABASE_URL=postgres://postgres:projects@localhost:5432/projects_test npm run test:e2e -- --no-file-parallelism

 Test Files  2 passed (2)
      Tests  10 passed (10)
```

Replace the status condition in `move()` with a check of the status that `load()` read, and "moves a task once" fails: three of the ten moves succeeded in the run that tried it. Store `created_at` with PostgreSQL's default precision, and the paging test sees two of the five tasks.

#### Production checklist

Everything in the JWT tutorial's [checklist](/tutorials/rest-api-jwt-authentication#production-checklist) applies. For this API in particular:

- **Fan the events out between instances.** `EventEmitter2` is in-process: with two instances, a change saved on one reaches the streams open on that one only. Put a shared channel between the services and the stream, such as PostgreSQL's `LISTEN`/`NOTIFY` or Redis pub/sub, and keep the `Subject` per instance.
- **Have clients reload after a reconnect.** Events are sent once, to the streams open at that moment, and not stored, so a client that was disconnected for a minute missed that minute. An `EventSource` reconnects by itself; on reconnecting, the client fetches the task list again.
- **Check the proxy in front of the stream.** Nest sends `X-Accel-Buffering: no` and the keep-alive comment every 20 seconds keeps idle connections open, but a load balancer with a shorter idle timeout, or one that buffers responses, still cuts or delays the stream. Every open stream is also an open connection: size the proxy's and the server's connection limits for one per open browser tab.
- **Set `NODE_ENV` to `production`**, as the JWT tutorial's checklist says. `LocksModule` then refuses to start without a registered lock store, as the authentication module does without its refresh-token store, instead of running every job on every instance.
- **Run the lock store's contract suite in CI.** `lockStoreContract()` from `@nestjs/locks/testing` checks every rule of [the store contract](/reliability/locks#the-store-contract), races included with `concurrent: true`, against the PostgreSQL version you run.
- **Remove members carefully.** The assignee foreign key refuses to delete a membership while that member has tasks assigned. Unassign them in the same transaction as the removal, and close the member's open streams, which checked membership once, when they opened.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the platform's environment: `start:prod` doesn't load `.env`. [NestJS Observe](/observability/overview) then reports the latency of every route, its average and p95, so a filter combination that misses its index shows up as a slow `GET /projects/:projectId/tasks`. It reports cron runs as jobs, with their duration and outcome, and a job silence alert fires when the reminder job stops reporting, which a crashed scheduler never tells you itself (see [Knowing a cron job actually ran](/application/task-scheduling#knowing-a-cron-job-actually-ran)).

#### What's next

- Invite people who don't have an account yet, by email: [Mail](/application/mail), with a single-use token.
- Send the reminders by email with retries: [Mail](/application/mail) and [Queues](/application/queues).
- Let users reorder tasks within a column, or move them between projects; both are conditional updates like `move()`.
- See which routes and jobs are slow in production, request by request: [Observability](/observability/overview).
- Build an e-commerce backend on the same foundation: [Build an e-commerce backend](/tutorials/ecommerce-backend).
