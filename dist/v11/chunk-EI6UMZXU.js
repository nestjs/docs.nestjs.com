import{a as A}from"./chunk-HWO3INMO.js";import{a as E,b as C}from"./chunk-AO7BAPTM.js";import{G as h,L as d,Ma as x,N as p,Qa as c,Ra as m,Sa as u,V as n,W as t,X as l,ja as y,ka as S,la as e,na as v,oa as b,ua as w,va as k,y as s}from"./chunk-IPH2CUBH.js";var T=(()=>{class i extends c{static \u0275fac=(()=>{let o;return function(a){return(o||(o=s(i)))(a||i)}})();static \u0275cmp=d({type:i,selectors:[["app-errors"]],features:[p],decls:220,vars:2,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/faq/errors.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","common-errors"],["appAnchor","","id","cannot-resolve-dependency-error"],[1,"info"],["href","/devtools/overview#investigating-the-cannot-resolve-dependency-error"],[1,"language-bash"],["href","/fundamentals/custom-providers#di-fundamentals"],["href","/faq/common-errors#circular-dependency-error"],["routerLink","/fundamentals/custom-providers"],["rel","nofollow","target","_blank","href","https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export"],[1,"language-text"],["rel","nofollow","target","_blank","href","https://classic.yarnpkg.com/blog/2018/02/15/nohoist"],["rel","nofollow","target","_blank","href","https://pnpm.io/package_json#dependenciesmetainjected"],["appAnchor","","id","circular-dependency-error"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/circular-dependency"],["appAnchor","","id","debugging-dependency-errors"],["src","/assets/injector_logs.png"],["appAnchor","","id","file-change-detected-loops-endlessly"],["rel","nofollow","target","_blank","href","https://devblogs.microsoft.com/typescript/announcing-typescript-4-9/#file-watching-now-uses-file-system-events"],["rel","nofollow","target","_blank","href","https://www.typescriptlang.org/tsconfig#watch-watchDirectory"]],template:function(r,a){r&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),l(4,"i",4),t()(),n(5,"h3",5),e(6,"Common errors"),t(),n(7,"p"),e(8,"During your development with NestJS, you may encounter various errors as you learn the framework."),t(),n(9,"h4",6)(10,"span"),e(11,'"Cannot resolve dependency" error'),t()(),n(12,"blockquote",7)(13,"strong"),e(14,"Hint"),t(),e(15," Check out the "),n(16,"a",8),e(17,"NestJS Devtools"),t(),e(18,` which can help you resolve the "Cannot resolve dependency" error effortlessly.
`),t(),n(19,"p"),e(20,"Probably the most common error message is about Nest not being able to resolve dependencies of a provider. The error message usually looks something like this:"),t(),n(21,"pre")(22,"code",9),e(23,`
Nest can't resolve dependencies of the <provider> (?). Please make sure that the argument <unknown_token> at index [<index>] is available in the <module> context.

Potential solutions:
- Is <module> a valid NestJS module?
- If <unknown_token> is a provider, is it part of the current <module>?
- If <unknown_token> is exported from a separate @Module, is that module imported within <module>?
  @Module({
    imports: [ /* the Module containing <unknown_token> */ ]
  })
`),t()(),n(24,"p"),e(25,"The most common culprit of the error, is not having the "),n(26,"code"),e(27,"<provider>"),t(),e(28," in the module's "),n(29,"code"),e(30,"providers"),t(),e(31," array. Please make sure that the provider is indeed in the "),n(32,"code"),e(33,"providers"),t(),e(34," array and following "),n(35,"a",10),e(36,"standard NestJS provider practices"),t(),e(37,"."),t(),n(38,"p"),e(39,"There are a few gotchas, that are common. One is putting a provider in an "),n(40,"code"),e(41,"imports"),t(),e(42," array. If this is the case, the error will have the provider's name where "),n(43,"code"),e(44,"<module>"),t(),e(45," should be."),t(),n(46,"p"),e(47,"If you run across this error while developing, take a look at the module mentioned in the error message and look at its "),n(48,"code"),e(49,"providers"),t(),e(50,". For each provider in the "),n(51,"code"),e(52,"providers"),t(),e(53," array, make sure the module has access to all of the dependencies. Often times, "),n(54,"code"),e(55,"providers"),t(),e(56,' are duplicated in a "Feature Module" and a "Root Module" which means Nest will try to instantiate the provider twice. More than likely, the module containing the '),n(57,"code"),e(58,"<provider>"),t(),e(59,` being duplicated should be added in the "Root Module"'s `),n(60,"code"),e(61,"imports"),t(),e(62," array instead."),t(),n(63,"p"),e(64,"If the "),n(65,"code"),e(66,"<unknown_token>"),t(),e(67," above is "),n(68,"code"),e(69,"dependency"),t(),e(70,", you might have a circular file import. This is different from the "),n(71,"a",11),e(72,"circular dependency"),t(),e(73," below because instead of having providers depend on each other in their constructors, it just means that two files end up importing each other. A common case would be a module file declaring a token and importing a provider, and the provider import the token constant from the module file. If you are using barrel files, ensure that your barrel imports do not end up creating these circular imports as well."),t(),n(74,"p"),e(75,"If the "),n(76,"code"),e(77,"<unknown_token>"),t(),e(78," above is "),n(79,"code"),e(80,"Object"),t(),e(81,", it means that you're injecting using an type/interface without a proper provider's token. To fix that, make sure that:"),t(),n(82,"ol")(83,"li"),e(84,"you're importing the class reference or use a custom token with "),n(85,"code"),e(86,"@Inject()"),t(),e(87," decorator. Read the "),n(88,"a",12),e(89,"custom providers page"),t(),e(90,", and"),t(),n(91,"li"),e(92,"for class-based providers, you're importing the concrete classes instead of only the type via "),n(93,"a",13)(94,"code"),e(95,"import type ..."),t()(),e(96," syntax."),t()(),n(97,"p"),e(98,"Also, make sure you didn't end up injecting the provider on itself because self-injections are not allowed in NestJS. When this happens, "),n(99,"code"),e(100,"<unknown_token>"),t(),e(101," will likely be equal to "),n(102,"code"),e(103,"<provider>"),t(),e(104,"."),t(),n(105,"p"),l(106,"app-banner-devtools"),t(),n(107,"p"),e(108,"If you are in a "),n(109,"strong"),e(110,"monorepo setup"),t(),e(111,", you may face the same error as above but for core provider called "),n(112,"code"),e(113,"ModuleRef"),t(),e(114," as a "),n(115,"code"),e(116,"<unknown_token>"),t(),e(117,":"),t(),n(118,"pre")(119,"code",9),e(120,`
Nest can't resolve dependencies of the <provider> (?).
Please make sure that the argument ModuleRef at index [<index>] is available in the <module> context.
...
`),t()(),n(121,"p"),e(122,"This likely happens when your project end up loading two Node modules of the package "),n(123,"code"),e(124,"@nestjs/core"),t(),e(125,", like this:"),t(),n(126,"pre")(127,"code",14),e(128,`
.
\u251C\u2500\u2500 package.json
\u251C\u2500\u2500 apps
\u2502   \u2514\u2500\u2500 api
\u2502       \u2514\u2500\u2500 node_modules
\u2502           \u2514\u2500\u2500 @nestjs/bull
\u2502               \u2514\u2500\u2500 node_modules
\u2502                   \u2514\u2500\u2500 @nestjs/core
\u2514\u2500\u2500 node_modules
    \u251C\u2500\u2500 (other packages)
    \u2514\u2500\u2500 @nestjs/core
`),t()(),n(129,"p"),e(130,"Solutions:"),t(),n(131,"ul")(132,"li"),e(133,"For "),n(134,"strong"),e(135,"Yarn"),t(),e(136," Workspaces, use the "),n(137,"a",15),e(138,"nohoist feature"),t(),e(139," to prevent hoisting the package "),n(140,"code"),e(141,"@nestjs/core"),t(),e(142,"."),t(),n(143,"li"),e(144,"For "),n(145,"strong"),e(146,"pnpm"),t(),e(147," Workspaces, set "),n(148,"code"),e(149,"@nestjs/core"),t(),e(150," as a peerDependencies in your other module and "),n(151,"code"),e(152),t(),e(153," in the app package.json where the module is imported. see: "),n(154,"a",16),e(155,"dependenciesmetainjected"),t()()(),n(156,"h4",17)(157,"span"),e(158,'"Circular dependency" error'),t()(),n(159,"p"),e(160,"Occasionally you'll find it difficult to avoid "),n(161,"a",18),e(162,"circular dependencies"),t(),e(163," in your application. You'll need to take some steps to help Nest resolve these. Errors that arise from circular dependencies look like this:"),t(),n(164,"pre")(165,"code",9),e(166,`
Nest cannot create the <module> instance.
The module at index [<index>] of the <module> "imports" array is undefined.

Potential causes:
- A circular dependency between modules. Use forwardRef() to avoid it. Read more: https://docs.nestjs.com/fundamentals/circular-dependency
- The module at index [<index>] is of type "undefined". Check your import statements and the type of the module.

Scope [<module_import_chain>]
# example chain AppModule -> FooModule
`),t()(),n(167,"p"),e(168,"Circular dependencies can arise from both providers depending on each other, or typescript files depending on each other for constants, such as exporting constants from a module file and importing them in a service file. In the latter case, it is advised to create a separate file for your constants. In the former case, please follow the guide on circular dependencies and make sure that both the modules "),n(169,"strong"),e(170,"and"),t(),e(171," the providers are marked with "),n(172,"code"),e(173,"forwardRef"),t(),e(174,"."),t(),n(175,"h4",19)(176,"span"),e(177,"Debugging dependency errors"),t()(),n(178,"p"),e(179,"Along with just manually verifying your dependencies are correct, as of Nest 8.1.0 you can set the "),n(180,"code"),e(181,"NEST_DEBUG"),t(),e(182," environment variable to a string that resolves as truthy, and get extra logging information while Nest is resolving all of the dependencies for the application."),t(),n(183,"figure"),l(184,"img",20),t(),n(185,"p"),e(186,"In the above image, the string in yellow is the host class of the dependency being injected, the string in blue is the name of the injected dependency, or its injection token, and the string in purple is the module in which the dependency is being searched for. Using this, you can usually trace back the dependency resolution for what's happening and why you're getting dependency injection problems."),t(),n(187,"h4",21)(188,"span"),e(189,'"File change detected" loops endlessly'),t()(),n(190,"p"),e(191,`Windows users who are using TypeScript version 4.9 and up may encounter this problem.
This happens when you're trying to run your application in watch mode, e.g `),n(192,"code"),e(193,"npm run start:dev"),t(),e(194," and see an endless loop of the log messages:"),t(),n(195,"pre")(196,"code",9),e(197,`
XX:XX:XX AM - File change detected. Starting incremental compilation...
XX:XX:XX AM - Found 0 errors. Watching for file changes.
`),t()(),n(198,"p"),e(199,"When you're using the NestJS CLI to start your application in watch mode it is done by calling "),n(200,"code"),e(201,"tsc --watch"),t(),e(202,", and as of version 4.9 of TypeScript, a "),n(203,"a",22),e(204,"new strategy"),t(),e(205,` for detecting file changes is used which is likely to be the cause of this problem.
In order to fix this problem, you need to add a setting to your tsconfig.json file after the `),n(206,"code"),e(207,'"compilerOptions"'),t(),e(208," option as follows:"),t(),n(209,"pre")(210,"code",9),e(211,`
  "watchOptions": {
    "watchFile": "fixedPollingInterval"
  }
`),t()(),n(212,"p"),e(213,`This tells TypeScript to use the polling method for checking for file changes instead of file system events (the new default method), which can cause issues on some machines.
You can read more about the `),n(214,"code"),e(215,'"watchFile"'),t(),e(216," option in "),n(217,"a",23),e(218,"TypeScript documentation"),t(),e(219,"."),t()()),r&2&&(h(152),b('"dependenciesMeta": ',"{",'"other-module-name": ',"{",'"injected": true }}'))},dependencies:[m,x,A],encapsulation:2,changeDetection:0})}return i})();var F=(()=>{class i extends c{static \u0275fac=(()=>{let o;return function(a){return(o||(o=s(i)))(a||i)}})();static \u0275cmp=d({type:i,selectors:[["app-global-prefix"]],features:[p],decls:53,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/faq/global-prefix.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","global-prefix"],[1,"language-typescript"],[1,"info"],["rel","nofollow","target","_blank","href","https://github.com/pillarjs/path-to-regexp#parameters"]],template:function(r,a){r&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),l(4,"i",4),t()(),n(5,"h3",5),e(6,"Global prefix"),t(),n(7,"p"),e(8,"To set a prefix for "),n(9,"strong"),e(10,"every route"),t(),e(11," registered in an HTTP application, use the "),n(12,"code"),e(13,"setGlobalPrefix()"),t(),e(14," method of the "),n(15,"code"),e(16,"INestApplication"),t(),e(17," instance."),t(),n(18,"app-copy-button")(19,"pre")(20,"code",6),e(21,`
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('v1');
`),t()()(),n(22,"p"),e(23,"You can exclude routes from the global prefix using the following construction:"),t(),n(24,"app-copy-button")(25,"pre")(26,"code",6),e(27,`
app.setGlobalPrefix('v1', {
  exclude: [{ path: 'health', method: RequestMethod.GET }],
});
`),t()()(),n(28,"p"),e(29,"Alternatively, you can specify route as a string (it will apply to every request method):"),t(),n(30,"app-copy-button")(31,"pre")(32,"code",6),e(33,`
app.setGlobalPrefix('v1', { exclude: ['cats'] });
`),t()()(),n(34,"blockquote",7)(35,"strong"),e(36,"Hint"),t(),e(37," The "),n(38,"code"),e(39,"path"),t(),e(40," property supports wildcard parameters using the "),n(41,"a",8),e(42,"path-to-regexp"),t(),e(43," package. Note: this does not accept wildcard asterisks "),n(44,"code"),e(45,"*"),t(),e(46,". Instead, you must use parameters ("),n(47,"code"),e(48,":param"),t(),e(49,") or named wildcards ("),n(50,"code"),e(51,"*splat"),t(),e(52,`).
`),t()())},dependencies:[u],encapsulation:2,changeDetection:0})}return i})();var M=(()=>{class i extends c{static \u0275fac=(()=>{let o;return function(a){return(o||(o=s(i)))(a||i)}})();static \u0275cmp=d({type:i,selectors:[["app-http-adapter"]],features:[p],decls:128,vars:4,consts:[["contentReference",""],["appedf148b0dc8421676a30695d74bc9b20b465f51a",""],["app2827b8a61907d4551bb763a33a2c07a17bea4f39",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/faq/http-adapter.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","http-adapter"],["appAnchor","","id","outside-application-context-strategy"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["appAnchor","","id","as-injectable"],[1,"info"],["appAnchor","","id","listening-event"]],template:function(r,a){if(r&1&&(n(0,"div",3,0)(2,"div",4)(3,"a",5),l(4,"i",6),t()(),n(5,"h3",7),e(6,"HTTP adapter"),t(),n(7,"p"),e(8,"Occasionally, you may want to access the underlying HTTP server, either within the Nest application context or from the outside."),t(),n(9,"p"),e(10,"Every native (platform-specific) HTTP server/library (e.g., Express and Fastify) instance is wrapped in an "),n(11,"strong"),e(12,"adapter"),t(),e(13,". The adapter is registered as a globally available provider that can be retrieved from the application context, as well as injected into other providers."),t(),n(14,"h4",8)(15,"span"),e(16,"Outside application context strategy"),t()(),n(17,"p"),e(18,"To get a reference to the "),n(19,"code"),e(20,"HttpAdapter"),t(),e(21," from outside of the application context, call the "),n(22,"code"),e(23,"getHttpAdapter()"),t(),e(24," method."),t(),n(25,"app-copy-button",9)(26,"span",10),l(27,"app-tabs",null,1),t(),n(29,"pre")(30,"code",11),e(31,`
const app = await NestFactory.create(AppModule);
const httpAdapter = app.getHttpAdapter();
`),t()()(),n(32,"h4",12)(33,"span"),e(34,"As injectable"),t()(),n(35,"p"),e(36,"To get a reference to the "),n(37,"code"),e(38,"HttpAdapterHost"),t(),e(39," from within the application context, inject it using the same technique as any other existing provider (e.g., using constructor injection)."),t(),n(40,"app-copy-button",9)(41,"span",10),l(42,"app-tabs",null,2),t(),n(44,"pre")(45,"code",11),e(46,`
export class CatsService {
  constructor(private adapterHost: HttpAdapterHost) {}
}
`),t()(),n(47,"pre")(48,"code",11),e(49,`
@Dependencies(HttpAdapterHost)
export class CatsService {
  constructor(adapterHost) {
    this.adapterHost = adapterHost;
  }
}
`),t()()(),n(50,"blockquote",13)(51,"strong"),e(52,"Hint"),t(),e(53," The "),n(54,"code"),e(55,"HttpAdapterHost"),t(),e(56," is imported from the "),n(57,"code"),e(58,"@nestjs/core"),t(),e(59,` package.
`),t(),n(60,"p"),e(61,"The "),n(62,"code"),e(63,"HttpAdapterHost"),t(),e(64," is "),n(65,"strong"),e(66,"not"),t(),e(67," an actual "),n(68,"code"),e(69,"HttpAdapter"),t(),e(70,". To get the actual "),n(71,"code"),e(72,"HttpAdapter"),t(),e(73," instance, simply access the "),n(74,"code"),e(75,"httpAdapter"),t(),e(76," property."),t(),n(77,"app-copy-button")(78,"pre")(79,"code",11),e(80,`
const adapterHost = app.get(HttpAdapterHost);
const httpAdapter = adapterHost.httpAdapter;
`),t()()(),n(81,"p"),e(82,"The "),n(83,"code"),e(84,"httpAdapter"),t(),e(85," is the actual instance of the HTTP adapter used by the underlying framework. It is an instance of either "),n(86,"code"),e(87,"ExpressAdapter"),t(),e(88," or "),n(89,"code"),e(90,"FastifyAdapter"),t(),e(91," (both classes extend "),n(92,"code"),e(93,"AbstractHttpAdapter"),t(),e(94,")."),t(),n(95,"p"),e(96,"The adapter object exposes several useful methods to interact with the HTTP server. However, if you want to access the library instance (e.g., the Express instance) directly, call the "),n(97,"code"),e(98,"getInstance()"),t(),e(99," method."),t(),n(100,"app-copy-button")(101,"pre")(102,"code",11),e(103,`
const instance = httpAdapter.getInstance();
`),t()()(),n(104,"h4",14)(105,"span"),e(106,"Listening event"),t()(),n(107,"p"),e(108,"To execute an action when the server begins listening for incoming requests, you can subscribe to the "),n(109,"code"),e(110,"listen$"),t(),e(111," stream, as demonstrated below:"),t(),n(112,"app-copy-button")(113,"pre")(114,"code",11),e(115,`
this.httpAdapterHost.listen$.subscribe(() =>
  console.log('HTTP server is listening'),
);
`),t()()(),n(116,"p"),e(117,"Additionally, the "),n(118,"code"),e(119,"HttpAdapterHost"),t(),e(120," provides a "),n(121,"code"),e(122,"listening"),t(),e(123," boolean property that indicates whether the server is currently active and listening:"),t(),n(124,"app-copy-button")(125,"pre")(126,"code",11),e(127,`
if (this.httpAdapterHost.listening) {
  console.log('HTTP server is listening');
}
`),t()()()()),r&2){let g=y(43);h(44),S("hide",g.isJsActive),h(3),S("hide",!g.isJsActive)}},dependencies:[m,u,E],encapsulation:2,changeDetection:0})}return i})();var P=(()=>{class i extends c{static \u0275fac=(()=>{let o;return function(a){return(o||(o=s(i)))(a||i)}})();static \u0275cmp=d({type:i,selectors:[["app-hybrid-application"]],features:[p],decls:95,vars:4,consts:[["contentReference",""],["app1a0647aa72fbf568efa802b2aeba1bf35bfcbc23",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/faq/hybrid-application.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","hybrid-application"],[1,"language-typescript"],[1,"info"],[1,"with-heading"],[1,"filename"],["appAnchor","","id","sharing-configuration"]],template:function(r,a){if(r&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),l(4,"i",5),t()(),n(5,"h3",6),e(6,"Hybrid application"),t(),n(7,"p"),e(8,"A hybrid application is one that listens for requests from two or more different sources. This can combine an HTTP server with a microservice listener or even just multiple different microservice listeners. The default "),n(9,"code"),e(10,"createMicroservice"),t(),e(11," method does not allow for multiple servers so in this case each microservice must be created and started manually. In order to do this, the "),n(12,"code"),e(13,"INestApplication"),t(),e(14," instance can be connected with "),n(15,"code"),e(16,"INestMicroservice"),t(),e(17," instances through the "),n(18,"code"),e(19,"connectMicroservice()"),t(),e(20," method."),t(),n(21,"app-copy-button")(22,"pre")(23,"code",7),e(24,`
const app = await NestFactory.create(AppModule);
const microservice = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
});

await app.startAllMicroservices();
await app.listen(3001);
`),t()()(),n(25,"blockquote",8)(26,"strong"),e(27,"Hint"),t(),e(28," the "),n(29,"code"),e(30,"app.listen(port)"),t(),e(31," method starts an HTTP server on the specified address. If your application does not handle HTTP requests then you should use the "),n(32,"code"),e(33,"app.init()"),t(),e(34,` method instead.
`),t(),n(35,"p"),e(36,"To connect multiple microservice instances, issue the call to "),n(37,"code"),e(38,"connectMicroservice()"),t(),e(39," for each microservice:"),t(),n(40,"app-copy-button")(41,"pre")(42,"code",7),e(43,`
const app = await NestFactory.create(AppModule);
// microservice #1
const microserviceTcp = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
  options: {
    port: 3001,
  },
});
// microservice #2
const microserviceRedis = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});

