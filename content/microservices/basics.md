### Basics

Nest microservice is a type of application that uses a different **transport** layer than HTTP.

<figure><img src="/assets/Microservices_1.png" /></figure>

#### Installation

Firstly, we need to install the required package:

```bash
$ npm i --save @nestjs/microservices
```

#### Overview

Generally, Nest supports several built-in transporters which responsibility is to transfer messages between different services. Almost every existing transporter supports both **request-response** and **event-based** strategies. In order to make it easy to switch between transporters (without changing a single line of code), the communication logic is hidden behind an abstraction layer. Hence, if at some point you decide to switch to another message broker, the migration process should be fairly easy.

#### Getting started

In order to create a microservice, we use the `createMicroservice()` method of the `NestFactory` class.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(ApplicationModule, {
    transport: Transport.TCP,
  });
  app.listen(() => console.log('Microservice is listening'));
}
bootstrap();
```

> info **Hint** All microservices are listening to messages through **TCP** protocol by default.

The second argument of the `createMicroservice()` method is an `options` object. This object may consist of two members:

<table>
  <tr>
    <td><code>transport</code></td>
    <td>Specifies the transporter (for example, <code>Transport.NATS</code>)</td>
  </tr>
  <tr>
    <td><code>options</code></td>
    <td>A transporter-specific options object that determines transporter behaviour</td>
  </tr>
</table>
<p>
  The <code>options</code> object is different depending on chosen transporter. A <strong>TCP</strong> transporter exposes
  few properties described below.
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
    <td>A total amount of connection attempts</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>A connection retrying delay (ms)</td>
  </tr>
</table>

#### Patterns

Microservices recognize both messages and events by patterns. A pattern is a plain value, for example, a literal object or a string. Eventually, every pattern is being serialized so it can be sent over the network along with the data. Hence, the consumer can easily associate the incoming message with the corresponding handler.

#### Request-response

The request-response communication mechanism is useful when you have to **exchange** messages among various, external services. Additionally, with this paradigm, you can be certain that the service has actually received the message (without the built-in ACKs feature). However, the request-response paradigm doesn't make too much sense with streaming platforms supplied with log based persistence, such as [Kafka](https://docs.confluent.io/3.0.0/streams/) or [NATS streaming](https://github.com/nats-io/node-nats-streaming) as they are designed to solve a different range of issues.

In order to enable services to exchange data over the network, Nest creates two channels in which one is responsible for transferring the data while the other is waiting for the incoming response. It's not always the case though. For instance, platforms such as [NATS](https://nats.io/) provide this feature out-of-the-box and therefore, we don't have to do it manually.

Basically, to create a message handler (based on the request-response paradigm), we use the `@MessagePattern()` decorator which is imported from the `@nestjs/microservices` package.

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

The `accumulate()` handler is listening to messages that fulfil the `cmd: 'sum'` pattern. The pattern handler takes a single argument, the `data` passed from the client. In this case, the data is an array of numbers which has to be accumulated.

#### Asynchronous responses

Each message handler is able to respond either synchronously or **asynchronously**. Hence, `async` methods are supported.

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

Additionally, we are able to return an `Observable`, and thus the values will be emitted until the stream is completed.

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

Above message handler will respond **3 times** (with each item from the array).

#### Event-based

While the request-response method is great when you have to constantly exchange messages between services, it brings too much unnecessary overhead that is useless when you just want to publish **events** (without waiting for a response). For instance, you would like to simply notify another service that a certain situation has happened in this part of the system. Thus, we provide a support for event-based communication as well.

In order to create an event handler, we use the `@EventPattern()` decorator which is imported from the `@nestjs/microservices` package.

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

The `handleUserCreated()` method is listening to `user_created` event. The event handler takes a single argument, the `data` passed from the client (in this case, an event payload which has been sent over the network).

#### Decorators

In more sophisticated scenarios, you may want to read more information about the incoming request. For example, in case of NATS and wilcard subscriptions, you may want to get the original subject that producer has sent message to. Likewise, in Kafka you may want to access the message headers. In order to accomplish that, you can use built-in decorators as follows:

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

> info **Hint** `@Payload()`, `@Ctx()` and `NatsContext` are exported from `@nestjs/microservices`.

#### Client

In order to either exchange messages or publish events to the Nest microservice, we use the `ClientProxy` class which instance can be created in several ways. Firstly, we can import the `ClientsModule` which exposes the static `register()` method. This method takes an array as a parameter in which every element has a `name` (which is a sort of the microservice identifier) as well as microservice-specific options (it's the same object as this one passed in to the `createMicroservice()` method).

```typescript
ClientsModule.register([
  { name: 'MATH_SERVICE', transport: Transport.TCP },
]),
```

> info **Hint** The `ClientsModule` is imported from the `@nestjs/microservices` package.

Once the module has been imported, we can inject `MATH_SERVICE` using the `@Inject()` decorator.

```typescript

