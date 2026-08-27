import{a as _}from"./chunk-HWO3INMO.js";import{a as H}from"./chunk-A6GBSRU4.js";import{a as v,b as C}from"./chunk-AO7BAPTM.js";import{G as i,L as f,Ma as M,N as g,Qa as E,Ra as y,Sa as b,V as n,W as t,X as r,ja as o,ka as a,la as e,na as m,oa as N,ua as p,va as x,y as S}from"./chunk-IPH2CUBH.js";var J=(()=>{class s extends E{static \u0275fac=(()=>{let l;return function(h){return(l||(l=S(s)))(h||s)}})();static \u0275cmp=f({type:s,selectors:[["app-basics"]],features:[g],decls:905,vars:46,consts:[["contentReference",""],["app1973a6320fb5086ba2f07f35c2032a85b4804383",""],["appfe38632a286a43840d71f4620ff66e4aeb8f60a8",""],["app161baa0160fc721dd934bafa596c8254893d5f79",""],["app4726152beadc900c51136716974e7f5eb5c96a13",""],["appa9ce94db48b034a3d1dbf920924cf9ed95f5f7cc",""],["app9eb4b440204c5390200d40378cae7eb85d30c7fc",""],["app6ad08576d77dba6b32f85ce7ba1bfd7359020238",""],["app06e610ffa13a9397e284b86a1fd63daf27d6ed61",""],["app9116378581c2db8ffeda56b6bb87f745de2930c9",""],["app438cc59ecd86c6a3e73a20536ba04e9101e7298e",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/microservices/basics.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","overview"],["src","/assets/Microservices_1.png",1,"illustrative-image"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","getting-started"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["href","https://github.com/nestjs/nest/blob/master/packages/microservices/interfaces/serializer.interface.ts","target","_blank"],["href","https://github.com/nestjs/nest/blob/master/packages/microservices/interfaces/deserializer.interface.ts","target","_blank"],["appAnchor","","id","message-and-event-patterns"],["appAnchor","","id","request-response"],["rel","nofollow","target","_blank","href","https://docs.confluent.io/3.0.0/streams/"],["rel","nofollow","target","_blank","href","https://github.com/nats-io/node-nats-streaming"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/microservices/basics#event-based"],["rel","nofollow","target","_blank","href","https://nats.io/"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/controllers"],["appAnchor","","id","asynchronous-responses"],["appAnchor","","id","event-based"],["appAnchor","","id","additional-request-details"],["appAnchor","","id","client-producer-class"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/fundamentals/custom-providers#non-class-based-provider-tokens"],["routerLink","/fundamentals/custom-providers"],["appAnchor","","id","sending-messages"],["appAnchor","","id","publishing-events"],["appAnchor","","id","request-scoping"],["routerLink","/fundamentals/injection-scopes"],["appAnchor","","id","instance-status-updates"],["appAnchor","","id","listening-to-internal-events"],["appAnchor","","id","underlying-driver-access"],["appAnchor","","id","handling-timeouts"],["rel","nofollow","target","_blank","href","https://rxjs.dev"],["rel","nofollow","target","_blank","href","https://github.com/ReactiveX/rxjs"],["appAnchor","","id","tls-support"],["rel","nofollow","target","_blank","href","https://nodejs.org/api/tls.html"],["appAnchor","","id","dynamic-configuration"]],template:function(c,h){if(c&1&&(n(0,"div",11,0)(2,"div",12)(3,"a",13),r(4,"i",14),t()(),n(5,"h3",15),e(6,"Overview"),t(),n(7,"p"),e(8,"In addition to traditional (sometimes called monolithic) application architectures, Nest natively supports the microservice architectural style of development. Most of the concepts discussed elsewhere in this documentation, such as dependency injection, decorators, exception filters, pipes, guards and interceptors, apply equally to microservices. Wherever possible, Nest abstracts implementation details so that the same components can run across HTTP-based platforms, WebSockets, and Microservices. This section covers the aspects of Nest that are specific to microservices."),t(),n(9,"p"),e(10,"In Nest, a microservice is fundamentally an application that uses a different "),n(11,"strong"),e(12,"transport"),t(),e(13," layer than HTTP."),t(),n(14,"figure"),r(15,"img",16),t(),n(16,"p"),e(17,"Nest supports several built-in transport layer implementations, called "),n(18,"strong"),e(19,"transporters"),t(),e(20,", which are responsible for transmitting messages between different microservice instances. Most transporters natively support both "),n(21,"strong"),e(22,"request-response"),t(),e(23," and "),n(24,"strong"),e(25,"event-based"),t(),e(26," message styles. Nest abstracts the implementation details of each transporter behind a canonical interface for both request-response and event-based messaging. This makes it easy to switch from one transport layer to another -- for example to leverage the specific reliability or performance features of a particular transport layer -- without impacting your application code."),t(),n(27,"h4",17)(28,"span"),e(29,"Installation"),t()(),n(30,"p"),e(31,"To start building microservices, first install the required package:"),t(),n(32,"pre")(33,"code",18),e(34,`
$ npm i --save @nestjs/microservices
`),t()(),n(35,"h4",19)(36,"span"),e(37,"Getting started"),t()(),n(38,"p"),e(39,"To instantiate a microservice, use the "),n(40,"code"),e(41,"createMicroservice()"),t(),e(42," method of the "),n(43,"code"),e(44,"NestFactory"),t(),e(45," class:"),t(),n(46,"app-copy-button",20)(47,"span",21),e(48),p(49,"extension"),r(50,"app-tabs",null,1),t(),n(52,"pre")(53,"code",22),e(54,`
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
    },
  );
  await app.listen();
}
bootstrap();
`),t()(),n(55,"pre")(56,"code",22),e(57,`
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
  });
  await app.listen();
}
bootstrap();
`),t()()(),n(58,"blockquote",23)(59,"strong"),e(60,"Hint"),t(),e(61," Microservices use the "),n(62,"strong"),e(63,"TCP"),t(),e(64,` transport layer by default.
`),t(),n(65,"p"),e(66,"The second argument of the "),n(67,"code"),e(68,"createMicroservice()"),t(),e(69," method is an "),n(70,"code"),e(71,"options"),t(),e(72," object. This object may consist of two members:"),t(),n(73,"table")(74,"tr")(75,"td")(76,"code"),e(77,"transport"),t()(),n(78,"td"),e(79,"Specifies the transporter (for example, "),n(80,"code"),e(81,"Transport.NATS"),t(),e(82,")"),t()(),n(83,"tr")(84,"td")(85,"code"),e(86,"options"),t()(),n(87,"td"),e(88,"A transporter-specific options object that determines transporter behavior"),t()()(),n(89,"p"),e(90," The "),n(91,"code"),e(92,"options"),t(),e(93," object is specific to the chosen transporter. The "),n(94,"strong"),e(95,"TCP"),t(),e(96,` transporter exposes the properties described below. For other transporters (e.g, Redis, MQTT, etc.), see the relevant chapter for a description of the available options.
`),t(),n(97,"table")(98,"tr")(99,"td")(100,"code"),e(101,"host"),t()(),n(102,"td"),e(103,"Connection hostname"),t()(),n(104,"tr")(105,"td")(106,"code"),e(107,"port"),t()(),n(108,"td"),e(109,"Connection port"),t()(),n(110,"tr")(111,"td")(112,"code"),e(113,"retryAttempts"),t()(),n(114,"td"),e(115,"Number of times to retry message (default: "),n(116,"code"),e(117,"0"),t(),e(118,")"),t()(),n(119,"tr")(120,"td")(121,"code"),e(122,"retryDelay"),t()(),n(123,"td"),e(124,"Delay between message retry attempts (ms) (default: "),n(125,"code"),e(126,"0"),t(),e(127,")"),t()(),n(128,"tr")(129,"td")(130,"code"),e(131,"serializer"),t()(),n(132,"td"),e(133,"Custom "),n(134,"a",24),e(135,"serializer"),t(),e(136," for outgoing messages"),t()(),n(137,"tr")(138,"td")(139,"code"),e(140,"deserializer"),t()(),n(141,"td"),e(142,"Custom "),n(143,"a",25),e(144,"deserializer"),t(),e(145," for incoming messages"),t()(),n(146,"tr")(147,"td")(148,"code"),e(149,"socketClass"),t()(),n(150,"td"),e(151,"A custom Socket that extends "),n(152,"code"),e(153,"TcpSocket"),t(),e(154," (default: "),n(155,"code"),e(156,"JsonSocket"),t(),e(157,")"),t()(),n(158,"tr")(159,"td")(160,"code"),e(161,"tlsOptions"),t()(),n(162,"td"),e(163,"Options to configure the tls protocol"),t()()(),n(164,"blockquote",23)(165,"strong"),e(166,"Hint"),t(),e(167,` The above properties are specific to the TCP transporter. For information on available options for other transporters, refer to the relevant chapter.
`),t(),n(168,"h4",26)(169,"span"),e(170,"Message and Event Patterns"),t()(),n(171,"p"),e(172,"Microservices recognize both messages and events by "),n(173,"strong"),e(174,"patterns"),t(),e(175,". A pattern is a plain value, for example, a literal object or a string. Patterns are automatically serialized and sent over the network along with the data portion of a message. In this way, message senders and consumers can coordinate which requests are consumed by which handlers."),t(),n(176,"h4",27)(177,"span"),e(178,"Request-response"),t()(),n(179,"p"),e(180,"The request-response message style is useful when you need to "),n(181,"strong"),e(182,"exchange"),t(),e(183," messages between various external services. This paradigm ensures that the service has actually received the message (without requiring you to manually implement an acknowledgment protocol). However, the request-response approach may not always be the best fit. For example, streaming transporters, such as "),n(184,"a",28),e(185,"Kafka"),t(),e(186," or "),n(187,"a",29),e(188,"NATS streaming"),t(),e(189,", which use log-based persistence, are optimized for addressing a different set of challenges, more aligned with the event messaging paradigm (see "),n(190,"a",30),e(191,"event-based messaging"),t(),e(192," for more details)."),t(),n(193,"p"),e(194,"To enable the request-response message type, Nest creates two logical channels: one for transferring data and another for waiting for incoming responses. For some underlying transports, like "),n(195,"a",31),e(196,"NATS"),t(),e(197,", this dual-channel support is provided out-of-the-box. For others, Nest compensates by manually creating separate channels. While this is effective, it can introduce some overhead. Therefore, if you don\u2019t require a request-response message style, you may want to consider using the event-based method."),t(),n(198,"p"),e(199,"To create a message handler based on the request-response paradigm, use the "),n(200,"code"),e(201,"@MessagePattern()"),t(),e(202," decorator, which is imported from the "),n(203,"code"),e(204,"@nestjs/microservices"),t(),e(205," package. This decorator should only be used within "),n(206,"a",32),e(207,"controller"),t(),e(208," classes, as they serve as the entry points for your application. Using it in providers will have no effect, as they will be ignored by the Nest runtime."),t(),n(209,"app-copy-button",20)(210,"span",21),e(211),p(212,"extension"),r(213,"app-tabs",null,2),t(),n(215,"pre")(216,"code",22),e(217,`
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  accumulate(data: number[]): number {
    return (data || []).reduce((a, b) => a + b);
  }
}
`),t()(),n(218,"pre")(219,"code",22),e(220,`
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  accumulate(data) {
    return (data || []).reduce((a, b) => a + b);
  }
}
`),t()()(),n(221,"p"),e(222,"In the above code, the "),n(223,"code"),e(224,"accumulate()"),t(),n(225,"strong"),e(226,"message handler"),t(),e(227," listens for messages that match the "),n(228,"code"),e(229),t(),e(230," message pattern. The message handler takes a single argument, the "),n(231,"code"),e(232,"data"),t(),e(233," passed from the client. In this case, the data is an array of numbers that need to be accumulated."),t(),n(234,"h4",33)(235,"span"),e(236,"Asynchronous responses"),t()(),n(237,"p"),e(238,"Message handlers can respond either synchronously or "),n(239,"strong"),e(240,"asynchronously"),t(),e(241,", meaning that "),n(242,"code"),e(243,"async"),t(),e(244," methods are supported."),t(),n(245,"app-copy-button",20)(246,"span",21),r(247,"app-tabs",null,3),t(),n(249,"pre")(250,"code",22),e(251,`
@MessagePattern({ cmd: 'sum' })
async accumulate(data: number[]): Promise<number> {
  return (data || []).reduce((a, b) => a + b);
}
`),t()(),n(252,"pre")(253,"code",22),e(254,`
@MessagePattern({ cmd: 'sum' })
async accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
`),t()()(),n(255,"p"),e(256,"A message handler can also return an "),n(257,"code"),e(258,"Observable"),t(),e(259,", in which case the result values will be emitted until the stream completes."),t(),n(260,"app-copy-button",20)(261,"span",21),r(262,"app-tabs",null,4),t(),n(264,"pre")(265,"code",22),e(266,`
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}
`),t()(),n(267,"pre")(268,"code",22),e(269,`
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): Observable<number> {
  return from([1, 2, 3]);
}
`),t()()(),n(270,"p"),e(271,"In the example above, the message handler will respond "),n(272,"strong"),e(273,"three times"),t(),e(274,", once for each item in the array."),t(),n(275,"h4",34)(276,"span"),e(277,"Event-based"),t()(),n(278,"p"),e(279,"While the request-response method is perfect for exchanging messages between services, it is less suited for event-based messaging\u2014when you simply want to publish "),n(280,"strong"),e(281,"events"),t(),e(282," without waiting for a response. In such cases, the overhead of maintaining two channels for request-response is unnecessary."),t(),n(283,"p"),e(284,"For example, if you want to notify another service that a specific condition has occurred in this part of the system, the event-based message style is ideal."),t(),n(285,"p"),e(286,"To create an event handler, you can use the "),n(287,"code"),e(288,"@EventPattern()"),t(),e(289," decorator, which is imported from the "),n(290,"code"),e(291,"@nestjs/microservices"),t(),e(292," package."),t(),n(293,"app-copy-button",20)(294,"span",21),r(295,"app-tabs",null,5),t(),n(297,"pre")(298,"code",22),e(299,`
@EventPattern('user_created')
async handleUserCreated(data: Record<string, unknown>) {
  // business logic
}
`),t()(),n(300,"pre")(301,"code",22),e(302,`
@EventPattern('user_created')
async handleUserCreated(data) {
  // business logic
}
`),t()()(),n(303,"blockquote",23)(304,"strong"),e(305,"Hint"),t(),e(306," You can register multiple event handlers for a "),n(307,"strong"),e(308,"single"),t(),e(309,` event pattern, and all of them will be automatically triggered in parallel.
`),t(),n(310,"p"),e(311,"The "),n(312,"code"),e(313,"handleUserCreated()"),t(),n(314,"strong"),e(315,"event handler"),t(),e(316," listens for the "),n(317,"code"),e(318,"'user_created'"),t(),e(319," event. The event handler takes a single argument, the "),n(320,"code"),e(321,"data"),t(),e(322," passed from the client (in this case, an event payload which has been sent over the network)."),t(),n(323,"p"),r(324,"app-banner-enterprise"),t(),n(325,"h4",35)(326,"span"),e(327,"Additional request details"),t()(),n(328,"p"),e(329,"In more advanced scenarios, you might need to access additional details about the incoming request. For instance, when using NATS with wildcard subscriptions, you may want to retrieve the original subject that the producer sent the message to. Similarly, with Kafka, you may need to access the message headers. To achieve this, you can leverage built-in decorators as shown below:"),t(),n(330,"app-copy-button",20)(331,"span",21),r(332,"app-tabs",null,6),t(),n(334,"pre")(335,"code",22),e(336,`
@MessagePattern('time.us.*')
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(\`Subject: \${context.getSubject()}\`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
`),t()(),n(337,"pre")(338,"code",22),e(339,`
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*')
getDate(data, context) {
  console.log(\`Subject: \${context.getSubject()}\`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
`),t()()(),n(340,"blockquote",23)(341,"strong"),e(342,"Hint"),t(),n(343,"code"),e(344,"@Payload()"),t(),e(345,", "),n(346,"code"),e(347,"@Ctx()"),t(),e(348," and "),n(349,"code"),e(350,"NatsContext"),t(),e(351," are imported from "),n(352,"code"),e(353,"@nestjs/microservices"),t(),e(354,`.
`),t(),n(355,"blockquote",23)(356,"strong"),e(357,"Hint"),t(),e(358," You can also pass in a property key to the "),n(359,"code"),e(360,"@Payload()"),t(),e(361," decorator to extract a specific property from the incoming payload object, for example, "),n(362,"code"),e(363,"@Payload('id')"),t(),e(364,`.
`),t(),n(365,"h4",36)(366,"span"),e(367,"Client (producer class)"),t()(),n(368,"p"),e(369,"A client Nest application can exchange messages or publish events to a Nest microservice using the "),n(370,"code"),e(371,"ClientProxy"),t(),e(372," class. This class provides several methods, such as "),n(373,"code"),e(374,"send()"),t(),e(375," (for request-response messaging) and "),n(376,"code"),e(377,"emit()"),t(),e(378," (for event-driven messaging), enabling communication with a remote microservice. You can obtain an instance of this class in the following ways:"),t(),n(379,"p"),e(380,"One approach is to import the "),n(381,"code"),e(382,"ClientsModule"),t(),e(383,", which exposes the static "),n(384,"code"),e(385,"register()"),t(),e(386," method. This method takes an array of objects representing microservice transporters. Each object must include a "),n(387,"code"),e(388,"name"),t(),e(389," property, and optionally a "),n(390,"code"),e(391,"transport"),t(),e(392," property (defaulting to "),n(393,"code"),e(394,"Transport.TCP"),t(),e(395,"), as well as an optional "),n(396,"code"),e(397,"options"),t(),e(398," property."),t(),n(399,"p"),e(400,"The "),n(401,"code"),e(402,"name"),t(),e(403," property acts as an "),n(404,"strong"),e(405,"injection token"),t(),e(406,", which you can use to inject an instance of "),n(407,"code"),e(408,"ClientProxy"),t(),e(409," wherever needed. The value of this "),n(410,"code"),e(411,"name"),t(),e(412," property can be any arbitrary string or JavaScript symbol, as described "),n(413,"a",37),e(414,"here"),t(),e(415,"."),t(),n(416,"p"),e(417,"The "),n(418,"code"),e(419,"options"),t(),e(420," property is an object that includes the same properties we saw in the "),n(421,"code"),e(422,"createMicroservice()"),t(),e(423," method earlier."),t(),n(424,"app-copy-button")(425,"pre")(426,"code",22),e(427,`
@Module({
  imports: [
    ClientsModule.register([
      { name: 'MATH_SERVICE', transport: Transport.TCP },
    ]),
  ],
})
`),t()()(),n(428,"p"),e(429,"Alternatively, you can use the "),n(430,"code"),e(431,"registerAsync()"),t(),e(432," method if you need to provide configuration or perform any other asynchronous processes during the setup."),t(),n(433,"app-copy-button")(434,"pre")(435,"code",22),e(436,`
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: 'MATH_SERVICE',
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            url: configService.get('URL'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
})
`),t()()(),n(437,"p"),e(438,"Once the module has been imported, you can inject an instance of the "),n(439,"code"),e(440,"ClientProxy"),t(),e(441," configured with the specified options for the "),n(442,"code"),e(443,"'MATH_SERVICE'"),t(),e(444," transporter using the "),n(445,"code"),e(446,"@Inject()"),t(),e(447," decorator."),t(),n(448,"app-copy-button")(449,"pre")(450,"code",22),e(451,`
constructor(
  @Inject('MATH_SERVICE') private client: ClientProxy,
) {}
`),t()()(),n(452,"blockquote",23)(453,"strong"),e(454,"Hint"),t(),e(455," The "),n(456,"code"),e(457,"ClientsModule"),t(),e(458," and "),n(459,"code"),e(460,"ClientProxy"),t(),e(461," classes are imported from the "),n(462,"code"),e(463,"@nestjs/microservices"),t(),e(464,` package.
`),t(),n(465,"p"),e(466,"At times, you may need to fetch the transporter configuration from another service (such as a "),n(467,"code"),e(468,"ConfigService"),t(),e(469,"), rather than hard-coding it in your client application. To achieve this, you can register a "),n(470,"a",38),e(471,"custom provider"),t(),e(472," using the "),n(473,"code"),e(474,"ClientProxyFactory"),t(),e(475," class. This class provides a static "),n(476,"code"),e(477,"create()"),t(),e(478," method that accepts a transporter options object and returns a customized "),n(479,"code"),e(480,"ClientProxy"),t(),e(481," instance."),t(),n(482,"app-copy-button")(483,"pre")(484,"code",22),e(485,`
@Module({
  providers: [
    {
      provide: 'MATH_SERVICE',
      useFactory: (configService: ConfigService) => {
        const mathSvcOptions = configService.getMathSvcOptions();
        return ClientProxyFactory.create(mathSvcOptions);
      },
      inject: [ConfigService],
    }
  ]
  ...
})
`),t()()(),n(486,"blockquote",23)(487,"strong"),e(488,"Hint"),t(),e(489," The "),n(490,"code"),e(491,"ClientProxyFactory"),t(),e(492," is imported from the "),n(493,"code"),e(494,"@nestjs/microservices"),t(),e(495,` package.
`),t(),n(496,"p"),e(497,"Another option is to use the "),n(498,"code"),e(499,"@Client()"),t(),e(500," property decorator."),t(),n(501,"app-copy-button")(502,"pre")(503,"code",22),e(504,`
@Client({ transport: Transport.TCP })
client: ClientProxy;
`),t()()(),n(505,"blockquote",23)(506,"strong"),e(507,"Hint"),t(),e(508," The "),n(509,"code"),e(510,"@Client()"),t(),e(511," decorator is imported from the "),n(512,"code"),e(513,"@nestjs/microservices"),t(),e(514,` package.
`),t(),n(515,"p"),e(516,"Using the "),n(517,"code"),e(518,"@Client()"),t(),e(519," decorator is not the preferred technique, as it is harder to test and harder to share a client instance."),t(),n(520,"p"),e(521,"The "),n(522,"code"),e(523,"ClientProxy"),t(),e(524," is "),n(525,"strong"),e(526,"lazy"),t(),e(527,". It doesn't initiate a connection immediately. Instead, it will be established before the first microservice call, and then reused across each subsequent call. However, if you want to delay the application bootstrapping process until a connection is established, you can manually initiate a connection using the "),n(528,"code"),e(529,"ClientProxy"),t(),e(530," object's "),n(531,"code"),e(532,"connect()"),t(),e(533," method inside the "),n(534,"code"),e(535,"OnApplicationBootstrap"),t(),e(536," lifecycle hook."),t(),n(537,"app-copy-button",20)(538,"span",21),r(539,"app-tabs",null,7),t(),n(541,"pre")(542,"code",22),e(543,`
async onApplicationBootstrap() {
  await this.client.connect();
}
`),t()()(),n(544,"p"),e(545,"If the connection cannot be created, the "),n(546,"code"),e(547,"connect()"),t(),e(548," method will reject with the corresponding error object."),t(),n(549,"h4",39)(550,"span"),e(551,"Sending messages"),t()(),n(552,"p"),e(553,"The "),n(554,"code"),e(555,"ClientProxy"),t(),e(556," exposes a "),n(557,"code"),e(558,"send()"),t(),e(559," method. This method is intended to call the microservice and returns an "),n(560,"code"),e(561,"Observable"),t(),e(562," with its response. Thus, we can subscribe to the emitted values easily."),t(),n(563,"app-copy-button",20)(564,"span",21),r(565,"app-tabs",null,8),t(),n(567,"pre")(568,"code",22),e(569,`
accumulate(): Observable<number> {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send<number>(pattern, payload);
}
`),t()(),n(570,"pre")(571,"code",22),e(572,`
accumulate() {
  const pattern = { cmd: 'sum' };
  const payload = [1, 2, 3];
  return this.client.send(pattern, payload);
}
`),t()()(),n(573,"p"),e(574,"The "),n(575,"code"),e(576,"send()"),t(),e(577," method takes two arguments, "),n(578,"code"),e(579,"pattern"),t(),e(580," and "),n(581,"code"),e(582,"payload"),t(),e(583,". The "),n(584,"code"),e(585,"pattern"),t(),e(586," should match one defined in a "),n(587,"code"),e(588,"@MessagePattern()"),t(),e(589," decorator. The "),n(590,"code"),e(591,"payload"),t(),e(592," is a message that we want to transmit to the remote microservice. This method returns a "),n(593,"strong"),e(594,"cold "),n(595,"code"),e(596,"Observable"),t()(),e(597,", which means that you have to explicitly subscribe to it before the message will be sent."),t(),n(598,"h4",40)(599,"span"),e(600,"Publishing events"),t()(),n(601,"p"),e(602,"To send an event, use the "),n(603,"code"),e(604,"ClientProxy"),t(),e(605," object's "),n(606,"code"),e(607,"emit()"),t(),e(608," method. This method publishes an event to the message broker."),t(),n(609,"app-copy-button",20)(610,"span",21),r(611,"app-tabs",null,9),t(),n(613,"pre")(614,"code",22),e(615,`
async publish() {
  this.client.emit<number>('user_created', new UserCreatedEvent());
}
`),t()(),n(616,"pre")(617,"code",22),e(618,`
async publish() {
  this.client.emit('user_created', new UserCreatedEvent());
}
`),t()()(),n(619,"p"),e(620,"The "),n(621,"code"),e(622,"emit()"),t(),e(623," method takes two arguments: "),n(624,"code"),e(625,"pattern"),t(),e(626," and "),n(627,"code"),e(628,"payload"),t(),e(629,". The "),n(630,"code"),e(631,"pattern"),t(),e(632," should match one defined in an "),n(633,"code"),e(634,"@EventPattern()"),t(),e(635," decorator, while the "),n(636,"code"),e(637,"payload"),t(),e(638," represents the event data that you want to transmit to the remote microservice. This method returns a "),n(639,"strong"),e(640,"hot "),n(641,"code"),e(642,"Observable"),t()(),e(643," (in contrast to the cold "),n(644,"code"),e(645,"Observable"),t(),e(646," returned by "),n(647,"code"),e(648,"send()"),t(),e(649,"), meaning that regardless of whether you explicitly subscribe to the observable, the proxy will immediately attempt to deliver the event."),t(),n(650,"p"),r(651,"app-banner-devtools"),t(),n(652,"h4",41)(653,"span"),e(654,"Request-scoping"),t()(),n(655,"p"),e(656,"For those coming from different programming language backgrounds, it may be surprising to learn that in Nest, most things are shared across incoming requests. This includes a connection pool to the database, singleton services with global state, and more. Keep in mind that Node.js does not follow the request/response multi-threaded stateless model, where each request is processed by a separate thread. As a result, using singleton instances is "),n(657,"strong"),e(658,"safe"),t(),e(659," for our applications."),t(),n(660,"p"),e(661,"However, there are edge cases where a request-based lifetime for the handler might be desirable. This could include scenarios like per-request caching in GraphQL applications, request tracking, or multi-tenancy. You can learn more about how to control scopes "),n(662,"a",42),e(663,"here"),t(),e(664,"."),t(),n(665,"p"),e(666,"Request-scoped handlers and providers can inject "),n(667,"code"),e(668,"RequestContext"),t(),e(669," using the "),n(670,"code"),e(671,"@Inject()"),t(),e(672," decorator in combination with the "),n(673,"code"),e(674,"CONTEXT"),t(),e(675," token:"),t(),n(676,"app-copy-button")(677,"pre")(678,"code",22),e(679,`
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT, RequestContext } from '@nestjs/microservices';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private ctx: RequestContext) {}
}
`),t()()(),n(680,"p"),e(681,"This provides access to the "),n(682,"code"),e(683,"RequestContext"),t(),e(684," object, which has two properties:"),t(),n(685,"app-copy-button")(686,"pre")(687,"code",22),e(688,`
export interface RequestContext<T = any> {
  pattern: string | Record<string, any>;
  data: T;
}
`),t()()(),n(689,"p"),e(690,"The "),n(691,"code"),e(692,"data"),t(),e(693," property is the message payload sent by the message producer. The "),n(694,"code"),e(695,"pattern"),t(),e(696," property is the pattern used to identify an appropriate handler to handle the incoming message."),t(),n(697,"h4",43)(698,"span"),e(699,"Instance status updates"),t()(),n(700,"p"),e(701,"To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the "),n(702,"code"),e(703,"status"),t(),e(704," stream. This stream provides status updates specific to the chosen driver. For instance, if you\u2019re using the TCP transporter (the default), the "),n(705,"code"),e(706,"status"),t(),e(707," stream emits "),n(708,"code"),e(709,"connected"),t(),e(710," and "),n(711,"code"),e(712,"disconnected"),t(),e(713," events."),t(),n(714,"app-copy-button")(715,"pre")(716,"code",22),e(717,`
this.client.status.subscribe((status: TcpStatus) => {
  console.log(status);
});
`),t()()(),n(718,"blockquote",23)(719,"strong"),e(720,"Hint"),t(),e(721," The "),n(722,"code"),e(723,"TcpStatus"),t(),e(724," type is imported from the "),n(725,"code"),e(726,"@nestjs/microservices"),t(),e(727,` package.
`),t(),n(728,"p"),e(729,"Similarly, you can subscribe to the server's "),n(730,"code"),e(731,"status"),t(),e(732," stream to receive notifications about the server's status."),t(),n(733,"app-copy-button")(734,"pre")(735,"code",22),e(736,`
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: TcpStatus) => {
  console.log(status);
});
`),t()()(),n(737,"h4",44)(738,"span"),e(739,"Listening to internal events"),t()(),n(740,"p"),e(741,"In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the "),n(742,"code"),e(743,"error"),t(),e(744," event to trigger additional operations when an error occurs. To do this, use the "),n(745,"code"),e(746,"on()"),t(),e(747," method, as shown below:"),t(),n(748,"app-copy-button")(749,"pre")(750,"code",22),e(751,`
this.client.on('error', (err) => {
  console.error(err);
});
`),t()()(),n(752,"p"),e(753,"Similarly, you can listen to the server's internal events:"),t(),n(754,"app-copy-button")(755,"pre")(756,"code",22),e(757,`
server.on<TcpEvents>('error', (err) => {
  console.error(err);
});
`),t()()(),n(758,"blockquote",23)(759,"strong"),e(760,"Hint"),t(),e(761," The "),n(762,"code"),e(763,"TcpEvents"),t(),e(764," type is imported from the "),n(765,"code"),e(766,"@nestjs/microservices"),t(),e(767,` package.
`),t(),n(768,"h4",45)(769,"span"),e(770,"Underlying driver access"),t()(),n(771,"p"),e(772,"For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you "),n(773,"strong"),e(774,"shouldn't need"),t(),e(775," to access the driver directly."),t(),n(776,"p"),e(777,"To do so, you can use the "),n(778,"code"),e(779,"unwrap()"),t(),e(780," method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect."),t(),n(781,"app-copy-button")(782,"pre")(783,"code",22),e(784,`
const netServer = this.client.unwrap<Server>();
`),t()()(),n(785,"p"),e(786,"Here, "),n(787,"code"),e(788,"Server"),t(),e(789," is a type imported from the "),n(790,"code"),e(791,"net"),t(),e(792," module."),t(),n(793,"p"),e(794,"Similarly, you can access the server's underlying driver instance:"),t(),n(795,"app-copy-button")(796,"pre")(797,"code",22),e(798,`
const netServer = server.unwrap<Server>();
`),t()()(),n(799,"h4",46)(800,"span"),e(801,"Handling timeouts"),t()(),n(802,"p"),e(803,"In distributed systems, microservices might sometimes be down or unavailable. To prevent indefinitely long waiting, you can use timeouts. A timeout is a highly useful pattern when communicating with other services. To apply timeouts to your microservice calls, you can use the "),n(804,"a",47),e(805,"RxJS"),t(),n(806,"code"),e(807,"timeout"),t(),e(808," operator. If the microservice does not respond within the specified time, an exception is thrown, which you can catch and handle appropriately."),t(),n(809,"p"),e(810,"To implement this, you'll need to use the "),n(811,"a",48)(812,"code"),e(813,"rxjs"),t()(),e(814," package. Simply use the "),n(815,"code"),e(816,"timeout"),t(),e(817," operator within the pipe:"),t(),n(818,"app-copy-button",20)(819,"span",21),r(820,"app-tabs",null,10),t(),n(822,"pre")(823,"code",22),e(824,`
this.client
  .send<TResult, TInput>(pattern, data)
  .pipe(timeout(5000));
`),t()(),n(825,"pre")(826,"code",22),e(827,`
this.client
  .send(pattern, data)
  .pipe(timeout(5000));
`),t()()(),n(828,"blockquote",23)(829,"strong"),e(830,"Hint"),t(),e(831," The "),n(832,"code"),e(833,"timeout"),t(),e(834," operator is imported from the "),n(835,"code"),e(836,"rxjs/operators"),t(),e(837,` package.
`),t(),n(838,"p"),e(839,"After 5 seconds, if the microservice isn't responding, it will throw an error."),t(),n(840,"h4",49)(841,"span"),e(842,"TLS support"),t()(),n(843,"p"),e(844,"When communicating outside of a private network, it\u2019s important to encrypt traffic to ensure security. In NestJS, this can be achieved with TLS over TCP using Node's built-in "),n(845,"a",50),e(846,"TLS"),t(),e(847," module. Nest provides built-in support for TLS in its TCP transport, allowing us to encrypt communication between microservices or clients."),t(),n(848,"p"),e(849,"To enable TLS for a TCP server, you'll need both a private key and a certificate in PEM format. These are added to the server's options by setting the "),n(850,"code"),e(851,"tlsOptions"),t(),e(852," and specifying the key and cert files, as shown below:"),t(),n(853,"app-copy-button")(854,"pre")(855,"code",22),e(856,`
import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const key = fs.readFileSync('<pathToKeyFile>', 'utf8').toString();
  const cert = fs.readFileSync('<pathToCertFile>', 'utf8').toString();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        tlsOptions: {
          key,
          cert,
        },
      },
    },
  );

  await app.listen();
}
bootstrap();
`),t()()(),n(857,"p"),e(858,"For a client to communicate securely over TLS, we also define the "),n(859,"code"),e(860,"tlsOptions"),t(),e(861," object but this time with the CA certificate. This is the certificate of the authority that signed the server's certificate. This ensures that the client trusts the server's certificate and can establish a secure connection."),t(),n(862,"app-copy-button")(863,"pre")(864,"code",22),e(865,`
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.TCP,
        options: {
          tlsOptions: {
            ca: [fs.readFileSync('<pathToCaFile>', 'utf-8').toString()],
          },
        },
      },
    ]),
  ],
})
export class AppModule {}
`),t()()(),n(866,"p"),e(867,"You can also pass an array of CAs if your setup involves multiple trusted authorities."),t(),n(868,"p"),e(869,"Once everything is set up, you can inject the "),n(870,"code"),e(871,"ClientProxy"),t(),e(872," as usual using the "),n(873,"code"),e(874,"@Inject()"),t(),e(875," decorator to use the client in your services. This ensures encrypted communication across your NestJS microservices, with Node's "),n(876,"code"),e(877,"TLS"),t(),e(878," module handling the encryption details."),t(),n(879,"p"),e(880,"For more information, refer to Node\u2019s "),n(881,"a",50),e(882,"TLS documentation"),t(),e(883,"."),t(),n(884,"h4",51)(885,"span"),e(886,"Dynamic configuration"),t()(),n(887,"p"),e(888,"When a microservice needs to be configured using the "),n(889,"code"),e(890,"ConfigService"),t(),e(891," (from the "),n(892,"code"),e(893,"@nestjs/config"),t(),e(894," package), but the injection context is only available after the microservice instance is created, "),n(895,"code"),e(896,"AsyncMicroserviceOptions"),t(),e(897," offers a solution. This approach allows for dynamic configuration, ensuring smooth integration with the "),n(898,"code"),e(899,"ConfigService"),t(),e(900,"."),t(),n(901,"app-copy-button")(902,"pre")(903,"code",22),e(904,`
import { ConfigService } from '@nestjs/config';
import { AsyncMicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    AppModule,
    {
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get<string>('HOST'),
          port: configService.get<number>('PORT'),
        },
      }),
      inject: [ConfigService],
    },
  );

  await app.listen();
}
bootstrap();
`),t()()()()),c&2){let d=o(51),u=o(214),w=o(248),T=o(263),k=o(296),P=o(333),R=o(566),q=o(612),j=o(821);i(48),m(" ",x(49,40,"main",d.isJsActive),`
`),i(4),a("hide",d.isJsActive),i(3),a("hide",!d.isJsActive),i(156),m(" ",x(212,43,"math.controller",u.isJsActive),`
`),i(4),a("hide",u.isJsActive),i(3),a("hide",!u.isJsActive),i(11),N("","{"," cmd: 'sum' ","}"),i(20),a("hide",w.isJsActive),i(3),a("hide",!w.isJsActive),i(12),a("hide",T.isJsActive),i(3),a("hide",!T.isJsActive),i(30),a("hide",k.isJsActive),i(3),a("hide",!k.isJsActive),i(34),a("hide",P.isJsActive),i(3),a("hide",!P.isJsActive),i(230),a("hide",R.isJsActive),i(3),a("hide",!R.isJsActive),i(43),a("hide",q.isJsActive),i(3),a("hide",!q.isJsActive),i(206),a("hide",j.isJsActive),i(3),a("hide",!j.isJsActive)}},dependencies:[y,b,v,H,M,_,C],encapsulation:2,changeDetection:0})}return s})();var B=(()=>{class s extends E{static \u0275fac=(()=>{let l;return function(h){return(l||(l=S(s)))(h||s)}})();static \u0275cmp=f({type:s,selectors:[["app-custom-transport"]],features:[g],decls:393,vars:8,consts:[["contentReference",""],["app7e4723f6d525cd99e16d4341531b8402c3234468",""],["appbbd10faf03db8a281a11b3388ba56bc1e410fa2e",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/microservices/custom-transport.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","custom-transporters"],["rel","nofollow","target","_blank","href","https://dev.to/nestjs/integrate-nestjs-with-external-services-using-microservice-transporters-part-1-p3"],[1,"info"],["routerLink","/application-context"],["rel","nofollow","target","_blank","href","https://github.com/mqttjs/MQTT.js/blob/master/README.md#qos"],["rel","nofollow","target","_blank","href","https://dev.to/johnbiundo/series/4724"],["rel","nofollow","target","_blank","href","https://dev.to/nestjs/part-1-introduction-and-setup-1a2l"],["appAnchor","","id","creating-a-strategy"],[1,"language-typescript"],[1,"warning"],[1,"language-json"],["routerLink","/interceptors"],["appAnchor","","id","client-proxy"],["rel","nofollow","target","_blank","href","https://dev.to/nestjs/part-4-basic-client-component-16f9"],["appAnchor","","id","message-serialization"],[1,"with-heading"],[1,"filename"]],template:function(c,h){if(c&1&&(n(0,"div",3,0)(2,"div",4)(3,"a",5),r(4,"i",6),t()(),n(5,"h3",7),e(6,"Custom transporters"),t(),n(7,"p"),e(8,"Nest provides a variety of "),n(9,"strong"),e(10,"transporters"),t(),e(11,` out-of-the-box, as well as an API allowing developers to build new custom transport strategies.
Transporters enable you to connect components over a network using a pluggable communications layer and a very simple application-level message protocol (read full `),n(12,"a",8),e(13,"article"),t(),e(14,")."),t(),n(15,"blockquote",9)(16,"strong"),e(17,"Hint"),t(),e(18," Building a microservice with Nest does not necessarily mean you must use the "),n(19,"code"),e(20,"@nestjs/microservices"),t(),e(21," package. For example, if you want to communicate with external services (let's say other microservices written in different languages), you may not need all the features provided by "),n(22,"code"),e(23,"@nestjs/microservice"),t(),e(24,` library.
In fact, if you don't need decorators (`),n(25,"code"),e(26,"@EventPattern"),t(),e(27," or "),n(28,"code"),e(29,"@MessagePattern"),t(),e(30,") that let you declaratively define subscribers, running a "),n(31,"a",10),e(32,"Standalone Application"),t(),e(33,` and manually maintaining connection/subscribing to channels should be enough for most use-cases and will provide you with more flexibility.
`),t(),n(34,"p"),e(35,"With a custom transporter, you can integrate any messaging system/protocol (including Google Cloud Pub/Sub, Amazon Kinesis, and others) or extend the existing one, adding extra features on top (for example, "),n(36,"a",11),e(37,"QoS"),t(),e(38," for MQTT)."),t(),n(39,"blockquote",9)(40,"strong"),e(41,"Hint"),t(),e(42," To better understand how Nest microservices work and how you can extend the capabilities of existing transporters, we recommend reading the "),n(43,"a",12),e(44,"NestJS Microservices in Action"),t(),e(45," and "),n(46,"a",13),e(47,"Advanced NestJS Microservices"),t(),e(48,` article series.
`),t(),n(49,"h4",14)(50,"span"),e(51,"Creating a strategy"),t()(),n(52,"p"),e(53,"First, let's define a class representing our custom transporter."),t(),n(54,"app-copy-button")(55,"pre")(56,"code",15),e(57,`
import { CustomTransportStrategy, Server } from '@nestjs/microservices';

class GoogleCloudPubSubServer
  extends Server
  implements CustomTransportStrategy
{
  /**
   * Triggered when you run "app.listen()".
   */
  listen(callback: () => void) {
    callback();
  }

  /**
   * Triggered on application shutdown.
   */
  close() {}

  /**
   * You can ignore this method if you don't want transporter users
   * to be able to register event listeners. Most custom implementations
   * will not need this.
   */
  on(event: string, callback: Function) {
    throw new Error('Method not implemented.');
  }

  /**
   * You can ignore this method if you don't want transporter users
   * to be able to retrieve the underlying native server. Most custom implementations
   * will not need this.
   */
  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
`),t()()(),n(58,"blockquote",16)(59,"strong"),e(60,"Warning"),t(),e(61,` Please, note we won't be implementing a fully-featured Google Cloud Pub/Sub server in this chapter as this would require diving into transporter specific technical details.
`),t(),n(62,"p"),e(63,"In our example above, we declared the "),n(64,"code"),e(65,"GoogleCloudPubSubServer"),t(),e(66," class and provided "),n(67,"code"),e(68,"listen()"),t(),e(69," and "),n(70,"code"),e(71,"close()"),t(),e(72," methods enforced by the "),n(73,"code"),e(74,"CustomTransportStrategy"),t(),e(75,` interface.
Also, our class extends the `),n(76,"code"),e(77,"Server"),t(),e(78," class imported from the "),n(79,"code"),e(80,"@nestjs/microservices"),t(),e(81," package that provides a few useful methods, for example, methods used by Nest runtime to register message handlers. Alternatively, in case you want to extend the capabilities of an existing transport strategy, you could extend the corresponding server class, for example, "),n(82,"code"),e(83,"ServerRedis"),t(),e(84,`.
Conventionally, we added the `),n(85,"code"),e(86,'"Server"'),t(),e(87," suffix to our class as it will be responsible for subscribing to messages/events (and responding to them, if necessary)."),t(),n(88,"p"),e(89,"With this in place, we can now use our custom strategy instead of using a built-in transporter, as follows:"),t(),n(90,"app-copy-button")(91,"pre")(92,"code",15),e(93,`
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    strategy: new GoogleCloudPubSubServer(),
  },
);
`),t()()(),n(94,"p"),e(95,"Basically, instead of passing the normal transporter options object with "),n(96,"code"),e(97,"transport"),t(),e(98," and "),n(99,"code"),e(100,"options"),t(),e(101," properties, we pass a single property, "),n(102,"code"),e(103,"strategy"),t(),e(104,", whose value is an instance of our custom transporter class."),t(),n(105,"p"),e(106,"Back to our "),n(107,"code"),e(108,"GoogleCloudPubSubServer"),t(),e(109," class, in a real-world application, we would be establishing a connection to our message broker/external service and registering subscribers/listening to specific channels in "),n(110,"code"),e(111,"listen()"),t(),e(112," method (and then removing subscriptions & closing the connection in the "),n(113,"code"),e(114,"close()"),t(),e(115,` teardown method),
but since this requires a good understanding of how Nest microservices communicate with each other, we recommend reading this `),n(116,"a",13),e(117,"article series"),t(),e(118,`.
In this chapter instead, we'll focus on the capabilities the `),n(119,"code"),e(120,"Server"),t(),e(121," class provides and how you can leverage them to build custom strategies."),t(),n(122,"p"),e(123,"For example, let's say that somewhere in our application, the following message handler is defined:"),t(),n(124,"app-copy-button")(125,"pre")(126,"code",15),e(127,`
@MessagePattern('echo')
echo(@Payload() data: object) {
  return data;
}
`),t()()(),n(128,"p"),e(129,"This message handler will be automatically registered by Nest runtime. With "),n(130,"code"),e(131,"Server"),t(),e(132,` class, you can see what message patterns have been registered and also, access and execute the actual methods that were assigned to them.
To test this out, let's add a simple `),n(133,"code"),e(134,"console.log"),t(),e(135," inside "),n(136,"code"),e(137,"listen()"),t(),e(138," method before "),n(139,"code"),e(140,"callback"),t(),e(141," function is called:"),t(),n(142,"app-copy-button")(143,"pre")(144,"code",15),e(145,`
listen(callback: () => void) {
  console.log(this.messageHandlers);
  callback();
}
`),t()()(),n(146,"p"),e(147,"After your application restarts, you'll see the following log in your terminal:"),t(),n(148,"app-copy-button")(149,"pre")(150,"code",15),e(151,`
Map { 'echo' => [AsyncFunction] { isEventHandler: false } }
`),t()()(),n(152,"blockquote",9)(153,"strong"),e(154,"Hint"),t(),e(155," If we used the "),n(156,"code"),e(157,"@EventPattern"),t(),e(158," decorator, you would see the same output, but with the "),n(159,"code"),e(160,"isEventHandler"),t(),e(161," property set to "),n(162,"code"),e(163,"true"),t(),e(164,`.
`),t(),n(165,"p"),e(166,"As you can see, the "),n(167,"code"),e(168,"messageHandlers"),t(),e(169," property is a "),n(170,"code"),e(171,"Map"),t(),e(172,` collection of all message (and event) handlers, in which patterns are being used as keys.
Now, you can use a key (for example, `),n(173,"code"),e(174,'"echo"'),t(),e(175,") to receive a reference to the message handler:"),t(),n(176,"app-copy-button")(177,"pre")(178,"code",15),e(179,`
async listen(callback: () => void) {
  const echoHandler = this.messageHandlers.get('echo');
  console.log(await echoHandler('Hello world!'));
  callback();
}
`),t()()(),n(180,"p"),e(181,"Once we execute the "),n(182,"code"),e(183,"echoHandler"),t(),e(184," passing an arbitrary string as an argument ("),n(185,"code"),e(186,'"Hello world!"'),t(),e(187," here), we should see it in the console:"),t(),n(188,"pre")(189,"code",17),e(190,`
Hello world!
`),t()(),n(191,"p"),e(192,"Which means that our method handler was properly executed."),t(),n(193,"p"),e(194,"When using a "),n(195,"code"),e(196,"CustomTransportStrategy"),t(),e(197," with "),n(198,"a",18),e(199,"Interceptors"),t(),e(200," the handlers are wrapped into RxJS streams. This means that you need to subscribe to them in order to execute the streams underlying logic (e.g. continue into the controller logic after an interceptor has been executed)."),t(),n(201,"p"),e(202,"An example of this can be seen below:"),t(),n(203,"app-copy-button")(204,"pre")(205,"code",15),e(206,`
async listen(callback: () => void) {
  const echoHandler = this.messageHandlers.get('echo');
  const streamOrResult = await echoHandler('Hello World');
  if (isObservable(streamOrResult)) {
    streamOrResult.subscribe();
  }
  callback();
}
`),t()()(),n(207,"h4",19)(208,"span"),e(209,"Client proxy"),t()(),n(210,"p"),e(211,"As we mentioned in the first section, you don't necessarily need to use the "),n(212,"code"),e(213,"@nestjs/microservices"),t(),e(214,' package to create microservices, but if you decide to do so and you need to integrate a custom strategy, you will need to provide a "client" class too.'),t(),n(215,"blockquote",9)(216,"strong"),e(217,"Hint"),t(),e(218," Again, implementing a fully-featured client class compatible with all "),n(219,"code"),e(220,"@nestjs/microservices"),t(),e(221," features (e.g., streaming) requires a good understanding of communication techniques used by the framework. To learn more, check out this "),n(222,"a",20),e(223,"article"),t(),e(224,`.
`),t(),n(225,"p"),e(226,"To communicate with an external service/emit & publish messages (or events) you can either use a library-specific SDK package, or implement a custom client class that extends the "),n(227,"code"),e(228,"ClientProxy"),t(),e(229,", as follows:"),t(),n(230,"app-copy-button")(231,"pre")(232,"code",15),e(233,`
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';

class GoogleCloudPubSubClient extends ClientProxy {
  async connect(): Promise<any> {}
  async close() {}
  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {}
  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ): Function {}
  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
`),t()()(),n(234,"blockquote",16)(235,"strong"),e(236,"Warning"),t(),e(237,` Please, note we won't be implementing a fully-featured Google Cloud Pub/Sub client in this chapter as this would require diving into transporter specific technical details.
`),t(),n(238,"p"),e(239,"As you can see, "),n(240,"code"),e(241,"ClientProxy"),t(),e(242," class requires us to provide several methods for establishing & closing the connection and publishing messages ("),n(243,"code"),e(244,"publish"),t(),e(245,") and events ("),n(246,"code"),e(247,"dispatchEvent"),t(),e(248,`).
Note, if you don't need a request-response communication style support, you can leave the `),n(249,"code"),e(250,"publish()"),t(),e(251," method empty. Likewise, if you don't need to support event-based communication, skip the "),n(252,"code"),e(253,"dispatchEvent()"),t(),e(254," method."),t(),n(255,"p"),e(256,"To observe what and when those methods are executed, let's add multiple "),n(257,"code"),e(258,"console.log"),t(),e(259," calls, as follows:"),t(),n(260,"app-copy-button")(261,"pre")(262,"code",15),e(263,`
class GoogleCloudPubSubClient extends ClientProxy {
  async connect(): Promise<any> {
    console.log('connect');
  }

  async close() {
    console.log('close');
  }

  async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    return console.log('event to dispatch: ', packet);
  }

  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ): Function {
    console.log('message:', packet);

    // In a real-world application, the "callback" function should be executed
    // with payload sent back from the responder. Here, we'll simply simulate (5 seconds delay)
    // that response came through by passing the same "data" as we've originally passed in.
    //
    // The "isDisposed" bool on the WritePacket tells the response that no further data is
    // expected. If not sent or is false, this will simply emit data to the Observable.
    setTimeout(() => callback({ 
      response: packet.data,
      isDisposed: true,
    }), 5000);

    return () => console.log('teardown');
  }

  unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
}
`),t()()(),n(264,"p"),e(265,"With this in place, let's create an instance of "),n(266,"code"),e(267,"GoogleCloudPubSubClient"),t(),e(268," class and run the "),n(269,"code"),e(270,"send()"),t(),e(271," method (which you might have seen in earlier chapters), subscribing to the returned observable stream."),t(),n(272,"app-copy-button")(273,"pre")(274,"code",15),e(275,`
const googlePubSubClient = new GoogleCloudPubSubClient();
googlePubSubClient
  .send('pattern', 'Hello world!')
  .subscribe((response) => console.log(response));
`),t()()(),n(276,"p"),e(277,"Now, you should see the following output in your terminal:"),t(),n(278,"app-copy-button")(279,"pre")(280,"code",15),e(281,`
connect
message: { pattern: 'pattern', data: 'Hello world!' }
Hello world! // <-- after 5 seconds
`),t()()(),n(282,"p"),e(283,'To test if our "teardown" method (which our '),n(284,"code"),e(285,"publish()"),t(),e(286," method returns) is properly executed, let's apply a timeout operator to our stream, setting it to 2 seconds to make sure it throws earlier then our "),n(287,"code"),e(288,"setTimeout"),t(),e(289," calls the "),n(290,"code"),e(291,"callback"),t(),e(292," function."),t(),n(293,"app-copy-button")(294,"pre")(295,"code",15),e(296,`
const googlePubSubClient = new GoogleCloudPubSubClient();
googlePubSubClient
  .send('pattern', 'Hello world!')
  .pipe(timeout(2000))
  .subscribe(
    (response) => console.log(response),
    (error) => console.error(error.message),
  );
`),t()()(),n(297,"blockquote",9)(298,"strong"),e(299,"Hint"),t(),e(300," The "),n(301,"code"),e(302,"timeout"),t(),e(303," operator is imported from the "),n(304,"code"),e(305,"rxjs/operators"),t(),e(306,` package.
`),t(),n(307,"p"),e(308,"With "),n(309,"code"),e(310,"timeout"),t(),e(311," operator applied, your terminal output should look as follows:"),t(),n(312,"app-copy-button")(313,"pre")(314,"code",15),e(315,`
connect
message: { pattern: 'pattern', data: 'Hello world!' }
teardown // <-- teardown
Timeout has occurred
`),t()()(),n(316,"p"),e(317,"To dispatch an event (instead of sending a message), use the "),n(318,"code"),e(319,"emit()"),t(),e(320," method:"),t(),n(321,"app-copy-button")(322,"pre")(323,"code",15),e(324,`
googlePubSubClient.emit('event', 'Hello world!');
`),t()()(),n(325,"p"),e(326,"And that's what you should see in the console:"),t(),n(327,"app-copy-button")(328,"pre")(329,"code",15),e(330,`
connect
event to dispatch:  { pattern: 'event', data: 'Hello world!' }
`),t()()(),n(331,"h4",21)(332,"span"),e(333,"Message serialization"),t()(),n(334,"p"),e(335,"If you need to add some custom logic around the serialization of responses on the client side, you can use a custom class that extends the "),n(336,"code"),e(337,"ClientProxy"),t(),e(338," class or one of its child classes. For modifying successful requests you can override the "),n(339,"code"),e(340,"serializeResponse"),t(),e(341," method, and for modifying any errors that go through this client you can override the "),n(342,"code"),e(343,"serializeError"),t(),e(344," method. To make use of this custom class, you can pass the class itself to the "),n(345,"code"),e(346,"ClientsModule.register()"),t(),e(347," method using the "),n(348,"code"),e(349,"customClass"),t(),e(350," property. Below is an example of a custom "),n(351,"code"),e(352,"ClientProxy"),t(),e(353," that serializes each error into an "),n(354,"code"),e(355,"RpcException"),t(),e(356,"."),t(),n(357,"app-copy-button",22)(358,"span",23),e(359),p(360,"extension"),r(361,"app-tabs",null,1),t(),n(363,"pre")(364,"code",15),e(365,`
import { ClientTCP, RpcException } from '@nestjs/microservices';

class ErrorHandlingProxy extends ClientTCP {
  serializeError(err: Error) {
    return new RpcException(err);
  }
}
`),t()()(),n(366,"p"),e(367,"and then use it in the "),n(368,"code"),e(369,"ClientsModule"),t(),e(370," like so:"),t(),n(371,"app-copy-button",22)(372,"span",23),e(373),p(374,"extension"),r(375,"app-tabs",null,2),t(),n(377,"pre")(378,"code",15),e(379,`
@Module({
  imports: [
    ClientsModule.register([{
      name: 'CustomProxy',
      customClass: ErrorHandlingProxy,
    }]),
  ]
})
export class AppModule
`),t()()(),n(380,"blockquote",9)(381,"strong"),e(382,"hint"),t(),e(383," This is the class itself being passed to "),n(384,"code"),e(385,"customClass"),t(),e(386,", not an instance of the class. Nest will create the instance under the hood for you, and will pass any options given to the "),n(387,"code"),e(388,"options"),t(),e(389," property to the new "),n(390,"code"),e(391,"ClientProxy"),t(),e(392,`.
`),t()()),c&2){let d=o(362),u=o(376);i(359),m(" ",x(360,2,"error-handling.proxy",d.isJsActive),`
`),i(14),m(" ",x(374,5,"app.module",u.isJsActive),`
`)}},dependencies:[M,y,b,v,C],encapsulation:2,changeDetection:0})}return s})();var K=(()=>{class s extends E{static \u0275fac=(()=>{let l;return function(h){return(l||(l=S(s)))(h||s)}})();static \u0275cmp=f({type:s,selectors:[["app-exception-filters"]],features:[g],decls:116,vars:16,consts:[["contentReference",""],["app3e57ee230e8547cfe728eecf5c7bb9ff4e6292d5",""],["apped22c18fc7371339c35b4baa3ae0e61975221615",""],["app37a117943a22fcb07eb96d510afccc91335988dc",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/microservices/exception-filters.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","exception-filters"],["routerLink","/exception-filters"],[1,"language-typescript"],[1,"info"],[1,"language-json"],["appAnchor","","id","filters"],[1,"with-heading"],[1,"filename"],[1,"warning"],["routerLink","/faq/hybrid-application"],["appAnchor","","id","inheritance"]],template:function(c,h){if(c&1&&(n(0,"div",4,0)(2,"div",5)(3,"a",6),r(4,"i",7),t()(),n(5,"h3",8),e(6,"Exception filters"),t(),n(7,"p"),e(8,"The only difference between the HTTP "),n(9,"a",9),e(10,"exception filter"),t(),e(11," layer and the corresponding microservices layer is that instead of throwing "),n(12,"code"),e(13,"HttpException"),t(),e(14,", you should use "),n(15,"code"),e(16,"RpcException"),t(),e(17,"."),t(),n(18,"app-copy-button")(19,"pre")(20,"code",10),e(21,`
throw new RpcException('Invalid credentials.');
`),t()()(),n(22,"blockquote",11)(23,"strong"),e(24,"Hint"),t(),e(25," The "),n(26,"code"),e(27,"RpcException"),t(),e(28," class is imported from the "),n(29,"code"),e(30,"@nestjs/microservices"),t(),e(31,` package.
`),t(),n(32,"p"),e(33,"With the sample above, Nest will handle the thrown exception and return the "),n(34,"code"),e(35,"error"),t(),e(36," object with the following structure:"),t(),n(37,"pre")(38,"code",12),e(39,`
{
  "status": "error",
  "message": "Invalid credentials."
}
`),t()(),n(40,"h4",13)(41,"span"),e(42,"Filters"),t()(),n(43,"p"),e(44,"Microservice exception filters behave similarly to HTTP exception filters, with one small difference. The "),n(45,"code"),e(46,"catch()"),t(),e(47," method must return an "),n(48,"code"),e(49,"Observable"),t(),e(50,"."),t(),n(51,"app-copy-button",14)(52,"span",15),e(53),p(54,"extension"),r(55,"app-tabs",null,1),t(),n(57,"pre")(58,"code",10),e(59,`
import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class ExceptionFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    return throwError(() => exception.getError());
  }
}
`),t()(),n(60,"pre")(61,"code",10),e(62,`
import { Catch } from '@nestjs/common';
import { throwError } from 'rxjs';

@Catch(RpcException)
export class ExceptionFilter {
  catch(exception, host) {
    return throwError(() => exception.getError());
  }
}
`),t()()(),n(63,"blockquote",16)(64,"strong"),e(65,"Warning"),t(),e(66," Global microservice exception filters aren't enabled by default when using a "),n(67,"a",17),e(68,"hybrid application"),t(),e(69,`.
`),t(),n(70,"p"),e(71,"The following example uses a manually instantiated method-scoped filter. Just as with HTTP based applications, you can also use controller-scoped filters (i.e., prefix the controller class with a "),n(72,"code"),e(73,"@UseFilters()"),t(),e(74," decorator)."),t(),n(75,"app-copy-button",14)(76,"span",15),r(77,"app-tabs",null,2),t(),n(79,"pre")(80,"code",10),e(81,`
@UseFilters(new ExceptionFilter())
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
`),t()(),n(82,"pre")(83,"code",10),e(84,`
@UseFilters(new ExceptionFilter())
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
`),t()()(),n(85,"h4",18)(86,"span"),e(87,"Inheritance"),t()(),n(88,"p"),e(89,"Typically, you'll create fully customized exception filters crafted to fulfill your application requirements. However, there might be use-cases when you would like to simply extend the "),n(90,"strong"),e(91,"core exception filter"),t(),e(92,", and override the behavior based on certain factors."),t(),n(93,"p"),e(94,"In order to delegate exception processing to the base filter, you need to extend "),n(95,"code"),e(96,"BaseExceptionFilter"),t(),e(97," and call the inherited "),n(98,"code"),e(99,"catch()"),t(),e(100," method."),t(),n(101,"app-copy-button",14)(102,"span",15),r(103,"app-tabs",null,3),t(),n(105,"pre")(106,"code",10),e(107,`
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter extends BaseRpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    return super.catch(exception, host);
  }
}
`),t()(),n(108,"pre")(109,"code",10),e(110,`
import { Catch } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter extends BaseRpcExceptionFilter {
  catch(exception, host) {
    return super.catch(exception, host);
  }
}
`),t()()(),n(111,"p"),e(112,"The above implementation is just a shell demonstrating the approach. Your implementation of the extended exception filter would include your tailored "),n(113,"strong"),e(114,"business logic"),t(),e(115," (e.g., handling various conditions)."),t()()),c&2){let d=o(56),u=o(78),w=o(104);i(53),m(" ",x(54,13,"rpc-exception.filter",d.isJsActive),`
`),i(4),a("hide",d.isJsActive),i(3),a("hide",!d.isJsActive),i(19),a("hide",u.isJsActive),i(3),a("hide",!u.isJsActive),i(23),a("hide",w.isJsActive),i(3),a("hide",!w.isJsActive)}},dependencies:[M,b,y,v,C],encapsulation:2,changeDetection:0})}return s})();var G=(()=>{class s extends E{static \u0275fac=(()=>{let l;return function(h){return(l||(l=S(s)))(h||s)}})();static \u0275cmp=f({type:s,selectors:[["app-grpc"]],features:[g],decls:940,vars:56,consts:[["contentReference",""],["appab338e709ba059cddc30fd2ce85321421be31b90",""],["app26fa9afe30f7d3690ece7f6bcfd13ac299f7ba5b",""],["app4a4d7011f80a8d25caa4db3f5556368c63c4c544",""],["app23b03d7822e1c2546b507696ed39918261a01d6e",""],["appfde8469763ffaa17ed78bf46c091566ccf3b8f86",""],["appf6268103fa6bad7da0cd5d59b8551c13e70c8743",""],["appfb17acbb973022c72a80fe3f75aca8e1c2750aa5",""],["app883a73bec81c8c2bf79d4ce2272661b0d51fbeba",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/microservices/grpc.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","grpc"],["rel","nofollow","target","_blank","href","https://github.com/grpc/grpc-node"],["href","https://protobuf.dev"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","overview"],["href","microservices/grpc#options"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],[1,"language-json"],["appAnchor","","id","options"],["href","https://github.com/grpc/grpc-node/blob/master/packages/proto-loader/README.md","rel","nofollow","target","_blank"],["href","https://grpc.io/grpc/node/grpc.ServerCredentials.html","rel","nofollow","target","_blank"],["appAnchor","","id","sample-grpc-service"],["href","https://developers.google.com/protocol-buffers"],["href","microservices/basics#request-response"],["appAnchor","","id","client"],[1,"error"],["href","/microservices/basics#client"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/04-grpc"],["appAnchor","","id","grpc-reflection"],["rel","nofollow","target","_blank","href","https://grpc.io/docs/guides/reflection/#overview"],["appAnchor","","id","grpc-streaming"],["rel","nofollow","target","_blank","href","https://grpc.io/docs/guides/concepts/"],["appAnchor","","id","streaming-sample"],["rel","nofollow","target","_blank","href","https://github.com/stephenh/ts-proto"],["rel","nofollow","target","_blank","href","https://github.com/stephenh/ts-proto/blob/main/NESTJS.markdown"],["appAnchor","","id","subject-strategy"],[1,"warning"],["appAnchor","","id","call-stream-handler"],["rel","nofollow","target","_blank","href","https://grpc.github.io/grpc/node/grpc-ClientDuplexStream.html"],["rel","nofollow","target","_blank","href","https://grpc.github.io/grpc/node/grpc-ServerReadableStream.html"],["appAnchor","","id","health-checks"],["rel","nofollow","target","_blank","href","https://grpc.io/docs/guides/health-checking/"],["rel","nofollow","target","_blank","href","https://github.com/grpc/grpc-node/tree/master/packages/grpc-health-check"],["rel","nofollow","target","_blank","href","https://github.com/grpc-ecosystem/grpc-health-probe"],["appAnchor","","id","grpc-metadata"],["href","microservices/grpc#subject-strategy"],["href","microservices/grpc#call-stream-handler"]],template:function(c,h){if(c&1&&(n(0,"div",9,0)(2,"div",10)(3,"a",11),r(4,"i",12),t()(),n(5,"h3",13),e(6,"gRPC"),t(),n(7,"p")(8,"a",14),e(9,"gRPC"),t(),e(10," is a modern, open source, high performance RPC framework that can run in any environment. It can efficiently connect services in and across data centers with pluggable support for load balancing, tracing, health checking and authentication."),t(),n(11,"p"),e(12,"Like many RPC systems, gRPC is based on the concept of defining a service in terms of functions (methods) that can be called remotely. For each method, you define the parameters and return types. Services, parameters, and return types are defined in "),n(13,"code"),e(14,".proto"),t(),e(15," files using Google's open source language-neutral "),n(16,"a",15),e(17,"protocol buffers"),t(),e(18," mechanism."),t(),n(19,"p"),e(20,"With the gRPC transporter, Nest uses "),n(21,"code"),e(22,".proto"),t(),e(23," files to dynamically bind clients and servers to make it easy to implement remote procedure calls, automatically serializing and deserializing structured data."),t(),n(24,"h4",16)(25,"span"),e(26,"Installation"),t()(),n(27,"p"),e(28,"To start building gRPC-based microservices, first install the required packages:"),t(),n(29,"pre")(30,"code",17),e(31,`
$ npm i --save @grpc/grpc-js @grpc/proto-loader
`),t()(),n(32,"h4",18)(33,"span"),e(34,"Overview"),t()(),n(35,"p"),e(36,"Like other Nest microservices transport layer implementations, you select the gRPC transporter mechanism using the "),n(37,"code"),e(38,"transport"),t(),e(39," property of the options object passed to the "),n(40,"code"),e(41,"createMicroservice()"),t(),e(42," method. In the following example, we'll set up a hero service. The "),n(43,"code"),e(44,"options"),t(),e(45," property provides metadata about that service; its properties are described "),n(46,"a",19),e(47,"below"),t(),e(48,"."),t(),n(49,"app-copy-button",20)(50,"span",21),e(51),p(52,"extension"),r(53,"app-tabs",null,1),t(),n(55,"pre")(56,"code",22),e(57,`
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
});
`),t()(),n(58,"pre")(59,"code",22),e(60,`
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',
    protoPath: join(__dirname, 'hero/hero.proto'),
  },
});
`),t()()(),n(61,"blockquote",23)(62,"strong"),e(63,"Hint"),t(),e(64," The "),n(65,"code"),e(66,"join()"),t(),e(67," function is imported from the "),n(68,"code"),e(69,"path"),t(),e(70," package; the "),n(71,"code"),e(72,"Transport"),t(),e(73," enum is imported from the "),n(74,"code"),e(75,"@nestjs/microservices"),t(),e(76,` package.
`),t(),n(77,"p"),e(78,"In the "),n(79,"code"),e(80,"nest-cli.json"),t(),e(81," file, we add the "),n(82,"code"),e(83,"assets"),t(),e(84," property that allows us to distribute non-TypeScript files, and "),n(85,"code"),e(86,"watchAssets"),t(),e(87," - to turn on watching all non-TypeScript assets. In our case, we want "),n(88,"code"),e(89,".proto"),t(),e(90," files to be automatically copied to the "),n(91,"code"),e(92,"dist"),t(),e(93," folder."),t(),n(94,"pre")(95,"code",24),e(96,`
{
  "compilerOptions": {
    "assets": ["**/*.proto"],
    "watchAssets": true
  }
}
`),t()(),n(97,"h4",25)(98,"span"),e(99,"Options"),t()(),n(100,"p"),e(101,"The "),n(102,"strong"),e(103,"gRPC"),t(),e(104," transporter options object exposes the properties described below."),t(),n(105,"table")(106,"tr")(107,"td")(108,"code"),e(109,"package"),t()(),n(110,"td"),e(111,"Protobuf package name (matches "),n(112,"code"),e(113,"package"),t(),e(114," setting from "),n(115,"code"),e(116,".proto"),t(),e(117," file). Required"),t()(),n(118,"tr")(119,"td")(120,"code"),e(121,"protoPath"),t()(),n(122,"td"),e(123," Absolute (or relative to the root dir) path to the "),n(124,"code"),e(125,".proto"),t(),e(126," file. Required "),t()(),n(127,"tr")(128,"td")(129,"code"),e(130,"url"),t()(),n(131,"td"),e(132,"Connection url. String in the format "),n(133,"code"),e(134,"ip address/dns name:port"),t(),e(135," (for example, "),n(136,"code"),e(137,"'0.0.0.0:50051'"),t(),e(138," for a Docker server) defining the address/port on which the transporter establishes a connection. Optional. Defaults to "),n(139,"code"),e(140,"'localhost:5000'"),t()()(),n(141,"tr")(142,"td")(143,"code"),e(144,"protoLoader"),t()(),n(145,"td"),e(146,"NPM package name for the utility to load "),n(147,"code"),e(148,".proto"),t(),e(149," files. Optional. Defaults to "),n(150,"code"),e(151,"'@grpc/proto-loader'"),t()()(),n(152,"tr")(153,"td")(154,"code"),e(155,"loader"),t()(),n(156,"td")(157,"code"),e(158,"@grpc/proto-loader"),t(),e(159," options. These provide detailed control over the behavior of "),n(160,"code"),e(161,".proto"),t(),e(162," files. Optional. See "),n(163,"a",26),e(164,"here"),t(),e(165," for more details "),t()(),n(166,"tr")(167,"td")(168,"code"),e(169,"credentials"),t()(),n(170,"td"),e(171," Server credentials. Optional. "),n(172,"a",27),e(173,"Read more here"),t()()()(),n(174,"h4",28)(175,"span"),e(176,"Sample gRPC service"),t()(),n(177,"p"),e(178,"Let's define our sample gRPC service called "),n(179,"code"),e(180,"HeroesService"),t(),e(181,". In the above "),n(182,"code"),e(183,"options"),t(),e(184," object, the"),n(185,"code"),e(186,"protoPath"),t(),e(187," property sets a path to the "),n(188,"code"),e(189,".proto"),t(),e(190," definitions file "),n(191,"code"),e(192,"hero.proto"),t(),e(193,". The "),n(194,"code"),e(195,"hero.proto"),t(),e(196," file is structured using "),n(197,"a",29),e(198,"protocol buffers"),t(),e(199,". Here's what it looks like:"),t(),n(200,"app-copy-button")(201,"pre")(202,"code",22),e(203,`
// hero/hero.proto
syntax = "proto3";

