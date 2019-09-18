### Kafka

[Kafka](https://kafka.apache.org/) is an open source, distributed streaming platform.

#### Installation

Before we start, we have to install required package:

```bash
$ npm i --save kafkajs
```

#### Transporter

In order to switch to **Kafka** transporter, we need to modify an options object passed to the `createMicroservice()` method.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    }
  }
});
```

> info **Hint** `Transport` enumerator is imported from the `@nestjs/microservices` package.

#### Options

There are a several options that determine the transporter's behavior.

<table>
  <tr>
    <td><code>client</code></td>
    <td>Client configuration options. They are well-described
      <a
        href="https://kafka.js.org/docs/configuration"
        rel="nofollow"
        target="blank"
        >here</a
      >.</td>
  </tr>
  <tr>
    <td><code>consumer</code></td>
    <td>Consumer configuration options. They are well-described
      <a
        href="https://kafka.js.org/docs/consuming#a-name-options-a-options"
        rel="nofollow"
        target="blank"
        >here</a
      >.</td>
  </tr>
  <tr>
    <td><code>run</code></td>
    <td>Run configuration options. They are well-described
      <a
        href="https://kafka.js.org/docs/consuming"
        rel="nofollow"
        target="blank"
        >here</a
      >.</td>
  </tr>
  <tr>
    <td><code>producer</code></td>
    <td>Producer configuration options. They are well-described
      <a
        href="https://kafka.js.org/docs/producing#options"
        rel="nofollow"
        target="blank"
        >here</a
      >.</td>
  </tr>
  <tr>
    <td><code>send</code></td>
    <td>Send configuration options. They are well-described
      <a
        href="https://kafka.js.org/docs/producing#options"
        rel="nofollow"
        target="blank"
        >here</a
      >.</td>
  </tr>
</table>

#### Client
In order to create a client instance, we need to use `@Client()` decorator.

```typescript
@@filename(hero.controller)
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
client: ClientKafka;
```

There is a small difference compared to other microservices. Instead of the `ClientProxy` class, we use the `ClientKafka` that provides a `subscribeToResponseOf()` method. The `subscribeToResponseOf()` method takes a request topic name as an argument and adds the derived reply topic name to a collection of reply topics.  This method is required when implementing the message pattern.

```typescript
@@filename(hero.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
}
```

If the `ClientKafka` is provided asynchronously to the controller, the `subscribeToResponseOf()` method must be called before calling the `connect()` method.

```typescript
@@filename(hero.controller)
async onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
  await this.client.connect();
}
```

#### Message Pattern
The Kafka microservice message pattern utilizes two topics for the request and reply channels.  The `ClientKafka` sends messages with a [return address](https://www.enterpriseintegrationpatterns.com/patterns/messaging/ReturnAddress.html) by associating a [correlation id](https://www.enterpriseintegrationpatterns.com/patterns/messaging/CorrelationIdentifier.html), reply topic, and reply partition with the request message.  This requires the `ClientKafka` instance to be subscribed to the reply topic and assigned to at least one partition before sending a message.

Subsequently, you need to have at least one reply topic partition for every Nest application running.  For example, if you are running 4 Nest applications but the reply topic only has 3 partitions then 1 of the Nest applications will error out when trying to send a message.

When new `ClientKafka` instances are launched they join the consumer group and ask for a partition.  This triggers a rebalance of partitions assigned to consumers belonging to the consumer group.  Normally, this would be done in a round robin partitioner that assigns topic partitions to a collection of consumers sorted by consumer names.  However, when using this partitioning method, a new consumer could join the consumer group and be placed anywhere within the collection of consumers sorted by consumer names because the consumer name is randomly set on application launch.  To circumvent this problem, the `ClientKafka` consumer uses round robin partitioner that assigns topic partitions to a collection of consumers sorted by a consumer's high-resolution timestamps (`process.hrtime()`) that is set on application launch.

#### Incoming
Nest receives incoming Kafka messages as an object with `key`, `value`, and `headers` properties that have values of the `Buffer` type.  Nest then parses these values by transforming the buffers into strings.  If the string is "object like", Nest attempts to parse the string as `JSON`.  The parsed object is then passed to it's the associated handler with the following properties.

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

#### Outgoing
Nest sends outgoing Kafka messages after a serialization process when publishing events or sending messages.  This occurs on arguments passed to the client `emit()` and `send()` methods or on values returned from a `@MessagePattern` method. This serialization "stringifies" objects that are not strings or buffers by using `JSON.stringify()` or the `toString()` prototype method.

```typescript
@@filename(hero.controller)
@Controller()
export class HeroService {
  @MessagePattern('hero.kill.dragon')
  killDragon(message: any): any {
    const dragonId = message.value.dragonId;
    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];
    
    return items;
  }
}
```

Outgoing messages can also be keyed by passing an object with the `key` and `value` properties.  Keying messages is important for meeting the [co-partitioning requirement](https://docs.confluent.io/current/ksql/docs/developer-guide/partition-data.html#co-partitioning-requirements).

```typescript
@@filename(hero.controller)
@Controller()
export class HeroService {
  @MessagePattern('hero.kill.dragon')
  killDragon(message: any): any {
    const realm = 'Nest';
    const heroId = message.value.heroId;
    const dragonId = message.value.dragonId;

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

Additionally, messages passed in this format can also contain custom headers set in the `headers` hash property.  Header hash property values must be either a type of `string` or `Buffer`.

```typescript
@@filename(hero.controller)
@Controller()
export class HeroService {
  @MessagePattern('hero.kill.dragon')
  killDragon(message: any): any {
    const realm = 'Nest';
    const heroId = message.value.heroId;
    const dragonId = message.value.dragonId;

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

#### Naming Conventions
The Kafka microservice components append a description of their respective role onto the `client.clientId` and `consumer.groupId` options to prevent collisions between Nest microservice client and server components.  By default the `ClientKafka` components appends `-client` and the `ServerKafka` components appends `-server` to both of these options.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice(ApplicationModule, {
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

```typescript
@@filename(hero.controller)
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
client: ClientKafka;
```
> info **Hint** Kafka client and consumer naming conventions can be customized by extending `ClientKafka` and `KafkaServer` in your own custom provider and overriding the constructor.


Since the Kafka microservice message pattern utilizes two topics for the request and reply channels, a reply pattern should be derived from the request topic.  By default, the name of reply topic is the composite of the request topic name with `.reply` appended.

```typescript
@@filename(hero.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.get'); // hero.get.reply
}
```
> info **Hint** Kafka reply topic naming conventions can be customized by extending `ClientKafka` in your own custom provider and overriding the `getResponsePatternName` method.