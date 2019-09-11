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
  },
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
  },
})
client: ClientKafka;
```

There is a small difference compared to the previous examples. Instead of the `ClientProxy` class, we use the `ClientKafka` that provides a `subscribeToResponseOf()` method. The `subscribeToResponseOf()` method takes a request topic name as an argument and adds the derived reply topic name to a collection of reply topics.  This method is required when implementing the message pattern.

```typescript
@@filename(hero.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
}
```

If the `KafkaClient` is provided asynchronously to the controller, the `subscribeToResponseOf()` method must be called before calling the `connect()` method.

#### Serialization


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
    }
  },
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
  },
})
client: ClientKafka;
```
> info **Hint** Kafka client and consumer naming conventions can be customized by extending `KafkaClient` and `KafkaServer` in your own custom provider and overriding the constructor.


Since the Kafka microservice message pattern utilizes two topics for the request and reply channels, a reply pattern should be derived from the request topic.  By default, the name of reply topic is the composite of the request topic name with `.reply` appended.

```typescript
@@filename(hero.controller)
onModuleInit() {
  this.client.subscribeToResponseOf('hero.get'); // entity.get.reply
}
```
> info **Hint** Kafka reply topic naming conventions can be customized by extending `KafkaClient` in your own custom provider and overriding the `getResponsePatternName` method.