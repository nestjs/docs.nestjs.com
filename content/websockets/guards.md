### Guards

There is no fundamental difference between WebSocket guards and [regular HTTP application guards](/guards). The only difference is that instead of throwing `HttpException`, you should throw `WsException`. If a guard returns `false`, Nest throws a `WsException` with the message `'Forbidden resource'`.

> info **Hint** The `WsException` class is exposed from the `@nestjs/websockets` package.

#### Binding guards

The following example uses a method-scoped guard. As with HTTP-based applications, you can also use gateway-scoped guards (i.e., decorate the gateway class with `@UseGuards()`). Global guards registered with `app.useGlobalGuards()` or the `APP_GUARD` token apply to gateways as well.

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
