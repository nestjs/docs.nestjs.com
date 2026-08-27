import{a as R}from"./chunk-QQYY3UCW.js";import{a as P}from"./chunk-HWO3INMO.js";import{a as _}from"./chunk-A6GBSRU4.js";import{a as C,b as k}from"./chunk-AO7BAPTM.js";import{G as i,L as S,Ma as w,N as g,Qa as v,Ra as E,Sa as b,V as n,W as t,X as r,ja as s,ka as o,la as e,na as c,oa as N,ua as m,va as p,y as f}from"./chunk-IPH2CUBH.js";var F=(()=>{class a extends v{static \u0275fac=(()=>{let l;return function(u){return(l||(l=f(a)))(u||a)}})();static \u0275cmp=S({type:a,selectors:[["app-async-components"]],features:[g],decls:52,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/fundamentals/async-components.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","asynchronous-providers"],[1,"language-typescript"],[1,"info"],["routerLink","/fundamentals/custom-providers"],["appAnchor","","id","injection"],["appAnchor","","id","example"],["routerLink","/recipes/sql-typeorm"]],template:function(d,u){d&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),r(4,"i",4),t()(),n(5,"h3",5),e(6,"Asynchronous providers"),t(),n(7,"p"),e(8,"At times, the application start should be delayed until one or more "),n(9,"strong"),e(10,"asynchronous tasks"),t(),e(11," are completed. For example, you may not want to start accepting requests until the connection with the database has been established. You can achieve this using asynchronous providers."),t(),n(12,"p"),e(13,"The syntax for this is to use "),n(14,"code"),e(15,"async/await"),t(),e(16," with the "),n(17,"code"),e(18,"useFactory"),t(),e(19," syntax. The factory returns a "),n(20,"code"),e(21,"Promise"),t(),e(22,", and the factory function can "),n(23,"code"),e(24,"await"),t(),e(25," asynchronous tasks. Nest will await resolution of the promise before instantiating any class that depends on (injects) such a provider."),t(),n(26,"app-copy-button")(27,"pre")(28,"code",6),e(29,`
{
  provide: 'ASYNC_CONNECTION',
  useFactory: async () => {
    const connection = await createConnection(options);
    return connection;
  },
}
`),t()()(),n(30,"blockquote",7)(31,"strong"),e(32,"Hint"),t(),e(33," Learn more about custom provider syntax "),n(34,"a",8),e(35,"here"),t(),e(36,`.
`),t(),n(37,"h4",9)(38,"span"),e(39,"Injection"),t()(),n(40,"p"),e(41,"Asynchronous providers are injected to other components by their tokens, like any other provider. In the example above, you would use the construct "),n(42,"code"),e(43,"@Inject('ASYNC_CONNECTION')"),t(),e(44,"."),t(),n(45,"h4",10)(46,"span"),e(47,"Example"),t()(),n(48,"p")(49,"a",11),e(50,"The TypeORM recipe"),t(),e(51," has a more substantial example of an asynchronous provider."),t()())},dependencies:[b,w,E],encapsulation:2,changeDetection:0})}return a})();var L=(()=>{class a extends v{static \u0275fac=(()=>{let l;return function(u){return(l||(l=f(a)))(u||a)}})();static \u0275cmp=S({type:a,selectors:[["app-circular-dependency"]],features:[g],decls:154,vars:24,consts:[["contentReference",""],["app0a677f4c76a8928c5f571bc5051c03bd5c59103c",""],["app9fbd3670d9b7222b8edb912ee3bbcc0da27bd593",""],["appc3dce5edac8c511588caff160c7d3f5ec4112463",""],["app5654f80d3017d1357a170708d358bd81a553495f",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/fundamentals/circular-dependency.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","circular-dependency"],[1,"warning"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/issues/1181#issuecomment-430197191"],["appAnchor","","id","forward-reference"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/issues/5778"],["appAnchor","","id","moduleref-class-alternative"],["routerLink","/fundamentals/module-ref"],["appAnchor","","id","module-forward-reference"]],template:function(d,u){if(d&1&&(n(0,"div",5,0)(2,"div",6)(3,"a",7),r(4,"i",8),t()(),n(5,"h3",9),e(6,"Circular dependency"),t(),n(7,"p"),e(8,"A circular dependency occurs when two classes depend on each other. For example, class A needs class B, and class B also needs class A. Circular dependencies can arise in Nest between modules and between providers."),t(),n(9,"p"),e(10,"While circular dependencies should be avoided where possible, you can't always do so. In such cases, Nest enables resolving circular dependencies between providers in two ways. In this chapter, we describe using "),n(11,"strong"),e(12,"forward referencing"),t(),e(13," as one technique, and using the "),n(14,"strong"),e(15,"ModuleRef"),t(),e(16," class to retrieve a provider instance from the DI container as another."),t(),n(17,"p"),e(18,"We also describe resolving circular dependencies between modules."),t(),n(19,"blockquote",10)(20,"strong"),e(21,"Warning"),t(),e(22,' A circular dependency might also be caused when using "barrel files"/index.ts files to group imports. Barrel files should be omitted when it comes to module/provider classes. For example, barrel files should not be used when importing files within the same directory as the barrel file, i.e. '),n(23,"code"),e(24,"cats/cats.controller"),t(),e(25," should not import "),n(26,"code"),e(27,"cats"),t(),e(28," to import the "),n(29,"code"),e(30,"cats/cats.service"),t(),e(31," file. For more details please also see "),n(32,"a",11),e(33,"this GitHub issue"),t(),e(34,`.
`),t(),n(35,"h4",12)(36,"span"),e(37,"Forward reference"),t()(),n(38,"p"),e(39,"A "),n(40,"strong"),e(41,"forward reference"),t(),e(42," allows Nest to reference classes which aren't yet defined using the "),n(43,"code"),e(44,"forwardRef()"),t(),e(45," utility function. For example, if "),n(46,"code"),e(47,"CatsService"),t(),e(48," and "),n(49,"code"),e(50,"CommonService"),t(),e(51," depend on each other, both sides of the relationship can use "),n(52,"code"),e(53,"@Inject()"),t(),e(54," and the "),n(55,"code"),e(56,"forwardRef()"),t(),e(57," utility to resolve the circular dependency. Otherwise Nest won't instantiate them because all of the essential metadata won't be available. Here's an example:"),t(),n(58,"app-copy-button",13)(59,"span",14),e(60),m(61,"extension"),r(62,"app-tabs",null,1),t(),n(64,"pre")(65,"code",15),e(66,`
@Injectable()
export class CatsService {
  constructor(
    @Inject(forwardRef(() => CommonService))
    private commonService: CommonService,
  ) {}
}
`),t()(),n(67,"pre")(68,"code",15),e(69,`
@Injectable()
@Dependencies(forwardRef(() => CommonService))
export class CatsService {
  constructor(commonService) {
    this.commonService = commonService;
  }
}
`),t()()(),n(70,"blockquote",16)(71,"strong"),e(72,"Hint"),t(),e(73," The "),n(74,"code"),e(75,"forwardRef()"),t(),e(76," function is imported from the "),n(77,"code"),e(78,"@nestjs/common"),t(),e(79,` package.
`),t(),n(80,"p"),e(81,"That covers one side of the relationship. Now let's do the same with "),n(82,"code"),e(83,"CommonService"),t(),e(84,":"),t(),n(85,"app-copy-button",13)(86,"span",14),e(87),m(88,"extension"),r(89,"app-tabs",null,2),t(),n(91,"pre")(92,"code",15),e(93,`
@Injectable()
export class CommonService {
  constructor(
    @Inject(forwardRef(() => CatsService))
    private catsService: CatsService,
  ) {}
}
`),t()(),n(94,"pre")(95,"code",15),e(96,`
@Injectable()
@Dependencies(forwardRef(() => CatsService))
export class CommonService {
  constructor(catsService) {
    this.catsService = catsService;
  }
}
`),t()()(),n(97,"blockquote",10)(98,"strong"),e(99,"Warning"),t(),e(100," The order of instantiation is indeterminate. Make sure your code does not depend on which constructor is called first. Having circular dependencies depend on providers with "),n(101,"code"),e(102,"Scope.REQUEST"),t(),e(103," can lead to undefined dependencies. More information available "),n(104,"a",17),e(105,"here"),t()(),n(106,"h4",18)(107,"span"),e(108,"ModuleRef class alternative"),t()(),n(109,"p"),e(110,"An alternative to using "),n(111,"code"),e(112,"forwardRef()"),t(),e(113," is to refactor your code and use the "),n(114,"code"),e(115,"ModuleRef"),t(),e(116," class to retrieve a provider on one side of the (otherwise) circular relationship. Learn more about the "),n(117,"code"),e(118,"ModuleRef"),t(),e(119," utility class "),n(120,"a",19),e(121,"here"),t(),e(122,"."),t(),n(123,"h4",20)(124,"span"),e(125,"Module forward reference"),t()(),n(126,"p"),e(127,"In order to resolve circular dependencies between modules, use the same "),n(128,"code"),e(129,"forwardRef()"),t(),e(130," utility function on both sides of the modules association. For example:"),t(),n(131,"app-copy-button",13)(132,"span",14),e(133),m(134,"extension"),r(135,"app-tabs",null,3),t(),n(137,"pre")(138,"code",15),e(139,`
@Module({
  imports: [forwardRef(() => CatsModule)],
})
export class CommonModule {}
`),t()()(),n(140,"p"),e(141,"That covers one side of the relationship. Now let's do the same with "),n(142,"code"),e(143,"CatsModule"),t(),e(144,":"),t(),n(145,"app-copy-button",13)(146,"span",14),e(147),m(148,"extension"),r(149,"app-tabs",null,4),t(),n(151,"pre")(152,"code",15),e(153,`
@Module({
  imports: [forwardRef(() => CommonModule)],
})
export class CatsModule {}
`),t()()()()),d&2){let h=s(63),x=s(90),y=s(136),I=s(150);i(60),c(" ",p(61,12,"cats.service",h.isJsActive),`
`),i(4),o("hide",h.isJsActive),i(3),o("hide",!h.isJsActive),i(20),c(" ",p(88,15,"common.service",x.isJsActive),`
`),i(4),o("hide",x.isJsActive),i(3),o("hide",!x.isJsActive),i(39),c(" ",p(134,18,"common.module",y.isJsActive),`
`),i(14),c(" ",p(148,21,"cats.module",I.isJsActive),`
`)}},dependencies:[E,b,C,w,k],encapsulation:2,changeDetection:0})}return a})();var B=(()=>{class a extends v{static \u0275fac=(()=>{let l;return function(u){return(l||(l=f(a)))(u||a)}})();static \u0275cmp=S({type:a,selectors:[["app-discovery-service"]],features:[g],decls:110,vars:8,consts:[["contentReference",""],["appdcd7ba097ceb939392fd356ca8d92e2760d4f49f",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/fundamentals/discovery-service.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","discovery-service"],["appAnchor","","id","getting-started"],[1,"language-typescript"],[1,"with-heading"],[1,"filename"],["appAnchor","","id","discovering-providers-and-controllers"],["appAnchor","","id","extracting-metadata"],["appAnchor","","id","conclusion"]],template:function(d,u){if(d&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),r(4,"i",5),t()(),n(5,"h3",6),e(6,"Discovery service"),t(),n(7,"p"),e(8,"The "),n(9,"code"),e(10,"DiscoveryService"),t(),e(11," provided by the "),n(12,"code"),e(13,"@nestjs/core"),t(),e(14," package is a powerful utility that allows developers to dynamically inspect and retrieve providers, controllers, and other metadata within a NestJS application. This is particularly useful when building plugins, decorators, or advanced features that rely on runtime introspection. By leveraging "),n(15,"code"),e(16,"DiscoveryService"),t(),e(17,", developers can create more flexible and modular architectures, enabling automation and dynamic behavior in their applications."),t(),n(18,"h4",7)(19,"span"),e(20,"Getting started"),t()(),n(21,"p"),e(22,"Before using "),n(23,"code"),e(24,"DiscoveryService"),t(),e(25,", you need to import the "),n(26,"code"),e(27,"DiscoveryModule"),t(),e(28," in the module where you intend to use it. This ensures that the service is available for dependency injection. Below is an example of how to configure it within a NestJS module:"),t(),n(29,"app-copy-button")(30,"pre")(31,"code",8),e(32,`
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ExampleService } from './example.service';

@Module({
  imports: [DiscoveryModule],
  providers: [ExampleService],
})
export class ExampleModule {}
`),t()()(),n(33,"p"),e(34,"Once the module is set up, "),n(35,"code"),e(36,"DiscoveryService"),t(),e(37," can be injected into any provider or service where dynamic discovery is required."),t(),n(38,"app-copy-button",9)(39,"span",10),e(40),m(41,"extension"),r(42,"app-tabs",null,1),t(),n(44,"pre")(45,"code",8),e(46,`
@Injectable()
export class ExampleService {
  constructor(private readonly discoveryService: DiscoveryService) {}
}
`),t()(),n(47,"pre")(48,"code",8),e(49,`
@Injectable()
@Dependencies(DiscoveryService)
export class ExampleService {
  constructor(discoveryService) {
    this.discoveryService = discoveryService;
  }
}
`),t()()(),n(50,"h4",11)(51,"span"),e(52,"Discovering providers and controllers"),t()(),n(53,"p"),e(54,"One of the key capabilities of "),n(55,"code"),e(56,"DiscoveryService"),t(),e(57," is retrieving all registered providers in the application. This is useful for dynamically processing providers based on specific conditions. The following snippet demonstrates how to access all providers:"),t(),n(58,"app-copy-button")(59,"pre")(60,"code",8),e(61,`
const providers = this.discoveryService.getProviders();
console.log(providers);
`),t()()(),n(62,"p"),e(63,"Each provider object contains information such as its instance, token, and metadata. Similarly, if you need to retrieve all registered controllers within the application, you can do so with:"),t(),n(64,"app-copy-button")(65,"pre")(66,"code",8),e(67,`
const controllers = this.discoveryService.getControllers();
console.log(controllers);
`),t()()(),n(68,"p"),e(69,"This feature is particularly beneficial for scenarios where controllers need to be processed dynamically, such as analytics tracking, or automatic registration mechanisms."),t(),n(70,"h4",12)(71,"span"),e(72,"Extracting metadata"),t()(),n(73,"p"),e(74,"Beyond discovering providers and controllers, "),n(75,"code"),e(76,"DiscoveryService"),t(),e(77," also enables retrieval of metadata attached to these components. This is particularly valuable when working with custom decorators that store metadata at runtime."),t(),n(78,"p"),e(79,"For example, consider a case where a custom decorator is used to tag providers with specific metadata:"),t(),n(80,"app-copy-button")(81,"pre")(82,"code",8),e(83,`
import { DiscoveryService } from '@nestjs/core';

export const FeatureFlag = DiscoveryService.createDecorator();
`),t()()(),n(84,"p"),e(85,"Applying this decorator to a service allows it to store metadata that can later be queried:"),t(),n(86,"app-copy-button")(87,"pre")(88,"code",8),e(89,`
import { Injectable } from '@nestjs/common';
import { FeatureFlag } from './custom-metadata.decorator';

@Injectable()
@FeatureFlag('experimental')
export class CustomService {}
`),t()()(),n(90,"p"),e(91,"Once metadata is attached to providers in this way, "),n(92,"code"),e(93,"DiscoveryService"),t(),e(94," makes it easy to filter providers based on assigned metadata. The following code snippet demonstrates how to retrieve providers that have been tagged with a specific metadata value:"),t(),n(95,"app-copy-button")(96,"pre")(97,"code",8),e(98,`
const providers = this.discoveryService.getProviders();

const [provider] = providers.filter(
  (item) =>
    this.discoveryService.getMetadataByDecorator(FeatureFlag, item) ===
    'experimental',
);

console.log(
  'Providers with the "experimental" feature flag metadata:',
  provider,
);
`),t()()(),n(99,"h4",13)(100,"span"),e(101,"Conclusion"),t()(),n(102,"p"),e(103,"The "),n(104,"code"),e(105,"DiscoveryService"),t(),e(106," is a versatile and powerful tool that enables runtime introspection in NestJS applications. By allowing dynamic discovery of providers, controllers, and metadata, it plays a crucial role in building extensible frameworks, plugins, and automation-driven features. Whether you need to scan and process providers, extract metadata for advanced processing, or create modular and scalable architectures, "),n(107,"code"),e(108,"DiscoveryService"),t(),e(109," provides an efficient and structured approach to achieving these goals."),t()()),d&2){let h=s(43);i(40),c(" ",p(41,5,"example.service",h.isJsActive),`
`),i(4),o("hide",h.isJsActive),i(3),o("hide",!h.isJsActive)}},dependencies:[E,b,C,k],encapsulation:2,changeDetection:0})}return a})();var H=(()=>{class a extends v{static \u0275fac=(()=>{let l;return function(u){return(l||(l=f(a)))(u||a)}})();static \u0275cmp=S({type:a,selectors:[["app-dependency-injection"]],features:[g],decls:526,vars:36,consts:[["contentReference",""],["appc647e7fbc3daa338f4f33ed0778ba5b19b7ab04e",""],["app5f2ccc399b495643481f99e009bf4ded7f31fcc7",""],["app9fb410c38a69ea5cd6dd7a164e7a79f31c0ac280",""],["app1171e474d57feab5f0473eaa618332ca37a8df7d",""],["appaa207f167680e30421e7090bd4c7b658d5276cd8",""],["app23010e6f725873904873a8640c7cbdb54e84acbe",""],["app7420e14cd02d4aba4fb7a95184125430d12b9e62",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/fundamentals/dependency-injection.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","custom-providers"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/providers#dependency-injection"],["appAnchor","","id","di-fundamentals"],["rel","nofollow","target","_blank","href","https://en.wikipedia.org/wiki/Inversion_of_control"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/providers"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["start","3"],["href","/fundamentals/custom-providers#standard-providers"],["appAnchor","","id","standard-providers"],["appAnchor","","id","custom-providers-1"],[1,"info"],["appAnchor","","id","value-providers-usevalue"],["rel","nofollow","target","_blank","href","https://www.typescriptlang.org/docs/handbook/type-compatibility.html"],["appAnchor","","id","non-class-based-provider-tokens"],["href","/fundamentals/custom-providers#di-fundamentals"],[1,"warning"],["rel","nofollow","target","_blank","href","https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol"],["rel","nofollow","target","_blank","href","https://www.typescriptlang.org/docs/handbook/enums.html"],["appAnchor","","id","interfaces-and-abstract-classes"],["appAnchor","","id","class-providers-useclass"],["appAnchor","","id","factory-providers-usefactory"],["appAnchor","","id","alias-providers-useexisting"],["appAnchor","","id","non-service-based-providers"],["appAnchor","","id","export-custom-provider"]],template:function(d,u){if(d&1&&(n(0,"div",8,0)(2,"div",9)(3,"a",10),r(4,"i",11),t()(),n(5,"h3",12),e(6,"Custom providers"),t(),n(7,"p"),e(8,"In earlier chapters, we touched on various aspects of "),n(9,"strong"),e(10,"Dependency Injection (DI)"),t(),e(11," and how it is used in Nest. One example of this is the "),n(12,"a",13),e(13,"constructor based"),t(),e(14," dependency injection used to inject instances (often service providers) into classes. You won't be surprised to learn that Dependency Injection is built into the Nest core in a fundamental way. So far, we've only explored one main pattern. As your application grows more complex, you may need to take advantage of the full features of the DI system, so let's explore them in more detail."),t(),n(15,"h4",14)(16,"span"),e(17,"DI fundamentals"),t()(),n(18,"p"),e(19,"Dependency injection is an "),n(20,"a",15),e(21,"inversion of control (IoC)"),t(),e(22," technique wherein you delegate instantiation of dependencies to the IoC container (in our case, the NestJS runtime system), instead of doing it in your own code imperatively. Let's examine what's happening in this example from the "),n(23,"a",16),e(24,"Providers chapter"),t(),e(25,"."),t(),n(26,"p"),e(27,"First, we define a provider. The "),n(28,"code"),e(29,"@Injectable()"),t(),e(30," decorator marks the "),n(31,"code"),e(32,"CatsService"),t(),e(33," class as a provider."),t(),n(34,"app-copy-button",17)(35,"span",18),e(36),m(37,"extension"),r(38,"app-tabs",null,1),t(),n(40,"pre")(41,"code",19),e(42,`
import { Injectable } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  findAll(): Cat[] {
    return this.cats;
  }
}
`),t()(),n(43,"pre")(44,"code",19),e(45,`
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatsService {
  constructor() {
    this.cats = [];
  }

  findAll() {
    return this.cats;
  }
}
`),t()()(),n(46,"p"),e(47,"Then we request that Nest inject the provider into our controller class:"),t(),n(48,"app-copy-button",17)(49,"span",18),e(50),m(51,"extension"),r(52,"app-tabs",null,2),t(),n(54,"pre")(55,"code",19),e(56,`
import { Controller, Get } from '@nestjs/common';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
`),t()(),n(57,"pre")(58,"code",19),e(59,`
import { Controller, Get, Bind, Dependencies } from '@nestjs/common';
import { CatsService } from './cats.service';

@Controller('cats')
@Dependencies(CatsService)
export class CatsController {
  constructor(catsService) {
    this.catsService = catsService;
  }

  @Get()
  async findAll() {
    return this.catsService.findAll();
  }
}
`),t()()(),n(60,"p"),e(61,"Finally, we register the provider with the Nest IoC container:"),t(),n(62,"app-copy-button",17)(63,"span",18),e(64),m(65,"extension"),r(66,"app-tabs",null,3),t(),n(68,"pre")(69,"code",19),e(70,`
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';
import { CatsService } from './cats/cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class AppModule {}
`),t()()(),n(71,"p"),e(72,"What exactly is happening under the covers to make this work? There are three key steps in the process:"),t(),n(73,"ol")(74,"li"),e(75,"In "),n(76,"code"),e(77,"cats.service.ts"),t(),e(78,", the "),n(79,"code"),e(80,"@Injectable()"),t(),e(81," decorator declares the "),n(82,"code"),e(83,"CatsService"),t(),e(84," class as a class that can be managed by the Nest IoC container."),t(),n(85,"li"),e(86,"In "),n(87,"code"),e(88,"cats.controller.ts"),t(),e(89,", "),n(90,"code"),e(91,"CatsController"),t(),e(92," declares a dependency on the "),n(93,"code"),e(94,"CatsService"),t(),e(95," token with constructor injection:"),t()(),n(96,"app-copy-button")(97,"pre")(98,"code",19),e(99,`
  constructor(private catsService: CatsService)
`),t()()(),n(100,"ol",20)(101,"li"),e(102,"In "),n(103,"code"),e(104,"app.module.ts"),t(),e(105,", we associate the token "),n(106,"code"),e(107,"CatsService"),t(),e(108," with the class "),n(109,"code"),e(110,"CatsService"),t(),e(111," from the "),n(112,"code"),e(113,"cats.service.ts"),t(),e(114," file. We'll "),n(115,"a",21),e(116,"see below"),t(),e(117," exactly how this association (also called "),n(118,"em"),e(119,"registration"),t(),e(120,") occurs."),t()(),n(121,"p"),e(122,"When the Nest IoC container instantiates a "),n(123,"code"),e(124,"CatsController"),t(),e(125,", it first looks for any dependencies*. When it finds the "),n(126,"code"),e(127,"CatsService"),t(),e(128," dependency, it performs a lookup on the "),n(129,"code"),e(130,"CatsService"),t(),e(131," token, which returns the "),n(132,"code"),e(133,"CatsService"),t(),e(134," class, per the registration step (#3 above). Assuming "),n(135,"code"),e(136,"SINGLETON"),t(),e(137," scope (the default behavior), Nest will then either create an instance of "),n(138,"code"),e(139,"CatsService"),t(),e(140,", cache it, and return it, or if one is already cached, return the existing instance."),t(),n(141,"p"),e(142,'*This explanation is a bit simplified to illustrate the point. One important area we glossed over is that the process of analyzing the code for dependencies is very sophisticated, and happens during application bootstrapping. One key feature is that dependency analysis (or "creating the dependency graph"), is '),n(143,"strong"),e(144,"transitive"),t(),e(145,". In the above example, if the "),n(146,"code"),e(147,"CatsService"),t(),e(148,' itself had dependencies, those too would be resolved. The dependency graph ensures that dependencies are resolved in the correct order - essentially "bottom up". This mechanism relieves the developer from having to manage such complex dependency graphs.'),t(),n(149,"p"),r(150,"app-banner-courses"),t(),n(151,"h4",22)(152,"span"),e(153,"Standard providers"),t()(),n(154,"p"),e(155,"Let's take a closer look at the "),n(156,"code"),e(157,"@Module()"),t(),e(158," decorator. In "),n(159,"code"),e(160,"app.module"),t(),e(161,", we declare:"),t(),n(162,"app-copy-button")(163,"pre")(164,"code",19),e(165,`
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
`),t()()(),n(166,"p"),e(167,"The "),n(168,"code"),e(169,"providers"),t(),e(170," property takes an array of "),n(171,"code"),e(172,"providers"),t(),e(173,". So far, we've supplied those providers via a list of class names. In fact, the syntax "),n(174,"code"),e(175,"providers: [CatsService]"),t(),e(176," is short-hand for the more complete syntax:"),t(),n(177,"app-copy-button")(178,"pre")(179,"code",19),e(180,`
providers: [
  {
    provide: CatsService,
    useClass: CatsService,
  },
];
`),t()()(),n(181,"p"),e(182,"Now that we see this explicit construction, we can understand the registration process. Here, we are clearly associating the token "),n(183,"code"),e(184,"CatsService"),t(),e(185," with the class "),n(186,"code"),e(187,"CatsService"),t(),e(188,". The short-hand notation is merely a convenience to simplify the most common use-case, where the token is used to request an instance of a class by the same name."),t(),n(189,"h4",23)(190,"span"),e(191,"Custom providers"),t()(),n(192,"p"),e(193,"What happens when your requirements go beyond those offered by "),n(194,"em"),e(195,"Standard providers"),t(),e(196,"? Here are a few examples:"),t(),n(197,"ul")(198,"li"),e(199,"You want to create a custom instance instead of having Nest instantiate (or return a cached instance of) a class"),t(),n(200,"li"),e(201,"You want to re-use an existing class in a second dependency"),t(),n(202,"li"),e(203,"You want to override a class with a mock version for testing"),t()(),n(204,"p"),e(205,"Nest allows you to define Custom providers to handle these cases. It provides several ways to define custom providers. Let's walk through them."),t(),n(206,"blockquote",24)(207,"strong"),e(208,"Hint"),t(),e(209," If you are having problems with dependency resolution you can set the "),n(210,"code"),e(211,"NEST_DEBUG"),t(),e(212,` environment variable and get extra dependency resolution logs during startup.
`),t(),n(213,"h4",25)(214,"span"),e(215,"Value providers: "),n(216,"code"),e(217,"useValue"),t()()(),n(218,"p"),e(219,"The "),n(220,"code"),e(221,"useValue"),t(),e(222," syntax is useful for injecting a constant value, putting an external library into the Nest container, or replacing a real implementation with a mock object. Let's say you'd like to force Nest to use a mock "),n(223,"code"),e(224,"CatsService"),t(),e(225," for testing purposes."),t(),n(226,"app-copy-button")(227,"pre")(228,"code",19),e(229,`
import { CatsService } from './cats.service';

const mockCatsService = {
  /* mock implementation
  ...
  */
};

@Module({
  imports: [CatsModule],
  providers: [
    {
      provide: CatsService,
      useValue: mockCatsService,
    },
  ],
})
export class AppModule {}
`),t()()(),n(230,"p"),e(231,"In this example, the "),n(232,"code"),e(233,"CatsService"),t(),e(234," token will resolve to the "),n(235,"code"),e(236,"mockCatsService"),t(),e(237," mock object. "),n(238,"code"),e(239,"useValue"),t(),e(240," requires a value - in this case a literal object that has the same interface as the "),n(241,"code"),e(242,"CatsService"),t(),e(243," class it is replacing. Because of TypeScript's "),n(244,"a",26),e(245,"structural typing"),t(),e(246,", you can use any object that has a compatible interface, including a literal object or a class instance instantiated with "),n(247,"code"),e(248,"new"),t(),e(249,"."),t(),n(250,"h4",27)(251,"span"),e(252,"Non-class-based provider tokens"),t()(),n(253,"p"),e(254,"So far, we've used class names as our provider tokens (the value of the "),n(255,"code"),e(256,"provide"),t(),e(257," property in a provider listed in the "),n(258,"code"),e(259,"providers"),t(),e(260," array). This is matched by the standard pattern used with "),n(261,"a",13),e(262,"constructor based injection"),t(),e(263,", where the token is also a class name. (Refer back to "),n(264,"a",28),e(265,"DI Fundamentals"),t(),e(266," for a refresher on tokens if this concept isn't entirely clear). Sometimes, we may want the flexibility to use strings or symbols as the DI token. For example:"),t(),n(267,"app-copy-button")(268,"pre")(269,"code",19),e(270,`
import { connection } from './connection';

@Module({
  providers: [
    {
      provide: 'CONNECTION',
      useValue: connection,
    },
  ],
})
export class AppModule {}
`),t()()(),n(271,"p"),e(272,"In this example, we are associating a string-valued token ("),n(273,"code"),e(274,"'CONNECTION'"),t(),e(275,") with a pre-existing "),n(276,"code"),e(277,"connection"),t(),e(278," object we've imported from an external file."),t(),n(279,"blockquote",29)(280,"strong"),e(281,"Notice"),t(),e(282," In addition to using strings as token values, you can also use JavaScript "),n(283,"a",30),e(284,"symbols"),t(),e(285," or TypeScript "),n(286,"a",31),e(287,"enums"),t(),e(288,`.
`),t(),n(289,"p"),e(290,"We've previously seen how to inject a provider using the standard "),n(291,"a",13),e(292,"constructor based injection"),t(),e(293," pattern. This pattern "),n(294,"strong"),e(295,"requires"),t(),e(296," that the dependency be declared with a class name. The "),n(297,"code"),e(298,"'CONNECTION'"),t(),e(299," custom provider uses a string-valued token. Let's see how to inject such a provider. To do so, we use the "),n(300,"code"),e(301,"@Inject()"),t(),e(302," decorator. This decorator takes a single argument - the token."),t(),n(303,"app-copy-button",17)(304,"span",18),r(305,"app-tabs",null,4),t(),n(307,"pre")(308,"code",19),e(309,`
@Injectable()
export class CatsRepository {
  constructor(@Inject('CONNECTION') connection: Connection) {}
}
`),t()(),n(310,"pre")(311,"code",19),e(312,`
@Injectable()
@Dependencies('CONNECTION')
export class CatsRepository {
  constructor(connection) {}
}
`),t()()(),n(313,"blockquote",24)(314,"strong"),e(315,"Hint"),t(),e(316," The "),n(317,"code"),e(318,"@Inject()"),t(),e(319," decorator is imported from "),n(320,"code"),e(321,"@nestjs/common"),t(),e(322,` package.
`),t(),n(323,"p"),e(324,"While we directly use the string "),n(325,"code"),e(326,"'CONNECTION'"),t(),e(327," in the above examples for illustration purposes, for clean code organization, it's best practice to define tokens in a separate file, such as "),n(328,"code"),e(329,"constants.ts"),t(),e(330,". Treat them much as you would symbols or enums that are defined in their own file and imported where needed."),t(),n(331,"h4",32)(332,"span"),e(333,"Interfaces and abstract classes"),t()(),n(334,"p"),e(335,"TypeScript types/interfaces are erased during compilation, so Nest can't reference them at runtime. This means an interface can describe the shape of a dependency, but it can't be used as a DI token by itself."),t(),n(336,"p"),e(337,"Since Nest resolves providers by runtime tokens, use a string or "),n(338,"code"),e(339,"Symbol"),t(),e(340," token when registering a provider for an interface:"),t(),n(341,"app-copy-button")(342,"pre")(343,"code",19),e(344,`
export interface LoggerService {
  log(message: string): void;
}

export const LOGGER_SERVICE = Symbol('LOGGER_SERVICE');

@Injectable()
export class PinoLoggerService implements LoggerService {
  log(message: string) {
    // implementation details
  }
}

@Module({
  providers: [
    {
      provide: LOGGER_SERVICE,
      useClass: PinoLoggerService,
    },
  ],
})
export class AppModule {}
`),t()()(),n(345,"p"),e(346,"To inject this provider, pass that token to the "),n(347,"code"),e(348,"@Inject()"),t(),e(349," decorator:"),t(),n(350,"app-copy-button")(351,"pre")(352,"code",19),e(353,`
@Injectable()
export class CatsService {
  constructor(
    @Inject(LOGGER_SERVICE)
    private readonly logger: LoggerService,
  ) {}
}
`),t()()(),n(354,"p"),e(355,"Abstract classes, unlike interfaces, exist at runtime. You can use an abstract class as both the TypeScript contract and the DI token:"),t(),n(356,"app-copy-button")(357,"pre")(358,"code",19),e(359,`
export abstract class LoggerService {
  abstract log(message: string): void;
}

@Injectable()
export class PinoLoggerService implements LoggerService {
  log(message: string) {
    // implementation details
  }
}

@Module({
  providers: [
    {
      provide: LoggerService,
      useClass: PinoLoggerService,
    },
  ],
})
export class AppModule {}
`),t()()(),n(360,"p"),e(361,"With an abstract class token, constructor-based injection can use the abstract class type directly and doesn't require "),n(362,"code"),e(363,"@Inject()"),t(),e(364,":"),t(),n(365,"app-copy-button")(366,"pre")(367,"code",19),e(368,`
@Injectable()
export class CatsService {
  constructor(private readonly logger: LoggerService) {}
}
`),t()()(),n(369,"p"),e(370,"Use string or "),n(371,"code"),e(372,"Symbol"),t(),e(373," tokens when the runtime DI token should be decoupled from a class artifact. "),n(374,"code"),e(375,"Symbol"),t(),e(376," tokens are especially useful for libraries and larger applications because each symbol has a unique runtime identity, which helps avoid accidental collisions that can occur when unrelated providers use the same string token. When using a symbol token, export it from a shared file and reuse the same symbol instance wherever the provider is registered and injected. Use abstract classes when one artifact should act as both the contract and the runtime token, and you prefer simpler constructor injection. A plain interface is still a good choice when the type is only used for compile-time checking and no DI token is needed."),t(),n(377,"h4",33)(378,"span"),e(379,"Class providers: "),n(380,"code"),e(381,"useClass"),t()()(),n(382,"p"),e(383,"The "),n(384,"code"),e(385,"useClass"),t(),e(386," syntax allows you to dynamically determine a class that a token should resolve to. For example, suppose we have an abstract (or default) "),n(387,"code"),e(388,"ConfigService"),t(),e(389," class. Depending on the current environment, we want Nest to provide a different implementation of the configuration service. The following code implements such a strategy."),t(),n(390,"app-copy-button")(391,"pre")(392,"code",19),e(393,`
const configServiceProvider = {
  provide: ConfigService,
  useClass:
    process.env.NODE_ENV === 'development'
      ? DevelopmentConfigService
      : ProductionConfigService,
};

@Module({
  providers: [configServiceProvider],
})
export class AppModule {}
`),t()()(),n(394,"p"),e(395,"Let's look at a couple of details in this code sample. You'll notice that we define "),n(396,"code"),e(397,"configServiceProvider"),t(),e(398," with a literal object first, then pass it in the module decorator's "),n(399,"code"),e(400,"providers"),t(),e(401," property. This is just a bit of code organization, but is functionally equivalent to the examples we've used thus far in this chapter."),t(),n(402,"p"),e(403,"Also, we have used the "),n(404,"code"),e(405,"ConfigService"),t(),e(406," class name as our token. For any class that depends on "),n(407,"code"),e(408,"ConfigService"),t(),e(409,", Nest will inject an instance of the provided class ("),n(410,"code"),e(411,"DevelopmentConfigService"),t(),e(412," or "),n(413,"code"),e(414,"ProductionConfigService"),t(),e(415,") overriding any default implementation that may have been declared elsewhere (e.g., a "),n(416,"code"),e(417,"ConfigService"),t(),e(418," declared with an "),n(419,"code"),e(420,"@Injectable()"),t(),e(421," decorator)."),t(),n(422,"h4",34)(423,"span"),e(424,"Factory providers: "),n(425,"code"),e(426,"useFactory"),t()()(),n(427,"p"),e(428,"The "),n(429,"code"),e(430,"useFactory"),t(),e(431," syntax allows for creating providers "),n(432,"strong"),e(433,"dynamically"),t(),e(434,". The actual provider will be supplied by the value returned from a factory function. The factory function can be as simple or complex as needed. A simple factory may not depend on any other providers. A more complex factory can itself inject other providers it needs to compute its result. For the latter case, the factory provider syntax has a pair of related mechanisms:"),t(),n(435,"ol")(436,"li"),e(437,"The factory function can accept (optional) arguments."),t(),n(438,"li"),e(439,"The (optional) "),n(440,"code"),e(441,"inject"),t(),e(442," property accepts an array of providers that Nest will resolve and pass as arguments to the factory function during the instantiation process. Also, these providers can be marked as optional. The two lists should be correlated: Nest will pass instances from the "),n(443,"code"),e(444,"inject"),t(),e(445," list as arguments to the factory function in the same order. The example below demonstrates this."),t()(),n(446,"app-copy-button",17)(447,"span",18),r(448,"app-tabs",null,5),t(),n(450,"pre")(451,"code",19),e(452,`
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: MyOptionsProvider, optionalProvider?: string) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [MyOptionsProvider, { token: 'SomeOptionalProvider', optional: true }],
  //       \\______________/             \\__________________/
  //        This provider                The provider with this token
  //        is mandatory.                can resolve to \`undefined\`.
};

@Module({
  providers: [
    connectionProvider,
    MyOptionsProvider, // class-based provider
    // { provide: 'SomeOptionalProvider', useValue: 'anything' },
  ],
})
export class AppModule {}
`),t()(),n(453,"pre")(454,"code",19),e(455,`
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider, optionalProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [MyOptionsProvider, { token: 'SomeOptionalProvider', optional: true }],
  //       \\______________/            \\__________________/
  //        This provider               The provider with this token
  //        is mandatory.               can resolve to \`undefined\`.
};

