### Kafka

[Kafka](https://kafka.apache.org/) is an open source, distributed streaming platform which has three key capabilities:

- Publish and subscribe to streams of records, similar to a message queue or enterprise messaging system.
- Store streams of records in a fault-tolerant durable way.
- Process streams of records as they occur.

The Kafka project aims to provide a unified, high-throughput, low-latency platform for handling real-time data feeds. It integrates very well with Apache Storm and Spark for real-time streaming data analysis.

#### Installation

To start building Kafka-based microservices, first install the required package:

```bash
$ npm i --save kafkajs
```

#### Overview

Like other Nest microservice transport layer implementations, you select the Kafka transporter mechanism using the `transport` property of the options object passed to the `createMicroservice()` method, along with an optional `options` property, as shown below:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    }
  }
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    }
  }
});
```

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

#### Options

The `options` property is specific to the chosen transporter. The <strong>Kafka</strong> transporter exposes the properties described below.

<table>
  <tr>
    <td><code>client</code></td>
    <td>Client configuration options (read more
      <a
        href="https://kafka.js.org/docs/configuration"
        rel="nofollow"
        target="blank"
        >here</a
      >)</td>
  </tr>
  <tr>
    <td><code>consumer</code></td>
    <td>Consumer configuration options (read more
      <a
        href="https://kafka.js.org/docs/consuming#a-name-options-a-options"
        rel="nofollow"
        target="blank"
        >here</a
      >)</td>
  </tr>
  <tr>
    <td><code>run</code></td>
    <td>Run configuration options (read more
      <a
        href="https://kafka.js.org/docs/consuming"
        rel="nofollow"
        target="blank"
        >here</a
      >)</td>
  </tr>
  <tr>
    <td><code>subscribe</code></td>
    <td>Subscribe configuration options (read more
      <a
        href="https://kafka.js.org/docs/consuming#frombeginning"
        rel="nofollow"
        target="blank"
        >here</a
      >)</td>
  </tr>
  <tr>
    <td><code>producer</code></td>
    <td>Producer configuration options (read more
      <a
        href="https://kafka.js.org/docs/producing#options"
        rel="nofollow"
        target="blank"
        >here</a
      >)</td>
  </tr>
  <tr>
    <td><code>send</code></td>
    <td>Send configuration options (read more
      <a
        href="https://kafka.js.org/docs/producing#options"
        rel="nofollow"
        target="blank"
        >here</a
      >)</td>
  </tr>
  <tr>
    <td><code>producerOnlyMode</code></td>
    <td>Feature flag to skip consumer group registration and only act as a producer (<code>boolean</code>)</td>
  </tr>
  <tr>
    <td><code>postfixId</code></td>
    <td>Change suffix of clientId value (<code>string</code>)</td>
  </tr>
</table>

#### Client

There is a small difference in Kafka compared to other microservice transporters. Instead of the `ClientProxy` class, we use the `ClientKafkaProxy` class.

Like other microservice transporters, you have <a href="https://docs.nestjs.com/microservices/basics#client">several options</a> for creating a `ClientKafkaProxy` instance.

One method for creating an instance is to use the `ClientsModule`. To create a client instance with the `ClientsModule`, import it and use the `register()` method to pass an options object with the same properties shown above in the `createMicroservice()` method, as well as a `name` property to be used as the injection token. Read more about `ClientsModule` <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'HERO_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'hero',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'hero-consumer'
          }
        }
      },
    ]),
  ]
  ...
})
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

Use the `@Client()` decorator as follows:

```typescript
@Client({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero',
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer'
    }
  }
})
client: ClientKafkaProxy;
```

#### Message pattern

The Kafka microservice message pattern utilizes two topics for the request and reply channels. The `ClientKafkaProxy#send()` method sends messages with a [return address](https://www.enterpriseintegrationpatterns.com/patterns/messaging/ReturnAddress.html) by associating a [correlation id](https://www.enterpriseintegrationpatterns.com/patterns/messaging/CorrelationIdentifier.html), reply topic, and reply partition with the request message. This requires the `ClientKafkaProxy` instance to be subscribed to the reply topic and assigned to at least one partition before sending a message.

