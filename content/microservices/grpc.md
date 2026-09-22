### gRPC

[gRPC](https://github.com/grpc/grpc-node) is a modern, open source, high-performance RPC framework that can run in any environment. It connects services in and across data centers, with pluggable support for load balancing, tracing, health checking, and authentication.

Like many RPC systems, gRPC is based on defining a service in terms of functions (methods) that can be called remotely. For each method, you define the parameters and return types. Services, parameters, and return types are defined in `.proto` files using Google's open source, language-neutral <a href="https://protobuf.dev">protocol buffers</a> mechanism.

With the gRPC transporter, Nest uses `.proto` files to dynamically bind clients and servers, which makes remote procedure calls straightforward to implement and serializes and deserializes structured data automatically.

#### Installation

To start building gRPC-based microservices, first install the required packages:

```bash
$ npm i --save @grpc/grpc-js @grpc/proto-loader
```

#### Overview

As with other Nest microservice transport layer implementations, you select the gRPC transporter using the `transport` property of the options object passed to the `createMicroservice()` method. In the following example, we'll set up a hero service. The `options` property provides metadata about that service; its properties are described in [Options](/microservices/grpc#options) below.

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(import.meta.dirname, 'hero/hero.proto'),
  },
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(import.meta.dirname, 'hero/hero.proto'),
  },
});
```

> info **Hint** The `join()` function is imported from the `path` package, and the `Transport` enum from the `@nestjs/microservices` package.

In the `nest-cli.json` file, add the `assets` property to distribute non-TypeScript files, and `watchAssets` to watch all non-TypeScript assets. In this case, we want `.proto` files to be copied to the `dist` folder automatically.

```json
{
  "compilerOptions": {
    "assets": ["**/*.proto"],
    "watchAssets": true
  }
}
```

#### Options

The <strong>gRPC</strong> transporter options object exposes the following properties.

<table>
  <tr>
    <td><code>package</code></td>
    <td>Protobuf package name (matches the <code>package</code> setting in the <code>.proto</code> file). Also accepts an array of package names. Required</td>
  </tr>
  <tr>
    <td><code>protoPath</code></td>
    <td>
      Absolute (or relative to the current working directory) path to the
      <code>.proto</code> file, or an array of paths. Required unless you pass a preloaded <code>packageDefinition</code> instead
    </td>
  </tr>
  <tr>
    <td><code>url</code></td>
    <td>Connection URL. A string in the format <code>ip address/dns name:port</code> (e.g., <code>'0.0.0.0:50051'</code> for a Docker server) that defines the address and port on which the transporter establishes a connection. Optional. Defaults to <code>'localhost:5000'</code></td>
  </tr>
  <tr>
    <td><code>protoLoader</code></td>
    <td>NPM package name for the utility to load <code>.proto</code> files. Optional. Defaults to <code>'@grpc/proto-loader'</code></td>
  </tr>
  <tr>
    <td><code>loader</code></td>
    <td>
      <code>@grpc/proto-loader</code> options, which control how <code>.proto</code> files are loaded. Optional. See the
      <a
        href="https://github.com/grpc/grpc-node/blob/master/packages/proto-loader/README.md"
        rel="nofollow"
        target="_blank"
        >proto-loader README</a
      > for details
    </td>
  </tr>
  <tr>
    <td><code>credentials</code></td>
    <td>
      Server credentials (channel credentials when used by a client). Optional. Defaults to insecure credentials. See the <a
        href="https://grpc.io/grpc/node/grpc.ServerCredentials.html"
        rel="nofollow"
        target="_blank"
        ><code>ServerCredentials</code> reference</a
      >
    </td>
  </tr>
</table>

#### Sample gRPC service

Let's define a sample gRPC service called `HeroesService`. In the `options` object above, the `protoPath` property sets the path to the `hero.proto` definitions file. The `hero.proto` file is structured using <a href="https://developers.google.com/protocol-buffers">protocol buffers</a>:

```typescript
// hero/hero.proto
syntax = "proto3";

package hero;