constructor(
  @Inject('MATH_SERVICE') private readonly client: ClientProxy,
) {}

```

> info **Hint** The `ClientProxy` class is imported from the `@nestjs/microservices` package.

Nonetheless, this approach doesn't allow us to asynchronously fetch the microservice configuration. In this case, we can directly leverage `ClientProxyFactory` to register a [custom provider](/techniques/custom-providers) (which is a client instance):

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

The last feasible solution is to use the `@Client()` property decorator.

```typescript
@Client({ transport: Transport.TCP })
client: ClientProxy;
```

> info **Hint** The `@Client()` is imported from the `@nestjs/microservices` package.

However, using decorator is not a recommended way (hard to test, tough to share client instance).

The `ClientProxy` is **lazy**. It doesn't initiate a connection immediately. Instead, it will be established before the first microservice call, and then reused across each subsequent call. However, if you want to delay an application bootstrapping process and manually initialize a connection, you can use a `connect()` method inside the `OnModuleInit` lifecycle hook.

```typescript
@@filename()
async onModuleInit() {
  await this.client.connect();
}
```

If the connection cannot be created, the `connect()` method will reject with the corresponding error object.

#### Sending messages

The `ClientProxy` exposes a `send()` method. This method is intended to call the microservice and returns the `Observable` with its response. Consequently, we can subscribe to the emitted values easily.

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

The `send()` method takes two arguments, `pattern` and `payload`. The `pattern` has to be equal to this one defined in the `@MessagePattern()` decorator while `payload` is a message that we want to transmit to another microservice. Also, this method returns a cold `Observable`, which means that you have to explicitly subscribe to a stream in order to begin the process of transferring the message.

#### Publishing events

Another available method is `emit()`. This method responsibility is to publish an event to the message broker.

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

The `emit()` method takes two arguments, `pattern` and `payload`. The `pattern` has to be equal to this one defined in the `@EventPattern()` decorator while `payload` is an event payload that we want to transmit to another microservice. Also, this method returns a hot `Observable` (in opposite to a cold `Observable` returned by `send()`), which means that you don't have to explicitly subscribe to a stream and the proxy will immediately try to deliver an event.

#### Scopes

For people coming from different programming language backgrounds, it might be unexpected to learn that in Nest, almost everything is shared across incoming requests. We have a connection pool to the database, singleton services with global state, etc. Remember that Node.js doesn't follow the request/response Multi-Threaded Stateless Model in which every request is processed by a separate thread. Hence, using singleton instances is fully **safe** for our applications.

However, there are edge-cases when request-based lifetime of the controller may be the desired behavior, for instance per-request caching in GraphQL applications, request tracking or multi-tenancy. Learn how to control scopes [here](/fundamentals/injection-scopes).

Every request-scoped controller and provider can inject `RequestContext` using `@Inject()` decorator in combination with `CONTEXT` token:

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT, RequestContext } from '@nestjs/microservices';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private readonly ctx: RequestContext) {}
}
```

`RequestContext` object consist of two properties:

```typescript
export interface RequestContext<T = any> {
  pattern: string | Record<string, any>;
  data: T;
}
```

In which `data` is a value sent through the network (from producer to consumer), whereas `pattern` is a pattern used to identify an appropriate handler to handle the incoming message.
