### gRPC

The [gRPC](https://github.com/grpc/grpc-node) is a high-performance, open-source universal RPC framework.

#### Installation

Before we start, we have to install required package:

```bash
$ npm i --save grpc @grpc/proto-loader
```

#### Transporter

In order to switch to **gRPC** transporter, we need to modify an options object passed to the `createMicroservice()` method.

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

> info **Hint** The `join()` function is imported from `path` package, while `Transport` enum is coming from `@nestjs/microservices`.

#### Options

There are a bunch of available options that determine a transporter behavior.

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
        target="blank"
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
        target="blank"
        >read more</a
      >)
    </td>
  </tr>
</table>

#### Overview

In general, a `package` property sets a [protobuf](https://developers.google.com/protocol-buffers/docs/proto) package name, while `protoPath` is a path to the `.proto` definitions file. The `hero.proto` file is structured using protocol buffer language.

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

In the above example, we defined a `HeroService` that exposes a `FindOne()` gRPC handler which expects `HeroById` as an input and returns a `Hero` message. In order to define a handler that fulfills this protobuf definition, we have to use a `@GrpcMethod()` decorator. The previously known `@MessagePattern()` is no longer useful.

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

> info **Hint** The `@GrpcMethod()` decorator is imported from `@nestjs/microservices` package.

The `HeroService` is a service name, while `FindOne` points to a `FindOne()` gRPC handler. The corresponding `findOne()` method takes two arguments, the `data` passed from the caller and `metadata` that stores gRPC request's metadata.

Furthermore, the `FindOne` is actually redundant here. If you don't pass a second argument to the `@GrpcMethod()`, Nest will automatically use the method name with the capitalized first letter, for example, `findOne` -> `FindOne`.

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

Likewise, you might not pass any argument. In this case, Nest would use a class name.

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

In order to create a client instance, we need to use `@Client()` decorator.

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

There is a small difference compared to the previous examples. Instead of the `ClientProxy` class, we use the `ClientGrpc` that provides a `getService()` method. The `getService()` generic method takes service name as an argument and returns its instance if available.

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

The `heroService` object exposes the same set of methods that have been defined inside `.proto` file. Note, all of them are **lowercased** (in order to follow the natural convention). Basically, our gRPC `HeroService` definition contains `FindOne()` function. It means that `heroService` instance will provide the `findOne()` method.

```typescript
interface HeroService {
  findOne(data: { id: number }): Observable<any>;
}
```

All service methods return `Observable`. Since Nest supports [RxJS](https://github.com/reactivex/rxjs) streams and works pretty well with them, we can return them within HTTP handler as well.

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

### Advanced Protobuf and GRPC cases with Nest

#### Namespaced protobuf files and caveats

Sometimes API requires a more than common sophisticated set of entities to be established
for having better approach on generated code examples. Lets describe below supposed folder
structure with examples of proto files
```bash
_
 |
 |-service_name
 |     |
 |     |-orders
 |     |      |
 |     |      |-service.proto
 |     |      |-message.proto
 |     |
 |     |-common
 |     |      |-item_type.proto
 |     |      |-shipment_type.proto
 |     |
 |     |-service_name.proto
```
Folder structure described above have few caveats that need to be mention before we
will move into describing file contents. 

For NestJS this file-structure can be loaded with just pointing on the single file:
`service_name.proto` which need to just import all of the files with defined `service`
statement inside.

##### Contents of file-tree from above
```proto
// file: service_name/orders/service.proto

syntax = "proto3";
package service_name.orders;

service Orders {
  rpc find(Order) returns (Order);
  rpc sync(stream Order) returns (stream Order);
}
```
```proto
// file: service_name/orders/message.proto

syntax = "proto3";
package service_name.orders;

import public "service_name/common/item_type.proto";
import public "service_name/common/shipment_type.proto";

message Order {
  int32 id = 1;
  repeated service_name.common.ItemType itemTypes = 2;
  service_name.common.shipments.ShipmentType shipmentType = 3;
}
```
```proto
// file: service_name/common/item_type.proto

syntax = "proto3";
package service_name.common;

enum ItemType {
  DEFAULT = 0;
  SUPERIOR = 1;
  FLAWLESS = 2;
}
```
```proto
// file: service_name/common/shipment_type.proto

syntax = "proto3";
package service_name.common.shipments;

message ShipmentType {
  string from = 1;
  string to = 2;
  string carrier = 3;
}
```
```proto
// file: service_name/service_name.proto

syntax = "proto3";
import public "service_name/orders/service.proto";
```
Few things that are very important to note in file-examples above:
1) All `import` statements are lack of `./` or `../` relative directory symbols,
that is default behavior when designing protobufs with compatibility with other
platforms than Node.
2) All references to classes which were imported happened through calling their
namespace before their name: `service_name.common.shipments.ShipmentType`
3) All `import` statements started from `root` folder name

##### How to define loader statement for that case



#### gRPC Streaming
