### RabbitMQ

[RabbitMQ](https://www.rabbitmq.com/) is an open-source, lightweight message broker that supports multiple messaging protocols. It can be deployed in distributed and federated configurations to meet high-scale, high-availability requirements, and it is one of the most widely deployed message brokers, used by small startups and large enterprises alike.

#### Installation

To start building RabbitMQ-based microservices, first install the required packages:

```bash
$ npm i --save amqplib amqp-connection-manager
```

#### Overview

To use the RabbitMQ transporter, pass the following options object to the `createMicroservice()` method:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'cats_queue',
    queueOptions: {
      durable: false
    },
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'cats_queue',
    queueOptions: {
      durable: false
    },
  },
});
```

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

#### Options

The `options` property is specific to the chosen transporter. The <strong>RabbitMQ</strong> transporter exposes the following properties.

<table>
  <tr>
    <td><code>urls</code></td>
    <td>An array of connection URLs to try in order</td>
  </tr>
  <tr>
    <td><code>queue</code></td>
    <td>Name of the queue your server listens to</td>
  </tr>
  <tr>
    <td><code>prefetchCount</code></td>
    <td>Sets the prefetch count for the channel</td>
  </tr>
  <tr>
    <td><code>isGlobalPrefetchCount</code></td>
    <td>If <code>true</code>, applies the prefetch count per channel instead of per consumer</td>
  </tr>
  <tr>
    <td><code>noAck</code></td>
    <td>If <code>false</code>, enables manual acknowledgment mode. Defaults to <code>true</code></td>
  </tr>
  <tr>
    <td><code>consumerTag</code></td>
    <td>A name the server uses to distinguish message deliveries for the consumer; it must not already be in use on the channel. It's usually easier to omit it, in which case the server creates a random name and supplies it in the reply (see <a href="https://amqp-node.github.io/amqplib/channel_api.html#channel_consume" rel="nofollow" target="_blank"><code>channel.consume()</code> in the amqplib documentation</a>)</td>
  </tr>
  <tr>
    <td><code>queueOptions</code></td>
    <td>Additional queue options (see <a href="https://amqp-node.github.io/amqplib/channel_api.html#channel_assertQueue" rel="nofollow" target="_blank"><code>channel.assertQueue()</code> in the amqplib documentation</a>)</td>
  </tr>
  <tr>
    <td><code>socketOptions</code></td>
    <td>Additional socket options (see <a href="https://amqp-node.github.io/amqplib/channel_api.html#connect" rel="nofollow" target="_blank"><code>connect()</code> in the amqplib documentation</a>)</td>
  </tr>
  <tr>
    <td><code>headers</code></td>
    <td>Headers to send with every message. Applies only to the producer (client) configuration</td>
  </tr>
  <tr>
    <td><code>replyQueue</code></td>
    <td>Reply queue for the producer. Defaults to <code>amq.rabbitmq.reply-to</code></td>
  </tr>
  <tr>
    <td><code>persistent</code></td>
    <td>If truthy, messages survive broker restarts, provided they are in a queue that also survives restarts</td>
  </tr>
  <tr>
    <td><code>noAssert</code></td>
    <td>If <code>true</code>, the queue is not asserted before consuming. Defaults to <code>false</code></td>
  </tr>
  <tr>
    <td><code>wildcards</code></td>
    <td>Set to <code>true</code> only if you want to use a topic exchange to route messages to queues. Enabling it lets you use wildcards (<code>*</code>, <code>#</code>) in message and event patterns</td>
  </tr>
  <tr>
    <td><code>exchange</code></td>
    <td>Name of the exchange. Defaults to the queue name when <code>wildcards</code> is set to <code>true</code></td>
  </tr>
  <tr>
    <td><code>exchangeType</code></td>
    <td>Type of the exchange. Defaults to <code>topic</code>. Accepts the standard AMQP types <code>direct</code>, <code>fanout</code>, <code>topic</code>, and <code>headers</code>, or the name of a custom exchange type</td>
  </tr>
  <tr>
    <td><code>exchangeArguments</code></td>
    <td>Additional arguments passed when asserting the exchange</td>
  </tr>
  <tr>
    <td><code>routingKey</code></td>
    <td>Additional routing key for the topic exchange</td>
  </tr>
  <tr>
    <td><code>maxConnectionAttempts</code></td>
    <td>Maximum number of connection attempts. Applies only to the consumer configuration. Defaults to <code>-1</code> (infinite)</td>
  </tr>
</table>

#### Client

As with other microservice transporters, you have [several options](/microservices/basics#client) for creating a RabbitMQ `ClientProxy` instance.

One way to create an instance is to use the `ClientsModule`. Import it and call its `register()` method, passing an options object with the same properties shown above for the `createMicroservice()` method, plus a `name` property to use as the injection token. Read more about `ClientsModule` in the [microservices overview](/microservices/basics#client).

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'cats_queue',
          queueOptions: {
            durable: false
          },
        },
      },
    ]),
  ]
  ...
})
```

