### Overview

In addition to traditional (sometimes called monolithic) application architectures, Nest natively supports the microservice architectural style of development. Most of the concepts discussed elsewhere in this documentation, such as dependency injection, decorators, exception filters, pipes, guards and interceptors, apply equally to microservices. Wherever possible, Nest abstracts implementation details so that the same components can run across HTTP-based platforms, WebSockets, and Microservices. This section covers the aspects of Nest that are specific to microservices.

In Nest, a microservice is fundamentally an application that uses a different **transport** layer than HTTP.

<figure><img src="/assets/Microservices_1.png" /></figure>

Nest supports several built-in transport layer implementations, called **transporters**, which are responsible for transmitting messages between different microservice instances. Most transporters natively support both **request-response** and **event-based** message styles. Nest abstracts the implementation details of each transporter behind a canonical interface for both request-response and event-based messaging. This makes it easy to switch from one transport layer to another -- for example to leverage the specific reliability or performance features of a particular transport layer -- without impacting your application code.

#### Installation

To start building microservices, first install the required package:

```bash
$ npm i --save @nestjs/microservices
```

#### Getting started

There are two options to instantiate a microservice

- Create a microservice-only-server
- Attach a microservice to an express / fastify adapter

To create a microservice-only-server, use the `createMicroservice()` method of the `NestFactory` class:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
  });
  app.listen(() => console.log('Microservice is listening'));
}
bootstrap();
```

To connect a microservice to an existing server, use the `connectMicroservice()` method of the `NestFactory` class and start the connected Microservices with `startAllMicroservices()`:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.TCP,
  })

  app.startAllMicroservices(() => console.log('Microservices are listening'))

  app.listen(() => console.log('Server is listening'));
}
bootstrap();
```

> info **Hint** Microservices use the **TCP** transport layer by default.

The second argument of the `createMicroservice()` method is an `options` object. This object may consist of two members:

<table>
  <tr>
    <td><code>transport</code></td>
    <td>Specifies the transporter (for example, <code>Transport.NATS</code>)</td>
  </tr>
  <tr>
    <td><code>options</code></td>
    <td>A transporter-specific options object that determines transporter behavior</td>
  </tr>
</table>
<p>
  The <code>options</code> object is specific to the chosen transporter. The <strong>TCP</strong> transporter exposes
  the properties described below.  For other transporters (e.g, Redis, MQTT, etc.), see the relevant chapter for a description of the available options.
</p>
<table>
  <tr>
    <td><code>host</code></td>
    <td>Connection hostname</td>
  </tr>
  <tr>
    <td><code>port</code></td>
    <td>Connection port</td>
  </tr>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Number of times to retry message</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Delay between message retry attempts (ms)</td>
  </tr>
</table>

#### Patterns

Microservices recognize both messages and events by **patterns**. A pattern is a plain value, for example, a literal object or a string. Patterns are automatically serialized and sent over the network along with the data portion of a message. In this way, message senders and consumers can coordinate which requests are consumed by which handlers.

#### Request-response