package hero;

service HeroesService {
  rpc FindOne (HeroById) returns (Hero) {}
}

message HeroById {
  int32 id = 1;
}

message Hero {
  int32 id = 1;
  string name = 2;
}
`),t()()(),n(204,"p"),e(205,"Our "),n(206,"code"),e(207,"HeroesService"),t(),e(208," exposes a "),n(209,"code"),e(210,"FindOne()"),t(),e(211," method. This method expects an input argument of type "),n(212,"code"),e(213,"HeroById"),t(),e(214," and returns a "),n(215,"code"),e(216,"Hero"),t(),e(217," message (protocol buffers use "),n(218,"code"),e(219,"message"),t(),e(220," elements to define both parameter types and return types)."),t(),n(221,"p"),e(222,"Next, we need to implement the service. To define a handler that fulfills this definition, we use the "),n(223,"code"),e(224,"@GrpcMethod()"),t(),e(225," decorator in a controller, as shown below. This decorator provides the metadata needed to declare a method as a gRPC service method."),t(),n(226,"blockquote",23)(227,"strong"),e(228,"Hint"),t(),e(229," The "),n(230,"code"),e(231,"@MessagePattern()"),t(),e(232," decorator ("),n(233,"a",30),e(234,"read more"),t(),e(235,") introduced in previous microservices chapters is not used with gRPC-based microservices. The "),n(236,"code"),e(237,"@GrpcMethod()"),t(),e(238,` decorator effectively takes its place for gRPC-based microservices.
`),t(),n(239,"app-copy-button",20)(240,"span",21),e(241),p(242,"extension"),r(243,"app-tabs",null,2),t(),n(245,"pre")(246,"code",22),e(247,`
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService', 'FindOne')
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
`),t()(),n(248,"pre")(249,"code",22),e(250,`
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService', 'FindOne')
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
`),t()()(),n(251,"blockquote",23)(252,"strong"),e(253,"Hint"),t(),e(254," The "),n(255,"code"),e(256,"@GrpcMethod()"),t(),e(257," decorator is imported from the "),n(258,"code"),e(259,"@nestjs/microservices"),t(),e(260," package, while "),n(261,"code"),e(262,"Metadata"),t(),e(263," and "),n(264,"code"),e(265,"ServerUnaryCall"),t(),e(266," from the "),n(267,"code"),e(268,"grpc"),t(),e(269,` package.
`),t(),n(270,"p"),e(271,"The decorator shown above takes two arguments. The first is the service name (e.g., "),n(272,"code"),e(273,"'HeroesService'"),t(),e(274,"), corresponding to the "),n(275,"code"),e(276,"HeroesService"),t(),e(277," service definition in "),n(278,"code"),e(279,"hero.proto"),t(),e(280,". The second (the string "),n(281,"code"),e(282,"'FindOne'"),t(),e(283,") corresponds to the "),n(284,"code"),e(285,"FindOne()"),t(),e(286," rpc method defined within "),n(287,"code"),e(288,"HeroesService"),t(),e(289," in the "),n(290,"code"),e(291,"hero.proto"),t(),e(292," file."),t(),n(293,"p"),e(294,"The "),n(295,"code"),e(296,"findOne()"),t(),e(297," handler method takes three arguments, the "),n(298,"code"),e(299,"data"),t(),e(300," passed from the caller, "),n(301,"code"),e(302,"metadata"),t(),e(303,` that stores gRPC
request metadata and `),n(304,"code"),e(305,"call"),t(),e(306," to obtain the "),n(307,"code"),e(308,"GrpcCall"),t(),e(309," object properties such as "),n(310,"code"),e(311,"sendMetadata"),t(),e(312," for send metadata to client."),t(),n(313,"p"),e(314,"Both "),n(315,"code"),e(316,"@GrpcMethod()"),t(),e(317," decorator arguments are optional. If called without the second argument (e.g., "),n(318,"code"),e(319,"'FindOne'"),t(),e(320,"), Nest will automatically associate the "),n(321,"code"),e(322,".proto"),t(),e(323," file rpc method with the handler based on converting the handler name to upper camel case (e.g., the "),n(324,"code"),e(325,"findOne"),t(),e(326," handler is associated with the "),n(327,"code"),e(328,"FindOne"),t(),e(329," rpc call definition). This is shown below."),t(),n(330,"app-copy-button",20)(331,"span",21),e(332),p(333,"extension"),r(334,"app-tabs",null,3),t(),n(336,"pre")(337,"code",22),e(338,`
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService')
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
`),t()(),n(339,"pre")(340,"code",22),e(341,`
@Controller()
export class HeroesController {
  @GrpcMethod('HeroesService')
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
`),t()()(),n(342,"p"),e(343,"You can also omit the first "),n(344,"code"),e(345,"@GrpcMethod()"),t(),e(346," argument. In this case, Nest automatically associates the handler with the service definition from the proto definitions file based on the "),n(347,"strong"),e(348,"class"),t(),e(349," name where the handler is defined. For example, in the following code, class "),n(350,"code"),e(351,"HeroesService"),t(),e(352," associates its handler methods with the "),n(353,"code"),e(354,"HeroesService"),t(),e(355," service definition in the "),n(356,"code"),e(357,"hero.proto"),t(),e(358," file based on the matching of the name "),n(359,"code"),e(360,"'HeroesService'"),t(),e(361,"."),t(),n(362,"app-copy-button",20)(363,"span",21),e(364),p(365,"extension"),r(366,"app-tabs",null,4),t(),n(368,"pre")(369,"code",22),e(370,`
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
`),t()(),n(371,"pre")(372,"code",22),e(373,`
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data, metadata, call) {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    return items.find(({ id }) => id === data.id);
  }
}
`),t()()(),n(374,"h4",31)(375,"span"),e(376,"Client"),t()(),n(377,"p"),e(378,"Nest applications can act as gRPC clients, consuming services defined in "),n(379,"code"),e(380,".proto"),t(),e(381," files. You access remote services through a "),n(382,"code"),e(383,"ClientGrpc"),t(),e(384," object. You can obtain a "),n(385,"code"),e(386,"ClientGrpc"),t(),e(387," object in several ways."),t(),n(388,"p"),e(389,"The preferred technique is to import the "),n(390,"code"),e(391,"ClientsModule"),t(),e(392,". Use the "),n(393,"code"),e(394,"register()"),t(),e(395," method to bind a package of services defined in a "),n(396,"code"),e(397,".proto"),t(),e(398," file to an injection token, and to configure the service. The "),n(399,"code"),e(400,"name"),t(),e(401," property is the injection token. For gRPC services, use "),n(402,"code"),e(403,"transport: Transport.GRPC"),t(),e(404,". The "),n(405,"code"),e(406,"options"),t(),e(407," property is an object with the same properties described "),n(408,"a",19),e(409,"above"),t(),e(410,"."),t(),n(411,"app-copy-button")(412,"pre")(413,"code",22),e(414,`
imports: [
  ClientsModule.register([
    {
      name: 'HERO_PACKAGE',
      transport: Transport.GRPC,
      options: {
        package: 'hero',
        protoPath: join(__dirname, 'hero/hero.proto'),
      },
    },
  ]),
];
`),t()()(),n(415,"blockquote",23)(416,"strong"),e(417,"Hint"),t(),e(418," The "),n(419,"code"),e(420,"register()"),t(),e(421,` method takes an array of objects. Register multiple packages by providing a comma separated list of registration objects.
`),t(),n(422,"p"),e(423,"Once registered, we can inject the configured "),n(424,"code"),e(425,"ClientGrpc"),t(),e(426," object with "),n(427,"code"),e(428,"@Inject()"),t(),e(429,". Then we use the "),n(430,"code"),e(431,"ClientGrpc"),t(),e(432," object's "),n(433,"code"),e(434,"getService()"),t(),e(435," method to retrieve the service instance, as shown below."),t(),n(436,"app-copy-button")(437,"pre")(438,"code",22),e(439,`
@Injectable()
export class AppService implements OnModuleInit {
  private heroesService: HeroesService;