await app.startAllMicroservices();
await app.listen(3001);
`),t()()(),n(44,"p"),e(45,"To bind "),n(46,"code"),e(47,"@MessagePattern()"),t(),e(48," to only one transport strategy (for example, MQTT) in a hybrid application with multiple microservices, we can pass the second argument of type "),n(49,"code"),e(50,"Transport"),t(),e(51," which is an enum with all the built-in transport strategies defined."),t(),n(52,"app-copy-button",9)(53,"span",10),l(54,"app-tabs",null,1),t(),n(56,"pre")(57,"code",7),e(58,`
@MessagePattern('time.us.*', Transport.NATS)
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(\`Subject: \${context.getSubject()}\`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@MessagePattern({ cmd: 'time.us' }, Transport.TCP)
getTCPDate(@Payload() data: number[]) {
  return new Date().toLocaleTimeString(...);
}
`),t()(),n(59,"pre")(60,"code",7),e(61,`
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*', Transport.NATS)
getDate(data, context) {
  console.log(\`Subject: \${context.getSubject()}\`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
@Bind(Payload(), Ctx())
@MessagePattern({ cmd: 'time.us' }, Transport.TCP)
getTCPDate(data, context) {
  return new Date().toLocaleTimeString(...);
}
`),t()()(),n(62,"blockquote",8)(63,"strong"),e(64,"Hint"),t(),n(65,"code"),e(66,"@Payload()"),t(),e(67,", "),n(68,"code"),e(69,"@Ctx()"),t(),e(70,", "),n(71,"code"),e(72,"Transport"),t(),e(73," and "),n(74,"code"),e(75,"NatsContext"),t(),e(76," are imported from "),n(77,"code"),e(78,"@nestjs/microservices"),t(),e(79,`.
`),t(),n(80,"h4",11)(81,"span"),e(82,"Sharing configuration"),t()(),n(83,"p"),e(84,`By default a hybrid application will not inherit global pipes, interceptors, guards and filters configured for the main (HTTP-based) application.
To inherit these configuration properties from the main application, set the `),n(85,"code"),e(86,"inheritAppConfig"),t(),e(87," property in the second argument (an optional options object) of the "),n(88,"code"),e(89,"connectMicroservice()"),t(),e(90," call, as follow:"),t(),n(91,"app-copy-button")(92,"pre")(93,"code",7),e(94,`
const microservice = app.connectMicroservice<MicroserviceOptions>(
  {
    transport: Transport.TCP,
  },
  { inheritAppConfig: true },
);
`),t()()()()),r&2){let g=y(55);h(56),S("hide",g.isJsActive),h(3),S("hide",!g.isJsActive)}},dependencies:[u,E,m],encapsulation:2,changeDetection:0})}return i})();var H=(()=>{class i extends c{static \u0275fac=(()=>{let o;return function(a){return(o||(o=s(i)))(a||i)}})();static \u0275cmp=d({type:i,selectors:[["app-keep-alive-connections"]],features:[p],decls:39,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/faq/keep-alive-connections.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","keep-alive-connections"],[1,"warning"],["appAnchor","","id","usage"],[1,"language-typescript"]],template:function(r,a){r&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),l(4,"i",4),t()(),n(5,"h3",5),e(6,"Keep alive connections"),t(),n(7,"p"),e(8,"By default, the HTTP adapters of NestJS will wait until the response is finished before closing the application. But sometimes, this behavior is not desired, or unexpected. There might be some requests that use "),n(9,"code"),e(10,"Connection: Keep-Alive"),t(),e(11," headers that live for a long time."),t(),n(12,"p"),e(13,"For these scenarios where you always want your application to exit without waiting for requests to end, you can enable the "),n(14,"code"),e(15,"forceCloseConnections"),t(),e(16," option when creating your NestJS application."),t(),n(17,"blockquote",6)(18,"strong"),e(19,"Tip"),t(),e(20," Most users will not need to enable this option. But the symptom of needing this option is that your application will not exit when you expect it to. Usually when "),n(21,"code"),e(22,"app.enableShutdownHooks()"),t(),e(23," is enabled and you notice that the application is not restarting/exiting. Most likely while running the NestJS application during development with "),n(24,"code"),e(25,"--watch"),t(),e(26,`.
`),t(),n(27,"h4",7)(28,"span"),e(29,"Usage"),t()(),n(30,"p"),e(31,"In your "),n(32,"code"),e(33,"main.ts"),t(),e(34," file, enable the option when creating your NestJS application:"),t(),n(35,"app-copy-button")(36,"pre")(37,"code",8),e(38,`
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    forceCloseConnections: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
`),t()()()())},dependencies:[m,u],encapsulation:2,changeDetection:0})}return i})();var j=(()=>{class i extends c{static \u0275fac=(()=>{let o;return function(a){return(o||(o=s(i)))(a||i)}})();static \u0275cmp=d({type:i,selectors:[["app-multiple-servers"]],features:[p],decls:78,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/faq/multiple-servers.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","https"],[1,"language-typescript"],["appAnchor","","id","multiple-simultaneous-servers"],[1,"info"],[1,""],["routerLink","/graphql/subscriptions"]],template:function(r,a){r&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),l(4,"i",4),t()(),n(5,"h3",5),e(6,"HTTPS"),t(),n(7,"p"),e(8,"To create an application that uses the HTTPS protocol, set the "),n(9,"code"),e(10,"httpsOptions"),t(),e(11," property in the options object passed to the "),n(12,"code"),e(13,"create()"),t(),e(14," method of the "),n(15,"code"),e(16,"NestFactory"),t(),e(17," class:"),t(),n(18,"app-copy-button")(19,"pre")(20,"code",6),e(21,`
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};
const app = await NestFactory.create(AppModule, {
  httpsOptions,
});
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(22,"p"),e(23,"If you use the "),n(24,"code"),e(25,"FastifyAdapter"),t(),e(26,", create the application as follows:"),t(),n(27,"app-copy-button")(28,"pre")(29,"code",6),e(30,`
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({ https: httpsOptions }),
);
`),t()()(),n(31,"h4",7)(32,"span"),e(33,"Multiple simultaneous servers"),t()(),n(34,"p"),e(35,"The following recipe shows how to instantiate a Nest application that listens on multiple ports (for example, on a non-HTTPS port and an HTTPS port) simultaneously."),t(),n(36,"app-copy-button")(37,"pre")(38,"code",6),e(39,`
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};

const server = express();
const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
await app.init();

const httpServer = http.createServer(server).listen(3000);
const httpsServer = https.createServer(httpsOptions, server).listen(443);
`),t()()(),n(40,"p"),e(41,"Because we called "),n(42,"code"),e(43,"http.createServer"),t(),e(44," / "),n(45,"code"),e(46,"https.createServer"),t(),e(47," ourselves, NestJS doesn't close them when calling "),n(48,"code"),e(49,"app.close"),t(),e(50," / on termination signal. We need to do this ourselves:"),t(),n(51,"app-copy-button")(52,"pre")(53,"code",6),e(54,`
@Injectable()
export class ShutdownObserver implements OnApplicationShutdown {
  private httpServers: http.Server[] = [];

  public addHttpServer(server: http.Server): void {
    this.httpServers.push(server);
  }

  public async onApplicationShutdown(): Promise<void> {
    await Promise.all(
      this.httpServers.map(
        (server) =>
          new Promise((resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
              } else {
                resolve(null);
              }
            });
          }),
      ),
    );
  }
}

const shutdownObserver = app.get(ShutdownObserver);
shutdownObserver.addHttpServer(httpServer);
shutdownObserver.addHttpServer(httpsServer);
`),t()()(),n(55,"blockquote",8)(56,"strong"),e(57,"Hint"),t(),e(58," The "),n(59,"code"),e(60,"ExpressAdapter"),t(),e(61," is imported from the "),n(62,"code"),e(63,"@nestjs/platform-express"),t(),e(64," package. The "),n(65,"code"),e(66,"http"),t(),e(67," and "),n(68,"code"),e(69,"https"),t(),e(70,` packages are native Node.js packages.
`),t(),n(71,"blockquote",9)(72,"strong"),e(73,"Warning"),t(),e(74," This recipe does not work with "),n(75,"a",10),e(76,"GraphQL Subscriptions"),t(),e(77,`.
`),t()())},dependencies:[u,m,x],encapsulation:2,changeDetection:0})}return i})();var q=(()=>{class i extends c{static \u0275fac=(()=>{let o;return function(a){return(o||(o=s(i)))(a||i)}})();static \u0275cmp=d({type:i,selectors:[["app-raw-body"]],features:[p],decls:167,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/faq/raw-body.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","raw-body"],[1,"warning"],["appAnchor","","id","use-with-express"],[1,"language-typescript"],["appAnchor","","id","registering-a-different-parser"],["appAnchor","","id","body-parser-size-limit"],["appAnchor","","id","use-with-fastify"],["appAnchor","","id","registering-a-different-parser-1"],["appAnchor","","id","body-parser-size-limit-1"]],template:function(r,a){r&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),l(4,"i",4),t()(),n(5,"h3",5),e(6,"Raw body"),t(),n(7,"p"),e(8,"One of the most common use-case for having access to the raw request body is performing webhook signature verifications. Usually to perform webhook signature validations the unserialized request body is required to calculate an HMAC hash."),t(),n(9,"blockquote",6)(10,"strong"),e(11,"Warning"),t(),e(12," This feature can be used only if the built-in global body parser middleware is enabled, ie., you must not pass "),n(13,"code"),e(14,"bodyParser: false"),t(),e(15,` when creating the app.
`),t(),n(16,"h4",7)(17,"span"),e(18,"Use with Express"),t()(),n(19,"p"),e(20,"First enable the option when creating your Nest Express application:"),t(),n(21,"app-copy-button")(22,"pre")(23,"code",8),e(24,`
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

// in the "bootstrap" function
const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  rawBody: true,
});
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(25,"p"),e(26,"To access the raw request body in a controller, a convenience interface "),n(27,"code"),e(28,"RawBodyRequest"),t(),e(29," is provided to expose a "),n(30,"code"),e(31,"rawBody"),t(),e(32," field on the request: use the interface "),n(33,"code"),e(34,"RawBodyRequest"),t(),e(35," type:"),t(),n(36,"app-copy-button")(37,"pre")(38,"code",8),e(39,`
import { Controller, Post, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('cats')
class CatsController {
  @Post()
  create(@Req() req: RawBodyRequest<Request>) {
    const raw = req.rawBody; // returns a \`Buffer\`.
  }
}
`),t()()(),n(40,"h4",9)(41,"span"),e(42,"Registering a different parser"),t()(),n(43,"p"),e(44,"By default, only "),n(45,"code"),e(46,"json"),t(),e(47," and "),n(48,"code"),e(49,"urlencoded"),t(),e(50," parsers are registered. If you want to register a different parser on the fly, you will need to do so explicitly."),t(),n(51,"p"),e(52,"For example, to register a "),n(53,"code"),e(54,"text"),t(),e(55," parser, you can use the following code:"),t(),n(56,"app-copy-button")(57,"pre")(58,"code",8),e(59,`
app.useBodyParser('text');
`),t()()(),n(60,"blockquote",6)(61,"strong"),e(62,"Warning"),t(),e(63," Ensure that you are providing the correct application type to the "),n(64,"code"),e(65,"NestFactory.create"),t(),e(66," call. For Express applications, the correct type is "),n(67,"code"),e(68,"NestExpressApplication"),t(),e(69,". Otherwise the "),n(70,"code"),e(71,".useBodyParser"),t(),e(72,` method will not be found.
`),t(),n(73,"h4",10)(74,"span"),e(75,"Body parser size limit"),t()(),n(76,"p"),e(77,"If your application needs to parse a body larger than the default "),n(78,"code"),e(79,"100kb"),t(),e(80," of Express, use the following:"),t(),n(81,"app-copy-button")(82,"pre")(83,"code",8),e(84,`
app.useBodyParser('json', { limit: '10mb' });
`),t()()(),n(85,"p"),e(86,"The "),n(87,"code"),e(88,".useBodyParser"),t(),e(89," method will respect the "),n(90,"code"),e(91,"rawBody"),t(),e(92," option that is passed in the application options."),t(),n(93,"h4",11)(94,"span"),e(95,"Use with Fastify"),t()(),n(96,"p"),e(97,"First enable the option when creating your Nest Fastify application:"),t(),n(98,"app-copy-button")(99,"pre")(100,"code",8),e(101,`
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

// in the "bootstrap" function
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
  {
    rawBody: true,
  },
);
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(102,"p"),e(103,"To access the raw request body in a controller, a convenience interface "),n(104,"code"),e(105,"RawBodyRequest"),t(),e(106," is provided to expose a "),n(107,"code"),e(108,"rawBody"),t(),e(109," field on the request: use the interface "),n(110,"code"),e(111,"RawBodyRequest"),t(),e(112," type:"),t(),n(113,"app-copy-button")(114,"pre")(115,"code",8),e(116,`
import { Controller, Post, RawBodyRequest, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Controller('cats')
class CatsController {
  @Post()
  create(@Req() req: RawBodyRequest<FastifyRequest>) {
    const raw = req.rawBody; // returns a \`Buffer\`.
  }
}
`),t()()(),n(117,"h4",12)(118,"span"),e(119,"Registering a different parser"),t()(),n(120,"p"),e(121,"By default, only "),n(122,"code"),e(123,"application/json"),t(),e(124," and "),n(125,"code"),e(126,"application/x-www-form-urlencoded"),t(),e(127," parsers are registered. If you want to register a different parser on the fly, you will need to do so explicitly."),t(),n(128,"p"),e(129,"For example, to register a "),n(130,"code"),e(131,"text/plain"),t(),e(132," parser, you can use the following code:"),t(),n(133,"app-copy-button")(134,"pre")(135,"code",8),e(136,`
app.useBodyParser('text/plain');
`),t()()(),n(137,"blockquote",6)(138,"strong"),e(139,"Warning"),t(),e(140," Ensure that you are providing the correct application type to the "),n(141,"code"),e(142,"NestFactory.create"),t(),e(143," call. For Fastify applications, the correct type is "),n(144,"code"),e(145,"NestFastifyApplication"),t(),e(146,". Otherwise the "),n(147,"code"),e(148,".useBodyParser"),t(),e(149,` method will not be found.
`),t(),n(150,"h4",13)(151,"span"),e(152,"Body parser size limit"),t()(),n(153,"p"),e(154,"If your application needs to parse a body larger than the default 1MiB of Fastify, use the following:"),t(),n(155,"app-copy-button")(156,"pre")(157,"code",8),e(158,`
const bodyLimit = 10_485_760; // 10MiB
app.useBodyParser('application/json', { bodyLimit });
`),t()()(),n(159,"p"),e(160,"The "),n(161,"code"),e(162,".useBodyParser"),t(),e(163," method will respect the "),n(164,"code"),e(165,"rawBody"),t(),e(166," option that is passed in the application options."),t()())},dependencies:[m,u],encapsulation:2,changeDetection:0})}return i})();var N=(()=>{class i extends c{static \u0275fac=(()=>{let o;return function(a){return(o||(o=s(i)))(a||i)}})();static \u0275cmp=d({type:i,selectors:[["app-request-lifecycle"]],features:[p],decls:169,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/faq/request-lifecycle.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","request-lifecycle"],["appAnchor","","id","middleware"],["routerLink","/middleware"],["appAnchor","","id","guards"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","interceptors"],["rel","nofollow","target","_blank","href","https://github.com/ReactiveX/rxjs"],["appAnchor","","id","pipes"],["appAnchor","","id","filters"],["appAnchor","","id","summary"]],template:function(r,a){r&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),l(4,"i",4),t()(),n(5,"h3",5),e(6,"Request lifecycle"),t(),n(7,"p"),e(8,"Nest applications handle requests and produce responses in a sequence we refer to as the "),n(9,"strong"),e(10,"request lifecycle"),t(),e(11,". With the use of middleware, pipes, guards, and interceptors, it can be challenging to track down where a particular piece of code executes during the request lifecycle, especially as global, controller level, and route level components come into play. In general, a request flows through middleware to guards, then to interceptors, then to pipes and finally back to interceptors on the return path (as the response is generated)."),t(),n(12,"h4",6)(13,"span"),e(14,"Middleware"),t()(),n(15,"p"),e(16,"Middleware is executed in a particular sequence. First, Nest runs globally bound middleware (such as middleware bound with "),n(17,"code"),e(18,"app.use"),t(),e(19,") and then it runs "),n(20,"a",7),e(21,"module bound middleware"),t(),e(22,", which are determined on paths. Middleware are run sequentially in the order they are bound, similar to the way middleware in Express works. In the case of middleware bound across different modules, the middleware bound to the root module will run first, and then middleware will run in the order that the modules are added to the imports array."),t(),n(23,"h4",8)(24,"span"),e(25,"Guards"),t()(),n(26,"p"),e(27,"Guard execution starts with global guards, then proceeds to controller guards, and finally to route guards. As with middleware, guards run in the order in which they are bound. For example:"),t(),n(28,"app-copy-button")(29,"pre")(30,"code",9),e(31,`
@UseGuards(Guard1, Guard2)
@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @UseGuards(Guard3)
  @Get()
  getCats(): Cats[] {
    return this.catsService.getCats();
  }
}
`),t()()(),n(32,"p")(33,"code"),e(34,"Guard1"),t(),e(35," will execute before "),n(36,"code"),e(37,"Guard2"),t(),e(38," and both will execute before "),n(39,"code"),e(40,"Guard3"),t(),e(41,"."),t(),n(42,"blockquote",10)(43,"strong"),e(44,"Hint"),t(),e(45," When speaking about globally bound vs controller or locally bound, the difference is where the guard (or other component is bound). If you are using "),n(46,"code"),e(47,"app.useGlobalGuards()"),t(),e(48,` or providing the component via a module, it is globally bound. Otherwise, it is bound to a controller if the decorator precedes a controller class, or to a route if the decorator precedes a route declaration.
`),t(),n(49,"h4",11)(50,"span"),e(51,"Interceptors"),t()(),n(52,"p"),e(53,"Interceptors, for the most part, follow the same pattern as guards, with one catch: as interceptors return "),n(54,"a",12),e(55,"RxJS Observables"),t(),e(56,", the observables will be resolved in a first in last out manner. So inbound requests will go through the standard global, controller, route level resolution, but the response side of the request (i.e., after returning from the controller method handler) will be resolved from route to controller to global. Also, any errors thrown by pipes, controllers, or services can be read in the "),n(57,"code"),e(58,"catchError"),t(),e(59," operator of an interceptor."),t(),n(60,"h4",13)(61,"span"),e(62,"Pipes"),t()(),n(63,"p"),e(64,"Pipes follow the standard global to controller to route bound sequence, with the same first in first out in regards to the "),n(65,"code"),e(66,"@UsePipes()"),t(),e(67," parameters. However, at a route parameter level, if you have multiple pipes running, they will run in the order of the last parameter with a pipe to the first. This also applies to the route level and controller level pipes. For example, if we have the following controller:"),t(),n(68,"app-copy-button")(69,"pre")(70,"code",9),e(71,`
@UsePipes(GeneralValidationPipe)
@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @UsePipes(RouteSpecificPipe)
  @Patch(':id')
  updateCat(
    @Body() body: UpdateCatDTO,
    @Param() params: UpdateCatParams,
    @Query() query: UpdateCatQuery,
  ) {
    return this.catsService.updateCat(body, params, query);
  }
}
`),t()()(),n(72,"p"),e(73,"then the "),n(74,"code"),e(75,"GeneralValidationPipe"),t(),e(76," will run for the "),n(77,"code"),e(78,"query"),t(),e(79,", then the "),n(80,"code"),e(81,"params"),t(),e(82,", and then the "),n(83,"code"),e(84,"body"),t(),e(85," objects before moving on to the "),n(86,"code"),e(87,"RouteSpecificPipe"),t(),e(88,", which follows the same order. If any parameter-specific pipes were in place, they would run (again, from the last to first parameter) after the controller and route level pipes."),t(),n(89,"h4",14)(90,"span"),e(91,"Filters"),t()(),n(92,"p"),e(93,"Filters are the only component that do not resolve global first. Instead, filters resolve from the lowest level possible, meaning execution starts with any route bound filters and proceeding next to controller level, and finally to global filters. Note that exceptions cannot be passed from filter to filter; if a route level filter catches the exception, a controller or global level filter cannot catch the same exception. The only way to achieve an effect like this is to use inheritance between the filters."),t(),n(94,"blockquote",10)(95,"strong"),e(96,"Hint"),t(),e(97," Filters are only executed if any uncaught exception occurs during the request process. Caught exceptions, such as those caught with a "),n(98,"code"),e(99,"try/catch"),t(),e(100,` will not trigger Exception Filters to fire. As soon as an uncaught exception is encountered, the rest of the lifecycle is ignored and the request skips straight to the filter.
`),t(),n(101,"h4",15)(102,"span"),e(103,"Summary"),t()(),n(104,"p"),e(105,"In general, the request lifecycle looks like the following:"),t(),n(106,"ol")(107,"li"),e(108,"Incoming request"),t(),n(109,"li"),e(110,"Middleware"),n(111,"ul")(112,"li"),e(113,"2.1. Globally bound middleware"),t(),n(114,"li"),e(115,"2.2. Module bound middleware"),t()()(),n(116,"li"),e(117,"Guards"),n(118,"ul")(119,"li"),e(120,"3.1 Global guards"),t(),n(121,"li"),e(122,"3.2 Controller guards"),t(),n(123,"li"),e(124,"3.3 Route guards"),t()()(),n(125,"li"),e(126,"Interceptors (pre-controller)"),n(127,"ul")(128,"li"),e(129,"4.1 Global interceptors"),t(),n(130,"li"),e(131,"4.2 Controller interceptors"),t(),n(132,"li"),e(133,"4.3 Route interceptors"),t()()(),n(134,"li"),e(135,"Pipes"),n(136,"ul")(137,"li"),e(138,"5.1 Global pipes"),t(),n(139,"li"),e(140,"5.2 Controller pipes"),t(),n(141,"li"),e(142,"5.3 Route pipes"),t(),n(143,"li"),e(144,"5.4 Route parameter pipes"),t()()(),n(145,"li"),e(146,"Controller (method handler)"),t(),n(147,"li"),e(148,"Service (if exists)"),t(),n(149,"li"),e(150,"Interceptors (post-request)"),n(151,"ul")(152,"li"),e(153,"8.1 Route interceptor"),t(),n(154,"li"),e(155,"8.2 Controller interceptor"),t(),n(156,"li"),e(157,"8.3 Global interceptor"),t()()(),n(158,"li"),e(159,"Exception filters"),n(160,"ul")(161,"li"),e(162,"9.1 route"),t(),n(163,"li"),e(164,"9.2 controller"),t(),n(165,"li"),e(166,"9.3 global"),t()()(),n(167,"li"),e(168,"Server response"),t()()())},dependencies:[m,x,u],encapsulation:2,changeDetection:0})}return i})();var R=(()=>{class i extends c{static \u0275fac=(()=>{let o;return function(a){return(o||(o=s(i)))(a||i)}})();static \u0275cmp=d({type:i,selectors:[["app-serverless"]],features:[p],decls:403,vars:4,consts:[["contentReference",""],["app22477c22d35808585bd807538f7da8efba2423b3",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/faq/serverless.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","serverless"],["rel","nofollow","target","_blank","href","https://en.wikipedia.org/wiki/Serverless_computing"],[1,"info"],["appAnchor","","id","cold-start"],["routerLink","/standalone-applications"],["appAnchor","","id","benchmarks"],[1,"language-typescript"],["routerLink","/cli/overview"],[1,"language-javascript"],["appAnchor","","id","runtime-optimizations"],["routerLink","/fundamentals/async-providers"],["routerLink","/fundamentals/lazy-loading-modules"],["appAnchor","","id","example-integration"],["rel","nofollow","target","_blank","href","https://www.serverless.com/"],[1,"language-bash"],[1,"language-yaml"],["rel","nofollow","target","_blank","href","https://www.serverless.com/framework/docs/"],["href","/cli/monorepo#monorepo-mode"],[1,"warning"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/swagger/issues/199"],[1,"language-json"],["appAnchor","","id","using-standalone-application-feature"],[1,"with-heading"],[1,"filename"]],template:function(r,a){if(r&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),l(4,"i",5),t()(),n(5,"h3",6),e(6,"Serverless"),t(),n(7,"p"),e(8,"Serverless computing is a cloud computing execution model in which the cloud provider allocates machine resources on-demand, taking care of the servers on behalf of their customers. When an app is not in use, there are no computing resources allocated to the app. Pricing is based on the actual amount of resources consumed by an application ("),n(9,"a",7),e(10,"source"),t(),e(11,")."),t(),n(12,"p"),e(13,"With a "),n(14,"strong"),e(15,"serverless architecture"),t(),e(16,", you focus purely on the individual functions in your application code. Services such as AWS Lambda, Google Cloud Functions, and Microsoft Azure Functions take care of all the physical hardware, virtual machine operating system, and web server software management."),t(),n(17,"blockquote",8)(18,"strong"),e(19,"Hint"),t(),e(20,` This chapter does not cover the pros and cons of serverless functions nor dives into the specifics of any cloud providers.
`),t(),n(21,"h4",9)(22,"span"),e(23,"Cold start"),t()(),n(24,"p"),e(25,`A cold start is the first time your code has been executed in a while. Depending on a cloud provider you use, it may span several different operations, from downloading the code and bootstrapping the runtime to eventually running your code.
This process adds `),n(26,"strong"),e(27,"significant latency"),t(),e(28," depending on several factors, the language, the number of packages your application require, etc."),t(),n(29,"p"),e(30,"The cold start is important and although there are things which are beyond our control, there's still a lot of things we can do on our side to make it as short as possible."),t(),n(31,"p"),e(32,`While you can think of Nest as a fully-fledged framework designed to be used in complex, enterprise applications,
it is also `),n(33,"strong"),e(34,'suitable for much "simpler" applications'),t(),e(35," (or scripts). For example, with the use of "),n(36,"a",10),e(37,"Standalone applications"),t(),e(38," feature, you can take advantage of Nest's DI system in simple workers, CRON jobs, CLIs, or serverless functions."),t(),n(39,"h4",11)(40,"span"),e(41,"Benchmarks"),t()(),n(42,"p"),e(43,"To better understand what's the cost of using Nest or other, well-known libraries (like "),n(44,"code"),e(45,"express"),t(),e(46,") in the context of serverless functions, let's compare how much time Node runtime needs to run the following scripts:"),t(),n(47,"app-copy-button")(48,"pre")(49,"code",12),e(50,`
// #1 Express
import * as express from 'express';

async function bootstrap() {
  const app = express();
  app.get('/', (req, res) => res.send('Hello world!'));
  await new Promise<void>((resolve) => app.listen(3000, resolve));
}
bootstrap();

// #2 Nest (with @nestjs/platform-express)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

// #3 Nest as a Standalone application (no HTTP server)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  console.log(app.get(AppService).getHello());
}
bootstrap();

// #4 Raw Node.js script
async function bootstrap() {
  console.log('Hello world!');
}
bootstrap();
`),t()()(),n(51,"p"),e(52,"For all these scripts, we used the "),n(53,"code"),e(54,"tsc"),t(),e(55," (TypeScript) compiler and so the code remains unbundled ("),n(56,"code"),e(57,"webpack"),t(),e(58," isn't used)."),t(),n(59,"table"),l(60,"thead"),n(61,"tbody")(62,"tr")(63,"td"),e(64,"Express"),t(),n(65,"td"),e(66,"0.0079s (7.9ms)"),t()(),n(67,"tr")(68,"td"),e(69,"Nest with "),n(70,"code"),e(71,"@nestjs/platform-express"),t()(),n(72,"td"),e(73,"0.1974s (197.4ms)"),t()(),n(74,"tr")(75,"td"),e(76,"Nest (standalone application)"),t(),n(77,"td"),e(78,"0.1117s (111.7ms)"),t()(),n(79,"tr")(80,"td"),e(81,"Raw Node.js script"),t(),n(82,"td"),e(83,"0.0071s (7.1ms)"),t()()()(),n(84,"blockquote",8)(85,"strong"),e(86,"Note"),t(),e(87,` Machine: MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD.
`),t(),n(88,"p"),e(89,"Now, let's repeat all benchmarks but this time, using "),n(90,"code"),e(91,"webpack"),t(),e(92," (if you have "),n(93,"a",13),e(94,"Nest CLI"),t(),e(95," installed, you can run "),n(96,"code"),e(97,"nest build --webpack"),t(),e(98,`) to bundle our application into a single executable JavaScript file.
However, instead of using the default `),n(99,"code"),e(100,"webpack"),t(),e(101," configuration that Nest CLI ships with, we'll make sure to bundle all dependencies ("),n(102,"code"),e(103,"node_modules"),t(),e(104,") together, as follows:"),t(),n(105,"pre")(106,"code",14),e(107,`
module.exports = (options, webpack) => {
  const lazyImports = [
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
  ];

  return {
    ...options,
    externals: [],
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (lazyImports.includes(resource)) {
            try {
              require.resolve(resource);
            } catch (err) {
              return true;
            }
          }
          return false;
        },
      }),
    ],
  };
};
`),t()(),n(108,"blockquote",8)(109,"strong"),e(110,"Hint"),t(),e(111," To instruct Nest CLI to use this configuration, create a new "),n(112,"code"),e(113,"webpack.config.js"),t(),e(114,` file in the root directory of your project.
`),t(),n(115,"p"),e(116,"With this configuration, we received the following results:"),t(),n(117,"table"),l(118,"thead"),n(119,"tbody")(120,"tr")(121,"td"),e(122,"Express"),t(),n(123,"td"),e(124,"0.0068s (6.8ms)"),t()(),n(125,"tr")(126,"td"),e(127,"Nest with "),n(128,"code"),e(129,"@nestjs/platform-express"),t()(),n(130,"td"),e(131,"0.0815s (81.5ms)"),t()(),n(132,"tr")(133,"td"),e(134,"Nest (standalone application)"),t(),n(135,"td"),e(136,"0.0319s (31.9ms)"),t()(),n(137,"tr")(138,"td"),e(139,"Raw Node.js script"),t(),n(140,"td"),e(141,"0.0066s (6.6ms)"),t()()()(),n(142,"blockquote",8)(143,"strong"),e(144,"Note"),t(),e(145,` Machine: MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD.
`),t(),n(146,"blockquote",8)(147,"strong"),e(148,"Hint"),t(),e(149," You could optimize it even further by applying additional code minification & optimization techniques (using "),n(150,"code"),e(151,"webpack"),t(),e(152,` plugins, etc.).
`),t(),n(153,"p"),e(154,"As you can see, the way you compile (and whether you bundle your code) is crucial and has a significant impact on the overall startup time. With "),n(155,"code"),e(156,"webpack"),t(),e(157,", you can get the bootstrap time of a standalone Nest application (starter project with one module, controller, and service) down to ~32ms on average, and down to ~81.5ms for a regular HTTP, express-based NestJS app."),t(),n(158,"p"),e(159,"For more complicated Nest applications, for example, with 10 resources (generated through "),n(160,"code"),e(161,"$ nest g resource"),t(),e(162," schematic = 10 modules, 10 controllers, 10 services, 20 DTO classes, 50 HTTP endpoints + "),n(163,"code"),e(164,"AppModule"),t(),e(165,"), the overall startup on MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD is approximately 0.1298s (129.8ms). Running a monolithic application as a serverless function typically doesn't make too much sense anyway, so think of this benchmark more as an example of how the bootstrap time may potentially increase as your application grows."),t(),n(166,"h4",15)(167,"span"),e(168,"Runtime optimizations"),t()(),n(169,"p"),e(170,"Thus far we covered compile-time optimizations. These are unrelated to the way you define providers and load Nest modules in your application, and that plays an essential role as your application gets bigger."),t(),n(171,"p"),e(172,"For example, imagine having a database connection defined as an "),n(173,"a",16),e(174,"asynchronous provider"),t(),e(175,`. Async providers are designed to delay the application start until one or more asynchronous tasks are completed.
That means, if your serverless function on average requires 2s to connect to the database (on bootstrap), your endpoint will need at least two extra seconds (because it must wait till the connection is established) to send a response back (when it's a cold start and your application wasn't running already).`),t(),n(176,"p"),e(177,"As you can see, the way you structure your providers is somewhat different in a "),n(178,"strong"),e(179,"serverless environment"),t(),e(180,` where bootstrap time is important.
Another good example is if you use Redis for caching, but only in certain scenarios. Perhaps, in this case, you should not define a Redis connection as an async provider, as it would slow down the bootstrap time, even if it's not required for this specific function invocation.`),t(),n(181,"p"),e(182,"Also, sometimes you could lazy load entire modules, using the "),n(183,"code"),e(184,"LazyModuleLoader"),t(),e(185," class, as described in "),n(186,"a",17),e(187,"this chapter"),t(),e(188,`. Caching is a great example here too.
Imagine that your application has, let's say, `),n(189,"code"),e(190,"CacheModule"),t(),e(191," which internally connects to Redis and also, exports the "),n(192,"code"),e(193,"CacheService"),t(),e(194,` to interact with the Redis storage. If you don't need it for all potential function invocations,
you can just load it on-demand, lazily. This way you'll get a faster startup time (when a cold start occurs) for all invocations that don't require caching.`),t(),n(195,"app-copy-button")(196,"pre")(197,"code",12),e(198,`
if (request.method === RequestMethod[RequestMethod.GET]) {
  const { CacheModule } = await import('./cache.module');
  const moduleRef = await this.lazyModuleLoader.load(() => CacheModule);

  const { CacheService } = await import('./cache.service');
  const cacheService = moduleRef.get(CacheService);

  return cacheService.get(ENDPOINT_KEY);
}
`),t()()(),n(199,"p"),e(200,`Another great example is a webhook or worker, which depending on some specific conditions (e.g., input arguments), may perform different operations.
In such a case, you could specify a condition inside your route handler that lazily loads an appropriate module for the specific function invocation, and just load every other module lazily.`),t(),n(201,"app-copy-button")(202,"pre")(203,"code",12),e(204,`
if (workerType === WorkerType.A) {
  const { WorkerAModule } = await import('./worker-a.module');
  const moduleRef = await this.lazyModuleLoader.load(() => WorkerAModule);
  // ...
} else if (workerType === WorkerType.B) {
  const { WorkerBModule } = await import('./worker-b.module');
  const moduleRef = await this.lazyModuleLoader.load(() => WorkerBModule);
  // ...
}
`),t()()(),n(205,"h4",18)(206,"span"),e(207,"Example integration"),t()(),n(208,"p"),e(209,"The way your application's entry file (typically "),n(210,"code"),e(211,"main.ts"),t(),e(212," file) is supposed to look like "),n(213,"strong"),e(214,"depends on several factors"),t(),e(215," and so "),n(216,"strong"),e(217,"there's no single template"),t(),e(218,` that just works for every scenario.
For example, the initialization file required to spin up your serverless function varies by cloud providers (AWS, Azure, GCP, etc.).
Also, depending on whether you want to run a typical HTTP application with multiple routes/endpoints or just provide a single route (or execute a specific portion of code),
your application's code will look different (for example, for the endpoint-per-function approach you could use the `),n(219,"code"),e(220,"NestFactory.createApplicationContext"),t(),e(221," instead of booting the HTTP server, setting up middleware, etc.)."),t(),n(222,"p"),e(223,"Just for illustration purposes, we'll integrate Nest (using "),n(224,"code"),e(225,"@nestjs/platform-express"),t(),e(226,` and so spinning up the whole, fully functional HTTP router)
with the `),n(227,"a",19),e(228,"Serverless"),t(),e(229," framework (in this case, targeting AWS Lambda). As we've mentioned earlier, your code will differ depending on the cloud provider you choose, and many other factors."),t(),n(230,"p"),e(231,"First, let's install the required packages:"),t(),n(232,"pre")(233,"code",20),e(234,`
$ npm i @codegenie/serverless-express aws-lambda
$ npm i -D @types/aws-lambda serverless-offline
`),t()(),n(235,"blockquote",8)(236,"strong"),e(237,"Hint"),t(),e(238," To speed up development cycles, we install the "),n(239,"code"),e(240,"serverless-offline"),t(),e(241,` plugin which emulates AWS \u03BB and API Gateway.
`),t(),n(242,"p"),e(243,"Once the installation process is complete, let's create the "),n(244,"code"),e(245,"serverless.yml"),t(),e(246," file to configure the Serverless framework:"),t(),n(247,"pre")(248,"code",21),e(249,`
service: serverless-example

plugins:
  - serverless-offline

provider:
  name: aws
  runtime: nodejs14.x

functions:
  main:
    handler: dist/main.handler
    events:
      - http:
          method: ANY
          path: /
      - http:
          method: ANY
          path: '{proxy+}'
`),t()(),n(250,"blockquote",8)(251,"strong"),e(252,"Hint"),t(),e(253," To learn more about the Serverless framework, visit the "),n(254,"a",22),e(255,"official documentation"),t(),e(256,`.
`),t(),n(257,"p"),e(258,"With this in place, we can now navigate to the "),n(259,"code"),e(260,"main.ts"),t(),e(261," file and update our bootstrap code with the required boilerplate:"),t(),n(262,"app-copy-button")(263,"pre")(264,"code",12),e(265,`
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
`),t()()(),n(266,"blockquote",8)(267,"strong"),e(268,"Hint"),t(),e(269," For creating multiple serverless functions and sharing common modules between them, we recommend using the "),n(270,"a",23),e(271,"CLI Monorepo mode"),t(),e(272,`.
`),t(),n(273,"blockquote",24)(274,"strong"),e(275,"Warning"),t(),e(276," If you use "),n(277,"code"),e(278,"@nestjs/swagger"),t(),e(279," package, there are a few additional steps required to make it work properly in the context of serverless function. Check out this "),n(280,"a",25),e(281,"thread"),t(),e(282,` for more information.
`),t(),n(283,"p"),e(284,"Next, open up the "),n(285,"code"),e(286,"tsconfig.json"),t(),e(287," file and make sure to enable the "),n(288,"code"),e(289,"esModuleInterop"),t(),e(290," option to make the "),n(291,"code"),e(292,"@codegenie/serverless-express"),t(),e(293," package load properly."),t(),n(294,"pre")(295,"code",26),e(296,`
{
  "compilerOptions": {
    ...
    "esModuleInterop": true
  }
}
`),t()(),n(297,"p"),e(298,"Now we can build our application (with "),n(299,"code"),e(300,"nest build"),t(),e(301," or "),n(302,"code"),e(303,"tsc"),t(),e(304,") and use the "),n(305,"code"),e(306,"serverless"),t(),e(307," CLI to start our lambda function locally:"),t(),n(308,"pre")(309,"code",20),e(310,`
$ npm run build
$ npx serverless offline
`),t()(),n(311,"p"),e(312,"Once the application is running, open your browser and navigate to "),n(313,"code"),e(314,"http://localhost:3000/dev/[ANY_ROUTE]"),t(),e(315," (where "),n(316,"code"),e(317,"[ANY_ROUTE]"),t(),e(318," is any endpoint registered in your application)."),t(),n(319,"p"),e(320,"In the sections above, we've shown that using "),n(321,"code"),e(322,"webpack"),t(),e(323,` and bundling your app can have significant impact on the overall bootstrap time.
However, to make it work with our example, there are a few additional configurations you must add in your `),n(324,"code"),e(325,"webpack.config.js"),t(),e(326,` file. Generally,
to make sure our `),n(327,"code"),e(328,"handler"),t(),e(329," function will be picked up, we must change the "),n(330,"code"),e(331,"output.libraryTarget"),t(),e(332," property to "),n(333,"code"),e(334,"commonjs2"),t(),e(335,"."),t(),n(336,"pre")(337,"code",14),e(338,`
return {
  ...options,
  externals: [],
  output: {
    ...options.output,
    libraryTarget: 'commonjs2',
  },
  // ... the rest of the configuration
};
`),t()(),n(339,"p"),e(340,"With this in place, you can now use "),n(341,"code"),e(342,"$ nest build --webpack"),t(),e(343," to compile your function's code (and then "),n(344,"code"),e(345,"$ npx serverless offline"),t(),e(346," to test it)."),t(),n(347,"p"),e(348,"It's also recommended (but "),n(349,"strong"),e(350,"not required"),t(),e(351," as it will slow down your build process) to install the "),n(352,"code"),e(353,"terser-webpack-plugin"),t(),e(354," package and override its configuration to keep classnames intact when minifying your production build. Not doing so can result in incorrect behavior when using "),n(355,"code"),e(356,"class-validator"),t(),e(357," within your application."),t(),n(358,"pre")(359,"code",14),e(360,`
const TerserPlugin = require('terser-webpack-plugin');

return {
  ...options,
  externals: [],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
  },
  output: {
    ...options.output,
    libraryTarget: 'commonjs2',
  },
  // ... the rest of the configuration
};
`),t()(),n(361,"h4",27)(362,"span"),e(363,"Using standalone application feature"),t()(),n(364,"p"),e(365,`Alternatively, if you want to keep your function very lightweight and you don't need any HTTP-related features (routing, but also guards, interceptors, pipes, etc.),
you can just use `),n(366,"code"),e(367,"NestFactory.createApplicationContext"),t(),e(368," (as mentioned earlier) instead of running the entire HTTP server (and "),n(369,"code"),e(370,"express"),t(),e(371," under the hood), as follows:"),t(),n(372,"app-copy-button",28)(373,"span",29),e(374),w(375,"extension"),l(376,"app-tabs",null,1),t(),n(378,"pre")(379,"code",12),e(380,`
import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { AppService } from './app.service';

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const appService = appContext.get(AppService);

  return {
    body: appService.getHello(),
    statusCode: HttpStatus.OK,
  };
};
`),t()()(),n(381,"blockquote",8)(382,"strong"),e(383,"Hint"),t(),e(384," Be aware that "),n(385,"code"),e(386,"NestFactory.createApplicationContext"),t(),e(387," does not wrap controller methods with enhancers (guard, interceptors, etc.). For this, you must use the "),n(388,"code"),e(389,"NestFactory.create"),t(),e(390,` method.
`),t(),n(391,"p"),e(392,"You could also pass the "),n(393,"code"),e(394,"event"),t(),e(395," object down to, let's say, "),n(396,"code"),e(397,"EventsService"),t(),e(398," provider that could process it and return a corresponding value (depending on the input value and your business logic)."),t(),n(399,"app-copy-button")(400,"pre")(401,"code",12),e(402,`
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const eventsService = appContext.get(EventsService);
  return eventsService.process(event);
};
`),t()()()()),r&2){let g=y(377);h(374),v(" ",k(375,1,"main",g.isJsActive),`
`)}},dependencies:[m,x,u,E,C],encapsulation:2,changeDetection:0})}return i})();var Ne=[{path:"global-prefix",component:F,data:{title:"Global prefix - FAQ"}},{path:"hybrid-application",component:P,data:{title:"Hybrid application - FAQ"}},{path:"multiple-servers",component:j,data:{title:"HTTPS & Multiple Servers - FAQ"}},{path:"http-adapter",component:M,data:{title:"HTTP adapter - FAQ"}},{path:"keep-alive-connections",component:H,data:{title:"Keep-Alive connections - FAQ"}},{path:"raw-body",component:q,data:{title:"Raw Body"}},{path:"request-lifecycle",component:N,data:{title:"Request lifecycle - FAQ"}},{path:"common-errors",component:T,data:{title:"Common errors - FAQ"}},{path:"serverless",component:R,data:{title:"Serverless - FAQ"}}];export{Ne as FAQ_ROUTES};
