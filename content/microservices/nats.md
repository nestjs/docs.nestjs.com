### NATS

[NATS](https://nats.io) is a simple, secure and high performance open source messaging system for cloud native applications, IoT messaging, and microservices architectures. The NATS server is written in the Go programming language, but client libraries to interact with the server are available for dozens of major programming languages. NATS supports both At Most Once and At Least Once Delivery. It can run anywhere, from large servers and cloud instances, through edge gateways and even Internet of Things devices.

#### Installation

To start building NATS-based microservices, first install the required package:

```bash
$ npm i --save nats
```

#### Overview

To use the NATS transporter, pass the following options object to the `createMicroservice()` method:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.NATS,
  options: {
    url: 'nats://localhost:4222',
  },
});
```

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

Likewise, to create a client instance, we need to pass an options object with the same properties we saw above in the `createMicroservice()` method.

```typescript
ClientsModule.register([
  {
    name: 'MATH_SERVICE',
    transport: Transport.NATS,
    options: {
      url: 'nats://localhost:4222',
    }
  },
]),
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them [here](https://docs.nestjs.com/microservices/basics#client).

#### Options

The `options` object is specific to the chosen transporter. The <strong>NATS</strong> transporter exposes the properties described [here](https://github.com/nats-io/node-nats#connect-options).
Additionally, there is an extra `queue` property which allows you specifying a name of the queue that your server should subscribe to (leave `undefined` to ignore this setting).

#### Request-response

For the **request-response message style** ([read more](https://docs.nestjs.com/microservices/basics#request-response)), NATS transporter uses [Request-Reply](https://docs.nats.io/nats-concepts/reqreply) mechanism provided out-of-the-box. request is published on a given subject with a reply subject, and responders listen on that subject and send responses to the reply subject. Reply subjects are usually a subject called an `_INBOX` that will be directed back to the requestor dynamically, regardless of location of either party.

#### Event-based

For the **event-based message style** ([read more](https://docs.nestjs.com/microservices/basics#event-based)), NATS transporter uses [Publish-Subscribe](https://docs.nats.io/nats-concepts/pubsub) mechanism provided out-of-the-box. A publisher sends a message on a subject and any active subscriber listening on that subject receives the message. Subscribers can also register interest in wildcard subjects that work a bit like a regular expression (but only a bit). This one-to-many pattern is sometimes called fan-out.

#### Queue groups

NATS provides a built-in load balancing feature called [distributed queues](https://docs.nats.io/nats-concepts/queue). To create a queue subscription, use the `queue` property as follows:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.NATS,
  options: {
    url: 'nats://localhost:4222',
    queue: 'cats_queue',
  },
});
```

#### Context

In more sophisticated scenarios, you may want to access more information about the incoming request. In NATS, you can access the `NatsContext` object.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Subject: ${context.getSubject()}`);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `NatsContext` are imported from the `@nestjs/microservices`.
