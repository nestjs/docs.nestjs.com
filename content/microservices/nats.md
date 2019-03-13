### NATS

The [NATS](https://nats.io) is a simple, high performance open source messaging system.

#### Installation

Before we start, we have to install required package:

```bash
$ npm i --save nats
```

#### Overview

In order to switch to **NATS** transporter, we need to modify an options object passed to the `createMicroservice()` method.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.NATS,
  options: {
    url: 'nats://localhost:4222',
  },
});
```

> info **Hint** `Transport` enumerator is imported from the `@nestjs/microservices` package.

#### Options

There are a bunch of available options that determine a transporter behavior. They are well-described [here](https://github.com/nats-io/node-nats#connect-options). Also, there is an additional `queue` property which allows you specifying a name of the queue that your server should subscribe to (leave `undefined` if you don't want use any particular queue)