service HeroesService {
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

`HeroesService` exposes a `FindOne()` method. This method expects an input argument of type `HeroById` and returns a `Hero` message (protocol buffers use `message` elements to define both parameter types and return types).

Next, implement the service. To define a handler that fulfills this definition, use the `@GrpcMethod()` decorator in a controller, as shown below. This decorator provides the metadata needed to declare a method as a gRPC service method.

> info **Hint** The `@MessagePattern()` decorator (see [request-response](/microservices/basics#request-response)) introduced in previous microservices chapters is not used with gRPC-based microservices. The `@GrpcMethod()` decorator takes its place.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService', 'FindOne')
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService', 'FindOne')
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

> info **Hint** The `@GrpcMethod()` decorator is imported from the `@nestjs/microservices` package, while `Metadata` and `ServerUnaryCall` are imported from the `@grpc/grpc-js` package.

The decorator takes two arguments. The first is the service name (e.g., `'HeroesService'`), corresponding to the `HeroesService` service definition in `hero.proto`. The second (the string `'FindOne'`) corresponds to the `FindOne()` rpc method defined within `HeroesService` in `hero.proto`.

The `findOne()` handler method takes three arguments: the `data` passed from the caller, the `metadata` that stores gRPC request metadata, and the `call` object, which exposes members such as `sendMetadata()` for sending metadata to the client.

Both `@GrpcMethod()` decorator arguments are optional. If you omit the second argument (e.g., `'FindOne'`), Nest associates the handler with the `.proto` rpc method whose name matches the handler name with its first letter capitalized (e.g., the `findOne` handler is associated with the `FindOne` rpc definition), as shown below.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService')
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService')
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

You can also omit the first `@GrpcMethod()` argument. In this case, Nest associates the handler with the service definition in the `.proto` file based on the name of the **class** where the handler is defined. For example, in the following code, the `HeroesService` class associates its handler methods with the `HeroesService` service definition in `hero.proto` because the names match.

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
```

#### Client

Nest applications can act as gRPC clients, consuming services defined in `.proto` files. You access remote services through a `ClientGrpc` object, which you can obtain in several ways.

The preferred technique is to import the `ClientsModule`. Use its `register()` method to bind a package of services defined in a `.proto` file to an injection token, and to configure the service. The `name` property is the injection token. For gRPC services, use `transport: Transport.GRPC`. The `options` property is an object with the same properties described in [Options](/microservices/grpc#options) above.

```typescript
imports: [
  ClientsModule.register([
    {
      name: 'HERO_PACKAGE',
      transport: Transport.GRPC,
      options: {
        package: 'hero',
        protoPath: join(import.meta.dirname, 'hero/hero.proto'),
      },
    },
  ]),
];
```

> info **Hint** The `register()` method takes an array of objects. To register multiple packages, provide a comma-separated list of registration objects.

Once registered, inject the configured `ClientGrpc` object with `@Inject()`. Then use the `ClientGrpc` object's `getService()` method to retrieve the service instance, as shown below.

```typescript
@Injectable()
export class AppService implements OnModuleInit {
  private heroesService: HeroesService;

  constructor(@Inject('HERO_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.heroesService = this.client.getService<HeroesService>('HeroesService');
  }

  getHero(): Observable<string> {
    return this.heroesService.findOne({ id: 1 });
  }
}
```

> error **Warning** The gRPC client does not send fields that contain an underscore (`_`) in their names unless the `keepCase` option is set to `true` in the proto loader configuration (`options.loader.keepCase` in the microservice transporter configuration).

This differs slightly from the technique used with other microservice transporters. Instead of the `ClientProxy` class, you use the `ClientGrpc` class, which provides the `getService()` method. The generic `getService()` method takes a service name as an argument and returns its instance (if available).

Alternatively, you can use the `@Client()` decorator to instantiate a `ClientGrpc` object, as follows:

```typescript
@Injectable()
export class AppService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'hero',
      protoPath: join(import.meta.dirname, 'hero/hero.proto'),
    },
  })
  client: ClientGrpc;

  private heroesService: HeroesService;

  onModuleInit() {
    this.heroesService = this.client.getService<HeroesService>('HeroesService');
  }

  getHero(): Observable<string> {
    return this.heroesService.findOne({ id: 1 });
  }
}
```

Finally, for more complex scenarios, you can inject a dynamically configured client using the `ClientProxyFactory` class, as described in the [client section of the microservices overview](/microservices/basics#client).

In each case, you end up with a reference to the `HeroesService` proxy object, which exposes the same set of methods that are defined in the `.proto` file. When you call this proxy object (i.e., `heroesService`), gRPC serializes the request, forwards it to the remote system, returns a response, and deserializes the response. Because gRPC shields you from these network communication details, `heroesService` looks and acts like a local provider.

All service methods are **lower camel cased**, following the natural convention of the language. For example, while the `HeroesService` definition in the `.proto` file contains the `FindOne()` function, the `heroesService` instance provides the `findOne()` method.

```typescript
interface HeroesService {
  findOne(data: { id: number }): Observable<any>;
}
```

A handler can also return an `Observable`, in which case the result values are emitted until the stream completes.

```typescript
@@filename(heroes.controller)
@Get()
call(): Observable<any> {
  return this.heroesService.findOne({ id: 1 });
}
@@switch
@Get()
call() {
  return this.heroesService.findOne({ id: 1 });
}
```

To send gRPC metadata along with the request, pass a second argument, as follows:

```typescript
call(): Observable<any> {
  const metadata = new Metadata();
  metadata.add('Set-Cookie', 'yummy_cookie=choco');

  return this.heroesService.findOne({ id: 1 }, metadata);
}
```

> info **Hint** The `Metadata` class is imported from the `@grpc/grpc-js` package.

This requires updating the `HeroesService` interface defined earlier to accept the second argument.

#### Exception handling

gRPC handlers can throw `RpcException`, but a plain `RpcException` does not carry a gRPC status code, so clients receive `UNKNOWN` for every failure. Starting with NestJS v12, the `@nestjs/microservices` package ships dedicated gRPC exceptions and a `GrpcExceptionFilter` that maps them to proper gRPC error objects.

Throw one of the status-specific exceptions from your handler:

```typescript
@@filename(heroes.controller)
import { GrpcAlreadyExistsException } from '@nestjs/microservices';

