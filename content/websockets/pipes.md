### Pipes

There is no fundamental difference between [regular pipes](/pipes) and WebSocket pipes. The only difference is that instead of throwing `HttpException`, you should throw `WsException`. Only a `WsException` reaches the client with its own message. Any other exception, including the `BadRequestException` that the built-in validation pipes throw by default, is reported to the client as `'Internal server error'`.

> info **Hint** The `WsException` class is exposed from the `@nestjs/websockets` package.

#### Binding pipes

The following example uses a manually instantiated method-scoped pipe. As with HTTP-based applications, you can also use gateway-scoped pipes (i.e., decorate the gateway class with `@UsePipes()`). Global pipes registered with `app.useGlobalPipes()` or the `APP_PIPE` token apply to gateways as well.

```typescript
@@filename()
@UsePipes(new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }))
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
@@switch
@UsePipes(new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }))
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
```

Method-, gateway-, and global-scoped pipes run for every parameter of the message handler. To transform or validate only the message payload, bind the pipe at the parameter level instead, e.g., `@MessageBody(new ParseIntPipe())` or `@MessageBody('id', ParseIntPipe)`.

#### Schema-based validation

Like the HTTP parameter decorators, `@MessageBody()` accepts an options object with a `schema` property. The schema can come from any [Standard Schema](https://standardschema.dev/) compatible library, such as Zod, Valibot, or ArkType. The built-in `StandardSchemaValidationPipe` validates the payload against that schema, and passes parameters without a schema through unchanged. See [Schema-based validation](/application/validation#schema-based-validation) for details.

```typescript
@@filename()
@UsePipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: (issues) => new WsException(issues),
  }),
)
@SubscribeMessage('events')
handleEvent(@MessageBody({ schema: createEventSchema }) data: CreateEventDto) {
  return data;
}
@@switch
@UsePipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: (issues) => new WsException(issues),
  }),
)
@Bind(MessageBody({ schema: createEventSchema }))
@SubscribeMessage('events')
handleEvent(data) {
  return data;
}
```

To extract a single property and validate it, pass the property key first: `@MessageBody('id', {{ '{' }} schema: z.number() {{ '}' }})`.
