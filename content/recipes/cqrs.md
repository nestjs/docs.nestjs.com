### CQRS

The flow of simple [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) (Create, Read, Update and Delete) applications can be described using the following steps:

1. The **controllers** layer handles HTTP requests and delegates tasks to the services layer.
2. The **services layer** is where most of the business logic lives.
3. Services use **repositories / DAOs** to change / persist entities.
4. Entities act as containers for the values, with setters and getters.

In most cases, for small and medium-sized applications, this pattern is sufficient. However, when our requirements become more complex, the **CQRS** model may be more appropriate and scalable. To facilitate that model, Nest provides a lightweight [CQRS module](https://github.com/nestjs/cqrs). This chapter describes how to use it.

#### Installation

First install the required package:

```bash
$ npm install --save @nestjs/cqrs
```

#### Commands

In this model, each action is called a **Command**. When a command is dispatched, the application reacts to it. Commands can be dispatched from the services layer, or directly from controllers/gateways. Commands are consumed by **Command Handlers**.

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

Here's a sample service that dispatches `KillDragonCommand`. Let's see how the command looks:

```typescript
@@filename(kill-dragon.command)
export class KillDragonCommand {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {}
}
@@switch
export class KillDragonCommand {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}
```

The `CommandBus` is a **stream** of commands. It delegates commands to the equivalent handlers. Each command must have a corresponding **Command Handler**:

```typescript
@@filename(kill-dragon.handler)
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(private repository: HeroRepository) {}

  async execute(command: KillDragonCommand) {
    const { heroId, dragonId } = command;
    const hero = this.repository.findOneById(+heroId);

    hero.killEnemy(dragonId);
    await this.repository.persist(hero);
  }
}
@@switch
@CommandHandler(KillDragonCommand)
@Dependencies(HeroRepository)
export class KillDragonHandler {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(command) {
    const { heroId, dragonId } = command;
    const hero = this.repository.findOneById(+heroId);

    hero.killEnemy(dragonId);
    await this.repository.persist(hero);
  }
}
```

With this approach, every application state change is driven by the occurrence of a **Command**. The logic is encapsulated in handlers. With this approach, we can simply add behavior like logging or persisting commands in the database (e.g., for diagnostics purposes).

#### Events

Command handlers neatly encapsulate logic. While beneficial, the application structure is still not flexible enough, not **reactive**. To remedy this, we also introduce **events**.

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

Events are asynchronous. They are dispatched either by **models** or directly using `EventBus`. In order to dispatch events, models have to extend the `AggregateRoot` class.

```typescript
@@filename(hero.model)
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
  }

  killEnemy(enemyId: string) {
    // logic
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
    // logic
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}
```

The `apply()` method does not dispatch events yet because there's no relationship between the model and the `EventPublisher` class. How do we associate the model and the publisher? By using a publisher `mergeObjectContext()` method inside our command handler.

```typescript
@@filename(kill-dragon.handler)
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(
    private repository: HeroRepository,
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
@Dependencies(HeroRepository, EventPublisher)
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

Now everything works as expected. Notice that we need to `commit()` events since they're not being dispatched immediately. Obviously, an object doesn't have to exist up front. We can easily merge type context as well:

```typescript
const HeroModel = this.publisher.mergeClassContext(Hero);
new HeroModel('id');
```

Now the model has the ability to publish events. Additionally, we can emit events manually using `EventBus`:

```typescript
this.eventBus.publish(new HeroKilledDragonEvent());
```

> info **Hint** The `EventBus` is an injectable class.

Each event can have multiple **Event Handlers**.

```typescript
@@filename(hero-killed-dragon.handler)
@EventsHandler(HeroKilledDragonEvent)
export class HeroKilledDragonHandler implements IEventHandler<HeroKilledDragonEvent> {
  constructor(private repository: HeroRepository) {}

  handle(event: HeroKilledDragonEvent) {
    // logic
  }
}
```

Now we can move the **write logic** into the event handlers.

#### Sagas

This type of **Event-Driven Architecture** improves application **reactiveness and scalability**. Now, when we have events, we can simply react to them in various ways. **Sagas** are the final building block from an architectural point of view.

Sagas are an extremely powerful feature. A single saga may listen for 1..\* events. Using the [RxJS](https://github.com/ReactiveX/rxjs) library, it can combine, merge, filter or apply other `RxJS` operators on the event stream. Each saga returns an Observable which contains a command. This command is dispatched **asynchronously**.

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

> info **Hint** The `ofType` operator is exported from the `@nestjs/cqrs` package.

We declared a rule - when any hero kills the dragon, the ancient item should be dropped. With this in place, `DropAncientItemCommand` will be dispatched and processed by the appropriate handler.

#### Queries

The `CqrsModule` can also be used for handling queries. The `QueryBus` follows the same pattern as the `CommandsBus`. Query handlers should implement the `IQueryHandler` interface and be marked with the `@QueryHandler()` decorator.

#### Setup

Finally, let's look at how to set up the whole CQRS mechanism.

```typescript
@@filename(heroes-game.module)
export const CommandHandlers = [KillDragonHandler, DropAncientItemHandler];
export const EventHandlers =  [HeroKilledDragonHandler, HeroFoundItemHandler];

@Module({
  imports: [CqrsModule],
  controllers: [HeroesGameController],
  providers: [
    HeroesGameService,
    HeroesGameSagas,
    ...CommandHandlers,
    ...EventHandlers,
    HeroRepository,
  ]
})
export class HeroesGameModule {}
```

#### Summary

`CommandBus`, `QueryBus` and `EventBus` are **Observables**. This means that you can easily subscribe to the whole stream and enrich your application with **Event Sourcing**.

#### Configurable Event Bus

The Nest `CqrsModule` by default uses an internal (local) event bus. For large applications that span multiple microservices, it is sometimes necesary to use an external event bus (such as Kafka, ActiveMQ or RabbitMQ).

Nest provides two interfaces which allow us to implement a custom event bus. To implement an event publisher we implement the `IEventPublisher` interface and the `publish` function. As an example we have written an event publisher for Kafka which leverages the `kafkajs` node module.

```typescript
@@filename(KafkaPublisher)
class KafkaPublisher implements IEventPublisher {

  private readonly kafkaProducer: Producer;

  constructor(@Inject('KAFKA_BROKER') broker: string) {
    const kafka = new Kafka({
      clientId: 'my-app',
      brokers: [broker]
    })

    this.kafkaProducer = kafka.producer();
  }

  async connect(): Promise<void> {
    await this.kafkaProducer.connect();
  }

  publish<T>(event: T): any {
    this.kafkaProducer.send({
      topic: event.constructor.name,
      messages: [
        { value: JSON.stringify(event) }
      ]
    })
  }
}
@@switch
class KafkaPublisher {

  constructor(@Inject('KAFKA_BROKER') broker) {
    const kafka = new Kafka({
      clientId: 'my-app',
      brokers: [broker]
    })

    this.kafkaProducer = kafka.producer();
  }

  async connect() {
    await this.kafkaProducer.connect();
  }

  publish(event) {
    this.kafkaProducer.send({
      topic: event.constructor.name,
      messages: [
        { value: JSON.stringify(event) }
      ]
    })
  }
}
```

Similarly we implement the `IMessageSource` interface and the `bridgeEventsTo` function to setup an event listener.

```typescript
@@filename(KafkaSubscriber)
class KafkaSubscriber implements IMessageSource {

  private readonly kafkaConsumer: Consumer
  private bridge: Subject<any>
  private readonly events: Array<any>;

  constructor(@Inject('KAFKA_BROKER') broker: string,
              @Inject('EVENTS') events: Array<any>) {
    const kafka = new Kafka({
      clientId: 'my-app',
      brokers: [broker]
    })

    this.events = events;
    this.kafkaConsumer = kafka.consumer({groupId: 'test-group'});
  }

  async connect(): Promise<void> {
    await this.kafkaConsumer.connect();
    for(const event of this.events) {
      await this.kafkaConsumer.subscribe({ topic: event.name, fromBeginning: false })
    }

    await this.kafkaConsumer.run({
      eachMessage: async ({topic, partition, message}) => {
        if(this.bridge) {
          for(const event of this.events) {
            if(event.name === topic) {
              const parsedJson = JSON.parse(message.value.toString());
              const receivedEvent = new event(parsedJson)
              this.bridge.next(receivedEvent)
            }
          }
        }
      }
    })
  }

  bridgeEventsTo<T extends IEvent>(subject: Subject<T>): any {
    this.bridge = subject
  }
}
@@switch
class KafkaSubscriber {

  constructor(@Inject('KAFKA_BROKER') broker,
              @Inject('EVENTS') events) {
    const kafka = new Kafka({
      clientId: 'my-app',
      brokers: [broker]
    })

    this.events = events;
    this.kafkaConsumer = kafka.consumer({groupId: 'test-group'});
  }

  async connect() {
    await this.kafkaConsumer.connect();
    for(const event of this.events) {
      await this.kafkaConsumer.subscribe({ topic: event.name, fromBeginning: false })
    }

    await this.kafkaConsumer.run({
      eachMessage: async ({topic, partition, message}) => {
        if(this.bridge) {
          for(const event of this.events) {
            if(event.name === topic) {
              const parsedJson = JSON.parse(message.value.toString());
              const receivedEvent = new event(parsedJson)
              this.bridge.next(receivedEvent)
            }
          }
        }
      }
    })
  }

  bridgeEventsTo(subject) {
    this.bridge = subject
  }
}
```

We now include these in our `HeroModule` and configure them upon module initialization.

```typescript
@@filename(heroes-game.module)
export const CommandHandlers = [KillDragonHandler, DropAncientItemHandler];
export const EventHandlers =  [HeroKilledDragonHandler, HeroFoundItemHandler];
export const Events = [HeroKilledDragonEvent, HeroFoundItemEvent]

@Module({
  imports: [CqrsModule, ConfigModule.forRoot()],
  controllers: [HeroesGameController],
  providers: [
    HeroRepository,
    ...CommandHandlers,
    ...EventHandlers,
    ...QueryHandlers,
    {
      provide: 'EVENTS',
      useValue: Events,
    },
    {
      provide: 'KAFKA_BROKER',
      useFactory: (configService: ConfigService) => {
        return configService.get('KAFKA_BROKER')
      },
      inject: [ConfigService]
    },
    HeroesGameSagas,
    KafkaPublisher,
    KafkaSubscriber
  ],
})
export class HeroesGameModule implements OnModuleInit {
  constructor(
    private readonly event$: EventBus,
    private readonly kafkaPublisher: KafkaPublisher,
    private readonly kafkaSubscriber: KafkaSubscriber,
  ) {}

  async onModuleInit(): Promise<any> {
    await this.kafkaSubscriber.connect();
    this.kafkaSubscriber.bridgeEventsTo(this.event$.subject$);

    await this.kafkaPublisher.connect();
    this.event$.publisher = this.kafkaPublisher;
  }
}
@@switch
export const CommandHandlers = [KillDragonHandler, DropAncientItemHandler];
export const EventHandlers =  [HeroKilledDragonHandler, HeroFoundItemHandler];
export const Events = [HeroKilledDragonEvent, HeroFoundItemEvent]

@Module({
  imports: [CqrsModule, ConfigModule.forRoot()],
  controllers: [HeroesGameController],
  providers: [
    HeroRepository,
    ...CommandHandlers,
    ...EventHandlers,
    ...QueryHandlers,
    {
      provide: 'EVENTS',
      useValue: Events,
    },
    {
      provide: 'KAFKA_BROKER',
      useFactory: (configService) => {
        return configService.get('KAFKA_BROKER')
      },
      inject: [ConfigService]
    },
    HeroesGameSagas,
    KafkaPublisher,
    KafkaSubscriber
  ],
})
export class HeroesGameModule {
  constructor(
    event$,
    kafkaPublisher,
    kafkaSubscriber,
  ) {
    this.kafkaPublisher = kafkaPublisher;
    this.kafkaSubscriber = kafkaSubscriber;
    this.event$ = event$;
  }

  async onModuleInit() {
    await this.kafkaSubscriber.connect();
    this.kafkaSubscriber.bridgeEventsTo(this.event$.subject$);

    await this.kafkaPublisher.connect();
    this.event$.publisher = this.kafkaPublisher;
  }
}
```

#### Example

A working example is available [here](https://github.com/kamilmysliwiec/nest-cqrs-example).
