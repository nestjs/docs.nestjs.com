### Queues

Queues are a design pattern that helps you deal with common application scaling and performance challenges. Some examples of problems that queues can help you solve are:

- Smooth out processing peaks. For example, if users can initiate resource-intensive tasks at arbitrary times, you can add these tasks to a queue instead of performing them synchronously. Worker processes then pull tasks from the queue in a controlled manner. As the application grows, you can add queue consumers to scale up back-end task handling.
- Break up monolithic tasks that may otherwise block the Node.js event loop. For example, if a user request requires CPU-intensive work like audio transcoding, you can delegate this task to other processes, so user-facing processes remain responsive.
- Provide a reliable communication channel across services. For example, you can queue tasks (jobs) in one process or service and consume them in another. By listening for status events, any process or service can be notified of completion, errors, or other state changes in the job lifecycle. When queue producers or consumers fail, their state is preserved, and task handling can resume automatically when nodes restart.

Nest provides the `@nestjs/bullmq` package for BullMQ integration and the `@nestjs/bull` package for Bull integration. Both packages wrap their respective libraries, which are developed by the same team. Bull is in maintenance mode (the team only fixes bugs), while BullMQ is actively developed and offers a modern TypeScript implementation with a different set of features. If Bull meets your requirements, it remains a reliable, battle-tested choice.