@GrpcMethod('HeroesService')
create(data: Hero): Hero {
  if (this.heroes.has(data.id)) {
    throw new GrpcAlreadyExistsException('Hero already exists');
  }
  return this.heroes.add(data);
}
```

Then register the filter so those exceptions are serialized into gRPC errors:

```typescript
@@filename(main)
import { GrpcExceptionFilter } from '@nestjs/microservices';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(import.meta.dirname, 'hero/hero.proto'),
  },
});
app.useGlobalFilters(new GrpcExceptionFilter());
```

With the filter in place, the client receives `ALREADY_EXISTS` instead of `UNKNOWN`.

You can also use the generic `GrpcException` and pass a status explicitly:

```typescript
import { GrpcException, GrpcStatus } from '@nestjs/microservices';

throw new GrpcException('Rate limit exceeded', GrpcStatus.RESOURCE_EXHAUSTED);
```

The following status-specific exception classes are available. Each corresponds to a member of the `GrpcStatus` enum:

<table>
  <tr>
    <td><code>GrpcCancelledException</code></td>
    <td><code>GrpcUnknownException</code></td>
    <td><code>GrpcInvalidArgumentException</code></td>
    <td><code>GrpcDeadlineExceededException</code></td>
  </tr>
  <tr>
    <td><code>GrpcNotFoundException</code></td>
    <td><code>GrpcAlreadyExistsException</code></td>
    <td><code>GrpcPermissionDeniedException</code></td>
    <td><code>GrpcResourceExhaustedException</code></td>
  </tr>
  <tr>
    <td><code>GrpcFailedPreconditionException</code></td>
    <td><code>GrpcAbortedException</code></td>
    <td><code>GrpcOutOfRangeException</code></td>
    <td><code>GrpcUnimplementedException</code></td>
  </tr>
  <tr>
    <td><code>GrpcInternalException</code></td>
    <td><code>GrpcUnavailableException</code></td>
    <td><code>GrpcDataLossException</code></td>
    <td><code>GrpcUnauthenticatedException</code></td>
  </tr>
</table>

> info **Hint** `GrpcExceptionFilter` also handles `RpcException`. If the error object passed to the `RpcException` constructor carries a numeric `code` or `status` property, that value is used as the gRPC status; otherwise, the error is reported as `UNKNOWN`. Any other exception is reported as `UNKNOWN` with a generic message.

#### Example

A working example is available in the [gRPC sample](https://github.com/nestjs/nest/tree/master/sample/04-grpc) of the NestJS repository.

#### gRPC Reflection

The [gRPC Server Reflection Specification](https://grpc.io/docs/guides/reflection/#overview) is a standard that allows gRPC clients to request details about the API the server exposes, similar to exposing an OpenAPI document for a REST API. This makes it easier to work with debugging tools such as grpc-ui or Postman.

To add gRPC reflection support to your server, first install the implementation package:

```bash
$ npm i --save @grpc/reflection
```

Then hook it into the gRPC server using the `onLoadPackageDefinition` hook in your gRPC server options, as follows:

```typescript
@@filename(main)
import { ReflectionService } from '@grpc/reflection';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(import.meta.dirname, 'hero/hero.proto'),
    onLoadPackageDefinition: (pkg, server) => {
      new ReflectionService(pkg).addToServer(server);
    },
  },
});
```

Your server now responds to reflection requests for API details.

#### gRPC Streaming

gRPC supports long-lived connections, conventionally known as `streams`. Streams are useful for cases such as chat, observation, or chunked data transfers. See the [gRPC core concepts guide](https://grpc.io/docs/guides/concepts/) for details.

Nest supports gRPC stream handlers in two ways:

- RxJS `Subject` + `Observable` handler: useful for writing responses directly inside a controller method, or for passing them to a `Subject`/`Observable` consumer
- Pure gRPC call stream handler: useful for passing the call to an executor that handles the rest of the dispatch for the standard Node.js `Duplex` stream

<app-banner-enterprise></app-banner-enterprise>

#### Streaming sample

Let's define a new sample gRPC service called `HelloService`. The `hello.proto` file is structured using <a href="https://developers.google.com/protocol-buffers">protocol buffers</a>:

```typescript
// hello/hello.proto
syntax = "proto3";

