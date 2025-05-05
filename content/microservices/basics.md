### Overview

In addition to traditional (sometimes called monolithic) application architectures, Nest natively supports the microservice architectural style of development. Most of the concepts discussed elsewhere in this documentation, such as dependency injection, decorators, exception filters, pipes, guards and interceptors, apply equally to microservices. Wherever possible, Nest abstracts implementation details so that the same components can run across HTTP-based platforms, WebSockets, and Microservices. This section covers the aspects of Nest that are specific to microservices.

In Nest, a microservice is fundamentally an application that uses a different **transport** layer than HTTP.

<figure><img class="illustrative-image" src="/assets/Microservices_1.png" /></figure>

Nest supports several built-in transport layer implementations, called **transporters**, which are responsible for transmitting messages between different microservice instances. Most transporters natively support both **request-response** and **event-based** message styles. Nest abstracts the implementation details of each transporter behind a canonical interface for both request-response and event-based messaging. This makes it easy to switch from one transport layer to another -- for example to leverage the specific reliability or performance features of a particular transport layer -- without impacting your application code.

#### Installation

To start building microservices, first install the required package:

```bash
$ npm i --save @nestjs/microservices
```

#### Getting started

To instantiate a microservice, use the `createMicroservice()` method of the `NestFactory` class:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
  });
  await app.listen();
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
    <td>Number of times to retry message (default: <code>0</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Delay between message retry attempts (ms) (default: <code>0</code>)</td>
  </tr>
  <tr>
    <td><code>serializer</code></td>
    <td>Custom <a href="https://github.com/nestjs/nest/blob/master/packages/microservices/interfaces/serializer.interface.ts" target="_blank">serializer</a> for outgoing messages</td>
  </tr>
  <tr>
    <td><code>deserializer</code></td>
    <td>Custom <a href="https://github.com/nestjs/nest/blob/master/packages/microservices/interfaces/deserializer.interface.ts" target="_blank">deserializer</a> for incoming messages</td>
  </tr>
  <tr>
    <td><code>socketClass</code></td>
    <td>A custom Socket that extends <code>TcpSocket</code> (default: <code>JsonSocket</code>)</td>
  </tr>
  <tr>
    <td><code>tlsOptions</code></td>
    <td>Options to configure the tls protocol</td>
  </tr>
</table>

> info **Hint** The above properties are specific to the TCP transporter. For information on available options for other transporters, refer to the relevant chapter.

#### Message and Event Patterns

Microservices recognize both messages and events by **patterns**. A pattern is a plain value, for example, a literal object or a string. Patterns are automatically serialized and sent over the network along with the data portion of a message. In this way, message senders and consumers can coordinate which requests are consumed by which handlers.

#### Request-response

The request-response message style is useful when you need to **exchange** messages between various external services. This paradigm ensures that the service has actually received the message (without requiring you to manually implement an acknowledgment protocol). However, the request-response approach may not always be the best fit. For example, streaming transporters, such as [Kafka](https://docs.confluent.io/3.0.0/streams/) or [NATS streaming](https://github.com/nats-io/node-nats-streaming), which use log-based persistence, are optimized for addressing a different set of challenges, more aligned with the event messaging paradigm (see [event-based messaging](https://docs.nestjs.com/microservices/basics#event-based) for more details).

To enable the request-response message type, Nest creates two logical channels: one for transferring data and another for waiting for incoming responses. For some underlying transports, like [NATS](https://nats.io/), this dual-channel support is provided out-of-the-box. For others, Nest compensates by manually creating separate channels. While this is effective, it can introduce some overhead. Therefore, if you don’t require a request-response message style, you may want to consider using the event-based method.

To create a message handler based on the request-response paradigm, use the `@MessagePattern()` decorator, which is imported from the `@nestjs/microservices` package. This decorator should only be used within [controller](https://docs.nestjs.com/controllers) classes, as they serve as the entry points for your application. Using it in providers will have no effect, as they will be ignored by the Nest runtime.

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

In the above code, the `accumulate()` **message handler** listens for messages that match the `{{ '{' }} cmd: 'sum' {{ '}' }}` message pattern. The message handler takes a single argument, the `data` passed from the client. In this case, the data is an array of numbers that need to be accumulated.

#### Asynchronous responses

Message handlers can respond either synchronously or **asynchronously**, meaning that `async` methods are supported.

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

A message handler can also return an `Observable`, in which case the result values will be emitted until the stream completes.

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

In the example above, the message handler will respond **three times**, once for each item in the array.

#### Event-based

While the request-response method is perfect for exchanging messages between services, it is less suited for event-based messaging—when you simply want to publish **events** without waiting for a response. In such cases, the overhead of maintaining two channels for request-response is unnecessary.

For example, if you want to notify another service that a specific condition has occurred in this part of the system, the event-based message style is ideal.

To create an event handler, you can use the `@EventPattern()` decorator, which is imported from the `@nestjs/microservices` package.

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

> info **Hint** You can register multiple event handlers for a **single** event pattern, and all of them will be automatically triggered in parallel.

The `handleUserCreated()` **event handler** listens for the `'user_created'` event. The event handler takes a single argument, the `data` passed from the client (in this case, an event payload which has been sent over the network).

<app-banner-enterprise></app-banner-enterprise>

#### Additional request details

In more advanced scenarios, you might need to access additional details about the incoming request. For instance, when using NATS with wildcard subscriptions, you may want to retrieve the original subject that the producer sent the message to. Similarly, with Kafka, you may need to access the message headers. To achieve this, you can leverage built-in decorators as shown below:

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

> info **Hint** You can also pass in a property key to the `@Payload()` decorator to extract a specific property from the incoming payload object, for example, `@Payload('id')`.

#### Client (producer class)

A client Nest application can exchange messages or publish events to a Nest microservice using the `ClientProxy` class. This class provides several methods, such as `send()` (for request-response messaging) and `emit()` (for event-driven messaging), enabling communication with a remote microservice. You can obtain an instance of this class in the following ways:

One approach is to import the `ClientsModule`, which exposes the static `register()` method. This method takes an array of objects representing microservice transporters. Each object must include a `name` property, and optionally a `transport` property (defaulting to `Transport.TCP`), as well as an optional `options` property.

The `name` property acts as an **injection token**, which you can use to inject an instance of `ClientProxy` wherever needed. The value of this `name` property can be any arbitrary string or JavaScript symbol, as described [here](https://docs.nestjs.com/fundamentals/custom-providers#non-class-based-provider-tokens).

The `options` property is an object that includes the same properties we saw in the `createMicroservice()` method earlier.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      { name: 'MATH_SERVICE', transport: Transport.TCP },
    ]),
  ],
})
```

Alternatively, you can use the `registerAsync()` method if you need to provide configuration or perform any other asynchronous processes during the setup.

```typescript
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: 'MATH_SERVICE',
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            url: configService.get('URL'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
})
```

Once the module has been imported, you can inject an instance of the `ClientProxy` configured with the specified options for the `'MATH_SERVICE'` transporter using the `@Inject()` decorator.

```typescript
constructor(
  @Inject('MATH_SERVICE') private client: ClientProxy,
) {}
```

> info **Hint** The `ClientsModule` and `ClientProxy` classes are imported from the `@nestjs/microservices` package.

At times, you may need to fetch the transporter configuration from another service (such as a `ConfigService`), rather than hard-coding it in your client application. To achieve this, you can register a [custom provider](/fundamentals/custom-providers) using the `ClientProxyFactory` class. This class provides a static `create()` method that accepts a transporter options object and returns a customized `ClientProxy` instance.

```typescript
@Module({
  providers: [
    {
      provide: 'MATH_SERVICE',
      useFactory: (configService: ConfigService) => {
        const mathSvcOptions = configService.getMathSvcOptions();
        return ClientProxyFactory.create(mathSvcOptions);
      },
      inject: [ConfigService],
    }
  ]
  ...
})
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

