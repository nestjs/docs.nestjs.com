import{a as F}from"./chunk-A6GBSRU4.js";import{a as E,b as A}from"./chunk-AO7BAPTM.js";import{G as i,L as h,Ma as v,N as x,Qa as g,Ra as y,Sa as S,V as n,W as t,X as s,ja as c,ka as o,la as e,na as u,oa as P,ua as f,va as b,y as m}from"./chunk-IPH2CUBH.js";var j=(()=>{class a extends g{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=h({type:a,selectors:[["app-adapter"]],features:[x],decls:210,vars:12,consts:[["contentReference",""],["app6bceab62c0215f6be0eaffd6510fb5aae097e1a1",""],["app64c93d07e2e8f1c43afcd129e56c9001be5ad64a",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/websockets/adapter.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","adapters"],["appAnchor","","id","extend-socketio"],["rel","nofollow","target","_blank","href","https://github.com/socketio/socket.io"],[1,"warning"],["rel","nofollow","target","_blank","href","https://socket.io/docs/v4/using-multiple-nodes/#enabling-sticky-session"],[1,"language-bash"],[1,"language-typescript"],["appAnchor","","id","ws-library"],["rel","nofollow","target","_blank","href","https://github.com/websockets/ws"],[1,"info"],["appAnchor","","id","advanced-custom-adapter"],[1,"with-heading"],[1,"filename"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/16-gateways-ws"]],template:function(l,d){if(l&1&&(n(0,"div",3,0)(2,"div",4)(3,"a",5),s(4,"i",6),t()(),n(5,"h3",7),e(6,"Adapters"),t(),n(7,"p"),e(8,"The WebSockets module is platform-agnostic, hence, you can bring your own library (or even a native implementation) by making use of "),n(9,"code"),e(10,"WebSocketAdapter"),t(),e(11," interface. This interface forces to implement few methods described in the following table:"),t(),n(12,"table")(13,"tr")(14,"td")(15,"code"),e(16,"create"),t()(),n(17,"td"),e(18,"Creates a socket instance based on passed arguments"),t()(),n(19,"tr")(20,"td")(21,"code"),e(22,"bindClientConnect"),t()(),n(23,"td"),e(24,"Binds the client connection event"),t()(),n(25,"tr")(26,"td")(27,"code"),e(28,"bindClientDisconnect"),t()(),n(29,"td"),e(30,"Binds the client disconnection event (optional*)"),t()(),n(31,"tr")(32,"td")(33,"code"),e(34,"bindMessageHandlers"),t()(),n(35,"td"),e(36,"Binds the incoming message to the corresponding message handler"),t()(),n(37,"tr")(38,"td")(39,"code"),e(40,"close"),t()(),n(41,"td"),e(42,"Terminates a server instance"),t()()(),n(43,"h4",8)(44,"span"),e(45,"Extend socket.io"),t()(),n(46,"p"),e(47,"The "),n(48,"a",9),e(49,"socket.io"),t(),e(50," package is wrapped in an "),n(51,"code"),e(52,"IoAdapter"),t(),e(53," class. What if you would like to enhance the basic functionality of the adapter? For instance, your technical requirements require a capability to broadcast events across multiple load-balanced instances of your web service. For this, you can extend "),n(54,"code"),e(55,"IoAdapter"),t(),e(56," and override a single method which responsibility is to instantiate new socket.io servers. But first of all, let's install the required package."),t(),n(57,"blockquote",10)(58,"strong"),e(59,"Warning"),t(),e(60," To use socket.io with multiple load-balanced instances you either have to disable polling by setting "),n(61,"code"),e(62,"transports: ['websocket']"),t(),e(63," in your clients socket.io configuration or you have to enable cookie based routing in your load balancer. Redis alone is not enough. See "),n(64,"a",11),e(65,"here"),t(),e(66,` for more information.
`),t(),n(67,"pre")(68,"code",12),e(69,`
$ npm i --save redis socket.io @socket.io/redis-adapter
`),t()(),n(70,"p"),e(71,"Once the package is installed, we can create a "),n(72,"code"),e(73,"RedisIoAdapter"),t(),e(74," class."),t(),n(75,"app-copy-button")(76,"pre")(77,"code",13),e(78,`
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: \`redis://localhost:6379\` });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
`),t()()(),n(79,"p"),e(80,"Afterward, simply switch to your newly created Redis adapter."),t(),n(81,"app-copy-button")(82,"pre")(83,"code",13),e(84,`
const app = await NestFactory.create(AppModule);
const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis();

app.useWebSocketAdapter(redisIoAdapter);
`),t()()(),n(85,"h4",14)(86,"span"),e(87,"Ws library"),t()(),n(88,"p"),e(89,"Another available adapter is a "),n(90,"code"),e(91,"WsAdapter"),t(),e(92," which in turn acts like a proxy between the framework and integrate blazing fast and thoroughly tested "),n(93,"a",15),e(94,"ws"),t(),e(95," library. This adapter is fully compatible with native browser WebSockets and is far faster than socket.io package. Unluckily, it has significantly fewer functionalities available out-of-the-box. In some cases, you don't necessarily need them though."),t(),n(96,"blockquote",16)(97,"strong"),e(98,"Hint"),t(),n(99,"code"),e(100,"ws"),t(),e(101," library does not support namespaces (communication channels popularised by "),n(102,"code"),e(103,"socket.io"),t(),e(104,"). However, to somehow mimic this feature, you can mount multiple "),n(105,"code"),e(106,"ws"),t(),e(107," servers on different paths (example: "),n(108,"code"),e(109),t(),e(110,`).
`),t(),n(111,"p"),e(112,"In order to use "),n(113,"code"),e(114,"ws"),t(),e(115,", we firstly have to install the required package:"),t(),n(116,"pre")(117,"code",12),e(118,`
$ npm i --save @nestjs/platform-ws
`),t()(),n(119,"p"),e(120,"Once the package is installed, we can switch an adapter:"),t(),n(121,"app-copy-button")(122,"pre")(123,"code",13),e(124,`
const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new WsAdapter(app));
`),t()()(),n(125,"blockquote",16)(126,"strong"),e(127,"Hint"),t(),e(128," The "),n(129,"code"),e(130,"WsAdapter"),t(),e(131," is imported from "),n(132,"code"),e(133,"@nestjs/platform-ws"),t(),e(134,`.
`),t(),n(135,"p"),e(136,"The "),n(137,"code"),e(138,"wsAdapter"),t(),e(139," is designed to handle messages in the "),n(140,"code"),e(141),t(),e(142," format. If you need to receive and process messages in a different format, you'll need to configure a message parser to convert them into this required format."),t(),n(143,"app-copy-button")(144,"pre")(145,"code",13),e(146,`
const wsAdapter = new WsAdapter(app, {
  // To handle messages in the [event, data] format
  messageParser: (data) => {
    const [event, payload] = JSON.parse(data.toString());
    return { event, data: payload };
  },
});
`),t()()(),n(147,"p"),e(148,"Alternatively, you can configure the message parser after the adapter is created by using the "),n(149,"code"),e(150,"setMessageParser"),t(),e(151," method."),t(),n(152,"h4",17)(153,"span"),e(154,"Advanced (custom adapter)"),t()(),n(155,"p"),e(156,"For demonstration purposes, we are going to integrate the "),n(157,"a",15),e(158,"ws"),t(),e(159," library manually. As mentioned, the adapter for this library is already created and is exposed from the "),n(160,"code"),e(161,"@nestjs/platform-ws"),t(),e(162," package as a "),n(163,"code"),e(164,"WsAdapter"),t(),e(165," class. Here is how the simplified implementation could potentially look like:"),t(),n(166,"app-copy-button",18)(167,"span",19),e(168),f(169,"extension"),s(170,"app-tabs",null,1),t(),n(172,"pre")(173,"code",13),e(174,`
import * as WebSocket from 'ws';
import { WebSocketAdapter, INestApplicationContext } from '@nestjs/common';
import { MessageMappingProperties } from '@nestjs/websockets';
import { Observable, fromEvent, EMPTY } from 'rxjs';
import { mergeMap, filter } from 'rxjs/operators';

export class WsAdapter implements WebSocketAdapter {
  constructor(private app: INestApplicationContext) {}

  create(port: number, options: any = {}): any {
    return new WebSocket.Server({ port, ...options });
  }

  bindClientConnect(server, callback: Function) {
    server.on('connection', callback);
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ) {
    fromEvent(client, 'message')
      .pipe(
        mergeMap(data => this.bindMessageHandler(data, handlers, process)),
        filter(result => result),
      )
      .subscribe(response => client.send(JSON.stringify(response)));
  }

  bindMessageHandler(
    buffer,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ): Observable<any> {
    const message = JSON.parse(buffer.data);
    const messageHandler = handlers.find(
      handler => handler.message === message.event,
    );
    if (!messageHandler) {
      return EMPTY;
    }
    return process(messageHandler.callback(message.data));
  }

  close(server) {
    server.close();
  }
}
`),t()()(),n(175,"blockquote",16)(176,"strong"),e(177,"Hint"),t(),e(178," When you want to take advantage of "),n(179,"a",15),e(180,"ws"),t(),e(181," library, use built-in "),n(182,"code"),e(183,"WsAdapter"),t(),e(184,` instead of creating your own one.
`),t(),n(185,"p"),e(186,"Then, we can set up a custom adapter using "),n(187,"code"),e(188,"useWebSocketAdapter()"),t(),e(189," method:"),t(),n(190,"app-copy-button",18)(191,"span",19),e(192),f(193,"extension"),s(194,"app-tabs",null,2),t(),n(196,"pre")(197,"code",13),e(198,`
const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new WsAdapter(app));
`),t()()(),n(199,"h4",20)(200,"span"),e(201,"Example"),t()(),n(202,"p"),e(203,"A working example that uses "),n(204,"code"),e(205,"WsAdapter"),t(),e(206," is available "),n(207,"a",21),e(208,"here"),t(),e(209,"."),t()()),l&2){let p=c(171),w=c(195);i(109),P("@WebSocketGateway(","{"," path: '/users' ","}",")"),i(32),P("","{"," event: string, data: any ","}"),i(27),u(" ",b(169,6,"ws-adapter",p.isJsActive),`
`),i(24),u(" ",b(193,9,"main",w.isJsActive),`
`)}},dependencies:[y,S,E,A],encapsulation:2,changeDetection:0})}return a})();var H=(()=>{class a extends g{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=h({type:a,selectors:[["app-exception-filters"]],features:[x],decls:84,vars:4,consts:[["contentReference",""],["app6c91337665480bd83fd8c5086453b4b0268a6971",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/websockets/exception-filters.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","exception-filters"],["routerLink","/exception-filters"],[1,"language-typescript"],[1,"info"],["appAnchor","","id","filters"],["appAnchor","","id","inheritance"],[1,"with-heading"],[1,"filename"]],template:function(l,d){if(l&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),s(4,"i",5),t()(),n(5,"h3",6),e(6,"Exception filters"),t(),n(7,"p"),e(8,"The only difference between the HTTP "),n(9,"a",7),e(10,"exception filter"),t(),e(11," layer and the corresponding web sockets layer is that instead of throwing "),n(12,"code"),e(13,"HttpException"),t(),e(14,", you should use "),n(15,"code"),e(16,"WsException"),t(),e(17,"."),t(),n(18,"app-copy-button")(19,"pre")(20,"code",8),e(21,`
throw new WsException('Invalid credentials.');
`),t()()(),n(22,"blockquote",9)(23,"strong"),e(24,"Hint"),t(),e(25," The "),n(26,"code"),e(27,"WsException"),t(),e(28," class is imported from the "),n(29,"code"),e(30,"@nestjs/websockets"),t(),e(31,` package.
`),t(),n(32,"p"),e(33,"With the sample above, Nest will handle the thrown exception and emit the "),n(34,"code"),e(35,"exception"),t(),e(36," message with the following structure:"),t(),n(37,"app-copy-button")(38,"pre")(39,"code",8),e(40,`
{
  status: 'error',
  message: 'Invalid credentials.'
}
`),t()()(),n(41,"h4",10)(42,"span"),e(43,"Filters"),t()(),n(44,"p"),e(45,"Web sockets exception filters behave equivalently to HTTP exception filters. The following example uses a manually instantiated method-scoped filter. Just as with HTTP based applications, you can also use gateway-scoped filters (i.e., prefix the gateway class with a "),n(46,"code"),e(47,"@UseFilters()"),t(),e(48," decorator)."),t(),n(49,"app-copy-button")(50,"pre")(51,"code",8),e(52,`
@UseFilters(new WsExceptionFilter())
@SubscribeMessage('events')
onEvent(client, data: any): WsResponse<any> {
  const event = 'events';
  return { event, data };
}
`),t()()(),n(53,"h4",11)(54,"span"),e(55,"Inheritance"),t()(),n(56,"p"),e(57,"Typically, you'll create fully customized exception filters crafted to fulfill your application requirements. However, there might be use-cases when you would like to simply extend the "),n(58,"strong"),e(59,"core exception filter"),t(),e(60,", and override the behavior based on certain factors."),t(),n(61,"p"),e(62,"In order to delegate exception processing to the base filter, you need to extend "),n(63,"code"),e(64,"BaseWsExceptionFilter"),t(),e(65," and call the inherited "),n(66,"code"),e(67,"catch()"),t(),e(68," method."),t(),n(69,"app-copy-button",12)(70,"span",13),s(71,"app-tabs",null,1),t(),n(73,"pre")(74,"code",8),e(75,`
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}
`),t()(),n(76,"pre")(77,"code",8),e(78,`
import { Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception, host) {
    super.catch(exception, host);
  }
}
`),t()()(),n(79,"p"),e(80,"The above implementation is just a shell demonstrating the approach. Your implementation of the extended exception filter would include your tailored "),n(81,"strong"),e(82,"business logic"),t(),e(83," (e.g., handling various conditions)."),t()()),l&2){let p=c(72);i(73),o("hide",p.isJsActive),i(3),o("hide",!p.isJsActive)}},dependencies:[v,S,y,E],encapsulation:2,changeDetection:0})}return a})();var J=(()=>{class a extends g{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=h({type:a,selectors:[["app-gateways"]],features:[x],decls:434,vars:64,consts:[["contentReference",""],["app471c014e8c629091a7344c0f9e4f1eb3dce001fc",""],["appc0b80b60ce71197f86fe0f68905c48e23ea7e003",""],["appbe40f7ce9811574c824ca2124c62426981b04595",""],["app2c2646600f2b61f6b8a479a05fb985796ba35214",""],["app75e8e03f3f9f45f8d052f3ced2df110cc788fefb",""],["app14875d4644bc6335a3276348bd5654e83bd2aea6",""],["appcef032113d6f48d838067ec6df724b63d69c6473",""],["appe15ca25b3bc4015cab91ffbcf1a2bf2061e2ef35",""],["appeb437b5c3887502ab610c4559deadad525472def",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/websockets/gateways.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","gateways"],["rel","nofollow","target","_blank","href","https://github.com/socketio/socket.io"],["rel","nofollow","target","_blank","href","https://github.com/websockets/ws"],["routerLink","/websockets/adapter"],["src","/assets/Gateways_1.png",1,"illustrative-image"],[1,"info"],["routerLink","/providers"],["appAnchor","","id","installation"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["appAnchor","","id","overview"],["rel","nofollow","target","_blank","href","https://socket.io/docs/v4/namespaces/"],[1,"warning"],["rel","nofollow","target","_blank","href","https://socket.io/docs/v4/server-options/"],["rel","nofollow","target","_blank","href","https://socket.io/docs/v4/server-api/#socket"],["appAnchor","","id","multiple-responses"],["appAnchor","","id","asynchronous-responses"],["appAnchor","","id","lifecycle-hooks"],["appAnchor","","id","server-and-namespace"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/02-gateways"]],template:function(l,d){if(l&1&&(n(0,"div",10,0)(2,"div",11)(3,"a",12),s(4,"i",13),t()(),n(5,"h3",14),e(6,"Gateways"),t(),n(7,"p"),e(8,"Most of the concepts discussed elsewhere in this documentation, such as dependency injection, decorators, exception filters, pipes, guards and interceptors, apply equally to gateways. Wherever possible, Nest abstracts implementation details so that the same components can run across HTTP-based platforms, WebSockets, and Microservices. This section covers the aspects of Nest that are specific to WebSockets."),t(),n(9,"p"),e(10,"In Nest, a gateway is simply a class annotated with "),n(11,"code"),e(12,"@WebSocketGateway()"),t(),e(13," decorator. Technically, gateways are platform-agnostic which makes them compatible with any WebSockets library once an adapter is created. There are two WS platforms supported out-of-the-box: "),n(14,"a",15),e(15,"socket.io"),t(),e(16," and "),n(17,"a",16),e(18,"ws"),t(),e(19,". You can choose the one that best suits your needs. Also, you can build your own adapter by following this "),n(20,"a",17),e(21,"guide"),t(),e(22,"."),t(),n(23,"figure"),s(24,"img",18),t(),n(25,"blockquote",19)(26,"strong"),e(27,"Hint"),t(),e(28," Gateways can be treated as "),n(29,"a",20),e(30,"providers"),t(),e(31,`; this means they can inject dependencies through the class constructor. Also, gateways can be injected by other classes (providers and controllers) as well.
`),t(),n(32,"h4",21)(33,"span"),e(34,"Installation"),t()(),n(35,"p"),e(36,"To start building WebSockets-based applications, first install the required package:"),t(),n(37,"app-copy-button",22)(38,"span",23),s(39,"app-tabs",null,1),t(),n(41,"pre")(42,"code",24),e(43,`
$ npm i --save @nestjs/websockets @nestjs/platform-socket.io
`),t()(),n(44,"pre")(45,"code",24),e(46,`
$ npm i --save @nestjs/websockets @nestjs/platform-socket.io
`),t()()(),n(47,"h4",25)(48,"span"),e(49,"Overview"),t()(),n(50,"p"),e(51,"In general, each gateway is listening on the same port as the "),n(52,"strong"),e(53,"HTTP server"),t(),e(54,", unless your app is not a web application, or you have changed the port manually. This default behavior can be modified by passing an argument to the "),n(55,"code"),e(56,"@WebSocketGateway(80)"),t(),e(57," decorator where "),n(58,"code"),e(59,"80"),t(),e(60," is a chosen port number. You can also set a "),n(61,"a",26),e(62,"namespace"),t(),e(63," used by the gateway using the following construction:"),t(),n(64,"app-copy-button")(65,"pre")(66,"code",24),e(67,`
@WebSocketGateway(80, { namespace: 'events' })
`),t()()(),n(68,"blockquote",27)(69,"strong"),e(70,"Warning"),t(),e(71,` Gateways are not instantiated until they are referenced in the providers array of an existing module.
`),t(),n(72,"p"),e(73,"You can pass any supported "),n(74,"a",28),e(75,"option"),t(),e(76," to the socket constructor with the second argument to the "),n(77,"code"),e(78,"@WebSocketGateway()"),t(),e(79," decorator, as shown below:"),t(),n(80,"app-copy-button")(81,"pre")(82,"code",24),e(83,`
@WebSocketGateway(81, { transports: ['websocket'] })
`),t()()(),n(84,"p"),e(85,"The gateway is now listening, but we have not yet subscribed to any incoming messages. Let's create a handler that will subscribe to the "),n(86,"code"),e(87,"events"),t(),e(88," messages and respond to the user with the exact same data."),t(),n(89,"app-copy-button",22)(90,"span",23),e(91),f(92,"extension"),s(93,"app-tabs",null,2),t(),n(95,"pre")(96,"code",24),e(97,`
@SubscribeMessage('events')
handleEvent(@MessageBody() data: string): string {
  return data;
}
`),t()(),n(98,"pre")(99,"code",24),e(100,`
@Bind(MessageBody())
@SubscribeMessage('events')
handleEvent(data) {
  return data;
}
`),t()()(),n(101,"blockquote",19)(102,"strong"),e(103,"Hint"),t(),n(104,"code"),e(105,"@SubscribeMessage()"),t(),e(106," and "),n(107,"code"),e(108,"@MessageBody()"),t(),e(109," decorators are imported from "),n(110,"code"),e(111,"@nestjs/websockets"),t(),e(112,` package.
`),t(),n(113,"p"),e(114,"Once the gateway is created, we can register it in our module."),t(),n(115,"app-copy-button",22)(116,"span",23),e(117),f(118,"extension"),s(119,"app-tabs",null,3),t(),n(121,"pre")(122,"code",24),e(123,`
@Module({
  providers: [EventsGateway]
})
export class EventsModule {}
`),t()()(),n(124,"p"),e(125,"You can also pass in a property key to the decorator to extract it from the incoming message body:"),t(),n(126,"app-copy-button",22)(127,"span",23),e(128),f(129,"extension"),s(130,"app-tabs",null,4),t(),n(132,"pre")(133,"code",24),e(134,`
@SubscribeMessage('events')
handleEvent(@MessageBody('id') id: number): number {
  // id === messageBody.id
  return id;
}
`),t()(),n(135,"pre")(136,"code",24),e(137,`
@Bind(MessageBody('id'))
@SubscribeMessage('events')
handleEvent(id) {
  // id === messageBody.id
  return id;
}
`),t()()(),n(138,"p"),e(139,"If you would prefer not to use decorators, the following code is functionally equivalent:"),t(),n(140,"app-copy-button",22)(141,"span",23),e(142),f(143,"extension"),s(144,"app-tabs",null,5),t(),n(146,"pre")(147,"code",24),e(148,`
@SubscribeMessage('events')
handleEvent(client: Socket, data: string): string {
  return data;
}
`),t()(),n(149,"pre")(150,"code",24),e(151,`
@SubscribeMessage('events')
handleEvent(client, data) {
  return data;
}
`),t()()(),n(152,"p"),e(153,"In the example above, the "),n(154,"code"),e(155,"handleEvent()"),t(),e(156," function takes two arguments. The first one is a platform-specific "),n(157,"a",29),e(158,"socket instance"),t(),e(159,", while the second one is the data received from the client. This approach is not recommended though, because it requires mocking the "),n(160,"code"),e(161,"socket"),t(),e(162," instance in each unit test."),t(),n(163,"p"),e(164,"Once the "),n(165,"code"),e(166,"events"),t(),e(167," message is received, the handler sends an acknowledgment with the same data that was sent over the network. In addition, it's possible to emit messages using a library-specific approach, for example, by making use of "),n(168,"code"),e(169,"client.emit()"),t(),e(170," method. In order to access a connected socket instance, use "),n(171,"code"),e(172,"@ConnectedSocket()"),t(),e(173," decorator."),t(),n(174,"app-copy-button",22)(175,"span",23),e(176),f(177,"extension"),s(178,"app-tabs",null,6),t(),n(180,"pre")(181,"code",24),e(182,`
@SubscribeMessage('events')
handleEvent(
  @MessageBody() data: string,
  @ConnectedSocket() client: Socket,
): string {
  return data;
}
`),t()(),n(183,"pre")(184,"code",24),e(185,`
@Bind(MessageBody(), ConnectedSocket())
@SubscribeMessage('events')
handleEvent(data, client) {
  return data;
}
`),t()()(),n(186,"blockquote",19)(187,"strong"),e(188,"Hint"),t(),n(189,"code"),e(190,"@ConnectedSocket()"),t(),e(191," decorator is imported from "),n(192,"code"),e(193,"@nestjs/websockets"),t(),e(194,` package.
`),t(),n(195,"p"),e(196,"However, in this case, you won't be able to leverage interceptors. If you don't want to respond to the user, you can simply skip the "),n(197,"code"),e(198,"return"),t(),e(199,' statement (or explicitly return a "falsy" value, e.g. '),n(200,"code"),e(201,"undefined"),t(),e(202,")."),t(),n(203,"p"),e(204,"Now when a client emits the message as follows:"),t(),n(205,"app-copy-button")(206,"pre")(207,"code",24),e(208,`
socket.emit('events', { name: 'Nest' });
`),t()()(),n(209,"p"),e(210,"The "),n(211,"code"),e(212,"handleEvent()"),t(),e(213," method will be executed. In order to listen for messages emitted from within the above handler, the client has to attach a corresponding acknowledgment listener:"),t(),n(214,"app-copy-button")(215,"pre")(216,"code",24),e(217,`
socket.emit('events', { name: 'Nest' }, (data) => console.log(data));
`),t()()(),n(218,"p"),e(219,"While returning a value from a message handler implicitly sends an acknowledgement, advanced scenarios often require direct control over the acknowledgement callback."),t(),n(220,"p"),e(221,"The "),n(222,"code"),e(223,"@Ack()"),t(),e(224," parameter decorator allows injecting the "),n(225,"code"),e(226,"ack"),t(),e(227,` callback function directly into a message handler.
Without using the decorator, this callback is passed as the third argument of the method.`),t(),n(228,"app-copy-button",22)(229,"span",23),e(230),f(231,"extension"),s(232,"app-tabs",null,7),t(),n(234,"pre")(235,"code",24),e(236,`
@SubscribeMessage('events')
handleEvent(
  @MessageBody() data: string,
  @Ack() ack: (response: { status: string; data: string }) => void,
) {
  ack({ status: 'received', data });
}
`),t()(),n(237,"pre")(238,"code",24),e(239,`
@Bind(MessageBody(), Ack())
@SubscribeMessage('events')
handleEvent(data, ack) {
  ack({ status: 'received', data });
}
`),t()()(),n(240,"h4",30)(241,"span"),e(242,"Multiple responses"),t()(),n(243,"p"),e(244,"The acknowledgment is dispatched only once. Furthermore, it is not supported by native WebSockets implementation. To solve this limitation, you may return an object which consists of two properties. The "),n(245,"code"),e(246,"event"),t(),e(247," which is a name of the emitted event and the "),n(248,"code"),e(249,"data"),t(),e(250," that has to be forwarded to the client."),t(),n(251,"app-copy-button",22)(252,"span",23),e(253),f(254,"extension"),s(255,"app-tabs",null,8),t(),n(257,"pre")(258,"code",24),e(259,`
@SubscribeMessage('events')
handleEvent(@MessageBody() data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
`),t()(),n(260,"pre")(261,"code",24),e(262,`
@Bind(MessageBody())
@SubscribeMessage('events')
handleEvent(data) {
  const event = 'events';
  return { event, data };
}
`),t()()(),n(263,"blockquote",19)(264,"strong"),e(265,"Hint"),t(),e(266," The "),n(267,"code"),e(268,"WsResponse"),t(),e(269," interface is imported from "),n(270,"code"),e(271,"@nestjs/websockets"),t(),e(272,` package.
`),t(),n(273,"blockquote",27)(274,"strong"),e(275,"Warning"),t(),e(276," You should return a class instance that implements "),n(277,"code"),e(278,"WsResponse"),t(),e(279," if your "),n(280,"code"),e(281,"data"),t(),e(282," field relies on "),n(283,"code"),e(284,"ClassSerializerInterceptor"),t(),e(285,`, as it ignores plain JavaScript object responses.
`),t(),n(286,"p"),e(287,"In order to listen for the incoming response(s), the client has to apply another event listener."),t(),n(288,"app-copy-button")(289,"pre")(290,"code",24),e(291,`
socket.on('events', (data) => console.log(data));
`),t()()(),n(292,"h4",31)(293,"span"),e(294,"Asynchronous responses"),t()(),n(295,"p"),e(296,"Message handlers are able to respond either synchronously or "),n(297,"strong"),e(298,"asynchronously"),t(),e(299,". Hence, "),n(300,"code"),e(301,"async"),t(),e(302," methods are supported. A message handler is also able to return an\xA0"),n(303,"code"),e(304,"Observable"),t(),e(305,", in which case the result values will be emitted until the stream is completed."),t(),n(306,"app-copy-button",22)(307,"span",23),e(308),f(309,"extension"),s(310,"app-tabs",null,9),t(),n(312,"pre")(313,"code",24),e(314,`
@SubscribeMessage('events')
onEvent(@MessageBody() data: unknown): Observable<WsResponse<number>> {
  const event = 'events';
  const response = [1, 2, 3];

  return from(response).pipe(
    map(data => ({ event, data })),
  );
}
`),t()(),n(315,"pre")(316,"code",24),e(317,`
@Bind(MessageBody())
@SubscribeMessage('events')
onEvent(data) {
  const event = 'events';
  const response = [1, 2, 3];

  return from(response).pipe(
    map(data => ({ event, data })),
  );
}
`),t()()(),n(318,"p"),e(319,"In the example above, the message handler will respond "),n(320,"strong"),e(321,"3 times"),t(),e(322," (with each item from the array)."),t(),n(323,"h4",32)(324,"span"),e(325,"Lifecycle hooks"),t()(),n(326,"p"),e(327,"There are 3 useful lifecycle hooks available. All of them have corresponding interfaces and are described in the following table:"),t(),n(328,"table")(329,"tr")(330,"td")(331,"code"),e(332,"OnGatewayInit"),t()(),n(333,"td"),e(334," Forces to implement the "),n(335,"code"),e(336,"afterInit()"),t(),e(337," method. Takes library-specific server instance as an argument (and spreads the rest if required). "),t()(),n(338,"tr")(339,"td")(340,"code"),e(341,"OnGatewayConnection"),t()(),n(342,"td"),e(343," Forces to implement the "),n(344,"code"),e(345,"handleConnection()"),t(),e(346," method. Takes library-specific client socket instance as an argument. "),t()(),n(347,"tr")(348,"td")(349,"code"),e(350,"OnGatewayDisconnect"),t()(),n(351,"td"),e(352," Forces to implement the "),n(353,"code"),e(354,"handleDisconnect()"),t(),e(355," method. Takes library-specific client socket instance as an argument. "),t()()(),n(356,"blockquote",19)(357,"strong"),e(358,"Hint"),t(),e(359," Each lifecycle interface is exposed from "),n(360,"code"),e(361,"@nestjs/websockets"),t(),e(362,` package.
`),t(),n(363,"h4",33)(364,"span"),e(365,"Server and Namespace"),t()(),n(366,"p"),e(367,"Occasionally, you may want to have a direct access to the native, "),n(368,"strong"),e(369,"platform-specific"),t(),e(370," server instance. The reference to this object is passed as an argument to the "),n(371,"code"),e(372,"afterInit()"),t(),e(373," method ("),n(374,"code"),e(375,"OnGatewayInit"),t(),e(376," interface). Another option is to use the "),n(377,"code"),e(378,"@WebSocketServer()"),t(),e(379," decorator."),t(),n(380,"app-copy-button")(381,"pre")(382,"code",24),e(383,`
@WebSocketServer()
server: Server;
`),t()()(),n(384,"p"),e(385,"Also, you can retrieve the corresponding namespace using the "),n(386,"code"),e(387,"namespace"),t(),e(388," attribute, as follows:"),t(),n(389,"app-copy-button")(390,"pre")(391,"code",24),e(392,`
@WebSocketGateway({ namespace: 'my-namespace' })
export class EventsGateway {
  @WebSocketServer()
  namespace: Namespace;
}
`),t()()(),n(393,"p")(394,"code"),e(395,"@WebSocketServer()"),t(),e(396," decorator injects a server instance by referencing the metadata stored by the "),n(397,"code"),e(398,"@WebSocketGateway()"),t(),e(399," decorator. If you provide the namespace option to the "),n(400,"code"),e(401,"@WebSocketGateway()"),t(),e(402," decorator, "),n(403,"code"),e(404,"@WebSocketServer()"),t(),e(405," decorator returns a "),n(406,"code"),e(407,"Namespace"),t(),e(408," instance instead of a "),n(409,"code"),e(410,"Server"),t(),e(411," instance."),t(),n(412,"blockquote",27)(413,"strong"),e(414,"Notice"),t(),e(415," The "),n(416,"code"),e(417,"@WebSocketServer()"),t(),e(418," decorator is imported from the "),n(419,"code"),e(420,"@nestjs/websockets"),t(),e(421,` package.
`),t(),n(422,"p"),e(423,"Nest will automatically assign the server instance to this property once it is ready to use."),t(),n(424,"p"),s(425,"app-banner-enterprise"),t(),n(426,"h4",34)(427,"span"),e(428,"Example"),t()(),n(429,"p"),e(430,"A working example is available "),n(431,"a",35),e(432,"here"),t(),e(433,"."),t()()),l&2){let p=c(40),w=c(94),R=c(120),C=c(131),W=c(145),T=c(179),I=c(233),M=c(256),B=c(311);i(41),o("hide",p.isJsActive),i(3),o("hide",!p.isJsActive),i(47),u(" ",b(92,40,"events.gateway",w.isJsActive),`
`),i(4),o("hide",w.isJsActive),i(3),o("hide",!w.isJsActive),i(19),u(" ",b(118,43,"events.module",R.isJsActive),`
`),i(11),u(" ",b(129,46,"events.gateway",C.isJsActive),`
`),i(4),o("hide",C.isJsActive),i(3),o("hide",!C.isJsActive),i(7),u(" ",b(143,49,"events.gateway",W.isJsActive),`
`),i(4),o("hide",W.isJsActive),i(3),o("hide",!W.isJsActive),i(27),u(" ",b(177,52,"events.gateway",T.isJsActive),`
`),i(4),o("hide",T.isJsActive),i(3),o("hide",!T.isJsActive),i(47),u(" ",b(231,55,"events.gateway",I.isJsActive),`
`),i(4),o("hide",I.isJsActive),i(3),o("hide",!I.isJsActive),i(16),u(" ",b(254,58,"events.gateway",M.isJsActive),`
`),i(4),o("hide",M.isJsActive),i(3),o("hide",!M.isJsActive),i(48),u(" ",b(309,61,"events.gateway",B.isJsActive),`
`),i(4),o("hide",B.isJsActive),i(3),o("hide",!B.isJsActive)}},dependencies:[v,y,S,E,F,A],encapsulation:2,changeDetection:0})}return a})();var D=(()=>{class a extends g{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=h({type:a,selectors:[["app-guards"]],features:[x],decls:46,vars:4,consts:[["contentReference",""],["appc22cd5d148a3a82b71c7a49286cc338c04053d9d",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/websockets/guards.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","guards"],["routerLink","/guards"],[1,"info"],["appAnchor","","id","binding-guards"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"]],template:function(l,d){if(l&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),s(4,"i",5),t()(),n(5,"h3",6),e(6,"Guards"),t(),n(7,"p"),e(8,"There is no fundamental difference between web sockets guards and "),n(9,"a",7),e(10,"regular HTTP application guards"),t(),e(11,". The only difference is that instead of throwing "),n(12,"code"),e(13,"HttpException"),t(),e(14,", you should use "),n(15,"code"),e(16,"WsException"),t(),e(17,"."),t(),n(18,"blockquote",8)(19,"strong"),e(20,"Hint"),t(),e(21," The "),n(22,"code"),e(23,"WsException"),t(),e(24," class is exposed from "),n(25,"code"),e(26,"@nestjs/websockets"),t(),e(27,` package.
`),t(),n(28,"h4",9)(29,"span"),e(30,"Binding guards"),t()(),n(31,"p"),e(32,"The following example uses a method-scoped guard. Just as with HTTP based applications, you can also use gateway-scoped guards (i.e., prefix the gateway class with a "),n(33,"code"),e(34,"@UseGuards()"),t(),e(35," decorator)."),t(),n(36,"app-copy-button",10)(37,"span",11),s(38,"app-tabs",null,1),t(),n(40,"pre")(41,"code",12),e(42,`
@UseGuards(AuthGuard)
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
`),t()(),n(43,"pre")(44,"code",12),e(45,`
@UseGuards(AuthGuard)
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
`),t()()()()),l&2){let p=c(39);i(40),o("hide",p.isJsActive),i(3),o("hide",!p.isJsActive)}},dependencies:[v,y,S,E],encapsulation:2,changeDetection:0})}return a})();var G=(()=>{class a extends g{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=h({type:a,selectors:[["app-interceptors"]],features:[x],decls:25,vars:4,consts:[["contentReference",""],["app0eb5da8333663ab570d23f4b2132f300a93fab70",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/websockets/interceptors.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","interceptors"],["routerLink","/interceptors"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"]],template:function(l,d){if(l&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),s(4,"i",5),t()(),n(5,"h3",6),e(6,"Interceptors"),t(),n(7,"p"),e(8,"There is no difference between "),n(9,"a",7),e(10,"regular interceptors"),t(),e(11," and web sockets interceptors. The following example uses a manually instantiated method-scoped interceptor. Just as with HTTP based applications, you can also use gateway-scoped interceptors (i.e., prefix the gateway class with a "),n(12,"code"),e(13,"@UseInterceptors()"),t(),e(14," decorator)."),t(),n(15,"app-copy-button",8)(16,"span",9),s(17,"app-tabs",null,1),t(),n(19,"pre")(20,"code",10),e(21,`
@UseInterceptors(new TransformInterceptor())
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
`),t()(),n(22,"pre")(23,"code",10),e(24,`
@UseInterceptors(new TransformInterceptor())
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
`),t()()()()),l&2){let p=c(18);i(19),o("hide",p.isJsActive),i(3),o("hide",!p.isJsActive)}},dependencies:[v,S,E],encapsulation:2,changeDetection:0})}return a})();var q=(()=>{class a extends g{static \u0275fac=(()=>{let r;return function(d){return(r||(r=m(a)))(d||a)}})();static \u0275cmp=h({type:a,selectors:[["app-pipes"]],features:[x],decls:52,vars:4,consts:[["contentReference",""],["app01746974781ff69dbfbb04c7a07baf8a80565eff",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/websockets/pipes.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","pipes"],["routerLink","/pipes"],[1,"info"],["appAnchor","","id","binding-pipes"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"]],template:function(l,d){if(l&1&&(n(0,"div",2,0)(2,"div",3)(3,"a",4),s(4,"i",5),t()(),n(5,"h3",6),e(6,"Pipes"),t(),n(7,"p"),e(8,"There is no fundamental difference between "),n(9,"a",7),e(10,"regular pipes"),t(),e(11," and web sockets pipes. The only difference is that instead of throwing "),n(12,"code"),e(13,"HttpException"),t(),e(14,", you should use "),n(15,"code"),e(16,"WsException"),t(),e(17,". In addition, all pipes will be only applied to the "),n(18,"code"),e(19,"data"),t(),e(20," parameter (because validating or transforming "),n(21,"code"),e(22,"client"),t(),e(23," instance is useless)."),t(),n(24,"blockquote",8)(25,"strong"),e(26,"Hint"),t(),e(27," The "),n(28,"code"),e(29,"WsException"),t(),e(30," class is exposed from "),n(31,"code"),e(32,"@nestjs/websockets"),t(),e(33,` package.
`),t(),n(34,"h4",9)(35,"span"),e(36,"Binding pipes"),t()(),n(37,"p"),e(38,"The following example uses a manually instantiated method-scoped pipe. Just as with HTTP based applications, you can also use gateway-scoped pipes (i.e., prefix the gateway class with a "),n(39,"code"),e(40,"@UsePipes()"),t(),e(41," decorator)."),t(),n(42,"app-copy-button",10)(43,"span",11),s(44,"app-tabs",null,1),t(),n(46,"pre")(47,"code",12),e(48,`
@UsePipes(new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }))
@SubscribeMessage('events')
handleEvent(client: Client, data: unknown): WsResponse<unknown> {
  const event = 'events';
  return { event, data };
}
`),t()(),n(49,"pre")(50,"code",12),e(51,`
@UsePipes(new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }))
@SubscribeMessage('events')
handleEvent(client, data) {
  const event = 'events';
  return { event, data };
}
`),t()()()()),l&2){let p=c(45);i(46),o("hide",p.isJsActive),i(3),o("hide",!p.isJsActive)}},dependencies:[v,y,S,E],encapsulation:2,changeDetection:0})}return a})();var Me=[{path:"gateways",component:J,data:{title:"Gateways"}},{path:"pipes",component:q,data:{title:"Pipes - Gateways"}},{path:"exception-filters",component:H,data:{title:"Exception Filters - Gateways"}},{path:"guards",component:D,data:{title:"Guards - Gateways"}},{path:"interceptors",component:G,data:{title:"Interceptors - Gateways"}},{path:"adapter",component:j,data:{title:"Adapter - Gateways"}}];export{Me as WEBSOCKETS_ROUTES};