  constructor(@Inject('HERO_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.heroesService = this.client.getService<HeroesService>('HeroesService');
  }

  getHero(): Observable<string> {
    return this.heroesService.findOne({ id: 1 });
  }
}
`),t()()(),n(440,"blockquote",32)(441,"strong"),e(442,"Warning"),t(),e(443," gRPC Client will not send fields that contain underscore "),n(444,"code"),e(445,"_"),t(),e(446," in their names unless the "),n(447,"code"),e(448,"keepCase"),t(),e(449," options is set to "),n(450,"code"),e(451,"true"),t(),e(452," in the proto loader configuration ("),n(453,"code"),e(454,"options.loader.keepcase"),t(),e(455,` in the microservice transporter configuration).
`),t(),n(456,"p"),e(457,"Notice that there is a small difference compared to the technique used in other microservice transport methods. Instead of the "),n(458,"code"),e(459,"ClientProxy"),t(),e(460," class, we use the "),n(461,"code"),e(462,"ClientGrpc"),t(),e(463," class, which provides the "),n(464,"code"),e(465,"getService()"),t(),e(466," method. The "),n(467,"code"),e(468,"getService()"),t(),e(469," generic method takes a service name as an argument and returns its instance (if available)."),t(),n(470,"p"),e(471,"Alternatively, you can use the "),n(472,"code"),e(473,"@Client()"),t(),e(474," decorator to instantiate a "),n(475,"code"),e(476,"ClientGrpc"),t(),e(477," object, as follows:"),t(),n(478,"app-copy-button")(479,"pre")(480,"code",22),e(481,`
@Injectable()
export class AppService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'hero',
      protoPath: join(__dirname, 'hero/hero.proto'),
    },
  })
  client: ClientGrpc;

  private heroesService: HeroesService;

  onModuleInit() {
    this.heroesService = this.client.getService<HeroesService>('HeroesService');
  }

  getHero(): Observable<string> {
    return this.heroesService.findOne({ id: 1 });
  }
}
`),t()()(),n(482,"p"),e(483,"Finally, for more complex scenarios, we can inject a dynamically configured client using the "),n(484,"code"),e(485,"ClientProxyFactory"),t(),e(486," class as described "),n(487,"a",33),e(488,"here"),t(),e(489,"."),t(),n(490,"p"),e(491,"In either case, we end up with a reference to our "),n(492,"code"),e(493,"HeroesService"),t(),e(494," proxy object, which exposes the same set of methods that are defined inside the "),n(495,"code"),e(496,".proto"),t(),e(497," file. Now, when we access this proxy object (i.e., "),n(498,"code"),e(499,"heroesService"),t(),e(500,"), the gRPC system automatically serializes requests, forwards them to the remote system, returns a response, and deserializes the response. Because gRPC shields us from these network communication details, "),n(501,"code"),e(502,"heroesService"),t(),e(503," looks and acts like a local provider."),t(),n(504,"p"),e(505,"Note, all service methods are "),n(506,"strong"),e(507,"lower camel cased"),t(),e(508," (in order to follow the natural convention of the language). So, for example, while our "),n(509,"code"),e(510,".proto"),t(),e(511," file "),n(512,"code"),e(513,"HeroesService"),t(),e(514," definition contains the "),n(515,"code"),e(516,"FindOne()"),t(),e(517," function, the "),n(518,"code"),e(519,"heroesService"),t(),e(520," instance will provide the "),n(521,"code"),e(522,"findOne()"),t(),e(523," method."),t(),n(524,"app-copy-button")(525,"pre")(526,"code",22),e(527,`
interface HeroesService {
  findOne(data: { id: number }): Observable<any>;
}
`),t()()(),n(528,"p"),e(529,"A message handler is also able to return an\xA0"),n(530,"code"),e(531,"Observable"),t(),e(532,", in which case the result values will be emitted until the stream is completed."),t(),n(533,"app-copy-button",20)(534,"span",21),e(535),p(536,"extension"),r(537,"app-tabs",null,5),t(),n(539,"pre")(540,"code",22),e(541,`
@Get()
call(): Observable<any> {
  return this.heroesService.findOne({ id: 1 });
}
`),t()(),n(542,"pre")(543,"code",22),e(544,`
@Get()
call() {
  return this.heroesService.findOne({ id: 1 });
}
`),t()()(),n(545,"p"),e(546,"To send gRPC metadata (along with the request), you can pass a second argument, as follows:"),t(),n(547,"app-copy-button")(548,"pre")(549,"code",22),e(550,`
call(): Observable<any> {
  const metadata = new Metadata();
  metadata.add('Set-Cookie', 'yummy_cookie=choco');

  return this.heroesService.findOne({ id: 1 }, metadata);
}
`),t()()(),n(551,"blockquote",23)(552,"strong"),e(553,"Hint"),t(),e(554," The "),n(555,"code"),e(556,"Metadata"),t(),e(557," class is imported from the "),n(558,"code"),e(559,"grpc"),t(),e(560,` package.
`),t(),n(561,"p"),e(562,"Please note that this would require updating the "),n(563,"code"),e(564,"HeroesService"),t(),e(565," interface that we've defined a few steps earlier."),t(),n(566,"h4",34)(567,"span"),e(568,"Example"),t()(),n(569,"p"),e(570,"A working example is available "),n(571,"a",35),e(572,"here"),t(),e(573,"."),t(),n(574,"h4",36)(575,"span"),e(576,"gRPC Reflection"),t()(),n(577,"p"),e(578,"The "),n(579,"a",37),e(580,"gRPC Server Reflection Specification"),t(),e(581," is a standard which allows gRPC clients to request details about the API that the server exposes, akin to exposing an OpenAPI document for a REST API. This can make working with developer debugging tools such as grpc-ui or postman significantly easier."),t(),n(582,"p"),e(583,"To add gRPC reflection support to your server, first install the required implementation package:"),t(),n(584,"pre")(585,"code",17),e(586,`
$ npm i --save @grpc/reflection
`),t()(),n(587,"p"),e(588,"Then it can be hooked into the gRPC server using the "),n(589,"code"),e(590,"onLoadPackageDefinition"),t(),e(591," hook in your gRPC server options, as follows:"),t(),n(592,"app-copy-button",20)(593,"span",21),e(594),p(595,"extension"),r(596,"app-tabs",null,6),t(),n(598,"pre")(599,"code",22),e(600,`
import { ReflectionService } from '@grpc/reflection';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  options: {
    onLoadPackageDefinition: (pkg, server) => {
      new ReflectionService(pkg).addToServer(server);
    },
  },
});
`),t()()(),n(601,"p"),e(602,"Now your server will respond to messages requesting API details using the reflection specification."),t(),n(603,"h4",38)(604,"span"),e(605,"gRPC Streaming"),t()(),n(606,"p"),e(607,"gRPC on its own supports long-term live connections, conventionally known as "),n(608,"code"),e(609,"streams"),t(),e(610,". Streams are useful for cases such as Chatting, Observations or Chunk-data transfers. Find more details in the official documentation "),n(611,"a",39),e(612,"here"),t(),e(613,"."),t(),n(614,"p"),e(615,"Nest supports GRPC stream handlers in two possible ways:"),t(),n(616,"ul")(617,"li"),e(618,"RxJS "),n(619,"code"),e(620,"Subject"),t(),e(621," + "),n(622,"code"),e(623,"Observable"),t(),e(624," handler: can be useful to write responses right inside of a Controller method or to be passed down to "),n(625,"code"),e(626,"Subject"),t(),e(627,"/"),n(628,"code"),e(629,"Observable"),t(),e(630," consumer"),t(),n(631,"li"),e(632,"Pure GRPC call stream handler: can be useful to be passed to some executor which will handle the rest of dispatch for the Node standard "),n(633,"code"),e(634,"Duplex"),t(),e(635," stream handler."),t()(),n(636,"p"),r(637,"app-banner-enterprise"),t(),n(638,"h4",40)(639,"span"),e(640,"Streaming sample"),t()(),n(641,"p"),e(642,"Let's define a new sample gRPC service called "),n(643,"code"),e(644,"HelloService"),t(),e(645,". The "),n(646,"code"),e(647,"hello.proto"),t(),e(648," file is structured using "),n(649,"a",29),e(650,"protocol buffers"),t(),e(651,". Here's what it looks like:"),t(),n(652,"app-copy-button")(653,"pre")(654,"code",22),e(655,`
// hello/hello.proto
syntax = "proto3";