You can also create a client with `ClientProxyFactory` or `@Client()`, as described in the [microservices overview](/microservices/basics#client).

#### Context

In more complex scenarios, you may need additional information about the incoming request. When using the RabbitMQ transporter, you can access the `RmqContext` object.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(`Pattern: ${context.getPattern()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Pattern: ${context.getPattern()}`);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `RmqContext` are imported from the `@nestjs/microservices` package.

To access the original RabbitMQ message (with its `properties`, `fields`, and `content`), use the `getMessage()` method of the `RmqContext` object:

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(context.getMessage());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getMessage());
}
```

To retrieve a reference to the RabbitMQ [channel](https://www.rabbitmq.com/channels.html), use the `getChannelRef()` method of the `RmqContext` object:

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(context.getChannelRef());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getChannelRef());
}
```

#### Message acknowledgement

To make sure a message is never lost, RabbitMQ supports [message acknowledgements](https://www.rabbitmq.com/confirms.html). The consumer sends an acknowledgement back to tell RabbitMQ that a particular message has been received and processed, and that RabbitMQ is free to delete it. If a consumer dies (its channel is closed, its connection is closed, or the TCP connection is lost) without sending an ack, RabbitMQ assumes the message wasn't fully processed and re-queues it.

By default, the RabbitMQ transporter doesn't expect acknowledgements (`noAck` is `true`). To enable manual acknowledgment mode, set the `noAck` property to `false`:

```typescript
options: {
  urls: ['amqp://localhost:5672'],
  queue: 'cats_queue',
  noAck: false,
  queueOptions: {
    durable: false
  },
},
```

When manual consumer acknowledgements are turned on, you must send an acknowledgement from the worker to signal that it has finished the task:

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();

  channel.ack(originalMsg);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();

  channel.ack(originalMsg);
}
```

#### Record builders

To configure message options, use the `RmqRecordBuilder` class (this works for event-based flows as well). For example, to set the `headers` and `priority` properties, use the `setOptions()` method:

```typescript
const message = ':cat:';
const record = new RmqRecordBuilder(message)
  .setOptions({
    headers: {
      ['x-version']: '1.0.0',
    },
    priority: 3,
  })
  .build();

this.client.send('replace-emoji', record).subscribe(...);
```

> info **Hint** The `RmqRecordBuilder` class is exported from the `@nestjs/microservices` package.

You can read these values on the server side as well, by accessing the `RmqContext`:

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: RmqContext): string {
  const { properties: { headers } } = context.getMessage();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const { properties: { headers } } = context.getMessage();
  return headers['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
```

#### Instance status updates

To get real-time updates on the connection and the state of the underlying driver instance, subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For the RMQ driver, the `status` stream emits `connected`, `disconnected`, `blocked`, and `unblocked` events.

```typescript
this.client.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
```

> info **Hint** The `RmqStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status:

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
```

#### Listening to RabbitMQ events

In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the `error` event to trigger additional operations when an error occurs. To do this, use the `on()` method:

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

Similarly, you can listen to the server's internal events:

```typescript
server.on<RmqEvents>('error', (err) => {
  console.error(err);
});
```

> info **Hint** The `RmqEvents` type is imported from the `@nestjs/microservices` package.

#### Underlying driver access

For more advanced use cases, you may need to access the underlying driver instance, for example, to close the connection manually or to use driver-specific methods. However, in most cases you **shouldn't need** to access the driver directly.

To do so, use the `unwrap()` method, which returns the underlying driver instance. Use the generic type parameter to specify the type of driver instance you expect.

```typescript
const managerRef =
  this.client.unwrap<import('amqp-connection-manager').AmqpConnectionManager>();
```

Similarly, you can access the server's underlying driver instance:

```typescript
const managerRef =
  server.unwrap<import('amqp-connection-manager').AmqpConnectionManager>();
```

#### Wildcards

RabbitMQ supports the use of wildcards in routing keys to allow for flexible message routing. The `#` wildcard matches zero or more words, while the `*` wildcard matches exactly one word.

For example, the routing key `cats.#` matches `cats`, `cats.meow`, and `cats.meow.purr`. The routing key `cats.*` matches `cats.meow` but not `cats.meow.purr`.

To enable wildcard support in your RabbitMQ microservice, set the `wildcards` configuration option to `true` in the options object:

```typescript
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'cats_queue',
      wildcards: true,
    },
  },
);
```

With this configuration, you can use wildcards in your routing keys when subscribing to events and messages. For example, to listen for messages with the routing key `cats.#`:

```typescript
@MessagePattern('cats.#')
getCats(@Payload() data: { message: string }, @Ctx() context: RmqContext) {
  console.log(`Received message with routing key: ${context.getPattern()}`);

  return {
    message: 'Hello from the cats service!',
  }
}
```

To send a message with a specific routing key, use the `send()` method of the `ClientProxy` instance:

```typescript
this.client.send('cats.meow', { message: 'Meow!' }).subscribe((response) => {
  console.log(response);
});
```
