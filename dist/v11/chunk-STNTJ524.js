import{a as L}from"./chunk-HP65REBS.js";import{a as C,b as I}from"./chunk-AO7BAPTM.js";import{G as i,L as x,Ma as A,N as S,Qa as f,Ra as g,Sa as E,V as n,W as t,X as o,ja as r,ka as m,la as e,na as s,oa as J,ua as l,va as d,y as h}from"./chunk-IPH2CUBH.js";var N=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-cqrs"]],features:[S],decls:939,vars:78,consts:[["contentReference",""],["app7370310eb666200ed1400cf643940aa0b20e0867",""],["appf70c8cda619eb415158758926b59952328fe8842",""],["appe53a9391ee4f45b941150c32db32980f08d7579d",""],["app6f487f294835373fbe2b04bff417aaab9783d971",""],["app7b49d71db907fd836def72c46d3366a80d721500",""],["app5bba4f7d19516ee66163c9e3f13fe9a1a091eca7",""],["appd50085b158aa8881d7225ad22ddf20d953755705",""],["appf12c91fb8aa835774c329289b9b7121013532d09",""],["app89fad812ef73ab4e8c4885031f6065ab0cfe5db6",""],["app8dd97b40241c123e8f432ebcc239876877fec729",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/cqrs.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","cqrs"],["rel","nofollow","target","_blank","href","https://en.wikipedia.org/wiki/Create,_read,_update_and_delete"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/cqrs"],["appAnchor","","id","installation"],[1,"language-bash"],[1,"language-typescript"],["appAnchor","","id","commands"],[1,"with-heading"],[1,"filename"],[1,"info"],["appAnchor","","id","queries"],["appAnchor","","id","events"],["appAnchor","","id","flexible-aggregate-roots"],["appAnchor","","id","manual-event-publishing"],["routerLink","/exception-filters"],["href","/recipes/cqrs#sagas"],["routerLink","/websockets/gateways"],["routerLink","/techniques/server-sent-events"],["appAnchor","","id","sagas"],["rel","nofollow","target","_blank","href","https://github.com/ReactiveX/rxjs"],["appAnchor","","id","unhandled-exceptions"],["appAnchor","","id","subscribing-to-all-events"],["appAnchor","","id","request-scoping"],["routerLink","/fundamentals/injection-scopes"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/kamilmysliwiec/nest-cqrs-example"]],template:function(p,u){if(p&1&&(n(0,"div",11,0)(2,"div",12)(3,"a",13),o(4,"i",14),t()(),n(5,"h3",15),e(6,"CQRS"),t(),n(7,"p"),e(8,"The flow of simple "),n(9,"a",16),e(10,"CRUD"),t(),e(11," (Create, Read, Update and Delete) applications can be described as follows:"),t(),n(12,"ol")(13,"li"),e(14,"The controllers layer handles HTTP requests and delegates tasks to the services layer."),t(),n(15,"li"),e(16,"The services layer is where most of the business logic lives."),t(),n(17,"li"),e(18,"Services use repositories / DAOs to change / persist entities."),t(),n(19,"li"),e(20,"Entities act as containers for the values, with setters and getters."),t()(),n(21,"p"),e(22,"While this pattern is usually sufficient for small and medium-sized applications, it may not be the best choice for larger, more complex applications. In such cases, the "),n(23,"strong"),e(24,"CQRS"),t(),e(25," (Command and Query Responsibility Segregation) model may be more appropriate and scalable (depending on the application's requirements). Benefits of this model include:"),t(),n(26,"ul")(27,"li")(28,"strong"),e(29,"Separation of concerns"),t(),e(30,". The model separates the read and write operations into separate models."),t(),n(31,"li")(32,"strong"),e(33,"Scalability"),t(),e(34,". The read and write operations can be scaled independently."),t(),n(35,"li")(36,"strong"),e(37,"Flexibility"),t(),e(38,". The model allows for the use of different data stores for read and write operations."),t(),n(39,"li")(40,"strong"),e(41,"Performance"),t(),e(42,". The model allows for the use of different data stores optimized for read and write operations."),t()(),n(43,"p"),e(44,"To facilitate that model, Nest provides a lightweight "),n(45,"a",17),e(46,"CQRS module"),t(),e(47,". This chapter describes how to use it."),t(),n(48,"h4",18)(49,"span"),e(50,"Installation"),t()(),n(51,"p"),e(52,"First install the required package:"),t(),n(53,"pre")(54,"code",19),e(55,`
$ npm install --save @nestjs/cqrs
`),t()(),n(56,"p"),e(57,"Once the installation is complete, navigate to the root module of your application (usually "),n(58,"code"),e(59,"AppModule"),t(),e(60,"), and import the "),n(61,"code"),e(62,"CqrsModule.forRoot()"),t(),e(63,":"),t(),n(64,"app-copy-button")(65,"pre")(66,"code",20),e(67,`
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule.forRoot()],
})
export class AppModule {}
`),t()()(),n(68,"p"),e(69,"This module accepts an optional configuration object. The following options are available:"),t(),n(70,"table")(71,"thead")(72,"tr")(73,"th"),e(74,"Attribute"),t(),n(75,"th"),e(76,"Description"),t(),n(77,"th"),e(78,"Default"),t()()(),n(79,"tbody")(80,"tr")(81,"td")(82,"code"),e(83,"commandPublisher"),t()(),n(84,"td"),e(85,"The publisher responsible for dispatching commands to the system."),t(),n(86,"td")(87,"code"),e(88,"DefaultCommandPubSub"),t()()(),n(89,"tr")(90,"td")(91,"code"),e(92,"eventPublisher"),t()(),n(93,"td"),e(94,"The publisher used to publish events, allowing them to be broadcasted or processed."),t(),n(95,"td")(96,"code"),e(97,"DefaultPubSub"),t()()(),n(98,"tr")(99,"td")(100,"code"),e(101,"queryPublisher"),t()(),n(102,"td"),e(103,"The publisher used for publishing queries, which can trigger data retrieval operations."),t(),n(104,"td")(105,"code"),e(106,"DefaultQueryPubSub"),t()()(),n(107,"tr")(108,"td")(109,"code"),e(110,"unhandledExceptionPublisher"),t()(),n(111,"td"),e(112,"Publisher responsible for handling unhandled exceptions, ensuring they are tracked and reported."),t(),n(113,"td")(114,"code"),e(115,"DefaultUnhandledExceptionPubSub"),t()()(),n(116,"tr")(117,"td")(118,"code"),e(119,"eventIdProvider"),t()(),n(120,"td"),e(121,"Service that provides unique event IDs by generating or retrieving them from event instances."),t(),n(122,"td")(123,"code"),e(124,"DefaultEventIdProvider"),t()()(),n(125,"tr")(126,"td")(127,"code"),e(128,"rethrowUnhandled"),t()(),n(129,"td"),e(130,"Determines whether unhandled exceptions should be rethrown after being processed, useful for debugging and error management."),t(),n(131,"td")(132,"code"),e(133,"false"),t()()()()(),n(134,"h4",21)(135,"span"),e(136,"Commands"),t()(),n(137,"p"),e(138,"Commands are used to change the application state. They should be task-based, rather than data centric. When a command is dispatched, it is handled by a corresponding "),n(139,"strong"),e(140,"Command Handler"),t(),e(141,". The handler is responsible for updating the application state."),t(),n(142,"app-copy-button",22)(143,"span",23),e(144),l(145,"extension"),o(146,"app-tabs",null,1),t(),n(148,"pre")(149,"code",20),e(150,`
@Injectable()
export class HeroesGameService {
  constructor(private commandBus: CommandBus) {}

  async killDragon(heroId: string, killDragonDto: KillDragonDto) {
    return this.commandBus.execute(
      new KillDragonCommand(heroId, killDragonDto.dragonId)
    );
  }
}
`),t()(),n(151,"pre")(152,"code",20),e(153,`
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
`),t()()(),n(154,"p"),e(155,"In the code snippet above, we instantiate the "),n(156,"code"),e(157,"KillDragonCommand"),t(),e(158," class and pass it to the "),n(159,"code"),e(160,"CommandBus"),t(),e(161,"'s "),n(162,"code"),e(163,"execute()"),t(),e(164," method. This is the demonstrated command class:"),t(),n(165,"app-copy-button",22)(166,"span",23),e(167),l(168,"extension"),o(169,"app-tabs",null,2),t(),n(171,"pre")(172,"code",20),e(173,`
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
`),t()(),n(174,"pre")(175,"code",20),e(176,`
export class KillDragonCommand extends Command {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}
`),t()()(),n(177,"p"),e(178,"As you can see, the "),n(179,"code"),e(180,"KillDragonCommand"),t(),e(181," class extends the "),n(182,"code"),e(183,"Command"),t(),e(184," class. The "),n(185,"code"),e(186,"Command"),t(),e(187," class is a simple utility class exported from the "),n(188,"code"),e(189,"@nestjs/cqrs"),t(),e(190," package that lets you define the command's return type. In this case, the return type is an object with an "),n(191,"code"),e(192,"actionId"),t(),e(193," property. Now, whenever the "),n(194,"code"),e(195,"KillDragonCommand"),t(),e(196," command is dispatched, the "),n(197,"code"),e(198,"CommandBus#execute()"),t(),e(199," method return-type will be inferred as "),n(200,"code"),e(201),t(),e(202,". This is useful when you want to return some data from the command handler."),t(),n(203,"blockquote",24)(204,"strong"),e(205,"Hint"),t(),e(206," Inheritance from the "),n(207,"code"),e(208,"Command"),t(),e(209,` class is optional. It is only necessary if you want to define the return type of the command.
`),t(),n(210,"p"),e(211,"The "),n(212,"code"),e(213,"CommandBus"),t(),e(214," represents a "),n(215,"strong"),e(216,"stream"),t(),e(217," of commands. It is responsible for dispatching commands to the appropriate handlers. The "),n(218,"code"),e(219,"execute()"),t(),e(220," method returns a promise, which resolves to the value returned by the handler."),t(),n(221,"p"),e(222,"Let's create a handler for the "),n(223,"code"),e(224,"KillDragonCommand"),t(),e(225," command."),t(),n(226,"app-copy-button",22)(227,"span",23),e(228),l(229,"extension"),o(230,"app-tabs",null,3),t(),n(232,"pre")(233,"code",20),e(234,`
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
`),t()(),n(235,"pre")(236,"code",20),e(237,`
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
`),t()()(),n(238,"p"),e(239,"This handler retrieves the "),n(240,"code"),e(241,"Hero"),t(),e(242," entity from the repository, calls the "),n(243,"code"),e(244,"killEnemy()"),t(),e(245," method, and then persists the changes. The "),n(246,"code"),e(247,"KillDragonHandler"),t(),e(248," class implements the "),n(249,"code"),e(250,"ICommandHandler"),t(),e(251," interface, which requires the implementation of the "),n(252,"code"),e(253,"execute()"),t(),e(254," method. The "),n(255,"code"),e(256,"execute()"),t(),e(257," method receives the command object as an argument."),t(),n(258,"p"),e(259,"Note that "),n(260,"code"),e(261,"ICommandHandler<KillDragonCommand>"),t(),e(262," forces you to return a value that matches the command's return type. In this case, the return type is an object with an "),n(263,"code"),e(264,"actionId"),t(),e(265," property. This only applies to commands that inherit from the "),n(266,"code"),e(267,"Command"),t(),e(268," class. Otherwise, you can return whatever you want."),t(),n(269,"p"),e(270,"Lastly, make sure to register the "),n(271,"code"),e(272,"KillDragonHandler"),t(),e(273," as a provider in a module:"),t(),n(274,"app-copy-button")(275,"pre")(276,"code",20),e(277,`
providers: [KillDragonHandler];
`),t()()(),n(278,"h4",25)(279,"span"),e(280,"Queries"),t()(),n(281,"p"),e(282,"Queries are used to retrieve data from the application state. They should be data centric, rather than task-based. When a query is dispatched, it is handled by a corresponding "),n(283,"strong"),e(284,"Query Handler"),t(),e(285,". The handler is responsible for retrieving the data."),t(),n(286,"p"),e(287,"The "),n(288,"code"),e(289,"QueryBus"),t(),e(290," follows the same pattern as the "),n(291,"code"),e(292,"CommandBus"),t(),e(293,". Query handlers should implement the "),n(294,"code"),e(295,"IQueryHandler"),t(),e(296," interface and be annotated with the "),n(297,"code"),e(298,"@QueryHandler()"),t(),e(299," decorator. See the following example:"),t(),n(300,"app-copy-button")(301,"pre")(302,"code",20),e(303,`
export class GetHeroQuery extends Query<Hero> {
  constructor(public readonly heroId: string) {}
}
`),t()()(),n(304,"p"),e(305,"Similar to the "),n(306,"code"),e(307,"Command"),t(),e(308," class, the "),n(309,"code"),e(310,"Query"),t(),e(311," class is a simple utility class exported from the "),n(312,"code"),e(313,"@nestjs/cqrs"),t(),e(314," package that lets you define the query's return type. In this case, the return type is a "),n(315,"code"),e(316,"Hero"),t(),e(317," object. Now, whenever the "),n(318,"code"),e(319,"GetHeroQuery"),t(),e(320," query is dispatched, the "),n(321,"code"),e(322,"QueryBus#execute()"),t(),e(323," method return-type will be inferred as "),n(324,"code"),e(325,"Promise<Hero>"),t(),e(326,"."),t(),n(327,"p"),e(328,"To retrieve the hero, we need to create a query handler:"),t(),n(329,"app-copy-button",22)(330,"span",23),e(331),l(332,"extension"),o(333,"app-tabs",null,4),t(),n(335,"pre")(336,"code",20),e(337,`
@QueryHandler(GetHeroQuery)
export class GetHeroHandler implements IQueryHandler<GetHeroQuery> {
  constructor(private repository: HeroesRepository) {}

  async execute(query: GetHeroQuery) {
    return this.repository.findOneById(query.heroId);
  }
}
`),t()(),n(338,"pre")(339,"code",20),e(340,`
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
`),t()()(),n(341,"p"),e(342,"The "),n(343,"code"),e(344,"GetHeroHandler"),t(),e(345," class implements the "),n(346,"code"),e(347,"IQueryHandler"),t(),e(348," interface, which requires the implementation of the "),n(349,"code"),e(350,"execute()"),t(),e(351," method. The "),n(352,"code"),e(353,"execute()"),t(),e(354," method receives the query object as an argument, and must return the data that matches the query's return type (in this case, a "),n(355,"code"),e(356,"Hero"),t(),e(357," object)."),t(),n(358,"p"),e(359,"Lastly, make sure to register the "),n(360,"code"),e(361,"GetHeroHandler"),t(),e(362," as a provider in a module:"),t(),n(363,"app-copy-button")(364,"pre")(365,"code",20),e(366,`
providers: [GetHeroHandler];
`),t()()(),n(367,"p"),e(368,"Now, to dispatch the query, use the "),n(369,"code"),e(370,"QueryBus"),t(),e(371,":"),t(),n(372,"app-copy-button")(373,"pre")(374,"code",20),e(375,`
const hero = await this.queryBus.execute(new GetHeroQuery(heroId)); // "hero" will be auto-inferred as "Hero" type
`),t()()(),n(376,"h4",26)(377,"span"),e(378,"Events"),t()(),n(379,"p"),e(380,"Events are used to notify other parts of the application about changes in the application state. They are dispatched by "),n(381,"strong"),e(382,"models"),t(),e(383," or directly using the "),n(384,"code"),e(385,"EventBus"),t(),e(386,". When an event is dispatched, it is handled by corresponding "),n(387,"strong"),e(388,"Event Handlers"),t(),e(389,". Handlers can then, for example, update the read model."),t(),n(390,"p"),e(391,"For demonstration purposes, let's create an event class:"),t(),n(392,"app-copy-button",22)(393,"span",23),e(394),l(395,"extension"),o(396,"app-tabs",null,5),t(),n(398,"pre")(399,"code",20),e(400,`
export class HeroKilledDragonEvent {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {}
}
`),t()(),n(401,"pre")(402,"code",20),e(403,`
export class HeroKilledDragonEvent {
  constructor(heroId, dragonId) {
    this.heroId = heroId;
    this.dragonId = dragonId;
  }
}
`),t()()(),n(404,"p"),e(405,"Now while events can be dispatched directly using the "),n(406,"code"),e(407,"EventBus.publish()"),t(),e(408," method, we can also dispatch them from the model. Let's update the "),n(409,"code"),e(410,"Hero"),t(),e(411," model to dispatch the "),n(412,"code"),e(413,"HeroKilledDragonEvent"),t(),e(414," event when the "),n(415,"code"),e(416,"killEnemy()"),t(),e(417," method is called."),t(),n(418,"app-copy-button",22)(419,"span",23),e(420),l(421,"extension"),o(422,"app-tabs",null,6),t(),n(424,"pre")(425,"code",20),e(426,`
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
  }

  killEnemy(enemyId: string) {
    // Business logic
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}
`),t()(),n(427,"pre")(428,"code",20),e(429,`
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
`),t()()(),n(430,"p"),e(431,"The "),n(432,"code"),e(433,"apply()"),t(),e(434," method is used to dispatch events. It accepts an event object as an argument. However, since our model is not aware of the "),n(435,"code"),e(436,"EventBus"),t(),e(437,", we need to associate it with the model. We can do that by using the "),n(438,"code"),e(439,"EventPublisher"),t(),e(440," class."),t(),n(441,"app-copy-button",22)(442,"span",23),e(443),l(444,"extension"),o(445,"app-tabs",null,7),t(),n(447,"pre")(448,"code",20),e(449,`
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
`),t()(),n(450,"pre")(451,"code",20),e(452,`
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
`),t()()(),n(453,"p"),e(454,"The "),n(455,"code"),e(456,"EventPublisher#mergeObjectContext"),t(),e(457," method merges the event publisher into the provided object. This object must implement the "),n(458,"code"),e(459,"IAggregateRoot"),t(),e(460," interface (or extend the "),n(461,"code"),e(462,"AggregateRoot"),t(),e(463," class). Once merged, the object will be able to publish events to the events stream."),t(),n(464,"p"),e(465,"Notice that in this example we also call the "),n(466,"code"),e(467,"commit()"),t(),e(468," method on the model. This method is used to dispatch any outstanding events. To automatically dispatch events, we can set the "),n(469,"code"),e(470,"autoCommit"),t(),e(471," property to "),n(472,"code"),e(473,"true"),t(),e(474,":"),t(),n(475,"app-copy-button")(476,"pre")(477,"code",20),e(478,`
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
    this.autoCommit = true;
  }
}
`),t()()(),n(479,"p"),e(480,"In case we want to merge the event publisher into a non-existing object, but rather into a class, we can use the "),n(481,"code"),e(482,"EventPublisher#mergeClassContext"),t(),e(483," method:"),t(),n(484,"app-copy-button")(485,"pre")(486,"code",20),e(487,`
const HeroModel = this.publisher.mergeClassContext(Hero);
const hero = new HeroModel('id'); // <-- HeroModel is a class
`),t()()(),n(488,"p"),e(489,"Now every instance of the "),n(490,"code"),e(491,"HeroModel"),t(),e(492," class will be able to publish events without using "),n(493,"code"),e(494,"mergeObjectContext()"),t(),e(495," method."),t(),n(496,"h4",27)(497,"span"),e(498,"Flexible Aggregate Roots"),t()(),n(499,"p"),e(500,"The "),n(501,"code"),e(502,"AggregateRoot"),t(),e(503," class is a concrete implementation that you can extend to add event-driven capabilities to your domain models. However, this approach requires domain entities to directly extend "),n(504,"code"),e(505,"AggregateRoot"),t(),e(506,", which can be a limitation if your applications already have an established entity inheritance hierarchy (e.g., a base "),n(507,"code"),e(508,"Entity"),t(),e(509," class or domain-specific base classes like "),n(510,"code"),e(511,"Monster"),t(),e(512,", "),n(513,"code"),e(514,"Vehicle"),t(),e(515,", etc.)."),t(),n(516,"p"),e(517,"To provide more flexibility, the "),n(518,"code"),e(519,"@nestjs/cqrs"),t(),e(520," package offers three different approaches to implementing aggregate roots:"),t(),n(521,"p")(522,"strong"),e(523,"Approach 1: Traditional (Class Inheritance)"),t()(),n(524,"p"),e(525,"This is the standard approach shown in the previous examples. It works perfectly for simple scenarios or greenfield projects."),t(),n(526,"app-copy-button")(527,"pre")(528,"code",20),e(529,`
export class Hero extends AggregateRoot {
  constructor(private id: string) {
    super();
  }

  killEnemy(enemyId: string) {
    this.apply(new HeroKilledDragonEvent(this.id, enemyId));
  }
}
`),t()()(),n(530,"p")(531,"strong"),e(532,"Approach 2: Mixin (For existing hierarchies)"),t()(),n(533,"p"),e(534,"If you already have a base class and cannot extend "),n(535,"code"),e(536,"AggregateRoot"),t(),e(537," directly, you can use the "),n(538,"code"),e(539,"WithAggregateRoot<EventBase, TBase>()"),t(),e(540," mixin function. This allows you to apply aggregate root behavior to any existing base class."),t(),n(541,"app-copy-button",22)(542,"span",23),e(543),l(544,"extension"),o(545,"app-tabs",null,8),t(),n(547,"pre")(548,"code",20),e(549,`
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
    this.apply(new DragonDiedEvent(this.id)); // Now available via mixin!
  }
}
`),t()(),n(550,"pre")(551,"code",20),e(552,`
abstract class Monster {
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
`),t()()(),n(553,"p")(554,"strong"),e(555,"Approach 3: Custom Implementation"),t()(),n(556,"p"),e(557,"For maximum control, or if you want to keep your domain layer completely framework-agnostic, you can implement the "),n(558,"code"),e(559,"IAggregateRoot"),t(),e(560," interface directly. The "),n(561,"code"),e(562,"EventPublisher"),t(),e(563," accepts any object that implements this interface."),t(),n(564,"app-copy-button")(565,"pre")(566,"code",20),e(567,`
export class CustomEntity implements IAggregateRoot {
  private events: IEvent[] = [];

  getUncommittedEvents() {
    return this.events;
  }

  publish(event: IEvent) {
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
`),t()()(),n(568,"p"),e(569,"All three approaches work seamlessly with "),n(570,"code"),e(571,"EventPublisher"),t(),e(572,", which accepts any object implementing the "),n(573,"code"),e(574,"IAggregateRoot"),t(),e(575," interface."),t(),n(576,"h4",28)(577,"span"),e(578,"Manual event publishing"),t()(),n(579,"app-copy-button")(580,"pre")(581,"code",20),e(582,`
this.eventBus.publish(new HeroKilledDragonEvent());
`),t()()(),n(583,"blockquote",24)(584,"strong"),e(585,"Hint"),t(),e(586," The "),n(587,"code"),e(588,"EventBus"),t(),e(589,` is an injectable class.
`),t(),n(590,"p"),e(591,"Each event can have multiple "),n(592,"strong"),e(593,"Event Handlers"),t(),e(594,"."),t(),n(595,"app-copy-button",22)(596,"span",23),e(597),l(598,"extension"),o(599,"app-tabs",null,9),t(),n(601,"pre")(602,"code",20),e(603,`
@EventsHandler(HeroKilledDragonEvent)
export class HeroKilledDragonHandler implements IEventHandler<HeroKilledDragonEvent> {
  constructor(private repository: HeroesRepository) {}

  handle(event: HeroKilledDragonEvent) {
    // Business logic
  }
}
`),t()()(),n(604,"blockquote",24)(605,"strong"),e(606,"Hint"),t(),e(607,` Be aware that when you start using event handlers you get out of the traditional HTTP web context.
`),n(608,"ul")(609,"li"),e(610,"Errors in "),n(611,"code"),e(612,"CommandHandlers"),t(),e(613," can still be caught by built-in "),n(614,"a",29),e(615,"Exception filters"),t(),e(616,"."),t(),n(617,"li"),e(618,"Errors in "),n(619,"code"),e(620,"EventHandlers"),t(),e(621," can't be caught by Exception filters: you will have to handle them manually. Either by a simple "),n(622,"code"),e(623,"try/catch"),t(),e(624,", using "),n(625,"a",30),e(626,"Sagas"),t(),e(627," by triggering a compensating event, or whatever other solution you choose."),t(),n(628,"li"),e(629,"HTTP Responses in "),n(630,"code"),e(631,"CommandHandlers"),t(),e(632," can still be sent back to the client."),t(),n(633,"li"),e(634,"HTTP Responses in "),n(635,"code"),e(636,"EventHandlers"),t(),e(637," cannot. If you want to send information to the client you could use "),n(638,"a",31),e(639,"WebSocket"),t(),e(640,", "),n(641,"a",32),e(642,"SSE"),t(),e(643,", or whatever other solution you choose."),t()()(),n(644,"p"),e(645,"As with commands and queries, make sure to register the "),n(646,"code"),e(647,"HeroKilledDragonHandler"),t(),e(648," as a provider in a module:"),t(),n(649,"app-copy-button")(650,"pre")(651,"code",20),e(652,`
providers: [HeroKilledDragonHandler];
`),t()()(),n(653,"h4",33)(654,"span"),e(655,"Sagas"),t()(),n(656,"p"),e(657,"Saga is a long-running process that listens to events and may trigger new commands. It is usually used to manage complex workflows in the application. For example, when a user signs up, a saga may listen to the "),n(658,"code"),e(659,"UserRegisteredEvent"),t(),e(660," and send a welcome email to the user."),t(),n(661,"p"),e(662,"Sagas are an extremely powerful feature. A single saga may listen for 1..* events. Using the "),n(663,"a",34),e(664,"RxJS"),t(),e(665," library, we can filter, map, fork, and merge event streams to create sophisticated workflows. Each saga returns an Observable which produces a command instance. This command is then dispatched "),n(666,"strong"),e(667,"asynchronously"),t(),e(668," by the "),n(669,"code"),e(670,"CommandBus"),t(),e(671,"."),t(),n(672,"p"),e(673,"Let's create a saga that listens to the "),n(674,"code"),e(675,"HeroKilledDragonEvent"),t(),e(676," and dispatches the "),n(677,"code"),e(678,"DropAncientItemCommand"),t(),e(679," command."),t(),n(680,"app-copy-button",22)(681,"span",23),e(682),l(683,"extension"),o(684,"app-tabs",null,10),t(),n(686,"pre")(687,"code",20),e(688,`
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
`),t()(),n(689,"pre")(690,"code",20),e(691,`
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
`),t()()(),n(692,"blockquote",24)(693,"strong"),e(694,"Hint"),t(),e(695," The "),n(696,"code"),e(697,"ofType"),t(),e(698," operator and the "),n(699,"code"),e(700,"@Saga()"),t(),e(701," decorator are exported from the "),n(702,"code"),e(703,"@nestjs/cqrs"),t(),e(704,` package.
`),t(),n(705,"p"),e(706,"The "),n(707,"code"),e(708,"@Saga()"),t(),e(709," decorator marks the method as a saga. The "),n(710,"code"),e(711,"events$"),t(),e(712," argument is an Observable stream of all events. The "),n(713,"code"),e(714,"ofType"),t(),e(715," operator filters the stream by the specified event type. The "),n(716,"code"),e(717,"map"),t(),e(718," operator maps the event to a new command instance."),t(),n(719,"p"),e(720,"In this example, we map the "),n(721,"code"),e(722,"HeroKilledDragonEvent"),t(),e(723," to the "),n(724,"code"),e(725,"DropAncientItemCommand"),t(),e(726," command. The "),n(727,"code"),e(728,"DropAncientItemCommand"),t(),e(729," command is then auto-dispatched by the "),n(730,"code"),e(731,"CommandBus"),t(),e(732,"."),t(),n(733,"p"),e(734,"As with query, command, and event handlers, make sure to register the "),n(735,"code"),e(736,"HeroesGameSagas"),t(),e(737," as a provider in a module:"),t(),n(738,"app-copy-button")(739,"pre")(740,"code",20),e(741,`
providers: [HeroesGameSagas];
`),t()()(),n(742,"h4",35)(743,"span"),e(744,"Unhandled exceptions"),t()(),n(745,"p"),e(746,"Event handlers are executed asynchronously, so they must always handle exceptions properly to prevent the application from entering an inconsistent state. If an exception is not handled, the "),n(747,"code"),e(748,"EventBus"),t(),e(749," will create an "),n(750,"code"),e(751,"UnhandledExceptionInfo"),t(),e(752," object and push it to the "),n(753,"code"),e(754,"UnhandledExceptionBus"),t(),e(755," stream. This stream is an "),n(756,"code"),e(757,"Observable"),t(),e(758," that can be used to process unhandled exceptions."),t(),n(759,"app-copy-button")(760,"pre")(761,"code",20),e(762,`
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
`),t()()(),n(763,"p"),e(764,"To filter out exceptions, we can use the "),n(765,"code"),e(766,"ofType"),t(),e(767," operator, as follows:"),t(),n(768,"app-copy-button")(769,"pre")(770,"code",20),e(771,`
this.unhandledExceptionsBus
  .pipe(
    takeUntil(this.destroy$),
    UnhandledExceptionBus.ofType(TransactionNotAllowedException),
  )
  .subscribe((exceptionInfo) => {
    // Handle exception here
  });
`),t()()(),n(772,"p"),e(773,"Where "),n(774,"code"),e(775,"TransactionNotAllowedException"),t(),e(776," is the exception we want to filter out."),t(),n(777,"p"),e(778,"The "),n(779,"code"),e(780,"UnhandledExceptionInfo"),t(),e(781," object contains the following properties:"),t(),n(782,"app-copy-button")(783,"pre")(784,"code",20),e(785,`
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
`),t()()(),n(786,"h4",36)(787,"span"),e(788,"Subscribing to all events"),t()(),n(789,"p")(790,"code"),e(791,"CommandBus"),t(),e(792,", "),n(793,"code"),e(794,"QueryBus"),t(),e(795," and "),n(796,"code"),e(797,"EventBus"),t(),e(798," are all "),n(799,"strong"),e(800,"Observables"),t(),e(801,". This means that we can subscribe to the entire stream and, for example, process all events. For example, we can log all events to the console, or save them to the event store."),t(),n(802,"app-copy-button")(803,"pre")(804,"code",20),e(805,`
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
`),t()()(),n(806,"h4",37)(807,"span"),e(808,"Request-scoping"),t()(),n(809,"p"),e(810,"For those coming from different programming language backgrounds, it may be surprising to learn that in Nest, most things are shared across incoming requests. This includes a connection pool to the database, singleton services with global state, and more. Keep in mind that Node.js does not follow the request/response multi-threaded stateless model, where each request is processed by a separate thread. As a result, using singleton instances is "),n(811,"strong"),e(812,"safe"),t(),e(813," for our applications."),t(),n(814,"p"),e(815,"However, there are edge cases where a request-based lifetime for the handler might be desirable. This could include scenarios like per-request caching in GraphQL applications, request tracking, or multi-tenancy. You can learn more about how to control scopes "),n(816,"a",38),e(817,"here"),t(),e(818,"."),t(),n(819,"p"),e(820,"Using request-scoped providers alongside CQRS can be complex because the "),n(821,"code"),e(822,"CommandBus"),t(),e(823,", "),n(824,"code"),e(825,"QueryBus"),t(),e(826,", and "),n(827,"code"),e(828,"EventBus"),t(),e(829," are singletons. Thankfully, the "),n(830,"code"),e(831,"@nestjs/cqrs"),t(),e(832," package simplifies this by automatically creating a new instance of request-scoped handlers for each processed command, query, or event."),t(),n(833,"p"),e(834,"To make a handler request-scoped, you can either:"),t(),n(835,"ol")(836,"li"),e(837,"Depend on a request-scoped provider."),t(),n(838,"li"),e(839,"Explicitly set its scope to "),n(840,"code"),e(841,"REQUEST"),t(),e(842," using the "),n(843,"code"),e(844,"@CommandHandler"),t(),e(845,", "),n(846,"code"),e(847,"@QueryHandler"),t(),e(848,", or "),n(849,"code"),e(850,"@EventsHandler"),t(),e(851," decorator, as shown:"),t()(),n(852,"app-copy-button")(853,"pre")(854,"code",20),e(855,`
@CommandHandler(KillDragonCommand, {
  scope: Scope.REQUEST,
})
export class KillDragonHandler {
  // Implementation here
}
`),t()()(),n(856,"p"),e(857,"To inject the request payload into any request-scoped provider, you use the "),n(858,"code"),e(859,"@Inject(REQUEST)"),t(),e(860," decorator. However, the nature of the request payload in CQRS depends on the context\u2014it could be an HTTP request, a scheduled job, or any other operation that triggers a command."),t(),n(861,"p"),e(862,"The payload must be an instance of a class extending "),n(863,"code"),e(864,"AsyncContext"),t(),e(865," (provided by "),n(866,"code"),e(867,"@nestjs/cqrs"),t(),e(868,"), which acts as the request context and holds data accessible throughout the request lifecycle."),t(),n(869,"app-copy-button")(870,"pre")(871,"code",20),e(872,`
import { AsyncContext } from '@nestjs/cqrs';

export class MyRequest extends AsyncContext {
  constructor(public readonly user: User) {
    super();
  }
}
`),t()()(),n(873,"p"),e(874,"When executing a command, pass the custom request context as the second argument to the "),n(875,"code"),e(876,"CommandBus#execute"),t(),e(877," method:"),t(),n(878,"app-copy-button")(879,"pre")(880,"code",20),e(881,`
const myRequest = new MyRequest(user);
await this.commandBus.execute(
  new KillDragonCommand(heroId, killDragonDto.dragonId),
  myRequest,
);
`),t()()(),n(882,"p"),e(883,"This makes the "),n(884,"code"),e(885,"MyRequest"),t(),e(886," instance available as the "),n(887,"code"),e(888,"REQUEST"),t(),e(889," provider to the corresponding handler:"),t(),n(890,"app-copy-button")(891,"pre")(892,"code",20),e(893,`
@CommandHandler(KillDragonCommand, {
  scope: Scope.REQUEST,
})
export class KillDragonHandler {
  constructor(
    @Inject(REQUEST) private request: MyRequest, // Inject the request context
  ) {}

  // Handler implementation here
}
`),t()()(),n(894,"p"),e(895,"You can follow the same approach for queries:"),t(),n(896,"app-copy-button")(897,"pre")(898,"code",20),e(899,`
const myRequest = new MyRequest(user);
const hero = await this.queryBus.execute(new GetHeroQuery(heroId), myRequest);
`),t()()(),n(900,"p"),e(901,"And in the query handler:"),t(),n(902,"app-copy-button")(903,"pre")(904,"code",20),e(905,`
@QueryHandler(GetHeroQuery, {
  scope: Scope.REQUEST,
})
export class GetHeroHandler {
  constructor(
    @Inject(REQUEST) private request: MyRequest, // Inject the request context
  ) {}

  // Handler implementation here
}
`),t()()(),n(906,"p"),e(907,"For events, while you can pass the request provider to "),n(908,"code"),e(909,"EventBus#publish"),t(),e(910,", this is less common. Instead, use "),n(911,"code"),e(912,"EventPublisher"),t(),e(913," to merge the request provider into a model:"),t(),n(914,"app-copy-button")(915,"pre")(916,"code",20),e(917,`
const hero = this.publisher.mergeObjectContext(
  await this.repository.findOneById(+heroId),
  this.request, // Inject the request context here
);
`),t()()(),n(918,"p"),e(919,"Request-scoped event handlers subscribing to these events will have access to the request provider."),t(),n(920,"p"),e(921,"Sagas are always singleton instances because they manage long-running processes. However, you can retrieve the request provider from event objects:"),t(),n(922,"app-copy-button")(923,"pre")(924,"code",20),e(925,`
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
`),t()()(),n(926,"p"),e(927,"Alternatively, use the "),n(928,"code"),e(929,"request.attachTo(command)"),t(),e(930," method to tie the request context to the command."),t(),n(931,"h4",39)(932,"span"),e(933,"Example"),t()(),n(934,"p"),e(935,"A working example is available "),n(936,"a",40),e(937,"here"),t(),e(938,"."),t()()),p&2){let y=r(147),b=r(170),v=r(231),k=r(334),w=r(397),j=r(423),P=r(446),M=r(546),R=r(600),q=r(685);i(144),s(" ",d(145,48,"heroes-game.service",y.isJsActive),`
`),i(4),m("hide",y.isJsActive),i(3),m("hide",!y.isJsActive),i(16),s(" ",d(168,51,"kill-dragon.command",b.isJsActive),`
`),i(4),m("hide",b.isJsActive),i(3),m("hide",!b.isJsActive),i(27),J("Promise<","{"," actionId: string ","}",">"),i(27),s(" ",d(229,54,"kill-dragon.handler",v.isJsActive),`
`),i(4),m("hide",v.isJsActive),i(3),m("hide",!v.isJsActive),i(96),s(" ",d(332,57,"get-hero.handler",k.isJsActive),`
`),i(4),m("hide",k.isJsActive),i(3),m("hide",!k.isJsActive),i(56),s(" ",d(395,60,"hero-killed-dragon.event",w.isJsActive),`
`),i(4),m("hide",w.isJsActive),i(3),m("hide",!w.isJsActive),i(19),s(" ",d(421,63,"hero.model",j.isJsActive),`
`),i(4),m("hide",j.isJsActive),i(3),m("hide",!j.isJsActive),i(16),s(" ",d(444,66,"kill-dragon.handler",P.isJsActive),`
`),i(4),m("hide",P.isJsActive),i(3),m("hide",!P.isJsActive),i(93),s(" ",d(544,69,"dragon.model",M.isJsActive),`
`),i(4),m("hide",M.isJsActive),i(3),m("hide",!M.isJsActive),i(47),s(" ",d(598,72,"hero-killed-dragon.handler",R.isJsActive),`
`),i(85),s(" ",d(683,75,"heroes-game.saga",q.isJsActive),`
`),i(4),m("hide",q.isJsActive),i(3),m("hide",!q.isJsActive)}},dependencies:[g,E,C,A,I],encapsulation:2,changeDetection:0})}return a})();var F=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-crud-generator"]],features:[S],decls:130,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/crud-generator.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","crud-generator-typescript-only"],["appAnchor","","id","introduction"],["routerLink","/cli/overview"],[1,"info"],["appAnchor","","id","generating-a-new-resource"],[1,"language-shell"],[1,"language-typescript"],[1,"warning"]],template:function(p,u){p&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"CRUD generator (TypeScript only)"),t(),n(7,"p"),e(8,"Throughout the life span of a project, when we build new features, we often need to add new resources to our application. These resources typically require multiple, repetitive operations that we have to repeat each time we define a new resource."),t(),n(9,"h4",6)(10,"span"),e(11,"Introduction"),t()(),n(12,"p"),e(13,"Let's imagine a real-world scenario, where we need to expose CRUD endpoints for 2 entities, let's say "),n(14,"strong"),e(15,"User"),t(),e(16," and "),n(17,"strong"),e(18,"Product"),t(),e(19,` entities.
Following the best practices, for each entity we would have to perform several operations, as follows:`),t(),n(20,"ul")(21,"li"),e(22,"Generate a module ("),n(23,"code"),e(24,"nest g mo"),t(),e(25,") to keep code organized and establish clear boundaries (grouping related components)"),t(),n(26,"li"),e(27,"Generate a controller ("),n(28,"code"),e(29,"nest g co"),t(),e(30,") to define CRUD routes (or queries/mutations for GraphQL applications)"),t(),n(31,"li"),e(32,"Generate a service ("),n(33,"code"),e(34,"nest g s"),t(),e(35,") to implement & isolate business logic"),t(),n(36,"li"),e(37,"Generate an entity class/interface to represent the resource data shape"),t(),n(38,"li"),e(39,"Generate Data Transfer Objects (or inputs for GraphQL applications) to define how the data will be sent over the network"),t()(),n(40,"p"),e(41,"That's a lot of steps!"),t(),n(42,"p"),e(43,"To help speed up this repetitive process, "),n(44,"a",7),e(45,"Nest CLI"),t(),e(46," provides a generator (schematic) that automatically generates all the boilerplate code to help us avoid doing all of this, and make the developer experience much simpler."),t(),n(47,"blockquote",8)(48,"strong"),e(49,"Note"),t(),e(50," The schematic supports generating "),n(51,"strong"),e(52,"HTTP"),t(),e(53," controllers, "),n(54,"strong"),e(55,"Microservice"),t(),e(56," controllers, "),n(57,"strong"),e(58,"GraphQL"),t(),e(59," resolvers (both code first and schema first), and "),n(60,"strong"),e(61,"WebSocket"),t(),e(62,` Gateways.
`),t(),n(63,"h4",9)(64,"span"),e(65,"Generating a new resource"),t()(),n(66,"p"),e(67,"To create a new resource, simply run the following command in the root directory of your project:"),t(),n(68,"pre")(69,"code",10),e(70,`
$ nest g resource
`),t()(),n(71,"p")(72,"code"),e(73,"nest g resource"),t(),e(74," command not only generates all the NestJS building blocks (module, service, controller classes) but also an entity class, DTO classes as well as the testing ("),n(75,"code"),e(76,".spec"),t(),e(77,") files."),t(),n(78,"p"),e(79,"Below you can see the generated controller file (for REST API):"),t(),n(80,"app-copy-button")(81,"pre")(82,"code",11),e(83,`
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
`),t()()(),n(84,"p"),e(85,"Also, it automatically creates placeholders for all the CRUD endpoints (routes for REST APIs, queries and mutations for GraphQL, message subscribes for both Microservices and WebSocket Gateways) - all without having to lift a finger."),t(),n(86,"blockquote",12)(87,"strong"),e(88,"Note"),t(),e(89," Generated service classes are "),n(90,"strong"),e(91,"not"),t(),e(92," tied to any specific "),n(93,"strong"),e(94,"ORM (or data source)"),t(),e(95,`. This makes the generator generic enough to meet the needs of any project. By default, all methods will contain placeholders, allowing you to populate it with the data sources specific to your project.
`),t(),n(96,"p"),e(97,"Likewise, if you want to generate resolvers for a GraphQL application, simply select the "),n(98,"code"),e(99,"GraphQL (code first)"),t(),e(100," (or "),n(101,"code"),e(102,"GraphQL (schema first)"),t(),e(103,") as your transport layer."),t(),n(104,"p"),e(105,"In this case, NestJS will generate a resolver class instead of a REST API controller:"),t(),n(106,"pre")(107,"code",10),e(108,`
$ nest g resource users

> ? What transport layer do you use? GraphQL (code first)
> ? Would you like to generate CRUD entry points? Yes
> CREATE src/users/users.module.ts (224 bytes)
> CREATE src/users/users.resolver.spec.ts (525 bytes)
> CREATE src/users/users.resolver.ts (1109 bytes)
> CREATE src/users/users.service.spec.ts (453 bytes)
> CREATE src/users/users.service.ts (625 bytes)
> CREATE src/users/dto/create-user.input.ts (195 bytes)
> CREATE src/users/dto/update-user.input.ts (281 bytes)
> CREATE src/users/entities/user.entity.ts (187 bytes)
> UPDATE src/app.module.ts (312 bytes)
`),t()(),n(109,"blockquote",8)(110,"strong"),e(111,"Hint"),t(),e(112," To avoid generating test files, you can pass the "),n(113,"code"),e(114,"--no-spec"),t(),e(115," flag, as follows: "),n(116,"code"),e(117,"nest g resource users --no-spec"),t()(),n(118,"p"),e(119,"We can see below, that not only were all boilerplate mutations and queries created, but everything is all tied together. We're utilizing the "),n(120,"code"),e(121,"UsersService"),t(),e(122,", "),n(123,"code"),e(124,"User"),t(),e(125," Entity, and our DTO's."),t(),n(126,"app-copy-button")(127,"pre")(128,"code",11),e(129,`
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.remove(id);
  }
}
`),t()()()())},dependencies:[g,A,E],encapsulation:2,changeDetection:0})}return a})();var G=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-documentation"]],features:[S],decls:53,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/documentation.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","documentation"],["appAnchor","","id","setup"],[1,"language-bash"],["appAnchor","","id","generation"],["rel","nofollow","target","_blank","href","https://compodoc.app/guides/usage.html"],["rel","nofollow","target","_blank","href","http://localhost:8080"],["src","/assets/documentation-compodoc-1.jpg"],["src","/assets/documentation-compodoc-2.jpg"],["appAnchor","","id","contribute"],["rel","nofollow","target","_blank","href","https://github.com/compodoc/compodoc"]],template:function(p,u){p&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Documentation"),t(),n(7,"p")(8,"strong"),e(9,"Compodoc"),t(),e(10," is a documentation tool for Angular applications. Since Nest and Angular share similar project and code structures, "),n(11,"strong"),e(12,"Compodoc"),t(),e(13," works with Nest applications as well."),t(),n(14,"h4",6)(15,"span"),e(16,"Setup"),t()(),n(17,"p"),e(18,"Setting up Compodoc inside an existing Nest project is very simple. Start by adding the dev-dependency with the following command in your OS terminal:"),t(),n(19,"pre")(20,"code",7),e(21,`
$ npm i -D @compodoc/compodoc
`),t()(),n(22,"h4",8)(23,"span"),e(24,"Generation"),t()(),n(25,"p"),e(26,"Generate project documentation using the following command (npm 6 is required for "),n(27,"code"),e(28,"npx"),t(),e(29," support). See "),n(30,"a",9),e(31,"the official documentation"),t(),e(32," for more options."),t(),n(33,"pre")(34,"code",7),e(35,`
$ npx @compodoc/compodoc -p tsconfig.json -s
`),t()(),n(36,"p"),e(37,"Open your browser and navigate to "),n(38,"a",10),e(39,"http://localhost:8080"),t(),e(40,". You should see an initial Nest CLI project:"),t(),n(41,"figure"),o(42,"img",11),t(),n(43,"figure"),o(44,"img",12),t(),n(45,"h4",13)(46,"span"),e(47,"Contribute"),t()(),n(48,"p"),e(49,"You can participate and contribute to the Compodoc project "),n(50,"a",14),e(51,"here"),t(),e(52,"."),t()())},dependencies:[g],encapsulation:2,changeDetection:0})}return a})();var W=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-hot-reload"]],features:[S],decls:250,vars:4,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/hot-reload.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","hot-reload"],["rel","nofollow","target","_blank","href","https://github.com/webpack/webpack"],[1,"warning"],["id","with-cli"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/cli/overview"],["appAnchor","","id","installation"],[1,"language-bash"],[1,"info"],["appAnchor","","id","configuration"],[1,"language-typescript"],["appAnchor","","id","hot-module-replacement"],[1,"language-json"],["id","without-cli"],["appAnchor","","id","installation-1"],["appAnchor","","id","configuration-1"],["appAnchor","","id","hot-module-replacement-1"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/08-webpack"]],template:function(p,u){p&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Hot Reload"),t(),n(7,"p"),e(8,"The highest impact on your application's bootstrapping process is "),n(9,"strong"),e(10,"TypeScript compilation"),t(),e(11,". Fortunately, with "),n(12,"a",6),e(13,"webpack"),t(),e(14," HMR (Hot-Module Replacement), we don't need to recompile the entire project each time a change occurs. This significantly decreases the amount of time necessary to instantiate your application, and makes iterative development a lot easier."),t(),n(15,"blockquote",7)(16,"strong"),e(17,"Warning"),t(),e(18," Note that "),n(19,"code"),e(20,"webpack"),t(),e(21," won't automatically copy your assets (e.g. "),n(22,"code"),e(23,"graphql"),t(),e(24," files) to the "),n(25,"code"),e(26,"dist"),t(),e(27," folder. Similarly, "),n(28,"code"),e(29,"webpack"),t(),e(30," is not compatible with glob static paths (e.g., the "),n(31,"code"),e(32,"entities"),t(),e(33," property in "),n(34,"code"),e(35,"TypeOrmModule"),t(),e(36,`).
`),t(),n(37,"h3",8),e(38,"With CLI"),t(),n(39,"p"),e(40,"If you are using the "),n(41,"a",9),e(42,"Nest CLI"),t(),e(43,", the configuration process is pretty straightforward. The CLI wraps "),n(44,"code"),e(45,"webpack"),t(),e(46,", which allows use of the "),n(47,"code"),e(48,"HotModuleReplacementPlugin"),t(),e(49,"."),t(),n(50,"h4",10)(51,"span"),e(52,"Installation"),t()(),n(53,"p"),e(54,"First install the required packages:"),t(),n(55,"pre")(56,"code",11),e(57,`
$ npm i --save-dev webpack-node-externals run-script-webpack-plugin webpack
`),t()(),n(58,"blockquote",12)(59,"strong"),e(60,"Hint"),t(),e(61," If you use "),n(62,"strong"),e(63,"Yarn Berry"),t(),e(64," (not classic Yarn), install the "),n(65,"code"),e(66,"webpack-pnp-externals"),t(),e(67," package instead of the "),n(68,"code"),e(69,"webpack-node-externals"),t(),e(70,`.
`),t(),n(71,"h4",13)(72,"span"),e(73,"Configuration"),t()(),n(74,"p"),e(75,"Once the installation is complete, create a "),n(76,"code"),e(77,"webpack-hmr.config.js"),t(),e(78," file in the root directory of your application."),t(),n(79,"app-copy-button")(80,"pre")(81,"code",14),e(82,`
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');

