### Interceptors

There is no difference between [regular interceptors](/interceptors) and the web sockets interceptors. Here is an example that makes use of a manually instantiated **method-scoped** filter (class-scoped works too):

```typescript
@@filename()
@UseInterceptors(new TransformInterceptor())
@SubscribeMessage('events')
onEvent(client: Client, data: any): WsResponse<any> {
  const event = 'events';
  return { event, data };
}
@@switch
@UseInterceptors(new TransformInterceptor())
@SubscribeMessage('events')
onEvent(client, data) {
  const event = 'events';
  return { event, data };
}
```
