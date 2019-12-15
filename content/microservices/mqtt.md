### MQTT

[MQTT](http://mqtt.org/) (Message Queuing Telemetry Transport) is an open source, lightweight messaging protocol, optimized for high-latency. This protocol provides a scalable and cost-efficient way to connect devices using a **publish/subscribe** model. A communication system built on MQTT consists of the publishing server, a broker and one or more clients. It is designed for constrained devices and low-bandwidth, high-latency or unreliable networks.

#### Installation

To start building MQTT-based microservices, first install the required package:

```bash
$ npm i --save mqtt
```

#### Overview

To use the MQTT transporter, pass the following options object to the `createMicroservice()` method:

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

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

Likewise, to create a client instance, we need to pass an options object with the same properties we saw above in the `createMicroservice()` method.

```typescript
ClientsModule.register([
  {
    name: 'MATH_SERVICE',
    transport: Transport.MQTT,
    options: {
      host: 'localhost',
      port: 1883,
    }
  },
]),
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them [here](https://docs.nestjs.com/microservices/basics#client).

#### Context

In more sophisticated scenarios, you may want to access more information about the incoming request. In MQTT, you can access the `MqttContext` object.

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

> info **Hint** `@Payload()`, `@Ctx()` and `MqttContext` are imported from `@nestjs/microservices`.

In addition, if you want to access the original mqtt [packet](https://github.com/mqttjs/mqtt-packet), use the `getPacket()` method of the `MqttContext` object, as follows:

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

#### Options

The `options` object is specific to the chosen transporter. The <strong>MQTT</strong> transporter exposes the properties described [here](https://github.com/mqttjs/MQTT.js/#mqttclientstreambuilder-options).
