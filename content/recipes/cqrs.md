### CQRS

The flow of simple [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) (Create, Read, Update and Delete) applications can be described as follows:

1. The controllers layer handles HTTP requests and delegates tasks to the services layer.
2. The services layer is where most of the business logic lives.
3. Services use repositories / DAOs to change / persist entities.
4. Entities act as containers for the values, with setters and getters.

While this pattern is usually sufficient for small and medium-sized applications, it may not be the best choice for larger, more complex applications. In such cases, the **CQRS** (Command and Query Responsibility Segregation) model may be more appropriate and scalable (depending on the application's requirements). Benefits of this model include:

- **Separation of concerns**. The model separates the read and write operations into separate models.
- **Scalability**. The read and write operations can be scaled independently.
- **Flexibility**. The model allows for the use of different data stores for read and write operations.
- **Performance**. The model allows for the use of different data stores optimized for read and write operations.

To facilitate that model, Nest provides a lightweight [CQRS module](https://github.com/nestjs/cqrs). This chapter describes how to use it.

#### Installation

First install the required package:

```bash
$ npm install --save @nestjs/cqrs
```

Once the installation is complete, navigate to the root module of your application (usually `AppModule`), and import the `CqrsModule.forRoot()`:

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule.forRoot()],
})
export class AppModule {}
```

This module accepts an optional configuration object. The following options are available:

| Attribute                     | Description                                                                                                                  | Default                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `commandPublisher`            | The publisher responsible for dispatching commands to the system.                                                            | `DefaultCommandPubSub`            |
| `eventPublisher`              | The publisher used to publish events, allowing them to be broadcasted or processed.                                          | `DefaultPubSub`                   |
| `queryPublisher`              | The publisher used for publishing queries, which can trigger data retrieval operations.                                      | `DefaultQueryPubSub`              |
| `unhandledExceptionPublisher` | Publisher responsible for handling unhandled exceptions, ensuring they are tracked and reported.                             | `DefaultUnhandledExceptionPubSub` |
| `eventIdProvider`             | Service that provides unique event IDs by generating or retrieving them from event instances.                                | `DefaultEventIdProvider`          |
| `rethrowUnhandled`            | Determines whether unhandled exceptions should be rethrown after being processed, useful for debugging and error management. | `false`                           |

#### Commands

Commands are used to change the application state. They should be task-based, rather than data centric. When a command is dispatched, it is handled by a corresponding **Command Handler**. The handler is responsible for updating the application state.

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

In the code snippet above, we instantiate the `KillDragonCommand` class and pass it to the `CommandBus`'s `execute()` method. This is the demonstrated command class:

```typescript
@@filename(kill-dragon.command)
export class KillDragonCommand extends Command<{
  actionId: string // This type represents the command execution result
}> {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {}
}
@@switch
export class KillDragonCommand extends Command {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}
```

As you can see, the `KillDragonCommand` class extends the `Command` class. The `Command` class is a simple utility class exported from the `@nestjs/cqrs` package that lets you define the command's return type. In this case, the return type is an object with an `actionId` property. Now, whenever the `KillDragonCommand` command is dispatched, the `CommandBus#execute()` method return-type will be inferred as `Promise<{{ '{' }} actionId: string {{ '}' }}>`. This is useful when you want to return some data from the command handler.

> info **Hint** Inheritance from the `Command` class is optional. It is only necessary if you want to define the return type of the command.

The `CommandBus` represents a **stream** of commands. It is responsible for dispatching commands to the appropriate handlers. The `execute()` method returns a promise, which resolves to the value returned by the handler.

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

This handler retrieves the `Hero` entity from the repository, calls the `killEnemy()` method, and then persists the changes. The `KillDragonHandler` class implements the `ICommandHandler` interface, which requires the implementation of the `execute()` method. The `execute()` method receives the command object as an argument.

Note that `ICommandHandler<KillDragonCommand>` forces you to return a value that matches the command's return type. In this case, the return type is an object with an `actionId` property. This only applies to commands that inherit from the `Command` class. Otherwise, you can return whatever you want.

Lastly, make sure to register the `KillDragonHandler` as a provider in a module:

```typescript
providers: [KillDragonHandler];
```

#### Queries

