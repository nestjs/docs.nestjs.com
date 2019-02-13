### Basics

The Nest microservice is a type of application that uses a different **transport** layer than HTTP.

<figure><img src="/assets/Microservices_1.png" /></figure>

#### Installation

Firstly, we need to install the required package:

```bash
$ npm i --save @nestjs/microservices
```

#### Overview

In general, Nest supports a bunch of built-in transporters. They are based on **request-response** paradigm and a whole communication logic is hidden behind an abstraction layer. Thanks to that you can easily switch between transporters without changing any line of your code. We don't support streaming platforms with log based persistence, such as [Kafka](https://docs.confluent.io/3.0.0/streams/) or [NATS streaming](https://github.com/nats-io/node-nats-streaming) because they have been created to solve a different range of issues. However, you can still use them with Nest by making use of [execution context](/execution-context) feature.

In order to create a microservice, we use `createMicroservice()` method of the `NestFactory` class. By default, a microservice listens on messages via **TCP protocol**.

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

The second argument of the `createMicroservice()` method is an options object. This object may have two members:

<table>
  <tr>
    <td><code>transport</code></td>
    <td>Specifies the transporter</td>
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

A microservice recognizes messages through **patterns**. The pattern is a plain value, for example, a literal object, string, or a symbol. In order to create a pattern handler, we use the `@MessagePattern()` decorator which is imported from the `@nestjs/microservices` package.

```typescript
@@filename(math.controller)
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  sum(data: number[]): number {
    return (data || []).reduce((a, b) => a + b);
  }
}
@@switch

import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  sum(data) {
    return (data || []).reduce((a, b) => a + b);
  }
}
```

The `sum()` handler is listening to messages that fulfil the `cmd: 'sum'` pattern. The pattern handler takes a single argument, the `data` passed from the client. In this case, the data is an array of numbers which has to be accumulated.

#### Asynchronous responses

Each pattern handler is able to respond either synchronously or **asynchronously**. Hence, `async` methods are supported.

```typescript
@@filename()
@MessagePattern({ cmd: 'sum' })
async sum(data: number[]): Promise<number> {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@MessagePattern({ cmd: 'sum' })
async sum(data) {
  return (data || []).reduce((a, b) => a + b);
}
```

Additionally, we are able to return the [Rx](https://github.com/reactivex/rxjs) `Observable`, and thus the values will be emitted until the stream is completed.

```typescript
@@filename()
@MessagePattern({ cmd: 'sum' })
sum(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}
@@switch
@MessagePattern({ cmd: 'sum' })
sum(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}
```

Above message handler will respond **3 times** (with each item from the array).

#### Client

In order to connect with the Nest microservice, we are using the `ClientProxy` class which instance is assigned to a property through `@Client()` decorator. This decorator takes a single argument. It is the same object as a Nest microservice options object.

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

The `ClientProxy` is **lazy**. It doesn't initiate a connection immediately. Instead, it will be established before the first microservice call, and then reused across each subsequent call. However, if you want to delay an application's bootstrapping process and manually initialize a connection, you can use a `connect()` method inside the `OnModuleInit` lifecycle hook.

```typescript
async onModuleInit() {
  await this.client.connect();
}
```

If the connection cannot be created, the `connect()` method will reject with the corresponding error object.

The `ClientProxy` exposes a `send()` method. This method is intended to call the microservice and returns the `Observable` with its response, meaning, we can subscribe to the emitted values easily.

```typescript
@@filename()
@Get()
call(): Observable<number> {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send<number>(pattern, payload);
}
@@switch
@Get()
call() {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send(pattern, payload);
}
```

The `send()` method takes 2 arguments, `pattern` and `payload`. The `pattern` has to be equal to this one defined in the `@MessagePattern()` decorator, while `payload` is a message that we want to transmit to another microservice.
