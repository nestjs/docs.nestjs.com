### Interceptors

There is no difference between [regular interceptors](/interceptors) and WebSocket interceptors. The following example uses a manually instantiated method-scoped interceptor. As with HTTP-based applications, you can also use gateway-scoped interceptors (i.e., decorate the gateway class with `@UseInterceptors()`). Global interceptors registered with `app.useGlobalInterceptors()` or the `APP_INTERCEPTOR` token apply to gateways as well.

```typescript
@@filename()
@UseInterceptors(new TransformInterceptor())
@SubscribeMessage('events')
handleEvent(@MessageBody() data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@UseInterceptors(new TransformInterceptor())
@Bind(MessageBody())
@SubscribeMessage('events')
handleEvent(data) {
  const event = 'events';
  return { event, data };
}
```

> info **Hint** Interceptors only see the handler's return value. Messages you emit directly through the socket (e.g., `client.emit()` or `server.emit()`) bypass them. To let interceptors process a response, return it from the handler.