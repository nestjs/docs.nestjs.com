### MQTT

The [MQTT](http://mqtt.org/) is a lightweight messaging protocol, optimized for high-latency.

#### Installation

Before we start, we have to install required package:

```bash
$ npm i --save mqtt
```

#### Overview

In order to switch to **MQTT** transporter, we need to modify an options object passed to the `createMicroservice()` method.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.MQTT,
  options: {
    host: 'localhost',
    port: 1883,
  },
});
```

> info **Hint** `Transport` enumerator is imported from the `@nestjs/microservices` package.

#### Options

There are a bunch of available options that determine a transporter behavior. They are well-described [here](https://github.com/mqttjs/MQTT.js).
