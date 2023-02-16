### Memphis

[Memphis](https://memphis.dev) is a modern, powerful, and open-source message broker. It is a real-time data processing platform. It is as simple as RabbitMQ, robust as Apache Kafka, and perfect for busy developers.

Memphis has 3 major entities: consumers, producers, and stations. Consumers and Producers receive and send messages through stations. Stations are like topics in Kafka or like queues in RabbitMQ.

#### Installation

To start building Memphis-based microservices, first install the required package:

```bash
$ npm i --save memphis-dev
```

#### Overview

Like other Nest microservice transport layer implementations, select the Memphis transporter mechanism using the `transport` property of the options object passed to the `createMicroservice()` method, along with a required `options` property, as shown below:

```typescript
@@filename(main)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.MEMPHIS,
  options: {
    host: 'localhost',
    username: 'root',
    connectionToken: 'memphis'
  }
});
@@switch
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.MEMPHIS,
  options: {
    host: 'localhost',
    username: 'root',
    connectionToken: 'memphis'
  }
});
```

> info **Hint** The `Transport` enum is imported from the `@nestjs/microservices` package.

#### Options

The `options` property is specific to the chosen transporter. The <strong>Memphis</strong> transporter exposes the properties described below. The first three are <strong>required</strong>.

<table>
  <tr>
    <td><code>host</code></td>
    <td>Connection host or domain name.</td>
  </tr>
  <tr>
    <td><code>username</code></td>
    <td>To identify the user the code will authenticate as.</td>
  </tr>
  <tr>
    <td><code>connectionToken</code></td>
    <td>For authenticating the user.</td>
  </tr>
  <tr>
    <td><code>port</code></td>
    <td>Port for the broker. Default is 6666.</td>
  </tr>
  <tr>
    <td><code>reconnect</code></td>
    <td>If <code>true</code>, keep retrying connection when lost. Default is <code>true</code>.</td>
  </tr> 
  <tr>
    <td><code>maxReconnect</code></td>
    <td>Number of retry attempts. Default is 3.</td>
  </tr>
  <tr>
    <td><code>reconnectIntervalMs</code></td>
    <td>Interval in miliseconds between reconnect attempts.</td>
  </tr>
  <tr>
    <td><code>timeoutMs</code></td>
    <td>Connection timeout in miliseconds.</td>
  </tr>
</table>

#### Decorator

You can create method handlers that will consume messages. Annotate these handlers with the `@ConsumeMesssage()` decorator. This decorator takes an options object that specifies the consumer behavior. The `consumerName` and `stationName` are required.

```typescript
@@filename(chat.controller)
@Controller()
export class ChatController {
  @ConsumeMessage({
    consumerName: '<consumer-name>',
    stationName: '<station-name>'
  })
  handleChats(message: Message, context: object): void {
    console.log(message.getData().toString());
    message.ack();
  }
}
@@switch
@Controller()
export class ChatController {
   @ConsumeMessage({
    consumerName: '<consumer-name>',
    stationName: '<station-name>'
  })
   handleChats(message, context) {
    console.log(message.getData().toString());
    message.ack();
  }
}
```

> info **Hint** The `@ConsumeMessage()` decorator is imported from the `@nestjs/microservices` package, while `Message` is from the `memphis-dev` package.

It is important to acknowledge broker messages (`message.ack()`). If you don't acknowledge them, Memphis will keep sending them till some defined limit. After the limit, unacknowledged messages are moved to <a  href="https://docs.memphis.dev/memphis/memphis/concepts/dead-letter" rel="nofollow" target="blank">Dead-Letter Stations (DLS)</a> from where you can retrieve or discard them.

Method handlers (annotated by `@ConsumeMessage()`) must be declared within controllers. Note that the Nest runtime simply ignores `@ConsumeMessage()` decorators defined within service files.

#### Client

There is a small difference in Memphis compared to other microservice transporters. Instead of the `ClientProxy` class, we use the `ClientMemphis` class.

Like other microservice transporters, you have <a href="https://docs.nestjs.com/microservices/basics#client">several options</a> for creating a `ClientMemphis` instance.

One method for creating an instance is to use the `ClientsModule`. To create a client instance with the `ClientsModule`, import it and use the `register()` method to pass an options object with the same properties shown above in the `createMicroservice()` method. This time, you have to add a `name` property that Nest will use as the injection token. Read more about `ClientsModule` <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MEMPHIS_SERVICE',
        transport: Transport.MEMPHIS,
        options: {
          host: 'localhost',
          username: 'root',
          connectionToken: 'memphis'
        }
      },
    ]),
  ]
  ...
})
```

Other options to create a client (either `ClientProxyFactory` or `@Client()`) can be used as well. You can read about them <a href="https://docs.nestjs.com/microservices/basics#client">here</a>.

The `ClientMemphis` class gives you access to methods like `consumer`, `producer`, and `station` (among others). Use each method to create (or access) the named entity. You can then use the entity as you wish in your codebase. The following is an example use of a producer.

```typescript
@@filename(chat.service)
@Injectable()
export class ChatService implements OnModuleInit {
  producer: Producer;

  constructor(
    @Inject('MEMPHIS_SERVICE') private readonly memphisService: ClientMemphis
  ) {}

  async onModuleInit(): Promise<void> {
    this.producer = await this.memphisService.producer({
      stationName: '<station-name>',
      producerName: '<producer-name>',
    });
  }

  async sendHello(): Promise<void> {
    await this.producer.produce({ message: Buffer.from('Hello World!') });
  }
}
```

> info **Hint** The `OnModuleInit` interface is imported from the `@nestjs/common` package, while `Producer` is from the `memphis-dev` package.

Initializing a producer (or other entities) in `OnModuleInit` is the safest place. It is a lifecycle hook that Memphis calls when it has initialized other dependencies and is now ready to do any async processes.

The name you gave the `register` method of the `ClientsModule` has to be the same name you will give the `@Inject` decorator. If you provide a different name, the Nest runtime will throw an error.

`ClientMemphis` permits you to create a consumer. You will want to create a consumer yourself when you want more control or will use the consumer instance frequently. Otherwise, the `@ConsumeMessage()` decorator should fulfill your needs.
