### Queues

Queues allow you to defer the processing of a time consuming task, such as audio transcoding or sending an email, until a later time. For queues, Nest provides integration with [Bull](https://github.com/OptimalBits/bull) package out-of-the box with `@nestjs/bull`, which we'll cover in the current chapter. Bull is a Redis-based queue for Node.js carefully written for rock solid stability and atomicity.

#### Installation

To begin using it, we first install the required dependencies.

```bash
$ npm install --save @nestjs/bull bull
$ npm install --save-dev @types/bull
```

Once the installation process is complete, we can import the `BullModule` into the root `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

The `registerQueue()` method allows to create either single or multiple queues at once based on the configuration objects. The configuration object will be passed down into the `Queue` constructor from the Bull package (read more [here](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue)). Here, we assumed that Redis database is listening on host `localhost` and port `6379` (the default settings).

Every `BullModule.registerQueue()` call will create a new queue referred by its instantiation name (the `name` property). Queue can have many producers, many consumers, and many listeners. Also, you can have one or more workers consuming jobs from the queue, which will consume the jobs in a given order: FIFO (the default), LIFO or according to priorities.

#### Producers

To add a job to a queue, first inject the queue as follows:

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private readonly audioQueue: Queue) {}
}
```

> info **Hint** Notice that we are referring the queue by its instantiation name `audio`.

Now, call `add()` method with the job details as an argument.

```typescript
const job = await this.audioQueue.add({
  foo: 'bar',
});
```

Jobs are represented as serializable, JavaScript objects (since that is how they are going to be stored in Redis database).

#### Consumers

A consumer processes jobs added into the queue. In order to define a consumer class, use the `@Processor()` decorator as follows:

```typescript
import { Processor } from '@nestjs/bull';

@Processor('audio')
export class AudioConsumer {}
```

Where `audio` is the name of the queue.

Now, define a job listener inside the `AudioConsumer` class:

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')
export class AudioConsumer {
  @Process()
  async transcode(job: Job<unknown>) {
    let progress = 0;
    for (i = 0; i < 100; i++) {
      await doSomething(job.data);
      progress += 10;
      job.progress(progress);
    }
    return {};
  }
}
```

The `transcode` function will be called every time the worker is idling and there are jobs to process in the queue. The value returned by your process function will be stored in the jobs object and can be accessed later on, for example in a listener for the completed event.

#### Event listeners

Bull generates a set of useful events. Events can be local for a given queue instance or global. In order to listen to emitted events, use the dedicated decorators:

```typescript
@OnQueueActive()
onActive(job: Job) {
  console.log(
    `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
  );
}
```

Nest provides a set of decorators that allow subscribing to some standard events. These are exposed from the `@nestjs/bull` package:

- `@OnQueueError()`
- `@OnQueueWaiting()`
- `@OnQueueActive()`
- `@OnQueueStalled()`
- `@OnQueueProgress()`
- `@OnQueueCompleted()`
- `@OnQueueFailed()`
- `@OnQueuePaused()`
- `@OnQueueResumed()`
- `@OnQueueCleaned()`
- `@OnQueueDrained()`
- `@OnQueueRemoved()`
- `@OnGlobalQueueError()`
- `@OnGlobalQueueWaiting()`
- `@OnGlobalQueueActive()`
- `@OnGlobalQueueStalled()`
- `@OnGlobalQueueProgress()`
- `@OnGlobalQueueCompleted()`
- `@OnGlobalQueueFailed()`
- `@OnGlobalQueuePaused()`
- `@OnGlobalQueueResumed()`
- `@OnGlobalQueueCleaned()`
- `@OnGlobalQueueDrained()`
- `@OnGlobalQueueRemoved()`

You can also use `@OnQueueEvent()` in combination with either `BullQueueEvents` and `BullQueueGlobalEvents` enums. Read more about events [here](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#events).

#### Named jobs

Jobs may have unique names that can be used for clearer code.

```typescript
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
```

And on the consumer side:

```typescript
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
```

#### Job options

To delay the job a certain amount of time before it will be processed, use the `delay` configuration property.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { delay: 3000 }, // 3 seconds delayed
);
```

To use **LIFO** (Last In First Out) mode, set the `lifo` property of the configuration object to `true`.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { lifo: true },
);
```

To prioritize jobs, use the `priority` property as follows:

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { priority: 2 },
);
```

> info **Hint** Highest priority is 1, and lower the larger integer you use.

> warning **Warning** Priority queues are a bit slower than a standard queue.

#### Pause & resume

You can pause and resume your queues. A paused queue will not process new jobs until resumed, but current jobs being processed will continue until they are finalized.

```typescript
await job.pause();
```

In order to resume a paused queue, use the `resume()` method, as follows:

```typescript
await job.resume();
```

#### Reference

For more information and examples, we recommend looking at the official [REFERENCE](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#events) document

#### Async configuration

You may want to pass your queue options asynchronously instead of statically. In this case, use the `registerQueueAsync()` method, which provides several ways to deal with async configuration.

One approach is to use a factory function:

```typescript
BullModule.registerQueueAsync({
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

Our factory behaves like any other [asynchronous provider](https://docs.nestjs.com/fundamentals/async-providers) (e.g., it can be `async` and it's able to inject dependencies through `inject`).

```typescript
BullModule.registerQueueAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    redis: {
      host: configService.get('QUEUE_HOST'),
      port: +configService.get('QUEUE_PORT'),
    },
  }),
  inject: [ConfigService],
});
```

Alternatively, you can use the `useClass` syntax:

```typescript
BullModule.registerQueueAsync({
  useClass: BullConfigService,
});
```

The construction above will instantiate `BullConfigService` inside `BullModule` and use it to provide an options object by calling `createBullOptions()`. Note that this means that the `BullConfigService` has to implement the `BullOptionsFactory` interface, as shown below:

```typescript
@Injectable()
class BullConfigService implements BullOptionsFactory {
  createBullOptions(): BullModuleOptions {
    return {
      redis: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
```

In order to prevent the creation of `BullConfigService` inside `BullModule` and use a provider imported from a different module, you can use the `useExisting` syntax.

```typescript
BullModule.registerQueueAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

This construction works the same as `useClass` with one critical difference - `BullModule` will lookup imported modules to reuse an existing `ConfigService` instead of instantiating a new one.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/26-queues).