Subsequently, you need to have at least one reply topic partition for every Nest application running. For example, if you are running 4 Nest applications but the reply topic only has 3 partitions, then 1 of the Nest applications will error out when trying to send a message.

When new `ClientKafkaProxy` instances are launched they join the consumer group and subscribe to their respective topics. This process triggers a rebalance of topic partitions assigned to consumers of the consumer group.

Normally, topic partitions are assigned using the round robin partitioner, which assigns topic partitions to a collection of consumers sorted by consumer names which are randomly set on application launch. However, when a new consumer joins the consumer group, the new consumer can be positioned anywhere within the collection of consumers. This creates a condition where pre-existing consumers can be assigned different partitions when the pre-existing consumer is positioned after the new consumer. As a result, the consumers that are assigned different partitions will lose response messages of requests sent before the rebalance.

To prevent the `ClientKafkaProxy` consumers from losing response messages, a Nest-specific built-in custom partitioner is utilized. This custom partitioner assigns partitions to a collection of consumers sorted by high-resolution timestamps (`process.hrtime()`) that are set on application launch.

#### Message response subscription

> warning **Note** This section is only relevant if you use [request-response](/microservices/basics#request-response) message style (with the `@MessagePattern` decorator and the `ClientKafkaProxy#send` method). Subscribing to the response topic is not necessary for the [event-based](/microservices/basics#event-based) communication (`@EventPattern` decorator and `ClientKafkaProxy#emit` method).

The `ClientKafkaProxy` class provides the `subscribeToResponseOf()` method. The `subscribeToResponseOf()` method takes a request's topic name as an argument and adds the derived reply topic name to a collection of reply topics. This method is required when implementing the message pattern.

```typescript
@@filename(heroes.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
}
```

If the `ClientKafkaProxy` instance is created asynchronously, the `subscribeToResponseOf()` method must be called before calling the `connect()` method.

```typescript
@@filename(heroes.controller)
async onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
  await this.client.connect();
}
```

#### Incoming

Nest receives incoming Kafka messages as an object with `key`, `value`, and `headers` properties that have values of type `Buffer`. Nest then parses these values by transforming the buffers into strings. If the string is "object like", Nest attempts to parse the string as `JSON`. The `value` is then passed to its associated handler.

#### Outgoing

Nest sends outgoing Kafka messages after a serialization process when publishing events or sending messages. This occurs on arguments passed to the `ClientKafkaProxy` `emit()` and `send()` methods or on values returned from a `@MessagePattern` method. This serialization "stringifies" objects that are not strings or buffers by using `JSON.stringify()` or the `toString()` prototype method.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const dragonId = message.dragonId;
    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];
    return items;
  }
}
```

> info **Hint** `@Payload()` is imported from the `@nestjs/microservices` package.

Outgoing messages can also be keyed by passing an object with the `key` and `value` properties. Keying messages is important for meeting the [co-partitioning requirement](https://docs.confluent.io/current/ksql/docs/developer-guide/partition-data.html#co-partitioning-requirements).

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const realm = 'Nest';
    const heroId = message.heroId;
    const dragonId = message.dragonId;

    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];

    return {
      headers: {
        realm
      },
      key: heroId,
      value: items
    }
  }
}
```