package hello;

service HelloService {
  rpc BidiHello(stream HelloRequest) returns (stream HelloResponse);
  rpc LotsOfGreetings(stream HelloRequest) returns (HelloResponse);
}

message HelloRequest {
  string greeting = 1;
}

message HelloResponse {
  string reply = 1;
}
```

> info **Hint** `LotsOfGreetings` streams requests but returns a single response. Because its requests are streamed, it can't be implemented with `@GrpcMethod()`; use `@GrpcStreamMethod()` (the last value the returned `Observable` emits is sent as the response) or `@GrpcStreamCall()` (respond through the callback), both shown below.

Based on this `.proto` file, define the `HelloService` interface:

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

> info **Hint** The proto interface can be generated automatically by the [ts-proto](https://github.com/stephenh/ts-proto) package. See the [ts-proto NestJS guide](https://github.com/stephenh/ts-proto/blob/main/NESTJS.markdown) to learn more.

#### Subject strategy

The `@GrpcStreamMethod()` decorator provides the function parameter as an RxJS `Observable`, so the handler can receive and process multiple messages.

```typescript
@GrpcStreamMethod()
bidiHello(messages: Observable<any>, metadata: Metadata, call: ServerDuplexStream<any, any>): Observable<any> {
  const subject = new Subject();

  const onNext = message => {
    console.log(message);
    subject.next({
      reply: 'Hello, world!'
    });
  };
  const onComplete = () => subject.complete();
  messages.subscribe({
    next: onNext,
    complete: onComplete,
  });


  return subject.asObservable();
}
```

> warning **Warning** To support full-duplex interaction with the `@GrpcStreamMethod()` decorator, the controller method must return an RxJS `Observable`.

> info **Hint** The `Metadata` class and the `ServerDuplexStream` interface are imported from the `@grpc/grpc-js` package.

According to the service definition in the `.proto` file, the `BidiHello` method streams requests to the service. To send multiple asynchronous messages to the stream from a client, use an RxJS `ReplaySubject`.

```typescript
const helloService = this.client.getService<HelloService>('HelloService');
const helloRequest$ = new ReplaySubject<HelloRequest>();

helloRequest$.next({ greeting: 'Hello (1)!' });
helloRequest$.next({ greeting: 'Hello (2)!' });
helloRequest$.complete();

