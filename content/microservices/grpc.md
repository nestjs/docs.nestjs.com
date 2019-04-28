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

Sometimes API requires a more than a common sophisticated set of entities
to be established for having a better approach on generated code examples.
Let's describe below approximate folder structure with examples of proto files.
```bash
_
 |
 |-example
 |     |
 |     |-orders
 |     |      |
 |     |      |-service.proto
 |     |      |-message.proto
 |     |
 |     |-common
 |     |      |-item_types.proto
 |     |      |-shipment_types.proto
 |     |
 |     |-root.proto
```
Folder structure described above have few caveats that need to be mention before we
will move into describing file contents. 

For NestJS this file-structure can be loaded with just pointing on the single file:
`service_name.proto` which need to just import all of the files with defined service
statement inside.


##### Contents of file-tree from above

<table style="table-layout: fixed; width:100%; font-size: 0.8em; line-height: 1.8em;">

<tr>
<td>
example/orders/service.proto
</td>
<td>
example/orders/message.proto
</td>
</tr>
 
<tr>

<td style="overflow-x:scroll">
<pre style="overflow: inherit;">
syntax = "proto3";
import "orders/message.proto";
package proto_example.orders;
&nbsp;
service OrderService &#123;
    rpc Find&#40;Order&#41; returns &#40;Order&#41;;
    rpc Sync&#40;stream Order&#41; returns &#40;stream Order&#41;;
    rpc SyncCall&#40;stream Order&#41; returns &#40;stream Order&#41;;
&#125;
</pre>
</td>

<td style="overflow-x:scroll">
<pre style="overflow: inherit;">
syntax = "proto3";
package proto_example.orders;
import public "common/item_types.proto";
import public "common/shipment_types.proto";
&nbsp;
message Order &#123;
    int32 id = 1;
    repeated common.items.ItemType itemTypes = 2;
    common.shipments.ShipmentType shipmentType = 3;
&#125;
</pre>
</td>

</tr>

<tr>
<td>
example/common/item_types.proto
</td>
<td>
example/common/shipment_types.proto
</td>
</tr>

<tr>

<td style="overflow-x:scroll">
<pre style="overflow: inherit;">
syntax = "proto3";
package proto_example.common.items;
&nbsp;
enum ItemType &#123;
    DEFAULT = 0;
    SUPERIOR = 1;
    FLAWLESS = 2;
&#125;
</pre>
</td>
  
<td style="overflow-x:scroll">
<pre style="overflow: inherit;">
syntax = "proto3";
package proto_example.common.shipments;
&nbsp;
message ShipmentType &#123;
    string from = 1;
    string to = 2;
    string carrier = 3;
&#125;
</pre>
</td>

</tr>

<tr>
<td>
example/root.proto
</td>
<td>
 &nbsp;
</td>
</tr>

<tr>

<td style="overflow-x:scroll">
<pre style="overflow: inherit;">
syntax = "proto3";
package proto_example;
import public "orders/service.proto";
</pre>
</td>
  
<td></td>
  
</tr>

</table>

> info **Important** Few things need to be noted for file-examples above:\
1) All `import` statements are lack of `./` or `../` relative directory symbols,
that is default behavior when designing protobufs with compatibility with other
platforms than Node.\
2) All references to classes which were imported happened through calling their
namespace before their name: `common.shipments.ShipmentType`\
3) All `import` statements started relative to proto `root` folder name

##### How to define loader statement for that case

To load this set of proto-files within one shot we need to adjust our loader
descriptor for a few tiny changes:

```javascript
{
  transport: Transport.GRPC,
  options: {
    package: 'proto_example',
    protoPath: 'root.proto',
    loader: {
      includeDirs: [Path.join(__dirname, 'example')]
    }
  }
}
```
Related to simplified set of options in the beginning of this
article here are few important changes:
- `options.loader.includeDirs` is introduced and need to point to the root of `proto`
files directory
- `options.protoPath` now points to single file which imports all `service` files presented
for certain implementation type, in our example it is `root.proto`.



#### gRPC Streaming
GRPC on it's own supports long-term live connections more known as `streams`. 
Streams can be a very useful instrument for such service cases as Chatting, Observations
or Chunk-data transfers.

Nest supports GRPC stream handlers in two possible ways:
- `RXJS Subject + Observable` handler: can be useful to write 
responses right inside of a Controller method or to be passed down
to Subject/Observable consumer
- `Pure GRPC call stream` handler: can be useful to be passed
to some executor which will handle the rest of dispatch for
the Node standard `Duplex` stream handler.

##### GrpcStreamMethod
```typescript
@GrpcStreamMethod('orders.OrderService')
async sync(messages: Observable<any>): Observable<any> {
  const s = new Subject();
  const o = s.asObservable();
  messages.subscribe(msg => {
    s.next({
      id: 1,
      itemTypes: [1],
      shipmentType: {
        from: 'test',
        to: 'test1',
        carrier: 'test-carrier',
      },
    });
  });
  return o;
}
```
For support full-duplex interaction with `GrpcStreamMethod` decorator it is required that Observable Subject
will be passed to a return statement of a Controller method.

##### GrpcStreamCall
```typescript
@GrpcStreamCall('orders.OrderService')
async syncCall(stream: any): void {
  stream.on('data', (msg: any) => {
    stream.write({
      id: 1,
      itemTypes: [1],
      shipmentType: {
        from: 'test',
        to: 'test1',
        carrier: 'test-carrier',
      },
    });
  });
}
```
For the stream call it is `grpc.ServerDuplexStream` object type will be passed down to the method.
This stream type extending standard Node Duplex stream, so it is having a very similar interface to interact with.