module.exports = function (options, webpack) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\\.js$/, /\\.d\\.ts$/],
      }),
      new RunScriptWebpackPlugin({ name: options.output.filename, autoRestart: false }),
    ],
  };
};
`),t()()(),n(83,"blockquote",12)(84,"strong"),e(85,"Hint"),t(),e(86," With "),n(87,"strong"),e(88,"Yarn Berry"),t(),e(89," (not classic Yarn), instead of using the "),n(90,"code"),e(91,"nodeExternals"),t(),e(92," in the "),n(93,"code"),e(94,"externals"),t(),e(95," configuration property, use the "),n(96,"code"),e(97,"WebpackPnpExternals"),t(),e(98," from "),n(99,"code"),e(100,"webpack-pnp-externals"),t(),e(101," package: "),n(102,"code"),e(103),t(),e(104,`.
`),t(),n(105,"p"),e(106,"This function takes the original object containing the default webpack configuration as a first argument, and the reference to the underlying "),n(107,"code"),e(108,"webpack"),t(),e(109," package used by the Nest CLI as the second one. Also, it returns a modified webpack configuration with the "),n(110,"code"),e(111,"HotModuleReplacementPlugin"),t(),e(112,", "),n(113,"code"),e(114,"WatchIgnorePlugin"),t(),e(115,", and "),n(116,"code"),e(117,"RunScriptWebpackPlugin"),t(),e(118," plugins."),t(),n(119,"h4",15)(120,"span"),e(121,"Hot-Module Replacement"),t()(),n(122,"p"),e(123,"To enable "),n(124,"strong"),e(125,"HMR"),t(),e(126,", open the application entry file ("),n(127,"code"),e(128,"main.ts"),t(),e(129,") and add the following webpack-related instructions:"),t(),n(130,"app-copy-button")(131,"pre")(132,"code",14),e(133,`
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
`),t()()(),n(134,"p"),e(135,"To simplify the execution process, add a script to your "),n(136,"code"),e(137,"package.json"),t(),e(138," file."),t(),n(139,"pre")(140,"code",16),e(141,`
"start:dev": "nest build --webpack --webpackPath webpack-hmr.config.js --watch"
`),t()(),n(142,"p"),e(143,"Now simply open your command line and run the following command:"),t(),n(144,"pre")(145,"code",11),e(146,`
$ npm run start:dev
`),t()(),n(147,"h3",17),e(148,"Without CLI"),t(),n(149,"p"),e(150,"If you are not using the "),n(151,"a",9),e(152,"Nest CLI"),t(),e(153,", the configuration will be slightly more complex (will require more manual steps)."),t(),n(154,"h4",18)(155,"span"),e(156,"Installation"),t()(),n(157,"p"),e(158,"First install the required packages:"),t(),n(159,"pre")(160,"code",11),e(161,`
$ npm i --save-dev webpack webpack-cli webpack-node-externals ts-loader run-script-webpack-plugin
`),t()(),n(162,"blockquote",12)(163,"strong"),e(164,"Hint"),t(),e(165," If you use "),n(166,"strong"),e(167,"Yarn Berry"),t(),e(168," (not classic Yarn), install the "),n(169,"code"),e(170,"webpack-pnp-externals"),t(),e(171," package instead of the "),n(172,"code"),e(173,"webpack-node-externals"),t(),e(174,`.
`),t(),n(175,"h4",19)(176,"span"),e(177,"Configuration"),t()(),n(178,"p"),e(179,"Once the installation is complete, create a "),n(180,"code"),e(181,"webpack.config.js"),t(),e(182," file in the root directory of your application."),t(),n(183,"app-copy-button")(184,"pre")(185,"code",14),e(186,`
const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');

module.exports = {
  entry: ['webpack/hot/poll?100', './src/main.ts'],
  target: 'node',
  externals: [
    nodeExternals({
      allowlist: ['webpack/hot/poll?100'],
    }),
  ],
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [new webpack.HotModuleReplacementPlugin(), new RunScriptWebpackPlugin({ name: 'server.js', autoRestart: false })],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'server.js',
  },
};
`),t()()(),n(187,"blockquote",12)(188,"strong"),e(189,"Hint"),t(),e(190," With "),n(191,"strong"),e(192,"Yarn Berry"),t(),e(193," (not classic Yarn), instead of using the "),n(194,"code"),e(195,"nodeExternals"),t(),e(196," in the "),n(197,"code"),e(198,"externals"),t(),e(199," configuration property, use the "),n(200,"code"),e(201,"WebpackPnpExternals"),t(),e(202," from "),n(203,"code"),e(204,"webpack-pnp-externals"),t(),e(205," package: "),n(206,"code"),e(207),t(),e(208,`.
`),t(),n(209,"p"),e(210,"This configuration tells webpack a few essential things about your application: location of the entry file, which directory should be used to hold "),n(211,"strong"),e(212,"compiled"),t(),e(213," files, and what kind of loader we want to use to compile source files. Generally, you should be able to use this file as-is, even if you don't fully understand all of the options."),t(),n(214,"h4",20)(215,"span"),e(216,"Hot-Module Replacement"),t()(),n(217,"p"),e(218,"To enable "),n(219,"strong"),e(220,"HMR"),t(),e(221,", open the application entry file ("),n(222,"code"),e(223,"main.ts"),t(),e(224,") and add the following webpack-related instructions:"),t(),n(225,"app-copy-button")(226,"pre")(227,"code",14),e(228,`
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
`),t()()(),n(229,"p"),e(230,"To simplify the execution process, add a script to your "),n(231,"code"),e(232,"package.json"),t(),e(233," file."),t(),n(234,"pre")(235,"code",16),e(236,`
"start:dev": "webpack --config webpack.config.js --watch"
`),t()(),n(237,"p"),e(238,"Now simply open your command line and run the following command:"),t(),n(239,"pre")(240,"code",11),e(241,`
$ npm run start:dev
`),t()(),n(242,"h4",21)(243,"span"),e(244,"Example"),t()(),n(245,"p"),e(246,"A working example is available "),n(247,"a",22),e(248,"here"),t(),e(249,"."),t()()),p&2&&(i(103),J("WebpackPnpExternals(","{"," exclude: ['webpack/hot/poll?100'] ","}",")"),i(104),J("WebpackPnpExternals(","{"," exclude: ['webpack/hot/poll?100'] ","}",")"))},dependencies:[g,E],encapsulation:2,changeDetection:0})}return a})();var Q=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-mikroorm"]],features:[S],decls:326,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/mikroorm.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","mikroorm"],["rel","nofollow","target","_blank","href","https://mikro-orm.io/docs"],[1,"info"],["rel","nofollow","target","_blank","href","https://github.com/mikro-orm/nestjs"],["appAnchor","","id","installation"],[1,"language-bash"],["rel","nofollow","target","_blank","href","https://mikro-orm.io/docs/usage-with-sql/"],[1,"language-typescript"],["rel","nofollow","target","_blank","href","https://mikro-orm.io/docs/configuration"],["rel","nofollow","target","_blank","href","https://mikro-orm.io/docs/installation#setting-up-the-commandline-tool"],[1,"language-ts"],["appAnchor","","id","repositories"],["rel","nofollow","target","_blank","href","https://mikro-orm.io/docs/repositories"],["appAnchor","","id","using-custom-repositories"],["appAnchor","","id","load-entities-automatically"],["appAnchor","","id","serialization"],[1,"warning"],["href","/techniques/serialization"],["rel","nofollow","target","_blank","href","https://mikro-orm.io/docs/serializing"],["appAnchor","","id","request-scoped-handlers-in-queues"],["rel","nofollow","target","_blank","href","https://mikro-orm.io/docs/identity-map"],["appAnchor","","id","testing"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/mikro-orm/nestjs-realworld-example-app"]],template:function(p,u){p&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"MikroORM"),t(),n(7,"p"),e(8,"This recipe is here to help users get started with MikroORM in Nest. MikroORM is the TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns. It is a great alternative to TypeORM and migration from TypeORM should be fairly easy. The complete documentation on MikroORM can be found "),n(9,"a",6),e(10,"here"),t(),e(11,"."),t(),n(12,"blockquote",7)(13,"strong"),e(14,"info"),t(),n(15,"code"),e(16,"@mikro-orm/nestjs"),t(),e(17," is a third party package and is not managed by the NestJS core team. Please report any issues found with the library in the "),n(18,"a",8),e(19,"appropriate repository"),t(),e(20,`.
`),t(),n(21,"h4",9)(22,"span"),e(23,"Installation"),t()(),n(24,"p"),e(25,"Easiest way to integrate MikroORM to Nest is via "),n(26,"a",8)(27,"code"),e(28,"@mikro-orm/nestjs"),t(),e(29," module"),t(),e(30,`.
Simply install it next to Nest, MikroORM and underlying driver:`),t(),n(31,"pre")(32,"code",10),e(33,`
$ npm i @mikro-orm/core @mikro-orm/nestjs @mikro-orm/sqlite
`),t()(),n(34,"p"),e(35,"MikroORM also supports "),n(36,"code"),e(37,"postgres"),t(),e(38,", "),n(39,"code"),e(40,"sqlite"),t(),e(41,", and "),n(42,"code"),e(43,"mongo"),t(),e(44,". See the "),n(45,"a",11),e(46,"official docs"),t(),e(47," for all drivers."),t(),n(48,"p"),e(49,"Once the installation process is completed, we can import the "),n(50,"code"),e(51,"MikroOrmModule"),t(),e(52," into the root "),n(53,"code"),e(54,"AppModule"),t(),e(55,"."),t(),n(56,"app-copy-button")(57,"pre")(58,"code",12),e(59,`
import { SqliteDriver } from '@mikro-orm/sqlite';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      entities: ['./dist/entities'],
      entitiesTs: ['./src/entities'],
      dbName: 'my-db-name.sqlite3',
      driver: SqliteDriver,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`),t()()(),n(60,"p"),e(61,"The "),n(62,"code"),e(63,"forRoot()"),t(),e(64," method accepts the same configuration object as "),n(65,"code"),e(66,"init()"),t(),e(67," from the MikroORM package. Check "),n(68,"a",13),e(69,"this page"),t(),e(70," for the complete configuration documentation."),t(),n(71,"p"),e(72,"Alternatively we can "),n(73,"a",14),e(74,"configure the CLI"),t(),e(75," by creating a configuration file "),n(76,"code"),e(77,"mikro-orm.config.ts"),t(),e(78," and then call the "),n(79,"code"),e(80,"forRoot()"),t(),e(81," without any arguments."),t(),n(82,"app-copy-button")(83,"pre")(84,"code",12),e(85,`
@Module({
  imports: [
    MikroOrmModule.forRoot(),
  ],
  ...
})
export class AppModule {}
`),t()()(),n(86,"p"),e(87,"But this won't work when you use a build tools that use tree shaking, for that it is better to provide the config explicitly:"),t(),n(88,"app-copy-button")(89,"pre")(90,"code",12),e(91,`
import config from './mikro-orm.config'; // your ORM config

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
  ],
  ...
})
export class AppModule {}
`),t()()(),n(92,"p"),e(93,"Afterward, the "),n(94,"code"),e(95,"EntityManager"),t(),e(96," will be available to inject across the entire project (without importing any module elsewhere)."),t(),n(97,"app-copy-button")(98,"pre")(99,"code",15),e(100,`
// Import everything from your driver package or \`@mikro-orm/knex\`
import { EntityManager, MikroORM } from '@mikro-orm/sqlite';

@Injectable()
export class MyService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
  ) {}
}
`),t()()(),n(101,"blockquote",7)(102,"strong"),e(103,"info"),t(),e(104," Notice that the "),n(105,"code"),e(106,"EntityManager"),t(),e(107," is imported from the "),n(108,"code"),e(109,"@mikro-orm/driver"),t(),e(110," package, where driver is "),n(111,"code"),e(112,"mysql"),t(),e(113,", "),n(114,"code"),e(115,"sqlite"),t(),e(116,", "),n(117,"code"),e(118,"postgres"),t(),e(119," or what driver you are using. In case you have "),n(120,"code"),e(121,"@mikro-orm/knex"),t(),e(122," installed as a dependency, you can also import the "),n(123,"code"),e(124,"EntityManager"),t(),e(125,` from there.
`),t(),n(126,"h4",16)(127,"span"),e(128,"Repositories"),t()(),n(129,"p"),e(130,"MikroORM supports the repository design pattern. For every entity, we can create a repository. Read the complete documentation on repositories "),n(131,"a",17),e(132,"here"),t(),e(133,". To define which repositories should be registered in the current scope you can use the "),n(134,"code"),e(135,"forFeature()"),t(),e(136," method. For example, in this way:"),t(),n(137,"blockquote",7)(138,"strong"),e(139,"info"),t(),e(140," You should "),n(141,"strong"),e(142,"not"),t(),e(143," register your base entities via "),n(144,"code"),e(145,"forFeature()"),t(),e(146,`, as there are no
repositories for those. On the other hand, base entities need to be part of the list in `),n(147,"code"),e(148,"forRoot()"),t(),e(149,` (or in the ORM config in general).
`),t(),n(150,"app-copy-button")(151,"pre")(152,"code",12),e(153,`
// photo.module.ts
@Module({
  imports: [MikroOrmModule.forFeature([Photo])],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
`),t()()(),n(154,"p"),e(155,"and import it into the root "),n(156,"code"),e(157,"AppModule"),t(),e(158,":"),t(),n(159,"app-copy-button")(160,"pre")(161,"code",12),e(162,`
// app.module.ts
@Module({
  imports: [MikroOrmModule.forRoot(...), PhotoModule],
})
export class AppModule {}
`),t()()(),n(163,"p"),e(164,"In this way we can inject the "),n(165,"code"),e(166,"PhotoRepository"),t(),e(167," to the "),n(168,"code"),e(169,"PhotoService"),t(),e(170," using the "),n(171,"code"),e(172,"@InjectRepository()"),t(),e(173," decorator:"),t(),n(174,"app-copy-button")(175,"pre")(176,"code",12),e(177,`
@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: EntityRepository<Photo>,
  ) {}
}
`),t()()(),n(178,"h4",18)(179,"span"),e(180,"Using custom repositories"),t()(),n(181,"p"),e(182,"When using custom repositories, we no longer need the "),n(183,"code"),e(184,"@InjectRepository()"),t(),e(185,`
decorator, as Nest DI resolved based on the class references.`),t(),n(186,"app-copy-button")(187,"pre")(188,"code",15),e(189,`
// \`**./author.entity.ts**\`
@Entity({ repository: () => AuthorRepository })
export class Author {
  // to allow inference in \`em.getRepository()\`
  [EntityRepositoryType]?: AuthorRepository;
}

// \`**./author.repository.ts**\`
export class AuthorRepository extends EntityRepository<Author> {
  // your custom methods...
}
`),t()()(),n(190,"p"),e(191,"As the custom repository name is the same as what "),n(192,"code"),e(193,"getRepositoryToken()"),t(),e(194,` would
return, we do not need the `),n(195,"code"),e(196,"@InjectRepository()"),t(),e(197," decorator anymore:"),t(),n(198,"app-copy-button")(199,"pre")(200,"code",15),e(201,`
@Injectable()
export class MyService {
  constructor(private readonly repo: AuthorRepository) {}
}
`),t()()(),n(202,"h4",19)(203,"span"),e(204,"Load entities automatically"),t()(),n(205,"p"),e(206,`Manually adding entities to the entities array of the connection options can be
tedious. In addition, referencing entities from the root module breaks application
domain boundaries and causes leaking implementation details to other parts of the
application. To solve this issue, static glob paths can be used.`),t(),n(207,"p"),e(208,`Note, however, that glob paths are not supported by webpack, so if you are building
your application within a monorepo, you won't be able to use them. To address this
issue, an alternative solution is provided. To automatically load entities, set the
`),n(209,"code"),e(210,"autoLoadEntities"),t(),e(211," property of the configuration object (passed into the "),n(212,"code"),e(213,"forRoot()"),t(),e(214,`
method) to `),n(215,"code"),e(216,"true"),t(),e(217,", as shown below:"),t(),n(218,"app-copy-button")(219,"pre")(220,"code",15),e(221,`
@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
`),t()()(),n(222,"p"),e(223,"With that option specified, every entity registered through the "),n(224,"code"),e(225,"forFeature()"),t(),e(226,`
method will be automatically added to the entities array of the configuration
object.`),t(),n(227,"blockquote",7)(228,"strong"),e(229,"info"),t(),e(230," Note that entities that aren't registered through the "),n(231,"code"),e(232,"forFeature()"),t(),e(233,` method, but
are only referenced from the entity (via a relationship), won't be included by
way of the `),n(234,"code"),e(235,"autoLoadEntities"),t(),e(236,` setting.
`),t(),n(237,"blockquote",7)(238,"strong"),e(239,"info"),t(),e(240," Using "),n(241,"code"),e(242,"autoLoadEntities"),t(),e(243,` also has no effect on the MikroORM CLI - for that we
still need CLI config with the full list of entities. On the other hand, we can
use globs there, as the CLI won't go thru webpack.
`),t(),n(244,"h4",20)(245,"span"),e(246,"Serialization"),t()(),n(247,"blockquote",21)(248,"strong"),e(249,"Note"),t(),e(250," MikroORM wraps every single entity relation in a "),n(251,"code"),e(252,"Reference<T>"),t(),e(253," or a "),n(254,"code"),e(255,"Collection<T>"),t(),e(256," object, in order to provide better type-safety. This will make "),n(257,"a",22),e(258,"Nest's built-in serializer"),t(),e(259,` blind to any wrapped relations. In other words, if you return MikroORM entities from your HTTP or WebSocket handlers, all of their relations will NOT be serialized.
`),t(),n(260,"p"),e(261,"Luckily, MikroORM provides a "),n(262,"a",23),e(263,"serialization API"),t(),e(264," which can be used in lieu of "),n(265,"code"),e(266,"ClassSerializerInterceptor"),t(),e(267,"."),t(),n(268,"app-copy-button")(269,"pre")(270,"code",12),e(271,`
@Entity()
export class Book {
  @Property({ hidden: true }) // Equivalent of class-transformer's \`@Exclude\`
  hiddenField = Date.now();

  @Property({ persist: false }) // Similar to class-transformer's \`@Expose()\`. Will only exist in memory, and will be serialized.
  count?: number;

  @ManyToOne({
    serializer: (value) => value.name,
    serializedName: 'authorName',
  }) // Equivalent of class-transformer's \`@Transform()\`
  author: Author;
}
`),t()()(),n(272,"h4",24)(273,"span"),e(274,"Request scoped handlers in queues"),t()(),n(275,"p"),e(276,"As mentioned in the "),n(277,"a",25),e(278,"docs"),t(),e(279,", we need a clean state for each request. That is handled automatically thanks to the "),n(280,"code"),e(281,"RequestContext"),t(),e(282," helper registered via middleware."),t(),n(283,"p"),e(284,`But middlewares are executed only for regular HTTP request handles, what if we need
a request scoped method outside of that? One example of that is queue handlers or
scheduled tasks.`),t(),n(285,"p"),e(286,"We can use the "),n(287,"code"),e(288,"@CreateRequestContext()"),t(),e(289,` decorator. It requires you to first inject the
`),n(290,"code"),e(291,"MikroORM"),t(),e(292,` instance to current context, it will be then used to create the context
for you. Under the hood, the decorator will register new request context for your
method and execute it inside the context.`),t(),n(293,"app-copy-button")(294,"pre")(295,"code",15),e(296,`
@Injectable()
export class MyService {
  constructor(private readonly orm: MikroORM) {}

  @CreateRequestContext()
  async doSomething() {
    // this will be executed in a separate context
  }
}
`),t()()(),n(297,"blockquote",21)(298,"strong"),e(299,"Note"),t(),e(300," As the name suggests, this decorator always creates new context, as opposed to its alternative "),n(301,"code"),e(302,"@EnsureRequestContext"),t(),e(303,` that only creates it if it's already not inside another one.
`),t(),n(304,"h4",26)(305,"span"),e(306,"Testing"),t()(),n(307,"p"),e(308,"The "),n(309,"code"),e(310,"@mikro-orm/nestjs"),t(),e(311," package exposes "),n(312,"code"),e(313,"getRepositoryToken()"),t(),e(314," function that returns prepared token based on a given entity to allow mocking the repository."),t(),n(315,"app-copy-button")(316,"pre")(317,"code",12),e(318,`
@Module({
  providers: [
    PhotoService,
    {
      // or when you have a custom repository: \`provide: PhotoRepository\`
      provide: getRepositoryToken(Photo),
      useValue: mockedRepository,
    },
  ],
})
export class PhotoModule {}
`),t()()(),n(319,"h4",27)(320,"span"),e(321,"Example"),t()(),n(322,"p"),e(323,"A real world example of NestJS with MikroORM can be found "),n(324,"a",28),e(325,"here"),t()()())},dependencies:[g,E],encapsulation:2,changeDetection:0})}return a})();var z=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-mongodb"]],features:[S],decls:242,vars:36,consts:[["contentReference",""],["appac384f9b9800c5b91a77721df94d49c3441b7dfb",""],["app762a4f4c07d21938bd6002b84377d3ad8b13fbc4",""],["app60af228eadce765d2a5d9b5d365b2292c8ccabf4",""],["appa86d128bc392856e28804f658c29712d01733636",""],["app9323d2907fbbe92f074606680661cf833fc7b282",""],["app77cc3ab42ac5ce504ed9cd932d9c5e575a3ba506",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/mongodb.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","mongodb-mongoose"],[1,""],["routerLink","/techniques/mongodb"],["rel","nofollow","target","_blank","href","https://mongoosejs.com"],["rel","nofollow","target","_blank","href","https://www.mongodb.org/"],["appAnchor","","id","getting-started"],[1,"language-typescript"],["routerLink","/fundamentals/async-components"],[1,"with-heading"],[1,"filename"],[1,"info"],["appAnchor","","id","model-injection"],["rel","nofollow","target","_blank","href","https://mongoosejs.com/docs/guide.html"],[1,"warning"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/14-mongoose-base"]],template:function(p,u){if(p&1&&(n(0,"div",7,0)(2,"div",8)(3,"a",9),o(4,"i",10),t()(),n(5,"h3",11),e(6,"MongoDB (Mongoose)"),t(),n(7,"blockquote",12)(8,"strong"),e(9,"Warning"),t(),e(10," In this article, you'll learn how to create a "),n(11,"code"),e(12,"DatabaseModule"),t(),e(13," based on the "),n(14,"strong"),e(15,"Mongoose"),t(),e(16," package from scratch using custom components. As a consequence, this solution contains a lot of overhead that you can omit using ready to use and available out-of-the-box dedicated "),n(17,"code"),e(18,"@nestjs/mongoose"),t(),e(19," package. To learn more, see "),n(20,"a",13),e(21,"here"),t(),e(22,`.
`),t(),n(23,"p")(24,"a",14),e(25,"Mongoose"),t(),e(26," is the most popular "),n(27,"a",15),e(28,"MongoDB"),t(),e(29," object modeling tool."),t(),n(30,"h4",16)(31,"span"),e(32,"Getting started"),t()(),n(33,"p"),e(34,"To start the adventure with this library we have to install all required dependencies:"),t(),n(35,"app-copy-button")(36,"pre")(37,"code",17),e(38,`
$ npm install --save mongoose
`),t()()(),n(39,"p"),e(40,"The first step we need to do is to establish the connection with our database using "),n(41,"code"),e(42,"connect()"),t(),e(43," function. The "),n(44,"code"),e(45,"connect()"),t(),e(46," function returns a "),n(47,"code"),e(48,"Promise"),t(),e(49,", and therefore we have to create an "),n(50,"a",18),e(51,"async provider"),t(),e(52,"."),t(),n(53,"app-copy-button",19)(54,"span",20),e(55),l(56,"extension"),o(57,"app-tabs",null,1),t(),n(59,"pre")(60,"code",17),e(61,`
import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect('mongodb://localhost/nest'),
  },
];
`),t()(),n(62,"pre")(63,"code",17),e(64,`
import * as mongoose from 'mongoose';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: () => mongoose.connect('mongodb://localhost/nest'),
  },
];
`),t()()(),n(65,"blockquote",21)(66,"strong"),e(67,"Hint"),t(),e(68," Following best practices, we declared the custom provider in the separated file which has a "),n(69,"code"),e(70,"*.providers.ts"),t(),e(71,` suffix.
`),t(),n(72,"p"),e(73,"Then, we need to export these providers to make them "),n(74,"strong"),e(75,"accessible"),t(),e(76," for the rest part of the application."),t(),n(77,"app-copy-button",19)(78,"span",20),e(79),l(80,"extension"),o(81,"app-tabs",null,2),t(),n(83,"pre")(84,"code",17),e(85,`
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
`),t()()(),n(86,"p"),e(87,"Now we can inject the "),n(88,"code"),e(89,"Connection"),t(),e(90," object using "),n(91,"code"),e(92,"@Inject()"),t(),e(93," decorator. Each class that would depend on the "),n(94,"code"),e(95,"Connection"),t(),e(96," async provider will wait until a "),n(97,"code"),e(98,"Promise"),t(),e(99," is resolved."),t(),n(100,"h4",22)(101,"span"),e(102,"Model injection"),t()(),n(103,"p"),e(104,"With Mongoose, everything is derived from a "),n(105,"a",23),e(106,"Schema"),t(),e(107,". Let's define the "),n(108,"code"),e(109,"CatSchema"),t(),e(110,":"),t(),n(111,"app-copy-button",19)(112,"span",20),e(113),l(114,"extension"),o(115,"app-tabs",null,3),t(),n(117,"pre")(118,"code",17),e(119,`
import * as mongoose from 'mongoose';

export const CatSchema = new mongoose.Schema({
  name: String,
  age: Number,
  breed: String,
});
`),t()()(),n(120,"p"),e(121,"The "),n(122,"code"),e(123,"CatSchema"),t(),e(124," belongs to the "),n(125,"code"),e(126,"cats"),t(),e(127," directory. This directory represents the "),n(128,"code"),e(129,"CatsModule"),t(),e(130,"."),t(),n(131,"p"),e(132,"Now it's time to create a "),n(133,"strong"),e(134,"Model"),t(),e(135," provider:"),t(),n(136,"app-copy-button",19)(137,"span",20),e(138),l(139,"extension"),o(140,"app-tabs",null,4),t(),n(142,"pre")(143,"code",17),e(144,`
import { Connection } from 'mongoose';
import { CatSchema } from './schemas/cat.schema';

