### Pipes

There is no difference between microservices **pipes** and the [regular pipes](/pipes). The only thing you should be aware of is that instead of throwing `HttpException`, you should use the `RpcException`.

> info **Hint** The `RpcException` class is exposed from `@nestjs/microservices` package.

#### Binding pipes

Here is an example that makes use of a manually instantiated **method-scoped** pipe (class-scoped works either):

```typescript
@UsePipes(new ValidationPipe())
@MessagePattern({ cmd: 'sum' })
sum(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
```