Both BullMQ and Bull use [Redis](https://redis.io/) to persist job data, so you need a running Redis instance. Because they are Redis-backed, your queue architecture can be fully distributed and platform-independent. For example, you can run some queue <a href="application/queues#producers">producers</a>, <a href="application/queues#consumers">consumers</a>, and <a href="application/queues#event-listeners">listeners</a> in Nest on one or more nodes, and other producers, consumers, and listeners on other Node.js platforms on other network nodes.

This chapter covers the `@nestjs/bullmq` and `@nestjs/bull` packages. For more background and implementation details, see the [BullMQ documentation](https://docs.bullmq.io/) and the [Bull reference](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md).

#### BullMQ installation

To begin using BullMQ, install the required dependencies.

```bash
$ npm install --save @nestjs/bullmq bullmq
```

Once the installation process is complete, import the `BullModule` into the root `AppModule`.

```typescript
@@filename(app.module)
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
```

The `forRoot()` method registers a `bullmq` configuration object that all queues registered in the application use (unless specified otherwise). The following are a few of the configuration properties:

- `connection: ConnectionOptions` - Options to configure the Redis connection. See [Connections](https://docs.bullmq.io/guide/connections) for more information.
- `prefix: string` - Prefix for all queue keys (defaults to `bull`).
- `defaultJobOptions: DefaultJobOptions` - Default settings for new jobs. See [DefaultJobOptions](https://docs.bullmq.io/api/interfaces/v6.DefaultJobOptions.html) for more information. These don't take effect for jobs added through a `FlowProducer`; see [bullmq#1034](https://github.com/taskforcesh/bullmq/issues/1034) for an explanation.
- `settings: AdvancedRepeatOptions` - Advanced settings for repeatable jobs. These should usually not be changed. See [AdvancedRepeatOptions](https://docs.bullmq.io/api/interfaces/v6.AdvancedRepeatOptions.html) for more information.
- `extraOptions` - Extra options for module initialization. See [Manual registration](/application/queues#manual-registration).

All options are optional. Apart from `extraOptions`, they are passed directly to the BullMQ `Queue` constructor. See the [QueueOptions API reference](https://docs.bullmq.io/api/interfaces/v6.QueueOptions.html) for the complete list.

To register a queue, import the `BullModule.registerQueue()` dynamic module, as follows:

```typescript
BullModule.registerQueue({
  name: 'audio',
});
```

> info **Hint** Create multiple queues by passing multiple configuration objects (as separate arguments) to the `registerQueue()` method.

The `registerQueue()` method instantiates and/or registers queues. Queues are shared across modules and processes that connect to the same underlying Redis database with the same credentials. Each queue is identified by its `name` property. The queue name serves both as an injection token (for injecting the queue into controllers and providers) and as an argument to decorators that associate consumer classes and listeners with queues.

You can also override some of the preconfigured options for a specific queue, as follows:

```typescript
BullModule.registerQueue({
  name: 'audio',
  connection: {
    port: 6380,
  },
});
```

BullMQ also supports parent-child relationships between jobs. This enables flows, where jobs are the nodes of trees of arbitrary depth. See [Flows](https://docs.bullmq.io/guide/flows) in the BullMQ documentation to learn more.

To register a flow producer, use the `registerFlowProducer()` method:

```typescript
BullModule.registerFlowProducer({
  name: 'flowProducerName',
});
```

Because jobs are persisted in Redis, each time a named queue is instantiated (e.g., when an app starts or restarts), it attempts to process any old jobs left over from a previous unfinished session.

Each queue can have one or many producers, consumers, and listeners. Consumers retrieve jobs from the queue in a specific order: FIFO (the default), LIFO, or according to priorities. The <a href="application/queues#job-options">job options</a> section explains how to control the processing order.

<app-banner-enterprise></app-banner-enterprise>

#### Named configurations

If your queues connect to multiple Redis instances, you can use a technique called **named configurations**. This feature lets you register several configurations under specified keys, which you can then refer to in the queue options.

For example, assuming you have an additional Redis instance (apart from the default one) used by a few queues in your application, you can register its configuration as follows:

```typescript
BullModule.forRoot('alternative-config', {
  connection: {
    port: 6381,
  },
});
```

In the example above, `'alternative-config'` is a configuration key (it can be any string).

You can now point to this configuration in the `registerQueue()` options object:

```typescript
BullModule.registerQueue({
  configKey: 'alternative-config',
  name: 'video',
});
```

#### Producers

Job producers add jobs to queues. Producers are typically application services (Nest [providers](/providers)). To add jobs to a queue, first inject the queue into the service:

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}
}
```

> info **Hint** The `@InjectQueue()` decorator identifies the queue by its name, as provided in the `registerQueue()` method call (e.g., `'audio'`).

Now, add a job by calling the queue's `add()` method, passing a job name and a user-defined data object. Job data must be serializable, because jobs are stored in Redis. The shape of the data is arbitrary; use it to represent the semantics of your job. The name lets a <a href="application/queues#consumers">consumer</a> tell different kinds of jobs apart.

```typescript
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
```

#### Job options

Jobs can have additional options associated with them. Pass an options object as the third argument of the `Queue.add()` method, after the job data. Some of the job options are:

- `priority`: `number` - Priority value, from 0 to 2,097,151. `0` (the default) means no explicit priority; jobs without a priority are processed before prioritized jobs, and among prioritized jobs, lower numbers are processed first. Using priorities has a slight impact on performance, so use them only when required.
- `delay`: `number` - Time (in milliseconds) to wait until this job can be processed. For accurate delays, workers and producers should have their clocks synchronized.
- `attempts`: `number` - The total number of attempts to try the job until it completes (defaults to 1).
- `backoff`: `number | BackoffOptions` - Backoff setting for automatic retries if the job fails. See [BackoffOptions](https://docs.bullmq.io/api/interfaces/v6.BackoffOptions.html).
- `lifo`: `boolean` - If `true`, adds the job to the right end of the queue instead of the left (default `false`).
- `jobId`: `string` - Overrides the job ID. By default, the job ID is a unique integer. If you use this option, it's up to you to ensure the ID is unique. A job with an ID that already exists is not added.
- `removeOnComplete`: `boolean | number | KeepJobs` - If `true`, removes the job when it successfully completes. A number specifies how many jobs to keep, and a `KeepJobs` object specifies a maximum age and/or count. By default, the job is kept in the completed set.
- `removeOnFail`: `boolean | number | KeepJobs` - If `true`, removes the job when it fails after all attempts. A number or `KeepJobs` object works as for `removeOnComplete`. By default, the job is kept in the failed set.
- `stackTraceLimit`: `number` - Limits the number of stack trace lines recorded for a failed job.

> info **Hint** BullMQ no longer accepts a `repeat` option in `Queue.add()`. To run a job repeatedly (e.g., on a cron pattern), create a job scheduler with the `Queue#upsertJobScheduler()` method. See [Job Schedulers](https://docs.bullmq.io/guide/job-schedulers) in the BullMQ documentation.

Here are a few examples of customizing jobs with job options.

To delay the start of a job, use the `delay` property.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { delay: 3000 }, // 3 seconds delayed
);
```

To add a job to the right end of the queue (i.e., process it as **LIFO**, Last In First Out), set the `lifo` property to `true`.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { lifo: true },
);
```

To prioritize a job, use the `priority` property.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { priority: 2 },
);
```

For the full list of options, see the [JobsOptions](https://docs.bullmq.io/api/types/v6.JobsOptions.html) and [BaseJobOptions](https://docs.bullmq.io/api/interfaces/v6.BaseJobOptions.html) API references.

#### Consumers

A consumer is a **class** defining methods that process jobs added to the queue, listen for events on the queue, or both. Declare a consumer class using the `@Processor()` decorator as follows:

```typescript
import { Processor } from '@nestjs/bullmq';

@Processor('audio')
export class AudioConsumer {}
```

> info **Hint** Consumers must be registered as `providers` so the `@nestjs/bullmq` package can pick them up.

The decorator's string argument (e.g., `'audio'`) is the name of the queue to associate with the class. The consumer class must extend `WorkerHost` and implement its `process()` method:

```typescript
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
```

The `process()` method is called whenever the worker is idle and there are jobs to process in the queue. It receives the `job` object as its only argument. The value it returns is stored in the job object and can be accessed later, for example, in a listener for the `completed` event.

`Job` objects have multiple methods that allow you to interact with their state. For example, the code above uses the `updateProgress()` method to update the job's progress. See the [Job API reference](https://docs.bullmq.io/api/classes/v6.Job.html) for the complete list.

In Bull, you could designate that a job handler method handles **only** jobs of a certain type (jobs with a specific `name`) by passing that `name` to the `@Process()` decorator, as shown below.

> warning **Warning** This doesn't work with BullMQ. Read on for the BullMQ approach.

```typescript
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
```

BullMQ doesn't support this behavior, because it caused confusion. Instead, use a `switch` statement on the job name to call different services or logic for each kind of job:

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'transcode': {
        let progress = 0;
        for (let i = 0; i < 100; i++) {
          await doSomething(job.data);
          progress += 1;
          await job.updateProgress(progress);
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
```

This is covered in the [named processor](https://docs.bullmq.io/patterns/named-processor) section of the BullMQ documentation.

#### Request-scoped consumers

When a consumer is flagged as request-scoped (see [injection scopes](/fundamentals/injection-scopes#provider-scope)), a new instance of the class is created exclusively for each job. The instance is garbage-collected after the job completes.

```typescript
@Processor({
  name: 'audio',
  scope: Scope.REQUEST,
})
```

Because request-scoped consumer classes are instantiated dynamically and scoped to a single job, you can inject the current job through the constructor using the `JOB_REF` token.

```typescript
constructor(@Inject(JOB_REF) jobRef: Job) {
  console.log(jobRef);
}
```

> info **Hint** The `JOB_REF` token is imported from the `@nestjs/bullmq` package.

#### Event listeners

BullMQ emits a set of events when queue and/or job state changes occur. You can subscribe to these events at the worker level using the `@OnWorkerEvent(event)` decorator, or at the queue level with a dedicated listener class and the `@OnQueueEvent(event)` decorator.

Worker events must be declared within a <a href="application/queues#consumers">consumer</a> class (i.e., within a class decorated with the `@Processor()` decorator). To listen for an event, use the `@OnWorkerEvent(event)` decorator with the event you want to handle. For example, to listen to the event emitted when a job enters the active state in the `audio` queue, use the following construct:

```typescript
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer extends WorkerHost {
  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  // ...
}
```

The complete list of worker events and their arguments is available as the properties of the [WorkerListener](https://docs.bullmq.io/api/interfaces/v6.WorkerListener.html) interface.

Queue event listeners must use the `@QueueEventsListener(queue)` decorator and extend the `QueueEventsHost` class provided by `@nestjs/bullmq`. To listen for an event, use the `@OnQueueEvent(event)` decorator with the event you want to handle. For example, to listen to the event emitted when a job enters the active state in the `audio` queue, use the following construct:

```typescript
import {
  QueueEventsHost,
  QueueEventsListener,
  OnQueueEvent,
} from '@nestjs/bullmq';

@QueueEventsListener('audio')
export class AudioEventsListener extends QueueEventsHost {
  @OnQueueEvent('active')
  onActive(job: { jobId: string; prev?: string }) {
    console.log(`Processing job ${job.jobId}...`);
  }

  // ...
}
```

> info **Hint** Queue event listeners must be registered as `providers` so the `@nestjs/bullmq` package can pick them up.

The complete list of queue events and their arguments is available as the properties of the [QueueEventsListener](https://docs.bullmq.io/api/interfaces/v6.QueueEventsListener.html) interface.

#### Queue management

Queues have an API for management functions such as pausing and resuming, and retrieving the count of jobs in various states. See the [Queue API reference](https://docs.bullmq.io/api/classes/v6.Queue.html) for the full API. Invoke these methods directly on the `Queue` object, as shown in the pause and resume examples below.

Pause a queue with the `pause()` method. A paused queue doesn't process new jobs until it's resumed, but jobs already being processed continue until they finish.

```typescript
await audioQueue.pause();
```

To resume a paused queue, use the `resume()` method, as follows:

```typescript
await audioQueue.resume();
```

#### Observing queues in production

Queues fail in ways that HTTP endpoints don't. A job doesn't return a status code to an impatient user. It retries quietly, three times, with backoff, and the only symptom is that something downstream never happened. The two questions that matter are therefore *"is this queue keeping up?"* and *"did that job run at all?"*, and the consumer's own logs can't answer either of them.

[NestJS Observe](https://www.observe.nestjs.com/ 'NestJS Observe') instruments queue consumers automatically, the same way it instruments controllers: `@Processor()` classes and their handlers are recognized as jobs, so no manual span wiring is needed:

- **Queue wait time is measured separately from execution time.** A job that takes 200 ms to run but sat in the queue for four minutes is a capacity problem, not a slow handler. The two numbers are reported side by side, so you can tell which one you have.
- **Attempts and failure reasons are recorded per run.** You see that a job succeeded on attempt 3 rather than seeing only the success, which is usually the difference between "fine" and "quietly degrading".
- **Silence is alertable.** A *job silence* rule fires when a named job hasn't reported for longer than a tolerance you choose. That's how you find out that the nightly billing consumer stopped running on the night it stops, rather than at the end of the month.

Failed jobs carry the same error card as failed requests: the resolved stack trace with source lines, the logs written during the run, and the waterfall of what the job did before it threw. See the [Observability](/observability/overview) chapter for setup.

#### Separate processes

Job handlers can also run in a separate (forked) process (see [Sandboxed processors](https://docs.bullmq.io/guide/workers/sandboxed-processors) in the BullMQ documentation). This has several advantages:

- The process is sandboxed, so if it crashes, the worker isn't affected.
- You can run blocking code without affecting the queue (jobs don't stall).
- Better utilization of multi-core CPUs.
- Fewer connections to Redis.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'node:path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [join(import.meta.dirname, 'processor.js')],
    }),
  ],
})
export class AppModule {}
```

> warning **Warning** Because your function runs in a forked process, dependency injection (and the IoC container) isn't available. Your processor function must contain (or create) all instances of the external dependencies it needs.

#### Async configuration

You may want to pass `bullmq` options asynchronously instead of statically. In this case, use the `forRootAsync()` method, which provides several ways to handle async configuration. Likewise, to pass queue options asynchronously, use the `registerQueueAsync()` method.

One approach is to use a factory function:

```typescript
BullModule.forRootAsync({
  useFactory: () => ({
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

The factory behaves like any other [asynchronous provider](/fundamentals/async-providers) (e.g., it can be `async` and can inject dependencies through `inject`).

```typescript
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
```

Alternatively, you can use the `useClass` syntax:

```typescript
BullModule.forRootAsync({
  useClass: BullConfigService,
});
```

The construction above instantiates `BullConfigService` inside `BullModule` and uses it to provide an options object by calling `createSharedConfiguration()`. This means `BullConfigService` has to implement the `SharedBullConfigurationFactory` interface, as shown below:

```typescript
@Injectable()
class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullRootModuleOptions {
    return {
      connection: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
```

To reuse a provider imported from a different module instead of creating `BullConfigService` inside `BullModule`, use the `useExisting` syntax.

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

This construction works the same as `useClass` with one critical difference: `BullModule` looks up imported modules to reuse an existing `ConfigService` instead of instantiating a new one.

Likewise, to pass queue options asynchronously, use the `registerQueueAsync()` method. Specify the `name` attribute outside the factory function.

```typescript
BullModule.registerQueueAsync({
  name: 'audio',
  useFactory: () => ({
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

#### Manual registration

By default, `BullModule` automatically registers BullMQ components (queues, processors, and event listener services) in the `onModuleInit` lifecycle hook. In some cases, this behavior isn't what you want. To prevent automatic registration, enable `manualRegistration` in `BullModule`:

```typescript
BullModule.forRoot({
  extraOptions: {
    manualRegistration: true,
  },
});
```

To register these components manually, inject `BullRegistrar` and call its `register()` method, ideally within the `onModuleInit()` or `onApplicationBootstrap()` lifecycle hook.

```typescript
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
```

Until you call `BullRegistrar#register()`, no BullMQ components work, which means no jobs are processed.

#### Bull installation

> info **Note** If you use BullMQ, skip this section and the ones that follow.

To begin using Bull, install the required dependencies.

```bash
$ npm install --save @nestjs/bull bull
```

Once the installation process is complete, import the `BullModule` into the root `AppModule`.

```typescript
@@filename(app.module)
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
```

The `forRoot()` method registers a `bull` configuration object that all queues registered in the application use (unless specified otherwise). A configuration object consists of the following properties (all optional):

- `limiter: RateLimiter` - Options to control the rate at which the queue's jobs are processed. See [RateLimiter](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) for more information.
- `redis: RedisOpts` - Options to configure the Redis connection. See [RedisOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) for more information.
- `prefix: string` - Prefix for all queue keys.
- `defaultJobOptions: JobOpts` - Options to control the default settings for new jobs. See [JobOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd) for more information.
- `settings: AdvancedSettings` - Advanced queue configuration settings. These should usually not be changed. See [AdvancedSettings](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) for more information.

These options are passed directly to the Bull `Queue` constructor. See the [Queue section of the Bull reference](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) for details.

To register a queue, import the `BullModule.registerQueue()` dynamic module, as follows:

```typescript
BullModule.registerQueue({
  name: 'audio',
});
```

> info **Hint** Create multiple queues by passing multiple configuration objects (as separate arguments) to the `registerQueue()` method.

The `registerQueue()` method instantiates and/or registers queues. Queues are shared across modules and processes that connect to the same underlying Redis database with the same credentials. Each queue is identified by its `name` property. The queue name serves both as an injection token (for injecting the queue into controllers and providers) and as an argument to decorators that associate consumer classes and listeners with queues.

You can also override some of the preconfigured options for a specific queue, as follows:

```typescript
BullModule.registerQueue({
  name: 'audio',
  redis: {
    port: 6380,
  },
});
```

Because jobs are persisted in Redis, each time a named queue is instantiated (e.g., when an app starts or restarts), it attempts to process any old jobs left over from a previous unfinished session.

Each queue can have one or many producers, consumers, and listeners. Consumers retrieve jobs from the queue in a specific order: FIFO (the default), LIFO, or according to priorities. The <a href="application/queues#job-options">job options</a> section explains how to control the processing order.

<app-banner-enterprise></app-banner-enterprise>

#### Named configurations

If your queues connect to multiple Redis instances, you can use a technique called **named configurations**. This feature lets you register several configurations under specified keys, which you can then refer to in the queue options.

For example, assuming you have an additional Redis instance (apart from the default one) used by a few queues in your application, you can register its configuration as follows:

```typescript
BullModule.forRoot('alternative-config', {
  redis: {
    port: 6381,
  },
});
```

In the example above, `'alternative-config'` is a configuration key (it can be any string).

You can now point to this configuration in the `registerQueue()` options object:

```typescript
BullModule.registerQueue({
  configKey: 'alternative-config',
  name: 'video',
});
```

#### Producers

Job producers add jobs to queues. Producers are typically application services (Nest [providers](/providers)). To add jobs to a queue, first inject the queue into the service:

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}
}
```

> info **Hint** The `@InjectQueue()` decorator identifies the queue by its name, as provided in the `registerQueue()` method call (e.g., `'audio'`).

Now, add a job by calling the queue's `add()` method, passing a user-defined data object. Job data must be serializable, because jobs are stored in Redis. The shape of the data is arbitrary; use it to represent the semantics of your job.

```typescript
const job = await this.audioQueue.add({
  foo: 'bar',
});
```

#### Named jobs

Jobs can have names. This lets you create specialized <a href="application/queues#consumers">consumers</a> that only process jobs with a given name.

```typescript
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
```

> warning **Warning** When using named jobs, you must create a processor for each unique name added to a queue, or the queue reports that a processor for the given job is missing. See <a href="application/queues#consumers">consumers</a> for more information on consuming named jobs.

#### Job options

Jobs can have additional options associated with them. Pass an options object after the job data in the `Queue.add()` method. The job options are:

- `priority`: `number` - Optional priority value. Ranges from 1 (highest priority) to MAX_INT (lowest priority). Using priorities has a slight impact on performance, so use them with caution.
- `delay`: `number` - Time (in milliseconds) to wait until this job can be processed. For accurate delays, both server and clients should have their clocks synchronized.
- `attempts`: `number` - The total number of attempts to try the job until it completes.
- `repeat`: `RepeatOpts` - Repeats the job according to a cron specification. See [RepeatOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `backoff`: `number | BackoffOpts` - Backoff setting for automatic retries if the job fails. See [BackoffOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `lifo`: `boolean` - If `true`, adds the job to the right end of the queue instead of the left (default `false`).
- `timeout`: `number` - The number of milliseconds after which the job fails with a timeout error.
- `jobId`: `number | string` - Overrides the job ID. By default, the job ID is a unique integer. If you use this option, it's up to you to ensure the ID is unique. A job with an ID that already exists is not added.
- `removeOnComplete`: `boolean | number` - If `true`, removes the job when it successfully completes. A number specifies how many jobs to keep. By default, the job is kept in the completed set.
- `removeOnFail`: `boolean | number` - If `true`, removes the job when it fails after all attempts. A number specifies how many jobs to keep. By default, the job is kept in the failed set.
- `stackTraceLimit`: `number` - Limits the number of stack trace lines recorded for a failed job.

Here are a few examples of customizing jobs with job options.

To delay the start of a job, use the `delay` property.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { delay: 3000 }, // 3 seconds delayed
);
```

To add a job to the right end of the queue (i.e., process it as **LIFO**, Last In First Out), set the `lifo` property to `true`.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { lifo: true },
);
```

To prioritize a job, use the `priority` property.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { priority: 2 },
);
```

#### Consumers

A consumer is a **class** defining methods that process jobs added to the queue, listen for events on the queue, or both. Declare a consumer class using the `@Processor()` decorator as follows:

```typescript
import { Processor } from '@nestjs/bull';

@Processor('audio')
export class AudioConsumer {}
```

> info **Hint** Consumers must be registered as `providers` so the `@nestjs/bull` package can pick them up.

The decorator's string argument (e.g., `'audio'`) is the name of the queue to associate with the class methods.

Within a consumer class, declare job handlers by decorating handler methods with the `@Process()` decorator.

```typescript
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
```

The decorated method (e.g., `transcode()`) is called whenever the worker is idle and there are jobs to process in the queue. It receives the `job` object as its only argument. The value it returns is stored in the job object and can be accessed later, for example, in a listener for the `completed` event.

`Job` objects have multiple methods that allow you to interact with their state. For example, the code above uses the `progress()` method to update the job's progress. See the [Job section of the Bull reference](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#job) for the complete `Job` API.

You can designate that a job handler method handles **only** jobs of a certain type (jobs with a specific `name`) by passing that `name` to the `@Process()` decorator, as shown below. A consumer class can have multiple `@Process()` handlers, one for each job type (`name`). When you use named jobs, make sure there is a handler for each name.

```typescript
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
```

> warning **Warning** When you define multiple consumers for the same queue, the `concurrency` option in `@Process({{ '{' }} concurrency: 1 {{ '}' }})` doesn't take effect. The minimum `concurrency` matches the number of consumers defined. This applies even if the `@Process()` handlers use different names to handle named jobs.

#### Request-scoped consumers

When a consumer is flagged as request-scoped (see [injection scopes](/fundamentals/injection-scopes#provider-scope)), a new instance of the class is created exclusively for each job. The instance is garbage-collected after the job completes.

```typescript
@Processor({
  name: 'audio',
  scope: Scope.REQUEST,
})
```

Because request-scoped consumer classes are instantiated dynamically and scoped to a single job, you can inject the current job through the constructor using the `JOB_REF` token.

```typescript
constructor(@Inject(JOB_REF) jobRef: Job) {
  console.log(jobRef);
}
```

> info **Hint** The `JOB_REF` token is imported from the `@nestjs/bull` package.

#### Event listeners

Bull emits a set of events when queue and/or job state changes occur. The `@nestjs/bull` package exports a set of decorators that let you subscribe to a core set of standard events.

Event listeners must be declared within a <a href="application/queues#consumers">consumer</a> class (i.e., within a class decorated with the `@Processor()` decorator). To listen for an event, use one of the decorators in the table below to declare a handler for the event. For example, to listen to the event emitted when a job enters the active state in the `audio` queue, use the following construct:

```typescript
import { Processor, Process, OnQueueActive } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')
export class AudioConsumer {

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }
  ...
```

Because Bull operates in a distributed (multi-node) environment, it defines the concept of event locality. Events may be triggered either entirely within a single process, or on shared queues from different processes. A **local** event is produced when an action or state change is triggered on a queue in the local process. In other words, when your event producers and consumers are local to a single process, all events happening on queues are local.

When a queue is shared across multiple processes, **global** events come into play. For a listener in one process to receive an event notification triggered by another process, it must register for a global event.

Event handlers are invoked whenever their corresponding event is emitted. Each handler is called with the signature shown in the table below, which provides access to information relevant to the event. One key difference between local and global event handler signatures is discussed below the table.

<table>
  <tr>
    <th>Local event listeners</th>
    <th>Global event listeners</th>
    <th>Handler method signature / When fired</th>
  </tr>
  <tr>
    <td><code>@OnQueueError()</code></td><td><code>@OnGlobalQueueError()</code></td><td><code>handler(error: Error)</code> - An error occurred. <code>error</code> contains the triggering error.</td>
  </tr>
  <tr>
    <td><code>@OnQueueWaiting()</code></td><td><code>@OnGlobalQueueWaiting()</code></td><td><code>handler(jobId: number | string)</code> - A job is waiting to be processed as soon as a worker is idle. <code>jobId</code> contains the ID of the job that has entered this state.</td>
  </tr>
  <tr>
    <td><code>@OnQueueActive()</code></td><td><code>@OnGlobalQueueActive()</code></td><td><code>handler(job: Job)</code> - Job <code>job</code> has started.</td>
  </tr>
  <tr>
    <td><code>@OnQueueStalled()</code></td><td><code>@OnGlobalQueueStalled()</code></td><td><code>handler(job: Job)</code> - Job <code>job</code> has been marked as stalled. This is useful for debugging job workers that crash or pause the event loop.</td>
  </tr>
  <tr>
    <td><code>@OnQueueProgress()</code></td><td><code>@OnGlobalQueueProgress()</code></td><td><code>handler(job: Job, progress: number)</code> - Job <code>job</code>'s progress was updated to value <code>progress</code>.</td>
  </tr>
  <tr>
    <td><code>@OnQueueCompleted()</code></td><td><code>@OnGlobalQueueCompleted()</code></td><td><code>handler(job: Job, result: any)</code> - Job <code>job</code> successfully completed with a result <code>result</code>.</td>
  </tr>
  <tr>
    <td><code>@OnQueueFailed()</code></td><td><code>@OnGlobalQueueFailed()</code></td><td><code>handler(job: Job, err: Error)</code> - Job <code>job</code> failed with reason <code>err</code>.</td>
  </tr>
  <tr>
    <td><code>@OnQueuePaused()</code></td><td><code>@OnGlobalQueuePaused()</code></td><td><code>handler()</code> - The queue has been paused.</td>
  </tr>
  <tr>
    <td><code>@OnQueueResumed()</code></td><td><code>@OnGlobalQueueResumed()</code></td><td><code>handler()</code> - The queue has been resumed.</td>
  </tr>
  <tr>
    <td><code>@OnQueueCleaned()</code></td><td><code>@OnGlobalQueueCleaned()</code></td><td><code>handler(jobs: Job[], type: string)</code> - Old jobs have been cleaned from the queue. <code>jobs</code> is an array of cleaned jobs, and <code>type</code> is the type of jobs cleaned.</td>
  </tr>
  <tr>
    <td><code>@OnQueueDrained()</code></td><td><code>@OnGlobalQueueDrained()</code></td><td><code>handler()</code> - Emitted whenever the queue has processed all the waiting jobs (even if some delayed jobs are not yet processed).</td>
  </tr>
  <tr>
    <td><code>@OnQueueRemoved()</code></td><td><code>@OnGlobalQueueRemoved()</code></td><td><code>handler(job: Job)</code> - Job <code>job</code> was successfully removed.</td>
  </tr>
</table>

When listening for global events, the method signatures can differ slightly from their local counterparts. Specifically, any handler that receives a `job` object in the local version receives a `jobId` (`number | string`) in the global version instead. To get a reference to the actual `job` object in such a case, use the `Queue#getJob()` method. This call returns a promise, so declare the handler `async` and await it. For example:

```typescript
@OnGlobalQueueCompleted()
async onGlobalCompleted(jobId: number, result: any) {
  const job = await this.immediateQueue.getJob(jobId);
  console.log('(Global) on completed: job ', job.id, ' -> result: ', result);
}
```

> info **Hint** To access the `Queue` object (to make a `getJob()` call), you must inject it. The queue must also be registered in the module where you inject it.

In addition to the specific event listener decorators, you can use the generic `@OnQueueEvent()` decorator in combination with either the `BullQueueEvents` or `BullQueueGlobalEvents` enum. See the [Events section of the Bull reference](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#events) to learn more about events.

#### Queue management

Queues have an API for management functions such as pausing and resuming, and retrieving the count of jobs in various states. See the [Queue section of the Bull reference](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) for the full API. Invoke these methods directly on the `Queue` object, as shown in the pause and resume examples below.

Pause a queue with the `pause()` method. A paused queue doesn't process new jobs until it's resumed, but jobs already being processed continue until they finish.

```typescript
await audioQueue.pause();
```

To resume a paused queue, use the `resume()` method, as follows:

```typescript
await audioQueue.resume();
```

#### Separate processes

Job handlers can also run in a separate (forked) process (see [Separate processes](https://github.com/OptimalBits/bull#separate-processes) in the Bull documentation). This has several advantages:

- The process is sandboxed, so if it crashes, the worker isn't affected.
- You can run blocking code without affecting the queue (jobs don't stall).
- Better utilization of multi-core CPUs.
- Fewer connections to Redis.

```ts
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { join } from 'node:path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [join(import.meta.dirname, 'processor.js')],
    }),
  ],
})
export class AppModule {}
```

Because your function runs in a forked process, dependency injection (and the IoC container) isn't available. Your processor function must contain (or create) all instances of the external dependencies it needs.

```ts
@@filename(processor)
import { Job, DoneCallback } from 'bull';

export default function (job: Job, cb: DoneCallback) {
  console.log(`[${process.pid}] ${JSON.stringify(job.data)}`);
  cb(null, 'It works');
}
```

#### Async configuration

You may want to pass `bull` options asynchronously instead of statically. In this case, use the `forRootAsync()` method, which provides several ways to handle async configuration.

One approach is to use a factory function:

```typescript
BullModule.forRootAsync({
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

The factory behaves like any other [asynchronous provider](/fundamentals/async-providers) (e.g., it can be `async` and can inject dependencies through `inject`).

```typescript
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
```

Alternatively, you can use the `useClass` syntax:

```typescript
BullModule.forRootAsync({
  useClass: BullConfigService,
});
```

The construction above instantiates `BullConfigService` inside `BullModule` and uses it to provide an options object by calling `createSharedConfiguration()`. This means `BullConfigService` has to implement the `SharedBullConfigurationFactory` interface, as shown below:

```typescript
@Injectable()
class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullRootModuleOptions {
    return {
      redis: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
```

To reuse a provider imported from a different module instead of creating `BullConfigService` inside `BullModule`, use the `useExisting` syntax.

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

This construction works the same as `useClass` with one critical difference: `BullModule` looks up imported modules to reuse an existing `ConfigService` instead of instantiating a new one.

Likewise, to pass queue options asynchronously, use the `registerQueueAsync()` method. Specify the `name` attribute outside the factory function.

```typescript
BullModule.registerQueueAsync({
  name: 'audio',
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

#### Example

A working example is available in the [26-queues sample](https://github.com/nestjs/nest/tree/master/sample/26-queues).