export const catsProviders = [
  {
    provide: 'CAT_MODEL',
    useFactory: (connection: Connection) => connection.model('Cat', CatSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
`),t()(),n(145,"pre")(146,"code",17),e(147,`
import { CatSchema } from './schemas/cat.schema';

export const catsProviders = [
  {
    provide: 'CAT_MODEL',
    useFactory: (connection) => connection.model('Cat', CatSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
`),t()()(),n(148,"blockquote",24)(149,"strong"),e(150,"Warning"),t(),e(151," In the real-world applications you should avoid "),n(152,"strong"),e(153,"magic strings"),t(),e(154,". Both "),n(155,"code"),e(156,"CAT_MODEL"),t(),e(157," and "),n(158,"code"),e(159,"DATABASE_CONNECTION"),t(),e(160," should be kept in the separated "),n(161,"code"),e(162,"constants.ts"),t(),e(163,` file.
`),t(),n(164,"p"),e(165,"Now we can inject the "),n(166,"code"),e(167,"CAT_MODEL"),t(),e(168," to the "),n(169,"code"),e(170,"CatsService"),t(),e(171," using the "),n(172,"code"),e(173,"@Inject()"),t(),e(174," decorator:"),t(),n(175,"app-copy-button",19)(176,"span",20),e(177),l(178,"extension"),o(179,"app-tabs",null,5),t(),n(181,"pre")(182,"code",17),e(183,`
import { Model } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';
import { CreateCatDto } from './dto/create-cat.dto';

@Injectable()
export class CatsService {
  constructor(
    @Inject('CAT_MODEL')
    private catModel: Model<Cat>,
  ) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll(): Promise<Cat[]> {
    return this.catModel.find().exec();
  }
}
`),t()(),n(184,"pre")(185,"code",17),e(186,`
import { Injectable, Dependencies } from '@nestjs/common';

@Injectable()
@Dependencies('CAT_MODEL')
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }

  async create(createCatDto) {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll() {
    return this.catModel.find().exec();
  }
}
`),t()()(),n(187,"p"),e(188,"In the above example we have used the "),n(189,"code"),e(190,"Cat"),t(),e(191," interface. This interface extends the "),n(192,"code"),e(193,"Document"),t(),e(194," from the mongoose package:"),t(),n(195,"app-copy-button")(196,"pre")(197,"code",17),e(198,`
import { Document } from 'mongoose';

export interface Cat extends Document {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}
`),t()()(),n(199,"p"),e(200,"The database connection is "),n(201,"strong"),e(202,"asynchronous"),t(),e(203,", but Nest makes this process completely invisible for the end-user. The "),n(204,"code"),e(205,"CatModel"),t(),e(206," class is waiting for the db connection, and the "),n(207,"code"),e(208,"CatsService"),t(),e(209," is delayed until model is ready to use. The entire application can start when each class is instantiated."),t(),n(210,"p"),e(211,"Here is a final "),n(212,"code"),e(213,"CatsModule"),t(),e(214,":"),t(),n(215,"app-copy-button",19)(216,"span",20),e(217),l(218,"extension"),o(219,"app-tabs",null,6),t(),n(221,"pre")(222,"code",17),e(223,`
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { catsProviders } from './cats.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CatsController],
  providers: [
    CatsService,
    ...catsProviders,
  ],
})
export class CatsModule {}
`),t()()(),n(224,"blockquote",21)(225,"strong"),e(226,"Hint"),t(),e(227," Do not forget to import the "),n(228,"code"),e(229,"CatsModule"),t(),e(230," into the root "),n(231,"code"),e(232,"AppModule"),t(),e(233,`.
`),t(),n(234,"h4",25)(235,"span"),e(236,"Example"),t()(),n(237,"p"),e(238,"A working example is available "),n(239,"a",26),e(240,"here"),t(),e(241,"."),t()()),p&2){let y=r(58),b=r(82),v=r(116),k=r(141),w=r(180),j=r(220);i(55),s(" ",d(56,18,"database.providers",y.isJsActive),`
`),i(4),m("hide",y.isJsActive),i(3),m("hide",!y.isJsActive),i(17),s(" ",d(80,21,"database.module",b.isJsActive),`
`),i(34),s(" ",d(114,24,"schemas/cat.schema",v.isJsActive),`
`),i(25),s(" ",d(139,27,"cats.providers",k.isJsActive),`
`),i(4),m("hide",k.isJsActive),i(3),m("hide",!k.isJsActive),i(32),s(" ",d(178,30,"cats.service",w.isJsActive),`
`),i(4),m("hide",w.isJsActive),i(3),m("hide",!w.isJsActive),i(33),s(" ",d(218,33,"cats.module",j.isJsActive),`
`)}},dependencies:[A,g,E,C,I],encapsulation:2,changeDetection:0})}return a})();var $=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-prisma"]],features:[S],decls:684,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/prisma.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","prisma"],["rel","nofollow","target","_blank","href","https://www.prisma.io"],["rel","nofollow","target","_blank","href","https://github.com/prisma/prisma"],["rel","nofollow","target","_blank","href","https://knexjs.org/"],["rel","nofollow","target","_blank","href","https://typeorm.io/"],["rel","nofollow","target","_blank","href","https://sequelize.org/"],["rel","nofollow","target","_blank","href","https://www.prisma.io/docs/orm/reference/supported-databases"],["rel","nofollow","target","_blank","href","https://www.prisma.io/docs/orm/more/comparisons/prisma-and-typeorm#type-safety"],[1,"info"],["rel","nofollow","target","_blank","href","https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres"],["rel","nofollow","target","_blank","href","https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma"],["rel","nofollow","target","_blank","href","https://www.prisma.io/docs"],["rel","nofollow","target","_blank","href","https://github.com/prisma/prisma-examples/tree/b53fad046a6d55f0090ddce9fd17ec3f9b95cab3/orm/nest"],["rel","nofollow","target","_blank","href","https://github.com/prisma/prisma-examples/tree/b53fad046a6d55f0090ddce9fd17ec3f9b95cab3/orm/nest-graphql"],["rel","nofollow","target","_blank","href","https://github.com/prisma/prisma-examples/"],["appAnchor","","id","getting-started"],["rel","nofollow","target","_blank","href","https://sqlite.org/"],["rel","nofollow","target","_blank","href","https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project-typescript-postgres"],["rel","nofollow","target","_blank","href","https://www.prisma.io/docs/guides/migrate-from-typeorm"],["appAnchor","","id","create-your-nestjs-project"],[1,"language-bash"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/first-steps"],["appAnchor","","id","set-up-prisma"],["rel","nofollow","target","_blank","href","https://www.prisma.io/docs/orm/tools/prisma-cli"],["rel","nofollow","target","_blank","href","https://github.com/motdotla/dotenv"],["appAnchor","","id","set-the-generator-output-path"],[1,"language-groovy"],["appAnchor","","id","configure-the-module-format"],["appAnchor","","id","set-the-database-connection"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/techniques/configuration"],["rel","nofollow","target","_blank","href","https://www.prisma.io/docs/orm/reference/connection-urls"],["rel","nofollow","target","_blank","href","https://dev.to/prisma/how-to-setup-a-free-postgresql-database-on-heroku-1dc1"],["appAnchor","","id","create-two-database-tables-with-prisma-migrate"],["rel","nofollow","target","_blank","href","https://www.prisma.io/docs/orm/prisma-migrate/getting-started"],[1,"language-sql"],["appAnchor","","id","install-and-generate-prisma-client"],["rel","nofollow","target","_blank","href","https://www.prisma.io/docs/orm/prisma-client/queries/crud"],["appAnchor","","id","use-prisma-client-in-your-nestjs-services"],["rel","nofollow","target","_blank","href","https://www.prisma.io/docs/orm/reference/prisma-client-reference"],[1,"language-typescript"],["id","implement-your-rest-api-routes-in-the-main-app-controller"],["id","get"],["id","post"],["id","put"],["id","delete"],["appAnchor","","id","summary"],["rel","nofollow","target","_blank","href","https://www.prisma.io/nestjs"],["rel","nofollow","target","_blank","href","https://github.com/notiz-dev/nestjs-prisma-starter#instructions"],["rel","nofollow","target","_blank","href","https://www.youtube.com/watch?v=UlVJ340UEuk&ab_channel=Prisma"],["rel","nofollow","target","_blank","href","https://github.com/marcjulian"]],template:function(p,u){p&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Prisma"),t(),n(7,"p")(8,"a",6),e(9,"Prisma"),t(),e(10," is an "),n(11,"a",7),e(12,"open-source"),t(),e(13," ORM for Node.js and TypeScript. It is used as an "),n(14,"strong"),e(15,"alternative"),t(),e(16," to writing plain SQL, or using another database access tool such as SQL query builders (like "),n(17,"a",8),e(18,"knex.js"),t(),e(19,") or ORMs (like "),n(20,"a",9),e(21,"TypeORM"),t(),e(22," and "),n(23,"a",10),e(24,"Sequelize"),t(),e(25,"). Prisma currently supports PostgreSQL, MySQL, SQL Server, SQLite, MongoDB and CockroachDB ("),n(26,"a",11),e(27,"Preview"),t(),e(28,")."),t(),n(29,"p"),e(30,"While Prisma can be used with plain JavaScript, it embraces TypeScript and provides a level to type-safety that goes beyond the guarantees other ORMs in the TypeScript ecosystem. You can find an in-depth comparison of the type-safety guarantees of Prisma and TypeORM "),n(31,"a",12),e(32,"here"),t(),e(33,"."),t(),n(34,"blockquote",13)(35,"strong"),e(36,"Note"),t(),e(37," If you want to get a quick overview of how Prisma works, you can follow the "),n(38,"a",14),e(39,"Quickstart"),t(),e(40," or read the "),n(41,"a",15),e(42,"Introduction"),t(),e(43," in the "),n(44,"a",16),e(45,"documentation"),t(),e(46,". There also are ready-to-run examples for "),n(47,"a",17),e(48,"REST"),t(),e(49," and "),n(50,"a",18),e(51,"GraphQL"),t(),e(52," in the "),n(53,"a",19)(54,"code"),e(55,"prisma-examples"),t()(),e(56,` repo.
`),t(),n(57,"h4",20)(58,"span"),e(59,"Getting started"),t()(),n(60,"p"),e(61,"In this recipe, you'll learn how to get started with NestJS and Prisma from scratch. You are going to build a sample NestJS application with a REST API that can read and write data in a database."),t(),n(62,"p"),e(63,"For the purpose of this guide, you'll use a "),n(64,"a",21),e(65,"SQLite"),t(),e(66," database to save the overhead of setting up a database server. Note that you can still follow this guide, even if you're using PostgreSQL or MySQL \u2013 you'll get extra instructions for using these databases at the right places."),t(),n(67,"blockquote",13)(68,"strong"),e(69,"Note"),t(),e(70," If you already have an existing project and consider migrating to Prisma, you can follow the guide for "),n(71,"a",22),e(72,"adding Prisma to an existing project"),t(),e(73,". If you are migrating from TypeORM, you can read the guide "),n(74,"a",23),e(75,"Migrating from TypeORM to Prisma"),t(),e(76,`.
`),t(),n(77,"h4",24)(78,"span"),e(79,"Create your NestJS project"),t()(),n(80,"p"),e(81,"To get started, install the NestJS CLI and create your app skeleton with the following commands:"),t(),n(82,"pre")(83,"code",25),e(84,`
$ npm install -g @nestjs/cli
$ nest new hello-prisma
`),t()(),n(85,"p"),e(86,"See the "),n(87,"a",26),e(88,"First steps"),t(),e(89," page to learn more about the project files created by this command. Note also that you can now run "),n(90,"code"),e(91,"npm start"),t(),e(92," to start your application. The REST API running at "),n(93,"code"),e(94,"http://localhost:3000/"),t(),e(95," currently serves a single route that's implemented in "),n(96,"code"),e(97,"src/app.controller.ts"),t(),e(98,". Over the course of this guide, you'll implement additional routes to store and retrieve data about "),n(99,"em"),e(100,"users"),t(),e(101," and "),n(102,"em"),e(103,"posts"),t(),e(104,"."),t(),n(105,"h4",27)(106,"span"),e(107,"Set up Prisma"),t()(),n(108,"p"),e(109,"Start by installing the Prisma CLI as a development dependency in your project:"),t(),n(110,"pre")(111,"code",25),e(112,`
$ cd hello-prisma
$ npm install prisma --save-dev
`),t()(),n(113,"p"),e(114,"In the following steps, we'll be utilizing the "),n(115,"a",28),e(116,"Prisma CLI"),t(),e(117,". As a best practice, it's recommended to invoke the CLI locally by prefixing it with "),n(118,"code"),e(119,"npx"),t(),e(120,":"),t(),n(121,"pre")(122,"code",25),e(123,`
$ npx prisma
`),t()(),n(124,"details")(125,"summary"),e(126,"Expand if you're using Yarn"),t(),n(127,"p"),e(128,"If you're using Yarn, then you can install the Prisma CLI as follows:"),t(),n(129,"pre")(130,"code",25),e(131,`
$ yarn add prisma --dev
`),t()(),n(132,"p"),e(133,"Once installed, you can invoke it by prefixing it with "),n(134,"code"),e(135,"yarn"),t(),e(136,":"),t(),n(137,"pre")(138,"code",25),e(139,`
$ yarn prisma
`),t()()(),n(140,"p"),e(141,"Now create your initial Prisma setup using the "),n(142,"code"),e(143,"init"),t(),e(144," command of the Prisma CLI:"),t(),n(145,"pre")(146,"code",25),e(147,`
$ npx prisma init
`),t()(),n(148,"p"),e(149,"This command creates a new "),n(150,"code"),e(151,"prisma"),t(),e(152," directory with the following contents:"),t(),n(153,"ul")(154,"li")(155,"code"),e(156,"schema.prisma"),t(),e(157,": Specifies your database connection and contains the database schema"),t(),n(158,"li")(159,"code"),e(160,"prisma.config.ts"),t(),e(161,": A configuration file for your projects"),t(),n(162,"li")(163,"code"),e(164,".env"),t(),e(165,": A "),n(166,"a",29),e(167,"dotenv"),t(),e(168," file, typically used to store your database credentials in a group of environment variables"),t()(),n(169,"h4",30)(170,"span"),e(171,"Set the generator output path"),t()(),n(172,"p"),e(173,"Specify your output "),n(174,"code"),e(175,"path"),t(),e(176," for the generated Prisma client either by passing "),n(177,"code"),e(178,"--output ../src/generated/prisma"),t(),e(179," during prisma init, or directly in your Prisma schema:"),t(),n(180,"pre")(181,"code",31),e(182,`
generator client {
  provider        = "prisma-client"
  output          = "../src/generated/prisma"
}
`),t()(),n(183,"h4",32)(184,"span"),e(185,"Configure the module format"),t()(),n(186,"p"),e(187,"Set "),n(188,"code"),e(189,"moduleFormat"),t(),e(190," in the generator to "),n(191,"code"),e(192,"cjs"),t(),e(193,":"),t(),n(194,"pre")(195,"code",31),e(196,`
generator client {
  provider        = "prisma-client"
  output          = "../src/generated/prisma"
  moduleFormat    = "cjs"
}
`),t()(),n(197,"blockquote",13)(198,"strong"),e(199,"Note"),t(),e(200," The "),n(201,"code"),e(202,"moduleFormat"),t(),e(203," configuration is required because Prisma v7 ships as an ES module by default, which does not work with NestJS's CommonJS setup. Setting "),n(204,"code"),e(205,"moduleFormat"),t(),e(206," to "),n(207,"code"),e(208,"cjs"),t(),e(209,` forces Prisma to generate a CommonJS module instead of ESM.
`),t(),n(210,"h4",33)(211,"span"),e(212,"Set the database connection"),t()(),n(213,"p"),e(214,"Your database connection is configured in the "),n(215,"code"),e(216,"datasource"),t(),e(217," block in your "),n(218,"code"),e(219,"schema.prisma"),t(),e(220," file. By default it's set to "),n(221,"code"),e(222,"postgresql"),t(),e(223,", but since you're using a SQLite database in this guide you need to adjust the "),n(224,"code"),e(225,"provider"),t(),e(226," field of the "),n(227,"code"),e(228,"datasource"),t(),e(229," block to "),n(230,"code"),e(231,"sqlite"),t(),e(232,":"),t(),n(233,"pre")(234,"code",31),e(235,`
datasource db {
  provider = "sqlite"
}

generator client {
  provider      = "prisma-client"
  output        = "../src/generated/prisma"
  moduleFormat  = "cjs"
}
`),t()(),n(236,"p"),e(237,"Now, open up "),n(238,"code"),e(239,".env"),t(),e(240," and adjust the "),n(241,"code"),e(242,"DATABASE_URL"),t(),e(243," environment variable to look as follows:"),t(),n(244,"pre")(245,"code",25),e(246,`
DATABASE_URL="file:./dev.db"
`),t()(),n(247,"p"),e(248,"Make sure you have a "),n(249,"a",34),e(250,"ConfigModule"),t(),e(251," configured, otherwise the "),n(252,"code"),e(253,"DATABASE_URL"),t(),e(254," variable will not be picked up from "),n(255,"code"),e(256,".env"),t(),e(257,"."),t(),n(258,"p"),e(259,"SQLite databases are simple files; no server is required to use a SQLite database. So instead of configuring a connection URL with a "),n(260,"em"),e(261,"host"),t(),e(262," and "),n(263,"em"),e(264,"port"),t(),e(265,", you can just point it to a local file which in this case is called "),n(266,"code"),e(267,"dev.db"),t(),e(268,". This file will be created in the next step."),t(),n(269,"details")(270,"summary"),e(271,"Expand if you're using PostgreSQL, MySQL, MsSQL or Azure SQL"),t(),n(272,"p"),e(273,"With PostgreSQL and MySQL, you need to configure the connection URL to point to the "),n(274,"em"),e(275,"database server"),t(),e(276,". You can learn more about the required connection URL format "),n(277,"a",35),e(278,"here"),t(),e(279,"."),t(),n(280,"p")(281,"strong"),e(282,"PostgreSQL"),t()(),n(283,"p"),e(284,"If you're using PostgreSQL, you have to adjust the "),n(285,"code"),e(286,"schema.prisma"),t(),e(287," and "),n(288,"code"),e(289,".env"),t(),e(290," files as follows:"),t(),n(291,"p")(292,"strong")(293,"code"),e(294,"schema.prisma"),t()()(),n(295,"pre")(296,"code",31),e(297,`
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output          = "../src/generated/prisma"
  moduleFormat  = "cjs"
}
`),t()(),n(298,"p")(299,"strong")(300,"code"),e(301,".env"),t()()(),n(302,"pre")(303,"code",25),e(304,`
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
`),t()(),n(305,"p"),e(306,"Replace the placeholders spelled in all uppercase letters with your database credentials. Note that if you're unsure what to provide for the "),n(307,"code"),e(308,"SCHEMA"),t(),e(309," placeholder, it's most likely the default value "),n(310,"code"),e(311,"public"),t(),e(312,":"),t(),n(313,"pre")(314,"code",25),e(315,`
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
`),t()(),n(316,"p"),e(317,"If you want to learn how to set up a PostgreSQL database, you can follow this guide on "),n(318,"a",36),e(319,"setting up a free PostgreSQL database on Heroku"),t(),e(320,"."),t(),n(321,"p")(322,"strong"),e(323,"MySQL"),t()(),n(324,"p"),e(325,"If you're using MySQL, you have to adjust the "),n(326,"code"),e(327,"schema.prisma"),t(),e(328," and "),n(329,"code"),e(330,".env"),t(),e(331," files as follows:"),t(),n(332,"p")(333,"strong")(334,"code"),e(335,"schema.prisma"),t()()(),n(336,"pre")(337,"code",31),e(338,`
datasource db {
  provider = "mysql"
}

generator client {
  provider = "prisma-client"
  output          = "../src/generated/prisma"
  moduleFormat  = "cjs"
}
`),t()(),n(339,"p")(340,"strong")(341,"code"),e(342,".env"),t()()(),n(343,"pre")(344,"code",25),e(345,`
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
`),t()(),n(346,"p"),e(347,"Replace the placeholders spelled in all uppercase letters with your database credentials."),t(),n(348,"p")(349,"strong"),e(350,"Microsoft SQL Server / Azure SQL Server"),t()(),n(351,"p"),e(352,"If you're using Microsoft SQL Server or Azure SQL Server, you have to adjust the "),n(353,"code"),e(354,"schema.prisma"),t(),e(355," and "),n(356,"code"),e(357,".env"),t(),e(358," files as follows:"),t(),n(359,"p")(360,"strong")(361,"code"),e(362,"schema.prisma"),t()()(),n(363,"pre")(364,"code",31),e(365,`
datasource db {
  provider = "sqlserver"
}

generator client {
  provider = "prisma-client"
  output          = "../src/generated/prisma"
  moduleFormat  = "cjs"
}
`),t()(),n(366,"p")(367,"strong")(368,"code"),e(369,".env"),t()()(),n(370,"p"),e(371,"Replace the placeholders spelled in all uppercase letters with your database credentials. Note that if you're unsure what to provide for the "),n(372,"code"),e(373,"encrypt"),t(),e(374," placeholder, it's most likely the default value "),n(375,"code"),e(376,"true"),t(),e(377,":"),t(),n(378,"pre")(379,"code",25),e(380,`
DATABASE_URL="sqlserver://HOST:PORT;database=DATABASE;user=USER;password=PASSWORD;encrypt=true"
`),t()()(),n(381,"h4",37)(382,"span"),e(383,"Create two database tables with Prisma Migrate"),t()(),n(384,"p"),e(385,"In this section, you'll create two new tables in your database using "),n(386,"a",38),e(387,"Prisma Migrate"),t(),e(388,". Prisma Migrate generates SQL migration files for your declarative data model definition in the Prisma schema. These migration files are fully customizable so that you can configure any additional features of the underlying database or include additional commands, e.g. for seeding."),t(),n(389,"p"),e(390,"Add the following two models to your "),n(391,"code"),e(392,"schema.prisma"),t(),e(393," file:"),t(),n(394,"pre")(395,"code",31),e(396,`
model User {
  id    Int     @default(autoincrement()) @id
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @default(autoincrement()) @id
  title     String
  content   String?
  published Boolean? @default(false)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}
`),t()(),n(397,"p"),e(398,"With your Prisma models in place, you can generate your SQL migration files and run them against the database. Run the following commands in your terminal:"),t(),n(399,"pre")(400,"code",25),e(401,`
$ npx prisma migrate dev --name init
`),t()(),n(402,"p"),e(403,"This "),n(404,"code"),e(405,"prisma migrate dev"),t(),e(406," command generates SQL files and directly runs them against the database. In this case, the following migration files was created in the existing "),n(407,"code"),e(408,"prisma"),t(),e(409," directory:"),t(),n(410,"pre")(411,"code",25),e(412,`
$ tree prisma
prisma
\u251C\u2500\u2500 dev.db
\u251C\u2500\u2500 migrations
\u2502   \u2514\u2500\u2500 20201207100915_init
\u2502       \u2514\u2500\u2500 migration.sql
\u2514\u2500\u2500 schema.prisma
`),t()(),n(413,"details")(414,"summary"),e(415,"Expand to view the generated SQL statements"),t(),n(416,"p"),e(417,"The following tables were created in your SQLite database:"),t(),n(418,"pre")(419,"code",39),e(420,`
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN DEFAULT false,
    "authorId" INTEGER,

    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");
`),t()()(),n(421,"h4",40)(422,"span"),e(423,"Install and generate Prisma Client"),t()(),n(424,"p"),e(425,"Prisma Client is a type-safe database client that's "),n(426,"em"),e(427,"generated"),t(),e(428," from your Prisma model definition. Because of this approach, Prisma Client can expose "),n(429,"a",41),e(430,"CRUD"),t(),e(431," operations that are "),n(432,"em"),e(433,"tailored"),t(),e(434," specifically to your models."),t(),n(435,"p"),e(436,"To install Prisma Client in your project, run the following command in your terminal:"),t(),n(437,"pre")(438,"code",25),e(439,`
$ npm install @prisma/client
`),t()(),n(440,"p"),e(441,"Once installed, you can run the generate command to generate the types and Client needed for your project. If any changes are made to your schema, you will need to rerun the "),n(442,"code"),e(443,"generate"),t(),e(444," command to keep those types in sync."),t(),n(445,"pre")(446,"code",25),e(447,`
$ npx prisma generate
`),t()(),n(448,"p"),e(449,"In addition to Prisma Client, you also need to a driver adapter for the type of database you are working with. For SQLite, you can install the "),n(450,"code"),e(451,"@prisma/adapter-better-sqlite3"),t(),e(452," driver."),t(),n(453,"pre")(454,"code",25),e(455,`
npm install @prisma/adapter-better-sqlite3
`),t()(),n(456,"details")(457,"summary"),e(458,"Expand if you're using PostgreSQL, MySQL, MsSQL, or AzureSQL"),t(),n(459,"ul")(460,"li"),e(461,"For PostgreSQL"),t()(),n(462,"pre")(463,"code",25),e(464,`
npm install @prisma/adapter-pg
`),t()(),n(465,"ul")(466,"li"),e(467,"For MySQL, MsSQL, AzureSQL:"),t()(),n(468,"pre")(469,"code",25),e(470,`
npm install @prisma/adapter-mariadb
`),t()()(),n(471,"h4",42)(472,"span"),e(473,"Use Prisma Client in your NestJS services"),t()(),n(474,"p"),e(475,"You're now able to send database queries with Prisma Client. If you want to learn more about building queries with Prisma Client, check out the "),n(476,"a",43),e(477,"API documentation"),t(),e(478,"."),t(),n(479,"p"),e(480,"When setting up your NestJS application, you'll want to abstract away the Prisma Client API for database queries within a service. To get started, you can create a new "),n(481,"code"),e(482,"PrismaService"),t(),e(483," that takes care of instantiating "),n(484,"code"),e(485,"PrismaClient"),t(),e(486," and connecting to your database."),t(),n(487,"p"),e(488,"Inside the "),n(489,"code"),e(490,"src"),t(),e(491," directory, create a new file called "),n(492,"code"),e(493,"prisma.service.ts"),t(),e(494," and add the following code to it:"),t(),n(495,"app-copy-button")(496,"pre")(497,"code",44),e(498,`
import { Injectable } from '@nestjs/common';
import { PrismaClient } from './generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
    super({ adapter });
  }
}
`),t()()(),n(499,"p"),e(500,"Next, you can write services that you can use to make database calls for the "),n(501,"code"),e(502,"User"),t(),e(503," and "),n(504,"code"),e(505,"Post"),t(),e(506," models from your Prisma schema."),t(),n(507,"p"),e(508,"Still inside the "),n(509,"code"),e(510,"src"),t(),e(511," directory, create a new file called "),n(512,"code"),e(513,"user.service.ts"),t(),e(514," and add the following code to it:"),t(),n(515,"app-copy-button")(516,"pre")(517,"code",44),e(518,`
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User, Prisma } from 'generated/prisma';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
`),t()()(),n(519,"p"),e(520,"Notice how you're using Prisma Client's generated types to ensure that the methods that are exposed by your service are properly typed. You therefore save the boilerplate of typing your models and creating additional interface or DTO files."),t(),n(521,"p"),e(522,"Now do the same for the "),n(523,"code"),e(524,"Post"),t(),e(525," model."),t(),n(526,"p"),e(527,"Still inside the "),n(528,"code"),e(529,"src"),t(),e(530," directory, create a new file called "),n(531,"code"),e(532,"post.service.ts"),t(),e(533," and add the following code to it:"),t(),n(534,"app-copy-button")(535,"pre")(536,"code",44),e(537,`
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Post, Prisma } from 'generated/prisma';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async post(
    postWhereUniqueInput: Prisma.PostWhereUniqueInput,
  ): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: postWhereUniqueInput,
    });
  }

  async posts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPost(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({
      data,
    });
  }

  async updatePost(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }): Promise<Post> {
    const { data, where } = params;
    return this.prisma.post.update({
      data,
      where,
    });
  }

  async deletePost(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.delete({
      where,
    });
  }
}
`),t()()(),n(538,"p"),e(539,"Your "),n(540,"code"),e(541,"UsersService"),t(),e(542," and "),n(543,"code"),e(544,"PostsService"),t(),e(545," currently wrap the CRUD queries that are available in Prisma Client. In a real world application, the service would also be the place to add business logic to your application. For example, you could have a method called "),n(546,"code"),e(547,"updatePassword"),t(),e(548," inside the "),n(549,"code"),e(550,"UsersService"),t(),e(551," that would be responsible for updating the password of a user."),t(),n(552,"p"),e(553,"Remember to register the new services in the app module."),t(),n(554,"h5",45),e(555,"Implement your REST API routes in the main app controller"),t(),n(556,"p"),e(557,"Finally, you'll use the services you created in the previous sections to implement the different routes of your app. For the purpose of this guide, you'll put all your routes into the already existing "),n(558,"code"),e(559,"AppController"),t(),e(560," class."),t(),n(561,"p"),e(562,"Replace the contents of the "),n(563,"code"),e(564,"app.controller.ts"),t(),e(565," file with the following code:"),t(),n(566,"app-copy-button")(567,"pre")(568,"code",44),e(569,`
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { PostsService } from './post.service';
import { User as UserModel, Post as PostModel } from 'generated/prisma';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UsersService,
    private readonly postService: PostsService,
  ) {}

  @Get('post/:id')
  async getPostById(@Param('id') id: string): Promise<PostModel> {
    return this.postService.post({ id: Number(id) });
  }

  @Get('feed')
  async getPublishedPosts(): Promise<PostModel[]> {
    return this.postService.posts({
      where: { published: true },
    });
  }

  @Get('filtered-posts/:searchString')
  async getFilteredPosts(
    @Param('searchString') searchString: string,
  ): Promise<PostModel[]> {
    return this.postService.posts({
      where: {
        OR: [
          {
            title: { contains: searchString },
          },
          {
            content: { contains: searchString },
          },
        ],
      },
    });
  }

  @Post('post')
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    const { title, content, authorEmail } = postData;
    return this.postService.createPost({
      title,
      content,
      author: {
        connect: { email: authorEmail },
      },
    });
  }

  @Post('user')
  async signupUser(
    @Body() userData: { name?: string; email: string },
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }

  @Put('publish/:id')
  async publishPost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.updatePost({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete('post/:id')
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    return this.postService.deletePost({ id: Number(id) });
  }
}
`),t()()(),n(570,"p"),e(571,"This controller implements the following routes:"),t(),n(572,"h6",46)(573,"code"),e(574,"GET"),t()(),n(575,"ul")(576,"li")(577,"code"),e(578,"/post/:id"),t(),e(579,": Fetch a single post by its "),n(580,"code"),e(581,"id"),t()(),n(582,"li")(583,"code"),e(584,"/feed"),t(),e(585,": Fetch all "),n(586,"em"),e(587,"published"),t(),e(588," posts"),t(),n(589,"li")(590,"code"),e(591,"/filter-posts/:searchString"),t(),e(592,": Filter posts by "),n(593,"code"),e(594,"title"),t(),e(595," or "),n(596,"code"),e(597,"content"),t()()(),n(598,"h6",47)(599,"code"),e(600,"POST"),t()(),n(601,"ul")(602,"li")(603,"code"),e(604,"/post"),t(),e(605,": Create a new post"),n(606,"ul")(607,"li"),e(608,"Body:"),n(609,"ul")(610,"li")(611,"code"),e(612,"title: String"),t(),e(613," (required): The title of the post"),t(),n(614,"li")(615,"code"),e(616,"content: String"),t(),e(617," (optional): The content of the post"),t(),n(618,"li")(619,"code"),e(620,"authorEmail: String"),t(),e(621," (required): The email of the user that creates the post"),t()()()()(),n(622,"li")(623,"code"),e(624,"/user"),t(),e(625,": Create a new user"),n(626,"ul")(627,"li"),e(628,"Body:"),n(629,"ul")(630,"li")(631,"code"),e(632,"email: String"),t(),e(633," (required): The email address of the user"),t(),n(634,"li")(635,"code"),e(636,"name: String"),t(),e(637," (optional): The name of the user"),t()()()()()(),n(638,"h6",48)(639,"code"),e(640,"PUT"),t()(),n(641,"ul")(642,"li")(643,"code"),e(644,"/publish/:id"),t(),e(645,": Publish a post by its "),n(646,"code"),e(647,"id"),t()()(),n(648,"h6",49)(649,"code"),e(650,"DELETE"),t()(),n(651,"ul")(652,"li")(653,"code"),e(654,"/post/:id"),t(),e(655,": Delete a post by its "),n(656,"code"),e(657,"id"),t()()(),n(658,"h4",50)(659,"span"),e(660,"Summary"),t()(),n(661,"p"),e(662,"In this recipe, you learned how to use Prisma along with NestJS to implement a REST API. The controller that implements the routes of the API is calling a "),n(663,"code"),e(664,"PrismaService"),t(),e(665," which in turn uses Prisma Client to send queries to a database to fulfill the data needs of incoming requests."),t(),n(666,"p"),e(667,"If you want to learn more about using NestJS with Prisma, be sure to check out the following resources:"),t(),n(668,"ul")(669,"li")(670,"a",51),e(671,"NestJS & Prisma"),t()(),n(672,"li")(673,"a",19),e(674,"Ready-to-run example projects for REST & GraphQL"),t()(),n(675,"li")(676,"a",52),e(677,"Production-ready starter kit"),t()(),n(678,"li")(679,"a",53),e(680,"Video: Accessing Databases using NestJS with Prisma (5min)"),t(),e(681," by "),n(682,"a",54),e(683,"Marc Stammerjohann"),t()()()())},dependencies:[g,E],encapsulation:2,changeDetection:0})}return a})();var K=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-repl"]],features:[S],decls:199,vars:8,consts:[["contentReference",""],["appd2964cb6114cc27fb21600fcff36cfe7d1e9aed1",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/repl.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","read-eval-print-loop-repl"],["appAnchor","","id","usage"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"language-bash"],[1,"info"],["rel","nofollow","target","_blank","href","https://nodejs.org/api/repl.html"],["src","/assets/repl.gif","alt","REPL example"],["appAnchor","","id","native-functions"],[1,"language-text"],["rel","nofollow","target","_blank","href","https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions"],["appAnchor","","id","watch-mode"]],template:function(p,u){if(p&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),o(4,"i",5),t()(),n(5,"h3",6),e(6,"Read-Eval-Print-Loop (REPL)"),t(),n(7,"p"),e(8,`REPL is a simple interactive environment that takes single user inputs, executes them, and returns the result to the user.
The REPL feature lets you inspect your dependency graph and call methods on your providers (and controllers) directly from your terminal.`),t(),n(9,"h4",7)(10,"span"),e(11,"Usage"),t()(),n(12,"p"),e(13,"To run your NestJS application in REPL mode, create a new "),n(14,"code"),e(15,"repl.ts"),t(),e(16," file (alongside the existing "),n(17,"code"),e(18,"main.ts"),t(),e(19," file) and add the following code inside:"),t(),n(20,"app-copy-button",8)(21,"span",9),e(22),l(23,"extension"),o(24,"app-tabs",null,1),t(),n(26,"pre")(27,"code",10),e(28,`
import { repl } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
`),t()(),n(29,"pre")(30,"code",10),e(31,`
import { repl } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
`),t()()(),n(32,"p"),e(33,"Now in your terminal, start the REPL with the following command:"),t(),n(34,"pre")(35,"code",11),e(36,`
$ npm run start -- --entryFile repl
`),t()(),n(37,"blockquote",12)(38,"strong"),e(39,"Hint"),t(),n(40,"code"),e(41,"repl"),t(),e(42," returns a "),n(43,"a",13),e(44,"Node.js REPL server"),t(),e(45,` object.
`),t(),n(46,"p"),e(47,"Once it's up and running, you should see the following message in your console:"),t(),n(48,"pre")(49,"code",11),e(50,`
LOG [NestFactory] Starting Nest application...
LOG [InstanceLoader] AppModule dependencies initialized
LOG REPL initialized
`),t()(),n(51,"p"),e(52,"And now you can start interacting with your dependencies graph. For instance, you can retrieve an "),n(53,"code"),e(54,"AppService"),t(),e(55," (we are using the starter project as an example here) and call the "),n(56,"code"),e(57,"getHello()"),t(),e(58," method:"),t(),n(59,"app-copy-button")(60,"pre")(61,"code",10),e(62,`
> get(AppService).getHello()
'Hello World!'
`),t()()(),n(63,"p"),e(64,"You can execute any JavaScript code from within your terminal, for example, assign an instance of the "),n(65,"code"),e(66,"AppController"),t(),e(67," to a local variable, and use "),n(68,"code"),e(69,"await"),t(),e(70," to call an asynchronous method:"),t(),n(71,"app-copy-button")(72,"pre")(73,"code",10),e(74,`
> appController = get(AppController)
AppController { appService: AppService {} }
> await appController.getHello()
'Hello World!'
`),t()()(),n(75,"p"),e(76,"To display all public methods available on a given provider or controller, use the "),n(77,"code"),e(78,"methods()"),t(),e(79," function, as follows:"),t(),n(80,"app-copy-button")(81,"pre")(82,"code",10),e(83,`
> methods(AppController)

Methods:
 \u25FB getHello
`),t()()(),n(84,"p"),e(85,"To print all registered modules as a list together with their controllers and providers, use "),n(86,"code"),e(87,"debug()"),t(),e(88,"."),t(),n(89,"app-copy-button")(90,"pre")(91,"code",10),e(92,`
> debug()

AppModule:
 - controllers:
  \u25FB AppController
 - providers:
  \u25FB AppService
`),t()()(),n(93,"p"),e(94,"Quick demo:"),t(),n(95,"figure"),o(96,"img",14),t(),n(97,"p"),e(98,"You can find more information about the existing, predefined native methods in the section below."),t(),n(99,"h4",15)(100,"span"),e(101,"Native functions"),t()(),n(102,"p"),e(103,"The built-in NestJS REPL comes with a few native functions that are globally available when you start REPL. You can call "),n(104,"code"),e(105,"help()"),t(),e(106," to list them out."),t(),n(107,"p"),e(108,"If you don't recall what's the signature (ie: expected parameters and a return type) of a function, you can call "),n(109,"code"),e(110,"<function_name>.help"),t(),e(111,`.
For instance:`),t(),n(112,"pre")(113,"code",16),e(114,`
> $.help
Retrieves an instance of either injectable or controller, otherwise, throws exception.
Interface: $(token: InjectionToken) => any
`),t()(),n(115,"blockquote",12)(116,"strong"),e(117,"Hint"),t(),e(118," Those function interfaces are written in "),n(119,"a",17),e(120,"TypeScript function type expression syntax"),t(),e(121,`.
`),t(),n(122,"table")(123,"thead")(124,"tr")(125,"th"),e(126,"Function"),t(),n(127,"th"),e(128,"Description"),t(),n(129,"th"),e(130,"Signature"),t()()(),n(131,"tbody")(132,"tr")(133,"td")(134,"code"),e(135,"debug"),t()(),n(136,"td"),e(137,"Print all registered modules as a list together with their controllers and providers."),t(),n(138,"td")(139,"code"),e(140,"debug(moduleCls?: ClassRef | string) => void"),t()()(),n(141,"tr")(142,"td")(143,"code"),e(144,"get"),t(),e(145," or "),n(146,"code"),e(147,"$"),t()(),n(148,"td"),e(149,"Retrieves an instance of either injectable or controller, otherwise, throws exception."),t(),n(150,"td")(151,"code"),e(152,"get(token: InjectionToken) => any"),t()()(),n(153,"tr")(154,"td")(155,"code"),e(156,"methods"),t()(),n(157,"td"),e(158,"Display all public methods available on a given provider or controller."),t(),n(159,"td")(160,"code"),e(161,"methods(token: ClassRef | string) => void"),t()()(),n(162,"tr")(163,"td")(164,"code"),e(165,"resolve"),t()(),n(166,"td"),e(167,"Resolves transient or request-scoped instance of either injectable or controller, otherwise, throws exception."),t(),n(168,"td")(169,"code"),e(170,"resolve(token: InjectionToken, contextId: any) => Promise<any>"),t()()(),n(171,"tr")(172,"td")(173,"code"),e(174,"select"),t()(),n(175,"td"),e(176,"Allows navigating through the modules tree, for example, to pull out a specific instance from the selected module."),t(),n(177,"td")(178,"code"),e(179,"select(token: DynamicModule | ClassRef) => INestApplicationContext"),t()()()()(),n(180,"h4",18)(181,"span"),e(182,"Watch mode"),t()(),n(183,"p"),e(184,"During development it is useful to run REPL in a watch mode to reflect all the code changes automatically:"),t(),n(185,"pre")(186,"code",11),e(187,`
$ npm run start -- --watch --entryFile repl
`),t()(),n(188,"p"),e(189,`This has one flaw, the REPL's command history is discarded after each reload which might be cumbersome.
Fortunately, there is a very simple solution. Modify your `),n(190,"code"),e(191,"bootstrap"),t(),e(192," function like this:"),t(),n(193,"app-copy-button")(194,"pre")(195,"code",10),e(196,`
async function bootstrap() {
  const replServer = await repl(AppModule);
  replServer.setupHistory(".nestjs_repl_history", (err) => {
    if (err) {
      console.error(err);
    }
  });
}
`),t()()(),n(197,"p"),e(198,"Now the history is preserved between the runs/reloads."),t()()),p&2){let y=r(25);i(22),s(" ",d(23,5,"repl",y.isJsActive),`
`),i(4),m("hide",y.isJsActive),i(3),m("hide",!y.isJsActive)}},dependencies:[g,E,C,I],encapsulation:2,changeDetection:0})}return a})();var Y=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-sentry"]],features:[S],decls:165,vars:16,consts:[["contentReference",""],["app5c87a09384b3946ca0ffcf12f66aef9692b1e70c",""],["app2bce3cf88d666dfc9f575f0d6ae483403c529a26",""],["app011af8ad61ae0ff262ceec1e96a23ea883d11a3c",""],["app394ea12b91ec67cc1d2eca6fec66c89c86563873",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/sentry.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","sentry"],["rel","nofollow","target","_blank","href","https://sentry.io"],["rel","nofollow","target","_blank","href","https://docs.sentry.io/platforms/javascript/guides/nestjs/"],["appAnchor","","id","installation"],[1,"language-bash"],[1,"info"],["appAnchor","","id","basic-setup"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["appAnchor","","id","exception-handling"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/exception-filters#built-in-http-exceptions"],[1,"warning"],["appAnchor","","id","readable-stack-traces"],["appAnchor","","id","testing-the-integration"],["id","summary"],["rel","nofollow","target","_blank","href","https://github.com/getsentry/sentry-javascript/issues"],["rel","nofollow","target","_blank","href","https://discord.com/invite/sentry"]],template:function(p,u){if(p&1&&(n(0,"div",5,0)(2,"div",6)(3,"a",7),o(4,"i",8),t()(),n(5,"h3",9),e(6,"Sentry"),t(),n(7,"p")(8,"a",10),e(9,"Sentry"),t(),e(10," is an error tracking and performance monitoring platform that helps developers identify and fix issues in real-time. This recipe shows how to integrate Sentry's "),n(11,"a",11),e(12,"NestJS SDK"),t(),e(13," with your NestJS application."),t(),n(14,"h4",12)(15,"span"),e(16,"Installation"),t()(),n(17,"p"),e(18,"First, install the required dependencies:"),t(),n(19,"pre")(20,"code",13),e(21,`
$ npm install --save @sentry/nestjs @sentry/profiling-node
`),t()(),n(22,"blockquote",14)(23,"strong"),e(24,"Hint"),t(),n(25,"code"),e(26,"@sentry/profiling-node"),t(),e(27,` is optional, but recommended for performance profiling.
`),t(),n(28,"h4",15)(29,"span"),e(30,"Basic setup"),t()(),n(31,"p"),e(32,"To get started with Sentry, you'll need to create a file named "),n(33,"code"),e(34,"instrument.ts"),t(),e(35," that should be imported before any other modules in your application:"),t(),n(36,"app-copy-button",16)(37,"span",17),e(38),l(39,"extension"),o(40,"app-tabs",null,1),t(),n(42,"pre")(43,"code",18),e(44,`
const Sentry = require("@sentry/nestjs");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
`),t()()(),n(45,"p"),e(46,"Update your "),n(47,"code"),e(48,"main.ts"),t(),e(49," file to import "),n(50,"code"),e(51,"instrument.ts"),t(),e(52," before other imports:"),t(),n(53,"app-copy-button",16)(54,"span",17),e(55),l(56,"extension"),o(57,"app-tabs",null,2),t(),n(59,"pre")(60,"code",18),e(61,`
// Import this first!
import "./instrument";

