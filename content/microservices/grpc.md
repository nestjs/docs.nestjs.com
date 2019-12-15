### gRPC

[gRPC](https://github.com/grpc/grpc-node) is a modern open source high performance RPC framework that can run in any environment. It can efficiently connect services in and across data centers with pluggable support for load balancing, tracing, health checking and authentication

#### Installation

To start building gRPC-based microservices, first install the required packages:

```bash
$ npm i --save grpc @grpc/proto-loader
```

#### Transporter

To use the gRPC transporter, pass the following options object to the `createMicroservice()` method:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice(ApplicationModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
});
```

> info **Hint** The `join()` function is imported from the `path` package, while the `Transport` enum from the `@nestjs/microservices` package.

#### Options

The `options` object is specific to the chosen transporter. The <strong>gRPC</strong> transporter exposes the properties described below.

<table>
  <tr>
    <td><code>url</code></td>
    <td>Connection url</td>
  </tr>
  <tr>
    <td><code>protoLoader</code></td>
    <td>NPM package name (if you want to use another proto-loader)</td>
  </tr>
  <tr>
    <td><code>protoPath</code></td>
    <td>
      Absolute (or relative to the root dir) path to the
      <code>.proto</code> file
    </td>
  </tr>
  <tr>
    <td><code>loader</code></td>
    <td>
      <code>@grpc/proto-loader</code> options. They are well-described
      <a
        href="https://github.com/grpc/grpc-node/tree/master/packages/grpc-protobufjs#usage"
        rel="nofollow"
        target="_blank"
        >here</a
      >.
    </td>
  </tr>
  <tr>
    <td><code>package</code></td>
    <td>Protobuf package name</td>
  </tr>
  <tr>
    <td><code>credentials</code></td>
    <td>
      Server credentials (<a
        href="https://grpc.io/grpc/node/grpc.ServerCredentials.html"
        rel="nofollow"
        target="_blank"
        >read more</a
      >)
    </td>
  </tr>
</table>

#### Overview

In general, the `package` property sets a [protobuf](https://developers.google.com/protocol-buffers/docs/proto) package name, while the`protoPath` is a path to the `.proto` definitions file. The `hero.proto` file is structured using protocol buffer language.

```typescript
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

In the above example, we defined the `HeroService` that exposes the `FindOne()` gRPC handler which in turn expects `HeroById` as an input arguments and returns the `Hero` message. In order to define a handler that fulfills this protobuf definition, we have to use the `@GrpcMethod()` decorator. The previously introduced `@MessagePattern()` decorator is useless with gRPC-based microservices.

```typescript
@@filename(hero.controller)
@GrpcMethod('HeroService', 'FindOne')
findOne(data: HeroById, metadata: any): Hero {
  const items = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Doe' },
  ];
  return items.find(({ id }) => id === data.id);
}
@@switch
@GrpcMethod('HeroService', 'FindOne')
findOne(data, metadata) {
  const items = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Doe' },
  ];
  return items.find(({ id }) => id === data.id);
}
```

> info **Hint** The `@GrpcMethod()` decorator is imported from the `@nestjs/microservices` package.

The `HeroService` is a service name, while `findOne` points to the `FindOne()` gRPC handler. The corresponding `findOne()` method takes two arguments, the `data` passed from the caller and `metadata` that stores gRPC request's metadata.

In addition, the `FindOne` string is not required. If you don't pass a second argument to the `@GrpcMethod()` decorator, Nest will automatically use the method name with the capitalized first letter (e.g. `findOne` -> `FindOne`).

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

Likewise, you may not pass any argument. In this case, Nest would use a class name.

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

To create a client instance, use the `ClientsModule`.

```typescript
ClientsModule.register([
  {
    name: 'HERO_SERVICE',
    transport: Transport.GRPC,
    options: {
      package: 'hero',
      protoPath: join(__dirname, 'hero/hero.proto'),
    },
  },
]),
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them [here](https://docs.nestjs.com/microservices/basics#client).

You can use the `@Client()` decorator instead, as follows:

```typescript
@Client({
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
})
client: ClientGrpc;
```

Notice that there is a small difference compared to the previous examples. Instead of the `ClientProxy` class, we use the `ClientGrpc` class that provides the `getService()` method. The `getService()` generic method takes a service name as an argument and returns its instance (if available).

```typescript
@@filename(hero.controller)
onModuleInit() {
  this.heroService = this.client.getService<HeroService>('HeroService');
}
@@switch
onModuleInit() {
  this.heroService = this.client.getService('HeroService');
}
```

The `heroService` object exposes the same set of methods that are defined inside the `.proto` file. Note, all methods are **lowercased** (in order to follow the natural convention of the language). Basically, our gRPC `HeroService` definition contains the `FindOne()` function. It means that `heroService` instance will provide the `findOne()` method.

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

GRPC on it's own supports long-term live connections more known as `streams`.
Streams can be a very useful instrument for such service cases as Chatting, Observations
or Chunk-data transfers. You can find more details in the official documentation ([here](https://grpc.io/docs/guides/concepts/)).

Nest supports GRPC stream handlers in two possible ways:

- RxJS `Subject` + `Observable` handler: can be useful to write
  responses right inside of a Controller method or to be passed down
  to `Subject`/`Observable` consumer
- Pure GRPC call stream handler: can be useful to be passed
  to some executor which will handle the rest of dispatch for
  the Node standard `Duplex` stream handler.

#### Subject strategy

`@GrpcStreamMethod()` decorator will provide the function parameter as RxJS `Observable`.

```typescript
// Set decorator with selecting a Service definition from protobuf package
// the string is matching to: package proto_example.orders.OrdersService
@GrpcStreamMethod('orders.OrderService')
handleStream(messages: Observable<any>): Observable<any> {
  const subject = new Subject();
  messages.subscribe(message => {
    console.log(message);
    subject.next({
      shipmentType: {
        carrier: 'test-carrier',
      },
    });
  });
  return subject.asObservable();
}
```

For support full-duplex interaction with `@GrpcStreamMethod()` decorator, it is required to return an RxJS `Observable`
from the controller method.

#### Call stream handler

`@GrpcStreamCall()` decorator will provide function parameter as `grpc.ServerDuplexStream`, which
supports standard methods like `.on('data', callback)`, `.write(message)` or `.cancel()`,
full documentation on available methods can be found [here](https://grpc.github.io/grpc/node/grpc-ClientDuplexStream.html).

```typescript
// Set decorator with selecting a Service definition from protobuf package
// the string is matching to: package proto_example.orders.OrdersService
@GrpcStreamCall('orders.OrderService')
handleStream(stream: any) {
  stream.on('data', (msg: any) => {
    console.log(msg);
    // Answer here or anywhere else using stream reference
    stream.write({
      shipmentType: {
        carrier: 'test-carrier',
      },
    });
  });
}
```

This decorator do not require any specific return parameter to be provided.
It is expected that stream will be handled in the way like any other standard
stream type.
