### Custom transporters

Nest provides a variety of **transporters** out of the box, as well as an API for building custom transport strategies.
Transporters let you connect components over a network using a pluggable communications layer and a simple application-level message protocol (see the [full article](https://dev.to/nestjs/integrate-nestjs-with-external-services-using-microservice-transporters-part-1-p3)).

> info **Hint** Building a microservice with Nest doesn't necessarily mean you must use the `@nestjs/microservices` package. For example, if you want to communicate with external services (e.g., other microservices written in different languages), you may not need all the features provided by the `@nestjs/microservices` library.
> If you don't need the decorators that let you define subscribers declaratively (`@EventPattern` or `@MessagePattern`), running a [standalone application](/application-context) and managing connections and channel subscriptions manually is enough for most use cases, and gives you more flexibility.

With a custom transporter, you can integrate any messaging system or protocol (including Google Cloud Pub/Sub, Amazon Kinesis, and others), or extend an existing one with extra features (for example, [QoS](https://github.com/mqttjs/MQTT.js/blob/master/README.md#qos) for MQTT).

> info **Hint** To better understand how Nest microservices work and how you can extend the capabilities of existing transporters, we recommend reading the [NestJS Microservices in Action](https://dev.to/johnbiundo/series/4724) and [Advanced NestJS Microservices](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l) article series.

#### Creating a strategy

First, let's define a class representing our custom transporter:

```typescript
import { CustomTransportStrategy, Server } from '@nestjs/microservices';

class GoogleCloudPubSubServer
  extends Server
  implements CustomTransportStrategy
{
  /**
   * Triggered when you run "app.listen()".
   */
  listen(callback: () => void) {
    callback();
  }

  /**
   * Triggered on application shutdown.
   */
  close() {}

  /**
   * You can ignore this method if you don't want transporter users
   * to be able to register event listeners. Most custom implementations
   * will not need this.
   */
  on(event: string, callback: Function) {
    throw new Error('Method not implemented.');
  }

  /**
   * You can ignore this method if you don't want transporter users
   * to be able to retrieve the underlying native server. Most custom implementations
   * will not need this.
   */
  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
```

> warning **Warning** This chapter doesn't implement a fully-featured Google Cloud Pub/Sub server, as that would require diving into transporter-specific technical details.

In the example above, we declared the `GoogleCloudPubSubServer` class and provided the `listen()` and `close()` methods enforced by the `CustomTransportStrategy` interface.
Our class also extends the `Server` class from the `@nestjs/microservices` package, which provides several useful methods, such as the ones the Nest runtime uses to register message handlers. Alternatively, to extend the capabilities of an existing transport strategy, you can extend the corresponding server class, for example, `ServerRedis`.
By convention, we added the `"Server"` suffix to the class name, because the class is responsible for subscribing to messages and events (and responding to them, if necessary).

With this in place, we can use our custom strategy instead of a built-in transporter:

```typescript
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    strategy: new GoogleCloudPubSubServer(),
  },
);
```

Instead of passing the usual transporter options object with the `transport` and `options` properties, we pass a single property, `strategy`, whose value is an instance of our custom transporter class.

Back to the `GoogleCloudPubSubServer` class. In a real-world application, the `listen()` method would establish a connection to the message broker or external service and register subscribers or listen to specific channels (and the `close()` teardown method would remove the subscriptions and close the connection).
Since this requires a good understanding of how Nest microservices communicate with each other, we recommend reading the [Advanced NestJS Microservices article series](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l).
This chapter instead focuses on the capabilities the `Server` class provides and how you can use them to build custom strategies.

For example, let's say that the following message handler is defined somewhere in our application:

```typescript
@MessagePattern('echo')
echo(@Payload() data: object) {
  return data;
}
```

The Nest runtime registers this message handler automatically. With the `Server` class, you can see which message patterns have been registered, and access and execute the methods assigned to them.
To test this out, let's add a `console.log` call inside the `listen()` method, before the `callback` function is called:

```typescript
listen(callback: () => void) {
  console.log(this.messageHandlers);
  callback();
}
```

After your application restarts, you'll see the following log in your terminal:

```text
Map(1) {
  'echo' => [AsyncFunction (anonymous)] { isEventHandler: false, extras: {} }
}
```

> info **Hint** With the `@EventPattern` decorator, you would see the same output, but with the `isEventHandler` property set to `true`.

The `messageHandlers` property is a `Map` of all message (and event) handlers, keyed by pattern.
You can use a key (for example, `"echo"`) to get a reference to the message handler:

```typescript
async listen(callback: () => void) {
  const echoHandler = this.messageHandlers.get('echo');
  console.log(await echoHandler('Hello world!'));
  callback();
}
```

When we execute `echoHandler` with an arbitrary string as the argument (`"Hello world!"` here), we should see it in the console:

```text
Hello world!
```

This means that our handler method was executed correctly.

When you use a `CustomTransportStrategy` with [interceptors](/interceptors), the handlers are wrapped in RxJS streams. This means you need to subscribe to them to execute the streams' underlying logic (e.g., to continue into the controller logic after an interceptor has run).

For example:

```typescript
async listen(callback: () => void) {
  const echoHandler = this.messageHandlers.get('echo');
  const streamOrResult = await echoHandler('Hello World');
  if (isObservable(streamOrResult)) {
    streamOrResult.subscribe();
  }
  callback();
}
```

#### Reporting event handler errors

An event handler has no response stream, so an error thrown inside one has nowhere to go. Nest logs it instead, but only after your exception filters run. If one of your filters matches the exception, that filter is the only report.

Some transporters await the event stream themselves and hand the failure to their client library, which reports it. `ServerKafka` does this: `kafkajs` logs the rejection, so a second report from Nest would duplicate it. Set `propagatesEventHandlerErrors` to `true` in that case:

```typescript
class GoogleCloudPubSubServer
  extends Server
  implements CustomTransportStrategy
{
  /**
   * The client library reports an event handler failure, so Nest must not
   * log it a second time.
   */
  public override readonly propagatesEventHandlerErrors = true;
}
```

The default is `false`, which suits a transporter that uses the inherited `handleEvent`. Nothing subscribes to the event stream there, so Nest is the only thing that can report the failure.

#### Client proxy

As mentioned in the first section, you don't necessarily need the `@nestjs/microservices` package to create microservices. However, if you use it and need to integrate a custom strategy, you also need to provide a "client" class.

> info **Hint** Implementing a fully-featured client class compatible with all `@nestjs/microservices` features (e.g., streaming) requires a good understanding of the communication techniques the framework uses. To learn more, see the [basic client component article](https://dev.to/nestjs/part-4-basic-client-component-16f9).

To communicate with an external service and publish messages (or emit events), you can either use a library-specific SDK package or implement a custom client class that extends `ClientProxy`:

```typescript
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';

class GoogleCloudPubSubClient extends ClientProxy {
  async connect(): Promise<any> {}
  async close() {}
  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {}
  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ): () => void {}
  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
```

> warning **Warning** This chapter doesn't implement a fully-featured Google Cloud Pub/Sub client, as that would require diving into transporter-specific technical details.

The `ClientProxy` class requires you to implement methods for establishing and closing the connection, and for publishing messages (`publish()`) and events (`dispatchEvent()`).
If you don't need to support the request-response communication style, you can leave the `publish()` method empty. Likewise, if you don't need to support event-based communication, leave the `dispatchEvent()` method empty.

To observe which of these methods run, and when, let's add several `console.log` calls:

```typescript
class GoogleCloudPubSubClient extends ClientProxy {
  async connect(): Promise<any> {
    console.log('connect');
  }

  async close() {
    console.log('close');
  }

  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    return console.log('event to dispatch: ', packet);
  }

  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ): () => void {
    console.log('message:', packet);

    // In a real-world application, the "callback" function should be executed
    // with the payload sent back from the responder. Here, we simulate a response
    // (after a 5-second delay) by passing back the same "data" we originally sent.
    //
    // The "isDisposed" flag on the WritePacket signals that no further data is
    // expected. If it's omitted or false, the data is emitted to the Observable.
    setTimeout(() => callback({ 
      response: packet.data,
      isDisposed: true,
    }), 5000);

    return () => console.log('teardown');
  }

  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
```

With this in place, let's create an instance of the `GoogleCloudPubSubClient` class and call the `send()` method (which you might have seen in earlier chapters), subscribing to the returned observable stream:

```typescript
const googlePubSubClient = new GoogleCloudPubSubClient();
googlePubSubClient
  .send('pattern', 'Hello world!')
  .subscribe((response) => console.log(response));
```

You should see the following output in your terminal:

```typescript
connect
message: { pattern: 'pattern', data: 'Hello world!' }
Hello world! // <-- after 5 seconds
```

To test whether the teardown function (which our `publish()` method returns) runs, let's apply the `timeout` operator to the stream, set to 2 seconds so that it throws before our `setTimeout` calls the `callback` function:

```typescript
const googlePubSubClient = new GoogleCloudPubSubClient();
googlePubSubClient
  .send('pattern', 'Hello world!')
  .pipe(timeout(2000))
  .subscribe({
    next: (response) => console.log(response),
    error: (error) => console.error(error.message),
  });
```

> info **Hint** The `timeout` operator is imported from the `rxjs/operators` package.

With the `timeout` operator applied, your terminal output should look as follows:

```typescript
connect
message: { pattern: 'pattern', data: 'Hello world!' }
teardown // <-- teardown
Timeout has occurred
```

To dispatch an event (instead of sending a message), use the `emit()` method:

```typescript
googlePubSubClient.emit('event', 'Hello world!');
```

You should see the following in the console:

```typescript
connect
event to dispatch:  { pattern: 'event', data: 'Hello world!' }
```

#### Message serialization

To add custom logic around the serialization of responses on the client side, use a custom class that extends the `ClientProxy` class or one of its child classes. To modify successful responses, override the `serializeResponse()` method; to modify any errors that go through this client, override the `serializeError()` method. To use this custom class, pass the class itself to the `ClientsModule.register()` method using the `customClass` property. Below is an example of a custom `ClientProxy` that serializes each error into an `RpcException`.

```typescript
@@filename(error-handling.proxy)
import { ClientTCP, RpcException } from '@nestjs/microservices';

class ErrorHandlingProxy extends ClientTCP {
  serializeError(err: Error) {
    return new RpcException(err);
  }
}
```

Then use it in the `ClientsModule`:

```typescript
@@filename(app.module)
@Module({
  imports: [
    ClientsModule.register([{
      name: 'CustomProxy',
      customClass: ErrorHandlingProxy,
    }]),
  ]
})
export class AppModule {}
```

> info **Hint** You pass the class itself to `customClass`, not an instance of the class. Nest creates the instance for you and passes any options given in the `options` property to the new `ClientProxy`.
