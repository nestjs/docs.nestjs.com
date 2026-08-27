import{a as O}from"./chunk-QQYY3UCW.js";import{a as U}from"./chunk-HWO3INMO.js";import{a as B}from"./chunk-A6GBSRU4.js";import{a as y,b as w}from"./chunk-AO7BAPTM.js";import{G as i,L as h,Ma as C,N as f,Qa as S,Ra as g,Sa as E,V as n,W as t,X as o,ja as r,ka as u,la as e,na as l,oa as I,ua as s,va as d,y as x}from"./chunk-IPH2CUBH.js";var J=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-caching"]],features:[f],decls:536,vars:8,consts:[["contentReference",""],["appfd2e814d8f1333244c7fb81504235c28b8e03ab0",""],["appcc0b80ee74f0e631f3213c2cda4c076d3a1b1df8",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/caching.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","caching"],["appAnchor","","id","installation"],[1,"language-bash"],["rel","nofollow","target","_blank","href","https://keyv.org/docs/"],["appAnchor","","id","in-memory-cache"],[1,"language-typescript"],["appAnchor","","id","interacting-with-the-cache-store"],[1,"info"],[1,"warning"],["rel","nofollow","target","_blank","href","https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#javascript_types"],["appAnchor","","id","auto-caching-responses"],["routerLink","/graphql/quick-start"],["href","https://docs.nestjs.com/interceptors#response-mapping"],["appAnchor","","id","time-to-live-ttl"],["rel","nofollow","target","_blank","href","https://en.wikipedia.org/wiki/Time_to_live"],["appAnchor","","id","use-module-globally"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/modules#global-modules"],["appAnchor","","id","global-cache-overrides"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/techniques/caching#different-stores"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/techniques/caching#customize-caching"],["appAnchor","","id","websockets-and-microservices"],[1,"with-heading"],[1,"filename"],["appAnchor","","id","adjust-tracking"],["appAnchor","","id","using-alternative-cache-stores"],["appAnchor","","id","async-configuration"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/20-cache"]],template:function(c,p){if(c&1&&(n(0,"div",3,0)(2,"div",4)(3,"a",5),o(4,"i",6),t()(),n(5,"h3",7),e(6,"Caching"),t(),n(7,"p"),e(8,"Caching is a powerful and straightforward "),n(9,"strong"),e(10,"technique"),t(),e(11," for enhancing your application's performance. By acting as a temporary storage layer, it allows for quicker access to frequently used data, reducing the need to repeatedly fetch or compute the same information. This results in faster response times and improved overall efficiency."),t(),n(12,"h4",8)(13,"span"),e(14,"Installation"),t()(),n(15,"p"),e(16,"To get started with caching in Nest, you need to install the "),n(17,"code"),e(18,"@nestjs/cache-manager"),t(),e(19," package along with the "),n(20,"code"),e(21,"cache-manager"),t(),e(22," package."),t(),n(23,"pre")(24,"code",9),e(25,`
$ npm install @nestjs/cache-manager cache-manager
`),t()(),n(26,"p"),e(27,"By default, everything is stored in memory; Since "),n(28,"code"),e(29,"cache-manager"),t(),e(30," uses "),n(31,"a",10),e(32,"Keyv"),t(),e(33," under the hood, you can easily switch to a more advanced storage solution, such as Redis, by installing the appropriate package. We'll cover this in more detail later."),t(),n(34,"h4",11)(35,"span"),e(36,"In-memory cache"),t()(),n(37,"p"),e(38,"To enable caching in your application, import the "),n(39,"code"),e(40,"CacheModule"),t(),e(41," and configure it using the "),n(42,"code"),e(43,"register()"),t(),e(44," method:"),t(),n(45,"app-copy-button")(46,"pre")(47,"code",12),e(48,`
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
})
export class AppModule {}
`),t()()(),n(49,"p"),e(50,"This setup initializes in-memory caching with default settings, allowing you to start caching data immediately."),t(),n(51,"h4",13)(52,"span"),e(53,"Interacting with the Cache store"),t()(),n(54,"p"),e(55,"To interact with the cache manager instance, inject it to your class using the "),n(56,"code"),e(57,"CACHE_MANAGER"),t(),e(58," token, as follows:"),t(),n(59,"app-copy-button")(60,"pre")(61,"code",12),e(62,`
constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
`),t()()(),n(63,"blockquote",14)(64,"strong"),e(65,"Hint"),t(),e(66," The "),n(67,"code"),e(68,"Cache"),t(),e(69," class and the "),n(70,"code"),e(71,"CACHE_MANAGER"),t(),e(72," token are both imported from the "),n(73,"code"),e(74,"@nestjs/cache-manager"),t(),e(75,` package.
`),t(),n(76,"p"),e(77,"The "),n(78,"code"),e(79,"get"),t(),e(80," method on the "),n(81,"code"),e(82,"Cache"),t(),e(83," instance (from the "),n(84,"code"),e(85,"cache-manager"),t(),e(86," package) is used to retrieve items from the cache. If the item does not exist in the cache, "),n(87,"code"),e(88,"undefined"),t(),e(89," will be returned (in "),n(90,"code"),e(91,"cache-manager"),t(),e(92," v6 and earlier, "),n(93,"code"),e(94,"null"),t(),e(95," was returned instead). Treat both as falsy when migrating."),t(),n(96,"app-copy-button")(97,"pre")(98,"code",12),e(99,`
const value = await this.cacheManager.get('key');
`),t()()(),n(100,"p"),e(101,"To add an item to the cache, use the "),n(102,"code"),e(103,"set"),t(),e(104," method:"),t(),n(105,"app-copy-button")(106,"pre")(107,"code",12),e(108,`
await this.cacheManager.set('key', 'value');
`),t()()(),n(109,"blockquote",15)(110,"strong"),e(111,"Note"),t(),e(112," The in-memory cache storage can only store values of types that are supported by "),n(113,"a",16),e(114,"the structured clone algorithm"),t(),e(115,`.
`),t(),n(116,"p"),e(117,"You can manually specify a TTL (expiration time in milliseconds) for this specific key, as follows:"),t(),n(118,"app-copy-button")(119,"pre")(120,"code",12),e(121,`
await this.cacheManager.set('key', 'value', 1000);
`),t()()(),n(122,"p"),e(123,"Where "),n(124,"code"),e(125,"1000"),t(),e(126," is the TTL in milliseconds - in this case, the cache item will expire after one second."),t(),n(127,"p"),e(128,"To disable expiration of the cache, set the "),n(129,"code"),e(130,"ttl"),t(),e(131," configuration property to "),n(132,"code"),e(133,"0"),t(),e(134,":"),t(),n(135,"app-copy-button")(136,"pre")(137,"code",12),e(138,`
await this.cacheManager.set('key', 'value', 0);
`),t()()(),n(139,"p"),e(140,"To remove an item from the cache, use the "),n(141,"code"),e(142,"del"),t(),e(143," method:"),t(),n(144,"app-copy-button")(145,"pre")(146,"code",12),e(147,`
await this.cacheManager.del('key');
`),t()()(),n(148,"p"),e(149,"To clear the entire cache, use the "),n(150,"code"),e(151,"clear"),t(),e(152," method:"),t(),n(153,"app-copy-button")(154,"pre")(155,"code",12),e(156,`
await this.cacheManager.clear();
`),t()()(),n(157,"h4",17)(158,"span"),e(159,"Auto-caching responses"),t()(),n(160,"blockquote",15)(161,"strong"),e(162,"Warning"),t(),e(163," In "),n(164,"a",18),e(165,"GraphQL"),t(),e(166," applications, interceptors are executed separately for each field resolver. Thus, "),n(167,"code"),e(168,"CacheModule"),t(),e(169,` (which uses interceptors to cache responses) will not work properly.
`),t(),n(170,"p"),e(171,"To enable auto-caching responses, just tie the "),n(172,"code"),e(173,"CacheInterceptor"),t(),e(174," where you want to cache data."),t(),n(175,"app-copy-button")(176,"pre")(177,"code",12),e(178,`
@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  @Get()
  findAll(): string[] {
    return [];
  }
}
`),t()()(),n(179,"blockquote",15)(180,"strong"),e(181,"Warning"),t(),e(182," Only "),n(183,"code"),e(184,"GET"),t(),e(185," endpoints are cached. Also, HTTP server routes that inject the native response object ("),n(186,"code"),e(187,"@Res()"),t(),e(188,`) cannot use the Cache Interceptor. See
`),n(189,"a",19),e(190,"response mapping"),t(),e(191,` for more details.
`),t(),n(192,"p"),e(193,"To reduce the amount of required boilerplate, you can bind "),n(194,"code"),e(195,"CacheInterceptor"),t(),e(196," to all endpoints globally:"),t(),n(197,"app-copy-button")(198,"pre")(199,"code",12),e(200,`
import { Module } from '@nestjs/common';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
`),t()()(),n(201,"h4",20)(202,"span"),e(203,"Time-to-live (TTL)"),t()(),n(204,"p"),e(205,"The default value for "),n(206,"code"),e(207,"ttl"),t(),e(208," is "),n(209,"code"),e(210,"0"),t(),e(211,", meaning the cache will never expire. To specify a custom "),n(212,"a",21),e(213,"TTL"),t(),e(214,", you can provide the "),n(215,"code"),e(216,"ttl"),t(),e(217," option in the "),n(218,"code"),e(219,"register()"),t(),e(220," method, as demonstrated below:"),t(),n(221,"app-copy-button")(222,"pre")(223,"code",12),e(224,`
CacheModule.register({
  ttl: 5000, // milliseconds
});
`),t()()(),n(225,"h4",22)(226,"span"),e(227,"Use module globally"),t()(),n(228,"p"),e(229,"When you want to use "),n(230,"code"),e(231,"CacheModule"),t(),e(232," in other modules, you'll need to import it (as is standard with any Nest module). Alternatively, declare it as a "),n(233,"a",23),e(234,"global module"),t(),e(235," by setting the options object's "),n(236,"code"),e(237,"isGlobal"),t(),e(238," property to "),n(239,"code"),e(240,"true"),t(),e(241,", as shown below. In that case, you will not need to import "),n(242,"code"),e(243,"CacheModule"),t(),e(244," in other modules once it's been loaded in the root module (e.g., "),n(245,"code"),e(246,"AppModule"),t(),e(247,")."),t(),n(248,"app-copy-button")(249,"pre")(250,"code",12),e(251,`
CacheModule.register({
  isGlobal: true,
});
`),t()()(),n(252,"h4",24)(253,"span"),e(254,"Global cache overrides"),t()(),n(255,"p"),e(256,"While global cache is enabled, cache entries are stored under a "),n(257,"code"),e(258,"CacheKey"),t(),e(259," that is auto-generated based on the route path. You may override certain cache settings ("),n(260,"code"),e(261,"@CacheKey()"),t(),e(262," and "),n(263,"code"),e(264,"@CacheTTL()"),t(),e(265,") on a per-method basis, allowing customized caching strategies for individual controller methods. This may be most relevant while using "),n(266,"a",25),e(267,"different cache stores."),t()(),n(268,"p"),e(269,"You can apply the "),n(270,"code"),e(271,"@CacheTTL()"),t(),e(272," decorator on a per-controller basis to set a caching TTL for the entire controller. In situations where both controller-level and method-level cache TTL settings are defined, the cache TTL settings specified at the method level will take priority over the ones set at the controller level."),t(),n(273,"app-copy-button")(274,"pre")(275,"code",12),e(276,`
@Controller()
@CacheTTL(50)
export class AppController {
  @CacheKey('custom_key')
  @CacheTTL(20)
  findAll(): string[] {
    return [];
  }
}
`),t()()(),n(277,"blockquote",14)(278,"strong"),e(279,"Hint"),t(),e(280," The "),n(281,"code"),e(282,"@CacheKey()"),t(),e(283," and "),n(284,"code"),e(285,"@CacheTTL()"),t(),e(286," decorators are imported from the "),n(287,"code"),e(288,"@nestjs/cache-manager"),t(),e(289,` package.
`),t(),n(290,"p"),e(291,"The "),n(292,"code"),e(293,"@CacheKey()"),t(),e(294," decorator may be used with or without a corresponding "),n(295,"code"),e(296,"@CacheTTL()"),t(),e(297," decorator and vice versa. One may choose to override only the "),n(298,"code"),e(299,"@CacheKey()"),t(),e(300," or only the "),n(301,"code"),e(302,"@CacheTTL()"),t(),e(303,". Settings that are not overridden with a decorator will use the default values as registered globally (see "),n(304,"a",26),e(305,"Customize caching"),t(),e(306,")."),t(),n(307,"h4",27)(308,"span"),e(309,"WebSockets and Microservices"),t()(),n(310,"p"),e(311,"You can also apply the "),n(312,"code"),e(313,"CacheInterceptor"),t(),e(314," to WebSocket subscribers as well as Microservice's patterns (regardless of the transport method that is being used)."),t(),n(315,"app-copy-button",28)(316,"span",29),o(317,"app-tabs",null,1),t(),n(319,"pre")(320,"code",12),e(321,`
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): Observable<string[]> {
  return [];
}
`),t()(),n(322,"pre")(323,"code",12),e(324,`
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client, data) {
  return [];
}
`),t()()(),n(325,"p"),e(326,"However, the additional "),n(327,"code"),e(328,"@CacheKey()"),t(),e(329," decorator is required in order to specify a key used to subsequently store and retrieve cached data. Also, please note that you "),n(330,"strong"),e(331,"shouldn't cache everything"),t(),e(332,". Actions which perform some business operations rather than simply querying the data should never be cached."),t(),n(333,"p"),e(334,"Additionally, you may specify a cache expiration time (TTL) by using the "),n(335,"code"),e(336,"@CacheTTL()"),t(),e(337," decorator, which will override the global default TTL value."),t(),n(338,"app-copy-button",28)(339,"span",29),o(340,"app-tabs",null,2),t(),n(342,"pre")(343,"code",12),e(344,`
@CacheTTL(10)
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): Observable<string[]> {
  return [];
}
`),t()(),n(345,"pre")(346,"code",12),e(347,`
@CacheTTL(10)
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client, data) {
  return [];
}
`),t()()(),n(348,"blockquote",14)(349,"strong"),e(350,"Hint"),t(),e(351," The "),n(352,"code"),e(353,"@CacheTTL()"),t(),e(354," decorator may be used with or without a corresponding "),n(355,"code"),e(356,"@CacheKey()"),t(),e(357,` decorator.
`),t(),n(358,"h4",30)(359,"span"),e(360,"Adjust tracking"),t()(),n(361,"p"),e(362,"By default, Nest uses the request URL (in an HTTP app) or cache key (in websockets and microservices apps, set through the "),n(363,"code"),e(364,"@CacheKey()"),t(),e(365," decorator) to associate cache records with your endpoints. Nevertheless, sometimes you might want to set up tracking based on different factors, for example, using HTTP headers (e.g. "),n(366,"code"),e(367,"Authorization"),t(),e(368," to properly identify "),n(369,"code"),e(370,"profile"),t(),e(371," endpoints)."),t(),n(372,"p"),e(373,"In order to accomplish that, create a subclass of "),n(374,"code"),e(375,"CacheInterceptor"),t(),e(376," and override the "),n(377,"code"),e(378,"trackBy()"),t(),e(379," method."),t(),n(380,"app-copy-button")(381,"pre")(382,"code",12),e(383,`
@Injectable()
class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    return 'key';
  }
}
`),t()()(),n(384,"h4",31)(385,"span"),e(386,"Using alternative Cache stores"),t()(),n(387,"p"),e(388,"Switching to a different cache store is straightforward. First, install the appropriate package. For example, to use Redis, install the "),n(389,"code"),e(390,"@keyv/redis"),t(),e(391," package:"),t(),n(392,"pre")(393,"code",9),e(394,`
$ npm install @keyv/redis
`),t()(),n(395,"p"),e(396,"With this in place, you can register the "),n(397,"code"),e(398,"CacheModule"),t(),e(399," with multiple stores as shown below:"),t(),n(400,"app-copy-button")(401,"pre")(402,"code",12),e(403,`
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { KeyvCacheableMemory } from 'cacheable';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        return {
          stores: [
            new Keyv({
              store: new KeyvCacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            new KeyvRedis('redis://localhost:6379'),
          ],
        };
      },
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
`),t()()(),n(404,"p"),e(405,"In this example, we've registered two stores: "),n(406,"code"),e(407,"CacheableMemory"),t(),e(408," and "),n(409,"code"),e(410,"KeyvRedis"),t(),e(411,". The "),n(412,"code"),e(413,"CacheableMemory"),t(),e(414," store is a simple in-memory store, which is created via the "),n(415,"code"),e(416,"KeyvCacheableMemory"),t(),e(417," storage adapter, while "),n(418,"code"),e(419,"KeyvRedis"),t(),e(420," is a Redis store. The "),n(421,"code"),e(422,"stores"),t(),e(423," array is used to specify the stores you want to use. The first store in the array is the default store, and the rest are fallback stores."),t(),n(424,"p"),e(425,"Check out the "),n(426,"a",10),e(427,"Keyv documentation"),t(),e(428," for more information on available stores."),t(),n(429,"h4",32)(430,"span"),e(431,"Async configuration"),t()(),n(432,"p"),e(433,"You may want to asynchronously pass in module options instead of passing them statically at compile time. In this case, use the "),n(434,"code"),e(435,"registerAsync()"),t(),e(436," method, which provides several ways to deal with async configuration."),t(),n(437,"p"),e(438,"One approach is to use a factory function:"),t(),n(439,"app-copy-button")(440,"pre")(441,"code",12),e(442,`
CacheModule.registerAsync({
  useFactory: () => ({
    ttl: 5,
  }),
});
`),t()()(),n(443,"p"),e(444,"Our factory behaves like all other asynchronous module factories (it can be "),n(445,"code"),e(446,"async"),t(),e(447," and is able to inject dependencies through "),n(448,"code"),e(449,"inject"),t(),e(450,")."),t(),n(451,"app-copy-button")(452,"pre")(453,"code",12),e(454,`
CacheModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    ttl: configService.get('CACHE_TTL'),
  }),
  inject: [ConfigService],
});
`),t()()(),n(455,"p"),e(456,"Alternatively, you can use the "),n(457,"code"),e(458,"useClass"),t(),e(459," method:"),t(),n(460,"app-copy-button")(461,"pre")(462,"code",12),e(463,`
CacheModule.registerAsync({
  useClass: CacheConfigService,
});
`),t()()(),n(464,"p"),e(465,"The above construction will instantiate "),n(466,"code"),e(467,"CacheConfigService"),t(),e(468," inside "),n(469,"code"),e(470,"CacheModule"),t(),e(471," and will use it to get the options object. The "),n(472,"code"),e(473,"CacheConfigService"),t(),e(474," has to implement the "),n(475,"code"),e(476,"CacheOptionsFactory"),t(),e(477," interface in order to provide the configuration options:"),t(),n(478,"app-copy-button")(479,"pre")(480,"code",12),e(481,`
@Injectable()
class CacheConfigService implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    return {
      ttl: 5,
    };
  }
}
`),t()()(),n(482,"p"),e(483,"If you wish to use an existing configuration provider imported from a different module, use the "),n(484,"code"),e(485,"useExisting"),t(),e(486," syntax:"),t(),n(487,"app-copy-button")(488,"pre")(489,"code",12),e(490,`
CacheModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
`),t()()(),n(491,"p"),e(492,"This works the same as "),n(493,"code"),e(494,"useClass"),t(),e(495," with one critical difference - "),n(496,"code"),e(497,"CacheModule"),t(),e(498," will lookup imported modules to reuse any already-created "),n(499,"code"),e(500,"ConfigService"),t(),e(501,", instead of instantiating its own."),t(),n(502,"blockquote",14)(503,"strong"),e(504,"Hint"),t(),n(505,"code"),e(506,"CacheModule#register"),t(),e(507,", "),n(508,"code"),e(509,"CacheModule#registerAsync"),t(),e(510," and "),n(511,"code"),e(512,"CacheOptionsFactory"),t(),e(513,` have an optional generic (type argument) to narrow down store-specific configuration options, making it type safe.
`),t(),n(514,"p"),e(515,"You can also pass so-called "),n(516,"code"),e(517,"extraProviders"),t(),e(518," to the "),n(519,"code"),e(520,"registerAsync()"),t(),e(521," method. These providers will be merged with the module providers."),t(),n(522,"app-copy-button")(523,"pre")(524,"code",12),e(525,`
CacheModule.registerAsync({
  imports: [ConfigModule],
  useClass: ConfigService,
  extraProviders: [MyAdditionalProvider],
});
`),t()()(),n(526,"p"),e(527,"This is useful when you want to provide additional dependencies to the factory function or the class constructor."),t(),n(528,"h4",33)(529,"span"),e(530,"Example"),t()(),n(531,"p"),e(532,"A working example is available "),n(533,"a",34),e(534,"here"),t(),e(535,"."),t()()),c&2){let b=r(318),v=r(341);i(319),u("hide",b.isJsActive),i(3),u("hide",!b.isJsActive),i(20),u("hide",v.isJsActive),i(3),u("hide",!v.isJsActive)}},dependencies:[g,E,C,y],encapsulation:2,changeDetection:0})}return a})();var z=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-compression"]],features:[f],decls:97,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/compression.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","compression"],["appAnchor","","id","use-with-express-default"],["rel","nofollow","target","_blank","href","https://github.com/expressjs/compression"],[1,"language-bash"],[1,"language-typescript"],["appAnchor","","id","use-with-fastify"],["rel","nofollow","target","_blank","href","https://github.com/fastify/fastify-compress"],[1,"warning"]],template:function(c,p){c&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Compression"),t(),n(7,"p"),e(8,"Compression can greatly decrease the size of the response body, thereby increasing the speed of a web app."),t(),n(9,"p"),e(10,"For "),n(11,"strong"),e(12,"high-traffic"),t(),e(13," websites in production, it is strongly recommended to offload compression from the application server - typically in a reverse proxy (e.g., Nginx). In that case, you should not use compression middleware."),t(),n(14,"h4",6)(15,"span"),e(16,"Use with Express (default)"),t()(),n(17,"p"),e(18,"Use the "),n(19,"a",7),e(20,"compression"),t(),e(21," middleware package to enable gzip compression."),t(),n(22,"p"),e(23,"First install the required package:"),t(),n(24,"pre")(25,"code",8),e(26,`
$ npm i --save compression
$ npm i --save-dev @types/compression
`),t()(),n(27,"p"),e(28,"Once the installation is complete, apply the compression middleware as global middleware."),t(),n(29,"app-copy-button")(30,"pre")(31,"code",9),e(32,`
import * as compression from 'compression';
// somewhere in your initialization file
app.use(compression());
`),t()()(),n(33,"h4",10)(34,"span"),e(35,"Use with Fastify"),t()(),n(36,"p"),e(37,"If using the "),n(38,"code"),e(39,"FastifyAdapter"),t(),e(40,", you'll want to use "),n(41,"a",11),e(42,"fastify-compress"),t(),e(43,":"),t(),n(44,"pre")(45,"code",8),e(46,`
$ npm i --save @fastify/compress
`),t()(),n(47,"p"),e(48,"Once the installation is complete, apply the "),n(49,"code"),e(50,"@fastify/compress"),t(),e(51," middleware as global middleware."),t(),n(52,"blockquote",12)(53,"strong"),e(54,"Warning"),t(),e(55," Please ensure, that you use the type "),n(56,"code"),e(57,"NestFastifyApplication"),t(),e(58," when creating the application. Otherwise, you cannot use "),n(59,"code"),e(60,"register"),t(),e(61,` to apply the compression-middleware.
`),t(),n(62,"app-copy-button")(63,"pre")(64,"code",9),e(65,`
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import compression from '@fastify/compress';

// inside bootstrap()
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
await app.register(compression);
`),t()()(),n(66,"p"),e(67,"By default, "),n(68,"code"),e(69,"@fastify/compress"),t(),e(70," will use Brotli compression (on Node >= 11.7.0) when browsers indicate support for the encoding. While Brotli can be quite efficient in terms of compression ratio, it can also be quite slow. By default, Brotli sets a maximum compression quality of 11, although it can be adjusted to reduce compression time in lieu of compression quality by adjusting the "),n(71,"code"),e(72,"BROTLI_PARAM_QUALITY"),t(),e(73," between 0 min and 11 max. This will require fine tuning to optimize space/time performance. An example with quality 4: "),t(),n(74,"app-copy-button")(75,"pre")(76,"code",9),e(77,`
import { constants } from 'node:zlib';
// somewhere in your initialization file
await app.register(compression, { brotliOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } } });
`),t()()(),n(78,"p"),e(79,"To simplify, you may want to tell "),n(80,"code"),e(81,"fastify-compress"),t(),e(82," to only use deflate and gzip to compress responses; you'll end up with potentially larger responses but they'll be delivered much more quickly."),t(),n(83,"p"),e(84,"To specify encodings, provide a second argument to "),n(85,"code"),e(86,"app.register"),t(),e(87,":"),t(),n(88,"app-copy-button")(89,"pre")(90,"code",9),e(91,`
await app.register(compression, { encodings: ['gzip', 'deflate'] });
`),t()()(),n(92,"p"),e(93,"The above tells "),n(94,"code"),e(95,"fastify-compress"),t(),e(96," to only use gzip and deflate encodings, preferring gzip if the client supports both."),t()())},dependencies:[g,E],encapsulation:2,changeDetection:0})}return a})();var W=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-configuration"]],features:[f],decls:1120,vars:60,consts:[["contentReference",""],["app99136106c0b994e9229d23c055961635cd777f03",""],["app7d0792cd8ad62c821c2d58459f8f942e961b023d",""],["app9c481a96d8701f7f00c886ca84bf2a277e8f5014",""],["app3c9a826e37487abb17050eaf37f3975836e3eadc",""],["app8046c343b010d1c1027c3e3a34fecc123d073009",""],["app83c6513eeb4ab741c7697579c258039eb4993e83",""],["app6894db8bb8b4c455afa094011efef86f80b687bc",""],["app8085acf3b67b675b279496828de2ea9fe35532cd",""],["app61d673fb83d1cec1e2cf51f27daa093c9fb17799",""],["app20dc0bcee7a4cd99094210ca9f643140022a1c37",""],["appc61bb535a3ed9adf1a59986921c5294324a8678d",""],["appd82702d1881a170670115a000a5a0a12f56edd55",""],["appa29ed474572b37cfa74170a1e33a24edc3d71544",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/configuration.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","configuration"],["rel","nofollow","target","_blank","href","https://12factor.net/config"],["appAnchor","","id","installation"],[1,"language-bash"],[1,"info"],["rel","nofollow","target","_blank","href","https://github.com/motdotla/dotenv"],[1,"warning"],["appAnchor","","id","getting-started"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"language-json"],["rel","nofollow","target","_blank","href","https://nodejs.org/dist/v20.18.1/docs/api/cli.html#--env-fileconfig"],["appAnchor","","id","custom-env-file-path"],["appAnchor","","id","disable-env-variables-loading"],["appAnchor","","id","use-module-globally"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/modules#global-modules"],["appAnchor","","id","custom-configuration-files"],["href","techniques/configuration#getting-started"],[1,"language-yaml"],["href","/cli/monorepo#assets"],["appAnchor","","id","using-the-configservice"],["href","techniques/configuration#custom-configuration-files"],["appAnchor","","id","configuration-namespaces"],["appAnchor","","id","namespaced-configurations-in-modules"],["appAnchor","","id","cache-environment-variables"],["appAnchor","","id","partial-registration"],["appAnchor","","id","schema-validation"],["rel","nofollow","target","_blank","href","https://github.com/sideway/joi"],["rel","nofollow","target","_blank","href","https://joi.dev/api/?v=17.3.0#example"],["rel","nofollow","target","_blank","href","https://joi.dev/api/?v=17.3.0#anyvalidatevalue-options"],["appAnchor","","id","custom-validate-function"],["appAnchor","","id","custom-getter-functions"],["appAnchor","","id","environment-variables-loaded-hook"],["appAnchor","","id","conditional-module-configuration"],["appAnchor","","id","expandable-variables"],["rel","nofollow","target","_blank","href","https://github.com/motdotla/dotenv-expand"],["appAnchor","","id","using-in-the-maints"]],template:function(c,p){if(c&1&&(n(0,"div",14,0)(2,"div",15)(3,"a",16),o(4,"i",17),t()(),n(5,"h3",18),e(6,"Configuration"),t(),n(7,"p"),e(8,"Applications often run in different "),n(9,"strong"),e(10,"environments"),t(),e(11,". Depending on the environment, different configuration settings should be used. For example, usually the local environment relies on specific database credentials, valid only for the local DB instance. The production environment would use a separate set of DB credentials. Since configuration variables change, best practice is to "),n(12,"a",19),e(13,"store configuration variables"),t(),e(14," in the environment."),t(),n(15,"p"),e(16,"Externally defined environment variables are visible inside Node.js through the "),n(17,"code"),e(18,"process.env"),t(),e(19," global. We could try to solve the problem of multiple environments by setting the environment variables separately in each environment. This can quickly get unwieldy, especially in the development and testing environments where these values need to be easily mocked and/or changed."),t(),n(20,"p"),e(21,"In Node.js applications, it's common to use "),n(22,"code"),e(23,".env"),t(),e(24," files, holding key-value pairs where each key represents a particular value, to represent each environment. Running an app in different environments is then just a matter of swapping in the correct "),n(25,"code"),e(26,".env"),t(),e(27," file."),t(),n(28,"p"),e(29,"A good approach for using this technique in Nest is to create a "),n(30,"code"),e(31,"ConfigModule"),t(),e(32," that exposes a "),n(33,"code"),e(34,"ConfigService"),t(),e(35," which loads the appropriate "),n(36,"code"),e(37,".env"),t(),e(38," file. While you may choose to write such a module yourself, for convenience Nest provides the "),n(39,"code"),e(40,"@nestjs/config"),t(),e(41," package out-of-the box. We'll cover this package in the current chapter."),t(),n(42,"h4",20)(43,"span"),e(44,"Installation"),t()(),n(45,"p"),e(46,"To begin using it, we first install the required dependency."),t(),n(47,"pre")(48,"code",21),e(49,`
$ npm i --save @nestjs/config
`),t()(),n(50,"blockquote",22)(51,"strong"),e(52,"Hint"),t(),e(53," The "),n(54,"code"),e(55,"@nestjs/config"),t(),e(56," package internally uses "),n(57,"a",23),e(58,"dotenv"),t(),e(59,`.
`),t(),n(60,"blockquote",24)(61,"strong"),e(62,"Note"),t(),n(63,"code"),e(64,"@nestjs/config"),t(),e(65,` requires TypeScript 4.1 or later.
`),t(),n(66,"h4",25)(67,"span"),e(68,"Getting started"),t()(),n(69,"p"),e(70,"Once the installation process is complete, we can import the "),n(71,"code"),e(72,"ConfigModule"),t(),e(73,". Typically, we'll import it into the root "),n(74,"code"),e(75,"AppModule"),t(),e(76," and control its behavior using the "),n(77,"code"),e(78,".forRoot()"),t(),e(79," static method. During this step, environment variable key/value pairs are parsed and resolved. Later, we'll see several options for accessing the "),n(80,"code"),e(81,"ConfigService"),t(),e(82," class of the "),n(83,"code"),e(84,"ConfigModule"),t(),e(85," in our other feature modules."),t(),n(86,"app-copy-button",26)(87,"span",27),e(88),s(89,"extension"),o(90,"app-tabs",null,1),t(),n(92,"pre")(93,"code",28),e(94,`
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
`),t()()(),n(95,"p"),e(96,"The above code will load and parse a "),n(97,"code"),e(98,".env"),t(),e(99," file from the default location (the project root directory), merge key/value pairs from the "),n(100,"code"),e(101,".env"),t(),e(102," file with environment variables assigned to "),n(103,"code"),e(104,"process.env"),t(),e(105,", and store the result in a private structure that you can access through the "),n(106,"code"),e(107,"ConfigService"),t(),e(108,". The "),n(109,"code"),e(110,"forRoot()"),t(),e(111," method registers the "),n(112,"code"),e(113,"ConfigService"),t(),e(114," provider, which provides a "),n(115,"code"),e(116,"get()"),t(),e(117," method for reading these parsed/merged configuration variables. Since "),n(118,"code"),e(119,"@nestjs/config"),t(),e(120," relies on "),n(121,"a",23),e(122,"dotenv"),t(),e(123,", it uses that package's rules for resolving conflicts in environment variable names. When a key exists both in the runtime environment as an environment variable (e.g., via OS shell exports like "),n(124,"code"),e(125,"export DATABASE_USER=test"),t(),e(126,") and in a "),n(127,"code"),e(128,".env"),t(),e(129," file, the runtime environment variable takes precedence."),t(),n(130,"p"),e(131,"A sample "),n(132,"code"),e(133,".env"),t(),e(134," file looks something like this:"),t(),n(135,"pre")(136,"code",29),e(137,`
DATABASE_USER=test
DATABASE_PASSWORD=test
`),t()(),n(138,"p"),e(139,"If you need some env variables to be available even before the "),n(140,"code"),e(141,"ConfigModule"),t(),e(142," is loaded and Nest application is bootstrapped (for example, to pass the microservice configuration to the "),n(143,"code"),e(144,"NestFactory#createMicroservice"),t(),e(145," method), you can use the "),n(146,"code"),e(147,"--env-file"),t(),e(148," option of the Nest CLI. This option allows you to specify the path to the "),n(149,"code"),e(150,".env"),t(),e(151," file that should be loaded before the application starts. "),n(152,"code"),e(153,"--env-file"),t(),e(154," flag support was introduced in Node v20, see "),n(155,"a",30),e(156,"the documentation"),t(),e(157," for more details."),t(),n(158,"pre")(159,"code",21),e(160,`
$ nest start --env-file .env
`),t()(),n(161,"h4",31)(162,"span"),e(163,"Custom env file path"),t()(),n(164,"p"),e(165,"By default, the package looks for a "),n(166,"code"),e(167,".env"),t(),e(168," file in the root directory of the application. To specify another path for the "),n(169,"code"),e(170,".env"),t(),e(171," file, set the "),n(172,"code"),e(173,"envFilePath"),t(),e(174," property of an (optional) options object you pass to "),n(175,"code"),e(176,"forRoot()"),t(),e(177,", as follows:"),t(),n(178,"app-copy-button")(179,"pre")(180,"code",28),e(181,`
ConfigModule.forRoot({
  envFilePath: '.development.env',
});
`),t()()(),n(182,"p"),e(183,"You can also specify multiple paths for "),n(184,"code"),e(185,".env"),t(),e(186," files like this:"),t(),n(187,"app-copy-button")(188,"pre")(189,"code",28),e(190,`
ConfigModule.forRoot({
  envFilePath: ['.env.development.local', '.env.development'],
});
`),t()()(),n(191,"p"),e(192,"If a variable is found in multiple files, the first one takes precedence."),t(),n(193,"h4",32)(194,"span"),e(195,"Disable env variables loading"),t()(),n(196,"p"),e(197,"If you don't want to load the "),n(198,"code"),e(199,".env"),t(),e(200," file, but instead would like to simply access environment variables from the runtime environment (as with OS shell exports like "),n(201,"code"),e(202,"export DATABASE_USER=test"),t(),e(203,"), set the options object's "),n(204,"code"),e(205,"ignoreEnvFile"),t(),e(206," property to "),n(207,"code"),e(208,"true"),t(),e(209,", as follows:"),t(),n(210,"app-copy-button")(211,"pre")(212,"code",28),e(213,`
ConfigModule.forRoot({
  ignoreEnvFile: true,
});
`),t()()(),n(214,"h4",33)(215,"span"),e(216,"Use module globally"),t()(),n(217,"p"),e(218,"When you want to use "),n(219,"code"),e(220,"ConfigModule"),t(),e(221," in other modules, you'll need to import it (as is standard with any Nest module). Alternatively, declare it as a "),n(222,"a",34),e(223,"global module"),t(),e(224," by setting the options object's "),n(225,"code"),e(226,"isGlobal"),t(),e(227," property to "),n(228,"code"),e(229,"true"),t(),e(230,", as shown below. In that case, you will not need to import "),n(231,"code"),e(232,"ConfigModule"),t(),e(233," in other modules once it's been loaded in the root module (e.g., "),n(234,"code"),e(235,"AppModule"),t(),e(236,")."),t(),n(237,"app-copy-button")(238,"pre")(239,"code",28),e(240,`
ConfigModule.forRoot({
  isGlobal: true,
});
`),t()()(),n(241,"h4",35)(242,"span"),e(243,"Custom configuration files"),t()(),n(244,"p"),e(245,"For more complex projects, you may utilize custom configuration files to return nested configuration objects. This allows you to group related configuration settings by function (e.g., database-related settings), and to store related settings in individual files to help manage them independently."),t(),n(246,"p"),e(247,"A custom configuration file exports a factory function that returns a configuration object. The configuration object can be any arbitrarily nested plain JavaScript object. The "),n(248,"code"),e(249,"process.env"),t(),e(250," object will contain the fully resolved environment variable key/value pairs (with "),n(251,"code"),e(252,".env"),t(),e(253," file and externally defined variables resolved and merged as described "),n(254,"a",36),e(255,"above"),t(),e(256,"). Since you control the returned configuration object, you can add any required logic to cast values to an appropriate type, set default values, etc. For example:"),t(),n(257,"app-copy-button",26)(258,"span",27),e(259),s(260,"extension"),o(261,"app-tabs",null,2),t(),n(263,"pre")(264,"code",28),e(265,`
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432
  }
});
`),t()()(),n(266,"p"),e(267,"We load this file using the "),n(268,"code"),e(269,"load"),t(),e(270," property of the options object we pass to the "),n(271,"code"),e(272,"ConfigModule.forRoot()"),t(),e(273," method:"),t(),n(274,"app-copy-button")(275,"pre")(276,"code",28),e(277,`
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
})
export class AppModule {}
`),t()()(),n(278,"blockquote",22)(279,"strong"),e(280,"Notice"),t(),e(281," The value assigned to the "),n(282,"code"),e(283,"load"),t(),e(284," property is an array, allowing you to load multiple configuration files (e.g. "),n(285,"code"),e(286,"load: [databaseConfig, authConfig]"),t(),e(287,`)
`),t(),n(288,"p"),e(289,"With custom configuration files, we can also manage custom files such as YAML files. Here is an example of a configuration using YAML format:"),t(),n(290,"pre")(291,"code",37),e(292,`
http:
  host: 'localhost'
  port: 8080

db:
  postgres:
    url: 'localhost'
    port: 5432
    database: 'yaml-db'

  sqlite:
    database: 'sqlite.db'
`),t()(),n(293,"p"),e(294,"To read and parse YAML files, we can leverage the "),n(295,"code"),e(296,"js-yaml"),t(),e(297," package."),t(),n(298,"pre")(299,"code",21),e(300,`
$ npm i js-yaml
$ npm i -D @types/js-yaml
`),t()(),n(301,"p"),e(302,"Once the package is installed, we use the "),n(303,"code"),e(304,"yaml#load"),t(),e(305," function to load the YAML file we just created above."),t(),n(306,"app-copy-button",26)(307,"span",27),e(308),s(309,"extension"),o(310,"app-tabs",null,3),t(),n(312,"pre")(313,"code",28),e(314,`
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as yaml from 'js-yaml';

const YAML_CONFIG_FILENAME = 'config.yaml';

export default () => {
  return yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;
};
`),t()()(),n(315,"blockquote",24)(316,"strong"),e(317,"Note"),t(),e(318,' Nest CLI does not automatically move your "assets" (non-TS files) to the '),n(319,"code"),e(320,"dist"),t(),e(321," folder during the build process. To make sure that your YAML files are copied, you have to specify this in the "),n(322,"code"),e(323,"compilerOptions#assets"),t(),e(324," object in the "),n(325,"code"),e(326,"nest-cli.json"),t(),e(327," file. As an example, if the "),n(328,"code"),e(329,"config"),t(),e(330," folder is at the same level as the "),n(331,"code"),e(332,"src"),t(),e(333," folder, add "),n(334,"code"),e(335,"compilerOptions#assets"),t(),e(336," with the value "),n(337,"code"),e(338),t(),e(339,". Read more "),n(340,"a",38),e(341,"here"),t(),e(342,`.
`),t(),n(343,"p"),e(344,"Just a quick note - configuration files aren't automatically validated, even if you're using the "),n(345,"code"),e(346,"validationSchema"),t(),e(347," option in NestJS's "),n(348,"code"),e(349,"ConfigModule"),t(),e(350,". If you need validation or want to apply any transformations, you'll have to handle that within the factory function where you have complete control over the configuration object. This allows you to implement any custom validation logic as needed."),t(),n(351,"p"),e(352,"For example, if you want to ensure that port is within a certain range, you can add a validation step to the factory function:"),t(),n(353,"app-copy-button",26)(354,"span",27),e(355),s(356,"extension"),o(357,"app-tabs",null,4),t(),n(359,"pre")(360,"code",28),e(361,`
export default () => {
  const config = yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;

  if (config.http.port < 1024 || config.http.port > 49151) {
    throw new Error('HTTP port must be between 1024 and 49151');
  }

  return config;
};
`),t()()(),n(362,"p"),e(363,"Now, if the port is outside the specified range, the application will throw an error during startup."),t(),n(364,"p"),o(365,"app-banner-devtools"),t(),n(366,"h4",39)(367,"span"),e(368,"Using the "),n(369,"code"),e(370,"ConfigService"),t()()(),n(371,"p"),e(372,"To access configuration values from our "),n(373,"code"),e(374,"ConfigService"),t(),e(375,", we first need to inject "),n(376,"code"),e(377,"ConfigService"),t(),e(378,". As with any provider, we need to import its containing module - the "),n(379,"code"),e(380,"ConfigModule"),t(),e(381," - into the module that will use it (unless you set the "),n(382,"code"),e(383,"isGlobal"),t(),e(384," property in the options object passed to the "),n(385,"code"),e(386,"ConfigModule.forRoot()"),t(),e(387," method to "),n(388,"code"),e(389,"true"),t(),e(390,"). Import it into a feature module as shown below."),t(),n(391,"app-copy-button",26)(392,"span",27),e(393),s(394,"extension"),o(395,"app-tabs",null,5),t(),n(397,"pre")(398,"code",28),e(399,`
@Module({
  imports: [ConfigModule],
  // ...
})
`),t()()(),n(400,"p"),e(401,"Then we can inject it using standard constructor injection:"),t(),n(402,"app-copy-button")(403,"pre")(404,"code",28),e(405,`
constructor(private configService: ConfigService) {}
`),t()()(),n(406,"blockquote",22)(407,"strong"),e(408,"Hint"),t(),e(409," The "),n(410,"code"),e(411,"ConfigService"),t(),e(412," is imported from the "),n(413,"code"),e(414,"@nestjs/config"),t(),e(415,` package.
`),t(),n(416,"p"),e(417,"And use it in our class:"),t(),n(418,"app-copy-button")(419,"pre")(420,"code",28),e(421,`
// get an environment variable
const dbUser = this.configService.get<string>('DATABASE_USER');

// get a custom configuration value
const dbHost = this.configService.get<string>('database.host');
`),t()()(),n(422,"p"),e(423,"As shown above, use the "),n(424,"code"),e(425,"configService.get()"),t(),e(426," method to get a simple environment variable by passing the variable name. You can do TypeScript type hinting by passing the type, as shown above (e.g., "),n(427,"code"),e(428,"get<string>(...)"),t(),e(429,"). The "),n(430,"code"),e(431,"get()"),t(),e(432," method can also traverse a nested custom configuration object (created via a "),n(433,"a",40),e(434,"Custom configuration file"),t(),e(435,"), as shown in the second example above."),t(),n(436,"p"),e(437,"You can also get the whole nested custom configuration object using an interface as the type hint:"),t(),n(438,"app-copy-button")(439,"pre")(440,"code",28),e(441,`
interface DatabaseConfig {
  host: string;
  port: number;
}

const dbConfig = this.configService.get<DatabaseConfig>('database');

// you can now use \`dbConfig.port\` and \`dbConfig.host\`
const port = dbConfig.port;
`),t()()(),n(442,"p"),e(443,"The "),n(444,"code"),e(445,"get()"),t(),e(446," method also takes an optional second argument defining a default value, which will be returned when the key doesn't exist, as shown below:"),t(),n(447,"app-copy-button")(448,"pre")(449,"code",28),e(450,`
// use "localhost" when "database.host" is not defined
const dbHost = this.configService.get<string>('database.host', 'localhost');
`),t()()(),n(451,"p")(452,"code"),e(453,"ConfigService"),t(),e(454," has two optional generics (type arguments). The first one is to help prevent accessing a config property that does not exist. Use it as shown below:"),t(),n(455,"app-copy-button")(456,"pre")(457,"code",28),e(458,`
interface EnvironmentVariables {
  PORT: number;
  TIMEOUT: string;
}

// somewhere in the code
constructor(private configService: ConfigService<EnvironmentVariables>) {
  const port = this.configService.get('PORT', { infer: true });

  // TypeScript Error: this is invalid as the URL property is not defined in EnvironmentVariables
  const url = this.configService.get('URL', { infer: true });
}
`),t()()(),n(459,"p"),e(460,"With the "),n(461,"code"),e(462,"infer"),t(),e(463," property set to "),n(464,"code"),e(465,"true"),t(),e(466,", the "),n(467,"code"),e(468,"ConfigService#get"),t(),e(469," method will automatically infer the property type based on the interface, so for example, "),n(470,"code"),e(471,'typeof port === "number"'),t(),e(472," (if you're not using "),n(473,"code"),e(474,"strictNullChecks"),t(),e(475," flag from TypeScript) since "),n(476,"code"),e(477,"PORT"),t(),e(478," has a "),n(479,"code"),e(480,"number"),t(),e(481," type in the "),n(482,"code"),e(483,"EnvironmentVariables"),t(),e(484," interface."),t(),n(485,"p"),e(486,"Also, with the "),n(487,"code"),e(488,"infer"),t(),e(489," feature, you can infer the type of a nested custom configuration object's property, even when using dot notation, as follows:"),t(),n(490,"app-copy-button")(491,"pre")(492,"code",28),e(493,`
constructor(private configService: ConfigService<{ database: { host: string } }>) {
  const dbHost = this.configService.get('database.host', { infer: true })!;
  // typeof dbHost === "string"                                          |
  //                                                                     +--> non-null assertion operator
}
`),t()()(),n(494,"p"),e(495,"The second generic relies on the first one, acting as a type assertion to get rid of all "),n(496,"code"),e(497,"undefined"),t(),e(498," types that "),n(499,"code"),e(500,"ConfigService"),t(),e(501,"'s methods can return when "),n(502,"code"),e(503,"strictNullChecks"),t(),e(504," is on. For instance:"),t(),n(505,"app-copy-button")(506,"pre")(507,"code",28),e(508,`
// ...
constructor(private configService: ConfigService<{ PORT: number }, true>) {
  //                                                               ^^^^
  const port = this.configService.get('PORT', { infer: true });
  //    ^^^ The type of port will be 'number' thus you don't need TS type assertions anymore
}
`),t()()(),n(509,"blockquote",22)(510,"strong"),e(511,"Hint"),t(),e(512," To make sure the "),n(513,"code"),e(514,"ConfigService#get"),t(),e(515," method retrieves values exclusively from custom configuration files and ignores "),n(516,"code"),e(517,"process.env"),t(),e(518," variables, set the "),n(519,"code"),e(520,"skipProcessEnv"),t(),e(521," option to "),n(522,"code"),e(523,"true"),t(),e(524," in the options object of the "),n(525,"code"),e(526,"ConfigModule"),t(),e(527,"'s "),n(528,"code"),e(529,"forRoot()"),t(),e(530,` method.
`),t(),n(531,"h4",41)(532,"span"),e(533,"Configuration namespaces"),t()(),n(534,"p"),e(535,"The "),n(536,"code"),e(537,"ConfigModule"),t(),e(538," allows you to define and load multiple custom configuration files, as shown in "),n(539,"a",40),e(540,"Custom configuration files"),t(),e(541,' above. You can manage complex configuration object hierarchies with nested configuration objects as shown in that section. Alternatively, you can return a "namespaced" configuration object with the '),n(542,"code"),e(543,"registerAs()"),t(),e(544," function as follows:"),t(),n(545,"app-copy-button",26)(546,"span",27),e(547),s(548,"extension"),o(549,"app-tabs",null,6),t(),n(551,"pre")(552,"code",28),e(553,`
export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432
}));
`),t()()(),n(554,"p"),e(555,"As with custom configuration files, inside your "),n(556,"code"),e(557,"registerAs()"),t(),e(558," factory function, the "),n(559,"code"),e(560,"process.env"),t(),e(561," object will contain the fully resolved environment variable key/value pairs (with "),n(562,"code"),e(563,".env"),t(),e(564," file and externally defined variables resolved and merged as described "),n(565,"a",36),e(566,"above"),t(),e(567,")."),t(),n(568,"blockquote",22)(569,"strong"),e(570,"Hint"),t(),e(571," The "),n(572,"code"),e(573,"registerAs"),t(),e(574," function is exported from the "),n(575,"code"),e(576,"@nestjs/config"),t(),e(577,` package.
`),t(),n(578,"p"),e(579,"Load a namespaced configuration with the "),n(580,"code"),e(581,"load"),t(),e(582," property of the "),n(583,"code"),e(584,"forRoot()"),t(),e(585," method's options object, in the same way you load a custom configuration file:"),t(),n(586,"app-copy-button")(587,"pre")(588,"code",28),e(589,`
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
    }),
  ],
})
export class AppModule {}
`),t()()(),n(590,"p"),e(591,"Now, to get the "),n(592,"code"),e(593,"host"),t(),e(594," value from the "),n(595,"code"),e(596,"database"),t(),e(597," namespace, use dot notation. Use "),n(598,"code"),e(599,"'database'"),t(),e(600," as the prefix to the property name, corresponding to the name of the namespace (passed as the first argument to the "),n(601,"code"),e(602,"registerAs()"),t(),e(603," function):"),t(),n(604,"app-copy-button")(605,"pre")(606,"code",28),e(607,`
const dbHost = this.configService.get<string>('database.host');
`),t()()(),n(608,"p"),e(609,"A reasonable alternative is to inject the "),n(610,"code"),e(611,"database"),t(),e(612," namespace directly. This allows us to benefit from strong typing:"),t(),n(613,"app-copy-button")(614,"pre")(615,"code",28),e(616,`
constructor(
  @Inject(databaseConfig.KEY)
  private dbConfig: ConfigType<typeof databaseConfig>,
) {}
`),t()()(),n(617,"blockquote",22)(618,"strong"),e(619,"Hint"),t(),e(620," The "),n(621,"code"),e(622,"ConfigType"),t(),e(623," is exported from the "),n(624,"code"),e(625,"@nestjs/config"),t(),e(626,` package.
`),t(),n(627,"h4",42)(628,"span"),e(629,"Namespaced configurations in modules"),t()(),n(630,"p"),e(631,"To use a namespaced configuration as a configuration object for another module in your application, you can utilize the "),n(632,"code"),e(633,".asProvider()"),t(),e(634," method of the configuration object. This method converts your namespaced configuration into a provider, which can then be passed to the "),n(635,"code"),e(636,"forRootAsync()"),t(),e(637," (or any equivalent method) of the module you want to use."),t(),n(638,"p"),e(639,"Here's an example:"),t(),n(640,"app-copy-button")(641,"pre")(642,"code",28),e(643,`
import databaseConfig from './config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(databaseConfig.asProvider()),
  ],
})
`),t()()(),n(644,"p"),e(645,"To understand how the "),n(646,"code"),e(647,".asProvider()"),t(),e(648," method functions, let's examine the return value:"),t(),n(649,"app-copy-button")(650,"pre")(651,"code",28),e(652,`
// Return value of the .asProvider() method
{
  imports: [ConfigModule.forFeature(databaseConfig)],
  useFactory: (configuration: ConfigType<typeof databaseConfig>) => configuration,
  inject: [databaseConfig.KEY]
}
`),t()()(),n(653,"p"),e(654,"This structure allows you to seamlessly integrate namespaced configurations into your modules, ensuring that your application remains organized and modular, without writing boilerplate, repetitive code."),t(),n(655,"h4",43)(656,"span"),e(657,"Cache environment variables"),t()(),n(658,"p"),e(659,"As accessing "),n(660,"code"),e(661,"process.env"),t(),e(662," can be slow, you can set the "),n(663,"code"),e(664,"cache"),t(),e(665," property of the options object passed to "),n(666,"code"),e(667,"ConfigModule.forRoot()"),t(),e(668," to increase the performance of "),n(669,"code"),e(670,"ConfigService#get"),t(),e(671," method when it comes to variables stored in "),n(672,"code"),e(673,"process.env"),t(),e(674,"."),t(),n(675,"app-copy-button")(676,"pre")(677,"code",28),e(678,`
ConfigModule.forRoot({
  cache: true,
});
`),t()()(),n(679,"h4",44)(680,"span"),e(681,"Partial registration"),t()(),n(682,"p"),e(683,"Thus far, we've processed configuration files in our root module (e.g., "),n(684,"code"),e(685,"AppModule"),t(),e(686,"), with the "),n(687,"code"),e(688,"forRoot()"),t(),e(689," method. Perhaps you have a more complex project structure, with feature-specific configuration files located in multiple different directories. Rather than load all these files in the root module, the "),n(690,"code"),e(691,"@nestjs/config"),t(),e(692," package provides a feature called "),n(693,"strong"),e(694,"partial registration"),t(),e(695,", which references only the configuration files associated with each feature module. Use the "),n(696,"code"),e(697,"forFeature()"),t(),e(698," static method within a feature module to perform this partial registration, as follows:"),t(),n(699,"app-copy-button")(700,"pre")(701,"code",28),e(702,`
import databaseConfig from './config/database.config';

@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
})
export class DatabaseModule {}
`),t()()(),n(703,"blockquote",22)(704,"strong"),e(705,"Warning"),t(),e(706," In some circumstances, you may need to access properties loaded via partial registration using the "),n(707,"code"),e(708,"onModuleInit()"),t(),e(709," hook, rather than in a constructor. This is because the "),n(710,"code"),e(711,"forFeature()"),t(),e(712," method is run during module initialization, and the order of module initialization is indeterminate. If you access values loaded this way by another module, in a constructor, the module that the configuration depends upon may not yet have initialized. The "),n(713,"code"),e(714,"onModuleInit()"),t(),e(715,` method runs only after all modules it depends upon have been initialized, so this technique is safe.
`),t(),n(716,"h4",45)(717,"span"),e(718,"Schema validation"),t()(),n(719,"p"),e(720,"It is standard practice to throw an exception during application startup if required environment variables haven't been provided or if they don't meet certain validation rules. The "),n(721,"code"),e(722,"@nestjs/config"),t(),e(723," package enables two different ways to do this:"),t(),n(724,"ul")(725,"li")(726,"a",46),e(727,"Joi"),t(),e(728," built-in validator. With Joi, you define an object schema and validate JavaScript objects against it."),t(),n(729,"li"),e(730,"A custom "),n(731,"code"),e(732,"validate()"),t(),e(733," function which takes environment variables as an input."),t()(),n(734,"p"),e(735,"To use Joi, we must install Joi package:"),t(),n(736,"pre")(737,"code",21),e(738,`
$ npm install --save joi
`),t()(),n(739,"p"),e(740,"Now we can define a Joi validation schema and pass it via the "),n(741,"code"),e(742,"validationSchema"),t(),e(743," property of the "),n(744,"code"),e(745,"forRoot()"),t(),e(746," method's options object, as shown below:"),t(),n(747,"app-copy-button",26)(748,"span",27),e(749),s(750,"extension"),o(751,"app-tabs",null,7),t(),n(753,"pre")(754,"code",28),e(755,`
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().port().default(3000),
      }),
    }),
  ],
})
export class AppModule {}
`),t()()(),n(756,"p"),e(757,"By default, all schema keys are considered optional. Here, we set default values for "),n(758,"code"),e(759,"NODE_ENV"),t(),e(760," and "),n(761,"code"),e(762,"PORT"),t(),e(763," which will be used if we don't provide these variables in the environment ("),n(764,"code"),e(765,".env"),t(),e(766," file or process environment). Alternatively, we can use the "),n(767,"code"),e(768,"required()"),t(),e(769," validation method to require that a value must be defined in the environment ("),n(770,"code"),e(771,".env"),t(),e(772," file or process environment). In this case, the validation step will throw an exception if we don't provide the variable in the environment. See "),n(773,"a",47),e(774,"Joi validation methods"),t(),e(775," for more on how to construct validation schemas."),t(),n(776,"p"),e(777,"By default, unknown environment variables (environment variables whose keys are not present in the schema) are allowed and do not trigger a validation exception. By default, all validation errors are reported. You can alter these behaviors by passing an options object via the "),n(778,"code"),e(779,"validationOptions"),t(),e(780," key of the "),n(781,"code"),e(782,"forRoot()"),t(),e(783," options object. This options object can contain any of the standard validation options properties provided by "),n(784,"a",48),e(785,"Joi validation options"),t(),e(786,". For example, to reverse the two settings above, pass options like this:"),t(),n(787,"app-copy-button",26)(788,"span",27),e(789),s(790,"extension"),o(791,"app-tabs",null,8),t(),n(793,"pre")(794,"code",28),e(795,`
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().port().default(3000),
      }),
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
  ],
})
export class AppModule {}
`),t()()(),n(796,"p"),e(797,"The "),n(798,"code"),e(799,"@nestjs/config"),t(),e(800," package uses default settings of:"),t(),n(801,"ul")(802,"li")(803,"code"),e(804,"allowUnknown"),t(),e(805,": controls whether or not to allow unknown keys in the environment variables. Default is "),n(806,"code"),e(807,"true"),t()(),n(808,"li")(809,"code"),e(810,"abortEarly"),t(),e(811,": if true, stops validation on the first error; if false, returns all errors. Defaults to "),n(812,"code"),e(813,"false"),t(),e(814,"."),t()(),n(815,"p"),e(816,"Note that once you decide to pass a "),n(817,"code"),e(818,"validationOptions"),t(),e(819," object, any settings you do not explicitly pass will default to "),n(820,"code"),e(821,"Joi"),t(),e(822," standard defaults (not the "),n(823,"code"),e(824,"@nestjs/config"),t(),e(825," defaults). For example, if you leave "),n(826,"code"),e(827,"allowUnknowns"),t(),e(828," unspecified in your custom "),n(829,"code"),e(830,"validationOptions"),t(),e(831," object, it will have the "),n(832,"code"),e(833,"Joi"),t(),e(834," default value of "),n(835,"code"),e(836,"false"),t(),e(837,". Hence, it is probably safest to specify "),n(838,"strong"),e(839,"both"),t(),e(840," of these settings in your custom object."),t(),n(841,"blockquote",22)(842,"strong"),e(843,"Hint"),t(),e(844," To disable validation of predefined environment variables, set the "),n(845,"code"),e(846,"validatePredefined"),t(),e(847," attribute to "),n(848,"code"),e(849,"false"),t(),e(850," in the "),n(851,"code"),e(852,"forRoot()"),t(),e(853," method's options object. Predefined environment variables are process variables ("),n(854,"code"),e(855,"process.env"),t(),e(856," variables) that were set before the module was imported. For example, if you start your application with "),n(857,"code"),e(858,"PORT=3000 node main.js"),t(),e(859,", then "),n(860,"code"),e(861,"PORT"),t(),e(862,` is a predefined environment variable.
`),t(),n(863,"h4",49)(864,"span"),e(865,"Custom validate function"),t()(),n(866,"p"),e(867,"Alternatively, you can specify a "),n(868,"strong"),e(869,"synchronous"),t(),n(870,"code"),e(871,"validate"),t(),e(872," function that takes an object containing the environment variables (from env file and process) and returns an object containing validated environment variables so that you can convert/mutate them if needed. If the function throws an error, it will prevent the application from bootstrapping."),t(),n(873,"p"),e(874,"In this example, we'll proceed with the "),n(875,"code"),e(876,"class-transformer"),t(),e(877," and "),n(878,"code"),e(879,"class-validator"),t(),e(880," packages. First, we have to define:"),t(),n(881,"ul")(882,"li"),e(883,"a class with validation constraints,"),t(),n(884,"li"),e(885,"a validate function that makes use of the "),n(886,"code"),e(887,"plainToInstance"),t(),e(888," and "),n(889,"code"),e(890,"validateSync"),t(),e(891," functions."),t()(),n(892,"app-copy-button",26)(893,"span",27),e(894),s(895,"extension"),o(896,"app-tabs",null,9),t(),n(898,"pre")(899,"code",28),e(900,`
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, Max, Min, validateSync } from 'class-validator';

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
  Provision = "provision",
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
`),t()()(),n(901,"p"),e(902,"With this in place, use the "),n(903,"code"),e(904,"validate"),t(),e(905," function as a configuration option of the "),n(906,"code"),e(907,"ConfigModule"),t(),e(908,", as follows:"),t(),n(909,"app-copy-button",26)(910,"span",27),e(911),s(912,"extension"),o(913,"app-tabs",null,10),t(),n(915,"pre")(916,"code",28),e(917,`
import { validate } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
    }),
  ],
})
export class AppModule {}
`),t()()(),n(918,"h4",50)(919,"span"),e(920,"Custom getter functions"),t()(),n(921,"p")(922,"code"),e(923,"ConfigService"),t(),e(924," defines a generic "),n(925,"code"),e(926,"get()"),t(),e(927," method to retrieve a configuration value by key. We may also add "),n(928,"code"),e(929,"getter"),t(),e(930," functions to enable a little more natural coding style:"),t(),n(931,"app-copy-button",26)(932,"span",27),o(933,"app-tabs",null,11),t(),n(935,"pre")(936,"code",28),e(937,`
@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isAuthEnabled(): boolean {
    return this.configService.get('AUTH_ENABLED') === 'true';
  }
}
`),t()(),n(938,"pre")(939,"code",28),e(940,`
@Dependencies(ConfigService)
@Injectable()
export class ApiConfigService {
  constructor(configService) {
    this.configService = configService;
  }

  get isAuthEnabled() {
    return this.configService.get('AUTH_ENABLED') === 'true';
  }
}
`),t()()(),n(941,"p"),e(942,"Now we can use the getter function as follows:"),t(),n(943,"app-copy-button",26)(944,"span",27),e(945),s(946,"extension"),o(947,"app-tabs",null,12),t(),n(949,"pre")(950,"code",28),e(951,`
@Injectable()
export class AppService {
  constructor(apiConfigService: ApiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // Authentication is enabled
    }
  }
}
`),t()(),n(952,"pre")(953,"code",28),e(954,`
@Dependencies(ApiConfigService)
@Injectable()
export class AppService {
  constructor(apiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // Authentication is enabled
    }
  }
}
`),t()()(),n(955,"h4",51)(956,"span"),e(957,"Environment variables loaded hook"),t()(),n(958,"p"),e(959,"If a module configuration depends on the environment variables, and these variables are loaded from the "),n(960,"code"),e(961,".env"),t(),e(962," file, you can use the "),n(963,"code"),e(964,"ConfigModule.envVariablesLoaded"),t(),e(965," hook to ensure that the file was loaded before interacting with the "),n(966,"code"),e(967,"process.env"),t(),e(968," object, see the following example:"),t(),n(969,"app-copy-button")(970,"pre")(971,"code",28),e(972,`
export async function getStorageModule() {
  await ConfigModule.envVariablesLoaded;
  return process.env.STORAGE === 'S3' ? S3StorageModule : DefaultStorageModule;
}
`),t()()(),n(973,"p"),e(974,"This construction guarantees that after the "),n(975,"code"),e(976,"ConfigModule.envVariablesLoaded"),t(),e(977," Promise resolves, all configuration variables are loaded up."),t(),n(978,"h4",52)(979,"span"),e(980,"Conditional module configuration"),t()(),n(981,"p"),e(982,"There may be times where you want to conditionally load in a module and specify the condition in an env variable. Fortunately, "),n(983,"code"),e(984,"@nestjs/config"),t(),e(985," provides a "),n(986,"code"),e(987,"ConditionalModule"),t(),e(988," that allows you to do just that."),t(),n(989,"app-copy-button")(990,"pre")(991,"code",28),e(992,`
@Module({
  imports: [
    ConfigModule.forRoot(),
    ConditionalModule.registerWhen(FooModule, 'USE_FOO'),
  ],
})
export class AppModule {}
`),t()()(),n(993,"p"),e(994,"The above module would only load in the "),n(995,"code"),e(996,"FooModule"),t(),e(997," if in the "),n(998,"code"),e(999,".env"),t(),e(1e3," file there is not a "),n(1001,"code"),e(1002,"false"),t(),e(1003," value for the env variable "),n(1004,"code"),e(1005,"USE_FOO"),t(),e(1006,". You can also pass a custom condition yourself, a function receiving the "),n(1007,"code"),e(1008,"process.env"),t(),e(1009," reference that should return a boolean for the "),n(1010,"code"),e(1011,"ConditionalModule"),t(),e(1012," to handle:"),t(),n(1013,"app-copy-button")(1014,"pre")(1015,"code",28),e(1016,`
@Module({
  imports: [
    ConfigModule.forRoot(),
    ConditionalModule.registerWhen(
      FooBarModule,
      (env: NodeJS.ProcessEnv) => !!env['foo'] && !!env['bar'],
    ),
  ],
})
export class AppModule {}
`),t()()(),n(1017,"p"),e(1018,"It is important to be sure that when using the "),n(1019,"code"),e(1020,"ConditionalModule"),t(),e(1021," you also have the "),n(1022,"code"),e(1023,"ConfigModule"),t(),e(1024," loaded in the application, so that the "),n(1025,"code"),e(1026,"ConfigModule.envVariablesLoaded"),t(),e(1027," hook can be properly referenced and utilized. If the hook is not flipped to true within 5 seconds, or a timeout in milliseconds, set by the user in the third options parameter of the "),n(1028,"code"),e(1029,"registerWhen"),t(),e(1030," method, then the "),n(1031,"code"),e(1032,"ConditionalModule"),t(),e(1033," will throw an error and Nest will abort starting the application."),t(),n(1034,"h4",53)(1035,"span"),e(1036,"Expandable variables"),t()(),n(1037,"p"),e(1038,"The "),n(1039,"code"),e(1040,"@nestjs/config"),t(),e(1041," package supports environment variable expansion. With this technique, you can create nested environment variables, where one variable is referred to within the definition of another. For example:"),t(),n(1042,"pre")(1043,"code",29),e(1044,`
APP_URL=mywebsite.com
SUPPORT_EMAIL=support@\${APP_URL}
`),t()(),n(1045,"p"),e(1046,"With this construction, the variable "),n(1047,"code"),e(1048,"SUPPORT_EMAIL"),t(),e(1049," resolves to "),n(1050,"code"),e(1051,"'support@mywebsite.com'"),t(),e(1052,". Note the use of the "),n(1053,"code"),e(1054),t(),e(1055," syntax to trigger resolving the value of the variable "),n(1056,"code"),e(1057,"APP_URL"),t(),e(1058," inside the definition of "),n(1059,"code"),e(1060,"SUPPORT_EMAIL"),t(),e(1061,"."),t(),n(1062,"blockquote",22)(1063,"strong"),e(1064,"Hint"),t(),e(1065," For this feature, "),n(1066,"code"),e(1067,"@nestjs/config"),t(),e(1068," package internally uses "),n(1069,"a",54),e(1070,"dotenv-expand"),t(),e(1071,`.
`),t(),n(1072,"p"),e(1073,"Enable environment variable expansion using the "),n(1074,"code"),e(1075,"expandVariables"),t(),e(1076," property in the options object passed to the "),n(1077,"code"),e(1078,"forRoot()"),t(),e(1079," method of the "),n(1080,"code"),e(1081,"ConfigModule"),t(),e(1082,", as shown below:"),t(),n(1083,"app-copy-button",26)(1084,"span",27),e(1085),s(1086,"extension"),o(1087,"app-tabs",null,13),t(),n(1089,"pre")(1090,"code",28),e(1091,`
@Module({
  imports: [
    ConfigModule.forRoot({
      // ...
      expandVariables: true,
    }),
  ],
})
export class AppModule {}
`),t()()(),n(1092,"h4",55)(1093,"span"),e(1094,"Using in the "),n(1095,"code"),e(1096,"main.ts"),t()()(),n(1097,"p"),e(1098,"While our config is stored in a service, it can still be used in the "),n(1099,"code"),e(1100,"main.ts"),t(),e(1101," file. This way, you can use it to store variables such as the application port or the CORS host."),t(),n(1102,"p"),e(1103,"To access it, you must use the "),n(1104,"code"),e(1105,"app.get()"),t(),e(1106," method, followed by the service reference:"),t(),n(1107,"app-copy-button")(1108,"pre")(1109,"code",28),e(1110,`
const configService = app.get(ConfigService);
`),t()()(),n(1111,"p"),e(1112,"You can then use it as usual, by calling the "),n(1113,"code"),e(1114,"get"),t(),e(1115," method with the configuration key:"),t(),n(1116,"app-copy-button")(1117,"pre")(1118,"code",28),e(1119,`
const port = configService.get('PORT');
`),t()()()()),c&2){let b=r(91),v=r(262),T=r(311),k=r(358),M=r(396),A=r(550),q=r(752),F=r(792),P=r(897),N=r(914),D=r(934),R=r(948),_=r(1088);i(88),l(" ",d(89,24,"app.module",b.isJsActive),`
`),i(171),l(" ",d(260,27,"config/configuration",v.isJsActive),`
`),i(49),l(" ",d(309,30,"config/configuration",T.isJsActive),`
`),i(30),I('"assets": [',"{",'"include": "../config/*.yaml", "outDir": "./dist/config"',"}","]"),i(17),l(" ",d(356,33,"config/configuration",k.isJsActive),`
`),i(38),l(" ",d(394,36,"feature.module",M.isJsActive),`
`),i(154),l(" ",d(548,39,"config/database.config",A.isJsActive),`
`),i(202),l(" ",d(750,42,"app.module",q.isJsActive),`
`),i(40),l(" ",d(790,45,"app.module",F.isJsActive),`
`),i(105),l(" ",d(895,48,"env.validation",P.isJsActive),`
`),i(17),l(" ",d(912,51,"app.module",N.isJsActive),`
`),i(24),u("hide",D.isJsActive),i(3),u("hide",!D.isJsActive),i(7),l(" ",d(946,54,"app.service",R.isJsActive),`
`),i(4),u("hide",R.isJsActive),i(3),u("hide",!R.isJsActive),i(102),I("$","{","...","}"),i(31),l(" ",d(1086,57,"app.module",_.isJsActive),`
`)}},dependencies:[g,E,y,U,w],encapsulation:2,changeDetection:0})}return a})();var V=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-cookies-docs"]],features:[f],decls:251,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/cookies.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","cookies"],["appAnchor","","id","use-with-express-default"],["rel","nofollow","target","_blank","href","https://github.com/expressjs/cookie-parser"],[1,"language-shell"],[1,"language-typescript"],["rel","nofollow","target","_blank","href","https://www.npmjs.org/package/cookie"],[1,"info"],[1,"warning"],["href","/controllers#library-specific-approach"],["appAnchor","","id","use-with-fastify"],["rel","nofollow","target","_blank","href","https://github.com/fastify/fastify-cookie#sending"],["appAnchor","","id","creating-a-custom-decorator-cross-platform"],["routerLink","/custom-decorators"]],template:function(c,p){c&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Cookies"),t(),n(7,"p"),e(8,"An "),n(9,"strong"),e(10,"HTTP cookie"),t(),e(11," is a small piece of data stored by the user's browser. Cookies were designed to be a reliable mechanism for websites to remember stateful information. When the user visits the website again, the cookie is automatically sent with the request."),t(),n(12,"h4",6)(13,"span"),e(14,"Use with Express (default)"),t()(),n(15,"p"),e(16,"First install the "),n(17,"a",7),e(18,"required package"),t(),e(19," (and its types for TypeScript users):"),t(),n(20,"pre")(21,"code",8),e(22,`
$ npm i cookie-parser
$ npm i -D @types/cookie-parser
`),t()(),n(23,"p"),e(24,"Once the installation is complete, apply the "),n(25,"code"),e(26,"cookie-parser"),t(),e(27," middleware as global middleware (for example, in your "),n(28,"code"),e(29,"main.ts"),t(),e(30," file)."),t(),n(31,"app-copy-button")(32,"pre")(33,"code",9),e(34,`
import * as cookieParser from 'cookie-parser';
// somewhere in your initialization file
app.use(cookieParser());
`),t()()(),n(35,"p"),e(36,"You can pass several options to the "),n(37,"code"),e(38,"cookieParser"),t(),e(39," middleware:"),t(),n(40,"ul")(41,"li")(42,"code"),e(43,"secret"),t(),e(44," a string or array used for signing cookies. This is optional and if not specified, will not parse signed cookies. If a string is provided, this is used as the secret. If an array is provided, an attempt will be made to unsign the cookie with each secret in order."),t(),n(45,"li")(46,"code"),e(47,"options"),t(),e(48," an object that is passed to "),n(49,"code"),e(50,"cookie.parse"),t(),e(51," as the second option. See "),n(52,"a",10),e(53,"cookie"),t(),e(54," for more information."),t()(),n(55,"p"),e(56,"The middleware will parse the "),n(57,"code"),e(58,"Cookie"),t(),e(59," header on the request and expose the cookie data as the property "),n(60,"code"),e(61,"req.cookies"),t(),e(62," and, if a secret was provided, as the property "),n(63,"code"),e(64,"req.signedCookies"),t(),e(65,". These properties are name value pairs of the cookie name to cookie value."),t(),n(66,"p"),e(67,"When a secret is provided, this module will unsign and validate any signed cookie values and move those name value pairs from "),n(68,"code"),e(69,"req.cookies"),t(),e(70," into "),n(71,"code"),e(72,"req.signedCookies"),t(),e(73,". A signed cookie is a cookie that has a value prefixed with "),n(74,"code"),e(75,"s:"),t(),e(76,". Signed cookies that fail signature validation will have the value "),n(77,"code"),e(78,"false"),t(),e(79," instead of the tampered value."),t(),n(80,"p"),e(81,"With this in place, you can now read cookies from within the route handlers, as follows:"),t(),n(82,"app-copy-button")(83,"pre")(84,"code",9),e(85,`
@Get()
findAll(@Req() request: Request) {
  console.log(request.cookies); // or "request.cookies['cookieKey']"
  // or console.log(request.signedCookies);
}
`),t()()(),n(86,"blockquote",11)(87,"strong"),e(88,"Hint"),t(),e(89," The "),n(90,"code"),e(91,"@Req()"),t(),e(92," decorator is imported from the "),n(93,"code"),e(94,"@nestjs/common"),t(),e(95,", while "),n(96,"code"),e(97,"Request"),t(),e(98," from the "),n(99,"code"),e(100,"express"),t(),e(101,` package.
`),t(),n(102,"p"),e(103,"To attach a cookie to an outgoing response, use the "),n(104,"code"),e(105,"Response#cookie()"),t(),e(106," method:"),t(),n(107,"app-copy-button")(108,"pre")(109,"code",9),e(110,`
@Get()
findAll(@Res({ passthrough: true }) response: Response) {
  response.cookie('key', 'value')
}
`),t()()(),n(111,"blockquote",12)(112,"strong"),e(113,"Warning"),t(),e(114," If you want to leave the response handling logic to the framework, remember to set the "),n(115,"code"),e(116,"passthrough"),t(),e(117," option to "),n(118,"code"),e(119,"true"),t(),e(120,", as shown above. Read more "),n(121,"a",13),e(122,"here"),t(),e(123,`.
`),t(),n(124,"blockquote",11)(125,"strong"),e(126,"Hint"),t(),e(127," The "),n(128,"code"),e(129,"@Res()"),t(),e(130," decorator is imported from the "),n(131,"code"),e(132,"@nestjs/common"),t(),e(133,", while "),n(134,"code"),e(135,"Response"),t(),e(136," from the "),n(137,"code"),e(138,"express"),t(),e(139,` package.
`),t(),n(140,"h4",14)(141,"span"),e(142,"Use with Fastify"),t()(),n(143,"p"),e(144,"First install the required package:"),t(),n(145,"pre")(146,"code",8),e(147,`
$ npm i @fastify/cookie
`),t()(),n(148,"p"),e(149,"Once the installation is complete, register the "),n(150,"code"),e(151,"@fastify/cookie"),t(),e(152," plugin:"),t(),n(153,"app-copy-button")(154,"pre")(155,"code",9),e(156,`
import fastifyCookie from '@fastify/cookie';

// somewhere in your initialization file
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
await app.register(fastifyCookie, {
  secret: 'my-secret', // for cookies signature
});
`),t()()(),n(157,"p"),e(158,"With this in place, you can now read cookies from within the route handlers, as follows:"),t(),n(159,"app-copy-button")(160,"pre")(161,"code",9),e(162,`
@Get()
findAll(@Req() request: FastifyRequest) {
  console.log(request.cookies); // or "request.cookies['cookieKey']"
}
`),t()()(),n(163,"blockquote",11)(164,"strong"),e(165,"Hint"),t(),e(166," The "),n(167,"code"),e(168,"@Req()"),t(),e(169," decorator is imported from the "),n(170,"code"),e(171,"@nestjs/common"),t(),e(172,", while "),n(173,"code"),e(174,"FastifyRequest"),t(),e(175," from the "),n(176,"code"),e(177,"fastify"),t(),e(178,` package.
`),t(),n(179,"p"),e(180,"To attach a cookie to an outgoing response, use the "),n(181,"code"),e(182,"FastifyReply#setCookie()"),t(),e(183," method:"),t(),n(184,"app-copy-button")(185,"pre")(186,"code",9),e(187,`
@Get()
findAll(@Res({ passthrough: true }) response: FastifyReply) {
  response.setCookie('key', 'value')
}
`),t()()(),n(188,"p"),e(189,"To read more about "),n(190,"code"),e(191,"FastifyReply#setCookie()"),t(),e(192," method, check out this "),n(193,"a",15),e(194,"page"),t(),e(195,"."),t(),n(196,"blockquote",12)(197,"strong"),e(198,"Warning"),t(),e(199," If you want to leave the response handling logic to the framework, remember to set the "),n(200,"code"),e(201,"passthrough"),t(),e(202," option to "),n(203,"code"),e(204,"true"),t(),e(205,", as shown above. Read more "),n(206,"a",13),e(207,"here"),t(),e(208,`.
`),t(),n(209,"blockquote",11)(210,"strong"),e(211,"Hint"),t(),e(212," The "),n(213,"code"),e(214,"@Res()"),t(),e(215," decorator is imported from the "),n(216,"code"),e(217,"@nestjs/common"),t(),e(218,", while "),n(219,"code"),e(220,"FastifyReply"),t(),e(221," from the "),n(222,"code"),e(223,"fastify"),t(),e(224,` package.
`),t(),n(225,"h4",16)(226,"span"),e(227,"Creating a custom decorator (cross-platform)"),t()(),n(228,"p"),e(229,"To provide a convenient, declarative way of accessing incoming cookies, we can create a "),n(230,"a",17),e(231,"custom decorator"),t(),e(232,"."),t(),n(233,"app-copy-button")(234,"pre")(235,"code",9),e(236,`
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Cookies = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return data ? request.cookies?.[data] : request.cookies;
});
`),t()()(),n(237,"p"),e(238,"The "),n(239,"code"),e(240,"@Cookies()"),t(),e(241," decorator will extract all cookies, or a named cookie from the "),n(242,"code"),e(243,"req.cookies"),t(),e(244," object and populate the decorated parameter with that value."),t(),n(245,"p"),e(246,"With this in place, we can now use the decorator in a route handler signature, as follows:"),t(),n(247,"app-copy-button")(248,"pre")(249,"code",9),e(250,`
@Get()
findAll(@Cookies('name') name: string) {}
`),t()()()())},dependencies:[g,E,C],encapsulation:2,changeDetection:0})}return a})();var Q=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-events"]],features:[f],decls:256,vars:4,consts:[["contentReference",""],["appa12a679cd56786d8d75ee052d7cbce6f8d2e411c",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/events.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","events"],["rel","nofollow","target","_blank","href","https://www.npmjs.com/package/@nestjs/event-emitter"],["rel","nofollow","target","_blank","href","https://github.com/EventEmitter2/EventEmitter2"],["appAnchor","","id","getting-started"],[1,"language-shell"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["appAnchor","","id","dispatching-events"],[1,"info"],["appAnchor","","id","listening-to-events"],[1,"warning"],["rel","nofollow","target","_blank","href","https://github.com/EventEmitter2/EventEmitter2#emitteronevent-listener-options-objectboolean"],["rel","nofollow","target","_blank","href","https://github.com/EventEmitter2/EventEmitter2#multi-level-wildcards"],["appAnchor","","id","preventing-event-loss"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/30-event-emitter"]],template:function(c,p){if(c&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),o(4,"i",5),t()(),n(5,"h3",6),e(6,"Events"),t(),n(7,"p")(8,"a",7),e(9,"Event Emitter"),t(),e(10," package ("),n(11,"code"),e(12,"@nestjs/event-emitter"),t(),e(13,") provides a simple observer implementation, allowing you to subscribe and listen for various events that occur in your application. Events serve as a great way to decouple various aspects of your application, since a single event can have multiple listeners that do not depend on each other."),t(),n(14,"p")(15,"code"),e(16,"EventEmitterModule"),t(),e(17," internally uses the "),n(18,"a",8),e(19,"eventemitter2"),t(),e(20," package."),t(),n(21,"h4",9)(22,"span"),e(23,"Getting started"),t()(),n(24,"p"),e(25,"First install the required package:"),t(),n(26,"pre")(27,"code",10),e(28,`
$ npm i --save @nestjs/event-emitter
`),t()(),n(29,"p"),e(30,"Once the installation is complete, import the "),n(31,"code"),e(32,"EventEmitterModule"),t(),e(33," into the root "),n(34,"code"),e(35,"AppModule"),t(),e(36," and run the "),n(37,"code"),e(38,"forRoot()"),t(),e(39," static method as shown below:"),t(),n(40,"app-copy-button",11)(41,"span",12),e(42),s(43,"extension"),o(44,"app-tabs",null,1),t(),n(46,"pre")(47,"code",13),e(48,`
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot()
  ],
})
export class AppModule {}
`),t()()(),n(49,"p"),e(50,"The "),n(51,"code"),e(52,".forRoot()"),t(),e(53," call initializes the event emitter and registers any declarative event listeners that exist within your app. Registration occurs when the "),n(54,"code"),e(55,"onApplicationBootstrap"),t(),e(56," lifecycle hook occurs, ensuring that all modules have loaded and declared any scheduled jobs."),t(),n(57,"p"),e(58,"To configure the underlying "),n(59,"code"),e(60,"EventEmitter"),t(),e(61," instance, pass the configuration object to the "),n(62,"code"),e(63,".forRoot()"),t(),e(64," method, as follows:"),t(),n(65,"app-copy-button")(66,"pre")(67,"code",13),e(68,`
EventEmitterModule.forRoot({
  // set this to \`true\` to use wildcards
  wildcard: false,
  // the delimiter used to segment namespaces
  delimiter: '.',
  // set this to \`true\` if you want to emit the newListener event
  newListener: false,
  // set this to \`true\` if you want to emit the removeListener event
  removeListener: false,
  // the maximum amount of listeners that can be assigned to an event
  maxListeners: 10,
  // show event name in memory leak message when more than maximum amount of listeners is assigned
  verboseMemoryLeak: false,
  // disable throwing uncaughtException if an error event is emitted and it has no listeners
  ignoreErrors: false,
});
`),t()()(),n(69,"h4",14)(70,"span"),e(71,"Dispatching events"),t()(),n(72,"p"),e(73,"To dispatch (i.e., fire) an event, first inject "),n(74,"code"),e(75,"EventEmitter2"),t(),e(76," using standard constructor injection:"),t(),n(77,"app-copy-button")(78,"pre")(79,"code",13),e(80,`
constructor(private eventEmitter: EventEmitter2) {}
`),t()()(),n(81,"blockquote",15)(82,"strong"),e(83,"Hint"),t(),e(84," Import the "),n(85,"code"),e(86,"EventEmitter2"),t(),e(87," from the "),n(88,"code"),e(89,"@nestjs/event-emitter"),t(),e(90,` package.
`),t(),n(91,"p"),e(92,"Then use it in a class as follows:"),t(),n(93,"app-copy-button")(94,"pre")(95,"code",13),e(96,`
this.eventEmitter.emit(
  'order.created',
  new OrderCreatedEvent({
    orderId: 1,
    payload: {},
  }),
);
`),t()()(),n(97,"h4",16)(98,"span"),e(99,"Listening to events"),t()(),n(100,"p"),e(101,"To declare an event listener, decorate a method with the "),n(102,"code"),e(103,"@OnEvent()"),t(),e(104," decorator preceding the method definition containing the code to be executed, as follows:"),t(),n(105,"app-copy-button")(106,"pre")(107,"code",13),e(108,`
@OnEvent('order.created')
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // handle and process "OrderCreatedEvent" event
}
`),t()()(),n(109,"blockquote",17)(110,"strong"),e(111,"Warning"),t(),e(112,` Event subscribers cannot be request-scoped.
`),t(),n(113,"p"),e(114,"The first argument can be a "),n(115,"code"),e(116,"string"),t(),e(117," or "),n(118,"code"),e(119,"symbol"),t(),e(120," for a simple event emitter and a "),n(121,"code"),e(122,"string | symbol | Array<string | symbol>"),t(),e(123," in a case of a wildcard emitter."),t(),n(124,"p"),e(125,"The second argument (optional) is a listener options object as follows:"),t(),n(126,"app-copy-button")(127,"pre")(128,"code",13),e(129,`
export type OnEventOptions = OnOptions & {
  /**
   * If "true", prepends (instead of append) the given listener to the array of listeners.
   *
   * @see https://github.com/EventEmitter2/EventEmitter2#emitterprependlistenerevent-listener-options
   *
   * @default false
   */
  prependListener?: boolean;

  /**
   * If "true", the onEvent callback will not throw an error while handling the event. Otherwise, if "false" it will throw an error.
   *
   * @default true
   */
  suppressErrors?: boolean;
};
`),t()()(),n(130,"blockquote",15)(131,"strong"),e(132,"Hint"),t(),e(133," Read more about the "),n(134,"code"),e(135,"OnOptions"),t(),e(136," options object from "),n(137,"a",18)(138,"code"),e(139,"eventemitter2"),t()(),e(140,`.
`),t(),n(141,"app-copy-button")(142,"pre")(143,"code",13),e(144,`
@OnEvent('order.created', { async: true })
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // handle and process "OrderCreatedEvent" event
}
`),t()()(),n(145,"p"),e(146,"To use namespaces/wildcards, pass the "),n(147,"code"),e(148,"wildcard"),t(),e(149," option into the "),n(150,"code"),e(151,"EventEmitterModule#forRoot()"),t(),e(152," method. When namespaces/wildcards are enabled, events can either be strings ("),n(153,"code"),e(154,"foo.bar"),t(),e(155,") separated by a delimiter or arrays ("),n(156,"code"),e(157,"['foo', 'bar']"),t(),e(158,"). The delimiter is also configurable as a configuration property ("),n(159,"code"),e(160,"delimiter"),t(),e(161,"). With namespaces feature enabled, you can subscribe to events using a wildcard:"),t(),n(162,"app-copy-button")(163,"pre")(164,"code",13),e(165,`
@OnEvent('order.*')
handleOrderEvents(payload: OrderCreatedEvent | OrderRemovedEvent | OrderUpdatedEvent) {
  // handle and process an event
}
`),t()()(),n(166,"p"),e(167,"Note that such a wildcard only applies to one block. The argument "),n(168,"code"),e(169,"order.*"),t(),e(170," will match, for example, the events "),n(171,"code"),e(172,"order.created"),t(),e(173," and "),n(174,"code"),e(175,"order.shipped"),t(),e(176," but not "),n(177,"code"),e(178,"order.delayed.out_of_stock"),t(),e(179,`. In order to listen to such events,
use the `),n(180,"code"),e(181,"multilevel wildcard"),t(),e(182," pattern (i.e, "),n(183,"code"),e(184,"**"),t(),e(185,"), described in the "),n(186,"code"),e(187,"EventEmitter2"),t(),n(188,"a",19),e(189,"documentation"),t(),e(190,"."),t(),n(191,"p"),e(192,"With this pattern, you can, for example, create an event listener that catches all events."),t(),n(193,"app-copy-button")(194,"pre")(195,"code",13),e(196,`
@OnEvent('**')
handleEverything(payload: any) {
  // handle and process an event
}
`),t()()(),n(197,"blockquote",15)(198,"strong"),e(199,"Hint"),t(),n(200,"code"),e(201,"EventEmitter2"),t(),e(202," class provides several useful methods for interacting with events, like "),n(203,"code"),e(204,"waitFor"),t(),e(205," and "),n(206,"code"),e(207,"onAny"),t(),e(208,". You can read more about them "),n(209,"a",8),e(210,"here"),t(),e(211,`.
`),t(),n(212,"h4",20)(213,"span"),e(214,"Preventing event loss"),t()(),n(215,"p"),e(216,"Events triggered before or during the "),n(217,"code"),e(218,"onApplicationBootstrap"),t(),e(219," lifecycle hook\u2014such as those from module constructors or the "),n(220,"code"),e(221,"onModuleInit"),t(),e(222," method\u2014may be missed because the "),n(223,"code"),e(224,"EventSubscribersLoader"),t(),e(225," might not have finished setting up the listeners."),t(),n(226,"p"),e(227,"To avoid this issue, you can use the "),n(228,"code"),e(229,"waitUntilReady"),t(),e(230," method of the "),n(231,"code"),e(232,"EventEmitterReadinessWatcher"),t(),e(233,", which returns a promise that resolves once all listeners have been registered. This method can be called in the "),n(234,"code"),e(235,"onApplicationBootstrap"),t(),e(236," lifecycle hook of a module to ensure that all events are properly captured."),t(),n(237,"app-copy-button")(238,"pre")(239,"code",13),e(240,`
await this.eventEmitterReadinessWatcher.waitUntilReady();
this.eventEmitter.emit(
  'order.created',
  new OrderCreatedEvent({ orderId: 1, payload: {} }),
);
`),t()()(),n(241,"blockquote",15)(242,"strong"),e(243,"Note"),t(),e(244," This is only necessary for events emitted before the "),n(245,"code"),e(246,"onApplicationBootstrap"),t(),e(247,` lifecycle hook is complete.
`),t(),n(248,"h4",21)(249,"span"),e(250,"Example"),t()(),n(251,"p"),e(252,"A working example is available "),n(253,"a",22),e(254,"here"),t(),e(255,"."),t()()),c&2){let b=r(45);i(42),l(" ",d(43,1,"app.module",b.isJsActive),`
`)}},dependencies:[g,E,y,w],encapsulation:2,changeDetection:0})}return a})();var G=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-file-upload"]],features:[f],decls:545,vars:18,consts:[["contentReference",""],["app089d83a7bb08c712a82eae03bc25033b87eebf93",""],["app8b6320259532376513d37a8876beb8daa32bb7da",""],["app4b44ce6377e5da47149073f7a14db3ac09487a9c",""],["appd6f46bed961bf1fbf5806d6f62ba3635b128009e",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/file-upload.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","file-upload"],["rel","nofollow","target","_blank","href","https://github.com/expressjs/multer"],[1,"warning"],[1,"language-shell"],["appAnchor","","id","basic-example"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["rel","nofollow","target","_blank","href","https://github.com/expressjs/multer#multeropts"],["appAnchor","","id","file-validation"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/pipes"],["rel","nofollow","target","_blank","href","https://www.ibm.com/support/pages/what-magic-number"],["appAnchor","","id","array-of-files"],["appAnchor","","id","multiple-files"],["appAnchor","","id","any-files"],["appAnchor","","id","no-files"],["appAnchor","","id","default-options"],["appAnchor","","id","async-configuration"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/29-file-upload"]],template:function(c,p){if(c&1&&(n(0,"div",5,0)(2,"div",6)(3,"a",7),o(4,"i",8),t()(),n(5,"h3",9),e(6,"File upload"),t(),n(7,"p"),e(8,"To handle file uploading, Nest provides a built-in module based on the "),n(9,"a",10),e(10,"multer"),t(),e(11," middleware package for Express. Multer handles data posted in the "),n(12,"code"),e(13,"multipart/form-data"),t(),e(14," format, which is primarily used for uploading files via an HTTP "),n(15,"code"),e(16,"POST"),t(),e(17," request. This module is fully configurable and you can adjust its behavior to your application requirements."),t(),n(18,"blockquote",11)(19,"strong"),e(20,"Warning"),t(),e(21," Multer cannot process data which is not in the supported multipart format ("),n(22,"code"),e(23,"multipart/form-data"),t(),e(24,"). Also, note that this package is not compatible with the "),n(25,"code"),e(26,"FastifyAdapter"),t(),e(27,`.
`),t(),n(28,"p"),e(29,"For better type safety, let's install Multer typings package:"),t(),n(30,"pre")(31,"code",12),e(32,`
$ npm i -D @types/multer
`),t()(),n(33,"p"),e(34,"With this package installed, we can now use the "),n(35,"code"),e(36,"Express.Multer.File"),t(),e(37," type (you can import this type as follows: "),n(38,"code"),e(39),t(),e(40,")."),t(),n(41,"h4",13)(42,"span"),e(43,"Basic example"),t()(),n(44,"p"),e(45,"To upload a single file, simply tie the "),n(46,"code"),e(47,"FileInterceptor()"),t(),e(48," interceptor to the route handler and extract "),n(49,"code"),e(50,"file"),t(),e(51," from the "),n(52,"code"),e(53,"request"),t(),e(54," using the "),n(55,"code"),e(56,"@UploadedFile()"),t(),e(57," decorator."),t(),n(58,"app-copy-button",14)(59,"span",15),o(60,"app-tabs",null,1),t(),n(62,"pre")(63,"code",16),e(64,`
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  console.log(file);
}
`),t()(),n(65,"pre")(66,"code",16),e(67,`
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
@Bind(UploadedFile())
uploadFile(file) {
  console.log(file);
}
`),t()()(),n(68,"blockquote",17)(69,"strong"),e(70,"Hint"),t(),e(71," The "),n(72,"code"),e(73,"FileInterceptor()"),t(),e(74," decorator is exported from the "),n(75,"code"),e(76,"@nestjs/platform-express"),t(),e(77," package. The "),n(78,"code"),e(79,"@UploadedFile()"),t(),e(80," decorator is exported from "),n(81,"code"),e(82,"@nestjs/common"),t(),e(83,`.
`),t(),n(84,"p"),e(85,"The "),n(86,"code"),e(87,"FileInterceptor()"),t(),e(88," decorator takes two arguments:"),t(),n(89,"ul")(90,"li")(91,"code"),e(92,"fieldName"),t(),e(93,": string that supplies the name of the field from the HTML form that holds a file"),t(),n(94,"li")(95,"code"),e(96,"options"),t(),e(97,": optional object of type "),n(98,"code"),e(99,"MulterOptions"),t(),e(100,". This is the same object used by the multer constructor (more details "),n(101,"a",18),e(102,"here"),t(),e(103,")."),t()(),n(104,"blockquote",11)(105,"strong"),e(106,"Warning"),t(),n(107,"code"),e(108,"FileInterceptor()"),t(),e(109,` may not be compatible with third party cloud providers like Google Firebase or others.
`),t(),n(110,"h4",19)(111,"span"),e(112,"File validation"),t()(),n(113,"p"),e(114,"Often times it can be useful to validate incoming file metadata, like file size or file mime-type. For this, you can create your own "),n(115,"a",20),e(116,"Pipe"),t(),e(117," and bind it to the parameter annotated with the "),n(118,"code"),e(119,"UploadedFile"),t(),e(120," decorator. The example below demonstrates how a basic file size validator pipe could be implemented:"),t(),n(121,"app-copy-button")(122,"pre")(123,"code",16),e(124,`
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // "value" is an object containing the file's attributes and metadata
    const oneKb = 1000;
    return value.size < oneKb;
  }
}
`),t()()(),n(125,"p"),e(126,"This can be used in conjunction with the "),n(127,"code"),e(128,"FileInterceptor"),t(),e(129," as follows:"),t(),n(130,"app-copy-button")(131,"pre")(132,"code",16),e(133,`
@Post('file')
@UseInterceptors(FileInterceptor('file'))
uploadFileAndValidate(@UploadedFile(
  new FileSizeValidationPipe(),
  // other pipes can be added here
) file: Express.Multer.File, ) {
  return file;
}
`),t()()(),n(134,"p"),e(135,"Nest provides a built-in pipe to handle common use cases and facilitate/standardize the addition of new ones. This pipe is called "),n(136,"code"),e(137,"ParseFilePipe"),t(),e(138,", and you can use it as follows:"),t(),n(139,"app-copy-button")(140,"pre")(141,"code",16),e(142,`
@Post('file')
uploadFileAndPassValidation(
  @Body() body: SampleDto,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        // ... Set of file validator instances here
      ]
    })
  )
  file: Express.Multer.File,
) {
  return {
    body,
    file: file.buffer.toString(),
  };
}
`),t()()(),n(143,"p"),e(144,"As you can see, it's required to specify an array of file validators that will be executed by the "),n(145,"code"),e(146,"ParseFilePipe"),t(),e(147,". We'll discuss the interface of a validator, but it's worth mentioning this pipe also has two additional "),n(148,"strong"),e(149,"optional"),t(),e(150," options:"),t(),n(151,"table")(152,"tr")(153,"td")(154,"code"),e(155,"errorHttpStatusCode"),t()(),n(156,"td"),e(157,"The HTTP status code to be thrown in case "),n(158,"b"),e(159,"any"),t(),e(160," validator fails. Default is "),n(161,"code"),e(162,"400"),t(),e(163," (BAD REQUEST)"),t()(),n(164,"tr")(165,"td")(166,"code"),e(167,"exceptionFactory"),t()(),n(168,"td"),e(169,"A factory which receives the error message and returns an error."),t()()(),n(170,"p"),e(171,"Now, back to the "),n(172,"code"),e(173,"FileValidator"),t(),e(174," interface. To integrate validators with this pipe, you have to either use built-in implementations or provide your own custom "),n(175,"code"),e(176,"FileValidator"),t(),e(177,". See example below:"),t(),n(178,"app-copy-button")(179,"pre")(180,"code",16),e(181,`
export abstract class FileValidator<TValidationOptions = Record<string, any>> {
  constructor(protected readonly validationOptions: TValidationOptions) {}

  /**
   * Indicates if this file should be considered valid, according to the options passed in the constructor.
   * @param file the file from the request object
   */
  abstract isValid(file?: any): boolean | Promise<boolean>;

  /**
   * Builds an error message in case the validation fails.
   * @param file the file from the request object
   */
  abstract buildErrorMessage(file: any): string;
}
`),t()()(),n(182,"blockquote",17)(183,"strong"),e(184,"Hint"),t(),e(185," The "),n(186,"code"),e(187,"FileValidator"),t(),e(188," interfaces supports async validation via its "),n(189,"code"),e(190,"isValid"),t(),e(191," function. To leverage type security, you can also type the "),n(192,"code"),e(193,"file"),t(),e(194," parameter as "),n(195,"code"),e(196,"Express.Multer.File"),t(),e(197,` in case you are using express (default) as a driver.
`),t(),n(198,"p")(199,"code"),e(200,"FileValidator"),t(),e(201," is a regular class that has access to the file object and validates it according to the options provided by the client. Nest has two built-in "),n(202,"code"),e(203,"FileValidator"),t(),e(204," implementations you can use in your project:"),t(),n(205,"ul")(206,"li")(207,"code"),e(208,"MaxFileSizeValidator"),t(),e(209," - Checks if a given file's size is less than the provided value (measured in "),n(210,"code"),e(211,"bytes"),t(),e(212,")"),t(),n(213,"li")(214,"code"),e(215,"FileTypeValidator"),t(),e(216," - Checks if a given file's mime-type matches a given string or RegExp. By default, validates the mime-type using file content "),n(217,"a",21),e(218,"magic number"),t()()(),n(219,"p"),e(220,"To understand how these can be used in conjunction with the aforementioned "),n(221,"code"),e(222,"ParseFilePipe"),t(),e(223,", we'll use an altered snippet of the last presented example:"),t(),n(224,"app-copy-button")(225,"pre")(226,"code",16),e(227,`
@UploadedFile(
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: 1000 }),
      new FileTypeValidator({ fileType: 'image/jpeg' }),
    ],
  }),
)
file: Express.Multer.File,
`),t()()(),n(228,"blockquote",17)(229,"strong"),e(230,"Hint"),t(),e(231," If the number of validators increase largely or their options are cluttering the file, you can define this array in a separate file and import it here as a named constant like "),n(232,"code"),e(233,"fileValidators"),t(),e(234,`.
`),t(),n(235,"p"),e(236,"Finally, you can use the special "),n(237,"code"),e(238,"ParseFilePipeBuilder"),t(),e(239," class that lets you compose & construct your validators. By using it as shown below you can avoid manual instantiation of each validator and just pass their options directly:"),t(),n(240,"app-copy-button")(241,"pre")(242,"code",16),e(243,`
@UploadedFile(
  new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fileType: 'jpeg',
    })
    .addMaxSizeValidator({
      maxSize: 1000
    })
    .build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
    }),
)
file: Express.Multer.File,
`),t()()(),n(244,"blockquote",17)(245,"strong"),e(246,"Hint"),t(),e(247," File presence is required by default, but you can make it optional by adding "),n(248,"code"),e(249,"fileIsRequired: false"),t(),e(250," parameter inside "),n(251,"code"),e(252,"build"),t(),e(253," function options (at the same level as "),n(254,"code"),e(255,"errorHttpStatusCode"),t(),e(256,`).
`),t(),n(257,"h4",22)(258,"span"),e(259,"Array of files"),t()(),n(260,"p"),e(261,"To upload an array of files (identified with a single field name), use the "),n(262,"code"),e(263,"FilesInterceptor()"),t(),e(264," decorator (note the plural "),n(265,"strong"),e(266,"Files"),t(),e(267," in the decorator name). This decorator takes three arguments:"),t(),n(268,"ul")(269,"li")(270,"code"),e(271,"fieldName"),t(),e(272,": as described above"),t(),n(273,"li")(274,"code"),e(275,"maxCount"),t(),e(276,": optional number defining the maximum number of files to accept"),t(),n(277,"li")(278,"code"),e(279,"options"),t(),e(280,": optional "),n(281,"code"),e(282,"MulterOptions"),t(),e(283," object, as described above"),t()(),n(284,"p"),e(285,"When using "),n(286,"code"),e(287,"FilesInterceptor()"),t(),e(288,", extract files from the "),n(289,"code"),e(290,"request"),t(),e(291," with the "),n(292,"code"),e(293,"@UploadedFiles()"),t(),e(294," decorator."),t(),n(295,"app-copy-button",14)(296,"span",15),o(297,"app-tabs",null,2),t(),n(299,"pre")(300,"code",16),e(301,`
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
`),t()(),n(302,"pre")(303,"code",16),e(304,`
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
@Bind(UploadedFiles())
uploadFile(files) {
  console.log(files);
}
`),t()()(),n(305,"blockquote",17)(306,"strong"),e(307,"Hint"),t(),e(308," The "),n(309,"code"),e(310,"FilesInterceptor()"),t(),e(311," decorator is exported from the "),n(312,"code"),e(313,"@nestjs/platform-express"),t(),e(314," package. The "),n(315,"code"),e(316,"@UploadedFiles()"),t(),e(317," decorator is exported from "),n(318,"code"),e(319,"@nestjs/common"),t(),e(320,`.
`),t(),n(321,"h4",23)(322,"span"),e(323,"Multiple files"),t()(),n(324,"p"),e(325,"To upload multiple files (all with different field name keys), use the "),n(326,"code"),e(327,"FileFieldsInterceptor()"),t(),e(328," decorator. This decorator takes two arguments:"),t(),n(329,"ul")(330,"li")(331,"code"),e(332,"uploadedFields"),t(),e(333,": an array of objects, where each object specifies a required "),n(334,"code"),e(335,"name"),t(),e(336," property with a string value specifying a field name, as described above, and an optional "),n(337,"code"),e(338,"maxCount"),t(),e(339," property, as described above"),t(),n(340,"li")(341,"code"),e(342,"options"),t(),e(343,": optional "),n(344,"code"),e(345,"MulterOptions"),t(),e(346," object, as described above"),t()(),n(347,"p"),e(348,"When using "),n(349,"code"),e(350,"FileFieldsInterceptor()"),t(),e(351,", extract files from the "),n(352,"code"),e(353,"request"),t(),e(354," with the "),n(355,"code"),e(356,"@UploadedFiles()"),t(),e(357," decorator."),t(),n(358,"app-copy-button",14)(359,"span",15),o(360,"app-tabs",null,3),t(),n(362,"pre")(363,"code",16),e(364,`
@Post('upload')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(@UploadedFiles() files: { avatar?: Express.Multer.File[], background?: Express.Multer.File[] }) {
  console.log(files);
}
`),t()(),n(365,"pre")(366,"code",16),e(367,`
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(files) {
  console.log(files);
}
`),t()()(),n(368,"h4",24)(369,"span"),e(370,"Any files"),t()(),n(371,"p"),e(372,"To upload all fields with arbitrary field name keys, use the "),n(373,"code"),e(374,"AnyFilesInterceptor()"),t(),e(375," decorator. This decorator can accept an optional "),n(376,"code"),e(377,"options"),t(),e(378," object as described above."),t(),n(379,"p"),e(380,"When using "),n(381,"code"),e(382,"AnyFilesInterceptor()"),t(),e(383,", extract files from the "),n(384,"code"),e(385,"request"),t(),e(386," with the "),n(387,"code"),e(388,"@UploadedFiles()"),t(),e(389," decorator."),t(),n(390,"app-copy-button",14)(391,"span",15),o(392,"app-tabs",null,4),t(),n(394,"pre")(395,"code",16),e(396,`
@Post('upload')
@UseInterceptors(AnyFilesInterceptor())
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
`),t()(),n(397,"pre")(398,"code",16),e(399,`
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(AnyFilesInterceptor())
uploadFile(files) {
  console.log(files);
}
`),t()()(),n(400,"h4",25)(401,"span"),e(402,"No files"),t()(),n(403,"p"),e(404,"To accept "),n(405,"code"),e(406,"multipart/form-data"),t(),e(407," but not allow any files to be uploaded, use the "),n(408,"code"),e(409,"NoFilesInterceptor"),t(),e(410,". This sets multipart data as attributes on the request body. Any files sent with the request will throw a "),n(411,"code"),e(412,"BadRequestException"),t(),e(413,"."),t(),n(414,"app-copy-button")(415,"pre")(416,"code",16),e(417,`
@Post('upload')
@UseInterceptors(NoFilesInterceptor())
handleMultiPartData(@Body() body) {
  console.log(body)
}
`),t()()(),n(418,"h4",26)(419,"span"),e(420,"Default options"),t()(),n(421,"p"),e(422,"You can specify multer options in the file interceptors as described above. To set default options, you can call the static "),n(423,"code"),e(424,"register()"),t(),e(425," method when you import the "),n(426,"code"),e(427,"MulterModule"),t(),e(428,", passing in supported options. You can use all options listed "),n(429,"a",18),e(430,"here"),t(),e(431,"."),t(),n(432,"app-copy-button")(433,"pre")(434,"code",16),e(435,`
MulterModule.register({
  dest: './upload',
});
`),t()()(),n(436,"blockquote",17)(437,"strong"),e(438,"Hint"),t(),e(439," The "),n(440,"code"),e(441,"MulterModule"),t(),e(442," class is exported from the "),n(443,"code"),e(444,"@nestjs/platform-express"),t(),e(445,` package.
`),t(),n(446,"h4",27)(447,"span"),e(448,"Async configuration"),t()(),n(449,"p"),e(450,"When you need to set "),n(451,"code"),e(452,"MulterModule"),t(),e(453," options asynchronously instead of statically, use the "),n(454,"code"),e(455,"registerAsync()"),t(),e(456," method. As with most dynamic modules, Nest provides several techniques to deal with async configuration."),t(),n(457,"p"),e(458,"One technique is to use a factory function:"),t(),n(459,"app-copy-button")(460,"pre")(461,"code",16),e(462,`
MulterModule.registerAsync({
  useFactory: () => ({
    dest: './upload',
  }),
});
`),t()()(),n(463,"p"),e(464,"Like other "),n(465,"a",28),e(466,"factory providers"),t(),e(467,", our factory function can be "),n(468,"code"),e(469,"async"),t(),e(470," and can inject dependencies through "),n(471,"code"),e(472,"inject"),t(),e(473,"."),t(),n(474,"app-copy-button")(475,"pre")(476,"code",16),e(477,`
MulterModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    dest: configService.get<string>('MULTER_DEST'),
  }),
  inject: [ConfigService],
});
`),t()()(),n(478,"p"),e(479,"Alternatively, you can configure the "),n(480,"code"),e(481,"MulterModule"),t(),e(482," using a class instead of a factory, as shown below:"),t(),n(483,"app-copy-button")(484,"pre")(485,"code",16),e(486,`
MulterModule.registerAsync({
  useClass: MulterConfigService,
});
`),t()()(),n(487,"p"),e(488,"The construction above instantiates "),n(489,"code"),e(490,"MulterConfigService"),t(),e(491," inside "),n(492,"code"),e(493,"MulterModule"),t(),e(494,", using it to create the required options object. Note that in this example, the "),n(495,"code"),e(496,"MulterConfigService"),t(),e(497," has to implement the "),n(498,"code"),e(499,"MulterOptionsFactory"),t(),e(500," interface, as shown below. The "),n(501,"code"),e(502,"MulterModule"),t(),e(503," will call the "),n(504,"code"),e(505,"createMulterOptions()"),t(),e(506," method on the instantiated object of the supplied class."),t(),n(507,"app-copy-button")(508,"pre")(509,"code",16),e(510,`
@Injectable()
class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      dest: './upload',
    };
  }
}
`),t()()(),n(511,"p"),e(512,"If you want to reuse an existing options provider instead of creating a private copy inside the "),n(513,"code"),e(514,"MulterModule"),t(),e(515,", use the "),n(516,"code"),e(517,"useExisting"),t(),e(518," syntax."),t(),n(519,"app-copy-button")(520,"pre")(521,"code",16),e(522,`
MulterModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
`),t()()(),n(523,"p"),e(524,"You can also pass so-called "),n(525,"code"),e(526,"extraProviders"),t(),e(527," to the "),n(528,"code"),e(529,"registerAsync()"),t(),e(530," method. These providers will be merged with the module providers."),t(),n(531,"app-copy-button")(532,"pre")(533,"code",16),e(534,`
MulterModule.registerAsync({
  imports: [ConfigModule],
  useClass: ConfigService,
  extraProviders: [MyAdditionalProvider],
});
`),t()()(),n(535,"p"),e(536,"This is useful when you want to provide additional dependencies to the factory function or the class constructor."),t(),n(537,"h4",29)(538,"span"),e(539,"Example"),t()(),n(540,"p"),e(541,"A working example is available "),n(542,"a",30),e(543,"here"),t(),e(544,"."),t()()),c&2){let b=r(61),v=r(298),T=r(361),k=r(393);i(39),I("import ","{"," Express ","}"," from 'express'"),i(23),u("hide",b.isJsActive),i(3),u("hide",!b.isJsActive),i(234),u("hide",v.isJsActive),i(3),u("hide",!v.isJsActive),i(60),u("hide",T.isJsActive),i(3),u("hide",!T.isJsActive),i(29),u("hide",k.isJsActive),i(3),u("hide",!k.isJsActive)}},dependencies:[g,E,y],encapsulation:2,changeDetection:0})}return a})();var Y=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-http-module"]],features:[f],decls:265,vars:4,consts:[["contentReference",""],["appb7c166fae60078b328b79751d57090526ffd7d44",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/http-module.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","http-module"],["rel","nofollow","target","_blank","href","https://github.com/axios/axios"],[1,"info"],["rel","nofollow","target","_blank","href","https://github.com/sindresorhus/got"],["rel","nofollow","target","_blank","href","https://github.com/nodejs/undici"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","getting-started"],[1,"language-typescript"],[1,"with-heading"],[1,"filename"],["appAnchor","","id","configuration"],["rel","nofollow","target","_blank","href","https://github.com/axios/axios#request-config"],["appAnchor","","id","async-configuration"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory"],["appAnchor","","id","using-axios-directly"],["appAnchor","","id","full-example"],["rel","nofollow","target","_blank","href","https://rxjs.dev/api/index/function/firstValueFrom"],["rel","nofollow","target","_blank","href","https://rxjs.dev/api/index/function/lastValueFrom"]],template:function(c,p){if(c&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),o(4,"i",5),t()(),n(5,"h3",6),e(6,"HTTP module"),t(),n(7,"p")(8,"a",7),e(9,"Axios"),t(),e(10," is a richly featured HTTP client package that is widely used. Nest wraps Axios and exposes it via the built-in "),n(11,"code"),e(12,"HttpModule"),t(),e(13,". The "),n(14,"code"),e(15,"HttpModule"),t(),e(16," exports the "),n(17,"code"),e(18,"HttpService"),t(),e(19," class, which exposes Axios-based methods to perform HTTP requests. The library also transforms the resulting HTTP responses into "),n(20,"code"),e(21,"Observables"),t(),e(22,"."),t(),n(23,"blockquote",8)(24,"strong"),e(25,"Hint"),t(),e(26," You can also use any general purpose Node.js HTTP client library directly, including "),n(27,"a",9),e(28,"got"),t(),e(29," or "),n(30,"a",10),e(31,"undici"),t(),e(32,`.
`),t(),n(33,"h4",11)(34,"span"),e(35,"Installation"),t()(),n(36,"p"),e(37,"To begin using it, we first install required dependencies."),t(),n(38,"pre")(39,"code",12),e(40,`
$ npm i --save @nestjs/axios axios
`),t()(),n(41,"h4",13)(42,"span"),e(43,"Getting started"),t()(),n(44,"p"),e(45,"Once the installation process is complete, to use the "),n(46,"code"),e(47,"HttpService"),t(),e(48,", first import "),n(49,"code"),e(50,"HttpModule"),t(),e(51,"."),t(),n(52,"app-copy-button")(53,"pre")(54,"code",14),e(55,`
@Module({
  imports: [HttpModule],
  providers: [CatsService],
})
export class CatsModule {}
`),t()()(),n(56,"p"),e(57,"Next, inject "),n(58,"code"),e(59,"HttpService"),t(),e(60," using normal constructor injection."),t(),n(61,"blockquote",8)(62,"strong"),e(63,"Hint"),t(),n(64,"code"),e(65,"HttpModule"),t(),e(66," and "),n(67,"code"),e(68,"HttpService"),t(),e(69," are imported from "),n(70,"code"),e(71,"@nestjs/axios"),t(),e(72,` package.
`),t(),n(73,"app-copy-button",15)(74,"span",16),o(75,"app-tabs",null,1),t(),n(77,"pre")(78,"code",14),e(79,`
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Observable<AxiosResponse<Cat[]>> {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
`),t()(),n(80,"pre")(81,"code",14),e(82,`
@Injectable()
@Dependencies(HttpService)
export class CatsService {
  constructor(httpService) {
    this.httpService = httpService;
  }

  findAll() {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
`),t()()(),n(83,"blockquote",8)(84,"strong"),e(85,"Hint"),t(),n(86,"code"),e(87,"AxiosResponse"),t(),e(88," is an interface exported from the "),n(89,"code"),e(90,"axios"),t(),e(91," package ("),n(92,"code"),e(93,"$ npm i axios"),t(),e(94,`).
`),t(),n(95,"p"),e(96,"All "),n(97,"code"),e(98,"HttpService"),t(),e(99," methods return an "),n(100,"code"),e(101,"AxiosResponse"),t(),e(102," wrapped in an "),n(103,"code"),e(104,"Observable"),t(),e(105," object."),t(),n(106,"h4",17)(107,"span"),e(108,"Configuration"),t()(),n(109,"p")(110,"a",7),e(111,"Axios"),t(),e(112," can be configured with a variety of options to customize the behavior of the "),n(113,"code"),e(114,"HttpService"),t(),e(115,". Read more about them "),n(116,"a",18),e(117,"here"),t(),e(118,". To configure the underlying Axios instance, pass an optional options object to the "),n(119,"code"),e(120,"register()"),t(),e(121," method of "),n(122,"code"),e(123,"HttpModule"),t(),e(124," when importing it. This options object will be passed directly to the underlying Axios constructor."),t(),n(125,"app-copy-button")(126,"pre")(127,"code",14),e(128,`
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [CatsService],
})
export class CatsModule {}
`),t()()(),n(129,"h4",19)(130,"span"),e(131,"Async configuration"),t()(),n(132,"p"),e(133,"When you need to pass module options asynchronously instead of statically, use the "),n(134,"code"),e(135,"registerAsync()"),t(),e(136," method. As with most dynamic modules, Nest provides several techniques to deal with async configuration."),t(),n(137,"p"),e(138,"One technique is to use a factory function:"),t(),n(139,"app-copy-button")(140,"pre")(141,"code",14),e(142,`
HttpModule.registerAsync({
  useFactory: () => ({
    timeout: 5000,
    maxRedirects: 5,
  }),
});
`),t()()(),n(143,"p"),e(144,"Like other factory providers, our factory function can be "),n(145,"a",20),e(146,"async"),t(),e(147," and can inject dependencies through "),n(148,"code"),e(149,"inject"),t(),e(150,"."),t(),n(151,"app-copy-button")(152,"pre")(153,"code",14),e(154,`
HttpModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    timeout: configService.get('HTTP_TIMEOUT'),
    maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
  }),
  inject: [ConfigService],
});
`),t()()(),n(155,"p"),e(156,"Alternatively, you can configure the "),n(157,"code"),e(158,"HttpModule"),t(),e(159," using a class instead of a factory, as shown below."),t(),n(160,"app-copy-button")(161,"pre")(162,"code",14),e(163,`
HttpModule.registerAsync({
  useClass: HttpConfigService,
});
`),t()()(),n(164,"p"),e(165,"The construction above instantiates "),n(166,"code"),e(167,"HttpConfigService"),t(),e(168," inside "),n(169,"code"),e(170,"HttpModule"),t(),e(171,", using it to create an options object. Note that in this example, the "),n(172,"code"),e(173,"HttpConfigService"),t(),e(174," has to implement "),n(175,"code"),e(176,"HttpModuleOptionsFactory"),t(),e(177," interface as shown below. The "),n(178,"code"),e(179,"HttpModule"),t(),e(180," will call the "),n(181,"code"),e(182,"createHttpOptions()"),t(),e(183," method on the instantiated object of the supplied class."),t(),n(184,"app-copy-button")(185,"pre")(186,"code",14),e(187,`
@Injectable()
class HttpConfigService implements HttpModuleOptionsFactory {
  createHttpOptions(): HttpModuleOptions {
    return {
      timeout: 5000,
      maxRedirects: 5,
    };
  }
}
`),t()()(),n(188,"p"),e(189,"If you want to reuse an existing options provider instead of creating a private copy inside the "),n(190,"code"),e(191,"HttpModule"),t(),e(192,", use the "),n(193,"code"),e(194,"useExisting"),t(),e(195," syntax."),t(),n(196,"app-copy-button")(197,"pre")(198,"code",14),e(199,`
HttpModule.registerAsync({
  imports: [ConfigModule],
  useExisting: HttpConfigService,
});
`),t()()(),n(200,"p"),e(201,"You can also pass so-called "),n(202,"code"),e(203,"extraProviders"),t(),e(204," to the "),n(205,"code"),e(206,"registerAsync()"),t(),e(207," method. These providers will be merged with the module providers."),t(),n(208,"app-copy-button")(209,"pre")(210,"code",14),e(211,`
HttpModule.registerAsync({
  imports: [ConfigModule],
  useClass: HttpConfigService,
  extraProviders: [MyAdditionalProvider],
});
`),t()()(),n(212,"p"),e(213,"This is useful when you want to provide additional dependencies to the factory function or the class constructor."),t(),n(214,"h4",21)(215,"span"),e(216,"Using Axios directly"),t()(),n(217,"p"),e(218,"If you think that "),n(219,"code"),e(220,"HttpModule.register"),t(),e(221,"'s options are not enough for you, or if you just want to access the underlying Axios instance created by "),n(222,"code"),e(223,"@nestjs/axios"),t(),e(224,", you can access it via "),n(225,"code"),e(226,"HttpService#axiosRef"),t(),e(227," as follows:"),t(),n(228,"app-copy-button")(229,"pre")(230,"code",14),e(231,`
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Promise<AxiosResponse<Cat[]>> {
    return this.httpService.axiosRef.get('http://localhost:3000/cats');
    //                      ^ AxiosInstance interface
  }
}
`),t()()(),n(232,"h4",22)(233,"span"),e(234,"Full example"),t()(),n(235,"p"),e(236,"Since the return value of the "),n(237,"code"),e(238,"HttpService"),t(),e(239," methods is an Observable, we can use "),n(240,"code"),e(241,"rxjs"),t(),e(242," - "),n(243,"code"),e(244,"firstValueFrom"),t(),e(245," or "),n(246,"code"),e(247,"lastValueFrom"),t(),e(248," to retrieve the data of the request in the form of a promise."),t(),n(249,"app-copy-button")(250,"pre")(251,"code",14),e(252,`
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class CatsService {
  private readonly logger = new Logger(CatsService.name);
  constructor(private readonly httpService: HttpService) {}

  async findAll(): Promise<Cat[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<Cat[]>('http://localhost:3000/cats').pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw 'An error happened!';
        }),
      ),
    );
    return data;
  }
}
`),t()()(),n(253,"blockquote",8)(254,"strong"),e(255,"Hint"),t(),e(256," Visit RxJS's documentation on "),n(257,"a",23)(258,"code"),e(259,"firstValueFrom"),t()(),e(260," and "),n(261,"a",24)(262,"code"),e(263,"lastValueFrom"),t()(),e(264,` for differences between them.
`),t()()),c&2){let b=r(76);i(77),u("hide",b.isJsActive),i(3),u("hide",!b.isJsActive)}},dependencies:[g,E,y],encapsulation:2,changeDetection:0})}return a})();var $=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-logger"]],features:[f],decls:766,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/logger.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","logger"],["rel","nofollow","target","_blank","href","https://github.com/pinojs/pino"],["appAnchor","","id","basic-customization"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","json-logging"],["rel","nofollow","target","_blank","href","https://mau.nestjs.com"],[1,"language-json"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/pull/14121"],["appAnchor","","id","using-the-logger-for-application-logging"],[1,"language-bash"],["appAnchor","","id","logs-with-timestamps"],["appAnchor","","id","custom-implementation"],["href","techniques/logger#dependency-injection"],["appAnchor","","id","extend-built-in-logger"],["href","techniques/logger#using-the-logger-for-application-logging"],["href","techniques/logger#custom-logger-implementation"],["appAnchor","","id","dependency-injection"],["href","techniques/logger#injecting-a-custom-logger"],["appAnchor","","id","injecting-a-custom-logger"],["routerLink","/fundamentals/injection-scopes"],["appAnchor","","id","use-external-logger"],["rel","nofollow","target","_blank","href","https://github.com/winstonjs/winston"]],template:function(c,p){c&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Logger"),t(),n(7,"p"),e(8,"Nest comes with a built-in text-based logger which is used during application bootstrapping and several other circumstances such as displaying caught exceptions (i.e., system logging). This functionality is provided via the "),n(9,"code"),e(10,"Logger"),t(),e(11," class in the "),n(12,"code"),e(13,"@nestjs/common"),t(),e(14," package. You can fully control the behavior of the logging system, including any of the following:"),t(),n(15,"ul")(16,"li"),e(17,"disable logging entirely"),t(),n(18,"li"),e(19,"specify the log level of detail (e.g., display errors, warnings, debug information, etc.)"),t(),n(20,"li"),e(21,"configure formatting of log messages (raw, json, colorized, etc.)"),t(),n(22,"li"),e(23,"override timestamp in the default logger (e.g., use ISO8601 standard as date format)"),t(),n(24,"li"),e(25,"completely override the default logger"),t(),n(26,"li"),e(27,"customize the default logger by extending it"),t(),n(28,"li"),e(29,"make use of dependency injection to simplify composing and testing your application"),t()(),n(30,"p"),e(31,"You can also make use of the built-in logger, or create your own custom implementation, to log your own application-level events and messages."),t(),n(32,"p"),e(33,"If your application requires integration with external logging systems, automatic file-based logging, or forwarding logs to a centralized logging service, you can implement a fully custom logging solution using a Node.js logging library. One popular choice is "),n(34,"a",6),e(35,"Pino"),t(),e(36,", known for its high performance and flexibility."),t(),n(37,"h4",7)(38,"span"),e(39,"Basic customization"),t()(),n(40,"p"),e(41,"To disable logging, set the "),n(42,"code"),e(43,"logger"),t(),e(44," property to "),n(45,"code"),e(46,"false"),t(),e(47," in the (optional) Nest application options object passed as the second argument to the "),n(48,"code"),e(49,"NestFactory.create()"),t(),e(50," method."),t(),n(51,"app-copy-button")(52,"pre")(53,"code",8),e(54,`
const app = await NestFactory.create(AppModule, {
  logger: false,
});
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(55,"p"),e(56,"To enable specific logging levels, set the "),n(57,"code"),e(58,"logger"),t(),e(59," property to an array of strings specifying the log levels to display, as follows:"),t(),n(60,"app-copy-button")(61,"pre")(62,"code",8),e(63,`
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn'],
});
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(64,"p"),e(65,"Values in the array can be any combination of "),n(66,"code"),e(67,"'log'"),t(),e(68,", "),n(69,"code"),e(70,"'fatal'"),t(),e(71,", "),n(72,"code"),e(73,"'error'"),t(),e(74,", "),n(75,"code"),e(76,"'warn'"),t(),e(77,", "),n(78,"code"),e(79,"'debug'"),t(),e(80,", and "),n(81,"code"),e(82,"'verbose'"),t(),e(83,"."),t(),n(84,"blockquote",9)(85,"strong"),e(86,"Hint"),t(),e(87," Log levels in Nest are cascading (inherited). This means that providing a specific log level (like "),n(88,"code"),e(89,"'log'"),t(),e(90,") will automatically include all higher-severity levels (e.g., "),n(91,"code"),e(92,"'warn'"),t(),e(93,", "),n(94,"code"),e(95,"'error'"),t(),e(96,", and "),n(97,"code"),e(98,"'fatal'"),t(),e(99,`).
`),t(),n(100,"p"),e(101,"To disable colorized output, pass the "),n(102,"code"),e(103,"ConsoleLogger"),t(),e(104," object with the "),n(105,"code"),e(106,"colors"),t(),e(107," property set to "),n(108,"code"),e(109,"false"),t(),e(110," as the value of the "),n(111,"code"),e(112,"logger"),t(),e(113," property."),t(),n(114,"app-copy-button")(115,"pre")(116,"code",8),e(117,`
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    colors: false,
  }),
});
`),t()()(),n(118,"p"),e(119,"To configure a prefix for each log message, pass the "),n(120,"code"),e(121,"ConsoleLogger"),t(),e(122," object with the "),n(123,"code"),e(124,"prefix"),t(),e(125," attribute set:"),t(),n(126,"app-copy-button")(127,"pre")(128,"code",8),e(129,`
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    prefix: 'MyApp', // Default is "Nest"
  }),
});
`),t()()(),n(130,"p"),e(131,"Here are all the available options listed in the table below:"),t(),n(132,"table")(133,"thead")(134,"tr")(135,"th"),e(136,"Option"),t(),n(137,"th"),e(138,"Description"),t(),n(139,"th"),e(140,"Default"),t()()(),n(141,"tbody")(142,"tr")(143,"td")(144,"code"),e(145,"logLevels"),t()(),n(146,"td"),e(147,"Enabled log levels."),t(),n(148,"td")(149,"code"),e(150,"['log', 'fatal', 'error', 'warn', 'debug', 'verbose']"),t()()(),n(151,"tr")(152,"td")(153,"code"),e(154,"timestamp"),t()(),n(155,"td"),e(156,"If enabled, will print timestamp (time difference) between current and previous log message. Note: This option is not used when "),n(157,"code"),e(158,"json"),t(),e(159," is enabled."),t(),n(160,"td")(161,"code"),e(162,"false"),t()()(),n(163,"tr")(164,"td")(165,"code"),e(166,"prefix"),t()(),n(167,"td"),e(168,"A prefix to be used for each log message. Note: This option is not used when "),n(169,"code"),e(170,"json"),t(),e(171," is enabled."),t(),n(172,"td")(173,"code"),e(174,"Nest"),t()()(),n(175,"tr")(176,"td")(177,"code"),e(178,"json"),t()(),n(179,"td"),e(180,"If enabled, will print the log message in JSON format."),t(),n(181,"td")(182,"code"),e(183,"false"),t()()(),n(184,"tr")(185,"td")(186,"code"),e(187,"colors"),t()(),n(188,"td"),e(189,"If enabled, will print the log message in color. Default true if json is disabled, false otherwise."),t(),n(190,"td")(191,"code"),e(192,"true"),t()()(),n(193,"tr")(194,"td")(195,"code"),e(196,"context"),t()(),n(197,"td"),e(198,"The context of the logger."),t(),n(199,"td")(200,"code"),e(201,"undefined"),t()()(),n(202,"tr")(203,"td")(204,"code"),e(205,"compact"),t()(),n(206,"td"),e(207,"If enabled, will print the log message in a single line, even if it is an object with multiple properties. If set to a number, the most n inner elements are united on a single line as long as all properties fit into breakLength. Short array elements are also grouped together."),t(),n(208,"td")(209,"code"),e(210,"true"),t()()(),n(211,"tr")(212,"td")(213,"code"),e(214,"maxArrayLength"),t()(),n(215,"td"),e(216,"Specifies the maximum number of Array, TypedArray, Map, Set, WeakMap, and WeakSet elements to include when formatting. Set to null or Infinity to show all elements. Set to 0 or negative to show no elements. Ignored when "),n(217,"code"),e(218,"json"),t(),e(219," is enabled, colors are disabled, and "),n(220,"code"),e(221,"compact"),t(),e(222," is set to true as it produces a parseable JSON output."),t(),n(223,"td")(224,"code"),e(225,"100"),t()()(),n(226,"tr")(227,"td")(228,"code"),e(229,"maxStringLength"),t()(),n(230,"td"),e(231,"Specifies the maximum number of characters to include when formatting. Set to null or Infinity to show all elements. Set to 0 or negative to show no characters. Ignored when "),n(232,"code"),e(233,"json"),t(),e(234," is enabled, colors are disabled, and "),n(235,"code"),e(236,"compact"),t(),e(237," is set to true as it produces a parseable JSON output."),t(),n(238,"td")(239,"code"),e(240,"10000"),t()()(),n(241,"tr")(242,"td")(243,"code"),e(244,"sorted"),t()(),n(245,"td"),e(246,"If enabled, will sort keys while formatting objects. Can also be a custom sorting function. Ignored when "),n(247,"code"),e(248,"json"),t(),e(249," is enabled, colors are disabled, and "),n(250,"code"),e(251,"compact"),t(),e(252," is set to true as it produces a parseable JSON output."),t(),n(253,"td")(254,"code"),e(255,"false"),t()()(),n(256,"tr")(257,"td")(258,"code"),e(259,"depth"),t()(),n(260,"td"),e(261,"Specifies the number of times to recurse while formatting object. This is useful for inspecting large objects. To recurse up to the maximum call stack size pass Infinity or null. Ignored when "),n(262,"code"),e(263,"json"),t(),e(264," is enabled, colors are disabled, and "),n(265,"code"),e(266,"compact"),t(),e(267," is set to true as it produces a parseable JSON output."),t(),n(268,"td")(269,"code"),e(270,"5"),t()()(),n(271,"tr")(272,"td")(273,"code"),e(274,"showHidden"),t()(),n(275,"td"),e(276,"If true, object's non-enumerable symbols and properties are included in the formatted result. WeakMap and WeakSet entries are also included as well as user defined prototype properties"),t(),n(277,"td")(278,"code"),e(279,"false"),t()()(),n(280,"tr")(281,"td")(282,"code"),e(283,"breakLength"),t()(),n(284,"td"),e(285,'The length at which input values are split across multiple lines. Set to Infinity to format the input as a single line (in combination with "compact" set to true). Default Infinity when "compact" is true, 80 otherwise. Ignored when '),n(286,"code"),e(287,"json"),t(),e(288," is enabled, colors are disabled, and "),n(289,"code"),e(290,"compact"),t(),e(291," is set to true as it produces a parseable JSON output."),t(),n(292,"td")(293,"code"),e(294,"Infinity"),t()()()()(),n(295,"h4",10)(296,"span"),e(297,"JSON logging"),t()(),n(298,"p"),e(299,"JSON logging is essential for modern application observability and integration with log management systems. To enable JSON logging in your NestJS application, configure the "),n(300,"code"),e(301,"ConsoleLogger"),t(),e(302," object with its "),n(303,"code"),e(304,"json"),t(),e(305," property set to "),n(306,"code"),e(307,"true"),t(),e(308,". Then, provide this logger configuration as the value for the "),n(309,"code"),e(310,"logger"),t(),e(311," property when creating the application instance."),t(),n(312,"app-copy-button")(313,"pre")(314,"code",8),e(315,`
const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({
    json: true,
  }),
});
`),t()()(),n(316,"p"),e(317,"This configuration outputs logs in a structured JSON format, making it easier to integrate with external systems such as log aggregators and cloud platforms. For example, platforms like "),n(318,"strong"),e(319,"AWS ECS"),t(),e(320," (Elastic Container Service) natively support JSON logs, enabling advanced features like:"),t(),n(321,"ul")(322,"li")(323,"strong"),e(324,"Log Filtering"),t(),e(325,": Easily narrow down logs based on fields like log level, timestamp, or custom metadata."),t(),n(326,"li")(327,"strong"),e(328,"Search and Analysis"),t(),e(329,": Use query tools to analyze and track trends in your application's behavior."),t()(),n(330,"p"),e(331,"Additionally, if you're using "),n(332,"a",11),e(333,"NestJS Mau"),t(),e(334,", JSON logging simplifies the process of viewing logs in a well-organized, structured format, which is especially useful for debugging and performance monitoring."),t(),n(335,"blockquote",9)(336,"strong"),e(337,"Note"),t(),e(338," When "),n(339,"code"),e(340,"json"),t(),e(341," is set to "),n(342,"code"),e(343,"true"),t(),e(344,", the "),n(345,"code"),e(346,"ConsoleLogger"),t(),e(347," automatically disables text colorization by setting the "),n(348,"code"),e(349,"colors"),t(),e(350," property to "),n(351,"code"),e(352,"false"),t(),e(353,". This ensures that the output remains valid JSON, free of formatting artifacts. However, for development purposes, you can override this behavior by explicitly setting "),n(354,"code"),e(355,"colors"),t(),e(356," to "),n(357,"code"),e(358,"true"),t(),e(359,`. This adds colorized JSON logs, which can make log entries more readable during local debugging.
`),t(),n(360,"p"),e(361,"When JSON logging is enabled, the log output will look like this (in a single line):"),t(),n(362,"pre")(363,"code",12),e(364,`
{
  "level": "log",
  "pid": 19096,
  "timestamp": 1607370779834,
  "message": "Starting Nest application...",
  "context": "NestFactory"
}
`),t()(),n(365,"p"),e(366,"You can see different variants in this "),n(367,"a",13),e(368,"Pull Request"),t(),e(369,"."),t(),n(370,"h4",14)(371,"span"),e(372,"Using the logger for application logging"),t()(),n(373,"p"),e(374,"We can combine several of the techniques above to provide consistent behavior and formatting across both Nest system logging and our own application event/message logging."),t(),n(375,"p"),e(376,"A good practice is to instantiate "),n(377,"code"),e(378,"Logger"),t(),e(379," class from "),n(380,"code"),e(381,"@nestjs/common"),t(),e(382," in each of our services. We can supply our service name as the "),n(383,"code"),e(384,"context"),t(),e(385," argument in the "),n(386,"code"),e(387,"Logger"),t(),e(388," constructor, like so:"),t(),n(389,"app-copy-button")(390,"pre")(391,"code",8),e(392,`
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log('Doing something...');
  }
}
`),t()()(),n(393,"p"),e(394,"In the default logger implementation, "),n(395,"code"),e(396,"context"),t(),e(397," is printed in the square brackets, like "),n(398,"code"),e(399,"NestFactory"),t(),e(400," in the example below:"),t(),n(401,"pre")(402,"code",15),e(403,`
[Nest] 19096   - 12/08/2019, 7:12:59 AM   [NestFactory] Starting Nest application...
`),t()(),n(404,"p"),e(405,"If we supply a custom logger via "),n(406,"code"),e(407,"app.useLogger()"),t(),e(408,", it will actually be used by Nest internally. That means that our code remains implementation agnostic, while we can easily substitute the default logger for our custom one by calling "),n(409,"code"),e(410,"app.useLogger()"),t(),e(411,"."),t(),n(412,"p"),e(413,"That way if we follow the steps from the previous section and call "),n(414,"code"),e(415,"app.useLogger(app.get(MyLogger))"),t(),e(416,", the following calls to "),n(417,"code"),e(418,"this.logger.log()"),t(),e(419," from "),n(420,"code"),e(421,"MyService"),t(),e(422," would result in calls to method "),n(423,"code"),e(424,"log"),t(),e(425," from "),n(426,"code"),e(427,"MyLogger"),t(),e(428," instance."),t(),n(429,"p"),e(430,"This should be suitable for most cases. But if you need more customization (like adding and calling custom methods), move to the next section."),t(),n(431,"h4",16)(432,"span"),e(433,"Logs with timestamps"),t()(),n(434,"p"),e(435,"To enable timestamp logging for every logged message, you can use the optional "),n(436,"code"),e(437,"timestamp: true"),t(),e(438," setting when creating the logger instance."),t(),n(439,"app-copy-button")(440,"pre")(441,"code",8),e(442,`
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name, { timestamp: true });

  doSomething() {
    this.logger.log('Doing something with timestamp here ->');
  }
}
`),t()()(),n(443,"p"),e(444,"This will produce output in the following format:"),t(),n(445,"pre")(446,"code",15),e(447,`
[Nest] 19096   - 04/19/2024, 7:12:59 AM   [MyService] Doing something with timestamp here +5ms
`),t()(),n(448,"p"),e(449,"Note the "),n(450,"code"),e(451,"+5ms"),t(),e(452," at the end of the line. For each log statement, the time difference from the previous message is calculated and displayed at the end of the line."),t(),n(453,"h4",17)(454,"span"),e(455,"Custom implementation"),t()(),n(456,"p"),e(457,"You can provide a custom logger implementation to be used by Nest for system logging by setting the value of the "),n(458,"code"),e(459,"logger"),t(),e(460," property to an object that fulfills the "),n(461,"code"),e(462,"LoggerService"),t(),e(463," interface. For example, you can tell Nest to use the built-in global JavaScript "),n(464,"code"),e(465,"console"),t(),e(466," object (which implements the "),n(467,"code"),e(468,"LoggerService"),t(),e(469," interface), as follows:"),t(),n(470,"app-copy-button")(471,"pre")(472,"code",8),e(473,`
const app = await NestFactory.create(AppModule, {
  logger: console,
});
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(474,"p"),e(475,"Implementing your own custom logger is straightforward. Simply implement each of the methods of the "),n(476,"code"),e(477,"LoggerService"),t(),e(478," interface as shown below."),t(),n(479,"app-copy-button")(480,"pre")(481,"code",8),e(482,`
import { LoggerService, Injectable } from '@nestjs/common';

@Injectable()
export class MyLogger implements LoggerService {
  /**
   * Write a 'log' level log.
   */
  log(message: any, ...optionalParams: any[]) {}

  /**
   * Write a 'fatal' level log.
   */
  fatal(message: any, ...optionalParams: any[]) {}

  /**
   * Write an 'error' level log.
   */
  error(message: any, ...optionalParams: any[]) {}

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, ...optionalParams: any[]) {}

  /**
   * Write a 'debug' level log.
   */
  debug?(message: any, ...optionalParams: any[]) {}

  /**
   * Write a 'verbose' level log.
   */
  verbose?(message: any, ...optionalParams: any[]) {}
}
`),t()()(),n(483,"p"),e(484,"You can then supply an instance of "),n(485,"code"),e(486,"MyLogger"),t(),e(487," via the "),n(488,"code"),e(489,"logger"),t(),e(490," property of the Nest application options object."),t(),n(491,"app-copy-button")(492,"pre")(493,"code",8),e(494,`
const app = await NestFactory.create(AppModule, {
  logger: new MyLogger(),
});
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(495,"p"),e(496,"This technique, while simple, doesn't utilize dependency injection for the "),n(497,"code"),e(498,"MyLogger"),t(),e(499," class. This can pose some challenges, particularly for testing, and limit the reusability of "),n(500,"code"),e(501,"MyLogger"),t(),e(502,". For a better solution, see the "),n(503,"a",18),e(504,"Dependency Injection"),t(),e(505," section below."),t(),n(506,"h4",19)(507,"span"),e(508,"Extend built-in logger"),t()(),n(509,"p"),e(510,"Rather than writing a logger from scratch, you may be able to meet your needs by extending the built-in "),n(511,"code"),e(512,"ConsoleLogger"),t(),e(513," class and overriding selected behavior of the default implementation."),t(),n(514,"app-copy-button")(515,"pre")(516,"code",8),e(517,`
import { ConsoleLogger } from '@nestjs/common';

export class MyLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    // add your tailored logic here
    super.error(...arguments);
  }
}
`),t()()(),n(518,"p"),e(519,"You can use such an extended logger in your feature modules as described in the "),n(520,"a",20),e(521,"Using the logger for application logging"),t(),e(522," section below."),t(),n(523,"p"),e(524,"You can tell Nest to use your extended logger for system logging by passing an instance of it via the "),n(525,"code"),e(526,"logger"),t(),e(527," property of the application options object (as shown in the "),n(528,"a",21),e(529,"Custom implementation"),t(),e(530," section above), or by using the technique shown in the "),n(531,"a",18),e(532,"Dependency Injection"),t(),e(533," section below. If you do so, you should take care to call "),n(534,"code"),e(535,"super"),t(),e(536,", as shown in the sample code above, to delegate the specific log method call to the parent (built-in) class so that Nest can rely on the built-in features it expects."),t(),n(537,"p"),o(538,"app-banner-courses"),t(),n(539,"h4",22)(540,"span"),e(541,"Dependency injection"),t()(),n(542,"p"),e(543,"For more advanced logging functionality, you'll want to take advantage of dependency injection. For example, you may want to inject a "),n(544,"code"),e(545,"ConfigService"),t(),e(546," into your logger to customize it, and in turn inject your custom logger into other controllers and/or providers. To enable dependency injection for your custom logger, create a class that implements "),n(547,"code"),e(548,"LoggerService"),t(),e(549," and register that class as a provider in some module. For example, you can"),t(),n(550,"ol")(551,"li"),e(552,"Define a "),n(553,"code"),e(554,"MyLogger"),t(),e(555," class that either extends the built-in "),n(556,"code"),e(557,"ConsoleLogger"),t(),e(558," or completely overrides it, as shown in previous sections. Be sure to implement the "),n(559,"code"),e(560,"LoggerService"),t(),e(561," interface."),t(),n(562,"li"),e(563,"Create a "),n(564,"code"),e(565,"LoggerModule"),t(),e(566," as shown below, and provide "),n(567,"code"),e(568,"MyLogger"),t(),e(569," from that module."),t()(),n(570,"app-copy-button")(571,"pre")(572,"code",8),e(573,`
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
`),t()()(),n(574,"p"),e(575,"With this construct, you are now providing your custom logger for use by any other module. Because your "),n(576,"code"),e(577,"MyLogger"),t(),e(578," class is part of a module, it can use dependency injection (for example, to inject a "),n(579,"code"),e(580,"ConfigService"),t(),e(581,"). There's one more technique needed to provide this custom logger for use by Nest for system logging (e.g., for bootstrapping and error handling)."),t(),n(582,"p"),e(583,"Because application instantiation ("),n(584,"code"),e(585,"NestFactory.create()"),t(),e(586,") happens outside the context of any module, it doesn't participate in the normal Dependency Injection phase of initialization. So we must ensure that at least one application module imports the "),n(587,"code"),e(588,"LoggerModule"),t(),e(589," to trigger Nest to instantiate a singleton instance of our "),n(590,"code"),e(591,"MyLogger"),t(),e(592," class."),t(),n(593,"p"),e(594,"We can then instruct Nest to use the same singleton instance of "),n(595,"code"),e(596,"MyLogger"),t(),e(597," with the following construction:"),t(),n(598,"app-copy-button")(599,"pre")(600,"code",8),e(601,`
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(app.get(MyLogger));
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(602,"blockquote",9)(603,"strong"),e(604,"Note"),t(),e(605," In the example above, we set the "),n(606,"code"),e(607,"bufferLogs"),t(),e(608," to "),n(609,"code"),e(610,"true"),t(),e(611," to make sure all logs will be buffered until a custom logger is attached ("),n(612,"code"),e(613,"MyLogger"),t(),e(614," in this case) and the application initialisation process either completes or fails. If the initialisation process fails, Nest will fallback to the original "),n(615,"code"),e(616,"ConsoleLogger"),t(),e(617," to print out any reported error messages. Also, you can set the "),n(618,"code"),e(619,"autoFlushLogs"),t(),e(620," to "),n(621,"code"),e(622,"false"),t(),e(623," (default "),n(624,"code"),e(625,"true"),t(),e(626,") to manually flush logs (using the "),n(627,"code"),e(628,"Logger.flush()"),t(),e(629,` method).
`),t(),n(630,"p"),e(631,"Here we use the "),n(632,"code"),e(633,"get()"),t(),e(634," method on the "),n(635,"code"),e(636,"NestApplication"),t(),e(637," instance to retrieve the singleton instance of the "),n(638,"code"),e(639,"MyLogger"),t(),e(640,' object. This technique is essentially a way to "inject" an instance of a logger for use by Nest. The '),n(641,"code"),e(642,"app.get()"),t(),e(643," call retrieves the singleton instance of "),n(644,"code"),e(645,"MyLogger"),t(),e(646,", and depends on that instance being first injected in another module, as described above."),t(),n(647,"p"),e(648,"You can also inject this "),n(649,"code"),e(650,"MyLogger"),t(),e(651," provider in your feature classes, thus ensuring consistent logging behavior across both Nest system logging and application logging. See "),n(652,"a",20),e(653,"Using the logger for application logging"),t(),e(654," and "),n(655,"a",23),e(656,"Injecting a custom logger"),t(),e(657," below for more information."),t(),n(658,"h4",24)(659,"span"),e(660,"Injecting a custom logger"),t()(),n(661,"p"),e(662,"To start, extend the built-in logger with code like the following. We supply the "),n(663,"code"),e(664,"scope"),t(),e(665," option as configuration metadata for the "),n(666,"code"),e(667,"ConsoleLogger"),t(),e(668," class, specifying a "),n(669,"a",25),e(670,"transient"),t(),e(671," scope so that each feature module gets its own logger instance. This is important because each module sets a unique context on its logger via "),n(672,"code"),e(673,"setContext()"),t(),e(674," \u2014 with a singleton, that call would overwrite the context across the entire app. In this example, we do not extend the individual "),n(675,"code"),e(676,"ConsoleLogger"),t(),e(677," methods (like "),n(678,"code"),e(679,"log()"),t(),e(680,", "),n(681,"code"),e(682,"warn()"),t(),e(683,", etc.), though you may choose to do so."),t(),n(684,"app-copy-button")(685,"pre")(686,"code",8),e(687,`
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger extends ConsoleLogger {
  customLog() {
    this.log('Please feed the cat!');
  }
}
`),t()()(),n(688,"p"),e(689,"Next, create a "),n(690,"code"),e(691,"LoggerModule"),t(),e(692," with a construction like this:"),t(),n(693,"app-copy-button")(694,"pre")(695,"code",8),e(696,`
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
`),t()()(),n(697,"p"),e(698,"Next, import the "),n(699,"code"),e(700,"LoggerModule"),t(),e(701," into your feature module. Since we extended default "),n(702,"code"),e(703,"Logger"),t(),e(704," we have the convenience of using "),n(705,"code"),e(706,"setContext"),t(),e(707," method. So we can start using the context-aware custom logger, like this:"),t(),n(708,"app-copy-button")(709,"pre")(710,"code",8),e(711,`
import { Injectable } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  constructor(private myLogger: MyLogger) {
    // Due to transient scope, CatsService has its own unique instance of MyLogger,
    // so setting context here will not affect other instances in other services
    this.myLogger.setContext('CatsService');
  }

  findAll(): Cat[] {
    // You can call all the default methods
    this.myLogger.warn('About to return cats!');
    // And your custom methods
    this.myLogger.customLog();
    return this.cats;
  }
}
`),t()()(),n(712,"p"),e(713,"Finally, instruct Nest to use an instance of the custom logger in your "),n(714,"code"),e(715,"main.ts"),t(),e(716," file as shown below. Of course in this example, we haven't actually customized the logger behavior (by extending the "),n(717,"code"),e(718,"Logger"),t(),e(719," methods like "),n(720,"code"),e(721,"log()"),t(),e(722,", "),n(723,"code"),e(724,"warn()"),t(),e(725,", etc.), so this step isn't actually needed. But it "),n(726,"strong"),e(727,"would"),t(),e(728," be needed if you added custom logic to those methods and wanted Nest to use the same implementation."),t(),n(729,"app-copy-button")(730,"pre")(731,"code",8),e(732,`
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(new MyLogger());
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(733,"blockquote",9)(734,"strong"),e(735,"Hint"),t(),e(736," Alternatively, instead of setting "),n(737,"code"),e(738,"bufferLogs"),t(),e(739," to "),n(740,"code"),e(741,"true"),t(),e(742,", you could temporarily disable the logger with "),n(743,"code"),e(744,"logger: false"),t(),e(745," instruction. Be mindful that if you supply "),n(746,"code"),e(747,"logger: false"),t(),e(748," to "),n(749,"code"),e(750,"NestFactory.create"),t(),e(751,", nothing will be logged until you call "),n(752,"code"),e(753,"useLogger"),t(),e(754,", so you may miss some important initialization errors. If you don't mind that some of your initial messages will be logged with the default logger, you can just omit the "),n(755,"code"),e(756,"logger: false"),t(),e(757,` option.
`),t(),n(758,"h4",26)(759,"span"),e(760,"Use external logger"),t()(),n(761,"p"),e(762,"Production applications often have specific logging requirements, including advanced filtering, formatting and centralized logging. Nest's built-in logger is used for monitoring Nest system behavior, and can also be useful for basic formatted text logging in your feature modules while in development, but production applications often take advantage of dedicated logging modules like "),n(763,"a",27),e(764,"Winston"),t(),e(765,". As with any standard Node.js application, you can take full advantage of such modules in Nest."),t()())},dependencies:[g,E,O,C],encapsulation:2,changeDetection:0})}return a})();var K=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-mongo"]],features:[f],decls:852,vars:64,consts:[["contentReference",""],["app099868943315bd730b68fa6a7e14a1bc03af4723",""],["app56842e0d2fc1862f17f75928b0e13d9f1cea5e56",""],["app5b08f4b9c70f474449c18ccdccfcea3ff32175c5",""],["app277580fd5624352b1f36fb9082aa985044621580",""],["app775879234fcd46710245c5d603d3177833ef053b",""],["app00ec50bad67ee223672f09857d7b5df1428c1329",""],["app53d813b07c9dbc12c45ba17a3daa4aaa27903abf",""],["app14319b187ac8f967ab63467d0a7bd8505af060cd",""],["appb645ecfc7e71f0b8f293407000715a6a4281b149",""],["app1c8a8c8621499a5930a3266f00493e1027e3b80d",""],["appccf84e7f2a9fc7a0054c38d6f5bb0f5f459464e8",""],["appeac57f50c9cb5c86cf1afe2b6305484195ee7ad9",""],["app5056b82ca3d473e22f10a06c785b6ae2448b6d07",""],["app0510a3f284f8edc74e4a9d89c559cd27a1aad877",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/mongo.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","mongo"],["rel","nofollow","target","_blank","href","https://www.mongodb.com/"],["rel","nofollow","target","_blank","href","https://github.com/typeorm/typeorm"],["routerLink","/techniques/database"],["rel","nofollow","target","_blank","href","https://mongoosejs.com"],["rel","nofollow","target","_blank","href","https://github.com/Automattic/mongoose"],[1,"language-bash"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["rel","nofollow","target","_blank","href","https://mongoosejs.com/docs/connections.html"],["appAnchor","","id","model-injection"],["rel","nofollow","target","_blank","href","http://mongoosejs.com/docs/guide.html"],["rel","nofollow","target","_blank","href","https://mongoosejs.com/docs/models.html"],[1,"info"],["rel","nofollow","target","_blank","href","https://mongoosejs.com/docs/guide.html#options"],["rel","nofollow","target","_blank","href","https://mongoosejs.com/docs/schematypes.html"],["rel","nofollow","target","_blank","href","https://mongoosejs.com/docs/schematypes.html#schematype-options"],["rel","nofollow","target","_blank","href","https://mongoosejs.com/docs/populate.html#doc-not-found"],["appAnchor","","id","connection"],["rel","nofollow","target","_blank","href","https://mongoosejs.com/docs/api.html#Connection"],["appAnchor","","id","sessions"],["appAnchor","","id","multiple-databases"],[1,"warning"],["appAnchor","","id","hooks-middleware"],["rel","nofollow","target","_blank","href","https://mongoosejs.com/docs/middleware.html"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory"],["appAnchor","","id","plugins"],["rel","nofollow","target","_blank","href","https://mongoosejs.com/docs/plugins.html"],["appAnchor","","id","discriminators"],["rel","nofollow","target","_blank","href","https://mongoosejs.com/docs/discriminators.html"],["appAnchor","","id","testing"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/custom-providers#di-fundamentals"],["routerLink","/fundamentals/custom-providers"],["appAnchor","","id","async-configuration"],["appAnchor","","id","connection-events"],["rel","nofollow","target","_blank","href","https://mongoosejs.com/docs/connections.html#connection-events"],["appAnchor","","id","subdocuments"],["appAnchor","","id","virtuals"],[1,"language-ts"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/06-mongoose"]],template:function(c,p){if(c&1&&(n(0,"div",15,0)(2,"div",16)(3,"a",17),o(4,"i",18),t()(),n(5,"h3",19),e(6,"Mongo"),t(),n(7,"p"),e(8,"Nest supports two methods for integrating with the "),n(9,"a",20),e(10,"MongoDB"),t(),e(11," database. You can either use the built-in "),n(12,"a",21),e(13,"TypeORM"),t(),e(14," module described "),n(15,"a",22),e(16,"here"),t(),e(17,", which has a connector for MongoDB, or use "),n(18,"a",23),e(19,"Mongoose"),t(),e(20,", the most popular MongoDB object modeling tool. In this chapter we'll describe the latter, using the dedicated "),n(21,"code"),e(22,"@nestjs/mongoose"),t(),e(23," package."),t(),n(24,"p"),e(25,"Start by installing the "),n(26,"a",24),e(27,"required dependencies"),t(),e(28,":"),t(),n(29,"pre")(30,"code",25),e(31,`
$ npm i @nestjs/mongoose mongoose
`),t()(),n(32,"p"),e(33,"Once the installation process is complete, we can import the "),n(34,"code"),e(35,"MongooseModule"),t(),e(36," into the root "),n(37,"code"),e(38,"AppModule"),t(),e(39,"."),t(),n(40,"app-copy-button",26)(41,"span",27),e(42),s(43,"extension"),o(44,"app-tabs",null,1),t(),n(46,"pre")(47,"code",28),e(48,`
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/nest')],
})
export class AppModule {}
`),t()()(),n(49,"p"),e(50,"The "),n(51,"code"),e(52,"forRoot()"),t(),e(53," method accepts the same configuration object as "),n(54,"code"),e(55,"mongoose.connect()"),t(),e(56," from the Mongoose package, as described "),n(57,"a",29),e(58,"here"),t(),e(59,"."),t(),n(60,"h4",30)(61,"span"),e(62,"Model injection"),t()(),n(63,"p"),e(64,"With Mongoose, everything is derived from a "),n(65,"a",31),e(66,"Schema"),t(),e(67,". Each schema maps to a MongoDB collection and defines the shape of the documents within that collection. Schemas are used to define "),n(68,"a",32),e(69,"Models"),t(),e(70,". Models are responsible for creating and reading documents from the underlying MongoDB database."),t(),n(71,"p"),e(72,"Schemas can be created with NestJS decorators, or with Mongoose itself manually. Using decorators to create schemas greatly reduces boilerplate and improves overall code readability."),t(),n(73,"p"),e(74,"Let's define the "),n(75,"code"),e(76,"CatSchema"),t(),e(77,":"),t(),n(78,"app-copy-button",26)(79,"span",27),e(80),s(81,"extension"),o(82,"app-tabs",null,2),t(),n(84,"pre")(85,"code",28),e(86,`
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CatDocument = HydratedDocument<Cat>;

@Schema()
export class Cat {
  @Prop()
  name: string;

  @Prop()
  age: number;

  @Prop()
  breed: string;
}

export const CatSchema = SchemaFactory.createForClass(Cat);
`),t()()(),n(87,"blockquote",33)(88,"strong"),e(89,"Hint"),t(),e(90," Note you can also generate a raw schema definition using the "),n(91,"code"),e(92,"DefinitionsFactory"),t(),e(93," class (from the "),n(94,"code"),e(95,"nestjs/mongoose"),t(),e(96,`). This allows you to manually modify the schema definition generated based on the metadata you provided. This is useful for certain edge-cases where it may be hard to represent everything with decorators.
`),t(),n(97,"p"),e(98,"The "),n(99,"code"),e(100,"@Schema()"),t(),e(101," decorator marks a class as a schema definition. It maps our "),n(102,"code"),e(103,"Cat"),t(),e(104," class to a MongoDB collection of the same name, but with an additional \u201Cs\u201D at the end - so the final mongo collection name will be "),n(105,"code"),e(106,"cats"),t(),e(107,". This decorator accepts a single optional argument which is a schema options object. Think of it as the object you would normally pass as a second argument of the "),n(108,"code"),e(109,"mongoose.Schema"),t(),e(110," class' constructor (e.g., "),n(111,"code"),e(112,"new mongoose.Schema(_, options)"),t(),e(113,")). To learn more about available schema options, see "),n(114,"a",34),e(115,"this"),t(),e(116," chapter."),t(),n(117,"p"),e(118,"The "),n(119,"code"),e(120,"@Prop()"),t(),e(121," decorator defines a property in the document. For example, in the schema definition above, we defined three properties: "),n(122,"code"),e(123,"name"),t(),e(124,", "),n(125,"code"),e(126,"age"),t(),e(127,", and "),n(128,"code"),e(129,"breed"),t(),e(130,". The "),n(131,"a",35),e(132,"schema types"),t(),e(133," for these properties are automatically inferred thanks to TypeScript metadata (and reflection) capabilities. However, in more complex scenarios in which types cannot be implicitly reflected (for example, arrays or nested object structures), types must be indicated explicitly, as follows:"),t(),n(134,"app-copy-button")(135,"pre")(136,"code",28),e(137,`
@Prop([String])
tags: string[];
`),t()()(),n(138,"p"),e(139,"Alternatively, the "),n(140,"code"),e(141,"@Prop()"),t(),e(142," decorator accepts an options object argument ("),n(143,"a",36),e(144,"read more"),t(),e(145," about the available options). With this, you can indicate whether a property is required or not, specify a default value, or mark it as immutable. For example:"),t(),n(146,"app-copy-button")(147,"pre")(148,"code",28),e(149,`
@Prop({ required: true })
name: string;
`),t()()(),n(150,"p"),e(151,"In case you want to specify relation to another model, later for populating, you can use "),n(152,"code"),e(153,"@Prop()"),t(),e(154," decorator as well. For example, if "),n(155,"code"),e(156,"Cat"),t(),e(157," has "),n(158,"code"),e(159,"Owner"),t(),e(160," which is stored in a different collection called "),n(161,"code"),e(162,"owners"),t(),e(163,", the property should have type and ref. For example:"),t(),n(164,"app-copy-button")(165,"pre")(166,"code",28),e(167,`
import * as mongoose from 'mongoose';
import { Owner } from '../owners/schemas/owner.schema';

// inside the class definition
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })
owner: Owner;
`),t()()(),n(168,"p"),e(169,"In case there are multiple owners, your property configuration should look as follows:"),t(),n(170,"app-copy-button")(171,"pre")(172,"code",28),e(173,`
@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }] })
owners: Owner[];
`),t()()(),n(174,"p"),e(175,"If you don\u2019t intend to always populate a reference to another collection, consider using "),n(176,"code"),e(177,"mongoose.Types.ObjectId"),t(),e(178," as the type instead:"),t(),n(179,"app-copy-button")(180,"pre")(181,"code",28),e(182,`
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })
// This ensures the field is not confused with a populated reference
owner: mongoose.Types.ObjectId;
`),t()()(),n(183,"p"),e(184,"Then, when you need to selectively populate it later, you can use a repository function that specifies the correct type:"),t(),n(185,"app-copy-button")(186,"pre")(187,"code",28),e(188,`
import { Owner } from './schemas/owner.schema';

// e.g. inside a service or repository
async findAllPopulated() {
  return this.catModel.find().populate<{ owner: Owner }>("owner");
}
`),t()()(),n(189,"blockquote",33)(190,"strong"),e(191,"Hint"),t(),e(192," If there is no foreign document to populate, the type could be "),n(193,"code"),e(194,"Owner | null"),t(),e(195,", depending on your "),n(196,"a",37),e(197,"Mongoose configuration"),t(),e(198,". Alternatively, it might throw an error, in which case the type will be "),n(199,"code"),e(200,"Owner"),t(),e(201,`.
`),t(),n(202,"p"),e(203,"Finally, the "),n(204,"strong"),e(205,"raw"),t(),e(206," schema definition can also be passed to the decorator. This is useful when, for example, a property represents a nested object which is not defined as a class. For this, use the "),n(207,"code"),e(208,"raw()"),t(),e(209," function from the "),n(210,"code"),e(211,"@nestjs/mongoose"),t(),e(212," package, as follows:"),t(),n(213,"app-copy-button")(214,"pre")(215,"code",28),e(216,`
@Prop(raw({
  firstName: { type: String },
  lastName: { type: String }
}))
details: Record<string, any>;
`),t()()(),n(217,"p"),e(218,"Alternatively, if you prefer "),n(219,"strong"),e(220,"not using decorators"),t(),e(221,", you can define a schema manually. For example:"),t(),n(222,"app-copy-button")(223,"pre")(224,"code",28),e(225,`
export const CatSchema = new mongoose.Schema({
  name: String,
  age: Number,
  breed: String,
});
`),t()()(),n(226,"p"),e(227,"The "),n(228,"code"),e(229,"cat.schema"),t(),e(230," file resides in a folder in the "),n(231,"code"),e(232,"cats"),t(),e(233," directory, where we also define the "),n(234,"code"),e(235,"CatsModule"),t(),e(236,". While you can store schema files wherever you prefer, we recommend storing them near their related "),n(237,"strong"),e(238,"domain"),t(),e(239," objects, in the appropriate module directory."),t(),n(240,"p"),e(241,"Let's look at the "),n(242,"code"),e(243,"CatsModule"),t(),e(244,":"),t(),n(245,"app-copy-button",26)(246,"span",27),e(247),s(248,"extension"),o(249,"app-tabs",null,3),t(),n(251,"pre")(252,"code",28),e(253,`
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { Cat, CatSchema } from './schemas/cat.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }])],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
`),t()()(),n(254,"p"),e(255,"The "),n(256,"code"),e(257,"MongooseModule"),t(),e(258," provides the "),n(259,"code"),e(260,"forFeature()"),t(),e(261," method to configure the module, including defining which models should be registered in the current scope. If you also want to use the models in another module, add MongooseModule to the "),n(262,"code"),e(263,"exports"),t(),e(264," section of "),n(265,"code"),e(266,"CatsModule"),t(),e(267," and import "),n(268,"code"),e(269,"CatsModule"),t(),e(270," in the other module."),t(),n(271,"p"),e(272,"Once you've registered the schema, you can inject a "),n(273,"code"),e(274,"Cat"),t(),e(275," model into the "),n(276,"code"),e(277,"CatsService"),t(),e(278," using the "),n(279,"code"),e(280,"@InjectModel()"),t(),e(281," decorator:"),t(),n(282,"app-copy-button",26)(283,"span",27),e(284),s(285,"extension"),o(286,"app-tabs",null,4),t(),n(288,"pre")(289,"code",28),e(290,`
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cat } from './schemas/cat.schema';
import { CreateCatDto } from './dto/create-cat.dto';

@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name) private catModel: Model<Cat>) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll(): Promise<Cat[]> {
    return this.catModel.find().exec();
  }
}
`),t()(),n(291,"pre")(292,"code",28),e(293,`
import { Model } from 'mongoose';
import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Cat } from './schemas/cat.schema';

@Injectable()
@Dependencies(getModelToken(Cat.name))
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
`),t()()(),n(294,"h4",38)(295,"span"),e(296,"Connection"),t()(),n(297,"p"),e(298,"At times you may need to access the native "),n(299,"a",39),e(300,"Mongoose Connection"),t(),e(301," object. For example, you may want to make native API calls on the connection object. You can inject the Mongoose Connection by using the "),n(302,"code"),e(303,"@InjectConnection()"),t(),e(304," decorator as follows:"),t(),n(305,"app-copy-button")(306,"pre")(307,"code",28),e(308,`
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection() private connection: Connection) {}
}
`),t()()(),n(309,"h4",40)(310,"span"),e(311,"Sessions"),t()(),n(312,"p"),e(313,"To start a session with Mongoose, it's recommended to inject the database connection using "),n(314,"code"),e(315,"@InjectConnection"),t(),e(316," rather than calling "),n(317,"code"),e(318,"mongoose.startSession()"),t(),e(319," directly. This approach allows better integration with the NestJS dependency injection system, ensuring proper connection management."),t(),n(320,"p"),e(321,"Here's an example of how to start a session:"),t(),n(322,"app-copy-button")(323,"pre")(324,"code",28),e(325,`
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async startTransaction() {
    const session = await this.connection.startSession();
    session.startTransaction();
    // Your transaction logic here
  }
}
`),t()()(),n(326,"p"),e(327,"In this example, "),n(328,"code"),e(329,"@InjectConnection()"),t(),e(330," is used to inject the Mongoose connection into the service. Once the connection is injected, you can use "),n(331,"code"),e(332,"connection.startSession()"),t(),e(333," to begin a new session. This session can be used to manage database transactions, ensuring atomic operations across multiple queries. After starting the session, remember to commit or abort the transaction based on your logic."),t(),n(334,"h4",41)(335,"span"),e(336,"Multiple databases"),t()(),n(337,"p"),e(338,"Some projects require multiple database connections. This can also be achieved with this module. To work with multiple connections, first create the connections. In this case, connection naming becomes "),n(339,"strong"),e(340,"mandatory"),t(),e(341,"."),t(),n(342,"app-copy-button",26)(343,"span",27),e(344),s(345,"extension"),o(346,"app-tabs",null,5),t(),n(348,"pre")(349,"code",28),e(350,`
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test', {
      connectionName: 'cats',
    }),
    MongooseModule.forRoot('mongodb://localhost/users', {
      connectionName: 'users',
    }),
  ],
})
export class AppModule {}
`),t()()(),n(351,"blockquote",42)(352,"strong"),e(353,"Notice"),t(),e(354,` Please note that you shouldn't have multiple connections without a name, or with the same name, otherwise they will get overridden.
`),t(),n(355,"p"),e(356,"With this setup, you have to tell the "),n(357,"code"),e(358,"MongooseModule.forFeature()"),t(),e(359," function which connection should be used."),t(),n(360,"app-copy-button")(361,"pre")(362,"code",28),e(363,`
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }], 'cats'),
  ],
})
export class CatsModule {}
`),t()()(),n(364,"p"),e(365,"You can also inject the "),n(366,"code"),e(367,"Connection"),t(),e(368," for a given connection:"),t(),n(369,"app-copy-button")(370,"pre")(371,"code",28),e(372,`
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection('cats') private connection: Connection) {}
}
`),t()()(),n(373,"p"),e(374,"To inject a given "),n(375,"code"),e(376,"Connection"),t(),e(377," to a custom provider (for example, factory provider), use the "),n(378,"code"),e(379,"getConnectionToken()"),t(),e(380," function passing the name of the connection as an argument."),t(),n(381,"app-copy-button")(382,"pre")(383,"code",28),e(384,`
{
  provide: CatsService,
  useFactory: (catsConnection: Connection) => {
    return new CatsService(catsConnection);
  },
  inject: [getConnectionToken('cats')],
}
`),t()()(),n(385,"p"),e(386,"If you are just looking to inject the model from a named database, you can use the connection name as a second parameter to the "),n(387,"code"),e(388,"@InjectModel()"),t(),e(389," decorator."),t(),n(390,"app-copy-button",26)(391,"span",27),e(392),s(393,"extension"),o(394,"app-tabs",null,6),t(),n(396,"pre")(397,"code",28),e(398,`
@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name, 'cats') private catModel: Model<Cat>) {}
}
`),t()(),n(399,"pre")(400,"code",28),e(401,`
@Injectable()
@Dependencies(getModelToken(Cat.name, 'cats'))
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }
}
`),t()()(),n(402,"h4",43)(403,"span"),e(404,"Hooks (middleware)"),t()(),n(405,"p"),e(406,"Middleware (also called pre and post hooks) are functions which are passed control during execution of asynchronous functions. Middleware is specified on the schema level and is useful for writing plugins ("),n(407,"a",44),e(408,"source"),t(),e(409,"). Calling "),n(410,"code"),e(411,"pre()"),t(),e(412," or "),n(413,"code"),e(414,"post()"),t(),e(415," after compiling a model does not work in Mongoose. To register a hook "),n(416,"strong"),e(417,"before"),t(),e(418," model registration, use the "),n(419,"code"),e(420,"forFeatureAsync()"),t(),e(421," method of the "),n(422,"code"),e(423,"MongooseModule"),t(),e(424," along with a factory provider (i.e., "),n(425,"code"),e(426,"useFactory"),t(),e(427,"). With this technique, you can access a schema object, then use the "),n(428,"code"),e(429,"pre()"),t(),e(430," or "),n(431,"code"),e(432,"post()"),t(),e(433," method to register a hook on that schema. See example below:"),t(),n(434,"app-copy-button")(435,"pre")(436,"code",28),e(437,`
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        useFactory: () => {
          const schema = CatSchema;
          schema.pre('save', function () {
            console.log('Hello from pre save');
          });
          return schema;
        },
      },
    ]),
  ],
})
export class AppModule {}
`),t()()(),n(438,"p"),e(439,"Like other "),n(440,"a",45),e(441,"factory providers"),t(),e(442,", our factory function can be "),n(443,"code"),e(444,"async"),t(),e(445," and can inject dependencies through "),n(446,"code"),e(447,"inject"),t(),e(448,"."),t(),n(449,"app-copy-button")(450,"pre")(451,"code",28),e(452,`
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const schema = CatSchema;
          schema.pre('save', function() {
            console.log(
              \`\${configService.get('APP_NAME')}: Hello from pre save\`,
            );
          });
          return schema;
        },
        inject: [ConfigService],
      },
    ]),
  ],
})
export class AppModule {}
`),t()()(),n(453,"h4",46)(454,"span"),e(455,"Plugins"),t()(),n(456,"p"),e(457,"To register a "),n(458,"a",47),e(459,"plugin"),t(),e(460," for a given schema, use the "),n(461,"code"),e(462,"forFeatureAsync()"),t(),e(463," method."),t(),n(464,"app-copy-button")(465,"pre")(466,"code",28),e(467,`
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        useFactory: () => {
          const schema = CatSchema;
          schema.plugin(require('mongoose-autopopulate'));
          return schema;
        },
      },
    ]),
  ],
})
export class AppModule {}
`),t()()(),n(468,"p"),e(469,"To register a plugin for all schemas at once, call the "),n(470,"code"),e(471,".plugin()"),t(),e(472," method of the "),n(473,"code"),e(474,"Connection"),t(),e(475," object. You should access the connection before models are created; to do this, use the "),n(476,"code"),e(477,"connectionFactory"),t(),e(478,":"),t(),n(479,"app-copy-button",26)(480,"span",27),e(481),s(482,"extension"),o(483,"app-tabs",null,7),t(),n(485,"pre")(486,"code",28),e(487,`
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test', {
      connectionFactory: (connection) => {
        connection.plugin(require('mongoose-autopopulate'));
        return connection;
      }
    }),
  ],
})
export class AppModule {}
`),t()()(),n(488,"h4",48)(489,"span"),e(490,"Discriminators"),t()(),n(491,"p")(492,"a",49),e(493,"Discriminators"),t(),e(494," are a schema inheritance mechanism. They enable you to have multiple models with overlapping schemas on top of the same underlying MongoDB collection."),t(),n(495,"p"),e(496,"Suppose you wanted to track different types of events in a single collection. Every event will have a timestamp."),t(),n(497,"app-copy-button",26)(498,"span",27),e(499),s(500,"extension"),o(501,"app-tabs",null,8),t(),n(503,"pre")(504,"code",28),e(505,`
@Schema({ discriminatorKey: 'kind' })
export class Event {
  @Prop({
    type: String,
    required: true,
    enum: [ClickedLinkEvent.name, SignUpEvent.name],
  })
  kind: string;

  @Prop({ type: Date, required: true })
  time: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
`),t()()(),n(506,"blockquote",33)(507,"strong"),e(508,"Hint"),t(),e(509,' The way mongoose tells the difference between the different discriminator models is by the "discriminator key", which is '),n(510,"code"),e(511,"__t"),t(),e(512," by default. Mongoose adds a String path called "),n(513,"code"),e(514,"__t"),t(),e(515,` to your schemas that it uses to track which discriminator this document is an instance of.
You may also use the `),n(516,"code"),e(517,"discriminatorKey"),t(),e(518,` option to define the path for discrimination.
`),t(),n(519,"p")(520,"code"),e(521,"SignUpEvent"),t(),e(522," and "),n(523,"code"),e(524,"ClickedLinkEvent"),t(),e(525," instances will be stored in the same collection as generic events."),t(),n(526,"p"),e(527,"Now, let's define the "),n(528,"code"),e(529,"ClickedLinkEvent"),t(),e(530," class, as follows:"),t(),n(531,"app-copy-button",26)(532,"span",27),e(533),s(534,"extension"),o(535,"app-tabs",null,9),t(),n(537,"pre")(538,"code",28),e(539,`
@Schema()
export class ClickedLinkEvent {
  kind: string;
  time: Date;

  @Prop({ type: String, required: true })
  url: string;
}

export const ClickedLinkEventSchema = SchemaFactory.createForClass(ClickedLinkEvent);
`),t()()(),n(540,"p"),e(541,"And "),n(542,"code"),e(543,"SignUpEvent"),t(),e(544," class:"),t(),n(545,"app-copy-button",26)(546,"span",27),e(547),s(548,"extension"),o(549,"app-tabs",null,10),t(),n(551,"pre")(552,"code",28),e(553,`
@Schema()
export class SignUpEvent {
  kind: string;
  time: Date;

  @Prop({ type: String, required: true })
  user: string;
}

export const SignUpEventSchema = SchemaFactory.createForClass(SignUpEvent);
`),t()()(),n(554,"p"),e(555,"With this in place, use the "),n(556,"code"),e(557,"discriminators"),t(),e(558," option to register a discriminator for a given schema. It works on both "),n(559,"code"),e(560,"MongooseModule.forFeature"),t(),e(561," and "),n(562,"code"),e(563,"MongooseModule.forFeatureAsync"),t(),e(564,":"),t(),n(565,"app-copy-button",26)(566,"span",27),e(567),s(568,"extension"),o(569,"app-tabs",null,11),t(),n(571,"pre")(572,"code",28),e(573,`
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
        discriminators: [
          { name: ClickedLinkEvent.name, schema: ClickedLinkEventSchema },
          { name: SignUpEvent.name, schema: SignUpEventSchema },
        ],
      },
    ]),
  ]
})
export class EventsModule {}
`),t()()(),n(574,"h4",50)(575,"span"),e(576,"Testing"),t()(),n(577,"p"),e(578,"When unit testing an application, we usually want to avoid any database connection, making our test suites simpler to set up and faster to execute. But our classes might depend on models that are pulled from the connection instance. How do we resolve these classes? The solution is to create mock models."),t(),n(579,"p"),e(580,"To make this easier, the "),n(581,"code"),e(582,"@nestjs/mongoose"),t(),e(583," package exposes a "),n(584,"code"),e(585,"getModelToken()"),t(),e(586," function that returns a prepared "),n(587,"a",51),e(588,"injection token"),t(),e(589," based on a token name. Using this token, you can easily provide a mock implementation using any of the standard "),n(590,"a",52),e(591,"custom provider"),t(),e(592," techniques, including "),n(593,"code"),e(594,"useClass"),t(),e(595,", "),n(596,"code"),e(597,"useValue"),t(),e(598,", and "),n(599,"code"),e(600,"useFactory"),t(),e(601,". For example:"),t(),n(602,"app-copy-button")(603,"pre")(604,"code",28),e(605,`
@Module({
  providers: [
    CatsService,
    {
      provide: getModelToken(Cat.name),
      useValue: catModel,
    },
  ],
})
export class CatsModule {}
`),t()()(),n(606,"p"),e(607,"In this example, a hardcoded "),n(608,"code"),e(609,"catModel"),t(),e(610," (object instance) will be provided whenever any consumer injects a "),n(611,"code"),e(612,"Model<Cat>"),t(),e(613," using an "),n(614,"code"),e(615,"@InjectModel()"),t(),e(616," decorator."),t(),n(617,"p"),o(618,"app-banner-courses"),t(),n(619,"h4",53)(620,"span"),e(621,"Async configuration"),t()(),n(622,"p"),e(623,"When you need to pass module options asynchronously instead of statically, use the "),n(624,"code"),e(625,"forRootAsync()"),t(),e(626," method. As with most dynamic modules, Nest provides several techniques to deal with async configuration."),t(),n(627,"p"),e(628,"One technique is to use a factory function:"),t(),n(629,"app-copy-button")(630,"pre")(631,"code",28),e(632,`
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: 'mongodb://localhost/nest',
  }),
});
`),t()()(),n(633,"p"),e(634,"Like other "),n(635,"a",45),e(636,"factory providers"),t(),e(637,", our factory function can be "),n(638,"code"),e(639,"async"),t(),e(640," and can inject dependencies through "),n(641,"code"),e(642,"inject"),t(),e(643,"."),t(),n(644,"app-copy-button")(645,"pre")(646,"code",28),e(647,`
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGODB_URI'),
  }),
  inject: [ConfigService],
});
`),t()()(),n(648,"p"),e(649,"Alternatively, you can configure the "),n(650,"code"),e(651,"MongooseModule"),t(),e(652," using a class instead of a factory, as shown below:"),t(),n(653,"app-copy-button")(654,"pre")(655,"code",28),e(656,`
MongooseModule.forRootAsync({
  useClass: MongooseConfigService,
});
`),t()()(),n(657,"p"),e(658,"The construction above instantiates "),n(659,"code"),e(660,"MongooseConfigService"),t(),e(661," inside "),n(662,"code"),e(663,"MongooseModule"),t(),e(664,", using it to create the required options object. Note that in this example, the "),n(665,"code"),e(666,"MongooseConfigService"),t(),e(667," has to implement the "),n(668,"code"),e(669,"MongooseOptionsFactory"),t(),e(670," interface, as shown below. The "),n(671,"code"),e(672,"MongooseModule"),t(),e(673," will call the "),n(674,"code"),e(675,"createMongooseOptions()"),t(),e(676," method on the instantiated object of the supplied class."),t(),n(677,"app-copy-button")(678,"pre")(679,"code",28),e(680,`
@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: 'mongodb://localhost/nest',
    };
  }
}
`),t()()(),n(681,"p"),e(682,"If you want to reuse an existing options provider instead of creating a private copy inside the "),n(683,"code"),e(684,"MongooseModule"),t(),e(685,", use the "),n(686,"code"),e(687,"useExisting"),t(),e(688," syntax."),t(),n(689,"app-copy-button")(690,"pre")(691,"code",28),e(692,`
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
`),t()()(),n(693,"h4",54)(694,"span"),e(695,"Connection events"),t()(),n(696,"p"),e(697,"You can listen to Mongoose "),n(698,"a",55),e(699,"connection events"),t(),e(700," by using the "),n(701,"code"),e(702,"onConnectionCreate"),t(),e(703," configuration option. This allows you to implement custom logic whenever a connection is established. For instance, you can register event listeners for the "),n(704,"code"),e(705,"connected"),t(),e(706,", "),n(707,"code"),e(708,"open"),t(),e(709,", "),n(710,"code"),e(711,"disconnected"),t(),e(712,", "),n(713,"code"),e(714,"reconnected"),t(),e(715,", and "),n(716,"code"),e(717,"disconnecting"),t(),e(718," events, as demonstrated below:"),t(),n(719,"app-copy-button")(720,"pre")(721,"code",28),e(722,`
MongooseModule.forRoot('mongodb://localhost/test', {
  onConnectionCreate: (connection: Connection) => {
    connection.on('connected', () => console.log('connected'));
    connection.on('open', () => console.log('open'));
    connection.on('disconnected', () => console.log('disconnected'));
    connection.on('reconnected', () => console.log('reconnected'));
    connection.on('disconnecting', () => console.log('disconnecting'));

    return connection;
  },
}),
`),t()()(),n(723,"p"),e(724,"In this code snippet, we are establishing a connection to a MongoDB database at "),n(725,"code"),e(726,"mongodb://localhost/test"),t(),e(727,". The "),n(728,"code"),e(729,"onConnectionCreate"),t(),e(730," option enables you to set up specific event listeners for monitoring the connection's status:"),t(),n(731,"ul")(732,"li")(733,"code"),e(734,"connected"),t(),e(735,": Triggered when the connection is successfully established."),t(),n(736,"li")(737,"code"),e(738,"open"),t(),e(739,": Fires when the connection is fully opened and ready for operations."),t(),n(740,"li")(741,"code"),e(742,"disconnected"),t(),e(743,": Called when the connection is lost."),t(),n(744,"li")(745,"code"),e(746,"reconnected"),t(),e(747,": Invoked when the connection is re-established after being disconnected."),t(),n(748,"li")(749,"code"),e(750,"disconnecting"),t(),e(751,": Occurs when the connection is in the process of closing."),t()(),n(752,"p"),e(753,"You can also incorporate the "),n(754,"code"),e(755,"onConnectionCreate"),t(),e(756," property into async configurations created with "),n(757,"code"),e(758,"MongooseModule.forRootAsync()"),t(),e(759,":"),t(),n(760,"app-copy-button")(761,"pre")(762,"code",28),e(763,`
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: 'mongodb://localhost/test',
    onConnectionCreate: (connection: Connection) => {
      // Register event listeners here
      return connection;
    },
  }),
}),
`),t()()(),n(764,"p"),e(765,"This provides a flexible way to manage connection events, enabling you to handle changes in connection status effectively."),t(),n(766,"h4",56)(767,"span"),e(768,"Subdocuments"),t()(),n(769,"p"),e(770,"To nest subdocuments within a parent document, you can define your schemas as follows:"),t(),n(771,"app-copy-button",26)(772,"span",27),e(773),s(774,"extension"),o(775,"app-tabs",null,12),t(),n(777,"pre")(778,"code",28),e(779,`
@Schema()
export class Name {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;
}

export const NameSchema = SchemaFactory.createForClass(Name);
`),t()()(),n(780,"p"),e(781,"And then reference the subdocument in the parent schema:"),t(),n(782,"app-copy-button",26)(783,"span",27),e(784),s(785,"extension"),o(786,"app-tabs",null,13),t(),n(788,"pre")(789,"code",28),e(790,`
@Schema()
export class Person {
  @Prop(NameSchema)
  name: Name;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

export type PersonDocumentOverride = {
  name: Types.Subdocument<Types.ObjectId> & Name;
};

export type PersonDocument = HydratedDocument<Person, PersonDocumentOverride>;
`),t()()(),n(791,"p"),e(792,"If you want to include multiple subdocuments, you can use an array of subdocuments. It's important to override the type of the property accordingly:"),t(),n(793,"app-copy-button",26)(794,"span",27),e(795),s(796,"extension"),o(797,"app-tabs",null,14),t(),n(799,"pre")(800,"code",28),e(801,`
@Schema()
export class Person {
  @Prop([NameSchema])
  name: Name[];
}

export const PersonSchema = SchemaFactory.createForClass(Person);

export type PersonDocumentOverride = {
  name: Types.DocumentArray<Name>;
};

export type PersonDocument = HydratedDocument<Person, PersonDocumentOverride>;
`),t()()(),n(802,"h4",57)(803,"span"),e(804,"Virtuals"),t()(),n(805,"p"),e(806,"In Mongoose, a "),n(807,"strong"),e(808,"virtual"),t(),e(809," is a property that exists on a document but is not persisted to MongoDB. It is not stored in the database but is computed dynamically whenever it's accessed. Virtuals are typically used for derived or computed values, like combining fields (e.g., creating a "),n(810,"code"),e(811,"fullName"),t(),e(812," property by concatenating "),n(813,"code"),e(814,"firstName"),t(),e(815," and "),n(816,"code"),e(817,"lastName"),t(),e(818,"), or for creating properties that rely on existing data in the document."),t(),n(819,"app-copy-button")(820,"pre")(821,"code",58),e(822,`
class Person {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Virtual({
    get: function (this: Person) {
      return \`\${this.firstName} \${this.lastName}\`;
    },
  })
  fullName: string;
}
`),t()()(),n(823,"blockquote",33)(824,"strong"),e(825,"Hint"),t(),e(826," The "),n(827,"code"),e(828,"@Virtual()"),t(),e(829," decorator is imported from the "),n(830,"code"),e(831,"@nestjs/mongoose"),t(),e(832,` package.
`),t(),n(833,"p"),e(834,"In this example, the "),n(835,"code"),e(836,"fullName"),t(),e(837," virtual is derived from "),n(838,"code"),e(839,"firstName"),t(),e(840," and "),n(841,"code"),e(842,"lastName"),t(),e(843,". Even though it behaves like a normal property when accessed, it\u2019s never saved to the MongoDB document.:"),t(),n(844,"h4",59)(845,"span"),e(846,"Example"),t()(),n(847,"p"),e(848,"A working example is available "),n(849,"a",60),e(850,"here"),t(),e(851,"."),t()()),c&2){let b=r(45),v=r(83),T=r(250),k=r(287),M=r(347),A=r(395),q=r(484),F=r(502),P=r(536),N=r(550),D=r(570),R=r(776),_=r(787),L=r(798);i(42),l(" ",d(43,22,"app.module",b.isJsActive),`
`),i(38),l(" ",d(81,25,"schemas/cat.schema",v.isJsActive),`
`),i(167),l(" ",d(248,28,"cats.module",T.isJsActive),`
`),i(37),l(" ",d(285,31,"cats.service",k.isJsActive),`
`),i(4),u("hide",k.isJsActive),i(3),u("hide",!k.isJsActive),i(53),l(" ",d(345,34,"app.module",M.isJsActive),`
`),i(48),l(" ",d(393,37,"cats.service",A.isJsActive),`
`),i(4),u("hide",A.isJsActive),i(3),u("hide",!A.isJsActive),i(82),l(" ",d(482,40,"app.module",q.isJsActive),`
`),i(18),l(" ",d(500,43,"event.schema",F.isJsActive),`
`),i(34),l(" ",d(534,46,"click-link-event.schema",P.isJsActive),`
`),i(14),l(" ",d(548,49,"sign-up-event.schema",N.isJsActive),`
`),i(20),l(" ",d(568,52,"event.module",D.isJsActive),`
`),i(206),l(" ",d(774,55,"name.schema",R.isJsActive),`
`),i(11),l(" ",d(785,58,"person.schema",_.isJsActive),`
`),i(11),l(" ",d(796,61,"name.schema",L.isJsActive),`
`)}},dependencies:[C,E,y,g,O,w],encapsulation:2,changeDetection:0})}return a})();var X=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-mvc"]],features:[f],decls:231,vars:29,consts:[["contentReference",""],["app33e9144a6aa77bd2abd953da6b6bf9589f01157d",""],["appe81047d40ff0279c732803ae8ac8fda37d9cc4d6",""],["appa042f0cb569f5d698dc122a1bf62a29714002c3c",""],["app32bf4bf1c16caf081b419a193cbd808da9f6485c",""],["appadcc13fbb95961f0101bfa1706ac410d78f47760",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/mvc.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","model-view-controller"],["rel","nofollow","target","_blank","href","https://github.com/expressjs/express"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest-cli"],[1,"language-bash"],["rel","nofollow","target","_blank","href","https://expressjs.com/en/guide/using-template-engines.html"],["rel","nofollow","target","_blank","href","https://github.com/pillarjs/hbs#readme"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["appAnchor","","id","template-rendering"],[1,"language-html"],["appAnchor","","id","dynamic-template-rendering"],[1,"info"],["rel","nofollow","target","_blank","href","https://expressjs.com/en/api.html"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/15-mvc"],["appAnchor","","id","fastify"],["routerLink","/techniques/performance"],["rel","nofollow","target","_blank","href","https://github.com/fastify/fastify"],["appAnchor","","id","example-1"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/17-mvc-fastify"]],template:function(c,p){if(c&1&&(n(0,"div",6,0)(2,"div",7)(3,"a",8),o(4,"i",9),t()(),n(5,"h3",10),e(6,"Model-View-Controller"),t(),n(7,"p"),e(8,"Nest, by default, makes use of the "),n(9,"a",11),e(10,"Express"),t(),e(11," library under the hood. Hence, every technique for using the MVC (Model-View-Controller) pattern in Express applies to Nest as well."),t(),n(12,"p"),e(13,"First, let's scaffold a simple Nest application using the "),n(14,"a",12),e(15,"CLI"),t(),e(16," tool:"),t(),n(17,"pre")(18,"code",13),e(19,`
$ npm i -g @nestjs/cli
$ nest new project
`),t()(),n(20,"p"),e(21,"In order to create an MVC app, we also need a "),n(22,"a",14),e(23,"template engine"),t(),e(24," to render our HTML views:"),t(),n(25,"pre")(26,"code",13),e(27,`
$ npm install --save hbs
`),t()(),n(28,"p"),e(29,"We've used the "),n(30,"code"),e(31,"hbs"),t(),e(32," ("),n(33,"a",15),e(34,"Handlebars"),t(),e(35,") engine, though you can use whatever fits your requirements. Once the installation process is complete, we need to configure the express instance using the following code:"),t(),n(36,"app-copy-button",16)(37,"span",17),e(38),s(39,"extension"),o(40,"app-tabs",null,1),t(),n(42,"pre")(43,"code",18),e(44,`
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
`),t()(),n(45,"pre")(46,"code",18),e(47,`
import { NestFactory } from '@nestjs/core';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
`),t()()(),n(48,"p"),e(49,"We told "),n(50,"a",11),e(51,"Express"),t(),e(52," that the "),n(53,"code"),e(54,"public"),t(),e(55," directory will be used for storing static assets, "),n(56,"code"),e(57,"views"),t(),e(58," will contain templates, and the "),n(59,"code"),e(60,"hbs"),t(),e(61," template engine should be used to render HTML output."),t(),n(62,"h4",19)(63,"span"),e(64,"Template rendering"),t()(),n(65,"p"),e(66,"Now, let's create a "),n(67,"code"),e(68,"views"),t(),e(69," directory and "),n(70,"code"),e(71,"index.hbs"),t(),e(72," template inside it. In the template, we'll print a "),n(73,"code"),e(74,"message"),t(),e(75," passed from the controller:"),t(),n(76,"pre")(77,"code",20),e(78),t()(),n(79,"p"),e(80,"Next, open the "),n(81,"code"),e(82,"app.controller"),t(),e(83," file and replace the "),n(84,"code"),e(85,"root()"),t(),e(86," method with the following code:"),t(),n(87,"app-copy-button",16)(88,"span",17),e(89),s(90,"extension"),o(91,"app-tabs",null,2),t(),n(93,"pre")(94,"code",18),e(95,`
import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }
}
`),t()()(),n(96,"p"),e(97,"In this code, we are specifying the template to use in the "),n(98,"code"),e(99,"@Render()"),t(),e(100," decorator, and the return value of the route handler method is passed to the template for rendering. Notice that the return value is an object with a property "),n(101,"code"),e(102,"message"),t(),e(103,", matching the "),n(104,"code"),e(105,"message"),t(),e(106," placeholder we created in the template."),t(),n(107,"p"),e(108,"While the application is running, open your browser and navigate to "),n(109,"code"),e(110,"http://localhost:3000"),t(),e(111,". You should see the "),n(112,"code"),e(113,"Hello world!"),t(),e(114," message."),t(),n(115,"h4",21)(116,"span"),e(117,"Dynamic template rendering"),t()(),n(118,"p"),e(119,"If the application logic must dynamically decide which template to render, then we should use the "),n(120,"code"),e(121,"@Res()"),t(),e(122," decorator, and supply the view name in our route handler, rather than in the "),n(123,"code"),e(124,"@Render()"),t(),e(125," decorator:"),t(),n(126,"blockquote",22)(127,"strong"),e(128,"Hint"),t(),e(129," When Nest detects the "),n(130,"code"),e(131,"@Res()"),t(),e(132," decorator, it injects the library-specific "),n(133,"code"),e(134,"response"),t(),e(135," object. We can use this object to dynamically render the template. Learn more about the "),n(136,"code"),e(137,"response"),t(),e(138," object API "),n(139,"a",23),e(140,"here"),t(),e(141,`.
`),t(),n(142,"app-copy-button",16)(143,"span",17),e(144),s(145,"extension"),o(146,"app-tabs",null,3),t(),n(148,"pre")(149,"code",18),e(150,`
import { Get, Controller, Res, Render } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  root(@Res() res: Response) {
    return res.render(
      this.appService.getViewName(),
      { message: 'Hello world!' },
    );
  }
}
`),t()()(),n(151,"h4",24)(152,"span"),e(153,"Example"),t()(),n(154,"p"),e(155,"A working example is available "),n(156,"a",25),e(157,"here"),t(),e(158,"."),t(),n(159,"h4",26)(160,"span"),e(161,"Fastify"),t()(),n(162,"p"),e(163,"As mentioned in this "),n(164,"a",27),e(165,"chapter"),t(),e(166,", we are able to use any compatible HTTP provider together with Nest. One such library is "),n(167,"a",28),e(168,"Fastify"),t(),e(169,". In order to create an MVC application with Fastify, we have to install the following packages:"),t(),n(170,"pre")(171,"code",13),e(172,`
$ npm i --save @fastify/static @fastify/view handlebars
`),t()(),n(173,"p"),e(174,"The next steps cover almost the same process used with Express, with minor differences specific to the platform. Once the installation process is complete, open the "),n(175,"code"),e(176,"main.ts"),t(),e(177," file and update its contents:"),t(),n(178,"app-copy-button",16)(179,"span",17),e(180),s(181,"extension"),o(182,"app-tabs",null,4),t(),n(184,"pre")(185,"code",18),e(186,`
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
`),t()(),n(187,"pre")(188,"code",18),e(189,`
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
`),t()()(),n(190,"p"),e(191,"The Fastify API has a few differences, but the end result of these method calls is the same. One notable difference is that when using Fastify, the template name you pass into the "),n(192,"code"),e(193,"@Render()"),t(),e(194," decorator must include the file extension."),t(),n(195,"p"),e(196,"Here\u2019s how you can set it up:"),t(),n(197,"app-copy-button",16)(198,"span",17),e(199),s(200,"extension"),o(201,"app-tabs",null,5),t(),n(203,"pre")(204,"code",18),e(205,`
import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index.hbs')
  root() {
    return { message: 'Hello world!' };
  }
}
`),t()()(),n(206,"p"),e(207,"Alternatively, you can use the "),n(208,"code"),e(209,"@Res()"),t(),e(210," decorator to directly inject the response and specify the view you want to render, as shown below:"),t(),n(211,"app-copy-button")(212,"pre")(213,"code",18),e(214,`
import { Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Get()
root(@Res() res: FastifyReply) {
  return res.view('index.hbs', { title: 'Hello world!' });
}
`),t()()(),n(215,"p"),e(216,"While the application is running, open your browser and navigate to "),n(217,"code"),e(218,"http://localhost:3000"),t(),e(219,". You should see the "),n(220,"code"),e(221,"Hello world!"),t(),e(222," message."),t(),n(223,"h4",29)(224,"span"),e(225,"Example"),t()(),n(226,"p"),e(227,"A working example is available "),n(228,"a",30),e(229,"here"),t(),e(230,"."),t()()),c&2){let b=r(41),v=r(92),T=r(147),k=r(183),M=r(202);i(38),l(" ",d(39,14,"main",b.isJsActive),`
`),i(4),u("hide",b.isJsActive),i(3),u("hide",!b.isJsActive),i(33),l(`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>App</title>
  </head>
  <body>
    `,"{{ message }}",`
  </body>
</html>
`),i(11),l(" ",d(90,17,"app.controller",v.isJsActive),`
`),i(55),l(" ",d(145,20,"app.controller",T.isJsActive),`
`),i(36),l(" ",d(181,23,"main",k.isJsActive),`
`),i(4),u("hide",k.isJsActive),i(3),u("hide",!k.isJsActive),i(12),l(" ",d(200,26,"app.controller",M.isJsActive),`
`)}},dependencies:[E,y,g,C,w],encapsulation:2,changeDetection:0})}return a})();var Z=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-performance"]],features:[f],decls:191,vars:12,consts:[["contentReference",""],["app24ce560bd0f919e66840a7db69efc16b79e5420d",""],["app76a678786d6f1e2c45e9776e02c4de0ce9ad5604",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/performance.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","performance-fastify"],["rel","nofollow","target","_blank","href","https://expressjs.com/"],["rel","nofollow","target","_blank","href","https://github.com/fastify/fastify"],[1,"info"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","adapter"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["rel","nofollow","target","_blank","href","https://fastify.dev/docs/latest/Guides/Getting-Started/#your-first-server"],["appAnchor","","id","platform-specific-packages"],["appAnchor","","id","redirect-response"],["appAnchor","","id","fastify-options"],["appAnchor","","id","middleware"],["rel","nofollow","target","_blank","href","https://fastify.dev/docs/latest/Reference/Middleware/"],["appAnchor","","id","route-config"],["rel","nofollow","target","_blank","href","https://fastify.dev/docs/latest/Reference/Routes/#config"],["appAnchor","","id","route-constraints"],["rel","nofollow","target","_blank","href","https://fastify.dev/docs/latest/Reference/Routes/#constraints"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/10-fastify"]],template:function(c,p){if(c&1&&(n(0,"div",3,0)(2,"div",4)(3,"a",5),o(4,"i",6),t()(),n(5,"h3",7),e(6,"Performance (Fastify)"),t(),n(7,"p"),e(8,"By default, Nest makes use of the "),n(9,"a",8),e(10,"Express"),t(),e(11," framework. As mentioned earlier, Nest also provides compatibility with other libraries such as, for example, "),n(12,"a",9),e(13,"Fastify"),t(),e(14,". Nest achieves this framework independence by implementing a framework adapter whose primary function is to proxy middleware and handlers to appropriate library-specific implementations."),t(),n(15,"blockquote",10)(16,"strong"),e(17,"Hint"),t(),e(18,` Note that in order for a framework adapter to be implemented, the target library has to provide similar request/response pipeline processing as found in Express.
`),t(),n(19,"p")(20,"a",9),e(21,"Fastify"),t(),e(22," provides a good alternative framework for Nest because it solves design issues in a similar manner to Express. However, fastify is much "),n(23,"strong"),e(24,"faster"),t(),e(25," than Express, achieving almost two times better benchmarks results. A fair question is why does Nest use Express as the default HTTP provider? The reason is that Express is widely-used, well-known, and has an enormous set of compatible middleware, which is available to Nest users out-of-the-box."),t(),n(26,"p"),e(27,"But since Nest provides framework-independence, you can easily migrate between them. Fastify can be a better choice when you place high value on very fast performance. To utilize Fastify, simply choose the built-in "),n(28,"code"),e(29,"FastifyAdapter"),t(),e(30," as shown in this chapter."),t(),n(31,"h4",11)(32,"span"),e(33,"Installation"),t()(),n(34,"p"),e(35,"First, we need to install the required package:"),t(),n(36,"pre")(37,"code",12),e(38,`
$ npm i --save @nestjs/platform-fastify
`),t()(),n(39,"h4",13)(40,"span"),e(41,"Adapter"),t()(),n(42,"p"),e(43,"Once the Fastify platform is installed, we can use the "),n(44,"code"),e(45,"FastifyAdapter"),t(),e(46,"."),t(),n(47,"app-copy-button",14)(48,"span",15),e(49),s(50,"extension"),o(51,"app-tabs",null,1),t(),n(53,"pre")(54,"code",16),e(55,`
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
`),t()()(),n(56,"p"),e(57,"By default, Fastify listens only on the "),n(58,"code"),e(59,"localhost 127.0.0.1"),t(),e(60," interface ("),n(61,"a",17),e(62,"read more"),t(),e(63,"). If you want to accept connections on other hosts, you should specify "),n(64,"code"),e(65,"'0.0.0.0'"),t(),e(66," in the "),n(67,"code"),e(68,"listen()"),t(),e(69," call:"),t(),n(70,"app-copy-button")(71,"pre")(72,"code",16),e(73,`
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.listen(3000, '0.0.0.0');
}
`),t()()(),n(74,"h4",18)(75,"span"),e(76,"Platform specific packages"),t()(),n(77,"p"),e(78,"Keep in mind that when you use the "),n(79,"code"),e(80,"FastifyAdapter"),t(),e(81,", Nest uses Fastify as the "),n(82,"strong"),e(83,"HTTP provider"),t(),e(84,". This means that each recipe that relies on Express may no longer work. You should, instead, use Fastify equivalent packages."),t(),n(85,"h4",19)(86,"span"),e(87,"Redirect response"),t()(),n(88,"p"),e(89,"Fastify handles redirect responses slightly differently than Express. To do a proper redirect with Fastify, return both the status code and the URL, as follows:"),t(),n(90,"app-copy-button")(91,"pre")(92,"code",16),e(93,`
@Get()
index(@Res() res) {
  res.status(302).redirect('/login');
}
`),t()()(),n(94,"h4",20)(95,"span"),e(96,"Fastify options"),t()(),n(97,"p"),e(98,"You can pass options into the Fastify constructor through the "),n(99,"code"),e(100,"FastifyAdapter"),t(),e(101," constructor. For example:"),t(),n(102,"app-copy-button")(103,"pre")(104,"code",16),e(105,`
new FastifyAdapter({ logger: true });
`),t()()(),n(106,"h4",21)(107,"span"),e(108,"Middleware"),t()(),n(109,"p"),e(110,"Middleware functions retrieve the raw "),n(111,"code"),e(112,"req"),t(),e(113," and "),n(114,"code"),e(115,"res"),t(),e(116," objects instead of Fastify's wrappers. This is how the "),n(117,"code"),e(118,"middie"),t(),e(119," package works (that's used under the hood) and "),n(120,"code"),e(121,"fastify"),t(),e(122," - check out this "),n(123,"a",22),e(124,"page"),t(),e(125," for more information,"),t(),n(126,"app-copy-button",14)(127,"span",15),e(128),s(129,"extension"),o(130,"app-tabs",null,2),t(),n(132,"pre")(133,"code",16),e(134,`
import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    console.log('Request...');
    next();
  }
}
`),t()(),n(135,"pre")(136,"code",16),e(137,`
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware {
  use(req, res, next) {
    console.log('Request...');
    next();
  }
}
`),t()()(),n(138,"h4",23)(139,"span"),e(140,"Route Config"),t()(),n(141,"p"),e(142,"You can use the "),n(143,"a",24),e(144,"route config"),t(),e(145," feature of Fastify with the "),n(146,"code"),e(147,"@RouteConfig()"),t(),e(148," decorator."),t(),n(149,"app-copy-button")(150,"pre")(151,"code",16),e(152,`
@RouteConfig({ output: 'hello world' })
@Get()
index(@Req() req) {
  return req.routeConfig.output;
}
`),t()()(),n(153,"h4",25)(154,"span"),e(155,"Route Constraints"),t()(),n(156,"p"),e(157,"As of v10.3.0, "),n(158,"code"),e(159,"@nestjs/platform-fastify"),t(),e(160," supports "),n(161,"a",26),e(162,"route constraints"),t(),e(163," feature of Fastify with "),n(164,"code"),e(165,"@RouteConstraints"),t(),e(166," decorator."),t(),n(167,"app-copy-button")(168,"pre")(169,"code",16),e(170,`
@RouteConstraints({ version: '1.2.x' })
newFeature() {
  return 'This works only for version >= 1.2.x';
}
`),t()()(),n(171,"blockquote",10)(172,"strong"),e(173,"Hint"),t(),n(174,"code"),e(175,"@RouteConfig()"),t(),e(176," and "),n(177,"code"),e(178,"@RouteConstraints"),t(),e(179," are imported from "),n(180,"code"),e(181,"@nestjs/platform-fastify"),t(),e(182,`.
`),t(),n(183,"h4",27)(184,"span"),e(185,"Example"),t()(),n(186,"p"),e(187,"A working example is available "),n(188,"a",28),e(189,"here"),t(),e(190,"."),t()()),c&2){let b=r(52),v=r(131);i(49),l(" ",d(50,6,"main",b.isJsActive),`
`),i(79),l(" ",d(129,9,"logger.middleware",v.isJsActive),`
`),i(4),u("hide",v.isJsActive),i(3),u("hide",!v.isJsActive)}},dependencies:[g,E,y,w],encapsulation:2,changeDetection:0})}return a})();var ee=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-queues"]],features:[f],decls:1666,vars:22,consts:[["contentReference",""],["app0629715eed0ce67cce31f0bcb6110e1ed3dc4e89",""],["appfb718a574545790d61c6723c864b20ac400395ce",""],["app0a60f19a004d4a9da8f695c706bc23c4c62b12a0",""],["appc867081ae6d9e639f7014b39adf95b3ac2082837",""],["app0e16dc839272042913cd92d6003e72ced79bee10",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/queues.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","queues"],["rel","nofollow","target","_blank","href","https://redis.io/"],["href","techniques/queues#producers"],["href","techniques/queues#consumers"],["href","techniques/queues#event-listeners"],["rel","nofollow","target","_blank","href","https://docs.bullmq.io/"],["rel","nofollow","target","_blank","href","https://github.com/OptimalBits/bull/blob/master/REFERENCE.md"],["appAnchor","","id","bullmq-installation"],[1,"language-bash"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["rel","nofollow","target","_blank","href","https://docs.bullmq.io/guide/connections"],["rel","nofollow","target","_blank","href","https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd"],["rel","nofollow","target","_blank","href","https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/techniques/queues#manual-registration"],["rel","nofollow","target","_blank","href","https://api.docs.bullmq.io/interfaces/v4.QueueOptions.html"],[1,"info"],["rel","nofollow","target","_blank","href","https://docs.bullmq.io/guide/flows"],["appAnchor","","id","named-configurations"],["appAnchor","","id","producers"],["routerLink","/providers"],["appAnchor","","id","job-options"],["rel","nofollow","target","_blank","href","https://api.docs.bullmq.io/types/v4.JobsOptions.html"],["rel","nofollow","target","_blank","href","https://api.docs.bullmq.io/interfaces/v4.BaseJobOptions.html"],["appAnchor","","id","consumers"],["rel","nofollow","target","_blank","href","https://api.docs.bullmq.io/classes/v4.Job.html"],[1,"warning"],["rel","nofollow","target","_blank","href","https://docs.bullmq.io/patterns/named-processor"],["appAnchor","","id","request-scoped-consumers"],["href","/fundamentals/injection-scopes#provider-scope"],["appAnchor","","id","event-listeners"],["rel","nofollow","target","_blank","href","https://api.docs.bullmq.io/interfaces/v4.WorkerListener.html"],["rel","nofollow","target","_blank","href","https://api.docs.bullmq.io/interfaces/v4.QueueEventsListener.html"],["appAnchor","","id","queue-management"],["rel","nofollow","target","_blank","href","https://api.docs.bullmq.io/classes/v4.Queue.html"],["appAnchor","","id","separate-processes"],["rel","nofollow","target","_blank","href","https://docs.bullmq.io/guide/workers/sandboxed-processors"],["appAnchor","","id","async-configuration"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/async-providers"],["appAnchor","","id","manual-registration"],["appAnchor","","id","bull-installation"],["rel","nofollow","target","_blank","href","https://github.com/taskforcesh/bullmq/issues/1034"],["appAnchor","","id","named-configurations-1"],["appAnchor","","id","producers-1"],["appAnchor","","id","named-jobs"],[1,"Warning"],["appAnchor","","id","job-options-1"],["appAnchor","","id","consumers-1"],["rel","nofollow","target","_blank","href","https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#job"],["appAnchor","","id","request-scoped-consumers-1"],["appAnchor","","id","event-listeners-1"],["rel","nofollow","target","_blank","href","https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#events"],["appAnchor","","id","queue-management-1"],["appAnchor","","id","separate-processes-1"],["rel","nofollow","target","_blank","href","https://github.com/OptimalBits/bull#separate-processes"],[1,"language-ts"],["appAnchor","","id","async-configuration-1"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/26-queues"]],template:function(c,p){if(c&1&&(n(0,"div",6,0)(2,"div",7)(3,"a",8),o(4,"i",9),t()(),n(5,"h3",10),e(6,"Queues"),t(),n(7,"p"),e(8,"Queues are a powerful design pattern that help you deal with common application scaling and performance challenges. Some examples of problems that Queues can help you solve are:"),t(),n(9,"ul")(10,"li"),e(11,"Smooth out processing peaks. For example, if users can initiate resource-intensive tasks at arbitrary times, you can add these tasks to a queue instead of performing them synchronously. Then you can have worker processes pull tasks from the queue in a controlled manner. You can easily add new Queue consumers to scale up the back-end task handling as the application scales up."),t(),n(12,"li"),e(13,"Break up monolithic tasks that may otherwise block the Node.js event loop. For example, if a user request requires CPU intensive work like audio transcoding, you can delegate this task to other processes, freeing up user-facing processes to remain responsive."),t(),n(14,"li"),e(15,"Provide a reliable communication channel across various services. For example, you can queue tasks (jobs) in one process or service, and consume them in another. You can be notified (by listening for status events) upon completion, error or other state changes in the job life cycle from any process or service. When Queue producers or consumers fail, their state is preserved and task handling can restart automatically when nodes are restarted."),t()(),n(16,"p"),e(17,"Nest provides the "),n(18,"code"),e(19,"@nestjs/bullmq"),t(),e(20," package for BullMQ integration and "),n(21,"code"),e(22,"@nestjs/bull"),t(),e(23," package for Bull integration. Both packages are abstractions/wrappers on top of their respective libraries, which were developed by the same team. Bull is currently in maintenance mode, with the team focusing on fixing bugs, while BullMQ is actively developed, featuring a modern TypeScript implementation and a different set of features. If Bull meets your requirements, it remains a reliable and battle-tested choice. The Nest packages make it easy to integrate both, BullMQ or Bull Queues, into your Nest application in a friendly way."),t(),n(24,"p"),e(25,"Both BullMQ and Bull use "),n(26,"a",11),e(27,"Redis"),t(),e(28," to persist job data, so you'll need to have Redis installed on your system. Because they are Redis-backed, your Queue architecture can be completely distributed and platform-independent. For example, you can have some Queue "),n(29,"a",12),e(30,"producers"),t(),e(31," and "),n(32,"a",13),e(33,"consumers"),t(),e(34," and "),n(35,"a",14),e(36,"listeners"),t(),e(37," running in Nest on one (or several) nodes, and other producers, consumers and listeners running on other Node.js platforms on other network nodes."),t(),n(38,"p"),e(39,"This chapter covers the "),n(40,"code"),e(41,"@nestjs/bullmq"),t(),e(42," and "),n(43,"code"),e(44,"@nestjs/bull"),t(),e(45," packages. We also recommend reading the "),n(46,"a",15),e(47,"BullMQ"),t(),e(48," and "),n(49,"a",16),e(50,"Bull"),t(),e(51," documentation for more background and specific implementation details."),t(),n(52,"h4",17)(53,"span"),e(54,"BullMQ installation"),t()(),n(55,"p"),e(56,"To begin using BullMQ, we first install the required dependencies."),t(),n(57,"pre")(58,"code",18),e(59,`
$ npm install --save @nestjs/bullmq bullmq
`),t()(),n(60,"p"),e(61,"Once the installation process is complete, we can import the "),n(62,"code"),e(63,"BullModule"),t(),e(64," into the root "),n(65,"code"),e(66,"AppModule"),t(),e(67,"."),t(),n(68,"app-copy-button",19)(69,"span",20),e(70),s(71,"extension"),o(72,"app-tabs",null,1),t(),n(74,"pre")(75,"code",21),e(76,`
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
`),t()()(),n(77,"p"),e(78,"The "),n(79,"code"),e(80,"forRoot()"),t(),e(81," method is used to register a "),n(82,"code"),e(83,"bullmq"),t(),e(84," package configuration object that will be used by all queues registered in the application (unless specified otherwise). For your reference, the following are a few of the properties within a configuration object:"),t(),n(85,"ul")(86,"li")(87,"code"),e(88,"connection: ConnectionOptions"),t(),e(89," - Options to configure the Redis connection. See "),n(90,"a",22),e(91,"Connections"),t(),e(92," for more information. Optional."),t(),n(93,"li")(94,"code"),e(95,"prefix: string"),t(),e(96," - Prefix for all queue keys. Optional."),t(),n(97,"li")(98,"code"),e(99,"defaultJobOptions: JobOpts"),t(),e(100," - Options to control the default settings for new jobs. See "),n(101,"a",23),e(102,"JobOpts"),t(),e(103," for more information. Optional."),t(),n(104,"li")(105,"code"),e(106,"settings: AdvancedSettings"),t(),e(107," - Advanced Queue configuration settings. These should usually not be changed. See "),n(108,"a",24),e(109,"AdvancedSettings"),t(),e(110," for more information. Optional."),t(),n(111,"li")(112,"code"),e(113,"extraOptions"),t(),e(114," - Extra options for module init. See "),n(115,"a",25),e(116,"Manual Registration"),t()()(),n(117,"p"),e(118,"All the options are optional, providing detailed control over queue behavior. These are passed directly to the BullMQ "),n(119,"code"),e(120,"Queue"),t(),e(121," constructor. Read more about these options and other options "),n(122,"a",26),e(123,"here"),t(),e(124,"."),t(),n(125,"p"),e(126,"To register a queue, import the "),n(127,"code"),e(128,"BullModule.registerQueue()"),t(),e(129," dynamic module, as follows:"),t(),n(130,"app-copy-button")(131,"pre")(132,"code",21),e(133,`
BullModule.registerQueue({
  name: 'audio',
});
`),t()()(),n(134,"blockquote",27)(135,"strong"),e(136,"Hint"),t(),e(137," Create multiple queues by passing multiple comma-separated configuration objects to the "),n(138,"code"),e(139,"registerQueue()"),t(),e(140,` method.
`),t(),n(141,"p"),e(142,"The "),n(143,"code"),e(144,"registerQueue()"),t(),e(145," method is used to instantiate and/or register queues. Queues are shared across modules and processes that connect to the same underlying Redis database with the same credentials. Each queue is unique by its name property. A queue name is used as both an injection token (for injecting the queue into controllers/providers), and as an argument to decorators to associate consumer classes and listeners with queues."),t(),n(146,"p"),e(147,"You can also override some of the pre-configured options for a specific queue, as follows:"),t(),n(148,"app-copy-button")(149,"pre")(150,"code",21),e(151,`
BullModule.registerQueue({
  name: 'audio',
  connection: {
    port: 6380,
  },
});
`),t()()(),n(152,"p"),e(153,"BullMQ also supports parent - child relationships between jobs. This functionality enables the creation of flows where jobs are the node of trees of arbitrary depth. To read more about them check "),n(154,"a",28),e(155,"here"),t(),e(156,"."),t(),n(157,"p"),e(158,"To add a flow, you can do the following:"),t(),n(159,"app-copy-button")(160,"pre")(161,"code",21),e(162,`
BullModule.registerFlowProducer({
  name: 'flowProducerName',
});
`),t()()(),n(163,"p"),e(164,"Since jobs are persisted in Redis, each time a specific named queue is instantiated (e.g., when an app is started/restarted), it attempts to process any old jobs that may exist from a previous unfinished session."),t(),n(165,"p"),e(166,"Each queue can have one or many producers, consumers, and listeners. Consumers retrieve jobs from the queue in a specific order: FIFO (the default), LIFO, or according to priorities. Controlling queue processing order is discussed "),n(167,"a",13),e(168,"here"),t(),e(169,"."),t(),n(170,"p"),o(171,"app-banner-enterprise"),t(),n(172,"h4",29)(173,"span"),e(174,"Named configurations"),t()(),n(175,"p"),e(176,"If your queues connect to multiple different Redis instances, you can use a technique called "),n(177,"strong"),e(178,"named configurations"),t(),e(179,". This feature allows you to register several configurations under specified keys, which then you can refer to in the queue options."),t(),n(180,"p"),e(181,"For example, assuming that you have an additional Redis instance (apart from the default one) used by a few queues registered in your application, you can register its configuration as follows:"),t(),n(182,"app-copy-button")(183,"pre")(184,"code",21),e(185,`
BullModule.forRoot('alternative-config', {
  connection: {
    port: 6381,
  },
});
`),t()()(),n(186,"p"),e(187,"In the example above, "),n(188,"code"),e(189,"'alternative-config'"),t(),e(190," is just a configuration key (it can be any arbitrary string)."),t(),n(191,"p"),e(192,"With this in place, you can now point to this configuration in the "),n(193,"code"),e(194,"registerQueue()"),t(),e(195," options object:"),t(),n(196,"app-copy-button")(197,"pre")(198,"code",21),e(199,`
BullModule.registerQueue({
  configKey: 'alternative-config',
  name: 'video',
});
`),t()()(),n(200,"h4",30)(201,"span"),e(202,"Producers"),t()(),n(203,"p"),e(204,"Job producers add jobs to queues. Producers are typically application services (Nest "),n(205,"a",31),e(206,"providers"),t(),e(207,"). To add jobs to a queue, first inject the queue into the service as follows:"),t(),n(208,"app-copy-button")(209,"pre")(210,"code",21),e(211,`
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}
}
`),t()()(),n(212,"blockquote",27)(213,"strong"),e(214,"Hint"),t(),e(215," The "),n(216,"code"),e(217,"@InjectQueue()"),t(),e(218," decorator identifies the queue by its name, as provided in the "),n(219,"code"),e(220,"registerQueue()"),t(),e(221," method call (e.g., "),n(222,"code"),e(223,"'audio'"),t(),e(224,`).
`),t(),n(225,"p"),e(226,"Now, add a job by calling the queue's "),n(227,"code"),e(228,"add()"),t(),e(229," method, passing a user-defined job object. Jobs are represented as serializable JavaScript objects (since that is how they are stored in the Redis database). The shape of the job you pass is arbitrary; use it to represent the semantics of your job object. You also need to give it a name. This allows you to create specialized "),n(230,"a",13),e(231,"consumers"),t(),e(232," that will only process jobs with a given name."),t(),n(233,"app-copy-button")(234,"pre")(235,"code",21),e(236,`
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
`),t()()(),n(237,"h4",32)(238,"span"),e(239,"Job options"),t()(),n(240,"p"),e(241,"Jobs can have additional options associated with them. Pass an options object after the "),n(242,"code"),e(243,"job"),t(),e(244," argument in the "),n(245,"code"),e(246,"Queue.add()"),t(),e(247," method. Some of the job options properties are:"),t(),n(248,"ul")(249,"li")(250,"code"),e(251,"priority"),t(),e(252,": "),n(253,"code"),e(254,"number"),t(),e(255," - Optional priority value. Ranges from 1 (highest priority) to MAX_INT (lowest priority). Note that using priorities has a slight impact on performance, so use them with caution."),t(),n(256,"li")(257,"code"),e(258,"delay"),t(),e(259,": "),n(260,"code"),e(261,"number"),t(),e(262," - An amount of time (milliseconds) to wait until this job can be processed. Note that for accurate delays, both server and clients should have their clocks synchronized."),t(),n(263,"li")(264,"code"),e(265,"attempts"),t(),e(266,": "),n(267,"code"),e(268,"number"),t(),e(269," - The total number of attempts to try the job until it completes."),t(),n(270,"li")(271,"code"),e(272,"repeat"),t(),e(273,": "),n(274,"code"),e(275,"RepeatOpts"),t(),e(276," - Repeat job according to a cron specification. See "),n(277,"a",23),e(278,"RepeatOpts"),t(),e(279,"."),t(),n(280,"li")(281,"code"),e(282,"backoff"),t(),e(283,": "),n(284,"code"),e(285,"number | BackoffOpts"),t(),e(286," - Backoff setting for automatic retries if the job fails. See "),n(287,"a",23),e(288,"BackoffOpts"),t(),e(289,"."),t(),n(290,"li")(291,"code"),e(292,"lifo"),t(),e(293,": "),n(294,"code"),e(295,"boolean"),t(),e(296," - If true, adds the job to the right end of the queue instead of the left (default false)."),t(),n(297,"li")(298,"code"),e(299,"jobId"),t(),e(300,": "),n(301,"code"),e(302,"number"),t(),e(303," | "),n(304,"code"),e(305,"string"),t(),e(306,` - Override the job ID - by default, the job ID is a unique
integer, but you can use this setting to override it. If you use this option, it is up to you to ensure the jobId is unique. If you attempt to add a job with an id that already exists, it will not be added.`),t(),n(307,"li")(308,"code"),e(309,"removeOnComplete"),t(),e(310,": "),n(311,"code"),e(312,"boolean | number"),t(),e(313," - If true, removes the job when it successfully completes. A number specifies the amount of jobs to keep. Default behavior is to keep the job in the completed set."),t(),n(314,"li")(315,"code"),e(316,"removeOnFail"),t(),e(317,": "),n(318,"code"),e(319,"boolean | number"),t(),e(320," - If true, removes the job when it fails after all attempts. A number specifies the amount of jobs to keep. Default behavior is to keep the job in the failed set."),t(),n(321,"li")(322,"code"),e(323,"stackTraceLimit"),t(),e(324,": "),n(325,"code"),e(326,"number"),t(),e(327," - Limits the amount of stack trace lines that will be recorded in the stacktrace."),t()(),n(328,"p"),e(329,"Here are a few examples of customizing jobs with job options."),t(),n(330,"p"),e(331,"To delay the start of a job, use the "),n(332,"code"),e(333,"delay"),t(),e(334," configuration property."),t(),n(335,"app-copy-button")(336,"pre")(337,"code",21),e(338,`
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { delay: 3000 }, // 3 seconds delayed
);
`),t()()(),n(339,"p"),e(340,"To add a job to the right end of the queue (process the job as "),n(341,"strong"),e(342,"LIFO"),t(),e(343," (Last In First Out)), set the "),n(344,"code"),e(345,"lifo"),t(),e(346," property of the configuration object to "),n(347,"code"),e(348,"true"),t(),e(349,"."),t(),n(350,"app-copy-button")(351,"pre")(352,"code",21),e(353,`
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { lifo: true },
);
`),t()()(),n(354,"p"),e(355,"To prioritize a job, use the "),n(356,"code"),e(357,"priority"),t(),e(358," property."),t(),n(359,"app-copy-button")(360,"pre")(361,"code",21),e(362,`
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { priority: 2 },
);
`),t()()(),n(363,"p"),e(364,"For a full list of options, check the API documentation "),n(365,"a",33),e(366,"here"),t(),e(367," and "),n(368,"a",34),e(369,"here"),t(),e(370,"."),t(),n(371,"h4",35)(372,"span"),e(373,"Consumers"),t()(),n(374,"p"),e(375,"A consumer is a "),n(376,"strong"),e(377,"class"),t(),e(378," defining methods that either process jobs added into the queue, or listen for events on the queue, or both. Declare a consumer class using the "),n(379,"code"),e(380,"@Processor()"),t(),e(381," decorator as follows:"),t(),n(382,"app-copy-button")(383,"pre")(384,"code",21),e(385,`
import { Processor } from '@nestjs/bullmq';

@Processor('audio')
export class AudioConsumer {}
`),t()()(),n(386,"blockquote",27)(387,"strong"),e(388,"Hint"),t(),e(389," Consumers must be registered as "),n(390,"code"),e(391,"providers"),t(),e(392," so the "),n(393,"code"),e(394,"@nestjs/bullmq"),t(),e(395,` package can pick them up.
`),t(),n(396,"p"),e(397,"Where the decorator's string argument (e.g., "),n(398,"code"),e(399,"'audio'"),t(),e(400,") is the name of the queue to be associated with the class methods."),t(),n(401,"app-copy-button")(402,"pre")(403,"code",21),e(404,`
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    let progress = 0;
    for (let i = 0; i < 100; i++) {
      await doSomething(job.data);
      progress += 1;
      await job.updateProgress(progress);
    }
    return {};
  }
}
`),t()()(),n(405,"p"),e(406,"The process method is called whenever the worker is idle and there are jobs to process in the queue. This handler method receives the "),n(407,"code"),e(408,"job"),t(),e(409," object as its only argument. The value returned by the handler method is stored in the job object and can be accessed later on, for example in a listener for the completed event."),t(),n(410,"p")(411,"code"),e(412,"Job"),t(),e(413," objects have multiple methods that allow you to interact with their state. For example, the above code uses the "),n(414,"code"),e(415,"updateProgress()"),t(),e(416," method to update the job's progress. See "),n(417,"a",36),e(418,"here"),t(),e(419," for the complete "),n(420,"code"),e(421,"Job"),t(),e(422," object API reference."),t(),n(423,"p"),e(424,"In the older version, Bull, you could designate that a job handler method will handle "),n(425,"strong"),e(426,"only"),t(),e(427," jobs of a certain type (jobs with a specific "),n(428,"code"),e(429,"name"),t(),e(430,") by passing that "),n(431,"code"),e(432,"name"),t(),e(433," to the "),n(434,"code"),e(435,"@Process()"),t(),e(436," decorator as shown below."),t(),n(437,"blockquote",37)(438,"strong"),e(439,"Warning"),t(),e(440,` This doesn't work with BullMQ, keep reading.
`),t(),n(441,"app-copy-button")(442,"pre")(443,"code",21),e(444,`
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
`),t()()(),n(445,"p"),e(446,"This behavior is not supported in BullMQ due to confusions it generated. Instead, you need switch cases to call different services or logic for each job name:"),t(),n(447,"app-copy-button")(448,"pre")(449,"code",21),e(450,`
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'transcode': {
        let progress = 0;
        for (i = 0; i < 100; i++) {
          await doSomething(job.data);
          progress += 1;
          await job.progress(progress);
        }
        return {};
      }
      case 'concatenate': {
        await doSomeLogic2();
        break;
      }
    }
  }
}
`),t()()(),n(451,"p"),e(452,"This is covered in the "),n(453,"a",38),e(454,"named processor"),t(),e(455," section of the BullMQ documentation."),t(),n(456,"h4",39)(457,"span"),e(458,"Request-scoped consumers"),t()(),n(459,"p"),e(460,"When a consumer is flagged as request-scoped (learn more about the injection scopes "),n(461,"a",40),e(462,"here"),t(),e(463,"), a new instance of the class will be created exclusively for each job. The instance will be garbage-collected after the job has completed."),t(),n(464,"app-copy-button")(465,"pre")(466,"code",21),e(467,`
@Processor({
  name: 'audio',
  scope: Scope.REQUEST,
})
`),t()()(),n(468,"p"),e(469,"Since request-scoped consumer classes are instantiated dynamically and scoped to a single job, you can inject a "),n(470,"code"),e(471,"JOB_REF"),t(),e(472," through the constructor using a standard approach."),t(),n(473,"app-copy-button")(474,"pre")(475,"code",21),e(476,`
constructor(@Inject(JOB_REF) jobRef: Job) {
  console.log(jobRef);
}
`),t()()(),n(477,"blockquote",27)(478,"strong"),e(479,"Hint"),t(),e(480," The "),n(481,"code"),e(482,"JOB_REF"),t(),e(483," token is imported from the "),n(484,"code"),e(485,"@nestjs/bullmq"),t(),e(486,` package.
`),t(),n(487,"h4",41)(488,"span"),e(489,"Event listeners"),t()(),n(490,"p"),e(491,"BullMQ generates a set of useful events when queue and/or job state changes occur. These events can be subscribed to at the Worker level using the "),n(492,"code"),e(493,"@OnWorkerEvent(event)"),t(),e(494," decorator, or at the Queue level with a dedicated listener class and the "),n(495,"code"),e(496,"@OnQueueEvent(event)"),t(),e(497," decorator."),t(),n(498,"p"),e(499,"Worker events must be declared within a "),n(500,"a",13),e(501,"consumer"),t(),e(502," class (i.e., within a class decorated with the "),n(503,"code"),e(504,"@Processor()"),t(),e(505," decorator). To listen for an event, use the "),n(506,"code"),e(507,"@OnWorkerEvent(event)"),t(),e(508," decorator with the event you want to be handled. For example, to listen to the event emitted when a job enters the active state in the "),n(509,"code"),e(510,"audio"),t(),e(511," queue, use the following construct:"),t(),n(512,"app-copy-button")(513,"pre")(514,"code",21),e(515,`
import { Processor, Process, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer {
  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(
      \`Processing job \${job.id} of type \${job.name} with data \${job.data}...\`,
    );
  }

  // ...
}
`),t()()(),n(516,"p"),e(517,"You can see the complete list of events and their arguments as properties of WorkerListener "),n(518,"a",42),e(519,"here"),t(),e(520,"."),t(),n(521,"p"),e(522,"QueueEvent listeners must use the "),n(523,"code"),e(524,"@QueueEventsListener(queue)"),t(),e(525," decorator and extend the "),n(526,"code"),e(527,"QueueEventsHost"),t(),e(528," class provided by "),n(529,"code"),e(530,"@nestjs/bullmq"),t(),e(531,". To listen for an event, use the "),n(532,"code"),e(533,"@OnQueueEvent(event)"),t(),e(534," decorator with the event you want to be handled. For example, to listen to the event emitted when a job enters the active state in the "),n(535,"code"),e(536,"audio"),t(),e(537," queue, use the following construct:"),t(),n(538,"app-copy-button")(539,"pre")(540,"code",21),e(541,`
import {
  QueueEventsHost,
  QueueEventsListener,
  OnQueueEvent,
} from '@nestjs/bullmq';

@QueueEventsListener('audio')
export class AudioEventsListener extends QueueEventsHost {
  @OnQueueEvent('active')
  onActive(job: { jobId: string; prev?: string }) {
    console.log(\`Processing job \${job.jobId}...\`);
  }

  // ...
}
`),t()()(),n(542,"blockquote",27)(543,"strong"),e(544,"Hint"),t(),e(545," QueueEvent Listeners must be registered as "),n(546,"code"),e(547,"providers"),t(),e(548," so the "),n(549,"code"),e(550,"@nestjs/bullmq"),t(),e(551,` package can pick them up.
`),t(),n(552,"p"),e(553,"You can see the complete list of events and their arguments as properties of QueueEventsListener "),n(554,"a",43),e(555,"here"),t(),e(556,"."),t(),n(557,"h4",44)(558,"span"),e(559,"Queue management"),t()(),n(560,"p"),e(561,"Queues have an API that allows you to perform management functions like pausing and resuming, retrieving the count of jobs in various states, and several more. You can find the full queue API "),n(562,"a",45),e(563,"here"),t(),e(564,". Invoke any of these methods directly on the "),n(565,"code"),e(566,"Queue"),t(),e(567," object, as shown below with the pause/resume examples."),t(),n(568,"p"),e(569,"Pause a queue with the "),n(570,"code"),e(571,"pause()"),t(),e(572," method call. A paused queue will not process new jobs until resumed, but current jobs being processed will continue until they are finalized."),t(),n(573,"app-copy-button")(574,"pre")(575,"code",21),e(576,`
await audioQueue.pause();
`),t()()(),n(577,"p"),e(578,"To resume a paused queue, use the "),n(579,"code"),e(580,"resume()"),t(),e(581," method, as follows:"),t(),n(582,"app-copy-button")(583,"pre")(584,"code",21),e(585,`
await audioQueue.resume();
`),t()()(),n(586,"h4",46)(587,"span"),e(588,"Separate processes"),t()(),n(589,"p"),e(590,"Job handlers can also be run in a separate (forked) process ("),n(591,"a",47),e(592,"source"),t(),e(593,"). This has several advantages:"),t(),n(594,"ul")(595,"li"),e(596,"The process is sandboxed so if it crashes it does not affect the worker."),t(),n(597,"li"),e(598,"You can run blocking code without affecting the queue (jobs will not stall)."),t(),n(599,"li"),e(600,"Much better utilization of multi-core CPUs."),t(),n(601,"li"),e(602,"Less connections to redis."),t()(),n(603,"app-copy-button",19)(604,"span",20),e(605),s(606,"extension"),o(607,"app-tabs",null,2),t(),n(609,"pre")(610,"code",21),e(611,`
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'node:path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [join(__dirname, 'processor.js')],
    }),
  ],
})
export class AppModule {}
`),t()()(),n(612,"blockquote",37)(613,"strong"),e(614,"Warning"),t(),e(615,` Please note that because your function is being executed in a forked process, Dependency Injection (and IoC container) won't be available. That means that your processor function will need to contain (or create) all instances of external dependencies it needs.
`),t(),n(616,"h4",48)(617,"span"),e(618,"Async configuration"),t()(),n(619,"p"),e(620,"You may want to pass "),n(621,"code"),e(622,"bullmq"),t(),e(623," options asynchronously instead of statically. In this case, use the "),n(624,"code"),e(625,"forRootAsync()"),t(),e(626," method which provides several ways to deal with async configuration. Likewise, if you want to pass queue options asynchronously, use the "),n(627,"code"),e(628,"registerQueueAsync()"),t(),e(629," method."),t(),n(630,"p"),e(631,"One approach is to use a factory function:"),t(),n(632,"app-copy-button")(633,"pre")(634,"code",21),e(635,`
BullModule.forRootAsync({
  useFactory: () => ({
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
`),t()()(),n(636,"p"),e(637,"Our factory behaves like any other "),n(638,"a",49),e(639,"asynchronous provider"),t(),e(640," (e.g., it can be "),n(641,"code"),e(642,"async"),t(),e(643," and it's able to inject dependencies through "),n(644,"code"),e(645,"inject"),t(),e(646,")."),t(),n(647,"app-copy-button")(648,"pre")(649,"code",21),e(650,`
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    connection: {
      host: configService.get('QUEUE_HOST'),
      port: configService.get('QUEUE_PORT'),
    },
  }),
  inject: [ConfigService],
});
`),t()()(),n(651,"p"),e(652,"Alternatively, you can use the "),n(653,"code"),e(654,"useClass"),t(),e(655," syntax:"),t(),n(656,"app-copy-button")(657,"pre")(658,"code",21),e(659,`
BullModule.forRootAsync({
  useClass: BullConfigService,
});
`),t()()(),n(660,"p"),e(661,"The construction above will instantiate "),n(662,"code"),e(663,"BullConfigService"),t(),e(664," inside "),n(665,"code"),e(666,"BullModule"),t(),e(667," and use it to provide an options object by calling "),n(668,"code"),e(669,"createSharedConfiguration()"),t(),e(670,". Note that this means that the "),n(671,"code"),e(672,"BullConfigService"),t(),e(673," has to implement the "),n(674,"code"),e(675,"SharedBullConfigurationFactory"),t(),e(676," interface, as shown below:"),t(),n(677,"app-copy-button")(678,"pre")(679,"code",21),e(680,`
@Injectable()
class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullModuleOptions {
    return {
      connection: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
`),t()()(),n(681,"p"),e(682,"In order to prevent the creation of "),n(683,"code"),e(684,"BullConfigService"),t(),e(685," inside "),n(686,"code"),e(687,"BullModule"),t(),e(688," and use a provider imported from a different module, you can use the "),n(689,"code"),e(690,"useExisting"),t(),e(691," syntax."),t(),n(692,"app-copy-button")(693,"pre")(694,"code",21),e(695,`
BullModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
`),t()()(),n(696,"p"),e(697,"This construction works the same as "),n(698,"code"),e(699,"useClass"),t(),e(700," with one critical difference - "),n(701,"code"),e(702,"BullModule"),t(),e(703," will lookup imported modules to reuse an existing "),n(704,"code"),e(705,"ConfigService"),t(),e(706," instead of instantiating a new one."),t(),n(707,"p"),e(708,"Likewise, if you want to pass queue options asynchronously, use the "),n(709,"code"),e(710,"registerQueueAsync()"),t(),e(711," method, just keep in mind to specify the "),n(712,"code"),e(713,"name"),t(),e(714," attribute outside the factory function."),t(),n(715,"app-copy-button")(716,"pre")(717,"code",21),e(718,`
BullModule.registerQueueAsync({
  name: 'audio',
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
`),t()()(),n(719,"h4",50)(720,"span"),e(721,"Manual registration"),t()(),n(722,"p"),e(723,"By default, "),n(724,"code"),e(725,"BullModule"),t(),e(726," automatically registers BullMQ components (queues, processors, and event listener services) in the "),n(727,"code"),e(728,"onModuleInit"),t(),e(729," lifecycle function. However, in some cases, this behavior may not be ideal. To prevent automatic registration, enable "),n(730,"code"),e(731,"manualRegistration"),t(),e(732," in "),n(733,"code"),e(734,"BullModule"),t(),e(735," like this:"),t(),n(736,"app-copy-button")(737,"pre")(738,"code",21),e(739,`
BullModule.forRoot({
  extraOptions: {
    manualRegistration: true,
  },
});
`),t()()(),n(740,"p"),e(741,"To register these components manually, inject "),n(742,"code"),e(743,"BullRegistrar"),t(),e(744," and call the "),n(745,"code"),e(746,"register"),t(),e(747," function, ideally within "),n(748,"code"),e(749,"OnModuleInit"),t(),e(750," or "),n(751,"code"),e(752,"OnApplicationBootstrap"),t(),e(753,"."),t(),n(754,"app-copy-button")(755,"pre")(756,"code",21),e(757,`
import { Injectable, OnModuleInit } from '@nestjs/common';
import { BullRegistrar } from '@nestjs/bullmq';

@Injectable()
export class AudioService implements OnModuleInit {
  constructor(private bullRegistrar: BullRegistrar) {}

  onModuleInit() {
    if (yourConditionHere) {
      this.bullRegistrar.register();
    }
  }
}
`),t()()(),n(758,"p"),e(759,"Unless you call the "),n(760,"code"),e(761,"BullRegistrar#register"),t(),e(762," function, no BullMQ components will work\u2014meaning no jobs will be processed."),t(),n(763,"h4",51)(764,"span"),e(765,"Bull installation"),t()(),n(766,"blockquote",37)(767,"strong"),e(768,"Note"),t(),e(769,` If you decided to use BullMQ, skip this section and the following chapters.
`),t(),n(770,"p"),e(771,"To begin using Bull, we first install the required dependencies."),t(),n(772,"pre")(773,"code",18),e(774,`
$ npm install --save @nestjs/bull bull
`),t()(),n(775,"p"),e(776,"Once the installation process is complete, we can import the "),n(777,"code"),e(778,"BullModule"),t(),e(779," into the root "),n(780,"code"),e(781,"AppModule"),t(),e(782,"."),t(),n(783,"app-copy-button",19)(784,"span",20),e(785),s(786,"extension"),o(787,"app-tabs",null,3),t(),n(789,"pre")(790,"code",21),e(791,`
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
`),t()()(),n(792,"p"),e(793,"The "),n(794,"code"),e(795,"forRoot()"),t(),e(796," method is used to register a "),n(797,"code"),e(798,"bull"),t(),e(799," package configuration object that will be used by all queues registered in the application (unless specified otherwise). A configuration object consists of the following properties:"),t(),n(800,"ul")(801,"li")(802,"code"),e(803,"limiter: RateLimiter"),t(),e(804," - Options to control the rate at which the queue's jobs are processed. See "),n(805,"a",24),e(806,"RateLimiter"),t(),e(807," for more information. Optional."),t(),n(808,"li")(809,"code"),e(810,"redis: RedisOpts"),t(),e(811," - Options to configure the Redis connection. See "),n(812,"a",24),e(813,"RedisOpts"),t(),e(814," for more information. Optional."),t(),n(815,"li")(816,"code"),e(817,"prefix: string"),t(),e(818," - Prefix for all queue keys. Optional."),t(),n(819,"li")(820,"code"),e(821,"defaultJobOptions: JobOpts"),t(),e(822," - Options to control the default settings for new jobs. See "),n(823,"a",23),e(824,"JobOpts"),t(),e(825," for more information. Optional. "),n(826,"strong"),e(827,"Note: These do not take effect if you schedule jobs via a FlowProducer. See "),n(828,"a",52),e(829,"bullmq#1034"),t(),e(830," for explanation."),t()(),n(831,"li")(832,"code"),e(833,"settings: AdvancedSettings"),t(),e(834," - Advanced Queue configuration settings. These should usually not be changed. See "),n(835,"a",24),e(836,"AdvancedSettings"),t(),e(837," for more information. Optional."),t()(),n(838,"p"),e(839,"All the options are optional, providing detailed control over queue behavior. These are passed directly to the Bull "),n(840,"code"),e(841,"Queue"),t(),e(842," constructor. Read more about these options "),n(843,"a",24),e(844,"here"),t(),e(845,"."),t(),n(846,"p"),e(847,"To register a queue, import the "),n(848,"code"),e(849,"BullModule.registerQueue()"),t(),e(850," dynamic module, as follows:"),t(),n(851,"app-copy-button")(852,"pre")(853,"code",21),e(854,`
BullModule.registerQueue({
  name: 'audio',
});
`),t()()(),n(855,"blockquote",27)(856,"strong"),e(857,"Hint"),t(),e(858," Create multiple queues by passing multiple comma-separated configuration objects to the "),n(859,"code"),e(860,"registerQueue()"),t(),e(861,` method.
`),t(),n(862,"p"),e(863,"The "),n(864,"code"),e(865,"registerQueue()"),t(),e(866," method is used to instantiate and/or register queues. Queues are shared across modules and processes that connect to the same underlying Redis database with the same credentials. Each queue is unique by its name property. A queue name is used as both an injection token (for injecting the queue into controllers/providers), and as an argument to decorators to associate consumer classes and listeners with queues."),t(),n(867,"p"),e(868,"You can also override some of the pre-configured options for a specific queue, as follows:"),t(),n(869,"app-copy-button")(870,"pre")(871,"code",21),e(872,`
BullModule.registerQueue({
  name: 'audio',
  redis: {
    port: 6380,
  },
});
`),t()()(),n(873,"p"),e(874,"Since jobs are persisted in Redis, each time a specific named queue is instantiated (e.g., when an app is started/restarted), it attempts to process any old jobs that may exist from a previous unfinished session."),t(),n(875,"p"),e(876,"Each queue can have one or many producers, consumers, and listeners. Consumers retrieve jobs from the queue in a specific order: FIFO (the default), LIFO, or according to priorities. Controlling queue processing order is discussed "),n(877,"a",13),e(878,"here"),t(),e(879,"."),t(),n(880,"p"),o(881,"app-banner-enterprise"),t(),n(882,"h4",53)(883,"span"),e(884,"Named configurations"),t()(),n(885,"p"),e(886,"If your queues connect to multiple Redis instances, you can use a technique called "),n(887,"strong"),e(888,"named configurations"),t(),e(889,". This feature allows you to register several configurations under specified keys, which then you can refer to in the queue options."),t(),n(890,"p"),e(891,"For example, assuming that you have an additional Redis instance (apart from the default one) used by a few queues registered in your application, you can register its configuration as follows:"),t(),n(892,"app-copy-button")(893,"pre")(894,"code",21),e(895,`
BullModule.forRoot('alternative-config', {
  redis: {
    port: 6381,
  },
});
`),t()()(),n(896,"p"),e(897,"In the example above, "),n(898,"code"),e(899,"'alternative-config'"),t(),e(900," is just a configuration key (it can be any arbitrary string)."),t(),n(901,"p"),e(902,"With this in place, you can now point to this configuration in the "),n(903,"code"),e(904,"registerQueue()"),t(),e(905," options object:"),t(),n(906,"app-copy-button")(907,"pre")(908,"code",21),e(909,`
BullModule.registerQueue({
  configKey: 'alternative-config',
  name: 'video',
});
`),t()()(),n(910,"h4",54)(911,"span"),e(912,"Producers"),t()(),n(913,"p"),e(914,"Job producers add jobs to queues. Producers are typically application services (Nest "),n(915,"a",31),e(916,"providers"),t(),e(917,"). To add jobs to a queue, first inject the queue into the service as follows:"),t(),n(918,"app-copy-button")(919,"pre")(920,"code",21),e(921,`
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}
}
`),t()()(),n(922,"blockquote",27)(923,"strong"),e(924,"Hint"),t(),e(925," The "),n(926,"code"),e(927,"@InjectQueue()"),t(),e(928," decorator identifies the queue by its name, as provided in the "),n(929,"code"),e(930,"registerQueue()"),t(),e(931," method call (e.g., "),n(932,"code"),e(933,"'audio'"),t(),e(934,`).
`),t(),n(935,"p"),e(936,"Now, add a job by calling the queue's "),n(937,"code"),e(938,"add()"),t(),e(939," method, passing a user-defined job object. Jobs are represented as serializable JavaScript objects (since that is how they are stored in the Redis database). The shape of the job you pass is arbitrary; use it to represent the semantics of your job object."),t(),n(940,"app-copy-button")(941,"pre")(942,"code",21),e(943,`
const job = await this.audioQueue.add({
  foo: 'bar',
});
`),t()()(),n(944,"h4",55)(945,"span"),e(946,"Named jobs"),t()(),n(947,"p"),e(948,"Jobs may have unique names. This allows you to create specialized "),n(949,"a",13),e(950,"consumers"),t(),e(951," that will only process jobs with a given name."),t(),n(952,"app-copy-button")(953,"pre")(954,"code",21),e(955,`
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
`),t()()(),n(956,"blockquote",56)(957,"strong"),e(958,"Warning"),t(),e(959," When using named jobs, you must create processors for each unique name added to a queue, or the queue will complain that you are missing a processor for the given job. See "),n(960,"a",13),e(961,"here"),t(),e(962,` for more information on consuming named jobs.
`),t(),n(963,"h4",57)(964,"span"),e(965,"Job options"),t()(),n(966,"p"),e(967,"Jobs can have additional options associated with them. Pass an options object after the "),n(968,"code"),e(969,"job"),t(),e(970," argument in the "),n(971,"code"),e(972,"Queue.add()"),t(),e(973," method. Job options properties are:"),t(),n(974,"ul")(975,"li")(976,"code"),e(977,"priority"),t(),e(978,": "),n(979,"code"),e(980,"number"),t(),e(981," - Optional priority value. Ranges from 1 (highest priority) to MAX_INT (lowest priority). Note that using priorities has a slight impact on performance, so use them with caution."),t(),n(982,"li")(983,"code"),e(984,"delay"),t(),e(985,": "),n(986,"code"),e(987,"number"),t(),e(988," - An amount of time (milliseconds) to wait until this job can be processed. Note that for accurate delays, both server and clients should have their clocks synchronized."),t(),n(989,"li")(990,"code"),e(991,"attempts"),t(),e(992,": "),n(993,"code"),e(994,"number"),t(),e(995," - The total number of attempts to try the job until it completes."),t(),n(996,"li")(997,"code"),e(998,"repeat"),t(),e(999,": "),n(1e3,"code"),e(1001,"RepeatOpts"),t(),e(1002," - Repeat job according to a cron specification. See "),n(1003,"a",23),e(1004,"RepeatOpts"),t(),e(1005,"."),t(),n(1006,"li")(1007,"code"),e(1008,"backoff"),t(),e(1009,": "),n(1010,"code"),e(1011,"number | BackoffOpts"),t(),e(1012," - Backoff setting for automatic retries if the job fails. See "),n(1013,"a",23),e(1014,"BackoffOpts"),t(),e(1015,"."),t(),n(1016,"li")(1017,"code"),e(1018,"lifo"),t(),e(1019,": "),n(1020,"code"),e(1021,"boolean"),t(),e(1022," - If true, adds the job to the right end of the queue instead of the left (default false)."),t(),n(1023,"li")(1024,"code"),e(1025,"timeout"),t(),e(1026,": "),n(1027,"code"),e(1028,"number"),t(),e(1029," - The number of milliseconds after which the job should fail with a timeout error."),t(),n(1030,"li")(1031,"code"),e(1032,"jobId"),t(),e(1033,": "),n(1034,"code"),e(1035,"number"),t(),e(1036," | "),n(1037,"code"),e(1038,"string"),t(),e(1039,` - Override the job ID - by default, the job ID is a unique
integer, but you can use this setting to override it. If you use this option, it is up to you to ensure the jobId is unique. If you attempt to add a job with an id that already exists, it will not be added.`),t(),n(1040,"li")(1041,"code"),e(1042,"removeOnComplete"),t(),e(1043,": "),n(1044,"code"),e(1045,"boolean | number"),t(),e(1046," - If true, removes the job when it successfully completes. A number specifies the amount of jobs to keep. Default behavior is to keep the job in the completed set."),t(),n(1047,"li")(1048,"code"),e(1049,"removeOnFail"),t(),e(1050,": "),n(1051,"code"),e(1052,"boolean | number"),t(),e(1053," - If true, removes the job when it fails after all attempts. A number specifies the amount of jobs to keep. Default behavior is to keep the job in the failed set."),t(),n(1054,"li")(1055,"code"),e(1056,"stackTraceLimit"),t(),e(1057,": "),n(1058,"code"),e(1059,"number"),t(),e(1060," - Limits the amount of stack trace lines that will be recorded in the stacktrace."),t()(),n(1061,"p"),e(1062,"Here are a few examples of customizing jobs with job options."),t(),n(1063,"p"),e(1064,"To delay the start of a job, use the "),n(1065,"code"),e(1066,"delay"),t(),e(1067," configuration property."),t(),n(1068,"app-copy-button")(1069,"pre")(1070,"code",21),e(1071,`
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { delay: 3000 }, // 3 seconds delayed
);
`),t()()(),n(1072,"p"),e(1073,"To add a job to the right end of the queue (process the job as "),n(1074,"strong"),e(1075,"LIFO"),t(),e(1076," (Last In First Out)), set the "),n(1077,"code"),e(1078,"lifo"),t(),e(1079," property of the configuration object to "),n(1080,"code"),e(1081,"true"),t(),e(1082,"."),t(),n(1083,"app-copy-button")(1084,"pre")(1085,"code",21),e(1086,`
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { lifo: true },
);
`),t()()(),n(1087,"p"),e(1088,"To prioritize a job, use the "),n(1089,"code"),e(1090,"priority"),t(),e(1091," property."),t(),n(1092,"app-copy-button")(1093,"pre")(1094,"code",21),e(1095,`
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { priority: 2 },
);
`),t()()(),n(1096,"h4",58)(1097,"span"),e(1098,"Consumers"),t()(),n(1099,"p"),e(1100,"A consumer is a "),n(1101,"strong"),e(1102,"class"),t(),e(1103," defining methods that either process jobs added into the queue, or listen for events on the queue, or both. Declare a consumer class using the "),n(1104,"code"),e(1105,"@Processor()"),t(),e(1106," decorator as follows:"),t(),n(1107,"app-copy-button")(1108,"pre")(1109,"code",21),e(1110,`
import { Processor } from '@nestjs/bull';

@Processor('audio')
export class AudioConsumer {}
`),t()()(),n(1111,"blockquote",27)(1112,"strong"),e(1113,"Hint"),t(),e(1114," Consumers must be registered as "),n(1115,"code"),e(1116,"providers"),t(),e(1117," so the "),n(1118,"code"),e(1119,"@nestjs/bull"),t(),e(1120,` package can pick them up.
`),t(),n(1121,"p"),e(1122,"Where the decorator's string argument (e.g., "),n(1123,"code"),e(1124,"'audio'"),t(),e(1125,") is the name of the queue to be associated with the class methods."),t(),n(1126,"p"),e(1127,"Within a consumer class, declare job handlers by decorating handler methods with the "),n(1128,"code"),e(1129,"@Process()"),t(),e(1130," decorator."),t(),n(1131,"app-copy-button")(1132,"pre")(1133,"code",21),e(1134,`
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')
export class AudioConsumer {
  @Process()
  async transcode(job: Job<unknown>) {
    let progress = 0;
    for (let i = 0; i < 100; i++) {
      await doSomething(job.data);
      progress += 1;
      await job.progress(progress);
    }
    return {};
  }
}
`),t()()(),n(1135,"p"),e(1136,"The decorated method (e.g., "),n(1137,"code"),e(1138,"transcode()"),t(),e(1139,") is called whenever the worker is idle and there are jobs to process in the queue. This handler method receives the "),n(1140,"code"),e(1141,"job"),t(),e(1142," object as its only argument. The value returned by the handler method is stored in the job object and can be accessed later on, for example in a listener for the completed event."),t(),n(1143,"p")(1144,"code"),e(1145,"Job"),t(),e(1146," objects have multiple methods that allow you to interact with their state. For example, the above code uses the "),n(1147,"code"),e(1148,"progress()"),t(),e(1149," method to update the job's progress. See "),n(1150,"a",59),e(1151,"here"),t(),e(1152," for the complete "),n(1153,"code"),e(1154,"Job"),t(),e(1155," object API reference."),t(),n(1156,"p"),e(1157,"You can designate that a job handler method will handle "),n(1158,"strong"),e(1159,"only"),t(),e(1160," jobs of a certain type (jobs with a specific "),n(1161,"code"),e(1162,"name"),t(),e(1163,") by passing that "),n(1164,"code"),e(1165,"name"),t(),e(1166," to the "),n(1167,"code"),e(1168,"@Process()"),t(),e(1169," decorator as shown below. You can have multiple "),n(1170,"code"),e(1171,"@Process()"),t(),e(1172," handlers in a given consumer class, corresponding to each job type ("),n(1173,"code"),e(1174,"name"),t(),e(1175,"). When you use named jobs, be sure to have a handler corresponding to each name."),t(),n(1176,"app-copy-button")(1177,"pre")(1178,"code",21),e(1179,`
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
`),t()()(),n(1180,"blockquote",37)(1181,"strong"),e(1182,"Warning"),t(),e(1183," When defining multiple consumers for the same queue, the "),n(1184,"code"),e(1185,"concurrency"),t(),e(1186," option in "),n(1187,"code"),e(1188),t(),e(1189," won't take effect. The minimum "),n(1190,"code"),e(1191,"concurrency"),t(),e(1192," will match the number of consumers defined. This also applies even if "),n(1193,"code"),e(1194,"@Process()"),t(),e(1195," handlers use a different "),n(1196,"code"),e(1197,"name"),t(),e(1198,` to handle named jobs.
`),t(),n(1199,"h4",60)(1200,"span"),e(1201,"Request-scoped consumers"),t()(),n(1202,"p"),e(1203,"When a consumer is flagged as request-scoped (learn more about the injection scopes "),n(1204,"a",40),e(1205,"here"),t(),e(1206,"), a new instance of the class will be created exclusively for each job. The instance will be garbage-collected after the job has completed."),t(),n(1207,"app-copy-button")(1208,"pre")(1209,"code",21),e(1210,`
@Processor({
  name: 'audio',
  scope: Scope.REQUEST,
})
`),t()()(),n(1211,"p"),e(1212,"Since request-scoped consumer classes are instantiated dynamically and scoped to a single job, you can inject a "),n(1213,"code"),e(1214,"JOB_REF"),t(),e(1215," through the constructor using a standard approach."),t(),n(1216,"app-copy-button")(1217,"pre")(1218,"code",21),e(1219,`
constructor(@Inject(JOB_REF) jobRef: Job) {
  console.log(jobRef);
}
`),t()()(),n(1220,"blockquote",27)(1221,"strong"),e(1222,"Hint"),t(),e(1223," The "),n(1224,"code"),e(1225,"JOB_REF"),t(),e(1226," token is imported from the "),n(1227,"code"),e(1228,"@nestjs/bull"),t(),e(1229,` package.
`),t(),n(1230,"h4",61)(1231,"span"),e(1232,"Event listeners"),t()(),n(1233,"p"),e(1234,"Bull generates a set of useful events when queue and/or job state changes occur. Nest provides a set of decorators that allow subscribing to a core set of standard events. These are exported from the "),n(1235,"code"),e(1236,"@nestjs/bull"),t(),e(1237," package."),t(),n(1238,"p"),e(1239,"Event listeners must be declared within a "),n(1240,"a",13),e(1241,"consumer"),t(),e(1242," class (i.e., within a class decorated with the "),n(1243,"code"),e(1244,"@Processor()"),t(),e(1245," decorator). To listen for an event, use one of the decorators in the table below to declare a handler for the event. For example, to listen to the event emitted when a job enters the active state in the "),n(1246,"code"),e(1247,"audio"),t(),e(1248," queue, use the following construct:"),t(),n(1249,"app-copy-button")(1250,"pre")(1251,"code",21),e(1252,`
import { Processor, Process, OnQueueActive } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')
export class AudioConsumer {

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      \`Processing job \${job.id} of type \${job.name} with data \${job.data}...\`,
    );
  }
  ...
`),t()()(),n(1253,"p"),e(1254,"Since Bull operates in a distributed (multi-node) environment, it defines the concept of event locality. This concept recognizes that events may be triggered either entirely within a single process, or on shared queues from different processes. A "),n(1255,"strong"),e(1256,"local"),t(),e(1257," event is one that is produced when an action or state change is triggered on a queue in the local process. In other words, when your event producers and consumers are local to a single process, all events happening on queues are local."),t(),n(1258,"p"),e(1259,"When a queue is shared across multiple processes, we encounter the possibility of "),n(1260,"strong"),e(1261,"global"),t(),e(1262," events. For a listener in one process to receive an event notification triggered by another process, it must register for a global event."),t(),n(1263,"p"),e(1264,"Event handlers are invoked whenever their corresponding event is emitted. The handler is called with the signature shown in the table below, providing access to information relevant to the event. We discuss one key difference between local and global event handler signatures below."),t(),n(1265,"table")(1266,"tr")(1267,"th"),e(1268,"Local event listeners"),t(),n(1269,"th"),e(1270,"Global event listeners"),t(),n(1271,"th"),e(1272,"Handler method signature / When fired"),t()(),n(1273,"tr")(1274,"td")(1275,"code"),e(1276,"@OnQueueError()"),t()(),n(1277,"td")(1278,"code"),e(1279,"@OnGlobalQueueError()"),t()(),n(1280,"td")(1281,"code"),e(1282,"handler(error: Error)"),t(),e(1283," - An error occurred. "),n(1284,"code"),e(1285,"error"),t(),e(1286," contains the triggering error."),t()(),n(1287,"tr")(1288,"td")(1289,"code"),e(1290,"@OnQueueWaiting()"),t()(),n(1291,"td")(1292,"code"),e(1293,"@OnGlobalQueueWaiting()"),t()(),n(1294,"td")(1295,"code"),e(1296,"handler(jobId: number | string)"),t(),e(1297," - A Job is waiting to be processed as soon as a worker is idling. "),n(1298,"code"),e(1299,"jobId"),t(),e(1300," contains the id for the job that has entered this state."),t()(),n(1301,"tr")(1302,"td")(1303,"code"),e(1304,"@OnQueueActive()"),t()(),n(1305,"td")(1306,"code"),e(1307,"@OnGlobalQueueActive()"),t()(),n(1308,"td")(1309,"code"),e(1310,"handler(job: Job)"),t(),e(1311," - Job "),n(1312,"code"),e(1313,"job"),t(),e(1314,"has started. "),t()(),n(1315,"tr")(1316,"td")(1317,"code"),e(1318,"@OnQueueStalled()"),t()(),n(1319,"td")(1320,"code"),e(1321,"@OnGlobalQueueStalled()"),t()(),n(1322,"td")(1323,"code"),e(1324,"handler(job: Job)"),t(),e(1325," - Job "),n(1326,"code"),e(1327,"job"),t(),e(1328," has been marked as stalled. This is useful for debugging job workers that crash or pause the event loop."),t()(),n(1329,"tr")(1330,"td")(1331,"code"),e(1332,"@OnQueueProgress()"),t()(),n(1333,"td")(1334,"code"),e(1335,"@OnGlobalQueueProgress()"),t()(),n(1336,"td")(1337,"code"),e(1338,"handler(job: Job, progress: number)"),t(),e(1339," - Job "),n(1340,"code"),e(1341,"job"),t(),e(1342,"'s progress was updated to value "),n(1343,"code"),e(1344,"progress"),t(),e(1345,"."),t()(),n(1346,"tr")(1347,"td")(1348,"code"),e(1349,"@OnQueueCompleted()"),t()(),n(1350,"td")(1351,"code"),e(1352,"@OnGlobalQueueCompleted()"),t()(),n(1353,"td")(1354,"code"),e(1355,"handler(job: Job, result: any)"),t(),e(1356," Job "),n(1357,"code"),e(1358,"job"),t(),e(1359," successfully completed with a result "),n(1360,"code"),e(1361,"result"),t(),e(1362,"."),t()(),n(1363,"tr")(1364,"td")(1365,"code"),e(1366,"@OnQueueFailed()"),t()(),n(1367,"td")(1368,"code"),e(1369,"@OnGlobalQueueFailed()"),t()(),n(1370,"td")(1371,"code"),e(1372,"handler(job: Job, err: Error)"),t(),e(1373," Job "),n(1374,"code"),e(1375,"job"),t(),e(1376," failed with reason "),n(1377,"code"),e(1378,"err"),t(),e(1379,"."),t()(),n(1380,"tr")(1381,"td")(1382,"code"),e(1383,"@OnQueuePaused()"),t()(),n(1384,"td")(1385,"code"),e(1386,"@OnGlobalQueuePaused()"),t()(),n(1387,"td")(1388,"code"),e(1389,"handler()"),t(),e(1390," The queue has been paused."),t()(),n(1391,"tr")(1392,"td")(1393,"code"),e(1394,"@OnQueueResumed()"),t()(),n(1395,"td")(1396,"code"),e(1397,"@OnGlobalQueueResumed()"),t()(),n(1398,"td")(1399,"code"),e(1400,"handler(job: Job)"),t(),e(1401," The queue has been resumed."),t()(),n(1402,"tr")(1403,"td")(1404,"code"),e(1405,"@OnQueueCleaned()"),t()(),n(1406,"td")(1407,"code"),e(1408,"@OnGlobalQueueCleaned()"),t()(),n(1409,"td")(1410,"code"),e(1411,"handler(jobs: Job[], type: string)"),t(),e(1412," Old jobs have been cleaned from the queue. "),n(1413,"code"),e(1414,"jobs"),t(),e(1415," is an array of cleaned jobs, and "),n(1416,"code"),e(1417,"type"),t(),e(1418," is the type of jobs cleaned."),t()(),n(1419,"tr")(1420,"td")(1421,"code"),e(1422,"@OnQueueDrained()"),t()(),n(1423,"td")(1424,"code"),e(1425,"@OnGlobalQueueDrained()"),t()(),n(1426,"td")(1427,"code"),e(1428,"handler()"),t(),e(1429," Emitted whenever the queue has processed all the waiting jobs (even if there can be some delayed jobs not yet processed)."),t()(),n(1430,"tr")(1431,"td")(1432,"code"),e(1433,"@OnQueueRemoved()"),t()(),n(1434,"td")(1435,"code"),e(1436,"@OnGlobalQueueRemoved()"),t()(),n(1437,"td")(1438,"code"),e(1439,"handler(job: Job)"),t(),e(1440," Job "),n(1441,"code"),e(1442,"job"),t(),e(1443," was successfully removed."),t()()(),n(1444,"p"),e(1445,"When listening for global events, the method signatures can be slightly different from their local counterpart. Specifically, any method signature that receives "),n(1446,"code"),e(1447,"job"),t(),e(1448," objects in the local version, instead receives a "),n(1449,"code"),e(1450,"jobId"),t(),e(1451," ("),n(1452,"code"),e(1453,"number"),t(),e(1454,") in the global version. To get a reference to the actual "),n(1455,"code"),e(1456,"job"),t(),e(1457," object in such a case, use the "),n(1458,"code"),e(1459,"Queue#getJob"),t(),e(1460," method. This call should be awaited, and therefore the handler should be declared "),n(1461,"code"),e(1462,"async"),t(),e(1463,". For example:"),t(),n(1464,"app-copy-button")(1465,"pre")(1466,"code",21),e(1467,`
@OnGlobalQueueCompleted()
async onGlobalCompleted(jobId: number, result: any) {
  const job = await this.immediateQueue.getJob(jobId);
  console.log('(Global) on completed: job ', job.id, ' -> result: ', result);
}
`),t()()(),n(1468,"blockquote",27)(1469,"strong"),e(1470,"Hint"),t(),e(1471," To access the "),n(1472,"code"),e(1473,"Queue"),t(),e(1474," object (to make a "),n(1475,"code"),e(1476,"getJob()"),t(),e(1477,` call), you must of course inject it. Also, the Queue must be registered in the module where you are injecting it.
`),t(),n(1478,"p"),e(1479,"In addition to the specific event listener decorators, you can also use the generic "),n(1480,"code"),e(1481,"@OnQueueEvent()"),t(),e(1482," decorator in combination with either "),n(1483,"code"),e(1484,"BullQueueEvents"),t(),e(1485," or "),n(1486,"code"),e(1487,"BullQueueGlobalEvents"),t(),e(1488," enums. Read more about events "),n(1489,"a",62),e(1490,"here"),t(),e(1491,"."),t(),n(1492,"h4",63)(1493,"span"),e(1494,"Queue management"),t()(),n(1495,"p"),e(1496,"Queue's have an API that allows you to perform management functions like pausing and resuming, retrieving the count of jobs in various states, and several more. You can find the full queue API "),n(1497,"a",24),e(1498,"here"),t(),e(1499,". Invoke any of these methods directly on the "),n(1500,"code"),e(1501,"Queue"),t(),e(1502," object, as shown below with the pause/resume examples."),t(),n(1503,"p"),e(1504,"Pause a queue with the "),n(1505,"code"),e(1506,"pause()"),t(),e(1507," method call. A paused queue will not process new jobs until resumed, but current jobs being processed will continue until they are finalized."),t(),n(1508,"app-copy-button")(1509,"pre")(1510,"code",21),e(1511,`
await audioQueue.pause();
`),t()()(),n(1512,"p"),e(1513,"To resume a paused queue, use the "),n(1514,"code"),e(1515,"resume()"),t(),e(1516," method, as follows:"),t(),n(1517,"app-copy-button")(1518,"pre")(1519,"code",21),e(1520,`
await audioQueue.resume();
`),t()()(),n(1521,"h4",64)(1522,"span"),e(1523,"Separate processes"),t()(),n(1524,"p"),e(1525,"Job handlers can also be run in a separate (forked) process ("),n(1526,"a",65),e(1527,"source"),t(),e(1528,"). This has several advantages:"),t(),n(1529,"ul")(1530,"li"),e(1531,"The process is sandboxed so if it crashes it does not affect the worker."),t(),n(1532,"li"),e(1533,"You can run blocking code without affecting the queue (jobs will not stall)."),t(),n(1534,"li"),e(1535,"Much better utilization of multi-core CPUs."),t(),n(1536,"li"),e(1537,"Less connections to redis."),t()(),n(1538,"app-copy-button",19)(1539,"span",20),e(1540),s(1541,"extension"),o(1542,"app-tabs",null,4),t(),n(1544,"pre")(1545,"code",66),e(1546,`
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { join } from 'path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [join(__dirname, 'processor.js')],
    }),
  ],
})
export class AppModule {}
`),t()()(),n(1547,"p"),e(1548,"Please note that because your function is being executed in a forked process, Dependency Injection (and IoC container) won't be available. That means that your processor function will need to contain (or create) all instances of external dependencies it needs."),t(),n(1549,"app-copy-button",19)(1550,"span",20),e(1551),s(1552,"extension"),o(1553,"app-tabs",null,5),t(),n(1555,"pre")(1556,"code",66),e(1557,`
import { Job, DoneCallback } from 'bull';

export default function (job: Job, cb: DoneCallback) {
  console.log(\`[\${process.pid}] \${JSON.stringify(job.data)}\`);
  cb(null, 'It works');
}
`),t()()(),n(1558,"h4",67)(1559,"span"),e(1560,"Async configuration"),t()(),n(1561,"p"),e(1562,"You may want to pass "),n(1563,"code"),e(1564,"bull"),t(),e(1565," options asynchronously instead of statically. In this case, use the "),n(1566,"code"),e(1567,"forRootAsync()"),t(),e(1568," method which provides several ways to deal with async configuration."),t(),n(1569,"p"),e(1570,"One approach is to use a factory function:"),t(),n(1571,"app-copy-button")(1572,"pre")(1573,"code",21),e(1574,`
BullModule.forRootAsync({
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
`),t()()(),n(1575,"p"),e(1576,"Our factory behaves like any other "),n(1577,"a",49),e(1578,"asynchronous provider"),t(),e(1579," (e.g., it can be "),n(1580,"code"),e(1581,"async"),t(),e(1582," and it's able to inject dependencies through "),n(1583,"code"),e(1584,"inject"),t(),e(1585,")."),t(),n(1586,"app-copy-button")(1587,"pre")(1588,"code",21),e(1589,`
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    redis: {
      host: configService.get('QUEUE_HOST'),
      port: configService.get('QUEUE_PORT'),
    },
  }),
  inject: [ConfigService],
});
`),t()()(),n(1590,"p"),e(1591,"Alternatively, you can use the "),n(1592,"code"),e(1593,"useClass"),t(),e(1594," syntax:"),t(),n(1595,"app-copy-button")(1596,"pre")(1597,"code",21),e(1598,`
BullModule.forRootAsync({
  useClass: BullConfigService,
});
`),t()()(),n(1599,"p"),e(1600,"The construction above will instantiate "),n(1601,"code"),e(1602,"BullConfigService"),t(),e(1603," inside "),n(1604,"code"),e(1605,"BullModule"),t(),e(1606," and use it to provide an options object by calling "),n(1607,"code"),e(1608,"createSharedConfiguration()"),t(),e(1609,". Note that this means that the "),n(1610,"code"),e(1611,"BullConfigService"),t(),e(1612," has to implement the "),n(1613,"code"),e(1614,"SharedBullConfigurationFactory"),t(),e(1615," interface, as shown below:"),t(),n(1616,"app-copy-button")(1617,"pre")(1618,"code",21),e(1619,`
@Injectable()
class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullModuleOptions {
    return {
      redis: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
`),t()()(),n(1620,"p"),e(1621,"In order to prevent the creation of "),n(1622,"code"),e(1623,"BullConfigService"),t(),e(1624," inside "),n(1625,"code"),e(1626,"BullModule"),t(),e(1627," and use a provider imported from a different module, you can use the "),n(1628,"code"),e(1629,"useExisting"),t(),e(1630," syntax."),t(),n(1631,"app-copy-button")(1632,"pre")(1633,"code",21),e(1634,`
BullModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
`),t()()(),n(1635,"p"),e(1636,"This construction works the same as "),n(1637,"code"),e(1638,"useClass"),t(),e(1639," with one critical difference - "),n(1640,"code"),e(1641,"BullModule"),t(),e(1642," will lookup imported modules to reuse an existing "),n(1643,"code"),e(1644,"ConfigService"),t(),e(1645," instead of instantiating a new one."),t(),n(1646,"p"),e(1647,"Likewise, if you want to pass queue options asynchronously, use the "),n(1648,"code"),e(1649,"registerQueueAsync()"),t(),e(1650," method, just keep in mind to specify the "),n(1651,"code"),e(1652,"name"),t(),e(1653," attribute outside the factory function."),t(),n(1654,"app-copy-button")(1655,"pre")(1656,"code",21),e(1657,`
BullModule.registerQueueAsync({
  name: 'audio',
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
`),t()()(),n(1658,"h4",68)(1659,"span"),e(1660,"Example"),t()(),n(1661,"p"),e(1662,"A working example is available "),n(1663,"a",69),e(1664,"here"),t(),e(1665,"."),t()()),c&2){let b=r(73),v=r(608),T=r(788),k=r(1543),M=r(1554);i(70),l(" ",d(71,7,"app.module",b.isJsActive),`
`),i(535),l(" ",d(606,10,"app.module",v.isJsActive),`
`),i(180),l(" ",d(786,13,"app.module",T.isJsActive),`
`),i(403),I("@Process(","{"," concurrency: 1 ","}",")"),i(352),l(" ",d(1541,16,"app.module",k.isJsActive),`
`),i(11),l(" ",d(1552,19,"processor",M.isJsActive),`
`)}},dependencies:[g,E,y,B,C,w],encapsulation:2,changeDetection:0})}return a})();var te=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-serialization"]],features:[f],decls:210,vars:2,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/serialization.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","serialization"],["appAnchor","","id","overview"],["rel","nofollow","target","_blank","href","https://github.com/typestack/class-transformer"],[1,"info"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/techniques/streaming-files#streamable-file-class"],["appAnchor","","id","exclude-properties"],[1,"language-typescript"],[1,""],[1,"language-json"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/interceptors#binding-interceptors"],["appAnchor","","id","expose-properties"],["appAnchor","","id","transform"],["appAnchor","","id","pass-options"],["appAnchor","","id","transform-plain-objects"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/21-serializer"],["appAnchor","","id","websockets-and-microservices"],["appAnchor","","id","learn-more"]],template:function(c,p){c&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Serialization"),t(),n(7,"p"),e(8,"Serialization is a process that happens before objects are returned in a network response. This is an appropriate place to provide rules for transforming and sanitizing the data to be returned to the client. For example, sensitive data like passwords should always be excluded from the response. Or, certain properties might require additional transformation, such as sending only a subset of properties of an entity. Performing these transformations manually can be tedious and error prone, and can leave you uncertain that all cases have been covered."),t(),n(9,"h4",6)(10,"span"),e(11,"Overview"),t()(),n(12,"p"),e(13,"Nest provides a built-in capability to help ensure that these operations can be performed in a straightforward way. The "),n(14,"code"),e(15,"ClassSerializerInterceptor"),t(),e(16," interceptor uses the powerful "),n(17,"a",7),e(18,"class-transformer"),t(),e(19," package to provide a declarative and extensible way of transforming objects. The basic operation it performs is to take the value returned by a method handler and apply the "),n(20,"code"),e(21,"instanceToPlain()"),t(),e(22," function from "),n(23,"a",7),e(24,"class-transformer"),t(),e(25,". In doing so, it can apply rules expressed by "),n(26,"code"),e(27,"class-transformer"),t(),e(28," decorators on an entity/DTO class, as described below."),t(),n(29,"blockquote",8)(30,"strong"),e(31,"Hint"),t(),e(32," The serialization does not apply to "),n(33,"a",9),e(34,"StreamableFile"),t(),e(35,` responses.
`),t(),n(36,"h4",10)(37,"span"),e(38,"Exclude properties"),t()(),n(39,"p"),e(40,"Let's assume that we want to automatically exclude a "),n(41,"code"),e(42,"password"),t(),e(43," property from a user entity. We annotate the entity as follows:"),t(),n(44,"app-copy-button")(45,"pre")(46,"code",11),e(47,`
import { Exclude } from 'class-transformer';

export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
`),t()()(),n(48,"p"),e(49,"Now consider a controller with a method handler that returns an instance of this class."),t(),n(50,"app-copy-button")(51,"pre")(52,"code",11),e(53,`
@UseInterceptors(ClassSerializerInterceptor)
@Get()
findOne(): UserEntity {
  return new UserEntity({
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    password: 'password',
  });
}
`),t()()(),n(54,"blockquote",12)(55,"strong"),e(56,"Warning"),t(),e(57," Note that we must return an instance of the class. If you return a plain JavaScript object, for example, "),n(58,"code"),e(59),t(),e(60,`, the object won't be properly serialized.
`),t(),n(61,"blockquote",8)(62,"strong"),e(63,"Hint"),t(),e(64," The "),n(65,"code"),e(66,"ClassSerializerInterceptor"),t(),e(67," is imported from "),n(68,"code"),e(69,"@nestjs/common"),t(),e(70,`.
`),t(),n(71,"p"),e(72,"When this endpoint is requested, the client receives the following response:"),t(),n(73,"pre")(74,"code",13),e(75,`
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe"
}
`),t()(),n(76,"p"),e(77,"Note that the interceptor can be applied application-wide (as covered "),n(78,"a",14),e(79,"here"),t(),e(80,"). The combination of the interceptor and the entity class declaration ensures that "),n(81,"strong"),e(82,"any"),t(),e(83," method that returns a "),n(84,"code"),e(85,"UserEntity"),t(),e(86," will be sure to remove the "),n(87,"code"),e(88,"password"),t(),e(89," property. This gives you a measure of centralized enforcement of this business rule."),t(),n(90,"h4",15)(91,"span"),e(92,"Expose properties"),t()(),n(93,"p"),e(94,"You can use the "),n(95,"code"),e(96,"@Expose()"),t(),e(97," decorator to provide alias names for properties, or to execute a function to calculate a property value (analogous to "),n(98,"strong"),e(99,"getter"),t(),e(100," functions), as shown below."),t(),n(101,"app-copy-button")(102,"pre")(103,"code",11),e(104,`
@Expose()
get fullName(): string {
  return \`\${this.firstName} \${this.lastName}\`;
}
`),t()()(),n(105,"h4",16)(106,"span"),e(107,"Transform"),t()(),n(108,"p"),e(109,"You can perform additional data transformation using the "),n(110,"code"),e(111,"@Transform()"),t(),e(112," decorator. For example, the following construct returns the name property of the "),n(113,"code"),e(114,"RoleEntity"),t(),e(115," instead of returning the whole object."),t(),n(116,"app-copy-button")(117,"pre")(118,"code",11),e(119,`
@Transform(({ value }) => value.name)
role: RoleEntity;
`),t()()(),n(120,"h4",17)(121,"span"),e(122,"Pass options"),t()(),n(123,"p"),e(124,"You may want to modify the default behavior of the transformation functions. To override default settings, pass them in an "),n(125,"code"),e(126,"options"),t(),e(127," object with the "),n(128,"code"),e(129,"@SerializeOptions()"),t(),e(130," decorator."),t(),n(131,"app-copy-button")(132,"pre")(133,"code",11),e(134,`
@SerializeOptions({
  excludePrefixes: ['_'],
})
@Get()
findOne(): UserEntity {
  return new UserEntity();
}
`),t()()(),n(135,"blockquote",8)(136,"strong"),e(137,"Hint"),t(),e(138," The "),n(139,"code"),e(140,"@SerializeOptions()"),t(),e(141," decorator is imported from "),n(142,"code"),e(143,"@nestjs/common"),t(),e(144,`.
`),t(),n(145,"p"),e(146,"Options passed via "),n(147,"code"),e(148,"@SerializeOptions()"),t(),e(149," are passed as the second argument of the underlying "),n(150,"code"),e(151,"instanceToPlain()"),t(),e(152," function. In this example, we are automatically excluding all properties that begin with the "),n(153,"code"),e(154,"_"),t(),e(155," prefix."),t(),n(156,"h4",18)(157,"span"),e(158,"Transform plain objects"),t()(),n(159,"p"),e(160,"You can enforce transformations at the controller level by using the "),n(161,"code"),e(162,"@SerializeOptions"),t(),e(163," decorator. This ensures that all responses are transformed into instances of the specified class, applying any decorators from class-validator or class-transformer, even when plain objects are returned. This approach leads to cleaner code without the need to repeatedly instantiate the class or call "),n(164,"code"),e(165,"plainToInstance"),t(),e(166,"."),t(),n(167,"p"),e(168,"In the example below, despite returning plain JavaScript objects in both conditional branches, they will be automatically converted into "),n(169,"code"),e(170,"UserEntity"),t(),e(171," instances, with the relevant decorators applied:"),t(),n(172,"app-copy-button")(173,"pre")(174,"code",11),e(175,`
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: UserEntity })
@Get()
findOne(@Query() { id }: { id: number }): UserEntity {
  if (id === 1) {
    return {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      password: 'password',
    };
  }

  return {
    id: 2,
    firstName: 'Kamil',
    lastName: 'Mysliwiec',
    password: 'password2',
  };
}
`),t()()(),n(176,"blockquote",8)(177,"strong"),e(178,"Hint"),t(),e(179," By specifying the expected return type for the controller, you can leverage TypeScript's type-checking capabilities to ensure that the returned plain object adheres to the shape of the DTO or entity. The "),n(180,"code"),e(181,"plainToInstance"),t(),e(182,` function doesn't provide this level of type hinting, which can lead to potential bugs if the plain object doesn't match the expected DTO or entity structure.
`),t(),n(183,"h4",19)(184,"span"),e(185,"Example"),t()(),n(186,"p"),e(187,"A working example is available "),n(188,"a",20),e(189,"here"),t(),e(190,"."),t(),n(191,"h4",21)(192,"span"),e(193,"WebSockets and Microservices"),t()(),n(194,"p"),e(195,"While this chapter shows examples using HTTP style applications (e.g., Express or Fastify), the "),n(196,"code"),e(197,"ClassSerializerInterceptor"),t(),e(198," works the same for WebSockets and Microservices, regardless of the transport method that is used."),t(),n(199,"h4",22)(200,"span"),e(201,"Learn more"),t()(),n(202,"p"),e(203,"Read more about available decorators and options as provided by the "),n(204,"code"),e(205,"class-transformer"),t(),e(206," package "),n(207,"a",7),e(208,"here"),t(),e(209,"."),t()()),c&2&&(i(59),I("","{"," user: new UserEntity() ","}"))},dependencies:[g,E],encapsulation:2,changeDetection:0})}return a})();var ne=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-sse"]],features:[f],decls:268,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/server-sent-events.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","server-sent-events"],["rel","nofollow","target","_blank","href","https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events"],["appAnchor","","id","usage"],[1,"language-typescript"],[1,"info"],[1,"warning"],["rel","nofollow","target","_blank","href","https://developer.mozilla.org/en-US/docs/Web/API/EventSource"],[1,"language-javascript"],["appAnchor","","id","client-disconnection"],["appAnchor","","id","signal-lifetime"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/28-sse"]],template:function(c,p){c&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Server-Sent Events"),t(),n(7,"p"),e(8,"Server-Sent Events (SSE) is a server push technology enabling a client to receive automatic updates from a server via HTTP connection. Each notification is sent as a block of text terminated by a pair of newlines (learn more "),n(9,"a",6),e(10,"here"),t(),e(11,")."),t(),n(12,"h4",7)(13,"span"),e(14,"Usage"),t()(),n(15,"p"),e(16,"To enable Server-Sent events on a route (route registered within a "),n(17,"strong"),e(18,"controller class"),t(),e(19,"), annotate the method handler with the "),n(20,"code"),e(21,"@Sse()"),t(),e(22," decorator."),t(),n(23,"app-copy-button")(24,"pre")(25,"code",8),e(26,`
@Sse('sse')
sse(): Observable<MessageEvent> {
  return interval(1000).pipe(map((_) => ({ data: { hello: 'world' } })));
}
`),t()()(),n(27,"blockquote",9)(28,"strong"),e(29,"Hint"),t(),e(30," The "),n(31,"code"),e(32,"@Sse()"),t(),e(33," decorator and "),n(34,"code"),e(35,"MessageEvent"),t(),e(36," interface are imported from the "),n(37,"code"),e(38,"@nestjs/common"),t(),e(39,", while "),n(40,"code"),e(41,"Observable"),t(),e(42,", "),n(43,"code"),e(44,"interval"),t(),e(45,", and "),n(46,"code"),e(47,"map"),t(),e(48," are imported from the "),n(49,"code"),e(50,"rxjs"),t(),e(51,` package.
`),t(),n(52,"blockquote",10)(53,"strong"),e(54,"Warning"),t(),e(55," Server-Sent Events routes must return an "),n(56,"code"),e(57,"Observable"),t(),e(58,` stream.
`),t(),n(59,"p"),e(60,"In the example above, we defined a route named "),n(61,"code"),e(62,"sse"),t(),e(63," that will allow us to propagate real-time updates. These events can be listened to using the "),n(64,"a",11),e(65,"EventSource API"),t(),e(66,"."),t(),n(67,"p"),e(68,"The "),n(69,"code"),e(70,"sse"),t(),e(71," method returns an "),n(72,"code"),e(73,"Observable"),t(),e(74," that emits multiple "),n(75,"code"),e(76,"MessageEvent"),t(),e(77," (in this example, it emits a new "),n(78,"code"),e(79,"MessageEvent"),t(),e(80," every second). The "),n(81,"code"),e(82,"MessageEvent"),t(),e(83," object should respect the following interface to match the specification:"),t(),n(84,"app-copy-button")(85,"pre")(86,"code",8),e(87,`
export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}
`),t()()(),n(88,"p"),e(89,"With this in place, we can now create an instance of the "),n(90,"code"),e(91,"EventSource"),t(),e(92," class in our client-side application, passing the "),n(93,"code"),e(94,"/sse"),t(),e(95," route (which matches the endpoint we have passed into the "),n(96,"code"),e(97,"@Sse()"),t(),e(98," decorator above) as a constructor argument."),t(),n(99,"p")(100,"code"),e(101,"EventSource"),t(),e(102," instance opens a persistent connection to an HTTP server, which sends events in "),n(103,"code"),e(104,"text/event-stream"),t(),e(105," format. The connection remains open until closed by calling "),n(106,"code"),e(107,"EventSource.close()"),t(),e(108,"."),t(),n(109,"p"),e(110,"Once the connection is opened, incoming messages from the server are delivered to your code in the form of events. If there is an event field in the incoming message, the triggered event is the same as the event field value. If no event field is present, then a generic "),n(111,"code"),e(112,"message"),t(),e(113," event is fired ("),n(114,"a",11),e(115,"source"),t(),e(116,")."),t(),n(117,"pre")(118,"code",12),e(119,`
const eventSource = new EventSource('/sse');
eventSource.onmessage = ({ data }) => {
  console.log('New message', JSON.parse(data));
};
`),t()(),n(120,"h4",13)(121,"span"),e(122,"Client disconnection"),t()(),n(123,"p"),e(124,"When a client closes the SSE connection (e.g., "),n(125,"code"),e(126,"eventSource.close()"),t(),e(127,"), NestJS automatically unsubscribes from the returned Observable, which stops the event stream and cleans up any associated resources \u2014 including the interval timer in the example above."),t(),n(128,"p"),e(129,"To run custom teardown logic when a client disconnects, use the "),n(130,"code"),e(131,"finalize"),t(),e(132," operator:"),t(),n(133,"app-copy-button")(134,"pre")(135,"code",8),e(136,`
@Sse('sse')
sse(): Observable<MessageEvent> {
  return interval(1000).pipe(
    map((_) => ({ data: { hello: 'world' } })),
    finalize(() => console.log('Client disconnected')),
  );
}
`),t()()(),n(137,"blockquote",9)(138,"strong"),e(139,"Hint"),t(),e(140," The "),n(141,"code"),e(142,"finalize"),t(),e(143," operator (imported from "),n(144,"code"),e(145,"rxjs"),t(),e(146,`) executes its callback whenever the Observable terminates \u2014 by completion, error, or unsubscription (which includes client disconnect). This makes it the right place to release external resources such as database cursors or file handles tied to the stream.
`),t(),n(147,"p"),e(148,"An "),n(149,"code"),e(150,"@Sse()"),t(),e(151," handler may be asynchronous \u2014 returning a "),n(152,"code"),e(153,"Promise<Observable>"),t(),e(154," rather than an "),n(155,"code"),e(156,"Observable"),t(),e(157," directly. This is common when the stream needs expensive setup before the first event can be produced: opening a database cursor, acquiring a model session, or authorizing against a downstream service."),t(),n(158,"app-copy-button")(159,"pre")(160,"code",8),e(161,`
@Sse('stream')
async stream(): Promise<Observable<MessageEvent>> {
  const session = await createSession();

  return new Observable(subscriber => {
    // ...produce events from \`session\`
  });
}
`),t()()(),n(162,"p"),e(163,"There is a gap here. If the client disconnects "),n(164,"strong"),e(165,"while the promise is still resolving"),t(),e(166,", the returned "),n(167,"code"),e(168,"Observable"),t(),e(169," is never subscribed \u2014 Nest will not start a producer whose consumer has already gone away. That is the right behaviour for the stream, but it means the "),n(170,"code"),e(171,"Observable"),t(),e(172,"'s teardown logic never runs, and anything allocated during setup (the "),n(173,"code"),e(174,"session"),t(),e(175," above) is leaked."),t(),n(176,"p"),e(177,"To close that gap, inject the request's "),n(178,"code"),e(179,"AbortSignal"),t(),e(180," with the "),n(181,"code"),e(182,"@SseSignal()"),t(),e(183," decorator:"),t(),n(184,"app-copy-button")(185,"pre")(186,"code",8),e(187,`
import { MessageEvent, Sse, SseSignal } from '@nestjs/common';
import { EMPTY, Observable } from 'rxjs';

@Sse('stream')
async stream(@SseSignal() signal: AbortSignal): Promise<Observable<MessageEvent>> {
  const session = await createSession();

  if (signal.aborted) {
    // The client disconnected during setup. The Observable below will never be
    // subscribed, so release the resource here.
    await session.close();
    return EMPTY;
  }

  return new Observable(subscriber => {
    const stream = session.start();
    stream.on('data', data => subscriber.next({ data }));

    return () => {
      stream.stop();
      session.close();
    };
  });
}
`),t()()(),n(188,"h4",14)(189,"span"),e(190,"Signal lifetime"),t()(),n(191,"p"),e(192,"The signal represents the lifetime of the "),n(193,"strong"),e(194,"SSE response"),t(),e(195,", not just the connection. It is aborted once the stream terminates for any reason:"),t(),n(196,"ul")(197,"li"),e(198,"the client disconnected;"),t(),n(199,"li"),e(200,"the "),n(201,"code"),e(202,"Observable"),t(),e(203," completed;"),t(),n(204,"li"),e(205,"the "),n(206,"code"),e(207,"Observable"),t(),e(208," errored."),t()(),n(209,"p"),e(210,"This makes the signal a single cleanup hook for the whole request. Rather than duplicating teardown across an "),n(211,"code"),e(212,"abort"),t(),e(213," listener and the "),n(214,"code"),e(215,"Observable"),t(),e(216,"'s own teardown function, you can wire resources to the signal once and have them released on every exit path:"),t(),n(217,"app-copy-button")(218,"pre")(219,"code",8),e(220,`
@Sse('stream')
async stream(@SseSignal() signal: AbortSignal): Promise<Observable<MessageEvent>> {
  // The signal aborts when the response ends, so the fetch is cancelled whether
  // the client disconnected or the stream simply finished.
  const upstream = await fetch(UPSTREAM_URL, { signal });

  return new Observable(subscriber => {
    // ...
  });
}
`),t()()(),n(221,"p"),e(222,"Because the signal also aborts on normal completion, "),n(223,"code"),e(224,"signal.aborted"),t(),e(225,' is only meaningful as a "did the client go away?" check '),n(226,"strong"),e(227,"during setup"),t(),e(228," \u2014 before the "),n(229,"code"),e(230,"Observable"),t(),e(231," is returned. At that point the stream cannot have completed yet, so an aborted signal unambiguously means the client disconnected."),t(),n(232,"blockquote",10)(233,"strong"),e(234,"Notice"),t(),e(235," Cleanup wired to the "),n(236,"code"),e(237,"abort"),t(),e(238," event may run alongside the "),n(239,"code"),e(240,"Observable"),t(),e(241,`'s teardown function, so make it idempotent.
`),t(),n(242,"p"),e(243,"Inside a producer, the signal is also a convenient way to end the stream when the client leaves:"),t(),n(244,"app-copy-button")(245,"pre")(246,"code",8),e(247,`
return new Observable<MessageEvent>(subscriber => {
  const timer = setInterval(() => subscriber.next({ data: 'tick' }), 1000);
  const onAbort = () => subscriber.complete();

  signal.addEventListener('abort', onAbort, { once: true });

  return () => {
    clearInterval(timer);
    signal.removeEventListener('abort', onAbort);
  };
});
`),t()()(),n(248,"blockquote",9)(249,"strong"),e(250,"Hint"),t(),n(251,"code"),e(252,"@SseSignal()"),t(),e(253," is only populated on "),n(254,"code"),e(255,"@Sse()"),t(),e(256," routes; on any other handler it resolves to "),n(257,"code"),e(258,"undefined"),t(),e(259,`. It works identically on both the Express and Fastify platforms.
`),t(),n(260,"h4",15)(261,"span"),e(262,"Example"),t()(),n(263,"p"),e(264,"A working example is available "),n(265,"a",16),e(266,"here"),t(),e(267,"."),t()())},dependencies:[g,E],encapsulation:2,changeDetection:0})}return a})();var ie=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-sessions"]],features:[f],decls:199,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/sessions.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","session"],["routerLink","/techniques/mvc"],["appAnchor","","id","use-with-express-default"],["rel","nofollow","target","_blank","href","https://github.com/expressjs/session"],[1,"language-shell"],[1,"language-typescript"],[1,"warning"],["rel","nofollow","target","_blank","href","https://github.com/expressjs/session#saveuninitialized"],["rel","nofollow","target","_blank","href","https://github.com/expressjs/session#options"],[1,"info"],["appAnchor","","id","use-with-fastify"],["rel","nofollow","target","_blank","href","https://github.com/fastify/fastify-secure-session"],["rel","nofollow","target","_blank","href","https://github.com/fastify/fastify-secure-session#using-keys-with-key-rotation"]],template:function(c,p){c&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Session"),t(),n(7,"p")(8,"strong"),e(9,"HTTP sessions"),t(),e(10," provide a way to store information about the user across multiple requests, which is particularly useful for "),n(11,"a",6),e(12,"MVC"),t(),e(13," applications."),t(),n(14,"h4",7)(15,"span"),e(16,"Use with Express (default)"),t()(),n(17,"p"),e(18,"First install the "),n(19,"a",8),e(20,"required package"),t(),e(21," (and its types for TypeScript users):"),t(),n(22,"pre")(23,"code",9),e(24,`
$ npm i express-session
$ npm i -D @types/express-session
`),t()(),n(25,"p"),e(26,"Once the installation is complete, apply the "),n(27,"code"),e(28,"express-session"),t(),e(29," middleware as global middleware (for example, in your "),n(30,"code"),e(31,"main.ts"),t(),e(32," file)."),t(),n(33,"app-copy-button")(34,"pre")(35,"code",10),e(36,`
import * as session from 'express-session';
// somewhere in your initialization file
app.use(
  session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: false,
  }),
);
`),t()()(),n(37,"blockquote",11)(38,"strong"),e(39,"Notice"),t(),e(40," The default server-side session storage is purposely not designed for a production environment. It will leak memory under most conditions, does not scale past a single process, and is meant for debugging and developing. Read more in the "),n(41,"a",8),e(42,"official repository"),t(),e(43,`.
`),t(),n(44,"p"),e(45,"The "),n(46,"code"),e(47,"secret"),t(),e(48," is used to sign the session ID cookie. This can be either a string for a single secret, or an array of multiple secrets. If an array of secrets is provided, only the first element will be used to sign the session ID cookie, while all the elements will be considered when verifying the signature in requests. The secret itself should be not easily parsed by a human and would best be a random set of characters."),t(),n(49,"p"),e(50,"Enabling the "),n(51,"code"),e(52,"resave"),t(),e(53," option forces the session to be saved back to the session store, even if the session was never modified during the request. The default value is "),n(54,"code"),e(55,"true"),t(),e(56,", but using the default has been deprecated, as the default will change in the future."),t(),n(57,"p"),e(58,"Likewise, enabling the "),n(59,"code"),e(60,"saveUninitialized"),t(),e(61,' option Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified. Choosing '),n(62,"code"),e(63,"false"),t(),e(64," is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie. Choosing "),n(65,"code"),e(66,"false"),t(),e(67," will also help with race conditions where a client makes multiple parallel requests without a session ("),n(68,"a",12),e(69,"source"),t(),e(70,")."),t(),n(71,"p"),e(72,"You can pass several other options to the "),n(73,"code"),e(74,"session"),t(),e(75," middleware, read more about them in the "),n(76,"a",13),e(77,"API documentation"),t(),e(78,"."),t(),n(79,"blockquote",14)(80,"strong"),e(81,"Hint"),t(),e(82," Please note that "),n(83,"code"),e(84,"secure: true"),t(),e(85," is a recommended option. However, it requires an https-enabled website, i.e., HTTPS is necessary for secure cookies. If secure is set, and you access your site over HTTP, the cookie will not be set. If you have your node.js behind a proxy and are using "),n(86,"code"),e(87,"secure: true"),t(),e(88,", you need to set "),n(89,"code"),e(90,'"trust proxy"'),t(),e(91,` in express.
`),t(),n(92,"p"),e(93,"With this in place, you can now set and read session values from within the route handlers, as follows:"),t(),n(94,"app-copy-button")(95,"pre")(96,"code",10),e(97,`
@Get()
findAll(@Req() request: Request) {
  request.session.visits = request.session.visits ? request.session.visits + 1 : 1;
}
`),t()()(),n(98,"blockquote",14)(99,"strong"),e(100,"Hint"),t(),e(101," The "),n(102,"code"),e(103,"@Req()"),t(),e(104," decorator is imported from the "),n(105,"code"),e(106,"@nestjs/common"),t(),e(107,", while "),n(108,"code"),e(109,"Request"),t(),e(110," from the "),n(111,"code"),e(112,"express"),t(),e(113,` package.
`),t(),n(114,"p"),e(115,"Alternatively, you can use the "),n(116,"code"),e(117,"@Session()"),t(),e(118," decorator to extract a session object from the request, as follows:"),t(),n(119,"app-copy-button")(120,"pre")(121,"code",10),e(122,`
@Get()
findAll(@Session() session: Record<string, any>) {
  session.visits = session.visits ? session.visits + 1 : 1;
}
`),t()()(),n(123,"blockquote",14)(124,"strong"),e(125,"Hint"),t(),e(126," The "),n(127,"code"),e(128,"@Session()"),t(),e(129," decorator is imported from the "),n(130,"code"),e(131,"@nestjs/common"),t(),e(132,` package.
`),t(),n(133,"h4",15)(134,"span"),e(135,"Use with Fastify"),t()(),n(136,"p"),e(137,"First install the required package:"),t(),n(138,"pre")(139,"code",9),e(140,`
$ npm i @fastify/secure-session
`),t()(),n(141,"p"),e(142,"Once the installation is complete, register the "),n(143,"code"),e(144,"fastify-secure-session"),t(),e(145," plugin:"),t(),n(146,"app-copy-button")(147,"pre")(148,"code",10),e(149,`
import secureSession from '@fastify/secure-session';

// somewhere in your initialization file
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
await app.register(secureSession, {
  secret: 'averylogphrasebiggerthanthirtytwochars',
  salt: 'mq9hDxBVDbspDR6n',
});
`),t()()(),n(150,"blockquote",14)(151,"strong"),e(152,"Hint"),t(),e(153," You can also pregenerate a key ("),n(154,"a",16),e(155,"see instructions"),t(),e(156,") or use "),n(157,"a",17),e(158,"keys rotation"),t(),e(159,`.
`),t(),n(160,"p"),e(161,"Read more about the available options in the "),n(162,"a",16),e(163,"official repository"),t(),e(164,"."),t(),n(165,"p"),e(166,"With this in place, you can now set and read session values from within the route handlers, as follows:"),t(),n(167,"app-copy-button")(168,"pre")(169,"code",10),e(170,`
@Get()
findAll(@Req() request: FastifyRequest) {
  const visits = request.session.get('visits');
  request.session.set('visits', visits ? visits + 1 : 1);
}
`),t()()(),n(171,"p"),e(172,"Alternatively, you can use the "),n(173,"code"),e(174,"@Session()"),t(),e(175," decorator to extract a session object from the request, as follows:"),t(),n(176,"app-copy-button")(177,"pre")(178,"code",10),e(179,`
@Get()
findAll(@Session() session: secureSession.Session) {
  const visits = session.get('visits');
  session.set('visits', visits ? visits + 1 : 1);
}
`),t()()(),n(180,"blockquote",14)(181,"strong"),e(182,"Hint"),t(),e(183," The "),n(184,"code"),e(185,"@Session()"),t(),e(186," decorator is imported from the "),n(187,"code"),e(188,"@nestjs/common"),t(),e(189,", while "),n(190,"code"),e(191,"secureSession.Session"),t(),e(192," from the "),n(193,"code"),e(194,"@fastify/secure-session"),t(),e(195," package (import statement: "),n(196,"code"),e(197,"import * as secureSession from '@fastify/secure-session'"),t(),e(198,`).
`),t()())},dependencies:[C,g,E],encapsulation:2,changeDetection:0})}return a})();var oe=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-sql"]],features:[f],decls:1515,vars:96,consts:[["contentReference",""],["appaeee6ef6ac49f0e48067c0e5d38fe78d0c04e93f",""],["app9a9b8c3385bcbc7c6f3d383d98d8cb299ee07391",""],["appccacf2a824db86a73ac4e7fe30bb98200f8bf086",""],["app92c9a4914e07bbd2886459f3c17037efeb43cb1e",""],["app111ab1a34507d15f909b8deb9167226fb0a27c6a",""],["appfe6a308dc2806f6bfbecc6be74e33d847f004f56",""],["app379252d9a804f93ddf1c6528af0bc59b042271d9",""],["app285814a7e57d1eb435e36db1d109dcc7deb0844d",""],["app066b09fee282fcf8399bf332676e00a2f529b8d3",""],["app159761ab291229dea3b05bddef075ea10325dc65",""],["appd5d3ff08f594834be532cb25ad298348c3e8bb95",""],["appc063faac3f3c8a7dfd7b1c74793b266f95eb65e0",""],["app499b375d31316a4c5f42968715bd04acaff78faa",""],["appc4a08fc535ccd75a3c78ce316feb6dd364dbb7e2",""],["appb43bd9437048a07916212c0d42260b281c52be51",""],["appeabc82aac5c711d88f8e8352f59ddae93dff7734",""],["appec6e8648a4e8a9eca53f59e9e9bd661dc81e81b7",""],["app786a66fa5c35591e1a3069091718d0a54125d370",""],["appbc62a28f9aed3edf30c345941ae5f24cf8ab9bef",""],["appd60bea32530a39090fb1a13e194f870a4e9cbd76",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/sql.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","database"],["rel","nofollow","target","_blank","href","https://expressjs.com/en/guide/database-integration.html"],["rel","nofollow","target","_blank","href","https://mikro-orm.io/"],["routerLink","/recipes/mikroorm"],["rel","nofollow","target","_blank","href","https://sequelize.org/"],["href","/techniques/database#sequelize-integration"],["rel","nofollow","target","_blank","href","https://knexjs.org/"],["rel","nofollow","target","_blank","href","https://dev.to/nestjs/build-a-nestjs-module-for-knex-js-or-other-resource-based-libraries-in-5-minutes-12an"],["rel","nofollow","target","_blank","href","https://github.com/typeorm/typeorm"],["rel","nofollow","target","_blank","href","https://www.github.com/prisma/prisma"],["routerLink","/recipes/prisma"],["routerLink","/techniques/mongodb"],["id","typeorm-integration"],["rel","nofollow","target","_blank","href","https://www.mysql.com/"],[1,"language-bash"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"warning"],["rel","nofollow","target","_blank","href","https://typeorm.io/data-source-options#common-data-source-options"],[1,"info"],["rel","nofollow","target","_blank","href","https://typeorm.io/data-source-options"],["appAnchor","","id","repository-pattern"],["rel","nofollow","target","_blank","href","https://typeorm.io/docs/entity/entities/"],["appAnchor","","id","relations"],["rel","nofollow","target","_blank","href","https://typeorm.io/docs/relations/relations"],["appAnchor","","id","auto-load-entities"],["appAnchor","","id","separating-entity-definition"],["rel","nofollow","target","_blank","href","https://typeorm.io/docs/entity/separating-entity-definition"],[1,"warning","error"],["appAnchor","","id","typeorm-transactions"],["rel","nofollow","target","_blank","href","https://en.wikipedia.org/wiki/Database_transaction"],["rel","nofollow","target","_blank","href","https://typeorm.io/docs/advanced-topics/transactions/"],["rel","nofollow","target","_blank","href","https://typeorm.io/docs/advanced-topics/transactions/#creating-and-using-transactions"],["appAnchor","","id","subscribers"],["rel","nofollow","target","_blank","href","https://typeorm.io/docs/advanced-topics/listeners-and-subscribers#what-is-a-subscriber"],[1,"error"],["routerLink","/fundamentals/injection-scopes"],["appAnchor","","id","migrations"],["rel","nofollow","target","_blank","href","https://typeorm.io/docs/advanced-topics/migrations/"],["rel","nofollow","target","_blank","href","https://typeorm.io/docs/advanced-topics/migrations/#creating-a-new-migration"],["appAnchor","","id","multiple-databases"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/typeorm/issues/86"],["appAnchor","","id","testing"],["routerLink","/fundamentals/custom-providers"],["appAnchor","","id","async-configuration"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/async-providers"],["appAnchor","","id","custom-datasource-factory"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/05-sql-typeorm"],["id","sequelize-integration"],["rel","nofollow","target","_blank","href","https://github.com/RobinBuschmann/sequelize-typescript"],["rel","nofollow","target","_blank","href","https://sequelize.org/docs/v6/getting-started/#connecting-to-a-database"],["appAnchor","","id","models"],["rel","nofollow","target","_blank","href","https://github.com/RobinBuschmann/sequelize-typescript#column"],["appAnchor","","id","relations-1"],["rel","nofollow","target","_blank","href","https://github.com/RobinBuschmann/sequelize-typescript#model-association"],["appAnchor","","id","auto-load-models"],["appAnchor","","id","sequelize-transactions"],["rel","nofollow","target","_blank","href","https://sequelize.org/docs/v6/other-topics/transactions/"],["appAnchor","","id","migrations-1"],["rel","nofollow","target","_blank","href","https://sequelize.org/docs/v6/other-topics/migrations/"],["rel","nofollow","target","_blank","href","https://sequelize.org/docs/v6/other-topics/migrations/#installing-the-cli"],["appAnchor","","id","multiple-databases-1"],["appAnchor","","id","testing-1"],["appAnchor","","id","async-configuration-1"],["appAnchor","","id","example-1"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/07-sequelize"]],template:function(c,p){if(c&1&&(n(0,"div",21,0)(2,"div",22)(3,"a",23),o(4,"i",24),t()(),n(5,"h3",25),e(6,"Database"),t(),n(7,"p"),e(8,"Nest is database agnostic, allowing you to easily integrate with any SQL or NoSQL database. You have a number of options available to you, depending on your preferences. At the most general level, connecting Nest to a database is simply a matter of loading an appropriate Node.js driver for the database, just as you would with "),n(9,"a",26),e(10,"Express"),t(),e(11," or Fastify."),t(),n(12,"p"),e(13,"You can also directly use any general purpose Node.js database integration "),n(14,"strong"),e(15,"library"),t(),e(16," or ORM, such as "),n(17,"a",27),e(18,"MikroORM"),t(),e(19," (see "),n(20,"a",28),e(21,"MikroORM recipe"),t(),e(22,"), "),n(23,"a",29),e(24,"Sequelize"),t(),e(25," (see "),n(26,"a",30),e(27,"Sequelize integration"),t(),e(28,"), "),n(29,"a",31),e(30,"Knex.js"),t(),e(31," (see "),n(32,"a",32),e(33,"Knex.js tutorial"),t(),e(34,"), "),n(35,"a",33),e(36,"TypeORM"),t(),e(37,", and "),n(38,"a",34),e(39,"Prisma"),t(),e(40," (see "),n(41,"a",35),e(42,"Prisma recipe"),t(),e(43,"), to operate at a higher level of abstraction."),t(),n(44,"p"),e(45,"For convenience, Nest provides tight integration with TypeORM and Sequelize out-of-the-box with the "),n(46,"code"),e(47,"@nestjs/typeorm"),t(),e(48," and "),n(49,"code"),e(50,"@nestjs/sequelize"),t(),e(51," packages respectively, which we'll cover in the current chapter, and Mongoose with "),n(52,"code"),e(53,"@nestjs/mongoose"),t(),e(54,", which is covered in "),n(55,"a",36),e(56,"this chapter"),t(),e(57,". These integrations provide additional NestJS-specific features, such as model/repository injection, testability, and asynchronous configuration to make accessing your chosen database even easier."),t(),n(58,"h3",37),e(59,"TypeORM Integration"),t(),n(60,"p"),e(61,"For integrating with SQL and NoSQL databases, Nest provides the "),n(62,"code"),e(63,"@nestjs/typeorm"),t(),e(64," package. "),n(65,"a",33),e(66,"TypeORM"),t(),e(67," is the most mature Object Relational Mapper (ORM) available for TypeScript. Since it's written in TypeScript, it integrates well with the Nest framework."),t(),n(68,"p"),e(69,"To begin using it, we first install the required dependencies. In this chapter, we'll demonstrate using the popular "),n(70,"a",38),e(71,"MySQL"),t(),e(72," Relational DBMS, but TypeORM provides support for many relational databases, such as PostgreSQL, Oracle, Microsoft SQL Server, SQLite, and even NoSQL databases like MongoDB. The procedure we walk through in this chapter will be the same for any database supported by TypeORM. You'll simply need to install the associated client API libraries for your selected database."),t(),n(73,"pre")(74,"code",39),e(75,`
$ npm install --save @nestjs/typeorm typeorm mysql2
`),t()(),n(76,"p"),e(77,"Once the installation process is complete, we can import the "),n(78,"code"),e(79,"TypeOrmModule"),t(),e(80," into the root "),n(81,"code"),e(82,"AppModule"),t(),e(83,"."),t(),n(84,"app-copy-button",40)(85,"span",41),e(86),s(87,"extension"),o(88,"app-tabs",null,1),t(),n(90,"pre")(91,"code",42),e(92,`
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
`),t()()(),n(93,"blockquote",43)(94,"strong"),e(95,"Warning"),t(),e(96," Setting "),n(97,"code"),e(98,"synchronize: true"),t(),e(99,` shouldn't be used in production - otherwise you can lose production data.
`),t(),n(100,"p"),e(101,"The "),n(102,"code"),e(103,"forRoot()"),t(),e(104," method supports all the configuration properties exposed by the "),n(105,"code"),e(106,"DataSource"),t(),e(107," constructor from the "),n(108,"a",44),e(109,"TypeORM"),t(),e(110," package. In addition, there are several extra configuration properties described below."),t(),n(111,"table")(112,"tr")(113,"td")(114,"code"),e(115,"retryAttempts"),t()(),n(116,"td"),e(117,"Number of attempts to connect to the database (default: "),n(118,"code"),e(119,"10"),t(),e(120,")"),t()(),n(121,"tr")(122,"td")(123,"code"),e(124,"retryDelay"),t()(),n(125,"td"),e(126,"Delay between connection retry attempts (ms) (default: "),n(127,"code"),e(128,"3000"),t(),e(129,")"),t()(),n(130,"tr")(131,"td")(132,"code"),e(133,"autoLoadEntities"),t()(),n(134,"td"),e(135,"If "),n(136,"code"),e(137,"true"),t(),e(138,", entities will be loaded automatically (default: "),n(139,"code"),e(140,"false"),t(),e(141,")"),t()()(),n(142,"blockquote",45)(143,"strong"),e(144,"Hint"),t(),e(145," Learn more about the data source options "),n(146,"a",46),e(147,"here"),t(),e(148,`.
`),t(),n(149,"p"),e(150,"Once this is done, the TypeORM "),n(151,"code"),e(152,"DataSource"),t(),e(153," and "),n(154,"code"),e(155,"EntityManager"),t(),e(156," objects will be available to inject across the entire project (without needing to import any modules), for example:"),t(),n(157,"app-copy-button",40)(158,"span",41),e(159),s(160,"extension"),o(161,"app-tabs",null,2),t(),n(163,"pre")(164,"code",42),e(165,`
import { DataSource } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
`),t()(),n(166,"pre")(167,"code",42),e(168,`
import { DataSource } from 'typeorm';

@Dependencies(DataSource)
@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }
}
`),t()()(),n(169,"h4",47)(170,"span"),e(171,"Repository pattern"),t()(),n(172,"p")(173,"a",33),e(174,"TypeORM"),t(),e(175," supports the "),n(176,"strong"),e(177,"repository design pattern"),t(),e(178,", so each entity has its own repository. These repositories can be obtained from the database data source."),t(),n(179,"p"),e(180,"To continue the example, we need at least one entity. Let's define the "),n(181,"code"),e(182,"User"),t(),e(183," entity."),t(),n(184,"app-copy-button",40)(185,"span",41),e(186),s(187,"extension"),o(188,"app-tabs",null,3),t(),n(190,"pre")(191,"code",42),e(192,`
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;
}
`),t()()(),n(193,"blockquote",45)(194,"strong"),e(195,"Hint"),t(),e(196," Learn more about entities\xA0in the "),n(197,"a",48),e(198,"TypeORM documentation"),t(),e(199,`.
`),t(),n(200,"p"),e(201,"The "),n(202,"code"),e(203,"User"),t(),e(204," entity file sits in the "),n(205,"code"),e(206,"users"),t(),e(207," directory. This directory contains all files related to the "),n(208,"code"),e(209,"UsersModule"),t(),e(210,". You can decide where to keep your model files, however, we recommend creating them near their "),n(211,"strong"),e(212,"domain"),t(),e(213,", in the corresponding module directory."),t(),n(214,"p"),e(215,"To begin using the "),n(216,"code"),e(217,"User"),t(),e(218," entity, we need to let TypeORM know about it by inserting it into the "),n(219,"code"),e(220,"entities"),t(),e(221," array in the module "),n(222,"code"),e(223,"forRoot()"),t(),e(224," method options (unless you use a static glob path):"),t(),n(225,"app-copy-button",40)(226,"span",41),e(227),s(228,"extension"),o(229,"app-tabs",null,4),t(),n(231,"pre")(232,"code",42),e(233,`
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [User],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
`),t()()(),n(234,"p"),e(235,"Next, let's look at the "),n(236,"code"),e(237,"UsersModule"),t(),e(238,":"),t(),n(239,"app-copy-button",40)(240,"span",41),e(241),s(242,"extension"),o(243,"app-tabs",null,5),t(),n(245,"pre")(246,"code",42),e(247,`
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
`),t()()(),n(248,"p"),e(249,"This module uses the "),n(250,"code"),e(251,"forFeature()"),t(),e(252," method to define which repositories are registered in the current scope. With that in place, we can inject the "),n(253,"code"),e(254,"UsersRepository"),t(),e(255," into the "),n(256,"code"),e(257,"UsersService"),t(),e(258," using the "),n(259,"code"),e(260,"@InjectRepository()"),t(),e(261," decorator:"),t(),n(262,"app-copy-button",40)(263,"span",41),e(264),s(265,"extension"),o(266,"app-tabs",null,6),t(),n(268,"pre")(269,"code",42),e(270,`
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
`),t()(),n(271,"pre")(272,"code",42),e(273,`
import { Injectable, Dependencies } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
@Dependencies(getRepositoryToken(User))
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id) {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id) {
    await this.usersRepository.delete(id);
  }
}
`),t()()(),n(274,"blockquote",43)(275,"strong"),e(276,"Notice"),t(),e(277," Don't forget to import the "),n(278,"code"),e(279,"UsersModule"),t(),e(280," into the root "),n(281,"code"),e(282,"AppModule"),t(),e(283,`.
`),t(),n(284,"p"),e(285,"If you want to use the repository outside of the module which imports "),n(286,"code"),e(287,"TypeOrmModule.forFeature"),t(),e(288,`, you'll need to re-export the providers generated by it.
You can do this by exporting the whole module, like this:`),t(),n(289,"app-copy-button",40)(290,"span",41),e(291),s(292,"extension"),o(293,"app-tabs",null,7),t(),n(295,"pre")(296,"code",42),e(297,`
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule]
})
export class UsersModule {}
`),t()()(),n(298,"p"),e(299,"Now if we import "),n(300,"code"),e(301,"UsersModule"),t(),e(302," in "),n(303,"code"),e(304,"UserHttpModule"),t(),e(305,", we can use "),n(306,"code"),e(307,"@InjectRepository(User)"),t(),e(308," in the providers of the latter module."),t(),n(309,"app-copy-button",40)(310,"span",41),e(311),s(312,"extension"),o(313,"app-tabs",null,8),t(),n(315,"pre")(316,"code",42),e(317,`
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [UsersModule],
  providers: [UsersService],
  controllers: [UsersController]
})
export class UserHttpModule {}
`),t()()(),n(318,"h4",49)(319,"span"),e(320,"Relations"),t()(),n(321,"p"),e(322,"Relations are associations established between two or more tables. Relations are based on common fields from each table, often involving primary and foreign keys."),t(),n(323,"p"),e(324,"There are three types of relations:"),t(),n(325,"table")(326,"tr")(327,"td")(328,"code"),e(329,"One-to-one"),t()(),n(330,"td"),e(331,"Every row in the primary table has one and only one associated row in the foreign table. Use the "),n(332,"code"),e(333,"@OneToOne()"),t(),e(334," decorator to define this type of relation."),t()(),n(335,"tr")(336,"td")(337,"code"),e(338,"One-to-many / Many-to-one"),t()(),n(339,"td"),e(340,"Every row in the primary table has one or more related rows in the foreign table. Use the "),n(341,"code"),e(342,"@OneToMany()"),t(),e(343," and "),n(344,"code"),e(345,"@ManyToOne()"),t(),e(346," decorators to define this type of relation."),t()(),n(347,"tr")(348,"td")(349,"code"),e(350,"Many-to-many"),t()(),n(351,"td"),e(352,"Every row in the primary table has many related rows in the foreign table, and every record in the foreign table has many related rows in the primary table. Use the "),n(353,"code"),e(354,"@ManyToMany()"),t(),e(355," decorator to define this type of relation."),t()()(),n(356,"p"),e(357,"To define relations in entities, use the corresponding "),n(358,"strong"),e(359,"decorators"),t(),e(360,". For example, to define that each "),n(361,"code"),e(362,"User"),t(),e(363," can have multiple photos, use the "),n(364,"code"),e(365,"@OneToMany()"),t(),e(366," decorator."),t(),n(367,"app-copy-button",40)(368,"span",41),e(369),s(370,"extension"),o(371,"app-tabs",null,9),t(),n(373,"pre")(374,"code",42),e(375,`
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Photo } from '../photos/photo.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(type => Photo, photo => photo.user)
  photos: Photo[];
}
`),t()()(),n(376,"blockquote",45)(377,"strong"),e(378,"Hint"),t(),e(379," To learn more about relations in TypeORM, visit the "),n(380,"a",50),e(381,"TypeORM documentation"),t(),e(382,`.
`),t(),n(383,"h4",51)(384,"span"),e(385,"Auto-load entities"),t()(),n(386,"p"),e(387,"Manually adding entities to the "),n(388,"code"),e(389,"entities"),t(),e(390," array of the data source options can be tedious. In addition, referencing entities from the root module breaks application domain boundaries and causes leaking implementation details to other parts of the application. To address this issue, an alternative solution is provided. To automatically load entities, set the "),n(391,"code"),e(392,"autoLoadEntities"),t(),e(393," property of the configuration object (passed into the "),n(394,"code"),e(395,"forRoot()"),t(),e(396," method) to "),n(397,"code"),e(398,"true"),t(),e(399,", as shown below:"),t(),n(400,"app-copy-button",40)(401,"span",41),e(402),s(403,"extension"),o(404,"app-tabs",null,10),t(),n(406,"pre")(407,"code",42),e(408,`
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
`),t()()(),n(409,"p"),e(410,"With that option specified, every entity registered through the "),n(411,"code"),e(412,"forFeature()"),t(),e(413," method will be automatically added to the "),n(414,"code"),e(415,"entities"),t(),e(416," array of the configuration object."),t(),n(417,"blockquote",43)(418,"strong"),e(419,"Warning"),t(),e(420," Note that entities that aren't registered through the "),n(421,"code"),e(422,"forFeature()"),t(),e(423," method, but are only referenced from the entity (via a relationship), won't be included by way of the "),n(424,"code"),e(425,"autoLoadEntities"),t(),e(426,` setting.
`),t(),n(427,"h4",52)(428,"span"),e(429,"Separating entity definition"),t()(),n(430,"p"),e(431,"You can define an entity and its columns right in the model, using decorators. But some people prefer to define entities and their columns inside separate files using the "),n(432,"a",53),e(433,'"entity schemas"'),t(),e(434,"."),t(),n(435,"app-copy-button")(436,"pre")(437,"code",42),e(438,`
import { EntitySchema } from 'typeorm';
import { User } from './user.entity';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  relations: {
    photos: {
      type: 'one-to-many',
      target: 'Photo', // the name of the PhotoSchema
    },
  },
});
`),t()()(),n(439,"blockquote",54)(440,"strong"),e(441,"Warning"),t(),e(442," If you provide the "),n(443,"code"),e(444,"target"),t(),e(445," option, the "),n(446,"code"),e(447,"name"),t(),e(448,` option value has to be the same as the name of the target class.
If you do not provide the `),n(449,"code"),e(450,"target"),t(),e(451,` you can use any name.
`),t(),n(452,"p"),e(453,"Nest allows you to use an "),n(454,"code"),e(455,"EntitySchema"),t(),e(456," instance wherever an "),n(457,"code"),e(458,"Entity"),t(),e(459," is expected, for example:"),t(),n(460,"app-copy-button")(461,"pre")(462,"code",42),e(463,`
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSchema])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
`),t()()(),n(464,"h4",55)(465,"span"),e(466,"TypeORM Transactions"),t()(),n(467,"p"),e(468,"A database transaction symbolizes a unit of work performed within a database management system against a database, and treated in a coherent and reliable way independent of other transactions. A transaction generally represents any change in a database ("),n(469,"a",56),e(470,"learn more"),t(),e(471,")."),t(),n(472,"p"),e(473,"There are many different strategies to handle "),n(474,"a",57),e(475,"TypeORM transactions"),t(),e(476,". We recommend using the "),n(477,"code"),e(478,"QueryRunner"),t(),e(479," class because it gives full control over the transaction."),t(),n(480,"p"),e(481,"First, we need to inject the "),n(482,"code"),e(483,"DataSource"),t(),e(484," object into a class in the normal way:"),t(),n(485,"app-copy-button")(486,"pre")(487,"code",42),e(488,`
@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}
}
`),t()()(),n(489,"blockquote",45)(490,"strong"),e(491,"Hint"),t(),e(492," The "),n(493,"code"),e(494,"DataSource"),t(),e(495," class is imported from the "),n(496,"code"),e(497,"typeorm"),t(),e(498,` package.
`),t(),n(499,"p"),e(500,"Now, we can use this object to create a transaction."),t(),n(501,"app-copy-button")(502,"pre")(503,"code",42),e(504,`
async createMany(users: User[]) {
  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.manager.save(users[0]);
    await queryRunner.manager.save(users[1]);

    await queryRunner.commitTransaction();
  } catch (err) {
    // since we have errors lets rollback the changes we made
    await queryRunner.rollbackTransaction();
  } finally {
    // you need to release a queryRunner which was manually instantiated
    await queryRunner.release();
  }
}
`),t()()(),n(505,"blockquote",45)(506,"strong"),e(507,"Hint"),t(),e(508," Note that the "),n(509,"code"),e(510,"dataSource"),t(),e(511," is used only to create the "),n(512,"code"),e(513,"QueryRunner"),t(),e(514,". However, to test this class would require mocking the entire "),n(515,"code"),e(516,"DataSource"),t(),e(517," object (which exposes several methods). Thus, we recommend using a helper factory class (e.g., "),n(518,"code"),e(519,"QueryRunnerFactory"),t(),e(520,`) and defining an interface with a limited set of methods required to maintain transactions. This technique makes mocking these methods pretty straightforward.
`),t(),n(521,"p"),o(522,"app-banner-devtools"),t(),n(523,"p"),e(524,"Alternatively, you can use the callback-style approach with the "),n(525,"code"),e(526,"transaction"),t(),e(527," method of the "),n(528,"code"),e(529,"DataSource"),t(),e(530," object ("),n(531,"a",58),e(532,"read more"),t(),e(533,")."),t(),n(534,"app-copy-button")(535,"pre")(536,"code",42),e(537,`
async createMany(users: User[]) {
  await this.dataSource.transaction(async manager => {
    await manager.save(users[0]);
    await manager.save(users[1]);
  });
}
`),t()()(),n(538,"h4",59)(539,"span"),e(540,"Subscribers"),t()(),n(541,"p"),e(542,"With TypeORM "),n(543,"a",60),e(544,"subscribers"),t(),e(545,", you can listen to specific entity events."),t(),n(546,"app-copy-button")(547,"pre")(548,"code",42),e(549,`
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { User } from './user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log(\`BEFORE USER INSERTED: \`, event.entity);
  }
}
`),t()()(),n(550,"blockquote",61)(551,"strong"),e(552,"Warning"),t(),e(553," Event subscribers can not be "),n(554,"a",62),e(555,"request-scoped"),t(),e(556,`.
`),t(),n(557,"p"),e(558,"Now, add the "),n(559,"code"),e(560,"UserSubscriber"),t(),e(561," class to the "),n(562,"code"),e(563,"providers"),t(),e(564," array:"),t(),n(565,"app-copy-button")(566,"pre")(567,"code",42),e(568,`
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserSubscriber } from './user.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UserSubscriber],
  controllers: [UsersController],
})
export class UsersModule {}
`),t()()(),n(569,"h4",63)(570,"span"),e(571,"Migrations"),t()(),n(572,"p")(573,"a",64),e(574,"Migrations"),t(),e(575," provide a way to incrementally update the database schema to keep it in sync with the application's data model while preserving existing data in the database. To generate, run, and revert migrations, TypeORM provides a dedicated "),n(576,"a",65),e(577,"CLI"),t(),e(578,"."),t(),n(579,"p"),e(580,"Migration classes are separate from the Nest application source code. Their lifecycle is maintained by the TypeORM CLI. Therefore, you are not able to leverage dependency injection and other Nest specific features with migrations. To learn more about migrations, follow the guide in the "),n(581,"a",64),e(582,"TypeORM documentation"),t(),e(583,"."),t(),n(584,"h4",66)(585,"span"),e(586,"Multiple databases"),t()(),n(587,"p"),e(588,"Some projects require multiple database connections. This can also be achieved with this module. To work with multiple connections, first create the connections. In this case, data source naming becomes "),n(589,"strong"),e(590,"mandatory"),t(),e(591,"."),t(),n(592,"p"),e(593,"Suppose you have an "),n(594,"code"),e(595,"Album"),t(),e(596," entity stored in its own database."),t(),n(597,"app-copy-button")(598,"pre")(599,"code",42),e(600,`
const defaultOptions = {
  type: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...defaultOptions,
      host: 'user_db_host',
      entities: [User],
    }),
    TypeOrmModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      entities: [Album],
    }),
  ],
})
export class AppModule {}
`),t()()(),n(601,"blockquote",43)(602,"strong"),e(603,"Notice"),t(),e(604," If you don't set the "),n(605,"code"),e(606,"name"),t(),e(607," for a data source, its name is set to "),n(608,"code"),e(609,"default"),t(),e(610,`. Please note that you shouldn't have multiple connections without a name, or with the same name, otherwise they will get overridden.
`),t(),n(611,"blockquote",43)(612,"strong"),e(613,"Notice"),t(),e(614," If you are using "),n(615,"code"),e(616,"TypeOrmModule.forRootAsync"),t(),e(617,", you have to "),n(618,"strong"),e(619,"also"),t(),e(620," set the data source name outside "),n(621,"code"),e(622,"useFactory"),t(),e(623,`. For example:
`),n(624,"app-copy-button")(625,"pre")(626,"code",42),e(627,`
TypeOrmModule.forRootAsync({
  name: 'albumsConnection',
  useFactory: ...,
  inject: ...,
}),
`),t()()(),n(628,"p"),e(629,"See "),n(630,"a",67),e(631,"this issue"),t(),e(632," for more details."),t()(),n(633,"p"),e(634,"At this point, you have "),n(635,"code"),e(636,"User"),t(),e(637," and "),n(638,"code"),e(639,"Album"),t(),e(640," entities registered with their own data source. With this setup, you have to tell the "),n(641,"code"),e(642,"TypeOrmModule.forFeature()"),t(),e(643," method and the "),n(644,"code"),e(645,"@InjectRepository()"),t(),e(646," decorator which data source should be used. If you do not pass any data source name, the "),n(647,"code"),e(648,"default"),t(),e(649," data source is used."),t(),n(650,"app-copy-button")(651,"pre")(652,"code",42),e(653,`
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Album], 'albumsConnection'),
  ],
})
export class AppModule {}
`),t()()(),n(654,"p"),e(655,"You can also inject the "),n(656,"code"),e(657,"DataSource"),t(),e(658," or "),n(659,"code"),e(660,"EntityManager"),t(),e(661," for a given data source:"),t(),n(662,"app-copy-button")(663,"pre")(664,"code",42),e(665,`
@Injectable()
export class AlbumsService {
  constructor(
    @InjectDataSource('albumsConnection')
    private dataSource: DataSource,
    @InjectEntityManager('albumsConnection')
    private entityManager: EntityManager,
  ) {}
}
`),t()()(),n(666,"p"),e(667,"It's also possible to inject any "),n(668,"code"),e(669,"DataSource"),t(),e(670," to the providers:"),t(),n(671,"app-copy-button")(672,"pre")(673,"code",42),e(674,`
@Module({
  providers: [
    {
      provide: AlbumsService,
      useFactory: (albumsConnection: DataSource) => {
        return new AlbumsService(albumsConnection);
      },
      inject: [getDataSourceToken('albumsConnection')],
    },
  ],
})
export class AlbumsModule {}
`),t()()(),n(675,"h4",68)(676,"span"),e(677,"Testing"),t()(),n(678,"p"),e(679,"When it comes to unit testing an application, we usually want to avoid making a database connection, keeping our test suites independent and their execution process as fast as possible. But our classes might depend on repositories that are pulled from the data source (connection) instance. How do we handle that? The solution is to create mock repositories. In order to achieve that, we set up "),n(680,"a",69),e(681,"custom providers"),t(),e(682,". Each registered repository is automatically represented by an "),n(683,"code"),e(684,"<EntityName>Repository"),t(),e(685," token, where "),n(686,"code"),e(687,"EntityName"),t(),e(688," is the name of your entity class."),t(),n(689,"p"),e(690,"The "),n(691,"code"),e(692,"@nestjs/typeorm"),t(),e(693," package exposes the "),n(694,"code"),e(695,"getRepositoryToken()"),t(),e(696," function which returns a prepared token based on a given entity."),t(),n(697,"app-copy-button")(698,"pre")(699,"code",42),e(700,`
@Module({
  providers: [
    UsersService,
    {
      provide: getRepositoryToken(User),
      useValue: mockRepository,
    },
  ],
})
export class UsersModule {}
`),t()()(),n(701,"p"),e(702,"Now a substitute "),n(703,"code"),e(704,"mockRepository"),t(),e(705," will be used as the "),n(706,"code"),e(707,"UsersRepository"),t(),e(708,". Whenever any class asks for "),n(709,"code"),e(710,"UsersRepository"),t(),e(711," using an "),n(712,"code"),e(713,"@InjectRepository()"),t(),e(714," decorator, Nest will use the registered "),n(715,"code"),e(716,"mockRepository"),t(),e(717," object."),t(),n(718,"h4",70)(719,"span"),e(720,"Async configuration"),t()(),n(721,"p"),e(722,"You may want to pass your repository module options asynchronously instead of statically. In this case, use the "),n(723,"code"),e(724,"forRootAsync()"),t(),e(725," method, which provides several ways to deal with async configuration."),t(),n(726,"p"),e(727,"One approach is to use a factory function:"),t(),n(728,"app-copy-button")(729,"pre")(730,"code",42),e(731,`
TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    entities: [],
    synchronize: true,
  }),
});
`),t()()(),n(732,"p"),e(733,"Our factory behaves like any other "),n(734,"a",71),e(735,"asynchronous provider"),t(),e(736," (e.g., it can be "),n(737,"code"),e(738,"async"),t(),e(739," and it's able to inject dependencies through "),n(740,"code"),e(741,"inject"),t(),e(742,")."),t(),n(743,"app-copy-button")(744,"pre")(745,"code",42),e(746,`
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  inject: [ConfigService],
});
`),t()()(),n(747,"p"),e(748,"Alternatively, you can use the "),n(749,"code"),e(750,"useClass"),t(),e(751," syntax:"),t(),n(752,"app-copy-button")(753,"pre")(754,"code",42),e(755,`
TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
});
`),t()()(),n(756,"p"),e(757,"The construction above will instantiate "),n(758,"code"),e(759,"TypeOrmConfigService"),t(),e(760," inside "),n(761,"code"),e(762,"TypeOrmModule"),t(),e(763," and use it to provide an options object by calling "),n(764,"code"),e(765,"createTypeOrmOptions()"),t(),e(766,". Note that this means that the "),n(767,"code"),e(768,"TypeOrmConfigService"),t(),e(769," has to implement the "),n(770,"code"),e(771,"TypeOrmOptionsFactory"),t(),e(772," interface, as shown below:"),t(),n(773,"app-copy-button")(774,"pre")(775,"code",42),e(776,`
@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    };
  }
}
`),t()()(),n(777,"p"),e(778,"In order to prevent the creation of "),n(779,"code"),e(780,"TypeOrmConfigService"),t(),e(781," inside "),n(782,"code"),e(783,"TypeOrmModule"),t(),e(784," and use a provider imported from a different module, you can use the "),n(785,"code"),e(786,"useExisting"),t(),e(787," syntax."),t(),n(788,"app-copy-button")(789,"pre")(790,"code",42),e(791,`
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
`),t()()(),n(792,"p"),e(793,"This construction works the same as "),n(794,"code"),e(795,"useClass"),t(),e(796," with one critical difference - "),n(797,"code"),e(798,"TypeOrmModule"),t(),e(799," will lookup imported modules to reuse an existing "),n(800,"code"),e(801,"ConfigService"),t(),e(802," instead of instantiating a new one."),t(),n(803,"blockquote",45)(804,"strong"),e(805,"Hint"),t(),e(806," Make sure that the "),n(807,"code"),e(808,"name"),t(),e(809," property is defined at the same level as the "),n(810,"code"),e(811,"useFactory"),t(),e(812,", "),n(813,"code"),e(814,"useClass"),t(),e(815,", or "),n(816,"code"),e(817,"useValue"),t(),e(818,` property. This will allow Nest to properly register the data source under the appropriate injection token.
`),t(),n(819,"h4",72)(820,"span"),e(821,"Custom DataSource Factory"),t()(),n(822,"p"),e(823,"In conjunction with async configuration using "),n(824,"code"),e(825,"useFactory"),t(),e(826,", "),n(827,"code"),e(828,"useClass"),t(),e(829,", or "),n(830,"code"),e(831,"useExisting"),t(),e(832,", you can optionally specify a "),n(833,"code"),e(834,"dataSourceFactory"),t(),e(835," function which will allow you to provide your own TypeORM data source rather than allowing "),n(836,"code"),e(837,"TypeOrmModule"),t(),e(838," to create the data source."),t(),n(839,"p")(840,"code"),e(841,"dataSourceFactory"),t(),e(842," receives the TypeORM "),n(843,"code"),e(844,"DataSourceOptions"),t(),e(845," configured during async configuration using "),n(846,"code"),e(847,"useFactory"),t(),e(848,", "),n(849,"code"),e(850,"useClass"),t(),e(851,", or "),n(852,"code"),e(853,"useExisting"),t(),e(854," and returns a "),n(855,"code"),e(856,"Promise"),t(),e(857," that resolves a TypeORM "),n(858,"code"),e(859,"DataSource"),t(),e(860,"."),t(),n(861,"app-copy-button")(862,"pre")(863,"code",42),e(864,`
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  // Use useFactory, useClass, or useExisting
  // to configure the DataSourceOptions.
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  // dataSource receives the configured DataSourceOptions
  // and returns a Promise<DataSource>.
  dataSourceFactory: async (options) => {
    const dataSource = await new DataSource(options).initialize();
    return dataSource;
  },
});
`),t()()(),n(865,"blockquote",45)(866,"strong"),e(867,"Hint"),t(),e(868," The "),n(869,"code"),e(870,"DataSource"),t(),e(871," class is imported from the "),n(872,"code"),e(873,"typeorm"),t(),e(874,` package.
`),t(),n(875,"h4",73)(876,"span"),e(877,"Example"),t()(),n(878,"p"),e(879,"A working example is available "),n(880,"a",74),e(881,"here"),t(),e(882,"."),t(),n(883,"p"),o(884,"app-banner-enterprise"),t(),n(885,"h3",75),e(886,"Sequelize Integration"),t(),n(887,"p"),e(888,"An alternative to using TypeORM is to use the "),n(889,"a",29),e(890,"Sequelize"),t(),e(891," ORM with the "),n(892,"code"),e(893,"@nestjs/sequelize"),t(),e(894," package. In addition, we leverage the "),n(895,"a",76),e(896,"sequelize-typescript"),t(),e(897," package which provides a set of additional decorators to declaratively define entities."),t(),n(898,"p"),e(899,"To begin using it, we first install the required dependencies. In this chapter, we'll demonstrate using the popular "),n(900,"a",38),e(901,"MySQL"),t(),e(902," Relational DBMS, but Sequelize provides support for many relational databases, such as PostgreSQL, MySQL, Microsoft SQL Server, SQLite, and MariaDB. The procedure we walk through in this chapter will be the same for any database supported by Sequelize. You'll simply need to install the associated client API libraries for your selected database."),t(),n(903,"pre")(904,"code",39),e(905,`
$ npm install --save @nestjs/sequelize sequelize sequelize-typescript mysql2
$ npm install --save-dev @types/sequelize
`),t()(),n(906,"p"),e(907,"Once the installation process is complete, we can import the "),n(908,"code"),e(909,"SequelizeModule"),t(),e(910," into the root "),n(911,"code"),e(912,"AppModule"),t(),e(913,"."),t(),n(914,"app-copy-button",40)(915,"span",41),e(916),s(917,"extension"),o(918,"app-tabs",null,11),t(),n(920,"pre")(921,"code",42),e(922,`
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [],
    }),
  ],
})
export class AppModule {}
`),t()()(),n(923,"p"),e(924,"The "),n(925,"code"),e(926,"forRoot()"),t(),e(927," method supports all the configuration properties exposed by the Sequelize constructor ("),n(928,"a",77),e(929,"read more"),t(),e(930,"). In addition, there are several extra configuration properties described below."),t(),n(931,"table")(932,"tr")(933,"td")(934,"code"),e(935,"retryAttempts"),t()(),n(936,"td"),e(937,"Number of attempts to connect to the database (default: "),n(938,"code"),e(939,"10"),t(),e(940,")"),t()(),n(941,"tr")(942,"td")(943,"code"),e(944,"retryDelay"),t()(),n(945,"td"),e(946,"Delay between connection retry attempts (ms) (default: "),n(947,"code"),e(948,"3000"),t(),e(949,")"),t()(),n(950,"tr")(951,"td")(952,"code"),e(953,"autoLoadModels"),t()(),n(954,"td"),e(955,"If "),n(956,"code"),e(957,"true"),t(),e(958,", models will be loaded automatically (default: "),n(959,"code"),e(960,"false"),t(),e(961,")"),t()(),n(962,"tr")(963,"td")(964,"code"),e(965,"keepConnectionAlive"),t()(),n(966,"td"),e(967,"If "),n(968,"code"),e(969,"true"),t(),e(970,", connection will not be closed on the application shutdown (default: "),n(971,"code"),e(972,"false"),t(),e(973,")"),t()(),n(974,"tr")(975,"td")(976,"code"),e(977,"synchronize"),t()(),n(978,"td"),e(979,"If "),n(980,"code"),e(981,"true"),t(),e(982,", automatically loaded models will be synchronized (default: "),n(983,"code"),e(984,"true"),t(),e(985,")"),t()()(),n(986,"p"),e(987,"Once this is done, the "),n(988,"code"),e(989,"Sequelize"),t(),e(990," object will be available to inject across the entire project (without needing to import any modules), for example:"),t(),n(991,"app-copy-button",40)(992,"span",41),e(993),s(994,"extension"),o(995,"app-tabs",null,12),t(),n(997,"pre")(998,"code",42),e(999,`
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AppService {
  constructor(private sequelize: Sequelize) {}
}
`),t()(),n(1e3,"pre")(1001,"code",42),e(1002,`
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Dependencies(Sequelize)
@Injectable()
export class AppService {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }
}
`),t()()(),n(1003,"h4",78)(1004,"span"),e(1005,"Models"),t()(),n(1006,"p"),e(1007,"Sequelize implements the Active Record pattern. With this pattern, you use model classes directly to interact with the database. To continue the example, we need at least one model. Let's define the "),n(1008,"code"),e(1009,"User"),t(),e(1010," model."),t(),n(1011,"app-copy-button",40)(1012,"span",41),e(1013),s(1014,"extension"),o(1015,"app-tabs",null,13),t(),n(1017,"pre")(1018,"code",42),e(1019,`
import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class User extends Model {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ defaultValue: true })
  isActive: boolean;
}
`),t()()(),n(1020,"blockquote",45)(1021,"strong"),e(1022,"Hint"),t(),e(1023," Learn more about the available decorators "),n(1024,"a",79),e(1025,"here"),t(),e(1026,`.
`),t(),n(1027,"p"),e(1028,"The "),n(1029,"code"),e(1030,"User"),t(),e(1031," model file sits in the "),n(1032,"code"),e(1033,"users"),t(),e(1034," directory. This directory contains all files related to the "),n(1035,"code"),e(1036,"UsersModule"),t(),e(1037,". You can decide where to keep your model files, however, we recommend creating them near their "),n(1038,"strong"),e(1039,"domain"),t(),e(1040,", in the corresponding module directory."),t(),n(1041,"p"),e(1042,"To begin using the "),n(1043,"code"),e(1044,"User"),t(),e(1045," model, we need to let Sequelize know about it by inserting it into the "),n(1046,"code"),e(1047,"models"),t(),e(1048," array in the module "),n(1049,"code"),e(1050,"forRoot()"),t(),e(1051," method options:"),t(),n(1052,"app-copy-button",40)(1053,"span",41),e(1054),s(1055,"extension"),o(1056,"app-tabs",null,14),t(),n(1058,"pre")(1059,"code",42),e(1060,`
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './users/user.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [User],
    }),
  ],
})
export class AppModule {}
`),t()()(),n(1061,"p"),e(1062,"Next, let's look at the "),n(1063,"code"),e(1064,"UsersModule"),t(),e(1065,":"),t(),n(1066,"app-copy-button",40)(1067,"span",41),e(1068),s(1069,"extension"),o(1070,"app-tabs",null,15),t(),n(1072,"pre")(1073,"code",42),e(1074,`
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
`),t()()(),n(1075,"p"),e(1076,"This module uses the "),n(1077,"code"),e(1078,"forFeature()"),t(),e(1079," method to define which models are registered in the current scope. With that in place, we can inject the "),n(1080,"code"),e(1081,"UserModel"),t(),e(1082," into the "),n(1083,"code"),e(1084,"UsersService"),t(),e(1085," using the "),n(1086,"code"),e(1087,"@InjectModel()"),t(),e(1088," decorator:"),t(),n(1089,"app-copy-button",40)(1090,"span",41),e(1091),s(1092,"extension"),o(1093,"app-tabs",null,16),t(),n(1095,"pre")(1096,"code",42),e(1097,`
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  findOne(id: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
`),t()(),n(1098,"pre")(1099,"code",42),e(1100,`
import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
@Dependencies(getModelToken(User))
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async findAll() {
    return this.userModel.findAll();
  }

  findOne(id) {
    return this.userModel.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id) {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
`),t()()(),n(1101,"blockquote",43)(1102,"strong"),e(1103,"Notice"),t(),e(1104," Don't forget to import the "),n(1105,"code"),e(1106,"UsersModule"),t(),e(1107," into the root "),n(1108,"code"),e(1109,"AppModule"),t(),e(1110,`.
`),t(),n(1111,"p"),e(1112,"If you want to use the model outside of the module which imports "),n(1113,"code"),e(1114,"SequelizeModule.forFeature"),t(),e(1115,`, you'll need to re-export the providers generated by it.
You can do this by exporting the whole module, like this:`),t(),n(1116,"app-copy-button",40)(1117,"span",41),e(1118),s(1119,"extension"),o(1120,"app-tabs",null,17),t(),n(1122,"pre")(1123,"code",42),e(1124,`
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.entity';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  exports: [SequelizeModule]
})
export class UsersModule {}
`),t()()(),n(1125,"p"),e(1126,"Now if we import "),n(1127,"code"),e(1128,"UsersModule"),t(),e(1129," in "),n(1130,"code"),e(1131,"UserHttpModule"),t(),e(1132,", we can use "),n(1133,"code"),e(1134,"@InjectModel(User)"),t(),e(1135," in the providers of the latter module."),t(),n(1136,"app-copy-button",40)(1137,"span",41),e(1138),s(1139,"extension"),o(1140,"app-tabs",null,18),t(),n(1142,"pre")(1143,"code",42),e(1144,`
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [UsersModule],
  providers: [UsersService],
  controllers: [UsersController]
})
export class UserHttpModule {}
`),t()()(),n(1145,"h4",80)(1146,"span"),e(1147,"Relations"),t()(),n(1148,"p"),e(1149,"Relations are associations established between two or more tables. Relations are based on common fields from each table, often involving primary and foreign keys."),t(),n(1150,"p"),e(1151,"There are three types of relations:"),t(),n(1152,"table")(1153,"tr")(1154,"td")(1155,"code"),e(1156,"One-to-one"),t()(),n(1157,"td"),e(1158,"Every row in the primary table has one and only one associated row in the foreign table"),t()(),n(1159,"tr")(1160,"td")(1161,"code"),e(1162,"One-to-many / Many-to-one"),t()(),n(1163,"td"),e(1164,"Every row in the primary table has one or more related rows in the foreign table"),t()(),n(1165,"tr")(1166,"td")(1167,"code"),e(1168,"Many-to-many"),t()(),n(1169,"td"),e(1170,"Every row in the primary table has many related rows in the foreign table, and every record in the foreign table has many related rows in the primary table"),t()()(),n(1171,"p"),e(1172,"To define relations in models, use the corresponding "),n(1173,"strong"),e(1174,"decorators"),t(),e(1175,". For example, to define that each "),n(1176,"code"),e(1177,"User"),t(),e(1178," can have multiple photos, use the "),n(1179,"code"),e(1180,"@HasMany()"),t(),e(1181," decorator."),t(),n(1182,"app-copy-button",40)(1183,"span",41),e(1184),s(1185,"extension"),o(1186,"app-tabs",null,19),t(),n(1188,"pre")(1189,"code",42),e(1190,`
import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Photo } from '../photos/photo.model';

@Table
export class User extends Model {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ defaultValue: true })
  isActive: boolean;

  @HasMany(() => Photo)
  photos: Photo[];
}
`),t()()(),n(1191,"blockquote",45)(1192,"strong"),e(1193,"Hint"),t(),e(1194," To learn more about associations in Sequelize, read "),n(1195,"a",81),e(1196,"this"),t(),e(1197,` chapter.
`),t(),n(1198,"h4",82)(1199,"span"),e(1200,"Auto-load models"),t()(),n(1201,"p"),e(1202,"Manually adding models to the "),n(1203,"code"),e(1204,"models"),t(),e(1205," array of the connection options can be tedious. In addition, referencing models from the root module breaks application domain boundaries and causes leaking implementation details to other parts of the application. To solve this issue, automatically load models by setting both "),n(1206,"code"),e(1207,"autoLoadModels"),t(),e(1208," and "),n(1209,"code"),e(1210,"synchronize"),t(),e(1211," properties of the configuration object (passed into the "),n(1212,"code"),e(1213,"forRoot()"),t(),e(1214," method) to "),n(1215,"code"),e(1216,"true"),t(),e(1217,", as shown below:"),t(),n(1218,"app-copy-button",40)(1219,"span",41),e(1220),s(1221,"extension"),o(1222,"app-tabs",null,20),t(),n(1224,"pre")(1225,"code",42),e(1226,`
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...
      autoLoadModels: true,
      synchronize: true,
    }),
  ],
})
export class AppModule {}
`),t()()(),n(1227,"p"),e(1228,"With that option specified, every model registered through the "),n(1229,"code"),e(1230,"forFeature()"),t(),e(1231," method will be automatically added to the "),n(1232,"code"),e(1233,"models"),t(),e(1234," array of the configuration object."),t(),n(1235,"blockquote",43)(1236,"strong"),e(1237,"Warning"),t(),e(1238," Note that models that aren't registered through the "),n(1239,"code"),e(1240,"forFeature()"),t(),e(1241,` method, but are only referenced from the model (via an association), won't be included.
`),t(),n(1242,"h4",83)(1243,"span"),e(1244,"Sequelize Transactions"),t()(),n(1245,"p"),e(1246,"A database transaction symbolizes a unit of work performed within a database management system against a database, and treated in a coherent and reliable way independent of other transactions. A transaction generally represents any change in a database ("),n(1247,"a",56),e(1248,"learn more"),t(),e(1249,")."),t(),n(1250,"p"),e(1251,"There are many different strategies to handle "),n(1252,"a",84),e(1253,"Sequelize transactions"),t(),e(1254,". Below is a sample implementation of a managed transaction (auto-callback)."),t(),n(1255,"p"),e(1256,"First, we need to inject the "),n(1257,"code"),e(1258,"Sequelize"),t(),e(1259," object into a class in the normal way:"),t(),n(1260,"app-copy-button")(1261,"pre")(1262,"code",42),e(1263,`
@Injectable()
export class UsersService {
  constructor(private sequelize: Sequelize) {}
}
`),t()()(),n(1264,"blockquote",45)(1265,"strong"),e(1266,"Hint"),t(),e(1267," The "),n(1268,"code"),e(1269,"Sequelize"),t(),e(1270," class is imported from the "),n(1271,"code"),e(1272,"sequelize-typescript"),t(),e(1273,` package.
`),t(),n(1274,"p"),e(1275,"Now, we can use this object to create a transaction."),t(),n(1276,"app-copy-button")(1277,"pre")(1278,"code",42),e(1279,`
async createMany() {
  try {
    await this.sequelize.transaction(async t => {
      const transactionHost = { transaction: t };

      await this.userModel.create(
          { firstName: 'Abraham', lastName: 'Lincoln' },
          transactionHost,
      );
      await this.userModel.create(
          { firstName: 'John', lastName: 'Boothe' },
          transactionHost,
      );
    });
  } catch (err) {
    // Transaction has been rolled back
    // err is whatever rejected the promise chain returned to the transaction callback
  }
}
`),t()()(),n(1280,"blockquote",45)(1281,"strong"),e(1282,"Hint"),t(),e(1283," Note that the "),n(1284,"code"),e(1285,"Sequelize"),t(),e(1286," instance is used only to start the transaction. However, to test this class would require mocking the entire "),n(1287,"code"),e(1288,"Sequelize"),t(),e(1289," object (which exposes several methods). Thus, we recommend using a helper factory class (e.g., "),n(1290,"code"),e(1291,"TransactionRunner"),t(),e(1292,`) and defining an interface with a limited set of methods required to maintain transactions. This technique makes mocking these methods pretty straightforward.
`),t(),n(1293,"h4",85)(1294,"span"),e(1295,"Migrations"),t()(),n(1296,"p")(1297,"a",86),e(1298,"Migrations"),t(),e(1299," provide a way to incrementally update the database schema to keep it in sync with the application's data model while preserving existing data in the database. To generate, run, and revert migrations, Sequelize provides a dedicated "),n(1300,"a",87),e(1301,"CLI"),t(),e(1302,"."),t(),n(1303,"p"),e(1304,"Migration classes are separate from the Nest application source code. Their lifecycle is maintained by the Sequelize CLI. Therefore, you are not able to leverage dependency injection and other Nest specific features with migrations. To learn more about migrations, follow the guide in the "),n(1305,"a",87),e(1306,"Sequelize documentation"),t(),e(1307,"."),t(),n(1308,"p"),o(1309,"app-banner-courses"),t(),n(1310,"h4",88)(1311,"span"),e(1312,"Multiple databases"),t()(),n(1313,"p"),e(1314,"Some projects require multiple database connections. This can also be achieved with this module. To work with multiple connections, first create the connections. In this case, connection naming becomes "),n(1315,"strong"),e(1316,"mandatory"),t(),e(1317,"."),t(),n(1318,"p"),e(1319,"Suppose you have an "),n(1320,"code"),e(1321,"Album"),t(),e(1322," entity stored in its own database."),t(),n(1323,"app-copy-button")(1324,"pre")(1325,"code",42),e(1326,`
const defaultOptions = {
  dialect: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...defaultOptions,
      host: 'user_db_host',
      models: [User],
    }),
    SequelizeModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      models: [Album],
    }),
  ],
})
export class AppModule {}
`),t()()(),n(1327,"blockquote",43)(1328,"strong"),e(1329,"Notice"),t(),e(1330," If you don't set the "),n(1331,"code"),e(1332,"name"),t(),e(1333," for a connection, its name is set to "),n(1334,"code"),e(1335,"default"),t(),e(1336,`. Please note that you shouldn't have multiple connections without a name, or with the same name, otherwise they will get overridden.
`),t(),n(1337,"p"),e(1338,"At this point, you have "),n(1339,"code"),e(1340,"User"),t(),e(1341," and "),n(1342,"code"),e(1343,"Album"),t(),e(1344," models registered with their own connection. With this setup, you have to tell the "),n(1345,"code"),e(1346,"SequelizeModule.forFeature()"),t(),e(1347," method and the "),n(1348,"code"),e(1349,"@InjectModel()"),t(),e(1350," decorator which connection should be used. If you do not pass any connection name, the "),n(1351,"code"),e(1352,"default"),t(),e(1353," connection is used."),t(),n(1354,"app-copy-button")(1355,"pre")(1356,"code",42),e(1357,`
@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    SequelizeModule.forFeature([Album], 'albumsConnection'),
  ],
})
export class AppModule {}
`),t()()(),n(1358,"p"),e(1359,"You can also inject the "),n(1360,"code"),e(1361,"Sequelize"),t(),e(1362," instance for a given connection:"),t(),n(1363,"app-copy-button")(1364,"pre")(1365,"code",42),e(1366,`
@Injectable()
export class AlbumsService {
  constructor(
    @InjectConnection('albumsConnection')
    private sequelize: Sequelize,
  ) {}
}
`),t()()(),n(1367,"p"),e(1368,"It's also possible to inject any "),n(1369,"code"),e(1370,"Sequelize"),t(),e(1371," instance to the providers:"),t(),n(1372,"app-copy-button")(1373,"pre")(1374,"code",42),e(1375,`
@Module({
  providers: [
    {
      provide: AlbumsService,
      useFactory: (albumsSequelize: Sequelize) => {
        return new AlbumsService(albumsSequelize);
      },
      inject: [getDataSourceToken('albumsConnection')],
    },
  ],
})
export class AlbumsModule {}
`),t()()(),n(1376,"h4",89)(1377,"span"),e(1378,"Testing"),t()(),n(1379,"p"),e(1380,"When it comes to unit testing an application, we usually want to avoid making a database connection, keeping our test suites independent and their execution process as fast as possible. But our classes might depend on models that are pulled from the connection instance. How do we handle that? The solution is to create mock models. In order to achieve that, we set up "),n(1381,"a",69),e(1382,"custom providers"),t(),e(1383,". Each registered model is automatically represented by a "),n(1384,"code"),e(1385,"<ModelName>Model"),t(),e(1386," token, where "),n(1387,"code"),e(1388,"ModelName"),t(),e(1389," is the name of your model class."),t(),n(1390,"p"),e(1391,"The "),n(1392,"code"),e(1393,"@nestjs/sequelize"),t(),e(1394," package exposes the "),n(1395,"code"),e(1396,"getModelToken()"),t(),e(1397," function which returns a prepared token based on a given model."),t(),n(1398,"app-copy-button")(1399,"pre")(1400,"code",42),e(1401,`
@Module({
  providers: [
    UsersService,
    {
      provide: getModelToken(User),
      useValue: mockModel,
    },
  ],
})
export class UsersModule {}
`),t()()(),n(1402,"p"),e(1403,"Now a substitute "),n(1404,"code"),e(1405,"mockModel"),t(),e(1406," will be used as the "),n(1407,"code"),e(1408,"UserModel"),t(),e(1409,". Whenever any class asks for "),n(1410,"code"),e(1411,"UserModel"),t(),e(1412," using an "),n(1413,"code"),e(1414,"@InjectModel()"),t(),e(1415," decorator, Nest will use the registered "),n(1416,"code"),e(1417,"mockModel"),t(),e(1418," object."),t(),n(1419,"h4",90)(1420,"span"),e(1421,"Async configuration"),t()(),n(1422,"p"),e(1423,"You may want to pass your "),n(1424,"code"),e(1425,"SequelizeModule"),t(),e(1426," options asynchronously instead of statically. In this case, use the "),n(1427,"code"),e(1428,"forRootAsync()"),t(),e(1429," method, which provides several ways to deal with async configuration."),t(),n(1430,"p"),e(1431,"One approach is to use a factory function:"),t(),n(1432,"app-copy-button")(1433,"pre")(1434,"code",42),e(1435,`
SequelizeModule.forRootAsync({
  useFactory: () => ({
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    models: [],
  }),
});
`),t()()(),n(1436,"p"),e(1437,"Our factory behaves like any other "),n(1438,"a",71),e(1439,"asynchronous provider"),t(),e(1440," (e.g., it can be "),n(1441,"code"),e(1442,"async"),t(),e(1443," and it's able to inject dependencies through "),n(1444,"code"),e(1445,"inject"),t(),e(1446,")."),t(),n(1447,"app-copy-button")(1448,"pre")(1449,"code",42),e(1450,`
SequelizeModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    dialect: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    models: [],
  }),
  inject: [ConfigService],
});
`),t()()(),n(1451,"p"),e(1452,"Alternatively, you can use the "),n(1453,"code"),e(1454,"useClass"),t(),e(1455," syntax:"),t(),n(1456,"app-copy-button")(1457,"pre")(1458,"code",42),e(1459,`
SequelizeModule.forRootAsync({
  useClass: SequelizeConfigService,
});
`),t()()(),n(1460,"p"),e(1461,"The construction above will instantiate "),n(1462,"code"),e(1463,"SequelizeConfigService"),t(),e(1464," inside "),n(1465,"code"),e(1466,"SequelizeModule"),t(),e(1467," and use it to provide an options object by calling "),n(1468,"code"),e(1469,"createSequelizeOptions()"),t(),e(1470,". Note that this means that the "),n(1471,"code"),e(1472,"SequelizeConfigService"),t(),e(1473," has to implement the "),n(1474,"code"),e(1475,"SequelizeOptionsFactory"),t(),e(1476," interface, as shown below:"),t(),n(1477,"app-copy-button")(1478,"pre")(1479,"code",42),e(1480,`
@Injectable()
class SequelizeConfigService implements SequelizeOptionsFactory {
  createSequelizeOptions(): SequelizeModuleOptions {
    return {
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [],
    };
  }
}
`),t()()(),n(1481,"p"),e(1482,"In order to prevent the creation of "),n(1483,"code"),e(1484,"SequelizeConfigService"),t(),e(1485," inside "),n(1486,"code"),e(1487,"SequelizeModule"),t(),e(1488," and use a provider imported from a different module, you can use the "),n(1489,"code"),e(1490,"useExisting"),t(),e(1491," syntax."),t(),n(1492,"app-copy-button")(1493,"pre")(1494,"code",42),e(1495,`
SequelizeModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
`),t()()(),n(1496,"p"),e(1497,"This construction works the same as "),n(1498,"code"),e(1499,"useClass"),t(),e(1500," with one critical difference - "),n(1501,"code"),e(1502,"SequelizeModule"),t(),e(1503," will lookup imported modules to reuse an existing "),n(1504,"code"),e(1505,"ConfigService"),t(),e(1506," instead of instantiating a new one."),t(),n(1507,"h4",91)(1508,"span"),e(1509,"Example"),t()(),n(1510,"p"),e(1511,"A working example is available "),n(1512,"a",92),e(1513,"here"),t(),e(1514,"."),t()()),c&2){let b=r(89),v=r(162),T=r(189),k=r(230),M=r(244),A=r(267),q=r(294),F=r(314),P=r(372),N=r(405),D=r(919),R=r(996),_=r(1016),L=r(1057),de=r(1071),H=r(1094),me=r(1121),ce=r(1141),pe=r(1187),ue=r(1223);i(86),l(" ",d(87,36,"app.module",b.isJsActive),`
`),i(73),l(" ",d(160,39,"app.module",v.isJsActive),`
`),i(4),u("hide",v.isJsActive),i(3),u("hide",!v.isJsActive),i(20),l(" ",d(187,42,"user.entity",T.isJsActive),`
`),i(41),l(" ",d(228,45,"app.module",k.isJsActive),`
`),i(14),l(" ",d(242,48,"users.module",M.isJsActive),`
`),i(23),l(" ",d(265,51,"users.service",A.isJsActive),`
`),i(4),u("hide",A.isJsActive),i(3),u("hide",!A.isJsActive),i(20),l(" ",d(292,54,"users.module",q.isJsActive),`
`),i(20),l(" ",d(312,57,"users-http.module",F.isJsActive),`
`),i(58),l(" ",d(370,60,"user.entity",P.isJsActive),`
`),i(33),l(" ",d(403,63,"app.module",N.isJsActive),`
`),i(514),l(" ",d(917,66,"app.module",D.isJsActive),`
`),i(77),l(" ",d(994,69,"app.service",R.isJsActive),`
`),i(4),u("hide",R.isJsActive),i(3),u("hide",!R.isJsActive),i(13),l(" ",d(1014,72,"user.model",_.isJsActive),`
`),i(41),l(" ",d(1055,75,"app.module",L.isJsActive),`
`),i(14),l(" ",d(1069,78,"users.module",de.isJsActive),`
`),i(23),l(" ",d(1092,81,"users.service",H.isJsActive),`
`),i(4),u("hide",H.isJsActive),i(3),u("hide",!H.isJsActive),i(20),l(" ",d(1119,84,"users.module",me.isJsActive),`
`),i(20),l(" ",d(1139,87,"users-http.module",ce.isJsActive),`
`),i(46),l(" ",d(1185,90,"user.model",pe.isJsActive),`
`),i(36),l(" ",d(1221,93,"app.module",ue.isJsActive),`
`)}},dependencies:[C,E,y,g,U,B,O,w],encapsulation:2,changeDetection:0})}return a})();var ae=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-streaming-files"]],features:[f],decls:106,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/streaming-files.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","streaming-files"],[1,"info"],[1,"language-ts"],["appAnchor","","id","streamable-file-class"],["appAnchor","","id","cross-platform-support"],["appAnchor","","id","example"],["href","/controllers#response-headers"]],template:function(c,p){c&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),o(4,"i",4),t()(),n(5,"h3",5),e(6,"Streaming files"),t(),n(7,"blockquote",6)(8,"strong"),e(9,"Note"),t(),e(10," This chapter shows how you can stream files from your "),n(11,"strong"),e(12,"HTTP application"),t(),e(13,`. The examples presented below do not apply to GraphQL or Microservice applications.
`),t(),n(14,"p"),e(15,"There may be times where you would like to send back a file from your REST API to the client. To do this with Nest, normally you'd do the following:"),t(),n(16,"app-copy-button")(17,"pre")(18,"code",7),e(19,`
@Controller('file')
export class FileController {
  @Get()
  getFile(@Res() res: Response) {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    file.pipe(res);
  }
}
`),t()()(),n(20,"p"),e(21,"But in doing so you end up losing access to your post-controller interceptor logic. To handle this, you can return a "),n(22,"code"),e(23,"StreamableFile"),t(),e(24," instance and under the hood, the framework will take care of piping the response."),t(),n(25,"h4",8)(26,"span"),e(27,"Streamable File class"),t()(),n(28,"p"),e(29,"A "),n(30,"code"),e(31,"StreamableFile"),t(),e(32," is a class that holds onto the stream that is to be returned. To create a new "),n(33,"code"),e(34,"StreamableFile"),t(),e(35,", you can pass either a "),n(36,"code"),e(37,"Buffer"),t(),e(38," or a "),n(39,"code"),e(40,"Stream"),t(),e(41," to the "),n(42,"code"),e(43,"StreamableFile"),t(),e(44," constructor."),t(),n(45,"blockquote",6)(46,"strong"),e(47,"hint"),t(),e(48," The "),n(49,"code"),e(50,"StreamableFile"),t(),e(51," class can be imported from "),n(52,"code"),e(53,"@nestjs/common"),t(),e(54,`.
`),t(),n(55,"h4",9)(56,"span"),e(57,"Cross-platform support"),t()(),n(58,"p"),e(59,"Fastify, by default, can support sending files without needing to call "),n(60,"code"),e(61,"stream.pipe(res)"),t(),e(62,", so you don't need to use the "),n(63,"code"),e(64,"StreamableFile"),t(),e(65," class at all. However, Nest supports the use of "),n(66,"code"),e(67,"StreamableFile"),t(),e(68," in both platform types, so if you end up switching between Express and Fastify there's no need to worry about compatibility between the two engines."),t(),n(69,"h4",10)(70,"span"),e(71,"Example"),t()(),n(72,"p"),e(73,"You can find a simple example of returning the "),n(74,"code"),e(75,"package.json"),t(),e(76," as a file instead of a JSON below, but the idea extends out naturally to images, documents, and any other file type."),t(),n(77,"app-copy-button")(78,"pre")(79,"code",7),e(80,`
import { Controller, Get, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }
}
`),t()()(),n(81,"p"),e(82,"The default content type (the value for "),n(83,"code"),e(84,"Content-Type"),t(),e(85," HTTP response header) is "),n(86,"code"),e(87,"application/octet-stream"),t(),e(88,". If you need to customize this value you can use the "),n(89,"code"),e(90,"type"),t(),e(91," option from "),n(92,"code"),e(93,"StreamableFile"),t(),e(94,", or use the "),n(95,"code"),e(96,"res.set"),t(),e(97," method or the "),n(98,"a",11)(99,"code"),e(100,"@Header()"),t()(),e(101," decorator, like this:"),t(),n(102,"app-copy-button")(103,"pre")(104,"code",7),e(105,`
import { Controller, Get, StreamableFile, Res } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import type { Response } from 'express'; // Assuming that we are using the ExpressJS HTTP Adapter

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file, {
      type: 'application/json',
      disposition: 'attachment; filename="package.json"',
      // If you want to define the Content-Length value to another value instead of file's length:
      // length: 123,
    });
  }

  // Or even:
  @Get()
  getFileChangingResponseObjDirectly(@Res({ passthrough: true }) res: Response): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="package.json"',
    });
    return new StreamableFile(file);
  }

  // Or even:
  @Get()
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="package.json"')
  getFileUsingStaticValues(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }  
}
`),t()()()())},dependencies:[E,g],encapsulation:2,changeDetection:0})}return a})();var re=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-task-scheduling"]],features:[f],decls:680,vars:4,consts:[["contentReference",""],["app799fa0f87f07d4caf05e93b26a98b801125613f7",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/task-scheduling.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","task-scheduling"],["rel","nofollow","target","_blank","href","https://en.wikipedia.org/wiki/Cron"],["rel","nofollow","target","_blank","href","https://github.com/kelektiv/node-cron"],["appAnchor","","id","installation"],[1,"language-bash"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["href","techniques/task-scheduling#declarative-cron-jobs"],["href","techniques/task-scheduling#declarative-timeouts"],["href","techniques/task-scheduling#declarative-intervals"],["appAnchor","","id","declarative-cron-jobs"],["rel","nofollow","target","_blank","href","http://crontab.org/"],[1,"language-javascript"],[1,"info"],["href","http://momentjs.com/timezone/"],["href","/techniques/task-scheduling#dynamic-schedule-module-api"],["appAnchor","","id","declarative-intervals"],["href","techniques/task-scheduling#dynamic-intervals"],["appAnchor","","id","declarative-timeouts"],["href","techniques/task-scheduling#dynamic-timeouts"],["appAnchor","","id","dynamic-schedule-module-api"],["appAnchor","","id","dynamic-cron-jobs"],[1,"warning"],["appAnchor","","id","dynamic-intervals"],["appAnchor","","id","dynamic-timeouts"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/27-scheduling"]],template:function(c,p){if(c&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),o(4,"i",5),t()(),n(5,"h3",6),e(6,"Task scheduling"),t(),n(7,"p"),e(8,"Task scheduling allows you to schedule arbitrary code (methods/functions) to execute at a fixed date/time, at recurring intervals, or once after a specified interval. In the Linux world, this is often handled by packages like "),n(9,"a",7),e(10,"cron"),t(),e(11," at the OS level. For Node.js apps, there are several packages that emulate cron-like functionality. Nest provides the "),n(12,"code"),e(13,"@nestjs/schedule"),t(),e(14," package, which integrates with the popular Node.js "),n(15,"a",8),e(16,"cron"),t(),e(17," package. We'll cover this package in the current chapter."),t(),n(18,"h4",9)(19,"span"),e(20,"Installation"),t()(),n(21,"p"),e(22,"To begin using it, we first install the required dependencies."),t(),n(23,"pre")(24,"code",10),e(25,`
$ npm install --save @nestjs/schedule
`),t()(),n(26,"p"),e(27,"To activate job scheduling, import the "),n(28,"code"),e(29,"ScheduleModule"),t(),e(30," into the root "),n(31,"code"),e(32,"AppModule"),t(),e(33," and run the "),n(34,"code"),e(35,"forRoot()"),t(),e(36," static method as shown below:"),t(),n(37,"app-copy-button",11)(38,"span",12),e(39),s(40,"extension"),o(41,"app-tabs",null,1),t(),n(43,"pre")(44,"code",13),e(45,`
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot()
  ],
})
export class AppModule {}
`),t()()(),n(46,"p"),e(47,"The "),n(48,"code"),e(49,".forRoot()"),t(),e(50," call initializes the scheduler and registers any declarative "),n(51,"a",14),e(52,"cron jobs"),t(),e(53,", "),n(54,"a",15),e(55,"timeouts"),t(),e(56," and "),n(57,"a",16),e(58,"intervals"),t(),e(59," that exist within your app. Registration occurs when the "),n(60,"code"),e(61,"onApplicationBootstrap"),t(),e(62," lifecycle hook occurs, ensuring that all modules have loaded and declared any scheduled jobs."),t(),n(63,"h4",17)(64,"span"),e(65,"Declarative cron jobs"),t()(),n(66,"p"),e(67,"A cron job schedules an arbitrary function (method call) to run automatically. Cron jobs can run:"),t(),n(68,"ul")(69,"li"),e(70,"Once, at a specified date/time."),t(),n(71,"li"),e(72,"On a recurring basis; recurring jobs can run at a specified instant within a specified interval (for example, once per hour, once per week, once every 5 minutes)"),t()(),n(73,"p"),e(74,"Declare a cron job with the "),n(75,"code"),e(76,"@Cron()"),t(),e(77," decorator preceding the method definition containing the code to be executed, as follows:"),t(),n(78,"app-copy-button")(79,"pre")(80,"code",13),e(81,`
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron('45 * * * * *')
  handleCron() {
    this.logger.debug('Called when the current second is 45');
  }
}
`),t()()(),n(82,"p"),e(83,"In this example, the "),n(84,"code"),e(85,"handleCron()"),t(),e(86," method will be called each time the current second is "),n(87,"code"),e(88,"45"),t(),e(89,". In other words, the method will be run once per minute, at the 45 second mark."),t(),n(90,"p"),e(91,"The "),n(92,"code"),e(93,"@Cron()"),t(),e(94," decorator supports the following standard "),n(95,"a",18),e(96,"cron patterns"),t(),e(97,":"),t(),n(98,"ul")(99,"li"),e(100,"Asterisk (e.g. "),n(101,"code"),e(102,"*"),t(),e(103,")"),t(),n(104,"li"),e(105,"Ranges (e.g. "),n(106,"code"),e(107,"1-3,5"),t(),e(108,")"),t(),n(109,"li"),e(110,"Steps (e.g. "),n(111,"code"),e(112,"*/2"),t(),e(113,")"),t()(),n(114,"p"),e(115,"In the example above, we passed "),n(116,"code"),e(117,"45 * * * * *"),t(),e(118," to the decorator. The following key shows how each position in the cron pattern string is interpreted:"),t(),n(119,"pre",19)(120,"code",19),e(121,`
* * * * * *
| | | | | |
| | | | | day of week
| | | | months
| | | day of month
| | hours
| minutes
seconds (optional)
`),t()(),n(122,"p"),e(123,"Some sample cron patterns are:"),t(),n(124,"table")(125,"tbody")(126,"tr")(127,"td")(128,"code"),e(129,"* * * * * *"),t()(),n(130,"td"),e(131,"every second"),t()(),n(132,"tr")(133,"td")(134,"code"),e(135,"45 * * * * *"),t()(),n(136,"td"),e(137,"every minute, on the 45th second"),t()(),n(138,"tr")(139,"td")(140,"code"),e(141,"0 10 * * * *"),t()(),n(142,"td"),e(143,"every hour, at the start of the 10th minute"),t()(),n(144,"tr")(145,"td")(146,"code"),e(147,"0 */30 9-17 * * *"),t()(),n(148,"td"),e(149,"every 30 minutes between 9am and 5pm"),t()(),n(150,"tr")(151,"td")(152,"code"),e(153,"0 30 11 * * 1-5"),t()(),n(154,"td"),e(155,"Monday to Friday at 11:30am"),t()()()(),n(156,"p"),e(157,"The "),n(158,"code"),e(159,"@nestjs/schedule"),t(),e(160," package provides a convenient enum with commonly used cron patterns. You can use this enum as follows:"),t(),n(161,"app-copy-button")(162,"pre")(163,"code",13),e(164,`
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_30_SECONDS)
  handleCron() {
    this.logger.debug('Called every 30 seconds');
  }
}
`),t()()(),n(165,"p"),e(166,"In this example, the "),n(167,"code"),e(168,"handleCron()"),t(),e(169," method will be called every "),n(170,"code"),e(171,"30"),t(),e(172," seconds. If an exception occurs, it will be logged to the console, as every method annotated with "),n(173,"code"),e(174,"@Cron()"),t(),e(175," is automatically wrapped in a "),n(176,"code"),e(177,"try-catch"),t(),e(178," block."),t(),n(179,"p"),e(180,"Alternatively, you can supply a JavaScript "),n(181,"code"),e(182,"Date"),t(),e(183," object to the "),n(184,"code"),e(185,"@Cron()"),t(),e(186," decorator. Doing so causes the job to execute exactly once, at the specified date."),t(),n(187,"blockquote",20)(188,"strong"),e(189,"Hint"),t(),e(190," Use JavaScript date arithmetic to schedule jobs relative to the current date. For example, "),n(191,"code"),e(192,"@Cron(new Date(Date.now() + 10 * 1000))"),t(),e(193,` to schedule a job to run 10 seconds after the app starts.
`),t(),n(194,"p"),e(195,"Also, you can supply additional options as the second parameter to the "),n(196,"code"),e(197,"@Cron()"),t(),e(198," decorator."),t(),n(199,"table")(200,"tbody")(201,"tr")(202,"td")(203,"code"),e(204,"name"),t()(),n(205,"td"),e(206," Useful to access and control a cron job after it's been declared. "),t()(),n(207,"tr")(208,"td")(209,"code"),e(210,"timeZone"),t()(),n(211,"td"),e(212," Specify the timezone for the execution. This will modify the actual time relative to your timezone. If the timezone is invalid, an error is thrown. You can check all timezones available at "),n(213,"a",21),e(214,"Moment Timezone"),t(),e(215," website. "),t()(),n(216,"tr")(217,"td")(218,"code"),e(219,"utcOffset"),t()(),n(220,"td"),e(221," This allows you to specify the offset of your timezone rather than using the "),n(222,"code"),e(223,"timeZone"),t(),e(224," param. "),t()(),n(225,"tr")(226,"td")(227,"code"),e(228,"waitForCompletion"),t()(),n(229,"td"),e(230," If "),n(231,"code"),e(232,"true"),t(),e(233,", no additional instances of the cron job will run until the current onTick callback has been completed. Any new scheduled executions that occur while the current cron job is running will be skipped entirely. "),t()(),n(234,"tr")(235,"td")(236,"code"),e(237,"disabled"),t()(),n(238,"td"),e(239," This indicates whether the job will be executed at all. "),t()()()(),n(240,"app-copy-button")(241,"pre")(242,"code",13),e(243,`
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
  @Cron('* * 0 * * *', {
    name: 'notifications',
    timeZone: 'Europe/Paris',
  })
  triggerNotifications() {}
}
`),t()()(),n(244,"p"),e(245,"You can access and control a cron job after it's been declared, or dynamically create a cron job (where its cron pattern is defined at runtime) with the "),n(246,"a",22),e(247,"Dynamic API"),t(),e(248,". To access a declarative cron job via the API, you must associate the job with a name by passing the "),n(249,"code"),e(250,"name"),t(),e(251," property in an optional options object as the second argument of the decorator."),t(),n(252,"h4",23)(253,"span"),e(254,"Declarative intervals"),t()(),n(255,"p"),e(256,"To declare that a method should run at a (recurring) specified interval, prefix the method definition with the "),n(257,"code"),e(258,"@Interval()"),t(),e(259," decorator. Pass the interval value, as a number in milliseconds, to the decorator as shown below:"),t(),n(260,"app-copy-button")(261,"pre")(262,"code",13),e(263,`
@Interval(10000)
handleInterval() {
  this.logger.debug('Called every 10 seconds');
}
`),t()()(),n(264,"blockquote",20)(265,"strong"),e(266,"Hint"),t(),e(267," This mechanism uses the JavaScript "),n(268,"code"),e(269,"setInterval()"),t(),e(270,` function under the hood. You can also utilize a cron job to schedule recurring jobs.
`),t(),n(271,"p"),e(272,"If you want to control your declarative interval from outside the declaring class via the "),n(273,"a",22),e(274,"Dynamic API"),t(),e(275,", associate the interval with a name using the following construction:"),t(),n(276,"app-copy-button")(277,"pre")(278,"code",13),e(279,`
@Interval('notifications', 2500)
handleInterval() {}
`),t()()(),n(280,"p"),e(281,"If an exception occurs, it will be logged to the console, as every method annotated with "),n(282,"code"),e(283,"@Interval()"),t(),e(284," is automatically wrapped in a "),n(285,"code"),e(286,"try-catch"),t(),e(287," block."),t(),n(288,"p"),e(289,"The "),n(290,"a",24),e(291,"Dynamic API"),t(),e(292," also enables "),n(293,"strong"),e(294,"creating"),t(),e(295," dynamic intervals, where the interval's properties are defined at runtime, and "),n(296,"strong"),e(297,"listing and deleting"),t(),e(298," them."),t(),n(299,"p"),o(300,"app-banner-enterprise"),t(),n(301,"h4",25)(302,"span"),e(303,"Declarative timeouts"),t()(),n(304,"p"),e(305,"To declare that a method should run (once) at a specified timeout, prefix the method definition with the "),n(306,"code"),e(307,"@Timeout()"),t(),e(308," decorator. Pass the relative time offset (in milliseconds), from application startup, to the decorator as shown below:"),t(),n(309,"app-copy-button")(310,"pre")(311,"code",13),e(312,`
@Timeout(5000)
handleTimeout() {
  this.logger.debug('Called once after 5 seconds');
}
`),t()()(),n(313,"blockquote",20)(314,"strong"),e(315,"Hint"),t(),e(316," This mechanism uses the JavaScript "),n(317,"code"),e(318,"setTimeout()"),t(),e(319,` function under the hood.
`),t(),n(320,"p"),e(321,"If an exception occurs, it will be logged to the console, as every method annotated with "),n(322,"code"),e(323,"@Timeout()"),t(),e(324," is automatically wrapped in a "),n(325,"code"),e(326,"try-catch"),t(),e(327," block."),t(),n(328,"p"),e(329,"If you want to control your declarative timeout from outside the declaring class via the "),n(330,"a",22),e(331,"Dynamic API"),t(),e(332,", associate the timeout with a name using the following construction:"),t(),n(333,"app-copy-button")(334,"pre")(335,"code",13),e(336,`
@Timeout('notifications', 2500)
handleTimeout() {}
`),t()()(),n(337,"p"),e(338,"The "),n(339,"a",26),e(340,"Dynamic API"),t(),e(341," also enables "),n(342,"strong"),e(343,"creating"),t(),e(344," dynamic timeouts, where the timeout's properties are defined at runtime, and "),n(345,"strong"),e(346,"listing and deleting"),t(),e(347," them."),t(),n(348,"h4",27)(349,"span"),e(350,"Dynamic schedule module API"),t()(),n(351,"p"),e(352,"The "),n(353,"code"),e(354,"@nestjs/schedule"),t(),e(355," module provides a dynamic API that enables managing declarative "),n(356,"a",14),e(357,"cron jobs"),t(),e(358,", "),n(359,"a",15),e(360,"timeouts"),t(),e(361," and "),n(362,"a",16),e(363,"intervals"),t(),e(364,". The API also enables creating and managing "),n(365,"strong"),e(366,"dynamic"),t(),e(367," cron jobs, timeouts and intervals, where the properties are defined at runtime."),t(),n(368,"h4",28)(369,"span"),e(370,"Dynamic cron jobs"),t()(),n(371,"p"),e(372,"Obtain a reference to a "),n(373,"code"),e(374,"CronJob"),t(),e(375," instance by name from anywhere in your code using the "),n(376,"code"),e(377,"SchedulerRegistry"),t(),e(378," API. First, inject "),n(379,"code"),e(380,"SchedulerRegistry"),t(),e(381," using standard constructor injection:"),t(),n(382,"app-copy-button")(383,"pre")(384,"code",13),e(385,`
constructor(private schedulerRegistry: SchedulerRegistry) {}
`),t()()(),n(386,"blockquote",20)(387,"strong"),e(388,"Hint"),t(),e(389," Import the "),n(390,"code"),e(391,"SchedulerRegistry"),t(),e(392," from the "),n(393,"code"),e(394,"@nestjs/schedule"),t(),e(395,` package.
`),t(),n(396,"p"),e(397,"Then use it in a class as follows. Assume a cron job was created with the following declaration:"),t(),n(398,"app-copy-button")(399,"pre")(400,"code",13),e(401,`
@Cron('* * 8 * * *', {
  name: 'notifications',
})
triggerNotifications() {}
`),t()()(),n(402,"p"),e(403,"Access this job using the following:"),t(),n(404,"app-copy-button")(405,"pre")(406,"code",13),e(407,`
const job = this.schedulerRegistry.getCronJob('notifications');

job.stop();
console.log(job.lastDate());
`),t()()(),n(408,"p"),e(409,"The "),n(410,"code"),e(411,"getCronJob()"),t(),e(412," method returns the named cron job. The returned "),n(413,"code"),e(414,"CronJob"),t(),e(415," object has the following methods:"),t(),n(416,"ul")(417,"li")(418,"code"),e(419,"stop()"),t(),e(420," - stops a job that is scheduled to run."),t(),n(421,"li")(422,"code"),e(423,"start()"),t(),e(424," - restarts a job that has been stopped."),t(),n(425,"li")(426,"code"),e(427,"setTime(time: CronTime)"),t(),e(428," - stops a job, sets a new time for it, and then starts it"),t(),n(429,"li")(430,"code"),e(431,"lastDate()"),t(),e(432," - returns a "),n(433,"code"),e(434,"DateTime"),t(),e(435," representation of the date on which the last execution of a job occurred."),t(),n(436,"li")(437,"code"),e(438,"nextDate()"),t(),e(439," - returns a "),n(440,"code"),e(441,"DateTime"),t(),e(442," representation of the date when the next execution of a job is scheduled."),t(),n(443,"li")(444,"code"),e(445,"nextDates(count: number)"),t(),e(446," - Provides an array (size "),n(447,"code"),e(448,"count"),t(),e(449,") of "),n(450,"code"),e(451,"DateTime"),t(),e(452," representations for the next set of dates that will trigger job execution. "),n(453,"code"),e(454,"count"),t(),e(455," defaults to 0, returning an empty array."),t()(),n(456,"blockquote",20)(457,"strong"),e(458,"Hint"),t(),e(459," Use "),n(460,"code"),e(461,"toJSDate()"),t(),e(462," on "),n(463,"code"),e(464,"DateTime"),t(),e(465,` objects to render them as a JavaScript Date equivalent to this DateTime.
`),t(),n(466,"p")(467,"strong"),e(468,"Create"),t(),e(469," a new cron job dynamically using the "),n(470,"code"),e(471,"SchedulerRegistry#addCronJob"),t(),e(472," method, as follows:"),t(),n(473,"app-copy-button")(474,"pre")(475,"code",13),e(476,`
addCronJob(name: string, seconds: string) {
  const job = new CronJob(\`\${seconds} * * * * *\`, () => {
    this.logger.warn(\`time (\${seconds}) for job \${name} to run!\`);
  });

  this.schedulerRegistry.addCronJob(name, job);
  job.start();

  this.logger.warn(
    \`job \${name} added for each minute at \${seconds} seconds!\`,
  );
}
`),t()()(),n(477,"p"),e(478,"In this code, we use the "),n(479,"code"),e(480,"CronJob"),t(),e(481," object from the "),n(482,"code"),e(483,"cron"),t(),e(484," package to create the cron job. The "),n(485,"code"),e(486,"CronJob"),t(),e(487," constructor takes a cron pattern (just like the "),n(488,"code"),e(489,"@Cron()"),t(),n(490,"a",14),e(491,"decorator"),t(),e(492,") as its first argument, and a callback to be executed when the cron timer fires as its second argument. The "),n(493,"code"),e(494,"SchedulerRegistry#addCronJob"),t(),e(495," method takes two arguments: a name for the "),n(496,"code"),e(497,"CronJob"),t(),e(498,", and the "),n(499,"code"),e(500,"CronJob"),t(),e(501," object itself."),t(),n(502,"blockquote",29)(503,"strong"),e(504,"Warning"),t(),e(505," Remember to inject the "),n(506,"code"),e(507,"SchedulerRegistry"),t(),e(508," before accessing it. Import "),n(509,"code"),e(510,"CronJob"),t(),e(511," from the "),n(512,"code"),e(513,"cron"),t(),e(514,` package.
`),t(),n(515,"p")(516,"strong"),e(517,"Delete"),t(),e(518," a named cron job using the "),n(519,"code"),e(520,"SchedulerRegistry#deleteCronJob"),t(),e(521," method, as follows:"),t(),n(522,"app-copy-button")(523,"pre")(524,"code",13),e(525,`
deleteCron(name: string) {
  this.schedulerRegistry.deleteCronJob(name);
  this.logger.warn(\`job \${name} deleted!\`);
}
`),t()()(),n(526,"p")(527,"strong"),e(528,"List"),t(),e(529," all cron jobs using the "),n(530,"code"),e(531,"SchedulerRegistry#getCronJobs"),t(),e(532," method as follows:"),t(),n(533,"app-copy-button")(534,"pre")(535,"code",13),e(536,`
getCrons() {
  const jobs = this.schedulerRegistry.getCronJobs();
  jobs.forEach((value, key, map) => {
    let next;
    try {
      next = value.nextDate().toJSDate();
    } catch (e) {
      next = 'error: next fire date is in the past!';
    }
    this.logger.log(\`job: \${key} -> next: \${next}\`);
  });
}
`),t()()(),n(537,"p"),e(538,"The "),n(539,"code"),e(540,"getCronJobs()"),t(),e(541," method returns a "),n(542,"code"),e(543,"map"),t(),e(544,". In this code, we iterate over the map and attempt to access the "),n(545,"code"),e(546,"nextDate()"),t(),e(547," method of each "),n(548,"code"),e(549,"CronJob"),t(),e(550,". In the "),n(551,"code"),e(552,"CronJob"),t(),e(553," API, if a job has already fired and has no future firing date, it throws an exception."),t(),n(554,"h4",30)(555,"span"),e(556,"Dynamic intervals"),t()(),n(557,"p"),e(558,"Obtain a reference to an interval with the "),n(559,"code"),e(560,"SchedulerRegistry#getInterval"),t(),e(561," method. As above, inject "),n(562,"code"),e(563,"SchedulerRegistry"),t(),e(564," using standard constructor injection:"),t(),n(565,"app-copy-button")(566,"pre")(567,"code",13),e(568,`
constructor(private schedulerRegistry: SchedulerRegistry) {}
`),t()()(),n(569,"p"),e(570,"And use it as follows:"),t(),n(571,"app-copy-button")(572,"pre")(573,"code",13),e(574,`
const interval = this.schedulerRegistry.getInterval('notifications');
clearInterval(interval);
`),t()()(),n(575,"p")(576,"strong"),e(577,"Create"),t(),e(578," a new interval dynamically using the "),n(579,"code"),e(580,"SchedulerRegistry#addInterval"),t(),e(581," method, as follows:"),t(),n(582,"app-copy-button")(583,"pre")(584,"code",13),e(585,`
addInterval(name: string, milliseconds: number) {
  const callback = () => {
    this.logger.warn(\`Interval \${name} executing at time (\${milliseconds})!\`);
  };

  const interval = setInterval(callback, milliseconds);
  this.schedulerRegistry.addInterval(name, interval);
}
`),t()()(),n(586,"p"),e(587,"In this code, we create a standard JavaScript interval, then pass it to the "),n(588,"code"),e(589,"SchedulerRegistry#addInterval"),t(),e(590,` method.
That method takes two arguments: a name for the interval, and the interval itself.`),t(),n(591,"p")(592,"strong"),e(593,"Delete"),t(),e(594," a named interval using the "),n(595,"code"),e(596,"SchedulerRegistry#deleteInterval"),t(),e(597," method, as follows:"),t(),n(598,"app-copy-button")(599,"pre")(600,"code",13),e(601,`
deleteInterval(name: string) {
  this.schedulerRegistry.deleteInterval(name);
  this.logger.warn(\`Interval \${name} deleted!\`);
}
`),t()()(),n(602,"p")(603,"strong"),e(604,"List"),t(),e(605," all intervals using the "),n(606,"code"),e(607,"SchedulerRegistry#getIntervals"),t(),e(608," method as follows:"),t(),n(609,"app-copy-button")(610,"pre")(611,"code",13),e(612,`
getIntervals() {
  const intervals = this.schedulerRegistry.getIntervals();
  intervals.forEach(key => this.logger.log(\`Interval: \${key}\`));
}
`),t()()(),n(613,"h4",31)(614,"span"),e(615,"Dynamic timeouts"),t()(),n(616,"p"),e(617,"Obtain a reference to a timeout with the "),n(618,"code"),e(619,"SchedulerRegistry#getTimeout"),t(),e(620," method. As above, inject "),n(621,"code"),e(622,"SchedulerRegistry"),t(),e(623," using standard constructor injection:"),t(),n(624,"app-copy-button")(625,"pre")(626,"code",13),e(627,`
constructor(private readonly schedulerRegistry: SchedulerRegistry) {}
`),t()()(),n(628,"p"),e(629,"And use it as follows:"),t(),n(630,"app-copy-button")(631,"pre")(632,"code",13),e(633,`
const timeout = this.schedulerRegistry.getTimeout('notifications');
clearTimeout(timeout);
`),t()()(),n(634,"p")(635,"strong"),e(636,"Create"),t(),e(637," a new timeout dynamically using the "),n(638,"code"),e(639,"SchedulerRegistry#addTimeout"),t(),e(640," method, as follows:"),t(),n(641,"app-copy-button")(642,"pre")(643,"code",13),e(644,`
addTimeout(name: string, milliseconds: number) {
  const callback = () => {
    this.logger.warn(\`Timeout \${name} executing after (\${milliseconds})!\`);
  };

  const timeout = setTimeout(callback, milliseconds);
  this.schedulerRegistry.addTimeout(name, timeout);
}
`),t()()(),n(645,"p"),e(646,"In this code, we create a standard JavaScript timeout, then pass it to the "),n(647,"code"),e(648,"SchedulerRegistry#addTimeout"),t(),e(649,` method.
That method takes two arguments: a name for the timeout, and the timeout itself.`),t(),n(650,"p")(651,"strong"),e(652,"Delete"),t(),e(653," a named timeout using the "),n(654,"code"),e(655,"SchedulerRegistry#deleteTimeout"),t(),e(656," method, as follows:"),t(),n(657,"app-copy-button")(658,"pre")(659,"code",13),e(660,`
deleteTimeout(name: string) {
  this.schedulerRegistry.deleteTimeout(name);
  this.logger.warn(\`Timeout \${name} deleted!\`);
}
`),t()()(),n(661,"p")(662,"strong"),e(663,"List"),t(),e(664," all timeouts using the "),n(665,"code"),e(666,"SchedulerRegistry#getTimeouts"),t(),e(667," method as follows:"),t(),n(668,"app-copy-button")(669,"pre")(670,"code",13),e(671,`
getTimeouts() {
  const timeouts = this.schedulerRegistry.getTimeouts();
  timeouts.forEach(key => this.logger.log(\`Timeout: \${key}\`));
}
`),t()()(),n(672,"h4",32)(673,"span"),e(674,"Example"),t()(),n(675,"p"),e(676,"A working example is available "),n(677,"a",33),e(678,"here"),t(),e(679,"."),t()()),c&2){let b=r(42);i(39),l(" ",d(40,1,"app.module",b.isJsActive),`
`)}},dependencies:[g,E,y,B,w],encapsulation:2,changeDetection:0})}return a})();var le=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-validation"]],features:[f],decls:790,vars:8,consts:[["contentReference",""],["app89d80765e65f3b16a7aec4db51ad36f7a28cc71a",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/validation.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","validation"],["rel","nofollow","target","_blank","href","https://github.com/typestack/class-validator"],["appAnchor","","id","overview"],["routerLink","/pipes"],["appAnchor","","id","using-the-built-in-validationpipe"],[1,"language-bash"],[1,"info"],["rel","nofollow","target","_blank","href","https://github.com/typestack/class-transformer"],[1,"language-typescript"],["appAnchor","","id","auto-validation"],["rel","nofollow","target","_blank","href","https://github.com/typestack/class-validator#validation-decorators"],[1,"language-json"],["appAnchor","","id","disable-detailed-errors"],["appAnchor","","id","stripping-properties"],["appAnchor","","id","transform-payload-objects"],[1,"with-heading"],[1,"filename"],["appAnchor","","id","explicit-conversion"],["appAnchor","","id","mapped-types"],[1,""],["routerLink","/openapi/mapped-types"],["routerLink","/graphql/mapped-types"],["appAnchor","","id","parsing-and-validating-arrays"],["appAnchor","","id","websockets-and-microservices"],["appAnchor","","id","learn-more"]],template:function(c,p){if(c&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),o(4,"i",5),t()(),n(5,"h3",6),e(6,"Validation"),t(),n(7,"p"),e(8,"It is best practice to validate the correctness of any data sent into a web application. To automatically validate incoming requests, Nest provides several pipes available right out-of-the-box:"),t(),n(9,"ul")(10,"li")(11,"code"),e(12,"ValidationPipe"),t()(),n(13,"li")(14,"code"),e(15,"ParseIntPipe"),t()(),n(16,"li")(17,"code"),e(18,"ParseBoolPipe"),t()(),n(19,"li")(20,"code"),e(21,"ParseArrayPipe"),t()(),n(22,"li")(23,"code"),e(24,"ParseUUIDPipe"),t()()(),n(25,"p"),e(26,"The "),n(27,"code"),e(28,"ValidationPipe"),t(),e(29," makes use of the powerful "),n(30,"a",7),e(31,"class-validator"),t(),e(32," package and its declarative validation decorators. The "),n(33,"code"),e(34,"ValidationPipe"),t(),e(35," provides a convenient approach to enforce validation rules for all incoming client payloads, where the specific rules are declared with simple annotations in local class/DTO declarations in each module."),t(),n(36,"h4",8)(37,"span"),e(38,"Overview"),t()(),n(39,"p"),e(40,"In the "),n(41,"a",9),e(42,"Pipes"),t(),e(43," chapter, we went through the process of building simple pipes and binding them to controllers, methods or to the global app to demonstrate how the process works. Be sure to review that chapter to best understand the topics of this chapter. Here, we'll focus on various "),n(44,"strong"),e(45,"real world"),t(),e(46," use cases of the "),n(47,"code"),e(48,"ValidationPipe"),t(),e(49,", and show how to use some of its advanced customization features."),t(),n(50,"h4",10)(51,"span"),e(52,"Using the built-in ValidationPipe"),t()(),n(53,"p"),e(54,"To begin using it, we first install the required dependency."),t(),n(55,"pre")(56,"code",11),e(57,`
$ npm i --save class-validator class-transformer
`),t()(),n(58,"blockquote",12)(59,"strong"),e(60,"Hint"),t(),e(61," The "),n(62,"code"),e(63,"ValidationPipe"),t(),e(64," is exported from the "),n(65,"code"),e(66,"@nestjs/common"),t(),e(67,` package.
`),t(),n(68,"p"),e(69,"Because this pipe uses the "),n(70,"a",7)(71,"code"),e(72,"class-validator"),t()(),e(73," and "),n(74,"a",13)(75,"code"),e(76,"class-transformer"),t()(),e(77," libraries, there are many options available. You configure these settings via a configuration object passed to the pipe. Following are the built-in options:"),t(),n(78,"app-copy-button")(79,"pre")(80,"code",14),e(81,`
export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
  errorFormat?: 'list' | 'grouped';
}
`),t()()(),n(82,"p"),e(83,"In addition to these, all "),n(84,"code"),e(85,"class-validator"),t(),e(86," options (inherited from the "),n(87,"code"),e(88,"ValidatorOptions"),t(),e(89," interface) are available:"),t(),n(90,"table")(91,"tr")(92,"th"),e(93,"Option"),t(),n(94,"th"),e(95,"Type"),t(),n(96,"th"),e(97,"Description"),t()(),n(98,"tr")(99,"td")(100,"code"),e(101,"enableDebugMessages"),t()(),n(102,"td")(103,"code"),e(104,"boolean"),t()(),n(105,"td"),e(106,"If set to true, validator will print extra warning messages to the console when something is not right."),t()(),n(107,"tr")(108,"td")(109,"code"),e(110,"skipUndefinedProperties"),t()(),n(111,"td")(112,"code"),e(113,"boolean"),t()(),n(114,"td"),e(115,"If set to true then validator will skip validation of all properties that are undefined in the validating object."),t()(),n(116,"tr")(117,"td")(118,"code"),e(119,"skipNullProperties"),t()(),n(120,"td")(121,"code"),e(122,"boolean"),t()(),n(123,"td"),e(124,"If set to true then validator will skip validation of all properties that are null in the validating object."),t()(),n(125,"tr")(126,"td")(127,"code"),e(128,"skipMissingProperties"),t()(),n(129,"td")(130,"code"),e(131,"boolean"),t()(),n(132,"td"),e(133,"If set to true then validator will skip validation of all properties that are null or undefined in the validating object."),t()(),n(134,"tr")(135,"td")(136,"code"),e(137,"whitelist"),t()(),n(138,"td")(139,"code"),e(140,"boolean"),t()(),n(141,"td"),e(142,"If set to true, validator will strip validated (returned) object of any properties that do not use any validation decorators."),t()(),n(143,"tr")(144,"td")(145,"code"),e(146,"forbidNonWhitelisted"),t()(),n(147,"td")(148,"code"),e(149,"boolean"),t()(),n(150,"td"),e(151,"If set to true, instead of stripping non-whitelisted properties validator will throw an exception."),t()(),n(152,"tr")(153,"td")(154,"code"),e(155,"forbidUnknownValues"),t()(),n(156,"td")(157,"code"),e(158,"boolean"),t()(),n(159,"td"),e(160,"If set to true, attempts to validate unknown objects fail immediately."),t()(),n(161,"tr")(162,"td")(163,"code"),e(164,"disableErrorMessages"),t()(),n(165,"td")(166,"code"),e(167,"boolean"),t()(),n(168,"td"),e(169,"If set to true, validation errors will not be returned to the client."),t()(),n(170,"tr")(171,"td")(172,"code"),e(173,"errorHttpStatusCode"),t()(),n(174,"td")(175,"code"),e(176,"number"),t()(),n(177,"td"),e(178,"This setting allows you to specify which exception type will be used in case of an error. By default it throws "),n(179,"code"),e(180,"BadRequestException"),t(),e(181,"."),t()(),n(182,"tr")(183,"td")(184,"code"),e(185,"exceptionFactory"),t()(),n(186,"td")(187,"code"),e(188,"Function"),t()(),n(189,"td"),e(190,"Takes an array of the validation errors and returns an exception object to be thrown."),t()(),n(191,"tr")(192,"td")(193,"code"),e(194,"groups"),t()(),n(195,"td")(196,"code"),e(197,"string[]"),t()(),n(198,"td"),e(199,"Groups to be used during validation of the object."),t()(),n(200,"tr")(201,"td")(202,"code"),e(203,"always"),t()(),n(204,"td")(205,"code"),e(206,"boolean"),t()(),n(207,"td"),e(208,"Set default for "),n(209,"code"),e(210,"always"),t(),e(211," option of decorators. Default can be overridden in decorator options."),t()(),n(212,"tr")(213,"td")(214,"code"),e(215,"strictGroups"),t()(),n(216,"td")(217,"code"),e(218,"boolean"),t()(),n(219,"td"),e(220,"If "),n(221,"code"),e(222,"groups"),t(),e(223," is not given or is empty, ignore decorators with at least one group."),t()(),n(224,"tr")(225,"td")(226,"code"),e(227,"dismissDefaultMessages"),t()(),n(228,"td")(229,"code"),e(230,"boolean"),t()(),n(231,"td"),e(232,"If set to true, the validation will not use default messages. Error message always will be "),n(233,"code"),e(234,"undefined"),t(),e(235," if its not explicitly set."),t()(),n(236,"tr")(237,"td")(238,"code"),e(239,"validationError.target"),t()(),n(240,"td")(241,"code"),e(242,"boolean"),t()(),n(243,"td"),e(244,"Indicates if target should be exposed in "),n(245,"code"),e(246,"ValidationError"),t(),e(247,"."),t()(),n(248,"tr")(249,"td")(250,"code"),e(251,"validationError.value"),t()(),n(252,"td")(253,"code"),e(254,"boolean"),t()(),n(255,"td"),e(256,"Indicates if validated value should be exposed in "),n(257,"code"),e(258,"ValidationError"),t(),e(259,"."),t()(),n(260,"tr")(261,"td")(262,"code"),e(263,"stopAtFirstError"),t()(),n(264,"td")(265,"code"),e(266,"boolean"),t()(),n(267,"td"),e(268,"When set to true, validation of the given property will stop after encountering the first error. Defaults to false."),t()(),n(269,"tr")(270,"td")(271,"code"),e(272,"errorFormat"),t()(),n(273,"td")(274,"code"),e(275,"'list' | 'grouped'"),t()(),n(276,"td"),e(277,"Specifies the format of validation error messages. "),n(278,"code"),e(279,"'list'"),t(),e(280," (default) returns an array of error message strings. "),n(281,"code"),e(282,"'grouped'"),t(),e(283," returns an object with property paths as keys and arrays of unmodified error messages as values, preserving custom validation messages without prepending parent path prefixes."),t()()(),n(284,"blockquote",12)(285,"strong"),e(286,"Notice"),t(),e(287," Find more information about the "),n(288,"code"),e(289,"class-validator"),t(),e(290," package in its "),n(291,"a",7),e(292,"repository"),t(),e(293,`.
`),t(),n(294,"h4",15)(295,"span"),e(296,"Auto-validation"),t()(),n(297,"p"),e(298,"We'll start by binding "),n(299,"code"),e(300,"ValidationPipe"),t(),e(301," at the application level, thus ensuring all endpoints are protected from receiving incorrect data."),t(),n(302,"app-copy-button")(303,"pre")(304,"code",14),e(305,`
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
`),t()()(),n(306,"p"),e(307,"To test our pipe, let's create a basic endpoint."),t(),n(308,"app-copy-button")(309,"pre")(310,"code",14),e(311,`
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return 'This action adds a new user';
}
`),t()()(),n(312,"blockquote",12)(313,"strong"),e(314,"Hint"),t(),e(315," Since TypeScript does not store metadata about "),n(316,"strong"),e(317,"generics or interfaces"),t(),e(318,", when you use them in your DTOs, "),n(319,"code"),e(320,"ValidationPipe"),t(),e(321,` may not be able to properly validate incoming data. For this reason, consider using concrete classes in your DTOs.
`),t(),n(322,"blockquote",12)(323,"strong"),e(324,"Hint"),t(),e(325," When importing your DTOs, you can't use a type-only import as that would be erased at runtime, i.e. remember to "),n(326,"code"),e(327),t(),e(328," instead of "),n(329,"code"),e(330),t(),e(331,`.
`),t(),n(332,"p"),e(333,"Now we can add a few validation rules in our "),n(334,"code"),e(335,"CreateUserDto"),t(),e(336,". We do this using decorators provided by the "),n(337,"code"),e(338,"class-validator"),t(),e(339," package, described in detail "),n(340,"a",16),e(341,"here"),t(),e(342,". In this fashion, any route that uses the "),n(343,"code"),e(344,"CreateUserDto"),t(),e(345," will automatically enforce these validation rules."),t(),n(346,"app-copy-button")(347,"pre")(348,"code",14),e(349,`
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
`),t()()(),n(350,"p"),e(351,"With these rules in place, if a request hits our endpoint with an invalid "),n(352,"code"),e(353,"email"),t(),e(354," property in the request body, the application will automatically respond with a "),n(355,"code"),e(356,"400 Bad Request"),t(),e(357," code, along with the following response body:"),t(),n(358,"pre")(359,"code",17),e(360,`
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["email must be an email"]
}
`),t()(),n(361,"p"),e(362,"In addition to validating request bodies, the "),n(363,"code"),e(364,"ValidationPipe"),t(),e(365," can be used with other request object properties as well. Imagine that we would like to accept "),n(366,"code"),e(367,":id"),t(),e(368," in the endpoint path. To ensure that only numbers are accepted for this request parameter, we can use the following construct:"),t(),n(369,"app-copy-button")(370,"pre")(371,"code",14),e(372,`
@Get(':id')
findOne(@Param() params: FindOneParams) {
  return 'This action returns a user';
}
`),t()()(),n(373,"p")(374,"code"),e(375,"FindOneParams"),t(),e(376,", like a DTO, is simply a class that defines validation rules using "),n(377,"code"),e(378,"class-validator"),t(),e(379,". It would look like this:"),t(),n(380,"app-copy-button")(381,"pre")(382,"code",14),e(383,`
import { IsNumberString } from 'class-validator';

export class FindOneParams {
  @IsNumberString()
  id: string;
}
`),t()()(),n(384,"h4",18)(385,"span"),e(386,"Disable detailed errors"),t()(),n(387,"p"),e(388,"Error messages can be helpful to explain what was incorrect in a request. However, some production environments prefer to disable detailed errors. Do this by passing an options object to the "),n(389,"code"),e(390,"ValidationPipe"),t(),e(391,":"),t(),n(392,"app-copy-button")(393,"pre")(394,"code",14),e(395,`
app.useGlobalPipes(
  new ValidationPipe({
    disableErrorMessages: true,
  }),
);
`),t()()(),n(396,"p"),e(397,"As a result, detailed error messages won't be displayed in the response body."),t(),n(398,"h4",19)(399,"span"),e(400,"Stripping properties"),t()(),n(401,"p"),e(402,"Our "),n(403,"code"),e(404,"ValidationPipe"),t(),e(405," can also filter out properties that should not be received by the method handler. In this case, we can "),n(406,"strong"),e(407,"whitelist"),t(),e(408," the acceptable properties, and any property not included in the whitelist is automatically stripped from the resulting object. For example, if our handler expects "),n(409,"code"),e(410,"email"),t(),e(411," and "),n(412,"code"),e(413,"password"),t(),e(414," properties, but a request also includes an "),n(415,"code"),e(416,"age"),t(),e(417," property, this property can be automatically removed from the resulting DTO. To enable such behavior, set "),n(418,"code"),e(419,"whitelist"),t(),e(420," to "),n(421,"code"),e(422,"true"),t(),e(423,"."),t(),n(424,"app-copy-button")(425,"pre")(426,"code",14),e(427,`
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
  }),
);
`),t()()(),n(428,"p"),e(429,"When set to true, this will automatically remove non-whitelisted properties (those without any decorator in the validation class)."),t(),n(430,"p"),e(431,"Alternatively, you can stop the request from processing when non-whitelisted properties are present, and return an error response to the user. To enable this, set the "),n(432,"code"),e(433,"forbidNonWhitelisted"),t(),e(434," option property to "),n(435,"code"),e(436,"true"),t(),e(437,", in combination with setting "),n(438,"code"),e(439,"whitelist"),t(),e(440," to "),n(441,"code"),e(442,"true"),t(),e(443,"."),t(),n(444,"p"),o(445,"app-banner-courses"),t(),n(446,"h4",20)(447,"span"),e(448,"Transform payload objects"),t()(),n(449,"p"),e(450,"Payloads coming in over the network are plain JavaScript objects. The "),n(451,"code"),e(452,"ValidationPipe"),t(),e(453," can automatically transform payloads to be objects typed according to their DTO classes. To enable auto-transformation, set "),n(454,"code"),e(455,"transform"),t(),e(456," to "),n(457,"code"),e(458,"true"),t(),e(459,". This can be done at a method level:"),t(),n(460,"app-copy-button",21)(461,"span",22),e(462),s(463,"extension"),o(464,"app-tabs",null,1),t(),n(466,"pre")(467,"code",14),e(468,`
@Post()
@UsePipes(new ValidationPipe({ transform: true }))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
`),t()()(),n(469,"p"),e(470,"To enable this behavior globally, set the option on a global pipe:"),t(),n(471,"app-copy-button")(472,"pre")(473,"code",14),e(474,`
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
  }),
);
`),t()()(),n(475,"p"),e(476,"With the auto-transformation option enabled, the "),n(477,"code"),e(478,"ValidationPipe"),t(),e(479," will also perform conversion of primitive types. In the following example, the "),n(480,"code"),e(481,"findOne()"),t(),e(482," method takes one argument which represents an extracted "),n(483,"code"),e(484,"id"),t(),e(485," path parameter:"),t(),n(486,"app-copy-button")(487,"pre")(488,"code",14),e(489,`
@Get(':id')
findOne(@Param('id') id: number) {
  console.log(typeof id === 'number'); // true
  return 'This action returns a user';
}
`),t()()(),n(490,"p"),e(491,"By default, every path parameter and query parameter comes over the network as a "),n(492,"code"),e(493,"string"),t(),e(494,". In the above example, we specified the "),n(495,"code"),e(496,"id"),t(),e(497," type as a "),n(498,"code"),e(499,"number"),t(),e(500," (in the method signature). Therefore, the "),n(501,"code"),e(502,"ValidationPipe"),t(),e(503," will try to automatically convert a string identifier to a number."),t(),n(504,"h4",23)(505,"span"),e(506,"Explicit conversion"),t()(),n(507,"p"),e(508,"In the above section, we showed how the "),n(509,"code"),e(510,"ValidationPipe"),t(),e(511," can implicitly transform query and path parameters based on the expected type. However, this feature requires having auto-transformation enabled."),t(),n(512,"p"),e(513,"Alternatively (with auto-transformation disabled), you can explicitly cast values using the "),n(514,"code"),e(515,"ParseIntPipe"),t(),e(516," or "),n(517,"code"),e(518,"ParseBoolPipe"),t(),e(519," (note that "),n(520,"code"),e(521,"ParseStringPipe"),t(),e(522," is not needed because, as mentioned earlier, every path parameter and query parameter comes over the network as a "),n(523,"code"),e(524,"string"),t(),e(525," by default)."),t(),n(526,"app-copy-button")(527,"pre")(528,"code",14),e(529,`
@Get(':id')
findOne(
  @Param('id', ParseIntPipe) id: number,
  @Query('sort', ParseBoolPipe) sort: boolean,
) {
  console.log(typeof id === 'number'); // true
  console.log(typeof sort === 'boolean'); // true
  return 'This action returns a user';
}
`),t()()(),n(530,"blockquote",12)(531,"strong"),e(532,"Hint"),t(),e(533," The "),n(534,"code"),e(535,"ParseIntPipe"),t(),e(536," and "),n(537,"code"),e(538,"ParseBoolPipe"),t(),e(539," are exported from the "),n(540,"code"),e(541,"@nestjs/common"),t(),e(542,` package.
`),t(),n(543,"h4",24)(544,"span"),e(545,"Mapped types"),t()(),n(546,"p"),e(547,"As you build out features like "),n(548,"strong"),e(549,"CRUD"),t(),e(550," (Create/Read/Update/Delete) it's often useful to construct variants on a base entity type. Nest provides several utility functions that perform type transformations to make this task more convenient."),t(),n(551,"blockquote",25)(552,"strong"),e(553,"Warning"),t(),e(554," If your application uses the "),n(555,"code"),e(556,"@nestjs/swagger"),t(),e(557," package, see "),n(558,"a",26),e(559,"this chapter"),t(),e(560," for more information about Mapped Types. Likewise, if you use the "),n(561,"code"),e(562,"@nestjs/graphql"),t(),e(563," package see "),n(564,"a",27),e(565,"this chapter"),t(),e(566,". Both packages heavily rely on types and so they require a different import to be used. Therefore, if you used "),n(567,"code"),e(568,"@nestjs/mapped-types"),t(),e(569," (instead of an appropriate one, either "),n(570,"code"),e(571,"@nestjs/swagger"),t(),e(572," or "),n(573,"code"),e(574,"@nestjs/graphql"),t(),e(575,` depending on the type of your app), you may face various, undocumented side-effects.
`),t(),n(576,"p"),e(577,"When building input validation types (also called DTOs), it's often useful to build "),n(578,"strong"),e(579,"create"),t(),e(580," and "),n(581,"strong"),e(582,"update"),t(),e(583," variations on the same type. For example, the "),n(584,"strong"),e(585,"create"),t(),e(586," variant may require all fields, while the "),n(587,"strong"),e(588,"update"),t(),e(589," variant may make all fields optional."),t(),n(590,"p"),e(591,"Nest provides the "),n(592,"code"),e(593,"PartialType()"),t(),e(594," utility function to make this task easier and minimize boilerplate."),t(),n(595,"p"),e(596,"The "),n(597,"code"),e(598,"PartialType()"),t(),e(599," function returns a type (class) with all the properties of the input type set to optional. For example, suppose we have a "),n(600,"strong"),e(601,"create"),t(),e(602," type as follows:"),t(),n(603,"app-copy-button")(604,"pre")(605,"code",14),e(606,`
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
`),t()()(),n(607,"p"),e(608,"By default, all of these fields are required. To create a type with the same fields, but with each one optional, use "),n(609,"code"),e(610,"PartialType()"),t(),e(611," passing the class reference ("),n(612,"code"),e(613,"CreateCatDto"),t(),e(614,") as an argument:"),t(),n(615,"app-copy-button")(616,"pre")(617,"code",14),e(618,`
export class UpdateCatDto extends PartialType(CreateCatDto) {}
`),t()()(),n(619,"blockquote",12)(620,"strong"),e(621,"Hint"),t(),e(622," The "),n(623,"code"),e(624,"PartialType()"),t(),e(625," function is imported from the "),n(626,"code"),e(627,"@nestjs/mapped-types"),t(),e(628,` package.
`),t(),n(629,"p"),e(630,"The "),n(631,"code"),e(632,"PickType()"),t(),e(633," function constructs a new type (class) by picking a set of properties from an input type. For example, suppose we start with a type like:"),t(),n(634,"app-copy-button")(635,"pre")(636,"code",14),e(637,`
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
`),t()()(),n(638,"p"),e(639,"We can pick a set of properties from this class using the "),n(640,"code"),e(641,"PickType()"),t(),e(642," utility function:"),t(),n(643,"app-copy-button")(644,"pre")(645,"code",14),e(646,`
export class UpdateCatAgeDto extends PickType(CreateCatDto, ['age'] as const) {}
`),t()()(),n(647,"blockquote",12)(648,"strong"),e(649,"Hint"),t(),e(650," The "),n(651,"code"),e(652,"PickType()"),t(),e(653," function is imported from the "),n(654,"code"),e(655,"@nestjs/mapped-types"),t(),e(656,` package.
`),t(),n(657,"p"),e(658,"The "),n(659,"code"),e(660,"OmitType()"),t(),e(661," function constructs a type by picking all properties from an input type and then removing a particular set of keys. For example, suppose we start with a type like:"),t(),n(662,"app-copy-button")(663,"pre")(664,"code",14),e(665,`
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
`),t()()(),n(666,"p"),e(667,"We can generate a derived type that has every property "),n(668,"strong"),e(669,"except"),t(),n(670,"code"),e(671,"name"),t(),e(672," as shown below. In this construct, the second argument to "),n(673,"code"),e(674,"OmitType"),t(),e(675," is an array of property names."),t(),n(676,"app-copy-button")(677,"pre")(678,"code",14),e(679,`
export class UpdateCatDto extends OmitType(CreateCatDto, ['name'] as const) {}
`),t()()(),n(680,"blockquote",12)(681,"strong"),e(682,"Hint"),t(),e(683," The "),n(684,"code"),e(685,"OmitType()"),t(),e(686," function is imported from the "),n(687,"code"),e(688,"@nestjs/mapped-types"),t(),e(689,` package.
`),t(),n(690,"p"),e(691,"The "),n(692,"code"),e(693,"IntersectionType()"),t(),e(694," function combines two types into one new type (class). For example, suppose we start with two types like:"),t(),n(695,"app-copy-button")(696,"pre")(697,"code",14),e(698,`
export class CreateCatDto {
  name: string;
  breed: string;
}

export class AdditionalCatInfo {
  color: string;
}
`),t()()(),n(699,"p"),e(700,"We can generate a new type that combines all properties in both types."),t(),n(701,"app-copy-button")(702,"pre")(703,"code",14),e(704,`
export class UpdateCatDto extends IntersectionType(
  CreateCatDto,
  AdditionalCatInfo,
) {}
`),t()()(),n(705,"blockquote",12)(706,"strong"),e(707,"Hint"),t(),e(708," The "),n(709,"code"),e(710,"IntersectionType()"),t(),e(711," function is imported from the "),n(712,"code"),e(713,"@nestjs/mapped-types"),t(),e(714,` package.
`),t(),n(715,"p"),e(716,"The type mapping utility functions are composable. For example, the following will produce a type (class) that has all of the properties of the "),n(717,"code"),e(718,"CreateCatDto"),t(),e(719," type except for "),n(720,"code"),e(721,"name"),t(),e(722,", and those properties will be set to optional:"),t(),n(723,"app-copy-button")(724,"pre")(725,"code",14),e(726,`
export class UpdateCatDto extends PartialType(
  OmitType(CreateCatDto, ['name'] as const),
) {}
`),t()()(),n(727,"h4",28)(728,"span"),e(729,"Parsing and validating arrays"),t()(),n(730,"p"),e(731,"TypeScript does not store metadata about generics or interfaces, so when you use them in your DTOs, "),n(732,"code"),e(733,"ValidationPipe"),t(),e(734," may not be able to properly validate incoming data. For instance, in the following code, "),n(735,"code"),e(736,"createUserDtos"),t(),e(737," won't be correctly validated:"),t(),n(738,"app-copy-button")(739,"pre")(740,"code",14),e(741,`
@Post()
createBulk(@Body() createUserDtos: CreateUserDto[]) {
  return 'This action adds new users';
}
`),t()()(),n(742,"p"),e(743,"To validate the array, create a dedicated class which contains a property that wraps the array, or use the "),n(744,"code"),e(745,"ParseArrayPipe"),t(),e(746,"."),t(),n(747,"app-copy-button")(748,"pre")(749,"code",14),e(750,`
@Post()
createBulk(
  @Body(new ParseArrayPipe({ items: CreateUserDto }))
  createUserDtos: CreateUserDto[],
) {
  return 'This action adds new users';
}
`),t()()(),n(751,"p"),e(752,"In addition, the "),n(753,"code"),e(754,"ParseArrayPipe"),t(),e(755," may come in handy when parsing query parameters. Let's consider a "),n(756,"code"),e(757,"findByIds()"),t(),e(758," method that returns users based on identifiers passed as query parameters."),t(),n(759,"app-copy-button")(760,"pre")(761,"code",14),e(762,`
@Get()
findByIds(
  @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
  ids: number[],
) {
  return 'This action returns users by ids';
}
`),t()()(),n(763,"p"),e(764,"This construction validates the incoming query parameters from an HTTP "),n(765,"code"),e(766,"GET"),t(),e(767," request like the following:"),t(),n(768,"pre")(769,"code",11),e(770,`
GET /?ids=1,2,3
`),t()(),n(771,"h4",29)(772,"span"),e(773,"WebSockets and Microservices"),t()(),n(774,"p"),e(775,"While this chapter shows examples using HTTP style applications (e.g., Express or Fastify), the "),n(776,"code"),e(777,"ValidationPipe"),t(),e(778," works the same for WebSockets and microservices, regardless of the transport method that is used."),t(),n(779,"h4",30)(780,"span"),e(781,"Learn more"),t()(),n(782,"p"),e(783,"Read more about custom validators, error messages, and available decorators as provided by the "),n(784,"code"),e(785,"class-validator"),t(),e(786," package "),n(787,"a",7),e(788,"here"),t(),e(789,"."),t()()),c&2){let b=r(465);i(327),I("import ","{"," CreateUserDto ","}"),i(3),I("import type ","{"," CreateUserDto ","}"),i(132),l(" ",d(463,5,"cats.controller",b.isJsActive),`
`)}},dependencies:[g,C,E,O,y,w],encapsulation:2,changeDetection:0})}return a})();var se=(()=>{class a extends S{static \u0275fac=(()=>{let m;return function(p){return(m||(m=x(a)))(p||a)}})();static \u0275cmp=h({type:a,selectors:[["app-versioning"]],features:[f],decls:448,vars:56,consts:[["contentReference",""],["app6b17012e16d90d12959c947d66cbceec102ca0b9",""],["appc6067da419166c937147e02d81177c31fb5c2874",""],["app38ed752b967c6d3a87d9ea63f939d859d043fe33",""],["apped379ac6c3f8c980295ff11b4f0e4cd2c0d6a02b",""],["appc8bd7537763cef3e646590ce841d93e532002872",""],["appc0fcbdc2c109e557350bf10dce5a5bfd6b6d8c43",""],["appbe9062f0cbc57ed57a2e3ce2b61e3da2c6c56071",""],["appc69bf2d5f926a82dd3809f83b6771b8374298faf",""],["app9d5f82a7db9e80539628d80a754747cee11ebb3a",""],["appe22acb757bea7ce288190face5f5c2da6f62471b",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/techniques/versioning.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","versioning"],[1,"info"],["href","techniques/versioning#uri-versioning-type"],["href","techniques/versioning#header-versioning-type"],["href","techniques/versioning#media-type-versioning-type"],["href","techniques/versioning#custom-versioning-type"],["appAnchor","","id","uri-versioning-type"],[1,"warning"],["href","faq/global-prefix"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["appAnchor","","id","header-versioning-type"],["appAnchor","","id","media-type-versioning-type"],["appAnchor","","id","custom-versioning-type"],["appAnchor","","id","usage"],["appAnchor","","id","controller-versions"],["appAnchor","","id","route-versions"],["appAnchor","","id","multiple-versions"],["appAnchor","","id","version-neutral"],["appAnchor","","id","global-default-version"],["appAnchor","","id","middleware-versioning"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/middleware"]],template:function(c,p){if(c&1&&(n(0,"div",11,0)(2,"div",12)(3,"a",13),o(4,"i",14),t()(),n(5,"h3",15),e(6,"Versioning"),t(),n(7,"blockquote",16)(8,"strong"),e(9,"Hint"),t(),e(10,` This chapter is only relevant to HTTP-based applications.
`),t(),n(11,"p"),e(12,"Versioning allows you to have "),n(13,"strong"),e(14,"different versions"),t(),e(15," of your controllers or individual routes running within the same application. Applications change very often and it is not unusual that there are breaking changes that you need to make while still needing to support the previous version of the application."),t(),n(16,"p"),e(17,"There are 4 types of versioning that are supported:"),t(),n(18,"table")(19,"tr")(20,"td")(21,"a",17)(22,"code"),e(23,"URI Versioning"),t()()(),n(24,"td"),e(25,"The version will be passed within the URI of the request (default)"),t()(),n(26,"tr")(27,"td")(28,"a",18)(29,"code"),e(30,"Header Versioning"),t()()(),n(31,"td"),e(32,"A custom request header will specify the version"),t()(),n(33,"tr")(34,"td")(35,"a",19)(36,"code"),e(37,"Media Type Versioning"),t()()(),n(38,"td"),e(39,"The "),n(40,"code"),e(41,"Accept"),t(),e(42," header of the request will specify the version"),t()(),n(43,"tr")(44,"td")(45,"a",20)(46,"code"),e(47,"Custom Versioning"),t()()(),n(48,"td"),e(49,"Any aspect of the request may be used to specify the version(s). A custom function is provided to extract said version(s)."),t()()(),n(50,"h4",21)(51,"span"),e(52,"URI Versioning Type"),t()(),n(53,"p"),e(54,"URI Versioning uses the version passed within the URI of the request, such as "),n(55,"code"),e(56,"https://example.com/v1/route"),t(),e(57," and "),n(58,"code"),e(59,"https://example.com/v2/route"),t(),e(60,"."),t(),n(61,"blockquote",22)(62,"strong"),e(63,"Notice"),t(),e(64," With URI Versioning the version will be automatically added to the URI after the "),n(65,"a",23),e(66,"global path prefix"),t(),e(67,` (if one exists), and before any controller or route paths.
`),t(),n(68,"p"),e(69,"To enable URI Versioning for your application, do the following:"),t(),n(70,"app-copy-button",24)(71,"span",25),e(72),s(73,"extension"),o(74,"app-tabs",null,1),t(),n(76,"pre")(77,"code",26),e(78,`
const app = await NestFactory.create(AppModule);
// or "app.enableVersioning()"
app.enableVersioning({
  type: VersioningType.URI,
});
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(79,"blockquote",22)(80,"strong"),e(81,"Notice"),t(),e(82," The version in the URI will be automatically prefixed with "),n(83,"code"),e(84,"v"),t(),e(85," by default, however the prefix value can be configured by setting the "),n(86,"code"),e(87,"prefix"),t(),e(88," key to your desired prefix or "),n(89,"code"),e(90,"false"),t(),e(91,` if you wish to disable it.
`),t(),n(92,"blockquote",16)(93,"strong"),e(94,"Hint"),t(),e(95," The "),n(96,"code"),e(97,"VersioningType"),t(),e(98," enum is available to use for the "),n(99,"code"),e(100,"type"),t(),e(101," property and is imported from the "),n(102,"code"),e(103,"@nestjs/common"),t(),e(104,` package.
`),t(),n(105,"h4",27)(106,"span"),e(107,"Header Versioning Type"),t()(),n(108,"p"),e(109,"Header Versioning uses a custom, user specified, request header to specify the version where the value of the header will be the version to use for the request."),t(),n(110,"p"),e(111,"Example HTTP Requests for Header Versioning:"),t(),n(112,"p"),e(113,"To enable "),n(114,"strong"),e(115,"Header Versioning"),t(),e(116," for your application, do the following:"),t(),n(117,"app-copy-button",24)(118,"span",25),e(119),s(120,"extension"),o(121,"app-tabs",null,2),t(),n(123,"pre")(124,"code",26),e(125,`
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'Custom-Header',
});
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(126,"p"),e(127,"The "),n(128,"code"),e(129,"header"),t(),e(130," property should be the name of the header that will contain the version of the request."),t(),n(131,"blockquote",16)(132,"strong"),e(133,"Hint"),t(),e(134," The "),n(135,"code"),e(136,"VersioningType"),t(),e(137," enum is available to use for the "),n(138,"code"),e(139,"type"),t(),e(140," property and is imported from the "),n(141,"code"),e(142,"@nestjs/common"),t(),e(143,` package.
`),t(),n(144,"h4",28)(145,"span"),e(146,"Media Type Versioning Type"),t()(),n(147,"p"),e(148,"Media Type Versioning uses the "),n(149,"code"),e(150,"Accept"),t(),e(151," header of the request to specify the version."),t(),n(152,"p"),e(153,"Within the "),n(154,"code"),e(155,"Accept"),t(),e(156," header, the version will be separated from the media type with a semi-colon, "),n(157,"code"),e(158,";"),t(),e(159,". It should then contain a key-value pair that represents the version to use for the request, such as "),n(160,"code"),e(161,"Accept: application/json;v=2"),t(),e(162,". They key is treated more as a prefix when determining the version will to be configured to include the key and separator."),t(),n(163,"p"),e(164,"To enable "),n(165,"strong"),e(166,"Media Type Versioning"),t(),e(167," for your application, do the following:"),t(),n(168,"app-copy-button",24)(169,"span",25),e(170),s(171,"extension"),o(172,"app-tabs",null,3),t(),n(174,"pre")(175,"code",26),e(176,`
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  key: 'v=',
});
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(177,"p"),e(178,"The "),n(179,"code"),e(180,"key"),t(),e(181," property should be the key and separator of the key-value pair that contains the version. For the example "),n(182,"code"),e(183,"Accept: application/json;v=2"),t(),e(184,", the "),n(185,"code"),e(186,"key"),t(),e(187," property would be set to "),n(188,"code"),e(189,"v="),t(),e(190,"."),t(),n(191,"blockquote",16)(192,"strong"),e(193,"Hint"),t(),e(194," The "),n(195,"code"),e(196,"VersioningType"),t(),e(197," enum is available to use for the "),n(198,"code"),e(199,"type"),t(),e(200," property and is imported from the "),n(201,"code"),e(202,"@nestjs/common"),t(),e(203,` package.
`),t(),n(204,"h4",29)(205,"span"),e(206,"Custom Versioning Type"),t()(),n(207,"p"),e(208,`Custom Versioning uses any aspect of the request to specify the version (or versions). The incoming request is analyzed
using an `),n(209,"code"),e(210,"extractor"),t(),e(211," function that returns a string or array of strings."),t(),n(212,"p"),e(213,`If multiple versions are provided by the requester, the extractor function can return an array of strings, sorted in
order of greatest/highest version to smallest/lowest version. Versions are matched to routes in order from highest to
lowest.`),t(),n(214,"p"),e(215,"If an empty string or array is returned from the "),n(216,"code"),e(217,"extractor"),t(),e(218,", no routes are matched and a 404 is returned."),t(),n(219,"p"),e(220,"For example, if an incoming request specifies it supports versions "),n(221,"code"),e(222,"1"),t(),e(223,", "),n(224,"code"),e(225,"2"),t(),e(226,", and "),n(227,"code"),e(228,"3"),t(),e(229,", the "),n(230,"code"),e(231,"extractor"),t(),n(232,"strong"),e(233,"MUST"),t(),e(234," return "),n(235,"code"),e(236,"[3, 2, 1]"),t(),e(237,". This ensures that the highest possible route version is selected first."),t(),n(238,"p"),e(239,"If versions "),n(240,"code"),e(241,"[3, 2, 1]"),t(),e(242," are extracted, but routes only exist for version "),n(243,"code"),e(244,"2"),t(),e(245," and "),n(246,"code"),e(247,"1"),t(),e(248,", the route that matches version "),n(249,"code"),e(250,"2"),t(),e(251,`
is selected (version `),n(252,"code"),e(253,"3"),t(),e(254," is automatically ignored)."),t(),n(255,"blockquote",22)(256,"strong"),e(257,"Notice"),t(),e(258," Selecting the highest matching version based on the array returned from "),n(259,"code"),e(260,"extractor"),t(),e(261," > "),n(262,"strong"),e(263,"does not reliably work"),t(),e(264,` with the Express adapter due to design limitations. A single version (either a string or
array of 1 element) works just fine in Express. Fastify correctly supports both highest matching version
selection and single version selection.
`),t(),n(265,"p"),e(266,"To enable "),n(267,"strong"),e(268,"Custom Versioning"),t(),e(269," for your application, create an "),n(270,"code"),e(271,"extractor"),t(),e(272,` function and pass it into your application
like so:`),t(),n(273,"app-copy-button",24)(274,"span",25),e(275),s(276,"extension"),o(277,"app-tabs",null,4),t(),n(279,"pre")(280,"code",26),e(281,`
// Example extractor that pulls out a list of versions from a custom header and turns it into a sorted array.
// This example uses Fastify, but Express requests can be processed in a similar way.
const extractor = (request: FastifyRequest): string | string[] =>
  [request.headers['custom-versioning-field'] ?? '']
     .flatMap(v => v.split(','))
     .filter(v => !!v)
     .sort()
     .reverse()

const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.CUSTOM,
  extractor,
});
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(282,"h4",30)(283,"span"),e(284,"Usage"),t()(),n(285,"p"),e(286,"Versioning allows you to version controllers, individual routes, and also provides a way for certain resources to opt-out of versioning. The usage of versioning is the same regardless of the Versioning Type your application uses."),t(),n(287,"blockquote",22)(288,"strong"),e(289,"Notice"),t(),e(290," If versioning is enabled for the application but the controller or route does not specify the version, any requests to that controller/route will be returned a "),n(291,"code"),e(292,"404"),t(),e(293," response status. Similarly, if a request is received containing a version that does not have a corresponding controller or route, it will also be returned a "),n(294,"code"),e(295,"404"),t(),e(296,` response status.
`),t(),n(297,"h4",31)(298,"span"),e(299,"Controller versions"),t()(),n(300,"p"),e(301,"A version can be applied to a controller, setting the version for all routes within the controller."),t(),n(302,"p"),e(303,"To add a version to a controller do the following:"),t(),n(304,"app-copy-button",24)(305,"span",25),e(306),s(307,"extension"),o(308,"app-tabs",null,5),t(),n(310,"pre")(311,"code",26),e(312,`
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats for version 1';
  }
}
`),t()(),n(313,"pre")(314,"code",26),e(315,`
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll() {
    return 'This action returns all cats for version 1';
  }
}
`),t()()(),n(316,"h4",32)(317,"span"),e(318,"Route versions"),t()(),n(319,"p"),e(320,"A version can be applied to an individual route. This version will override any other version that would effect the route, such as the Controller Version."),t(),n(321,"p"),e(322,"To add a version to an individual route do the following:"),t(),n(323,"app-copy-button",24)(324,"span",25),e(325),s(326,"extension"),o(327,"app-tabs",null,6),t(),n(329,"pre")(330,"code",26),e(331,`
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1(): string {
    return 'This action returns all cats for version 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2(): string {
    return 'This action returns all cats for version 2';
  }
}
`),t()(),n(332,"pre")(333,"code",26),e(334,`
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1() {
    return 'This action returns all cats for version 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2() {
    return 'This action returns all cats for version 2';
  }
}
`),t()()(),n(335,"h4",33)(336,"span"),e(337,"Multiple versions"),t()(),n(338,"p"),e(339,"Multiple versions can be applied to a controller or route. To use multiple versions, you would set the version to be an Array."),t(),n(340,"p"),e(341,"To add multiple versions do the following:"),t(),n(342,"app-copy-button",24)(343,"span",25),e(344),s(345,"extension"),o(346,"app-tabs",null,7),t(),n(348,"pre")(349,"code",26),e(350,`
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats for version 1 or 2';
  }
}
`),t()(),n(351,"pre")(352,"code",26),e(353,`
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll() {
    return 'This action returns all cats for version 1 or 2';
  }
}
`),t()()(),n(354,"h4",34)(355,"span"),e(356,'Version "Neutral"'),t()(),n(357,"p"),e(358,"Some controllers or routes may not care about the version and would have the same functionality regardless of the version. To accommodate this, the version can be set to "),n(359,"code"),e(360,"VERSION_NEUTRAL"),t(),e(361," symbol."),t(),n(362,"p"),e(363,"An incoming request will be mapped to a "),n(364,"code"),e(365,"VERSION_NEUTRAL"),t(),e(366," controller or route regardless of the version sent in the request in addition to if the request does not contain a version at all."),t(),n(367,"blockquote",22)(368,"strong"),e(369,"Notice"),t(),e(370," For URI Versioning, a "),n(371,"code"),e(372,"VERSION_NEUTRAL"),t(),e(373,` resource would not have the version present in the URI.
`),t(),n(374,"p"),e(375,"To add a version neutral controller or route do the following:"),t(),n(376,"app-copy-button",24)(377,"span",25),e(378),s(379,"extension"),o(380,"app-tabs",null,8),t(),n(382,"pre")(383,"code",26),e(384,`
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats regardless of version';
  }
}
`),t()(),n(385,"pre")(386,"code",26),e(387,`
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll() {
    return 'This action returns all cats regardless of version';
  }
}
`),t()()(),n(388,"h4",35)(389,"span"),e(390,"Global default version"),t()(),n(391,"p"),e(392,"If you do not want to provide a version for each controller/or individual routes, or if you want to have a specific version set as the default version for every controller/route that don't have the version specified, you could set the "),n(393,"code"),e(394,"defaultVersion"),t(),e(395," as follows:"),t(),n(396,"app-copy-button",24)(397,"span",25),e(398),s(399,"extension"),o(400,"app-tabs",null,9),t(),n(402,"pre")(403,"code",26),e(404,`
app.enableVersioning({
  // ...
  defaultVersion: '1'
  // or
  defaultVersion: ['1', '2']
  // or
  defaultVersion: VERSION_NEUTRAL
});
`),t()()(),n(405,"h4",36)(406,"span"),e(407,"Middleware versioning"),t()(),n(408,"p")(409,"a",37),e(410,"Middlewares"),t(),e(411," can also use versioning metadata to configure the middleware for a specific route's version. To do so, provide the version number as one of the parameters for the "),n(412,"code"),e(413,"MiddlewareConsumer.forRoutes()"),t(),e(414," method:"),t(),n(415,"app-copy-button",24)(416,"span",25),e(417),s(418,"extension"),o(419,"app-tabs",null,10),t(),n(421,"pre")(422,"code",26),e(423,`
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET, version: '2' });
  }
}
`),t()()(),n(424,"p"),e(425,"With the code above, the "),n(426,"code"),e(427,"LoggerMiddleware"),t(),e(428," will only be applied to the version '2' of "),n(429,"code"),e(430,"/cats"),t(),e(431," endpoint."),t(),n(432,"blockquote",16)(433,"strong"),e(434,"Notice"),t(),e(435," Middlewares work with any versioning type described in the this section: "),n(436,"code"),e(437,"URI"),t(),e(438,", "),n(439,"code"),e(440,"Header"),t(),e(441,", "),n(442,"code"),e(443,"Media Type"),t(),e(444," or "),n(445,"code"),e(446,"Custom"),t(),e(447,`.
`),t()()),c&2){let b=r(75),v=r(122),T=r(173),k=r(278),M=r(309),A=r(328),q=r(347),F=r(381),P=r(401),N=r(420);i(72),l(" ",d(73,26,"main",b.isJsActive),`
`),i(47),l(" ",d(120,29,"main",v.isJsActive),`
`),i(51),l(" ",d(171,32,"main",T.isJsActive),`
`),i(105),l(" ",d(276,35,"main",k.isJsActive),`
`),i(31),l(" ",d(307,38,"cats.controller",M.isJsActive),`
`),i(4),u("hide",M.isJsActive),i(3),u("hide",!M.isJsActive),i(12),l(" ",d(326,41,"cats.controller",A.isJsActive),`
`),i(4),u("hide",A.isJsActive),i(3),u("hide",!A.isJsActive),i(12),l(" ",d(345,44,"cats.controller",q.isJsActive),`
`),i(4),u("hide",q.isJsActive),i(3),u("hide",!q.isJsActive),i(27),l(" ",d(379,47,"cats.controller",F.isJsActive),`
`),i(4),u("hide",F.isJsActive),i(3),u("hide",!F.isJsActive),i(13),l(" ",d(399,50,"main",P.isJsActive),`
`),i(19),l(" ",d(418,53,"app.module",N.isJsActive),`
`)}},dependencies:[g,E,y,w],encapsulation:2,changeDetection:0})}return a})();var Gn=[{path:"authentication",redirectTo:"/security/authentication"},{path:"mvc",component:X,data:{title:"MVC"}},{path:"serialization",component:te,data:{title:"Serialization"}},{path:"caching",component:J,data:{title:"Caching"}},{path:"validation",component:le,data:{title:"Validation"}},{path:"sql",redirectTo:"database"},{path:"database",component:oe,data:{title:"Database"}},{path:"mongodb",component:K,data:{title:"MongoDB"}},{path:"file-upload",component:G,data:{title:"File upload"}},{path:"streaming-files",component:ae,data:{title:"Streaming Files"}},{path:"logger",component:$,data:{title:"Logger"}},{path:"performance",component:Z,data:{title:"Performance (Fastify)"}},{path:"http-module",component:Y,data:{title:"HTTP module"}},{path:"configuration",component:W,data:{title:"Configuration"}},{path:"security",redirectTo:"/security/helmet"},{path:"cookies",component:V,data:{title:"Cookies"}},{path:"task-scheduling",component:re,data:{title:"Task Scheduling"}},{path:"compression",component:z,data:{title:"Compression"}},{path:"queues",component:ee,data:{title:"Queues"}},{path:"hot-reload",redirectTo:"/recipes/hot-reload"},{path:"server-sent-events",component:ne,data:{title:"Server-Sent Events"}},{path:"versioning",component:se,data:{title:"Versioning"}},{path:"events",component:Q,data:{title:"Events"}},{path:"session",component:ie,data:{title:"Session"}}];export{Gn as TECHNIQUES_ROUTES};