Queries are used to retrieve data from the application state. They should be data centric, rather than task-based. When a query is dispatched, it is handled by a corresponding **Query Handler**. The handler is responsible for retrieving the data.

The `QueryBus` follows the same pattern as the `CommandBus`. Query handlers should implement the `IQueryHandler` interface and be annotated with the `@QueryHandler()` decorator. See the following example:

```typescript
export class GetHeroQuery extends Query<Hero> {
  constructor(public readonly heroId: string) {}
}
```

Similar to the `Command` class, the `Query` class is a simple utility class exported from the `@nestjs/cqrs` package that lets you define the query's return type. In this case, the return type is a `Hero` object. Now, whenever the `GetHeroQuery` query is dispatched, the `QueryBus#execute()` method return-type will be inferred as `Promise<Hero>`.

To retrieve the hero, we need to create a query handler:

```typescript
@@filename(get-hero.handler)
@QueryHandler(GetHeroQuery)
export class GetHeroHandler implements IQueryHandler<GetHeroQuery> {
  constructor(private repository: HeroesRepository) {}

  async execute(query: GetHeroQuery) {
    return this.repository.findOneById(query.hero);
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
    return this.repository.findOneById(query.hero);
  }
}
```

The `GetHeroHandler` class implements the `IQueryHandler` interface, which requires the implementation of the `execute()` method. The `execute()` method receives the query object as an argument, and must return the data that matches the query's return type (in this case, a `Hero` object).

Lastly, make sure to register the `GetHeroHandler` as a provider in a module:

```typescript
providers: [GetHeroHandler];
```

Now, to dispatch the query, use the `QueryBus`:

```typescript
const hero = await this.queryBus.execute(new GetHeroQuery(heroId)); // "hero" will be auto-inferred as "Hero" type
```

#### Events

Events are used to notify other parts of the application about changes in the application state. They are dispatched by **models** or directly using the `EventBus`. When an event is dispatched, it is handled by corresponding **Event Handlers**. Handlers can then, for example, update the read model.

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

Now while events can be dispatched directly using the `EventBus.publish()` method, we can also dispatch them from the model. Let's update the `Hero` model to dispatch the `HeroKilledDragonEvent` event when the `killEnemy()` method is called.

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

The `apply()` method is used to dispatch events. It accepts an event object as an argument. However, since our model is not aware of the `EventBus`, we need to associate it with the model. We can do that by using the `EventPublisher` class.

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
  }
}
```

The `EventPublisher#mergeObjectContext` method merges the event publisher into the provided object, which means that the object will now be able to publish events to the events stream.

Notice that in this example we also call the `commit()` method on the model. This method is used to dispatch any outstanding events. To automatically dispatch events, we can set the `autoCommit` property to `true`:

```typescript
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
    this.autoCommit = true;
  }
}
```

In case we want to merge the event publisher into a non-existing object, but rather into a class, we can use the `EventPublisher#mergeClassContext` method:

```typescript
const HeroModel = this.publisher.mergeClassContext(Hero);
const hero = new HeroModel('id'); // <-- HeroModel is a class
```

Now every instance of the `HeroModel` class will be able to publish events without using `mergeObjectContext()` method.

Additionally, we can emit events manually using `EventBus`:

```typescript
this.eventBus.publish(new HeroKilledDragonEvent());
```

> info **Hint** The `EventBus` is an injectable class.

Each event can have multiple **Event Handlers**.

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

> info **Hint** Be aware that when you start using event handlers you get out of the traditional HTTP web context.
>
> - Errors in `CommandHandlers` can still be caught by built-in [Exception filters](/exception-filters).
> - Errors in `EventHandlers` can't be caught by Exception filters: you will have to handle them manually. Either by a simple `try/catch`, using [Sagas](/recipes/cqrs#sagas) by triggering a compensating event, or whatever other solution you choose.
> - HTTP Responses in `CommandHandlers` can still be sent back to the client.
> - HTTP Responses in `EventHandlers` cannot. If you want to send information to the client you could use [WebSocket](/websockets/gateways), [SSE](/techniques/server-sent-events), or whatever other solution you choose.

As with commands and queries, make sure to register the `HeroKilledDragonHandler` as a provider in a module:

```typescript
providers: [HeroKilledDragonHandler];
```

#### Sagas

