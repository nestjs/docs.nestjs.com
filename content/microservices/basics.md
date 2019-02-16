### Basics

Nest microservice is a type of application that uses a different **transport** layer than HTTP.

<figure><img src="/assets/Microservices_1.png" /></figure>

#### Installation

Firstly, we need to install the required package:

```bash
$ npm i --save @nestjs/microservices
```

#### Overview

In general, Nest supports several built-in transporters. They are based on the **request-response** and **event-based** paradigms, and a whole communication logic is hidden behind an abstraction layer. This makes it easy to switch between transporters without changing the line of code. However, the request-response paradigm doesn't make too much sense with streaming platforms supplied with log based persistence, such as [Kafka](https://docs.confluent.io/3.0.0/streams/) or [NATS streaming](https://github.com/nats-io/node-nats-streaming) as they are designed to solve a different range of issues. Nonetheless, they can still be used with either **event-based** (unidirectional) communication or [application context](/application-context) feature.

#### Getting started

In order to create a microservice, we use `createMicroservice()` method of the `NestFactory` class.

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

> info **Hint** A microservice is listening to messages through **TCP** protocol by default.

A second argument of the `createMicroservice()` method is an options object. This object may have two members:

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

Microservices recognize both messages and events through patterns. A pattern is a plain value, for example, a literal object or a string. Eventually, every pattern is being serialized, so it can be sent over the network along with the data. Hence, the receiver can easily associate the incoming message with the corresponding handler.

#### Request-response

The request-response communication mechanism is useful when you have to **exchange** messages among various, external services. Additionally, with this paradigm, you can be sure that the service has actually received the message.

In order to enable services to exchange data over the network, Nest creates two channels in which one is responsible for transferring the data while the other listens to the incoming response. However, it's not always the case. For instance, platforms as [NATS](https://nats.io/) provide such a feature out-of-the-box so we don't have to do it on our own.

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

While the request-response method is great when you have to constantly exchange messages between services, it brings too much unnecessary overhead that is completely useless when you just want to publish **events** (without waiting for a response). For instance, you would like to simply notify another service that a certain situation has happened in this part of the system. Thus, we provide a support for event-based communication as well.

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

#### Client

In order to either exchange messages or publish events to the Nest microservice, we are using the `ClientProxy` class which instance is assigned to a property through `@Client()` decorator. This decorator takes a single argument. It is the same object as a Nest microservice options object (passed in to the `createMicroservice()` method).

```typescript
@Client({ transport: Transport.TCP })
client: ClientProxy;
```

> info **Hint** Both `@Client()` decorator and `ClientProxy` class are imported from the `@nestjs/microservices` package.

Another solution would be to manually create the `ClientProxy` instance using the `ClientProxyFactory` (exported from `@nestjs/microservices` package).

```typescript
constructor() {
  this.client = ClientProxyFactory.create({
    transport: Transport.TCP
  });
}
```

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

The `send()` method takes two arguments, `pattern` and `payload`. The `pattern` has to be equal to this one defined in the `@MessagePattern()` decorator while `payload` is a message that we want to transmit to another microservice.

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

The `emit()` method takes two arguments, `pattern` and `payload`. The `pattern` has to be equal to this one defined in the `@EventPattern()` decorator while `payload` is an event payload that we want to transmit to another microservice.
