### CQRS

The flow of simple [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) (Create, Read, Update and Delete) applications can be described as follows:

1. The controllers layer handles HTTP requests and delegates tasks to the services layer.
2. The services layer is where most of the business logic lives.
3. Services use repositories or DAOs to change and persist entities.
4. Entities act as containers for values, with setters and getters.

While this pattern is usually sufficient for small and medium-sized applications, it may not be the best choice for larger, more complex ones. In such cases, the **CQRS** (Command and Query Responsibility Segregation) model may be more appropriate and scalable, depending on the application's requirements. Benefits of this model include:

- **Separation of concerns**. Read and write operations are handled by separate models.
- **Scalability**. Read and write operations can be scaled independently.
- **Flexibility**. Reads and writes can use different data stores.
- **Performance**. Each data store can be optimized for its workload (reads or writes).

To support this model, Nest provides a lightweight [CQRS module](https://github.com/nestjs/cqrs). This chapter describes how to use it.

#### Installation

First, install the required package:

```bash
$ npm install --save @nestjs/cqrs
```

Once the installation is complete, open the root module of your application (usually `AppModule`) and import `CqrsModule.forRoot()`:

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule.forRoot()],
})
export class AppModule {}
```

`forRoot()` accepts an optional configuration object. To provide the options asynchronously (e.g., from a configuration service), use `CqrsModule.forRootAsync()` instead. The following options are available:

| Attribute                     | Description                                                                                                                  | Default                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `commandPublisher`            | The publisher responsible for dispatching commands to the system.                                                            | `DefaultCommandPubSub`            |
| `eventPublisher`              | The publisher used to publish events, allowing them to be broadcasted or processed.                                          | `DefaultPubSub`                   |
| `queryPublisher`              | The publisher used for publishing queries, which can trigger data retrieval operations.                                      | `DefaultQueryPubSub`              |
| `unhandledExceptionPublisher` | The publisher used to publish unhandled exceptions to the `UnhandledExceptionBus`.                                           | `DefaultUnhandledExceptionPubSub` |
| `eventIdProvider`             | Service that retrieves unique event IDs from event instances.                                                                | `DefaultEventIdProvider`          |
| `rethrowUnhandled`            | Whether exceptions thrown by event handlers and sagas are rethrown instead of being published to the `UnhandledExceptionBus`. | `false`                           |

#### Commands

Commands change the application state. They should be task-based rather than data-centric. When a command is dispatched, it is handled by a corresponding **command handler**, which is responsible for updating the application state.

```typescript
@@filename(heroes-game.service)
@Injectable()
export class HeroesGameService {
  constructor(private commandBus: CommandBus) {}

  async killDragon(heroId: string, killDragonDto: KillDragonDto) {
    return this.commandBus.execute(
      new KillDragonCommand(heroId, killDragonDto.dragonId)
    );
  }
}
@@switch
@Injectable()
@Dependencies(CommandBus)
export class HeroesGameService {
  constructor(commandBus) {
    this.commandBus = commandBus;
  }

