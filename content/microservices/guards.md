### Guards

There is no difference between microservices guards and the [regular guards](/guards). The only thing you should be aware of is that instead of throwing `HttpException`, you should use the `RpcException`.

> info **Hint** The `RpcException` class is exposed from `@nestjs/microservices` package.

#### Binding guards

Here is an example that makes use of a method-scoped guard (class-scoped works too):

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
