### Kafka

[Kafka](https://kafka.apache.org/) is an open source, distributed streaming platform with three key capabilities:

- Publish and subscribe to streams of records, similar to a message queue or enterprise messaging system.
- Store streams of records in a fault-tolerant durable way.
- Process streams of records as they occur.

The Kafka project aims to provide a unified, high-throughput, low-latency platform for handling real-time data feeds. It integrates with Apache Storm and Spark for real-time streaming data analysis.

#### Installation

To start building Kafka-based microservices, first install the required package:

```bash
$ npm i --save kafkajs
```

#### Overview

As with other Nest microservice transport layer implementations, you select the Kafka transporter using the `transport` property of the options object passed to the `createMicroservice()` method, along with an optional `options` property, as shown below:

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

The `options` property is specific to the chosen transporter. The <strong>Kafka</strong> transporter exposes the following properties.

<table>
  <tr>
    <td><code>client</code></td>
    <td>Client configuration options (see the
      <a
        href="https://kafka.js.org/docs/configuration"
        rel="nofollow"
        target="_blank"
        >KafkaJS client configuration</a
      >)</td>
  </tr>
  <tr>
    <td><code>consumer</code></td>
    <td>Consumer configuration options (see the
      <a
        href="https://kafka.js.org/docs/consuming#a-name-options-a-options"
        rel="nofollow"
        target="_blank"
        >KafkaJS consumer options</a
      >)</td>
  </tr>
  <tr>
    <td><code>run</code></td>
    <td>Options passed to the consumer's <code>run()</code> method (see
      <a
        href="https://kafka.js.org/docs/consuming"
        rel="nofollow"
        target="_blank"
        >KafkaJS consuming messages</a
      >)</td>
  </tr>
  <tr>
    <td><code>subscribe</code></td>
    <td>Options passed to the consumer's <code>subscribe()</code> method, except <code>topics</code>, which Nest derives from the registered patterns (see
      <a
        href="https://kafka.js.org/docs/consuming#frombeginning"
        rel="nofollow"
        target="_blank"
        >KafkaJS fromBeginning</a
      >)</td>
  </tr>
  <tr>
    <td><code>producer</code></td>
    <td>Producer configuration options (see the
      <a
        href="https://kafka.js.org/docs/producing#options"
        rel="nofollow"
        target="_blank"
        >KafkaJS producer options</a
      >)</td>
  </tr>
  <tr>
    <td><code>send</code></td>
    <td>Options passed to the producer's <code>send()</code> method, except <code>topic</code> and <code>messages</code> (see the
      <a
        href="https://kafka.js.org/docs/producing#options"
        rel="nofollow"
        target="_blank"
        >KafkaJS producing messages</a
      >)</td>
  </tr>
  <tr>
    <td><code>producerOnlyMode</code></td>
    <td>Client only. Skips consumer group registration so the client acts only as a producer (<code>boolean</code>)</td>
  </tr>
  <tr>
    <td><code>postfixId</code></td>
    <td>Suffix appended to the <code>clientId</code> and <code>groupId</code> values. Defaults to <code>'-server'</code> on the server and <code>'-client'</code> on the client (<code>string</code>)</td>
  </tr>
</table>

#### Client

Kafka differs slightly from other microservice transporters: instead of the `ClientProxy` type, you use `ClientKafkaProxy`.

