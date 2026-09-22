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
