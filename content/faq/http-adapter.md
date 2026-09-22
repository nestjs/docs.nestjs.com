### HTTP adapter

Occasionally, you may need to access the underlying HTTP server, either from within the Nest application context or from outside of it.

Every native (platform-specific) HTTP server or library instance (e.g., Express or Fastify) is wrapped in an **adapter**. The adapter is registered as a globally available provider, so you can retrieve it from the application context or inject it into other providers.

#### Outside application context strategy

To get a reference to the `HttpAdapter` from outside of the application context, call the `getHttpAdapter()` method:

```typescript
@@filename()
const app = await NestFactory.create(AppModule);
const httpAdapter = app.getHttpAdapter();
```

#### As injectable

To get a reference to the `HttpAdapterHost` from within the application context, inject it like any other provider (e.g., using constructor injection):

```typescript
@@filename()
export class CatsService {
  constructor(private adapterHost: HttpAdapterHost) {}
}
@@switch
@Dependencies(HttpAdapterHost)
export class CatsService {
  constructor(adapterHost) {
    this.adapterHost = adapterHost;
  }
}
```

> info **Hint** The `HttpAdapterHost` is imported from the `@nestjs/core` package.

The `HttpAdapterHost` is **not** an actual `HttpAdapter`. To get the actual `HttpAdapter` instance, read its `httpAdapter` property:

```typescript
const adapterHost = app.get(HttpAdapterHost);
const httpAdapter = adapterHost.httpAdapter;
```

The `httpAdapter` is the HTTP adapter instance that wraps the underlying framework. It is an instance of either `ExpressAdapter` or `FastifyAdapter` (both classes extend `AbstractHttpAdapter`).

The adapter object exposes several methods for interacting with the HTTP server. To access the library instance (e.g., the Express instance) directly, call the `getInstance()` method:

```typescript
const instance = httpAdapter.getInstance();
```

#### Listening event

To run code when the server starts listening for incoming requests, subscribe to the `listen$` stream:

```typescript
this.httpAdapterHost.listen$.subscribe(() =>
  console.log('HTTP server is listening'),
);
```

The `HttpAdapterHost` also exposes a `listening` boolean property that indicates whether the server is currently listening:

```typescript
if (this.httpAdapterHost.listening) {
  console.log('HTTP server is listening');
}
```
