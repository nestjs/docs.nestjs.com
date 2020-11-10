### Pipes

There is no fundamental difference between [regular pipes](/pipes) and web sockets pipes. The only difference is that instead of throwing `HttpException`, you should use `WsException`. In addition, all pipes will be only applied to the `data` parameter (because validating or transforming `client` instance is useless).

> info **Hint** The `WsException` class is exposed from `@nestjs/websockets` package.

#### Binding pipes

The following example uses a manually instantiated method-scoped pipe. Just as with HTTP based applications, you can also use gateway-scoped pipes (i.e., prefix the gateway class with a `@UsePipes()` decorator).

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
