### Hybrid application

A hybrid application is one that both listens for HTTP requests, as well as makes use of connected microservices. The `INestApplication` instance can be connected with `INestMicroservice` instances through the `connectMicroservice()` method.

```typescript
const app = await NestFactory.create(AppModule);
const microservice = app.connectMicroservice({
  transport: Transport.TCP,
});

await app.startAllMicroservicesAsync();
await app.listen(3001);
```

To connect multiple microservice instances, issue the call to `connectMicroservice()` for each microservice:

```typescript
const app = await NestFactory.create(AppModule);
// microservice #1
const microserviceTcp = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
  options: {
    port: 3001,
  },
});
// microservice #2
const microserviceRedis = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.REDIS,
  options: {
    url: 'redis://localhost:6379',
  },
});

await app.startAllMicroservicesAsync();
await app.listen(3001);
```

#### Sharing configuration

By default a hybrid application will not inherit global pipes, interceptors, guards and filters configured for the main (HTTP-based) application.
To inherit these configuration properties from the main application, set the `inheritAppConfig` property in the second argument (an optional options object) of the `connectMicroservice()` call, as follow:

```typescript
const microservice = app.connectMicroservice({
  transport: Transport.TCP
}, { inheritAppConfig: true });
```
