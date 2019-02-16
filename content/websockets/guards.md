### Guards

There is no difference between web sockets **guards** and the [regular guards](/guards). The only thing you should be aware of is that instead of throwing `HttpException`, you should use the `WsException`.

> info **Hint** The `WsException` class is exposed from `@nestjs/websockets` package.

#### Binding guards

Here is an example that makes use of a method-scoped guard (class-scoped works too):

```typescript
@@filename()
@UseGuards(AuthGuard)
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@UseGuards(AuthGuard)
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
```
