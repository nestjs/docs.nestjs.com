### Adapters

The WebSockets module is platform-agnostic, so you can bring your own library (or even a native implementation) by implementing the `WebSocketAdapter` interface. The interface requires the methods described in the following table:

<table>
  <tr>
    <td><code>create</code></td>
    <td>Creates a socket server instance based on the passed arguments</td>
  </tr>
  <tr>
    <td><code>bindClientConnect</code></td>
    <td>Binds the client connection event</td>
  </tr>
  <tr>
    <td><code>bindClientDisconnect</code></td>
    <td>Binds the client disconnection event (optional)</td>
  </tr>
  <tr>
    <td><code>bindMessageHandlers</code></td>
    <td>Binds the incoming message to the corresponding message handler</td>
  </tr>
  <tr>
    <td><code>close</code></td>
    <td>Terminates a server instance</td>
  </tr>
</table>

#### Extend socket.io

The [socket.io](https://github.com/socketio/socket.io) package is wrapped in an `IoAdapter` class. You can extend this class to enhance the adapter's basic functionality. For example, suppose your application must broadcast events across multiple load-balanced instances of your web service. To support this, extend `IoAdapter` and override the single method responsible for instantiating new socket.io servers. First, install the required packages.

> warning **Warning** To use socket.io with multiple load-balanced instances, you must either disable polling by setting `transports: ['websocket']` in your clients' socket.io configuration, or enable cookie-based routing (sticky sessions) in your load balancer. Redis alone is not enough. See [Enabling sticky session](https://socket.io/docs/v4/using-multiple-nodes/#enabling-sticky-session) in the socket.io documentation for more information.

```bash
$ npm i --save redis socket.io @socket.io/redis-adapter
```

Once the packages are installed, create a `RedisIoAdapter` class.

```typescript
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: `redis://localhost:6379` });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
```

Then switch to your newly created Redis adapter.

```typescript
const app = await NestFactory.create(AppModule);
const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis();

app.useWebSocketAdapter(redisIoAdapter);
```

#### Ws library

Another available adapter is `WsAdapter`, which acts as a proxy between the framework and the fast, thoroughly tested [ws](https://github.com/websockets/ws) library. This adapter is fully compatible with native browser WebSockets and is faster than the socket.io package. However, it offers significantly fewer features out of the box, which many applications don't need.

> info **Hint** The `ws` library doesn't support namespaces (communication channels popularized by `socket.io`), and `WsAdapter` throws an error if you set the `namespace` option. To mimic this feature, mount multiple `ws` servers on different paths (e.g., `@WebSocketGateway({{ '{' }} path: '/users' {{ '}' }})`). Those paths can include parameters. See [Dynamic paths](#dynamic-paths).

To use `ws`, first install the required package:

```bash
$ npm i --save @nestjs/platform-ws
```

Once the package is installed, switch the adapter:

```typescript
const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new WsAdapter(app));
```

> info **Hint** The `WsAdapter` is imported from `@nestjs/platform-ws`.

The `WsAdapter` handles messages in the `{{ '{' }} event: string, data: any {{ '}' }}` format. To receive and process messages in a different format, configure a message parser that converts them into this format.

```typescript
const wsAdapter = new WsAdapter(app, {
  // To handle messages in the [event, data] format
  messageParser: (data) => {
    const [event, payload] = JSON.parse(data.toString());
    return { event, data: payload };
  },
});
```

Alternatively, you can set the message parser after creating the adapter with the `setMessageParser()` method.

#### Dynamic paths

`WsAdapter` compiles a gateway `path` when it contains `:`, `*`, or `{{ '{' }}`. Anything else is an exact match on the URL pathname, so a path such as `/socket(v2)` keeps working as a literal. Matching is case-sensitive, a trailing slash does not match, and the query string is ignored. A path with a malformed percent-escape is rejected with HTTP 400.

Overlapping gateways on the same port are tried in registration order, and the first match handles the connection. Register `/files/:id/meta` before `/files/*path` when `/files/1/meta` should reach the specific gateway.

```typescript
import { IncomingMessage } from 'http';
import WebSocket from 'ws';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsParam,
} from '@nestjs/websockets';

@WebSocketGateway({ path: '/chat/:roomId/socket' })
export class ChatGateway {
  handleConnection(
    client: WebSocket,
    req: IncomingMessage & { params: Record<string, string> },
  ) {
    client.send(JSON.stringify({ event: 'connected', data: req.params }));
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: unknown,
    @WsParam('roomId') roomId: string,
  ) {
    return { event: 'message', data: { roomId, data } };
  }
}
```

`handleConnection()` receives the upgrade request as its second argument. `req.params` is the map captured during the handshake. The same object is stored on the socket under the `WS_PATH_PARAMS` symbol, exported from `@nestjs/websockets`. `handleDisconnect()`, guards, and interceptors read that symbol from the client.

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WS_PATH_PARAMS } from '@nestjs/websockets';
import WebSocket from 'ws';

type WsClient = WebSocket & {
  [WS_PATH_PARAMS]?: Record<string, string | string[]>;
};

@Injectable()
export class RoomGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<WsClient>();
    return client[WS_PATH_PARAMS]?.roomId === 'public';
  }
}
```

```typescript
import { OnGatewayDisconnect, WS_PATH_PARAMS } from '@nestjs/websockets';
import WebSocket from 'ws';

type WsClient = WebSocket & {
  [WS_PATH_PARAMS]?: Record<string, string | string[]>;
};

export class ChatGateway implements OnGatewayDisconnect {
  handleDisconnect(client: WsClient) {
    const roomId = client[WS_PATH_PARAMS]?.roomId;
    console.log(`disconnected from ${roomId}`);
  }
}
```

`@WsParam()` reads that map from a message handler. Pass a name to take one value, or omit it to take the whole object. Pipes work the same way as on HTTP `@Param()`.

```typescript
import { ParseIntPipe } from '@nestjs/common';
import { SubscribeMessage, WsParam } from '@nestjs/websockets';

@SubscribeMessage('echo')
echo(@WsParam('id', ParseIntPipe) id: number) {
  return { event: 'echo', data: id };
}
```

A static path still exposes a map, and that map is empty, so `@WsParam()` returns an empty object and `@WsParam('id')` returns `undefined`. `IoAdapter` (`@nestjs/platform-socket.io`) does not parse paths. The decorator behaves the same way there: a named parameter is `undefined`, and `@WsParam()` with no name returns an empty object.

The pattern language is [path-to-regexp](https://github.com/pillarjs/path-to-regexp) v8:

- `:roomId` captures a single segment as a string.
- `*path` captures one or more segments as an array. A connection to `/files/a/b/c` on `/files/*path` sets `path` to `['a', 'b', 'c']`.
- A brace group is optional. `/chat{{ '{' }}/lobby&#125;` matches both `/chat` and `/chat/lobby`.

> warning **Warning** A path that contains `:`, `*`, or `{{ '{' }}` and is not valid v8 syntax throws when the gateway is registered. `/legacy/*` is rejected because a wildcard must be named, as in `/files/*path`. The `?` and `+` suffixes are rejected too.

> warning **Warning** A colon always starts a parameter. A path that used to match one literal URL, such as `/ws:v1`, now also matches other suffixes: `/wsfoo` sets `v1` to `foo`. Escape the colon to keep that URL literal: `/ws\\:v1`.

#### Advanced (custom adapter)

For demonstration purposes, we'll integrate the [ws](https://github.com/websockets/ws) library manually. As mentioned, an adapter for this library already exists: the `WsAdapter` class exposed from the `@nestjs/platform-ws` package. A simplified implementation could look like this:

```typescript
@@filename(ws-adapter)
import WebSocket from 'ws';
import { WebSocketAdapter, INestApplicationContext } from '@nestjs/common';
import { MessageMappingProperties } from '@nestjs/websockets';
import { Observable, fromEvent, EMPTY } from 'rxjs';
import { mergeMap, filter } from 'rxjs/operators';

export class WsAdapter implements WebSocketAdapter {
  constructor(private app: INestApplicationContext) {}

  create(port: number, options: any = {}): any {
    return new WebSocket.Server({ port, ...options });
  }

  bindClientConnect(server, callback: Function) {
    server.on('connection', callback);
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ) {
    fromEvent(client, 'message')
      .pipe(
        mergeMap(data => this.bindMessageHandler(data, handlers, process)),
        filter(result => result),
      )
      .subscribe(response => client.send(JSON.stringify(response)));
  }

  bindMessageHandler(
    buffer,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ): Observable<any> {
    const message = JSON.parse(buffer.data);
    const messageHandler = handlers.find(
      handler => handler.message === message.event,
    );
    if (!messageHandler) {
      return EMPTY;
    }
    return process(messageHandler.callback(message.data));
  }

  close(server) {
    server.close();
  }
}
```

> info **Hint** To use the [ws](https://github.com/websockets/ws) library, use the built-in `WsAdapter` instead of creating your own.

Then set up the custom adapter with the `useWebSocketAdapter()` method:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new WsAdapter(app));
```

#### Example

A working example that uses `WsAdapter` is available in the [16-gateways-ws sample](https://github.com/nestjs/nest/tree/master/sample/16-gateways-ws).