// Now import other modules
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
`),t()()(),n(62,"p"),e(63,"Afterwards, add the "),n(64,"code"),e(65,"SentryModule"),t(),e(66," as a root module to your main module:"),t(),n(67,"app-copy-button",16)(68,"span",17),e(69),l(70,"extension"),o(71,"app-tabs",null,3),t(),n(73,"pre")(74,"code",18),e(75,`
import { Module } from "@nestjs/common";
import { SentryModule } from "@sentry/nestjs/setup";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    SentryModule.forRoot(),
    // ...other modules
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`),t()()(),n(76,"h4",19)(77,"span"),e(78,"Exception handling"),t()(),n(79,"p"),e(80,"If you're using a global catch-all exception filter (which is either a filter registered with "),n(81,"code"),e(82,"app.useGlobalFilters()"),t(),e(83," or a filter registered in your app module providers annotated with a "),n(84,"code"),e(85,"@Catch()"),t(),e(86," decorator without arguments), add a "),n(87,"code"),e(88,"@SentryExceptionCaptured()"),t(),e(89," decorator to the filter's "),n(90,"code"),e(91,"catch()"),t(),e(92," method. This decorator will report all unexpected errors that are received by your global error filter to Sentry:"),t(),n(93,"app-copy-button")(94,"pre")(95,"code",18),e(96,`
import { Catch, ExceptionFilter } from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class YourCatchAllExceptionFilter implements ExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception, host): void {
    // your implementation here
  }
}
`),t()()(),n(97,"p"),e(98,"By default, only unhandled exceptions that are not caught by an error filter are reported to Sentry. "),n(99,"code"),e(100,"HttpExceptions"),t(),e(101," (including "),n(102,"a",20),e(103,"derivatives"),t(),e(104,") are also not captured by default because they mostly act as control flow vehicles."),t(),n(105,"p"),e(106,"If you don't have a global catch-all exception filter, add the "),n(107,"code"),e(108,"SentryGlobalFilter"),t(),e(109," to the providers of your main module. This filter will report any unhandled errors that aren't caught by other error filters to Sentry."),t(),n(110,"blockquote",21)(111,"strong"),e(112,"Warning"),t(),e(113," The "),n(114,"code"),e(115,"SentryGlobalFilter"),t(),e(116,` needs to be registered before any other exception filters.
`),t(),n(117,"app-copy-button",16)(118,"span",17),e(119),l(120,"extension"),o(121,"app-tabs",null,4),t(),n(123,"pre")(124,"code",18),e(125,`
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { SentryGlobalFilter } from "@sentry/nestjs/setup";

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    // ..other providers
  ],
})
export class AppModule {}
`),t()()(),n(126,"h4",22)(127,"span"),e(128,"Readable stack traces"),t()(),n(129,"p"),e(130,"Depending on how you've set up your project, the stack traces in your Sentry errors probably won't look like your actual code."),t(),n(131,"p"),e(132,"To fix this, upload your source maps to Sentry. The easiest way to do this is by using the Sentry Wizard:"),t(),n(133,"pre")(134,"code",13),e(135,`
npx @sentry/wizard@latest -i sourcemaps
`),t()(),n(136,"h4",23)(137,"span"),e(138,"Testing the integration"),t()(),n(139,"p"),e(140,"To verify your Sentry integration is working, you can add a test endpoint that throws an error:"),t(),n(141,"app-copy-button")(142,"pre")(143,"code",18),e(144,`
@Get("debug-sentry")
getError() {
  throw new Error("My first Sentry error!");
}
`),t()()(),n(145,"p"),e(146,"Visit "),n(147,"code"),e(148,"/debug-sentry"),t(),e(149," in your application, and you should see the error appear in your Sentry dashboard."),t(),n(150,"h3",24),e(151,"Summary"),t(),n(152,"p"),e(153,"For complete documentation about Sentry's NestJS SDK, including advanced configuration options and features, visit the "),n(154,"a",11),e(155,"official Sentry documentation"),t(),e(156,"."),t(),n(157,"p"),e(158,"While software bugs are Sentry's thing, we still write them. If you come across any problems while installing our SDK, please open a "),n(159,"a",25),e(160,"GitHub Issue"),t(),e(161," or reach out on "),n(162,"a",26),e(163,"Discord"),t(),e(164,"."),t()()),p&2){let y=r(41),b=r(58),v=r(72),k=r(122);i(38),s(" ",d(39,4,"instrument",y.isJsActive),`
`),i(17),s(" ",d(56,7,"main",b.isJsActive),`
`),i(14),s(" ",d(70,10,"app.module",v.isJsActive),`
`),i(50),s(" ",d(120,13,"app.module",k.isJsActive),`
`)}},dependencies:[g,E,C,I],encapsulation:2,changeDetection:0})}return a})();var V=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-serve-static"]],features:[S],decls:90,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/serve-static.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","serve-static"],["rel","nofollow","target","_blank","href","https://www.npmjs.com/package/@nestjs/serve-static"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","bootstrap"],[1,"language-typescript"],["appAnchor","","id","configuration"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/serve-static"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/serve-static/blob/master/lib/interfaces/serve-static-options.interface.ts"],[1,"warning"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/24-serve-static"]],template:function(p,u){p&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Serve Static"),t(),n(7,"p"),e(8,"In order to serve static content like a Single Page Application (SPA) we can use the "),n(9,"code"),e(10,"ServeStaticModule"),t(),e(11," from the "),n(12,"a",6)(13,"code"),e(14,"@nestjs/serve-static"),t()(),e(15," package."),t(),n(16,"h4",7)(17,"span"),e(18,"Installation"),t()(),n(19,"p"),e(20,"First we need to install the required package:"),t(),n(21,"pre")(22,"code",8),e(23,`
$ npm install --save @nestjs/serve-static
`),t()(),n(24,"h4",9)(25,"span"),e(26,"Bootstrap"),t()(),n(27,"p"),e(28,"Once the installation process is done, we can import the "),n(29,"code"),e(30,"ServeStaticModule"),t(),e(31," into the root "),n(32,"code"),e(33,"AppModule"),t(),e(34," and configure it by passing in a configuration object to the "),n(35,"code"),e(36,"forRoot()"),t(),e(37," method."),t(),n(38,"app-copy-button")(39,"pre")(40,"code",10),e(41,`
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`),t()()(),n(42,"p"),e(43,"With this in place, build the static website and place its content in the location specified by the "),n(44,"code"),e(45,"rootPath"),t(),e(46," property."),t(),n(47,"h4",11)(48,"span"),e(49,"Configuration"),t()(),n(50,"p")(51,"a",12),e(52,"ServeStaticModule"),t(),e(53,` can be configured with a variety of options to customize its behavior.
You can set the path to render your static app, specify excluded paths, enable or disable setting Cache-Control response header, etc. See the full list of options `),n(54,"a",13),e(55,"here"),t(),e(56,"."),t(),n(57,"blockquote",14)(58,"strong"),e(59,"Notice"),t(),e(60," The default "),n(61,"code"),e(62,"renderPath"),t(),e(63," of the Static App is "),n(64,"code"),e(65,"*"),t(),e(66,` (all paths), and the module will send "index.html" files in response.
It lets you create Client-Side routing for your SPA. Paths, specified in your controllers will fallback to the server.
You can change this behavior setting `),n(67,"code"),e(68,"serveRoot"),t(),e(69,", "),n(70,"code"),e(71,"renderPath"),t(),e(72,` combining them with other options.
Additionally, the option `),n(73,"code"),e(74,"serveStaticOptions.fallthrough"),t(),e(75," has been implemented in the Fastify adapter to mimic Express's fallthrough behavior and needs to be set to "),n(76,"code"),e(77,"true"),t(),e(78," to send "),n(79,"code"),e(80,"index.html"),t(),e(81,` instead of a 404 error for non existing route.
`),t(),n(82,"h4",15)(83,"span"),e(84,"Example"),t()(),n(85,"p"),e(86,"A working example is available "),n(87,"a",16),e(88,"here"),t(),e(89,"."),t()())},dependencies:[g,E],encapsulation:2,changeDetection:0})}return a})();var X=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-sql-sequelize"]],features:[S],decls:209,vars:20,consts:[["contentReference",""],["app25025effd87f83e376a74860fbbf8eebcbd94b6e",""],["appe051cbea6790b9627a6a8b5da544ea0f3141f9eb",""],["app494a7209ba69861e312eaabe9351277c8704763d",""],["appef742558a7092ff37ed51b11a4d3e9b61d4fd9db",""],["app48f1278cd0aa88152888e670dd44095829a39a6f",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/sql-sequelize.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","sql-sequelize"],["id","this-chapter-applies-only-to-typescript"],[1,""],["href","/techniques/database#sequelize-integration"],["rel","nofollow","target","_blank","href","https://github.com/sequelize/sequelize"],["rel","nofollow","target","_blank","href","https://github.com/RobinBuschmann/sequelize-typescript"],["appAnchor","","id","getting-started"],[1,"language-bash"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","model-injection"],[1,"warning"]],template:function(p,u){if(p&1&&(n(0,"div",6,0)(2,"div",7)(3,"a",8),o(4,"i",9),t()(),n(5,"h3",10),e(6,"SQL (Sequelize)"),t(),n(7,"h5",11),e(8,"This chapter applies only to TypeScript"),t(),n(9,"blockquote",12)(10,"strong"),e(11,"Warning"),t(),e(12," In this article, you'll learn how to create a "),n(13,"code"),e(14,"DatabaseModule"),t(),e(15," based on the "),n(16,"strong"),e(17,"Sequelize"),t(),e(18," package from scratch using custom components. As a consequence, this technique contains a lot of overhead that you can avoid by using the dedicated, out-of-the-box "),n(19,"code"),e(20,"@nestjs/sequelize"),t(),e(21," package. To learn more, see "),n(22,"a",13),e(23,"here"),t(),e(24,`.
`),t(),n(25,"p")(26,"a",14),e(27,"Sequelize"),t(),e(28," is a popular Object Relational Mapper (ORM) written in a vanilla JavaScript, but there is a "),n(29,"a",15),e(30,"sequelize-typescript"),t(),e(31," TypeScript wrapper which provides a set of decorators and other extras for the base sequelize."),t(),n(32,"h4",16)(33,"span"),e(34,"Getting started"),t()(),n(35,"p"),e(36,"To start the adventure with this library we have to install the following dependencies:"),t(),n(37,"pre")(38,"code",17),e(39,`
$ npm install --save sequelize sequelize-typescript mysql2
$ npm install --save-dev @types/sequelize
`),t()(),n(40,"p"),e(41,"The first step we need to do is create a "),n(42,"strong"),e(43,"Sequelize"),t(),e(44," instance with an options object passed into the constructor. Also, we need to add all models (the alternative is to use "),n(45,"code"),e(46,"modelPaths"),t(),e(47," property) and "),n(48,"code"),e(49,"sync()"),t(),e(50," our database tables."),t(),n(51,"app-copy-button",18)(52,"span",19),e(53),l(54,"extension"),o(55,"app-tabs",null,1),t(),n(57,"pre")(58,"code",20),e(59,`
import { Sequelize } from 'sequelize-typescript';
import { Cat } from '../cats/cat.entity';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'password',
        database: 'nest',
      });
      sequelize.addModels([Cat]);
      await sequelize.sync();
      return sequelize;
    },
  },
];
`),t()()(),n(60,"blockquote",21)(61,"strong"),e(62,"Hint"),t(),e(63," Following best practices, we declared the custom provider in the separated file which has a "),n(64,"code"),e(65,"*.providers.ts"),t(),e(66,` suffix.
`),t(),n(67,"p"),e(68,"Then, we need to export these providers to make them "),n(69,"strong"),e(70,"accessible"),t(),e(71," for the rest part of the application."),t(),n(72,"app-copy-button")(73,"pre")(74,"code",20),e(75,`
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
`),t()()(),n(76,"p"),e(77,"Now we can inject the "),n(78,"code"),e(79,"Sequelize"),t(),e(80," object using "),n(81,"code"),e(82,"@Inject()"),t(),e(83," decorator. Each class that would depend on the "),n(84,"code"),e(85,"Sequelize"),t(),e(86," async provider will wait until a "),n(87,"code"),e(88,"Promise"),t(),e(89," is resolved."),t(),n(90,"h4",22)(91,"span"),e(92,"Model injection"),t()(),n(93,"p"),e(94,"In "),n(95,"a",14),e(96,"Sequelize"),t(),e(97," the "),n(98,"strong"),e(99,"Model"),t(),e(100," defines a table in the database. Instances of this class represent a database row. Firstly, we need at least one entity:"),t(),n(101,"app-copy-button",18)(102,"span",19),e(103),l(104,"extension"),o(105,"app-tabs",null,2),t(),n(107,"pre")(108,"code",20),e(109,`
import { Table, Column, Model } from 'sequelize-typescript';

@Table
export class Cat extends Model {
  @Column
  name: string;

  @Column
  age: number;

  @Column
  breed: string;
}
`),t()()(),n(110,"p"),e(111,"The "),n(112,"code"),e(113,"Cat"),t(),e(114," entity belongs to the "),n(115,"code"),e(116,"cats"),t(),e(117," directory. This directory represents the "),n(118,"code"),e(119,"CatsModule"),t(),e(120,". Now it's time to create a "),n(121,"strong"),e(122,"Repository"),t(),e(123," provider:"),t(),n(124,"app-copy-button",18)(125,"span",19),e(126),l(127,"extension"),o(128,"app-tabs",null,3),t(),n(130,"pre")(131,"code",20),e(132,`
import { Cat } from './cat.entity';

export const catsProviders = [
  {
    provide: 'CATS_REPOSITORY',
    useValue: Cat,
  },
];
`),t()()(),n(133,"blockquote",23)(134,"strong"),e(135,"Warning"),t(),e(136," In the real-world applications you should avoid "),n(137,"strong"),e(138,"magic strings"),t(),e(139,". Both "),n(140,"code"),e(141,"CATS_REPOSITORY"),t(),e(142," and "),n(143,"code"),e(144,"SEQUELIZE"),t(),e(145," should be kept in the separated "),n(146,"code"),e(147,"constants.ts"),t(),e(148,` file.
`),t(),n(149,"p"),e(150,"In Sequelize, we use static methods to manipulate the data, and thus we created an "),n(151,"strong"),e(152,"alias"),t(),e(153," here."),t(),n(154,"p"),e(155,"Now we can inject the "),n(156,"code"),e(157,"CATS_REPOSITORY"),t(),e(158," to the "),n(159,"code"),e(160,"CatsService"),t(),e(161," using the "),n(162,"code"),e(163,"@Inject()"),t(),e(164," decorator:"),t(),n(165,"app-copy-button",18)(166,"span",19),e(167),l(168,"extension"),o(169,"app-tabs",null,4),t(),n(171,"pre")(172,"code",20),e(173,`
import { Injectable, Inject } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './cat.entity';

@Injectable()
export class CatsService {
  constructor(
    @Inject('CATS_REPOSITORY')
    private catsRepository: typeof Cat
  ) {}

  async findAll(): Promise<Cat[]> {
    return this.catsRepository.findAll<Cat>();
  }
}
`),t()()(),n(174,"p"),e(175,"The database connection is "),n(176,"strong"),e(177,"asynchronous"),t(),e(178,", but Nest makes this process completely invisible for the end-user. The "),n(179,"code"),e(180,"CATS_REPOSITORY"),t(),e(181," provider is waiting for the db connection, and the "),n(182,"code"),e(183,"CatsService"),t(),e(184," is delayed until repository is ready to use. The entire application can start when each class is instantiated."),t(),n(185,"p"),e(186,"Here is a final "),n(187,"code"),e(188,"CatsModule"),t(),e(189,":"),t(),n(190,"app-copy-button",18)(191,"span",19),e(192),l(193,"extension"),o(194,"app-tabs",null,5),t(),n(196,"pre")(197,"code",20),e(198,`
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { catsProviders } from './cats.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CatsController],
  providers: [
    CatsService,
    ...catsProviders,
  ],
})
export class CatsModule {}
`),t()()(),n(199,"blockquote",21)(200,"strong"),e(201,"Hint"),t(),e(202," Do not forget to import the "),n(203,"code"),e(204,"CatsModule"),t(),e(205," into the root "),n(206,"code"),e(207,"AppModule"),t(),e(208,`.
`),t()()),p&2){let y=r(56),b=r(106),v=r(129),k=r(170),w=r(195);i(53),s(" ",d(54,5,"database.providers",y.isJsActive),`
`),i(50),s(" ",d(104,8,"cat.entity",b.isJsActive),`
`),i(23),s(" ",d(127,11,"cats.providers",v.isJsActive),`
`),i(41),s(" ",d(168,14,"cats.service",k.isJsActive),`
`),i(25),s(" ",d(193,17,"cats.module",w.isJsActive),`
`)}},dependencies:[g,E,C,I],encapsulation:2,changeDetection:0})}return a})();var Z=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-sql-typeorm"]],features:[S],decls:221,vars:24,consts:[["contentReference",""],["app28b9006d63e477770ebfe8d1e16c19a896f75870",""],["apped0bfd493e451f5440c87469295a42b83a1f62e4",""],["app9c45b80ec641f10822d49b07c39c4981c4d5017a",""],["app967dacc78b88d237861b04e3dbdbf7b9207e363a",""],["app72df7bd8d29090d2861e80414512cd0306c77642",""],["app226a464d093fcdda349f27eb62fe97506cd927fc",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/sql-typeorm.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","sql-typeorm"],["id","this-chapter-applies-only-to-typescript"],[1,""],["routerLink","/techniques/sql"],["rel","nofollow","target","_blank","href","https://github.com/typeorm/typeorm"],["appAnchor","","id","getting-started"],[1,"language-bash"],["routerLink","/fundamentals/async-components"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"warning"],[1,"info"],["appAnchor","","id","repository-pattern"]],template:function(p,u){if(p&1&&(n(0,"div",7,0)(2,"div",8)(3,"a",9),o(4,"i",10),t()(),n(5,"h3",11),e(6,"SQL (TypeORM)"),t(),n(7,"h5",12),e(8,"This chapter applies only to TypeScript"),t(),n(9,"blockquote",13)(10,"strong"),e(11,"Warning"),t(),e(12," In this article, you'll learn how to create a "),n(13,"code"),e(14,"DatabaseModule"),t(),e(15," based on the "),n(16,"strong"),e(17,"TypeORM"),t(),e(18," package from scratch using custom providers mechanism. As a consequence, this solution contains a lot of overhead that you can omit using ready to use and available out-of-the-box dedicated "),n(19,"code"),e(20,"@nestjs/typeorm"),t(),e(21," package. To learn more, see "),n(22,"a",14),e(23,"here"),t(),e(24,`.
`),t(),n(25,"p")(26,"a",15),e(27,"TypeORM"),t(),e(28," is definitely the most mature Object Relational Mapper (ORM) available in the node.js world. Since it's written in TypeScript, it works pretty well with the Nest framework."),t(),n(29,"h4",16)(30,"span"),e(31,"Getting started"),t()(),n(32,"p"),e(33,"To start the adventure with this library we have to install all required dependencies:"),t(),n(34,"pre")(35,"code",17),e(36,`
$ npm install --save typeorm mysql2
`),t()(),n(37,"p"),e(38,"The first step we need to do is to establish the connection with our database using "),n(39,"code"),e(40,"new DataSource().initialize()"),t(),e(41," class imported from the "),n(42,"code"),e(43,"typeorm"),t(),e(44," package. The "),n(45,"code"),e(46,"initialize()"),t(),e(47," function returns a "),n(48,"code"),e(49,"Promise"),t(),e(50,", and therefore we have to create an "),n(51,"a",18),e(52,"async provider"),t(),e(53,"."),t(),n(54,"app-copy-button",19)(55,"span",20),e(56),l(57,"extension"),o(58,"app-tabs",null,1),t(),n(60,"pre")(61,"code",21),e(62,`
import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'root',
        database: 'test',
        entities: [
            __dirname + '/../**/*.entity{.ts,.js}',
        ],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
`),t()()(),n(63,"blockquote",22)(64,"strong"),e(65,"Warning"),t(),e(66," Setting "),n(67,"code"),e(68,"synchronize: true"),t(),e(69,` shouldn't be used in production - otherwise you can lose production data.
`),t(),n(70,"blockquote",23)(71,"strong"),e(72,"Hint"),t(),e(73," Following best practices, we declared the custom provider in the separated file which has a "),n(74,"code"),e(75,"*.providers.ts"),t(),e(76,` suffix.
`),t(),n(77,"p"),e(78,"Then, we need to export these providers to make them "),n(79,"strong"),e(80,"accessible"),t(),e(81," for the rest of the application."),t(),n(82,"app-copy-button",19)(83,"span",20),e(84),l(85,"extension"),o(86,"app-tabs",null,2),t(),n(88,"pre")(89,"code",21),e(90,`
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
`),t()()(),n(91,"p"),e(92,"Now we can inject the "),n(93,"code"),e(94,"DATA_SOURCE"),t(),e(95," object using "),n(96,"code"),e(97,"@Inject()"),t(),e(98," decorator. Each class that would depend on the "),n(99,"code"),e(100,"DATA_SOURCE"),t(),e(101," async provider will wait until a "),n(102,"code"),e(103,"Promise"),t(),e(104," is resolved."),t(),n(105,"h4",24)(106,"span"),e(107,"Repository pattern"),t()(),n(108,"p"),e(109,"The "),n(110,"a",15),e(111,"TypeORM"),t(),e(112," supports the repository design pattern, thus each entity has its own Repository. These repositories can be obtained from the database connection."),t(),n(113,"p"),e(114,"But firstly, we need at least one entity. We are going to reuse the "),n(115,"code"),e(116,"Photo"),t(),e(117," entity from the official documentation."),t(),n(118,"app-copy-button",19)(119,"span",20),e(120),l(121,"extension"),o(122,"app-tabs",null,3),t(),n(124,"pre")(125,"code",21),e(126,`
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column('text')
  description: string;

  @Column()
  filename: string;

  @Column('int')
  views: number;

  @Column()
  isPublished: boolean;
}
`),t()()(),n(127,"p"),e(128,"The "),n(129,"code"),e(130,"Photo"),t(),e(131," entity belongs to the "),n(132,"code"),e(133,"photo"),t(),e(134," directory. This directory represents the "),n(135,"code"),e(136,"PhotoModule"),t(),e(137,". Now, let's create a "),n(138,"strong"),e(139,"Repository"),t(),e(140," provider:"),t(),n(141,"app-copy-button",19)(142,"span",20),e(143),l(144,"extension"),o(145,"app-tabs",null,4),t(),n(147,"pre")(148,"code",21),e(149,`
import { DataSource } from 'typeorm';
import { Photo } from './photo.entity';

export const photoProviders = [
  {
    provide: 'PHOTO_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Photo),
    inject: ['DATA_SOURCE'],
  },
];
`),t()()(),n(150,"blockquote",22)(151,"strong"),e(152,"Warning"),t(),e(153," In the real-world applications you should avoid "),n(154,"strong"),e(155,"magic strings"),t(),e(156,". Both "),n(157,"code"),e(158,"PHOTO_REPOSITORY"),t(),e(159," and "),n(160,"code"),e(161,"DATA_SOURCE"),t(),e(162," should be kept in the separated "),n(163,"code"),e(164,"constants.ts"),t(),e(165,` file.
`),t(),n(166,"p"),e(167,"Now we can inject the "),n(168,"code"),e(169,"Repository<Photo>"),t(),e(170," to the "),n(171,"code"),e(172,"PhotoService"),t(),e(173," using the "),n(174,"code"),e(175,"@Inject()"),t(),e(176," decorator:"),t(),n(177,"app-copy-button",19)(178,"span",20),e(179),l(180,"extension"),o(181,"app-tabs",null,5),t(),n(183,"pre")(184,"code",21),e(185,`
import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';

@Injectable()
export class PhotoService {
  constructor(
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
  ) {}

  async findAll(): Promise<Photo[]> {
    return this.photoRepository.find();
  }
}
`),t()()(),n(186,"p"),e(187,"The database connection is "),n(188,"strong"),e(189,"asynchronous"),t(),e(190,", but Nest makes this process completely invisible for the end-user. The "),n(191,"code"),e(192,"PhotoRepository"),t(),e(193," is waiting for the db connection, and the "),n(194,"code"),e(195,"PhotoService"),t(),e(196," is delayed until repository is ready to use. The entire application can start when each class is instantiated."),t(),n(197,"p"),e(198,"Here is a final "),n(199,"code"),e(200,"PhotoModule"),t(),e(201,":"),t(),n(202,"app-copy-button",19)(203,"span",20),e(204),l(205,"extension"),o(206,"app-tabs",null,6),t(),n(208,"pre")(209,"code",21),e(210,`
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { photoProviders } from './photo.providers';
import { PhotoService } from './photo.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    ...photoProviders,
    PhotoService,
  ],
})
export class PhotoModule {}
`),t()()(),n(211,"blockquote",23)(212,"strong"),e(213,"Hint"),t(),e(214," Do not forget to import the "),n(215,"code"),e(216,"PhotoModule"),t(),e(217," into the root "),n(218,"code"),e(219,"AppModule"),t(),e(220,`.
`),t()()),p&2){let y=r(59),b=r(87),v=r(123),k=r(146),w=r(182),j=r(207);i(56),s(" ",d(57,6,"database.providers",y.isJsActive),`
`),i(28),s(" ",d(85,9,"database.module",b.isJsActive),`
`),i(36),s(" ",d(121,12,"photo.entity",v.isJsActive),`
`),i(23),s(" ",d(144,15,"photo.providers",k.isJsActive),`
`),i(36),s(" ",d(180,18,"photo.service",w.isJsActive),`
`),i(25),s(" ",d(205,21,"photo.module",j.isJsActive),`
`)}},dependencies:[A,g,E,C,I],encapsulation:2,changeDetection:0})}return a})();var ee=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-terminus"]],features:[S],decls:650,vars:100,consts:[["contentReference",""],["appd587c031c9fe3d005c458a9a28a9060b6c5befe3",""],["app162fa7db325704020ed0455b027416edd8fda017",""],["appb10f34b1f74a1e64bccdead63a5c64b1fba2b332",""],["app5b2d9a238df8ce9aa455649960fe76d4076c0d2f",""],["app645200802bc57c5dc33b4833a4c01ac370b50204",""],["app0ba7da911c360835447dd85b73f9ad086d8fb91c",""],["appd0eaf2b62b89eacc6c916adefc5f224b96e4fa02",""],["appefa6562362e970f72797329dea04b2e423abb8d9",""],["app575c3d95af48c0899edb319fc5c9e2243b37f4ae",""],["appb11563e0f6870aee193a83d59e1bf47844fcaf9a",""],["appde187ce415eaa455246161517c3eba2b7e2418f1",""],["app66e83231194ca5020fa313bdc294aece86834f97",""],["appfec056becb711bdcfc61524739d353e8bf3697ac",""],["app43f8a4130480edc25fc18b5981d07419c8fae079",""],["app0b6bfe94897669a55f3caac2a40f499a8898e2eb",""],["appfca0240f1a6425b8b7d455d0ccc4ab404a0b0968",""],["app8e9b59415062443796e68c868c90657a8ea69d59",""],["appbda2b9c2bebb22f2bcdb9bb461afb1c14c355343",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/terminus.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","healthchecks-terminus"],["rel","nofollow","target","_blank","href","https://kubernetes.io/"],["appAnchor","","id","getting-started"],[1,"language-bash"],["appAnchor","","id","setting-up-a-healthcheck"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/terminus"],[1,"info"],["routerLink","cli/overview"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["routerLink","/controllers"],["href","fundamentals/lifecycle-events#application-shutdown"],["appAnchor","","id","http-healthcheck"],[1,"language-json"],["id","check-for-specific-http-response-codes"],["appAnchor","","id","typeorm-health-indicator"],["routerLink","/techniques/sql"],["href","techniques/database#multiple-databases"],["appAnchor","","id","disk-health-indicator"],["appAnchor","","id","memory-health-indicator"],["appAnchor","","id","custom-health-indicator"],["appAnchor","","id","logging"],["href","/techniques/logger#injecting-a-custom-logger"],["align","left"],["src","/assets/Terminus_Error_Log_Json.png"],["src","/assets/Terminus_Error_Log_Pretty.png"],["appAnchor","","id","graceful-shutdown-timeout"],["appAnchor","","id","more-examples"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/terminus/tree/master/sample"]],template:function(p,u){if(p&1&&(n(0,"div",19,0)(2,"div",20)(3,"a",21),o(4,"i",22),t()(),n(5,"h3",23),e(6,"Healthchecks (Terminus)"),t(),n(7,"p"),e(8,"Terminus integration provides you with "),n(9,"strong"),e(10,"readiness/liveness"),t(),e(11,` health checks. Healthchecks are crucial when it comes to complex
backend setups. In a nutshell, a health check in the realm of web development usually consists of a special address, for example, `),n(12,"code"),e(13,"https://my-website.com/health/readiness"),t(),e(14,`.
A service or a component of your infrastructure (e.g., `),n(15,"a",24),e(16,"Kubernetes"),t(),e(17," checks this address continuously). Depending on the HTTP status code returned from a "),n(18,"code"),e(19,"GET"),t(),e(20,` request to this address the service will take action when it receives an "unhealthy" response.
Since the definition of "healthy" or "unhealthy" varies with the type of service you provide, the `),n(21,"strong"),e(22,"Terminus"),t(),e(23,` integration supports you with a
set of `),n(24,"strong"),e(25,"health indicators"),t(),e(26,"."),t(),n(27,"p"),e(28,`As an example, if your web server uses MongoDB to store its data, it would be vital information whether MongoDB is still up and running.
In that case, you can make use of the `),n(29,"code"),e(30,"MongooseHealthIndicator"),t(),e(31,`. If configured correctly - more on that later - your health check address will return
a healthy or unhealthy HTTP status code, depending on whether MongoDB is running.`),t(),n(32,"h4",25)(33,"span"),e(34,"Getting started"),t()(),n(35,"p"),e(36,"To get started with "),n(37,"code"),e(38,"@nestjs/terminus"),t(),e(39," we need to install the required dependency."),t(),n(40,"pre")(41,"code",26),e(42,`
$ npm install --save @nestjs/terminus
`),t()(),n(43,"h4",27)(44,"span"),e(45,"Setting up a Healthcheck"),t()(),n(46,"p"),e(47,"A health check represents a summary of "),n(48,"strong"),e(49,"health indicators"),t(),e(50,". A health indicator executes a check of a service, whether it is in a healthy or unhealthy state. A health check is positive if all the assigned health indicators are up and running. Because a lot of applications will need similar health indicators, "),n(51,"a",28)(52,"code"),e(53,"@nestjs/terminus"),t()(),e(54," provides a set of predefined indicators, such as:"),t(),n(55,"ul")(56,"li")(57,"code"),e(58,"HttpHealthIndicator"),t()(),n(59,"li")(60,"code"),e(61,"TypeOrmHealthIndicator"),t()(),n(62,"li")(63,"code"),e(64,"MongooseHealthIndicator"),t()(),n(65,"li")(66,"code"),e(67,"SequelizeHealthIndicator"),t()(),n(68,"li")(69,"code"),e(70,"MikroOrmHealthIndicator"),t()(),n(71,"li")(72,"code"),e(73,"PrismaHealthIndicator"),t()(),n(74,"li")(75,"code"),e(76,"MicroserviceHealthIndicator"),t()(),n(77,"li")(78,"code"),e(79,"GRPCHealthIndicator"),t()(),n(80,"li")(81,"code"),e(82,"MemoryHealthIndicator"),t()(),n(83,"li")(84,"code"),e(85,"DiskHealthIndicator"),t()()(),n(86,"p"),e(87,"To get started with our first health check, let's create the "),n(88,"code"),e(89,"HealthModule"),t(),e(90," and import the "),n(91,"code"),e(92,"TerminusModule"),t(),e(93," into it in its imports array."),t(),n(94,"blockquote",29)(95,"strong"),e(96,"Hint"),t(),e(97," To create the module using the "),n(98,"a",30),e(99,"Nest CLI"),t(),e(100,", simply execute the "),n(101,"code"),e(102,"$ nest g module health"),t(),e(103,` command.
`),t(),n(104,"app-copy-button",31)(105,"span",32),e(106),l(107,"extension"),o(108,"app-tabs",null,1),t(),n(110,"pre")(111,"code",33),e(112,`
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule]
})
export class HealthModule {}
`),t()()(),n(113,"p"),e(114,"Our healthcheck(s) can be executed using a "),n(115,"a",34),e(116,"controller"),t(),e(117,", which can be easily set up using the "),n(118,"a",30),e(119,"Nest CLI"),t(),e(120,"."),t(),n(121,"pre")(122,"code",26),e(123,`
$ nest g controller health
`),t()(),n(124,"blockquote",29)(125,"strong"),e(126,"Info"),t(),e(127," It is highly recommended to enable shutdown hooks in your application. Terminus integration makes use of this lifecycle event if enabled. Read more about shutdown hooks "),n(128,"a",35),e(129,"here"),t(),e(130,`.
`),t(),n(131,"h4",36)(132,"span"),e(133,"HTTP Healthcheck"),t()(),n(134,"p"),e(135,"Once we have installed "),n(136,"code"),e(137,"@nestjs/terminus"),t(),e(138,", imported our "),n(139,"code"),e(140,"TerminusModule"),t(),e(141," and created a new controller, we are ready to create a health check."),t(),n(142,"p"),e(143,"The "),n(144,"code"),e(145,"HTTPHealthIndicator"),t(),e(146," requires the "),n(147,"code"),e(148,"@nestjs/axios"),t(),e(149," package so make sure to have it installed:"),t(),n(150,"pre")(151,"code",26),e(152,`
$ npm i --save @nestjs/axios axios
`),t()(),n(153,"p"),e(154,"Now we can setup our "),n(155,"code"),e(156,"HealthController"),t(),e(157,":"),t(),n(158,"app-copy-button",31)(159,"span",32),e(160),l(161,"extension"),o(162,"app-tabs",null,2),t(),n(164,"pre")(165,"code",33),e(166,`
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
  }
}
`),t()(),n(167,"pre")(168,"code",33),e(169,`
import { Controller, Dependencies, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';

@Controller('health')
@Dependencies(HealthCheckService, HttpHealthIndicator)
export class HealthController {
  constructor(
    private health,
    private http,
  ) { }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ])
  }
}
`),t()()(),n(170,"app-copy-button",31)(171,"span",32),e(172),l(173,"extension"),o(174,"app-tabs",null,3),t(),n(176,"pre")(177,"code",33),e(178,`
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
`),t()(),n(179,"pre")(180,"code",33),e(181,`
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
`),t()()(),n(182,"p"),e(183,"Our health check will now send a "),n(184,"em"),e(185,"GET"),t(),e(186,"-request to the "),n(187,"code"),e(188,"https://docs.nestjs.com"),t(),e(189,` address. If
we get a healthy response from that address, our route at `),n(190,"code"),e(191,"http://localhost:3000/health"),t(),e(192,` will return
the following object with a 200 status code.`),t(),n(193,"pre")(194,"code",37),e(195,`
{
  "status": "ok",
  "info": {
    "nestjs-docs": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "nestjs-docs": {
      "status": "up"
    }
  }
}
`),t()(),n(196,"p"),e(197,"The interface of this response object can be accessed from the "),n(198,"code"),e(199,"@nestjs/terminus"),t(),e(200," package with the "),n(201,"code"),e(202,"HealthCheckResult"),t(),e(203," interface."),t(),n(204,"table"),o(205,"thead"),n(206,"tbody")(207,"tr")(208,"td")(209,"code"),e(210,"status"),t()(),n(211,"td"),e(212,"If any health indicator failed the status will be "),n(213,"code"),e(214,"'error'"),t(),e(215,". If the NestJS app is shutting down but still accepting HTTP requests, the health check will have the "),n(216,"code"),e(217,"'shutting_down'"),t(),e(218," status."),t(),n(219,"td")(220,"code"),e(221,"'error' | 'ok' | 'shutting_down'"),t()()(),n(222,"tr")(223,"td")(224,"code"),e(225,"info"),t()(),n(226,"td"),e(227,"Object containing information of each health indicator which is of status "),n(228,"code"),e(229,"'up'"),t(),e(230,', or in other words "healthy".'),t(),n(231,"td")(232,"code"),e(233,"object"),t()()(),n(234,"tr")(235,"td")(236,"code"),e(237,"error"),t()(),n(238,"td"),e(239,"Object containing information of each health indicator which is of status "),n(240,"code"),e(241,"'down'"),t(),e(242,', or in other words "unhealthy".'),t(),n(243,"td")(244,"code"),e(245,"object"),t()()(),n(246,"tr")(247,"td")(248,"code"),e(249,"details"),t()(),n(250,"td"),e(251,"Object containing all information of each health indicator"),t(),n(252,"td")(253,"code"),e(254,"object"),t()()()()(),n(255,"h5",38),e(256,"Check for specific HTTP response codes"),t(),n(257,"p"),e(258,`In certain cases, you might want to check for specific criteria and validate the response. As an example, let's assume
`),n(259,"code"),e(260,"https://my-external-service.com"),t(),e(261," returns a response code "),n(262,"code"),e(263,"204"),t(),e(264,". With "),n(265,"code"),e(266,"HttpHealthIndicator.responseCheck"),t(),e(267,` you can
check for that response code specifically and determine all other codes as unhealthy.`),t(),n(268,"p"),e(269,"In case any other response code other than "),n(270,"code"),e(271,"204"),t(),e(272,` gets returned, the following example would be unhealthy. The third parameter
requires you to provide a function (sync or async) which returns a boolean whether the response is considered
healthy (`),n(273,"code"),e(274,"true"),t(),e(275,") or unhealthy ("),n(276,"code"),e(277,"false"),t(),e(278,")."),t(),n(279,"app-copy-button",31)(280,"span",32),e(281),l(282,"extension"),o(283,"app-tabs",null,4),t(),n(285,"pre")(286,"code",33),e(287,`
// Within the \`HealthController\`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () =>
      this.http.responseCheck(
        'my-external-service',
        'https://my-external-service.com',
        (res) => res.status === 204,
      ),
  ]);
}
`),t()()(),n(288,"h4",39)(289,"span"),e(290,"TypeOrm health indicator"),t()(),n(291,"p"),e(292,`Terminus offers the capability to add database checks to your health check. In order to get started with this health indicator, you
should check out the `),n(293,"a",40),e(294,"Database chapter"),t(),e(295," and make sure your database connection within your application is established."),t(),n(296,"blockquote",29)(297,"strong"),e(298,"Hint"),t(),e(299," Behind the scenes the "),n(300,"code"),e(301,"TypeOrmHealthIndicator"),t(),e(302," simply executes a "),n(303,"code"),e(304,"SELECT 1"),t(),e(305,"-SQL command which is often used to verify whether the database still alive. In case you are using an Oracle database it uses "),n(306,"code"),e(307,"SELECT 1 FROM DUAL"),t(),e(308,`.
`),t(),n(309,"app-copy-button",31)(310,"span",32),e(311),l(312,"extension"),o(313,"app-tabs",null,5),t(),n(315,"pre")(316,"code",33),e(317,`
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
`),t()(),n(318,"pre")(319,"code",33),e(320,`
@Controller('health')
@Dependencies(HealthCheckService, TypeOrmHealthIndicator)
export class HealthController {
  constructor(
    private health,
    private db,
  ) { }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ])
  }
}
`),t()()(),n(321,"p"),e(322,"If your database is reachable, you should now see the following JSON-result when requesting "),n(323,"code"),e(324,"http://localhost:3000/health"),t(),e(325," with a "),n(326,"code"),e(327,"GET"),t(),e(328," request:"),t(),n(329,"pre")(330,"code",37),e(331,`
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
`),t()(),n(332,"p"),e(333,"In case your app uses "),n(334,"a",41),e(335,"multiple databases"),t(),e(336,`, you need to inject each
connection into your `),n(337,"code"),e(338,"HealthController"),t(),e(339,". Then, you can simply pass the connection reference to the "),n(340,"code"),e(341,"TypeOrmHealthIndicator"),t(),e(342,"."),t(),n(343,"app-copy-button",31)(344,"span",32),e(345),l(346,"extension"),o(347,"app-tabs",null,6),t(),n(349,"pre")(350,"code",33),e(351,`
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    @InjectConnection('albumsConnection')
    private albumsConnection: Connection,
    @InjectConnection()
    private defaultConnection: Connection,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('albums-database', { connection: this.albumsConnection }),
      () => this.db.pingCheck('database', { connection: this.defaultConnection }),
    ]);
  }
}
`),t()()(),n(352,"h4",42)(353,"span"),e(354,"Disk health indicator"),t()(),n(355,"p"),e(356,"With the "),n(357,"code"),e(358,"DiskHealthIndicator"),t(),e(359," we can check how much storage is in use. To get started, make sure to inject the "),n(360,"code"),e(361,"DiskHealthIndicator"),t(),e(362,`
into your `),n(363,"code"),e(364,"HealthController"),t(),e(365,". The following example checks the storage used of the path "),n(366,"code"),e(367,"/"),t(),e(368," (or on Windows you can use "),n(369,"code"),e(370,"C:\\\\"),t(),e(371,`).
If that exceeds more than 50% of the total storage space it would response with an unhealthy Health Check.`),t(),n(372,"app-copy-button",31)(373,"span",32),e(374),l(375,"extension"),o(376,"app-tabs",null,7),t(),n(378,"pre")(379,"code",33),e(380,`
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ]);
  }
}
`),t()(),n(381,"pre")(382,"code",33),e(383,`
@Controller('health')
@Dependencies(HealthCheckService, DiskHealthIndicator)
export class HealthController {
  constructor(health, disk) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ])
  }
}
`),t()()(),n(384,"p"),e(385,"With the "),n(386,"code"),e(387,"DiskHealthIndicator.checkStorage"),t(),e(388,` function you also have the possibility to check for a fixed amount of space.
The following example would be unhealthy in case the path `),n(389,"code"),e(390,"/my-app/"),t(),e(391," would exceed 250GB."),t(),n(392,"app-copy-button",31)(393,"span",32),e(394),l(395,"extension"),o(396,"app-tabs",null,8),t(),n(398,"pre")(399,"code",33),e(400,`
// Within the \`HealthController\`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.disk.checkStorage('storage', {  path: '/', threshold: 250 * 1024 * 1024 * 1024, })
  ]);
}
`),t()()(),n(401,"h4",43)(402,"span"),e(403,"Memory health indicator"),t()(),n(404,"p"),e(405,"To make sure your process does not exceed a certain memory limit the "),n(406,"code"),e(407,"MemoryHealthIndicator"),t(),e(408," can be used. The following example can be used to check the heap of your process."),t(),n(409,"blockquote",29)(410,"strong"),e(411,"Hint"),t(),e(412,` Heap is the portion of memory where dynamically allocated memory resides (i.e. memory allocated via malloc). Memory allocated from the heap will remain allocated until one of the following occurs:
`),n(413,"ul")(414,"li"),e(415,"The memory is "),n(416,"em"),e(417,"free"),t(),e(418,"'d"),t(),n(419,"li"),e(420,"The program terminates"),t()()(),n(421,"app-copy-button",31)(422,"span",32),e(423),l(424,"extension"),o(425,"app-tabs",null,9),t(),n(427,"pre")(428,"code",33),e(429,`
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
`),t()(),n(430,"pre")(431,"code",33),e(432,`
@Controller('health')
@Dependencies(HealthCheckService, MemoryHealthIndicator)
export class HealthController {
  constructor(health, memory) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ])
  }
}
`),t()()(),n(433,"p"),e(434,"It is also possible to verify the memory RSS of your process with "),n(435,"code"),e(436,"MemoryHealthIndicator.checkRSS"),t(),e(437,`. This example
would return an unhealthy response code in case your process does have more than 150MB allocated.`),t(),n(438,"blockquote",29)(439,"strong"),e(440,"Hint"),t(),e(441,` RSS is the Resident Set Size and is used to show how much memory is allocated to that process and is in RAM.
It does not include memory that is swapped out. It does include memory from shared libraries as long as the pages from
those libraries are actually in memory. It does include all stack and heap memory.
`),t(),n(442,"app-copy-button",31)(443,"span",32),e(444),l(445,"extension"),o(446,"app-tabs",null,10),t(),n(448,"pre")(449,"code",33),e(450,`
// Within the \`HealthController\`-class

