### Hybrid application

A hybrid application is one that both listens for HTTP requests, as well as makes use of connected microservices. The `INestApplication` instance can be connected with `INestMicroservice` instances through the `connectMicroservice()` method. To connect multiple microservice instances, simply pass additional microservice configuration objects as arguments in a comma-separated list.

```typescript
const app = await NestFactory.create(AppModule);
const microservice = app.connectMicroservice({
  transport: Transport.TCP,
});

await app.startAllMicroservicesAsync();
await app.listen(3001);
```

#### Sharing configuration
By default hybrid application will not inherit global pipes, interceptors, guards & filters.
You'll need to set inheritAppConfig in the second argument as follow:

```typescript
const microservice = app.connectMicroservice({
  transport: Transport.TCP
}, { inheritAppConfig: true });
```