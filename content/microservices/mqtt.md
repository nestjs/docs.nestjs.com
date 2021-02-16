### MQTT

[MQTT](https://mqtt.org/) (Message Queuing Telemetry Transport) is an open source, lightweight messaging protocol, optimized for high-latency. This protocol provides a scalable and cost-efficient way to connect devices using a **publish/subscribe** model. A communication system built on MQTT consists of the publishing server, a broker and one or more clients. It is designed for constrained devices and low-bandwidth, high-latency or unreliable networks.

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

The `options` object is specific to the chosen transporter. The <strong>MQTT</strong> transporter exposes the properties described [here](https://github.com/mqttjs/MQTT.js/#mqttclientstreambuilder-options).

#### Client

Like other microservice transporters, you have <a href="https://docs.nestjs.com/microservices/basics#client">several options</a> for creating a MQTT `ClientProxy` instance.

One method for creating an instance is to use use the `ClientsModule`. To create a client instance with the `ClientsModule`, import it and use the `register()` method to pass an options object with the same properties shown above in the `createMicroservice()` method, as well as a `name` property to be used as the injection token. Read more about `ClientsModule` <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

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

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

#### Context

In more sophisticated scenarios, you may want to access more information about the incoming request. When using the MQTT transporter, you can access the `MqttContext` object.

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

To access the original mqtt [packet](https://github.com/mqttjs/mqtt-packet), use the `getPacket()` method of the `MqttContext` object, as follows:

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

A subscription may be to an explicit topic, or it may include wildcards. Two wildcards are available, `+` and `#`. `+` is a single-level wildcard, while `#` is a multi-level wildcard which covers many topic levels.

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
