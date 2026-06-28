### Guards

There is no fundamental difference between web sockets guards and [regular HTTP application guards](/guards). The only difference is that instead of throwing `HttpException`, you should use `WsException`.

> info **Hint** The `WsException` class is exposed from `@nestjs/websockets` package.

#### Binding guards

The following example uses a method-scoped guard. Just as with HTTP based applications, you can also use gateway-scoped guards (i.e., prefix the gateway class with a `@UseGuards()` decorator).

```typescript
@@filename()
@UseGuards(AuthGuard)
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@UseGuards(AuthGuard)
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
```

#### Authenticating connections

Guards bound with `@UseGuards()` protect `@SubscribeMessage()` handlers, but the initial Socket.IO connection is established in `handleConnection()` before those handlers run. To reject unauthorized clients at connect time, validate credentials inside `OnGatewayConnection.handleConnection()` and call `client.disconnect()` when validation fails.

With socket.io, clients can pass a JWT in `handshake.auth` (recommended) or the `Authorization` header:

```typescript
@@filename(events.gateway)
import { ConnectedSocket, OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ namespace: 'events' })
export class EventsGateway implements OnGatewayConnection {
  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    const token = this.extractToken(client);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      await client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  private extractToken(client: Socket): string | undefined {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string') {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const authorization = client.handshake.headers.authorization;

    if (typeof authorization === 'string') {
      return authorization.replace(/^Bearer\s+/i, '');
    }
  }
}
@@switch
import { WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({ namespace: 'events' })
export class EventsGateway {
  constructor(jwtService) {
    this.jwtService = jwtService;
  }

  async handleConnection(client) {
    const token = this.extractToken(client);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      await client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  extractToken(client) {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string') {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const authorization = client.handshake.headers.authorization;

    if (typeof authorization === 'string') {
      return authorization.replace(/^Bearer\s+/i, '');
    }
  }
}
```

Client example:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/events', {
  auth: {
    token: 'Bearer <jwt>',
  },
});
```

> info **Hint** Method-scoped guards still apply to incoming messages after the connection is accepted. Use both patterns when you need to protect the handshake and individual events.