The request-response message style is useful when you need to **exchange** messages between various external services. With this paradigm, you can be certain that the service has actually received the message (without the need to manually implement a message ACK protocol). However, the request-response paradigm is not always the best choice. For example, streaming transporters that use log-based persistence, such as [Kafka](https://docs.confluent.io/3.0.0/streams/) or [NATS streaming](https://github.com/nats-io/node-nats-streaming), are optimized for solving a different range of issues, more aligned with an event messaging paradigm (see [event-based messaging](https://docs.nestjs.com/microservices/basics#event-based) below for more details).

To enable the request-response message type, Nest creates two logical channels - one is responsible for transferring the data while the other waits for incoming responses. For some underlying transports, such as [NATS](https://nats.io/), this dual-channel support is provided out-of-the-box. For others, Nest compensates by manually creating separate channels. There can be overhead for this, so if you do not require a request-response message style, you should consider using the event-based method.

To create a message handler based on the request-response paradigm use the `@MessagePattern()` decorator, which is imported from the `@nestjs/microservices` package.

```typescript
@@filename(math.controller)
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  accumulate(data: number[]): number {
    return (data || []).reduce((a, b) => a + b);
  }
}
@@switch
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  accumulate(data) {
    return (data || []).reduce((a, b) => a + b);
  }
}
```

In the above code, the `accumulate()` **message handler** listens for messages that fulfill the `cmd: 'sum'` pattern. The message handler takes a single argument, the `data` passed from the client. In this case, the data is an array of numbers which are to be accumulated.

#### Asynchronous responses

Message handlers are able to respond either synchronously or **asynchronously**. Hence, `async` methods are supported.

```typescript
@@filename()
@MessagePattern({ cmd: 'sum' })
async accumulate(data: number[]): Promise<number> {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@MessagePattern({ cmd: 'sum' })
async accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```

A message handler is also able to return an `Observable`, in which case the result values will be emitted until the stream is completed.

```typescript
@@filename()
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}
@@switch
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}
```

In the example above, the message handler will respond **3 times** (with each item from the array).

#### Event-based

While the request-response method is ideal for exchanging messages between services, it is less suitable when your message style is event-based - when you just want to publish **events** without waiting for a response. In that case, you do not want the overhead required by request-response for maintaining two channels.

Suppose you would like to simply notify another service that a certain condition has occurred in this part of the system. This is the ideal use case for the event-based message style.

To create an event handler, we use the `@EventPattern()` decorator, which is imported from the `@nestjs/microservices` package.

```typescript
@@filename()
@EventPattern('user_created')
async handleUserCreated(data: Record<string, unknown>) {
  // business logic
}
@@switch
@EventPattern('user_created')
async handleUserCreated(data) {
  // business logic
}
```

The `handleUserCreated()` **event handler** listens for the `user_created` event. The event handler takes a single argument, the `data` passed from the client (in this case, an event payload which has been sent over the network).

#### Decorators

In more sophisticated scenarios, you may want to access more information about the incoming request. For example, in the case of NATS with wildcard subscriptions, you may want to get the original subject that the producer has sent the message to. Likewise, in Kafka you may want to access the message headers. In order to accomplish that, you can use built-in decorators as follows:

```typescript
@@filename()
@MessagePattern('time.us.*')
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*')
getDate(data, context) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
```

> info **Hint** `@Payload()`, `@Ctx()` and `NatsContext` are imported from `@nestjs/microservices`.

#### Client

A client Nest application can exchange messages or publish events to a Nest microservice using the `ClientProxy` class. This class defines several methods, such as `send()` (for request-response messaging) and `emit()` (for event-driven messaging) that let you communicate with a remote microservice. Obtain an instance of this class in one of the following ways.

One technique is to import the `ClientsModule`, which exposes the static `register()` method. This method takes an argument which is an array of objects representing microservices. Each such object has a `name` property as well as a microservice-specific options object.

The `name` property serves as an **injection token** that can be used to inject an instance of a `ClientProxy` where needed. The value of the `name` property, as an injection token, can be an arbitrary string or JavaScript symbol, as described [here](https://docs.nestjs.com/fundamentals/custom-providers#non-class-based-provider-tokens).

The options object has the same properties we saw in the `createMicroservice()` method earlier.

```typescript
ClientsModule.register([
  { name: 'MATH_SERVICE', transport: Transport.TCP },
]),
```

Once the module has been imported, we can inject `'MATH_SERVICE'` using the `@Inject()` decorator.

```typescript
constructor(
  @Inject('MATH_SERVICE') private readonly client: ClientProxy,
) {}
```

> info **Hint** The `ClientsModule` and `ClientProxy` classes are imported from the `@nestjs/microservices` package.

As is sometimes the case, we may need to fetch the microservice configuration from another service (say a `ConfigService`), rather than hard-coding it in our client application. To do this, we can use the `ClientProxyFactory` class to register a [custom provider](/techniques/custom-providers) (which provides a `ClientProxy` instance):

```typescript
{
  provide: 'MATH_SERVICE',
  useFactory: (configService: ConfigService) => {
    const mathSvcOptions = configService.getMathSvcOptions();
    return ClientProxyFactory.create(mathSvcOptions);
  },
  inject: [ConfigService],
}
```

> info **Hint** The `ClientProxyFactory` is imported from the `@nestjs/microservices` package.

Another option is to use the `@Client()` property decorator.

```typescript
@Client({ transport: Transport.TCP })
client: ClientProxy;
```

> info **Hint** The `@Client()` decorator is imported from the `@nestjs/microservices` package.

Using the `@Client()` decorator is not the preferred technique, as it is harder to test and harder to share a client instance.

The `ClientProxy` is **lazy**. It doesn't initiate a connection immediately. Instead, it will be established before the first microservice call, and then reused across each subsequent call. However, if you want to delay the application bootstrapping process until a connection is established, you can manually initiate a connection using the `ClientProxy` object's `connect()` method inside the `OnApplicationBootstrap` lifecycle hook.

```typescript
@@filename()
async onApplicationBootstrap() {
  await this.client.connect();
}
```

If the connection cannot be created, the `connect()` method will reject with the corresponding error object.

#### Sending messages

The `ClientProxy` exposes a `send()` method. This method is intended to call the microservice and returns an `Observable` with its response. Thus, we can subscribe to the emitted values easily.

```typescript
@@filename()
accumulate(): Observable<number> {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send<number>(pattern, payload);
}
@@switch
accumulate() {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send(pattern, payload);
}
```

The `send()` method takes two arguments, `pattern` and `payload`. The `pattern` should match the one defined in a `@MessagePattern()` decorator. The `payload` is a message that we want to transmit to the remote microservice. This method returns a **cold `Observable`**, which means that you have to explicitly subscribe to it before the message will be sent.

#### Publishing events

To send an event, use the `ClientProxy` object's `emit()` method. This method publishes an event to the message broker.

```typescript
@@filename()
async publish() {
  this.client.emit<number>('user_created', new UserCreatedEvent());
}
@@switch
async publish() {
  this.client.emit('user_created', new UserCreatedEvent());
}
```

The `emit()` method takes two arguments, `pattern` and `payload`. The `pattern`should match the one defined in an `@EventPattern()` decorator. The `payload` is an event payload that we want to transmit to the remote microservice. This method returns a **hot `Observable`** (unlike the cold `Observable` returned by `send()`), which means that whether or not you explicitly subscribe to the observable, the proxy will immediately try to deliver the event.

#### Scopes

For people coming from different programming language backgrounds, it might be unexpected to learn that in Nest, almost everything is shared across incoming requests. We have a connection pool to the database, singleton services with global state, etc. Remember that Node.js doesn't follow the request/response Multi-Threaded Stateless Model in which every request is processed by a separate thread. Hence, using singleton instances is fully **safe** for our applications.

However, there are edge-cases when request-based lifetime of the handler may be the desired behavior, for instance per-request caching in GraphQL applications, request tracking or multi-tenancy. Learn how to control scopes [here](/fundamentals/injection-scopes).

Request-scoped handlers and providers can inject `RequestContext` using the `@Inject()` decorator in combination with `CONTEXT` token:

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT, RequestContext } from '@nestjs/microservices';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private readonly ctx: RequestContext) {}
}
```

This provides access to the `RequestContext` object, which has two properties:

```typescript
export interface RequestContext<T = any> {
  pattern: string | Record<string, any>;
  data: T;
}
```

The `data` property is the message payload sent by the message producer. The `pattern` property is the pattern used to identify an appropriate handler to handle the incoming message.
