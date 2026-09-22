### NATS

[NATS](https://nats.io) is a simple, secure, and high-performance open source messaging system for cloud native applications, IoT messaging, and microservices architectures. The NATS server is written in Go, and client libraries are available for dozens of major programming languages. NATS supports both **At Most Once** and **At Least Once** delivery. It runs anywhere, from large servers and cloud instances to edge gateways and Internet of Things devices.

#### Installation

To start building NATS-based microservices, first install the required package:

```bash
$ npm i --save @nats-io/transport-node
```

> warning **Warning** As of NestJS v12, the NATS transporter targets **NATS v3** and uses the `@nats-io/transport-node` driver. If you are upgrading from an earlier version, uninstall the legacy `nats` package (`npm uninstall nats`) and install `@nats-io/transport-node` instead. See the [migration guide](/migration-guide#nats-v3) for details.

#### Overview

To use the NATS transporter, pass the following options object to the `createMicroservice()` method:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
  },
});
```

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

#### Options

The `options` object is specific to the chosen transporter. The <strong>NATS</strong> transporter exposes the [NATS connection options](https://github.com/nats-io/nats.js/blob/main/core/README.md#connecting-to-a-nats-server), as well as the following properties:

<table>
  <tr>
    <td><code>queue</code></td>
    <td>Queue group that your server subscribes with (leave <code>undefined</code> to ignore this setting). Read more about NATS queue groups <a href="/microservices/nats#queue-groups">below</a>.</td>
  </tr>
  <tr>
    <td><code>gracefulShutdown</code></td>
    <td>Enables graceful shutdown. When enabled, the server first unsubscribes from all subjects, then waits for <code>gracePeriod</code> before closing the connection. Default is <code>false</code>.</td>
  </tr>
  <tr>
    <td><code>gracePeriod</code></td>
    <td>Time in milliseconds to wait after unsubscribing from all subjects when <code>gracefulShutdown</code> is enabled. Default is <code>10000</code> ms.</td>
  </tr>
  <tr>
    <td><code>headers</code></td>
    <td>Headers added to every message a client sends (see <a href="/microservices/nats#record-builders">record builders</a>).</td>
  </tr>
</table>

#### Client

As with other microservice transporters, you have <a href="/microservices/basics#client">several options</a> for creating a NATS `ClientProxy` instance.

One way to create an instance is to use the `ClientsModule`. Import it and use its `register()` method to pass an options object with the same properties shown above for the `createMicroservice()` method, plus a `name` property to use as the injection token. Read more about the `ClientsModule` in the <a href="/microservices/basics#client">client section of the overview</a>.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
        }
      },
    ]),
  ]
  ...
})
```

You can also create a client with `ClientProxyFactory` or the `@Client()` decorator. Both are described in the <a href="/microservices/basics#client">client section of the overview</a>.

#### Request-response

For the [request-response](/microservices/basics#request-response) message style, the NATS transporter doesn't use the built-in NATS [Request-Reply](https://docs.nats.io/nats-concepts/reqreply) API. Instead, the client publishes a "request" on a given subject with the `publish()` method and a unique reply subject name. Responders listen on that subject and send responses to the reply subject. Reply subjects are routed back to the requester dynamically, regardless of the location of either party.

#### Event-based

For the [event-based](/microservices/basics#event-based) message style, the NATS transporter uses the built-in NATS [Publish-Subscribe](https://docs.nats.io/nats-concepts/pubsub) mechanism. A publisher sends a message on a subject, and every active subscriber listening on that subject receives the message. Subscribers can also register interest in [wildcard](#wildcards) subjects. This one-to-many pattern is sometimes called fan-out.

#### Queue groups

NATS provides a built-in load balancing feature called [distributed queues](https://docs.nats.io/nats-concepts/queue). To create a queue subscription, use the `queue` property as follows:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
    queue: 'cats_queue',
  },
});
```

#### Context

In more complex scenarios, you may need additional information about the incoming request. With the NATS transporter, you can access the `NatsContext` object.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Subject: ${context.getSubject()}`);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `NatsContext` are imported from the `@nestjs/microservices` package.

