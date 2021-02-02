### Google Cloud Pub/Sub

[Pub/Sub](https://cloud.google.com/pubsub) is an asynchronous messaging service that decouples services that produce events from services that process events.

You can use Pub/Sub as messaging-oriented middleware or event ingestion and delivery for streaming analytics pipelines.

Pub/Sub offers durable message storage and real-time message delivery with high availability and consistent performance at scale

#### Installation

To start building Pub/Sub-based microservices, first install the required packages:

```bash
$ npm i --save @google-cloud/pubsub
```

#### Overview

To use the Pub/Sub transporter, pass the following options object to the `createMicroservice()` method:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(ApplicationModule, {
  transport: Transport.GC_PUBSUB,
  options: {
    topic: 'cats_topic',
    subscription: 'cats_subscription',
    client: {
      projectId: 'microservice',
    },
  },
});
@@switch
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.GC_PUBSUB,
  options: {
    topic: 'cats_topic',
    subscription: 'cats_subscription',
    client: {
      projectId: 'microservice',
    },
  },
});
```

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

#### Options

The `options` property is specific to the chosen transporter. The <strong>GCloud Pub/Sub</strong> transporter exposes the properties described below.

<table>
  <tr>
    <td><code>topic</code></td>
    <td>Topic name which your server subscription will belong to</td>
  </tr>  
  <tr>
    <td><code>subscription</code></td>
    <td>Subscription name which your server will listen to</td>
  </tr>
  <tr>
    <td><code>replyTopic</code></td>
    <td>Topic name which your client subscription will belong to</td>
  </tr>
  <tr>
    <td><code>replySubscription</code></td>
    <td>Subscription name which your client will listen to</td>
  </tr>
  <tr>
    <td><code>noAck</code></td>
    <td>If <code>false</code>, manual acknowledgment mode enabled</td>
  </tr>
  <tr>
    <td><code>client</code></td>
    <td>Additional client options (read more <a href="https://googleapis.dev/nodejs/pubsub/latest/global.html#ClientConfig" rel="nofollow" target="_blank">here</a>)</td>
  </tr>
  <tr>
    <td><code>publisher</code></td>
    <td>Additional topic publisher options (read more <a href="https://googleapis.dev/nodejs/pubsub/latest/global.html#PublishOptions" rel="nofollow" target="_blank">here</a>)</td>
  </tr>
  <tr>
    <td><code>subscriber</code></td>
    <td>Additional subscriber options (read more <a href="https://googleapis.dev/nodejs/pubsub/latest/global.html#SubscriberOptions" rel="nofollow" target="_blank">here</a>)</td>
  </tr>
</table>

#### Client

Like other microservice transporters, you have <a href="https://docs.nestjs.com/microservices/basics#client">several options</a> for creating a Google Cloud Pub/Sub `ClientProxy` instance.

One method for creating an instance is to use the `ClientsModule`. To create a client instance with the `ClientsModule`, import it and use the `register()` method to pass an options object with the same properties shown above in the `createMicroservice()` method, as well as a `name` property to be used as the injection token. Read more about `ClientsModule` <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.GC_PUBSUB,
        options: {
          replyTopic: 'cats_topic_reply',
          replySubscription: 'cats_subscription_reply',
          client: {
            projectId: 'microservice',
          },
        },
      },
    ]),
  ]
  ...
})
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

#### Context

In more sophisticated scenarios, you may want to access more information about the incoming request. When using the Pub/Sub transporter, you can access the `GCPubSubContext` object.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: GCPubSubContext) {
  console.log(`Pattern: ${context.getPattern()}`);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(`Pattern: ${context.getPattern()}`);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `GCPubSubContext` are imported from the `@nestjs/microservices` package.

To access the original Pub/Sub message (with the `attributes`, `data`, `ack` and `nack`), use the `getMessage()` method of the `GCPubSubContext` object, as follows:

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: GCPubSubContext) {
  console.log(context.getMessage());
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getMessage());
}
```

#### Message acknowledgement

To make sure a message is never lost, Pub/Sub supports [message acknowledgements](https://cloud.google.com/pubsub/docs/subscriber#at-least-once-delivery). An acknowledgement is sent back by the consumer to tell Pub/Sub that a particular message has been received, processed and that Pub/Sub is free to delete it. If a consumer dies (its subscription is closed, connection is closed, or TCP connection is lost) without sending an ack, Pub/Sub will understand that a message wasn't processed fully and will re-deliver it.

To enable manual acknowledgment mode, set the `noAck` property to `false`:

```typescript
options: {
  replyTopic: 'cats_topic_reply',
  replySubscription: 'cats_subscription_reply',
  noAck: false,
  client: {
    projectId: 'microservice',
  },
},
```

When manual consumer acknowledgements are turned on, we must send a proper acknowledgement from the worker to signal that we are done with a task.

```typescript
@@filename()
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: GCPubSubContext) {
  const originalMsg = context.getMessage();

  originalMsg.ack();
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  const originalMsg = context.getMessage();

  originalMsg.ack();
}
```
