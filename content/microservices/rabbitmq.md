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
    <td>Connection urls</td>
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
    <td><code>queueOptions</code></td>
    <td>Additional queue options (read more <a href="https://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue" rel="nofollow" target="_blank">here</a>)</td>
  </tr>
  <tr>
    <td><code>socketOptions</code></td>
    <td>Additional socket options (read more <a href="https://www.squaremobius.net/amqp.node/channel_api.html#socket-options" rel="nofollow" target="_blank">here</a>)</td>
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

In more sophisticated scenarios, you may want to access more information about the incoming request. When using the RabbitMQ transporter, you can access the `RmqContext` object.

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