@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
  ]);
}
`),t()()(),n(451,"h4",44)(452,"span"),e(453,"Custom health indicator"),t()(),n(454,"p"),e(455,"In some cases, the predefined health indicators provided by "),n(456,"code"),e(457,"@nestjs/terminus"),t(),e(458," do not cover all of your health check requirements. In that case, you can set up a custom health indicator according to your needs."),t(),n(459,"p"),e(460,"Let's get started by creating a service that will represent our custom indicator. To get a basic understanding of how an indicator is structured, we will create an example "),n(461,"code"),e(462,"DogHealthIndicator"),t(),e(463,". This service should have the state "),n(464,"code"),e(465,"'up'"),t(),e(466," if every "),n(467,"code"),e(468,"Dog"),t(),e(469," object has the type "),n(470,"code"),e(471,"'goodboy'"),t(),e(472,". If that condition is not satisfied then it should throw an error."),t(),n(473,"app-copy-button",31)(474,"span",32),e(475),l(476,"extension"),o(477,"app-tabs",null,11),t(),n(479,"pre")(480,"code",33),e(481,`
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

export interface Dog {
  name: string;
  type: string;
}

@Injectable()
export class DogHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService
  ) {}

  private dogs: Dog[] = [
    { name: 'Fido', type: 'goodboy' },
    { name: 'Rex', type: 'badboy' },
  ];

  async isHealthy(key: string){
    const indicator = this.healthIndicatorService.check(key);
    const badboys = this.dogs.filter(dog => dog.type === 'badboy');
    const isHealthy = badboys.length === 0;

    if (!isHealthy) {
      return indicator.down({ badboys: badboys.length });
    }

    return indicator.up();
  }
}
`),t()(),n(482,"pre")(483,"code",33),e(484,`
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';

@Injectable()
@Dependencies(HealthIndicatorService)
export class DogHealthIndicator {
  constructor(healthIndicatorService) {
    this.healthIndicatorService = healthIndicatorService;
  }

  private dogs = [
    { name: 'Fido', type: 'goodboy' },
    { name: 'Rex', type: 'badboy' },
  ];

  async isHealthy(key){
    const indicator = this.healthIndicatorService.check(key);
    const badboys = this.dogs.filter(dog => dog.type === 'badboy');
    const isHealthy = badboys.length === 0;

    if (!isHealthy) {
      return indicator.down({ badboys: badboys.length });
    }

    return indicator.up();
  }
}
`),t()()(),n(485,"p"),e(486,"The next thing we need to do is register the health indicator as a provider."),t(),n(487,"app-copy-button",31)(488,"span",32),e(489),l(490,"extension"),o(491,"app-tabs",null,12),t(),n(493,"pre")(494,"code",33),e(495,`
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DogHealthIndicator } from './dog.health';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
  providers: [DogHealthIndicator]
})
export class HealthModule { }
`),t()()(),n(496,"blockquote",29)(497,"strong"),e(498,"Hint"),t(),e(499," In a real-world application the "),n(500,"code"),e(501,"DogHealthIndicator"),t(),e(502," should be provided in a separate module, for example, "),n(503,"code"),e(504,"DogModule"),t(),e(505,", which then will be imported by the "),n(506,"code"),e(507,"HealthModule"),t(),e(508,`.
`),t(),n(509,"p"),e(510,"The last required step is to add the now available health indicator in the required health check endpoint. For that, we go back to our "),n(511,"code"),e(512,"HealthController"),t(),e(513," and add it to our "),n(514,"code"),e(515,"check"),t(),e(516," function."),t(),n(517,"app-copy-button",31)(518,"span",32),e(519),l(520,"extension"),o(521,"app-tabs",null,13),t(),n(523,"pre")(524,"code",33),e(525,`
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Injectable, Dependencies, Get } from '@nestjs/common';
import { DogHealthIndicator } from './dog.health';

@Injectable()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private dogHealthIndicator: DogHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.dogHealthIndicator.isHealthy('dog'),
    ])
  }
}
`),t()(),n(526,"pre")(527,"code",33),e(528,`
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Injectable, Get } from '@nestjs/common';
import { DogHealthIndicator } from './dog.health';

@Injectable()
@Dependencies(HealthCheckService, DogHealthIndicator)
export class HealthController {
  constructor(
    health,
    dogHealthIndicator
  ) {
    this.health = health;
    this.dogHealthIndicator = dogHealthIndicator;
  }

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.dogHealthIndicator.isHealthy('dog'),
    ])
  }
}
`),t()()(),n(529,"h4",45)(530,"span"),e(531,"Logging"),t()(),n(532,"p"),e(533,"Terminus only logs error messages, for instance when a Healthcheck has failed. With the "),n(534,"code"),e(535,"TerminusModule.forRoot()"),t(),e(536,` method you have more control over how errors are being logged
as well as completely take over the logging itself.`),t(),n(537,"p"),e(538,"In this section, we are going to walk you through how you create a custom logger "),n(539,"code"),e(540,"TerminusLogger"),t(),e(541,`. This logger extends the built-in logger.
Therefore you can pick and choose which part of the logger you would like to overwrite`),t(),n(542,"blockquote",29)(543,"strong"),e(544,"Info"),t(),e(545," If you want to learn more about custom loggers in NestJS, "),n(546,"a",46),e(547,"read more here"),t(),e(548,`.
`),t(),n(549,"app-copy-button",31)(550,"span",32),e(551),l(552,"extension"),o(553,"app-tabs",null,14),t(),n(555,"pre")(556,"code",33),e(557,`
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class TerminusLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: any[]): void;
  error(
    message: unknown,
    stack?: unknown,
    context?: unknown,
    ...rest: unknown[]
  ): void {
    // Overwrite here how error messages should be logged
  }
}
`),t()()(),n(558,"p"),e(559,"Once you have created your custom logger, all you need to do is simply pass it into the "),n(560,"code"),e(561,"TerminusModule.forRoot()"),t(),e(562," as such."),t(),n(563,"app-copy-button",31)(564,"span",32),e(565),l(566,"extension"),o(567,"app-tabs",null,15),t(),n(569,"pre")(570,"code",33),e(571,`
@Module({
imports: [
  TerminusModule.forRoot({
    logger: TerminusLogger,
  }),
],
})
export class HealthModule {}
`),t()()(),n(572,"p"),e(573,"To completely suppress any log messages coming from Terminus, including error messages, configure Terminus as such."),t(),n(574,"app-copy-button",31)(575,"span",32),e(576),l(577,"extension"),o(578,"app-tabs",null,16),t(),n(580,"pre")(581,"code",33),e(582,`
@Module({
imports: [
  TerminusModule.forRoot({
    logger: false,
  }),
],
})
export class HealthModule {}
`),t()()(),n(583,"p"),e(584,"Terminus allows you to configure how Healthcheck errors should be displayed in your logs."),t(),n(585,"table")(586,"thead")(587,"tr")(588,"th",47),e(589,"Error Log Style"),t(),n(590,"th",47),e(591,"Description"),t(),n(592,"th",47),e(593,"Example"),t()()(),n(594,"tbody")(595,"tr")(596,"td",47)(597,"code"),e(598,"json"),t(),e(599," (default)"),t(),n(600,"td",47),e(601,"Prints a summary of the health check result in case of an error as JSON object"),t(),n(602,"td",47)(603,"figure"),o(604,"img",48),t()()(),n(605,"tr")(606,"td",47)(607,"code"),e(608,"pretty"),t()(),n(609,"td",47),e(610,"Prints a summary of the health check result in case of an error within formatted boxes and highlights successful/erroneous results"),t(),n(611,"td",47)(612,"figure"),o(613,"img",49),t()()()()(),n(614,"p"),e(615,"You can change the log style using the "),n(616,"code"),e(617,"errorLogStyle"),t(),e(618," configuration option as in the following snippet."),t(),n(619,"app-copy-button",31)(620,"span",32),e(621),l(622,"extension"),o(623,"app-tabs",null,17),t(),n(625,"pre")(626,"code",33),e(627,`
@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
    }),
  ]
})
export class HealthModule {}
`),t()()(),n(628,"h4",50)(629,"span"),e(630,"Graceful shutdown timeout"),t()(),n(631,"p"),e(632,`If your application requires postponing its shutdown process, Terminus can handle it for you.
This setting can prove particularly beneficial when working with an orchestrator such as Kubernetes.
By setting a delay slightly longer than the readiness check interval, you can achieve zero downtime when shutting down containers.`),t(),n(633,"app-copy-button",31)(634,"span",32),e(635),l(636,"extension"),o(637,"app-tabs",null,18),t(),n(639,"pre")(640,"code",33),e(641,`
@Module({
  imports: [
    TerminusModule.forRoot({
      gracefulShutdownTimeoutMs: 1000,
    }),
  ]
})
export class HealthModule {}
`),t()()(),n(642,"h4",51)(643,"span"),e(644,"More examples"),t()(),n(645,"p"),e(646,"More working examples are available "),n(647,"a",52),e(648,"here"),t(),e(649,"."),t()()),p&2){let y=r(109),b=r(163),v=r(175),k=r(284),w=r(314),j=r(348),P=r(377),M=r(397),R=r(426),q=r(447),D=r(478),U=r(492),H=r(522),B=r(554),_=r(568),O=r(579),le=r(624),de=r(638);i(106),s(" ",d(107,46,"health.module",y.isJsActive),`
`),i(54),s(" ",d(161,49,"health.controller",b.isJsActive),`
`),i(4),m("hide",b.isJsActive),i(3),m("hide",!b.isJsActive),i(5),s(" ",d(173,52,"health.module",v.isJsActive),`
`),i(4),m("hide",v.isJsActive),i(3),m("hide",!v.isJsActive),i(102),s(" ",d(282,55,"health.controller",k.isJsActive),`
`),i(30),s(" ",d(312,58,"health.controller",w.isJsActive),`
`),i(4),m("hide",w.isJsActive),i(3),m("hide",!w.isJsActive),i(27),s(" ",d(346,61,"health.controller",j.isJsActive),`
`),i(29),s(" ",d(375,64,"health.controller",P.isJsActive),`
`),i(4),m("hide",P.isJsActive),i(3),m("hide",!P.isJsActive),i(13),s(" ",d(395,67,"health.controller",M.isJsActive),`
`),i(29),s(" ",d(424,70,"health.controller",R.isJsActive),`
`),i(4),m("hide",R.isJsActive),i(3),m("hide",!R.isJsActive),i(14),s(" ",d(445,73,"health.controller",q.isJsActive),`
`),i(31),s(" ",d(476,76,"dog.health",D.isJsActive),`
`),i(4),m("hide",D.isJsActive),i(3),m("hide",!D.isJsActive),i(7),s(" ",d(490,79,"health.module",U.isJsActive),`
`),i(30),s(" ",d(520,82,"health.controller",H.isJsActive),`
`),i(4),m("hide",H.isJsActive),i(3),m("hide",!H.isJsActive),i(25),s(" ",d(552,85,"terminus-logger.service",B.isJsActive),`
`),i(14),s(" ",d(566,88,"health.module",_.isJsActive),`
`),i(11),s(" ",d(577,91,"health.module",O.isJsActive),`
`),i(45),s(" ",d(622,94,"health.module",le.isJsActive),`
`),i(14),s(" ",d(636,97,"health.module",de.isJsActive),`
`)}},dependencies:[g,A,E,C,I],encapsulation:2,changeDetection:0})}return a})();var te=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-router-module"]],features:[S],decls:86,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/router-module.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","router-module"],[1,"info"],["href","/controllers#routing"],["routerLink","/faq/global-prefix"],["routerLink","/techniques/versioning"],[1,"language-typescript"]],template:function(p,u){p&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Router module"),t(),n(7,"blockquote",6)(8,"strong"),e(9,"Hint"),t(),e(10,` This chapter is only relevant to HTTP-based applications.
`),t(),n(11,"p"),e(12,"In an HTTP application (for example, REST API), the route path for a handler is determined by concatenating the (optional) prefix declared for the controller (inside the "),n(13,"code"),e(14,"@Controller"),t(),e(15,` decorator),
and any path specified in the method's decorator (e.g, `),n(16,"code"),e(17,"@Get('users')"),t(),e(18,"). You can learn more about that in "),n(19,"a",7),e(20,"this section"),t(),e(21,`. Additionally,
you can define a `),n(22,"a",8),e(23,"global prefix"),t(),e(24," for all routes registered in your application, or enable "),n(25,"a",9),e(26,"versioning"),t(),e(27,"."),t(),n(28,"p"),e(29,`Also, there are edge-cases when defining a prefix at a module-level (and so for all controllers registered inside that module) may come in handy.
For example, imagine a REST application that exposes several different endpoints being used by a specific portion of your application called "Dashboard".
In such a case, instead of repeating the `),n(30,"code"),e(31,"/dashboard"),t(),e(32," prefix within each controller, you could use a utility "),n(33,"code"),e(34,"RouterModule"),t(),e(35," module, as follows:"),t(),n(36,"app-copy-button")(37,"pre")(38,"code",10),e(39,`
@Module({
  imports: [
    DashboardModule,
    RouterModule.register([
      {
        path: 'dashboard',
        module: DashboardModule,
      },
    ]),
  ],
})
export class AppModule {}
`),t()()(),n(40,"blockquote",6)(41,"strong"),e(42,"Hint"),t(),e(43," The "),n(44,"code"),e(45,"RouterModule"),t(),e(46," class is exported from the "),n(47,"code"),e(48,"@nestjs/core"),t(),e(49,` package.
`),t(),n(50,"p"),e(51,"In addition, you can define hierarchical structures. This means each module can have "),n(52,"code"),e(53,"children"),t(),e(54,` modules.
The children modules will inherit their parent's prefix. In the following example, we'll register the `),n(55,"code"),e(56,"AdminModule"),t(),e(57," as a parent module of "),n(58,"code"),e(59,"DashboardModule"),t(),e(60," and "),n(61,"code"),e(62,"MetricsModule"),t(),e(63,"."),t(),n(64,"app-copy-button")(65,"pre")(66,"code",10),e(67,`
@Module({
  imports: [
    AdminModule,
    DashboardModule,
    MetricsModule,
    RouterModule.register([
      {
        path: 'admin',
        module: AdminModule,
        children: [
          {
            path: 'dashboard',
            module: DashboardModule,
          },
          {
            path: 'metrics',
            module: MetricsModule,
          },
        ],
      },
    ])
  ],
});
`),t()()(),n(68,"blockquote",6)(69,"strong"),e(70,"Hint"),t(),e(71,` This feature should be used very carefully, as overusing it can make code difficult to maintain over time.
`),t(),n(72,"p"),e(73,"In the example above, any controller registered inside the "),n(74,"code"),e(75,"DashboardModule"),t(),e(76," will have an extra "),n(77,"code"),e(78,"/admin/dashboard"),t(),e(79,` prefix (as the module concatenates paths from top to bottom - recursively - parent to children).
Likewise, each controller defined inside the `),n(80,"code"),e(81,"MetricsModule"),t(),e(82," will have an additional module-level prefix "),n(83,"code"),e(84,"/admin/metrics"),t(),e(85,"."),t()())},dependencies:[A,E],encapsulation:2,changeDetection:0})}return a})();var ne=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-nest-commander"]],features:[S],decls:222,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/nest-commander.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","nest-commander"],["routerLink","/standalone-applications"],["rel","nofollow","target","_blank","href","https://jmcdo29.github.io/nest-commander"],[1,"info"],["rel","nofollow","target","_blank","href","https://github.com/jmcdo29/nest-commander/issues/new/choose"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","a-command-file"],["rel","nofollow","target","_blank","href","https://www.typescriptlang.org/docs/handbook/decorators.html"],["appAnchor","","id","running-the-command"],[1,"language-ts"],["appAnchor","","id","testing"],["appAnchor","","id","putting-it-all-together"],["appAnchor","","id","more-information"]],template:function(p,u){p&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Nest Commander"),t(),n(7,"p"),e(8,"Expanding on the "),n(9,"a",6),e(10,"standalone application"),t(),e(11," docs there's also the "),n(12,"a",7),e(13,"nest-commander"),t(),e(14," package for writing command line applications in a structure similar to your typical Nest application."),t(),n(15,"blockquote",8)(16,"strong"),e(17,"info"),t(),n(18,"code"),e(19,"nest-commander"),t(),e(20," is a third party package and is not managed by the entirety of the NestJS core team. Please, report any issues found with the library in the "),n(21,"a",9),e(22,"appropriate repository"),t()(),n(23,"h4",10)(24,"span"),e(25,"Installation"),t()(),n(26,"p"),e(27,"Just like any other package, you've got to install it before you can use it."),t(),n(28,"pre")(29,"code",11),e(30,`
$ npm i nest-commander
`),t()(),n(31,"h4",12)(32,"span"),e(33,"A Command file"),t()(),n(34,"p")(35,"code"),e(36,"nest-commander"),t(),e(37," makes it easy to write new command-line applications with "),n(38,"a",13),e(39,"decorators"),t(),e(40," via the "),n(41,"code"),e(42,"@Command()"),t(),e(43," decorator for classes and the "),n(44,"code"),e(45,"@Option()"),t(),e(46," decorator for methods of that class. Every command file should implement the "),n(47,"code"),e(48,"CommandRunner"),t(),e(49," abstract class and should be decorated with a "),n(50,"code"),e(51,"@Command()"),t(),e(52," decorator."),t(),n(53,"p"),e(54,"Every command is seen as an "),n(55,"code"),e(56,"@Injectable()"),t(),e(57," by Nest, so your normal Dependency Injection still works as you would expect it to. The only thing to take note of is the abstract class "),n(58,"code"),e(59,"CommandRunner"),t(),e(60,", which should be implemented by each command. The "),n(61,"code"),e(62,"CommandRunner"),t(),e(63," abstract class ensures that all commands have a "),n(64,"code"),e(65,"run"),t(),e(66," method that returns a "),n(67,"code"),e(68,"Promise<void>"),t(),e(69," and takes in the parameters "),n(70,"code"),e(71,"string[], Record<string, any>"),t(),e(72,". The "),n(73,"code"),e(74,"run"),t(),e(75," command is where you can kick all of your logic off from, it will take in whatever parameters did not match option flags and pass them in as an array, just in case you are really meaning to work with multiple parameters. As for the options, the "),n(76,"code"),e(77,"Record<string, any>"),t(),e(78,", the names of these properties match the "),n(79,"code"),e(80,"name"),t(),e(81," property given to the "),n(82,"code"),e(83,"@Option()"),t(),e(84," decorators, while their value matches the return of the option handler. If you'd like better type safety, you are welcome to create an interface for your options as well."),t(),n(85,"h4",14)(86,"span"),e(87,"Running the Command"),t()(),n(88,"p"),e(89,"Similar to how in a NestJS application we can use the "),n(90,"code"),e(91,"NestFactory"),t(),e(92," to create a server for us, and run it using "),n(93,"code"),e(94,"listen"),t(),e(95,", the "),n(96,"code"),e(97,"nest-commander"),t(),e(98," package exposes a simple to use API to run your server. Import the "),n(99,"code"),e(100,"CommandFactory"),t(),e(101," and use the "),n(102,"code"),e(103,"static"),t(),e(104," method "),n(105,"code"),e(106,"run"),t(),e(107," and pass in the root module of your application. This would probably look like below"),t(),n(108,"app-copy-button")(109,"pre")(110,"code",15),e(111,`
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

async function bootstrap() {
  await CommandFactory.run(AppModule);
}

bootstrap();
`),t()()(),n(112,"p"),e(113,"By default, Nest's logger is disabled when using the "),n(114,"code"),e(115,"CommandFactory"),t(),e(116,". It's possible to provide it though, as the second argument to the "),n(117,"code"),e(118,"run"),t(),e(119," function. You can either provide a custom NestJS logger, or an array of log levels you want to keep - it might be useful to at least provide "),n(120,"code"),e(121,"['error']"),t(),e(122," here, if you only want to print out Nest's error logs."),t(),n(123,"app-copy-button")(124,"pre")(125,"code",15),e(126,`
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';
import { LogService } from './log.service';

async function bootstrap() {
  await CommandFactory.run(AppModule, new LogService());

  // or, if you only want to print Nest's warnings and errors
  await CommandFactory.run(AppModule, ['warn', 'error']);
}

bootstrap();
`),t()()(),n(127,"p"),e(128,"And that's it. Under the hood, "),n(129,"code"),e(130,"CommandFactory"),t(),e(131," will worry about calling "),n(132,"code"),e(133,"NestFactory"),t(),e(134," for you and calling "),n(135,"code"),e(136,"app.close()"),t(),e(137," when necessary, so you shouldn't need to worry about memory leaks there. If you need to add in some error handling, there's always "),n(138,"code"),e(139,"try/catch"),t(),e(140," wrapping the "),n(141,"code"),e(142,"run"),t(),e(143," command, or you can chain on some "),n(144,"code"),e(145,".catch()"),t(),e(146," method to the "),n(147,"code"),e(148,"bootstrap()"),t(),e(149," call."),t(),n(150,"h4",16)(151,"span"),e(152,"Testing"),t()(),n(153,"p"),e(154,"So what's the use of writing a super awesome command line script if you can't test it super easily, right? Fortunately, "),n(155,"code"),e(156,"nest-commander"),t(),e(157," has some utilities you can make use of that fits in perfectly with the NestJS ecosystem, it'll feel right at home to any Nestlings out there. Instead of using the "),n(158,"code"),e(159,"CommandFactory"),t(),e(160," for building the command in test mode, you can use "),n(161,"code"),e(162,"CommandTestFactory"),t(),e(163," and pass in your metadata, very similarly to how "),n(164,"code"),e(165,"Test.createTestingModule"),t(),e(166," from "),n(167,"code"),e(168,"@nestjs/testing"),t(),e(169," works. In fact, it uses this package under the hood. You're also still able to chain on the "),n(170,"code"),e(171,"overrideProvider"),t(),e(172," methods before calling "),n(173,"code"),e(174,"compile()"),t(),e(175," so you can swap out DI pieces right in the test."),t(),n(176,"h4",17)(177,"span"),e(178,"Putting it all together"),t()(),n(179,"p"),e(180,"The following class would equate to having a CLI command that can take in the subcommand "),n(181,"code"),e(182,"basic"),t(),e(183," or be called directly, with "),n(184,"code"),e(185,"-n"),t(),e(186,", "),n(187,"code"),e(188,"-s"),t(),e(189,", and "),n(190,"code"),e(191,"-b"),t(),e(192," (along with their long flags) all being supported and with custom parsers for each option. The "),n(193,"code"),e(194,"--help"),t(),e(195," flag is also supported, as is customary with commander."),t(),n(196,"app-copy-button")(197,"pre")(198,"code",15),e(199,`
import { Command, CommandRunner, Option } from 'nest-commander';
import { LogService } from './log.service';

interface BasicCommandOptions {
  string?: string;
  boolean?: boolean;
  number?: number;
}

@Command({ name: 'basic', description: 'A parameter parse' })
export class BasicCommand extends CommandRunner {
  constructor(private readonly logService: LogService) {
    super()
  }

  async run(
    passedParam: string[],
    options?: BasicCommandOptions,
  ): Promise<void> {
    if (options?.boolean !== undefined && options?.boolean !== null) {
      this.runWithBoolean(passedParam, options.boolean);
    } else if (options?.number) {
      this.runWithNumber(passedParam, options.number);
    } else if (options?.string) {
      this.runWithString(passedParam, options.string);
    } else {
      this.runWithNone(passedParam);
    }
  }

  @Option({
    flags: '-n, --number [number]',
    description: 'A basic number parser',
  })
  parseNumber(val: string): number {
    return Number(val);
  }

  @Option({
    flags: '-s, --string [string]',
    description: 'A string return',
  })
  parseString(val: string): string {
    return val;
  }

  @Option({
    flags: '-b, --boolean [boolean]',
    description: 'A boolean parser',
  })
  parseBoolean(val: string): boolean {
    return JSON.parse(val);
  }

  runWithString(param: string[], option: string): void {
    this.logService.log({ param, string: option });
  }

  runWithNumber(param: string[], option: number): void {
    this.logService.log({ param, number: option });
  }

  runWithBoolean(param: string[], option: boolean): void {
    this.logService.log({ param, boolean: option });
  }

  runWithNone(param: string[]): void {
    this.logService.log({ param });
  }
}
`),t()()(),n(200,"p"),e(201,"Make sure the command class is added to a module"),t(),n(202,"app-copy-button")(203,"pre")(204,"code",15),e(205,`
@Module({
  providers: [LogService, BasicCommand],
})
export class AppModule {}
`),t()()(),n(206,"p"),e(207,"And now to be able to run the CLI in your main.ts you can do the following"),t(),n(208,"app-copy-button")(209,"pre")(210,"code",15),e(211,`
async function bootstrap() {
  await CommandFactory.run(AppModule);
}

bootstrap();
`),t()()(),n(212,"p"),e(213,"And just like that, you've got a command line application."),t(),n(214,"h4",18)(215,"span"),e(216,"More Information"),t()(),n(217,"p"),e(218,"Visit the "),n(219,"a",7),e(220,"nest-commander docs site"),t(),e(221," for more information, examples, and API documentation."),t()())},dependencies:[A,g,E],encapsulation:2,changeDetection:0})}return a})();var ie=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-async-local-storage"]],features:[S],decls:274,vars:32,consts:[["contentReference",""],["app17482cc004f29f45189820ad4ff378b4f7a701fb",""],["app9bf258cca2e479101d3b4021457e6bb6e957ef67",""],["app43149de7a2be56ed354df4924ad4c9dae7a825cb",""],["appc257c74f53644c053b67e961b37fbc5b686a413b",""],["app4db4e3878aa61844e8a3b9064c46e9b06704ce2b",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/async-local-storage.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","async-local-storage"],["rel","nofollow","target","_blank","href","https://nodejs.org/api/async_context.html#class-asynclocalstorage"],["appAnchor","","id","custom-implementation"],[1,"info"],["href","recipes/async-local-storage#nestjs-cls"],[1,"with-heading"],[1,"filename"],[1,"language-ts"],["start","2"],[1,"language-typescript"],["start","3"],["start","4"],[1,"warning"],["rel","nofollow","target","_blank","href","https://en.wikipedia.org/wiki/God_object"],["id","nestjs-cls"],["rel","nofollow","target","_blank","href","https://github.com/Papooch/nestjs-cls"],["rel","nofollow","target","_blank","href","https://www.npmjs.com/package/nestjs-cls#proxy-providers"],["rel","nofollow","target","_blank","href","https://github.com/Papooch/nestjs-cls/issues"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","usage"],["href","recipes/async-local-storage#custom-implementation"],["appAnchor","","id","testing"],["appAnchor","","id","more-information"]],template:function(p,u){if(p&1&&(n(0,"div",6,0)(2,"div",7)(3,"a",8),o(4,"i",9),t()(),n(5,"h3",10),e(6,"Async Local Storage"),t(),n(7,"p")(8,"code"),e(9,"AsyncLocalStorage"),t(),e(10," is a "),n(11,"a",11),e(12,"Node.js API"),t(),e(13," (based on the "),n(14,"code"),e(15,"async_hooks"),t(),e(16," API) that provides an alternative way of propagating local state through the application without the need to explicitly pass it as a function parameter. It is similar to a thread-local storage in other languages."),t(),n(17,"p"),e(18,"The main idea of Async Local Storage is that we can "),n(19,"em"),e(20,"wrap"),t(),e(21," some function call with the "),n(22,"code"),e(23,"AsyncLocalStorage#run"),t(),e(24," call. All code that is invoked within the wrapped call gets access to the same "),n(25,"code"),e(26,"store"),t(),e(27,", which will be unique to each call chain."),t(),n(28,"p"),e(29,"In the context of NestJS, that means if we can find a place within the request's lifecycle where we can wrap the rest of the request's code, we will be able to access and modify state visible only to that request, which may serve as an alternative to REQUEST-scoped providers and some of their limitations."),t(),n(30,"p"),e(31,"Alternatively, we can use ALS to propagate context for only a part of the system (for example the "),n(32,"em"),e(33,"transaction"),t(),e(34," object) without passing it around explicitly across services, which can increase isolation and encapsulation."),t(),n(35,"h4",12)(36,"span"),e(37,"Custom implementation"),t()(),n(38,"p"),e(39,"NestJS itself does not provide any built-in abstraction for "),n(40,"code"),e(41,"AsyncLocalStorage"),t(),e(42,", so let's walk through how we could implement it ourselves for the simplest HTTP case to get a better understanding of the whole concept:"),t(),n(43,"blockquote",13)(44,"strong"),e(45,"info"),t(),e(46," For a ready-made "),n(47,"a",14),e(48,"dedicated package"),t(),e(49,`, continue reading below.
`),t(),n(50,"ol")(51,"li"),e(52,"First, create a new instance of the "),n(53,"code"),e(54,"AsyncLocalStorage"),t(),e(55," in some shared source file. Since we're using NestJS, let's also turn it into a module with a custom provider."),t()(),n(56,"app-copy-button",15)(57,"span",16),e(58),l(59,"extension"),o(60,"app-tabs",null,1),t(),n(62,"pre")(63,"code",17),e(64,`
@Module({
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage(),
    },
  ],
  exports: [AsyncLocalStorage],
})
export class AlsModule {}
`),t()()(),n(65,"blockquote",13)(66,"strong"),e(67,"Hint"),t(),n(68,"code"),e(69,"AsyncLocalStorage"),t(),e(70," is imported from "),n(71,"code"),e(72,"async_hooks"),t(),e(73,`.
`),t(),n(74,"ol",18)(75,"li"),e(76,"We're only concerned with HTTP, so let's use a middleware to wrap the "),n(77,"code"),e(78,"next"),t(),e(79," function with "),n(80,"code"),e(81,"AsyncLocalStorage#run"),t(),e(82,". Since a middleware is the first thing that the request hits, this will make the "),n(83,"code"),e(84,"store"),t(),e(85," available in all enhancers and the rest of the system."),t()(),n(86,"app-copy-button",15)(87,"span",16),e(88),l(89,"extension"),o(90,"app-tabs",null,2),t(),n(92,"pre")(93,"code",19),e(94,`
@Module({
  imports: [AlsModule],
  providers: [CatsService],
  controllers: [CatsController],
})
export class AppModule implements NestModule {
  constructor(
    // inject the AsyncLocalStorage in the module constructor,
    private readonly als: AsyncLocalStorage
  ) {}

  configure(consumer: MiddlewareConsumer) {
    // bind the middleware,
    consumer
      .apply((req, res, next) => {
        // populate the store with some default values
        // based on the request,
        const store = {
          userId: req.headers['x-user-id'],
        };
        // and pass the "next" function as callback
        // to the "als.run" method together with the store.
        this.als.run(store, () => next());
      })
      .forRoutes('*path');
  }
}
`),t()(),n(95,"pre")(96,"code",19),e(97,`
@Module({
  imports: [AlsModule],
  providers: [CatsService],
  controllers: [CatsController],
})
@Dependencies(AsyncLocalStorage)
export class AppModule {
  constructor(als) {
    // inject the AsyncLocalStorage in the module constructor,
    this.als = als
  }

  configure(consumer) {
    // bind the middleware,
    consumer
      .apply((req, res, next) => {
        // populate the store with some default values
        // based on the request,
        const store = {
          userId: req.headers['x-user-id'],
        };
        // and pass the "next" function as callback
        // to the "als.run" method together with the store.
        this.als.run(store, () => next());
      })
      .forRoutes('*path');
  }
}
`),t()()(),n(98,"ol",20)(99,"li"),e(100,"Now, anywhere within the lifecycle of a request, we can access the local store instance."),t()(),n(101,"app-copy-button",15)(102,"span",16),e(103),l(104,"extension"),o(105,"app-tabs",null,3),t(),n(107,"pre")(108,"code",19),e(109,`
@Injectable()
export class CatsService {
  constructor(
    // We can inject the provided ALS instance.
    private readonly als: AsyncLocalStorage,
    private readonly catsRepository: CatsRepository,
  ) {}

