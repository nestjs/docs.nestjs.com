### Pipes

There is no difference between web sockets **pipes** and the [regular pipes](/pipes). The only thing you should be aware of is that instead of throwing `HttpException`, you should use the `WsException`. Besides, all pipes will be applied only to the `data` parameter (because either validating or transforming `client` instance sounds awkward).

> info **Hint** The `WsException` class is exposed from `@nestjs/websockets` package.

#### Binding pipes

Here is an example that makes use of a manually instantiated method-scoped pipe (class-scoped works too):

```typescript
@@filename()
@UsePipes(new ValidationPipe())
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@UsePipes(new ValidationPipe())
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
```