package hello;

service HelloService {
  rpc BidiHello(stream HelloRequest) returns (stream HelloResponse);
  rpc LotsOfGreetings(stream HelloRequest) returns (HelloResponse);
}

message HelloRequest {
  string greeting = 1;
}

message HelloResponse {
  string reply = 1;
}
`),t()()(),n(656,"blockquote",23)(657,"strong"),e(658,"Hint"),t(),e(659," The "),n(660,"code"),e(661,"LotsOfGreetings"),t(),e(662," method can be simply implemented with the "),n(663,"code"),e(664,"@GrpcMethod"),t(),e(665,` decorator (as in the examples above) since the returned stream can emit multiple values.
`),t(),n(666,"p"),e(667,"Based on this "),n(668,"code"),e(669,".proto"),t(),e(670," file, let's define the "),n(671,"code"),e(672,"HelloService"),t(),e(673," interface:"),t(),n(674,"app-copy-button")(675,"pre")(676,"code",22),e(677,`
interface HelloService {
  bidiHello(upstream: Observable<HelloRequest>): Observable<HelloResponse>;
  lotsOfGreetings(
    upstream: Observable<HelloRequest>,
  ): Observable<HelloResponse>;
}

interface HelloRequest {
  greeting: string;
}

interface HelloResponse {
  reply: string;
}
`),t()()(),n(678,"blockquote",23)(679,"strong"),e(680,"Hint"),t(),e(681," The proto interface can be automatically generated by the "),n(682,"a",41),e(683,"ts-proto"),t(),e(684," package, learn more "),n(685,"a",42),e(686,"here"),t(),e(687,`.
`),t(),n(688,"h4",43)(689,"span"),e(690,"Subject strategy"),t()(),n(691,"p"),e(692,"The "),n(693,"code"),e(694,"@GrpcStreamMethod()"),t(),e(695," decorator provides the function parameter as an RxJS "),n(696,"code"),e(697,"Observable"),t(),e(698,". Thus, we can receive and process multiple messages."),t(),n(699,"app-copy-button")(700,"pre")(701,"code",22),e(702,`
@GrpcStreamMethod()
bidiHello(messages: Observable<any>, metadata: Metadata, call: ServerDuplexStream<any, any>): Observable<any> {
  const subject = new Subject();

  const onNext = message => {
    console.log(message);
    subject.next({
      reply: 'Hello, world!'
    });
  };
  const onComplete = () => subject.complete();
  messages.subscribe({
    next: onNext,
    complete: onComplete,
  });


  return subject.asObservable();
}
`),t()()(),n(703,"blockquote",44)(704,"strong"),e(705,"Warning"),t(),e(706," For supporting full-duplex interaction with the "),n(707,"code"),e(708,"@GrpcStreamMethod()"),t(),e(709," decorator, the controller method must return an RxJS "),n(710,"code"),e(711,"Observable"),t(),e(712,`.
`),t(),n(713,"blockquote",23)(714,"strong"),e(715,"Hint"),t(),e(716," The "),n(717,"code"),e(718,"Metadata"),t(),e(719," and "),n(720,"code"),e(721,"ServerUnaryCall"),t(),e(722," classes/interfaces are imported from the "),n(723,"code"),e(724,"grpc"),t(),e(725,` package.
`),t(),n(726,"p"),e(727,"According to the service definition (in the "),n(728,"code"),e(729,".proto"),t(),e(730," file), the "),n(731,"code"),e(732,"BidiHello"),t(),e(733," method should stream requests to the service. To send multiple asynchronous messages to the stream from a client, we leverage an RxJS "),n(734,"code"),e(735,"ReplaySubject"),t(),e(736," class."),t(),n(737,"app-copy-button")(738,"pre")(739,"code",22),e(740,`
const helloService = this.client.getService<HelloService>('HelloService');
const helloRequest$ = new ReplaySubject<HelloRequest>();

helloRequest$.next({ greeting: 'Hello (1)!' });
helloRequest$.next({ greeting: 'Hello (2)!' });
helloRequest$.complete();

return helloService.bidiHello(helloRequest$);
`),t()()(),n(741,"p"),e(742,"In the example above, we wrote two messages to the stream ("),n(743,"code"),e(744,"next()"),t(),e(745," calls) and notified the service that we've completed sending the data ("),n(746,"code"),e(747,"complete()"),t(),e(748," call)."),t(),n(749,"h4",45)(750,"span"),e(751,"Call stream handler"),t()(),n(752,"p"),e(753,"When the method return value is defined as "),n(754,"code"),e(755,"stream"),t(),e(756,", the "),n(757,"code"),e(758,"@GrpcStreamCall()"),t(),e(759," decorator provides the function parameter as "),n(760,"code"),e(761,"grpc.ServerDuplexStream"),t(),e(762,", which supports standard methods like "),n(763,"code"),e(764,".on('data', callback)"),t(),e(765,", "),n(766,"code"),e(767,".write(message)"),t(),e(768," or "),n(769,"code"),e(770,".cancel()"),t(),e(771,". Full documentation on available methods can be found "),n(772,"a",46),e(773,"here"),t(),e(774,"."),t(),n(775,"p"),e(776,"Alternatively, when the method return value is not a "),n(777,"code"),e(778,"stream"),t(),e(779,", the "),n(780,"code"),e(781,"@GrpcStreamCall()"),t(),e(782," decorator provides two function parameters, respectively "),n(783,"code"),e(784,"grpc.ServerReadableStream"),t(),e(785," (read more "),n(786,"a",47),e(787,"here"),t(),e(788,") and "),n(789,"code"),e(790,"callback"),t(),e(791,"."),t(),n(792,"p"),e(793,"Let's start with implementing the "),n(794,"code"),e(795,"BidiHello"),t(),e(796," which should support a full-duplex interaction."),t(),n(797,"app-copy-button")(798,"pre")(799,"code",22),e(800,`
@GrpcStreamCall()
bidiHello(requestStream: any) {
  requestStream.on('data', message => {
    console.log(message);
    requestStream.write({
      reply: 'Hello, world!'
    });
  });
}
`),t()()(),n(801,"blockquote",23)(802,"strong"),e(803,"Hint"),t(),e(804,` This decorator does not require any specific return parameter to be provided. It is expected that the stream will be handled similar to any other standard stream type.
`),t(),n(805,"p"),e(806,"In the example above, we used the "),n(807,"code"),e(808,"write()"),t(),e(809," method to write objects to the response stream. The callback passed into the "),n(810,"code"),e(811,".on()"),t(),e(812," method as a second parameter will be called every time our service receives a new chunk of data."),t(),n(813,"p"),e(814,"Let's implement the "),n(815,"code"),e(816,"LotsOfGreetings"),t(),e(817," method."),t(),n(818,"app-copy-button")(819,"pre")(820,"code",22),e(821,`
@GrpcStreamCall()
lotsOfGreetings(requestStream: any, callback: (err: unknown, value: HelloResponse) => void) {
  requestStream.on('data', message => {
    console.log(message);
  });
  requestStream.on('end', () => callback(null, { reply: 'Hello, world!' }));
}
`),t()()(),n(822,"p"),e(823,"Here we used the "),n(824,"code"),e(825,"callback"),t(),e(826," function to send the response once processing of the "),n(827,"code"),e(828,"requestStream"),t(),e(829," has been completed."),t(),n(830,"h4",48)(831,"span"),e(832,"Health checks"),t()(),n(833,"p"),e(834,"When running a gRPC application in an orchestrator such a Kubernetes, you may need to know if it is running and in a healthy state. The "),n(835,"a",49),e(836,"gRPC Health Check specification"),t(),e(837," is a standard that allow gRPC clients to expose their health status to allow the orchestrator to act accordingly."),t(),n(838,"p"),e(839,"To add gRPC health check support, first install the "),n(840,"a",50),e(841,"grpc-node"),t(),e(842," package:"),t(),n(843,"pre")(844,"code",17),e(845,`
$ npm i --save grpc-health-check
`),t()(),n(846,"p"),e(847,"Then it can be hooked into the gRPC service using the "),n(848,"code"),e(849,"onLoadPackageDefinition"),t(),e(850," hook in your gRPC server options, as follows. Note that the "),n(851,"code"),e(852,"protoPath"),t(),e(853," needs to have both the health check and the hero package."),t(),n(854,"app-copy-button",20)(855,"span",21),e(856),p(857,"extension"),r(858,"app-tabs",null,7),t(),n(860,"pre")(861,"code",22),e(862,`
import { HealthImplementation, protoPath as healthCheckProtoPath } from 'grpc-health-check';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  options: {
    protoPath: [
      healthCheckProtoPath,
      protoPath: join(__dirname, 'hero/hero.proto'),
    ],
    onLoadPackageDefinition: (pkg, server) => {
      const healthImpl = new HealthImplementation({
        '': 'UNKNOWN',
      });

      healthImpl.addToServer(server);
      healthImpl.setStatus('', 'SERVING');
    },
  },
});
`),t()()(),n(863,"blockquote",23)(864,"strong"),e(865,"Hint"),t(),e(866," The "),n(867,"a",51),e(868,"gRPC health probe"),t(),e(869,` is a useful CLI to test gRPC health checks in a containerized environment.
`),t(),n(870,"h4",52)(871,"span"),e(872,"gRPC Metadata"),t()(),n(873,"p"),e(874,"Metadata is information about a particular RPC call in the form of a list of key-value pairs, where the keys are strings and the values are typically strings but can be binary data. Metadata is opaque to gRPC itself - it lets the client provide information associated with the call to the server and vice versa. Metadata may include authentication tokens, request identifiers and tags for monitoring purposes, and data information such as the number of records in a data set."),t(),n(875,"p"),e(876,"To read the metadata in "),n(877,"code"),e(878,"@GrpcMethod()"),t(),e(879," handler, use the second argument (metadata), which is of type "),n(880,"code"),e(881,"Metadata"),t(),e(882," (imported from the "),n(883,"code"),e(884,"grpc"),t(),e(885," package)."),t(),n(886,"p"),e(887,"To send back metadata from the handler, use the "),n(888,"code"),e(889,"ServerUnaryCall#sendMetadata()"),t(),e(890," method (third handler argument)."),t(),n(891,"app-copy-button",20)(892,"span",21),e(893),p(894,"extension"),r(895,"app-tabs",null,8),t(),n(897,"pre")(898,"code",22),e(899,`
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data: HeroById, metadata: Metadata, call: ServerUnaryCall<any, any>): Hero {
    const serverMetadata = new Metadata();
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];

    serverMetadata.add('Set-Cookie', 'yummy_cookie=choco');
    call.sendMetadata(serverMetadata);

    return items.find(({ id }) => id === data.id);
  }
}
`),t()(),n(900,"pre")(901,"code",22),e(902,`
@Controller()
export class HeroesService {
  @GrpcMethod()
  findOne(data, metadata, call) {
    const serverMetadata = new Metadata();
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];

    serverMetadata.add('Set-Cookie', 'yummy_cookie=choco');
    call.sendMetadata(serverMetadata);

