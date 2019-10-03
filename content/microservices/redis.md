### Redis

[Redis](https://redis.io/) transporter implements the publish/subscribe messaging paradigm and leverages [Pub/Sub](https://redis.io/topics/pubsub) feature of Redis. Published messages are categorised in channels, without knowing what subscribers will eventually receive the message (and if any). Each microservice can subscribe to any number of channels. In addition, more than one channel can be subscribed to at a time. Messages exchanged through channels are **fire-and-forget**, which means that if a message is published and there are no subscribers interested in it, the message removed and cannot be recovered. Thus, you don't have a guarantee that either messages or events will be handled by at least one service. Also, single message can be received many subscribers.

<figure><img src="/assets/Redis_1.png" /></figure>

#### Installation

To start building Redis-based microservices, first install the required package:

```bash
$ npm i --save redis
```

#### Overview

In order to use Redis transporter, a different options object has to be passed to the `createMicroservice()` method.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.REDIS,
  options: {
    url: 'redis://localhost:6379',
  },
});
```

> info **Hint** `Transport` enum is imported from the `@nestjs/microservices` package.

Likewise, to create a client instance, we need to pass the options object which has the same properties we saw above in the `createMicroservice()` method.

```typescript
ClientsModule.register([
  {
    name: 'MATH_SERVICE',
    transport: Transport.REDIS,
    options: {
      url: 'redis://localhost:6379',
    }
  },
]),
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them [here](/microservices/basics#client).

#### Context

In more sophisticated scenarios, you may want to access more information about the incoming request. In Redis, you can access `RedisContext` object.

```typescript
@@filename()
@MessagePattern('notifications')
getDate(@Payload() data: number[], @Ctx() context: RedisContext) {
  console.log(`Channel: ${context.getChannel()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getDate(data, context) {
  console.log(`Channel: ${context.getChannel()}`);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `RedisContext` are imported from `@nestjs/microservices`.

#### Options

The `options` object is specific to the chosen transporter. The <strong>REDIS</strong> transporter exposes the properties described below.

<table>
  <tr>
    <td><code>url</code></td>
    <td>Connection url</td>
  </tr>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Number of times to retry messag</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Delay between message retry attempts (ms)</td>
  </tr>
</table>