The `send()` method takes two arguments, `pattern` and `payload`. The `pattern` should match one defined in a `@MessagePattern()` decorator. The `payload` is a message that we want to transmit to the remote microservice. This method returns a **cold `Observable`**, which means that you have to explicitly subscribe to it before the message will be sent.

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

The `emit()` method takes two arguments: `pattern` and `payload`. The `pattern` should match one defined in an `@EventPattern()` decorator, while the `payload` represents the event data that you want to transmit to the remote microservice. This method returns a **hot `Observable`** (in contrast to the cold `Observable` returned by `send()`), meaning that regardless of whether you explicitly subscribe to the observable, the proxy will immediately attempt to deliver the event.

<app-banner-devtools></app-banner-devtools>

#### Request-scoping

For those coming from different programming language backgrounds, it may be surprising to learn that in Nest, most things are shared across incoming requests. This includes a connection pool to the database, singleton services with global state, and more. Keep in mind that Node.js does not follow the request/response multi-threaded stateless model, where each request is processed by a separate thread. As a result, using singleton instances is **safe** for our applications.

However, there are edge cases where a request-based lifetime for the handler might be desirable. This could include scenarios like per-request caching in GraphQL applications, request tracking, or multi-tenancy. You can learn more about how to control scopes [here](/fundamentals/injection-scopes).