    return items.find(({ id }) => id === data.id);
  }
}
`),t()()(),n(903,"p"),e(904,"Likewise, to read the metadata in handlers annotated with the "),n(905,"code"),e(906,"@GrpcStreamMethod()"),t(),e(907," handler ("),n(908,"a",53),e(909,"subject strategy"),t(),e(910,"), use the second argument (metadata), which is of type "),n(911,"code"),e(912,"Metadata"),t(),e(913," (imported from the "),n(914,"code"),e(915,"grpc"),t(),e(916," package)."),t(),n(917,"p"),e(918,"To send back metadata from the handler, use the "),n(919,"code"),e(920,"ServerDuplexStream#sendMetadata()"),t(),e(921," method (third handler argument)."),t(),n(922,"p"),e(923,"To read metadata from within the "),n(924,"a",54),e(925,"call stream handlers"),t(),e(926," (handlers annotated with "),n(927,"code"),e(928,"@GrpcStreamCall()"),t(),e(929," decorator), listen to the "),n(930,"code"),e(931,"metadata"),t(),e(932," event on the "),n(933,"code"),e(934,"requestStream"),t(),e(935," reference, as follows:"),t(),n(936,"app-copy-button")(937,"pre")(938,"code",22),e(939,`
requestStream.on('metadata', (metadata: Metadata) => {
  const meta = metadata.get('X-Meta');
});
`),t()()()()),c&2){let d=o(54),u=o(244),w=o(335),T=o(367),k=o(538),P=o(597),R=o(859),q=o(896);i(51),m(" ",x(52,32,"main",d.isJsActive),`
`),i(4),a("hide",d.isJsActive),i(3),a("hide",!d.isJsActive),i(183),m(" ",x(242,35,"heroes.controller",u.isJsActive),`
`),i(4),a("hide",u.isJsActive),i(3),a("hide",!u.isJsActive),i(84),m(" ",x(333,38,"heroes.controller",w.isJsActive),`
`),i(4),a("hide",w.isJsActive),i(3),a("hide",!w.isJsActive),i(25),m(" ",x(365,41,"heroes.controller",T.isJsActive),`
`),i(4),a("hide",T.isJsActive),i(3),a("hide",!T.isJsActive),i(164),m(" ",x(536,44,"heroes.controller",k.isJsActive),`
`),i(4),a("hide",k.isJsActive),i(3),a("hide",!k.isJsActive),i(52),m(" ",x(595,47,"main",P.isJsActive),`
`),i(262),m(" ",x(857,50,"main",R.isJsActive),`
`),i(37),m(" ",x(894,53,"heroes.controller",q.isJsActive),`
`),i(4),a("hide",q.isJsActive),i(3),a("hide",!q.isJsActive)}},dependencies:[y,b,v,H,C],encapsulation:2,changeDetection:0})}return s})();var Q=(()=>{class s extends E{static \u0275fac=(()=>{let l;return function(h){return(l||(l=S(s)))(h||s)}})();static \u0275cmp=f({type:s,selectors:[["app-guards"]],features:[g],decls:46,vars:4,consts:[["contentReference",""],["app269df4ceb43de25c18266df01397b4e29d809304",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/microservices/guards.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","guards"],["routerLink","/guards"],[1,"info"],["appAnchor","","id","binding-guards"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"]],template:function(c,h){if(c&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),r(4,"i",5),t()(),n(5,"h3",6),e(6,"Guards"),t(),n(7,"p"),e(8,"There is no fundamental difference between microservices guards and "),n(9,"a",7),e(10,"regular HTTP application guards"),t(),e(11,`.
The only difference is that instead of throwing `),n(12,"code"),e(13,"HttpException"),t(),e(14,", you should use "),n(15,"code"),e(16,"RpcException"),t(),e(17,"."),t(),n(18,"blockquote",8)(19,"strong"),e(20,"Hint"),t(),e(21," The "),n(22,"code"),e(23,"RpcException"),t(),e(24," class is exposed from "),n(25,"code"),e(26,"@nestjs/microservices"),t(),e(27,` package.
`),t(),n(28,"h4",9)(29,"span"),e(30,"Binding guards"),t()(),n(31,"p"),e(32,"The following example uses a method-scoped guard. Just as with HTTP based applications, you can also use controller-scoped guards (i.e., prefix the controller class with a "),n(33,"code"),e(34,"@UseGuards()"),t(),e(35," decorator)."),t(),n(36,"app-copy-button",10)(37,"span",11),r(38,"app-tabs",null,1),t(),n(40,"pre")(41,"code",12),e(42,`
@UseGuards(AuthGuard)
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
`),t()(),n(43,"pre")(44,"code",12),e(45,`
@UseGuards(AuthGuard)
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
`),t()()()()),c&2){let d=o(39);i(40),a("hide",d.isJsActive),i(3),a("hide",!d.isJsActive)}},dependencies:[M,y,b,v],encapsulation:2,changeDetection:0})}return s})();var L=(()=>{class s extends E{static \u0275fac=(()=>{let l;return function(h){return(l||(l=S(s)))(h||s)}})();static \u0275cmp=f({type:s,selectors:[["app-interceptors"]],features:[g],decls:25,vars:4,consts:[["contentReference",""],["app2ed8f39c24aa826c122e9264a155902271f23dd7",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/microservices/interceptors.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","interceptors"],["routerLink","/interceptors"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"]],template:function(c,h){if(c&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),r(4,"i",5),t()(),n(5,"h3",6),e(6,"Interceptors"),t(),n(7,"p"),e(8,"There is no difference between "),n(9,"a",7),e(10,"regular interceptors"),t(),e(11," and microservices interceptors. The following example uses a manually instantiated method-scoped interceptor. Just as with HTTP based applications, you can also use controller-scoped interceptors (i.e., prefix the controller class with a "),n(12,"code"),e(13,"@UseInterceptors()"),t(),e(14," decorator)."),t(),n(15,"app-copy-button",8)(16,"span",9),r(17,"app-tabs",null,1),t(),n(19,"pre")(20,"code",10),e(21,`
@UseInterceptors(new TransformInterceptor())
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
`),t()(),n(22,"pre")(23,"code",10),e(24,`
@UseInterceptors(new TransformInterceptor())
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
`),t()()()()),c&2){let d=o(18);i(19),a("hide",d.isJsActive),i(3),a("hide",!d.isJsActive)}},dependencies:[M,b,v],encapsulation:2,changeDetection:0})}return s})();var W=(()=>{class s extends E{static \u0275fac=(()=>{let l;return function(h){return(l||(l=S(s)))(h||s)}})();static \u0275cmp=f({type:s,selectors:[["app-mqtt"]],features:[g],decls:409,vars:36,consts:[["contentReference",""],["appbecc96b83c47dd280591f9a8f398daeb3ae1986e",""],["app0ea5fa367eafd1c580993d8d8f4e3682f8896d57",""],["appf97bf5b12e1e486a422cb2ebd6ee0cb59241269a",""],["app0c445fb6c5089aba9b5d07794a63bfc6e59a1281",""],["app6cf51c83b79c63ff3583498b4cdcf73dd1948578",""],["appa77bf3a8a3d3627abf3f3276d623c567a2c9a01c",""],["app4bd4207358e844b591e458d8a2015a467f16f15b",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/microservices/mqtt.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","mqtt"],["rel","nofollow","target","_blank","href","https://mqtt.org/"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","overview"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","options"],["rel","nofollow","target","_blank","href","https://github.com/mqttjs/MQTT.js/#mqttclientstreambuilder-options"],["appAnchor","","id","client"],["href","https://docs.nestjs.com/microservices/basics#client"],["appAnchor","","id","context"],["rel","nofollow","target","_blank","href","https://github.com/mqttjs/mqtt-packet"],["appAnchor","","id","wildcards"],["appAnchor","","id","quality-of-service-qos"],["appAnchor","","id","per-pattern-qos"],["appAnchor","","id","record-builders"],["appAnchor","","id","instance-status-updates"],["appAnchor","","id","listening-to-mqtt-events"],["appAnchor","","id","underlying-driver-access"]],template:function(c,h){if(c&1&&(n(0,"div",8,0)(2,"div",9)(3,"a",10),r(4,"i",11),t()(),n(5,"h3",12),e(6,"MQTT"),t(),n(7,"p")(8,"a",13),e(9,"MQTT"),t(),e(10," (Message Queuing Telemetry Transport) is an open source, lightweight messaging protocol, optimized for low latency. This protocol provides a scalable and cost-efficient way to connect devices using a "),n(11,"strong"),e(12,"publish/subscribe"),t(),e(13," model. A communication system built on MQTT consists of the publishing server, a broker and one or more clients. It is designed for constrained devices and low-bandwidth, high-latency or unreliable networks."),t(),n(14,"h4",14)(15,"span"),e(16,"Installation"),t()(),n(17,"p"),e(18,"To start building MQTT-based microservices, first install the required package:"),t(),n(19,"pre")(20,"code",15),e(21,`
$ npm i --save mqtt
`),t()(),n(22,"h4",16)(23,"span"),e(24,"Overview"),t()(),n(25,"p"),e(26,"To use the MQTT transporter, pass the following options object to the "),n(27,"code"),e(28,"createMicroservice()"),t(),e(29," method:"),t(),n(30,"app-copy-button",17)(31,"span",18),e(32),p(33,"extension"),r(34,"app-tabs",null,1),t(),n(36,"pre")(37,"code",19),e(38,`
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
  },
});
`),t()(),n(39,"pre")(40,"code",19),e(41,`
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
  },
});
`),t()()(),n(42,"blockquote",20)(43,"strong"),e(44,"Hint"),t(),e(45," The "),n(46,"code"),e(47,"Transport"),t(),e(48," enum is imported from the "),n(49,"code"),e(50,"@nestjs/microservices"),t(),e(51,` package.
`),t(),n(52,"h4",21)(53,"span"),e(54,"Options"),t()(),n(55,"p"),e(56,"The "),n(57,"code"),e(58,"options"),t(),e(59," object is specific to the chosen transporter. The "),n(60,"strong"),e(61,"MQTT"),t(),e(62," transporter exposes the properties described "),n(63,"a",22),e(64,"here"),t(),e(65,"."),t(),n(66,"h4",23)(67,"span"),e(68,"Client"),t()(),n(69,"p"),e(70,"Like other microservice transporters, you have "),n(71,"a",24),e(72,"several options"),t(),e(73," for creating a MQTT "),n(74,"code"),e(75,"ClientProxy"),t(),e(76," instance."),t(),n(77,"p"),e(78,"One method for creating an instance is to use use the "),n(79,"code"),e(80,"ClientsModule"),t(),e(81,". To create a client instance with the "),n(82,"code"),e(83,"ClientsModule"),t(),e(84,", import it and use the "),n(85,"code"),e(86,"register()"),t(),e(87," method to pass an options object with the same properties shown above in the "),n(88,"code"),e(89,"createMicroservice()"),t(),e(90," method, as well as a "),n(91,"code"),e(92,"name"),t(),e(93," property to be used as the injection token. Read more about "),n(94,"code"),e(95,"ClientsModule"),t(),n(96,"a",24),e(97,"here"),t(),e(98,"."),t(),n(99,"app-copy-button")(100,"pre")(101,"code",19),e(102,`
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.MQTT,
        options: {
          url: 'mqtt://localhost:1883',
        }
      },
    ]),
  ]
  ...
})
`),t()()(),n(103,"p"),e(104,"Other options to create a client (either "),n(105,"code"),e(106,"ClientProxyFactory"),t(),e(107," or "),n(108,"code"),e(109,"@Client()"),t(),e(110,") can be used as well. You can read about them "),n(111,"a",24),e(112,"here"),t(),e(113,"."),t(),n(114,"h4",25)(115,"span"),e(116,"Context"),t()(),n(117,"p"),e(118,"In more complex scenarios, you may need to access additional information about the incoming request. When using the MQTT transporter, you can access the "),n(119,"code"),e(120,"MqttContext"),t(),e(121," object."),t(),n(122,"app-copy-button",17)(123,"span",18),r(124,"app-tabs",null,2),t(),n(126,"pre")(127,"code",19),e(128,`
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  console.log(\`Topic: \${context.getTopic()}\`);
}
`),t()(),n(129,"pre")(130,"code",19),e(131,`
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(\`Topic: \${context.getTopic()}\`);
}
`),t()()(),n(132,"blockquote",20)(133,"strong"),e(134,"Hint"),t(),n(135,"code"),e(136,"@Payload()"),t(),e(137,", "),n(138,"code"),e(139,"@Ctx()"),t(),e(140," and "),n(141,"code"),e(142,"MqttContext"),t(),e(143," are imported from the "),n(144,"code"),e(145,"@nestjs/microservices"),t(),e(146,` package.
`),t(),n(147,"p"),e(148,"To access the original mqtt "),n(149,"a",26),e(150,"packet"),t(),e(151,", use the "),n(152,"code"),e(153,"getPacket()"),t(),e(154," method of the "),n(155,"code"),e(156,"MqttContext"),t(),e(157," object, as follows:"),t(),n(158,"app-copy-button",17)(159,"span",18),r(160,"app-tabs",null,3),t(),n(162,"pre")(163,"code",19),e(164,`
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  console.log(context.getPacket());
}
`),t()(),n(165,"pre")(166,"code",19),e(167,`
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getPacket());
}
`),t()()(),n(168,"h4",27)(169,"span"),e(170,"Wildcards"),t()(),n(171,"p"),e(172,"A subscription may be to an explicit topic, or it may include wildcards. Two wildcards are available, "),n(173,"code"),e(174,"+"),t(),e(175," and "),n(176,"code"),e(177,"#"),t(),e(178,". "),n(179,"code"),e(180,"+"),t(),e(181," is a single-level wildcard, while "),n(182,"code"),e(183,"#"),t(),e(184," is a multi-level wildcard which covers many topic levels."),t(),n(185,"app-copy-button",17)(186,"span",18),r(187,"app-tabs",null,4),t(),n(189,"pre")(190,"code",19),e(191,`
@MessagePattern('sensors/+/temperature/+')
getTemperature(@Ctx() context: MqttContext) {
  console.log(\`Topic: \${context.getTopic()}\`);
}
`),t()(),n(192,"pre")(193,"code",19),e(194,`
@Bind(Ctx())
@MessagePattern('sensors/+/temperature/+')
getTemperature(context) {
  console.log(\`Topic: \${context.getTopic()}\`);
}
`),t()()(),n(195,"h4",28)(196,"span"),e(197,"Quality of Service (QoS)"),t()(),n(198,"p"),e(199,"Any subscription created with "),n(200,"code"),e(201,"@MessagePattern"),t(),e(202," or "),n(203,"code"),e(204,"@EventPattern"),t(),e(205," decorators will subscribe with QoS 0. If a higher QoS is required, it can be set globally using the "),n(206,"code"),e(207,"subscribeOptions"),t(),e(208," block when establishing the connection as follows:"),t(),n(209,"app-copy-button",17)(210,"span",18),e(211),p(212,"extension"),r(213,"app-tabs",null,5),t(),n(215,"pre")(216,"code",19),e(217,`
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
    subscribeOptions: {
      qos: 2
    },
  },
});
`),t()(),n(218,"pre")(219,"code",19),e(220,`
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.MQTT,
  options: {
    url: 'mqtt://localhost:1883',
    subscribeOptions: {
      qos: 2
    },
  },
});
`),t()()(),n(221,"h4",29)(222,"span"),e(223,"Per-pattern QoS"),t()(),n(224,"p"),e(225,"You can override the MQTT subscription QoS on a per-pattern basis by providing "),n(226,"code"),e(227,"qos"),t(),e(228," in the "),n(229,"code"),e(230,"extras"),t(),e(231," field of the pattern decorator. When not specified, the global "),n(232,"code"),e(233,"subscribeOptions.qos"),t(),e(234," is used as the default."),t(),n(235,"app-copy-button",17)(236,"span",18),r(237,"app-tabs",null,6),t(),n(239,"pre")(240,"code",19),e(241,`
@EventPattern('critical-events', { extras: { qos: 2 } })
handleCriticalEvent(@Payload() data: any) {
  // This subscription uses QoS 2
}

@EventPattern('metrics', { extras: { qos: 0 } })
handleMetrics(@Payload() data: any) {
  // This subscription uses QoS 0
}
`),t()(),n(242,"pre")(243,"code",19),e(244,`
@Bind(Payload())
@EventPattern('critical-events', { extras: { qos: 2 } })
handleCriticalEvent(data) {
  // This subscription uses QoS 2
}

@Bind(Payload())
@EventPattern('metrics', { extras: { qos: 0 } })
handleMetrics(data) {
  // This subscription uses QoS 0
}
`),t()()(),n(245,"blockquote",20)(246,"strong"),e(247,"Hint"),t(),e(248," Per-pattern QoS configuration does not affect existing behavior. When "),n(249,"code"),e(250,"extras.qos"),t(),e(251," is not specified, the subscription uses the global "),n(252,"code"),e(253,"subscribeOptions.qos"),t(),e(254,` value.
`),t(),n(255,"h4",30)(256,"span"),e(257,"Record builders"),t()(),n(258,"p"),e(259,"To configure message options (adjust the QoS level, set the Retain or DUP flags, or add additional properties to the payload), you can use the "),n(260,"code"),e(261,"MqttRecordBuilder"),t(),e(262," class. For example, to set "),n(263,"code"),e(264,"QoS"),t(),e(265," to "),n(266,"code"),e(267,"2"),t(),e(268," use the "),n(269,"code"),e(270,"setQoS"),t(),e(271," method, as follows:"),t(),n(272,"app-copy-button")(273,"pre")(274,"code",19),e(275,`
const userProperties = { 'x-version': '1.0.0' };
const record = new MqttRecordBuilder(':cat:')
  .setProperties({ userProperties })
  .setQoS(1)
  .build();
client.send('replace-emoji', record).subscribe(...);
`),t()()(),n(276,"blockquote",20)(277,"strong"),e(278,"Hint"),t(),n(279,"code"),e(280,"MqttRecordBuilder"),t(),e(281," class is exported from the "),n(282,"code"),e(283,"@nestjs/microservices"),t(),e(284,` package.
`),t(),n(285,"p"),e(286,"And you can read these options on the server-side as well, by accessing the "),n(287,"code"),e(288,"MqttContext"),t(),e(289,"."),t(),n(290,"app-copy-button",17)(291,"span",18),r(292,"app-tabs",null,7),t(),n(294,"pre")(295,"code",19),e(296,`
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: MqttContext): string {
  const { properties: { userProperties } } = context.getPacket();
  return userProperties['x-version'] === '1.0.0' ? '\u{1F431}' : '\u{1F408}';
}
`),t()(),n(297,"pre")(298,"code",19),e(299,`
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const { properties: { userProperties } } = context.getPacket();
  return userProperties['x-version'] === '1.0.0' ? '\u{1F431}' : '\u{1F408}';
}
`),t()()(),n(300,"p"),e(301,"In some cases you might want to configure user properties for multiple requests, you can pass these options to the "),n(302,"code"),e(303,"ClientProxyFactory"),t(),e(304,"."),t(),n(305,"app-copy-button")(306,"pre")(307,"code",19),e(308,`
import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: 'API_v1',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.MQTT,
          options: {
            url: 'mqtt://localhost:1833',
            userProperties: { 'x-version': '1.0.0' },
          },
        }),
    },
  ],
})
export class ApiModule {}
`),t()()(),n(309,"h4",31)(310,"span"),e(311,"Instance status updates"),t()(),n(312,"p"),e(313,"To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the "),n(314,"code"),e(315,"status"),t(),e(316," stream. This stream provides status updates specific to the chosen driver. For the MQTT driver, the "),n(317,"code"),e(318,"status"),t(),e(319," stream emits "),n(320,"code"),e(321,"connected"),t(),e(322,", "),n(323,"code"),e(324,"disconnected"),t(),e(325,", "),n(326,"code"),e(327,"reconnecting"),t(),e(328,", and "),n(329,"code"),e(330,"closed"),t(),e(331," events."),t(),n(332,"app-copy-button")(333,"pre")(334,"code",19),e(335,`
this.client.status.subscribe((status: MqttStatus) => {
  console.log(status);
});
`),t()()(),n(336,"blockquote",20)(337,"strong"),e(338,"Hint"),t(),e(339," The "),n(340,"code"),e(341,"MqttStatus"),t(),e(342," type is imported from the "),n(343,"code"),e(344,"@nestjs/microservices"),t(),e(345,` package.
`),t(),n(346,"p"),e(347,"Similarly, you can subscribe to the server's "),n(348,"code"),e(349,"status"),t(),e(350," stream to receive notifications about the server's status."),t(),n(351,"app-copy-button")(352,"pre")(353,"code",19),e(354,`
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: MqttStatus) => {
  console.log(status);
});
`),t()()(),n(355,"h4",32)(356,"span"),e(357,"Listening to MQTT events"),t()(),n(358,"p"),e(359,"In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the "),n(360,"code"),e(361,"error"),t(),e(362," event to trigger additional operations when an error occurs. To do this, use the "),n(363,"code"),e(364,"on()"),t(),e(365," method, as shown below:"),t(),n(366,"app-copy-button")(367,"pre")(368,"code",19),e(369,`
this.client.on('error', (err) => {
  console.error(err);
});
`),t()()(),n(370,"p"),e(371,"Similarly, you can listen to the server's internal events:"),t(),n(372,"app-copy-button")(373,"pre")(374,"code",19),e(375,`
server.on<MqttEvents>('error', (err) => {
  console.error(err);
});
`),t()()(),n(376,"blockquote",20)(377,"strong"),e(378,"Hint"),t(),e(379," The "),n(380,"code"),e(381,"MqttEvents"),t(),e(382," type is imported from the "),n(383,"code"),e(384,"@nestjs/microservices"),t(),e(385,` package.
`),t(),n(386,"h4",33)(387,"span"),e(388,"Underlying driver access"),t()(),n(389,"p"),e(390,"For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you "),n(391,"strong"),e(392,"shouldn't need"),t(),e(393," to access the driver directly."),t(),n(394,"p"),e(395,"To do so, you can use the "),n(396,"code"),e(397,"unwrap()"),t(),e(398," method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect."),t(),n(399,"app-copy-button")(400,"pre")(401,"code",19),e(402,`
const mqttClient = this.client.unwrap<import('mqtt').MqttClient>();
`),t()()(),n(403,"p"),e(404,"Similarly, you can access the server's underlying driver instance:"),t(),n(405,"app-copy-button")(406,"pre")(407,"code",19),e(408,`
const mqttClient = server.unwrap<import('mqtt').MqttClient>();
`),t()()()()),c&2){let d=o(35),u=o(125),w=o(161),T=o(188),k=o(214),P=o(238),R=o(293);i(32),m(" ",x(33,30,"main",d.isJsActive),`
`),i(4),a("hide",d.isJsActive),i(3),a("hide",!d.isJsActive),i(87),a("hide",u.isJsActive),i(3),a("hide",!u.isJsActive),i(33),a("hide",w.isJsActive),i(3),a("hide",!w.isJsActive),i(24),a("hide",T.isJsActive),i(3),a("hide",!T.isJsActive),i(19),m(" ",x(212,33,"main",k.isJsActive),`
`),i(4),a("hide",k.isJsActive),i(3),a("hide",!k.isJsActive),i(21),a("hide",P.isJsActive),i(3),a("hide",!P.isJsActive),i(52),a("hide",R.isJsActive),i(3),a("hide",!R.isJsActive)}},dependencies:[y,b,v,C],encapsulation:2,changeDetection:0})}return s})();var U=(()=>{class s extends E{static \u0275fac=(()=>{let l;return function(h){return(l||(l=S(s)))(h||s)}})();static \u0275cmp=f({type:s,selectors:[["app-nats"]],features:[g],decls:395,vars:24,consts:[["contentReference",""],["app29363122de3f00b0a8c566ab0185ab25a2b78bc3",""],["app4fb939f8419ff673e9ae93cb52dbf968b783255e",""],["app327141573fe610bf4bea8742024c7cac25378467",""],["app6c5f727c01793c16832d7bc5c75865f40b395d80",""],["apped016c420337eaf2e032786000fb2bd6db0cfe38",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/microservices/nats.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","nats"],["rel","nofollow","target","_blank","href","https://nats.io"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","overview"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","options"],["rel","nofollow","target","_blank","href","https://github.com/nats-io/node-nats#connection-options"],["href","https://docs.nestjs.com/microservices/nats#queue-groups"],["appAnchor","","id","client"],["href","https://docs.nestjs.com/microservices/basics#client"],["appAnchor","","id","request-response"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/microservices/basics#request-response"],["rel","nofollow","target","_blank","href","https://docs.nats.io/nats-concepts/reqreply"],["appAnchor","","id","event-based"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/microservices/basics#event-based"],["rel","nofollow","target","_blank","href","https://docs.nats.io/nats-concepts/pubsub"],["appAnchor","","id","queue-groups"],["rel","nofollow","target","_blank","href","https://docs.nats.io/nats-concepts/queue"],["appAnchor","","id","context"],["appAnchor","","id","wildcards"],["appAnchor","","id","record-builders"],["appAnchor","","id","instance-status-updates"],["appAnchor","","id","listening-to-nats-events"],["appAnchor","","id","underlying-driver-access"]],template:function(c,h){if(c&1&&(n(0,"div",6,0)(2,"div",7)(3,"a",8),r(4,"i",9),t()(),n(5,"h3",10),e(6,"NATS"),t(),n(7,"p")(8,"a",11),e(9,"NATS"),t(),e(10," is a simple, secure and high performance open source messaging system for cloud native applications, IoT messaging, and microservices architectures. The NATS server is written in the Go programming language, but client libraries to interact with the server are available for dozens of major programming languages. NATS supports both "),n(11,"strong"),e(12,"At Most Once"),t(),e(13," and "),n(14,"strong"),e(15,"At Least Once"),t(),e(16," delivery. It can run anywhere, from large servers and cloud instances, through edge gateways and even Internet of Things devices."),t(),n(17,"h4",12)(18,"span"),e(19,"Installation"),t()(),n(20,"p"),e(21,"To start building NATS-based microservices, first install the required package:"),t(),n(22,"pre")(23,"code",13),e(24,`
$ npm i --save nats
`),t()(),n(25,"h4",14)(26,"span"),e(27,"Overview"),t()(),n(28,"p"),e(29,"To use the NATS transporter, pass the following options object to the "),n(30,"code"),e(31,"createMicroservice()"),t(),e(32," method:"),t(),n(33,"app-copy-button",15)(34,"span",16),e(35),p(36,"extension"),r(37,"app-tabs",null,1),t(),n(39,"pre")(40,"code",17),e(41,`
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
  },
});
`),t()(),n(42,"pre")(43,"code",17),e(44,`
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
  },
});
`),t()()(),n(45,"blockquote",18)(46,"strong"),e(47,"Hint"),t(),e(48," The "),n(49,"code"),e(50,"Transport"),t(),e(51," enum is imported from the "),n(52,"code"),e(53,"@nestjs/microservices"),t(),e(54,` package.
`),t(),n(55,"h4",19)(56,"span"),e(57,"Options"),t()(),n(58,"p"),e(59,"The "),n(60,"code"),e(61,"options"),t(),e(62," object is specific to the chosen transporter. The "),n(63,"strong"),e(64,"NATS"),t(),e(65," transporter exposes the properties described "),n(66,"a",20),e(67,"here"),t(),e(68," as well as the following properties:"),t(),n(69,"table")(70,"tr")(71,"td")(72,"code"),e(73,"queue"),t()(),n(74,"td"),e(75,"Queue that your server should subscribe to (leave "),n(76,"code"),e(77,"undefined"),t(),e(78," to ignore this setting). Read more about NATS queue groups "),n(79,"a",21),e(80,"below"),t(),e(81,". "),t()(),n(82,"tr")(83,"td")(84,"code"),e(85,"gracefulShutdown"),t()(),n(86,"td"),e(87,"Enables graceful shutdown. When enabled, the server first unsubscribes from all channels before closing the connection. Default is "),n(88,"code"),e(89,"false"),t(),e(90,". "),t()(),n(91,"tr")(92,"td")(93,"code"),e(94,"gracePeriod"),t()(),n(95,"td"),e(96,"Time in milliseconds to wait for the server after unsubscribing from all channels. Default is "),n(97,"code"),e(98,"10000"),t(),e(99," ms. "),t()()(),n(100,"h4",22)(101,"span"),e(102,"Client"),t()(),n(103,"p"),e(104,"Like other microservice transporters, you have "),n(105,"a",23),e(106,"several options"),t(),e(107," for creating a NATS "),n(108,"code"),e(109,"ClientProxy"),t(),e(110," instance."),t(),n(111,"p"),e(112,"One method for creating an instance is to use the "),n(113,"code"),e(114,"ClientsModule"),t(),e(115,". To create a client instance with the "),n(116,"code"),e(117,"ClientsModule"),t(),e(118,", import it and use the "),n(119,"code"),e(120,"register()"),t(),e(121," method to pass an options object with the same properties shown above in the "),n(122,"code"),e(123,"createMicroservice()"),t(),e(124," method, as well as a "),n(125,"code"),e(126,"name"),t(),e(127," property to be used as the injection token. Read more about "),n(128,"code"),e(129,"ClientsModule"),t(),n(130,"a",23),e(131,"here"),t(),e(132,"."),t(),n(133,"app-copy-button")(134,"pre")(135,"code",17),e(136,`
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: ['nats://localhost:4222'],
        }
      },
    ]),
  ]
  ...
})
`),t()()(),n(137,"p"),e(138,"Other options to create a client (either "),n(139,"code"),e(140,"ClientProxyFactory"),t(),e(141," or "),n(142,"code"),e(143,"@Client()"),t(),e(144,") can be used as well. You can read about them "),n(145,"a",23),e(146,"here"),t(),e(147,"."),t(),n(148,"h4",24)(149,"span"),e(150,"Request-response"),t()(),n(151,"p"),e(152,"For the "),n(153,"strong"),e(154,"request-response"),t(),e(155," message style ("),n(156,"a",25),e(157,"read more"),t(),e(158,"), the NATS transporter does not use the NATS built-in "),n(159,"a",26),e(160,"Request-Reply"),t(),e(161,' mechanism. Instead, a "request" is published on a given subject using the '),n(162,"code"),e(163,"publish()"),t(),e(164," method with a unique reply subject name, and responders listen on that subject and send responses to the reply subject. Reply subjects are directed back to the requestor dynamically, regardless of location of either party."),t(),n(165,"h4",27)(166,"span"),e(167,"Event-based"),t()(),n(168,"p"),e(169,"For the "),n(170,"strong"),e(171,"event-based"),t(),e(172," message style ("),n(173,"a",28),e(174,"read more"),t(),e(175,"), the NATS transporter uses NATS built-in "),n(176,"a",29),e(177,"Publish-Subscribe"),t(),e(178," mechanism. A publisher sends a message on a subject and any active subscriber listening on that subject receives the message. Subscribers can also register interest in wildcard subjects that work a bit like a regular expression. This one-to-many pattern is sometimes called fan-out."),t(),n(179,"h4",30)(180,"span"),e(181,"Queue groups"),t()(),n(182,"p"),e(183,"NATS provides a built-in load balancing feature called "),n(184,"a",31),e(185,"distributed queues"),t(),e(186,". To create a queue subscription, use the "),n(187,"code"),e(188,"queue"),t(),e(189," property as follows:"),t(),n(190,"app-copy-button",15)(191,"span",16),e(192),p(193,"extension"),r(194,"app-tabs",null,2),t(),n(196,"pre")(197,"code",17),e(198,`
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
    queue: 'cats_queue',
  },
});
`),t()()(),n(199,"h4",32)(200,"span"),e(201,"Context"),t()(),n(202,"p"),e(203,"In more complex scenarios, you may need to access additional information about the incoming request. When using the NATS transporter, you can access the "),n(204,"code"),e(205,"NatsContext"),t(),e(206," object."),t(),n(207,"app-copy-button",15)(208,"span",16),r(209,"app-tabs",null,3),t(),n(211,"pre")(212,"code",17),e(213,`
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(\`Subject: \${context.getSubject()}\`);
}
`),t()(),n(214,"pre")(215,"code",17),e(216,`
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(\`Subject: \${context.getSubject()}\`);
}
`),t()()(),n(217,"blockquote",18)(218,"strong"),e(219,"Hint"),t(),n(220,"code"),e(221,"@Payload()"),t(),e(222,", "),n(223,"code"),e(224,"@Ctx()"),t(),e(225," and "),n(226,"code"),e(227,"NatsContext"),t(),e(228," are imported from the "),n(229,"code"),e(230,"@nestjs/microservices"),t(),e(231,` package.
`),t(),n(232,"h4",33)(233,"span"),e(234,"Wildcards"),t()(),n(235,"p"),e(236,"A subscription may be to an explicit subject, or it may include wildcards."),t(),n(237,"app-copy-button",15)(238,"span",16),r(239,"app-tabs",null,4),t(),n(241,"pre")(242,"code",17),e(243,`
@MessagePattern('time.us.*')
getDate(@Payload() data: number[], @Ctx() context: NatsContext) {
  console.log(\`Subject: \${context.getSubject()}\`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
`),t()(),n(244,"pre")(245,"code",17),e(246,`
@Bind(Payload(), Ctx())
@MessagePattern('time.us.*')
getDate(data, context) {
  console.log(\`Subject: \${context.getSubject()}\`); // e.g. "time.us.east"
  return new Date().toLocaleTimeString(...);
}
`),t()()(),n(247,"h4",34)(248,"span"),e(249,"Record builders"),t()(),n(250,"p"),e(251,"To configure message options, you can use the "),n(252,"code"),e(253,"NatsRecordBuilder"),t(),e(254," class (note: this is doable for event-based flows as well). For example, to add "),n(255,"code"),e(256,"x-version"),t(),e(257," header, use the "),n(258,"code"),e(259,"setHeaders"),t(),e(260," method, as follows:"),t(),n(261,"app-copy-button")(262,"pre")(263,"code",17),e(264,`
import * as nats from 'nats';

// somewhere in your code
const headers = nats.headers();
headers.set('x-version', '1.0.0');

const record = new NatsRecordBuilder(':cat:').setHeaders(headers).build();
this.client.send('replace-emoji', record).subscribe(...);
`),t()()(),n(265,"blockquote",18)(266,"strong"),e(267,"Hint"),t(),n(268,"code"),e(269,"NatsRecordBuilder"),t(),e(270," class is exported from the "),n(271,"code"),e(272,"@nestjs/microservices"),t(),e(273,` package.
`),t(),n(274,"p"),e(275,"And you can read these headers on the server-side as well, by accessing the "),n(276,"code"),e(277,"NatsContext"),t(),e(278,", as follows:"),t(),n(279,"app-copy-button",15)(280,"span",16),r(281,"app-tabs",null,5),t(),n(283,"pre")(284,"code",17),e(285,`
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: NatsContext): string {
  const headers = context.getHeaders();
  return headers['x-version'] === '1.0.0' ? '\u{1F431}' : '\u{1F408}';
}
`),t()(),n(286,"pre")(287,"code",17),e(288,`
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const headers = context.getHeaders();
  return headers['x-version'] === '1.0.0' ? '\u{1F431}' : '\u{1F408}';
}
`),t()()(),n(289,"p"),e(290,"In some cases you might want to configure headers for multiple requests, you can pass these as options to the "),n(291,"code"),e(292,"ClientProxyFactory"),t(),e(293,":"),t(),n(294,"app-copy-button")(295,"pre")(296,"code",17),e(297,`
import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: 'API_v1',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.NATS,
          options: {
            servers: ['nats://localhost:4222'],
            headers: { 'x-version': '1.0.0' },
          },
        }),
    },
  ],
})
export class ApiModule {}
`),t()()(),n(298,"h4",35)(299,"span"),e(300,"Instance status updates"),t()(),n(301,"p"),e(302,"To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the "),n(303,"code"),e(304,"status"),t(),e(305," stream. This stream provides status updates specific to the chosen driver. For the NATS driver, the "),n(306,"code"),e(307,"status"),t(),e(308," stream emits "),n(309,"code"),e(310,"connected"),t(),e(311,", "),n(312,"code"),e(313,"disconnected"),t(),e(314,", and "),n(315,"code"),e(316,"reconnecting"),t(),e(317," events."),t(),n(318,"app-copy-button")(319,"pre")(320,"code",17),e(321,`
this.client.status.subscribe((status: NatsStatus) => {
  console.log(status);
});
`),t()()(),n(322,"blockquote",18)(323,"strong"),e(324,"Hint"),t(),e(325," The "),n(326,"code"),e(327,"NatsStatus"),t(),e(328," type is imported from the "),n(329,"code"),e(330,"@nestjs/microservices"),t(),e(331,` package.
`),t(),n(332,"p"),e(333,"Similarly, you can subscribe to the server's "),n(334,"code"),e(335,"status"),t(),e(336," stream to receive notifications about the server's status."),t(),n(337,"app-copy-button")(338,"pre")(339,"code",17),e(340,`
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: NatsStatus) => {
  console.log(status);
});
`),t()()(),n(341,"h4",36)(342,"span"),e(343,"Listening to Nats events"),t()(),n(344,"p"),e(345,"In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the "),n(346,"code"),e(347,"error"),t(),e(348," event to trigger additional operations when an error occurs. To do this, use the "),n(349,"code"),e(350,"on()"),t(),e(351," method, as shown below:"),t(),n(352,"app-copy-button")(353,"pre")(354,"code",17),e(355,`
this.client.on('error', (err) => {
  console.error(err);
});
`),t()()(),n(356,"p"),e(357,"Similarly, you can listen to the server's internal events:"),t(),n(358,"app-copy-button")(359,"pre")(360,"code",17),e(361,`
server.on<NatsEvents>('error', (err) => {
  console.error(err);
});
`),t()()(),n(362,"blockquote",18)(363,"strong"),e(364,"Hint"),t(),e(365," The "),n(366,"code"),e(367,"NatsEvents"),t(),e(368," type is imported from the "),n(369,"code"),e(370,"@nestjs/microservices"),t(),e(371,` package.
`),t(),n(372,"h4",37)(373,"span"),e(374,"Underlying driver access"),t()(),n(375,"p"),e(376,"For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you "),n(377,"strong"),e(378,"shouldn't need"),t(),e(379," to access the driver directly."),t(),n(380,"p"),e(381,"To do so, you can use the "),n(382,"code"),e(383,"unwrap()"),t(),e(384," method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect."),t(),n(385,"app-copy-button")(386,"pre")(387,"code",17),e(388,`
const natsConnection = this.client.unwrap<import('nats').NatsConnection>();
`),t()()(),n(389,"p"),e(390,"Similarly, you can access the server's underlying driver instance:"),t(),n(391,"app-copy-button")(392,"pre")(393,"code",17),e(394,`
const natsConnection = server.unwrap<import('nats').NatsConnection>();
`),t()()()()),c&2){let d=o(38),u=o(195),w=o(210),T=o(240),k=o(282);i(35),m(" ",x(36,18,"main",d.isJsActive),`
`),i(4),a("hide",d.isJsActive),i(3),a("hide",!d.isJsActive),i(150),m(" ",x(193,21,"main",u.isJsActive),`
`),i(19),a("hide",w.isJsActive),i(3),a("hide",!w.isJsActive),i(27),a("hide",T.isJsActive),i(3),a("hide",!T.isJsActive),i(39),a("hide",k.isJsActive),i(3),a("hide",!k.isJsActive)}},dependencies:[y,b,v,C],encapsulation:2,changeDetection:0})}return s})();var z=(()=>{class s extends E{static \u0275fac=(()=>{let l;return function(h){return(l||(l=S(s)))(h||s)}})();static \u0275cmp=f({type:s,selectors:[["app-pipes"]],features:[g],decls:46,vars:4,consts:[["contentReference",""],["app8526c852a399fc896aa81a6fa49c79b8d7bb5597",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/microservices/pipes.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","pipes"],["routerLink","/pipes"],[1,"info"],["appAnchor","","id","binding-pipes"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"]],template:function(c,h){if(c&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),r(4,"i",5),t()(),n(5,"h3",6),e(6,"Pipes"),t(),n(7,"p"),e(8,"There is no fundamental difference between "),n(9,"a",7),e(10,"regular pipes"),t(),e(11," and microservices pipes. The only difference is that instead of throwing "),n(12,"code"),e(13,"HttpException"),t(),e(14,", you should use "),n(15,"code"),e(16,"RpcException"),t(),e(17,"."),t(),n(18,"blockquote",8)(19,"strong"),e(20,"Hint"),t(),e(21," The "),n(22,"code"),e(23,"RpcException"),t(),e(24," class is exposed from "),n(25,"code"),e(26,"@nestjs/microservices"),t(),e(27,` package.
`),t(),n(28,"h4",9)(29,"span"),e(30,"Binding pipes"),t()(),n(31,"p"),e(32,"The following example uses a manually instantiated method-scoped pipe. Just as with HTTP based applications, you can also use controller-scoped pipes (i.e., prefix the controller class with a "),n(33,"code"),e(34,"@UsePipes()"),t(),e(35," decorator)."),t(),n(36,"app-copy-button",10)(37,"span",11),r(38,"app-tabs",null,1),t(),n(40,"pre")(41,"code",12),e(42,`
@UsePipes(new ValidationPipe({ exceptionFactory: (errors) => new RpcException(errors) }))
@MessagePattern({ cmd: 'sum' })
accumulate(data: number[]): number {
  return (data || []).reduce((a, b) => a + b);
}
`),t()(),n(43,"pre")(44,"code",12),e(45,`
@UsePipes(new ValidationPipe({ exceptionFactory: (errors) => new RpcException(errors) }))
@MessagePattern({ cmd: 'sum' })
accumulate(data) {
  return (data || []).reduce((a, b) => a + b);
}
`),t()()()()),c&2){let d=o(39);i(40),a("hide",d.isJsActive),i(3),a("hide",!d.isJsActive)}},dependencies:[M,y,b,v],encapsulation:2,changeDetection:0})}return s})();var $=(()=>{class s extends E{static \u0275fac=(()=>{let l;return function(h){return(l||(l=S(s)))(h||s)}})();static \u0275cmp=f({type:s,selectors:[["app-rabbitmq"]],features:[g],decls:558,vars:28,consts:[["contentReference",""],["app237e377b0505e54cb52c096830632371a4a96c98",""],["appfff2b2b7e430eea8054d81bf88e54243bf4fbba4",""],["appa9ae0b079c5fbf795fb42702dba4b9a02e680149",""],["appbd57b8042364c0bea9c9a9fab07fefafa776c3b4",""],["appd4265f7d1253a98450b1e165e949965672ccecae",""],["appb9cd540ba34aaed438120315203a51bb2d66de84",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/microservices/rabbitmq.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","rabbitmq"],["rel","nofollow","target","_blank","href","https://www.rabbitmq.com/"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","overview"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","options"],["href","https://amqp-node.github.io/amqplib/channel_api.html#channel_consume","rel","nofollow","target","_blank"],["href","https://amqp-node.github.io/amqplib/channel_api.html#channel_assertQueue","rel","nofollow","target","_blank"],["href","https://amqp-node.github.io/amqplib/channel_api.html#connect","rel","nofollow","target","_blank"],["appAnchor","","id","client"],["href","https://docs.nestjs.com/microservices/basics#client"],["appAnchor","","id","context"],["rel","nofollow","target","_blank","href","https://www.rabbitmq.com/channels.html"],["appAnchor","","id","message-acknowledgement"],["rel","nofollow","target","_blank","href","https://www.rabbitmq.com/confirms.html"],["appAnchor","","id","record-builders"],["appAnchor","","id","instance-status-updates"],["appAnchor","","id","listening-to-rabbitmq-events"],["appAnchor","","id","underlying-driver-access"],["appAnchor","","id","wildcards"]],template:function(c,h){if(c&1&&(n(0,"div",7,0)(2,"div",8)(3,"a",9),r(4,"i",10),t()(),n(5,"h3",11),e(6,"RabbitMQ"),t(),n(7,"p")(8,"a",12),e(9,"RabbitMQ"),t(),e(10," is an open-source and lightweight message broker which supports multiple messaging protocols. It can be deployed in distributed and federated configurations to meet high-scale, high-availability requirements. In addition, it's the most widely deployed message broker, used worldwide at small startups and large enterprises."),t(),n(11,"h4",13)(12,"span"),e(13,"Installation"),t()(),n(14,"p"),e(15,"To start building RabbitMQ-based microservices, first install the required packages:"),t(),n(16,"pre")(17,"code",14),e(18,`
$ npm i --save amqplib amqp-connection-manager
`),t()(),n(19,"h4",15)(20,"span"),e(21,"Overview"),t()(),n(22,"p"),e(23,"To use the RabbitMQ transporter, pass the following options object to the "),n(24,"code"),e(25,"createMicroservice()"),t(),e(26," method:"),t(),n(27,"app-copy-button",16)(28,"span",17),e(29),p(30,"extension"),r(31,"app-tabs",null,1),t(),n(33,"pre")(34,"code",18),e(35,`
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'cats_queue',
    queueOptions: {
      durable: false
    },
  },
});
`),t()(),n(36,"pre")(37,"code",18),e(38,`
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'cats_queue',
    queueOptions: {
      durable: false
    },
  },
});
`),t()()(),n(39,"blockquote",19)(40,"strong"),e(41,"Hint"),t(),e(42," The "),n(43,"code"),e(44,"Transport"),t(),e(45," enum is imported from the "),n(46,"code"),e(47,"@nestjs/microservices"),t(),e(48,` package.
`),t(),n(49,"h4",20)(50,"span"),e(51,"Options"),t()(),n(52,"p"),e(53,"The "),n(54,"code"),e(55,"options"),t(),e(56," property is specific to the chosen transporter. The "),n(57,"strong"),e(58,"RabbitMQ"),t(),e(59," transporter exposes the properties described below."),t(),n(60,"table")(61,"tr")(62,"td")(63,"code"),e(64,"urls"),t()(),n(65,"td"),e(66,"An array of connection URLs to try in order"),t()(),n(67,"tr")(68,"td")(69,"code"),e(70,"queue"),t()(),n(71,"td"),e(72,"Queue name which your server will listen to"),t()(),n(73,"tr")(74,"td")(75,"code"),e(76,"prefetchCount"),t()(),n(77,"td"),e(78,"Sets the prefetch count for the channel"),t()(),n(79,"tr")(80,"td")(81,"code"),e(82,"isGlobalPrefetchCount"),t()(),n(83,"td"),e(84,"Enables per channel prefetching"),t()(),n(85,"tr")(86,"td")(87,"code"),e(88,"noAck"),t()(),n(89,"td"),e(90,"If "),n(91,"code"),e(92,"false"),t(),e(93,", manual acknowledgment mode enabled"),t()(),n(94,"tr")(95,"td")(96,"code"),e(97,"consumerTag"),t()(),n(98,"td"),e(99,"A name which the server will use to distinguish message deliveries for the consumer; mustn\u2019t be already in use on the channel. It\u2019s usually easier to omit this, in which case the server will create a random name and supply it in the reply. Consumer Tag Identifier (read more "),n(100,"a",21),e(101,"here"),t(),e(102,")"),t()(),n(103,"tr")(104,"td")(105,"code"),e(106,"queueOptions"),t()(),n(107,"td"),e(108,"Additional queue options (read more "),n(109,"a",22),e(110,"here"),t(),e(111,")"),t()(),n(112,"tr")(113,"td")(114,"code"),e(115,"socketOptions"),t()(),n(116,"td"),e(117,"Additional socket options (read more "),n(118,"a",23),e(119,"here"),t(),e(120,")"),t()(),n(121,"tr")(122,"td")(123,"code"),e(124,"headers"),t()(),n(125,"td"),e(126,"Headers to be sent along with every message"),t()(),n(127,"tr")(128,"td")(129,"code"),e(130,"replyQueue"),t()(),n(131,"td"),e(132,"Reply queue for the producer. Default is "),n(133,"code"),e(134,"amq.rabbitmq.reply-to"),t()()(),n(135,"tr")(136,"td")(137,"code"),e(138,"persistent"),t()(),n(139,"td"),e(140,"If truthy, the message will survive broker restarts provided it\u2019s in a queue that also survives restarts"),t()(),n(141,"tr")(142,"td")(143,"code"),e(144,"noAssert"),t()(),n(145,"td"),e(146,"When false, a queue will not be asserted before consuming"),t()(),n(147,"tr")(148,"td")(149,"code"),e(150,"wildcards"),t()(),n(151,"td"),e(152,"Set to true only if you want to use Topic Exchange for routing messages to queues. Enabling this will allow you to use wildcards (*, #) as message and event patterns"),t()(),n(153,"tr")(154,"td")(155,"code"),e(156,"exchange"),t()(),n(157,"td"),e(158,'Name for the exchange. Defaults to the queue name when "wildcards" is set to true'),t()(),n(159,"tr")(160,"td")(161,"code"),e(162,"exchangeType"),t()(),n(163,"td"),e(164,"Type of the exchange. Default is "),n(165,"code"),e(166,"topic"),t(),e(167,". Valid values are "),n(168,"code"),e(169,"direct"),t(),e(170,", "),n(171,"code"),e(172,"fanout"),t(),e(173,", "),n(174,"code"),e(175,"topic"),t(),e(176,", and "),n(177,"code"),e(178,"headers"),t()()(),n(179,"tr")(180,"td")(181,"code"),e(182,"routingKey"),t()(),n(183,"td"),e(184,"Additional routing key for the topic exchange"),t()(),n(185,"tr")(186,"td")(187,"code"),e(188,"maxConnectionAttempts"),t()(),n(189,"td"),e(190,"Maximum number of connection attempts. Applies only to the consumer configuration. -1 === infinite"),t()()(),n(191,"h4",24)(192,"span"),e(193,"Client"),t()(),n(194,"p"),e(195,"Like other microservice transporters, you have "),n(196,"a",25),e(197,"several options"),t(),e(198," for creating a RabbitMQ "),n(199,"code"),e(200,"ClientProxy"),t(),e(201," instance."),t(),n(202,"p"),e(203,"One method for creating an instance is to use the "),n(204,"code"),e(205,"ClientsModule"),t(),e(206,". To create a client instance with the "),n(207,"code"),e(208,"ClientsModule"),t(),e(209,", import it and use the "),n(210,"code"),e(211,"register()"),t(),e(212," method to pass an options object with the same properties shown above in the "),n(213,"code"),e(214,"createMicroservice()"),t(),e(215," method, as well as a "),n(216,"code"),e(217,"name"),t(),e(218," property to be used as the injection token. Read more about "),n(219,"code"),e(220,"ClientsModule"),t(),n(221,"a",25),e(222,"here"),t(),e(223,"."),t(),n(224,"app-copy-button")(225,"pre")(226,"code",18),e(227,`
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'cats_queue',
          queueOptions: {
            durable: false
          },
        },
      },
    ]),
  ]
  ...
})
`),t()()(),n(228,"p"),e(229,"Other options to create a client (either "),n(230,"code"),e(231,"ClientProxyFactory"),t(),e(232," or "),n(233,"code"),e(234,"@Client()"),t(),e(235,") can be used as well. You can read about them "),n(236,"a",25),e(237,"here"),t(),e(238,"."),t(),n(239,"h4",26)(240,"span"),e(241,"Context"),t()(),n(242,"p"),e(243,"In more complex scenarios, you may need to access additional information about the incoming request. When using the RabbitMQ transporter, you can access the "),n(244,"code"),e(245,"RmqContext"),t(),e(246," object."),t(),n(247,"app-copy-button",16)(248,"span",17),r(249,"app-tabs",null,2),t(),n(251,"pre")(252,"code",18),e(253,`
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(\`Pattern: \${context.getPattern()}\`);
}
`),t()(),n(254,"pre")(255,"code",18),e(256,`
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(\`Pattern: \${context.getPattern()}\`);
}
`),t()()(),n(257,"blockquote",19)(258,"strong"),e(259,"Hint"),t(),n(260,"code"),e(261,"@Payload()"),t(),e(262,", "),n(263,"code"),e(264,"@Ctx()"),t(),e(265," and "),n(266,"code"),e(267,"RmqContext"),t(),e(268," are imported from the "),n(269,"code"),e(270,"@nestjs/microservices"),t(),e(271,` package.
`),t(),n(272,"p"),e(273,"To access the original RabbitMQ message (with the "),n(274,"code"),e(275,"properties"),t(),e(276,", "),n(277,"code"),e(278,"fields"),t(),e(279,", and "),n(280,"code"),e(281,"content"),t(),e(282,"), use the "),n(283,"code"),e(284,"getMessage()"),t(),e(285," method of the "),n(286,"code"),e(287,"RmqContext"),t(),e(288," object, as follows:"),t(),n(289,"app-copy-button",16)(290,"span",17),r(291,"app-tabs",null,3),t(),n(293,"pre")(294,"code",18),e(295,`
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(context.getMessage());
}
`),t()(),n(296,"pre")(297,"code",18),e(298,`
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getMessage());
}
`),t()()(),n(299,"p"),e(300,"To retrieve a reference to the RabbitMQ "),n(301,"a",27),e(302,"channel"),t(),e(303,", use the "),n(304,"code"),e(305,"getChannelRef"),t(),e(306," method of the "),n(307,"code"),e(308,"RmqContext"),t(),e(309," object, as follows:"),t(),n(310,"app-copy-button",16)(311,"span",17),r(312,"app-tabs",null,4),t(),n(314,"pre")(315,"code",18),e(316,`
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  console.log(context.getChannelRef());
}
`),t()(),n(317,"pre")(318,"code",18),e(319,`
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(context.getChannelRef());
}
`),t()()(),n(320,"h4",28)(321,"span"),e(322,"Message acknowledgement"),t()(),n(323,"p"),e(324,"To make sure a message is never lost, RabbitMQ supports "),n(325,"a",29),e(326,"message acknowledgements"),t(),e(327,". An acknowledgement is sent back by the consumer to tell RabbitMQ that a particular message has been received, processed and that RabbitMQ is free to delete it. If a consumer dies (its channel is closed, connection is closed, or TCP connection is lost) without sending an ack, RabbitMQ will understand that a message wasn't processed fully and will re-queue it."),t(),n(328,"p"),e(329,"To enable manual acknowledgment mode, set the "),n(330,"code"),e(331,"noAck"),t(),e(332," property to "),n(333,"code"),e(334,"false"),t(),e(335,":"),t(),n(336,"app-copy-button")(337,"pre")(338,"code",18),e(339,`
options: {
  urls: ['amqp://localhost:5672'],
  queue: 'cats_queue',
  noAck: false,
  queueOptions: {
    durable: false
  },
},
`),t()()(),n(340,"p"),e(341,"When manual consumer acknowledgements are turned on, we must send a proper acknowledgement from the worker to signal that we are done with a task."),t(),n(342,"app-copy-button",16)(343,"span",17),r(344,"app-tabs",null,5),t(),n(346,"pre")(347,"code",18),e(348,`
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RmqContext) {
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();

  channel.ack(originalMsg);
}
`),t()(),n(349,"pre")(350,"code",18),e(351,`
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  const channel = context.getChannelRef();
  const originalMsg = context.getMessage();

  channel.ack(originalMsg);
}
`),t()()(),n(352,"h4",30)(353,"span"),e(354,"Record builders"),t()(),n(355,"p"),e(356,"To configure message options, you can use the "),n(357,"code"),e(358,"RmqRecordBuilder"),t(),e(359," class (note: this is doable for event-based flows as well). For example, to set "),n(360,"code"),e(361,"headers"),t(),e(362," and "),n(363,"code"),e(364,"priority"),t(),e(365," properties, use the "),n(366,"code"),e(367,"setOptions"),t(),e(368," method, as follows:"),t(),n(369,"app-copy-button")(370,"pre")(371,"code",18),e(372,`
const message = ':cat:';
const record = new RmqRecordBuilder(message)
  .setOptions({
    headers: {
      ['x-version']: '1.0.0',
    },
    priority: 3,
  })
  .build();

this.client.send('replace-emoji', record).subscribe(...);
`),t()()(),n(373,"blockquote",19)(374,"strong"),e(375,"Hint"),t(),n(376,"code"),e(377,"RmqRecordBuilder"),t(),e(378," class is exported from the "),n(379,"code"),e(380,"@nestjs/microservices"),t(),e(381,` package.
`),t(),n(382,"p"),e(383,"And you can read these values on the server-side as well, by accessing the "),n(384,"code"),e(385,"RmqContext"),t(),e(386,", as follows:"),t(),n(387,"app-copy-button",16)(388,"span",17),r(389,"app-tabs",null,6),t(),n(391,"pre")(392,"code",18),e(393,`
@MessagePattern('replace-emoji')
replaceEmoji(@Payload() data: string, @Ctx() context: RmqContext): string {
  const { properties: { headers } } = context.getMessage();
  return headers['x-version'] === '1.0.0' ? '\u{1F431}' : '\u{1F408}';
}
`),t()(),n(394,"pre")(395,"code",18),e(396,`
@Bind(Payload(), Ctx())
@MessagePattern('replace-emoji')
replaceEmoji(data, context) {
  const { properties: { headers } } = context.getMessage();
  return headers['x-version'] === '1.0.0' ? '\u{1F431}' : '\u{1F408}';
}
`),t()()(),n(397,"h4",31)(398,"span"),e(399,"Instance status updates"),t()(),n(400,"p"),e(401,"To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the "),n(402,"code"),e(403,"status"),t(),e(404," stream. This stream provides status updates specific to the chosen driver. For the RMQ driver, the "),n(405,"code"),e(406,"status"),t(),e(407," stream emits "),n(408,"code"),e(409,"connected"),t(),e(410," and "),n(411,"code"),e(412,"disconnected"),t(),e(413," events."),t(),n(414,"app-copy-button")(415,"pre")(416,"code",18),e(417,`
this.client.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
`),t()()(),n(418,"blockquote",19)(419,"strong"),e(420,"Hint"),t(),e(421," The "),n(422,"code"),e(423,"RmqStatus"),t(),e(424," type is imported from the "),n(425,"code"),e(426,"@nestjs/microservices"),t(),e(427,` package.
`),t(),n(428,"p"),e(429,"Similarly, you can subscribe to the server's "),n(430,"code"),e(431,"status"),t(),e(432," stream to receive notifications about the server's status."),t(),n(433,"app-copy-button")(434,"pre")(435,"code",18),e(436,`
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: RmqStatus) => {
  console.log(status);
});
`),t()()(),n(437,"h4",32)(438,"span"),e(439,"Listening to RabbitMQ events"),t()(),n(440,"p"),e(441,"In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the "),n(442,"code"),e(443,"error"),t(),e(444," event to trigger additional operations when an error occurs. To do this, use the "),n(445,"code"),e(446,"on()"),t(),e(447," method, as shown below:"),t(),n(448,"app-copy-button")(449,"pre")(450,"code",18),e(451,`
this.client.on('error', (err) => {
  console.error(err);
});
`),t()()(),n(452,"p"),e(453,"Similarly, you can listen to the server's internal events:"),t(),n(454,"app-copy-button")(455,"pre")(456,"code",18),e(457,`
server.on<RmqEvents>('error', (err) => {
  console.error(err);
});
`),t()()(),n(458,"blockquote",19)(459,"strong"),e(460,"Hint"),t(),e(461," The "),n(462,"code"),e(463,"RmqEvents"),t(),e(464," type is imported from the "),n(465,"code"),e(466,"@nestjs/microservices"),t(),e(467,` package.
`),t(),n(468,"h4",33)(469,"span"),e(470,"Underlying driver access"),t()(),n(471,"p"),e(472,"For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you "),n(473,"strong"),e(474,"shouldn't need"),t(),e(475," to access the driver directly."),t(),n(476,"p"),e(477,"To do so, you can use the "),n(478,"code"),e(479,"unwrap()"),t(),e(480," method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect."),t(),n(481,"app-copy-button")(482,"pre")(483,"code",18),e(484,`
const managerRef =
  this.client.unwrap<import('amqp-connection-manager').AmqpConnectionManager>();
`),t()()(),n(485,"p"),e(486,"Similarly, you can access the server's underlying driver instance:"),t(),n(487,"app-copy-button")(488,"pre")(489,"code",18),e(490,`
const managerRef =
  server.unwrap<import('amqp-connection-manager').AmqpConnectionManager>();
`),t()()(),n(491,"h4",34)(492,"span"),e(493,"Wildcards"),t()(),n(494,"p"),e(495,"RabbitMQ supports the use of wildcards in routing keys to allow for flexible message routing. The "),n(496,"code"),e(497,"#"),t(),e(498," wildcard matches zero or more words, while the "),n(499,"code"),e(500,"*"),t(),e(501," wildcard matches exactly one word."),t(),n(502,"p"),e(503,"For example, the routing key "),n(504,"code"),e(505,"cats.#"),t(),e(506," matches "),n(507,"code"),e(508,"cats"),t(),e(509,", "),n(510,"code"),e(511,"cats.meow"),t(),e(512,", and "),n(513,"code"),e(514,"cats.meow.purr"),t(),e(515,". The routing key "),n(516,"code"),e(517,"cats.*"),t(),e(518," matches "),n(519,"code"),e(520,"cats.meow"),t(),e(521," but not "),n(522,"code"),e(523,"cats.meow.purr"),t(),e(524,"."),t(),n(525,"p"),e(526,"To enable wildcard support in your RabbitMQ microservice, set the "),n(527,"code"),e(528,"wildcards"),t(),e(529," configuration option to "),n(530,"code"),e(531,"true"),t(),e(532," in the options object:"),t(),n(533,"app-copy-button")(534,"pre")(535,"code",18),e(536,`
const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  AppModule,
  {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'cats_queue',
      wildcards: true,
    },
  },
);
`),t()()(),n(537,"p"),e(538,"With this configuration, you can use wildcards in your routing keys when subscribing to events/messages. For example, to listen for messages with the routing key "),n(539,"code"),e(540,"cats.#"),t(),e(541,", you can use the following code:"),t(),n(542,"app-copy-button")(543,"pre")(544,"code",18),e(545,`
@MessagePattern('cats.#')
getCats(@Payload() data: { message: string }, @Ctx() context: RmqContext) {
  console.log(\`Received message with routing key: \${context.getPattern()}\`);

  return {
    message: 'Hello from the cats service!',
  }
}
`),t()()(),n(546,"p"),e(547,"To send a message with a specific routing key, you can use the "),n(548,"code"),e(549,"send()"),t(),e(550," method of the "),n(551,"code"),e(552,"ClientProxy"),t(),e(553," instance:"),t(),n(554,"app-copy-button")(555,"pre")(556,"code",18),e(557,`
this.client.send('cats.meow', { message: 'Meow!' }).subscribe((response) => {
  console.log(response);
});
`),t()()()()),c&2){let d=o(32),u=o(250),w=o(292),T=o(313),k=o(345),P=o(390);i(29),m(" ",x(30,25,"main",d.isJsActive),`
`),i(4),a("hide",d.isJsActive),i(3),a("hide",!d.isJsActive),i(215),a("hide",u.isJsActive),i(3),a("hide",!u.isJsActive),i(39),a("hide",w.isJsActive),i(3),a("hide",!w.isJsActive),i(18),a("hide",T.isJsActive),i(3),a("hide",!T.isJsActive),i(29),a("hide",k.isJsActive),i(3),a("hide",!k.isJsActive),i(42),a("hide",P.isJsActive),i(3),a("hide",!P.isJsActive)}},dependencies:[y,b,v,C],encapsulation:2,changeDetection:0})}return s})();var Y=(()=>{class s extends E{static \u0275fac=(()=>{let l;return function(h){return(l||(l=S(s)))(h||s)}})();static \u0275cmp=f({type:s,selectors:[["app-kafka"]],features:[g],decls:803,vars:80,consts:[["contentReference",""],["appede14fff2f121486c29f97d9cb567dcd9ef9d2ae",""],["app91165960dc2d439326a0dfbd0067a2d1f3e7ad65",""],["appd68f60f880004ebffacd060fd6b499f8628bda64",""],["appbae383d12c5f2532bf5ab9ad137a197e3a3c590d",""],["appdcc4df8c3f212698c95938bd170a6a4cda98b9e8",""],["appc4a9e8e3cb35045df8c3bee29a9c6a145d0cab3a",""],["appe55bfb7d82e2b31e6cbd9354d488756ddbbc9741",""],["appc0975888611cfdf170974472e0aff6edb0f99af6",""],["app51d7aa9205e581612fdd45155fbe75b93444f14e",""],["app4e40d6af6219a28b64ccd1c7e732a1163846d754",""],["appb23d419f565db14d307b069d86def7cef426b9ab",""],["app51e54b976725b965320167bd350e6d4b3aca1d23",""],["app0e25cf30fe8dcf3672cd3c71bdfd9a9eb9b907bd",""],["app93d7b5653b47c21258f8d24804791d682ab2de21",""],["appea06d55a3e5c37360d762cdfcb50c8efa59e435d",""],["app871977bd0fc7230c35cf462e03cb1101ae2f00fb",""],["app5fdaa64a7e9211050824f9176dba7fc77a5a7483",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/microservices/kafka.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","kafka"],["rel","nofollow","target","_blank","href","https://kafka.apache.org/"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","overview"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","options"],["href","https://kafka.js.org/docs/configuration","rel","nofollow","target","blank"],["href","https://kafka.js.org/docs/consuming#a-name-options-a-options","rel","nofollow","target","blank"],["href","https://kafka.js.org/docs/consuming","rel","nofollow","target","blank"],["href","https://kafka.js.org/docs/consuming#frombeginning","rel","nofollow","target","blank"],["href","https://kafka.js.org/docs/producing#options","rel","nofollow","target","blank"],["appAnchor","","id","client"],["href","https://docs.nestjs.com/microservices/basics#client"],["appAnchor","","id","message-pattern"],["rel","nofollow","target","_blank","href","https://www.enterpriseintegrationpatterns.com/patterns/messaging/ReturnAddress.html"],["rel","nofollow","target","_blank","href","https://www.enterpriseintegrationpatterns.com/patterns/messaging/CorrelationIdentifier.html"],["appAnchor","","id","message-response-subscription"],[1,"warning"],["href","/microservices/basics#request-response"],["href","/microservices/basics#event-based"],["appAnchor","","id","incoming"],["appAnchor","","id","outgoing"],["rel","nofollow","target","_blank","href","https://docs.confluent.io/current/ksql/docs/developer-guide/partition-data.html#co-partitioning-requirements"],["appAnchor","","id","event-based"],["href","/microservices/basics#publishing-events"],["appAnchor","","id","context"],["appAnchor","","id","naming-conventions"],["appAnchor","","id","retriable-exceptions"],["id","custom-exception-handling"],["appAnchor","","id","commit-offsets"],["rel","nofollow","target","_blank","href","https://kafka.js.org/docs/consuming#autocommit"],["rel","nofollow","target","_blank","href","https://kafka.js.org/docs/consuming#manual-committing"],["appAnchor","","id","instance-status-updates"],["appAnchor","","id","underlying-producer-and-consumer"]],template:function(c,h){if(c&1&&(n(0,"div",18,0)(2,"div",19)(3,"a",20),r(4,"i",21),t()(),n(5,"h3",22),e(6,"Kafka"),t(),n(7,"p")(8,"a",23),e(9,"Kafka"),t(),e(10," is an open source, distributed streaming platform which has three key capabilities:"),t(),n(11,"ul")(12,"li"),e(13,"Publish and subscribe to streams of records, similar to a message queue or enterprise messaging system."),t(),n(14,"li"),e(15,"Store streams of records in a fault-tolerant durable way."),t(),n(16,"li"),e(17,"Process streams of records as they occur."),t()(),n(18,"p"),e(19,"The Kafka project aims to provide a unified, high-throughput, low-latency platform for handling real-time data feeds. It integrates very well with Apache Storm and Spark for real-time streaming data analysis."),t(),n(20,"h4",24)(21,"span"),e(22,"Installation"),t()(),n(23,"p"),e(24,"To start building Kafka-based microservices, first install the required package:"),t(),n(25,"pre")(26,"code",25),e(27,`
$ npm i --save kafkajs
`),t()(),n(28,"h4",26)(29,"span"),e(30,"Overview"),t()(),n(31,"p"),e(32,"Like other Nest microservice transport layer implementations, you select the Kafka transporter mechanism using the "),n(33,"code"),e(34,"transport"),t(),e(35," property of the options object passed to the "),n(36,"code"),e(37,"createMicroservice()"),t(),e(38," method, along with an optional "),n(39,"code"),e(40,"options"),t(),e(41," property, as shown below:"),t(),n(42,"app-copy-button",27)(43,"span",28),e(44),p(45,"extension"),r(46,"app-tabs",null,1),t(),n(48,"pre")(49,"code",29),e(50,`
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    }
  }
});
`),t()(),n(51,"pre")(52,"code",29),e(53,`
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    }
  }
});
`),t()()(),n(54,"blockquote",30)(55,"strong"),e(56,"Hint"),t(),e(57," The "),n(58,"code"),e(59,"Transport"),t(),e(60," enum is imported from the "),n(61,"code"),e(62,"@nestjs/microservices"),t(),e(63,` package.
`),t(),n(64,"h4",31)(65,"span"),e(66,"Options"),t()(),n(67,"p"),e(68,"The "),n(69,"code"),e(70,"options"),t(),e(71," property is specific to the chosen transporter. The "),n(72,"strong"),e(73,"Kafka"),t(),e(74," transporter exposes the properties described below."),t(),n(75,"table")(76,"tr")(77,"td")(78,"code"),e(79,"client"),t()(),n(80,"td"),e(81,"Client configuration options (read more "),n(82,"a",32),e(83,"here"),t(),e(84,")"),t()(),n(85,"tr")(86,"td")(87,"code"),e(88,"consumer"),t()(),n(89,"td"),e(90,"Consumer configuration options (read more "),n(91,"a",33),e(92,"here"),t(),e(93,")"),t()(),n(94,"tr")(95,"td")(96,"code"),e(97,"run"),t()(),n(98,"td"),e(99,"Run configuration options (read more "),n(100,"a",34),e(101,"here"),t(),e(102,")"),t()(),n(103,"tr")(104,"td")(105,"code"),e(106,"subscribe"),t()(),n(107,"td"),e(108,"Subscribe configuration options (read more "),n(109,"a",35),e(110,"here"),t(),e(111,")"),t()(),n(112,"tr")(113,"td")(114,"code"),e(115,"producer"),t()(),n(116,"td"),e(117,"Producer configuration options (read more "),n(118,"a",36),e(119,"here"),t(),e(120,")"),t()(),n(121,"tr")(122,"td")(123,"code"),e(124,"send"),t()(),n(125,"td"),e(126,"Send configuration options (read more "),n(127,"a",36),e(128,"here"),t(),e(129,")"),t()(),n(130,"tr")(131,"td")(132,"code"),e(133,"producerOnlyMode"),t()(),n(134,"td"),e(135,"Feature flag to skip consumer group registration and only act as a producer ("),n(136,"code"),e(137,"boolean"),t(),e(138,")"),t()(),n(139,"tr")(140,"td")(141,"code"),e(142,"postfixId"),t()(),n(143,"td"),e(144,"Change suffix of clientId value ("),n(145,"code"),e(146,"string"),t(),e(147,")"),t()()(),n(148,"h4",37)(149,"span"),e(150,"Client"),t()(),n(151,"p"),e(152,"There is a small difference in Kafka compared to other microservice transporters. Instead of the "),n(153,"code"),e(154,"ClientProxy"),t(),e(155," class, we use the "),n(156,"code"),e(157,"ClientKafkaProxy"),t(),e(158," class."),t(),n(159,"p"),e(160,"Like other microservice transporters, you have "),n(161,"a",38),e(162,"several options"),t(),e(163," for creating a "),n(164,"code"),e(165,"ClientKafkaProxy"),t(),e(166," instance."),t(),n(167,"p"),e(168,"One method for creating an instance is to use the "),n(169,"code"),e(170,"ClientsModule"),t(),e(171,". To create a client instance with the "),n(172,"code"),e(173,"ClientsModule"),t(),e(174,", import it and use the "),n(175,"code"),e(176,"register()"),t(),e(177," method to pass an options object with the same properties shown above in the "),n(178,"code"),e(179,"createMicroservice()"),t(),e(180," method, as well as a "),n(181,"code"),e(182,"name"),t(),e(183," property to be used as the injection token. Read more about "),n(184,"code"),e(185,"ClientsModule"),t(),n(186,"a",38),e(187,"here"),t(),e(188,"."),t(),n(189,"app-copy-button")(190,"pre")(191,"code",29),e(192,`
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'HERO_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'hero',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'hero-consumer'
          }
        }
      },
    ]),
  ]
  ...
})
`),t()()(),n(193,"p"),e(194,"Other options to create a client (either "),n(195,"code"),e(196,"ClientProxyFactory"),t(),e(197," or "),n(198,"code"),e(199,"@Client()"),t(),e(200,") can be used as well. You can read about them "),n(201,"a",38),e(202,"here"),t(),e(203,"."),t(),n(204,"p"),e(205,"Use the "),n(206,"code"),e(207,"@Client()"),t(),e(208," decorator as follows:"),t(),n(209,"app-copy-button")(210,"pre")(211,"code",29),e(212,`
@Client({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero',
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer'
    }
  }
})
client: ClientKafkaProxy;
`),t()()(),n(213,"h4",39)(214,"span"),e(215,"Message pattern"),t()(),n(216,"p"),e(217,"The Kafka microservice message pattern utilizes two topics for the request and reply channels. The "),n(218,"code"),e(219,"ClientKafkaProxy.send()"),t(),e(220," method sends messages with a "),n(221,"a",40),e(222,"return address"),t(),e(223," by associating a "),n(224,"a",41),e(225,"correlation id"),t(),e(226,", reply topic, and reply partition with the request message. This requires the "),n(227,"code"),e(228,"ClientKafkaProxy"),t(),e(229," instance to be subscribed to the reply topic and assigned to at least one partition before sending a message."),t(),n(230,"p"),e(231,"Subsequently, you need to have at least one reply topic partition for every Nest application running. For example, if you are running 4 Nest applications but the reply topic only has 3 partitions, then 1 of the Nest applications will error out when trying to send a message."),t(),n(232,"p"),e(233,"When new "),n(234,"code"),e(235,"ClientKafkaProxy"),t(),e(236," instances are launched they join the consumer group and subscribe to their respective topics. This process triggers a rebalance of topic partitions assigned to consumers of the consumer group."),t(),n(237,"p"),e(238,"Normally, topic partitions are assigned using the round robin partitioner, which assigns topic partitions to a collection of consumers sorted by consumer names which are randomly set on application launch. However, when a new consumer joins the consumer group, the new consumer can be positioned anywhere within the collection of consumers. This creates a condition where pre-existing consumers can be assigned different partitions when the pre-existing consumer is positioned after the new consumer. As a result, the consumers that are assigned different partitions will lose response messages of requests sent before the rebalance."),t(),n(239,"p"),e(240,"To prevent the "),n(241,"code"),e(242,"ClientKafkaProxy"),t(),e(243," consumers from losing response messages, a Nest-specific built-in custom partitioner is utilized. This custom partitioner assigns partitions to a collection of consumers sorted by high-resolution timestamps ("),n(244,"code"),e(245,"process.hrtime()"),t(),e(246,") that are set on application launch."),t(),n(247,"h4",42)(248,"span"),e(249,"Message response subscription"),t()(),n(250,"blockquote",43)(251,"strong"),e(252,"Note"),t(),e(253," This section is only relevant if you use "),n(254,"a",44),e(255,"request-response"),t(),e(256," message style (with the "),n(257,"code"),e(258,"@MessagePattern"),t(),e(259," decorator and the "),n(260,"code"),e(261,"ClientKafkaProxy.send"),t(),e(262," method). Subscribing to the response topic is not necessary for the "),n(263,"a",45),e(264,"event-based"),t(),e(265," communication ("),n(266,"code"),e(267,"@EventPattern"),t(),e(268," decorator and "),n(269,"code"),e(270,"ClientKafkaProxy.emit"),t(),e(271,` method).
`),t(),n(272,"p"),e(273,"The "),n(274,"code"),e(275,"ClientKafkaProxy"),t(),e(276," class provides the "),n(277,"code"),e(278,"subscribeToResponseOf()"),t(),e(279," method. The "),n(280,"code"),e(281,"subscribeToResponseOf()"),t(),e(282," method takes a request's topic name as an argument and adds the derived reply topic name to a collection of reply topics. This method is required when implementing the message pattern."),t(),n(283,"app-copy-button",27)(284,"span",28),e(285),p(286,"extension"),r(287,"app-tabs",null,2),t(),n(289,"pre")(290,"code",29),e(291,`
onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
}
`),t()()(),n(292,"p"),e(293,"If the "),n(294,"code"),e(295,"ClientKafkaProxy"),t(),e(296," instance is created asynchronously, the "),n(297,"code"),e(298,"subscribeToResponseOf()"),t(),e(299," method must be called before calling the "),n(300,"code"),e(301,"connect()"),t(),e(302," method."),t(),n(303,"app-copy-button",27)(304,"span",28),e(305),p(306,"extension"),r(307,"app-tabs",null,3),t(),n(309,"pre")(310,"code",29),e(311,`
async onModuleInit() {
  this.client.subscribeToResponseOf('hero.kill.dragon');
  await this.client.connect();
}
`),t()()(),n(312,"h4",46)(313,"span"),e(314,"Incoming"),t()(),n(315,"p"),e(316,"Nest receives incoming Kafka messages as an object with "),n(317,"code"),e(318,"key"),t(),e(319,", "),n(320,"code"),e(321,"value"),t(),e(322,", and "),n(323,"code"),e(324,"headers"),t(),e(325," properties that have values of type "),n(326,"code"),e(327,"Buffer"),t(),e(328,'. Nest then parses these values by transforming the buffers into strings. If the string is "object like", Nest attempts to parse the string as '),n(329,"code"),e(330,"JSON"),t(),e(331,". The "),n(332,"code"),e(333,"value"),t(),e(334," is then passed to its associated handler."),t(),n(335,"h4",47)(336,"span"),e(337,"Outgoing"),t()(),n(338,"p"),e(339,"Nest sends outgoing Kafka messages after a serialization process when publishing events or sending messages. This occurs on arguments passed to the "),n(340,"code"),e(341,"ClientKafkaProxy"),t(),n(342,"code"),e(343,"emit()"),t(),e(344," and "),n(345,"code"),e(346,"send()"),t(),e(347," methods or on values returned from a "),n(348,"code"),e(349,"@MessagePattern"),t(),e(350,' method. This serialization "stringifies" objects that are not strings or buffers by using '),n(351,"code"),e(352,"JSON.stringify()"),t(),e(353," or the "),n(354,"code"),e(355,"toString()"),t(),e(356," prototype method."),t(),n(357,"app-copy-button",27)(358,"span",28),e(359),p(360,"extension"),r(361,"app-tabs",null,4),t(),n(363,"pre")(364,"code",29),e(365,`
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const dragonId = message.dragonId;
    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];
    return items;
  }
}
`),t()()(),n(366,"blockquote",30)(367,"strong"),e(368,"Hint"),t(),n(369,"code"),e(370,"@Payload()"),t(),e(371," is imported from the "),n(372,"code"),e(373,"@nestjs/microservices"),t(),e(374,` package.
`),t(),n(375,"p"),e(376,"Outgoing messages can also be keyed by passing an object with the "),n(377,"code"),e(378,"key"),t(),e(379," and "),n(380,"code"),e(381,"value"),t(),e(382," properties. Keying messages is important for meeting the "),n(383,"a",48),e(384,"co-partitioning requirement"),t(),e(385,"."),t(),n(386,"app-copy-button",27)(387,"span",28),e(388),p(389,"extension"),r(390,"app-tabs",null,5),t(),n(392,"pre")(393,"code",29),e(394,`
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const realm = 'Nest';
    const heroId = message.heroId;
    const dragonId = message.dragonId;

    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];

    return {
      headers: {
        realm
      },
      key: heroId,
      value: items
    }
  }
}
`),t()()(),n(395,"p"),e(396,"Additionally, messages passed in this format can also contain custom headers set in the "),n(397,"code"),e(398,"headers"),t(),e(399," hash property. Header hash property values must be either of type "),n(400,"code"),e(401,"string"),t(),e(402," or type "),n(403,"code"),e(404,"Buffer"),t(),e(405,"."),t(),n(406,"app-copy-button",27)(407,"span",28),e(408),p(409,"extension"),r(410,"app-tabs",null,6),t(),n(412,"pre")(413,"code",29),e(414,`
@Controller()
export class HeroesController {
  @MessagePattern('hero.kill.dragon')
  killDragon(@Payload() message: KillDragonMessage): any {
    const realm = 'Nest';
    const heroId = message.heroId;
    const dragonId = message.dragonId;

    const items = [
      { id: 1, name: 'Mythical Sword' },
      { id: 2, name: 'Key to Dungeon' },
    ];

    return {
      headers: {
        kafka_nestRealm: realm
      },
      key: heroId,
      value: items
    }
  }
}
`),t()()(),n(415,"h4",49)(416,"span"),e(417,"Event-based"),t()(),n(418,"p"),e(419,"While the request-response method is ideal for exchanging messages between services, it is less suitable when your message style is event-based (which in turn is ideal for Kafka) - when you just want to publish events "),n(420,"strong"),e(421,"without waiting for a response"),t(),e(422,". In that case, you do not want the overhead required by request-response for maintaining two topics."),t(),n(423,"p"),e(424,"Check out these two sections to learn more about this: "),n(425,"a",45),e(426,"Overview: Event-based"),t(),e(427," and "),n(428,"a",50),e(429,"Overview: Publishing events"),t(),e(430,"."),t(),n(431,"h4",51)(432,"span"),e(433,"Context"),t()(),n(434,"p"),e(435,"In more complex scenarios, you may need to access additional information about the incoming request. When using the Kafka transporter, you can access the "),n(436,"code"),e(437,"KafkaContext"),t(),e(438," object."),t(),n(439,"app-copy-button",27)(440,"span",28),r(441,"app-tabs",null,7),t(),n(443,"pre")(444,"code",29),e(445,`
@MessagePattern('hero.kill.dragon')
killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  console.log(\`Topic: \${context.getTopic()}\`);
}
`),t()(),n(446,"pre")(447,"code",29),e(448,`
@Bind(Payload(), Ctx())
@MessagePattern('hero.kill.dragon')
killDragon(message, context) {
  console.log(\`Topic: \${context.getTopic()}\`);
}
`),t()()(),n(449,"blockquote",30)(450,"strong"),e(451,"Hint"),t(),n(452,"code"),e(453,"@Payload()"),t(),e(454,", "),n(455,"code"),e(456,"@Ctx()"),t(),e(457," and "),n(458,"code"),e(459,"KafkaContext"),t(),e(460," are imported from the "),n(461,"code"),e(462,"@nestjs/microservices"),t(),e(463,` package.
`),t(),n(464,"p"),e(465,"To access the original Kafka "),n(466,"code"),e(467,"IncomingMessage"),t(),e(468," object, use the "),n(469,"code"),e(470,"getMessage()"),t(),e(471," method of the "),n(472,"code"),e(473,"KafkaContext"),t(),e(474," object, as follows:"),t(),n(475,"app-copy-button",27)(476,"span",28),r(477,"app-tabs",null,8),t(),n(479,"pre")(480,"code",29),e(481,`
@MessagePattern('hero.kill.dragon')
killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  const originalMessage = context.getMessage();
  const partition = context.getPartition();
  const { headers, timestamp } = originalMessage;
}
`),t()(),n(482,"pre")(483,"code",29),e(484,`
@Bind(Payload(), Ctx())
@MessagePattern('hero.kill.dragon')
killDragon(message, context) {
  const originalMessage = context.getMessage();
  const partition = context.getPartition();
  const { headers, timestamp } = originalMessage;
}
`),t()()(),n(485,"p"),e(486,"Where the "),n(487,"code"),e(488,"IncomingMessage"),t(),e(489," fulfills the following interface:"),t(),n(490,"app-copy-button")(491,"pre")(492,"code",29),e(493,`
interface IncomingMessage {
  topic: string;
  partition: number;
  timestamp: string;
  size: number;
  attributes: number;
  offset: string;
  key: any;
  value: any;
  headers: Record<string, any>;
}
`),t()()(),n(494,"p"),e(495,"If your handler involves a slow processing time for each received message you should consider using the "),n(496,"code"),e(497,"heartbeat"),t(),e(498," callback. To retrieve the "),n(499,"code"),e(500,"heartbeat"),t(),e(501," function, use the "),n(502,"code"),e(503,"getHeartbeat()"),t(),e(504," method of the "),n(505,"code"),e(506,"KafkaContext"),t(),e(507,", as follows:"),t(),n(508,"app-copy-button",27)(509,"span",28),r(510,"app-tabs",null,9),t(),n(512,"pre")(513,"code",29),e(514,`
@MessagePattern('hero.kill.dragon')
async killDragon(@Payload() message: KillDragonMessage, @Ctx() context: KafkaContext) {
  const heartbeat = context.getHeartbeat();

  // Do some slow processing
  await doWorkPart1();

  // Send heartbeat to not exceed the sessionTimeout
  await heartbeat();

  // Do some slow processing again
  await doWorkPart2();
}
`),t()()(),n(515,"h4",52)(516,"span"),e(517,"Naming conventions"),t()(),n(518,"p"),e(519,"The Kafka microservice components append a description of their respective role onto the "),n(520,"code"),e(521,"client.clientId"),t(),e(522," and "),n(523,"code"),e(524,"consumer.groupId"),t(),e(525," options to prevent collisions between Nest microservice client and server components. By default the "),n(526,"code"),e(527,"ClientKafkaProxy"),t(),e(528," components append "),n(529,"code"),e(530,"-client"),t(),e(531," and the "),n(532,"code"),e(533,"ServerKafka"),t(),e(534," components append "),n(535,"code"),e(536,"-server"),t(),e(537," to both of these options. Note how the provided values below are transformed in that way (as shown in the comments)."),t(),n(538,"app-copy-button",27)(539,"span",28),e(540),p(541,"extension"),r(542,"app-tabs",null,10),t(),n(544,"pre")(545,"code",29),e(546,`
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero', // hero-server
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer' // hero-consumer-server
    },
  }
});
`),t()()(),n(547,"p"),e(548,"And for the client:"),t(),n(549,"app-copy-button",27)(550,"span",28),e(551),p(552,"extension"),r(553,"app-tabs",null,11),t(),n(555,"pre")(556,"code",29),e(557,`
@Client({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hero', // hero-client
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hero-consumer' // hero-consumer-client
    }
  }
})
client: ClientKafkaProxy;
`),t()()(),n(558,"blockquote",30)(559,"strong"),e(560,"Hint"),t(),e(561," Kafka client and consumer naming conventions can be customized by extending "),n(562,"code"),e(563,"ClientKafkaProxy"),t(),e(564," and "),n(565,"code"),e(566,"KafkaServer"),t(),e(567,` in your own custom provider and overriding the constructor.
`),t(),n(568,"p"),e(569,"Since the Kafka microservice message pattern utilizes two topics for the request and reply channels, a reply pattern should be derived from the request topic. By default, the name of the reply topic is the composite of the request topic name with "),n(570,"code"),e(571,".reply"),t(),e(572," appended."),t(),n(573,"app-copy-button",27)(574,"span",28),e(575),p(576,"extension"),r(577,"app-tabs",null,12),t(),n(579,"pre")(580,"code",29),e(581,`
onModuleInit() {
  this.client.subscribeToResponseOf('hero.get'); // hero.get.reply
}
`),t()()(),n(582,"blockquote",30)(583,"strong"),e(584,"Hint"),t(),e(585," Kafka reply topic naming conventions can be customized by extending "),n(586,"code"),e(587,"ClientKafkaProxy"),t(),e(588," in your own custom provider and overriding the "),n(589,"code"),e(590,"getResponsePatternName"),t(),e(591,` method.
`),t(),n(592,"h4",53)(593,"span"),e(594,"Retriable exceptions"),t()(),n(595,"p"),e(596,"Similar to other transporters, all unhandled exceptions are automatically wrapped into an "),n(597,"code"),e(598,"RpcException"),t(),e(599,' and converted to a "user-friendly" format. However, there are edge-cases when you might want to bypass this mechanism and let exceptions be consumed by the '),n(600,"code"),e(601,"kafkajs"),t(),e(602," driver instead. Throwing an exception when processing a message instructs "),n(603,"code"),e(604,"kafkajs"),t(),e(605," to "),n(606,"strong"),e(607,"retry"),t(),e(608," it (redeliver it) which means that even though the message (or event) handler was triggered, the offset won't be committed to Kafka."),t(),n(609,"blockquote",43)(610,"strong"),e(611,"Warning"),t(),e(612," For event handlers (event-based communication), all unhandled exceptions are considered "),n(613,"strong"),e(614,"retriable exceptions"),t(),e(615,` by default.
`),t(),n(616,"p"),e(617,"For this, you can use a dedicated class called "),n(618,"code"),e(619,"KafkaRetriableException"),t(),e(620,", as follows:"),t(),n(621,"app-copy-button")(622,"pre")(623,"code",29),e(624,`
throw new KafkaRetriableException('...');
`),t()()(),n(625,"blockquote",30)(626,"strong"),e(627,"Hint"),t(),n(628,"code"),e(629,"KafkaRetriableException"),t(),e(630," class is exported from the "),n(631,"code"),e(632,"@nestjs/microservices"),t(),e(633,` package.
`),t(),n(634,"h3",54),e(635,"Custom exception handling"),t(),n(636,"p"),e(637,"Along with the default error handling mechanisms, you can create a custom Exception Filter for Kafka events to manage retry logic. For instance, the example below demonstrates how to skip a problematic event after a configurable number of retries:"),t(),n(638,"app-copy-button")(639,"pre")(640,"code",29),e(641,`
import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { KafkaContext } from '@nestjs/microservices';
import { Producer } from 'kafkajs';

@Catch()
export class KafkaMaxRetryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(KafkaMaxRetryExceptionFilter.name);

  constructor(
    private readonly producer: Producer,
    private readonly maxRetries: number,
    // Optional custom function executed when max retries are exceeded
    private readonly skipHandler?: (message: any) => Promise<void>,
  ) {
    super();
  }

  async catch(exception: unknown, host: ArgumentsHost) {
    const kafkaContext = host.switchToRpc().getContext<KafkaContext>();
    const message = kafkaContext.getMessage();
    const currentRetryCount = this.getRetryCountFromContext(kafkaContext);

    if (currentRetryCount >= this.maxRetries) {
      this.logger.warn(
        \`Max retries (\${
          this.maxRetries
        }) exceeded for message: \${JSON.stringify(message)}\`,
      );

      if (this.skipHandler) {
        try {
          await this.skipHandler(message);
        } catch (err) {
          this.logger.error('Error in skipHandler:', err);
        }
      }

      try {
        await this.commitOffset(kafkaContext);
      } catch (commitError) {
        this.logger.error('Failed to commit offset:', commitError);
      }
      return; // Stop propagating the exception
    }

    // Republish the message to the same topic with incremented retry count
    try {
      await this.republishWithRetry(kafkaContext, currentRetryCount + 1);
      await this.commitOffset(kafkaContext);
    } catch (republishError) {
      this.logger.error('Failed to republish message for retry:', republishError);
      // Fall back to default exception handling
      super.catch(exception, host);
    }
  }

  private getRetryCountFromContext(context: KafkaContext): number {
    const headers = context.getMessage().headers || {};
    const retryHeader = headers['retry-count'];
    if (!retryHeader) {
      return 0;
    }
    // Header values are Buffers, so convert to string first
    const value = Buffer.isBuffer(retryHeader)
      ? retryHeader.toString()
      : String(retryHeader);
    return parseInt(value, 10) || 0;
  }

  private async republishWithRetry(
    context: KafkaContext,
    retryCount: number,
  ): Promise<void> {
    const topic = context.getTopic();
    const message = context.getMessage();

    await this.producer.send({
      topic,
      messages: [
        {
          key: message.key,
          value: message.value,
          headers: {
            ...message.headers,
            'retry-count': retryCount.toString(),
          },
        },
      ],
    });
  }

  private async commitOffset(context: KafkaContext): Promise<void> {
    const consumer = context.getConsumer();
    if (!consumer) {
      throw new Error('Consumer instance is not available from KafkaContext.');
    }

    const topic = context.getTopic();
    const partition = context.getPartition();
    const message = context.getMessage();
    const offset = message.offset;

    if (!topic || partition === undefined || offset === undefined) {
      throw new Error(
        'Incomplete Kafka message context for committing offset.',
      );
    }

    await consumer.commitOffsets([
      {
        topic,
        partition,
        // When committing an offset, commit the next number (i.e., current offset + 1)
        offset: (Number(offset) + 1).toString(),
      },
    ]);
  }
}
`),t()()(),n(642,"p"),e(643,"This filter offers a way to retry processing a Kafka event up to a configurable number of times. When an exception occurs, it republishes the message to the same topic with an incremented "),n(644,"code"),e(645,"retry-count"),t(),e(646," header, then commits the current offset. Once the maximum retries are reached, it triggers a custom "),n(647,"code"),e(648,"skipHandler"),t(),e(649," (if provided) and commits the offset, effectively skipping the problematic event. This allows subsequent events to be processed without interruption."),t(),n(650,"p"),e(651,"You can integrate this filter by registering it globally or at the controller level. Note that you need to provide a Kafka producer instance:"),t(),n(652,"app-copy-button",27)(653,"span",28),e(654),p(655,"extension"),r(656,"app-tabs",null,13),t(),n(658,"pre")(659,"code",29),e(660,`
import { Inject, Injectable } from '@nestjs/common';
import { Producer } from 'kafkajs';

@Injectable()
export class AppKafkaRetryFilter extends KafkaMaxRetryExceptionFilter {
  constructor(@Inject('KAFKA_PRODUCER') producer: Producer) {
    super(producer, 5); // maxRetries = 5
  }
}
`),t()(),n(661,"pre")(662,"code",29),e(663,`
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AppKafkaRetryFilter extends KafkaMaxRetryExceptionFilter {
  constructor(@Inject('KAFKA_PRODUCER') producer) {
    super(producer, 5); // maxRetries = 5
  }
}
`),t()()(),n(664,"app-copy-button",27)(665,"span",28),e(666),p(667,"extension"),r(668,"app-tabs",null,14),t(),n(670,"pre")(671,"code",29),e(672,`
@Controller()
@UseFilters(AppKafkaRetryFilter)
export class MyEventHandler {
  @EventPattern('your-topic')
  async handleEvent(@Payload() data: any, @Ctx() context: KafkaContext) {
    // Your event processing logic...
  }
}
`),t()(),n(673,"pre")(674,"code",29),e(675,`
@Controller()
@UseFilters(AppKafkaRetryFilter)
export class MyEventHandler {
  @Bind(Payload(), Ctx())
  @EventPattern('your-topic')
  async handleEvent(data, context) {
    // Your event processing logic...
  }
}
`),t()()(),n(676,"p"),e(677,"Make sure to provide the Kafka producer in your module:"),t(),n(678,"app-copy-button",27)(679,"span",28),e(680),p(681,"extension"),r(682,"app-tabs",null,15),t(),n(684,"pre")(685,"code",29),e(686,`
import { Kafka } from 'kafkajs';

@Module({
  providers: [
    AppKafkaRetryFilter,
    {
      provide: 'KAFKA_PRODUCER',
      useFactory: async () => {
        const kafka = new Kafka({ brokers: ['localhost:9092'] });
        const producer = kafka.producer();
        await producer.connect();
        return producer;
      },
    },
  ],
})
export class AppModule {}
`),t()()(),n(687,"h4",55)(688,"span"),e(689,"Commit offsets"),t()(),n(690,"p"),e(691,"Committing offsets is essential when working with Kafka. Per default, messages will be automatically committed after a specific time. For more information visit "),n(692,"a",56),e(693,"KafkaJS docs"),t(),e(694,". "),n(695,"code"),e(696,"KafkaContext"),t(),e(697," offers a way to access the active consumer for manually committing offsets. The consumer is the KafkaJS consumer and works as the "),n(698,"a",57),e(699,"native KafkaJS implementation"),t(),e(700,"."),t(),n(701,"app-copy-button",27)(702,"span",28),r(703,"app-tabs",null,16),t(),n(705,"pre")(706,"code",29),e(707,`
@EventPattern('user.created')
async handleUserCreated(@Payload() data: IncomingMessage, @Ctx() context: KafkaContext) {
  // business logic

  const { offset } = context.getMessage();
  const partition = context.getPartition();
  const topic = context.getTopic();
  const consumer = context.getConsumer();
  await consumer.commitOffsets([{ topic, partition, offset }])
}
`),t()(),n(708,"pre")(709,"code",29),e(710,`
@Bind(Payload(), Ctx())
@EventPattern('user.created')
async handleUserCreated(data, context) {
  // business logic

  const { offset } = context.getMessage();
  const partition = context.getPartition();
  const topic = context.getTopic();
  const consumer = context.getConsumer();
  await consumer.commitOffsets([{ topic, partition, offset }])
}
`),t()()(),n(711,"p"),e(712,"To disable auto-committing of messages set "),n(713,"code"),e(714,"autoCommit: false"),t(),e(715," in the "),n(716,"code"),e(717,"run"),t(),e(718," configuration, as follows:"),t(),n(719,"app-copy-button",27)(720,"span",28),e(721),p(722,"extension"),r(723,"app-tabs",null,17),t(),n(725,"pre")(726,"code",29),e(727,`
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    },
    run: {
      autoCommit: false
    }
  }
});
`),t()(),n(728,"pre")(729,"code",29),e(730,`
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: ['localhost:9092'],
    },
    run: {
      autoCommit: false
    }
  }
});
`),t()()(),n(731,"h4",58)(732,"span"),e(733,"Instance status updates"),t()(),n(734,"p"),e(735,"To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the "),n(736,"code"),e(737,"status"),t(),e(738," stream. This stream provides status updates specific to the chosen driver. For the Kafka driver, the "),n(739,"code"),e(740,"status"),t(),e(741," stream emits "),n(742,"code"),e(743,"connected"),t(),e(744,", "),n(745,"code"),e(746,"disconnected"),t(),e(747,", "),n(748,"code"),e(749,"rebalancing"),t(),e(750,", "),n(751,"code"),e(752,"crashed"),t(),e(753,", and "),n(754,"code"),e(755,"stopped"),t(),e(756," events."),t(),n(757,"app-copy-button")(758,"pre")(759,"code",29),e(760,`
this.client.status.subscribe((status: KafkaStatus) => {
  console.log(status);
});
`),t()()(),n(761,"blockquote",30)(762,"strong"),e(763,"Hint"),t(),e(764," The "),n(765,"code"),e(766,"KafkaStatus"),t(),e(767," type is imported from the "),n(768,"code"),e(769,"@nestjs/microservices"),t(),e(770,` package.
`),t(),n(771,"p"),e(772,"Similarly, you can subscribe to the server's "),n(773,"code"),e(774,"status"),t(),e(775," stream to receive notifications about the server's status."),t(),n(776,"app-copy-button")(777,"pre")(778,"code",29),e(779,`
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: KafkaStatus) => {
  console.log(status);
});
`),t()()(),n(780,"h4",59)(781,"span"),e(782,"Underlying producer and consumer"),t()(),n(783,"p"),e(784,"For more advanced use cases, you may need to access the underlying producer and consumer instances. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you "),n(785,"strong"),e(786,"shouldn't need"),t(),e(787," to access the driver directly."),t(),n(788,"p"),e(789,"To do so, you can use "),n(790,"code"),e(791,"producer"),t(),e(792," and "),n(793,"code"),e(794,"consumer"),t(),e(795," getters exposed by the "),n(796,"code"),e(797,"ClientKafkaProxy"),t(),e(798," instance."),t(),n(799,"app-copy-button")(800,"pre")(801,"code",29),e(802,`
const producer = this.client.producer;
const consumer = this.client.consumer;
`),t()()()()),c&2){let d=o(47),u=o(288),w=o(308),T=o(362),k=o(391),P=o(411),R=o(442),q=o(478),j=o(543),X=o(554),Z=o(578),I=o(657),F=o(669),ee=o(683),D=o(704),O=o(724);i(44),m(" ",x(45,41,"main",d.isJsActive),`
`),i(4),a("hide",d.isJsActive),i(3),a("hide",!d.isJsActive),i(234),m(" ",x(286,44,"heroes.controller",u.isJsActive),`
`),i(20),m(" ",x(306,47,"heroes.controller",w.isJsActive),`
`),i(54),m(" ",x(360,50,"heroes.controller",T.isJsActive),`
`),i(29),m(" ",x(389,53,"heroes.controller",k.isJsActive),`
`),i(20),m(" ",x(409,56,"heroes.controller",P.isJsActive),`
`),i(35),a("hide",R.isJsActive),i(3),a("hide",!R.isJsActive),i(33),a("hide",q.isJsActive),i(3),a("hide",!q.isJsActive),i(58),m(" ",x(541,59,"main",j.isJsActive),`
`),i(11),m(" ",x(552,62,"heroes.controller",X.isJsActive),`
`),i(24),m(" ",x(576,65,"heroes.controller",Z.isJsActive),`
`),i(79),m(" ",x(655,68,"kafka-retry.filter",I.isJsActive),`
`),i(4),a("hide",I.isJsActive),i(3),a("hide",!I.isJsActive),i(5),m(" ",x(667,71,"my-event.handler",F.isJsActive),`
`),i(4),a("hide",F.isJsActive),i(3),a("hide",!F.isJsActive),i(7),m(" ",x(681,74,"app.module",ee.isJsActive),`
`),i(25),a("hide",D.isJsActive),i(3),a("hide",!D.isJsActive),i(13),m(" ",x(722,77,"main",O.isJsActive),`
`),i(4),a("hide",O.isJsActive),i(3),a("hide",!O.isJsActive)}},dependencies:[y,b,v,C],encapsulation:2,changeDetection:0})}return s})();var V=(()=>{class s extends E{static \u0275fac=(()=>{let l;return function(h){return(l||(l=S(s)))(h||s)}})();static \u0275cmp=f({type:s,selectors:[["app-redis"]],features:[g],decls:338,vars:12,consts:[["contentReference",""],["app0475c3757091b68170be1bd1a600418fd1a316c8",""],["app81ed1c33cc318dd5d0070e0a7549cef76c525f30",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/microservices/redis.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","redis"],["rel","nofollow","target","_blank","href","https://redis.io/"],["rel","nofollow","target","_blank","href","https://redis.io/topics/pubsub"],["src","/assets/Redis_1.png",1,"illustrative-image"],["appAnchor","","id","installation"],[1,"language-bash"],["appAnchor","","id","overview"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","options"],["rel","nofollow","target","_blank","href","https://redis.github.io/ioredis/index.html#RedisOptions"],["appAnchor","","id","client"],["href","https://docs.nestjs.com/microservices/basics#client"],["appAnchor","","id","context"],["appAnchor","","id","wildcards"],["appAnchor","","id","instance-status-updates"],["appAnchor","","id","listening-to-redis-events"],["appAnchor","","id","underlying-driver-access"]],template:function(c,h){if(c&1&&(n(0,"div",3,0)(2,"div",4)(3,"a",5),r(4,"i",6),t()(),n(5,"h3",7),e(6,"Redis"),t(),n(7,"p"),e(8,"The "),n(9,"a",8),e(10,"Redis"),t(),e(11," transporter implements the publish/subscribe messaging paradigm and leverages the "),n(12,"a",9),e(13,"Pub/Sub"),t(),e(14," feature of Redis. Published messages are categorized in channels, without knowing what subscribers (if any) will eventually receive the message. Each microservice can subscribe to any number of channels. In addition, more than one channel can be subscribed to at a time. Messages exchanged through channels are "),n(15,"strong"),e(16,"fire-and-forget"),t(),e(17,", which means that if a message is published and there are no subscribers interested in it, the message is removed and cannot be recovered. Thus, you don't have a guarantee that either messages or events will be handled by at least one service. A single message can be subscribed to (and received) by multiple subscribers."),t(),n(18,"figure"),r(19,"img",10),t(),n(20,"h4",11)(21,"span"),e(22,"Installation"),t()(),n(23,"p"),e(24,"To start building Redis-based microservices, first install the required package:"),t(),n(25,"pre")(26,"code",12),e(27,`
$ npm i --save ioredis
`),t()(),n(28,"h4",13)(29,"span"),e(30,"Overview"),t()(),n(31,"p"),e(32,"To use the Redis transporter, pass the following options object to the "),n(33,"code"),e(34,"createMicroservice()"),t(),e(35," method:"),t(),n(36,"app-copy-button",14)(37,"span",15),e(38),p(39,"extension"),r(40,"app-tabs",null,1),t(),n(42,"pre")(43,"code",16),e(44,`
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});
`),t()(),n(45,"pre")(46,"code",16),e(47,`
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
  },
});
`),t()()(),n(48,"blockquote",17)(49,"strong"),e(50,"Hint"),t(),e(51," The "),n(52,"code"),e(53,"Transport"),t(),e(54," enum is imported from the "),n(55,"code"),e(56,"@nestjs/microservices"),t(),e(57,` package.
`),t(),n(58,"h4",18)(59,"span"),e(60,"Options"),t()(),n(61,"p"),e(62,"The "),n(63,"code"),e(64,"options"),t(),e(65," property is specific to the chosen transporter. The "),n(66,"strong"),e(67,"Redis"),t(),e(68," transporter exposes the properties described below."),t(),n(69,"table")(70,"tr")(71,"td")(72,"code"),e(73,"host"),t()(),n(74,"td"),e(75,"Connection url"),t()(),n(76,"tr")(77,"td")(78,"code"),e(79,"port"),t()(),n(80,"td"),e(81,"Connection port"),t()(),n(82,"tr")(83,"td")(84,"code"),e(85,"retryAttempts"),t()(),n(86,"td"),e(87,"Number of times to retry message (default: "),n(88,"code"),e(89,"0"),t(),e(90,")"),t()(),n(91,"tr")(92,"td")(93,"code"),e(94,"retryDelay"),t()(),n(95,"td"),e(96,"Delay between message retry attempts (ms) (default: "),n(97,"code"),e(98,"0"),t(),e(99,")"),t()(),n(100,"tr")(101,"td")(102,"code"),e(103,"wildcards"),t()(),n(104,"td"),e(105,"Enables Redis wildcard subscriptions, instructing transporter to use "),n(106,"code"),e(107,"psubscribe"),t(),e(108,"/"),n(109,"code"),e(110,"pmessage"),t(),e(111," under the hood. (default: "),n(112,"code"),e(113,"false"),t(),e(114,")"),t()()(),n(115,"p"),e(116,"All the properties supported by the official "),n(117,"a",19),e(118,"ioredis"),t(),e(119," client are also supported by this transporter."),t(),n(120,"h4",20)(121,"span"),e(122,"Client"),t()(),n(123,"p"),e(124,"Like other microservice transporters, you have "),n(125,"a",21),e(126,"several options"),t(),e(127," for creating a Redis "),n(128,"code"),e(129,"ClientProxy"),t(),e(130," instance."),t(),n(131,"p"),e(132,"One method for creating an instance is to use the "),n(133,"code"),e(134,"ClientsModule"),t(),e(135,". To create a client instance with the "),n(136,"code"),e(137,"ClientsModule"),t(),e(138,", import it and use the "),n(139,"code"),e(140,"register()"),t(),e(141," method to pass an options object with the same properties shown above in the "),n(142,"code"),e(143,"createMicroservice()"),t(),e(144," method, as well as a "),n(145,"code"),e(146,"name"),t(),e(147," property to be used as the injection token. Read more about "),n(148,"code"),e(149,"ClientsModule"),t(),n(150,"a",21),e(151,"here"),t(),e(152,"."),t(),n(153,"app-copy-button")(154,"pre")(155,"code",16),e(156,`
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATH_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        }
      },
    ]),
  ]
  ...
})
`),t()()(),n(157,"p"),e(158,"Other options to create a client (either "),n(159,"code"),e(160,"ClientProxyFactory"),t(),e(161," or "),n(162,"code"),e(163,"@Client()"),t(),e(164,") can be used as well. You can read about them "),n(165,"a",21),e(166,"here"),t(),e(167,"."),t(),n(168,"h4",22)(169,"span"),e(170,"Context"),t()(),n(171,"p"),e(172,"In more complex scenarios, you may need to access additional information about the incoming request. When using the Redis transporter, you can access the "),n(173,"code"),e(174,"RedisContext"),t(),e(175," object."),t(),n(176,"app-copy-button",14)(177,"span",15),r(178,"app-tabs",null,2),t(),n(180,"pre")(181,"code",16),e(182,`
@MessagePattern('notifications')
getNotifications(@Payload() data: number[], @Ctx() context: RedisContext) {
  console.log(\`Channel: \${context.getChannel()}\`);
}
`),t()(),n(183,"pre")(184,"code",16),e(185,`
@Bind(Payload(), Ctx())
@MessagePattern('notifications')
getNotifications(data, context) {
  console.log(\`Channel: \${context.getChannel()}\`);
}
`),t()()(),n(186,"blockquote",17)(187,"strong"),e(188,"Hint"),t(),n(189,"code"),e(190,"@Payload()"),t(),e(191,", "),n(192,"code"),e(193,"@Ctx()"),t(),e(194," and "),n(195,"code"),e(196,"RedisContext"),t(),e(197," are imported from the "),n(198,"code"),e(199,"@nestjs/microservices"),t(),e(200,` package.
`),t(),n(201,"h4",23)(202,"span"),e(203,"Wildcards"),t()(),n(204,"p"),e(205,"To enable wildcards support, set the "),n(206,"code"),e(207,"wildcards"),t(),e(208," option to "),n(209,"code"),e(210,"true"),t(),e(211,". This instructs the transporter to use "),n(212,"code"),e(213,"psubscribe"),t(),e(214," and "),n(215,"code"),e(216,"pmessage"),t(),e(217," under the hood."),t(),n(218,"app-copy-button")(219,"pre")(220,"code",16),e(221,`
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.REDIS,
  options: {
    // Other options
    wildcards: true,
  },
});
`),t()()(),n(222,"p"),e(223,"Make sure to pass the "),n(224,"code"),e(225,"wildcards"),t(),e(226," option when creating a client instance as well."),t(),n(227,"p"),e(228,"With this option enabled, you can use wildcards in your message and event patterns. For example, to subscribe to all channels starting with "),n(229,"code"),e(230,"notifications"),t(),e(231,", you can use the following pattern:"),t(),n(232,"app-copy-button")(233,"pre")(234,"code",16),e(235,`
@EventPattern('notifications.*')
`),t()()(),n(236,"h4",24)(237,"span"),e(238,"Instance status updates"),t()(),n(239,"p"),e(240,"To get real-time updates on the connection and the state of the underlying driver instance, you can subscribe to the "),n(241,"code"),e(242,"status"),t(),e(243," stream. This stream provides status updates specific to the chosen driver. For the Redis driver, the "),n(244,"code"),e(245,"status"),t(),e(246," stream emits "),n(247,"code"),e(248,"connected"),t(),e(249,", "),n(250,"code"),e(251,"disconnected"),t(),e(252,", and "),n(253,"code"),e(254,"reconnecting"),t(),e(255," events."),t(),n(256,"app-copy-button")(257,"pre")(258,"code",16),e(259,`
this.client.status.subscribe((status: RedisStatus) => {
  console.log(status);
});
`),t()()(),n(260,"blockquote",17)(261,"strong"),e(262,"Hint"),t(),e(263," The "),n(264,"code"),e(265,"RedisStatus"),t(),e(266," type is imported from the "),n(267,"code"),e(268,"@nestjs/microservices"),t(),e(269,` package.
`),t(),n(270,"p"),e(271,"Similarly, you can subscribe to the server's "),n(272,"code"),e(273,"status"),t(),e(274," stream to receive notifications about the server's status."),t(),n(275,"app-copy-button")(276,"pre")(277,"code",16),e(278,`
const server = app.connectMicroservice<MicroserviceOptions>(...);
server.status.subscribe((status: RedisStatus) => {
  console.log(status);
});
`),t()()(),n(279,"h4",25)(280,"span"),e(281,"Listening to Redis events"),t()(),n(282,"p"),e(283,"In some cases, you might want to listen to internal events emitted by the microservice. For example, you could listen for the "),n(284,"code"),e(285,"error"),t(),e(286," event to trigger additional operations when an error occurs. To do this, use the "),n(287,"code"),e(288,"on()"),t(),e(289," method, as shown below:"),t(),n(290,"app-copy-button")(291,"pre")(292,"code",16),e(293,`
this.client.on('error', (err) => {
  console.error(err);
});
`),t()()(),n(294,"p"),e(295,"Similarly, you can listen to the server's internal events:"),t(),n(296,"app-copy-button")(297,"pre")(298,"code",16),e(299,`
server.on<RedisEvents>('error', (err) => {
  console.error(err);
});
`),t()()(),n(300,"blockquote",17)(301,"strong"),e(302,"Hint"),t(),e(303," The "),n(304,"code"),e(305,"RedisEvents"),t(),e(306," type is imported from the "),n(307,"code"),e(308,"@nestjs/microservices"),t(),e(309,` package.
`),t(),n(310,"h4",26)(311,"span"),e(312,"Underlying driver access"),t()(),n(313,"p"),e(314,"For more advanced use cases, you may need to access the underlying driver instance. This can be useful for scenarios like manually closing the connection or using driver-specific methods. However, keep in mind that for most cases, you "),n(315,"strong"),e(316,"shouldn't need"),t(),e(317," to access the driver directly."),t(),n(318,"p"),e(319,"To do so, you can use the "),n(320,"code"),e(321,"unwrap()"),t(),e(322," method, which returns the underlying driver instance. The generic type parameter should specify the type of driver instance you expect."),t(),n(323,"app-copy-button")(324,"pre")(325,"code",16),e(326,`
const [pub, sub] =
  this.client.unwrap<[import('ioredis').Redis, import('ioredis').Redis]>();
`),t()()(),n(327,"p"),e(328,"Similarly, you can access the server's underlying driver instance:"),t(),n(329,"app-copy-button")(330,"pre")(331,"code",16),e(332,`
const [pub, sub] =
  server.unwrap<[import('ioredis').Redis, import('ioredis').Redis]>();
`),t()()(),n(333,"p"),e(334,"Note that, in contrary to other transporters, the Redis transporter returns a tuple of two "),n(335,"code"),e(336,"ioredis"),t(),e(337," instances: the first one is used for publishing messages, and the second one is used for subscribing to messages."),t()()),c&2){let d=o(41),u=o(179);i(38),m(" ",x(39,9,"main",d.isJsActive),`
`),i(4),a("hide",d.isJsActive),i(3),a("hide",!d.isJsActive),i(135),a("hide",u.isJsActive),i(3),a("hide",!u.isJsActive)}},dependencies:[y,b,v,C],encapsulation:2,changeDetection:0})}return s})();var Ot=[{path:"basics",component:J,data:{title:"Microservices"}},{path:"redis",component:V,data:{title:"Redis - Microservices"}},{path:"mqtt",component:W,data:{title:"MQTT - Microservices"}},{path:"nats",component:U,data:{title:"NATS - Microservices"}},{path:"grpc",component:G,data:{title:"gRPC - Microservices"}},{path:"rabbitmq",component:$,data:{title:"RabbitMQ - Microservices"}},{path:"kafka",component:Y,data:{title:"Kafka - Microservices"}},{path:"pipes",component:z,data:{title:"Pipes - Microservices"}},{path:"exception-filters",component:K,data:{title:"Exception Filters - Microservices"}},{path:"guards",component:Q,data:{title:"Guards - Microservices"}},{path:"interceptors",component:L,data:{title:"Interceptors - Microservices"}},{path:"custom-transport",component:B,data:{title:"Custom transporters - Microservices"}}];export{Ot as MICROSERVICES_ROUTES};