  getCatForUser() {
    // The "getStore" method will always return the
    // store instance associated with the given request.
    const userId = this.als.getStore()["userId"] as number;
    return this.catsRepository.getForUser(userId);
  }
}
`),t()(),n(110,"pre")(111,"code",19),e(112,`
@Injectable()
@Dependencies(AsyncLocalStorage, CatsRepository)
export class CatsService {
  constructor(als, catsRepository) {
    // We can inject the provided ALS instance.
    this.als = als
    this.catsRepository = catsRepository
  }

  getCatForUser() {
    // The "getStore" method will always return the
    // store instance associated with the given request.
    const userId = this.als.getStore()["userId"] as number;
    return this.catsRepository.getForUser(userId);
  }
}
`),t()()(),n(113,"ol",21)(114,"li"),e(115,"That's it. Now we have a way to share request related state without needing to inject the whole "),n(116,"code"),e(117,"REQUEST"),t(),e(118," object."),t()(),n(119,"blockquote",22)(120,"strong"),e(121,"warning"),t(),e(122,' Please be aware that while the technique is useful for many use-cases, it inherently obfuscates the code flow (creating implicit context), so use it responsibly and especially avoid creating contextual "'),n(123,"a",23),e(124,"God objects"),t(),e(125,`".
`),t(),n(126,"h3",24),e(127,"NestJS CLS"),t(),n(128,"p"),e(129,"The "),n(130,"a",25),e(131,"nestjs-cls"),t(),e(132," package provides several DX improvements over using plain "),n(133,"code"),e(134,"AsyncLocalStorage"),t(),e(135," ("),n(136,"code"),e(137,"CLS"),t(),e(138," is an abbreviation of the term "),n(139,"em"),e(140,"continuation-local storage"),t(),e(141,"). It abstracts the implementation into a "),n(142,"code"),e(143,"ClsModule"),t(),e(144," that offers various ways of initializing the "),n(145,"code"),e(146,"store"),t(),e(147," for different transports (not only HTTP), as well as a strong-typing support."),t(),n(148,"p"),e(149,"The store can then be accessed with an injectable "),n(150,"code"),e(151,"ClsService"),t(),e(152,", or entirely abstracted away from the business logic by using "),n(153,"a",26),e(154,"Proxy Providers"),t(),e(155,"."),t(),n(156,"blockquote",13)(157,"strong"),e(158,"info"),t(),n(159,"code"),e(160,"nestjs-cls"),t(),e(161," is a third party package and is not managed by the NestJS core team. Please, report any issues found with the library in the "),n(162,"a",27),e(163,"appropriate repository"),t(),e(164,`.
`),t(),n(165,"h4",28)(166,"span"),e(167,"Installation"),t()(),n(168,"p"),e(169,"Apart from a peer dependency on the "),n(170,"code"),e(171,"@nestjs"),t(),e(172," libs, it only uses the built-in Node.js API. Install it as any other package."),t(),n(173,"pre")(174,"code",29),e(175,`
npm i nestjs-cls
`),t()(),n(176,"h4",30)(177,"span"),e(178,"Usage"),t()(),n(179,"p"),e(180,"A similar functionality as described "),n(181,"a",31),e(182,"above"),t(),e(183," can be implemented using "),n(184,"code"),e(185,"nestjs-cls"),t(),e(186," as follows:"),t(),n(187,"ol")(188,"li"),e(189,"Import the "),n(190,"code"),e(191,"ClsModule"),t(),e(192," in the root module."),t()(),n(193,"app-copy-button",15)(194,"span",16),e(195),l(196,"extension"),o(197,"app-tabs",null,4),t(),n(199,"pre")(200,"code",17),e(201,`
@Module({
  imports: [
    // Register the ClsModule,
    ClsModule.forRoot({
      middleware: {
        // automatically mount the
        // ClsMiddleware for all routes
        mount: true,
        // and use the setup method to
        // provide default store values.
        setup: (cls, req) => {
          cls.set('userId', req.headers['x-user-id']);
        },
      },
    }),
  ],
  providers: [CatsService],
  controllers: [CatsController],
})
export class AppModule {}
`),t()()(),n(202,"ol",18)(203,"li"),e(204,"And then can use the "),n(205,"code"),e(206,"ClsService"),t(),e(207," to access the store values."),t()(),n(208,"app-copy-button",15)(209,"span",16),e(210),l(211,"extension"),o(212,"app-tabs",null,5),t(),n(214,"pre")(215,"code",19),e(216,`
@Injectable()
export class CatsService {
  constructor(
    // We can inject the provided ClsService instance,
    private readonly cls: ClsService,
    private readonly catsRepository: CatsRepository,
  ) {}

  getCatForUser() {
    // and use the "get" method to retrieve any stored value.
    const userId = this.cls.get('userId');
    return this.catsRepository.getForUser(userId);
  }
}
`),t()(),n(217,"pre")(218,"code",19),e(219,`
@Injectable()
@Dependencies(AsyncLocalStorage, CatsRepository)
export class CatsService {
  constructor(cls, catsRepository) {
    // We can inject the provided ClsService instance,
    this.cls = cls
    this.catsRepository = catsRepository
  }

  getCatForUser() {
    // and use the "get" method to retrieve any stored value.
    const userId = this.cls.get('userId');
    return this.catsRepository.getForUser(userId);
  }
}
`),t()()(),n(220,"ol",20)(221,"li"),e(222,"To get strong typing of the store values managed by the "),n(223,"code"),e(224,"ClsService"),t(),e(225," (and also get auto-suggestions of the string keys), we can use an optional type parameter "),n(226,"code"),e(227,"ClsService<MyClsStore>"),t(),e(228," when injecting it."),t()(),n(229,"app-copy-button")(230,"pre")(231,"code",17),e(232,`
export interface MyClsStore extends ClsStore {
  userId: number;
}
`),t()()(),n(233,"blockquote",13)(234,"strong"),e(235,"hint"),t(),e(236," It it also possible to let the package automatically generate a Request ID and access it later with "),n(237,"code"),e(238,"cls.getId()"),t(),e(239,", or to get the whole Request object using "),n(240,"code"),e(241,"cls.get(CLS_REQ)"),t(),e(242,`.
`),t(),n(243,"h4",32)(244,"span"),e(245,"Testing"),t()(),n(246,"p"),e(247,"Since the "),n(248,"code"),e(249,"ClsService"),t(),e(250," is just another injectable provider, it can be entirely mocked out in unit tests."),t(),n(251,"p"),e(252,"However, in certain integration tests, we might still want to use the real "),n(253,"code"),e(254,"ClsService"),t(),e(255," implementation. In that case, we will need to wrap the context-aware piece of code with a call to "),n(256,"code"),e(257,"ClsService#run"),t(),e(258," or "),n(259,"code"),e(260,"ClsService#runWith"),t(),e(261,"."),t(),n(262,"app-copy-button")(263,"pre")(264,"code",17),e(265,`
describe('CatsService', () => {
  let service: CatsService
  let cls: ClsService
  const mockCatsRepository = createMock<CatsRepository>()

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      // Set up most of the testing module as we normally would.
      providers: [
        CatsService,
        {
          provide: CatsRepository
          useValue: mockCatsRepository
        }
      ],
      imports: [
        // Import the static version of ClsModule which only provides
        // the ClsService, but does not set up the store in any way.
        ClsModule
      ],
    }).compile()

    service = module.get(CatsService)

    // Also retrieve the ClsService for later use.
    cls = module.get(ClsService)
  })

  describe('getCatForUser', () => {
    it('retrieves cat based on user id', async () => {
      const expectedUserId = 42
      mocksCatsRepository.getForUser.mockImplementationOnce(
        (id) => ({ userId: id })
      )

      // Wrap the test call in the \`runWith\` method
      // in which we can pass hand-crafted store values.
      const cat = await cls.runWith(
        { userId: expectedUserId },
        () => service.getCatForUser()
      )

      expect(cat.userId).toEqual(expectedUserId)
    })
  })
})
`),t()()(),n(266,"h4",33)(267,"span"),e(268,"More information"),t()(),n(269,"p"),e(270,"Visit the "),n(271,"a",25),e(272,"NestJS CLS GitHub Page"),t(),e(273," for the full API documentation and more code examples."),t()()),p&2){let y=r(61),b=r(91),v=r(106),k=r(198),w=r(213);i(58),s(" ",d(59,17,"als.module",y.isJsActive),`
`),i(30),s(" ",d(89,20,"app.module",b.isJsActive),`
`),i(4),m("hide",b.isJsActive),i(3),m("hide",!b.isJsActive),i(8),s(" ",d(104,23,"cats.service",v.isJsActive),`
`),i(4),m("hide",v.isJsActive),i(3),m("hide",!v.isJsActive),i(85),s(" ",d(196,26,"app.module",k.isJsActive),`
`),i(15),s(" ",d(211,29,"cats.service",w.isJsActive),`
`),i(4),m("hide",w.isJsActive),i(3),m("hide",!w.isJsActive)}},dependencies:[g,E,C,I],encapsulation:2,changeDetection:0})}return a})();var oe=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-suites"]],features:[S],decls:343,vars:32,consts:[["contentReference",""],["appe22376ad98d53134e89aa65384af072f61830f7a",""],["app9ddf36983930c84a940de72b89018a44d88ac899",""],["appb24b07c0bab9b595db96a1fe9fcabac12f7a6801",""],["app101cf36dd4ed9ca6a263666d8a81d4d4ba31ba88",""],["app3fe8392fa141df552608f70d94fda4acb7a0116a",""],["appdc1970d498ef0a9661bc89d3117a2c37706af03a",""],["app9aa8b8bbc40a5b86de736c726feae8ce501a0ffb",""],["app6a302c6cd7985da1ef5a2282caf046ee5ef55133",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/suites.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","suites"],["rel","nofollow","target","_blank","href","https://suites.dev"],["rel","nofollow","target","_blank","href","https://github.com/suites-dev/suites"],["routerLink","/fundamentals/testing"],[1,"info"],["appAnchor","","id","getting-started"],["appAnchor","","id","install-suites"],[1,"language-bash"],["appAnchor","","id","set-up-type-definitions"],[1,"language-typescript"],["appAnchor","","id","create-a-sample-service"],[1,"with-heading"],[1,"filename"],["appAnchor","","id","write-a-unit-test"],["appAnchor","","id","pre-compile-mock-configuration"],["appAnchor","","id","testing-with-real-dependencies"],["appAnchor","","id","token-based-dependencies"],["appAnchor","","id","using-mock-and-stub-directly"],["href","/fundamentals/testing#auto-mocking"],["appAnchor","","id","summary"],["rel","nofollow","target","_blank","href","https://suites.dev/docs"]],template:function(p,u){if(p&1&&(n(0,"div",9,0)(2,"div",10)(3,"a",11),o(4,"i",12),t()(),n(5,"h3",13),e(6,"Suites"),t(),n(7,"p")(8,"a",14),e(9,"Suites"),t(),e(10," is an "),n(11,"a",15),e(12,"open-source"),t(),e(13," unit-testing framework for TypeScript dependency injection frameworks. It is used as an "),n(14,"strong"),e(15,"alternative"),t(),e(16," to manually creating mocks, verbose test setup with multiple mock configurations, or working with untyped test doubles (like mocks and stubs)."),t(),n(17,"p"),e(18,`Suites reads metadata from nestjs services at runtime and automatically generates fully-typed mocks for all dependencies.
This removes boilerplate mock setup and ensures type-safe tests. While Suites can be used alongside `),n(19,"code"),e(20,"Test.createTestingModule()"),t(),e(21,`, it excels at focused unit testing.
Use `),n(22,"code"),e(23,"Test.createTestingModule()"),t(),e(24,` when validating module wiring, decorators, guards, and interceptors.
Use Suites for fast unit tests with automatic mock generation.`),t(),n(25,"p"),e(26,"For more information on module-based testing, see the "),n(27,"a",16),e(28,"testing fundamentals"),t(),e(29," chapter."),t(),n(30,"blockquote",17)(31,"strong"),e(32,"Note"),t(),n(33,"code"),e(34,"Suites"),t(),e(35," is a third-party package and is not maintained by the NestJS core team. Please report any issues to the "),n(36,"a",15),e(37,"appropriate repository"),t(),e(38,`.
`),t(),n(39,"h4",18)(40,"span"),e(41,"Getting started"),t()(),n(42,"p"),e(43,"This guide demonstrates using Suites to test NestJS services. It covers both isolated testing (all dependencies mocked) and sociable testing (selected real implementations)."),t(),n(44,"h4",19)(45,"span"),e(46,"Install Suites"),t()(),n(47,"p"),e(48,"Verify NestJS runtime dependencies are installed:"),t(),n(49,"pre")(50,"code",20),e(51,`
$ npm install @nestjs/common @nestjs/core reflect-metadata
`),t()(),n(52,"p"),e(53,"Install Suites core, the NestJS adapter, and the doubles adapter:"),t(),n(54,"pre")(55,"code",20),e(56,`
$ npm install --save-dev @suites/unit @suites/di.nestjs @suites/doubles.jest
`),t()(),n(57,"p"),e(58,"The doubles adapter ("),n(59,"code"),e(60,"@suites/doubles.jest"),t(),e(61,") provides wrappers around Jest's mocking capabilities. It exposes "),n(62,"code"),e(63,"mock()"),t(),e(64," and "),n(65,"code"),e(66,"stub()"),t(),e(67," functions that create type-safe test doubles."),t(),n(68,"p"),e(69,"Ensure Jest and TypeScript are available:"),t(),n(70,"pre")(71,"code",20),e(72,`
$ npm install --save-dev ts-jest @types/jest jest typescript
`),t()(),n(73,"details")(74,"summary"),e(75,"Expand if you're using Vitest"),t(),n(76,"pre")(77,"code",20),e(78,`
$ npm install --save-dev @suites/unit @suites/di.nestjs @suites/doubles.vitest
`),t()()(),n(79,"details")(80,"summary"),e(81,"Expand if you're using Sinon"),t(),n(82,"pre")(83,"code",20),e(84,`
$ npm install --save-dev @suites/unit @suites/di.nestjs @suites/doubles.sinon
`),t()()(),n(85,"blockquote",17)(86,"strong"),e(87,"Hint"),t(),e(88," Make sure to have "),n(89,"code"),e(90,'"emitDecoratorMetadata": true'),t(),e(91," in your tsconfig "),n(92,"code"),e(93,"compilerOptions"),t(),e(94,` (NestJS standard).
`),t(),n(95,"h4",21)(96,"span"),e(97,"Set up type definitions"),t()(),n(98,"p"),e(99,"Create "),n(100,"code"),e(101,"global.d.ts"),t(),e(102," at your project root:"),t(),n(103,"app-copy-button")(104,"pre")(105,"code",22),e(106,`
/// <reference types="@suites/doubles.jest/unit" />
/// <reference types="@suites/di.nestjs/types" />
`),t()()(),n(107,"h4",23)(108,"span"),e(109,"Create a sample service"),t()(),n(110,"p"),e(111,"This guide uses a simple "),n(112,"code"),e(113,"UserService"),t(),e(114," with two dependencies:"),t(),n(115,"app-copy-button",24)(116,"span",25),e(117),l(118,"extension"),o(119,"app-tabs",null,1),t(),n(121,"pre")(122,"code",22),e(123,`
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository {
  async findById(id: string): Promise<User | null> {
    // Database query
  }

  async save(user: User): Promise<User> {
    // Database save
  }
}
`),t()()(),n(124,"app-copy-button",24)(125,"span",25),e(126),l(127,"extension"),o(128,"app-tabs",null,2),t(),n(130,"pre")(131,"code",22),e(132,`
import { Injectable, NotFoundException } from '@nestjs/common';
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    private repository: UserRepository,
    private logger: Logger,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException(\`User \${id} not found\`);
    }
    this.logger.log(\`Found user \${id}\`);
    return user;
  }

  async create(email: string, name: string): Promise<User> {
    const user = { id: generateId(), email, name };
    await this.repository.save(user);
    this.logger.log(\`Created user \${user.id}\`);
    return user;
  }
}
`),t()()(),n(133,"h4",26)(134,"span"),e(135,"Write a unit test"),t()(),n(136,"p"),e(137,"Use "),n(138,"code"),e(139,"TestBed.solitary()"),t(),e(140," to create isolated tests with all dependencies mocked:"),t(),n(141,"app-copy-button",24)(142,"span",25),e(143),l(144,"extension"),o(145,"app-tabs",null,3),t(),n(147,"pre")(148,"code",22),e(149,`
import { TestBed, type Mocked } from '@suites/unit';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { Logger } from '@nestjs/common';

describe('User Service Unit Spec', () => {
  let userService: UserService;
  let repository: Mocked<UserRepository>;
  let logger: Mocked<Logger>;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(UserService).compile();

    userService = unit;
    repository = unitRef.get(UserRepository);
    logger = unitRef.get(Logger);
  });

  it('should find user by id', async () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test' };
    repository.findById.mockResolvedValue(user);

    const result = await userService.findById('1');

    expect(result).toEqual(user);
    expect(logger.log).toHaveBeenCalled();
  });
});
`),t()()(),n(150,"p")(151,"code"),e(152,"TestBed.solitary()"),t(),e(153,` analyzes the constructor and creates typed mocks for all dependencies.
The `),n(154,"code"),e(155,"Mocked<T>"),t(),e(156," type provides IntelliSense support for mock configuration."),t(),n(157,"h4",27)(158,"span"),e(159,"Pre-compile mock configuration"),t()(),n(160,"p"),e(161,"Configure mock behavior before compilation using "),n(162,"code"),e(163,".mock().impl()"),t(),e(164,":"),t(),n(165,"app-copy-button",24)(166,"span",25),e(167),l(168,"extension"),o(169,"app-tabs",null,4),t(),n(171,"pre")(172,"code",22),e(173,`
import { TestBed } from '@suites/unit';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

describe('User Service Unit Spec - pre-configured', () => {
  let unit: UserService;
  let repository: Mocked<UserRepository>;
  
  beforeAll(async () => {
    const { unit: underTest, unitRef } = await TestBed.solitary(UserService)
      .mock(UserRepository)
      .impl(stubFn => ({
        findById: stubFn().mockResolvedValue({ id: '1', email: 'test@example.com', name: 'Test' })
      }))
      .compile();
    
    repository = unitRef.get(UserRepository);
    unit = underTest;
  })
  
  it('should find user with pre-configured mock', async () => {
    const result = await unit.findById('1');
    
    expect(repository.findById).toHaveBeenCalled();
    expect(result.email).toBe('test@example.com');
  });
});
`),t()()(),n(174,"p"),e(175,"The "),n(176,"code"),e(177,"stubFn"),t(),e(178," parameter corresponds to the installed doubles adapter ("),n(179,"code"),e(180,"jest.fn()"),t(),e(181," for Jest, "),n(182,"code"),e(183,"vi.fn()"),t(),e(184," for Vitest, "),n(185,"code"),e(186,"sinon.stub()"),t(),e(187," for Sinon)."),t(),n(188,"h4",28)(189,"span"),e(190,"Testing with real dependencies"),t()(),n(191,"p"),e(192,"Use "),n(193,"code"),e(194,"TestBed.sociable()"),t(),e(195," with "),n(196,"code"),e(197,".expose()"),t(),e(198," to use real implementations for specific dependencies:"),t(),n(199,"app-copy-button",24)(200,"span",25),e(201),l(202,"extension"),o(203,"app-tabs",null,5),t(),n(205,"pre")(206,"code",22),e(207,`
import { TestBed, Mocked } from '@suites/unit';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { Logger } from '@nestjs/common';

describe('UserService - with real logger', () => {
  let userService: UserService;
  let repository: Mocked<UserRepository>;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.sociable(UserService)
      .expose(Logger)
      .compile();

    userService = unit;
    repository = unitRef.get(UserRepository);
  });

  it('should log when finding user', async () => {
    const user = { id: '1', email: 'test@example.com' };
    repository.findById.mockResolvedValue(user);

    await userService.findById('1');

    // Logger actually executes, no mock needed
  });
});
`),t()()(),n(208,"p")(209,"code"),e(210,".expose(Logger)"),t(),e(211," instantiates "),n(212,"code"),e(213,"Logger"),t(),e(214," with its real implementation while keeping other dependencies mocked."),t(),n(215,"h4",29)(216,"span"),e(217,"Token-based dependencies"),t()(),n(218,"p"),e(219,"Suites handles custom injection tokens (strings or symbols):"),t(),n(220,"app-copy-button",24)(221,"span",25),e(222),l(223,"extension"),o(224,"app-tabs",null,6),t(),n(226,"pre")(227,"code",22),e(228,`
import { Injectable, Inject } from '@nestjs/common';

export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';

@Injectable()
export class ConfigService {
  constructor(
    @Inject(CONFIG_OPTIONS) private options: { apiKey: string },
  ) {}

  getApiKey(): string {
    return this.options.apiKey;
  }
}
`),t()()(),n(229,"p"),e(230,"Access token-based dependencies with "),n(231,"code"),e(232,"unitRef.get()"),t(),e(233,":"),t(),n(234,"app-copy-button",24)(235,"span",25),e(236),l(237,"extension"),o(238,"app-tabs",null,7),t(),n(240,"pre")(241,"code",22),e(242,`
import { TestBed } from '@suites/unit';
import { ConfigService, CONFIG_OPTIONS, ConfigOptions } from './config.service';

describe('Config Service Unit Spec', () => {
  let configService: ConfigService;
  let options: ConfigOptions;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(ConfigService).compile();
    configService = unit;

    options = unitRef.get<ConfigOptions>(CONFIG_OPTIONS);
  });

  it('should return api key', () => { ... });
});
`),t()()(),n(243,"h4",30)(244,"span"),e(245,"Using mock() and stub() directly"),t()(),n(246,"p"),e(247,"For those who prefer direct control without "),n(248,"code"),e(249,"TestBed"),t(),e(250,", the doubles adapter package provides "),n(251,"code"),e(252,"mock()"),t(),e(253," and "),n(254,"code"),e(255,"stub()"),t(),e(256," functions:"),t(),n(257,"app-copy-button",24)(258,"span",25),e(259),l(260,"extension"),o(261,"app-tabs",null,8),t(),n(263,"pre")(264,"code",22),e(265,`
import { mock } from '@suites/unit';
import { UserRepository } from './user.repository';

describe('User Service Unit Spec', () => {
  it('should work with direct mocks', async () => {
    const repository = mock<UserRepository>();
    const logger = mock<Logger>();

    const service = new UserService(repository, logger);

    // ...
  });
});
`),t()()(),n(266,"p")(267,"code"),e(268,"mock()"),t(),e(269," creates a typed mock object, and "),n(270,"code"),e(271,"stub()"),t(),e(272," wraps the underlying mocking library (Jest in this example) to provide methods like "),n(273,"code"),e(274,"mockResolvedValue()"),t(),e(275,`
These functions come from the installed doubles adapter (`),n(276,"code"),e(277,"@suites/doubles.jest"),t(),e(278,"), which adapts the native mocking capabilities of the test framework."),t(),n(279,"blockquote",17)(280,"strong"),e(281,"Hint"),t(),e(282," The "),n(283,"code"),e(284,"mock()"),t(),e(285," function is an alternative to "),n(286,"code"),e(287,"createMock"),t(),e(288," from "),n(289,"code"),e(290,"@golevelup/ts-jest"),t(),e(291,". Both create typed mock objects. See the "),n(292,"a",31),e(293,"testing fundamentals"),t(),e(294," chapter for more on "),n(295,"code"),e(296,"createMock"),t(),e(297,`.
`),t(),n(298,"h4",32)(299,"span"),e(300,"Summary"),t()(),n(301,"p")(302,"strong"),e(303,"Use "),n(304,"code"),e(305,"Test.createTestingModule()"),t(),e(306," for:"),t()(),n(307,"ul")(308,"li"),e(309,"Validating module configuration and provider wiring"),t(),n(310,"li"),e(311,"Testing decorators, guards, interceptors, and pipes"),t(),n(312,"li"),e(313,"Verifying dependency injection across modules"),t(),n(314,"li"),e(315,"Testing full application context with middleware"),t()(),n(316,"p")(317,"strong"),e(318,"Use Suites for:"),t()(),n(319,"ul")(320,"li"),e(321,"Fast unit tests focused on business logic"),t(),n(322,"li"),e(323,"Automatic mock generation for multiple dependencies"),t(),n(324,"li"),e(325,"Type-safe test doubles with IntelliSense"),t()(),n(326,"p"),e(327,"Organize tests by purpose: use Suites for unit tests verifying individual service behavior, and use "),n(328,"code"),e(329,"Test.createTestingModule()"),t(),e(330," for integration tests verifying module configuration."),t(),n(331,"p"),e(332,"For more information:"),t(),n(333,"ul")(334,"li")(335,"a",33),e(336,"Suites Documentation"),t()(),n(337,"li")(338,"a",15),e(339,"Suites GitHub Repository"),t()(),n(340,"li")(341,"a",16),e(342,"NestJS Testing Documentation"),t()()()()),p&2){let y=r(120),b=r(129),v=r(146),k=r(170),w=r(204),j=r(225),P=r(239),M=r(262);i(117),s(" ",d(118,8,"user.repository",y.isJsActive),`
`),i(9),s(" ",d(127,11,"user.service",b.isJsActive),`
`),i(17),s(" ",d(144,14,"user.service.spec",v.isJsActive),`
`),i(24),s(" ",d(168,17,"user.service.spec",k.isJsActive),`
`),i(34),s(" ",d(202,20,"user.service.spec",w.isJsActive),`
`),i(21),s(" ",d(223,23,"config.service",j.isJsActive),`
`),i(14),s(" ",d(237,26,"config.service.spec",P.isJsActive),`
`),i(23),s(" ",d(260,29,"user.service.spec",M.isJsActive),`
`)}},dependencies:[g,E,C,A,I],encapsulation:2,changeDetection:0})}return a})();var ae=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-swc"]],features:[S],decls:433,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/swc.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","swc"],["rel","nofollow","target","_blank","href","https://swc.rs/"],[1,"info"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","getting-started"],["href","/recipes/swc#monorepo"],[1,"language-json"],["appAnchor","","id","type-checking"],["appAnchor","","id","cli-plugins-swc"],["appAnchor","","id","swc-configuration"],["appAnchor","","id","monorepo"],[1,"language-js"],["appAnchor","","id","monorepo-and-cli-plugins"],[1,"language-ts"],["appAnchor","","id","common-pitfalls"],[1,"language-typescript"],["routerLink","/fundamentals/circular-dependency"],["id","jest--swc"],["href","/recipes/swc#monorepo-and-cli-plugins"],["id","vitest"],["rel","nofollow","target","_blank","href","https://vitest.dev/"],["appAnchor","","id","installation-1"],["appAnchor","","id","configuration"],["id","path-aliases"],["appAnchor","","id","update-imports-in-e2e-tests"],["rel","nofollow","target","_blank","href","https://github.com/TrilonIO/nest-vitest"]],template:function(p,u){p&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"SWC"),t(),n(7,"p")(8,"a",6),e(9,"SWC"),t(),e(10,` (Speedy Web Compiler) is an extensible Rust-based platform that can be used for both compilation and bundling.
Using SWC with Nest CLI is a great and simple way to significantly speed up your development process.`),t(),n(11,"blockquote",7)(12,"strong"),e(13,"Hint"),t(),e(14," SWC is approximately "),n(15,"strong"),e(16,"x20 times faster"),t(),e(17,` than the default TypeScript compiler.
`),t(),n(18,"h4",8)(19,"span"),e(20,"Installation"),t()(),n(21,"p"),e(22,"To get started, first install a few packages:"),t(),n(23,"pre")(24,"code",9),e(25,`
$ npm i --save-dev @swc/cli @swc/core
`),t()(),n(26,"h4",10)(27,"span"),e(28,"Getting started"),t()(),n(29,"p"),e(30,"Once the installation process is complete, you can use the "),n(31,"code"),e(32,"swc"),t(),e(33," builder with Nest CLI, as follows:"),t(),n(34,"pre")(35,"code",9),e(36,`
$ nest start -b swc
# OR nest start --builder swc
`),t()(),n(37,"blockquote",7)(38,"strong"),e(39,"Hint"),t(),e(40," If your repository is a monorepo, check out "),n(41,"a",11),e(42,"this section"),t(),e(43,`.
`),t(),n(44,"p"),e(45,"Instead of passing the "),n(46,"code"),e(47,"-b"),t(),e(48," flag you can also just set the "),n(49,"code"),e(50,"compilerOptions.builder"),t(),e(51," property to "),n(52,"code"),e(53,'"swc"'),t(),e(54," in your "),n(55,"code"),e(56,"nest-cli.json"),t(),e(57," file, like so:"),t(),n(58,"pre")(59,"code",12),e(60,`
{
  "compilerOptions": {
    "builder": "swc"
  }
}
`),t()(),n(61,"p"),e(62,"To customize builder's behavior, you can pass an object containing two attributes, "),n(63,"code"),e(64,"type"),t(),e(65," ("),n(66,"code"),e(67,'"swc"'),t(),e(68,") and "),n(69,"code"),e(70,"options"),t(),e(71,", as follows:"),t(),n(72,"pre")(73,"code",12),e(74,`
{
  "compilerOptions": {
    "builder": {
      "type": "swc",
      "options": {
        "swcrcPath": "infrastructure/.swcrc",
      }
    }
  }
}
`),t()(),n(75,"p"),e(76,"For example, to make the swc compile "),n(77,"code"),e(78,".jsx"),t(),e(79," and "),n(80,"code"),e(81,".tsx"),t(),e(82," files, do:"),t(),n(83,"pre")(84,"code",12),e(85,`
{
  "compilerOptions": {
    "builder": {
      "type": "swc",
      "options": { "extensions": [".ts", ".tsx", ".js", ".jsx"] }
    },
  }
}
`),t()(),n(86,"p"),e(87,"To run the application in watch mode, use the following command:"),t(),n(88,"pre")(89,"code",9),e(90,`
$ nest start -b swc -w
# OR nest start --builder swc --watch
`),t()(),n(91,"h4",13)(92,"span"),e(93,"Type checking"),t()(),n(94,"p"),e(95,"SWC does not perform any type checking itself (as opposed to the default TypeScript compiler), so to turn it on, you need to use the "),n(96,"code"),e(97,"--type-check"),t(),e(98," flag:"),t(),n(99,"pre")(100,"code",9),e(101,`
$ nest start -b swc --type-check
`),t()(),n(102,"p"),e(103,"This command will instruct the Nest CLI to run "),n(104,"code"),e(105,"tsc"),t(),e(106," in "),n(107,"code"),e(108,"noEmit"),t(),e(109," mode alongside SWC, which will asynchronously perform type checking. Again, instead of passing the "),n(110,"code"),e(111,"--type-check"),t(),e(112," flag you can also just set the "),n(113,"code"),e(114,"compilerOptions.typeCheck"),t(),e(115," property to "),n(116,"code"),e(117,"true"),t(),e(118," in your "),n(119,"code"),e(120,"nest-cli.json"),t(),e(121," file, like so:"),t(),n(122,"pre")(123,"code",12),e(124,`
{
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true
  }
}
`),t()(),n(125,"h4",14)(126,"span"),e(127,"CLI Plugins (SWC)"),t()(),n(128,"p"),e(129,"The "),n(130,"code"),e(131,"--type-check"),t(),e(132," flag will automatically execute "),n(133,"strong"),e(134,"NestJS CLI plugins"),t(),e(135," and produce a serialized metadata file which then can be loaded by the application at runtime."),t(),n(136,"h4",15)(137,"span"),e(138,"SWC configuration"),t()(),n(139,"p"),e(140,"SWC builder is pre-configured to match the requirements of NestJS applications. However, you can customize the configuration by creating a "),n(141,"code"),e(142,".swcrc"),t(),e(143," file in the root directory and tweaking the options as you wish."),t(),n(144,"pre")(145,"code",12),e(146,`
{
  "$schema": "https://swc.rs/schema.json",
  "sourceMaps": true,
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "baseUrl": "./"
  },
  "minify": false
}
`),t()(),n(147,"h4",16)(148,"span"),e(149,"Monorepo"),t()(),n(150,"p"),e(151,"If your repository is a monorepo, then instead of using "),n(152,"code"),e(153,"swc"),t(),e(154," builder you have to configure "),n(155,"code"),e(156,"webpack"),t(),e(157," to use "),n(158,"code"),e(159,"swc-loader"),t(),e(160,"."),t(),n(161,"p"),e(162,"First, let's install the required package:"),t(),n(163,"pre")(164,"code",9),e(165,`
$ npm i --save-dev swc-loader
`),t()(),n(166,"p"),e(167,"Once the installation is complete, create a "),n(168,"code"),e(169,"webpack.config.js"),t(),e(170," file in the root directory of your application with the following content:"),t(),n(171,"pre")(172,"code",17),e(173,`
const swcDefaultConfig = require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory().swcOptions;

module.exports = {
  module: {
    rules: [
      {
        test: /\\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: swcDefaultConfig,
        },
      },
    ],
  },
};
`),t()(),n(174,"h4",18)(175,"span"),e(176,"Monorepo and CLI plugins"),t()(),n(177,"p"),e(178,"Now if you use CLI plugins, "),n(179,"code"),e(180,"swc-loader"),t(),e(181,` will not load them automatically. Instead, you have to create a separate file that will load them manually. To do so,
declare a `),n(182,"code"),e(183,"generate-metadata.ts"),t(),e(184," file near the "),n(185,"code"),e(186,"main.ts"),t(),e(187," file with the following content:"),t(),n(188,"app-copy-button")(189,"pre")(190,"code",19),e(191,`
import { PluginMetadataGenerator } from '@nestjs/cli/lib/compiler/plugins/plugin-metadata-generator';
import { ReadonlyVisitor } from '@nestjs/swagger/dist/plugin';

const generator = new PluginMetadataGenerator();
generator.generate({
  visitors: [new ReadonlyVisitor({ introspectComments: true, pathToSource: __dirname })],
  outputDir: __dirname,
  watch: true,
  tsconfigPath: 'apps/<name>/tsconfig.app.json',
});
`),t()()(),n(192,"blockquote",7)(193,"strong"),e(194,"Hint"),t(),e(195," In this example we used "),n(196,"code"),e(197,"@nestjs/swagger"),t(),e(198,` plugin, but you can use any plugin of your choice.
`),t(),n(199,"p"),e(200,"The "),n(201,"code"),e(202,"generate()"),t(),e(203," method accepts the following options:"),t(),n(204,"table"),o(205,"thead"),n(206,"tbody")(207,"tr")(208,"td")(209,"code"),e(210,"watch"),t()(),n(211,"td"),e(212,"Whether to watch the project for changes."),t()(),n(213,"tr")(214,"td")(215,"code"),e(216,"tsconfigPath"),t()(),n(217,"td"),e(218,"Path to the "),n(219,"code"),e(220,"tsconfig.json"),t(),e(221," file. Relative to the current working directory ("),n(222,"code"),e(223,"process.cwd()"),t(),e(224,")."),t()(),n(225,"tr")(226,"td")(227,"code"),e(228,"outputDir"),t()(),n(229,"td"),e(230,"Path to the directory where the metadata file will be saved."),t()(),n(231,"tr")(232,"td")(233,"code"),e(234,"visitors"),t()(),n(235,"td"),e(236,"An array of visitors that will be used to generate metadata."),t()(),n(237,"tr")(238,"td")(239,"code"),e(240,"filename"),t()(),n(241,"td"),e(242,"The name of the metadata file. Defaults to "),n(243,"code"),e(244,"metadata.ts"),t(),e(245,"."),t()(),n(246,"tr")(247,"td")(248,"code"),e(249,"printDiagnostics"),t()(),n(250,"td"),e(251,"Whether to print diagnostics to the console. Defaults to "),n(252,"code"),e(253,"true"),t(),e(254,"."),t()()()(),n(255,"p"),e(256,"Finally, you can run the "),n(257,"code"),e(258,"generate-metadata"),t(),e(259," script in a separate terminal window with the following command:"),t(),n(260,"pre")(261,"code",9),e(262,`
$ npx ts-node src/generate-metadata.ts
# OR npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
`),t()(),n(263,"h4",20)(264,"span"),e(265,"Common pitfalls"),t()(),n(266,"p"),e(267,"If you use TypeORM/MikroORM or any other ORM in your application, you may stumble upon circular import issues. SWC doesn't handle "),n(268,"strong"),e(269,"circular imports"),t(),e(270," well, so you should use the following workaround:"),t(),n(271,"app-copy-button")(272,"pre")(273,"code",21),e(274,`
@Entity()
export class User {
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Relation<Profile>; // <--- see "Relation<>" type here instead of just "Profile"
}
`),t()()(),n(275,"blockquote",7)(276,"strong"),e(277,"Hint"),t(),n(278,"code"),e(279,"Relation"),t(),e(280," type is exported from the "),n(281,"code"),e(282,"typeorm"),t(),e(283,` package.
`),t(),n(284,"p"),e(285,"Doing this prevents the type of the property from being saved in the transpiled code in the property metadata, preventing circular dependency issues."),t(),n(286,"p"),e(287,"If your ORM does not provide a similar workaround, you can define the wrapper type yourself:"),t(),n(288,"app-copy-button")(289,"pre")(290,"code",21),e(291,`
/**
 * Wrapper type used to circumvent ESM modules circular dependency issue
 * caused by reflection metadata saving the type of the property.
 */
