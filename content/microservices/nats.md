### NATS

[NATS](https://nats.io) is a simple, secure and high performance open source messaging system for cloud native applications, IoT messaging, and microservices architectures. The NATS server is written in the Go programming language, but client libraries to interact with the server are available for dozens of major programming languages. NATS supports both **At Most Once** and **At Least Once** delivery. It can run anywhere, from large servers and cloud instances, through edge gateways and even Internet of Things devices.

#### Installation

To start building NATS-based microservices, first install the required package:

```bash
$ npm i --save nats
```

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

The `options` object is specific to the chosen transporter. The <strong>NATS</strong> transporter exposes the properties described [here](https://github.com/nats-io/node-nats#connection-options) as well as the following properties:

<table>
  <tr>
    <td><code>queue</code></td>
    <td>Queue that your server should subscribe to (leave <code>undefined</code> to ignore this setting). Read more about NATS queue groups <a href="https://docs.nestjs.com/microservices/nats#queue-groups">below</a>.
    </td> 
  </tr>
  <tr>
    <td><code>gracefulShutdown</code></td>
    <td>Enables graceful shutdown. When enabled, the server first unsubscribes from all channels before closing the connection. Default is <code>false</code>.
  </tr>
  <tr>
    <td><code>gracePeriod</code></td>
    <td>Time in milliseconds to wait for the server after unsubscribing from all channels. Default is <code>10000</code> ms.
  </tr>
</table>

#### Client

Like other microservice transporters, you have <a href="https://docs.nestjs.com/microservices/basics#client">several options</a> for creating a NATS `ClientProxy` instance.

One method for creating an instance is to use the `ClientsModule`. To create a client instance with the `ClientsModule`, import it and use the `register()` method to pass an options object with the same properties shown above in the `createMicroservice()` method, as well as a `name` property to be used as the injection token. Read more about `ClientsModule` <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

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

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

#### Request-response

For the **request-response** message style ([read more](https://docs.nestjs.com/microservices/basics#request-response)), the NATS transporter does not use the NATS built-in [Request-Reply](https://docs.nats.io/nats-concepts/reqreply) mechanism. Instead, a "request" is published on a given subject using the `publish()` method with a unique reply subject name, and responders listen on that subject and send responses to the reply subject. Reply subjects are directed back to the requestor dynamically, regardless of location of either party.

#### Event-based

For the **event-based** message style ([read more](https://docs.nestjs.com/microservices/basics#event-based)), the NATS transporter uses NATS built-in [Publish-Subscribe](https://docs.nats.io/nats-concepts/pubsub) mechanism. A publisher sends a message on a subject and any active subscriber listening on that subject receives the message. Subscribers can also register interest in wildcard subjects that work a bit like a regular expression. This one-to-many pattern is sometimes called fan-out.

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

In more complex scenarios, you may need to access additional information about the incoming request. When using the NATS transporter, you can access the `NatsContext` object.

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

A subscription may be to an explicit subject, or it may include wildcards.

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

To configure message options, you can use the `NatsRecordBuilder` class (note: this is doable for event-based flows as well). For example, to add `x-version` header, use the `setHeaders` method, as follows:

```typescript
import * as nats from 'nats';

// somewhere in your code
const headers = nats.headers();
headers.set('x-version', '1.0.0');

const record = new NatsRecordBuilder(':cat:').setHeaders(headers).build();
this.client.send('replace-emoji', record).subscribe(...);
```

> info **Hint** `NatsRecordBuilder` class is exported from the `@nestjs/microservices` package.

And you can read these headers on the server-side as well, by accessing the `NatsContext`, as follows:

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: NatsContext): string {
  const headers = context.getHeaders();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const headers = context.getHeaders();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
```

In some cases you might want to configure headers for multiple requests, you can pass these as options to the `ClientProxyFactory`:

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

#### Instance status updates

To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For the NATS driver, the `status` stream emits `connected`, `disconnected`, and `reconnecting` events.

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

#### Listening to Nats events

In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the `error` event to trigger additional operations when an error occurs. To do this, use the `on()` method, as shown below:

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

Similarly, you can listen to the server's internal events:

```typescript
server.on<NatsEvents>('error', (err) => {
  console.error(err);
});
```

> info **Hint** The `NatsEvents` type is imported from the `@nestjs/microservices` package.

#### Underlying driver access

For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you **shouldn't need** to access the driver directly.

To do so, you can use the `unwrap()` method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect.

```typescript
const natsConnection = this.client.unwrap<import('nats').NatsConnection>();
```

Similarly, you can access the server's underlying driver instance:

```typescript
const natsConnection = server.unwrap<import('nats').NatsConnection>();
```
