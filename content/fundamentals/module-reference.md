### Module reference

Nest provides the `ModuleRef` class to navigate the internal list of providers and obtain a reference to any provider, using its injection token as a lookup key. `ModuleRef` also lets you dynamically instantiate both static and scoped providers. Inject `ModuleRef` into a class like any other dependency:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(private moduleRef: ModuleRef) {}
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }
}
```

> info **Hint** The `ModuleRef` class is imported from the `@nestjs/core` package.

#### Retrieving instances

The `ModuleRef` instance (hereafter referred to as the **module reference**) has a `get()` method. By default, this method uses an injection token or class name to return a provider, controller, or injectable (e.g., a guard or interceptor) that was registered and instantiated in the *current module*. If the instance is not found, an exception is thrown.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  private service: Service;
  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    this.service = this.moduleRef.get(Service);
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  onModuleInit() {
    this.service = this.moduleRef.get(Service);
  }
}
```

> warning **Warning** You can't retrieve scoped providers (transient or request-scoped, including providers that are implicitly request-scoped through their dependencies) with the `get()` method. Instead, use the technique described in <a href="/fundamentals/module-ref#resolving-scoped-providers">Resolving scoped providers</a> below. Learn how to control scopes in the [injection scopes](/fundamentals/injection-scopes) chapter.

To retrieve a provider from the global context (for example, if the provider was registered in a different module), pass the `{{ '{' }} strict: false {{ '}' }}` option as the second argument to `get()`.

```typescript
this.moduleRef.get(Service, { strict: false });
```

#### Resolving scoped providers

To dynamically resolve a scoped provider (transient or request-scoped), use the `resolve()` method, passing the provider's injection token as an argument.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  private transientService: TransientService;
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.transientService = await this.moduleRef.resolve(TransientService);
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    this.transientService = await this.moduleRef.resolve(TransientService);
  }
}
```

The `resolve()` method returns a unique instance of the provider from its own **DI container sub-tree**. Each sub-tree has a unique **context identifier**, so if you call this method more than once and compare the instance references, you'll see that they are not equal.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService),
      this.moduleRef.resolve(TransientService),
    ]);
    console.log(transientServices[0] === transientServices[1]); // false
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService),
      this.moduleRef.resolve(TransientService),
    ]);
    console.log(transientServices[0] === transientServices[1]); // false
  }
}
```

To get a single instance across multiple `resolve()` calls, and ensure they share the same generated DI container sub-tree, pass a context identifier to the `resolve()` method. Use the `ContextIdFactory` class to generate a context identifier: its `create()` method returns a new unique identifier.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    const contextId = ContextIdFactory.create();
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService, contextId),
      this.moduleRef.resolve(TransientService, contextId),
    ]);
    console.log(transientServices[0] === transientServices[1]); // true
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    const contextId = ContextIdFactory.create();
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService, contextId),
      this.moduleRef.resolve(TransientService, contextId),
    ]);
    console.log(transientServices[0] === transientServices[1]); // true
  }
}
```

> info **Hint** The `ContextIdFactory` class is imported from the `@nestjs/core` package.

#### Registering `REQUEST` provider

Manually generated context identifiers (created with `ContextIdFactory.create()`) represent DI sub-trees in which the `REQUEST` provider is `undefined`, because these sub-trees are not instantiated and managed by the Nest dependency injection system.

To register a custom `REQUEST` object for a manually created DI sub-tree, use the `ModuleRef#registerRequestByContextId()` method:

```typescript
const contextId = ContextIdFactory.create();
this.moduleRef.registerRequestByContextId(/* YOUR_REQUEST_OBJECT */, contextId);
```

#### Getting current sub-tree

Occasionally, you may want to resolve an instance of a request-scoped provider within a **request context**. Suppose `CatsService` is request-scoped, and you want to resolve the `CatsRepository` instance, which is also a request-scoped provider. To share the same DI container sub-tree, you must obtain the current context identifier instead of generating a new one (e.g., with the `ContextIdFactory.create()` function, as shown above). To obtain the current context identifier, start by injecting the request object with the `@Inject()` decorator:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    @Inject(REQUEST) private request: Record<string, unknown>,
  ) {}
}
@@switch
@Injectable()
@Dependencies(REQUEST)
export class CatsService {
  constructor(request) {
    this.request = request;
  }
}
```

> info **Hint** Learn more about the request provider in the [Request provider](/fundamentals/injection-scopes#request-provider) section of the injection scopes chapter.

Now use the `getByRequest()` method of the `ContextIdFactory` class to get the context identifier associated with the request object, and pass it to the `resolve()` call:

```typescript
const contextId = ContextIdFactory.getByRequest(this.request);
const catsRepository = await this.moduleRef.resolve(CatsRepository, contextId);
```

#### Instantiating custom classes dynamically

To dynamically instantiate a class that **wasn't previously registered** as a **provider**, use the module reference's `create()` method:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  private catsFactory: CatsFactory;
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.catsFactory = await this.moduleRef.create(CatsFactory);
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    this.catsFactory = await this.moduleRef.create(CatsFactory);
  }
}
```

This technique lets you conditionally instantiate different classes outside of the framework container.

<app-banner-devtools></app-banner-devtools>