export type WrapperType<T> = T; // WrapperType === Relation
`),t()()(),n(292,"p"),e(293,"For all "),n(294,"a",22),e(295,"circular dependency injections"),t(),e(296," in your project, you will also need to use the custom wrapper type described above:"),t(),n(297,"app-copy-button")(298,"pre")(299,"code",21),e(300,`
@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => ProfileService))
    private readonly profileService: WrapperType<ProfileService>,
  ) {};
}
`),t()()(),n(301,"h3",23),e(302,"Jest + SWC"),t(),n(303,"p"),e(304,"To use SWC with Jest, you need to install the following packages:"),t(),n(305,"pre")(306,"code",9),e(307,`
$ npm i --save-dev jest @swc/core @swc/jest
`),t()(),n(308,"p"),e(309,"Once the installation is complete, update the "),n(310,"code"),e(311,"package.json"),t(),e(312,"/"),n(313,"code"),e(314,"jest.config.js"),t(),e(315," file (depending on your configuration) with the following content:"),t(),n(316,"pre")(317,"code",12),e(318,`
{
  "jest": {
    "transform": {
      "^.+\\\\.(t|j)s?$": ["@swc/jest"]
    }
  }
}
`),t()(),n(319,"p"),e(320,"Additionally you would need to add the following "),n(321,"code"),e(322,"transform"),t(),e(323," properties to your "),n(324,"code"),e(325,".swcrc"),t(),e(326," file: "),n(327,"code"),e(328,"legacyDecorator"),t(),e(329,", "),n(330,"code"),e(331,"decoratorMetadata"),t(),e(332,":"),t(),n(333,"pre")(334,"code",12),e(335,`
{
  "$schema": "https://swc.rs/schema.json",
  "sourceMaps": true,
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "legacyDecorator": true,
      "decoratorMetadata": true
    },
    "baseUrl": "./"
  },
  "minify": false
}
`),t()(),n(336,"p"),e(337,"If you use NestJS CLI Plugins in your project, you'll have to run "),n(338,"code"),e(339,"PluginMetadataGenerator"),t(),e(340," manually. Navigate to "),n(341,"a",24),e(342,"this section"),t(),e(343," to learn more."),t(),n(344,"h3",25),e(345,"Vitest"),t(),n(346,"p")(347,"a",26),e(348,"Vitest"),t(),e(349," is a fast and lightweight test runner designed to work with Vite. It provides a modern, fast, and easy-to-use testing solution that can be integrated with NestJS projects."),t(),n(350,"h4",27)(351,"span"),e(352,"Installation"),t()(),n(353,"p"),e(354,"To get started, first install the required packages:"),t(),n(355,"pre")(356,"code",9),e(357,`
$ npm i --save-dev vitest unplugin-swc @swc/core @vitest/coverage-v8
`),t()(),n(358,"h4",28)(359,"span"),e(360,"Configuration"),t()(),n(361,"p"),e(362,"Create a "),n(363,"code"),e(364,"vitest.config.ts"),t(),e(365," file in the root directory of your application with the following content:"),t(),n(366,"app-copy-button")(367,"pre")(368,"code",19),e(369,`
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
  },
  plugins: [
    // This is required to build the test files with SWC
    swc.vite({
      // Explicitly set the module type to avoid inheriting this value from a \`.swcrc\` config file
      module: { type: 'es6' },
    }),
  ],
  resolve: {
    alias: {
      // Ensure Vitest correctly resolves TypeScript path aliases
      'src': resolve(__dirname, './src'),
    },
  },
});
`),t()()(),n(370,"p"),e(371,`This configuration file sets up the Vitest environment, root directory, and SWC plugin. You should also create a separate configuration
file for e2e tests, with an additional `),n(372,"code"),e(373,"include"),t(),e(374," field that specifies the test path regex:"),t(),n(375,"app-copy-button")(376,"pre")(377,"code",19),e(378,`
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
  },
  plugins: [swc.vite()],
});
`),t()()(),n(379,"p"),e(380,"Additionally, you can set the "),n(381,"code"),e(382,"alias"),t(),e(383," options to support TypeScript paths in your tests:"),t(),n(384,"app-copy-button")(385,"pre")(386,"code",19),e(387,`
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    alias: {
      '@src': './src',
      '@test': './test',
    },
    root: './',
  },
  resolve: {
    alias: {
      '@src': './src',
      '@test': './test',
    },
  },
  plugins: [swc.vite()],
});
`),t()()(),n(388,"h3",29),e(389,"Path aliases"),t(),n(390,"p"),e(391,"Unlike Jest, Vitest does not automatically resolve TypeScript path aliases like "),n(392,"code"),e(393,"src/"),t(),e(394,". This may lead to dependency resolution errors during testing. To resolve this issue, add the following "),n(395,"code"),e(396,"resolve.alias"),t(),e(397," configuration in your "),n(398,"code"),e(399,"vitest.config.ts"),t(),e(400," file:"),t(),n(401,"app-copy-button")(402,"pre")(403,"code",19),e(404,`
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'src': resolve(__dirname, './src'),
    },
  },
});
`),t()()(),n(405,"p"),e(406,"This ensures that Vitest correctly resolves module imports, preventing errors related to missing dependencies."),t(),n(407,"h4",30)(408,"span"),e(409,"Update imports in E2E tests"),t()(),n(410,"p"),e(411,"Change any E2E test imports using "),n(412,"code"),e(413,"import * as request from 'supertest'"),t(),e(414," to "),n(415,"code"),e(416,"import request from 'supertest'"),t(),e(417,". This is necessary because Vitest, when bundled with Vite, expects a default import for supertest. Using a namespace import may cause issues in this specific setup."),t(),n(418,"p"),e(419,"Lastly, update the test scripts in your package.json file to the following:"),t(),n(420,"pre")(421,"code",12),e(422,`
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:debug": "vitest --inspect-brk --inspect --logHeapUsage --threads=false",
    "test:e2e": "vitest run --config ./vitest.config.e2e.ts"
  }
}
`),t()(),n(423,"p"),e(424,"These scripts configure Vitest for running tests, watching for changes, generating code coverage reports, and debugging. The test:e2e script is specifically for running E2E tests with a custom configuration file."),t(),n(425,"p"),e(426,"With this setup, you can now enjoy the benefits of using Vitest in your NestJS project, including faster test execution and a more modern testing experience."),t(),n(427,"blockquote",7)(428,"strong"),e(429,"Hint"),t(),e(430," You can check out a working example in this "),n(431,"a",31),e(432,"repository"),t()()())},dependencies:[g,E,A],encapsulation:2,changeDetection:0})}return a})();var re=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-necord"]],features:[S],decls:302,vars:56,consts:[["contentReference",""],["app0875dfbaf911cbae02765aa6ab9457afd22cf53a",""],["appd8749cf4e5d16d01c491a3da6c17fd55f9b1eea0",""],["app72fcc899f0d130dcd54775aeeb38c2dc855bc1ae",""],["app2e4afa0f58545117a154bcf025390c233f878aff",""],["app862c35436378c114696ee909620e2f32dbd2ce97",""],["app117c72558f03533a1ffafd9f02d7811338661edf",""],["app26369e0e1075e817d9118594e5fb83add6519f8c",""],["appa3dc5af3e755b13f8c31039880ec7cf52ae1fd95",""],["app57b54bfdd55490e5bb2a4050e30bf6aad057c2eb",""],["app3cf3d48085954ad11e73ea739dcdbfb3a8b852cf",""],["appecfa1aa2b71b1f49150212b09c646f266099cd3f",""],["app8ed63b94efd9613c16d92e71a2265b4b021467bd",""],["app1a0cf92a1b20a5a43871da85e3d69b51c5c54915",""],["app0f0c83f505a80e9c5c2f131a1f4992910faec950",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/necord.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","necord"],["rel","nofollow","target","_blank","href","https://discord.com"],[1,"info"],["rel","nofollow","target","_blank","href","https://github.com/necordjs/necord"],["appAnchor","","id","installation"],["rel","nofollow","target","_blank","href","https://discord.js.org"],[1,"language-bash"],["appAnchor","","id","usage"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["rel","nofollow","target","_blank","href","https://discord.com/developers/docs/topics/gateway#gateway-intents"],["id","understanding-context"],["appAnchor","","id","text-commands"],[1,"warning"],["rel","nofollow","target","_blank","href","https://support-dev.discord.com/hc/en-us/articles/4404772028055-Message-Content-Access-Deprecation-for-Verified-Bots"],["appAnchor","","id","application-commands"],["src","https://i.imgur.com/4EmG8G8.png",1,"illustrative-image"],["appAnchor","","id","slash-commands"],["id","options"],["rel","nofollow","target","_blank","href","https://necord.org/interactions/slash-commands#options"],["id","autocomplete"],["appAnchor","","id","user-context-menu"],["appAnchor","","id","message-context-menu"],["appAnchor","","id","buttons"],["rel","nofollow","target","_blank","href","https://discord.com/developers/docs/interactions/message-components#buttons"],["rel","nofollow","target","_blank","href","https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object"],["appAnchor","","id","select-menus"],["rel","nofollow","target","_blank","href","https://discord.com/developers/docs/interactions/message-components#select-menus"],["rel","nofollow","target","_blank","href","https://necord.org/interactions/message-components#select-menu"],["appAnchor","","id","modals"],["appAnchor","","id","more-information"],["rel","nofollow","target","_blank","href","https://necord.org"]],template:function(p,u){if(p&1&&(n(0,"div",15,0)(2,"div",16)(3,"a",17),o(4,"i",18),t()(),n(5,"h3",19),e(6,"Necord"),t(),n(7,"p"),e(8,"Necord is a powerful module that simplifies the creation of "),n(9,"a",20),e(10,"Discord"),t(),e(11," bots, allowing for seamless integration with your NestJS application."),t(),n(12,"blockquote",21)(13,"strong"),e(14,"Note"),t(),e(15," Necord is a third-party package and is not officially maintained by the NestJS core team. If you encounter any issues, please report them in the "),n(16,"a",22),e(17,"official repository"),t(),e(18,`.
`),t(),n(19,"h4",23)(20,"span"),e(21,"Installation"),t()(),n(22,"p"),e(23,"To get started, you need to install Necord alongside its dependency, "),n(24,"a",24)(25,"code"),e(26,"Discord.js"),t()(),e(27,"."),t(),n(28,"pre")(29,"code",25),e(30,`
$ npm install necord discord.js
`),t()(),n(31,"h4",26)(32,"span"),e(33,"Usage"),t()(),n(34,"p"),e(35,"To utilize Necord in your project, import the "),n(36,"code"),e(37,"NecordModule"),t(),e(38," and configure it with the necessary options."),t(),n(39,"app-copy-button",27)(40,"span",28),e(41),l(42,"extension"),o(43,"app-tabs",null,1),t(),n(45,"pre")(46,"code",29),e(47,`
import { Module } from '@nestjs/common';
import { NecordModule } from 'necord';
import { IntentsBitField } from 'discord.js';
import { AppService } from './app.service';

