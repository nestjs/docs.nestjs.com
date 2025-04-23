### RabbitMQ

[RabbitMQ](https://www.rabbitmq.com/) is an open-source and lightweight message broker which supports multiple messaging protocols. It can be deployed in distributed and federated configurations to meet high-scale, high-availability requirements. In addition, it's the most widely deployed message broker, used worldwide at small startups and large enterprises.

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

The `options` property is specific to the chosen transporter. The <strong>RabbitMQ</strong> transporter exposes the properties described below.

<table>
  <tr>
    <td><code>urls</code></td>
    <td>An array of connection URLs to try in order</td>
  </tr>
  <tr>
    <td><code>queue</code></td>
    <td>Queue name which your server will listen to</td>
  </tr>
  <tr>
    <td><code>prefetchCount</code></td>
    <td>Sets the prefetch count for the channel</td>
  </tr>
  <tr>
    <td><code>isGlobalPrefetchCount</code></td>
    <td>Enables per channel prefetching</td>
  </tr>
  <tr>
    <td><code>noAck</code></td>
    <td>If <code>false</code>, manual acknowledgment mode enabled</td>
  </tr>
  <tr>
    <td><code>consumerTag</code></td>
    <td>A name which the server will use to distinguish message deliveries for the consumer; mustn’t be already in use on the channel. It’s usually easier to omit this, in which case the server will create a random name and supply it in the reply. Consumer Tag Identifier (read more <a href="https://amqp-node.github.io/amqplib/channel_api.html#channel_consume" rel="nofollow" target="_blank">here</a>)</td>
  </tr>
  <tr>
    <td><code>queueOptions</code></td>
    <td>Additional queue options (read more <a href="https://amqp-node.github.io/amqplib/channel_api.html#channel_assertQueue" rel="nofollow" target="_blank">here</a>)</td>
  </tr>
  <tr>
    <td><code>socketOptions</code></td>
    <td>Additional socket options (read more <a href="https://amqp-node.github.io/amqplib/channel_api.html#connect" rel="nofollow" target="_blank">here</a>)</td>
  </tr>
  <tr>
    <td><code>headers</code></td>
    <td>Headers to be sent along with every message</td>
  </tr>
  <tr>
    <td><code>replyQueue</code></td>
    <td>Reply queue for the producer. Default is <code>amq.rabbitmq.reply-to</code></td>
  </tr>
  <tr>
    <td><code>persistent</code></td>
    <td>If truthy, the message will survive broker restarts provided it’s in a queue that also survives restarts</td>
  </tr>
  <tr>
    <td><code>noAssert</code></td>
    <td>When false, a queue will not be asserted before consuming</td>
  </tr>
  <tr>
    <td><code>wildcards</code></td>
    <td>Set to true only if you want to use Topic Exchange for routing messages to queues. Enabling this will allow you to use wildcards (*, #) as message and event patterns</td>
  </tr>
  <tr>
    <td><code>exchange</code></td>
    <td>Name for the exchange. Defaults to the queue name when "wildcards" is set to true</td>
  </tr>
  <tr>
    <td><code>exchangeType</code></td>
    <td>Type of the exchange. Default is <code>topic</code>. Valid values are <code>direct</code>, <code>fanout</code>, <code>topic</code>, and <code>headers</code></td>
  </tr>
  <tr>
    <td><code>routingKey</code></td>
    <td>Additional routing key for the topic exchange</td>
  </tr>
  <tr>
    <td><code>maxConnectionAttempts</code></td>
    <td>Maximum number of connection attempts. Applies only to the consumer configuration. -1 === infinite</td>
  </tr>
</table>

#### Client

Like other microservice transporters, you have <a href="https://docs.nestjs.com/microservices/basics#client">several options</a> for creating a RabbitMQ `ClientProxy` instance.

One method for creating an instance is to use the `ClientsModule`. To create a client instance with the `ClientsModule`, import it and use the `register()` method to pass an options object with the same properties shown above in the `createMicroservice()` method, as well as a `name` property to be used as the injection token. Read more about `ClientsModule` <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

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

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

#### Context

In more complex scenarios, you may need to access additional information about the incoming request. When using the RabbitMQ transporter, you can access the `RmqContext` object.

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

To access the original RabbitMQ message (with the `properties`, `fields`, and `content`), use the `getMessage()` method of the `RmqContext` object, as follows:

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

To retrieve a reference to the RabbitMQ [channel](https://www.rabbitmq.com/channels.html), use the `getChannelRef` method of the `RmqContext` object, as follows:

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

To make sure a message is never lost, RabbitMQ supports [message acknowledgements](https://www.rabbitmq.com/confirms.html). An acknowledgement is sent back by the consumer to tell RabbitMQ that a particular message has been received, processed and that RabbitMQ is free to delete it. If a consumer dies (its channel is closed, connection is closed, or TCP connection is lost) without sending an ack, RabbitMQ will understand that a message wasn't processed fully and will re-queue it.

To enable manual acknowledgment mode, set the `noAck` property to `false`:

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

When manual consumer acknowledgements are turned on, we must send a proper acknowledgement from the worker to signal that we are done with a task.

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

To configure message options, you can use the `RmqRecordBuilder` class (note: this is doable for event-based flows as well). For example, to set `headers` and `priority` properties, use the `setOptions` method, as follows:

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

> info **Hint** `RmqRecordBuilder` class is exported from the `@nestjs/microservices` package.

And you can read these values on the server-side as well, by accessing the `RmqContext`, as follows:

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

To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For the RMQ driver, the `status` stream emits `connected` and `disconnected` events.

```typescript
this.client.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
```

> info **Hint** The `RmqStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
```

#### Listening to RabbitMQ events

In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the `error` event to trigger additional operations when an error occurs. To do this, use the `on()` method, as shown below:

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

For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you **shouldn't need** to access the driver directly.

To do so, you can use the `unwrap()` method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect.

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

With this configuration, you can use wildcards in your routing keys when subscribing to events/messages. For example, to listen for messages with the routing key `cats.#`, you can use the following code:

```typescript
@MessagePattern('cats.#')
getCats(@Payload() data: { message: string }, @Ctx() context: RmqContext) {
  console.log(`Received message with routing key: ${context.getPattern()}`);

  return {
    message: 'Hello from the cats service!',
  }
}
```

To send a message with a specific routing key, you can use the `send()` method of the `ClientProxy` instance:

```typescript
this.client.send('cats.meow', { message: 'Meow!' }).subscribe((response) => {
  console.log(response);
});
```
