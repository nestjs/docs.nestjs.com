### CORS

Cross-origin resource sharing (CORS) is a mechanism that allows resources to be requested from another domain. Under the hood, Nest uses the Express [cors](https://github.com/expressjs/cors) package or the Fastify [@fastify/cors](https://github.com/fastify/fastify-cors) package, depending on the underlying platform. These packages provide various options that you can customize to your requirements.

#### Getting started

To enable CORS, call the `enableCors()` method on the Nest application object.

```typescript
const app = await NestFactory.create(AppModule);
app.enableCors();
await app.listen(process.env.PORT ?? 3000);
```

The `enableCors()` method takes an optional configuration object. Its available properties are described in the official [CORS configuration options](https://github.com/expressjs/cors#configuration-options) documentation. Alternatively, pass a [callback function](https://github.com/expressjs/cors#customizing-cors-settings-dynamically-per-request) that computes the configuration object for each request.

You can also enable CORS through the options object of the `create()` method. Set the `cors` property to `true` to enable CORS with default settings, or pass a [CORS configuration object](https://github.com/expressjs/cors#configuration-options) or [callback function](https://github.com/expressjs/cors#customizing-cors-settings-dynamically-per-request) as the `cors` property value to customize its behavior.

```typescript
const app = await NestFactory.create(AppModule, { cors: true });
await app.listen(process.env.PORT ?? 3000);
```

#### Default allowed methods

The two packages do not share the same defaults, so `enableCors()` with no options does not advertise the same `Access-Control-Allow-Methods` on both platforms. The Express [cors](https://github.com/expressjs/cors) package answers `GET,HEAD,PUT,PATCH,POST,DELETE`, while [@fastify/cors](https://github.com/fastify/fastify-cors) answers only the [CORS-safelisted methods](https://fetch.spec.whatwg.org/#methods): `GET,HEAD,POST`.

> warning **Warning** On Fastify, a cross-origin `PUT`, `PATCH`, or `DELETE` is rejected at the preflight stage unless you list the method yourself. The same application code works on Express.

Both packages read the same `methods` option, so define it explicitly whenever your API is called from another origin with a method outside the safelist. It is accepted by `enableCors()` and by the `cors` property of the `create()` options object alike.

```typescript
app.enableCors({
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
});
```
