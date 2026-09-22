### Hybrid application

A hybrid application listens for requests from two or more different sources. It can combine an HTTP server with a microservice listener, or combine several different microservice listeners. The `createMicroservice()` method doesn't support multiple servers, so in this case you create and start each microservice manually. To do this, connect `INestMicroservice` instances to the `INestApplication` instance with the `connectMicroservice()` method.

```typescript
const app = await NestFactory.create(AppModule);
const microservice = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
});

await app.startAllMicroservices();
await app.listen(3001);
```

> info **Hint** The `app.listen(port)` method starts an HTTP server on the specified port. If your application doesn't handle HTTP requests, use the `app.init()` method instead.

> warning **Notice** The order of these calls matters. With `await app.startAllMicroservices()` first (as above), the microservices begin consuming messages **before** the application's lifecycle hooks (such as `onModuleInit` and `onApplicationBootstrap`) have completed. Call `app.listen()` (or `app.init()`) before `startAllMicroservices()` if your handlers must not receive messages until every module has fully initialized.

To connect multiple microservice instances, call `connectMicroservice()` once for each microservice:

```typescript
const app = await NestFactory.create(AppModule);
// microservice #1
const microserviceTcp = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
  options: {
    port: 3002,
  },
});
// microservice #2
const microserviceRedis = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});

await app.startAllMicroservices();
await app.listen(3001);
```

In a hybrid application with multiple microservices, you can bind `@MessagePattern()` to a single transport strategy (for example, NATS) by passing a second argument that identifies the transport. For the built-in strategies, this is a value of the `Transport` enum; for a [custom transporter](/microservices/custom-transport), it is the `transportId` symbol of its server class.

```typescript
@@filename()
@MessagePattern('time.us.*', Transport.NATS)
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@MessagePattern({ cmd: 'time.us' }, Transport.TCP)
getTCPDate(@Payload() data: number[]) {
  return new Date().toLocaleTimeString(...);
}
@MessagePattern('topic.time.us', XYZServer.Transport) // XYZServer is a custom transporter
getXYZDate(@Payload() data: number[]) {
  return new Date().toLocaleTimeString(...);
}
@@switch
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*', Transport.NATS)
getDate(data, context) {
  console.log(`Subject: ${context.getSubject()}`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@Bind(Payload(), Ctx())
@MessagePattern({ cmd: 'time.us' }, Transport.TCP)
getTCPDate(data, context) {
  return new Date().toLocaleTimeString(...);
}

@Bind(Payload())
@MessagePattern('topic.time.us', XYZServer.Transport)
getXYZDate(data) {
  return new Date().toLocaleTimeString(...);
}
```

> info **Hint** `@Payload()`, `@Ctx()`, `Transport` and `NatsContext` are imported from `@nestjs/microservices`. `XYZServer.Transport` here stands for the `transportId` symbol exposed by the custom transporter.

#### Sharing configuration

By default, connected microservices don't inherit the global pipes, interceptors, guards, and filters configured for the main (HTTP-based) application. This applies both to enhancers registered with the `useGlobal*()` methods and to those registered as providers with the `APP_PIPE`, `APP_INTERCEPTOR`, `APP_GUARD`, and `APP_FILTER` tokens.
To inherit this configuration, set the `inheritAppConfig` property in the options object passed as the second argument of `connectMicroservice()`:

```typescript
const microservice = app.connectMicroservice<MicroserviceOptions>(
  {
    transport: Transport.TCP,
  },
  { inheritAppConfig: true },
);
```

> info **Hint** A connected microservice registers its message handlers as soon as `connectMicroservice()` is called. When you use `inheritAppConfig`, call `app.useGlobalPipes()`, `app.useGlobalGuards()`, and the other `useGlobal*()` methods **before** `connectMicroservice()`, otherwise the enhancers they register won't apply to the microservice's handlers.