@Module({
  providers: [
    connectionProvider,
    MyOptionsProvider, // class-based provider
    // { provide: 'SomeOptionalProvider', useValue: 'anything' },
  ],
})
export class AppModule {}
`),t()()(),n(456,"h4",35)(457,"span"),e(458,"Alias providers: "),n(459,"code"),e(460,"useExisting"),t()()(),n(461,"p"),e(462,"The "),n(463,"code"),e(464,"useExisting"),t(),e(465," syntax allows you to create aliases for existing providers. This creates two ways to access the same provider. In the example below, the (string-based) token "),n(466,"code"),e(467,"'AliasedLoggerService'"),t(),e(468," is an alias for the (class-based) token "),n(469,"code"),e(470,"LoggerService"),t(),e(471,". Assume we have two different dependencies, one for "),n(472,"code"),e(473,"'AliasedLoggerService'"),t(),e(474," and one for "),n(475,"code"),e(476,"LoggerService"),t(),e(477,". If both dependencies are specified with "),n(478,"code"),e(479,"SINGLETON"),t(),e(480," scope, they'll both resolve to the same instance."),t(),n(481,"app-copy-button")(482,"pre")(483,"code",19),e(484,`
@Injectable()
class LoggerService {
  /* implementation details */
}

const loggerAliasProvider = {
  provide: 'AliasedLoggerService',
  useExisting: LoggerService,
};

@Module({
  providers: [LoggerService, loggerAliasProvider],
})
export class AppModule {}
`),t()()(),n(485,"h4",36)(486,"span"),e(487,"Non-service based providers"),t()(),n(488,"p"),e(489,"While providers often supply services, they are not limited to that usage. A provider can supply "),n(490,"strong"),e(491,"any"),t(),e(492," value. For example, a provider may supply an array of configuration objects based on the current environment, as shown below:"),t(),n(493,"app-copy-button")(494,"pre")(495,"code",19),e(496,`
const configFactory = {
  provide: 'CONFIG',
  useFactory: () => {
    return process.env.NODE_ENV === 'development' ? devConfig : prodConfig;
  },
};

