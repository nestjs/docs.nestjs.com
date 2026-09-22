### Pipes

Microservice pipes work the same way as [regular pipes](/pipes). The only difference is that they should throw `RpcException` instead of `HttpException`. Unless a custom exception filter handles it, an `HttpException` thrown during message handling reaches the client as a generic `Internal server error` message.

> info **Hint** The `RpcException` class is exposed from the `@nestjs/microservices` package.

#### Binding pipes

The following example uses a manually instantiated method-scoped pipe. The `exceptionFactory` option makes `ValidationPipe` throw an `RpcException` instead of its default `BadRequestException`. As with HTTP-based applications, you can also use controller-scoped pipes (i.e., prefix the controller class with a `@UsePipes()` decorator).

```typescript
@@filename()
@UsePipes(new ValidationPipe({ exceptionFactory: (errors) => new RpcException(errors) }))
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
@@switch
@UsePipes(new ValidationPipe({ exceptionFactory: (errors) => new RpcException(errors) }))
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
```

The `@Payload()` decorator also accepts a `schema` option, which lets `StandardSchemaValidationPipe` (exported from `@nestjs/common`) validate the payload against a [Standard Schema](/application/validation#schema-based-validation) (e.g., a Zod schema). Configure its `exceptionFactory` option in the same way, so that validation errors are thrown as `RpcException`:

```typescript
@@filename()
@UsePipes(new StandardSchemaValidationPipe({ exceptionFactory: (issues) => new RpcException(issues) }))
@MessagePattern({ cmd: 'sum' })
accumulate(@Payload({ schema: z.array(z.number()) }) data: number[]): number {
  return data.reduce((a, b) => a + b, 0);
}
@@switch
@UsePipes(new StandardSchemaValidationPipe({ exceptionFactory: (issues) => new RpcException(issues) }))
@Bind(Payload({ schema: z.array(z.number()) }))
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return data.reduce((a, b) => a + b, 0);
}
```

> info **Hint** Global pipes registered on the main HTTP application don't apply to microservices connected to a [hybrid application](/faq/hybrid-application) unless you set the `inheritAppConfig` option. See [sharing configuration](/faq/hybrid-application#sharing-configuration).
