### RabbitMQ

The [RabbitMQ](https://www.rabbitmq.com/) is the most widely deployed open source message broker.

#### Installation

Before we start, we have to install required packages:

```bash
$ npm i --save amqplib amqp-connection-manager
```

#### Transporter

In order to switch to **RabbitMQ** transporter, we need to modify an options object passed to the `createMicroservice()` method.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.RMQ,
  options: {
    urls: [`amqp://localhost:5672`],
    queue: 'cats_queue',
    queueOptions: { durable: false },
  },
});
```

> info **Hint** `Transport` enumerator is imported from the `@nestjs/microservices` package.

#### Options

There are a bunch of available options that determine a transporter behavior.

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
    <td><code>queueOptions</code></td>
    <td>Additional queue options. They are well-described <a href="https://www.squaremobius.net/amqp.node/channel_api.html#assertQueue" rel="nofollow" target="_blank">here</a></td>
  </tr>
  <tr>
    <td><code>socketOptions</code></td>
    <td>Additional socket options. They are well-described <a href="https://www.squaremobius.net/amqp.node/channel_api.html#socket-options" rel="nofollow" target="_blank">here</a></td>
  </tr>
</table>