  async killDragon(heroId, killDragonDto) {
    return this.commandBus.execute(
      new KillDragonCommand(heroId, killDragonDto.dragonId)
    );
  }
}
```

The code above instantiates the `KillDragonCommand` class and passes it to the `execute()` method of the `CommandBus`. Here is the command class:

```typescript
@@filename(kill-dragon.command)
export class KillDragonCommand extends Command<{
  actionId: string // This type represents the command execution result
}> {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {
    super();
  }
}
@@switch
export class KillDragonCommand extends Command {
  constructor(heroId, dragonId) {
    super();
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}
```

The `KillDragonCommand` class extends the `Command` class, a utility class exported from the `@nestjs/cqrs` package that lets you define the command's return type. In this case, the return type is an object with an `actionId` property. Whenever the `KillDragonCommand` command is dispatched, the return type of the `CommandBus#execute()` method is inferred as `Promise<{{ '{' }} actionId: string {{ '}' }}>`. This is useful when the command handler returns data to the caller.

> info **Hint** Extending the `Command` class is optional. You only need it to define the command's return type.

The `CommandBus` represents a **stream** of commands. It dispatches commands to the appropriate handlers. The `execute()` method returns a promise that resolves to the value returned by the handler.

Let's create a handler for the `KillDragonCommand` command.

```typescript
@@filename(kill-dragon.handler)
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(private repository: HeroesRepository) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;
    const hero = this.repository.findOneById(+heroId);

    hero.killEnemy(dragonId);
    await this.repository.persist(hero);

    // "ICommandHandler<KillDragonCommand>" forces you to return a value that matches the command's return type
    return {
      actionId: crypto.randomUUID(), // This value will be returned to the caller
    }
  }
}
@@switch
@CommandHandler(KillDragonCommand)
@Dependencies(HeroesRepository)
export class KillDragonHandler {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(command) {
    const { heroId, dragonId } = command;
    const hero = this.repository.findOneById(+heroId);

    hero.killEnemy(dragonId);
    await this.repository.persist(hero);

    // "ICommandHandler<KillDragonCommand>" forces you to return a value that matches the command's return type
    return {
      actionId: crypto.randomUUID(), // This value will be returned to the caller
    }
  }
}
```

This handler retrieves the `Hero` entity from the repository, calls its `killEnemy()` method, and then persists the changes. The `KillDragonHandler` class implements the `ICommandHandler` interface, which requires an `execute()` method. The `execute()` method receives the command object as an argument.

`ICommandHandler<KillDragonCommand>` requires `execute()` to return a value that matches the command's return type (here, an object with an `actionId` property). This only applies to commands that extend the `Command` class. For other commands, the return type isn't constrained.

Finally, register the `KillDragonHandler` as a provider in a module:

```typescript
providers: [KillDragonHandler];
```

#### Queries

Queries retrieve data from the application state. They should be data-centric rather than task-based. When a query is dispatched, it is handled by a corresponding **query handler**, which is responsible for retrieving the data.

The `QueryBus` follows the same pattern as the `CommandBus`. Query handlers implement the `IQueryHandler` interface and are annotated with the `@QueryHandler()` decorator. Start with the query class:

```typescript
export class GetHeroQuery extends Query<Hero> {
  constructor(public readonly heroId: string) {
    super();
  }
}
```

Like the `Command` class, the `Query` class is a utility class exported from the `@nestjs/cqrs` package that lets you define the query's return type. In this case, the return type is a `Hero` object. Whenever the `GetHeroQuery` query is dispatched, the return type of the `QueryBus#execute()` method is inferred as `Promise<Hero>`.

To retrieve the hero, create a query handler:

```typescript
@@filename(get-hero.handler)
@QueryHandler(GetHeroQuery)
export class GetHeroHandler implements IQueryHandler<GetHeroQuery> {
  constructor(private repository: HeroesRepository) {}

  async execute(query: GetHeroQuery) {
    return this.repository.findOneById(query.heroId);
  }
}
@@switch
@QueryHandler(GetHeroQuery)
@Dependencies(HeroesRepository)
export class GetHeroHandler {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(query) {
    return this.repository.findOneById(query.heroId);
  }
}
```

The `GetHeroHandler` class implements the `IQueryHandler` interface, which requires an `execute()` method. The `execute()` method receives the query object as an argument and must return data that matches the query's return type (in this case, a `Hero` object).

Finally, register the `GetHeroHandler` as a provider in a module:

```typescript
providers: [GetHeroHandler];
```

To dispatch the query, use the `QueryBus`:

```typescript
const hero = await this.queryBus.execute(new GetHeroQuery(heroId)); // "hero" will be auto-inferred as "Hero" type
```

#### Events

Events notify other parts of the application about changes in the application state. They are dispatched by **models** or directly through the `EventBus`. When an event is dispatched, it is handled by the corresponding **event handlers**, which can, for example, update the read model.

For demonstration purposes, let's create an event class:

```typescript
@@filename(hero-killed-dragon.event)
export class HeroKilledDragonEvent {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {}
}
@@switch
export class HeroKilledDragonEvent {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}
```

While you can dispatch events directly with the `EventBus.publish()` method, you can also dispatch them from the model. Let's update the `Hero` model to dispatch the `HeroKilledDragonEvent` event when the `killEnemy()` method is called.

```typescript
@@filename(hero.model)
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
  }

  killEnemy(enemyId: string) {
    // Business logic
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}
@@switch
export class Hero extends AggregateRoot {
  constructor(id) {
    super();
    this.id = id;
  }

  killEnemy(enemyId) {
    // Business logic
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}
```

The `apply()` method dispatches events. It accepts an event object as an argument. However, the model isn't aware of the `EventBus`, so you need to connect the two. The `EventPublisher` class does that:

```typescript
@@filename(kill-dragon.handler)
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(
    private repository: HeroesRepository,
    private publisher: EventPublisher,
  ) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );
    hero.killEnemy(dragonId);
    hero.commit();

    return {
      actionId: crypto.randomUUID(),
    };
  }
}
@@switch
@CommandHandler(KillDragonCommand)
@Dependencies(HeroesRepository, EventPublisher)
export class KillDragonHandler {
  constructor(repository, publisher) {
    this.repository = repository;
    this.publisher = publisher;
  }

  async execute(command) {
    const { heroId, dragonId } = command;
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );
    hero.killEnemy(dragonId);
    hero.commit();

    return {
      actionId: crypto.randomUUID(),
    };
  }
}
```

The `EventPublisher#mergeObjectContext` method merges the event publisher into the provided object. This object must implement the `IAggregateRoot` interface (or extend the `AggregateRoot` class). Once merged, the object can publish events to the event stream.

Events applied with `apply()` are queued until you call the model's `commit()` method, which dispatches all outstanding events. To dispatch events as soon as they are applied, set the `autoCommit` property to `true`:

```typescript
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
    this.autoCommit = true;
  }
}
```

To merge the event publisher into a class rather than into an existing object, use the `EventPublisher#mergeClassContext` method:

```typescript
const HeroModel = this.publisher.mergeClassContext(Hero);
const hero = new HeroModel('id'); // <-- HeroModel is a class
```

Every instance of the `HeroModel` class can now publish events without calling the `mergeObjectContext()` method.

#### Flexible Aggregate Roots

The `AggregateRoot` class is a base class that you can extend to add event-driven capabilities to your domain models. However, this approach requires domain entities to extend `AggregateRoot` directly, which can be a limitation if your application already has an established entity inheritance hierarchy (e.g., a base `Entity` class or domain-specific base classes such as `Monster` or `Vehicle`).

For more flexibility, the `@nestjs/cqrs` package supports three approaches to implementing aggregate roots:

**Approach 1: Traditional (Class Inheritance)**

This is the standard approach shown in the previous examples. It works well for simple scenarios and greenfield projects.

```typescript
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
  }

  killEnemy(enemyId: string) {
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}
```

**Approach 2: Mixin (For existing hierarchies)**

If you already have a base class and can't extend `AggregateRoot` directly, use the `WithAggregateRoot<EventBase, TBase>()` mixin function. It applies aggregate root behavior to any existing base class.

```typescript
@@filename(dragon.model)
abstract class Monster {
  constructor(protected readonly id: string) {}
  abstract roar(): void;
}

export class Dragon extends WithAggregateRoot(Monster) {
  roar(): void {
    console.log('Roarrrr!');
  }

  die(): void {
    this.roar();
    this.apply(new DragonDiedEvent(this.id)); // Provided by the mixin
  }
}
@@switch
class Monster {
  constructor(id) {
    this.id = id;
  }
}

export class Dragon extends WithAggregateRoot(Monster) {
  roar() {
    console.log('Roarrrr!');
  }

  die() {
    this.roar();
    this.apply(new DragonDiedEvent(this.id));
  }
}
```

**Approach 3: Custom Implementation**

For maximum control, or to keep your domain layer completely framework-agnostic, implement the `IAggregateRoot` interface directly:

```typescript
export class CustomEntity implements IAggregateRoot {
  autoCommit = false;
  private events: IEvent[] = [];

  getUncommittedEvents() {
    return this.events;
  }

  publish(event: IEvent) {
    // custom logic
  }

  publishAll(events: IEvent[]) {
    // custom logic
  }

  commit() {
    // custom logic
  }

  uncommit() {
    // custom logic
  }

  apply(event: IEvent) {
    this.events.push(event);
  }

  loadFromHistory(history: IEvent[]) {
    // custom logic
  }
}
```

All three approaches work with `EventPublisher`, which accepts any object that implements the `IAggregateRoot` interface.

#### Manual event publishing

To publish an event without going through a model, call the `EventBus#publish()` method directly:

```typescript
this.eventBus.publish(new HeroKilledDragonEvent(heroId, dragonId));
```

> info **Hint** The `EventBus` is an injectable class.

Each event can have multiple **event handlers**.

```typescript
@@filename(hero-killed-dragon.handler)
@EventsHandler(HeroKilledDragonEvent)
export class HeroKilledDragonHandler implements IEventHandler<HeroKilledDragonEvent> {
  constructor(private repository: HeroesRepository) {}

  handle(event: HeroKilledDragonEvent) {
    // Business logic
  }
}
```

> info **Hint** Event handlers run outside the traditional HTTP request context:
>
> - Errors thrown in command handlers can still be caught by the built-in [exception filters](/exception-filters).
> - Errors thrown in event handlers can't be caught by exception filters, so you have to handle them yourself: with a `try/catch` block, with a [saga](/recipes/cqrs#sagas) that triggers a compensating event, or with another approach of your choice.
> - The value returned by a command handler can still be sent back to the client in the HTTP response.
> - Event handlers can't send HTTP responses. To send information to the client, use [WebSockets](/websockets/gateways), [server-sent events](/http/server-sent-events), or another mechanism.

As with commands and queries, register the `HeroKilledDragonHandler` as a provider in a module:

```typescript
providers: [HeroKilledDragonHandler];
```

#### Sagas

A saga is a long-running process that listens to events and may trigger new commands. Sagas are typically used to manage complex workflows. For example, when a user signs up, a saga may listen to the `UserRegisteredEvent` and send the user a welcome email.

A single saga may listen for 1..\* events. With the [RxJS](https://github.com/ReactiveX/rxjs) library, you can filter, map, fork, and merge event streams to build sophisticated workflows. Each saga returns an `Observable` that emits command instances. Each emitted command is then dispatched **asynchronously** by the `CommandBus`.

Let's create a saga that listens to the `HeroKilledDragonEvent` and dispatches the `DropAncientItemCommand` command.

```typescript
@@filename(heroes-game.saga)
@Injectable()
export class HeroesGameSagas {
  @Saga()
  dragonKilled = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(HeroKilledDragonEvent),
      map((event) => new DropAncientItemCommand(event.heroId, fakeItemID)),
    );
  }
}
@@switch
@Injectable()
export class HeroesGameSagas {
  @Saga()
  dragonKilled = (events$) => {
    return events$.pipe(
      ofType(HeroKilledDragonEvent),
      map((event) => new DropAncientItemCommand(event.heroId, fakeItemID)),
    );
  }
}
```

> info **Hint** The `ofType` operator and the `@Saga()` decorator are exported from the `@nestjs/cqrs` package.

The `@Saga()` decorator marks the property as a saga. The `events$` argument is an `Observable` stream of all events. The `ofType` operator filters the stream by the specified event type, and the `map` operator maps each event to a new command instance.

In this example, each `HeroKilledDragonEvent` is mapped to a `DropAncientItemCommand` command, which the `CommandBus` then dispatches automatically.

As with query, command, and event handlers, register the `HeroesGameSagas` as a provider in a module:

```typescript
providers: [HeroesGameSagas];
```

#### Unhandled exceptions

Event handlers are executed asynchronously, so they must always handle exceptions properly to prevent the application from entering an inconsistent state. If an exception isn't handled, the `EventBus` logs it, creates an `UnhandledExceptionInfo` object, and pushes it to the `UnhandledExceptionBus` stream. The same applies to exceptions thrown by sagas and by command handlers executing commands that sagas dispatched. The `UnhandledExceptionBus` is an `Observable` that you can subscribe to in order to process unhandled exceptions. If the `rethrowUnhandled` option is set to `true`, these exceptions are rethrown instead of being published to the `UnhandledExceptionBus`.

```typescript
private destroy$ = new Subject<void>();

constructor(private unhandledExceptionsBus: UnhandledExceptionBus) {
  this.unhandledExceptionsBus
    .pipe(takeUntil(this.destroy$))
    .subscribe((exceptionInfo) => {
      // Handle exception here
      // e.g. send it to external service, terminate process, or publish a new event
    });
}

onModuleDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

To handle only specific exception types, use the `UnhandledExceptionBus.ofType()` operator, which filters exceptions with `instanceof`:

```typescript
this.unhandledExceptionsBus
  .pipe(
    takeUntil(this.destroy$),
    UnhandledExceptionBus.ofType(TransactionNotAllowedException),
  )
  .subscribe((exceptionInfo) => {
    // Handle exception here
  });
```

Here, only exceptions that are instances of `TransactionNotAllowedException` reach the subscriber.

The `UnhandledExceptionInfo` object contains the following properties:

```typescript
export interface UnhandledExceptionInfo<
  Cause = IEvent | ICommand,
  Exception = any,
> {
  /**
   * The exception that was thrown.
   */
  exception: Exception;
  /**
   * The cause of the exception (event or command reference).
   */
  cause: Cause;
}
```

#### Subscribing to all events

`CommandBus`, `QueryBus`, and `EventBus` are all **Observables**. This means you can subscribe to the entire stream and, for example, process all events: log them to the console or save them to an event store.

```typescript
private destroy$ = new Subject<void>();

constructor(private eventBus: EventBus) {
  this.eventBus
    .pipe(takeUntil(this.destroy$))
    .subscribe((event) => {
      // Save events to database
    });
}

onModuleDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

#### Request-scoping

If you're coming from other programming languages, you may be surprised that in Nest, most things are shared across incoming requests: a connection pool to the database, singleton services with global state, and more. Node.js doesn't follow the request/response multi-threaded stateless model, in which each request is processed by a separate thread. As a result, using singleton instances is **safe** for your applications.

However, there are edge cases where a request-based lifetime for a handler is desirable, such as per-request caching in GraphQL applications, request tracking, or multi-tenancy. See the [injection scopes](/fundamentals/injection-scopes) chapter to learn how to control scopes.

Using request-scoped providers alongside CQRS can be complex because the `CommandBus`, `QueryBus`, and `EventBus` are singletons. The `@nestjs/cqrs` package handles this by automatically creating a new instance of a request-scoped handler for each processed command, query, or event.

To make a handler request-scoped, either:

1. Depend on a request-scoped provider.
2. Explicitly set its scope to `REQUEST` in the `@CommandHandler()`, `@QueryHandler()`, or `@EventsHandler()` decorator, as shown:

```typescript
@CommandHandler(KillDragonCommand, {
  scope: Scope.REQUEST,
})
export class KillDragonHandler {
  // Implementation here
}
```

To inject the request payload into a request-scoped provider, use the `@Inject(REQUEST)` decorator (`REQUEST` is exported from `@nestjs/core`). In CQRS, however, the request payload depends on the context: it could be an HTTP request, a scheduled job, or any other operation that triggers a command.

The payload must be an instance of `AsyncContext` (exported from `@nestjs/cqrs`) or of a class that extends it. It acts as the request context and holds data that is accessible throughout the request lifecycle.

```typescript
import { AsyncContext } from '@nestjs/cqrs';

export class MyRequest extends AsyncContext {
  constructor(public readonly user: User) {
    super();
  }
}
```

When executing a command, pass the custom request context as the second argument to the `CommandBus#execute()` method:

```typescript
const myRequest = new MyRequest(user);
await this.commandBus.execute(
  new KillDragonCommand(heroId, killDragonDto.dragonId),
  myRequest,
);
```

This makes the `MyRequest` instance available as the `REQUEST` provider to the corresponding handler:

```typescript
@CommandHandler(KillDragonCommand, {
  scope: Scope.REQUEST,
})
export class KillDragonHandler {
  constructor(
    @Inject(REQUEST) private request: MyRequest, // Inject the request context
  ) {}

  // Handler implementation here
}
```

Queries work the same way:

```typescript
const myRequest = new MyRequest(user);
const hero = await this.queryBus.execute(new GetHeroQuery(heroId), myRequest);
```

And in the query handler:

```typescript
@QueryHandler(GetHeroQuery, {
  scope: Scope.REQUEST,
})
export class GetHeroHandler {
  constructor(
    @Inject(REQUEST) private request: MyRequest, // Inject the request context
  ) {}

  // Handler implementation here
}
```

For events, you can pass the request context to `EventBus#publish()`, but this is less common. Instead, use `EventPublisher` to merge the request context into a model:

```typescript
const hero = this.publisher.mergeObjectContext(
  await this.repository.findOneById(+heroId),
  this.request, // Inject the request context here
);
```

Request-scoped event handlers that handle these events have access to the request context.

Sagas are always singletons because they manage long-running processes (registering a saga in a non-singleton provider throws an exception). However, you can retrieve the request context from event objects:

```typescript
@Saga()
dragonKilled = (events$: Observable<any>): Observable<ICommand> => {
  return events$.pipe(
    ofType(HeroKilledDragonEvent),
    map((event) => {
      const request = AsyncContext.of(event); // Retrieve the request context
      const command = new DropAncientItemCommand(event.heroId, fakeItemID);

      AsyncContext.merge(request, command); // Merge the request context into the command
      return command;
    }),
  );
}
```

Alternatively, call the `request.attachTo(command)` method to attach the request context to the command.

#### Example

A working example is available in the [nest-cqrs-example repository](https://github.com/kamilmysliwiec/nest-cqrs-example).