Saga is a long-running process that listens to events and may trigger new commands. It is usually used to manage complex workflows in the application. For example, when a user signs up, a saga may listen to the `UserRegisteredEvent` and send a welcome email to the user.

Sagas are an extremely powerful feature. A single saga may listen for 1..\* events. Using the [RxJS](https://github.com/ReactiveX/rxjs) library, we can filter, map, fork, and merge event streams to create sophisticated workflows. Each saga returns an Observable which produces a command instance. This command is then dispatched **asynchronously** by the `CommandBus`.

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

The `@Saga()` decorator marks the method as a saga. The `events$` argument is an Observable stream of all events. The `ofType` operator filters the stream by the specified event type. The `map` operator maps the event to a new command instance.

In this example, we map the `HeroKilledDragonEvent` to the `DropAncientItemCommand` command. The `DropAncientItemCommand` command is then auto-dispatched by the `CommandBus`.

As with query, command, and event handlers, make sure to register the `HeroesGameSagas` as a provider in a module:

```typescript
providers: [HeroesGameSagas];
```

#### Unhandled exceptions

Event handlers are executed asynchronously, so they must always handle exceptions properly to prevent the application from entering an inconsistent state. If an exception is not handled, the `EventBus` will create an `UnhandledExceptionInfo` object and push it to the `UnhandledExceptionBus` stream. This stream is an `Observable` that can be used to process unhandled exceptions.

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

To filter out exceptions, we can use the `ofType` operator, as follows:

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

Where `TransactionNotAllowedException` is the exception we want to filter out.

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

`CommandBus`, `QueryBus` and `EventBus` are all **Observables**. This means that we can subscribe to the entire stream and, for example, process all events. For example, we can log all events to the console, or save them to the event store.

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

For those coming from different programming language backgrounds, it may be surprising to learn that in Nest, most things are shared across incoming requests. This includes a connection pool to the database, singleton services with global state, and more. Keep in mind that Node.js does not follow the request/response multi-threaded stateless model, where each request is processed by a separate thread. As a result, using singleton instances is **safe** for our applications.

However, there are edge cases where a request-based lifetime for the handler might be desirable. This could include scenarios like per-request caching in GraphQL applications, request tracking, or multi-tenancy. You can learn more about how to control scopes [here](/fundamentals/injection-scopes).

Using request-scoped providers alongside CQRS can be complex because the `CommandBus`, `QueryBus`, and `EventBus` are singletons. Thankfully, the `@nestjs/cqrs` package simplifies this by automatically creating a new instance of request-scoped handlers for each processed command, query, or event.

To make a handler request-scoped, you can either:

1. Depend on a request-scoped provider.
2. Explicitly set its scope to `REQUEST` using the `@CommandHandler`, `@QueryHandler`, or `@EventsHandler` decorator, as shown:

```typescript
@CommandHandler(KillDragonCommand, {
  scope: Scope.REQUEST,
})
export class KillDragonHandler {
  // Implementation here
}
```

To inject the request payload into any request-scoped provider, you use the `@Inject(REQUEST)` decorator. However, the nature of the request payload in CQRS depends on the context—it could be an HTTP request, a scheduled job, or any other operation that triggers a command.

The payload must be an instance of a class extending `AsyncContext` (provided by `@nestjs/cqrs`), which acts as the request context and holds data accessible throughout the request lifecycle.

```typescript
import { AsyncContext } from '@nestjs/cqrs';

export class MyRequest extends AsyncContext {
  constructor(public readonly user: User) {
    super();
  }
}
```

When executing a command, pass the custom request context as the second argument to the `CommandBus#execute` method:

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

You can follow the same approach for queries:

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

For events, while you can pass the request provider to `EventBus#publish`, this is less common. Instead, use `EventPublisher` to merge the request provider into a model:

```typescript
const hero = this.publisher.mergeObjectContext(
  await this.repository.findOneById(+heroId),
  this.request, // Inject the request context here
);
```

Request-scoped event handlers subscribing to these events will have access to the request provider.

Sagas are always singleton instances because they manage long-running processes. However, you can retrieve the request provider from event objects:

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

Alternatively, use the `request.attachTo(command)` method to tie the request context to the command.

#### Example

A working example is available [here](https://github.com/kamilmysliwiec/nest-cqrs-example).
