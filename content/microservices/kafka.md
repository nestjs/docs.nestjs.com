### Kafka

[Kafka](https://kafka.apache.org/) is an open source, distributed streaming platform with three key capabilities:

- Publish and subscribe to streams of records, similar to a message queue or enterprise messaging system.
- Store streams of records in a fault-tolerant durable way.
- Process streams of records as they occur.

The Kafka project aims to provide a unified, high-throughput, low-latency platform for handling real-time data feeds. It integrates with Apache Storm and Spark for real-time streaming data analysis.

#### Installation

To start building Kafka-based microservices, first install the required package:

```bash
$ npm i --save @cookiemonsterdev/kafka-core
```

The Kafka transporter runs on [`@cookiemonsterdev/kafka-core`](https://cookiemonsterdev.github.io/kafka/docs/core/start/introduction/), a TypeScript Kafka client that speaks the Kafka wire protocol directly and supports brokers from Kafka 0.10 onward. It requires **Node.js 24** or newer.

Applications that use `kafkajs` keep working: when kafka-core isn't installed, Nest runs on `kafkajs` and logs a deprecation warning. Support for `kafkajs` will be removed in the next major version. See [Moving from kafkajs](#moving-from-kafkajs).

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
    <td><code>driver</code></td>
    <td>The client library to run on (<code>string</code>): <code>'kafka-core'</code> or <code>'kafkajs'</code>. Defaults to kafka-core when it is installed, otherwise kafkajs. On either, offsets and timestamps are <code>bigint</code> values</td>
  </tr>
  <tr>
    <td><code>client</code></td>
    <td>Client configuration options (see the
      <a
        href="https://cookiemonsterdev.github.io/kafka/docs/core/reference/configuration/"
        rel="nofollow"
        target="_blank"
        >kafka-core client configuration</a
      >). Options left out can come from a <a href="/microservices/kafka#configuration-file">configuration file</a></td>
  </tr>
  <tr>
    <td><code>consumer</code></td>
    <td>Consumer configuration options (see the
      <a
        href="https://cookiemonsterdev.github.io/kafka/docs/core/reference/consumer/"
        rel="nofollow"
        target="_blank"
        >kafka-core consumer options</a
      >)</td>
  </tr>
  <tr>
    <td><code>run</code></td>
    <td>Options passed to the consumer's <code>run()</code> method (see
      <a
        href="https://cookiemonsterdev.github.io/kafka/docs/core/guides/consumer/"
        rel="nofollow"
        target="_blank"
        >kafka-core consuming messages</a
      >)</td>
  </tr>
  <tr>
    <td><code>subscribe</code></td>
    <td>Options passed to the consumer's <code>subscribe()</code> method, except <code>topics</code>, which Nest derives from the registered patterns (see
      <a
        href="https://cookiemonsterdev.github.io/kafka/docs/core/reference/consumer/"
        rel="nofollow"
        target="_blank"
        >kafka-core subscribe options</a
      >)</td>
  </tr>
  <tr>
    <td><code>producer</code></td>
    <td>Producer configuration options (see the
      <a
        href="https://cookiemonsterdev.github.io/kafka/docs/core/reference/producer/"
        rel="nofollow"
        target="_blank"
        >kafka-core producer options</a
      >)</td>
  </tr>
  <tr>
    <td><code>send</code></td>
    <td>Options passed to the producer's <code>send()</code> method, except <code>topic</code> and <code>messages</code> (see
      <a
        href="https://cookiemonsterdev.github.io/kafka/docs/core/guides/producer/"
        rel="nofollow"
        target="_blank"
        >kafka-core producing messages</a
      >)</td>
  </tr>
  <tr>
    <td><code>parser</code></td>
    <td>Options of the parser that decodes incoming messages: <code>keepBinary</code> passes message values to handlers as buffers instead of decoding them (<code>boolean</code>), and <code>maxMessageSize</code> is the size in bytes, after decompression, above which a message is skipped instead of decoded. Defaults to <code>16777216</code> (16 MiB) (<code>number</code>)</td>
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

#### Configuration file

