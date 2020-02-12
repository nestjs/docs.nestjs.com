### gRPC

[gRPC](https://github.com/grpc/grpc-node) is a modern, open source, high performance RPC framework that can run in any environment. It can efficiently connect services in and across data centers with pluggable support for load balancing, tracing, health checking and authentication.

Like many RPC systems, gRPC is based on the concept of defining a service in terms of functions (methods) that can be called remotely. For each method, you define the parameters and return types. Services, parameters, and return types are defined in `.proto` files using Google's open source language-neutral <a href="https://developers.google.com/protocol-buffers">protocol buffers</a> mechanism.

With the gRPC transporter, Nest uses `.proto` files to dynamically bind clients and servers to make it easy to implement remote procedure calls, automatically serializing and deserializing structured data.

#### Installation

To start building gRPC-based microservices, first install the required packages:

```bash
$ npm i --save grpc @grpc/proto-loader
```

#### Overview

Like other Nest microservices transport layer implementations, you select the gRPC transporter mechanism using the `transport` property of the options object passed to the `createMicroservice()` method. In the following example, we'll set up a hero service. The `options` property provides metadata about that service; its properties are described <a href="microservices/grpc#options">below</a>.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
});
```

> info **Hint** The `join()` function is imported from the `path` package; the `Transport` enum is imported from the `@nestjs/microservices` package.

#### Options

The <strong>gRPC</strong> transporter options object exposes the properties described below.

<table>
  <tr>
    <td><code>package</code></td>
    <td>Protobuf package name (matches <code>package</code> setting from <code>.proto</code> file).  Required</td>
  </tr>
  <tr>
    <td><code>protoPath</code></td>
    <td>
      Absolute (or relative to the root dir) path to the
      <code>.proto</code> file. Required
    </td>
  </tr>
  <tr>
    <td><code>url</code></td>
    <td>Connection url.  String in the format <code>ip address/dns name:port</code> (for example, <code>'localhost:50051'</code>) defining the address/port on which the transporter establishes a connection.  Optional.  Defaults to <code>'localhost:5000'</code></td>
  </tr>
  <tr>
    <td><code>protoLoader</code></td>
    <td>NPM package name for the utility to load <code>.proto</code> files.  Optional.  Defaults to <code>'@grpc/proto-loader'</code></td>
  </tr>
  <tr>
    <td><code>loader</code></td>
    <td>
      <code>@grpc/proto-loader</code> options. These provide detailed control over the behavior of <code>.proto</code> files. Optional. See
      <a
        href="https://github.com/grpc/grpc-node/blob/master/packages/proto-loader/README.md"
        rel="nofollow"
        target="_blank"
        >here</a
      > for more details
    </td>
  </tr>
  <tr>
    <td><code>credentials</code></td>
    <td>
      Server credentials.  Optional. <a
        href="https://grpc.io/grpc/node/grpc.ServerCredentials.html"
        rel="nofollow"
        target="_blank"
        >Read more here</a
      >
    </td>
  </tr>
</table>

#### Sample gRPC service

Let's define our sample gRPC service called `HeroService`. In the above `options` object, the`protoPath` property sets a path to the `.proto` definitions file `hero.proto`. The `hero.proto` file is structured using <a href="https://developers.google.com/protocol-buffers">protocol buffers</a>. Here's what it looks like:

```typescript
// hero/hero.proto
syntax = "proto3";

package hero;

service HeroService {
  rpc FindOne (HeroById) returns (Hero) {}
}

message HeroById {
  int32 id = 1;
}

