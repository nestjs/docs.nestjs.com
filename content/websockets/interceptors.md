### Interceptors

There is no difference between [regular interceptors](/interceptors) and WebSocket interceptors. The following example uses a manually instantiated method-scoped interceptor. As with HTTP-based applications, you can also use gateway-scoped interceptors (i.e., decorate the gateway class with `@UseInterceptors()`). Global interceptors registered with `app.useGlobalInterceptors()` or the `APP_INTERCEPTOR` token apply to gateways as well.

```typescript
@@filename()
@UseInterceptors(new TransformInterceptor())
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@UseInterceptors(new TransformInterceptor())
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
```
