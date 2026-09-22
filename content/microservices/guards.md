### Guards

Microservice guards work the same way as [regular HTTP application guards](/guards). The only difference is that they should throw `RpcException` instead of `HttpException`. When a guard returns `false`, Nest throws an `RpcException` with the `Forbidden resource` message.

> info **Hint** The `RpcException` class is exposed from the `@nestjs/microservices` package.

#### Binding guards

The following example uses a method-scoped guard. As with HTTP-based applications, you can also use controller-scoped guards (i.e., prefix the controller class with a `@UseGuards()` decorator).

```typescript
@@filename()
@UseGuards(AuthGuard)
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@UseGuards(AuthGuard)
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```

> info **Hint** Global guards registered on the main HTTP application don't apply to microservices connected to a [hybrid application](/faq/hybrid-application) unless you set the `inheritAppConfig` option. See [sharing configuration](/faq/hybrid-application#sharing-configuration).
