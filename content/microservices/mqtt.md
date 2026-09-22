### MQTT

[MQTT](https://mqtt.org/) (Message Queuing Telemetry Transport) is an open source, lightweight messaging protocol optimized for low latency. It provides a scalable and cost-efficient way to connect devices using a **publish/subscribe** model. A communication system built on MQTT consists of the publishing server, a broker, and one or more clients. The protocol is designed for constrained devices and for low-bandwidth, high-latency, or unreliable networks.

#### Installation

To start building MQTT-based microservices, first install the required package:

```bash
$ npm i --save mqtt
```

#### Overview

To use the MQTT transporter, pass the following options object to the `createMicroservice()` method:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
  },
});
```

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

#### Options

The `options` object is specific to the chosen transporter. The <strong>MQTT</strong> transporter exposes the [MQTT.js client options](https://github.com/mqttjs/MQTT.js/#mqttclientstreambuilder-options), as well as the `url`, `subscribeOptions` (see [Quality of Service](#quality-of-service-qos)), and `userProperties` (see [record builders](#record-builders)) properties. On the server, the `maxConnectionAttempts` property limits the number of attempts to establish the initial connection (default: `-1`, i.e., unlimited). The limit doesn't apply to reconnections after the server has connected.

#### Client

As with other microservice transporters, you have <a href="/microservices/basics#client">several options</a> for creating an MQTT `ClientProxy` instance.

One way to create an instance is to use the `ClientsModule`. Import it and use its `register()` method to pass an options object with the same properties shown above for the `createMicroservice()` method, plus a `name` property to use as the injection token. Read more about the `ClientsModule` in the <a href="/microservices/basics#client">client section of the overview</a>.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.MQTT,
        options: {
          url: 'mqtt://localhost:1883',
        }
      },
    ]),
  ]
  ...
})
```

You can also create a client with `ClientProxyFactory` or the `@Client()` decorator. Both are described in the <a href="/microservices/basics#client">client section of the overview</a>.

#### Context

In more complex scenarios, you may need additional information about the incoming request. With the MQTT transporter, you can access the `MqttContext` object.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `MqttContext` are imported from the `@nestjs/microservices` package.

To access the original MQTT [packet](https://github.com/mqttjs/mqtt-packet), use the `getPacket()` method of the `MqttContext` object:

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  console.log(context.getPacket());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getPacket());
}
```

#### Wildcards

A subscription can target an explicit topic, or it can include wildcards. Two wildcards are available: `+` matches a single topic level, and `#` matches multiple topic levels.

```typescript
@@filename()
@MessagePattern('sensors/+/temperature/+')
getTemperature(@Ctx() context: MqttContext) {
  console.log(`Topic: ${context.getTopic()}`);
}
@@switch
@Bind(Ctx())
@MessagePattern('sensors/+/temperature/+')
getTemperature(context) {
  console.log(`Topic: ${context.getTopic()}`);
}
```

#### Quality of Service (QoS)

By default, subscriptions created with the `@MessagePattern()` and `@EventPattern()` decorators use QoS 0. If you need a higher QoS, set it globally with the `subscribeOptions` block when establishing the connection:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
    subscribeOptions: {
      qos: 2
    },
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
    subscribeOptions: {
      qos: 2
    },
  },
});
```

#### Per-pattern QoS

You can override the subscription QoS for an individual pattern by passing a `qos` property in the extras object, the second argument of the `@MessagePattern()` or `@EventPattern()` decorator. Patterns without their own `qos` use the global `subscribeOptions.qos` value.

```typescript
@@filename()
@EventPattern('critical-events', { qos: 2 })
handleCriticalEvent(@Payload() data: any) {
  // This subscription uses QoS 2
}

@EventPattern('metrics', { qos: 0 })
handleMetrics(@Payload() data: any) {
  // This subscription uses QoS 0
}
@@switch
@Bind(Payload())
@EventPattern('critical-events', { qos: 2 })
handleCriticalEvent(data) {
  // This subscription uses QoS 2
}

@Bind(Payload())
@EventPattern('metrics', { qos: 0 })
handleMetrics(data) {
  // This subscription uses QoS 0
}
```

#### Record builders

To configure message options (adjust the QoS level, set the Retain or DUP flags, or add properties to the payload), use the `MqttRecordBuilder` class. For example, the following record sets QoS to `1` with the `setQoS()` method and adds a user property with the `setProperties()` method:

```typescript
const userProperties = { 'x-version': '1.0.0' };
const record = new MqttRecordBuilder(':cat:')
  .setProperties({ userProperties })
  .setQoS(1)
  .build();
client.send('replace-emoji', record).subscribe(...);
```

> info **Hint** The `MqttRecordBuilder` class is exported from the `@nestjs/microservices` package.

On the server side, you can read these options through the `MqttContext`:

```typescript
@@filename()
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: MqttContext): string {
  const { properties: { userProperties } } = context.getPacket();
  return userProperties['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const { properties: { userProperties } } = context.getPacket();
  return userProperties['x-version'] === '1.0.0' ? '🐱' : '🐈';
}
```

To configure user properties for all requests sent by a client, pass them as options to the `ClientProxyFactory`:

```typescript
import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: 'API_v1',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.MQTT,
          options: {
            url: 'mqtt://localhost:1883',
            userProperties: { 'x-version': '1.0.0' },
          },
        }),
    },
  ],
})
export class ApiModule {}
```

#### Instance status updates

To get real-time updates on the connection and the state of the underlying driver instance, subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For the MQTT driver, the `status` stream emits `connected`, `disconnected`, `reconnecting`, and `closed` events.

```typescript
this.client.status.subscribe((status: MqttStatus) => {
  console.log(status);
});
```

> info **Hint** The `MqttStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: MqttStatus) => {
  console.log(status);
});
```

#### Listening to MQTT events

In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the `error` event to trigger additional operations when an error occurs. To do this, use the `on()` method, as shown below:

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

Similarly, you can listen to the server's internal events:

```typescript
server.on<MqttEvents>('error', (err) => {
  console.error(err);
});
```

> info **Hint** The `MqttEvents` type is imported from the `@nestjs/microservices` package.

#### Underlying driver access

For more advanced use cases, you may need to access the underlying driver instance, for example, to close the connection manually or to use driver-specific methods. In most cases, however, you **shouldn't need** to access the driver directly.

To do so, use the `unwrap()` method, which returns the underlying driver instance. The generic type parameter specifies the type of driver instance you expect.

```typescript
const mqttClient = this.client.unwrap<import('mqtt').MqttClient>();
```

Similarly, you can access the server's underlying driver instance:

```typescript
const mqttClient = server.unwrap<import('mqtt').MqttClient>();
```
