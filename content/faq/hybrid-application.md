### Hybrid Application

The **hybrid application** is an application that listens for HTTP requests, as well as makes use of connected microservices The `INestApplication` can be combined with the endless number of the `INestMicroservice` instances through `connectMicroservice()` method.

```typescript
const app = await NestFactory.create(ApplicationModule);
const microservice = app.connectMicroservice({
  transport: Transport.TCP,
});

await app.startAllMicroservicesAsync();
await app.listen(3001);
```
