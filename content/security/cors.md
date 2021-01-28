### CORS

Cross-origin resource sharing (CORS) is a mechanism that allows resources to be requested from another domain. Under the hood, Nest makes use of the Express [cors](https://github.com/expressjs/cors) package. This package provides various options that you can customize based on your requirements.

#### Getting started

To enable CORS, call the `enableCors()` method on the Nest application object.

```typescript
const app = await NestFactory.create(AppModule);
app.enableCors();
await app.listen(3000);
```

The `enableCors()` method takes an optional configuration object argument. The available properties of this object are described in the official [CORS](https://github.com/expressjs/cors#configuration-options) documentation.

Alternatively, enable CORS via the `create()` method's options object. Set the `cors` property to `true` to enable CORS with default settings. Alternatively, pass a [CORS configuration object](https://github.com/expressjs/cors#configuration-options) as the `cors` property value to customize its behavior.

```typescript
const app = await NestFactory.create(AppModule, { cors: true });
await app.listen(3000);
```

#### GraphQL

Above method only applies to REST endpoints. To enable CORS to GraphQL, set `cors` property to `true` or pass [CORS configuration object](https://github.com/expressjs/cors#configuration-options) as the `cors` property value when you import GraphQL module.

```typescript
@Module({
  imports: [
    GraphQLModule.forRoot({
      cors: {
        origin: 'http://localhost:3000',
        credentials: true,
      },
    }),
```