@Module({
  imports: [
    NecordModule.forRoot({
      token: process.env.DISCORD_TOKEN,
      intents: [IntentsBitField.Flags.Guilds],
      development: [process.env.DISCORD_DEVELOPMENT_GUILD_ID],
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
`),t()()(),n(48,"blockquote",21)(49,"strong"),e(50,"Hint"),t(),e(51," You can find a comprehensive list of available intents "),n(52,"a",30),e(53,"here"),t(),e(54,`.
`),t(),n(55,"p"),e(56,"With this setup, you can inject the "),n(57,"code"),e(58,"AppService"),t(),e(59," into your providers to easily register commands, events, and more."),t(),n(60,"app-copy-button",27)(61,"span",28),e(62),l(63,"extension"),o(64,"app-tabs",null,2),t(),n(66,"pre")(67,"code",29),e(68,`
import { Injectable, Logger } from '@nestjs/common';
import { Context, On, Once, ContextOf } from 'necord';
import { Client } from 'discord.js';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  @Once('ready')
  public onReady(@Context() [client]: ContextOf<'ready'>) {
    this.logger.log(\`Bot logged in as \${client.user.username}\`);
  }

  @On('warn')
  public onWarn(@Context() [message]: ContextOf<'warn'>) {
    this.logger.warn(message);
  }
}
`),t()()(),n(69,"h5",31),e(70,"Understanding context"),t(),n(71,"p"),e(72,"You may have noticed the "),n(73,"code"),e(74,"@Context"),t(),e(75," decorator in the examples above. This decorator injects the event context into your method, allowing you to access various event-specific data. Since there are multiple types of events, the context type is inferred using the "),n(76,"code"),e(77,"ContextOf<type: string>"),t(),e(78," type. You can easily access context variables by using the "),n(79,"code"),e(80,"@Context()"),t(),e(81," decorator, which fills the variable with an array of arguments relevant to the event."),t(),n(82,"h4",32)(83,"span"),e(84,"Text commands"),t()(),n(85,"blockquote",33)(86,"strong"),e(87,"Caution"),t(),e(88," Text commands rely on message content, which is set to be deprecated for verified bots and applications with over 100 servers. This means that if your bot is unable to access message content, text commands will not function. Read more about this change "),n(89,"a",34),e(90,"here"),t(),e(91,`.
`),t(),n(92,"p"),e(93,"Here's how to create a simple command handler for messages using the "),n(94,"code"),e(95,"@TextCommand"),t(),e(96," decorator."),t(),n(97,"app-copy-button",27)(98,"span",28),e(99),l(100,"extension"),o(101,"app-tabs",null,3),t(),n(103,"pre")(104,"code",29),e(105,`
import { Injectable } from '@nestjs/common';
import { Context, TextCommand, TextCommandContext, Arguments } from 'necord';

@Injectable()
export class AppCommands {
  @TextCommand({
    name: 'ping',
    description: 'Responds with pong!',
  })
  public onPing(
    @Context() [message]: TextCommandContext,
    @Arguments() args: string[],
  ) {
    return message.reply('pong!');
  }
}
`),t()()(),n(106,"h4",35)(107,"span"),e(108,"Application commands"),t()(),n(109,"p"),e(110,"Application commands provide a native way for users to interact with your app within the Discord client. There are three types of application commands that can be accessed through different interfaces: chat input, message context menu (accessed by right-clicking a message), and user context menu (accessed by right-clicking a user)."),t(),n(111,"figure"),o(112,"img",36),t(),n(113,"h4",37)(114,"span"),e(115,"Slash commands"),t()(),n(116,"p"),e(117,"Slash commands are an excellent way to engage with users in a structured manner. They allow you to create commands with precise arguments and options, enhancing the user experience significantly."),t(),n(118,"p"),e(119,"To define a slash command using Necord, you can use the "),n(120,"code"),e(121,"SlashCommand"),t(),e(122," decorator."),t(),n(123,"app-copy-button",27)(124,"span",28),e(125),l(126,"extension"),o(127,"app-tabs",null,4),t(),n(129,"pre")(130,"code",29),e(131,`
import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class AppCommands {
  @SlashCommand({
    name: 'ping',
    description: 'Responds with pong!',
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply({ content: 'Pong!' });
  }
}
`),t()()(),n(132,"blockquote",21)(133,"strong"),e(134,"Hint"),t(),e(135," When your bot client logs in, it will automatically register all defined commands. Note that global commands are cached for up to an hour. To avoid issues with the global cache, utilize the "),n(136,"code"),e(137,"development"),t(),e(138,` argument in the Necord module, which restricts command visibility to a single guild.
`),t(),n(139,"h5",38),e(140,"Options"),t(),n(141,"p"),e(142,"You can define parameters for your slash commands using option decorators. Let's create a "),n(143,"code"),e(144,"TextDto"),t(),e(145," class for this purpose:"),t(),n(146,"app-copy-button",27)(147,"span",28),e(148),l(149,"extension"),o(150,"app-tabs",null,5),t(),n(152,"pre")(153,"code",29),e(154,`
import { StringOption } from 'necord';

export class TextDto {
  @StringOption({
    name: 'text',
    description: 'Input your text here',
    required: true,
  })
  text: string;
}
`),t()()(),n(155,"p"),e(156,"You can then use this DTO in the "),n(157,"code"),e(158,"AppCommands"),t(),e(159," class:"),t(),n(160,"app-copy-button",27)(161,"span",28),e(162),l(163,"extension"),o(164,"app-tabs",null,6),t(),n(166,"pre")(167,"code",29),e(168,`
import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, Options, SlashCommandContext } from 'necord';
import { TextDto } from './length.dto';

@Injectable()
export class AppCommands {
  @SlashCommand({
    name: 'length',
    description: 'Calculate the length of your text',
  })
  public async onLength(
    @Context() [interaction]: SlashCommandContext,
    @Options() { text }: TextDto,
  ) {
    return interaction.reply({
      content: \`The length of your text is: \${text.length}\`,
    });
  }
}
`),t()()(),n(169,"p"),e(170,"For a complete list of built-in option decorators, check out "),n(171,"a",39),e(172,"this documentation"),t(),e(173,"."),t(),n(174,"h5",40),e(175,"Autocomplete"),t(),n(176,"p"),e(177,"To implement autocomplete functionality for your slash commands, you'll need to create an interceptor. This interceptor will handle requests as users type in the autocomplete field."),t(),n(178,"app-copy-button",27)(179,"span",28),e(180),l(181,"extension"),o(182,"app-tabs",null,7),t(),n(184,"pre")(185,"code",29),e(186,`
import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

@Injectable()
class CatsAutocompleteInterceptor extends AutocompleteInterceptor {
  public transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    let choices: string[];

    if (focused.name === 'cat') {
      choices = ['Siamese', 'Persian', 'Maine Coon'];
    }

    return interaction.respond(
      choices
        .filter((choice) => choice.startsWith(focused.value.toString()))
        .map((choice) => ({ name: choice, value: choice })),
    );
  }
}
`),t()()(),n(187,"p"),e(188,"You will also need to mark your options class with "),n(189,"code"),e(190,"autocomplete: true"),t(),e(191,":"),t(),n(192,"app-copy-button",27)(193,"span",28),e(194),l(195,"extension"),o(196,"app-tabs",null,8),t(),n(198,"pre")(199,"code",29),e(200,`
import { StringOption } from 'necord';

export class CatDto {
  @StringOption({
    name: 'cat',
    description: 'Choose a cat breed',
    autocomplete: true,
    required: true,
  })
  cat: string;
}
`),t()()(),n(201,"p"),e(202,"Finally, apply the interceptor to your slash command:"),t(),n(203,"app-copy-button",27)(204,"span",28),e(205),l(206,"extension"),o(207,"app-tabs",null,9),t(),n(209,"pre")(210,"code",29),e(211,`
import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, SlashCommand, Options, SlashCommandContext } from 'necord';
import { CatDto } from '/cat.dto';
import { CatsAutocompleteInterceptor } from './cats-autocomplete.interceptor';

@Injectable()
export class CatsCommands {
  @UseInterceptors(CatsAutocompleteInterceptor)
  @SlashCommand({
    name: 'cat',
    description: 'Retrieve information about a specific cat breed',
  })
  public async onSearch(
    @Context() [interaction]: SlashCommandContext,
    @Options() { cat }: CatDto,
  ) {
    return interaction.reply({
      content: \`I found information on the breed of \${cat} cat!\`,
    });
  }
}
`),t()()(),n(212,"h4",41)(213,"span"),e(214,"User context menu"),t()(),n(215,"p"),e(216,"User commands appear on the context menu that appears when right-clicking (or tapping) on users. These commands provide quick actions that target users directly."),t(),n(217,"app-copy-button",27)(218,"span",28),e(219),l(220,"extension"),o(221,"app-tabs",null,10),t(),n(223,"pre")(224,"code",29),e(225,`
import { Injectable } from '@nestjs/common';
import { Context, UserCommand, UserCommandContext, TargetUser } from 'necord';
import { User } from 'discord.js';

@Injectable()
export class AppCommands {
  @UserCommand({ name: 'Get avatar' })
  public async getUserAvatar(
    @Context() [interaction]: UserCommandContext,
    @TargetUser() user: User,
  ) {
    return interaction.reply({
      embeds: [
        new MessageEmbed()
          .setTitle(\`Avatar of \${user.username}\`)
          .setImage(user.displayAvatarURL({ size: 4096, dynamic: true })),
      ],
    });
  }
}
`),t()()(),n(226,"h4",42)(227,"span"),e(228,"Message context menu"),t()(),n(229,"p"),e(230,"Message commands show up in the context menu when right-clicking on messages, allowing for quick actions relevant to those messages."),t(),n(231,"app-copy-button",27)(232,"span",28),e(233),l(234,"extension"),o(235,"app-tabs",null,11),t(),n(237,"pre")(238,"code",29),e(239,`
import { Injectable } from '@nestjs/common';
import { Context, MessageCommand, MessageCommandContext, TargetMessage } from 'necord';
import { Message } from 'discord.js';

@Injectable()
export class AppCommands {
  @MessageCommand({ name: 'Copy Message' })
  public async copyMessage(
    @Context() [interaction]: MessageCommandContext,
    @TargetMessage() message: Message,
  ) {
    return interaction.reply({ content: message.content });
  }
}
`),t()()(),n(240,"h4",43)(241,"span"),e(242,"Buttons"),t()(),n(243,"p")(244,"a",44),e(245,"Buttons"),t(),e(246," are interactive elements that can be included in messages. When clicked, they send an "),n(247,"a",45),e(248,"interaction"),t(),e(249," to your application."),t(),n(250,"app-copy-button",27)(251,"span",28),e(252),l(253,"extension"),o(254,"app-tabs",null,12),t(),n(256,"pre")(257,"code",29),e(258,`
import { Injectable } from '@nestjs/common';
import { Context, Button, ButtonContext } from 'necord';

@Injectable()
export class AppComponents {
  @Button('BUTTON')
  public onButtonClick(@Context() [interaction]: ButtonContext) {
    return interaction.reply({ content: 'Button clicked!' });
  }
}
`),t()()(),n(259,"h4",46)(260,"span"),e(261,"Select menus"),t()(),n(262,"p")(263,"a",47),e(264,"Select menus"),t(),e(265," are another type of interactive component that appears on messages. They provide a dropdown-like UI for users to select options."),t(),n(266,"app-copy-button",27)(267,"span",28),e(268),l(269,"extension"),o(270,"app-tabs",null,13),t(),n(272,"pre")(273,"code",29),e(274,`
import { Injectable } from '@nestjs/common';
import { Context, StringSelect, StringSelectContext, SelectedStrings } from 'necord';

@Injectable()
export class AppComponents {
  @StringSelect('SELECT_MENU')
  public onSelectMenu(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() values: string[],
  ) {
    return interaction.reply({ content: \`You selected: \${values.join(', ')}\` });
  }
}
`),t()()(),n(275,"p"),e(276,"For a full list of built-in select menu components, visit "),n(277,"a",48),e(278,"this link"),t(),e(279,"."),t(),n(280,"h4",49)(281,"span"),e(282,"Modals"),t()(),n(283,"p"),e(284,"Modals are pop-up forms that allow users to submit formatted input. Here's how to create and handle modals using Necord:"),t(),n(285,"app-copy-button",27)(286,"span",28),e(287),l(288,"extension"),o(289,"app-tabs",null,14),t(),n(291,"pre")(292,"code",29),e(293,`
import { Injectable } from '@nestjs/common';
import { Context, Modal, ModalContext } from 'necord';

@Injectable()
export class AppModals {
  @Modal('pizza')
  public onModal(@Context() [interaction]: ModalContext) {
    return interaction.reply({
      content: \`Your fav pizza : \${interaction.fields.getTextInputValue('pizza')}\`
    });
  }
}
`),t()()(),n(294,"h4",50)(295,"span"),e(296,"More information"),t()(),n(297,"p"),e(298,"Visit the "),n(299,"a",51),e(300,"Necord"),t(),e(301," website for more information."),t()()),p&2){let y=r(44),b=r(65),v=r(102),k=r(128),w=r(151),j=r(165),P=r(183),M=r(197),R=r(208),q=r(222),D=r(236),U=r(255),H=r(271),B=r(290);i(41),s(" ",d(42,14,"app.module",y.isJsActive),`
`),i(21),s(" ",d(63,17,"app.service",b.isJsActive),`
`),i(37),s(" ",d(100,20,"app.commands",v.isJsActive),`
`),i(26),s(" ",d(126,23,"app.commands",k.isJsActive),`
`),i(23),s(" ",d(149,26,"text.dto",w.isJsActive),`
`),i(14),s(" ",d(163,29,"app.commands",j.isJsActive),`
`),i(18),s(" ",d(181,32,"cats-autocomplete.interceptor",P.isJsActive),`
`),i(14),s(" ",d(195,35,"cat.dto",M.isJsActive),`
`),i(11),s(" ",d(206,38,"cats.commands",R.isJsActive),`
`),i(14),s(" ",d(220,41,"app.commands",q.isJsActive),`
`),i(14),s(" ",d(234,44,"app.commands",D.isJsActive),`
`),i(19),s(" ",d(253,47,"app.components",U.isJsActive),`
`),i(16),s(" ",d(269,50,"app.components",H.isJsActive),`
`),i(19),s(" ",d(288,53,"app.modals",B.isJsActive),`
`)}},dependencies:[g,E,C,I],encapsulation:2,changeDetection:0})}return a})();var se=(()=>{class a extends f{static \u0275fac=(()=>{let c;return function(u){return(c||(c=h(a)))(u||a)}})();static \u0275cmp=x({type:a,selectors:[["app-passport"]],features:[S],decls:1235,vars:122,consts:[["contentReference",""],["app91b453df760ee001f135f53c2b3b85a43cd9fc24",""],["app504bb00676b3ef535656c7e38bf20e3210f5be76",""],["app032c039ea63f3547ecf132d0a6fe5774473cebfd",""],["app64e3701187030b7bf5e0f17235af30ab69cdedbd",""],["appd333589334faef1e7335bbdc091a463cba66894e",""],["app39b7b92e19003a504e9f308c94052c6b579213a5",""],["appace06ff23805aa0c2000a90a526435f224cde692",""],["appd4a943d8f3c11500e0ce0ed8abf4ca4c027fdfd0",""],["app799da2ef6e43bda4d411560691d84843b25fad05",""],["app9f22c6dd2600db09469dc2be662e939d5d87aa64",""],["app2efb32e3ccbd38639ee5991f5068e48a2a15263f",""],["appad6c3fe43c379b715ef6589bafac4413e0010548",""],["appbb1d5e6b1a184e8637889e76b6c09fca350a9d4d",""],["app8e62d3928471150a7574f1cd2f0359f15dfff208",""],["app9071348703a5d22261e3e269017349357b9222e7",""],["appf11777cb8634b7d4528a13fa66fc3c5a793e9141",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/recipes/passport.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","passport-authentication"],["rel","nofollow","target","_blank","href","https://github.com/jaredhanson/passport"],["rel","nofollow","target","_blank","href","https://jwt.io/"],["rel","nofollow","target","_blank","href","https://github.com/expressjs/session"],["rel","nofollow","target","_blank","href","http://www.passportjs.org/"],["appAnchor","","id","authentication-requirements"],["rel","nofollow","target","_blank","href","https://tools.ietf.org/html/rfc6750"],["rel","nofollow","target","_blank","href","https://github.com/jaredhanson/passport-local"],[1,"language-bash"],[1,"warning"],["appAnchor","","id","implementing-passport-strategies"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"Warning"],["rel","nofollow","target","_blank","href","https://github.com/kelektiv/node.bcrypt.js#readme"],["appAnchor","","id","implementing-passport-local"],[1,"info"],["rel","nofollow","target","_blank","href","http://www.passportjs.org/docs/configure/"],["href","exception-filters"],["appAnchor","","id","built-in-passport-guards"],["href","guards"],["appAnchor","","id","login-route"],["rel","nofollow","target","_blank","href","https://curl.haxx.se/"],["appAnchor","","id","logout-route"],["appAnchor","","id","jwt-functionality"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/jwt"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/jwt/blob/master/README.md"],["rel","nofollow","target","_blank","href","https://github.com/auth0/node-jsonwebtoken#usage"],["appAnchor","","id","implementing-passport-jwt"],["rel","nofollow","target","_blank","href","https://github.com/mikenicholson/passport-jwt"],["rel","nofollow","target","_blank","href","https://github.com/mikenicholson/passport-jwt#configure-strategy"],["rel","nofollow","target","_blank","href","https://github.com/mikenicholson/passport-jwt#extracting-the-jwt-from-the-request"],["appAnchor","","id","implement-protected-route-and-jwt-strategy-guards"],["appAnchor","","id","extending-guards"],["appAnchor","","id","enable-authentication-globally"],["href","/guards#binding-guards"],["href","/guards#putting-it-all-together"],["appAnchor","","id","request-scoped-strategies"],["routerLink","/fundamentals/injection-scopes"],["routerLink","/fundamentals/module-ref"],["href","/fundamentals/module-ref#getting-current-sub-tree"],["appAnchor","","id","customize-passport"],["rel","nofollow","target","_blank","href","http://www.passportjs.org/docs/oauth/"],["appAnchor","","id","named-strategies"],["appAnchor","","id","graphql"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/graphql/quick-start"]],template:function(p,u){if(p&1&&(n(0,"div",17,0)(2,"div",18)(3,"a",19),o(4,"i",20),t()(),n(5,"h3",21),e(6,"Passport (authentication)"),t(),n(7,"p")(8,"a",22),e(9,"Passport"),t(),e(10," is the most popular node.js authentication library, well-known by the community and successfully used in many production applications. It's straightforward to integrate this library with a "),n(11,"strong"),e(12,"Nest"),t(),e(13," application using the "),n(14,"code"),e(15,"@nestjs/passport"),t(),e(16," module. At a high level, Passport executes a series of steps to:"),t(),n(17,"ul")(18,"li"),e(19,'Authenticate a user by verifying their "credentials" (such as username/password, JSON Web Token ('),n(20,"a",23),e(21,"JWT"),t(),e(22,"), or identity token from an Identity Provider)"),t(),n(23,"li"),e(24,"Manage authenticated state (by issuing a portable token, such as a JWT, or creating an "),n(25,"a",24),e(26,"Express session"),t(),e(27,")"),t(),n(28,"li"),e(29,"Attach information about the authenticated user to the "),n(30,"code"),e(31,"Request"),t(),e(32," object for further use in route handlers"),t()(),n(33,"p"),e(34,"Passport has a rich ecosystem of "),n(35,"a",25),e(36,"strategies"),t(),e(37," that implement various authentication mechanisms. While simple in concept, the set of Passport strategies you can choose from is large and presents a lot of variety. Passport abstracts these varied steps into a standard pattern, and the "),n(38,"code"),e(39,"@nestjs/passport"),t(),e(40," module wraps and standardizes this pattern into familiar Nest constructs."),t(),n(41,"p"),e(42,"In this chapter, we'll implement a complete end-to-end authentication solution for a RESTful API server using these powerful and flexible modules. You can use the concepts described here to implement any Passport strategy to customize your authentication scheme. You can follow the steps in this chapter to build this complete example."),t(),n(43,"h4",26)(44,"span"),e(45,"Authentication requirements"),t()(),n(46,"p"),e(47,"Let's flesh out our requirements. For this use case, clients will start by authenticating with a username and password. Once authenticated, the server will issue a JWT that can be sent as a "),n(48,"a",27),e(49,"bearer token in an authorization header"),t(),e(50," on subsequent requests to prove authentication. We'll also create a protected route that is accessible only to requests that contain a valid JWT."),t(),n(51,"p"),e(52,"We'll start with the first requirement: authenticating a user. We'll then extend that by issuing a JWT. Finally, we'll create a protected route that checks for a valid JWT on the request."),t(),n(53,"p"),e(54,"First we need to install the required packages. Passport provides a strategy called "),n(55,"a",28),e(56,"passport-local"),t(),e(57," that implements a username/password authentication mechanism, which suits our needs for this portion of our use case."),t(),n(58,"pre")(59,"code",29),e(60,`
$ npm install --save @nestjs/passport passport passport-local
$ npm install --save-dev @types/passport-local
`),t()(),n(61,"blockquote",30)(62,"strong"),e(63,"Notice"),t(),e(64," For "),n(65,"strong"),e(66,"any"),t(),e(67," Passport strategy you choose, you'll always need the "),n(68,"code"),e(69,"@nestjs/passport"),t(),e(70," and "),n(71,"code"),e(72,"passport"),t(),e(73," packages. Then, you'll need to install the strategy-specific package (e.g., "),n(74,"code"),e(75,"passport-jwt"),t(),e(76," or "),n(77,"code"),e(78,"passport-local"),t(),e(79,") that implements the particular authentication strategy you are building. In addition, you can also install the type definitions for any Passport strategy, as shown above with "),n(80,"code"),e(81,"@types/passport-local"),t(),e(82,`, which provides assistance while writing TypeScript code.
`),t(),n(83,"h4",31)(84,"span"),e(85,"Implementing Passport strategies"),t()(),n(86,"p"),e(87,"We're now ready to implement the authentication feature. We'll start with an overview of the process used for "),n(88,"strong"),e(89,"any"),t(),e(90," Passport strategy. It's helpful to think of Passport as a mini framework in itself. The elegance of the framework is that it abstracts the authentication process into a few basic steps that you customize based on the strategy you're implementing. It's like a framework because you configure it by supplying customization parameters (as plain JSON objects) and custom code in the form of callback functions, which Passport calls at the appropriate time. The "),n(91,"code"),e(92,"@nestjs/passport"),t(),e(93," module wraps this framework in a Nest style package, making it easy to integrate into a Nest application. We'll use "),n(94,"code"),e(95,"@nestjs/passport"),t(),e(96," below, but first let's consider how "),n(97,"strong"),e(98,"vanilla Passport"),t(),e(99," works."),t(),n(100,"p"),e(101,"In vanilla Passport, you configure a strategy by providing two things:"),t(),n(102,"ol")(103,"li"),e(104,"A set of options that are specific to that strategy. For example, in a JWT strategy, you might provide a secret to sign tokens."),t(),n(105,"li"),e(106,'A "verify callback", which is where you tell Passport how to interact with your user store (where you manage user accounts). Here, you verify whether a user exists (and/or create a new user), and whether their credentials are valid. The Passport library expects this callback to return a full user if the validation succeeds, or a null if it fails (failure is defined as either the user is not found, or, in the case of passport-local, the password does not match).'),t()(),n(107,"p"),e(108,"With "),n(109,"code"),e(110,"@nestjs/passport"),t(),e(111,", you configure a Passport strategy by extending the "),n(112,"code"),e(113,"PassportStrategy"),t(),e(114," class. You pass the strategy options (item 1 above) by calling the "),n(115,"code"),e(116,"super()"),t(),e(117," method in your subclass, optionally passing in an options object. You provide the verify callback (item 2 above) by implementing a "),n(118,"code"),e(119,"validate()"),t(),e(120," method in your subclass."),t(),n(121,"p"),e(122,"We'll start by generating an "),n(123,"code"),e(124,"AuthModule"),t(),e(125," and in it, an "),n(126,"code"),e(127,"AuthService"),t(),e(128,":"),t(),n(129,"pre")(130,"code",29),e(131,`
$ nest g module auth
$ nest g service auth
`),t()(),n(132,"p"),e(133,"As we implement the "),n(134,"code"),e(135,"AuthService"),t(),e(136,", we'll find it useful to encapsulate user operations in a "),n(137,"code"),e(138,"UsersService"),t(),e(139,", so let's generate that module and service now:"),t(),n(140,"pre")(141,"code",29),e(142,`
$ nest g module users
$ nest g service users
`),t()(),n(143,"p"),e(144,"Replace the default contents of these generated files as shown below. For our sample app, the "),n(145,"code"),e(146,"UsersService"),t(),e(147," simply maintains a hard-coded in-memory list of users, and a find method to retrieve one by username. In a real app, this is where you'd build your user model and persistence layer, using your library of choice (e.g., TypeORM, Sequelize, Mongoose, etc.)."),t(),n(148,"app-copy-button",32)(149,"span",33),e(150),l(151,"extension"),o(152,"app-tabs",null,1),t(),n(154,"pre")(155,"code",34),e(156,`
import { Injectable } from '@nestjs/common';

// This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
}
`),t()(),n(157,"pre")(158,"code",34),e(159,`
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor() {
    this.users = [
      {
        userId: 1,
        username: 'john',
        password: 'changeme',
      },
      {
        userId: 2,
        username: 'maria',
        password: 'guess',
      },
    ];
  }

  async findOne(username) {
    return this.users.find(user => user.username === username);
  }
}
`),t()()(),n(160,"p"),e(161,"In the "),n(162,"code"),e(163,"UsersModule"),t(),e(164,", the only change needed is to add the "),n(165,"code"),e(166,"UsersService"),t(),e(167," to the exports array of the "),n(168,"code"),e(169,"@Module"),t(),e(170," decorator so that it is visible outside this module (we'll soon use it in our "),n(171,"code"),e(172,"AuthService"),t(),e(173,")."),t(),n(174,"app-copy-button",32)(175,"span",33),e(176),l(177,"extension"),o(178,"app-tabs",null,2),t(),n(180,"pre")(181,"code",34),e(182,`
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
`),t()(),n(183,"pre")(184,"code",34),e(185,`
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
`),t()()(),n(186,"p"),e(187,"Our "),n(188,"code"),e(189,"AuthService"),t(),e(190," has the job of retrieving a user and verifying the password. We create a "),n(191,"code"),e(192,"validateUser()"),t(),e(193," method for this purpose. In the code below, we use a convenient ES6 spread operator to strip the password property from the user object before returning it. We'll be calling into the "),n(194,"code"),e(195,"validateUser()"),t(),e(196," method from our Passport local strategy in a moment."),t(),n(197,"app-copy-button",32)(198,"span",33),e(199),l(200,"extension"),o(201,"app-tabs",null,3),t(),n(203,"pre")(204,"code",34),e(205,`
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
`),t()(),n(206,"pre")(207,"code",34),e(208,`
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async validateUser(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
`),t()()(),n(209,"blockquote",35)(210,"strong"),e(211,"Warning"),t(),e(212," Of course in a real application, you wouldn't store a password in plain text. You'd instead use a library like "),n(213,"a",36),e(214,"bcrypt"),t(),e(215,", with a salted one-way hash algorithm. With that approach, you'd only store hashed passwords, and then compare the stored password to a hashed version of the "),n(216,"strong"),e(217,"incoming"),t(),e(218," password, thus never storing or exposing user passwords in plain text. To keep our sample app simple, we violate that absolute mandate and use plain text. "),n(219,"strong"),e(220,"Don't do this in your real app!"),t()(),n(221,"p"),e(222,"Now, we update our "),n(223,"code"),e(224,"AuthModule"),t(),e(225," to import the "),n(226,"code"),e(227,"UsersModule"),t(),e(228,"."),t(),n(229,"app-copy-button",32)(230,"span",33),e(231),l(232,"extension"),o(233,"app-tabs",null,4),t(),n(235,"pre")(236,"code",34),e(237,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
`),t()(),n(238,"pre")(239,"code",34),e(240,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
`),t()()(),n(241,"h4",37)(242,"span"),e(243,"Implementing Passport local"),t()(),n(244,"p"),e(245,"Now we can implement our Passport "),n(246,"strong"),e(247,"local authentication strategy"),t(),e(248,". Create a file called "),n(249,"code"),e(250,"local.strategy.ts"),t(),e(251," in the "),n(252,"code"),e(253,"auth"),t(),e(254," folder, and add the following code:"),t(),n(255,"app-copy-button",32)(256,"span",33),e(257),l(258,"extension"),o(259,"app-tabs",null,5),t(),n(261,"pre")(262,"code",34),e(263,`
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
`),t()(),n(264,"pre")(265,"code",34),e(266,`
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Dependencies } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
@Dependencies(AuthService)
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(authService) {
    super();
    this.authService = authService;
  }

  async validate(username, password) {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
`),t()()(),n(267,"p"),e(268,"We've followed the recipe described earlier for all Passport strategies. In our use case with passport-local, there are no configuration options, so our constructor simply calls "),n(269,"code"),e(270,"super()"),t(),e(271,", without an options object."),t(),n(272,"blockquote",38)(273,"strong"),e(274,"Hint"),t(),e(275," We can pass an options object in the call to "),n(276,"code"),e(277,"super()"),t(),e(278," to customize the behavior of the passport strategy. In this example, the passport-local strategy by default expects properties called "),n(279,"code"),e(280,"username"),t(),e(281," and "),n(282,"code"),e(283,"password"),t(),e(284," in the request body. Pass an options object to specify different property names, for example: "),n(285,"code"),e(286),t(),e(287,". See the "),n(288,"a",39),e(289,"Passport documentation"),t(),e(290,` for more information.
`),t(),n(291,"p"),e(292,"We've also implemented the "),n(293,"code"),e(294,"validate()"),t(),e(295," method. For each strategy, Passport will call the verify function (implemented with the "),n(296,"code"),e(297,"validate()"),t(),e(298," method in "),n(299,"code"),e(300,"@nestjs/passport"),t(),e(301,") using an appropriate strategy-specific set of parameters. For the local-strategy, Passport expects a "),n(302,"code"),e(303,"validate()"),t(),e(304," method with the following signature: "),n(305,"code"),e(306,"validate(username: string, password:string): any"),t(),e(307,"."),t(),n(308,"p"),e(309,"Most of the validation work is done in our "),n(310,"code"),e(311,"AuthService"),t(),e(312," (with the help of our "),n(313,"code"),e(314,"UsersService"),t(),e(315,"), so this method is quite straightforward. The "),n(316,"code"),e(317,"validate()"),t(),e(318," method for "),n(319,"strong"),e(320,"any"),t(),e(321," Passport strategy will follow a similar pattern, varying only in the details of how credentials are represented. If a user is found and the credentials are valid, the user is returned so Passport can complete its tasks (e.g., creating the "),n(322,"code"),e(323,"user"),t(),e(324," property on the "),n(325,"code"),e(326,"Request"),t(),e(327," object), and the request handling pipeline can continue. If it's not found, we throw an exception and let our "),n(328,"a",40),e(329,"exceptions layer"),t(),e(330," handle it."),t(),n(331,"p"),e(332,"Typically, the only significant difference in the "),n(333,"code"),e(334,"validate()"),t(),e(335," method for each strategy is "),n(336,"strong"),e(337,"how"),t(),e(338," you determine if a user exists and is valid. For example, in a JWT strategy, depending on requirements, we may evaluate whether the "),n(339,"code"),e(340,"userId"),t(),e(341," carried in the decoded token matches a record in our user database, or matches a list of revoked tokens. Hence, this pattern of sub-classing and implementing strategy-specific validation is consistent, elegant and extensible."),t(),n(342,"p"),e(343,"We need to configure our "),n(344,"code"),e(345,"AuthModule"),t(),e(346," to use the Passport features we just defined. Update "),n(347,"code"),e(348,"auth.module.ts"),t(),e(349," to look like this:"),t(),n(350,"app-copy-button",32)(351,"span",33),e(352),l(353,"extension"),o(354,"app-tabs",null,6),t(),n(356,"pre")(357,"code",34),e(358,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
`),t()(),n(359,"pre")(360,"code",34),e(361,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
`),t()()(),n(362,"h4",41)(363,"span"),e(364,"Built-in Passport Guards"),t()(),n(365,"p"),e(366,"The "),n(367,"a",42),e(368,"Guards"),t(),e(369," chapter describes the primary function of Guards: to determine whether a request will be handled by the route handler or not. That remains true, and we'll use that standard capability soon. However, in the context of using the "),n(370,"code"),e(371,"@nestjs/passport"),t(),e(372," module, we will also introduce a slight new wrinkle that may at first be confusing, so let's discuss that now. Consider that your app can exist in two states, from an authentication perspective:"),t(),n(373,"ol")(374,"li"),e(375,"the user/client is "),n(376,"strong"),e(377,"not"),t(),e(378," logged in (is not authenticated)"),t(),n(379,"li"),e(380,"the user/client "),n(381,"strong"),e(382,"is"),t(),e(383," logged in (is authenticated)"),t()(),n(384,"p"),e(385,"In the first case (user is not logged in), we need to perform two distinct functions:"),t(),n(386,"ul")(387,"li")(388,"p"),e(389,"Restrict the routes an unauthenticated user can access (i.e., deny access to restricted routes). We'll use Guards in their familiar capacity to handle this function, by placing a Guard on the protected routes. As you may anticipate, we'll be checking for the presence of a valid JWT in this Guard, so we'll work on this Guard later, once we are successfully issuing JWTs."),t()(),n(390,"li")(391,"p"),e(392,"Initiate the "),n(393,"strong"),e(394,"authentication step"),t(),e(395," itself when a previously unauthenticated user attempts to login. This is the step where we'll "),n(396,"strong"),e(397,"issue"),t(),e(398," a JWT to a valid user. Thinking about this for a moment, we know we'll need to "),n(399,"code"),e(400,"POST"),t(),e(401," username/password credentials to initiate authentication, so we'll set up a "),n(402,"code"),e(403,"POST /auth/login"),t(),e(404," route to handle that. This raises the question: how exactly do we invoke the passport-local strategy in that route?"),t()()(),n(405,"p"),e(406,"The answer is straightforward: by using another, slightly different type of Guard. The "),n(407,"code"),e(408,"@nestjs/passport"),t(),e(409," module provides us with a built-in Guard that does this for us. This Guard invokes the Passport strategy and kicks off the steps described above (retrieving credentials, running the verify function, creating the "),n(410,"code"),e(411,"user"),t(),e(412," property, etc)."),t(),n(413,"p"),e(414,"The second case enumerated above (logged in user) simply relies on the standard type of Guard we already discussed to enable access to protected routes for logged in users."),t(),n(415,"p"),o(416,"app-banner-courses-auth"),t(),n(417,"h4",43)(418,"span"),e(419,"Login route"),t()(),n(420,"p"),e(421,"With the strategy in place, we can now implement a bare-bones "),n(422,"code"),e(423,"/auth/login"),t(),e(424," route, and apply the built-in Guard to initiate the passport-local flow."),t(),n(425,"p"),e(426,"Open the "),n(427,"code"),e(428,"app.controller.ts"),t(),e(429," file and replace its contents with the following:"),t(),n(430,"app-copy-button",32)(431,"span",33),e(432),l(433,"extension"),o(434,"app-tabs",null,7),t(),n(436,"pre")(437,"code",34),e(438,`
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() req) {
    return req.user;
  }
}
`),t()(),n(439,"pre")(440,"code",34),e(441,`
import { Controller, Bind, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return req.user;
  }
}
`),t()()(),n(442,"p"),e(443,"With "),n(444,"code"),e(445,"@UseGuards(AuthGuard('local'))"),t(),e(446," we are using an "),n(447,"code"),e(448,"AuthGuard"),t(),e(449," that "),n(450,"code"),e(451,"@nestjs/passport"),t(),n(452,"strong"),e(453,"automatically provisioned"),t(),e(454," for us when we extended the passport-local strategy. Let's break that down. Our Passport local strategy has a default name of "),n(455,"code"),e(456,"'local'"),t(),e(457,". We reference that name in the "),n(458,"code"),e(459,"@UseGuards()"),t(),e(460," decorator to associate it with code supplied by the "),n(461,"code"),e(462,"passport-local"),t(),e(463," package. This is used to disambiguate which strategy to invoke in case we have multiple Passport strategies in our app (each of which may provision a strategy-specific "),n(464,"code"),e(465,"AuthGuard"),t(),e(466,"). While we only have one such strategy so far, we'll shortly add a second, so this is needed for disambiguation."),t(),n(467,"p"),e(468,"In order to test our route we'll have our "),n(469,"code"),e(470,"/auth/login"),t(),e(471," route simply return the user for now. This also lets us demonstrate another Passport feature: Passport automatically creates a "),n(472,"code"),e(473,"user"),t(),e(474," object, based on the value we return from the "),n(475,"code"),e(476,"validate()"),t(),e(477," method, and assigns it to the "),n(478,"code"),e(479,"Request"),t(),e(480," object as "),n(481,"code"),e(482,"req.user"),t(),e(483,". Later, we'll replace this with code to create and return a JWT instead."),t(),n(484,"p"),e(485,"Since these are API routes, we'll test them using the commonly available "),n(486,"a",44),e(487,"cURL"),t(),e(488," library. You can test with any of the "),n(489,"code"),e(490,"user"),t(),e(491," objects hard-coded in the "),n(492,"code"),e(493,"UsersService"),t(),e(494,"."),t(),n(495,"pre")(496,"code",29),e(497,`
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"userId":1,"username":"john"}
`),t()(),n(498,"p"),e(499,"While this works, passing the strategy name directly to the "),n(500,"code"),e(501,"AuthGuard()"),t(),e(502," introduces magic strings in the codebase. Instead, we recommend creating your own class, as shown below:"),t(),n(503,"app-copy-button",32)(504,"span",33),e(505),l(506,"extension"),o(507,"app-tabs",null,8),t(),n(509,"pre")(510,"code",34),e(511,`
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
`),t()()(),n(512,"p"),e(513,"Now, we can update the "),n(514,"code"),e(515,"/auth/login"),t(),e(516," route handler and use the "),n(517,"code"),e(518,"LocalAuthGuard"),t(),e(519," instead:"),t(),n(520,"app-copy-button")(521,"pre")(522,"code",34),e(523,`
@UseGuards(LocalAuthGuard)
@Post('auth/login')
async login(@Request() req) {
  return req.user;
}
`),t()()(),n(524,"h4",45)(525,"span"),e(526,"Logout route"),t()(),n(527,"p"),e(528,"To log out, we can create an additional route that invokes "),n(529,"code"),e(530,"req.logout()"),t(),e(531," to clear the user's session. This is a typical approach used in session-based authentication, but it does not apply to JWTs."),t(),n(532,"app-copy-button")(533,"pre")(534,"code",34),e(535,`
@UseGuards(LocalAuthGuard)
@Post('auth/logout')
async logout(@Request() req) {
  return req.logout();
}
`),t()()(),n(536,"h4",46)(537,"span"),e(538,"JWT functionality"),t()(),n(539,"p"),e(540,"We're ready to move on to the JWT portion of our auth system. Let's review and refine our requirements:"),t(),n(541,"ul")(542,"li"),e(543,"Allow users to authenticate with username/password, returning a JWT for use in subsequent calls to protected API endpoints. We're well on our way to meeting this requirement. To complete it, we'll need to write the code that issues a JWT."),t(),n(544,"li"),e(545,"Create API routes which are protected based on the presence of a valid JWT as a bearer token"),t()(),n(546,"p"),e(547,"We'll need to install a couple more packages to support our JWT requirements:"),t(),n(548,"pre")(549,"code",29),e(550,`
$ npm install --save @nestjs/jwt passport-jwt
$ npm install --save-dev @types/passport-jwt
`),t()(),n(551,"p"),e(552,"The "),n(553,"code"),e(554,"@nestjs/jwt"),t(),e(555," package (see more "),n(556,"a",47),e(557,"here"),t(),e(558,") is a utility package that helps with JWT manipulation. The "),n(559,"code"),e(560,"passport-jwt"),t(),e(561," package is the Passport package that implements the JWT strategy and "),n(562,"code"),e(563,"@types/passport-jwt"),t(),e(564," provides the TypeScript type definitions."),t(),n(565,"p"),e(566,"Let's take a closer look at how a "),n(567,"code"),e(568,"POST /auth/login"),t(),e(569," request is handled. We've decorated the route using the built-in "),n(570,"code"),e(571,"AuthGuard"),t(),e(572," provided by the passport-local strategy. This means that:"),t(),n(573,"ol")(574,"li"),e(575,"The route handler "),n(576,"strong"),e(577,"will only be invoked if the user has been validated"),t()(),n(578,"li"),e(579,"The "),n(580,"code"),e(581,"req"),t(),e(582," parameter will contain a "),n(583,"code"),e(584,"user"),t(),e(585," property (populated by Passport during the passport-local authentication flow)"),t()(),n(586,"p"),e(587,"With this in mind, we can now finally generate a real JWT, and return it in this route. To keep our services cleanly modularized, we'll handle generating the JWT in the "),n(588,"code"),e(589,"authService"),t(),e(590,". Open the "),n(591,"code"),e(592,"auth.service.ts"),t(),e(593," file in the "),n(594,"code"),e(595,"auth"),t(),e(596," folder, and add the "),n(597,"code"),e(598,"login()"),t(),e(599," method, and import the "),n(600,"code"),e(601,"JwtService"),t(),e(602," as shown:"),t(),n(603,"app-copy-button",32)(604,"span",33),e(605),l(606,"extension"),o(607,"app-tabs",null,9),t(),n(609,"pre")(610,"code",34),e(611,`
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
`),t()(),n(612,"pre")(613,"code",34),e(614,`
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Dependencies(UsersService, JwtService)
@Injectable()
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async validateUser(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
`),t()()(),n(615,"p"),e(616,"We're using the "),n(617,"code"),e(618,"@nestjs/jwt"),t(),e(619," library, which supplies a "),n(620,"code"),e(621,"sign()"),t(),e(622," function to generate our JWT from a subset of the "),n(623,"code"),e(624,"user"),t(),e(625," object properties, which we then return as a simple object with a single "),n(626,"code"),e(627,"access_token"),t(),e(628," property. Note: we choose a property name of "),n(629,"code"),e(630,"sub"),t(),e(631," to hold our "),n(632,"code"),e(633,"userId"),t(),e(634," value to be consistent with JWT standards. Don't forget to inject the JwtService provider into the "),n(635,"code"),e(636,"AuthService"),t(),e(637,"."),t(),n(638,"p"),e(639,"We now need to update the "),n(640,"code"),e(641,"AuthModule"),t(),e(642," to import the new dependencies and configure the "),n(643,"code"),e(644,"JwtModule"),t(),e(645,"."),t(),n(646,"p"),e(647,"First, create "),n(648,"code"),e(649,"constants.ts"),t(),e(650," in the "),n(651,"code"),e(652,"auth"),t(),e(653," folder, and add the following code:"),t(),n(654,"app-copy-button",32)(655,"span",33),e(656),l(657,"extension"),o(658,"app-tabs",null,10),t(),n(660,"pre")(661,"code",34),e(662,`
export const jwtConstants = {
  secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};
`),t()(),n(663,"pre")(664,"code",34),e(665,`
export const jwtConstants = {
  secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};
`),t()()(),n(666,"p"),e(667,"We'll use this to share our key between the JWT signing and verifying steps."),t(),n(668,"blockquote",35)(669,"strong"),e(670,"Warning"),t(),n(671,"strong"),e(672,"Do not expose this key publicly"),t(),e(673,". We have done so here to make it clear what the code is doing, but in a production system "),n(674,"strong"),e(675,"you must protect this key"),t(),e(676,` using appropriate measures such as a secrets vault, environment variable, or configuration service.
`),t(),n(677,"p"),e(678,"Now, open "),n(679,"code"),e(680,"auth.module.ts"),t(),e(681," in the "),n(682,"code"),e(683,"auth"),t(),e(684," folder and update it to look like this:"),t(),n(685,"app-copy-button",32)(686,"span",33),e(687),l(688,"extension"),o(689,"app-tabs",null,11),t(),n(691,"pre")(692,"code",34),e(693,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
`),t()(),n(694,"pre")(695,"code",34),e(696,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
`),t()()(),n(697,"p"),e(698,"We configure the "),n(699,"code"),e(700,"JwtModule"),t(),e(701," using "),n(702,"code"),e(703,"register()"),t(),e(704,", passing in a configuration object. See "),n(705,"a",48),e(706,"here"),t(),e(707," for more on the Nest "),n(708,"code"),e(709,"JwtModule"),t(),e(710," and "),n(711,"a",49),e(712,"here"),t(),e(713," for more details on the available configuration options."),t(),n(714,"p"),e(715,"Now we can update the "),n(716,"code"),e(717,"/auth/login"),t(),e(718," route to return a JWT."),t(),n(719,"app-copy-button",32)(720,"span",33),e(721),l(722,"extension"),o(723,"app-tabs",null,12),t(),n(725,"pre")(726,"code",34),e(727,`
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}
`),t()(),n(728,"pre")(729,"code",34),e(730,`
import { Controller, Bind, Request, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return this.authService.login(req.user);
  }
}
`),t()()(),n(731,"p"),e(732,"Let's go ahead and test our routes using cURL again. You can test with any of the "),n(733,"code"),e(734,"user"),t(),e(735," objects hard-coded in the "),n(736,"code"),e(737,"UsersService"),t(),e(738,"."),t(),n(739,"pre")(740,"code",29),e(741,`
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # Note: above JWT truncated
`),t()(),n(742,"h4",50)(743,"span"),e(744,"Implementing Passport JWT"),t()(),n(745,"p"),e(746,"We can now address our final requirement: protecting endpoints by requiring a valid JWT be present on the request. Passport can help us here too. It provides the "),n(747,"a",51),e(748,"passport-jwt"),t(),e(749," strategy for securing RESTful endpoints with JSON Web Tokens. Start by creating a file called "),n(750,"code"),e(751,"jwt.strategy.ts"),t(),e(752," in the "),n(753,"code"),e(754,"auth"),t(),e(755," folder, and add the following code:"),t(),n(756,"app-copy-button",32)(757,"span",33),e(758),l(759,"extension"),o(760,"app-tabs",null,13),t(),n(762,"pre")(763,"code",34),e(764,`
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
`),t()(),n(765,"pre")(766,"code",34),e(767,`
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload) {
    return { userId: payload.sub, username: payload.username };
  }
}
`),t()()(),n(768,"p"),e(769,"With our "),n(770,"code"),e(771,"JwtStrategy"),t(),e(772,", we've followed the same recipe described earlier for all Passport strategies. This strategy requires some initialization, so we do that by passing in an options object in the "),n(773,"code"),e(774,"super()"),t(),e(775," call. You can read more about the available options "),n(776,"a",52),e(777,"here"),t(),e(778,". In our case, these options are:"),t(),n(779,"ul")(780,"li")(781,"code"),e(782,"jwtFromRequest"),t(),e(783,": supplies the method by which the JWT will be extracted from the "),n(784,"code"),e(785,"Request"),t(),e(786,". We will use the standard approach of supplying a bearer token in the Authorization header of our API requests. Other options are described "),n(787,"a",53),e(788,"here"),t(),e(789,"."),t(),n(790,"li")(791,"code"),e(792,"ignoreExpiration"),t(),e(793,": just to be explicit, we choose the default "),n(794,"code"),e(795,"false"),t(),e(796," setting, which delegates the responsibility of ensuring that a JWT has not expired to the Passport module. This means that if our route is supplied with an expired JWT, the request will be denied and a "),n(797,"code"),e(798,"401 Unauthorized"),t(),e(799," response sent. Passport conveniently handles this automatically for us."),t(),n(800,"li")(801,"code"),e(802,"secretOrKey"),t(),e(803,": we are using the expedient option of supplying a symmetric secret for signing the token. Other options, such as a PEM-encoded public key, may be more appropriate for production apps (see "),n(804,"a",52),e(805,"here"),t(),e(806," for more information). In any case, as cautioned earlier, "),n(807,"strong"),e(808,"do not expose this secret publicly"),t(),e(809,"."),t()(),n(810,"p"),e(811,"The "),n(812,"code"),e(813,"validate()"),t(),e(814," method deserves some discussion. For the jwt-strategy, Passport first verifies the JWT's signature and decodes the JSON. It then invokes our "),n(815,"code"),e(816,"validate()"),t(),e(817," method passing the decoded JSON as its single parameter. Based on the way JWT signing works, "),n(818,"strong"),e(819,"we're guaranteed that we're receiving a valid token"),t(),e(820," that we have previously signed and issued to a valid user."),t(),n(821,"p"),e(822,"As a result of all this, our response to the "),n(823,"code"),e(824,"validate()"),t(),e(825," callback is trivial: we simply return an object containing the "),n(826,"code"),e(827,"userId"),t(),e(828," and "),n(829,"code"),e(830,"username"),t(),e(831," properties. Recall again that Passport will build a "),n(832,"code"),e(833,"user"),t(),e(834," object based on the return value of our "),n(835,"code"),e(836,"validate()"),t(),e(837," method, and attach it as a property on the "),n(838,"code"),e(839,"Request"),t(),e(840," object."),t(),n(841,"p"),e(842,"Additionally, you can return an array, where the first value is used to create a "),n(843,"code"),e(844,"user"),t(),e(845," object and the second value is used to create an "),n(846,"code"),e(847,"authInfo"),t(),e(848," object."),t(),n(849,"p"),e(850,"It's also worth pointing out that this approach leaves us room ('hooks' as it were) to inject other business logic into the process. For example, we could do a database lookup in our "),n(851,"code"),e(852,"validate()"),t(),e(853," method to extract more information about the user, resulting in a more enriched "),n(854,"code"),e(855,"user"),t(),e(856," object being available in our "),n(857,"code"),e(858,"Request"),t(),e(859,". This is also the place we may decide to do further token validation, such as looking up the "),n(860,"code"),e(861,"userId"),t(),e(862,` in a list of revoked tokens, enabling us to perform token revocation. The model we've implemented here in our sample code is a fast, "stateless JWT" model, where each API call is immediately authorized based on the presence of a valid JWT, and a small bit of information about the requester (its `),n(863,"code"),e(864,"userId"),t(),e(865," and "),n(866,"code"),e(867,"username"),t(),e(868,") is available in our Request pipeline."),t(),n(869,"p"),e(870,"Add the new "),n(871,"code"),e(872,"JwtStrategy"),t(),e(873," as a provider in the "),n(874,"code"),e(875,"AuthModule"),t(),e(876,":"),t(),n(877,"app-copy-button",32)(878,"span",33),e(879),l(880,"extension"),o(881,"app-tabs",null,14),t(),n(883,"pre")(884,"code",34),e(885,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
`),t()(),n(886,"pre")(887,"code",34),e(888,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
`),t()()(),n(889,"p"),e(890,"By importing the same secret used when we signed the JWT, we ensure that the "),n(891,"strong"),e(892,"verify"),t(),e(893," phase performed by Passport, and the "),n(894,"strong"),e(895,"sign"),t(),e(896," phase performed in our AuthService, use a common secret."),t(),n(897,"p"),e(898,"Finally, we define the "),n(899,"code"),e(900,"JwtAuthGuard"),t(),e(901," class which extends the built-in "),n(902,"code"),e(903,"AuthGuard"),t(),e(904,":"),t(),n(905,"app-copy-button",32)(906,"span",33),e(907),l(908,"extension"),o(909,"app-tabs",null,15),t(),n(911,"pre")(912,"code",34),e(913,`
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
`),t()()(),n(914,"h4",54)(915,"span"),e(916,"Implement protected route and JWT strategy guards"),t()(),n(917,"p"),e(918,"We can now implement our protected route and its associated Guard."),t(),n(919,"p"),e(920,"Open the "),n(921,"code"),e(922,"app.controller.ts"),t(),e(923," file and update it as shown below:"),t(),n(924,"app-copy-button",32)(925,"span",33),e(926),l(927,"extension"),o(928,"app-tabs",null,16),t(),n(930,"pre")(931,"code",34),e(932,`
import { Controller, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
`),t()(),n(933,"pre")(934,"code",34),e(935,`
import { Controller, Dependencies, Bind, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Dependencies(AuthService)
@Controller()
export class AppController {
  constructor(authService) {
    this.authService = authService;
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Bind(Request())
  getProfile(req) {
    return req.user;
  }
}
`),t()()(),n(936,"p"),e(937,"Once again, we're applying the "),n(938,"code"),e(939,"AuthGuard"),t(),e(940," that the "),n(941,"code"),e(942,"@nestjs/passport"),t(),e(943," module has automatically provisioned for us when we configured the passport-jwt module. This Guard is referenced by its default name, "),n(944,"code"),e(945,"jwt"),t(),e(946,". When our "),n(947,"code"),e(948,"GET /profile"),t(),e(949," route is hit, the Guard will automatically invoke our passport-jwt custom configured strategy, validate the JWT, and assign the "),n(950,"code"),e(951,"user"),t(),e(952," property to the "),n(953,"code"),e(954,"Request"),t(),e(955," object."),t(),n(956,"p"),e(957,"Ensure the app is running, and test the routes using "),n(958,"code"),e(959,"cURL"),t(),e(960,"."),t(),n(961,"pre")(962,"code",29),e(963,`
$ # GET /profile
$ curl http://localhost:3000/profile
$ # result -> {"statusCode":401,"message":"Unauthorized"}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm... }

$ # GET /profile using access_token returned from previous step as bearer code
$ curl http://localhost:3000/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
$ # result -> {"userId":1,"username":"john"}
`),t()(),n(964,"p"),e(965,"Note that in the "),n(966,"code"),e(967,"AuthModule"),t(),e(968,", we configured the JWT to have an expiration of "),n(969,"code"),e(970,"60 seconds"),t(),e(971,". This is probably too short an expiration, and dealing with the details of token expiration and refresh is beyond the scope of this article. However, we chose that to demonstrate an important quality of JWTs and the passport-jwt strategy. If you wait 60 seconds after authenticating before attempting a "),n(972,"code"),e(973,"GET /profile"),t(),e(974," request, you'll receive a "),n(975,"code"),e(976,"401 Unauthorized"),t(),e(977," response. This is because Passport automatically checks the JWT for its expiration time, saving you the trouble of doing so in your application."),t(),n(978,"p"),e(979,"We've now completed our JWT authentication implementation. JavaScript clients (such as Angular/React/Vue), and other JavaScript apps, can now authenticate and communicate securely with our API Server."),t(),n(980,"h4",55)(981,"span"),e(982,"Extending guards"),t()(),n(983,"p"),e(984,"In most cases, using a provided "),n(985,"code"),e(986,"AuthGuard"),t(),e(987," class is sufficient. However, there might be use-cases when you would like to simply extend the default error handling or authentication logic. For this, you can extend the built-in class and override methods within a sub-class."),t(),n(988,"app-copy-button")(989,"pre")(990,"code",34),e(991,`
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
`),t()()(),n(992,"p"),e(993,"In addition to extending the default error handling and authentication logic, we can allow authentication to go through a chain of strategies. The first strategy to succeed, redirect, or error will halt the chain. Authentication failures will proceed through each strategy in series, ultimately failing if all strategies fail."),t(),n(994,"app-copy-button")(995,"pre")(996,"code",34),e(997,`
export class JwtAuthGuard extends AuthGuard(['strategy_jwt_1', 'strategy_jwt_2', '...']) { ... }
`),t()()(),n(998,"h4",56)(999,"span"),e(1e3,"Enable authentication globally"),t()(),n(1001,"p"),e(1002,"If the vast majority of your endpoints should be protected by default, you can register the authentication guard as a "),n(1003,"a",57),e(1004,"global guard"),t(),e(1005," and instead of using "),n(1006,"code"),e(1007,"@UseGuards()"),t(),e(1008," decorator on top of each controller, you could simply flag which routes should be public."),t(),n(1009,"p"),e(1010,"First, register the "),n(1011,"code"),e(1012,"JwtAuthGuard"),t(),e(1013," as a global guard using the following construction (in any module):"),t(),n(1014,"app-copy-button")(1015,"pre")(1016,"code",34),e(1017,`
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
`),t()()(),n(1018,"p"),e(1019,"With this in place, Nest will automatically bind "),n(1020,"code"),e(1021,"JwtAuthGuard"),t(),e(1022," to all endpoints."),t(),n(1023,"p"),e(1024,"Now we must provide a mechanism for declaring routes as public. For this, we can create a custom decorator using the "),n(1025,"code"),e(1026,"SetMetadata"),t(),e(1027," decorator factory function."),t(),n(1028,"app-copy-button")(1029,"pre")(1030,"code",34),e(1031,`
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
`),t()()(),n(1032,"p"),e(1033,"In the file above, we exported two constants. One being our metadata key named "),n(1034,"code"),e(1035,"IS_PUBLIC_KEY"),t(),e(1036,", and the other being our new decorator itself that we\u2019re going to call "),n(1037,"code"),e(1038,"Public"),t(),e(1039," (you can alternatively name it "),n(1040,"code"),e(1041,"SkipAuth"),t(),e(1042," or "),n(1043,"code"),e(1044,"AllowAnon"),t(),e(1045,", whatever fits your project)."),t(),n(1046,"p"),e(1047,"Now that we have a custom "),n(1048,"code"),e(1049,"@Public()"),t(),e(1050," decorator, we can use it to decorate any method, as follows:"),t(),n(1051,"app-copy-button")(1052,"pre")(1053,"code",34),e(1054,`
@Public()
@Get()
findAll() {
  return [];
}
`),t()()(),n(1055,"p"),e(1056,"Lastly, we need the "),n(1057,"code"),e(1058,"JwtAuthGuard"),t(),e(1059," to return "),n(1060,"code"),e(1061,"true"),t(),e(1062," when the "),n(1063,"code"),e(1064,'"isPublic"'),t(),e(1065," metadata is found. For this, we'll use the "),n(1066,"code"),e(1067,"Reflector"),t(),e(1068," class (read more "),n(1069,"a",58),e(1070,"here"),t(),e(1071,")."),t(),n(1072,"app-copy-button")(1073,"pre")(1074,"code",34),e(1075,`
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
`),t()()(),n(1076,"h4",59)(1077,"span"),e(1078,"Request-scoped strategies"),t()(),n(1079,"p"),e(1080,"The passport API is based on registering strategies to the global instance of the library. Therefore strategies are not designed to have request-dependent options or to be dynamically instantiated per request (read more about the "),n(1081,"a",60),e(1082,"request-scoped"),t(),e(1083,` providers). When you configure your strategy to be request-scoped, Nest will never instantiate it since it's not tied to any specific route. There is no physical way to determine which "request-scoped" strategies should be executed per request.`),t(),n(1084,"p"),e(1085,"However, there are ways to dynamically resolve request-scoped providers within the strategy. For this, we leverage the "),n(1086,"a",61),e(1087,"module reference"),t(),e(1088," feature."),t(),n(1089,"p"),e(1090,"First, open the "),n(1091,"code"),e(1092,"local.strategy.ts"),t(),e(1093," file and inject the "),n(1094,"code"),e(1095,"ModuleRef"),t(),e(1096," in the normal way:"),t(),n(1097,"app-copy-button")(1098,"pre")(1099,"code",34),e(1100,`
constructor(private moduleRef: ModuleRef) {
  super({
    passReqToCallback: true,
  });
}
`),t()()(),n(1101,"blockquote",38)(1102,"strong"),e(1103,"Hint"),t(),e(1104," The "),n(1105,"code"),e(1106,"ModuleRef"),t(),e(1107," class is imported from the "),n(1108,"code"),e(1109,"@nestjs/core"),t(),e(1110,` package.
`),t(),n(1111,"p"),e(1112,"Be sure to set the "),n(1113,"code"),e(1114,"passReqToCallback"),t(),e(1115," configuration property to "),n(1116,"code"),e(1117,"true"),t(),e(1118,", as shown above."),t(),n(1119,"p"),e(1120,"In the next step, the request instance will be used to obtain the current context identifier, instead of generating a new one (read more about request context "),n(1121,"a",62),e(1122,"here"),t(),e(1123,")."),t(),n(1124,"p"),e(1125,"Now, inside the "),n(1126,"code"),e(1127,"validate()"),t(),e(1128," method of the "),n(1129,"code"),e(1130,"LocalStrategy"),t(),e(1131," class, use the "),n(1132,"code"),e(1133,"getByRequest()"),t(),e(1134," method of the "),n(1135,"code"),e(1136,"ContextIdFactory"),t(),e(1137," class to create a context id based on the request object, and pass this to the "),n(1138,"code"),e(1139,"resolve()"),t(),e(1140," call:"),t(),n(1141,"app-copy-button")(1142,"pre")(1143,"code",34),e(1144,`
async validate(
  request: Request,
  username: string,
  password: string,
) {
  const contextId = ContextIdFactory.getByRequest(request);
  // "AuthService" is a request-scoped provider
  const authService = await this.moduleRef.resolve(AuthService, contextId);
  ...
}
`),t()()(),n(1145,"p"),e(1146,"In the example above, the "),n(1147,"code"),e(1148,"resolve()"),t(),e(1149," method will asynchronously return the request-scoped instance of the "),n(1150,"code"),e(1151,"AuthService"),t(),e(1152," provider (we assumed that "),n(1153,"code"),e(1154,"AuthService"),t(),e(1155," is marked as a request-scoped provider)."),t(),n(1156,"h4",63)(1157,"span"),e(1158,"Customize Passport"),t()(),n(1159,"p"),e(1160,"Any standard Passport customization options can be passed the same way, using the "),n(1161,"code"),e(1162,"register()"),t(),e(1163," method. The available options depend on the strategy being implemented. For example:"),t(),n(1164,"app-copy-button")(1165,"pre")(1166,"code",34),e(1167,`
PassportModule.register({ session: true });
`),t()()(),n(1168,"p"),e(1169,`You can also pass strategies an options object in their constructors to configure them.
For the local strategy you can pass e.g.:`),t(),n(1170,"app-copy-button")(1171,"pre")(1172,"code",34),e(1173,`
constructor(private authService: AuthService) {
  super({
    usernameField: 'email',
    passwordField: 'password',
  });
}
`),t()()(),n(1174,"p"),e(1175,"Take a look at the official "),n(1176,"a",64),e(1177,"Passport Website"),t(),e(1178," for property names."),t(),n(1179,"h4",65)(1180,"span"),e(1181,"Named strategies"),t()(),n(1182,"p"),e(1183,"When implementing a strategy, you can provide a name for it by passing a second argument to the "),n(1184,"code"),e(1185,"PassportStrategy"),t(),e(1186," function. If you don't do this, each strategy will have a default name (e.g., 'jwt' for jwt-strategy):"),t(),n(1187,"app-copy-button")(1188,"pre")(1189,"code",34),e(1190,`
export class JwtStrategy extends PassportStrategy(Strategy, 'myjwt')
`),t()()(),n(1191,"p"),e(1192,"Then, you refer to this via a decorator like "),n(1193,"code"),e(1194,"@UseGuards(AuthGuard('myjwt'))"),t(),e(1195,"."),t(),n(1196,"h4",66)(1197,"span"),e(1198,"GraphQL"),t()(),n(1199,"p"),e(1200,"In order to use an AuthGuard with "),n(1201,"a",67),e(1202,"GraphQL"),t(),e(1203,", extend the built-in "),n(1204,"code"),e(1205,"AuthGuard"),t(),e(1206," class and override the "),n(1207,"code"),e(1208,"getRequest()"),t(),e(1209," method."),t(),n(1210,"app-copy-button")(1211,"pre")(1212,"code",34),e(1213,`
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
`),t()()(),n(1214,"p"),e(1215,"To get the current authenticated user in your graphql resolver, you can define a "),n(1216,"code"),e(1217,"@CurrentUser()"),t(),e(1218," decorator:"),t(),n(1219,"app-copy-button")(1220,"pre")(1221,"code",34),e(1222,`
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
`),t()()(),n(1223,"p"),e(1224,"To use above decorator in your resolver, be sure to include it as a parameter of your query or mutation:"),t(),n(1225,"app-copy-button")(1226,"pre")(1227,"code",34),e(1228,`
@Query(() => User)
@UseGuards(GqlAuthGuard)
whoAmI(@CurrentUser() user: User) {
  return this.usersService.findById(user.id);
}
`),t()()(),n(1229,"p"),e(1230,"For the passport-local strategy, you'll also need to add the GraphQL context's arguments to the request body so Passport can access them for validation. Otherwise, you'll get an Unauthorized error."),t(),n(1231,"app-copy-button")(1232,"pre")(1233,"code",34),e(1234,`
@Injectable()
export class GqlLocalAuthGuard extends AuthGuard('local') {
  getRequest(context: ExecutionContext) {
    const gqlExecutionContext = GqlExecutionContext.create(context);
    const gqlContext = gqlExecutionContext.getContext();
    const gqlArgs = gqlExecutionContext.getArgs();

    gqlContext.req.body = { ...gqlContext.req.body, ...gqlArgs };
    return gqlContext.req;
  }
}
`),t()()()()),p&2){let y=r(153),b=r(179),v=r(202),k=r(234),w=r(260),j=r(355),P=r(435),M=r(508),R=r(608),q=r(659),D=r(690),U=r(724),H=r(761),B=r(882),_=r(910),O=r(929);i(150),s(" ",d(151,74,"users/users.service",y.isJsActive),`
`),i(4),m("hide",y.isJsActive),i(3),m("hide",!y.isJsActive),i(19),s(" ",d(177,77,"users/users.module",b.isJsActive),`
`),i(4),m("hide",b.isJsActive),i(3),m("hide",!b.isJsActive),i(16),s(" ",d(200,80,"auth/auth.service",v.isJsActive),`
`),i(4),m("hide",v.isJsActive),i(3),m("hide",!v.isJsActive),i(25),s(" ",d(232,83,"auth/auth.module",k.isJsActive),`
`),i(4),m("hide",k.isJsActive),i(3),m("hide",!k.isJsActive),i(19),s(" ",d(258,86,"auth/local.strategy",w.isJsActive),`
`),i(4),m("hide",w.isJsActive),i(3),m("hide",!w.isJsActive),i(22),J("super(","{"," usernameField: 'email' ","}",")"),i(66),s(" ",d(353,89,"auth/auth.module",j.isJsActive),`
`),i(4),m("hide",j.isJsActive),i(3),m("hide",!j.isJsActive),i(73),s(" ",d(433,92,"app.controller",P.isJsActive),`
`),i(4),m("hide",P.isJsActive),i(3),m("hide",!P.isJsActive),i(66),s(" ",d(506,95,"auth/local-auth.guard",M.isJsActive),`
`),i(100),s(" ",d(606,98,"auth/auth.service",R.isJsActive),`
`),i(4),m("hide",R.isJsActive),i(3),m("hide",!R.isJsActive),i(44),s(" ",d(657,101,"auth/constants",q.isJsActive),`
`),i(4),m("hide",q.isJsActive),i(3),m("hide",!q.isJsActive),i(24),s(" ",d(688,104,"auth/auth.module",D.isJsActive),`
`),i(4),m("hide",D.isJsActive),i(3),m("hide",!D.isJsActive),i(27),s(" ",d(722,107,"app.controller",U.isJsActive),`
`),i(4),m("hide",U.isJsActive),i(3),m("hide",!U.isJsActive),i(30),s(" ",d(759,110,"auth/jwt.strategy",H.isJsActive),`
`),i(4),m("hide",H.isJsActive),i(3),m("hide",!H.isJsActive),i(114),s(" ",d(880,113,"auth/auth.module",B.isJsActive),`
`),i(4),m("hide",B.isJsActive),i(3),m("hide",!B.isJsActive),i(21),s(" ",d(908,116,"auth/jwt-auth.guard",_.isJsActive),`
`),i(19),s(" ",d(927,119,"app.controller",O.isJsActive),`
`),i(4),m("hide",O.isJsActive),i(3),m("hide",!O.isJsActive)}},dependencies:[g,E,C,L,A,I],encapsulation:2,changeDetection:0})}return a})();var Dn=[{path:"mikroorm",component:Q,data:{title:"MikroORM"}},{path:"sql-typeorm",component:Z,data:{title:"SQL (TypeORM)"}},{path:"mongodb",component:z,data:{title:"MongoDB (Mongoose)"}},{path:"sql-sequelize",component:X,data:{title:"SQL (Sequelize)"}},{path:"cqrs",component:N,data:{title:"CQRS"}},{path:"sentry",component:Y,data:{title:"Sentry"}},{path:"swagger",redirectTo:"/openapi/introduction"},{path:"prisma",component:$,data:{title:"Prisma"}},{path:"terminus",component:ee,data:{title:"Health checks (Terminus)"}},{path:"documentation",component:G,data:{title:"Documentation (Compodoc)"}},{path:"crud-utilities",redirectTo:"/recipes/crud-generator"},{path:"crud",redirectTo:"/recipes/crud-generator"},{path:"crud-generator",component:F,data:{title:"CRUD generator"}},{path:"hot-reload",component:W,data:{title:"Hot reload"}},{path:"serve-static",component:V,data:{title:"Serve static"}},{path:"router-module",component:te,data:{title:"Router module"}},{path:"nest-commander",component:ne,data:{title:"Nest Commander"}},{path:"async-local-storage",component:ie,data:{title:"Async Local Storage"}},{path:"repl",component:K,data:{title:"REPL"}},{path:"swc",component:ae,data:{title:"SWC (fast compiler)"}},{path:"automock",redirectTo:"/recipes/suites"},{path:"suites",component:oe,data:{title:"Suites (Automock)"}},{path:"necord",component:re,data:{title:"Necord"}},{path:"passport",component:se,data:{title:"passport"}}];export{Dn as RECIPES_ROUTES};
