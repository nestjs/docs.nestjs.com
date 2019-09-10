### Kafka

The [Kafka](https://kafka.apache.org/) is an open source, distributed streaming platform.

#### Installation

Before we start, we have to install required package:

```bash
$ npm i --save kafkajs
```

#### Overview

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
        target="blank"
        >here</a
      >.</td>
  </tr>
  <tr>
    <td><code>consumer</code></td>
    <td>Consumer configuration options. They are well-described
      <a
        href="https://kafka.js.org/docs/consuming#a-name-options-a-options"
        target="blank"
        >here</a
      >.</td>
  </tr>
  <tr>
    <td><code>run</code></td>
    <td>Run configuration options. They are well-described
      <a
        href="https://kafka.js.org/docs/consuming"
        target="blank"
        >here</a
      >.</td>
  </tr>
  <tr>
    <td><code>producer</code></td>
    <td>Producer configuration options. They are well-described
      <a
        href="https://kafka.js.org/docs/producing#options"
        target="blank"
        >here</a
      >.</td>
  </tr>
  <tr>
    <td><code>send</code></td>
    <td>Send configuration options. They are well-described
      <a
        href="https://kafka.js.org/docs/producing#options"
        target="blank"
        >here</a
      >.</td>
  </tr>
</table>

### Overview


### Message Pattern


### More