Additionally, messages passed in this format can also contain custom headers set in the `headers` hash property. Header hash property values must be either of type `string` or type `Buffer`.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const realm = 'Nest';
    const heroId = message.heroId;
    const dragonId = message.dragonId;

    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];

    return {
      headers: {
        kafka_nestRealm: realm
      },
      key: heroId,
      value: items
    }
  }
}
```

#### Event-based

While the request-response method is ideal for exchanging messages between services, it is less suitable when your message style is event-based (which in turn is ideal for Kafka) - when you just want to publish events **without waiting for a response**. In that case, you do not want the overhead required by request-response for maintaining two topics.

Check out these two sections to learn more about this: [Overview: Event-based](/microservices/basics#event-based) and [Overview: Publishing events](/microservices/basics#publishing-events).

#### Context

In more complex scenarios, you may need to access additional information about the incoming request. When using the Kafka transporter, you can access the `KafkaContext` object.

```typescript
@@filename()
@MessagePattern('hero.kill.dragon')
killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('hero.kill.dragon')
killDragon(message, context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `KafkaContext` are imported from the `@nestjs/microservices` package.

To access the original Kafka `IncomingMessage` object, use the `getMessage()` method of the `KafkaContext` object, as follows:

```typescript
@@filename()
@MessagePattern('hero.kill.dragon')
killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  const originalMessage = context.getMessage();
  const partition = context.getPartition();
  const { headers, timestamp } = originalMessage;
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('hero.kill.dragon')
killDragon(message, context) {
  const originalMessage = context.getMessage();
  const partition = context.getPartition();
  const { headers, timestamp } = originalMessage;
}
```

Where the `IncomingMessage` fulfills the following interface:

```typescript
interface IncomingMessage {
  topic: string;
  partition: number;
  timestamp: string;
  size: number;
  attributes: number;
  offset: string;
  key: any;
  value: any;
  headers: Record<string, any>;
}
```

If your handler involves a slow processing time for each received message you should consider using the `heartbeat` callback. To retrieve the `heartbeat` function, use the `getHeartbeat()` method of the `KafkaContext`, as follows:

```typescript
@@filename()
@MessagePattern('hero.kill.dragon')
async killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  const heartbeat = context.getHeartbeat();

  // Do some slow processing
  await doWorkPart1();

  // Send heartbeat to not exceed the sessionTimeout
  await heartbeat();

  // Do some slow processing again
  await doWorkPart2();
}
```

#### Naming conventions

The Kafka microservice components append a description of their respective role onto the `client.clientId` and `consumer.groupId` options to prevent collisions between Nest microservice client and server components. By default the `ClientKafkaProxy` components append `-client` and the `ServerKafka` components append `-server` to both of these options. Note how the provided values below are transformed in that way (as shown in the comments).

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero', // hero-server
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer' // hero-consumer-server
    },
  }
});
```

And for the client:

```typescript
@@filename(heroes.controller)
@Client({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero', // hero-client
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer' // hero-consumer-client
    }
  }
})
client: ClientKafkaProxy;
```

> info **Hint** Kafka client and consumer naming conventions can be customized by extending `ClientKafkaProxy` and `KafkaServer` in your own custom provider and overriding the constructor.

Since the Kafka microservice message pattern utilizes two topics for the request and reply channels, a reply pattern should be derived from the request topic. By default, the name of the reply topic is the composite of the request topic name with `.reply` appended.

```typescript
@@filename(heroes.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.get'); // hero.get.reply
}
```

> info **Hint** Kafka reply topic naming conventions can be customized by extending `ClientKafkaProxy` in your own custom provider and overriding the `getResponsePatternName` method.

#### Retriable exceptions

Similar to other transporters, all unhandled exceptions are automatically wrapped into an `RpcException` and converted to a "user-friendly" format. However, there are edge-cases when you might want to bypass this mechanism and let exceptions be consumed by the `kafkajs` driver instead. Throwing an exception when processing a message instructs `kafkajs` to **retry** it (redeliver it) which means that even though the message (or event) handler was triggered, the offset won't be committed to Kafka.

> warning **Warning** For event handlers (event-based communication), all unhandled exceptions are considered **retriable exceptions** by default.

For this, you can use a dedicated class called `KafkaRetriableException`, as follows:

```typescript
throw new KafkaRetriableException('...');
```

> info **Hint** `KafkaRetriableException` class is exported from the `@nestjs/microservices` package.

### Custom exception handling

Along with the default error handling mechanisms, you can create a custom Exception Filter for Kafka events to manage retry logic. For instance, the example below demonstrates how to skip a problematic event after a configurable number of retries:

```typescript
import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { KafkaContext } from '../ctx-host';

