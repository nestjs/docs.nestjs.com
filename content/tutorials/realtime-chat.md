### Build a real-time chat backend in Node.js

Build a real-time chat backend in Node.js with NestJS and Socket.IO: authenticated WebSockets, rooms, message history in PostgreSQL, and presence.

The chat has rooms with members, messages that arrive live over WebSockets and are stored in PostgreSQL, a history that clients page through over REST, and presence and typing indicators. A chat backend looks simple until you ask what happens at the edges: a user who leaves a room with a tab still open, a message broadcast and then lost on a restart, a token that expires in the middle of a connection, a client that sends a thousand messages a second. This tutorial spends its time on those.

By the end, the API will:

- Accept [Socket.IO](https://socket.io/) connections signed in with the same access tokens as the REST routes, and close each connection when its token expires.
- Store every message in PostgreSQL before broadcasting it, and check that the sender is a member of the room in the same statement that stores it, on every message.
- Validate every message a client sends with a Zod schema, and answer refusals with a status code the client can act on.
- Serve a room's history over REST, a page at a time, with keyset pagination.
- Show who has a room open, and who is typing.
- Limit how fast each user sends messages.
- Prove all of it in end-to-end tests with real Socket.IO clients, against a listening server.

It starts from the API of [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication), which signs users in with access and refresh tokens, validates requests with Zod, and keeps its data in PostgreSQL through Drizzle. This tutorial doesn't explain those parts again.

These are the endpoints and WebSocket events, and the section that adds each one:

| Endpoint or event | Section |
| --- | --- |
| `POST /auth/sign-up`, `POST /auth/token`, `POST /auth/token/refresh`, `POST /auth/token/revoke`, `GET /me`, `GET /health/live`, `GET /health/ready` | [Start from the JWT API](/tutorials/realtime-chat#start-from-the-jwt-api) |
| `POST /rooms`, `GET /rooms`, `POST /rooms/:id/members`, `DELETE /rooms/:id/members/me`, `GET /rooms/:id/messages` | [Expose rooms and history over REST](/tutorials/realtime-chat#expose-rooms-and-history-over-rest) |
| `join`, `leave`, `message` and `typing` events, sent by clients; `message`, `presence`, `typing` and `exception` events, sent by the server | [Add the WebSocket gateway](/tutorials/realtime-chat#add-the-websocket-gateway) |

> info **Hint** The finished application is on GitHub as [nestjs/example-realtime-chat](https://github.com/nestjs/example-realtime-chat), with its tests and a CI workflow.

#### Start from the JWT API

Create the project, and install everything this tutorial uses. These are the JWT tutorial's packages plus [`@nestjs/websockets`](/websockets/gateways) with its Socket.IO platform, and `socket.io-client` for the tests:

```bash
$ npm i -g @nestjs/cli
$ nest new chat-api --minimal
$ cd chat-api
$ npm uninstall @nestjs/platform-express @types/express
$ npm i --save @nestjs/platform-node zod @nestjs/config @nestjs/drizzle drizzle-orm@rc pg @nestjs/authentication @nestjs/throttler @nestjs/swagger @nestjs/terminus @nestjs/websockets @nestjs/platform-socket.io socket.io
$ npm i --save-dev drizzle-kit@rc @types/pg @nestjs/testing vitest vite @electric-sql/pglite socket.io-client
```

Then take these files from the [finished JWT tutorial](/tutorials/rest-api-jwt-authentication#sign-users-in-with-jwts), as they are:

- `src/config.ts`, `src/main.ts`, `drizzle.config.ts` and `vitest.config.e2e.ts`
- everything under `src/auth/`, `src/users/` and `src/health/`
- `test/refresh-token.store.e2e-spec.ts`

Leave out `src/notes/` and the JWT tutorial's `drizzle/` folder: this application's first migration comes from its own schema, in the next section. Rename the notes to the chat where they're named: the `realm` in `JwtAuth` (`'chat'`) and the title of the OpenAPI document in `main.ts`. Add the test script to `package.json`:

```json
"test:e2e": "vitest run --config ./vitest.config.e2e.ts"
```

Finally, add the database's URL and a `JWT_SECRET` to `.env`, as in the JWT tutorial, with a database of the chat's own:

```bash
$ docker run -d --name chat-db -e POSTGRES_PASSWORD=chat -e POSTGRES_DB=chat -p 5432:5432 postgres:17
```

Its URL goes in `.env`, next to the signing secret:

```bash
DATABASE_URL=postgres://postgres:chat@localhost:5432/chat
# Generate with: openssl rand -base64 32
JWT_SECRET=
```

#### Design the schema

The whole schema, in one file. The users and refresh tokens are the JWT tutorial's:

```typescript
@@filename(src/database/schema)
import { bigint, boolean, index, jsonb, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: at('created_at').notNull().defaultNow(),
});

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: at('created_at').notNull().defaultNow(),
});

export const roomMembers = pgTable(
  'room_members',
  {
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: at('joined_at').notNull().defaultNow(),
  },
  (table) => [
    // Leads with the room: "is this user a member of this room?" is one index lookup.
    primaryKey({ columns: [table.roomId, table.userId] }),
    // For "the rooms of this user".
    index('room_members_user_id_idx').on(table.userId),
  ],
);

export const messages = pgTable(
  'messages',
  {
    // From a sequence, not a UUID: ids grow with time, so "before id X" is a page of history.
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  // Serves the history query: one room's messages, newest first, from any id.
  (table) => [index('messages_room_id_id_idx').on(table.roomId, table.id)],
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

export type Room = typeof rooms.$inferSelect;
export type Message = typeof messages.$inferSelect;
```

- **A room's members are a table, keyed by room and user.** Every message checks it, so the check is one lookup on the primary key, which leads with the room. The second index serves "the rooms of this user".
- **Message ids come from a sequence**, not `gen_random_uuid()`. They grow as messages are stored, so "the messages before id 120" is a well-defined page, and sorting by id is sorting by the order the database stored them in. UUIDs don't sort that way.
- **`(room_id, id)` is indexed together.** The history query reads one room's messages from a given id downwards, which is a scan of that index, however long the room's history grows.

Generate the migration and apply it (see [Migrations](/data/drizzle#migrations)):

```bash
$ npx drizzle-kit generate --name=chat
$ npx drizzle-kit migrate
```

#### Manage rooms and members

The schemas for everything clients send, over REST and over the socket:

```typescript
@@filename(src/chat/chat.schemas)
import { z } from 'zod';

// Over REST

export const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type CreateRoomDto = z.infer<typeof createRoomSchema>;

export const addMemberSchema = z.object({
  email: z.email(),
});
export type AddMemberDto = z.infer<typeof addMemberSchema>;

export const historyQuerySchema = z.object({
  // The oldest message id the client has; omit it for the newest page.
  before: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type HistoryQuery = z.infer<typeof historyQuerySchema>;

// Over the socket

export const roomRefSchema = z.object({
  roomId: z.uuid(),
});
export type RoomRef = z.infer<typeof roomRefSchema>;

export const sendMessageSchema = z.object({
  roomId: z.uuid(),
  body: z.string().trim().min(1).max(4_000),
});
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
```

Any member of a room can add another user to it by email, and any member can leave. The service takes the signed-in user's id as its first argument, as the JWT tutorial's notes service does:

```typescript
@@filename(src/chat/rooms.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { roomMembers, rooms, users, type Room } from '../database/schema.js';

@Injectable()
export class RoomsService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  /** Creates a room with its creator as the first member. */
  create(userId: string, name: string): Promise<Room> {
    return this.db.transaction(async (tx) => {
      const [room] = await tx.insert(rooms).values({ name }).returning();
      await tx.insert(roomMembers).values({ roomId: room.id, userId });
      return room;
    });
  }

  findMine(userId: string): Promise<Room[]> {
    return this.db
      .select({ id: rooms.id, name: rooms.name, createdAt: rooms.createdAt })
      .from(rooms)
      .innerJoin(roomMembers, eq(roomMembers.roomId, rooms.id))
      .where(eq(roomMembers.userId, userId))
      .orderBy(asc(rooms.name), asc(rooms.id));
  }

  /** A member adds another user, by email. Adding a member twice changes nothing. */
  async addMember(userId: string, roomId: string, email: string): Promise<void> {
    // One statement: the caller must be a member, and the user must exist.
    const added = await this.db
      .insert(roomMembers)
      .select((qb) =>
        qb
          .select({ roomId: roomMembers.roomId, userId: users.id })
          .from(roomMembers)
          .innerJoin(users, eq(users.email, normalize(email)))
          .where(this.membership(userId, roomId)),
      )
      .onConflictDoNothing()
      .returning({ userId: roomMembers.userId });
    if (added.length === 0) {
      // Not added: find out why, for the status code.
      await this.assertMember(userId, roomId);
      const [user] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalize(email)));
      if (!user) {
        throw new NotFoundException('User not found');
      }
      // Otherwise, they were a member already.
    }
  }

  async leave(userId: string, roomId: string): Promise<void> {
    const left = await this.db
      .delete(roomMembers)
      .where(this.membership(userId, roomId))
      .returning({ userId: roomMembers.userId });
    if (left.length === 0) {
      notFound();
    }
  }

  /** 404 unless the user is a member: other people's rooms are as missing as rooms that don't exist. */
  async assertMember(userId: string, roomId: string): Promise<void> {
    const [member] = await this.db
      .select({ one: sql`1` })
      .from(roomMembers)
      .where(this.membership(userId, roomId));
    if (!member) {
      notFound();
    }
  }

  private membership(userId: string, roomId: string) {
    return and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId));
  }
}

function notFound(): never {
  throw new NotFoundException('Room not found');
}

const normalize = (email: string) => email.trim().normalize('NFC').toLowerCase();
```

- **Adding a member is one `INSERT ... SELECT`.** The rows it inserts come from the caller's own membership, joined with the user the email names. When the caller isn't a member, or there's no such user, the `SELECT` finds nothing and nothing is inserted, so there's no moment between a check and the write when the answer could change. `ON CONFLICT DO NOTHING` makes adding someone twice a no-op rather than a 500.
- **Only a failed insert pays for a second look.** When nothing was inserted, `addMember()` queries again to choose the status code: 404 for a room the caller isn't in, 404 for an unknown email, and 204 when the user was a member already.
- **Someone else's room is a 404**, the same answer as a room that doesn't exist, so room ids don't leak.
- **Leaving is a `DELETE` with the membership in its `WHERE` clause**, and its result says whether there was a membership to end.

#### Store and page through messages

Messages go through their own service. Posting checks the membership, and storing it is the same statement:

```typescript
@@filename(src/chat/messages.service)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq, lt, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { messages, roomMembers, type Message } from '../database/schema.js';
import type { HistoryQuery } from './chat.schemas.js';
import { RoomsService } from './rooms.service.js';

export interface MessagePage {
  /** Newest first. */
  messages: Message[];
  /** Pass as `before` for the next, older page; `null` on the oldest page. */
  nextBefore: number | null;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly roomsService: RoomsService,
  ) {}

  /** Stores a message, if its author is a member of the room. */
  async post(authorId: string, roomId: string, body: string): Promise<Message> {
    // The membership row is the source of the insert: a non-member's message,
    // or one sent the moment its author left, inserts nothing.
    const [message] = await this.db
      .insert(messages)
      .select((qb) =>
        qb
          .select({ roomId: roomMembers.roomId, authorId: roomMembers.userId, body: sql<string>`${body}`.as('body') })
          .from(roomMembers)
          .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, authorId))),
      )
      .returning();
    if (!message) {
      throw new NotFoundException('Room not found');
    }
    return message;
  }

  /** A page of a room's history, older than `before`. */
  async history(userId: string, roomId: string, { before, limit }: HistoryQuery): Promise<MessagePage> {
    await this.roomsService.assertMember(userId, roomId);
    const rows = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.roomId, roomId), before ? lt(messages.id, before) : undefined))
      .orderBy(desc(messages.id))
      // One more than asked for: whether it comes back says if there's an older page.
      .limit(limit + 1);
    const page = rows.slice(0, limit);
    return { messages: page, nextBefore: rows.length > limit ? page[page.length - 1].id : null };
  }
}
```

- **The membership row is the source of the insert.** `INSERT INTO messages ... SELECT ... FROM room_members WHERE room_id = $1 AND user_id = $2` inserts one row for a member and none for anyone else. A user who leaves the room while their message is on its way either posts before the `DELETE` commits or inserts nothing: there's no check that passed a moment ago and is stale now.
- **The history is a keyset page.** `WHERE room_id = $1 AND id < $before ORDER BY id DESC LIMIT n` starts from the oldest message the client has, and walks the `(room_id, id)` index from there. An `OFFSET` would read and throw away every newer message first, and shift by one each time someone posts while a user scrolls back.
- **It asks for one row more than the page.** Whether that row comes back says if there's an older page, so `nextBefore` is `null` on the last page instead of pointing at an empty one.
- **Reading the history checks the membership first**, as a separate query. It's a read: nothing is written between the check and the query that could be undone.

#### Add the WebSocket gateway

A [gateway](/websockets/gateways) handles the messages clients send over the socket. This tutorial uses Socket.IO, through `@nestjs/platform-socket.io`, rather than the `ws` library:

- **The access token goes in the handshake.** Browsers can't set an `Authorization` header on a WebSocket connection. A Socket.IO client sends the token in the `auth` payload of its handshake instead, and `JwtBearerProvider` reads it from there, so the gateway signs users in with the same tokens and the same `JwtAuth` provider as the REST routes.
- **Rooms are built in.** Socket.IO keeps a set of sockets per room, and broadcasts to one, which is what a chat room needs.
- **Acknowledgments are built in.** A client that sends a message gets the server's answer to that message, here the stored message with its id.
- **It scales out with an adapter**, as [Run more than one instance](/tutorials/realtime-chat#run-more-than-one-instance) describes.

With `@nestjs/platform-socket.io` installed, Nest serves Socket.IO on the HTTP server's port, under `/socket.io/`, with the Node adapter too. Nothing changes in `main.ts`.

Who has a room open is kept in memory, per socket, so that a user with two tabs open goes offline when they close the second one:

```typescript
@@filename(src/chat/presence.service)
import { Injectable } from '@nestjs/common';

/** Who has each room open, on this instance: room id, then socket id, then user id. */
@Injectable()
export class PresenceService {
  private readonly rooms = new Map<string, Map<string, string>>();

  /** Whether this is the user's first socket in the room. */
  add(roomId: string, socketId: string, userId: string): boolean {
    const sockets = this.rooms.get(roomId) ?? new Map<string, string>();
    this.rooms.set(roomId, sockets);
    const first = !this.has(sockets, userId);
    sockets.set(socketId, userId);
    return first;
  }

  /** Removes one socket. Returns its user if that was their last socket in the room. */
  remove(roomId: string, socketId: string): string | undefined {
    const sockets = this.rooms.get(roomId);
    const userId = sockets?.get(socketId);
    if (!sockets || !userId) {
      return undefined;
    }
    sockets.delete(socketId);
    this.prune(roomId, sockets);
    return this.has(sockets, userId) ? undefined : userId;
  }

  /** Removes every socket of a user. Returns whether they had one. */
  removeUser(roomId: string, userId: string): boolean {
    const sockets = this.rooms.get(roomId);
    if (!sockets || !this.has(sockets, userId)) {
      return false;
    }
    for (const [socketId, user] of sockets) {
      if (user === userId) {
        sockets.delete(socketId);
      }
    }
    this.prune(roomId, sockets);
    return true;
  }

  online(roomId: string): string[] {
    return [...new Set(this.rooms.get(roomId)?.values())];
  }

  private has(sockets: Map<string, string>, userId: string): boolean {
    return [...sockets.values()].includes(userId);
  }

  private prune(roomId: string, sockets: Map<string, string>) {
    if (sockets.size === 0) {
      this.rooms.delete(roomId);
    }
  }
}
```

The gateway:

```typescript
@@filename(src/chat/chat.gateway)
import { UseFilters } from '@nestjs/common';
import { CurrentUser, WsAuthenticator, type JwtClaims } from '@nestjs/authentication';
import { Throttle, seconds } from '@nestjs/throttler';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { User } from '../users/user.js';
import { ChatExceptionFilter } from './chat-exception.filter.js';
import { roomRefSchema, sendMessageSchema, type RoomRef, type SendMessageDto } from './chat.schemas.js';
import { MessagesService } from './messages.service.js';
import { PresenceService } from './presence.service.js';
import { RoomsService } from './rooms.service.js';

/** The socket.io room of a chat room: its open sockets, which receive its messages. */
const roomChannel = (roomId: string) => `room:${roomId}`;
/** Every socket of one user, on every instance. */
const userChannel = (userId: string) => `user:${userId}`;

@UseFilters(new ChatExceptionFilter())
@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  constructor(
    private readonly wsAuthenticator: WsAuthenticator,
    private readonly roomsService: RoomsService,
    private readonly messagesService: MessagesService,
    private readonly presence: PresenceService,
  ) {}

  async handleConnection(client: Socket) {
    // Registered first: socket.io empties `client.rooms` before "disconnect".
    client.on('disconnecting', () => this.closeRooms(client));
    // Closes the connection (and returns null) unless the handshake carries a valid access token.
    const auth = await this.wsAuthenticator.authenticateConnection(client);
    if (!auth) {
      return;
    }
    const { id } = auth.user as User;
    client.data.userId = id;
    await client.join(userChannel(id));
    // A connection lasts as long as its access token. The client then
    // reconnects with a fresh one, as it would send one with a request.
    const { exp } = auth.session as JwtClaims;
    if (exp) {
      const expiry = setTimeout(() => client.disconnect(true), exp * 1000 - Date.now());
      client.on('disconnect', () => clearTimeout(expiry));
    }
  }

  /** Opens a room: the socket receives its messages, typing and presence. */
  @SubscribeMessage('join')
  async join(
    @CurrentUser('id') userId: string,
    @ConnectedSocket() client: Socket,
    @MessageBody({ schema: roomRefSchema }) { roomId }: RoomRef,
  ) {
    await this.roomsService.assertMember(userId, roomId);
    await client.join(roomChannel(roomId));
    if (this.presence.add(roomId, client.id, userId)) {
      client.to(roomChannel(roomId)).emit('presence', { roomId, userId, online: true });
    }
    return { roomId, online: this.presence.online(roomId) };
  }

  /** Closes a room on this socket. The user stays a member. */
  @SubscribeMessage('leave')
  async leave(@ConnectedSocket() client: Socket, @MessageBody({ schema: roomRefSchema }) { roomId }: RoomRef) {
    await client.leave(roomChannel(roomId));
    this.wentAway(roomId, this.presence.remove(roomId, client.id));
    return { roomId };
  }

  @Throttle({ default: { limit: 10, ttl: seconds(10) } })
  @SubscribeMessage('message')
  async message(
    @CurrentUser('id') userId: string,
    @ConnectedSocket() client: Socket,
    @MessageBody({ schema: sendMessageSchema }) { roomId, body }: SendMessageDto,
  ) {
    // Stored first, then broadcast: nobody sees a message that a restart could lose.
    const message = await this.messagesService.post(userId, roomId, body);
    client.to(roomChannel(roomId)).emit('message', message);
    // The acknowledgment: the sender learns the message's id.
    return message;
  }

  @SubscribeMessage('typing')
  typing(
    @CurrentUser('id') userId: string,
    @ConnectedSocket() client: Socket,
    @MessageBody({ schema: roomRefSchema }) { roomId }: RoomRef,
  ) {
    // Only from a socket that opened the room, which checked the membership.
    if (client.rooms.has(roomChannel(roomId))) {
      client.to(roomChannel(roomId)).emit('typing', { roomId, userId });
    }
  }

  /** After a user leaves a room over REST: their open sockets stop receiving it. */
  removeFromRoom(roomId: string, userId: string) {
    this.server.in(userChannel(userId)).socketsLeave(roomChannel(roomId));
    if (this.presence.removeUser(roomId, userId)) {
      this.wentAway(roomId, userId);
    }
  }

  private closeRooms(client: Socket) {
    for (const channel of client.rooms) {
      if (channel.startsWith('room:')) {
        const roomId = channel.slice('room:'.length);
        this.wentAway(roomId, this.presence.remove(roomId, client.id));
      }
    }
  }

  private wentAway(roomId: string, userId: string | undefined) {
    if (userId) {
      this.server.to(roomChannel(roomId)).emit('presence', { roomId, userId, online: false });
    }
  }
}
```

- **The handshake is authenticated with `WsAuthenticator`.** Nest runs no guards on `handleConnection()`. `authenticateConnection()` runs the same credential providers as the guard, and disconnects a socket without a valid access token. See [GraphQL and WebSockets](/security/authentication#graphql-and-websockets). The client sees its `connect` event, then a `disconnect` with the reason `io server disconnect`.
- **Every message is authenticated again.** The global authentication guard runs for each `@SubscribeMessage()` handler, as for each route, and `@CurrentUser('id')` reads the user of that message. Nest doesn't wait for `handleConnection()` before it handles a socket's messages, so the handshake isn't a gate on its own: the guard is.
- **A connection lasts as long as its access token.** The token was checked once, at the handshake, and a socket can stay open for days. A timer disconnects it when the token's `exp` passes, and the client reconnects with a fresh token, as [Try it](/tutorials/realtime-chat#try-it) shows. Without it, a socket whose token expired would get a 401 for every message it sends, and keep receiving the room's messages for as long as it stays open.
- **The membership is checked on every message, not only on `join`.** `join` checks it before the socket enters the room's channel, so only members receive a room's messages. But a client can send a `message` to any room id, whether it joined or not, so `post()` checks again, in the statement that stores the message.
- **Messages are stored first, then broadcast.** If the process dies between the two, the message is in the history, where every client finds it when it reconnects. The other order would show the room a message that a restart could lose.
- **The sender gets the acknowledgment; everyone else gets the broadcast.** `client.to(channel)` reaches every socket in the room except the sender's, including the sender's other tabs. Both carry the same message, with its id.
- **Typing is relayed, not stored.** A typing event is worth nothing a few seconds later, so it never reaches the database. It's relayed only from a socket that joined the room, which passed the membership check.
- **Leaving over REST empties the user's sockets out of the room.** Each socket joins a channel of its user at connection, so `removeFromRoom()` can reach all of a user's sockets, and with an adapter, on every instance.

Nest's WebSocket exception filter sends a client the message of a `WsException` only. Anything else reaches the client as "Internal server error": the `NotFoundException` that the services throw for the REST routes, and the validation pipe's `BadRequestException`. A `WsException` that carries an object, such as the authentication guard's 401, is sent without the `cause` that says which message it answers. The gateway's filter gives every refusal the same shape (see [Exception filters](/websockets/exception-filters)):

```typescript
@@filename(src/chat/chat-exception.filter)
import { type ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

/**
 * Sends each refusal to the client as an "exception" event with its status code, its message,
 * and the event and payload it refuses, so the client can tell which message failed.
 */
@Catch(HttpException, WsException)
export class ChatExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: HttpException | WsException, host: ArgumentsHost) {
    const ws = host.switchToWs();
    const cause = { pattern: ws.getPattern(), data: ws.getData() };
    super.catch(new WsException({ status: 'error', ...bodyOf(exception), cause }), host);
  }
}

function bodyOf(exception: HttpException | WsException): object {
  if (exception instanceof WsException) {
    const error = exception.getError();
    return typeof error === 'string' ? { message: error } : error;
  }
  // The services' exceptions, and the validation pipe's, which the client
  // would otherwise get as "Internal server error".
  const response = exception.getResponse();
  return typeof response === 'string' ? { statusCode: exception.getStatus(), message: response } : response;
}
```

The global `StandardSchemaValidationPipe` from the JWT tutorial validates `@MessageBody()` against its `schema`, as it validates `@Body()`, so a malformed message never reaches a handler. A refused message gets no acknowledgment. The client receives an `exception` event instead, whose `cause` names the event and payload it refuses:

```json
{
  "status": "error",
  "message": ["body: Too small: expected string to have >=1 characters"],
  "error": "Bad Request",
  "statusCode": 400,
  "cause": { "pattern": "message", "data": { "roomId": "5122632a-7885-4d6a-a7b8-8f03f54a4a98", "body": "   " } }
}
```

#### Expose rooms and history over REST

Creating rooms, adding members and reading the history are ordinary requests, and stay on REST: they need no open connection, and they keep the JWT tutorial's validation, rate limits and OpenAPI document.

```typescript
@@filename(src/chat/rooms.controller)
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { z } from 'zod';
import { ChatGateway } from './chat.gateway.js';
import {
  addMemberSchema,
  createRoomSchema,
  historyQuerySchema,
  type AddMemberDto,
  type CreateRoomDto,
  type HistoryQuery,
} from './chat.schemas.js';
import { MessagesService } from './messages.service.js';
import { RoomsService } from './rooms.service.js';

const roomId = { schema: z.uuid() };

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly messagesService: MessagesService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body({ schema: createRoomSchema }) { name }: CreateRoomDto) {
    return this.roomsService.create(userId, name);
  }

  @Get()
  findMine(@CurrentUser('id') userId: string) {
    return this.roomsService.findMine(userId);
  }

  @Post(':id/members')
  @HttpCode(204)
  addMember(
    @CurrentUser('id') userId: string,
    @Param('id', roomId) id: string,
    @Body({ schema: addMemberSchema }) { email }: AddMemberDto,
  ) {
    return this.roomsService.addMember(userId, id, email);
  }

  @Delete(':id/members/me')
  @HttpCode(204)
  async leave(@CurrentUser('id') userId: string, @Param('id', roomId) id: string) {
    await this.roomsService.leave(userId, id);
    this.chatGateway.removeFromRoom(id, userId);
  }

  @Get(':id/messages')
  history(
    @CurrentUser('id') userId: string,
    @Param('id', roomId) id: string,
    @Query({ schema: historyQuerySchema }) query: HistoryQuery,
  ) {
    return this.messagesService.history(userId, id, query);
  }
}
```

`POST /rooms/:id/members` and `DELETE /rooms/:id/members/me` answer `204 No Content`: the client already knows what changed. Leaving calls the gateway, so the user's open sockets stop receiving the room at once, not when they next reconnect.

```typescript
@@filename(src/chat/chat.module)
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway.js';
import { MessagesService } from './messages.service.js';
import { PresenceService } from './presence.service.js';
import { RoomsController } from './rooms.controller.js';
import { RoomsService } from './rooms.service.js';

@Module({
  controllers: [RoomsController],
  providers: [ChatGateway, RoomsService, MessagesService, PresenceService],
})
export class ChatModule {}
```

#### Rate-limit messages

The JWT tutorial's global `ThrottlerGuard` runs for gateway messages too, and so does its `default` throttler. Over a WebSocket, the "request" it counts by is the socket, which has no `ip`, so every client's messages would share one counter: one noisy user would block everyone. Give the `default` throttler a tracker that counts gateway messages per user. The rate-limiting chapter's [WebSockets](/security/rate-limiting#websockets) section does this with a subclass of the guard; the `getTracker` option, which receives the `ExecutionContext` too (see [Configuration](/security/rate-limiting#configuration)), does it without one:

```typescript
@@filename(src/chat/throttler-tracker)
import type { ExecutionContext } from '@nestjs/common';
import { normalizeIp } from '@nestjs/throttler';

/**
 * What the throttler counts by. Over WebSockets, `req` is the socket, which has no `ip`:
 * without this, every client's messages would share one counter.
 */
export function tracker(req: Record<string, any>, context: ExecutionContext): string {
  if (context.getType() === 'ws') {
    // The user that the handshake signed in, or the address until it has.
    return req.data.userId ?? normalizeIp(req.handshake.address);
  }
  return normalizeIp(req.ip);
}
```

`client.data.userId` is set in `handleConnection()`, once the handshake is authenticated. With this tracker, every gateway event counts against the `default` limit of 100 per minute, per user: `join`, `leave` and `typing` included. `message` has a tighter limit of its own, 10 every 10 seconds, from the `@Throttle()` on its handler. The 11th message gets an `exception` event with the status code 429, which the filter passes on with the throttler's message.

The root module, with the chat module and the tracker:

```typescript
@@filename(src/app.module)
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { DrizzleModule } from '@nestjs/drizzle';
import { createObserveModule } from '@nestjs/observe';
import { ThrottlerGuard, ThrottlerModule, minutes, normalizeIp } from '@nestjs/throttler';
import { drizzle } from 'drizzle-orm/node-postgres';
import { accountEmail } from './auth/account-email.js';
import { AuthModule } from './auth/auth.module.js';
import { ChatModule } from './chat/chat.module.js';
import { tracker } from './chat/throttler-tracker.js';
import { envSchema, type Env } from './config.js';
import { HealthModule } from './health/health.module.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'chat-api',
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
          issuer: 'chat-api',
          audience: 'chat-api',
          ttl: '15m',
        },
        refreshToken: { ttl: '30d', absoluteTtl: '90d' },
      }),
    }),
    ThrottlerModule.forRoot([
      // Per IP address on every route, and per user on the chat gateway.
      { name: 'default', ttl: minutes(1), limit: 100, getTracker: tracker },
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
    ChatModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

#### Run more than one instance

Everything above runs on one instance. On several behind a load balancer, three things are per process and stop being enough:

- **Broadcasts.** `client.to(channel).emit()` reaches the sockets connected to this instance only. A [Redis adapter](/websockets/adapter#extend-socketio) shares broadcasts and `socketsLeave()` between the instances, so `removeFromRoom()` reaches a user's sockets wherever they are connected. As that chapter warns, Redis alone isn't enough: Socket.IO clients start with HTTP long-polling, whose requests must all reach the same instance. Either use sticky sessions at the load balancer, or connect with `transports: ['websocket']`, as this tutorial's clients do.
- **Presence.** `PresenceService` knows the sockets of its own instance. To show who's online across instances, keep the same map in Redis, with an expiry per instance so that a crashed instance's sockets disappear, or ask every instance with Socket.IO's `fetchSockets()`, which the Redis adapter supports.
- **Rate limits.** The throttler counts in memory, so each instance counts on its own. Use shared [storage](/security/rate-limiting#storages) such as Redis.

The messages themselves need nothing: they are in PostgreSQL, and every instance reads the same history.

#### Try it

Socket.IO speaks its own protocol over the WebSocket, so curl can't join a room. A small client in `scripts/` can. It connects with an access token, joins a room, prints what the server sends, and sends each line you type as a message:

```typescript
@@filename(scripts/chat)
// A terminal client for trying the chat: TOKEN=<access token> node scripts/chat.ts <room id>
import { createInterface } from 'node:readline';
import { io } from 'socket.io-client';

const roomId = process.argv[2];
const socket = io(process.env.CHAT_URL ?? 'http://localhost:3000', {
  // The access token, which JwtBearerProvider reads from the handshake.
  auth: { token: process.env.TOKEN },
  // Straight to a WebSocket, without long-polling first.
  transports: ['websocket'],
});

const print = (event: string) => (data: unknown) => console.log(event, JSON.stringify(data));

socket.on('connect', () => {
  // Rooms are opened per connection: open it again after every reconnect.
  socket.emit('join', { roomId }, print('joined'));
});
socket.on('message', print('message'));
socket.on('presence', print('presence'));
socket.on('typing', print('typing'));
socket.on('exception', print('exception'));
socket.on('disconnect', print('disconnect'));

// Each line is a message.
for await (const body of createInterface({ input: process.stdin })) {
  socket.emit('typing', { roomId });
  try {
    print('sent')(await socket.timeout(5000).emitWithAck('message', { roomId, body }));
  } catch {
    // Refused: the "exception" event says why.
  }
}
socket.close();
```

Node.js 22.18 and later run a TypeScript file like this one directly. Start the application:

```bash
$ npm run start
```

Sign up Ada and Bob, and Eve, who won't be in the room. Ada creates a room and adds Bob (tokens, ids and timestamps are shortened here and below):

```bash
$ curl localhost:3000/auth/sign-up --json '{"email":"ada@example.com","password":"correct horse battery"}'
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","refreshToken":"hpJMLcGsMXSATrZ2...","expiresIn":900}
$ ADA=eyJhbGciOiJIUzI1NiIs...
$ BOB=eyJhbGciOiJIUzI1NiIs...
$ EVE=eyJhbGciOiJIUzI1NiIs...
$ curl localhost:3000/rooms -H "Authorization: Bearer $ADA" --json '{"name":"general"}'
{"id":"5122632a-7885-4d6a-a7b8-8f03f54a4a98","name":"general","createdAt":"2026-11-19T22:08:55.613Z"}
$ ROOM=5122632a-7885-4d6a-a7b8-8f03f54a4a98
$ curl -i localhost:3000/rooms/$ROOM/members -H "Authorization: Bearer $ADA" --json '{"email":"bob@example.com"}'
HTTP/1.1 204 No Content
$ curl localhost:3000/rooms -H "Authorization: Bearer $BOB"
[{"id":"5122632a-7885-4d6a-a7b8-8f03f54a4a98","name":"general","createdAt":"2026-11-19T22:08:55.613Z"}]
```

In a second terminal, Bob opens the room. In the first, Ada opens it too, and types a message, which Bob answers (the lines without an event name are what each of them typed):

Bob's terminal:

```bash
$ TOKEN=$BOB node scripts/chat.ts $ROOM
joined {"roomId":"5122632a-...","online":["7154be3b-..."]}
presence {"roomId":"5122632a-...","userId":"092e1b0b-...","online":true}
typing {"roomId":"5122632a-...","userId":"092e1b0b-..."}
message {"id":1,"roomId":"5122632a-...","authorId":"092e1b0b-...","body":"Hi Bob","createdAt":"2026-11-19T22:08:58.259Z"}
Hi Ada
sent {"id":2,"roomId":"5122632a-...","authorId":"7154be3b-...","body":"Hi Ada","createdAt":"2026-11-19T22:08:59.252Z"}
```

Ada's terminal:

```bash
$ TOKEN=$ADA node scripts/chat.ts $ROOM
joined {"roomId":"5122632a-...","online":["7154be3b-...","092e1b0b-..."]}
Hi Bob
sent {"id":1,"roomId":"5122632a-...","authorId":"092e1b0b-...","body":"Hi Bob","createdAt":"2026-11-19T22:08:58.259Z"}
typing {"roomId":"5122632a-...","userId":"7154be3b-..."}
message {"id":2,"roomId":"5122632a-...","authorId":"7154be3b-...","body":"Hi Ada","createdAt":"2026-11-19T22:08:59.252Z"}
```

Each message reaches the other side as the same object its sender got in the acknowledgment, id included.

Eve isn't a member. She can connect, since her token is valid, but she can't open the room or post to it:

```bash
$ TOKEN=$EVE node scripts/chat.ts $ROOM
exception {"status":"error","message":"Room not found","error":"Not Found","statusCode":404,"cause":{"pattern":"join","data":{"roomId":"5122632a-..."}}}
Let me in
exception {"status":"error","message":"Room not found","error":"Not Found","statusCode":404,"cause":{"pattern":"message","data":{"roomId":"5122632a-...","body":"Let me in"}}}
```

The history, one message per page, newest first. `nextBefore` is the `before` of the next page, and `null` on the last:

```bash
$ curl "localhost:3000/rooms/$ROOM/messages?limit=1" -H "Authorization: Bearer $ADA"
{"messages":[{"id":2,"roomId":"5122632a-...","authorId":"7154be3b-...","body":"Hi Ada","createdAt":"2026-11-19T22:08:59.252Z"}],"nextBefore":2}
$ curl "localhost:3000/rooms/$ROOM/messages?limit=1&before=2" -H "Authorization: Bearer $ADA"
{"messages":[{"id":1,"roomId":"5122632a-...","authorId":"092e1b0b-...","body":"Hi Bob","createdAt":"2026-11-19T22:08:58.259Z"}],"nextBefore":null}
$ curl "localhost:3000/rooms/$ROOM/messages?limit=1" -H "Authorization: Bearer $EVE"
{"message":"Room not found","error":"Not Found","statusCode":404}
```

Bob leaves the room over REST, with his client still running. Ada's client sees him go, and Bob's next message is refused, by the same `INSERT ... SELECT` that stores messages:

```bash
$ curl -i -X DELETE localhost:3000/rooms/$ROOM/members/me -H "Authorization: Bearer $BOB"
HTTP/1.1 204 No Content
```

In Ada's terminal:

```bash
presence {"roomId":"5122632a-...","userId":"7154be3b-...","online":false}
```

In Bob's:

```bash
Still here?
exception {"status":"error","message":"Room not found","error":"Not Found","statusCode":404,"cause":{"pattern":"message","data":{"roomId":"5122632a-...","body":"Still here?"}}}
```

A real client also handles the end of a connection: when the access token expires, the server disconnects the socket, and the client refreshes the token over REST and connects again. With `auth` as a function, Socket.IO asks for the token before every connection attempt:

```typescript
const socket = io('https://chat.example.com', {
  // Called before every connection attempt, so a reconnect sends the current token.
  auth: (send) => send({ token: accessToken }),
  transports: ['websocket'],
});

socket.on('disconnect', async (reason) => {
  // The server ends the connection when its access token expires.
  if (reason === 'io server disconnect') {
    await refreshTokens(); // POST /auth/token/refresh, which sets accessToken
    socket.connect();
  }
});
```

The `connect` handler runs again after the reconnect, and opens the rooms again: a room is joined per connection, not per user. Messages can arrive in a different order than their ids, so a client shows them sorted by id, and drops one it already has, such as a message it fetched with the history and then received live.

#### Test it

The tests start the real application on a free port with `app.listen(0)`, and connect to it with `socket.io-client`, as a browser would. The database is PGlite, as in the JWT tutorial's tests: what the chat guarantees comes from single statements, not from how concurrent transactions interleave, so a single connection tests it faithfully.

```typescript
@@filename(test/chat.e2e-spec)
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { PasswordHasher } from '@nestjs/authentication';
import { getDrizzleToken } from '@nestjs/drizzle';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { io, type Socket } from 'socket.io-client';
import { AppModule, ObserveInstrument } from '../src/app.module.js';

describe('Chat (e2e)', () => {
  const pglite = new PGlite(); // PostgreSQL in-process: no server to start
  let app: NestNodeApplication;
  let url: string;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    const db = drizzle({ client: pglite });
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    // Instrumented as in main.ts, so NestJS Observe sees the gateway's handlers.
    const moduleRef = await Test.createTestingModule(
      { imports: [AppModule] },
      { instrument: ObserveInstrument },
    )
      .overrideProvider(getDrizzleToken())
      .useValue(db)
      // scrypt at the default cost takes 128 MiB and a few hundred ms per hash.
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .compile();
    app = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter());
    // A real server on a free port: the sockets connect to it like any client.
    await app.listen(0);
    url = await app.getUrl();
  });

  afterEach(() => {
    for (const socket of sockets.splice(0)) {
      socket.disconnect();
    }
  });

  afterAll(async () => {
    await app.close();
    await pglite.close();
  });

  let clients = 0;

  /** Signs a user up, and returns their id, the headers of their requests, and their access token. */
  async function signUp(name: string) {
    const signedUp = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email: `${name}@example.com`, password: 'correct horse battery' },
      // Sign-up is rate-limited per IP address: each user signs up from their own.
      remoteAddress: `10.0.0.${++clients}`,
    });
    const { accessToken } = signedUp.json<{ accessToken: string }>();
    const headers = { authorization: `Bearer ${accessToken}` };
    const { id } = (await app.inject({ method: 'GET', url: '/me', headers })).json<{ id: string }>();
    return { id, headers, accessToken };
  }

  /** A room with its creator and the other users as members. */
  async function createRoom(creator: Awaited<ReturnType<typeof signUp>>, ...members: string[]) {
    const res = await app.inject({
      method: 'POST',
      url: '/rooms',
      headers: creator.headers,
      payload: { name: 'general' },
    });
    const { id } = res.json<{ id: string }>();
    for (const name of members) {
      const added = await app.inject({
        method: 'POST',
        url: `/rooms/${id}/members`,
        headers: creator.headers,
        payload: { email: `${name}@example.com` },
      });
      expect(added.statusCode).toBe(204);
    }
    return id;
  }

  /** An access token like the API's own, that expires within two seconds. */
  function shortLivedToken(sub: string) {
    const now = Math.floor(Date.now() / 1000);
    const encode = (part: object) => Buffer.from(JSON.stringify(part)).toString('base64url');
    const claims = { sub, iss: 'chat-api', aud: 'chat-api', iat: now, exp: now + 2 };
    const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}`;
    return `${unsigned}.${createHmac('sha256', process.env.JWT_SECRET!).update(unsigned).digest('base64url')}`;
  }

  /** A socket.io client, as a browser would open it, with the access token in the handshake. */
  function open(token: string): Socket {
    const socket = io(url, { auth: { token }, transports: ['websocket'] });
    sockets.push(socket);
    return socket;
  }

  function connect(token: string): Promise<Socket> {
    const socket = open(token);
    return new Promise((resolve) => socket.on('connect', () => resolve(socket)));
  }

  /** The next `event` the socket receives. */
  function next<T = any>(socket: Socket, event: string): Promise<T> {
    return new Promise((resolve) => socket.once(event, resolve));
  }

  /** Sends a message and waits for the server's acknowledgment. */
  function send(socket: Socket, event: string, data: unknown) {
    return socket.timeout(2000).emitWithAck(event, data);
  }

  it('disconnects a client without a valid access token', async () => {
    const socket = open('not-a-token');
    expect(await next(socket, 'disconnect')).toBe('io server disconnect');
  });

  it('stores a message, then delivers it to the room', async () => {
    const ada = await signUp('ada');
    const bob = await signUp('bob');
    const roomId = await createRoom(ada, 'bob');
    const adaSocket = await connect(ada.accessToken);
    const bobSocket = await connect(bob.accessToken);
    await send(adaSocket, 'join', { roomId });
    const joined = await send(bobSocket, 'join', { roomId });
    expect(joined.online.sort()).toEqual([ada.id, bob.id].sort());

    const received = next(bobSocket, 'message');
    const ack = await send(adaSocket, 'message', { roomId, body: 'Hi Bob' });

    expect(await received).toEqual(ack);
    expect(ack).toMatchObject({ roomId, authorId: ada.id, body: 'Hi Bob' });
    const history = await app.inject({ method: 'GET', url: `/rooms/${roomId}/messages`, headers: bob.headers });
    expect(history.json().messages).toEqual([ack]);
  });

  it("refuses a non-member's message, and stores nothing", async () => {
    const carol = await signUp('carol');
    const eve = await signUp('eve');
    const roomId = await createRoom(carol);
    const eveSocket = await connect(eve.accessToken);

    const refused = next(eveSocket, 'exception');
    eveSocket.emit('message', { roomId, body: 'Let me in' });

    expect(await refused).toEqual({
      status: 'error',
      statusCode: 404,
      message: 'Room not found',
      error: 'Not Found',
      cause: { pattern: 'message', data: { roomId, body: 'Let me in' } },
    });
    const history = await app.inject({ method: 'GET', url: `/rooms/${roomId}/messages`, headers: carol.headers });
    expect(history.json().messages).toEqual([]);
    expect(
      (await app.inject({ method: 'GET', url: `/rooms/${roomId}/messages`, headers: eve.headers })).statusCode,
    ).toBe(404);
  });

  it('checks the membership on every message, not only on join', async () => {
    const dan = await signUp('dan');
    const fay = await signUp('fay');
    const roomId = await createRoom(dan, 'fay');
    const danSocket = await connect(dan.accessToken);
    const faySocket = await connect(fay.accessToken);
    await send(danSocket, 'join', { roomId });
    const cameOnline = next(danSocket, 'presence');
    await send(faySocket, 'join', { roomId });
    expect(await cameOnline).toEqual({ roomId, userId: fay.id, online: true });

    const wentOffline = next(danSocket, 'presence');
    const left = await app.inject({ method: 'DELETE', url: `/rooms/${roomId}/members/me`, headers: fay.headers });
    expect(left.statusCode).toBe(204);
    expect(await wentOffline).toEqual({ roomId, userId: fay.id, online: false });

    // Fay's socket is still connected, and still names the room.
    const refused = next(faySocket, 'exception');
    faySocket.emit('message', { roomId, body: 'Still here?' });
    expect(await refused).toMatchObject({ statusCode: 404 });

    // And it no longer receives the room's messages.
    const delivered: unknown[] = [];
    faySocket.on('message', (message) => delivered.push(message));
    await send(danSocket, 'message', { roomId, body: 'Bye Fay' });
    await send(faySocket, 'leave', { roomId }); // a round trip on Fay's connection
    expect(delivered).toEqual([]);
  });

  it('disconnects a client when its access token expires', async () => {
    const kim = await signUp('kim');
    const socket = open(shortLivedToken(kim.id));

    await next(socket, 'connect');
    expect(await next(socket, 'disconnect')).toBe('io server disconnect');
  });

  it('validates messages with the Zod schema', async () => {
    const gus = await signUp('gus');
    const roomId = await createRoom(gus);
    const socket = await connect(gus.accessToken);

    const refused = next(socket, 'exception');
    socket.emit('message', { roomId, body: '   ' });

    expect(await refused).toMatchObject({
      statusCode: 400,
      message: ['body: Too small: expected string to have >=1 characters'],
    });
  });

  it('pages through the history, newest first', async () => {
    const hal = await signUp('hal');
    const roomId = await createRoom(hal);
    const socket = await connect(hal.accessToken);
    const sent: number[] = [];
    for (const body of ['one', 'two', 'three', 'four', 'five']) {
      sent.push((await send(socket, 'message', { roomId, body })).id);
    }

    const ids: number[] = [];
    let before: number | null | undefined;
    do {
      const query = before ? `?limit=2&before=${before}` : '?limit=2';
      const page = await app.inject({ method: 'GET', url: `/rooms/${roomId}/messages${query}`, headers: hal.headers });
      const { messages, nextBefore } = page.json<{ messages: { id: number }[]; nextBefore: number | null }>();
      ids.push(...messages.map((message) => message.id));
      before = nextBefore;
    } while (before);

    expect(ids).toEqual(sent.reverse());
  });

  it('limits how fast each user sends messages', async () => {
    const ivy = await signUp('ivy');
    const jon = await signUp('jon');
    const roomId = await createRoom(ivy, 'jon');
    const ivySocket = await connect(ivy.accessToken);
    const jonSocket = await connect(jon.accessToken);

    const refused = next(ivySocket, 'exception');
    for (let i = 1; i <= 11; i++) {
      ivySocket.emit('message', { roomId, body: `Message ${i}` });
    }

    expect(await refused).toMatchObject({ statusCode: 429 });
    // Another user's messages are counted separately.
    expect(await send(jonSocket, 'message', { roomId, body: 'Hello' })).toMatchObject({ body: 'Hello' });
  });
});
```

- `createTestingModule()` takes the `instrument` option (in `@nestjs/testing` 12.6.3 and later), as `NestFactory.create()` does in `main.ts`. Without it, the gateway's handlers run uninstrumented, and NestJS Observe logs an error for each event that it can't trace.
- `open()` returns the socket before it connects, so the first test listens for `disconnect` from the start. A socket the server refuses can get its `disconnect` before the code after an `await` on `connect` runs.
- `send()` sets a timeout on the acknowledgment. A refused message never gets one, so without a timeout, a test that expects one would hang instead of failing.
- `shortLivedToken()` signs a token the way the API's `accessToken` options do (HS256, the `chat-api` issuer and audience, the test's `JWT_SECRET`), which expires within two seconds of the handshake.

Run them with the JWT tutorial's refresh-token store test, against a database of their own:

```bash
$ docker exec chat-db psql -U postgres -c "CREATE DATABASE chat_test"
$ TEST_DATABASE_URL=postgres://postgres:chat@localhost:5432/chat_test npm run test:e2e

 Test Files  2 passed (2)
      Tests  13 passed (13)
```

Store the message with a plain `insert(messages).values()` instead of the `INSERT ... SELECT`, and two tests fail: the non-member's message is stored and broadcast, and so is the message of the user who left. Remove the throttler's tracker, and the rate-limit test fails: Jon's first message is refused, because Ivy used up the counter they share.

#### Production checklist

Everything in the JWT tutorial's [checklist](/tutorials/rest-api-jwt-authentication#production-checklist) applies. For the chat in particular:

- **Plan for several instances before you need them.** The Redis adapter, shared presence and shared throttler storage, from [Run more than one instance](/tutorials/realtime-chat#run-more-than-one-instance), are easier to add before the second instance than after.
- **Expect every client to reconnect on deploy.** Shutdown hooks are on, so a deploy's `SIGTERM` closes the open connections with the application. Clients see `transport close`, not `io server disconnect`, and Socket.IO reconnects them on its own, to an instance that's still running, where they open their rooms again. Size the instances for that burst of handshakes.
- **End a banned or deleted user's connections yourself.** The guard refuses their next message, but an open socket keeps receiving its rooms until its access token expires, up to 15 minutes later. Disconnect the sockets in the user's channel, the way `removeFromRoom()` empties them out of a room.
- **Bound what one client can send.** The Zod schema caps a message at 4,000 characters, and the throttler caps the rate. The `IoAdapter` also limits how many messages of one client are handled at once (see [Limits](/websockets/adapter#limits)).
- **Allow the web app's origin if it uses long-polling.** WebSocket connections aren't subject to CORS, but Socket.IO's long-polling requests are: pass a `cors` option with your web app's origin to `@WebSocketGateway()` if clients don't connect with `transports: ['websocket']`.
- **Keep the history query on its index.** `messages_room_id_id_idx` serves every page. A history that filters on anything else, such as an author or a search, needs an index of its own, or a search engine.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the platform's environment: `start:prod` doesn't load `.env`. [NestJS Observe](/observability/overview) then reports each message handled by `@SubscribeMessage()` as a request with the `ws` protocol, under an operation id of the gateway class and the pattern, such as `ChatGateway:message`. Connections and disconnections aren't reported (see [WebSocket gateways](/observability/sdk#websocket-gateways)).

#### What's next

- Notify members who aren't connected, by email or push, outside the request: [Mail](/application/mail) and [Queues](/application/queues).
- Give rooms owners and moderators, with permissions checked per room: [Authorization](/security/authorization).
- Share broadcasts between instances: [Adapters](/websockets/adapter#extend-socketio).
- See slow history pages and refused messages in production: [Observability](/observability/overview).
- Build an e-commerce backend on the same foundation: [Build an e-commerce backend](/tutorials/ecommerce-backend).