#### Wildcards

A subscription can target an explicit subject, or it can include wildcards.

```typescript
@@filename()
@MessagePattern('time.us.*')
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*')
getDate(data, context) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
```

#### Record builders

To configure message options, use the `NatsRecordBuilder` class. It works for both request-response and event-based flows. For example, to add an `x-version` header, use the `setHeaders()` method:

```typescript
import * as nats from '@nats-io/nats-core';

// somewhere in your code
const headers = nats.headers();
headers.set('x-version', '1.0.0');

const record = new NatsRecordBuilder(':cat:').setHeaders(headers).build();
this.client.send('replace-emoji', record).subscribe(...);
```

> info **Hint** The `NatsRecordBuilder` class is exported from the `@nestjs/microservices` package.

On the server side, you can read these headers through the `NatsContext`:

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: NatsContext): string {
  const headers = context.getHeaders();
  return headers?.get('x-version') === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const headers = context.getHeaders();
  return headers?.get('x-version') === '1.0.0' ? '🐱' : '🐈';
}
```

To configure headers for all requests sent by a client, pass them as options to the `ClientProxyFactory`:

```typescript
import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: 'API_v1',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.NATS,
          options: {
            servers: ['nats://localhost:4222'],
            headers: { 'x-version': '1.0.0' },
          },
        }),
    },
  ],
})
export class ApiModule {}
```

Headers set on a record take precedence over the client-level `headers` option.

#### Custom serializers and deserializers

Starting with NestJS v12, Nest serializes NATS packets as JSON strings, and custom NATS deserializers receive the full NATS message object instead of a raw `Uint8Array`. If you have written a custom deserializer, read the payload through `msg.json()` rather than decoding bytes manually:

```typescript
import { Deserializer, IncomingRequest } from '@nestjs/microservices';

export class CustomNatsDeserializer implements Deserializer {
  deserialize(msg: any): IncomingRequest {
    // Previously: JSON.parse(new TextDecoder().decode(msg));
    return msg.json();
  }
}
```

#### Instance status updates

To get real-time updates on the connection and the state of the underlying driver instance, subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For the NATS driver, the `status` stream emits `connected`, `disconnected`, and `reconnecting` events.

```typescript
this.client.status.subscribe((status: NatsStatus) => {
  console.log(status);
});
```

> info **Hint** The `NatsStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: NatsStatus) => {
  console.log(status);
});
```

#### Listening to NATS events

In some cases, you might want to listen to internal events emitted by the microservice. The NATS transporter emits the `disconnect`, `reconnect`, and `update` (cluster servers added or removed) events. For example, you could listen for the `disconnect` event to trigger additional operations when the connection is lost. To do this, use the `on()` method, as shown below:

```typescript
this.client.on('disconnect', (serverUrl) => {
  console.error(`Disconnected from ${serverUrl}`);
});
```

Similarly, you can listen to the server's internal events:

```typescript
server.on<NatsEvents>('disconnect', (serverUrl) => {
  console.error(`Disconnected from ${serverUrl}`);
});
```

> info **Hint** The `NatsEvents` type is imported from the `@nestjs/microservices` package.

#### Underlying driver access

For more advanced use cases, you may need to access the underlying driver instance, for example, to close the connection manually or to use driver-specific methods. In most cases, however, you **shouldn't need** to access the driver directly.

To do so, use the `unwrap()` method, which returns the underlying driver instance. The generic type parameter specifies the type of driver instance you expect.

```typescript
const natsConnection =
  this.client.unwrap<import('@nats-io/transport-node').NatsConnection>();
```

Similarly, you can access the server's underlying driver instance:

```typescript
const natsConnection =
  server.unwrap<import('@nats-io/transport-node').NatsConnection>();
```