As with other microservice transporters, you have [several options](/microservices/basics#client) for creating a `ClientKafkaProxy` instance.

One option is the `ClientsModule`. Import it and use its `register()` method to pass an options object with the same properties shown above for the `createMicroservice()` method, plus a `name` property used as the injection token. See the [client section of the microservices overview](/microservices/basics#client) to learn more about `ClientsModule`.

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

You can also create a client with `ClientProxyFactory` or the `@Client()` decorator, both described in the [microservices overview](/microservices/basics#client).

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

The Kafka microservice message pattern uses two topics for the request and reply channels. The `ClientKafkaProxy.send()` method sends messages with a [return address](https://www.enterpriseintegrationpatterns.com/patterns/messaging/ReturnAddress.html) by associating a [correlation id](https://www.enterpriseintegrationpatterns.com/patterns/messaging/CorrelationIdentifier.html), reply topic, and reply partition with the request message. This requires the `ClientKafkaProxy` instance to be subscribed to the reply topic and assigned to at least one partition before sending a message.

As a result, you need at least one reply topic partition for every running Nest application. For example, if you run 4 Nest applications but the reply topic has only 3 partitions, 1 of the Nest applications will fail when it tries to send a message.

When new `ClientKafkaProxy` instances launch, they join the consumer group and subscribe to their respective topics. This triggers a rebalance of the topic partitions assigned to the consumers in the group.

Normally, topic partitions are assigned using the round-robin assigner, which assigns topic partitions to a collection of consumers sorted by consumer names that are randomly set on application launch. However, when a new consumer joins the consumer group, it can be positioned anywhere within that collection. Pre-existing consumers positioned after the new consumer can then be assigned different partitions, and those consumers lose the response messages of requests sent before the rebalance.

To prevent `ClientKafkaProxy` consumers from losing response messages, Nest uses a built-in custom partition assigner. During a rebalance, it lets each existing consumer keep the reply partition it was previously assigned, and distributes the remaining partitions among the other consumers.

#### Regular expression patterns

KafkaJS supports subscribing to topics by regular expression. Starting with NestJS v12, you can pass a `RegExp` directly to `@MessagePattern()` or `@EventPattern()`. Nest preserves the pattern, forwards it to the KafkaJS `subscribe()` call, and falls back to regular expression matching when resolving a handler for an incoming topic.

```typescript
@@filename()
@EventPattern(/^hero\..+$/)
handleHeroEvents(@Payload() data: any, @Ctx() context: KafkaContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Payload(), Ctx())
@EventPattern(/^hero\..+$/)
handleHeroEvents(data, context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

This subscribes the handler to every topic matching the expression (`hero.kill.dragon`, `hero.rescue.villager`, and so on) without registering each one explicitly. Use `context.getTopic()` to find out which topic delivered the message.

> info **Hint** Regular expression patterns are a Kafka-specific capability; other transporters continue to match patterns by exact value. Nest resets `lastIndex` before matching, so global (`/g`) and sticky (`/y`) expressions do not produce stateful misses.

#### Message response subscription

> warning **Note** This section is relevant only if you use the [request-response](/microservices/basics#request-response) message style (the `@MessagePattern()` decorator and the `ClientKafkaProxy.send()` method). Subscribing to the response topic is not necessary for [event-based](/microservices/basics#event-based) communication (the `@EventPattern()` decorator and the `ClientKafkaProxy.emit()` method).

`ClientKafkaProxy` provides the `subscribeToResponseOf()` method, which takes a request's topic name as an argument and adds the derived reply topic name to a collection of reply topics. This method is required when implementing the message pattern.

```typescript
@@filename(heroes.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
}
```

If the `ClientKafkaProxy` instance is created asynchronously, call the `subscribeToResponseOf()` method before calling the `connect()` method.

```typescript
@@filename(heroes.controller)
async onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
  await this.client.connect();
}
```

#### Incoming

Nest receives incoming Kafka messages as objects with `key`, `value`, and `headers` properties whose values are of type `Buffer`. Nest parses these values by converting the buffers into strings. If a string is "object-like" (i.e., it starts with a curly brace or a square bracket), Nest attempts to parse it as JSON. The `value` is then passed to the associated handler.

#### Outgoing

Nest serializes outgoing Kafka messages before publishing events or sending messages. Serialization applies to the arguments passed to the `ClientKafkaProxy` `emit()` and `send()` methods, and to the values returned from a `@MessagePattern()` method. It "stringifies" values that are not strings or buffers by using `JSON.stringify()` or the `toString()` prototype method.

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

You can also key outgoing messages by passing an object with the `key` and `value` properties. Keying messages is important for meeting the [co-partitioning requirement](https://docs.confluent.io/current/ksql/docs/developer-guide/partition-data.html#co-partitioning-requirements).

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

Messages passed in this format can also contain custom headers set in the `headers` property. Header values must be of type `string` or `Buffer`.

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

While the request-response method is ideal for exchanging messages between services, it is less suitable when your message style is event-based (which is ideal for Kafka), that is, when you want to publish events **without waiting for a response**. In that case, you don't want the overhead of maintaining two topics that request-response requires.

See [Overview: Event-based](/microservices/basics#event-based) and [Overview: Publishing events](/microservices/basics#publishing-events) to learn more.

#### Context

In more complex scenarios, you may need additional information about the incoming request. When using the Kafka transporter, you can access the `KafkaContext` object.

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

The `IncomingMessage` object fulfills the following interface:

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

If your handler takes a long time to process each message, consider using the `heartbeat` callback. To retrieve the `heartbeat` function, use the `getHeartbeat()` method of the `KafkaContext`, as follows:

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

The Kafka microservice components append a description of their role to the `client.clientId` and `consumer.groupId` options to prevent collisions between Nest microservice client and server components. By default, the `ClientKafkaProxy` components append `-client` and the `ServerKafka` components append `-server` to both options. The comments below show how the provided values are transformed.

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

> info **Hint** To change the appended suffix, set the `postfixId` option. For further customization of the client and consumer naming conventions, extend the `ClientKafka` and `ServerKafka` classes in your own custom provider and override the constructor.

Because the Kafka microservice message pattern uses two topics for the request and reply channels, the reply pattern is derived from the request topic. By default, the name of the reply topic is the request topic name with `.reply` appended.

```typescript
@@filename(heroes.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.get'); // hero.get.reply
}
```

> info **Hint** To customize the reply topic naming convention, extend the `ClientKafka` class in your own custom provider and override the `getResponsePatternName()` method.

#### Retriable exceptions

As with other transporters, unhandled exceptions are automatically converted to a "user-friendly" format. However, in some edge cases you might want to bypass this mechanism and let the `kafkajs` driver consume exceptions instead. Throwing an exception while processing a message instructs `kafkajs` to **retry** it (redeliver it), which means that even though the message (or event) handler was triggered, the offset won't be committed to Kafka.

> warning **Warning** For event handlers (event-based communication), all unhandled exceptions are considered **retriable exceptions** by default.

For message handlers, use the dedicated `KafkaRetriableException` class, as follows:

```typescript
throw new KafkaRetriableException('...');
```

> info **Hint** The `KafkaRetriableException` class is exported from the `@nestjs/microservices` package.

#### Custom exception handling

Along with the default error handling mechanisms, you can create a custom exception filter for Kafka events to manage retry logic. For example, the filter below skips a problematic event after a configurable number of retries:

```typescript
import { Catch, ArgumentsHost, ExceptionFilter, Logger } from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { Producer } from 'kafkajs';

@Catch()
export class KafkaMaxRetryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(KafkaMaxRetryExceptionFilter.name);

  constructor(
    private readonly producer: Producer,
    private readonly maxRetries: number,
    // Optional custom function executed when max retries are exceeded
    private readonly skipHandler?: (message: any) => Promise<void>,
  ) {}

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

    // Republish the message to the same topic with incremented retry count
    try {
      await this.republishWithRetry(kafkaContext, currentRetryCount + 1);
      await this.commitOffset(kafkaContext);
    } catch (republishError) {
      this.logger.error(
        'Failed to republish message for retry:',
        republishError,
      );
      // Rethrow so that KafkaJS retries the message
      throw exception;
    }
  }

  private getRetryCountFromContext(context: KafkaContext): number {
    const headers = context.getMessage().headers || {};
    const retryHeader = headers['retry-count'];
    if (!retryHeader) {
      return 0;
    }
    // Header values are Buffers, so convert to string first
    const value = Buffer.isBuffer(retryHeader)
      ? retryHeader.toString()
      : String(retryHeader);
    return parseInt(value, 10) || 0;
  }

  private async republishWithRetry(
    context: KafkaContext,
    retryCount: number,
  ): Promise<void> {
    const topic = context.getTopic();
    const message = context.getMessage();

    await this.producer.send({
      topic,
      messages: [
        {
          key: message.key,
          value: message.value,
          headers: {
            ...message.headers,
            'retry-count': retryCount.toString(),
          },
        },
      ],
    });
  }

  private async commitOffset(context: KafkaContext): Promise<void> {
    const consumer = context.getConsumer();
    if (!consumer) {
      throw new Error('Consumer instance is not available from KafkaContext.');
    }

    const topic = context.getTopic();
    const partition = context.getPartition();
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

This filter retries processing a Kafka event up to a configurable number of times. When an exception occurs, it republishes the message to the same topic with an incremented `retry-count` header, then commits the current offset. Once the maximum number of retries is reached, it calls the custom `skipHandler` (if provided) and commits the offset, skipping the problematic event. This allows subsequent events to be processed without interruption.

You can register this filter globally or at the controller level. It requires a Kafka producer instance:

```typescript
@@filename(kafka-retry.filter)
import { Inject, Injectable } from '@nestjs/common';
import { Producer } from 'kafkajs';

@Injectable()
export class AppKafkaRetryFilter extends KafkaMaxRetryExceptionFilter {
  constructor(@Inject('KAFKA_PRODUCER') producer: Producer) {
    super(producer, 5); // maxRetries = 5
  }
}
@@switch
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AppKafkaRetryFilter extends KafkaMaxRetryExceptionFilter {
  constructor(@Inject('KAFKA_PRODUCER') producer) {
    super(producer, 5); // maxRetries = 5
  }
}
```

```typescript
@@filename(my-event.handler)
@Controller()
@UseFilters(AppKafkaRetryFilter)
export class MyEventHandler {
  @EventPattern('your-topic')
  async handleEvent(@Payload() data: any, @Ctx() context: KafkaContext) {
    // Your event processing logic...
  }
}
@@switch
@Controller()
@UseFilters(AppKafkaRetryFilter)
export class MyEventHandler {
  @Bind(Payload(), Ctx())
  @EventPattern('your-topic')
  async handleEvent(data, context) {
    // Your event processing logic...
  }
}
```

Make sure to provide the Kafka producer in your module:

```typescript
@@filename(app.module)
import { Kafka } from 'kafkajs';

@Module({
  providers: [
    AppKafkaRetryFilter,
    {
      provide: 'KAFKA_PRODUCER',
      useFactory: async () => {
        const kafka = new Kafka({ brokers: ['localhost:9092'] });
        const producer = kafka.producer();
        await producer.connect();
        return producer;
      },
    },
  ],
})
export class AppModule {}
```

#### Commit offsets

Committing offsets is essential when working with Kafka. By default, messages are committed automatically after a specific time (see the [KafkaJS autocommit documentation](https://kafka.js.org/docs/consuming#autocommit)). `KafkaContext` gives you access to the active consumer for committing offsets manually. The consumer is the KafkaJS consumer and works like the [native KafkaJS implementation](https://kafka.js.org/docs/consuming#manual-committing).

```typescript
@@filename()
@EventPattern('user.created')
async handleUserCreated(@Payload() data: IncomingMessage, @Ctx() context: KafkaContext) {
  // business logic

  const { offset } = context.getMessage();
  const partition = context.getPartition();
  const topic = context.getTopic();
  const consumer = context.getConsumer();
  // Commit the next offset to consume (i.e., current offset + 1)
  await consumer.commitOffsets([
    { topic, partition, offset: (Number(offset) + 1).toString() },
  ]);
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
  // Commit the next offset to consume (i.e., current offset + 1)
  await consumer.commitOffsets([
    { topic, partition, offset: (Number(offset) + 1).toString() },
  ]);
}
```

To disable auto-committing, set `autoCommit: false` in the `run` configuration, as follows:

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

To get real-time updates on the connection and the state of the underlying driver instance, subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For the Kafka driver, the `status` stream emits `connected`, `disconnected`, `rebalancing`, `crashed`, and `stopped` events.

```typescript
this.client.status.subscribe((status: KafkaStatus) => {
  console.log(status);
});
```

> info **Hint** The `KafkaStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status:

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: KafkaStatus) => {
  console.log(status);
});
```

#### Underlying producer and consumer

For more advanced use cases, you may need to access the underlying producer and consumer instances, for example, to close the connection manually or to use driver-specific methods. In most cases, however, you **shouldn't need** to access the driver directly.

To do so, use the `producer` and `consumer` properties exposed by the `ClientKafkaProxy` instance.

```typescript
const producer = this.client.producer;
const consumer = this.client.consumer;
```
