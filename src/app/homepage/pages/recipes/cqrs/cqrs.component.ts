import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-cqrs',
  templateUrl: './cqrs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CqrsComponent extends BasePageComponent {
  get heroGameService() {
    return `
@Injectable()
export class HeroesGameService {
  constructor(private readonly commandBus: CommandBus) {}

  async killDragon(heroId: string, killDragonDto: KillDragonDto) {
    return await this.commandBus.execute(
      new KillDragonCommand(heroId, killDragonDto.dragonId)
    );
  }
}`;
  }

  get heroGameServiceJs() {
    return `
@Injectable()
@Dependencies(CommandBus)
export class HeroesGameService {
  constructor(commandBus) {
    this.commandBus = commandBus;
  }

  async killDragon(heroId, killDragonDto) {
    return await this.commandBus.execute(
      new KillDragonCommand(heroId, killDragonDto.dragonId)
    );
  }
}`;
  }

  get killDragonCommand() {
    return `
export class KillDragonCommand implements ICommand {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {}
}`;
  }

  get killDragonCommandJs() {
    return `
export class KillDragonCommand {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}`;
  }

  get killDragonHandler() {
    return `
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(private readonly repository: HeroRepository) {}

  async execute(command: KillDragonCommand, resolve: (value?) => void) {
    const { heroId, dragonId } = command;
    const hero = this.repository.findOneById(+heroId);

    hero.killEnemy(dragonId);
    await this.repository.persist(hero);
    resolve();
  }
}`;
  }

  get killDragonHandlerJs() {
    return `
@CommandHandler(KillDragonCommand)
@Dependencies(HeroRepository)
export class KillDragonHandler {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(command, resolve) {
    const { heroId, dragonId } = command;
    const hero = this.repository.findOneById(+heroId);

    hero.killEnemy(dragonId);
    await this.repository.persist(hero);
    resolve();
  }
}`;
  }

  get killedDragonEvent() {
    return `
export class HeroKilledDragonEvent implements IEvent {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string) {}
}`;
  }

  get killedDragonEventJs() {
    return `
export class HeroKilledDragonEvent {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}`;
  }

  get heroModel() {
    return `
export class Hero extends AggregateRoot {
  constructor(private readonly id: string) {
    super();
  }

  killEnemy(enemyId: string) {
    // logic
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}`;
  }

  get heroModelJs() {
    return `
export class Hero extends AggregateRoot {
  constructor(id) {
    super();
    this.id = id;
  }

  killEnemy(enemyId) {
    // logic
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}`;
  }

  get merged() {
    return `
@CommandHandler(KillDragonCommand)
export class KillDragonHandler implements ICommandHandler<KillDragonCommand> {
  constructor(
    private readonly repository: HeroRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: KillDragonCommand, resolve: (value?) => void) {
    const { heroId, dragonId } = command;
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );
    hero.killEnemy(dragonId);
    hero.commit();
    resolve();
  }
}`;
  }

  get mergedJs() {
    return `
@CommandHandler(KillDragonCommand)
@Dependencies(HeroRepository, EventPublisher)
export class KillDragonHandler {
  constructor(repository, publisher) {
    this.repository = repository;
    this.publisher = publisher;
  }

  async execute(command, resolve) {
    const { heroId, dragonId } = command;
    const hero = this.publisher.mergeObjectContext(
      await this.repository.findOneById(+heroId),
    );
    hero.killEnemy(dragonId);
    hero.commit();
    resolve();
  }
}`;
  }

  get mergedType() {
    return `
const HeroModel = this.publisher.mergeContext(Hero);
new HeroModel('id');`;
  }

  get eventHandler() {
    return `
@EventsHandler(HeroKilledDragonEvent)
export class HeroKilledDragonHandler implements IEventHandler<HeroKilledDragonEvent> {
  constructor(private readonly repository: HeroRepository) {}

  handle(event: HeroKilledDragonEvent) {
    // logic
  }
}`;
  }

  get eventHandlerJs() {
    return `
@EventsHandler(HeroKilledDragonEvent)
@Dependencies(HeroRepository)
export class HeroKilledDragonHandler {
  constructor(repository) {
    this.repository = repository;
  }

  handle(event) {
    // logic
  }
}`;
  }

  get saga() {
    return `
@Component()
export class HeroesGameSagas {
  dragonKilled = (events$: EventObservable<any>): Observable<ICommand> => {
    return events$.ofType(HeroKilledDragonEvent)
      .map((event) => new DropAncientItemCommand(event.heroId, fakeItemID));
  }
}`;
  }

  get sagaJs() {
    return `
@Component()
export class HeroesGameSagas {
  dragonKilled = (events$) => {
    return events$.ofType(HeroKilledDragonEvent)
      .map((event) => new DropAncientItemCommand(event.heroId, fakeItemID));
  }
}`;
  }

  get setup() {
    return `
export const CommandHandlers = [KillDragonHandler, DropAncientItemHandler];
export const EventHandlers =  [HeroKilledDragonHandler, HeroFoundItemHandler];

@Module({
  imports: [CQRSModule],
  controllers: [HeroesGameController],
  providers: [
    HeroesGameService,
    HeroesGameSagas,
    ...CommandHandlers,
    ...EventHandlers,
    HeroRepository,
  ]
})
export class HeroesGameModule implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly command$: CommandBus,
    private readonly event$: EventBus,
    private readonly heroesGameSagas: HeroesGameSagas,
  ) {}

  onModuleInit() {
    this.command$.setModuleRef(this.moduleRef);
    this.event$.setModuleRef(this.moduleRef);

    this.event$.register(EventHandlers);
    this.command$.register(CommandHandlers);
    this.event$.combineSagas([
      this.heroesGameSagas.dragonKilled,
    ]);
  }
}`;
  }

  get setupJs() {
    return `
export const CommandHandlers = [KillDragonHandler, DropAncientItemHandler];
export const EventHandlers =  [HeroKilledDragonHandler, HeroFoundItemHandler];

@Module({
  imports: [CQRSModule],
  controllers: [HeroesGameController],
  providers: [
    HeroesGameService,
    HeroesGameSagas,
    ...CommandHandlers,
    ...EventHandlers,
    HeroRepository,
  ]
})
@Dependencies(ModuleRef, CommandBus, EventBus, HeroesGameSagas)
export class HeroesGameModule {
  constructor(moduleRef, command$, event$, heroesGameSagas) {
    this.moduleRef = moduleRef;
    this.command$ = command$;
    this.event$ = event$;
    this.heroesGameSagas = heroesGameSagas;
  }

  onModuleInit() {
    this.command$.setModuleRef(this.moduleRef);
    this.event$.setModuleRef(this.moduleRef);

    this.event$.register(EventHandlers);
    this.command$.register(CommandHandlers);
    this.event$.combineSagas([
        this.heroesGameSagas.dragonKilled,
    ]);
  }
}`;
  }
}