@Module({
  providers: [configFactory],
})
export class AppModule {}
`),t()()(),n(497,"h4",37)(498,"span"),e(499,"Export custom provider"),t()(),n(500,"p"),e(501,"Like any provider, a custom provider is scoped to its declaring module. To make it visible to other modules, it must be exported. To export a custom provider, we can either use its token or the full provider object."),t(),n(502,"p"),e(503,"The following example shows exporting using the token:"),t(),n(504,"app-copy-button",17)(505,"span",18),r(506,"app-tabs",null,6),t(),n(508,"pre")(509,"code",19),e(510,`
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],
})
export class AppModule {}
`),t()(),n(511,"pre")(512,"code",19),e(513,`
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],
})
export class AppModule {}
`),t()()(),n(514,"p"),e(515,"Alternatively, export with the full provider object:"),t(),n(516,"app-copy-button",17)(517,"span",18),r(518,"app-tabs",null,7),t(),n(520,"pre")(521,"code",19),e(522,`
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class AppModule {}
`),t()(),n(523,"pre")(524,"code",19),e(525,`
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class AppModule {}
`),t()()()()),d&2){let h=s(39),x=s(53),y=s(67),I=s(306),j=s(449),A=s(507),M=s(519);i(36),c(" ",p(37,27,"cats.service",h.isJsActive),`
`),i(4),o("hide",h.isJsActive),i(3),o("hide",!h.isJsActive),i(7),c(" ",p(51,30,"cats.controller",x.isJsActive),`
`),i(4),o("hide",x.isJsActive),i(3),o("hide",!x.isJsActive),i(7),c(" ",p(65,33,"app.module",y.isJsActive),`
`),i(243),o("hide",I.isJsActive),i(3),o("hide",!I.isJsActive),i(140),o("hide",j.isJsActive),i(3),o("hide",!j.isJsActive),i(55),o("hide",A.isJsActive),i(3),o("hide",!A.isJsActive),i(9),o("hide",M.isJsActive),i(3),o("hide",!M.isJsActive)}},dependencies:[E,b,C,R,k],encapsulation:2,changeDetection:0})}return a})();var J=(()=>{class a extends v{static \u0275fac=(()=>{let l;return function(u){return(l||(l=f(a)))(u||a)}})();static \u0275cmp=S({type:a,selectors:[["app-dynamic-modules"]],features:[g],decls:975,vars:28,consts:[["contentReference",""],["appb137aa815217757d9eb5de3fd3261f2ea1c07cad",""],["app25861cdfe380d697cb68f3ddaa62b4dfa2537617",""],["app67f8bc4e8a29f61afe09215a3318ddbae9d6ced6",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/fundamentals/dynamic-modules.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","dynamic-modules"],["routerLink","/modules"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/modules#dynamic-modules"],["appAnchor","","id","introduction"],["routerLink","/providers"],["routerLink","/controllers"],[1,"language-typescript"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/custom-providers"],["appAnchor","","id","dynamic-module-use-case"],["appAnchor","","id","config-module-example"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/techniques/configuration#service"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/25-dynamic-modules"],[1,"info"],["appAnchor","","id","module-configuration"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/custom-providers#non-service-based-providers"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/custom-providers#non-class-based-provider-tokens"],["appAnchor","","id","example"],["appAnchor","","id","community-guidelines"],["appAnchor","","id","configurable-module-builder"],[1,"with-heading"],[1,"filename"],["href","/fundamentals/dynamic-modules#custom-method-key"],["appAnchor","","id","custom-method-key"],["appAnchor","","id","custom-options-factory-class"],["appAnchor","","id","extra-options"],["href","/modules#dynamic-modules"],["appAnchor","","id","extending-auto-generated-methods"]],template:function(d,u){if(d&1&&(n(0,"div",4,0)(2,"div",5)(3,"a",6),r(4,"i",7),t()(),n(5,"h3",8),e(6,"Dynamic modules"),t(),n(7,"p"),e(8,"The "),n(9,"a",9),e(10,"Modules chapter"),t(),e(11," covers the basics of Nest modules, and includes a brief introduction to "),n(12,"a",10),e(13,"dynamic modules"),t(),e(14,". This chapter expands on the subject of dynamic modules. Upon completion, you should have a good grasp of what they are and how and when to use them."),t(),n(15,"h4",11)(16,"span"),e(17,"Introduction"),t()(),n(18,"p"),e(19,"Most application code examples in the "),n(20,"strong"),e(21,"Overview"),t(),e(22," section of the documentation make use of regular, or static, modules. Modules define groups of components like "),n(23,"a",12),e(24,"providers"),t(),e(25," and "),n(26,"a",13),e(27,"controllers"),t(),e(28," that fit together as a modular part of an overall application. They provide an execution context, or scope, for these components. For example, providers defined in a module are visible to other members of the module without the need to export them. When a provider needs to be visible outside of a module, it is first exported from its host module, and then imported into its consuming module."),t(),n(29,"p"),e(30,"Let's walk through a familiar example."),t(),n(31,"p"),e(32,"First, we'll define a "),n(33,"code"),e(34,"UsersModule"),t(),e(35," to provide and export a "),n(36,"code"),e(37,"UsersService"),t(),e(38,". "),n(39,"code"),e(40,"UsersModule"),t(),e(41," is the "),n(42,"strong"),e(43,"host"),t(),e(44," module for "),n(45,"code"),e(46,"UsersService"),t(),e(47,"."),t(),n(48,"app-copy-button")(49,"pre")(50,"code",14),e(51,`
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
`),t()()(),n(52,"p"),e(53,"Next, we'll define an "),n(54,"code"),e(55,"AuthModule"),t(),e(56,", which imports "),n(57,"code"),e(58,"UsersModule"),t(),e(59,", making "),n(60,"code"),e(61,"UsersModule"),t(),e(62,"'s exported providers available inside "),n(63,"code"),e(64,"AuthModule"),t(),e(65,":"),t(),n(66,"app-copy-button")(67,"pre")(68,"code",14),e(69,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
`),t()()(),n(70,"p"),e(71,"These constructs allow us to inject "),n(72,"code"),e(73,"UsersService"),t(),e(74," in, for example, the "),n(75,"code"),e(76,"AuthService"),t(),e(77," that is hosted in "),n(78,"code"),e(79,"AuthModule"),t(),e(80,":"),t(),n(81,"app-copy-button")(82,"pre")(83,"code",14),e(84,`
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}
  /*
    Implementation that makes use of this.usersService
  */
}
`),t()()(),n(85,"p"),e(86,"We'll refer to this as "),n(87,"strong"),e(88,"static"),t(),e(89," module binding. All the information Nest needs to wire together the modules has already been declared in the host and consuming modules. Let's unpack what's happening during this process. Nest makes "),n(90,"code"),e(91,"UsersService"),t(),e(92," available inside "),n(93,"code"),e(94,"AuthModule"),t(),e(95," by:"),t(),n(96,"ol")(97,"li"),e(98,"Instantiating "),n(99,"code"),e(100,"UsersModule"),t(),e(101,", including transitively importing other modules that "),n(102,"code"),e(103,"UsersModule"),t(),e(104," itself consumes, and transitively resolving any dependencies (see "),n(105,"a",15),e(106,"Custom providers"),t(),e(107,")."),t(),n(108,"li"),e(109,"Instantiating "),n(110,"code"),e(111,"AuthModule"),t(),e(112,", and making "),n(113,"code"),e(114,"UsersModule"),t(),e(115,"'s exported providers available to components in "),n(116,"code"),e(117,"AuthModule"),t(),e(118," (just as if they had been declared in "),n(119,"code"),e(120,"AuthModule"),t(),e(121,")."),t(),n(122,"li"),e(123,"Injecting an instance of "),n(124,"code"),e(125,"UsersService"),t(),e(126," in "),n(127,"code"),e(128,"AuthService"),t(),e(129,"."),t()(),n(130,"h4",16)(131,"span"),e(132,"Dynamic module use case"),t()(),n(133,"p"),e(134,"With static module binding, there's no opportunity for the consuming module to "),n(135,"strong"),e(136,"influence"),t(),e(137,' how providers from the host module are configured. Why does this matter? Consider the case where we have a general purpose module that needs to behave differently in different use cases. This is analogous to the concept of a "plugin" in many systems, where a generic facility requires some configuration before it can be used by a consumer.'),t(),n(138,"p"),e(139,"A good example with Nest is a "),n(140,"strong"),e(141,"configuration module"),t(),e(142,". Many applications find it useful to externalize configuration details by using a configuration module. This makes it easy to dynamically change the application settings in different deployments: e.g., a development database for developers, a staging database for the staging/testing environment, etc. By delegating the management of configuration parameters to a configuration module, the application source code remains independent of configuration parameters."),t(),n(143,"p"),e(144,`The challenge is that the configuration module itself, since it's generic (similar to a "plugin"), needs to be customized by its consuming module. This is where `),n(145,"em"),e(146,"dynamic modules"),t(),e(147," come into play. Using dynamic module features, we can make our configuration module "),n(148,"strong"),e(149,"dynamic"),t(),e(150," so that the consuming module can use an API to control how the configuration module is customized at the time it is imported."),t(),n(151,"p"),e(152,"In other words, dynamic modules provide an API for importing one module into another, and customizing the properties and behavior of that module when it is imported, as opposed to using the static bindings we've seen so far."),t(),n(153,"p"),r(154,"app-banner-devtools"),t(),n(155,"h4",17)(156,"span"),e(157,"Config module example"),t()(),n(158,"p"),e(159,"We'll be using the basic version of the example code from the "),n(160,"a",18),e(161,"configuration chapter"),t(),e(162," for this section. The completed version as of the end of this chapter is available as a working "),n(163,"a",19),e(164,"example here"),t(),e(165,"."),t(),n(166,"p"),e(167,"Our requirement is to make "),n(168,"code"),e(169,"ConfigModule"),t(),e(170," accept an "),n(171,"code"),e(172,"options"),t(),e(173," object to customize it. Here's the feature we want to support. The basic sample hard-codes the location of the "),n(174,"code"),e(175,".env"),t(),e(176," file to be in the project root folder. Let's suppose we want to make that configurable, such that you can manage your "),n(177,"code"),e(178,".env"),t(),e(179," files in any folder of your choosing. For example, imagine you want to store your various "),n(180,"code"),e(181,".env"),t(),e(182," files in a folder under the project root called "),n(183,"code"),e(184,"config"),t(),e(185," (i.e., a sibling folder to "),n(186,"code"),e(187,"src"),t(),e(188,"). You'd like to be able to choose different folders when using the "),n(189,"code"),e(190,"ConfigModule"),t(),e(191," in different projects."),t(),n(192,"p"),e(193,"Dynamic modules give us the ability to pass parameters into the module being imported so we can change its behavior. Let's see how this works. It's helpful if we start from the end-goal of how this might look from the consuming module's perspective, and then work backwards. First, let's quickly review the example of "),n(194,"em"),e(195,"statically"),t(),e(196," importing the "),n(197,"code"),e(198,"ConfigModule"),t(),e(199," (i.e., an approach which has no ability to influence the behavior of the imported module). Pay close attention to the "),n(200,"code"),e(201,"imports"),t(),e(202," array in the "),n(203,"code"),e(204,"@Module()"),t(),e(205," decorator:"),t(),n(206,"app-copy-button")(207,"pre")(208,"code",14),e(209,`
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`),t()()(),n(210,"p"),e(211,"Let's consider what a "),n(212,"em"),e(213,"dynamic module"),t(),e(214," import, where we're passing in a configuration object, might look like. Compare the difference in the "),n(215,"code"),e(216,"imports"),t(),e(217," array between these two examples:"),t(),n(218,"app-copy-button")(219,"pre")(220,"code",14),e(221,`
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule.register({ folder: './config' })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`),t()()(),n(222,"p"),e(223,"Let's see what's happening in the dynamic example above. What are the moving parts?"),t(),n(224,"ol")(225,"li")(226,"code"),e(227,"ConfigModule"),t(),e(228," is a normal class, so we can infer that it must have a "),n(229,"strong"),e(230,"static method"),t(),e(231," called "),n(232,"code"),e(233,"register()"),t(),e(234,". We know it's static because we're calling it on the "),n(235,"code"),e(236,"ConfigModule"),t(),e(237," class, not on an "),n(238,"strong"),e(239,"instance"),t(),e(240," of the class. Note: this method, which we will create soon, can have any arbitrary name, but by convention we should call it either "),n(241,"code"),e(242,"forRoot()"),t(),e(243," or "),n(244,"code"),e(245,"register()"),t(),e(246,"."),t(),n(247,"li"),e(248,"The "),n(249,"code"),e(250,"register()"),t(),e(251," method is defined by us, so we can accept any input arguments we like. In this case, we're going to accept a simple "),n(252,"code"),e(253,"options"),t(),e(254," object with suitable properties, which is the typical case."),t(),n(255,"li"),e(256,"We can infer that the "),n(257,"code"),e(258,"register()"),t(),e(259," method must return something like a "),n(260,"code"),e(261,"module"),t(),e(262," since its return value appears in the familiar "),n(263,"code"),e(264,"imports"),t(),e(265," list, which we've seen so far includes a list of modules."),t()(),n(266,"p"),e(267,"In fact, what our "),n(268,"code"),e(269,"register()"),t(),e(270," method will return is a "),n(271,"code"),e(272,"DynamicModule"),t(),e(273,". A dynamic module is nothing more than a module created at run-time, with the same exact properties as a static module, plus one additional property called "),n(274,"code"),e(275,"module"),t(),e(276,". Let's quickly review a sample static module declaration, paying close attention to the module options passed in to the decorator:"),t(),n(277,"app-copy-button")(278,"pre")(279,"code",14),e(280,`
@Module({
  imports: [DogsModule],
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService]
})
`),t()()(),n(281,"p"),e(282,"Dynamic modules must return an object with the exact same interface, plus one additional property called "),n(283,"code"),e(284,"module"),t(),e(285,". The "),n(286,"code"),e(287,"module"),t(),e(288," property serves as the name of the module, and should be the same as the class name of the module, as shown in the example below."),t(),n(289,"blockquote",20)(290,"strong"),e(291,"Hint"),t(),e(292," For a dynamic module, all properties of the module options object are optional "),n(293,"strong"),e(294,"except"),t(),n(295,"code"),e(296,"module"),t(),e(297,`.
`),t(),n(298,"p"),e(299,"What about the static "),n(300,"code"),e(301,"register()"),t(),e(302," method? We can now see that its job is to return an object that has the "),n(303,"code"),e(304,"DynamicModule"),t(),e(305," interface. When we call it, we are effectively providing a module to the "),n(306,"code"),e(307,"imports"),t(),e(308," list, similar to the way we would do so in the static case by listing a module class name. In other words, the dynamic module API simply returns a module, but rather than fix the properties in the "),n(309,"code"),e(310,"@Module"),t(),e(311," decorator, we specify them programmatically."),t(),n(312,"p"),e(313,"There are still a couple of details to cover to help make the picture complete:"),t(),n(314,"ol")(315,"li"),e(316,"We can now state that the "),n(317,"code"),e(318,"@Module()"),t(),e(319," decorator's "),n(320,"code"),e(321,"imports"),t(),e(322," property can take not only a module class name (e.g., "),n(323,"code"),e(324,"imports: [UsersModule]"),t(),e(325,"), but also a function "),n(326,"strong"),e(327,"returning"),t(),e(328," a dynamic module (e.g., "),n(329,"code"),e(330,"imports: [ConfigModule.register(...)]"),t(),e(331,")."),t(),n(332,"li"),e(333,"A dynamic module can itself import other modules. We won't do so in this example, but if the dynamic module depends on providers from other modules, you would import them using the optional "),n(334,"code"),e(335,"imports"),t(),e(336," property. Again, this is exactly analogous to the way you'd declare metadata for a static module using the "),n(337,"code"),e(338,"@Module()"),t(),e(339," decorator."),t()(),n(340,"p"),e(341,"Armed with this understanding, we can now look at what our dynamic "),n(342,"code"),e(343,"ConfigModule"),t(),e(344," declaration must look like. Let's take a crack at it."),t(),n(345,"app-copy-button")(346,"pre")(347,"code",14),e(348,`
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({})
export class ConfigModule {
  static register(): DynamicModule {
    return {
      module: ConfigModule,
      providers: [ConfigService],
      exports: [ConfigService],
    };
  }
}
`),t()()(),n(349,"p"),e(350,"It should now be clear how the pieces tie together. Calling "),n(351,"code"),e(352,"ConfigModule.register(...)"),t(),e(353," returns a "),n(354,"code"),e(355,"DynamicModule"),t(),e(356," object with properties which are essentially the same as those that, until now, we've provided as metadata via the "),n(357,"code"),e(358,"@Module()"),t(),e(359," decorator."),t(),n(360,"blockquote",20)(361,"strong"),e(362,"Hint"),t(),e(363," Import "),n(364,"code"),e(365,"DynamicModule"),t(),e(366," from "),n(367,"code"),e(368,"@nestjs/common"),t(),e(369,`.
`),t(),n(370,"p"),e(371,"Our dynamic module isn't very interesting yet, however, as we haven't introduced any capability to "),n(372,"strong"),e(373,"configure"),t(),e(374," it as we said we would like to do. Let's address that next."),t(),n(375,"h4",21)(376,"span"),e(377,"Module configuration"),t()(),n(378,"p"),e(379,"The obvious solution for customizing the behavior of the "),n(380,"code"),e(381,"ConfigModule"),t(),e(382," is to pass it an "),n(383,"code"),e(384,"options"),t(),e(385," object in the static "),n(386,"code"),e(387,"register()"),t(),e(388," method, as we guessed above. Let's look once again at our consuming module's "),n(389,"code"),e(390,"imports"),t(),e(391," property:"),t(),n(392,"app-copy-button")(393,"pre")(394,"code",14),e(395,`
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule.register({ folder: './config' })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`),t()()(),n(396,"p"),e(397,"That nicely handles passing an "),n(398,"code"),e(399,"options"),t(),e(400," object to our dynamic module. How do we then use that "),n(401,"code"),e(402,"options"),t(),e(403," object in the "),n(404,"code"),e(405,"ConfigModule"),t(),e(406,"? Let's consider that for a minute. We know that our "),n(407,"code"),e(408,"ConfigModule"),t(),e(409," is basically a host for providing and exporting an injectable service - the "),n(410,"code"),e(411,"ConfigService"),t(),e(412," - for use by other providers. It's actually our "),n(413,"code"),e(414,"ConfigService"),t(),e(415," that needs to read the "),n(416,"code"),e(417,"options"),t(),e(418," object to customize its behavior. Let's assume for the moment that we know how to somehow get the "),n(419,"code"),e(420,"options"),t(),e(421," from the "),n(422,"code"),e(423,"register()"),t(),e(424," method into the "),n(425,"code"),e(426,"ConfigService"),t(),e(427,". With that assumption, we can make a few changes to the service to customize its behavior based on the properties from the "),n(428,"code"),e(429,"options"),t(),e(430," object. ("),n(431,"strong"),e(432,"Note"),t(),e(433,": for the time being, since we "),n(434,"em"),e(435,"haven't"),t(),e(436," actually determined how to pass it in, we'll just hard-code "),n(437,"code"),e(438,"options"),t(),e(439,". We'll fix this in a minute)."),t(),n(440,"app-copy-button")(441,"pre")(442,"code",14),e(443,`
import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { EnvConfig } from './interfaces';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor() {
    const options = { folder: './config' };

    const filePath = \`\${process.env.NODE_ENV || 'development'}.env\`;
    const envFile = path.resolve(__dirname, '../../', options.folder, filePath);
    this.envConfig = dotenv.parse(fs.readFileSync(envFile));
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
`),t()()(),n(444,"p"),e(445,"Now our "),n(446,"code"),e(447,"ConfigService"),t(),e(448," knows how to find the "),n(449,"code"),e(450,".env"),t(),e(451," file in the folder we've specified in "),n(452,"code"),e(453,"options"),t(),e(454,"."),t(),n(455,"p"),e(456,"Our remaining task is to somehow inject the "),n(457,"code"),e(458,"options"),t(),e(459," object from the "),n(460,"code"),e(461,"register()"),t(),e(462," step into our "),n(463,"code"),e(464,"ConfigService"),t(),e(465,". And of course, we'll use "),n(466,"em"),e(467,"dependency injection"),t(),e(468," to do it. This is a key point, so make sure you understand it. Our "),n(469,"code"),e(470,"ConfigModule"),t(),e(471," is providing "),n(472,"code"),e(473,"ConfigService"),t(),e(474,". "),n(475,"code"),e(476,"ConfigService"),t(),e(477," in turn depends on the "),n(478,"code"),e(479,"options"),t(),e(480," object that is only supplied at run-time. So, at run-time, we'll need to first bind the "),n(481,"code"),e(482,"options"),t(),e(483," object to the Nest IoC container, and then have Nest inject it into our "),n(484,"code"),e(485,"ConfigService"),t(),e(486,". Remember from the "),n(487,"strong"),e(488,"Custom providers"),t(),e(489," chapter that providers can "),n(490,"a",22),e(491,"include any value"),t(),e(492," not just services, so we're fine using dependency injection to handle a simple "),n(493,"code"),e(494,"options"),t(),e(495," object."),t(),n(496,"p"),e(497,"Let's tackle binding the options object to the IoC container first. We do this in our static "),n(498,"code"),e(499,"register()"),t(),e(500," method. Remember that we are dynamically constructing a module, and one of the properties of a module is its list of providers. So what we need to do is define our options object as a provider. This will make it injectable into the "),n(501,"code"),e(502,"ConfigService"),t(),e(503,", which we'll take advantage of in the next step. In the code below, pay attention to the "),n(504,"code"),e(505,"providers"),t(),e(506," array:"),t(),n(507,"app-copy-button")(508,"pre")(509,"code",14),e(510,`
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({})
export class ConfigModule {
  static register(options: Record<string, any>): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        ConfigService,
      ],
      exports: [ConfigService],
    };
  }
}
`),t()()(),n(511,"p"),e(512,"Now we can complete the process by injecting the "),n(513,"code"),e(514,"'CONFIG_OPTIONS'"),t(),e(515," provider into the "),n(516,"code"),e(517,"ConfigService"),t(),e(518,". Recall that when we define a provider using a non-class token we need to use the "),n(519,"code"),e(520,"@Inject()"),t(),e(521," decorator "),n(522,"a",23),e(523,"as described here"),t(),e(524,"."),t(),n(525,"app-copy-button")(526,"pre")(527,"code",14),e(528,`
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { Injectable, Inject } from '@nestjs/common';
import { EnvConfig } from './interfaces';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(@Inject('CONFIG_OPTIONS') private options: Record<string, any>) {
    const filePath = \`\${process.env.NODE_ENV || 'development'}.env\`;
    const envFile = path.resolve(__dirname, '../../', options.folder, filePath);
    this.envConfig = dotenv.parse(fs.readFileSync(envFile));
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
`),t()()(),n(529,"p"),e(530,"One final note: for simplicity we used a string-based injection token ("),n(531,"code"),e(532,"'CONFIG_OPTIONS'"),t(),e(533,") above, but best practice is to define it as a constant (or "),n(534,"code"),e(535,"Symbol"),t(),e(536,") in a separate file, and import that file. For example:"),t(),n(537,"app-copy-button")(538,"pre")(539,"code",14),e(540,`
export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';
`),t()()(),n(541,"h4",24)(542,"span"),e(543,"Example"),t()(),n(544,"p"),e(545,"A full example of the code in this chapter can be found "),n(546,"a",19),e(547,"here"),t(),e(548,"."),t(),n(549,"h4",25)(550,"span"),e(551,"Community guidelines"),t()(),n(552,"p"),e(553,"You may have seen the use for methods like "),n(554,"code"),e(555,"forRoot"),t(),e(556,", "),n(557,"code"),e(558,"register"),t(),e(559,", and "),n(560,"code"),e(561,"forFeature"),t(),e(562," around some of the "),n(563,"code"),e(564,"@nestjs/"),t(),e(565," packages and may be wondering what the difference for all of these methods are. There is no hard rule about this, but the "),n(566,"code"),e(567,"@nestjs/"),t(),e(568," packages try to follow these guidelines:"),t(),n(569,"p"),e(570,"When creating a module with:"),t(),n(571,"ul")(572,"li")(573,"p")(574,"code"),e(575,"register"),t(),e(576,", you are expecting to configure a dynamic module with a specific configuration for use only by the calling module. For example, with Nest's "),n(577,"code"),e(578,"@nestjs/axios"),t(),e(579,": "),n(580,"code"),e(581),t(),e(582,". If, in another module you use "),n(583,"code"),e(584),t(),e(585,", it will have the different configuration. You can do this for as many modules as you want."),t()(),n(586,"li")(587,"p")(588,"code"),e(589,"forRoot"),t(),e(590,", you are expecting to configure a dynamic module once and reuse that configuration in multiple places (though possibly unknowingly as it's abstracted away). This is why you have one "),n(591,"code"),e(592,"GraphQLModule.forRoot()"),t(),e(593,", one "),n(594,"code"),e(595,"TypeOrmModule.forRoot()"),t(),e(596,", etc."),t()(),n(597,"li")(598,"p")(599,"code"),e(600,"forFeature"),t(),e(601,", you are expecting to use the configuration of a dynamic module's "),n(602,"code"),e(603,"forRoot"),t(),e(604," but need to modify some configuration specific to the calling module's needs (i.e. which repository this module should have access to, or the context that a logger should use.)"),t()()(),n(605,"p"),e(606,"All of these, usually, have their "),n(607,"code"),e(608,"async"),t(),e(609," counterparts as well, "),n(610,"code"),e(611,"registerAsync"),t(),e(612,", "),n(613,"code"),e(614,"forRootAsync"),t(),e(615,", and "),n(616,"code"),e(617,"forFeatureAsync"),t(),e(618,", that mean the same thing, but use Nest's Dependency Injection for the configuration as well."),t(),n(619,"h4",26)(620,"span"),e(621,"Configurable module builder"),t()(),n(622,"p"),e(623,"As manually creating highly configurable, dynamic modules that expose "),n(624,"code"),e(625,"async"),t(),e(626," methods ("),n(627,"code"),e(628,"registerAsync"),t(),e(629,", "),n(630,"code"),e(631,"forRootAsync"),t(),e(632,", etc.) is quite complicated, especially for newcomers, Nest exposes the "),n(633,"code"),e(634,"ConfigurableModuleBuilder"),t(),e(635,' class that facilitates this process and lets you construct a module "blueprint" in just a few lines of code.'),t(),n(636,"p"),e(637,"For example, let's take the example we used above ("),n(638,"code"),e(639,"ConfigModule"),t(),e(640,") and convert it to use the "),n(641,"code"),e(642,"ConfigurableModuleBuilder"),t(),e(643,". Before we start, let's make sure we create a dedicated interface that represents what options our "),n(644,"code"),e(645,"ConfigModule"),t(),e(646," takes in."),t(),n(647,"app-copy-button")(648,"pre")(649,"code",14),e(650,`
export interface ConfigModuleOptions {
  folder: string;
}
`),t()()(),n(651,"p"),e(652,"With this in place, create a new dedicated file (alongside the existing "),n(653,"code"),e(654,"config.module.ts"),t(),e(655," file) and name it "),n(656,"code"),e(657,"config.module-definition.ts"),t(),e(658,". In this file, let's utilize the "),n(659,"code"),e(660,"ConfigurableModuleBuilder"),t(),e(661," to construct "),n(662,"code"),e(663,"ConfigModule"),t(),e(664," definition."),t(),n(665,"app-copy-button",27)(666,"span",28),e(667),m(668,"extension"),r(669,"app-tabs",null,1),t(),n(671,"pre")(672,"code",14),e(673,`
import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ConfigModuleOptions } from './interfaces/config-module-options.interface';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().build();
`),t()(),n(674,"pre")(675,"code",14),e(676,`
import { ConfigurableModuleBuilder } from '@nestjs/common';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().build();
`),t()()(),n(677,"p"),e(678,"Now let's open up the "),n(679,"code"),e(680,"config.module.ts"),t(),e(681," file and modify its implementation to leverage the auto-generated "),n(682,"code"),e(683,"ConfigurableModuleClass"),t(),e(684,":"),t(),n(685,"app-copy-button")(686,"pre")(687,"code",14),e(688,`
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigurableModuleClass } from './config.module-definition';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule extends ConfigurableModuleClass {}
`),t()()(),n(689,"p"),e(690,"Extending the "),n(691,"code"),e(692,"ConfigurableModuleClass"),t(),e(693," means that "),n(694,"code"),e(695,"ConfigModule"),t(),e(696," provides now not only the "),n(697,"code"),e(698,"register"),t(),e(699," method (as previously with the custom implementation), but also the "),n(700,"code"),e(701,"registerAsync"),t(),e(702," method which allows consumers asynchronously configure that module, for example, by supplying async factories:"),t(),n(703,"app-copy-button")(704,"pre")(705,"code",14),e(706,`
@Module({
  imports: [
    ConfigModule.register({ folder: './config' }),
    // or alternatively:
    // ConfigModule.registerAsync({
    //   useFactory: () => {
    //     return {
    //       folder: './config',
    //     }
    //   },
    //   inject: [...any extra dependencies...]
    // }),
  ],
})
export class AppModule {}
`),t()()(),n(707,"p"),e(708,"The "),n(709,"code"),e(710,"registerAsync"),t(),e(711," method takes the following object as an argument:"),t(),n(712,"app-copy-button")(713,"pre")(714,"code",14),e(715,`
{
  /**
   * Injection token resolving to a class that will be instantiated as a provider.
   * The class must implement the corresponding interface.
   */
  useClass?: Type<
    ConfigurableModuleOptionsFactory<ModuleOptions, FactoryClassMethodKey>
  >;
  /**
   * Function returning options (or a Promise resolving to options) to configure the
   * module.
   */
  useFactory?: (...args: any[]) => Promise<ModuleOptions> | ModuleOptions;
  /**
   * Dependencies that a Factory may inject.
   */
  inject?: FactoryProvider['inject'];
  /**
   * Injection token resolving to an existing provider. The provider must implement
   * the corresponding interface.
   */
  useExisting?: Type<
    ConfigurableModuleOptionsFactory<ModuleOptions, FactoryClassMethodKey>
  >;
}
`),t()()(),n(716,"p"),e(717,"Let's go through the above properties one by one:"),t(),n(718,"ul")(719,"li")(720,"code"),e(721,"useFactory"),t(),e(722," - a function that returns the configuration object. It can be either synchronous or asynchronous. To inject dependencies into the factory function, use the "),n(723,"code"),e(724,"inject"),t(),e(725," property. We used this variant in the example above."),t(),n(726,"li")(727,"code"),e(728,"inject"),t(),e(729," - an array of dependencies that will be injected into the factory function. The order of the dependencies must match the order of the parameters in the factory function."),t(),n(730,"li")(731,"code"),e(732,"useClass"),t(),e(733," - a class that will be instantiated as a provider. The class must implement the corresponding interface. Typically, this is a class that provides a "),n(734,"code"),e(735,"create()"),t(),e(736," method that returns the configuration object. Read more about this in the "),n(737,"a",29),e(738,"Custom method key"),t(),e(739," section below."),t(),n(740,"li")(741,"code"),e(742,"useExisting"),t(),e(743," - a variant of "),n(744,"code"),e(745,"useClass"),t(),e(746," that allows you to use an existing provider instead of instructing Nest to create a new instance of the class. This is useful when you want to use a provider that is already registered in the module. Keep in mind that the class must implement the same interface as the one used in "),n(747,"code"),e(748,"useClass"),t(),e(749," (and so it must provide the "),n(750,"code"),e(751,"create()"),t(),e(752," method, unless you override the default method name, see "),n(753,"a",29),e(754,"Custom method key"),t(),e(755," section below)."),t()(),n(756,"p"),e(757,"Always choose one of the above options ("),n(758,"code"),e(759,"useFactory"),t(),e(760,", "),n(761,"code"),e(762,"useClass"),t(),e(763,", or "),n(764,"code"),e(765,"useExisting"),t(),e(766,"), as they are mutually exclusive."),t(),n(767,"p"),e(768,"Lastly, let's update the "),n(769,"code"),e(770,"ConfigService"),t(),e(771," class to inject the generated module options' provider instead of the "),n(772,"code"),e(773,"'CONFIG_OPTIONS'"),t(),e(774," that we used so far."),t(),n(775,"app-copy-button")(776,"pre")(777,"code",14),e(778,`
@Injectable()
export class ConfigService {
  constructor(@Inject(MODULE_OPTIONS_TOKEN) private options: ConfigModuleOptions) { ... }
}
`),t()()(),n(779,"h4",30)(780,"span"),e(781,"Custom method key"),t()(),n(782,"p")(783,"code"),e(784,"ConfigurableModuleClass"),t(),e(785," by default provides the "),n(786,"code"),e(787,"register"),t(),e(788," and its counterpart "),n(789,"code"),e(790,"registerAsync"),t(),e(791," methods. To use a different method name, use the "),n(792,"code"),e(793,"ConfigurableModuleBuilder#setClassMethodName"),t(),e(794," method, as follows:"),t(),n(795,"app-copy-button",27)(796,"span",28),e(797),m(798,"extension"),r(799,"app-tabs",null,2),t(),n(801,"pre")(802,"code",14),e(803,`
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().setClassMethodName('forRoot').build();
`),t()(),n(804,"pre")(805,"code",14),e(806,`
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().setClassMethodName('forRoot').build();
`),t()()(),n(807,"p"),e(808,"This construction will instruct "),n(809,"code"),e(810,"ConfigurableModuleBuilder"),t(),e(811," to generate a class that exposes "),n(812,"code"),e(813,"forRoot"),t(),e(814," and "),n(815,"code"),e(816,"forRootAsync"),t(),e(817," instead. Example:"),t(),n(818,"app-copy-button")(819,"pre")(820,"code",14),e(821,`
@Module({
  imports: [
    ConfigModule.forRoot({ folder: './config' }), // <-- note the use of "forRoot" instead of "register"
    // or alternatively:
    // ConfigModule.forRootAsync({
    //   useFactory: () => {
    //     return {
    //       folder: './config',
    //     }
    //   },
    //   inject: [...any extra dependencies...]
    // }),
  ],
})
export class AppModule {}
`),t()()(),n(822,"h4",31)(823,"span"),e(824,"Custom options factory class"),t()(),n(825,"p"),e(826,"Since the "),n(827,"code"),e(828,"registerAsync"),t(),e(829," method (or "),n(830,"code"),e(831,"forRootAsync"),t(),e(832," or any other name, depending on the configuration) lets consumer pass a provider definition that resolves to the module configuration, a library consumer could potentially supply a class to be used to construct the configuration object."),t(),n(833,"app-copy-button")(834,"pre")(835,"code",14),e(836,`
@Module({
  imports: [
    ConfigModule.registerAsync({
      useClass: ConfigModuleOptionsFactory,
    }),
  ],
})
export class AppModule {}
`),t()()(),n(837,"p"),e(838,"This class, by default, must provide the "),n(839,"code"),e(840,"create()"),t(),e(841," method that returns a module configuration object. However, if your library follows a different naming convention, you can change that behavior and instruct "),n(842,"code"),e(843,"ConfigurableModuleBuilder"),t(),e(844," to expect a different method, for example, "),n(845,"code"),e(846,"createConfigOptions"),t(),e(847,", using the "),n(848,"code"),e(849,"ConfigurableModuleBuilder#setFactoryMethodName"),t(),e(850," method:"),t(),n(851,"app-copy-button",27)(852,"span",28),e(853),m(854,"extension"),r(855,"app-tabs",null,3),t(),n(857,"pre")(858,"code",14),e(859,`
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().setFactoryMethodName('createConfigOptions').build();
`),t()(),n(860,"pre")(861,"code",14),e(862,`
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().setFactoryMethodName('createConfigOptions').build();
`),t()()(),n(863,"p"),e(864,"Now, "),n(865,"code"),e(866,"ConfigModuleOptionsFactory"),t(),e(867," class must expose the "),n(868,"code"),e(869,"createConfigOptions"),t(),e(870," method (instead of "),n(871,"code"),e(872,"create"),t(),e(873,"):"),t(),n(874,"app-copy-button")(875,"pre")(876,"code",14),e(877,`
@Module({
  imports: [
    ConfigModule.registerAsync({
      useClass: ConfigModuleOptionsFactory, // <-- this class must provide the "createConfigOptions" method
    }),
  ],
})
export class AppModule {}
`),t()()(),n(878,"h4",32)(879,"span"),e(880,"Extra options"),t()(),n(881,"p"),e(882,"There are edge-cases when your module may need to take extra options that determine how it is supposed to behave (a nice example of such an option is the "),n(883,"code"),e(884,"isGlobal"),t(),e(885," flag - or just "),n(886,"code"),e(887,"global"),t(),e(888,") that at the same time, shouldn't be included in the "),n(889,"code"),e(890,"MODULE_OPTIONS_TOKEN"),t(),e(891," provider (as they are irrelevant to services/providers registered within that module, for example, "),n(892,"code"),e(893,"ConfigService"),t(),e(894," does not need to know whether its host module is registered as a global module)."),t(),n(895,"p"),e(896,"In such cases, the "),n(897,"code"),e(898,"ConfigurableModuleBuilder#setExtras"),t(),e(899," method can be used. See the following example:"),t(),n(900,"app-copy-button")(901,"pre")(902,"code",14),e(903,`
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>()
    .setExtras(
      {
        isGlobal: true,
      },
      (definition, extras) => ({
        ...definition,
        global: extras.isGlobal,
      }),
    )
    .build();
`),t()()(),n(904,"p"),e(905,"In the example above, the first argument passed into the "),n(906,"code"),e(907,"setExtras"),t(),e(908,' method is an object containing default values for the "extra" properties. The second argument is a function that takes an auto-generated module definitions (with '),n(909,"code"),e(910,"provider"),t(),e(911,", "),n(912,"code"),e(913,"exports"),t(),e(914,", etc.) and "),n(915,"code"),e(916,"extras"),t(),e(917," object which represents extra properties (either specified by the consumer or defaults). The returned value of this function is a modified module definition. In this specific example, we're taking the "),n(918,"code"),e(919,"extras.isGlobal"),t(),e(920," property and assigning it to the "),n(921,"code"),e(922,"global"),t(),e(923," property of the module definition (which in turn determines whether a module is global or not, read more "),n(924,"a",33),e(925,"here"),t(),e(926,")."),t(),n(927,"p"),e(928,"Now when consuming this module, the additional "),n(929,"code"),e(930,"isGlobal"),t(),e(931," flag can be passed in, as follows:"),t(),n(932,"app-copy-button")(933,"pre")(934,"code",14),e(935,`
@Module({
  imports: [
    ConfigModule.register({
      isGlobal: true,
      folder: './config',
    }),
  ],
})
export class AppModule {}
`),t()()(),n(936,"p"),e(937,"However, since "),n(938,"code"),e(939,"isGlobal"),t(),e(940,` is declared as an "extra" property, it won't be available in the `),n(941,"code"),e(942,"MODULE_OPTIONS_TOKEN"),t(),e(943," provider:"),t(),n(944,"app-copy-button")(945,"pre")(946,"code",14),e(947,`
@Injectable()
export class ConfigService {
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) private options: ConfigModuleOptions,
  ) {
    // "options" object will not have the "isGlobal" property
    // ...
  }
}
`),t()()(),n(948,"h4",34)(949,"span"),e(950,"Extending auto-generated methods"),t()(),n(951,"p"),e(952,"The auto-generated static methods ("),n(953,"code"),e(954,"register"),t(),e(955,", "),n(956,"code"),e(957,"registerAsync"),t(),e(958,", etc.) can be extended if needed, as follows:"),t(),n(959,"app-copy-button")(960,"pre")(961,"code",14),e(962,`
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import {
  ConfigurableModuleClass,
  ASYNC_OPTIONS_TYPE,
  OPTIONS_TYPE,
} from './config.module-definition';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule extends ConfigurableModuleClass {
  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    return {
      // your custom logic here
      ...super.register(options),
    };
  }

  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return {
      // your custom logic here
      ...super.registerAsync(options),
    };
  }
}
`),t()()(),n(963,"p"),e(964,"Note the use of "),n(965,"code"),e(966,"OPTIONS_TYPE"),t(),e(967," and "),n(968,"code"),e(969,"ASYNC_OPTIONS_TYPE"),t(),e(970," types that must be exported from the module definition file:"),t(),n(971,"app-copy-button")(972,"pre")(973,"code",14),e(974,`
export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<ConfigModuleOptions>().build();
`),t()()()()),d&2){let h=s(670),x=s(800),y=s(856);i(581),N("HttpModule.register(","{"," baseUrl: 'someUrl' ","}",")"),i(3),N("HttpModule.register(","{"," baseUrl: 'somewhere else' ","}",")"),i(83),c(" ",p(668,19,"config.module-definition",h.isJsActive),`
`),i(4),o("hide",h.isJsActive),i(3),o("hide",!h.isJsActive),i(123),c(" ",p(798,22,"config.module-definition",x.isJsActive),`
`),i(4),o("hide",x.isJsActive),i(3),o("hide",!x.isJsActive),i(49),c(" ",p(854,25,"config.module-definition",y.isJsActive),`
`),i(4),o("hide",y.isJsActive),i(3),o("hide",!y.isJsActive)}},dependencies:[w,E,b,P,C,k],encapsulation:2,changeDetection:0})}return a})();var U=(()=>{class a extends v{static \u0275fac=(()=>{let l;return function(u){return(l||(l=f(a)))(u||a)}})();static \u0275cmp=S({type:a,selectors:[["app-lifecycle-events"]],features:[g],decls:315,vars:12,consts:[["contentReference",""],["app0d45eb95698b9f288fba838f5490b402410527df",""],["appccdd444fad088436485a366acd2ea574eb239df4",""],["app42e2586244ab029bf004e45281a861f22b627fea",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/fundamentals/lifecycle-events.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","lifecycle-events"],["appAnchor","","id","lifecycle-sequence"],["src","/assets/lifecycle-events.png",1,"illustrative-image"],["appAnchor","","id","lifecycle-events-1"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown"],["href","fundamentals/lifecycle-events#application-shutdown"],[1,"warning"],[1,"info"],["appAnchor","","id","usage"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["appAnchor","","id","asynchronous-initialization"],["appAnchor","","id","application-shutdown"],["rel","nofollow","target","_blank","href","https://kubernetes.io/"],["rel","nofollow","target","_blank","href","https://www.heroku.com/"],["rel","nofollow","target","_blank","href","https://nodejs.org/api/process.html#process_signal_events"],["rel","nofollow","target","_blank","href","https://docs.libuv.org/en/v1.x/signal.html"]],template:function(d,u){if(d&1&&(n(0,"div",4,0)(2,"div",5)(3,"a",6),r(4,"i",7),t()(),n(5,"h3",8),e(6,"Lifecycle Events"),t(),n(7,"p"),e(8,"A Nest application, as well as every application element, has a lifecycle managed by Nest. Nest provides "),n(9,"strong"),e(10,"lifecycle hooks"),t(),e(11," that give visibility into key lifecycle events, and the ability to act (run registered code on your modules, providers or controllers) when they occur."),t(),n(12,"h4",9)(13,"span"),e(14,"Lifecycle sequence"),t()(),n(15,"p"),e(16,"The following diagram depicts the sequence of key application lifecycle events, from the time the application is bootstrapped until the node process exits. We can divide the overall lifecycle into three phases: "),n(17,"strong"),e(18,"initializing"),t(),e(19,", "),n(20,"strong"),e(21,"running"),t(),e(22," and "),n(23,"strong"),e(24,"terminating"),t(),e(25,". Using this lifecycle, you can plan for appropriate initialization of modules and services, manage active connections, and gracefully shutdown your application when it receives a termination signal."),t(),n(26,"figure"),r(27,"img",10),t(),n(28,"h4",11)(29,"span"),e(30,"Lifecycle events"),t()(),n(31,"p"),e(32,"Lifecycle events happen during application bootstrapping and shutdown. Nest calls registered lifecycle hook methods on modules, providers and controllers at each of the following lifecycle events ("),n(33,"strong"),e(34,"shutdown hooks"),t(),e(35," need to be enabled first, as described "),n(36,"a",12),e(37,"below"),t(),e(38,"). As shown in the diagram above, Nest also calls the appropriate underlying methods to begin listening for connections, and to stop listening for connections."),t(),n(39,"p"),e(40,"In the following table, "),n(41,"code"),e(42,"onModuleInit"),t(),e(43," and "),n(44,"code"),e(45,"onApplicationBootstrap"),t(),e(46," are only triggered if you explicitly call "),n(47,"code"),e(48,"app.init()"),t(),e(49," or "),n(50,"code"),e(51,"app.listen()"),t(),e(52,"."),t(),n(53,"p"),e(54,"In the following table, "),n(55,"code"),e(56,"onModuleDestroy"),t(),e(57,", "),n(58,"code"),e(59,"beforeApplicationShutdown"),t(),e(60," and "),n(61,"code"),e(62,"onApplicationShutdown"),t(),e(63," are only triggered if you explicitly call "),n(64,"code"),e(65,"app.close()"),t(),e(66," or if the process receives a special system signal (such as SIGTERM) and you have correctly called "),n(67,"code"),e(68,"enableShutdownHooks"),t(),e(69," at application bootstrap (see below "),n(70,"strong"),e(71,"Application shutdown"),t(),e(72," part)."),t(),n(73,"table")(74,"thead")(75,"tr")(76,"th"),e(77,"Lifecycle hook method"),t(),n(78,"th"),e(79,"Lifecycle event triggering the hook method call"),t()()(),n(80,"tbody")(81,"tr")(82,"td")(83,"code"),e(84,"onModuleInit()"),t()(),n(85,"td"),e(86,"Called once the host module's dependencies have been resolved."),t()(),n(87,"tr")(88,"td")(89,"code"),e(90,"onApplicationBootstrap()"),t()(),n(91,"td"),e(92,"Called once all modules have been initialized, but before listening for connections."),t()(),n(93,"tr")(94,"td")(95,"code"),e(96,"onModuleDestroy()"),t(),e(97,"*"),t(),n(98,"td"),e(99,"Called after a termination signal (e.g., "),n(100,"code"),e(101,"SIGTERM"),t(),e(102,") has been received."),t()(),n(103,"tr")(104,"td")(105,"code"),e(106,"beforeApplicationShutdown()"),t(),e(107,"*"),t(),n(108,"td"),e(109,"Called after all "),n(110,"code"),e(111,"onModuleDestroy()"),t(),e(112," handlers have completed (Promises resolved or rejected);"),r(113,"br"),e(114,"once complete (Promises resolved or rejected), all existing connections will be closed ("),n(115,"code"),e(116,"app.close()"),t(),e(117," called)."),t()(),n(118,"tr")(119,"td")(120,"code"),e(121,"onApplicationShutdown()"),t(),e(122,"*"),t(),n(123,"td"),e(124,"Called after connections close ("),n(125,"code"),e(126,"app.close()"),t(),e(127," resolves)."),t()()()(),n(128,"p"),e(129,"* For these events, if you're not calling "),n(130,"code"),e(131,"app.close()"),t(),e(132," explicitly, you must opt-in to make them work with system signals such as "),n(133,"code"),e(134,"SIGTERM"),t(),e(135,". See "),n(136,"a",13),e(137,"Application shutdown"),t(),e(138," below."),t(),n(139,"blockquote",14)(140,"strong"),e(141,"Warning"),t(),e(142," The lifecycle hooks listed above are not triggered for "),n(143,"strong"),e(144,"request-scoped"),t(),e(145,` classes. Request-scoped classes are not tied to the application lifecycle and their lifespan is unpredictable. They are exclusively created for each request and automatically garbage-collected after the response is sent.
`),t(),n(146,"blockquote",15)(147,"strong"),e(148,"Hint"),t(),e(149," Execution order of "),n(150,"code"),e(151,"onModuleInit()"),t(),e(152," and "),n(153,"code"),e(154,"onApplicationBootstrap()"),t(),e(155,` directly depends on the order of module imports, awaiting the previous hook.
`),t(),n(156,"h4",16)(157,"span"),e(158,"Usage"),t()(),n(159,"p"),e(160,"Each lifecycle hook is represented by an interface. Interfaces are technically optional because they do not exist after TypeScript compilation. Nonetheless, it's good practice to use them in order to benefit from strong typing and editor tooling. To register a lifecycle hook, implement the appropriate interface. For example, to register a method to be called during module initialization on a particular class (e.g., Controller, Provider or Module), implement the "),n(161,"code"),e(162,"OnModuleInit"),t(),e(163," interface by supplying an "),n(164,"code"),e(165,"onModuleInit()"),t(),e(166," method, as shown below:"),t(),n(167,"app-copy-button",17)(168,"span",18),r(169,"app-tabs",null,1),t(),n(171,"pre")(172,"code",19),e(173,`
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit {
  onModuleInit() {
    console.log(\`The module has been initialized.\`);
  }
}
`),t()(),n(174,"pre")(175,"code",19),e(176,`
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  onModuleInit() {
    console.log(\`The module has been initialized.\`);
  }
}
`),t()()(),n(177,"h4",20)(178,"span"),e(179,"Asynchronous initialization"),t()(),n(180,"p"),e(181,"Both the "),n(182,"code"),e(183,"OnModuleInit"),t(),e(184," and "),n(185,"code"),e(186,"OnApplicationBootstrap"),t(),e(187," hooks allow you to defer the application initialization process (return a "),n(188,"code"),e(189,"Promise"),t(),e(190," or mark the method as "),n(191,"code"),e(192,"async"),t(),e(193," and "),n(194,"code"),e(195,"await"),t(),e(196," an asynchronous method completion in the method body)."),t(),n(197,"app-copy-button",17)(198,"span",18),r(199,"app-tabs",null,2),t(),n(201,"pre")(202,"code",19),e(203,`
async onModuleInit(): Promise<void> {
  await this.fetch();
}
`),t()(),n(204,"pre")(205,"code",19),e(206,`
async onModuleInit() {
  await this.fetch();
}
`),t()()(),n(207,"h4",21)(208,"span"),e(209,"Application shutdown"),t()(),n(210,"p"),e(211,"The "),n(212,"code"),e(213,"onModuleDestroy()"),t(),e(214,", "),n(215,"code"),e(216,"beforeApplicationShutdown()"),t(),e(217," and "),n(218,"code"),e(219,"onApplicationShutdown()"),t(),e(220," hooks are called in the terminating phase (in response to an explicit call to "),n(221,"code"),e(222,"app.close()"),t(),e(223," or upon receipt of system signals such as SIGTERM if opted-in). This feature is often used with "),n(224,"a",22),e(225,"Kubernetes"),t(),e(226," to manage containers' lifecycles, by "),n(227,"a",23),e(228,"Heroku"),t(),e(229," for dynos or similar services."),t(),n(230,"p"),e(231,"Shutdown hook listeners consume system resources, so they are disabled by default. To use shutdown hooks, you "),n(232,"strong"),e(233,"must enable listeners"),t(),e(234," by calling "),n(235,"code"),e(236,"enableShutdownHooks()"),t(),e(237,":"),t(),n(238,"app-copy-button")(239,"pre")(240,"code",19),e(241,`
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
`),t()()(),n(242,"blockquote",14)(243,"strong"),e(244,"warning"),t(),e(245," Due to inherent platform limitations, NestJS has limited support for application shutdown hooks on Windows. You can expect "),n(246,"code"),e(247,"SIGINT"),t(),e(248," to work, as well as "),n(249,"code"),e(250,"SIGBREAK"),t(),e(251," and to some extent "),n(252,"code"),e(253,"SIGHUP"),t(),e(254," - "),n(255,"a",24),e(256,"read more"),t(),e(257,". However "),n(258,"code"),e(259,"SIGTERM"),t(),e(260,` will never work on Windows because killing a process in the task manager is unconditional, "i.e., there's no way for an application to detect or prevent it". Here's some `),n(261,"a",25),e(262,"relevant documentation"),t(),e(263," from libuv to learn more about how "),n(264,"code"),e(265,"SIGINT"),t(),e(266,", "),n(267,"code"),e(268,"SIGBREAK"),t(),e(269," and others are handled on Windows. Also, see Node.js documentation of "),n(270,"a",24),e(271,"Process Signal Events"),t()(),n(272,"blockquote",15)(273,"strong"),e(274,"Info"),t(),n(275,"code"),e(276,"enableShutdownHooks"),t(),e(277," consumes memory by starting listeners. In cases where you are running multiple Nest apps in a single Node process (e.g., when running parallel tests with Jest), Node may complain about excessive listener processes. For this reason, "),n(278,"code"),e(279,"enableShutdownHooks"),t(),e(280,` is not enabled by default. Be aware of this condition when you are running multiple instances in a single Node process.
`),t(),n(281,"p"),e(282,"When the application receives a termination signal it will call any registered "),n(283,"code"),e(284,"onModuleDestroy()"),t(),e(285,", "),n(286,"code"),e(287,"beforeApplicationShutdown()"),t(),e(288,", then "),n(289,"code"),e(290,"onApplicationShutdown()"),t(),e(291," methods (in the sequence described above) with the corresponding signal as the first parameter. If a registered function awaits an asynchronous call (returns a promise), Nest will not continue in the sequence until the promise is resolved or rejected."),t(),n(292,"app-copy-button",17)(293,"span",18),r(294,"app-tabs",null,3),t(),n(296,"pre")(297,"code",19),e(298,`
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal: string) {
    console.log(signal); // e.g. "SIGINT"
  }
}
`),t()(),n(299,"pre")(300,"code",19),e(301,`
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal) {
    console.log(signal); // e.g. "SIGINT"
  }
}
`),t()()(),n(302,"blockquote",15)(303,"strong"),e(304,"Info"),t(),e(305," Calling "),n(306,"code"),e(307,"app.close()"),t(),e(308," doesn't terminate the Node process but only triggers the "),n(309,"code"),e(310,"onModuleDestroy()"),t(),e(311," and "),n(312,"code"),e(313,"onApplicationShutdown()"),t(),e(314,` hooks, so if there are some intervals, long-running background tasks, etc. the process won't be automatically terminated.
`),t()()),d&2){let h=s(170),x=s(200),y=s(295);i(171),o("hide",h.isJsActive),i(3),o("hide",!h.isJsActive),i(27),o("hide",x.isJsActive),i(3),o("hide",!x.isJsActive),i(92),o("hide",y.isJsActive),i(3),o("hide",!y.isJsActive)}},dependencies:[E,b,C],encapsulation:2,changeDetection:0})}return a})();var z=(()=>{class a extends v{static \u0275fac=(()=>{let l;return function(u){return(l||(l=f(a)))(u||a)}})();static \u0275cmp=S({type:a,selectors:[["app-module-ref"]],features:[g],decls:286,vars:58,consts:[["contentReference",""],["app3409f43ce2e240bdd709c1edda4a07d1fe2a96b2",""],["appc45ec434295d184e677cc586488d964881619352",""],["app39c919d28a82f8e37e9b3fe647c7d6234ae15cf1",""],["app15d7c627abbd23620b32f84d81086e77b5a89597",""],["appbe13d2cfb76fceb9c0b69ea7eee4b5e88d0812fa",""],["app5cbdec1e05c4dc408bd7ae8e052c5185cda15c4e",""],["app58402d6a300cafb5191300bb24811051f2d6a7a3",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/fundamentals/module-reference.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","module-reference"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","retrieving-instances"],[1,"warning"],["href","https://docs.nestjs.com/fundamentals/module-ref#resolving-scoped-providers"],["routerLink","/fundamentals/injection-scopes"],["appAnchor","","id","resolving-scoped-providers"],["appAnchor","","id","registering-request-provider"],["appAnchor","","id","getting-current-sub-tree"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/injection-scopes#request-provider"],["appAnchor","","id","instantiating-custom-classes-dynamically"]],template:function(d,u){if(d&1&&(n(0,"div",8,0)(2,"div",9)(3,"a",10),r(4,"i",11),t()(),n(5,"h3",12),e(6,"Module reference"),t(),n(7,"p"),e(8,"Nest provides the "),n(9,"code"),e(10,"ModuleRef"),t(),e(11," class to navigate the internal list of providers and obtain a reference to any provider using its injection token as a lookup key. The "),n(12,"code"),e(13,"ModuleRef"),t(),e(14," class also provides a way to dynamically instantiate both static and scoped providers. "),n(15,"code"),e(16,"ModuleRef"),t(),e(17," can be injected into a class in the normal way:"),t(),n(18,"app-copy-button",13)(19,"span",14),e(20),m(21,"extension"),r(22,"app-tabs",null,1),t(),n(24,"pre")(25,"code",15),e(26,`
@Injectable()
export class CatsService {
  constructor(private moduleRef: ModuleRef) {}
}
`),t()(),n(27,"pre")(28,"code",15),e(29,`
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }
}
`),t()()(),n(30,"blockquote",16)(31,"strong"),e(32,"Hint"),t(),e(33," The "),n(34,"code"),e(35,"ModuleRef"),t(),e(36," class is imported from the "),n(37,"code"),e(38,"@nestjs/core"),t(),e(39,` package.
`),t(),n(40,"h4",17)(41,"span"),e(42,"Retrieving instances"),t()(),n(43,"p"),e(44,"The "),n(45,"code"),e(46,"ModuleRef"),t(),e(47," instance (hereafter we'll refer to it as the "),n(48,"strong"),e(49,"module reference"),t(),e(50,") has a "),n(51,"code"),e(52,"get()"),t(),e(53," method. By default, this method returns a provider, controller, or injectable (e.g., guard, interceptor, etc.) that was registered and has been instantiated in the "),n(54,"em"),e(55,"current module"),t(),e(56," using its injection token/class name. If the instance is not found, an exception will be raised."),t(),n(57,"app-copy-button",13)(58,"span",14),e(59),m(60,"extension"),r(61,"app-tabs",null,2),t(),n(63,"pre")(64,"code",15),e(65,`
@Injectable()
export class CatsService implements OnModuleInit {
  private service: Service;
  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    this.service = this.moduleRef.get(Service);
  }
}
`),t()(),n(66,"pre")(67,"code",15),e(68,`
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
`),t()()(),n(69,"blockquote",18)(70,"strong"),e(71,"Warning"),t(),e(72," You can't retrieve scoped providers (transient or request-scoped) with the "),n(73,"code"),e(74,"get()"),t(),e(75," method. Instead, use the technique described "),n(76,"a",19),e(77,"below"),t(),e(78,". Learn how to control scopes "),n(79,"a",20),e(80,"here"),t(),e(81,`.
`),t(),n(82,"p"),e(83,"To retrieve a provider from the global context (for example, if the provider has been injected in a different module), pass the "),n(84,"code"),e(85),t(),e(86," option as a second argument to "),n(87,"code"),e(88,"get()"),t(),e(89,"."),t(),n(90,"app-copy-button")(91,"pre")(92,"code",15),e(93,`
this.moduleRef.get(Service, { strict: false });
`),t()()(),n(94,"h4",21)(95,"span"),e(96,"Resolving scoped providers"),t()(),n(97,"p"),e(98,"To dynamically resolve a scoped provider (transient or request-scoped), use the "),n(99,"code"),e(100,"resolve()"),t(),e(101," method, passing the provider's injection token as an argument."),t(),n(102,"app-copy-button",13)(103,"span",14),e(104),m(105,"extension"),r(106,"app-tabs",null,3),t(),n(108,"pre")(109,"code",15),e(110,`
@Injectable()
export class CatsService implements OnModuleInit {
  private transientService: TransientService;
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.transientService = await this.moduleRef.resolve(TransientService);
  }
}
`),t()(),n(111,"pre")(112,"code",15),e(113,`
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
`),t()()(),n(114,"p"),e(115,"The "),n(116,"code"),e(117,"resolve()"),t(),e(118," method returns a unique instance of the provider, from its own "),n(119,"strong"),e(120,"DI container sub-tree"),t(),e(121,". Each sub-tree has a unique "),n(122,"strong"),e(123,"context identifier"),t(),e(124,". Thus, if you call this method more than once and compare instance references, you will see that they are not equal."),t(),n(125,"app-copy-button",13)(126,"span",14),e(127),m(128,"extension"),r(129,"app-tabs",null,4),t(),n(131,"pre")(132,"code",15),e(133,`
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
`),t()(),n(134,"pre")(135,"code",15),e(136,`
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
`),t()()(),n(137,"p"),e(138,"To generate a single instance across multiple "),n(139,"code"),e(140,"resolve()"),t(),e(141," calls, and ensure they share the same generated DI container sub-tree, you can pass a context identifier to the "),n(142,"code"),e(143,"resolve()"),t(),e(144," method. Use the "),n(145,"code"),e(146,"ContextIdFactory"),t(),e(147," class to generate a context identifier. This class provides a "),n(148,"code"),e(149,"create()"),t(),e(150," method that returns an appropriate unique identifier."),t(),n(151,"app-copy-button",13)(152,"span",14),e(153),m(154,"extension"),r(155,"app-tabs",null,5),t(),n(157,"pre")(158,"code",15),e(159,`
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
`),t()(),n(160,"pre")(161,"code",15),e(162,`
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
`),t()()(),n(163,"blockquote",16)(164,"strong"),e(165,"Hint"),t(),e(166," The "),n(167,"code"),e(168,"ContextIdFactory"),t(),e(169," class is imported from the "),n(170,"code"),e(171,"@nestjs/core"),t(),e(172,` package.
`),t(),n(173,"h4",22)(174,"span"),e(175,"Registering "),n(176,"code"),e(177,"REQUEST"),t(),e(178," provider"),t()(),n(179,"p"),e(180,"Manually generated context identifiers (with "),n(181,"code"),e(182,"ContextIdFactory.create()"),t(),e(183,") represent DI sub-trees in which "),n(184,"code"),e(185,"REQUEST"),t(),e(186," provider is "),n(187,"code"),e(188,"undefined"),t(),e(189," as they are not instantiated and managed by the Nest dependency injection system."),t(),n(190,"p"),e(191,"To register a custom "),n(192,"code"),e(193,"REQUEST"),t(),e(194," object for a manually created DI sub-tree, use the "),n(195,"code"),e(196,"ModuleRef#registerRequestByContextId()"),t(),e(197," method, as follows:"),t(),n(198,"app-copy-button")(199,"pre")(200,"code",15),e(201,`
const contextId = ContextIdFactory.create();
this.moduleRef.registerRequestByContextId(/* YOUR_REQUEST_OBJECT */, contextId);
`),t()()(),n(202,"h4",23)(203,"span"),e(204,"Getting current sub-tree"),t()(),n(205,"p"),e(206,"Occasionally, you may want to resolve an instance of a request-scoped provider within a "),n(207,"strong"),e(208,"request context"),t(),e(209,". Let's say that "),n(210,"code"),e(211,"CatsService"),t(),e(212," is request-scoped and you want to resolve the "),n(213,"code"),e(214,"CatsRepository"),t(),e(215," instance which is also marked as a request-scoped provider. In order to share the same DI container sub-tree, you must obtain the current context identifier instead of generating a new one (e.g., with the "),n(216,"code"),e(217,"ContextIdFactory.create()"),t(),e(218," function, as shown above). To obtain the current context identifier, start by injecting the request object using "),n(219,"code"),e(220,"@Inject()"),t(),e(221," decorator."),t(),n(222,"app-copy-button",13)(223,"span",14),e(224),m(225,"extension"),r(226,"app-tabs",null,6),t(),n(228,"pre")(229,"code",15),e(230,`
@Injectable()
export class CatsService {
  constructor(
    @Inject(REQUEST) private request: Record<string, unknown>,
  ) {}
}
`),t()(),n(231,"pre")(232,"code",15),e(233,`
@Injectable()
@Dependencies(REQUEST)
export class CatsService {
  constructor(request) {
    this.request = request;
  }
}
`),t()()(),n(234,"blockquote",16)(235,"strong"),e(236,"Hint"),t(),e(237," Learn more about the request provider "),n(238,"a",24),e(239,"here"),t(),e(240,`.
`),t(),n(241,"p"),e(242,"Now, use the "),n(243,"code"),e(244,"getByRequest()"),t(),e(245," method of the "),n(246,"code"),e(247,"ContextIdFactory"),t(),e(248," class to create a context id based on the request object, and pass this to the "),n(249,"code"),e(250,"resolve()"),t(),e(251," call:"),t(),n(252,"app-copy-button")(253,"pre")(254,"code",15),e(255,`
const contextId = ContextIdFactory.getByRequest(this.request);
const catsRepository = await this.moduleRef.resolve(CatsRepository, contextId);
`),t()()(),n(256,"h4",25)(257,"span"),e(258,"Instantiating custom classes dynamically"),t()(),n(259,"p"),e(260,"To dynamically instantiate a class that "),n(261,"strong"),e(262,"wasn't previously registered"),t(),e(263," as a "),n(264,"strong"),e(265,"provider"),t(),e(266,", use the module reference's "),n(267,"code"),e(268,"create()"),t(),e(269," method."),t(),n(270,"app-copy-button",13)(271,"span",14),e(272),m(273,"extension"),r(274,"app-tabs",null,7),t(),n(276,"pre")(277,"code",15),e(278,`
@Injectable()
export class CatsService implements OnModuleInit {
  private catsFactory: CatsFactory;
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.catsFactory = await this.moduleRef.create(CatsFactory);
  }
}
`),t()(),n(279,"pre")(280,"code",15),e(281,`
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
`),t()()(),n(282,"p"),e(283,"This technique enables you to conditionally instantiate different classes outside of the framework container."),t(),n(284,"p"),r(285,"app-banner-devtools"),t()()),d&2){let h=s(23),x=s(62),y=s(107),I=s(130),j=s(156),A=s(227),M=s(275);i(20),c(" ",p(21,37,"cats.service",h.isJsActive),`
`),i(4),o("hide",h.isJsActive),i(3),o("hide",!h.isJsActive),i(32),c(" ",p(60,40,"cats.service",x.isJsActive),`
`),i(4),o("hide",x.isJsActive),i(3),o("hide",!x.isJsActive),i(19),N("","{"," strict: false ","}"),i(19),c(" ",p(105,43,"cats.service",y.isJsActive),`
`),i(4),o("hide",y.isJsActive),i(3),o("hide",!y.isJsActive),i(16),c(" ",p(128,46,"cats.service",I.isJsActive),`
`),i(4),o("hide",I.isJsActive),i(3),o("hide",!I.isJsActive),i(19),c(" ",p(154,49,"cats.service",j.isJsActive),`
`),i(4),o("hide",j.isJsActive),i(3),o("hide",!j.isJsActive),i(64),c(" ",p(225,52,"cats.service",A.isJsActive),`
`),i(4),o("hide",A.isJsActive),i(3),o("hide",!A.isJsActive),i(41),c(" ",p(273,55,"cats.service",M.isJsActive),`
`),i(4),o("hide",M.isJsActive),i(3),o("hide",!M.isJsActive)}},dependencies:[b,C,E,w,P,k],encapsulation:2,changeDetection:0})}return a})();var G=(()=>{class a extends v{static \u0275fac=(()=>{let l;return function(u){return(l||(l=f(a)))(u||a)}})();static \u0275cmp=S({type:a,selectors:[["app-execution-context"]],features:[g],decls:638,vars:72,consts:[["contentReference",""],["app94551dcf5721a4d561c562fd94ee7e0978070a42",""],["app2f5b26cbddd37755458247998dc11c3e08f05a3f",""],["appb2438961b1d6d7d23c10392e3b19acdd2c92c7e7",""],["appcdf966cc075c16cc12b4ebb8bd96e2b979282a13",""],["app8728f377b421f0392908960f13070aaedcb84287",""],["app90347bed39573b4ed68303b23c78cff53726762a",""],["appf8eb59e720c8c4532b65ef2139477a5bdedc2bc0",""],["appe219426854b604dfc0fad875702e4b885c800045",""],["appa5dce8f1cbde320b8ee69785b310e825a63f1631",""],["app6291a17324663980e8334800b12a890b42aaf986",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/fundamentals/execution-context.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","execution-context"],["routerLink","/guards"],["routerLink","/exception-filters"],["routerLink","/interceptors"],["appAnchor","","id","argumentshost-class"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/exception-filters#arguments-host"],["routerLink","/graphql/quick-start"],["appAnchor","","id","current-application-context"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","host-handler-arguments"],["appAnchor","","id","executioncontext-class"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/guards#execution-context"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/interceptors#execution-context"],["appAnchor","","id","reflection-and-metadata"],[1,"with-heading"],[1,"filename"],[1,"language-ts"],["appAnchor","","id","low-level-approach"]],template:function(d,u){if(d&1&&(n(0,"div",11,0)(2,"div",12)(3,"a",13),r(4,"i",14),t()(),n(5,"h3",15),e(6,"Execution context"),t(),n(7,"p"),e(8,"Nest provides several utility classes that help make it easy to write applications that function across multiple application contexts (e.g., Nest HTTP server-based, microservices and WebSockets application contexts). These utilities provide information about the current execution context which can be used to build generic "),n(9,"a",16),e(10,"guards"),t(),e(11,", "),n(12,"a",17),e(13,"filters"),t(),e(14,", and "),n(15,"a",18),e(16,"interceptors"),t(),e(17," that can work across a broad set of controllers, methods, and execution contexts."),t(),n(18,"p"),e(19,"We cover two such classes in this chapter: "),n(20,"code"),e(21,"ArgumentsHost"),t(),e(22," and "),n(23,"code"),e(24,"ExecutionContext"),t(),e(25,"."),t(),n(26,"h4",19)(27,"span"),e(28,"ArgumentsHost class"),t()(),n(29,"p"),e(30,"The "),n(31,"code"),e(32,"ArgumentsHost"),t(),e(33," class provides methods for retrieving the arguments being passed to a handler. It allows choosing the appropriate context (e.g., HTTP, RPC (microservice), or WebSockets) to retrieve the arguments from. The framework provides an instance of "),n(34,"code"),e(35,"ArgumentsHost"),t(),e(36,", typically referenced as a "),n(37,"code"),e(38,"host"),t(),e(39," parameter, in places where you may want to access it. For example, the "),n(40,"code"),e(41,"catch()"),t(),e(42," method of an "),n(43,"a",20),e(44,"exception filter"),t(),e(45," is called with an "),n(46,"code"),e(47,"ArgumentsHost"),t(),e(48,"instance."),t(),n(49,"p")(50,"code"),e(51,"ArgumentsHost"),t(),e(52," simply acts as an abstraction over a handler's arguments. For example, for HTTP server applications (when "),n(53,"code"),e(54,"@nestjs/platform-express"),t(),e(55," is being used), the "),n(56,"code"),e(57,"host"),t(),e(58," object encapsulates Express's "),n(59,"code"),e(60,"[request, response, next]"),t(),e(61," array, where "),n(62,"code"),e(63,"request"),t(),e(64," is the request object, "),n(65,"code"),e(66,"response"),t(),e(67," is the response object, and "),n(68,"code"),e(69,"next"),t(),e(70," is a function that controls the application's request-response cycle. On the other hand, for "),n(71,"a",21),e(72,"GraphQL"),t(),e(73," applications, the "),n(74,"code"),e(75,"host"),t(),e(76," object contains the "),n(77,"code"),e(78,"[root, args, context, info]"),t(),e(79," array."),t(),n(80,"h4",22)(81,"span"),e(82,"Current application context"),t()(),n(83,"p"),e(84,"When building generic "),n(85,"a",16),e(86,"guards"),t(),e(87,", "),n(88,"a",17),e(89,"filters"),t(),e(90,", and "),n(91,"a",18),e(92,"interceptors"),t(),e(93," which are meant to run across multiple application contexts, we need a way to determine the type of application that our method is currently running in. Do this with the "),n(94,"code"),e(95,"getType()"),t(),e(96," method of "),n(97,"code"),e(98,"ArgumentsHost"),t(),e(99,":"),t(),n(100,"app-copy-button")(101,"pre")(102,"code",23),e(103,`
if (host.getType() === 'http') {
  // do something that is only important in the context of regular HTTP requests (REST)
} else if (host.getType() === 'rpc') {
  // do something that is only important in the context of Microservice requests
} else if (host.getType<GqlContextType>() === 'graphql') {
  // do something that is only important in the context of GraphQL requests
}
`),t()()(),n(104,"blockquote",24)(105,"strong"),e(106,"Hint"),t(),e(107," The "),n(108,"code"),e(109,"GqlContextType"),t(),e(110," is imported from the "),n(111,"code"),e(112,"@nestjs/graphql"),t(),e(113,` package.
`),t(),n(114,"p"),e(115,"With the application type available, we can write more generic components, as shown below."),t(),n(116,"h4",25)(117,"span"),e(118,"Host handler arguments"),t()(),n(119,"p"),e(120,"To retrieve the array of arguments being passed to the handler, one approach is to use the host object's "),n(121,"code"),e(122,"getArgs()"),t(),e(123," method."),t(),n(124,"app-copy-button")(125,"pre")(126,"code",23),e(127,`
const [req, res, next] = host.getArgs();
`),t()()(),n(128,"p"),e(129,"You can pluck a particular argument by index using the "),n(130,"code"),e(131,"getArgByIndex()"),t(),e(132," method:"),t(),n(133,"app-copy-button")(134,"pre")(135,"code",23),e(136,`
const request = host.getArgByIndex(0);
const response = host.getArgByIndex(1);
`),t()()(),n(137,"p"),e(138,"In these examples we retrieved the request and response objects by index, which is not typically recommended as it couples the application to a particular execution context. Instead, you can make your code more robust and reusable by using one of the "),n(139,"code"),e(140,"host"),t(),e(141," object's utility methods to switch to the appropriate application context for your application. The context switch utility methods are shown below."),t(),n(142,"app-copy-button")(143,"pre")(144,"code",23),e(145,`
/**
 * Switch context to RPC.
 */
switchToRpc(): RpcArgumentsHost;
/**
 * Switch context to HTTP.
 */
switchToHttp(): HttpArgumentsHost;
/**
 * Switch context to WebSockets.
 */
switchToWs(): WsArgumentsHost;
`),t()()(),n(146,"p"),e(147,"Let's rewrite the previous example using the "),n(148,"code"),e(149,"switchToHttp()"),t(),e(150," method. The "),n(151,"code"),e(152,"host.switchToHttp()"),t(),e(153," helper call returns an "),n(154,"code"),e(155,"HttpArgumentsHost"),t(),e(156," object that is appropriate for the HTTP application context. The "),n(157,"code"),e(158,"HttpArgumentsHost"),t(),e(159," object has two useful methods we can use to extract the desired objects. We also use the Express type assertions in this case to return native Express typed objects:"),t(),n(160,"app-copy-button")(161,"pre")(162,"code",23),e(163,`
const ctx = host.switchToHttp();
const request = ctx.getRequest<Request>();
const response = ctx.getResponse<Response>();
`),t()()(),n(164,"p"),e(165,"Similarly "),n(166,"code"),e(167,"WsArgumentsHost"),t(),e(168," and "),n(169,"code"),e(170,"RpcArgumentsHost"),t(),e(171," have methods to return appropriate objects in the microservices and WebSockets contexts. Here are the methods for "),n(172,"code"),e(173,"WsArgumentsHost"),t(),e(174,":"),t(),n(175,"app-copy-button")(176,"pre")(177,"code",23),e(178,`
export interface WsArgumentsHost {
  /**
   * Returns the data object.
   */
  getData<T>(): T;
  /**
   * Returns the client object.
   */
  getClient<T>(): T;
}
`),t()()(),n(179,"p"),e(180,"Following are the methods for "),n(181,"code"),e(182,"RpcArgumentsHost"),t(),e(183,":"),t(),n(184,"app-copy-button")(185,"pre")(186,"code",23),e(187,`
export interface RpcArgumentsHost {
  /**
   * Returns the data object.
   */
  getData<T>(): T;

  /**
   * Returns the context object.
   */
  getContext<T>(): T;
}
`),t()()(),n(188,"h4",26)(189,"span"),e(190,"ExecutionContext class"),t()(),n(191,"p")(192,"code"),e(193,"ExecutionContext"),t(),e(194," extends "),n(195,"code"),e(196,"ArgumentsHost"),t(),e(197,", providing additional details about the current execution process. Like "),n(198,"code"),e(199,"ArgumentsHost"),t(),e(200,", Nest provides an instance of "),n(201,"code"),e(202,"ExecutionContext"),t(),e(203," in places you may need it, such as in the "),n(204,"code"),e(205,"canActivate()"),t(),e(206," method of a "),n(207,"a",27),e(208,"guard"),t(),e(209," and the "),n(210,"code"),e(211,"intercept()"),t(),e(212," method of an "),n(213,"a",28),e(214,"interceptor"),t(),e(215,". It provides the following methods:"),t(),n(216,"app-copy-button")(217,"pre")(218,"code",23),e(219,`
export interface ExecutionContext extends ArgumentsHost {
  /**
   * Returns the type of the controller class which the current handler belongs to.
   */
  getClass<T>(): Type<T>;
  /**
   * Returns a reference to the handler (method) that will be invoked next in the
   * request pipeline.
   */
  getHandler(): Function;
}
`),t()()(),n(220,"p"),e(221,"The "),n(222,"code"),e(223,"getHandler()"),t(),e(224," method returns a reference to the handler about to be invoked. The "),n(225,"code"),e(226,"getClass()"),t(),e(227," method returns the type of the "),n(228,"code"),e(229,"Controller"),t(),e(230," class which this particular handler belongs to. For example, in an HTTP context, if the currently processed request is a "),n(231,"code"),e(232,"POST"),t(),e(233," request, bound to the "),n(234,"code"),e(235,"create()"),t(),e(236," method on the "),n(237,"code"),e(238,"CatsController"),t(),e(239,", "),n(240,"code"),e(241,"getHandler()"),t(),e(242," returns a reference to the "),n(243,"code"),e(244,"create()"),t(),e(245," method and "),n(246,"code"),e(247,"getClass()"),t(),e(248," returns the "),n(249,"code"),e(250,"CatsController"),t(),n(251,"strong"),e(252,"class"),t(),e(253," (not instance)."),t(),n(254,"app-copy-button")(255,"pre")(256,"code",23),e(257,`
const methodKey = ctx.getHandler().name; // "create"
const className = ctx.getClass().name; // "CatsController"
`),t()()(),n(258,"p"),e(259,"The ability to access references to both the current class and handler method provides great flexibility. Most importantly, it gives us the opportunity to access the metadata set through either decorators created via "),n(260,"code"),e(261,"Reflector#createDecorator"),t(),e(262," or the built-in "),n(263,"code"),e(264,"@SetMetadata()"),t(),e(265," decorator from within guards or interceptors. We cover this use case below."),t(),n(266,"p"),r(267,"app-banner-enterprise"),t(),n(268,"h4",29)(269,"span"),e(270,"Reflection and metadata"),t()(),n(271,"p"),e(272,"Nest provides the ability to attach "),n(273,"strong"),e(274,"custom metadata"),t(),e(275," to route handlers through decorators created via "),n(276,"code"),e(277,"Reflector#createDecorator"),t(),e(278," method, and the built-in "),n(279,"code"),e(280,"@SetMetadata()"),t(),e(281," decorator. In this section, let's compare the two approaches and see how to access the metadata from within a guard or interceptor."),t(),n(282,"p"),e(283,"To create strongly-typed decorators using "),n(284,"code"),e(285,"Reflector#createDecorator"),t(),e(286,", we need to specify the type argument. For example, let's create a "),n(287,"code"),e(288,"Roles"),t(),e(289," decorator that takes an array of strings as an argument."),t(),n(290,"app-copy-button",30)(291,"span",31),e(292),m(293,"extension"),r(294,"app-tabs",null,1),t(),n(296,"pre")(297,"code",32),e(298,`
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<string[]>();
`),t()()(),n(299,"p"),e(300,"The "),n(301,"code"),e(302,"Roles"),t(),e(303," decorator here is a function that takes a single argument of type "),n(304,"code"),e(305,"string[]"),t(),e(306,"."),t(),n(307,"p"),e(308,"Now, to use this decorator, we simply annotate the handler with it:"),t(),n(309,"app-copy-button",30)(310,"span",31),e(311),m(312,"extension"),r(313,"app-tabs",null,2),t(),n(315,"pre")(316,"code",23),e(317,`
@Post()
@Roles(['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
`),t()(),n(318,"pre")(319,"code",23),e(320,`
@Post()
@Roles(['admin'])
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
`),t()()(),n(321,"p"),e(322,"Here we've attached the "),n(323,"code"),e(324,"Roles"),t(),e(325," decorator metadata to the "),n(326,"code"),e(327,"create()"),t(),e(328," method, indicating that only users with the "),n(329,"code"),e(330,"admin"),t(),e(331," role should be allowed to access this route."),t(),n(332,"p"),e(333,"To access the route's role(s) (custom metadata), we'll use the "),n(334,"code"),e(335,"Reflector"),t(),e(336," helper class again. "),n(337,"code"),e(338,"Reflector"),t(),e(339," can be injected into a class in the normal way:"),t(),n(340,"app-copy-button",30)(341,"span",31),e(342),m(343,"extension"),r(344,"app-tabs",null,3),t(),n(346,"pre")(347,"code",23),e(348,`
@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}
}
`),t()(),n(349,"pre")(350,"code",23),e(351,`
@Injectable()
@Dependencies(Reflector)
export class CatsService {
  constructor(reflector) {
    this.reflector = reflector;
  }
}
`),t()()(),n(352,"blockquote",24)(353,"strong"),e(354,"Hint"),t(),e(355," The "),n(356,"code"),e(357,"Reflector"),t(),e(358," class is imported from the "),n(359,"code"),e(360,"@nestjs/core"),t(),e(361,` package.
`),t(),n(362,"p"),e(363,"Now, to read the handler metadata, use the "),n(364,"code"),e(365,"get()"),t(),e(366," method:"),t(),n(367,"app-copy-button")(368,"pre")(369,"code",23),e(370,`
const roles = this.reflector.get(Roles, context.getHandler());
`),t()()(),n(371,"p"),e(372,"The "),n(373,"code"),e(374,"Reflector#get"),t(),e(375," method allows us to easily access the metadata by passing in two arguments: a decorator reference and a "),n(376,"strong"),e(377,"context"),t(),e(378," (decorator target) to retrieve the metadata from. In this example, the specified "),n(379,"strong"),e(380,"decorator"),t(),e(381," is "),n(382,"code"),e(383,"Roles"),t(),e(384," (refer back to the "),n(385,"code"),e(386,"roles.decorator.ts"),t(),e(387," file above). The context is provided by the call to "),n(388,"code"),e(389,"context.getHandler()"),t(),e(390,", which results in extracting the metadata for the currently processed route handler. Remember, "),n(391,"code"),e(392,"getHandler()"),t(),e(393," gives us a "),n(394,"strong"),e(395,"reference"),t(),e(396," to the route handler function."),t(),n(397,"p"),e(398,"Alternatively, we may organize our controller by applying metadata at the controller level, applying to all routes in the controller class."),t(),n(399,"app-copy-button",30)(400,"span",31),e(401),m(402,"extension"),r(403,"app-tabs",null,4),t(),n(405,"pre")(406,"code",23),e(407,`
@Roles(['admin'])
@Controller('cats')
export class CatsController {}
`),t()(),n(408,"pre")(409,"code",23),e(410,`
@Roles(['admin'])
@Controller('cats')
export class CatsController {}
`),t()()(),n(411,"p"),e(412,"In this case, to extract controller metadata, we pass "),n(413,"code"),e(414,"context.getClass()"),t(),e(415," as the second argument (to provide the controller class as the context for metadata extraction) instead of "),n(416,"code"),e(417,"context.getHandler()"),t(),e(418,":"),t(),n(419,"app-copy-button",30)(420,"span",31),e(421),m(422,"extension"),r(423,"app-tabs",null,5),t(),n(425,"pre")(426,"code",23),e(427,`
const roles = this.reflector.get(Roles, context.getClass());
`),t()()(),n(428,"p"),e(429,"Given the ability to provide metadata at multiple levels, you may need to extract and merge metadata from several contexts. The "),n(430,"code"),e(431,"Reflector"),t(),e(432," class provides two utility methods used to help with this. These methods extract "),n(433,"strong"),e(434,"both"),t(),e(435," controller and method metadata at once, and combine them in different ways."),t(),n(436,"p"),e(437,"Consider the following scenario, where you've supplied "),n(438,"code"),e(439,"Roles"),t(),e(440," metadata at both levels."),t(),n(441,"app-copy-button",30)(442,"span",31),e(443),m(444,"extension"),r(445,"app-tabs",null,6),t(),n(447,"pre")(448,"code",23),e(449,`
@Roles(['user'])
@Controller('cats')
export class CatsController {
  @Post()
  @Roles(['admin'])
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }
}
`),t()(),n(450,"pre")(451,"code",23),e(452,`
@Roles(['user'])
@Controller('cats')
export class CatsController {}
  @Post()
  @Roles(['admin'])
  @Bind(Body())
  async create(createCatDto) {
    this.catsService.create(createCatDto);
  }
}
`),t()()(),n(453,"p"),e(454,"If your intent is to specify "),n(455,"code"),e(456,"'user'"),t(),e(457," as the default role, and override it selectively for certain methods, you would probably use the "),n(458,"code"),e(459,"getAllAndOverride()"),t(),e(460," method."),t(),n(461,"app-copy-button")(462,"pre")(463,"code",23),e(464,`
const roles = this.reflector.getAllAndOverride(Roles, [context.getHandler(), context.getClass()]);
`),t()()(),n(465,"p"),e(466,"A guard with this code, running in the context of the "),n(467,"code"),e(468,"create()"),t(),e(469," method, with the above metadata, would result in "),n(470,"code"),e(471,"roles"),t(),e(472," containing "),n(473,"code"),e(474,"['admin']"),t(),e(475,"."),t(),n(476,"p"),e(477,"To get metadata for both and merge it (this method merges both arrays and objects), use the "),n(478,"code"),e(479,"getAllAndMerge()"),t(),e(480," method:"),t(),n(481,"app-copy-button")(482,"pre")(483,"code",23),e(484,`
const roles = this.reflector.getAllAndMerge(Roles, [context.getHandler(), context.getClass()]);
`),t()()(),n(485,"p"),e(486,"This would result in "),n(487,"code"),e(488,"roles"),t(),e(489," containing "),n(490,"code"),e(491,"['user', 'admin']"),t(),e(492,"."),t(),n(493,"p"),e(494,"For both of these merge methods, you pass the metadata key as the first argument, and an array of metadata target contexts (i.e., calls to the "),n(495,"code"),e(496,"getHandler()"),t(),e(497," and/or "),n(498,"code"),e(499,"getClass()"),t(),e(500," methods) as the second argument."),t(),n(501,"h4",33)(502,"span"),e(503,"Low-level approach"),t()(),n(504,"p"),e(505,"As mentioned earlier, instead of using "),n(506,"code"),e(507,"Reflector#createDecorator"),t(),e(508,", you can also use the built-in "),n(509,"code"),e(510,"@SetMetadata()"),t(),e(511," decorator to attach metadata to a handler."),t(),n(512,"app-copy-button",30)(513,"span",31),e(514),m(515,"extension"),r(516,"app-tabs",null,7),t(),n(518,"pre")(519,"code",23),e(520,`
@Post()
@SetMetadata('roles', ['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
`),t()(),n(521,"pre")(522,"code",23),e(523,`
@Post()
@SetMetadata('roles', ['admin'])
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
`),t()()(),n(524,"blockquote",24)(525,"strong"),e(526,"Hint"),t(),e(527," The "),n(528,"code"),e(529,"@SetMetadata()"),t(),e(530," decorator is imported from the "),n(531,"code"),e(532,"@nestjs/common"),t(),e(533,` package.
`),t(),n(534,"p"),e(535,"With the construction above, we attached the "),n(536,"code"),e(537,"roles"),t(),e(538," metadata ("),n(539,"code"),e(540,"roles"),t(),e(541," is a metadata key and "),n(542,"code"),e(543,"['admin']"),t(),e(544," is the associated value) to the "),n(545,"code"),e(546,"create()"),t(),e(547," method. While this works, it's not good practice to use "),n(548,"code"),e(549,"@SetMetadata()"),t(),e(550," directly in your routes. Instead, you can create your own decorators, as shown below:"),t(),n(551,"app-copy-button",30)(552,"span",31),e(553),m(554,"extension"),r(555,"app-tabs",null,8),t(),n(557,"pre")(558,"code",23),e(559,`
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
`),t()(),n(560,"pre")(561,"code",23),e(562,`
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles) => SetMetadata('roles', roles);
`),t()()(),n(563,"p"),e(564,"This approach is much cleaner and more readable, and somewhat resembles the "),n(565,"code"),e(566,"Reflector#createDecorator"),t(),e(567," approach. The difference is that with "),n(568,"code"),e(569,"@SetMetadata"),t(),e(570," you have more control over the metadata key and value, and also can create decorators that take more than one argument."),t(),n(571,"p"),e(572,"Now that we have a custom "),n(573,"code"),e(574,"@Roles()"),t(),e(575," decorator, we can use it to decorate the "),n(576,"code"),e(577,"create()"),t(),e(578," method."),t(),n(579,"app-copy-button",30)(580,"span",31),e(581),m(582,"extension"),r(583,"app-tabs",null,9),t(),n(585,"pre")(586,"code",23),e(587,`
@Post()
@Roles('admin')
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
`),t()(),n(588,"pre")(589,"code",23),e(590,`
@Post()
@Roles('admin')
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
`),t()()(),n(591,"p"),e(592,"To access the route's role(s) (custom metadata), we'll use the "),n(593,"code"),e(594,"Reflector"),t(),e(595," helper class again:"),t(),n(596,"app-copy-button",30)(597,"span",31),e(598),m(599,"extension"),r(600,"app-tabs",null,10),t(),n(602,"pre")(603,"code",23),e(604,`
@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}
}
`),t()(),n(605,"pre")(606,"code",23),e(607,`
@Injectable()
@Dependencies(Reflector)
export class CatsService {
  constructor(reflector) {
    this.reflector = reflector;
  }
}
`),t()()(),n(608,"blockquote",24)(609,"strong"),e(610,"Hint"),t(),e(611," The "),n(612,"code"),e(613,"Reflector"),t(),e(614," class is imported from the "),n(615,"code"),e(616,"@nestjs/core"),t(),e(617,` package.
`),t(),n(618,"p"),e(619,"Now, to read the handler metadata, use the "),n(620,"code"),e(621,"get()"),t(),e(622," method."),t(),n(623,"app-copy-button")(624,"pre")(625,"code",23),e(626,`
const roles = this.reflector.get<string[]>('roles', context.getHandler());
`),t()()(),n(627,"p"),e(628,"Here instead of passing a decorator reference, we pass the metadata "),n(629,"strong"),e(630,"key"),t(),e(631," as the first argument (which in our case is "),n(632,"code"),e(633,"'roles'"),t(),e(634,"). Everything else remains the same as in the "),n(635,"code"),e(636,"Reflector#createDecorator"),t(),e(637," example."),t()()),d&2){let h=s(295),x=s(314),y=s(345),I=s(404),j=s(424),A=s(446),M=s(517),q=s(556),D=s(584),O=s(601);i(292),c(" ",p(293,42,"roles.decorator",h.isJsActive),`
`),i(19),c(" ",p(312,45,"cats.controller",x.isJsActive),`
`),i(4),o("hide",x.isJsActive),i(3),o("hide",!x.isJsActive),i(24),c(" ",p(343,48,"roles.guard",y.isJsActive),`
`),i(4),o("hide",y.isJsActive),i(3),o("hide",!y.isJsActive),i(52),c(" ",p(402,51,"cats.controller",I.isJsActive),`
`),i(4),o("hide",I.isJsActive),i(3),o("hide",!I.isJsActive),i(13),c(" ",p(422,54,"roles.guard",j.isJsActive),`
`),i(22),c(" ",p(444,57,"cats.controller",A.isJsActive),`
`),i(4),o("hide",A.isJsActive),i(3),o("hide",!A.isJsActive),i(64),c(" ",p(515,60,"cats.controller",M.isJsActive),`
`),i(4),o("hide",M.isJsActive),i(3),o("hide",!M.isJsActive),i(32),c(" ",p(554,63,"roles.decorator",q.isJsActive),`
`),i(4),o("hide",q.isJsActive),i(3),o("hide",!q.isJsActive),i(21),c(" ",p(582,66,"cats.controller",D.isJsActive),`
`),i(4),o("hide",D.isJsActive),i(3),o("hide",!D.isJsActive),i(10),c(" ",p(599,69,"roles.guard",O.isJsActive),`
`),i(4),o("hide",O.isJsActive),i(3),o("hide",!O.isJsActive)}},dependencies:[w,E,b,_,C,k],encapsulation:2,changeDetection:0})}return a})();var W=(()=>{class a extends v{static \u0275fac=(()=>{let l;return function(u){return(l||(l=f(a)))(u||a)}})();static \u0275cmp=S({type:a,selectors:[["app-platform-agnosticism"]],features:[g],decls:41,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/fundamentals/platform-agnosticism.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","platform-agnosticism"],["appAnchor","","id","build-once-use-everywhere"],["routerLink","/microservices/basics"],["routerLink","/websockets/gateways"],["routerLink","/graphql/quick-start"],["routerLink","/application-context"]],template:function(d,u){d&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),r(4,"i",4),t()(),n(5,"h3",5),e(6,"Platform agnosticism"),t(),n(7,"p"),e(8,"Nest is a platform-agnostic framework. This means you can develop "),n(9,"strong"),e(10,"reusable logical parts"),t(),e(11," that can be used across different types of applications. For example, most components can be re-used without change across different underlying HTTP server frameworks (e.g., Express and Fastify), and even across different "),n(12,"em"),e(13,"types"),t(),e(14," of applications (e.g., HTTP server frameworks, Microservices with different transport layers, and Web Sockets)."),t(),n(15,"h4",6)(16,"span"),e(17,"Build once, use everywhere"),t()(),n(18,"p"),e(19,"The "),n(20,"strong"),e(21,"Overview"),t(),e(22," section of the documentation primarily shows coding techniques using HTTP server frameworks (e.g., apps providing a REST API or providing an MVC-style server-side rendered app). However, all those building blocks can be used on top of different transport layers ("),n(23,"a",7),e(24,"microservices"),t(),e(25," or "),n(26,"a",8),e(27,"websockets"),t(),e(28,")."),t(),n(29,"p"),e(30,"Furthermore, Nest comes with a dedicated "),n(31,"a",9),e(32,"GraphQL"),t(),e(33," module. You can use GraphQL as your API layer interchangeably with providing a REST API."),t(),n(34,"p"),e(35,"In addition, the "),n(36,"a",10),e(37,"application context"),t(),e(38," feature helps to create any kind of Node.js application - including things like CRON jobs and CLI apps - on top of Nest."),t(),n(39,"p"),e(40,"Nest aspires to be a full-fledged platform for Node.js apps that brings a higher-level of modularity and reusability to your applications. Build once, use everywhere!"),t()())},dependencies:[E,w],encapsulation:2,changeDetection:0})}return a})();var Q=(()=>{class a extends v{static \u0275fac=(()=>{let l;return function(u){return(l||(l=f(a)))(u||a)}})();static \u0275cmp=S({type:a,selectors:[["app-provider-scopes"]],features:[g],decls:402,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/fundamentals/provider-scopes.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","injection-scopes"],["appAnchor","","id","provider-scope"],[1,"info"],["appAnchor","","id","usage"],[1,"language-typescript"],["routerLink","/fundamentals/custom-providers"],[1,"warning"],["href","../security/authentication#request-scoped-strategies"],["appAnchor","","id","controller-scope"],["appAnchor","","id","scope-hierarchy"],["appAnchor","","id","request-provider"],["routerLink","/graphql/quick-start"],["appAnchor","","id","inquirer-provider"],["appAnchor","","id","performance"],["appAnchor","","id","durable-providers"],["href","/fundamentals/module-ref#resolving-scoped-providers"]],template:function(d,u){d&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),r(4,"i",4),t()(),n(5,"h3",5),e(6,"Injection scopes"),t(),n(7,"p"),e(8,"For people coming from different programming language backgrounds, it might be unexpected to learn that in Nest, almost everything is shared across incoming requests. We have a connection pool to the database, singleton services with global state, etc. Remember that Node.js doesn't follow the request/response Multi-Threaded Stateless Model in which every request is processed by a separate thread. Hence, using singleton instances is fully "),n(9,"strong"),e(10,"safe"),t(),e(11," for our applications."),t(),n(12,"p"),e(13,"However, there are edge cases when request-based lifetime may be the desired behavior, for instance, per-request caching in GraphQL applications, request tracking, and multi-tenancy. Injection scopes provide a mechanism to obtain the desired provider lifetime behavior."),t(),n(14,"h4",6)(15,"span"),e(16,"Provider scope"),t()(),n(17,"p"),e(18,"A provider can have any of the following scopes:"),t(),n(19,"table")(20,"tr")(21,"td")(22,"code"),e(23,"DEFAULT"),t()(),n(24,"td"),e(25,"A single instance of the provider is shared across the entire application. The instance lifetime is tied directly to the application lifecycle. Once the application has bootstrapped, all singleton providers have been instantiated. Singleton scope is used by default."),t()(),n(26,"tr")(27,"td")(28,"code"),e(29,"REQUEST"),t()(),n(30,"td"),e(31,"A new instance of the provider is created exclusively for each incoming "),n(32,"strong"),e(33,"request"),t(),e(34,". The instance is garbage-collected after the request has completed processing."),t()(),n(35,"tr")(36,"td")(37,"code"),e(38,"TRANSIENT"),t()(),n(39,"td"),e(40,"Transient providers are not shared across consumers. Each consumer that injects a transient provider will receive a new, dedicated instance."),t()()(),n(41,"blockquote",7)(42,"strong"),e(43,"Hint"),t(),e(44," Using singleton scope is "),n(45,"strong"),e(46,"recommended"),t(),e(47,` for most use cases. Sharing providers across consumers and across requests means that an instance can be cached and its initialization occurs only once, during application startup.
`),t(),n(48,"h4",8)(49,"span"),e(50,"Usage"),t()(),n(51,"p"),e(52,"Specify injection scope by passing the "),n(53,"code"),e(54,"scope"),t(),e(55," property to the "),n(56,"code"),e(57,"@Injectable()"),t(),e(58," decorator options object:"),t(),n(59,"app-copy-button")(60,"pre")(61,"code",9),e(62,`
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {}
`),t()()(),n(63,"p"),e(64,"Similarly, for "),n(65,"a",10),e(66,"custom providers"),t(),e(67,", set the "),n(68,"code"),e(69,"scope"),t(),e(70," property in the long-hand form for a provider registration:"),t(),n(71,"app-copy-button")(72,"pre")(73,"code",9),e(74,`
{
  provide: 'CACHE_MANAGER',
  useClass: CacheManager,
  scope: Scope.TRANSIENT,
}
`),t()()(),n(75,"blockquote",7)(76,"strong"),e(77,"Hint"),t(),e(78," Import the "),n(79,"code"),e(80,"Scope"),t(),e(81," enum from "),n(82,"code"),e(83,"@nestjs/common"),t()(),n(84,"p"),e(85,"Singleton scope is used by default and does not need be declared. If you do want to declare a provider as singleton scoped, use the "),n(86,"code"),e(87,"Scope.DEFAULT"),t(),e(88," value for the "),n(89,"code"),e(90,"scope"),t(),e(91," property."),t(),n(92,"blockquote",11)(93,"strong"),e(94,"Notice"),t(),e(95," Websocket Gateways should not use request-scoped providers because they must act as singletons. Each gateway encapsulates a real socket and cannot be instantiated multiple times. The limitation also applies to some other providers, like "),n(96,"a",12)(97,"em"),e(98,"Passport strategies"),t()(),e(99," or "),n(100,"em"),e(101,"Cron controllers"),t(),e(102,`.
`),t(),n(103,"h4",13)(104,"span"),e(105,"Controller scope"),t()(),n(106,"p"),e(107,"Controllers can also have scope, which applies to all request method handlers declared in that controller. Like provider scope, the scope of a controller declares its lifetime. For a request-scoped controller, a new instance is created for each inbound request, and garbage-collected when the request has completed processing."),t(),n(108,"p"),e(109,"Declare controller scope with the "),n(110,"code"),e(111,"scope"),t(),e(112," property of the "),n(113,"code"),e(114,"ControllerOptions"),t(),e(115," object:"),t(),n(116,"app-copy-button")(117,"pre")(118,"code",9),e(119,`
@Controller({
  path: 'cats',
  scope: Scope.REQUEST,
})
export class CatsController {}
`),t()()(),n(120,"h4",14)(121,"span"),e(122,"Scope hierarchy"),t()(),n(123,"p"),e(124,"The "),n(125,"code"),e(126,"REQUEST"),t(),e(127," scope bubbles up the injection chain. A controller that depends on a request-scoped provider will, itself, be request-scoped."),t(),n(128,"p"),e(129,"Imagine the following dependency graph: "),n(130,"code"),e(131,"CatsController <- CatsService <- CatsRepository"),t(),e(132,". If "),n(133,"code"),e(134,"CatsService"),t(),e(135," is request-scoped (and the others are default singletons), the "),n(136,"code"),e(137,"CatsController"),t(),e(138," will become request-scoped as it is dependent on the injected service. The "),n(139,"code"),e(140,"CatsRepository"),t(),e(141,", which is not dependent, would remain singleton-scoped."),t(),n(142,"p"),e(143,"Transient-scoped dependencies don't follow that pattern. If a singleton-scoped "),n(144,"code"),e(145,"DogsService"),t(),e(146," injects a transient "),n(147,"code"),e(148,"LoggerService"),t(),e(149," provider, it will receive a fresh instance of it. However, "),n(150,"code"),e(151,"DogsService"),t(),e(152," will stay singleton-scoped, so injecting it anywhere would "),n(153,"em"),e(154,"not"),t(),e(155," resolve to a new instance of "),n(156,"code"),e(157,"DogsService"),t(),e(158,". In case it's desired behavior, "),n(159,"code"),e(160,"DogsService"),t(),e(161," must be explicitly marked as "),n(162,"code"),e(163,"TRANSIENT"),t(),e(164," as well."),t(),n(165,"p"),r(166,"app-banner-courses"),t(),n(167,"h4",15)(168,"span"),e(169,"Request provider"),t()(),n(170,"p"),e(171,"In an HTTP server-based application (e.g., using "),n(172,"code"),e(173,"@nestjs/platform-express"),t(),e(174," or "),n(175,"code"),e(176,"@nestjs/platform-fastify"),t(),e(177,"), you may want to access a reference to the original request object when using request-scoped providers. You can do this by injecting the "),n(178,"code"),e(179,"REQUEST"),t(),e(180," object."),t(),n(181,"p"),e(182,"The "),n(183,"code"),e(184,"REQUEST"),t(),e(185," provider is inherently request-scoped, meaning you don't need to specify the "),n(186,"code"),e(187,"REQUEST"),t(),e(188," scope explicitly when using it. Additionally, even if you attempt to do so, it will be disregarded. Any provider that relies on a request-scoped provider automatically adopts a request scope, and this behavior cannot be altered."),t(),n(189,"app-copy-button")(190,"pre")(191,"code",9),e(192,`
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(REQUEST) private request: Request) {}
}
`),t()()(),n(193,"p"),e(194,"Because of underlying platform/protocol differences, you access the inbound request slightly differently for Microservice or GraphQL applications. In "),n(195,"a",16),e(196,"GraphQL"),t(),e(197," applications, you inject "),n(198,"code"),e(199,"CONTEXT"),t(),e(200," instead of "),n(201,"code"),e(202,"REQUEST"),t(),e(203,":"),t(),n(204,"app-copy-button")(205,"pre")(206,"code",9),e(207,`
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private context) {}
}
`),t()()(),n(208,"p"),e(209,"You then configure your "),n(210,"code"),e(211,"context"),t(),e(212," value (in the "),n(213,"code"),e(214,"GraphQLModule"),t(),e(215,") to contain "),n(216,"code"),e(217,"request"),t(),e(218," as its property."),t(),n(219,"h4",17)(220,"span"),e(221,"Inquirer provider"),t()(),n(222,"p"),e(223,"If you want to get the class where a provider was constructed, for instance in logging or metrics providers, you can inject the "),n(224,"code"),e(225,"INQUIRER"),t(),e(226," token."),t(),n(227,"app-copy-button")(228,"pre")(229,"code",9),e(230,`
import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class HelloService {
  constructor(@Inject(INQUIRER) private parentClass: object) {}

  sayHello(message: string) {
    console.log(\`\${this.parentClass?.constructor?.name}: \${message}\`);
  }
}
`),t()()(),n(231,"p"),e(232,"And then use it as follows:"),t(),n(233,"app-copy-button")(234,"pre")(235,"code",9),e(236,`
import { Injectable } from '@nestjs/common';
import { HelloService } from './hello.service';

@Injectable()
export class AppService {
  constructor(private helloService: HelloService) {}

  getRoot(): string {
    this.helloService.sayHello('My name is getRoot');

    return 'Hello world!';
  }
}
`),t()()(),n(237,"p"),e(238,"In the example above when "),n(239,"code"),e(240,"AppService#getRoot"),t(),e(241," is called, "),n(242,"code"),e(243,'"AppService: My name is getRoot"'),t(),e(244," will be logged to the console."),t(),n(245,"h4",18)(246,"span"),e(247,"Performance"),t()(),n(248,"p"),e(249,"Using request-scoped providers will have an impact on application performance. While Nest tries to cache as much metadata as possible, it will still have to create an instance of your class on each request. Hence, it will slow down your average response time and overall benchmarking result. Unless a provider must be request-scoped, it is strongly recommended that you use the default singleton scope."),t(),n(250,"blockquote",7)(251,"strong"),e(252,"Hint"),t(),e(253,` Although it all sounds quite intimidating, a properly designed application that leverages request-scoped providers should not slow down by more than ~5% latency-wise.
`),t(),n(254,"h4",19)(255,"span"),e(256,"Durable providers"),t()(),n(257,"p"),e(258,"Request-scoped providers, as mentioned in the section above, may lead to increased latency since having at least 1 request-scoped provider (injected into the controller instance, or deeper - injected into one of its providers) makes the controller request-scoped as well. That means it must be recreated (instantiated) per each individual request (and garbage collected afterward). Now, that also means, that for let's say 30k requests in parallel, there will be 30k ephemeral instances of the controller (and its request-scoped providers)."),t(),n(259,"p"),e(260,"Having a common provider that most providers depend on (think of a database connection, or a logger service), automatically converts all those providers to request-scoped providers as well. This can pose a challenge in "),n(261,"strong"),e(262,"multi-tenant applications"),t(),e(263,', especially for those that have a central request-scoped "data source" provider that grabs headers/token from the request object and based on its values, retrieves the corresponding database connection/schema (specific to that tenant).'),t(),n(264,"p"),e(265,"For instance, let's say you have an application alternately used by 10 different customers. Each customer has its "),n(266,"strong"),e(267,"own dedicated data source"),t(),e(268,`, and you want to make sure customer A will never be able to reach customer B's database. One way to achieve this could be to declare a request-scoped "data source" provider that - based on the request object - determines what's the "current customer" and retrieves its corresponding database. With this approach, you can turn your application into a multi-tenant application in just a few minutes. But, a major downside to this approach is that since most likely a large chunk of your application' components rely on the "data source" provider, they will implicitly become "request-scoped", and therefore you will undoubtedly see an impact in your apps performance.`),t(),n(269,"p"),e(270,"But what if we had a better solution? Since we only have 10 customers, couldn't we have 10 individual "),n(271,"a",20),e(272,"DI sub-trees"),t(),e(273," per customer (instead of recreating each tree per request)? If your providers don't rely on any property that's truly unique for each consecutive request (e.g., request UUID) but instead there're some specific attributes that let us aggregate (classify) them, there's no reason to "),n(274,"em"),e(275,"recreate DI sub-tree"),t(),e(276," on every incoming request."),t(),n(277,"p"),e(278,"And that's exactly when the "),n(279,"strong"),e(280,"durable providers"),t(),e(281," come in handy."),t(),n(282,"p"),e(283,"Before we start flagging providers as durable, we must first register a "),n(284,"strong"),e(285,"strategy"),t(),e(286,' that instructs Nest what are those "common request attributes", provide logic that groups requests - associates them with their corresponding DI sub-trees.'),t(),n(287,"app-copy-button")(288,"pre")(289,"code",9),e(290,`
import {
  HostComponentInfo,
  ContextId,
  ContextIdFactory,
  ContextIdStrategy,
} from '@nestjs/core';
import { Request } from 'express';

const tenants = new Map<string, ContextId>();

export class AggregateByTenantContextIdStrategy implements ContextIdStrategy {
  attach(contextId: ContextId, request: Request) {
    const tenantId = request.headers['x-tenant-id'] as string;
    let tenantSubTreeId: ContextId;

    if (tenants.has(tenantId)) {
      tenantSubTreeId = tenants.get(tenantId);
    } else {
      tenantSubTreeId = ContextIdFactory.create();
      tenants.set(tenantId, tenantSubTreeId);
    }

    // If tree is not durable, return the original "contextId" object
    return (info: HostComponentInfo) =>
      info.isTreeDurable ? tenantSubTreeId : contextId;
  }
}
`),t()()(),n(291,"blockquote",7)(292,"strong"),e(293,"Hint"),t(),e(294," Similar to the request scope, durability bubbles up the injection chain. That means if A depends on B which is flagged as "),n(295,"code"),e(296,"durable"),t(),e(297,", A implicitly becomes durable too (unless "),n(298,"code"),e(299,"durable"),t(),e(300," is explicitly set to "),n(301,"code"),e(302,"false"),t(),e(303,` for A provider).
`),t(),n(304,"blockquote",11)(305,"strong"),e(306,"Warning"),t(),e(307,` Note this strategy is not ideal for applications operating with a large number of tenants.
`),t(),n(308,"p"),e(309,"The value returned from the "),n(310,"code"),e(311,"attach"),t(),e(312," method instructs Nest what context identifier should be used for a given host. In this case, we specified that the "),n(313,"code"),e(314,"tenantSubTreeId"),t(),e(315," should be used instead of the original, auto-generated "),n(316,"code"),e(317,"contextId"),t(),e(318," object, when the host component (e.g., request-scoped controller) is flagged as durable (you can learn how to mark providers as durable below). Also, in the above example, "),n(319,"strong"),e(320,"no payload"),t(),e(321," would be registered (where payload = "),n(322,"code"),e(323,"REQUEST"),t(),e(324,"/"),n(325,"code"),e(326,"CONTEXT"),t(),e(327,' provider that represents the "root" - parent of the sub-tree).'),t(),n(328,"p"),e(329,"If you want to register the payload for a durable tree, use the following construction instead:"),t(),n(330,"app-copy-button")(331,"pre")(332,"code",9),e(333,`
// The return of \`AggregateByTenantContextIdStrategy#attach\` method:
return {
  resolve: (info: HostComponentInfo) =>
    info.isTreeDurable ? tenantSubTreeId : contextId,
  payload: { tenantId },
};
`),t()()(),n(334,"p"),e(335,"Now whenever you inject the "),n(336,"code"),e(337,"REQUEST"),t(),e(338," provider (or "),n(339,"code"),e(340,"CONTEXT"),t(),e(341," for GraphQL applications) using the "),n(342,"code"),e(343,"@Inject(REQUEST)"),t(),e(344,"/"),n(345,"code"),e(346,"@Inject(CONTEXT)"),t(),e(347,", the "),n(348,"code"),e(349,"payload"),t(),e(350," object would be injected (consisting of a single property - "),n(351,"code"),e(352,"tenantId"),t(),e(353," in this case)."),t(),n(354,"p"),e(355,"Alright so with this strategy in place, you can register it somewhere in your code (as it applies globally anyway), so for example, you could place it in the "),n(356,"code"),e(357,"main.ts"),t(),e(358," file:"),t(),n(359,"app-copy-button")(360,"pre")(361,"code",9),e(362,`
ContextIdFactory.apply(new AggregateByTenantContextIdStrategy());
`),t()()(),n(363,"blockquote",7)(364,"strong"),e(365,"Hint"),t(),e(366," The "),n(367,"code"),e(368,"ContextIdFactory"),t(),e(369," class is imported from the "),n(370,"code"),e(371,"@nestjs/core"),t(),e(372,` package.
`),t(),n(373,"p"),e(374,"As long as the registration occurs before any request hits your application, everything will work as intended."),t(),n(375,"p"),e(376,"Lastly, to turn a regular provider into a durable provider, simply set the "),n(377,"code"),e(378,"durable"),t(),e(379," flag to "),n(380,"code"),e(381,"true"),t(),e(382," and change its scope to "),n(383,"code"),e(384,"Scope.REQUEST"),t(),e(385," (not needed if the REQUEST scope is in the injection chain already):"),t(),n(386,"app-copy-button")(387,"pre")(388,"code",9),e(389,`
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class CatsService {}
`),t()()(),n(390,"p"),e(391,"Similarly, for "),n(392,"a",10),e(393,"custom providers"),t(),e(394,", set the "),n(395,"code"),e(396,"durable"),t(),e(397," property in the long-hand form for a provider registration:"),t(),n(398,"app-copy-button")(399,"pre")(400,"code",9),e(401,`
{
  provide: 'foobar',
  useFactory: () => { ... },
  scope: Scope.REQUEST,
  durable: true,
}
`),t()()()())},dependencies:[E,b,w,R],encapsulation:2,changeDetection:0})}return a})();var Y=(()=>{class a extends v{static \u0275fac=(()=>{let l;return function(u){return(l||(l=f(a)))(u||a)}})();static \u0275cmp=S({type:a,selectors:[["app-unit-testing"]],features:[g],decls:565,vars:24,consts:[["contentReference",""],["appa7ab8249a5066ec374c44bd0d4d17d3b2ede8ec2",""],["appd45c5a64d6b9f3c21f2d146bbdaa65e562a20b3e",""],["appffa1e6375dd1c647347c4a2f41786bc130c3810a",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/fundamentals/unit-testing.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","testing"],["rel","nofollow","target","_blank","href","https://github.com/facebook/jest"],["rel","nofollow","target","_blank","href","https://github.com/visionmedia/supertest"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","unit-testing"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","testing-utilities"],["routerLink","/fundamentals/module-ref"],[1,"warning"],["routerLink","/fundamentals/custom-providers"],["appAnchor","","id","auto-mocking"],["rel","nofollow","target","_blank","href","https://www.npmjs.com/package/jest-mock"],["rel","nofollow","target","_blank","href","https://github.com/golevelup/nestjs/tree/master/packages/testing"],["appAnchor","","id","end-to-end-testing"],["routerLink","/techniques/performance"],[1,"language-ts"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/custom-providers"],["rel","nofollow","target","_blank","href","https://en.wikipedia.org/wiki/Fluent_interface"],["href","/fundamentals/module-ref"],["appAnchor","","id","overriding-globally-registered-enhancers"],["appAnchor","","id","testing-request-scoped-instances"],["routerLink","/fundamentals/injection-scopes"],["href","https://docs.nestjs.com/fundamentals/module-ref#resolving-scoped-providers"]],template:function(d,u){if(d&1&&(n(0,"div",4,0)(2,"div",5)(3,"a",6),r(4,"i",7),t()(),n(5,"h3",8),e(6,"Testing"),t(),n(7,"p"),e(8,"Automated testing is considered an essential part of any serious software development effort. Automation makes it easy to repeat individual tests or test suites quickly and easily during development. This helps ensure that releases meet quality and performance goals. Automation helps increase coverage and provides a faster feedback loop to developers. Automation both increases the productivity of individual developers and ensures that tests are run at critical development lifecycle junctures, such as source code control check-in, feature integration, and version release."),t(),n(9,"p"),e(10,"Such tests often span a variety of types, including unit tests, end-to-end (e2e) tests, integration tests, and so on. While the benefits are unquestionable, it can be tedious to set them up. Nest strives to promote development best practices, including effective testing, so it includes features such as the following to help developers and teams build and automate tests. Nest:"),t(),n(11,"ul")(12,"li"),e(13,"automatically scaffolds default unit tests for components and e2e tests for applications"),t(),n(14,"li"),e(15,"provides default tooling (such as a test runner that builds an isolated module/application loader)"),t(),n(16,"li"),e(17,"provides integration with "),n(18,"a",9),e(19,"Jest"),t(),e(20," and "),n(21,"a",10),e(22,"Supertest"),t(),e(23," out-of-the-box, while remaining agnostic to testing tools"),t(),n(24,"li"),e(25,"makes the Nest dependency injection system available in the testing environment for easily mocking components"),t()(),n(26,"p"),e(27,"As mentioned, you can use any "),n(28,"strong"),e(29,"testing framework"),t(),e(30," that you like, as Nest doesn't force any specific tooling. Simply replace the elements needed (such as the test runner), and you will still enjoy the benefits of Nest's ready-made testing facilities."),t(),n(31,"h4",11)(32,"span"),e(33,"Installation"),t()(),n(34,"p"),e(35,"To get started, first install the required package:"),t(),n(36,"pre")(37,"code",12),e(38,`
$ npm i --save-dev @nestjs/testing
`),t()(),n(39,"h4",13)(40,"span"),e(41,"Unit testing"),t()(),n(42,"p"),e(43,"In the following example, we test two classes: "),n(44,"code"),e(45,"CatsController"),t(),e(46," and "),n(47,"code"),e(48,"CatsService"),t(),e(49,". As mentioned, "),n(50,"a",9),e(51,"Jest"),t(),e(52," is provided as the default testing framework. It serves as a test-runner and also provides assert functions and test-double utilities that help with mocking, spying, etc. In the following basic test, we manually instantiate these classes, and ensure that the controller and service fulfill their API contract."),t(),n(53,"app-copy-button",14)(54,"span",15),e(55),m(56,"extension"),r(57,"app-tabs",null,1),t(),n(59,"pre")(60,"code",16),e(61,`
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
`),t()(),n(62,"pre")(63,"code",16),e(64,`
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController;
  let catsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
`),t()()(),n(65,"blockquote",17)(66,"strong"),e(67,"Hint"),t(),e(68," Keep your test files located near the classes they test. Testing files should have a "),n(69,"code"),e(70,".spec"),t(),e(71," or "),n(72,"code"),e(73,".test"),t(),e(74,` suffix.
`),t(),n(75,"p"),e(76,"Because the above sample is trivial, we aren't really testing anything Nest-specific. Indeed, we aren't even using dependency injection (notice that we pass an instance of "),n(77,"code"),e(78,"CatsService"),t(),e(79," to our "),n(80,"code"),e(81,"catsController"),t(),e(82,"). This form of testing - where we manually instantiate the classes being tested - is often called "),n(83,"strong"),e(84,"isolated testing"),t(),e(85," as it is independent from the framework. Let's introduce some more advanced capabilities that help you test applications that make more extensive use of Nest features."),t(),n(86,"h4",18)(87,"span"),e(88,"Testing utilities"),t()(),n(89,"p"),e(90,"The "),n(91,"code"),e(92,"@nestjs/testing"),t(),e(93," package provides a set of utilities that enable a more robust testing process. Let's rewrite the previous example using the built-in "),n(94,"code"),e(95,"Test"),t(),e(96," class:"),t(),n(97,"app-copy-button",14)(98,"span",15),e(99),m(100,"extension"),r(101,"app-tabs",null,2),t(),n(103,"pre")(104,"code",16),e(105,`
import { Test } from '@nestjs/testing';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

    catsService = moduleRef.get(CatsService);
    catsController = moduleRef.get(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
`),t()(),n(106,"pre")(107,"code",16),e(108,`
import { Test } from '@nestjs/testing';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController;
  let catsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

    catsService = moduleRef.get(CatsService);
    catsController = moduleRef.get(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
`),t()()(),n(109,"p"),e(110,"The "),n(111,"code"),e(112,"Test"),t(),e(113," class is useful for providing an application execution context that essentially mocks the full Nest runtime, but gives you hooks that make it easy to manage class instances, including mocking and overriding. The "),n(114,"code"),e(115,"Test"),t(),e(116," class has a "),n(117,"code"),e(118,"createTestingModule()"),t(),e(119," method that takes a module metadata object as its argument (the same object you pass to the "),n(120,"code"),e(121,"@Module()"),t(),e(122," decorator). This method returns a "),n(123,"code"),e(124,"TestingModule"),t(),e(125," instance which in turn provides a few methods. For unit tests, the important one is the "),n(126,"code"),e(127,"compile()"),t(),e(128," method. This method bootstraps a module with its dependencies (similar to the way an application is bootstrapped in the conventional "),n(129,"code"),e(130,"main.ts"),t(),e(131," file using "),n(132,"code"),e(133,"NestFactory.create()"),t(),e(134,"), and returns a module that is ready for testing."),t(),n(135,"blockquote",17)(136,"strong"),e(137,"Hint"),t(),e(138," The "),n(139,"code"),e(140,"compile()"),t(),e(141," method is "),n(142,"strong"),e(143,"asynchronous"),t(),e(144," and therefore has to be awaited. Once the module is compiled you can retrieve any "),n(145,"strong"),e(146,"static"),t(),e(147," instance it declares (controllers and providers) using the "),n(148,"code"),e(149,"get()"),t(),e(150,` method.
`),t(),n(151,"p")(152,"code"),e(153,"TestingModule"),t(),e(154," inherits from the "),n(155,"a",19),e(156,"module reference"),t(),e(157," class, and therefore its ability to dynamically resolve scoped providers (transient or request-scoped). Do this with the "),n(158,"code"),e(159,"resolve()"),t(),e(160," method (the "),n(161,"code"),e(162,"get()"),t(),e(163," method can only retrieve static instances)."),t(),n(164,"app-copy-button")(165,"pre")(166,"code",16),e(167,`
const moduleRef = await Test.createTestingModule({
  controllers: [CatsController],
  providers: [CatsService],
}).compile();

catsService = await moduleRef.resolve(CatsService);
`),t()()(),n(168,"blockquote",20)(169,"strong"),e(170,"Warning"),t(),e(171," The "),n(172,"code"),e(173,"resolve()"),t(),e(174," method returns a unique instance of the provider, from its own "),n(175,"strong"),e(176,"DI container sub-tree"),t(),e(177,`. Each sub-tree has a unique context identifier. Thus, if you call this method more than once and compare instance references, you will see that they are not equal.
`),t(),n(178,"blockquote",17)(179,"strong"),e(180,"Hint"),t(),e(181," Learn more about the module reference features "),n(182,"a",19),e(183,"here"),t(),e(184,`.
`),t(),n(185,"p"),e(186,"Instead of using the production version of any provider, you can override it with a "),n(187,"a",21),e(188,"custom provider"),t(),e(189," for testing purposes. For example, you can mock a database service instead of connecting to a live database. We'll cover overrides in the next section, but they're available for unit tests as well."),t(),n(190,"p"),r(191,"app-banner-courses"),t(),n(192,"h4",22)(193,"span"),e(194,"Auto mocking"),t()(),n(195,"p"),e(196,"Nest also allows you to define a mock factory to apply to all of your missing dependencies. This is useful for cases where you have a large number of dependencies in a class and mocking all of them will take a long time and a lot of setup. To make use of this feature, the "),n(197,"code"),e(198,"createTestingModule()"),t(),e(199," will need to be chained up with the "),n(200,"code"),e(201,"useMocker()"),t(),e(202," method, passing a factory for your dependency mocks. This factory can take in an optional token, which is an instance token, any token which is valid for a Nest provider, and returns a mock implementation. The below is an example of creating a generic mocker using "),n(203,"a",23)(204,"code"),e(205,"jest-mock"),t()(),e(206," and a specific mock for "),n(207,"code"),e(208,"CatsService"),t(),e(209," using "),n(210,"code"),e(211,"jest.fn()"),t(),e(212,"."),t(),n(213,"app-copy-button")(214,"pre")(215,"code",16),e(216,`
// ...
import { ModuleMocker, MockMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('CatsController', () => {
  let controller: CatsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CatsController],
    })
      .useMocker((token) => {
        const results = ['test1', 'test2'];
        if (token === CatsService) {
          return { findAll: jest.fn().mockResolvedValue(results) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(
            mockMetadata,
          ) as ObjectConstructor;
          return new Mock();
        }
      })
      .compile();

    controller = moduleRef.get(CatsController);
  });
});
`),t()()(),n(217,"p"),e(218,"You can also retrieve these mocks out of the testing container as you normally would custom providers, "),n(219,"code"),e(220,"moduleRef.get(CatsService)"),t(),e(221,"."),t(),n(222,"blockquote",17)(223,"strong"),e(224,"Hint"),t(),e(225," A general mock factory, like "),n(226,"code"),e(227,"createMock"),t(),e(228," from "),n(229,"a",24)(230,"code"),e(231,"@golevelup/ts-jest"),t()(),e(232,` can also be passed directly.
`),t(),n(233,"blockquote",17)(234,"strong"),e(235,"Hint"),t(),n(236,"code"),e(237,"REQUEST"),t(),e(238," and "),n(239,"code"),e(240,"INQUIRER"),t(),e(241," providers cannot be auto-mocked because they're already pre-defined in the context. However, they can be "),n(242,"em"),e(243,"overwritten"),t(),e(244," using the custom provider syntax or by utilizing the "),n(245,"code"),e(246,".overrideProvider"),t(),e(247,` method.
`),t(),n(248,"h4",25)(249,"span"),e(250,"End-to-end testing"),t()(),n(251,"p"),e(252,"Unlike unit testing, which focuses on individual modules and classes, end-to-end (e2e) testing covers the interaction of classes and modules at a more aggregate level -- closer to the kind of interaction that end-users will have with the production system. As an application grows, it becomes hard to manually test the end-to-end behavior of each API endpoint. Automated end-to-end tests help us ensure that the overall behavior of the system is correct and meets project requirements. To perform e2e tests we use a similar configuration to the one we just covered in "),n(253,"strong"),e(254,"unit testing"),t(),e(255,". In addition, Nest makes it easy to use the "),n(256,"a",10),e(257,"Supertest"),t(),e(258," library to simulate HTTP requests."),t(),n(259,"app-copy-button",14)(260,"span",15),e(261),m(262,"extension"),r(263,"app-tabs",null,3),t(),n(265,"pre")(266,"code",16),e(267,`
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';
import { INestApplication } from '@nestjs/common';

describe('Cats', () => {
  let app: INestApplication;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(\`/GET cats\`, () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .expect({
        data: catsService.findAll(),
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
`),t()(),n(268,"pre")(269,"code",16),e(270,`
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';
import { INestApplication } from '@nestjs/common';

describe('Cats', () => {
  let app: INestApplication;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(\`/GET cats\`, () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .expect({
        data: catsService.findAll(),
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
`),t()()(),n(271,"blockquote",17)(272,"strong"),e(273,"Hint"),t(),e(274," If you're using "),n(275,"a",26),e(276,"Fastify"),t(),e(277,` as your HTTP adapter, it requires a slightly different configuration, and has built-in testing capabilities:
`),n(278,"app-copy-button")(279,"pre")(280,"code",27),e(281,`
let app: NestFastifyApplication;

beforeAll(async () => {
  app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

it(\`/GET cats\`, () => {
  return app
    .inject({
      method: 'GET',
      url: '/cats',
    })
    .then((result) => {
      expect(result.statusCode).toEqual(200);
      expect(result.payload).toEqual(/* expectedPayload */);
    });
});

afterAll(async () => {
  await app.close();
});
`),t()()()(),n(282,"p"),e(283,"In this example, we build on some of the concepts described earlier. In addition to the "),n(284,"code"),e(285,"compile()"),t(),e(286," method we used earlier, we now use the "),n(287,"code"),e(288,"createNestApplication()"),t(),e(289," method to instantiate a full Nest runtime environment."),t(),n(290,"p"),e(291,"One caveat to consider is that when your application is compiled using the "),n(292,"code"),e(293,"compile()"),t(),e(294," method, the "),n(295,"code"),e(296,"HttpAdapterHost#httpAdapter"),t(),e(297," will be undefined at that time. This is because there isn't an HTTP adapter or server created yet during this compilation phase. If your test requires the "),n(298,"code"),e(299,"httpAdapter"),t(),e(300,", you should use the "),n(301,"code"),e(302,"createNestApplication()"),t(),e(303," method to create the application instance, or refactor your project to avoid this dependency when initializing the dependencies graph."),t(),n(304,"p"),e(305,"Alright, let's break down the example:"),t(),n(306,"p"),e(307,"We save a reference to the running app in our "),n(308,"code"),e(309,"app"),t(),e(310," variable so we can use it to simulate HTTP requests."),t(),n(311,"p"),e(312,"We simulate HTTP tests using the "),n(313,"code"),e(314,"request()"),t(),e(315," function from Supertest. We want these HTTP requests to route to our running Nest app, so we pass the "),n(316,"code"),e(317,"request()"),t(),e(318," function a reference to the HTTP listener that underlies Nest (which, in turn, may be provided by the Express platform). Hence the construction "),n(319,"code"),e(320,"request(app.getHttpServer())"),t(),e(321,". The call to "),n(322,"code"),e(323,"request()"),t(),e(324," hands us a wrapped HTTP Server, now connected to the Nest app, which exposes methods to simulate an actual HTTP request. For example, using "),n(325,"code"),e(326,"request(...).get('/cats')"),t(),e(327," will initiate a request to the Nest app that is identical to an "),n(328,"strong"),e(329,"actual"),t(),e(330," HTTP request like "),n(331,"code"),e(332,"get '/cats'"),t(),e(333," coming in over the network."),t(),n(334,"p"),e(335,"In this example, we also provide an alternate (test-double) implementation of the "),n(336,"code"),e(337,"CatsService"),t(),e(338," which simply returns a hard-coded value that we can test for. Use "),n(339,"code"),e(340,"overrideProvider()"),t(),e(341," to provide such an alternate implementation. Similarly, Nest provides methods to override modules, guards, interceptors, filters and pipes with the "),n(342,"code"),e(343,"overrideModule()"),t(),e(344,", "),n(345,"code"),e(346,"overrideGuard()"),t(),e(347,", "),n(348,"code"),e(349,"overrideInterceptor()"),t(),e(350,", "),n(351,"code"),e(352,"overrideFilter()"),t(),e(353,", and "),n(354,"code"),e(355,"overridePipe()"),t(),e(356," methods respectively."),t(),n(357,"p"),e(358,"Each of the override methods (except for "),n(359,"code"),e(360,"overrideModule()"),t(),e(361,") returns an object with 3 different methods that mirror those described for "),n(362,"a",28),e(363,"custom providers"),t(),e(364,":"),t(),n(365,"ul")(366,"li")(367,"code"),e(368,"useClass"),t(),e(369,": you supply a class that will be instantiated to provide the instance to override the object (provider, guard, etc.)."),t(),n(370,"li")(371,"code"),e(372,"useValue"),t(),e(373,": you supply an instance that will override the object."),t(),n(374,"li")(375,"code"),e(376,"useFactory"),t(),e(377,": you supply a function that returns an instance that will override the object."),t()(),n(378,"p"),e(379,"On the other hand, "),n(380,"code"),e(381,"overrideModule()"),t(),e(382," returns an object with the "),n(383,"code"),e(384,"useModule()"),t(),e(385," method, which you can use to supply a module that will override the original module, as follows:"),t(),n(386,"app-copy-button")(387,"pre")(388,"code",16),e(389,`
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideModule(CatsModule)
  .useModule(AlternateCatsModule)
  .compile();
`),t()()(),n(390,"p"),e(391,"Each of the override method types, in turn, returns the "),n(392,"code"),e(393,"TestingModule"),t(),e(394," instance, and can thus be chained with other methods in the "),n(395,"a",29),e(396,"fluent style"),t(),e(397,". You should use "),n(398,"code"),e(399,"compile()"),t(),e(400," at the end of such a chain to cause Nest to instantiate and initialize the module."),t(),n(401,"p"),e(402,"Also, sometimes you may want to provide a custom logger e.g. when the tests are run (for example, on a CI server). Use the "),n(403,"code"),e(404,"setLogger()"),t(),e(405," method and pass an object that fulfills the "),n(406,"code"),e(407,"LoggerService"),t(),e(408," interface to instruct the "),n(409,"code"),e(410,"TestModuleBuilder"),t(),e(411,' how to log during tests (by default, only "error" logs will be logged to the console).'),t(),n(412,"p"),e(413,"The compiled module has several useful methods, as described in the following table:"),t(),n(414,"table")(415,"tr")(416,"td")(417,"code"),e(418,"createNestApplication()"),t()(),n(419,"td"),e(420," Creates and returns a Nest application ("),n(421,"code"),e(422,"INestApplication"),t(),e(423," instance) based on the given module. Note that you must manually initialize the application using the "),n(424,"code"),e(425,"init()"),t(),e(426," method. "),t()(),n(427,"tr")(428,"td")(429,"code"),e(430,"createNestMicroservice()"),t()(),n(431,"td"),e(432," Creates and returns a Nest microservice ("),n(433,"code"),e(434,"INestMicroservice"),t(),e(435," instance) based on the given module. "),t()(),n(436,"tr")(437,"td")(438,"code"),e(439,"get()"),t()(),n(440,"td"),e(441," Retrieves a static instance of a controller or provider (including guards, filters, etc.) available in the application context. Inherited from the "),n(442,"a",30),e(443,"module reference"),t(),e(444," class. "),t()(),n(445,"tr")(446,"td")(447,"code"),e(448,"resolve()"),t()(),n(449,"td"),e(450," Retrieves a dynamically created scoped instance (request or transient) of a controller or provider (including guards, filters, etc.) available in the application context. Inherited from the "),n(451,"a",30),e(452,"module reference"),t(),e(453," class. "),t()(),n(454,"tr")(455,"td")(456,"code"),e(457,"select()"),t()(),n(458,"td"),e(459," Navigates through the module's dependency graph; can be used to retrieve a specific instance from the selected module (used along with strict mode ("),n(460,"code"),e(461,"strict: true"),t(),e(462,") in "),n(463,"code"),e(464,"get()"),t(),e(465," method). "),t()()(),n(466,"blockquote",17)(467,"strong"),e(468,"Hint"),t(),e(469," Keep your e2e test files inside the "),n(470,"code"),e(471,"test"),t(),e(472," directory. The testing files should have a "),n(473,"code"),e(474,".e2e-spec"),t(),e(475,` suffix.
`),t(),n(476,"h4",31)(477,"span"),e(478,"Overriding globally registered enhancers"),t()(),n(479,"p"),e(480,"If you have a globally registered guard (or pipe, interceptor, or filter), you need to take a few more steps to override that enhancer. To recap the original registration looks like this:"),t(),n(481,"app-copy-button")(482,"pre")(483,"code",16),e(484,`
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
`),t()()(),n(485,"p"),e(486,'This is registering the guard as a "multi"-provider through the '),n(487,"code"),e(488,"APP_*"),t(),e(489," token. To be able to replace the "),n(490,"code"),e(491,"JwtAuthGuard"),t(),e(492," here, the registration needs to use an existing provider in this slot:"),t(),n(493,"app-copy-button")(494,"pre")(495,"code",16),e(496,`
providers: [
  {
    provide: APP_GUARD,
    useExisting: JwtAuthGuard,
    // ^^^^^^^^ notice the use of 'useExisting' instead of 'useClass'
  },
  JwtAuthGuard,
],
`),t()()(),n(497,"blockquote",17)(498,"strong"),e(499,"Hint"),t(),e(500," Change the "),n(501,"code"),e(502,"useClass"),t(),e(503," to "),n(504,"code"),e(505,"useExisting"),t(),e(506,` to reference a registered provider instead of having Nest instantiate it behind the token.
`),t(),n(507,"p"),e(508,"Now the "),n(509,"code"),e(510,"JwtAuthGuard"),t(),e(511," is visible to Nest as a regular provider that can be overridden when creating the "),n(512,"code"),e(513,"TestingModule"),t(),e(514,":"),t(),n(515,"app-copy-button")(516,"pre")(517,"code",16),e(518,`
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(JwtAuthGuard)
  .useClass(MockAuthGuard)
  .compile();
`),t()()(),n(519,"p"),e(520,"Now all your tests will use the "),n(521,"code"),e(522,"MockAuthGuard"),t(),e(523," on every request."),t(),n(524,"h4",32)(525,"span"),e(526,"Testing request-scoped instances"),t()(),n(527,"p")(528,"a",33),e(529,"Request-scoped"),t(),e(530," providers are created uniquely for each incoming "),n(531,"strong"),e(532,"request"),t(),e(533,". The instance is garbage-collected after the request has completed processing. This poses a problem, because we can't access a dependency injection sub-tree generated specifically for a tested request."),t(),n(534,"p"),e(535,"We know (based on the sections above) that the "),n(536,"code"),e(537,"resolve()"),t(),e(538," method can be used to retrieve a dynamically instantiated class. Also, as described "),n(539,"a",34),e(540,"here"),t(),e(541,", we know we can pass a unique context identifier to control the lifecycle of a DI container sub-tree. How do we leverage this in a testing context?"),t(),n(542,"p"),e(543,"The strategy is to generate a context identifier beforehand and force Nest to use this particular ID to create a sub-tree for all incoming requests. In this way we'll be able to retrieve instances created for a tested request."),t(),n(544,"p"),e(545,"To accomplish this, use "),n(546,"code"),e(547,"jest.spyOn()"),t(),e(548," on the "),n(549,"code"),e(550,"ContextIdFactory"),t(),e(551,":"),t(),n(552,"app-copy-button")(553,"pre")(554,"code",16),e(555,`
const contextId = ContextIdFactory.create();
jest
  .spyOn(ContextIdFactory, 'getByRequest')
  .mockImplementation(() => contextId);
`),t()()(),n(556,"p"),e(557,"Now we can use the "),n(558,"code"),e(559,"contextId"),t(),e(560," to access a single generated DI container sub-tree for any subsequent request."),t(),n(561,"app-copy-button")(562,"pre")(563,"code",16),e(564,`
catsService = await moduleRef.resolve(CatsService, contextId);
`),t()()()()),d&2){let h=s(58),x=s(102),y=s(264);i(55),c(" ",p(56,15,"cats.controller.spec",h.isJsActive),`
`),i(4),o("hide",h.isJsActive),i(3),o("hide",!h.isJsActive),i(37),c(" ",p(100,18,"cats.controller.spec",x.isJsActive),`
`),i(4),o("hide",x.isJsActive),i(3),o("hide",!x.isJsActive),i(155),c(" ",p(262,21,"cats.e2e-spec",y.isJsActive),`
`),i(4),o("hide",y.isJsActive),i(3),o("hide",!y.isJsActive)}},dependencies:[E,b,C,w,R,k],encapsulation:2,changeDetection:0})}return a})();var K=(()=>{class a extends v{static \u0275fac=(()=>{let l;return function(u){return(l||(l=f(a)))(u||a)}})();static \u0275cmp=S({type:a,selectors:[["app-lazy-loading"]],features:[g],decls:228,vars:8,consts:[["contentReference",""],["appf9cde74c5ae0d73d6f34aaa7bcdc9923b1522f13",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/fundamentals/lazy-loading-modules.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","lazy-loading-modules"],[1,"info"],["rel","nofollow","target","_blank","href","https://angular.dev/"],["rel","nofollow","target","_blank","href","https://angular.dev/guide/ngmodules/lazy-loading#lazy-loading-basics"],[1,"warning"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/lifecycle-events"],["appAnchor","","id","getting-started"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"language-bash"],["routerLink","/fundamentals/module-ref"],[1,"language-json"],["rel","nofollow","target","_blank","href","https://webpack.js.org/guides/code-splitting/"],["appAnchor","","id","lazy-loading-controllers-gateways-and-resolvers"],[1,"error"],["routerLink","/graphql/resolvers"],["routerLink","/websockets/gateways"],["appAnchor","","id","common-use-cases"]],template:function(d,u){if(d&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),r(4,"i",5),t()(),n(5,"h3",6),e(6,"Lazy loading modules"),t(),n(7,"p"),e(8,"By default, modules are eagerly loaded, which means that as soon as the application loads, so do all the modules, whether or not they are immediately necessary. While this is fine for most applications, it may become a bottleneck for apps/workers running in the "),n(9,"strong"),e(10,"serverless environment"),t(),e(11,', where the startup latency ("cold start") is crucial.'),t(),n(12,"p"),e(13,'Lazy loading can help decrease bootstrap time by loading only modules required by the specific serverless function invocation. In addition, you could also load other modules asynchronously once the serverless function is "warm" to speed-up the bootstrap time for subsequent calls even further (deferred modules registration).'),t(),n(14,"blockquote",7)(15,"strong"),e(16,"Hint"),t(),e(17," If you're familiar with the "),n(18,"strong")(19,"a",8),e(20,"Angular"),t()(),e(21,' framework, you might have seen the "'),n(22,"a",9),e(23,"lazy-loading modules"),t(),e(24,'" term before. Be aware that this technique is '),n(25,"strong"),e(26,"functionally different"),t(),e(27,` in Nest and so think about this as an entirely different feature that shares similar naming conventions.
`),t(),n(28,"blockquote",10)(29,"strong"),e(30,"Warning"),t(),e(31," Do note that "),n(32,"a",11),e(33,"lifecycle hooks methods"),t(),e(34,` are not invoked in lazy loaded modules and services.
`),t(),n(35,"h4",12)(36,"span"),e(37,"Getting started"),t()(),n(38,"p"),e(39,"To load modules on-demand, Nest provides the "),n(40,"code"),e(41,"LazyModuleLoader"),t(),e(42," class that can be injected into a class in the normal way:"),t(),n(43,"app-copy-button",13)(44,"span",14),e(45),m(46,"extension"),r(47,"app-tabs",null,1),t(),n(49,"pre")(50,"code",15),e(51,`
@Injectable()
export class CatsService {
  constructor(private lazyModuleLoader: LazyModuleLoader) {}
}
`),t()(),n(52,"pre")(53,"code",15),e(54,`
@Injectable()
@Dependencies(LazyModuleLoader)
export class CatsService {
  constructor(lazyModuleLoader) {
    this.lazyModuleLoader = lazyModuleLoader;
  }
}
`),t()()(),n(55,"blockquote",7)(56,"strong"),e(57,"Hint"),t(),e(58," The "),n(59,"code"),e(60,"LazyModuleLoader"),t(),e(61," class is imported from the "),n(62,"code"),e(63,"@nestjs/core"),t(),e(64,` package.
`),t(),n(65,"p"),e(66,"Alternatively, you can obtain a reference to the "),n(67,"code"),e(68,"LazyModuleLoader"),t(),e(69," provider from within your application bootstrap file ("),n(70,"code"),e(71,"main.ts"),t(),e(72,"), as follows:"),t(),n(73,"app-copy-button")(74,"pre")(75,"code",15),e(76,`
// "app" represents a Nest application instance
const lazyModuleLoader = app.get(LazyModuleLoader);
`),t()()(),n(77,"p"),e(78,"With this in place, you can now load any module using the following construction:"),t(),n(79,"app-copy-button")(80,"pre")(81,"code",15),e(82,`
const { LazyModule } = await import('./lazy.module');
const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);
`),t()()(),n(83,"blockquote",7)(84,"strong"),e(85,"Hint"),t(),e(86,' "Lazy loaded" modules are '),n(87,"strong"),e(88,"cached"),t(),e(89," upon the first "),n(90,"code"),e(91,"LazyModuleLoader#load"),t(),e(92," method invocation. That means, each consecutive attempt to load "),n(93,"code"),e(94,"LazyModule"),t(),e(95," will be "),n(96,"strong"),e(97,"very fast"),t(),e(98,` and will return a cached instance, instead of loading the module again.
`),n(99,"pre")(100,"code",16),e(101,`
Load "LazyModule" attempt: 1
time: 2.379ms
Load "LazyModule" attempt: 2
time: 0.294ms
Load "LazyModule" attempt: 3
time: 0.303ms
`),t()(),n(102,"p"),e(103,'Also, "lazy loaded" modules share the same modules graph as those eagerly loaded on the application bootstrap as well as any other lazy modules registered later in your app.'),t()(),n(104,"p"),e(105,"Where "),n(106,"code"),e(107,"lazy.module.ts"),t(),e(108," is a TypeScript file that exports a "),n(109,"strong"),e(110,"regular Nest module"),t(),e(111," (no extra changes are required)."),t(),n(112,"p"),e(113,"The "),n(114,"code"),e(115,"LazyModuleLoader#load"),t(),e(116," method returns the "),n(117,"a",17),e(118,"module reference"),t(),e(119," (of "),n(120,"code"),e(121,"LazyModule"),t(),e(122,") that lets you navigate the internal list of providers and obtain a reference to any provider using its injection token as a lookup key."),t(),n(123,"p"),e(124,"For example, let's say we have a "),n(125,"code"),e(126,"LazyModule"),t(),e(127," with the following definition:"),t(),n(128,"app-copy-button")(129,"pre")(130,"code",15),e(131,`
@Module({
  providers: [LazyService],
  exports: [LazyService],
})
export class LazyModule {}
`),t()()(),n(132,"blockquote",7)(133,"strong"),e(134,"Hint"),t(),e(135," Lazy loaded modules cannot be registered as "),n(136,"strong"),e(137,"global modules"),t(),e(138," as it simply makes no sense (since they are registered lazily, on-demand when all the statically registered modules have been already instantiated). Likewise, registered "),n(139,"strong"),e(140,"global enhancers"),t(),e(141," (guards/interceptors/etc.) "),n(142,"strong"),e(143,"will not work"),t(),e(144,` properly either.
`),t(),n(145,"p"),e(146,"With this, we could obtain a reference to the "),n(147,"code"),e(148,"LazyService"),t(),e(149," provider, as follows:"),t(),n(150,"app-copy-button")(151,"pre")(152,"code",15),e(153,`
const { LazyModule } = await import('./lazy.module');
const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);

const { LazyService } = await import('./lazy.service');
const lazyService = moduleRef.get(LazyService);
`),t()()(),n(154,"blockquote",10)(155,"strong"),e(156,"Warning"),t(),e(157," If you use "),n(158,"strong"),e(159,"Webpack"),t(),e(160,", make sure to update your "),n(161,"code"),e(162,"tsconfig.json"),t(),e(163," file - setting "),n(164,"code"),e(165,"compilerOptions.module"),t(),e(166," to "),n(167,"code"),e(168,'"esnext"'),t(),e(169," and adding "),n(170,"code"),e(171,"compilerOptions.moduleResolution"),t(),e(172," property with "),n(173,"code"),e(174,'"node"'),t(),e(175,` as a value:
`),n(176,"pre")(177,"code",18),e(178,`
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "node",
    ...
  }
}
`),t()(),n(179,"p"),e(180,"With these options set up, you'll be able to leverage the "),n(181,"a",19),e(182,"code splitting"),t(),e(183," feature."),t()(),n(184,"h4",20)(185,"span"),e(186,"Lazy loading controllers, gateways, and resolvers"),t()(),n(187,"p"),e(188,"Since controllers (or resolvers in GraphQL applications) in Nest represent sets of routes/paths/topics (or queries/mutations), you "),n(189,"strong"),e(190,"cannot lazy load them"),t(),e(191," using the "),n(192,"code"),e(193,"LazyModuleLoader"),t(),e(194," class."),t(),n(195,"blockquote",21)(196,"strong"),e(197,"Warning"),t(),e(198," Controllers, "),n(199,"a",22),e(200,"resolvers"),t(),e(201,", and "),n(202,"a",23),e(203,"gateways"),t(),e(204," registered inside lazy loaded modules will not behave as expected. Similarly, you cannot register middleware functions (by implementing the "),n(205,"code"),e(206,"MiddlewareConsumer"),t(),e(207,` interface) on-demand.
`),t(),n(208,"p"),e(209,"For example, let's say you're building a REST API (HTTP application) with a Fastify driver under the hood (using the "),n(210,"code"),e(211,"@nestjs/platform-fastify"),t(),e(212," package). Fastify does not let you register routes after the application is ready/successfully listening to messages. That means even if we analyzed route mappings registered in the module's controllers, all lazy loaded routes wouldn't be accessible since there is no way to register them at runtime."),t(),n(213,"p"),e(214,"Likewise, some transport strategies we provide as part of the "),n(215,"code"),e(216,"@nestjs/microservices"),t(),e(217," package (including Kafka, gRPC, or RabbitMQ) require to subscribe/listen to specific topics/channels before the connection is established. Once your application starts listening to messages, the framework would not be able to subscribe/listen to new topics."),t(),n(218,"p"),e(219,"Lastly, the "),n(220,"code"),e(221,"@nestjs/graphql"),t(),e(222," package with the code first approach enabled automatically generates the GraphQL schema on-the-fly based on the metadata. That means, it requires all classes to be loaded beforehand. Otherwise, it would not be doable to create the appropriate, valid schema."),t(),n(223,"h4",24)(224,"span"),e(225,"Common use-cases"),t()(),n(226,"p"),e(227,"Most commonly, you will see lazy loaded modules in situations when your worker/cron job/lambda & serverless function/webhook must trigger different services (different logic) based on the input arguments (route path/date/query parameters, etc.). On the other hand, lazy loading modules may not make too much sense for monolithic applications, where the startup time is rather irrelevant."),t()()),d&2){let h=s(48);i(45),c(" ",p(46,5,"cats.service",h.isJsActive),`
`),i(4),o("hide",h.isJsActive),i(3),o("hide",!h.isJsActive)}},dependencies:[E,b,C,w,k],encapsulation:2,changeDetection:0})}return a})();var Pt=[{path:"dynamic-modules",component:J,data:{title:"Dynamic modules"}},{path:"dependency-injection",redirectTo:"custom-providers"},{path:"custom-providers",component:H,data:{title:"Custom providers"}},{path:"platform-agnosticism",component:W,data:{title:"Platform agnosticism"}},{path:"async-components",redirectTo:"async-providers"},{path:"async-providers",component:F,data:{title:"Async providers"}},{path:"module-ref",component:z,data:{title:"Module reference"}},{path:"lazy-loading-modules",component:K,data:{title:"Lazy loading modules"}},{path:"unit-testing",redirectTo:"testing"},{path:"e2e-testing",redirectTo:"testing"},{path:"testing",component:Y,data:{title:"Testing"}},{path:"injection-scopes",component:Q,data:{title:"Injection scopes"}},{path:"execution-context",component:G,data:{title:"Execution context"}},{path:"lifecycle-events",component:U,data:{title:"Lifecycle events"}},{path:"circular-dependency",component:L,data:{title:"Circular dependency"}},{path:"discovery-service",component:B,data:{title:"Discovery service"}}];export{Pt as FUNDAMENTALS_ROUTES};
