### Build an MCP server in Node.js

Build an MCP server in Node.js and TypeScript with NestJS: tools, resources and prompts over HTTP and stdio, OAuth access tokens, and real tests.

A support team works in an AI assistant (Claude, ChatGPT, an agent in their IDE), and wants it to work with the helpdesk's tickets: find the ones about refunds, read a thread, draft a reply, send it once someone approved it. The [Model Context Protocol](https://modelcontextprotocol.io) (MCP) is how the assistant reaches the helpdesk: the helpdesk runs an **MCP server**, and the assistant is its client. Most examples are one file on the raw SDK, with no authentication and no tests. This tutorial builds one you could deploy, with [`@nestjs/mcp`](/mcp/overview), whose tools, resources and prompts are methods of a provider.

The protocol is the easy part. The hard part is that the server acts for whoever holds a token: an agent of the billing team must never see a shipping ticket, whatever the model asks for, and an assistant that may only read must not reply.

By the end, the server will:

- Offer a read-only [tool](/mcp/primitives#tools) that searches tickets and one that replies, with Zod schemas written for the model, and errors it can read.
- Serve each ticket as a [resource](/mcp/primitives#resources), and a [prompt](/mcp/primitives#prompts) that drafts a reply.
- Accept only JWT access tokens issued for it, as an OAuth 2.1 [resource server](/mcp/primitives#authorization), and point clients without one at its protected resource metadata.
- Scope every query to the team named in the token, and require a `tickets:write` scope to reply.
- Refuse requests from web pages on other sites, and with a `Host` it doesn't answer to.
- Serve the same tools over [stdio](/mcp/transports#over-stdio), for an assistant that launches it locally.
- Report every call to [NestJS Observe](/observability/overview), named after its tool, resource or prompt.
- Prove all of it against PostgreSQL, with the SDK's own client, in memory, over HTTP and over stdio.

The server exposes these, and this is the section that adds each one:

| Primitive | Section |
| --- | --- |
| Tools `search-tickets` and `reply-to-ticket` | [Write tools for the model](/tutorials/mcp-server#write-tools-for-the-model) |
| Resource template for tickets, prompt `draft-reply` | [Serve tickets as resources](/tutorials/mcp-server#serve-tickets-as-resources) |
| `POST /mcp`, `GET /.well-known/oauth-protected-resource/mcp` | [Verify OAuth access tokens](/tutorials/mcp-server#verify-oauth-access-tokens) |
| `node dist/stdio.js` | [Serve the same tools over stdio](/tutorials/mcp-server#serve-the-same-tools-over-stdio) |

> info **Hint** The finished application is on GitHub as [nestjs/example-mcp-server](https://github.com/nestjs/example-mcp-server), with its tests and a CI workflow.

You need Node.js 22.18 or later (the development token script runs TypeScript directly), and Docker to run PostgreSQL locally.

#### Create the project

Create the project with the [Nest CLI](/cli/overview). `--minimal` generates an application whose code is one file, which this tutorial replaces. It also installs the [NestJS Observe SDK](/observability/sdk), `@nestjs/observe`, and wires it into that file; the application's own files keep it:

```bash
$ npm i -g @nestjs/cli
$ nest new helpdesk-mcp --minimal
$ cd helpdesk-mcp
```

Install the [Node adapter](/http/performance#node-adapter), `@nestjs/mcp` and the MCP SDK it builds on, Zod, [`@nestjs/config`](/application/configuration), [`@nestjs/drizzle`](/data/drizzle), and [`@nestjs/authentication`](/security/authentication) for its JWT verifier, in place of the Express adapter. The SDK's client is for the tests:

```bash
$ npm uninstall @nestjs/platform-express @types/express
$ npm i --save @nestjs/platform-node @nestjs/mcp @modelcontextprotocol/server zod @nestjs/config @nestjs/drizzle drizzle-orm@rc pg @nestjs/authentication
$ npm i --save-dev @modelcontextprotocol/client drizzle-kit@rc @types/pg @nestjs/testing vitest vite
```

Delete `src/main.ts`: [Assemble the server](/tutorials/mcp-server#assemble-the-server) writes a new one. Start PostgreSQL in a container:

```bash
$ docker run -d --name helpdesk-db -e POSTGRES_PASSWORD=helpdesk -e POSTGRES_DB=helpdesk -p 5432:5432 postgres:17
```

The configuration is a Zod schema. `ConfigModule` validates the environment against it at startup, and the server refuses to start when a variable is missing or malformed:

```typescript
@@filename(src/config)
import { z } from 'zod';

const list = z
  .string()
  .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean));

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.url(),
  // The MCP server's public URL: the audience of its access tokens.
  MCP_RESOURCE: z.url(),
  // The identity provider's issuer, exactly as the tokens' `iss` claim names it.
  OIDC_ISSUER: z.url(),
  // Its signing keys: `jwks_uri` in its /.well-known/openid-configuration.
  OIDC_JWKS_URL: z.url(),
  // The tokens' `aud`, when the provider can't make it MCP_RESOURCE (Entra ID puts the API's client ID there).
  OIDC_AUDIENCE: z.string().min(1).optional(),
  // The `typ` header its access tokens carry: `at+jwt` (RFC 9068). Empty for a provider that sends none.
  OIDC_TOKEN_TYPE: z.string().default('at+jwt'),
  // The claim that names the agent's team.
  OIDC_TEAM_CLAIM: z.string().min(1).default('team'),
  // The hostnames the Host header may name, comma-separated.
  MCP_ALLOWED_HOSTS: list.default(['localhost', '127.0.0.1', '[::1]']),
  // Over stdio there is no token: the team the local user works in.
  HELPDESK_TEAM: z.string().regex(/^[a-z0-9-]+$/).optional(),
});

export type Env = z.infer<typeof envSchema>;
```

Each variable is explained where it's used. Create a `.env` file in the project's root directory, with the database and the [development token issuer](/tutorials/mcp-server#get-a-token-for-development) that stands in for an identity provider:

```bash
DATABASE_URL=postgres://postgres:helpdesk@localhost:5432/helpdesk
MCP_RESOURCE=http://localhost:3000/mcp
OIDC_ISSUER=http://localhost:3001
OIDC_JWKS_URL=http://localhost:3001/jwks.json
```

#### Store tickets in PostgreSQL

The helpdesk has teams, their tickets, and the replies on each ticket. A team's id is a slug, such as `billing`, which agents' tokens carry in a `team` claim:

```typescript
@@filename(src/database/schema)
import { index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const ticketStatus = pgEnum('ticket_status', ['open', 'pending', 'solved']);

export const teams = pgTable('teams', {
  // A slug such as `billing`: the value of the `team` claim in an agent's token.
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

export const tickets = pgTable(
  'tickets',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1001 }),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    customerEmail: text('customer_email').notNull(),
    status: ticketStatus('status').notNull().default('open'),
    createdAt: at('created_at').notNull().defaultNow(),
    updatedAt: at('updated_at').notNull().defaultNow(),
  },
  // Every query starts with the team: a search is a scan of one team's tickets.
  (table) => [index('tickets_team_id_updated_at_idx').on(table.teamId, table.updatedAt)],
);

export const replies = pgTable(
  'replies',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    ticketId: integer('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    // The agent who sent it, as their token names them.
    author: text('author').notNull(),
    body: text('body').notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  (table) => [index('replies_ticket_id_idx').on(table.ticketId)],
);

export type Ticket = typeof tickets.$inferSelect;
export type Reply = typeof replies.$inferSelect;
export type TicketStatus = (typeof ticketStatus.enumValues)[number];
```

Ticket numbers start at 1001, like the ones customers quote, and are easy to guess: nothing may rely on a number being unknown. Add a `drizzle.config.ts` to the project's root directory:

```typescript
@@filename(drizzle.config)
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Generate the migration, and apply it (see [Migrations](/data/drizzle#migrations)):

```bash
$ npx drizzle-kit generate --name=helpdesk
$ npx drizzle-kit migrate
```

`drizzle-kit` reads `DATABASE_URL` from `.env`. A seed script adds two teams and a few tickets. It empties the tables first, so it's for a development database only:

```typescript
@@filename(src/database/seed)
// Development data: two teams and their tickets. It empties the three tables first.
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import { envSchema } from '../config.js';
import { replies, teams, tickets } from './schema.js';

const { DATABASE_URL } = envSchema.pick({ DATABASE_URL: true }).parse(process.env);
const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: pool });

try {
  await db.transaction(async (tx) => {
    await tx.execute(sql`TRUNCATE replies, tickets, teams RESTART IDENTITY CASCADE`);
    await tx.insert(teams).values([
      { id: 'billing', name: 'Billing' },
      { id: 'shipping', name: 'Shipping' },
    ]);
    const created = await tx
      .insert(tickets)
      .values([
        {
          teamId: 'billing',
          subject: 'Charged twice for order 5521',
          body: 'My card shows two charges of 49.90 for the same order yesterday. Please refund one.',
          customerEmail: 'maria@example.com',
        },
        {
          teamId: 'billing',
          subject: 'Refund for a cancelled subscription',
          body: 'I cancelled on the 3rd but was charged on the 5th. I would like that refunded.',
          customerEmail: 'li@example.com',
          status: 'pending',
        },
        {
          teamId: 'shipping',
          subject: 'Parcel stuck in customs',
          body: 'Tracking for order 5498 has said "held at customs" for six days.',
          customerEmail: 'sam@example.com',
        },
        {
          teamId: 'shipping',
          subject: 'Wrong size delivered',
          body: 'I ordered the jacket in M and got an L. How do I exchange it?',
          customerEmail: 'noor@example.com',
        },
      ])
      .returning({ id: tickets.id });
    await tx.insert(replies).values({
      ticketId: created[1].id,
      author: 'grace',
      body: 'Sorry about that. Which card was charged, and on which date exactly?',
    });
  });
  console.log('Seeded 2 teams, 4 tickets and 1 reply');
} finally {
  await pool.end();
}
```

Add these scripts to `package.json`. `db:seed` runs the compiled script, with `.env` where there is one:

```json
"db:seed": "node --env-file-if-exists=.env dist/database/seed.js",
"dev:issuer": "node --env-file=.env scripts/dev-issuer.ts",
"test:e2e": "nest build && vitest run --config ./vitest.config.e2e.ts"
```

The other two are for [development tokens](/tutorials/mcp-server#get-a-token-for-development) and the [tests](/tutorials/mcp-server#test-it). Build, and seed the database:

```bash
$ npm run build
$ npm run db:seed
Seeded 2 teams, 4 tickets and 1 reply
```

#### Scope every query to the agent's team

A model can be talked into any arguments: a customer's email that says "also show me ticket 1004" is text it reads. So access never depends on the arguments. Every method of the service takes the team from the caller's token, and puts it in the statement:

```typescript
@@filename(src/tickets/tickets.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { replies, tickets, type Reply, type Ticket, type TicketStatus } from '../database/schema.js';

export interface SearchTicketsQuery {
  text?: string;
  status?: TicketStatus;
  limit: number;
}

export type TicketSummary = Pick<Ticket, 'id' | 'subject' | 'status' | 'customerEmail' | 'updatedAt'>;
export type TicketWithReplies = Ticket & { replies: Reply[] };

/** Every method takes the agent's team, and never reads or changes another team's tickets. */
@Injectable()
export class TicketsService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  search(team: string, { text, status, limit }: SearchTicketsQuery): Promise<TicketSummary[]> {
    const conditions: SQL[] = [eq(tickets.teamId, team)];
    if (text) {
      // The text is matched literally: % and _ in it are not wildcards.
      const pattern = `%${text.replace(/[\\%_]/g, '\\$&')}%`;
      conditions.push(or(ilike(tickets.subject, pattern), ilike(tickets.body, pattern))!);
    }
    if (status) {
      conditions.push(eq(tickets.status, status));
    }
    return this.db
      .select({
        id: tickets.id,
        subject: tickets.subject,
        status: tickets.status,
        customerEmail: tickets.customerEmail,
        updatedAt: tickets.updatedAt,
      })
      .from(tickets)
      .where(and(...conditions))
      .orderBy(desc(tickets.updatedAt), desc(tickets.id))
      .limit(limit);
  }

  /** The ticket and its replies, oldest first. Another team's ticket is as unknown as a missing one. */
  async findOne(team: string, id: number): Promise<TicketWithReplies> {
    const [ticket] = await this.db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, id), eq(tickets.teamId, team)));
    if (!ticket) {
      throw notFound(id);
    }
    const thread = await this.db
      .select()
      .from(replies)
      .where(eq(replies.ticketId, id))
      .orderBy(asc(replies.createdAt), asc(replies.id));
    return { ...ticket, replies: thread };
  }

  /** Adds a reply and, optionally, sets the status: both, or neither. */
  reply(team: string, id: number, author: string, body: string, status?: TicketStatus) {
    return this.db.transaction(async (tx) => {
      // The team is part of the statement that finds the ticket, and the row stays locked until the reply is in.
      const [ticket] = await tx
        .update(tickets)
        .set({ updatedAt: new Date(), ...(status && { status }) })
        .where(and(eq(tickets.id, id), eq(tickets.teamId, team)))
        .returning({ id: tickets.id, status: tickets.status });
      if (!ticket) {
        throw notFound(id);
      }
      const [reply] = await tx
        .insert(replies)
        .values({ ticketId: id, author, body })
        .returning({ id: replies.id });
      return { ticketId: ticket.id, replyId: reply.id, status: ticket.status };
    });
  }
}

function notFound(id: number) {
  return new NotFoundException(`Ticket ${id} not found`);
}
```

- **The team is in the `WHERE` clause**, not checked after a read. Another team's ticket is answered like a missing one, so billing can't even learn which shipping numbers exist.
- **A reply is one transaction.** The `UPDATE` finds the ticket within the team and locks it, then the reply is inserted; another team's ticket updates nothing, and nothing is inserted.
- **The search text is matched literally**: `%` and `_` are escaped.

#### Know who is calling

The module verifies the token before any method runs (see [Verify OAuth access tokens](/tutorials/mcp-server#verify-oauth-access-tokens)). A parameter decorator reads the agent from it: the support agent, the person the assistant calls for:

```typescript
@@filename(src/tickets/agent.decorator)
import { createParamDecorator, ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { McpExecutionContext } from '@nestjs/mcp';

/** Who is calling: the support agent's team, and the name their replies are signed with. */
export interface Agent {
  team: string;
  username: string;
}

/**
 * The agent a call is made for. Over HTTP, from the verified access token; over stdio, where there is
 * no token, from the environment the local client starts the server with.
 */
export const CurrentAgent = createParamDecorator((_data: unknown, context: ExecutionContext): Agent => {
  const ctx = McpExecutionContext.create(context).getContext();
  const agent =
    ctx.transport === 'stdio'
      ? { team: process.env.HELPDESK_TEAM, username: process.env.USER ?? 'local' }
      : { team: ctx.authInfo?.extra?.team, username: ctx.authInfo?.extra?.username };
  if (typeof agent.team !== 'string' || !agent.team || typeof agent.username !== 'string') {
    // The token is valid, but grants no team's tickets.
    throw new ForbiddenException(
      ctx.transport === 'stdio' ? 'Set HELPDESK_TEAM to the team to work in' : 'The access token names no team',
    );
  }
  return { team: agent.team, username: agent.username };
});
```

`McpExecutionContext.create(context)` reads an MCP call's context, as `GqlExecutionContext` does for GraphQL (see [Guards, interceptors, pipes and filters](/mcp/primitives#guards-interceptors-pipes-and-filters)). Over HTTP, `authInfo` is what the verifier returned; over stdio there is no token, and the team comes from the environment. The transport decides, so an HTTP request never falls back to the environment's team. A valid token without a team is a 403: a 401 would make the client sign in again, which wouldn't help.

#### Write tools for the model

A tool is a method with `@Tool()`. The model picks it by its name and description, and fills the arguments in from the `.describe()` texts, so they say what the tool does, when to use it, and what each argument means, with an example. The SDK validates every call against the schema before the method runs:

```typescript
@@filename(src/tickets/tickets.tools)
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prompt, ResourceTemplate, Tool, type McpContext } from '@nestjs/mcp';
import type { PromptMessage } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { CurrentAgent, type Agent } from './agent.decorator.js';
import { TicketsService } from './tickets.service.js';

// The database's integer range: a larger number would be a 500, not a validation error.
const ticketId = z.number().int().min(1).max(2_147_483_647).describe('The ticket number, such as 1042');
const status = z.enum(['open', 'pending', 'solved']);

const searchTicketsSchema = z.object({
  text: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .optional()
    .describe('Words to find in the subject or the description, such as "refund" or an order number'),
  status: status.optional().describe('Only tickets in this status. Leave it out to search all of them'),
  limit: z.number().int().min(1).max(50).default(10).describe('How many tickets to return, newest first'),
});

const replyToTicketSchema = z.object({
  ticketId,
  message: z
    .string()
    .trim()
    .min(1)
    .max(5000)
    .describe('The reply as the customer will read it, in plain text'),
  status: z
    .enum(['pending', 'solved'])
    .optional()
    .describe('"pending" when you asked the customer something, "solved" when nothing is left to do. Leave it out to keep the status'),
});

@Injectable()
export class TicketsTools {
  constructor(private readonly tickets: TicketsService) {}

  @Tool({
    name: 'search-tickets',
    description:
      "Search the support team's tickets by text and status. Returns each ticket's number, subject, status and customer, newest first; read a ticket's full thread as the resource tickets://{ticketId}",
    inputSchema: searchTicketsSchema,
    annotations: { readOnlyHint: true },
  })
  search(input: z.infer<typeof searchTicketsSchema>, _ctx: McpContext, @CurrentAgent() agent: Agent) {
    return this.tickets.search(agent.team, input);
  }

  @Tool({
    name: 'reply-to-ticket',
    description:
      "Reply to a ticket's customer, and optionally change the ticket's status. The customer reads the reply: only call it with text the user has approved",
    inputSchema: replyToTicketSchema,
    outputSchema: z.object({ ticketId: z.number().int(), replyId: z.number().int(), status }),
    // It adds to a ticket and removes nothing, but a retry adds a second reply.
    annotations: { destructiveHint: false, idempotentHint: false },
    scopes: ['tickets:write'],
  })
  reply(
    { ticketId, message, status }: z.infer<typeof replyToTicketSchema>,
    _ctx: McpContext,
    @CurrentAgent() agent: Agent,
  ) {
    return this.tickets.reply(agent.team, ticketId, agent.username, message, status);
  }

  @ResourceTemplate({
    uriTemplate: 'tickets://{ticketId}',
    name: 'ticket',
    description: 'A ticket with its whole thread: the description, then every reply, oldest first',
    mimeType: 'application/json',
  })
  ticket({ ticketId }: { ticketId: string }, _ctx: McpContext, @CurrentAgent() agent: Agent) {
    return this.tickets.findOne(agent.team, parseTicketId(ticketId));
  }

  @Prompt({
    name: 'draft-reply',
    description: 'Draft a reply to a ticket, for you to review before it is sent',
    argsSchema: z.object({
      ticketId: z.string().regex(/^\d+$/).describe('The ticket number, such as 1042'),
      tone: z.enum(['formal', 'friendly']).default('friendly').describe('How the reply sounds'),
    }),
  })
  async draftReply(
    { ticketId, tone }: { ticketId: string; tone: 'formal' | 'friendly' },
    _ctx: McpContext,
    @CurrentAgent() agent: Agent,
  ): Promise<PromptMessage[]> {
    const ticket = await this.tickets.findOne(agent.team, parseTicketId(ticketId));
    return [
      {
        role: 'user',
        content: {
          type: 'resource',
          resource: { uri: `tickets://${ticket.id}`, mimeType: 'application/json', text: JSON.stringify(ticket) },
        },
      },
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Draft a ${tone} reply to the customer of ticket ${ticket.id}. Answer what they asked last, and say what happens next. Show me the draft; send it with reply-to-ticket only once I approve it.`,
        },
      },
    ];
  }
}

/** A URI's variable is any string: a ticket number, or not found. */
function parseTicketId(value: string): number {
  const id = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id > 2_147_483_647) {
    throw new NotFoundException(`Ticket ${value} not found`);
  }
  return id;
}
```

- **`readOnlyHint: true` on the search** tells the client it changes nothing, so it can run without asking the user. Without it, as on `reply-to-ticket`, a client may ask first; that tool's description also tells the model to send only approved text.
- **`scopes: ['tickets:write']` on the reply.** A token without it gets a 403, before the method runs, whose challenge names the scope, so the client can ask the user for it (step-up authorization).
- **The method gets the validated input**: `text` trimmed, `limit` defaulted. Arguments the schema refuses never reach it; the model gets an error that says what's wrong, and can try again.
- **`ticketId` has the database's range.** Without the `max()`, a larger number would fail in PostgreSQL, and the model would get `Internal server error` instead of a message it can act on.
- **The agent is the third parameter.** The first two of an MCP method are the input and the call's context (see [The call context](/mcp/primitives#the-call-context)).

What a tool throws becomes a result with `isError: true`: a `NotFoundException` sends its message, `Ticket 1003 not found`, and any other error `Internal server error` (see [Errors](/mcp/primitives#errors)).

#### Serve tickets as resources

A resource is data the client reads by URI, often one the user attaches to a conversation. The `ticket` method above serves each thread at a URI such as `tickets://1001`, from an [RFC 6570](https://datatracker.ietf.org/doc/html/rfc6570) template whose variable it receives as a string. Something that isn't a ticket number, or another team's ticket, is a `NotFoundException`: the spec's resource-not-found error.

A prompt is a template the user picks in the client, such as a slash command. `draft-reply` attaches the ticket as an embedded resource, then gives the instruction. Prompt arguments are strings in MCP, hence the `ticketId` pattern.

The module registers the class as any provider:

```typescript
@@filename(src/tickets/tickets.module)
import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service.js';
import { TicketsTools } from './tickets.tools.js';

@Module({
  providers: [TicketsService, TicketsTools],
})
export class TicketsModule {}
```

#### Verify OAuth access tokens

In MCP, a server on the network is an OAuth 2.1 **resource server**: the client gets an access token from your identity provider, and sends it with every request. The server verifies it, and never issues tokens (see [Authorization](/mcp/primitives#authorization)). The verifier is a class with `verifyAccessToken(token)`. `JwtVerifier` from `@nestjs/authentication` checks the signature against the provider's keys, and the issuer, audience, type and expiry. Everything provider-specific is configuration:

```typescript
@@filename(src/auth/access-token.verifier)
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtVerifier, type JwtClaims } from '@nestjs/authentication';
import type { McpTokenVerifier } from '@nestjs/mcp';
import type { AuthInfo } from '@modelcontextprotocol/server';
import type { Env } from '../config.js';

/** Verifies the identity provider's JWT access tokens, and reads what the tools need from them. */
@Injectable()
export class AccessTokenVerifier implements McpTokenVerifier {
  private readonly jwt: JwtVerifier;
  private readonly resource: URL;
  private readonly teamClaim: string;

  constructor(config: ConfigService<Env, true>) {
    this.resource = new URL(config.get('MCP_RESOURCE', { infer: true }));
    this.teamClaim = config.get('OIDC_TEAM_CLAIM', { infer: true });
    this.jwt = new JwtVerifier({
      jwks: config.get('OIDC_JWKS_URL', { infer: true }),
      issuer: config.get('OIDC_ISSUER', { infer: true }),
      // Only tokens issued for this server: not one the user's browser got for another API.
      audience: config.get('OIDC_AUDIENCE', { infer: true }) ?? config.get('MCP_RESOURCE', { infer: true }),
      // An access token, not an ID token or another JWT the provider signs.
      type: config.get('OIDC_TOKEN_TYPE', { infer: true }) || undefined,
      required: ['exp', 'sub'],
      // The provider's clock and this server's are never quite the same.
      clockTolerance: '30s',
    });
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    // A bad signature, another issuer or audience, or an expired token throws a JwtError: a 401.
    const claims = await this.jwt.verify(token);
    const team = claims[this.teamClaim];
    return {
      token,
      // The OAuth client the token was issued to: the assistant, not the agent.
      clientId: String(claims.azp ?? claims.client_id ?? claims.sub),
      scopes: scopesOf(claims),
      expiresAt: claims.exp,
      resource: this.resource,
      extra: {
        subject: claims.sub,
        username: typeof claims.preferred_username === 'string' ? claims.preferred_username : claims.sub,
        team: typeof team === 'string' ? team : undefined,
      },
    };
  }
}

/** `scope` is a space-separated string (RFC 9068); some providers send `scp`, as a string or a list. */
function scopesOf(claims: JwtClaims): string[] {
  const value = claims.scope ?? claims.scp;
  const scopes = Array.isArray(value) ? value : typeof value === 'string' ? value.split(' ') : [];
  return scopes.filter((scope): scope is string => typeof scope === 'string' && scope.length > 0);
}
```

- **The audience is the server's URL.** A provider signs every API's tokens with the same keys: without the check, a token the user got for another API would work here, which is why `JwtVerifier` refuses a key set without an `audience`. MCP clients ask for tokens for `MCP_RESOURCE`; `OIDC_AUDIENCE` is for providers that put something else in `aud`.
- **`type` is `at+jwt` by default**, the header of [RFC 9068](https://datatracker.ietf.org/doc/html/rfc9068) access tokens, which keeps out other JWTs the provider signs, such as ID tokens. Leave `OIDC_TOKEN_TYPE` empty for a provider that doesn't send it.
- **A refused token throws a `JwtError`** (`status: 401`), which the module answers with 401 and a `WWW-Authenticate` challenge. Keys that can't be fetched throw a plain error, a 500, so clients don't drop a valid token during an outage.
- **`clientId` is the assistant**, the OAuth client the token was issued to, and `sub` the agent. The module also checks that `resource` is the server's URL and `expiresAt` in the future.

A module provides the verifier, so `McpModule` can inject it:

```typescript
@@filename(src/auth/auth.module)
import { Module } from '@nestjs/common';
import { AccessTokenVerifier } from './access-token.verifier.js';

@Module({
  providers: [AccessTokenVerifier],
  exports: [AccessTokenVerifier],
})
export class AuthModule {}
```

#### Assemble the server

The root module loads the configuration, opens the database pool, and registers `McpModule` with the values from the configuration. `forRootAsync()` takes the verifier as an instance, which its factory injects:

```typescript
@@filename(src/app.module)
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { McpModule } from '@nestjs/mcp';
import { createObserveModule } from '@nestjs/observe';
import { drizzle } from 'drizzle-orm/node-postgres';
import { fileURLToPath } from 'node:url';
import { AccessTokenVerifier } from './auth/access-token.verifier.js';
import { AuthModule } from './auth/auth.module.js';
import { envSchema, type Env } from './config.js';
import { TicketsModule } from './tickets/tickets.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'helpdesk-mcp',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
      // The project's .env, whichever directory a local client starts the stdio server in.
      envFilePath: fileURLToPath(new URL('../.env', import.meta.url)),
    }),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        drizzle,
        connection: config.get('DATABASE_URL', { infer: true }),
      }),
    }),
    McpModule.forRootAsync({
      imports: [AuthModule],
      inject: [ConfigService, AccessTokenVerifier],
      useFactory: (config: ConfigService<Env, true>, verifier: AccessTokenVerifier) => ({
        name: 'helpdesk',
        version: '1.0.0',
        instructions:
          "The support team's helpdesk. Find tickets with search-tickets, read one with its thread as tickets://{ticketId}, and reply with reply-to-ticket only after the user approved the text.",
        include: [TicketsModule],
        http: { allowedHosts: config.get('MCP_ALLOWED_HOSTS', { infer: true }) },
        auth: {
          verifier,
          resource: config.get('MCP_RESOURCE', { infer: true }),
          authorizationServers: [config.get('OIDC_ISSUER', { infer: true })],
          scopesSupported: ['tickets:read', 'tickets:write'],
          // Every request, from the first, needs the read scope.
          requiredScopes: ['tickets:read'],
          resourceName: 'Helpdesk',
        },
      }),
    }),
    TicketsModule,
  ],
})
export class AppModule {}
```

- **`auth`** makes every request need a valid token: `resource` is the server's canonical URL, `authorizationServers` the issuers it trusts, `scopesSupported` what it advertises, and `requiredScopes` puts `tickets:read` on every request, listing the tools included.
- **The protected resource metadata** ([RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728)), which tells clients where to sign in, is served by the module at `/.well-known/oauth-protected-resource/mcp`.
- **`allowedHosts`** answers other `Host` headers with 403. Without it, a web page whose domain resolves to `127.0.0.1` could reach a server on `localhost` (DNS rebinding). The `Origin` check is on by default: pages on any site but localhost get 403, while assistants and CLIs, which send no `Origin`, pass (see [The HTTP endpoint](/mcp/transports#the-http-endpoint)).
- **`envFilePath`** finds the project's `.env` from the compiled file, whichever directory a desktop client starts the stdio server in.
- **`ObserveModule` comes first** in `imports`, as the [SDK's quick start](/observability/sdk#quick-start) does: modules shut down in reverse order, so it stops last, and sends what the others recorded (see [Shutdown](/observability/sdk#shutdown)). `createObserveModule()` returns it with `ObserveInstrument`, which `main.ts` and `stdio.ts` pass to Nest.
- **The key pair is empty until you link the project.** Without one, the SDK sends nothing, and says so at startup. `npx @nestjs/observe link` writes `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` into `.env`, and adds `--env-file .env` to the `start` script, so they're in the environment before `AppModule` is imported, when the SDK reads them (see [Linking from the terminal](/observability/sdk#linking-from-the-terminal)). An empty value and the `'YOUR_APP_KEY'` placeholders `nest new` writes both fall back to the environment (see [Reading the key pair from the environment](/observability/sdk#reading-the-key-pair-from-the-environment)); `enabled: false` outside production would also silence a development machine you linked on purpose.

`main.ts` starts the HTTP application on the Node adapter. With an adapter, the application options, `instrument` among them, are the third argument:

```typescript
@@filename(src/main)
import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { AppModule, ObserveInstrument } from './app.module.js';
import type { Env } from './config.js';

const production = process.env.NODE_ENV === 'production';
const app = await NestFactory.create<NestNodeApplication>(AppModule, new NodeAdapter(), {
  instrument: ObserveInstrument,
  // One JSON object per line in production; readable text in development.
  logger: new ConsoleLogger({ json: production, redact: ['authorization', 'token'] }),
});
app.useSecurityHeaders();
app.enableShutdownHooks();

const config = app.get<ConfigService<Env, true>>(ConfigService);
await app.listen(config.get('PORT', { infer: true }));
```

- **JSON logs in production** (see [JSON logging](/application/logger#json-logging)), with tokens redacted from logged objects, and [security headers](/security/helmet) on every response.
- **No CORS.** Assistants don't call from a browser. A browser-based client on another origin needs its hostname in `allowedOrigins` and in your CORS configuration (see [The HTTP endpoint](/mcp/transports#the-http-endpoint)).

The endpoint is at `http://localhost:3000/mcp`, and every request needs a token. Until the project is linked, the server logs that Observe sends nothing:

```bash
$ npm run start
...
WARN [ObserveAgentWorker] Observe is installed but sends nothing: appKey and appSecret are not set, and the hosted collector accepts no telemetry without a key and a secret. If they come from the environment, check that OBSERVE_APP_KEY and OBSERVE_APP_SECRET reach this process, then restart it. To get a pair, run npx @nestjs/observe link or create one at https://observe.nestjs.com.
LOG [NestApplication] Nest application successfully started
```

#### Get a token for development

An identity provider signs the user in, and issues tokens to the assistant. For development, a script stands in for one: it holds a key pair, serves the public key as a JSON Web Key Set (JWKS) at `OIDC_JWKS_URL`, and signs access tokens for any agent, team and scopes. The tests use it too:

```typescript
@@filename(scripts/dev-issuer)
/**
 * A stand-in for an identity provider, for development and tests only: a key pair of its own, its
 * public key served as a JWKS, and access tokens signed with it for whatever team and scopes you ask.
 * Never deploy it: whoever can reach it can mint a token.
 */
import { generateKeyPairSync } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { JwtSigner, type Duration } from '@nestjs/authentication';

export type DevTokenClaims = { username?: string; team?: string; scope?: string };
export type DevTokenOptions = { issuer?: string; audience?: string; ttl?: Duration; type?: string; now?: () => number };

const KID = 'dev-key';

export class DevIssuer {
  private readonly keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  readonly issuer: string;
  readonly audience: string;

  constructor(issuer: string, audience: string) {
    this.issuer = issuer;
    this.audience = audience;
  }

  /** An RFC 9068 access token, as an authorization server issues one for the MCP server. */
  sign(
    { username = 'ada', team = 'billing', scope = 'tickets:read tickets:write' }: DevTokenClaims = {},
    { issuer = this.issuer, audience = this.audience, ttl = '1h', type = 'at+jwt', now = Date.now }: DevTokenOptions = {},
  ): string {
    const signer = new JwtSigner({ key: this.keys.privateKey, kid: KID, issuer, audience, ttl, type, now });
    return signer.sign({ sub: username, preferred_username: username, client_id: 'dev-issuer', scope, team });
  }

  jwks() {
    const jwk = this.keys.publicKey.export({ format: 'jwk' });
    return { keys: [{ ...jwk, kid: KID, alg: 'RS256', use: 'sig' }] };
  }

  /** Serves the JWKS, and `POST /token` with a form of `username`, `team` and `scope`. */
  listen(port: number): Promise<Server> {
    const server = createServer(async (req, res) => {
      res.setHeader('content-type', 'application/json');
      if (req.method === 'GET' && req.url === '/jwks.json') {
        res.end(JSON.stringify(this.jwks()));
      } else if (req.method === 'POST' && req.url === '/token') {
        let body = '';
        for await (const chunk of req) body += chunk;
        const form = Object.fromEntries(new URLSearchParams(body));
        const accessToken = this.sign(form);
        res.end(JSON.stringify({ access_token: accessToken, token_type: 'Bearer', expires_in: 3600 }));
      } else {
        res.statusCode = 404;
        res.end('{"error":"not_found"}');
      }
    });
    // Loopback only: nothing outside this machine can ask it for a token.
    return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
  }
}

// `npm run dev:issuer`: serves at the port of OIDC_JWKS_URL, as the issuer and for the audience in .env.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The dev issuer mints tokens for anyone who asks: never run it in production');
  }
  const { OIDC_ISSUER, OIDC_JWKS_URL, MCP_RESOURCE } = process.env;
  if (!OIDC_ISSUER || !OIDC_JWKS_URL || !MCP_RESOURCE) {
    throw new Error('Set OIDC_ISSUER, OIDC_JWKS_URL and MCP_RESOURCE in .env');
  }
  const port = Number(new URL(OIDC_JWKS_URL).port);
  await new DevIssuer(OIDC_ISSUER, MCP_RESOURCE).listen(port);
  console.log(`Dev issuer ${OIDC_ISSUER}: keys at ${OIDC_JWKS_URL}, tokens from POST http://localhost:${port}/token`);
}
```

> warning **Warning** The development issuer gives a token to anyone who asks. Never deploy it: it refuses to start with `NODE_ENV=production`, listens on the loopback interface only, and lives in `scripts/`, which the build doesn't compile. It's not an authorization server either: it has no sign-in page, so clients that sign users in through OAuth can't use it (see [Connect an assistant](/tutorials/mcp-server#connect-an-assistant)).

Its tokens have `OIDC_ISSUER` as `iss`, `MCP_RESOURCE` as `aud`, `at+jwt` as `typ`, and expire after an hour; a restart makes new keys, and invalidates them. Start it in a terminal of its own:

```bash
$ npm run dev:issuer
Dev issuer http://localhost:3001: keys at http://localhost:3001/jwks.json, tokens from POST http://localhost:3001/token
```

#### Try it

Start the server in another terminal, with `npm run start`. A request without a token gets 401, with a `WWW-Authenticate` challenge that names the scope every request needs and points at the metadata (some headers omitted here and below):

```bash
$ curl -i localhost:3000/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
HTTP/1.1 401 Unauthorized
content-type: application/json
www-authenticate: Bearer error="invalid_token", error_description="Missing Authorization header", scope="tickets:read", resource_metadata="http://localhost:3000/.well-known/oauth-protected-resource/mcp"
...

{"error":"invalid_token","error_description":"Missing Authorization header"}
```

The metadata names the server, the issuers whose tokens it accepts, and its scopes. It needs no token:

```bash
$ curl -i localhost:3000/.well-known/oauth-protected-resource/mcp
HTTP/1.1 200 OK
...
Access-Control-Allow-Origin: *
Cache-Control: public, max-age=3600
Content-Type: application/json; charset=utf-8
...

{"resource":"http://localhost:3000/mcp","authorization_servers":["http://localhost:3001"],"bearer_methods_supported":["header"],"scopes_supported":["tickets:read","tickets:write"],"resource_name":"Helpdesk"}
```

Ask the development issuer for a token for Ada, of the billing team, with both scopes, and keep it in a variable with `jq`:

```bash
$ curl localhost:3001/token -d username=ada -d team=billing -d 'scope=tickets:read tickets:write'
{"access_token":"eyJhbGciOiJSUzI1NiIsInR5...","token_type":"Bearer","expires_in":3600}
$ TOKEN=$(curl -s localhost:3001/token -d username=ada -d team=billing -d 'scope=tickets:read tickets:write' | jq -r .access_token)
```

A `tools/call` with it searches billing's tickets. The endpoint keeps no session, so it needs no `initialize` first, and it answers with a server-sent event, which the client said it accepts:

```bash
$ curl -i localhost:3000/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -H "Authorization: Bearer $TOKEN" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search-tickets","arguments":{"text":"refund"}}}'
HTTP/1.1 200 OK
content-type: text/event-stream
...

event: message
data: {"result":{"content":[{"type":"text","text":"[{\"id\":1002,\"subject\":\"Refund for a cancelled subscription\",\"status\":\"pending\",\"customerEmail\":\"li@example.com\",\"updatedAt\":\"2026-11-25T09:20:49.738Z\"},{\"id\":1001,\"subject\":\"Charged twice for order 5521\",\"status\":\"open\",\"customerEmail\":\"maria@example.com\",\"updatedAt\":\"2026-11-25T09:20:49.738Z\"}]"}]},"jsonrpc":"2.0","id":1}
```

The [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector)'s command line is a real MCP client, and takes the token as a header. `--method tools/list` lists the tools with their schemas, as an assistant sees them. Read a ticket as a resource, then reply to it and solve it; the reply's result is its `structuredContent`, and the same as JSON text:

```bash
$ npx @modelcontextprotocol/inspector --cli http://localhost:3000/mcp --header "Authorization: Bearer $TOKEN" --method resources/read --uri tickets://1002
{
  "contents": [
    {
      "uri": "tickets://1002",
      "mimeType": "application/json",
      "text": "{\"id\":1002,\"teamId\":\"billing\",\"subject\":\"Refund for a cancelled subscription\",\"body\":\"I cancelled on the 3rd but was charged on the 5th. I would like that refunded.\",\"customerEmail\":\"li@example.com\",\"status\":\"pending\",\"createdAt\":\"2026-11-25T09:20:49.738Z\",\"updatedAt\":\"2026-11-25T09:20:49.738Z\",\"replies\":[{\"id\":1,\"ticketId\":1002,\"author\":\"grace\",\"body\":\"Sorry about that. Which card was charged, and on which date exactly?\",\"createdAt\":\"2026-11-25T09:20:49.738Z\"}]}"
    }
  ]
}
$ npx @modelcontextprotocol/inspector --cli http://localhost:3000/mcp --header "Authorization: Bearer $TOKEN" --method tools/call --tool-name reply-to-ticket --tool-arg ticketId=1002 'message=We have refunded the charge of the 5th. It reaches your card in 3 to 5 days.' status=solved
{
  "content": [
    {
      "type": "text",
      "text": "{\"ticketId\":1002,\"replyId\":2,\"status\":\"solved\"}"
    }
  ],
  "structuredContent": {
    "ticketId": 1002,
    "replyId": 2,
    "status": "solved"
  }
}
```

Bob is in the shipping team. Billing's ticket isn't there for him:

```bash
$ BOB=$(curl -s localhost:3001/token -d username=bob -d team=shipping | jq -r .access_token)
$ npx @modelcontextprotocol/inspector --cli http://localhost:3000/mcp --header "Authorization: Bearer $BOB" --method resources/read --uri tickets://1002
{"error":{"code":"error","message":"Resource not found: tickets://1002"}}
```

A token with only `tickets:read` can search, but not reply. The 403's challenge names the scope to ask the user for:

```bash
$ READER=$(curl -s localhost:3001/token -d username=ada -d team=billing -d scope=tickets:read | jq -r .access_token)
$ curl -i localhost:3000/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -H "Authorization: Bearer $READER" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"reply-to-ticket","arguments":{"ticketId":1001,"message":"Hello"}}}'
HTTP/1.1 403 Forbidden
content-type: application/json
www-authenticate: Bearer error="insufficient_scope", error_description="Insufficient scope", scope="tickets:write", resource_metadata="http://localhost:3000/.well-known/oauth-protected-resource/mcp"
...

{"error":"insufficient_scope","error_description":"Insufficient scope"}
```

A request from a web page on another site, and one with a `Host` the server doesn't answer to, get 403 before anything else is read:

```bash
$ curl -i localhost:3000/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -H "Authorization: Bearer $TOKEN" -H 'Origin: https://elsewhere.example' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
HTTP/1.1 403 Forbidden
...

{"jsonrpc":"2.0","error":{"code":-32000,"message":"Invalid Origin: elsewhere.example"},"id":null}
$ curl -i localhost:3000/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -H "Authorization: Bearer $TOKEN" -H 'Host: attacker.example:3000' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
HTTP/1.1 403 Forbidden
...

{"jsonrpc":"2.0","error":{"code":-32000,"message":"Invalid Host: attacker.example"},"id":null}
```

#### Serve the same tools over stdio

An assistant on the user's machine (Claude Desktop, Claude Code, an IDE) can also launch the server as a local process, and talk to it over stdin and stdout. `stdio.ts` serves the same module from a standalone application context:

```typescript
@@filename(src/stdio)
import { NestFactory } from '@nestjs/core';
import { McpStdioLogger, McpStdioServer } from '@nestjs/mcp';
import { AppModule, ObserveInstrument } from './app.module.js';

// stdout carries the protocol: every log line goes to stderr.
const app = await NestFactory.createApplicationContext(AppModule, {
  instrument: ObserveInstrument,
  logger: new McpStdioLogger(),
});
await app.get(McpStdioServer).listen();
await app.close();
```

`McpStdioLogger` writes every log level to stderr: stdout carries the protocol, and Nest's default logger writes there. Observe's SDK logs through Nest's logger, so its lines go to stderr too. `listen()` resolves when the client closes stdin (see [Over stdio](/mcp/transports#over-stdio)).

Over stdio, the process belongs to one user, and the spec takes credentials from the environment, not OAuth. There is no token, so `scopes` aren't checked, and the team comes from `HELPDESK_TEAM`. The database URL in `.env` is the real access control there: whoever has it has the data anyway.

Clients take a command, run from a directory of their choosing: `node` with the built file's absolute path. Not `npm run`, which prints its own lines to stdout, the protocol's channel. Desktop clients take it in a configuration like this one:

```json
{
  "mcpServers": {
    "helpdesk": {
      "command": "node",
      "args": ["/path/to/helpdesk-mcp/dist/stdio.js"],
      "env": { "HELPDESK_TEAM": "billing" }
    }
  }
}
```

The rest of the configuration comes from the project's `.env`, but not Observe's key pair, which the SDK reads from the environment before `ConfigModule` loads the file: to report stdio calls, add `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` to the client's `env`. The tests launch the server with this command and environment, and so does the Inspector's command line, here for the shipping team (the server's log, on stderr, is omitted):

```bash
$ npx @modelcontextprotocol/inspector --cli -e HELPDESK_TEAM=shipping node dist/stdio.js --method tools/call --tool-name search-tickets
{
  "content": [
    {
      "type": "text",
      "text": "[{\"id\":1004,\"subject\":\"Wrong size delivered\",\"status\":\"open\",\"customerEmail\":\"noor@example.com\",\"updatedAt\":\"2026-11-25T09:20:49.738Z\"},{\"id\":1003,\"subject\":\"Parcel stuck in customs\",\"status\":\"open\",\"customerEmail\":\"sam@example.com\",\"updatedAt\":\"2026-11-25T09:20:49.738Z\"}]"
    }
  ]
}
```

#### Connect an assistant

Most MCP clients can sign the user in themselves: on the 401, they read the metadata, find the identity provider, register with it or use a client ID you configure, and open its sign-in page. That needs a real authorization server, which the development issuer is not: with it, give the client the token as an `Authorization` header, or run the stdio command.

> warning **Warning** None of this section was run for this tutorial, which was tested with the SDK's client and the MCP Inspector's command line. It follows each client's documentation at the time of writing.

| Client | Remote server with a header | stdio command | Signs in with OAuth |
| --- | --- | --- | --- |
| Claude Code | `claude mcp add --transport http ... --header` | `claude mcp add --env ... -- node ...` | Yes, with `/mcp` |
| Claude Desktop | Custom connectors, reached from Anthropic's cloud: a public URL only | `mcpServers` in `claude_desktop_config.json` | Yes, custom connectors |
| Cursor | `mcpServers` in `.cursor/mcp.json`: `url`, `headers` | The same file: `command`, `args`, `env` | Yes |
| VS Code (Copilot) | `servers` in `.vscode/mcp.json`: `"type": "http"`, `url`, `headers` | The same file: `"type": "stdio"` | Yes |
| Windsurf | `mcpServers` in `mcp_config.json`: `serverUrl`, `headers` | The same file | Yes |
| Cline | `mcpServers` in `cline_mcp_settings.json`: `"type": "streamableHttp"`, `url`, `headers` | The same file | Not documented |
| Zed | `context_servers` in its settings: `url`, `headers` | The same key: `command`, `args`, `env` | Yes, without a header |
| Gemini CLI | `gemini mcp add --transport http --header`, or `httpUrl` and `headers` in `settings.json` | `gemini mcp add -e ...` | Yes |
| Codex CLI | `[mcp_servers.helpdesk]` in `config.toml`: `url`, `bearer_token_env_var` | `codex mcp add --env ... -- node ...` | Yes, with `codex mcp login` |
| ChatGPT | No: it sends no custom headers, and needs a public URL | No | Yes, OAuth only |

Claude Code, Gemini CLI and Codex CLI add a server from the command line. Claude Code and Gemini CLI take the header itself; Codex reads the token from the environment variable you name:

```bash
$ claude mcp add --transport http helpdesk http://localhost:3000/mcp --header "Authorization: Bearer $TOKEN"
$ claude mcp add --env HELPDESK_TEAM=billing --transport stdio helpdesk-local -- node /path/to/helpdesk-mcp/dist/stdio.js
$ gemini mcp add --transport http --header "Authorization: Bearer $TOKEN" helpdesk http://localhost:3000/mcp
$ codex mcp add helpdesk-local --env HELPDESK_TEAM=billing -- node /path/to/helpdesk-mcp/dist/stdio.js
```

Most editors take the `mcpServers` shape of [the previous section](/tutorials/mcp-server#serve-the-same-tools-over-stdio), with a `url` and `headers` for a remote server. In Cursor's `.cursor/mcp.json`, the header can read the token from your environment instead of the file:

```json
{
  "mcpServers": {
    "helpdesk": {
      "url": "http://localhost:3000/mcp",
      "headers": { "Authorization": "Bearer ${env:HELPDESK_TOKEN}" }
    }
  }
}
```

The other clients rename keys, as the table shows: Windsurf's `serverUrl`, Gemini's `httpUrl` (its `url` means the older SSE transport), and Cline's `"type": "streamableHttp"`, without which it falls back to SSE. VS Code's `.vscode/mcp.json` lists `servers`, and can prompt for the token once and keep it in its secret storage:

```json
{
  "inputs": [{ "type": "promptString", "id": "helpdesk-token", "password": true }],
  "servers": {
    "helpdesk": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": { "Authorization": "Bearer ${input:helpdesk-token}" }
    }
  }
}
```

Codex CLI configures a remote server in `~/.codex/config.toml`, with the name of the variable that holds the token:

```toml
[mcp_servers.helpdesk]
url = "http://localhost:3000/mcp"
bearer_token_env_var = "HELPDESK_TOKEN"
```

With a real identity provider, leave the header out, and let the client sign in. Development tokens expire after an hour: ask the issuer for a new one, and update the header or the variable.

#### Use a real identity provider

In production, point the configuration at your identity provider. `OIDC_JWKS_URL` is the `jwks_uri` of its `/.well-known/openid-configuration` document, and `OIDC_ISSUER` the exact `iss` of its access tokens. Create an API in the provider whose identifier is `MCP_RESOURCE`, with the scopes `tickets:read` and `tickets:write`, and a claim for the team (`OIDC_TEAM_CLAIM` names it). The main differences, from the providers' documentation:

| Provider | Issuer | `aud` | `typ` | Scopes | The team |
| --- | --- | --- | --- | --- | --- |
| Auth0 | `https://<tenant>.auth0.com/`, with the slash | The API's identifier | `at+jwt` with the API's RFC 9068 token profile | `scope` | A custom claim set by an Action |
| Microsoft Entra ID | `https://login.microsoftonline.com/<tenant-id>/v2.0` | The API's client ID: set `OIDC_AUDIENCE` | `JWT`: set `OIDC_TOKEN_TYPE` empty | `scp` | Needs claims mapping |
| Okta | `https://<domain>/oauth2/<server-id>` | The authorization server's audience | None: set `OIDC_TOKEN_TYPE` empty | `scp`, a list | A custom claim on the authorization server |
| WorkOS AuthKit | `https://<authkit-domain>` | A resource indicator | Check a token | `scope` | A JWT template |

> warning **Warning** These rows weren't run for this tutorial; they summarize each provider's documentation at the time of writing. Decode one access token from your provider (its header and payload are base64url-encoded JSON) and compare it with the configuration before you deploy. Whether assistants can sign in by themselves depends on the provider too: it must let them register, through dynamic client registration or Client ID Metadata Documents, or you register each one.

#### Test it

The tests stand in for the identity provider with the development issuer: a key pair generated for the run, served as the JWKS that `OIDC_JWKS_URL` names, signing the tokens. The application runs its real verifier against them; `JwksClient` accepts plain `http` only on loopback addresses. The data is in PostgreSQL, since team scoping is about SQL statements. The test configuration gives the application the environment it validates at startup:

```typescript
@@filename(vitest.config.e2e)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // The files share one database, and each empties it first.
    fileParallelism: false,
    env: {
      DATABASE_URL: 'postgres://unused-in-tests',
      MCP_RESOURCE: 'http://localhost:3000/mcp',
      OIDC_ISSUER: 'https://idp.test',
      // The key set test/helpdesk.e2e-spec.ts serves, from the dev issuer.
      OIDC_JWKS_URL: 'http://127.0.0.1:3162/jwks.json',
    },
  },
});
```

A helper migrates the test database, empties it, and adds one ticket for each team:

```typescript
@@filename(test/fixtures)
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { Pool } from 'pg';
import { teams, tickets } from '../src/database/schema.js';

/** Migrates the test database, empties it, and adds one ticket for each of two teams. */
export async function resetDatabase(pool: Pool) {
  const db = drizzle({ client: pool });
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
  await db.execute(sql`TRUNCATE replies, tickets, teams RESTART IDENTITY CASCADE`);
  await db.insert(teams).values([
    { id: 'billing', name: 'Billing' },
    { id: 'shipping', name: 'Shipping' },
  ]);
  const [billing, shipping] = await db
    .insert(tickets)
    .values([
      { teamId: 'billing', subject: 'Charged twice', body: 'Two charges for order 5521', customerEmail: 'maria@example.com' },
      { teamId: 'shipping', subject: 'Parcel stuck in customs', body: 'Order 5498', customerEmail: 'sam@example.com' },
    ])
    .returning({ id: tickets.id });
  return { db, billingTicket: billing.id, shippingTicket: shipping.id };
}
```

The first file connects the SDK's client in memory with `connectMcpClient()` from `@nestjs/mcp/testing`: the token check, the schemas, the scopes and the decorators run, without a socket (see [The in-memory client](/mcp/testing#the-in-memory-client)). The 401s and the `Origin` and `Host` checks are tested over real HTTP, with `fetch()` and the SDK's Streamable HTTP client:

```typescript
@@filename(test/helpdesk.e2e-spec)
import { request as httpRequest, type Server } from 'node:http';
import {
  Client,
  InsufficientScopeError,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { getDrizzleToken } from '@nestjs/drizzle';
import { connectMcpClient } from '@nestjs/mcp/testing';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { DevIssuer, type DevTokenClaims } from '../scripts/dev-issuer.js';
import { AppModule } from '../src/app.module.js';
import { replies, tickets } from '../src/database/schema.js';
import { resetDatabase } from './fixtures.js';

const url = process.env.TEST_DATABASE_URL;
const PORT = 3163;

// Stands in for the identity provider: its keys, served as the JWKS that OIDC_JWKS_URL names.
const issuer = new DevIssuer(process.env.OIDC_ISSUER!, process.env.MCP_RESOURCE!);

describe.skipIf(!url)('Helpdesk MCP server (e2e)', () => {
  const pool = new Pool({ connectionString: url });
  let fixtures: Awaited<ReturnType<typeof resetDatabase>>;
  let jwks: Server;
  let app: NestNodeApplication;

  beforeAll(async () => {
    jwks = await issuer.listen(Number(new URL(process.env.OIDC_JWKS_URL!).port));
    fixtures = await resetDatabase(pool);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(fixtures.db)
      .compile();
    app = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter());
    // Listening, for the tests over HTTP; the in-memory client needs no socket.
    await app.listen(PORT, '127.0.0.1');
  });

  afterAll(async () => {
    await app.close(); // closes the pool too
    jwks.close();
  });

  /** An in-memory MCP client, signed in as an agent of `team` with `scope`. */
  async function as<T>(claims: DevTokenClaims, run: (client: Client) => Promise<T>): Promise<T> {
    const client = await connectMcpClient(app, { token: issuer.sign(claims) });
    try {
      return await run(client);
    } finally {
      await client.close();
    }
  }
  const billing = { username: 'ada', team: 'billing' };
  const textOf = (result: { content?: unknown }) => (result.content as { text: string }[])[0].text;

  it('lists the tools, with the search marked read-only', async () => {
    const { tools } = await as(billing, (client) => client.listTools());
    expect(tools.map((tool) => [tool.name, tool.annotations?.readOnlyHint])).toEqual([
      ['search-tickets', true],
      ['reply-to-ticket', undefined],
    ]);
  });

  it("finds only the agent's own team's tickets", async () => {
    const found = await as(billing, (client) => client.callTool({ name: 'search-tickets', arguments: {} }));
    expect(JSON.parse(textOf(found)).map((ticket: { id: number }) => ticket.id)).toEqual([fixtures.billingTicket]);
  });

  it("never reads or changes another team's ticket", async () => {
    const other = fixtures.shippingTicket;
    await as(billing, async (client) => {
      await expect(client.readResource({ uri: `tickets://${other}` })).rejects.toThrow(`Resource not found: tickets://${other}`);
      await expect(
        client.getPrompt({ name: 'draft-reply', arguments: { ticketId: String(other) } }),
      ).rejects.toThrow(`Ticket ${other} not found`);
      const reply = await client.callTool({
        name: 'reply-to-ticket',
        arguments: { ticketId: other, message: 'Hello from billing', status: 'solved' },
      });
      expect(reply).toMatchObject({ isError: true, content: [{ type: 'text', text: `Ticket ${other} not found` }] });
    });
    const [ticket] = await fixtures.db.select().from(tickets).where(eq(tickets.id, other));
    expect(ticket.status).toBe('open');
    expect(await fixtures.db.$count(replies, eq(replies.ticketId, other))).toBe(0);
  });

  it('replies, sets the status, and shows the reply in the ticket', async () => {
    const id = fixtures.billingTicket;
    await as(billing, async (client) => {
      const reply = await client.callTool({
        name: 'reply-to-ticket',
        arguments: { ticketId: id, message: 'Refunded the second charge.', status: 'solved' },
      });
      expect(reply.structuredContent).toEqual({ ticketId: id, replyId: expect.any(Number), status: 'solved' });

      const { contents } = await client.readResource({ uri: `tickets://${id}` });
      const ticket = JSON.parse((contents[0] as { text: string }).text);
      expect(ticket).toMatchObject({ id, status: 'solved', replies: [{ author: 'ada', body: 'Refunded the second charge.' }] });
    });
  });

  it('asks for tickets:write before a reply, and changes nothing without it', async () => {
    const id = fixtures.billingTicket;
    const before = await fixtures.db.$count(replies, eq(replies.ticketId, id));
    await as({ ...billing, scope: 'tickets:read' }, async (client) => {
      const search = await client.callTool({ name: 'search-tickets', arguments: { text: 'charged' } });
      expect(search.isError).toBeFalsy();
      const error = await client
        .callTool({ name: 'reply-to-ticket', arguments: { ticketId: id, message: 'Hi' } })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(InsufficientScopeError);
      expect(error).toMatchObject({ requiredScope: 'tickets:write' });
    });
    expect(await fixtures.db.$count(replies, eq(replies.ticketId, id))).toBe(before);
  });

  it('tells the model what is wrong with its arguments', async () => {
    await as(billing, async (client) => {
      for (const args of [{ ticketId: '1001', message: 'Hi' }, { ticketId: 2 ** 31, message: 'Hi' }, { ticketId: 1001, message: ' ' }]) {
        const result = await client.callTool({ name: 'reply-to-ticket', arguments: args });
        expect(result.isError).toBe(true);
        expect(textOf(result)).toMatch(/^Input validation error/);
      }
    });
  });

  describe('over HTTP', () => {
    const endpoint = `http://127.0.0.1:${PORT}/mcp`;
    const listTools = (headers: Record<string, string> = {}) =>
      fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      });

    it('challenges a request without a token, pointing at the metadata', async () => {
      const response = await listTools();
      expect(response.status).toBe(401);
      expect(response.headers.get('www-authenticate')).toContain(
        'resource_metadata="http://localhost:3000/.well-known/oauth-protected-resource/mcp"',
      );
      const metadata = await fetch(`http://127.0.0.1:${PORT}/.well-known/oauth-protected-resource/mcp`);
      expect(await metadata.json()).toMatchObject({
        resource: 'http://localhost:3000/mcp',
        authorization_servers: ['https://idp.test'],
        scopes_supported: ['tickets:read', 'tickets:write'],
      });
    });

    it('refuses tokens for another audience, expired, wrongly signed or of another type with 401', async () => {
      const impostor = new DevIssuer(issuer.issuer, issuer.audience); // same kid, another key
      const tokens = {
        'another audience': issuer.sign(billing, { audience: 'https://other-api.example/mcp' }),
        'another issuer': issuer.sign(billing, { issuer: 'https://evil.example' }),
        expired: issuer.sign(billing, { now: () => Date.now() - 2 * 60 * 60 * 1000 }),
        'wrongly signed': impostor.sign(billing),
        'an ID token': issuer.sign(billing, { type: 'JWT' }),
      };
      for (const [reason, token] of Object.entries(tokens)) {
        const response = await listTools({ authorization: `Bearer ${token}` });
        expect(response.status, reason).toBe(401);
        expect(response.headers.get('www-authenticate'), reason).toContain('error="invalid_token"');
      }
      expect((await listTools({ authorization: `Bearer ${issuer.sign(billing)}` })).status).toBe(200);
    });

    it('refuses a page from another site, and a Host it does not answer to', async () => {
      const token = issuer.sign(billing);
      expect((await listTools({ authorization: `Bearer ${token}`, origin: 'https://elsewhere.example' })).status).toBe(403);
      // fetch() sets Host itself, so this one goes through node:http.
      const status = await new Promise<number>((resolve, reject) => {
        const req = httpRequest(endpoint, {
          method: 'POST',
          headers: {
            host: 'attacker.example:3000',
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
          },
        });
        req.on('response', (res) => resolve(res.statusCode!)).on('error', reject);
        req.end(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }));
      });
      expect(status).toBe(403);
    });

    it('serves the SDK client with a bearer token', async () => {
      const client = new Client({ name: 'helpdesk-e2e', version: '1.0.0' });
      await client.connect(
        new StreamableHTTPClientTransport(new URL(endpoint), {
          requestInit: { headers: { authorization: `Bearer ${issuer.sign(billing)}` } },
        }),
      );
      try {
        const result = await client.callTool({ name: 'search-tickets', arguments: { text: 'charged' } });
        expect(JSON.parse(textOf(result))).toMatchObject([{ id: fixtures.billingTicket }]);
      } finally {
        await client.close();
      }
    });
  });
});
```

The second file launches the built `stdio.js` as a desktop client would, then once more with stdout read raw: the SDK's client skips stdout lines that aren't JSON, so only a raw read shows that nothing else, a log line of Nest's or Observe's, reaches it:

```typescript
@@filename(test/stdio.e2e-spec)
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { Pool } from 'pg';
import { resetDatabase } from './fixtures.js';

const url = process.env.TEST_DATABASE_URL;
const stdioJs = fileURLToPath(new URL('../dist/stdio.js', import.meta.url));

describe.skipIf(!url)('stdio entry point (e2e)', () => {
  it('serves the tools to a client that launches it, for the team in its environment', async () => {
    const pool = new Pool({ connectionString: url });
    const { billingTicket } = await resetDatabase(pool);
    await pool.end();

    // What a desktop client runs: node, the built stdio.js, and the env of its configuration.
    // The rest of the configuration comes from the project's .env; DATABASE_URL points at the test database.
    const client = new Client({ name: 'stdio-e2e', version: '1.0.0' });
    await client.connect(
      new StdioClientTransport({ command: 'node', args: [stdioJs], env: { HELPDESK_TEAM: 'billing', DATABASE_URL: url! } }),
    );
    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name)).toEqual(['search-tickets', 'reply-to-ticket']);
      const found = await client.callTool({ name: 'search-tickets', arguments: {} });
      const ids = JSON.parse((found.content as { text: string }[])[0].text).map((ticket: { id: number }) => ticket.id);
      expect(ids).toEqual([billingTicket]);
    } finally {
      await client.close();
    }
  });

  it('writes nothing but protocol messages to stdout, from start to exit', async () => {
    // The SDK's client skips stdout lines that aren't JSON; other clients don't. So read stdout raw.
    const server = spawn('node', [stdioJs], { env: { ...process.env, HELPDESK_TEAM: 'billing', DATABASE_URL: url } });
    let stdout = '';
    let stderr = '';
    server.stderr.on('data', (chunk) => (stderr += chunk));
    server.stdout.on('data', (chunk) => {
      stdout += chunk;
      // The answer is in: close stdin, as a client does when it quits.
      if (stdout.includes('\n')) server.stdin.end();
    });
    const initialize = { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'raw', version: '1.0.0' } };
    server.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: initialize })}\n`);
    await new Promise((resolve) => server.on('exit', resolve));

    expect(stdout.trim().split('\n').map((line) => JSON.parse(line).id)).toEqual([1]);
    // The logs went to stderr, Observe's warning about its missing key pair included.
    expect(stderr).toContain('Starting Nest application');
    expect(stderr).toContain('Observe is installed but sends nothing');
  });
});
```

Create a test database once, then run both files. The script builds first, for the stdio test:

```bash
$ docker exec helpdesk-db psql -U postgres -c "CREATE DATABASE helpdesk_test"
$ TEST_DATABASE_URL=postgres://postgres:helpdesk@localhost:5432/helpdesk_test npm run test:e2e
...
 Test Files  2 passed (2)
      Tests  12 passed (12)
```

Each guarantee fails its test when the code is removed: the `tickets:write` scope, the team condition in each of `search()`, `findOne()` and `reply()`, the `max()` on `ticketId`, the audience and `type` checks (with `audience: false`), `allowedHosts`, the `Origin` check (with `allowedOrigins: false`), and `McpStdioLogger` (Nest's startup logs land on stdout). Expired and wrongly signed tokens are refused by `JwtVerifier` itself.

#### Production checklist

- **Point the configuration at your identity provider**, with `MCP_RESOURCE` the server's public `https` URL. Never deploy the development issuer, or a token endpoint like it.
- **Set `MCP_ALLOWED_HOSTS`** to the hostnames clients reach the server by, such as `helpdesk.example.com`.
- **List browser-based clients, if any**, in `http.allowedOrigins` and in CORS: by default, only pages on localhost get through.
- **Raise the body parser's limit** if tool arguments can exceed the Node adapter's 100 KB: `app.useBodyParser()` takes a `limit`.
- **Run `drizzle-kit migrate` as a release step**, and never the seed script: it empties the tables.
- **Keep access tokens short-lived.** The server accepts a token until it expires, without asking the provider; a user you disable keeps access until then.
- **Keep the descriptions honest.** The model knows the tools only by their names, descriptions and schemas, and `readOnlyHint` decides which calls run without asking the user.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the platform's environment: `start:prod` doesn't load `.env`. Every MCP call is then recorded under its operation, `tools/call search-tickets` or `resources/read` with the template, rather than `POST /mcp` (see [NestJS Observe](/mcp/transports#nestjs-observe)), and `enableShutdownHooks()` lets the SDK send its last batch on a deploy's `SIGTERM`.

#### What's next

- Let a policy decide each call, with `@Can()` from `@nestjs/authorization`, as [Authorization](/mcp/primitives#authorization) describes.
- Ask the user to confirm a reply inside the tool call, with `inputRequired()`: see [The call context](/mcp/primitives#the-call-context).
- Report progress from long tools, and stop when the client cancels: [The call context](/mcp/primitives#the-call-context).
- Add an MCP server to an existing API: the [MCP overview](/mcp/overview) builds one for an order API.
- Build the API side of a helpdesk with sign-in and per-record permissions: [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication) and the [project-management tutorial](/tutorials/project-management-api).