Instead of passing connection settings in code, you can keep them in a `kafka.config.*` file. The `kafka` [command-line interface](#command-line-interface) and [Kafka Studio](#debugging-and-testing-with-studio) read the same file, so your application and your tools connect to the same cluster with the same credentials. Scaffold one with the CLI, which writes `kafka.config.ts` in a TypeScript project, or write it by hand:

```bash
$ npx @cookiemonsterdev/kafka-cli init
```

```typescript
@@filename(kafka.config)
import { defineConfig } from '@cookiemonsterdev/kafka-core';

export default defineConfig({
  client: {
    clientId: 'hero',
    brokers: ['localhost:9092'],
  },
  consumer: {
    groupId: 'hero-consumer',
  },
});
```

Then leave `brokers` out of the transporter options. Nest looks for the file and takes the settings it finds there:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
});
```

The same applies to clients registered with `ClientsModule` or `@Client()`. Nest logs the path of the file it loaded. Configuration files need kafka-core: on `kafkajs`, Nest never reads one, so without `brokers` it connects to `localhost:9092`, and setting `client.config` is an error. The rules are those of kafka-core, described in its [config file reference](https://cookiemonsterdev.github.io/kafka/docs/core/reference/config-file/):

- **Discovery**: the search walks up from the current working directory to the root of your project and uses the first `kafka.config.*` file it finds. For security, it stops at a directory that anyone can write to, or that a user other than you or root owns. The reference lists the file names it tries and where it stops.
- **Precedence**: options you pass to Nest win over the file. The `client` section fills in the `client` options, and the `consumer` and `producer` sections fill in the `consumer` and `producer` options. A `clientId` or `groupId` from the file gets the `-server` or `-client` suffix too (see [Naming conventions](#naming-conventions)).
- **The `client.config` option**: set it to `true` to read the file even when you pass `brokers`, to a path to load that file only (a missing file is an error), or to `false` to never read one.
- **Defaults**: with no brokers in the options and no file, Nest connects to `localhost:9092`, as it always has. A file that defines no brokers is an error, unless you pass them in the options.

Nest loads the file asynchronously, so it can use top-level `await` or export an async factory. Write erasable TypeScript, and give relative imports their `.ts` extension. Keep secrets out of the file, for example by reading them from `process.env`.

> warning **Note** A container that runs as root over files owned by another user, as many CI images do, finds no file through discovery. Pass the path instead: `client: {{ '{' }} config: './kafka.config.ts' {{ '}' }}`.

#### Client

Kafka differs slightly from other microservice transporters: instead of the `ClientProxy` type, you use `ClientKafkaProxy`.

As with other microservice transporters, you have [several options](/microservices/basics#client-producer-class) for creating a `ClientKafkaProxy` instance.

One option is the `ClientsModule`. Import it and use its `register()` method to pass an options object with the same properties shown above for the `createMicroservice()` method, plus a `name` property used as the injection token. See the [client section of the microservices overview](/microservices/basics#client-producer-class) to learn more about `ClientsModule`.

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

You can also create a client with `ClientProxyFactory` or the `@Client()` decorator, both described in the [microservices overview](/microservices/basics#client-producer-class).

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

kafka-core supports subscribing to topics by regular expression. Starting with NestJS v12, you can pass a `RegExp` directly to `@MessagePattern()` or `@EventPattern()`. Nest preserves the pattern, forwards it to the kafka-core `subscribe()` call, and falls back to regular expression matching when resolving a handler for an incoming topic.

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

Nest receives incoming Kafka messages as objects with `key`, `value`, and `headers` properties whose values are of type `Buffer`. Nest parses these values by converting the buffers into strings. If a string is "object-like" (i.e., it starts with a curly brace or a square bracket), Nest attempts to parse it as JSON, except for the `kafka_correlationId`, `kafka_replyTopic` and `kafka_replyPartition` headers it routes replies with, which are always kept as strings. The `value` is then passed to the associated handler.

Nest does not decode a message larger than 16 MiB after decompression, counting its key, its headers and, unless `parser.keepBinary` is set, its value. It logs and skips the message, so that its offset is committed, and a `ClientKafkaProxy` fails the request that such a reply answers. To change the limit, set the `parser.maxMessageSize` option. A value that isn't a number, such as the `NaN` that `Number()` makes of an unset environment variable, gets the default.

Nest doesn't answer a request whose `kafka_correlationId` header is longer than 256 characters. It logs an error and drops the message, so that its offset is committed.

#### Outgoing

Nest serializes outgoing Kafka messages before publishing events or sending messages. Serialization applies to the arguments passed to the `ClientKafkaProxy` `emit()` and `send()` methods, and to the values returned from a `@MessagePattern()` method. It "stringifies" values that are not strings or buffers by using `JSON.stringify()` or the `toString()` prototype method. A `bigint`, such as an offset or a timestamp of a received message, is written as a decimal string.

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

Messages passed in this format can also contain custom headers set in the `headers` property. Header values must be of type `string` or `Buffer`, and a message can carry at most 10,000 of them, an array value counting once per item. Nest does not send a message with more: `emit()` and `send()` fail, and a `@MessagePattern()` reply is logged and dropped.

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
  timestamp: bigint;
  offset: bigint;
  byteSize?: number;
  attributes: number;
  key: any;
  value: any;
  headers: Record<string, any>;
}
```