return helloService.bidiHello(helloRequest$);
```

In the example above, we wrote two messages to the stream (the `next()` calls) and notified the service that we finished sending data (the `complete()` call).

#### Call stream handler

When the method's response is defined as a `stream`, the `@GrpcStreamCall()` decorator provides the function parameter as a `grpc.ServerDuplexStream`, which supports standard methods such as `.on('data', callback)`, `.write(message)`, and `.end()`. See the [gRPC Node.js API reference](https://grpc.github.io/grpc/node/grpc-ClientDuplexStream.html) for the full list of methods.

When the method's response is not a `stream`, the `@GrpcStreamCall()` decorator provides two function parameters: a `grpc.ServerReadableStream` (see the [`ServerReadableStream` reference](https://grpc.github.io/grpc/node/grpc-ServerReadableStream.html)) and a `callback`.

Let's start by implementing `BidiHello`, which supports full-duplex interaction.

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

> info **Hint** This decorator doesn't require the handler to return anything. You handle the stream as you would any other standard stream.

In the example above, we used the `write()` method to write objects to the response stream. The callback passed to the `.on()` method as the second parameter is called every time the service receives a new chunk of data.

Next, implement the `LotsOfGreetings` method.

```typescript
@GrpcStreamCall()
lotsOfGreetings(requestStream: any, callback: (err: unknown, value: HelloResponse) => void) {
  requestStream.on('data', message => {
    console.log(message);
  });
  requestStream.on('end', () => callback(null, { reply: 'Hello, world!' }));
}
```

Here, the `callback` function sends the response once the `requestStream` has been fully processed.

#### Health checks

When you run a gRPC application in an orchestrator such as Kubernetes, the orchestrator needs to know whether the application is running and healthy. The [gRPC Health Check specification](https://grpc.io/docs/guides/health-checking/) is a standard that lets gRPC servers expose their health status so that the orchestrator can act accordingly.

To add gRPC health check support, first install the [grpc-health-check](https://github.com/grpc/grpc-node/tree/master/packages/grpc-health-check) package:

```bash
$ npm i --save grpc-health-check
```

Then hook it into the gRPC service using the `onLoadPackageDefinition` hook in your gRPC server options, as follows. The `protoPath` must include both the health check and the hero `.proto` files.

```typescript
@@filename(main)
import { HealthImplementation, protoPath as healthCheckProtoPath } from 'grpc-health-check';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: [
      healthCheckProtoPath,
      join(import.meta.dirname, 'hero/hero.proto'),
    ],
    onLoadPackageDefinition: (pkg, server) => {
      const healthImpl = new HealthImplementation({
        '': 'UNKNOWN',
      });

      healthImpl.addToServer(server);
      healthImpl.setStatus('', 'SERVING');
    },
  },
});
```

> info **Hint** The [gRPC health probe](https://github.com/grpc-ecosystem/grpc-health-probe) is a CLI for testing gRPC health checks in a containerized environment.

#### gRPC Metadata

Metadata is information about a particular RPC call in the form of a list of key-value pairs, where the keys are strings and the values are typically strings but can be binary data. Metadata is opaque to gRPC itself: it lets the client provide information associated with the call to the server, and vice versa. Metadata may include authentication tokens, request identifiers and tags for monitoring purposes, and data information such as the number of records in a data set.

To read the metadata in a `@GrpcMethod()` handler, use the second argument (`metadata`), which is of type `Metadata` (imported from the `@grpc/grpc-js` package).

To send metadata back from the handler, use the `ServerUnaryCall#sendMetadata()` method (on the third handler argument).

```typescript
@@filename(heroes.controller)
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const serverMetadata = new Metadata();
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];

    serverMetadata.add('Set-Cookie', 'yummy_cookie=choco');
    call.sendMetadata(serverMetadata);

    return items.find(({ id }) => id === data.id);
  }
}
@@switch
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data, metadata, call) {
    const serverMetadata = new Metadata();
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];

    serverMetadata.add('Set-Cookie', 'yummy_cookie=choco');
    call.sendMetadata(serverMetadata);

    return items.find(({ id }) => id === data.id);
  }
}
```

Likewise, to read the metadata in handlers annotated with the `@GrpcStreamMethod()` decorator (see [Subject strategy](/microservices/grpc#subject-strategy)), use the second argument (`metadata`), which is of type `Metadata` (imported from the `@grpc/grpc-js` package).

To send metadata back from the handler, use the `ServerDuplexStream#sendMetadata()` method (on the third handler argument).

To read metadata from within [call stream handlers](/microservices/grpc#call-stream-handler) (handlers annotated with the `@GrpcStreamCall()` decorator), listen to the `metadata` event on the `requestStream` reference, as follows:

```typescript
requestStream.on('metadata', (metadata: Metadata) => {
  const meta = metadata.get('X-Meta');
});
```
