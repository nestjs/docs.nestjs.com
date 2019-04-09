### Redis

A second built-in transporter is based on [Redis](https://redis.io/) database. This transporter takes advantage of **publish/subscribe** feature.

<figure><img src="/assets/Redis_1.png" /></figure>

#### Installation

Before we start, we have to install required package:

```bash
$ npm i --save redis
```

#### Overview

In order to switch from TCP transport strategy to Redis **pub/sub**, we need to change an options object passed to the `createMicroservice()` method.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.REDIS,
  options: {
    url: 'redis://localhost:6379',
  },
});
```

> info **Hint** `Transport` enumerator is imported from the `@nestjs/microservices` package.

#### Options

There are a bunch of available options that determine a transporter behaviour.

<table>
  <tr>
    <td><code>url</code></td>
    <td>Connection url</td>
  </tr>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>A total amount of connection attempts</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>A connection retrying delay (ms)</td>
  </tr>
</table>