message Hero {
  int32 id = 1;
  string name = 2;
}
```

Our `HeroService` exposes a `FindOne()` method. This method expects an input argument of type `HeroById` and returns a `Hero` message (protocol buffers use `message` elements to define both parameter types and return types).

Next, we need to implement the service. To define a handler that fulfills this definition, we use the `@GrpcMethod()` decorator in a controller, as shown below. This decorator provides the metadata needed to declare a method as a gRPC service method.

> info **Hint** The `@MessagePattern()` decorator (<a href="microservices/basics#request-response">read more</a>) introduced in previous microservices chapters is not used with gRPC-based microservices. The `@GrpcMethod()` decorator effectively takes its place for gRPC-based microservices.

```typescript
@@filename(hero.controller)
@Controller()
export class HeroController {
  @GrpcMethod('HeroService', 'FindOne')
  findOne(data: HeroById, metadata: any): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroController {
  @GrpcMethod('HeroService', 'FindOne')
  findOne(data, metadata) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

> info **Hint** The `@GrpcMethod()` decorator is imported from the `@nestjs/microservices` package.

The decorator shown above takes two arguments. The first is the service name (e.g., `'HeroService'`), corresponding to the `HeroService` service definition in `hero.proto`. The second (the string `'FindOne'`) corresponds to the `FindOne()` rpc method defined within `HeroService` in the `hero.proto` file.

The `findOne()` handler method takes two arguments, the `data` passed from the caller and `metadata` that stores gRPC request metadata.

Both `@GrpcMethod()` decorator arguments are optional. If called without the second argument (e.g., `'FindOne'`), Nest will automatically associate the `.proto` file rpc method with the handler based on converting the handler name to upper camel case (e.g., the `findOne` handler is associated with the `FindOne` rpc call definition). This is shown below.

```typescript
@@filename(hero.controller)
@Controller()
export class HeroController {
  @GrpcMethod('HeroService')
  findOne(data: HeroById, metadata: any): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroController {
  @GrpcMethod('HeroService)
  findOne(data, metadata) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

You can also omit the first `@GrpcMethod()` argument. In this case, Nest automatically associates the handler with the service definition from the proto definitions file based on the **class** name where the handler is defined. For example, in the following code, class `HeroService` associates its handler methods with the `HeroService` service definition in the `hero.proto` file based on the matching of the name `'HeroService'`.

```typescript
@@filename(hero.controller)
@Controller()
export class HeroService {
  @GrpcMethod()
  findOne(data: HeroById, metadata: any): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroService {
  @GrpcMethod()
  findOne(data, metadata) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

#### Client

Nest applications can act as gRPC clients, consuming services defined in `.proto` files. You access remote services through a `ClientGrpc` object. You can obtain a `ClientGrpc` object in several ways.

The preferred technique is to import the `ClientsModule`. Use the `register()` method to bind a package of services defined in a `.proto` file to an injection token, and to configure the service. The `name` property is the injection token. For gRPC services, use `transport: Transport.GRPC`. The `options` property is an object with the same properties described <a href="microservices/grpc#options">above</a>.

```typescript
imports: [
  ClientsModule.register([
    {
      name: 'HERO_PACKAGE',
      transport: Transport.GRPC,
      options: {
        package: 'hero',
        protoPath: join(__dirname, 'hero/hero.proto'),
      },
    },
  ]),
];
```

> info **Hint** The `register()` method takes an array of objects. Register multiple packages by providing a comma separated list of registration objects.

Once registered, we can inject the configured `ClientGrpc` object with `@Inject()`. Then we use the `ClientGrpc` object's `getService()` method to retrieve the service instance, as shown below.

```typescript
@Injectable()
export class AppService implements OnModuleInit {
  private heroService: HeroService;

  constructor(@Inject('HERO_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.heroService = this.client.getService<HeroService>('HeroService');
  }

  getHero(): Observable<string> {
    return this.heroService.findOne({ id: 1 });
  }
}
```

Notice that there is a small difference compared to the technique used in other microservice transport methods. Instead of the `ClientProxy` class, we use the `ClientGrpc` class, which provides the `getService()` method. The `getService()` generic method takes a service name as an argument and returns its instance (if available).

Alternatively, you can use the `@Client()` decorator to instantiate a `ClientGrpc` object, as follows:

```typescript
@Injectable()
export class AppService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'hero',
      protoPath: join(__dirname, 'hero/hero.proto'),
    },
  })
  client: ClientGrpc;

  private heroService: HeroService;

  onModuleInit() {
    this.heroService = this.client.getService<HeroService>('HeroService');
  }

  getHero(): Observable<string> {
    return this.heroService.findOne({ id: 1 });
  }
}
```

Finally, for more complex scenarios, we can inject a dynamically configured client using the `ClientProxyFactory` class as described <a href="/microservices/basics#client">here</a>.

In either case, we end up with a reference to our `HeroService` proxy object, which exposes the same set of methods that are defined inside the `.proto` file. Now, when we access this proxy object (i.e., `heroService`), the gRPC system automatically serializes requests, forwards them to the remote system, returns a response, and deserializes the response. Because gRPC shields us from these network communication details, `heroService` looks and acts like a local provider.

Note, all service methods are **lower camel cased** (in order to follow the natural convention of the language). So, for example, while our `.proto` file `HeroService` definition contains the `FindOne()` function, the `heroService` instance will provide the `findOne()` method.

```typescript
interface HeroService {
  findOne(data: { id: number }): Observable<any>;
}
```

A message handler is also able to return an `Observable`, in which case the result values will be emitted until the stream is completed.

```typescript
@@filename(hero.controller)
@Get()
call(): Observable<any> {
  return this.heroService.findOne({ id: 1 });
}
@@switch
@Get()
call() {
  return this.heroService.findOne({ id: 1 });
}
```

A full working example is available [here](https://github.com/nestjs/nest/tree/master/sample/04-grpc).

#### gRPC Streaming

gRPC on its own supports long-term live connections, conventionally known as `streams`. Streams are useful for cases such as Chatting, Observations or Chunk-data transfers. Find more details in the official documentation [here](https://grpc.io/docs/guides/concepts/).

Nest supports GRPC stream handlers in two possible ways:

- RxJS `Subject` + `Observable` handler: can be useful to write responses right inside of a Controller method or to be passed down to `Subject`/`Observable` consumer
- Pure GRPC call stream handler: can be useful to be passed to some executor which will handle the rest of dispatch for the Node standard `Duplex` stream handler.

#### Streaming sample

Let's define a new sample gRPC service called `HelloService`. The `hello.proto` file is structured using <a href="https://developers.google.com/protocol-buffers">protocol buffers</a>. Here's what it looks like:

```typescript
// hello/hello.proto
syntax = "proto3";

package hello;

service HelloService {
  rpc BidiHello(stream HelloRequest) returns (stream HelloResponse)
  rpc LotsOfGreetings(stream HelloRequest) returns (HelloResponse)
}

message HelloRequest {
  string greeting = 1;
}

message HelloResponse {
  string reply = 1;
}
```

> info **Hint** The `LotsOfGreetings` method can be simply implemented with the `@GrpcMethod` decorator (as in the examples above) since the returned stream can emit multiple values.

Based on this `.proto` file, let's define the `HelloService` interface:

```typescript
interface HelloService {
  bidiHello(upstream: Observable<HelloRequest>): Observable<HelloResponse>;
  lotsOfGreetings(
    upstream: Observable<HelloRequest>,
  ): Observable<HelloResponse>;
}

interface HelloRequest {
  greeting: string;
}

interface HelloResponse {
  reply: string;
}
```

#### Subject strategy

The `@GrpcStreamMethod()` decorator provides the function parameter as an RxJS `Observable`. Thus, we can receive and process multiple messages.

```typescript
@GrpcStreamMethod()
bidiHello(messages: Observable<any>): Observable<any> {
  const subject = new Subject();

  const onNext = message => {
    console.log(message);
    subject.next({
      reply: 'Hello, world!'
    });
  };
  const onComplete = () => subject.complete();
  messages.subscribe(onNext, null, onComplete);

  return subject.asObservable();
}
```

> info **Hint** For supporting full-duplex interaction with the `@GrpcStreamMethod()` decorator, the controller method must return an RxJS `Observable`.

According to the service definition (in the `.proto` file), the `BidiHello` method should stream requests to the service. To send multiple asynchronous messages to the stream from a client, we leverage an RxJS `ReplySubject` class.

```typescript
const helloService = this.client.getService<HelloService>('HelloService');
const helloRequest$ = new ReplySubject<HelloRequest>();

helloRequest$.next({ greeting: 'Hello (1)!' });
helloRequest$.next({ greeting: 'Hello (2)!' });
helloRequest$.complete();

return helloService.bidiHello(helloRequest$);
```

In the example above, we wrote two messages to the stream (`next()` calls) and notified the service that we've completed sending the data (`complete()` call).

#### Call stream handler

When the method return value is defined as `stream`, the `@GrpcStreamCall()` decorator provides the function parameter as `grpc.ServerDuplexStream`, which supports standard methods like `.on('data', callback)`, `.write(message)` or `.cancel()`. Full documentation on available methods can be found [here](https://grpc.github.io/grpc/node/grpc-ClientDuplexStream.html).

Alternatively, when the method return value is not a `stream`, the `@GrpcStreamCall()` decorator provides two function parameters, respectively `grpc.ServerReadableStream` (read more [here](https://grpc.github.io/grpc/node/grpc-ServerReadableStream.html)) and `callback`.

Let's start with implementing the `BidiHello` which should support a full-duplex interaction.

```typescript
@GrpcStreamCall()
bidiHello(requestStream: any) {
  requestStream.on('data', message => {
    console.log(message);
    requestStream.write({
      reply: 'Hello, world!'
    });
  });
}
```

> info **Hint** This decorator does not require any specific return parameter to be provided. It is expected that the stream will be handled similar to any other standard stream type.

In the example above, we used the `write()` method to write objects to the response stream. The callback passed into the `.on()` method as a second parameter will be called every time our service receives a new chunk of data.

Let's implement the `LotsOfGreetings` method.

```typescript
@GrpcStreamCall()
lotsOfGreetings(requestStream: any, callback: (err: unknown, value: HelloResponse) => void) {
  requestStream.on('data', message => {
    console.log(message);
  });
  requestStream.on('end', () => callback(null, { reply: 'Hello, world!' }));
}
```

Here we used the `callback` function to send the response once processing of the `requestStream` has been completed.
