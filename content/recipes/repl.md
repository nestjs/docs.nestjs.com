### Read-Eval-Print-Loop (REPL)

REPL is a simple interactive environment that takes single user inputs, executes them, and returns the result to the user.
REPL feature lets you inspect your dependency graph and call methods on your providers (and controllers) directly from your terminal.

#### Usage

The REPL functionality is enabled when you call `repl` over some root NestJS module like so:

```typescript
@@filename(repl)
import { repl } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
@@switch
import { repl } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
```

And then start the app just like the usual:

```bash
$ npm run start --entryFile repl
```

> info **Hint** `repl` returns a [Node.js REPL server](https://nodejs.org/api/repl.html), thus you can customize it as you wish.

#### Demo

<a href="https://asciinema.org/a/503623" target="_blank"><img src="https://asciinema.org/a/503623.svg" width="636"/></a>

#### Native functions

The built-in NestJS REPL comes with few native functions that are globally available when you start the REPL.
You can call `help()` to list them out.

If you don't recall what's the signature (ie: expected parameters and return types) of some function, you can call `<function_name>.help`.
For instance:

```text
> $.help
Retrieves an instance of either injectable or controller, otherwise, throws exception.
Interface: $(token: InjectionToken) => any
```

> info **Hint** Those function interfaces are written in [TypeScript function type expression syntax](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions).

| Function | Description | Signature |
| -------- | ----------- | --------- |
| `debug`  | Print all registered modules as a list together with their controllers and providers. | `debug(moduleCls?: ClassRef \| string) => void`
| `get` or `$` | Retrieves an instance of either injectable or controller, otherwise, throws exception. | `get(token: InjectionToken) => any`
| `methods` | Display all public methods available on a given provider or controller. | `methods(token: ClassRef \| string) => void`
| `resolve` | Resolves transient or request-scoped instance of either injectable or controller, otherwise, throws exception. | `resolve(token: InjectionToken, contextId: any) => Promise<any>`
| `select` | Allows navigating through the modules tree, for example, to pull out a specific instance from the selected module. | `select(token: DynamicModule \| ClassRef) => INestApplicationContext`