@Catch()
export class KafkaMaxRetryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(KafkaMaxRetryExceptionFilter.name);

  constructor(
    private readonly maxRetries: number,
    // Optional custom function executed when max retries are exceeded
    private readonly skipHandler?: (message: any) => Promise<void>,
  ) {
    super();
  }

  async catch(exception: unknown, host: ArgumentsHost) {
    const kafkaContext = host.switchToRpc().getContext<KafkaContext>();
    const message = kafkaContext.getMessage();
    const currentRetryCount = this.getRetryCountFromContext(kafkaContext);

    if (currentRetryCount >= this.maxRetries) {
      this.logger.warn(
        `Max retries (${
          this.maxRetries
        }) exceeded for message: ${JSON.stringify(message)}`,
      );

      if (this.skipHandler) {
        try {
          await this.skipHandler(message);
        } catch (err) {
          this.logger.error('Error in skipHandler:', err);
        }
      }

      try {
        await this.commitOffset(kafkaContext);
      } catch (commitError) {
        this.logger.error('Failed to commit offset:', commitError);
      }
      return; // Stop propagating the exception
    }

    // If retry count is below the maximum, proceed with the default Exception Filter logic
    super.catch(exception, host);
  }

  private getRetryCountFromContext(context: KafkaContext): number {
    const headers = context.getMessage().headers || {};
    const retryHeader = headers['retryCount'] || headers['retry-count'];
    return retryHeader ? Number(retryHeader) : 0;
  }

  private async commitOffset(context: KafkaContext): Promise<void> {
    const consumer = context.getConsumer && context.getConsumer();
    if (!consumer) {
      throw new Error('Consumer instance is not available from KafkaContext.');
    }

    const topic = context.getTopic && context.getTopic();
    const partition = context.getPartition && context.getPartition();
    const message = context.getMessage();
    const offset = message.offset;

    if (!topic || partition === undefined || offset === undefined) {
      throw new Error(
        'Incomplete Kafka message context for committing offset.',
      );
    }

    await consumer.commitOffsets([
      {
        topic,
        partition,
        // When committing an offset, commit the next number (i.e., current offset + 1)
        offset: (Number(offset) + 1).toString(),
      },
    ]);
  }
}
```

This filter offers a way to retry processing a Kafka event up to a configurable number of times. Once the maximum retries are reached, it triggers a custom `skipHandler` (if provided) and commits the offset, effectively skipping the problematic event. This allows subsequent events to be processed without interruption.

You can integrate this filter by adding it to your event handlers:

```typescript
@UseFilters(new KafkaMaxRetryExceptionFilter(5))
export class MyEventHandler {
  @EventPattern('your-topic')
  async handleEvent(@Payload() data: any, @Ctx() context: KafkaContext) {
    // Your event processing logic...
  }
}
```

#### Commit offsets

Committing offsets is essential when working with Kafka. Per default, messages will be automatically committed after a specific time. For more information visit [KafkaJS docs](https://kafka.js.org/docs/consuming#autocommit). `KafkaContext` offers a way to access the active consumer for manually committing offsets. The consumer is the KafkaJS consumer and works as the [native KafkaJS implementation](https://kafka.js.org/docs/consuming#manual-committing).

```typescript
@@filename()
@EventPattern('user.created')
async handleUserCreated(@Payload() data: IncomingMessage, @Ctx() context: KafkaContext) {
  // business logic

  const { offset } = context.getMessage();
  const partition = context.getPartition();
  const topic = context.getTopic();
  const consumer = context.getConsumer();
  await consumer.commitOffsets([{ topic, partition, offset }])
}
@@switch
@Bind(Payload(), Ctx())
@EventPattern('user.created')
async handleUserCreated(data, context) {
  // business logic

  const { offset } = context.getMessage();
  const partition = context.getPartition();
  const topic = context.getTopic();
  const consumer = context.getConsumer();
  await consumer.commitOffsets([{ topic, partition, offset }])
}
```

To disable auto-committing of messages set `autoCommit: false` in the `run` configuration, as follows:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    },
    run: {
      autoCommit: false
    }
  }
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    },
    run: {
      autoCommit: false
    }
  }
});
```

#### Instance status updates

To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For the Kafka driver, the `status` stream emits `connected`, `disconnected`, `rebalancing`, `crashed`, and `stopped` events.

```typescript
this.client.status.subscribe((status: KafkaStatus) => {
  console.log(status);
});
```

> info **Hint** The `KafkaStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: KafkaStatus) => {
  console.log(status);
});
```

#### Underlying producer and consumer

For more advanced use cases, you may need to access the underlying producer and consumer instances. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you **shouldn't need** to access the driver directly.

To do so, you can use `producer` and `consumer` getters exposed by the `ClientKafkaProxy` instance.

```typescript
const producer = this.client.producer;
const consumer = this.client.consumer;
```
