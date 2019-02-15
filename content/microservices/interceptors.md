### Interceptors

There is no difference between [regular interceptors](/interceptors) and the microservices interceptors. Here is an example that makes use of a manually instantiated **method-scoped** guard (class-scoped works either):

```typescript
@UseInterceptors(new TransformInterceptor())
@MessagePattern({ cmd: 'sum' })
sum(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
```