It also carries the remaining fields of a kafka-core [`KafkaMessage`](https://cookiemonsterdev.github.io/kafka/docs/core/reference/consumer/), such as `isControlRecord` and `batchContext`. On `kafkajs`, `byteSize` is set only for messages in the legacy MessageSet format (Kafka 0.10). Offsets and timestamps are `bigint` values, which `JSON.stringify()` rejects: convert them with `toString()` before logging or storing them as JSON.

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

As with other transporters, unhandled exceptions are automatically converted to a "user-friendly" format. However, in some edge cases you might want to bypass this mechanism and let the Kafka client consume exceptions instead. Throwing an exception while processing a message instructs the client to **retry** it (redeliver it), which means that even though the message (or event) handler was triggered, the offset won't be committed to Kafka.

> warning **Warning** For event handlers (event-based communication), all unhandled exceptions are considered **retriable exceptions** by default.

For message handlers, use the dedicated `KafkaRetriableException` class, as follows:

```typescript
throw new KafkaRetriableException('...');
```

> info **Hint** The `KafkaRetriableException` class is exported from the `@nestjs/microservices` package.

> warning **Warning** Nest handles a message as a request only when it carries the `kafka_correlationId` and `kafka_replyTopic` headers that `ClientKafkaProxy.send()` adds. Any other message, such as one written by a producer other than Nest, is handled as an event, even when it reaches a `@MessagePattern()` handler: its unhandled exceptions are retriable, and the next message of the partition is only processed once the stream the handler returns completes. For topics that other producers write to, make sure message handlers return streams that complete, and handle the messages they cannot process instead of throwing, unless these should be redelivered.

#### Custom exception handling

Along with the default error handling mechanisms, you can create a custom exception filter for Kafka events to manage retry logic. For example, the filter below skips a problematic event after a configurable number of retries:

```typescript
import { Catch, ArgumentsHost, ExceptionFilter, Logger } from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import type { Producer } from '@cookiemonsterdev/kafka-core';

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
        `Max retries (${this.maxRetries}) exceeded for message at offset ${
          message.offset
        } of ${kafkaContext.getTopic()}[${kafkaContext.getPartition()}]`,
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
      // Rethrow so that kafka-core retries the message
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
        offset: offset + 1n,
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
import type { Producer } from '@cookiemonsterdev/kafka-core';

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
import { Kafka } from '@cookiemonsterdev/kafka-core';

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

> info **Hint** To build the producer from your [configuration file](#configuration-file) instead of repeating the brokers, create the client with `await Kafka.fromConfig()`.

#### Commit offsets

Committing offsets is essential when working with Kafka. By default, the consumer commits offsets automatically (see the [kafka-core consumer offsets guide](https://cookiemonsterdev.github.io/kafka/docs/core/guides/consumer-offsets/)). `KafkaContext` gives you access to the active consumer for committing offsets manually. It is the consumer of the client Nest runs on, and takes `bigint` offsets on either client.

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
  await consumer.commitOffsets([{ topic, partition, offset: offset + 1n }]);
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
  await consumer.commitOffsets([{ topic, partition, offset: offset + 1n }]);
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

#### Command-line interface

[`@cookiemonsterdev/kafka-cli`](https://cookiemonsterdev.github.io/kafka/docs/cli/start/introduction/) provides a `kafka` command built on the same client. It reads your [configuration file](#configuration-file), so its commands need no `--brokers` flag. Install it as a development dependency:

```bash
$ npm i --save-dev @cookiemonsterdev/kafka-cli
```

The following commands cover common tasks around a Nest application:

```bash
# Show which config file and brokers the tools resolve, then reach the brokers
$ npx kafka doctor
$ npx kafka ping

# Create a request topic and its reply topic, with one reply partition per client instance
$ npx kafka topic create hero.kill.dragon hero.kill.dragon.reply --partitions 3 --if-not-exists

# Inspect the consumer groups Nest joins (note the -server and -client suffixes)
$ npx kafka group list
$ npx kafka group describe hero-consumer-server
$ npx kafka group offsets hero-consumer-server --topic hero.kill.dragon
```

To process a topic again from its start, stop the application, preview the reset, and then apply it:

```bash
$ npx kafka group reset-offsets hero-consumer-server --topic hero.kill.dragon --to earliest
$ npx kafka group reset-offsets hero-consumer-server --topic hero.kill.dragon --to earliest --execute --yes
```

Add `--json` to any command for machine-readable output, for example in a CI script. To work with several clusters, define them under `cli.profiles` in the configuration file, select one with the CLI's `--profile` flag, and switch between them in Studio. Profiles apply to the CLI and Studio only: your application always reads the `client` section. See the [command reference](https://cookiemonsterdev.github.io/kafka/docs/cli/reference/commands/) for every command.

#### Debugging and testing with Studio

[Kafka Studio](https://cookiemonsterdev.github.io/kafka/docs/studio/start/introduction/) is a local web UI built on the same client. Start it from your project directory, and it connects with your [configuration file](#configuration-file):

```bash
$ npm i --save-dev @cookiemonsterdev/kafka-studio
$ npx kafka-studio
```

With the CLI installed, `npx kafka studio` starts it as well. Open the full URL that Studio prints: its hash carries a session token, so don't share it. Add `--read-only` when you point Studio at a cluster that others use.

Studio helps with the following Nest tasks:

- **Messages**: follow request, reply, and event topics live, and inspect the key, value, and headers of each record, such as `kafka_correlationId`, `kafka_replyTopic`, and `kafka_nest-err`.
- **Produce**: send an event to an `@EventPattern()` handler. To call a `@MessagePattern()` handler, add the `kafka_correlationId` and `kafka_replyTopic` headers that `ClientKafkaProxy.send()` adds. The reply arrives on the reply topic, with the same `kafka_correlationId` header.
- **Consumer groups**: check membership and per-partition lag of the `-server` and `-client` groups, and see which reply partition each client instance holds.
- **Debugger**: search across topics, for example with `headers.kafka_correlationId == "<id>"` to find a request and its reply, and replay failed records, such as those a dead-letter topic collected. See [Debug event flows](https://cookiemonsterdev.github.io/kafka/docs/studio/guides/debugger/).

Studio **scenarios** turn such a check into a repeatable test. A scenario is a JSON file whose steps produce records and wait for matching ones. `{{ '{' }}{{ '{' }}id{{ '}' }}{{ '}' }}` is replaced with a fresh id on every run, so the scenario below sends a request to a running Nest application and passes once the reply with the same correlation id arrives:

```json
@@filename(hero.scenario.json)
{
  "version": 1,
  "name": "Kill a dragon",
  "steps": [
    {
      "kind": "produce",
      "topic": "hero.kill.dragon",
      "key": "{{ '{' }}{{ '{' }}id{{ '}' }}{{ '}' }}",
      "value": "{\"heroId\":1,\"dragonId\":7}",
      "headers": {
        "kafka_correlationId": "{{ '{' }}{{ '{' }}id{{ '}' }}{{ '}' }}",
        "kafka_replyTopic": "hero.kill.dragon.reply"
      }
    },
    {
      "kind": "expect",
      "topic": "hero.kill.dragon.reply",
      "predicates": [
        { "field": "headers.kafka_correlationId", "operator": "eq", "value": "{{ '{' }}{{ '{' }}id{{ '}' }}{{ '}' }}" }
      ],
      "timeoutMs": 10000
    }
  ]
}
```

Build scenarios in the **Scenarios** view of the Debugger and export them, or write them by hand. Run one without the UI, for example as an end-to-end check in CI once the broker and the application are up:

```bash
$ npx kafka-studio --scenario hero.scenario.json
```

The run prints its results as JSON and exits with `0` when every step passes, `1` when a step fails, and `2` for invalid flags. Scenarios write to the cluster, so they don't run in read-only mode.

#### Moving from kafkajs

Earlier releases of the Kafka transporter ran on `kafkajs`, which hasn't shipped a release since 2023.

Whichever client it runs on, the transporter now hands offsets and timestamps to your code as `bigint` values, as kafka-core does. On `kafkajs`, Nest converts them on the way in and out. After upgrading Nest, review the following:

- **Received messages**: the `offset` and `timestamp` of `context.getMessage()` are `bigint` values instead of strings, and `size` is gone. kafka-core reports a `byteSize` instead (see [Context](#context)).
- **Committing and seeking**: pass `bigint` offsets to the `commitOffsets()` and `seek()` methods of the consumer that `KafkaContext` and `ClientKafkaProxy` expose. Commit the next offset with `offset + 1n` instead of `(Number(offset) + 1).toString()`.
- **Send results**: `ClientKafkaProxy.emit()` and the producer's `send()` resolve to record metadata whose `baseOffset`, `logAppendTime`, and `logStartOffset` are `bigint` values. `JSON.stringify()` rejects a `bigint`, so an HTTP handler that returns such a result fails: return only what the response needs, converted with `toString()`. The Kafka messages Nest sends are not affected (see [Outgoing](#outgoing)).
- **Timestamps you send** in a message are numbers (milliseconds since the epoch), not strings.
- **Other APIs**: on `kafkajs`, the admin client and transactions keep string offsets, and the consumer and producer have only the methods of `kafkajs`. Methods that only kafka-core has, such as `flush()` and `committed()`, are missing, and `run()` options such as `signal` and `maxRecords` are ignored.

To switch to kafka-core, replace the package:

```bash
$ npm uninstall kafkajs
$ npm i --save @cookiemonsterdev/kafka-core
```

Then review the differences of the client itself:

- **Node.js**: kafka-core requires Node.js 24 or newer.
- **Type imports**: import types such as `Producer` and `Consumer` from `@cookiemonsterdev/kafka-core`.
- **Names**: the `KafkaJS` prefix is gone from errors (`KafkaJSNumberOfRetriesExceeded` becomes `KafkaNumberOfRetriesExceeded`) and environment variables (`KAFKAJS_LOG_LEVEL` becomes `KAFKA_LOG_LEVEL`). `Partitioners.JavaCompatiblePartitioner` becomes `Partitioners.DefaultPartitioner`.
- **Compression**: Snappy, LZ4, and ZSTD are built in. Remove `kafkajs-snappy`, `kafkajs-lz4`, and `@kafkajs/zstd`, and the code that registers them in `CompressionCodecs`.
- **Producer batching**: kafka-core waits up to 5 ms (`lingerMs`) to batch the messages it sends, while `kafkajs` sent each one immediately. This applies to `emit()`, `send()`, and the replies of `@MessagePattern()` handlers. To send without waiting, set `producer: {{ '{' }} lingerMs: 0 {{ '}' }}`.
- **Configuration file**: an application that passes no `brokers` now reads a `kafka.config.*` file when its project has one (see [Configuration file](#configuration-file)). Set `client: {{ '{' }} config: false {{ '}' }}` to keep connecting to `localhost:9092` regardless.

To keep running on `kafkajs` while kafka-core is installed, for example while you roll the switch out service by service, set the `driver` option to `'kafkajs'`. kafka-core's [migration guide](https://cookiemonsterdev.github.io/kafka/docs/core/migration/from-kafkajs/) covers the remaining differences of the client itself.