Request-scoped handlers and providers can inject `RequestContext` using the `@Inject()` decorator in combination with the `CONTEXT` token:

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT, RequestContext } from '@nestjs/microservices';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private ctx: RequestContext) {}
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

#### Instance status updates

To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the `status` stream. This stream provides status updates specific to the chosen driver. For instance, if you’re using the TCP transporter (the default), the `status` stream emits `connected` and `disconnected` events.

```typescript
this.client.status.subscribe((status: TcpStatus) => {
  console.log(status);
});
```

> info **Hint** The `TcpStatus` type is imported from the `@nestjs/microservices` package.

Similarly, you can subscribe to the server's `status` stream to receive notifications about the server's status.

```typescript
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: TcpStatus) => {
  console.log(status);
});
```

#### Listening to internal events

In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the `error` event to trigger additional operations when an error occurs. To do this, use the `on()` method, as shown below:

```typescript
this.client.on('error', (err) => {
  console.error(err);
});
```

Similarly, you can listen to the server's internal events:

```typescript
server.on<TcpEvents>('error', (err) => {
  console.error(err);
});
```

> info **Hint** The `TcpEvents` type is imported from the `@nestjs/microservices` package.

#### Underlying driver access

For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you **shouldn't need** to access the driver directly.

To do so, you can use the `unwrap()` method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect.

```typescript
const netServer = this.client.unwrap<Server>();
```

Here, `Server` is a type imported from the `net` module.

Similarly, you can access the server's underlying driver instance:

```typescript
const netServer = server.unwrap<Server>();
```

#### Handling timeouts

In distributed systems, microservices might sometimes be down or unavailable. To prevent indefinitely long waiting, you can use timeouts. A timeout is a highly useful pattern when communicating with other services. To apply timeouts to your microservice calls, you can use the [RxJS](https://rxjs.dev) `timeout` operator. If the microservice does not respond within the specified time, an exception is thrown, which you can catch and handle appropriately.

To implement this, you'll need to use the [`rxjs`](https://github.com/ReactiveX/rxjs) package. Simply use the `timeout` operator within the pipe:

```typescript
@@filename()
this.client
  .send<TResult, TInput>(pattern, data)
  .pipe(timeout(5000));
@@switch
this.client
  .send(pattern, data)
  .pipe(timeout(5000));
```

> info **Hint** The `timeout` operator is imported from the `rxjs/operators` package.

After 5 seconds, if the microservice isn't responding, it will throw an error.

#### TLS support

When communicating outside of a private network, it’s important to encrypt traffic to ensure security. In NestJS, this can be achieved with TLS over TCP using Node's built-in [TLS](https://nodejs.org/api/tls.html) module. Nest provides built-in support for TLS in its TCP transport, allowing us to encrypt communication between microservices or clients.

To enable TLS for a TCP server, you'll need both a private key and a certificate in PEM format. These are added to the server's options by setting the `tlsOptions` and specifying the key and cert files, as shown below:

```typescript
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const key = fs.readFileSync('<pathToKeyFile>', 'utf8').toString();
  const cert = fs.readFileSync('<pathToCertFile>', 'utf8').toString();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        tlsOptions: {
          key,
          cert,
        },
      },
    },
  );

  await app.listen();
}
bootstrap();
```

For a client to communicate securely over TLS, we also define the `tlsOptions` object but this time with the CA certificate. This is the certificate of the authority that signed the server's certificate. This ensures that the client trusts the server's certificate and can establish a secure connection.

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.TCP,
        options: {
          tlsOptions: {
            ca: [fs.readFileSync('<pathToCaFile>', 'utf-8').toString()],
          },
        },
      },
    ]),
  ],
})
export class AppModule {}
```

You can also pass an array of CAs if your setup involves multiple trusted authorities.

Once everything is set up, you can inject the `ClientProxy` as usual using the `@Inject()` decorator to use the client in your services. This ensures encrypted communication across your NestJS microservices, with Node's `TLS` module handling the encryption details.

For more information, refer to Node’s [TLS documentation](https://nodejs.org/api/tls.html).

#### Dynamic configuration

When a microservice needs to be configured using the `ConfigService` (from the `@nestjs/config` package), but the injection context is only available after the microservice instance is created, `AsyncMicroserviceOptions` offers a solution. This approach allows for dynamic configuration, ensuring smooth integration with the `ConfigService`.

```typescript
import { ConfigService } from '@nestjs/config';
import { AsyncMicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    AppModule,
    {
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get<string>('HOST'),
          port: configService.get<number>('PORT'),
        },
      }),
      inject: [ConfigService],
    },
  );

  await app.listen();
}
bootstrap();
```
