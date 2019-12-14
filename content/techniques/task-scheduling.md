### Task Scheduling

Task scheduling allows you to schedule arbitrary functions for execution at specific dates/times.
For scheduling, Nest provides integration with the [cron](https://github.com/kelektiv/node-cron) package out-of-the box with `@nestjs/schedule`, which we'll cover in the current chapter.

#### Installation

To begin using it, we first install the required dependencies.

```bash
$ npm install --save @nestjs/schedule
```

Once the installation process is complete, we can import the `ScheduleModule` into the root `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot()
  ],
})
export class AppModule {}
```

The `.forRoot()` call will register all the Cron jobs, timeouts, and intervals defined within your app when the `onApplicationBootstrap` lifecycle hook occurs.

#### Cron jobs

A Cron is a time-based job scheduler, which allows to schedule an arbitrary function to run automatically at a certain date or time. To define a Cron job, use the `@Cron` decorator, as follows:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron('45 * * * * *')
  handleCron() {
    this.logger.debug('Called when the second is 45');
  }
}
```

The `handleCron` method will be called every time when the second is `45`. The `@Cron` decorator supports all the [cron patterns](http://crontab.org/):

- Asterisk (e.g. `*`)
- Ranges (e.g. `1-3,5`)
- Steps (e.g. `*/2`)

In addition, it allows you to supply a `Date` object.

In the example above, we passed `45 * * * * *.` argument to the decorator. These parameters have different meanings when used:

<pre class="language-javascript"><code class="language-javascript">
* * * * * *
| | | | | |
| | | | | day of week
| | | | month
| | | day of month
| | hour
| minute
second (optional)
</code></pre>

#### Named Cron jobs

If you want to control your Cron job from outside your function, you must use **named Cron jobs** mechanism. To define a Cron job with a specified name, use the following construction:

```typescript
@Cron('* * 8 * * *', {
  name: 'notifications',
})
triggerNotifications() {}
```

Now, you can get a reference to the `CronJob` instance with the `SchedulersRegistry`. First, inject it using standard constructor injection:

```typescript
constructor(private readonly schedulersRegistry: SchedulersRegistry) {}
```

And use it in our class:

```typescript
const job = this.schedulersRegistry.getCron('notifications');

job.stop();
console.log(job.lastDate());
```

#### Intervals

To define a function which should run with a specified interval, use the `@Interval()` decorator.

```typescript
@Interval(10000)
handleInterval() {
  this.logger.debug('Called every 10 seconds');
}
```

> info **Hint** This mechanism uses the `setInterval()` function under the hood.

#### Named intervals

If you want to control your interval from outside your function, you must use **named intervals** mechanism. To define an interval with a specified name, use the following construction:

```typescript
@Interval('notifications', 2500)
handleInterval() {}
```

Now, you can get an interval ID with the `SchedulersRegistry`. First, inject it using standard constructor injection:

```typescript
constructor(private readonly schedulersRegistry: SchedulersRegistry) {}
```

And use it in our class:

```typescript
const intervalId = this.schedulersRegistry.getInterval('notifications');
clearInterval(intervalId);
```

#### Timeouts

To define a function which should run with a specified timeout, use the `@Timeout()` decorator.

```typescript
@Timeout(5000)
handleTimeout() {
  this.logger.debug('Called once after 5 seconds');
}
```

> info **Hint** This mechanism uses the `setTimeout()` function under the hood.

#### Named timeouts

If you want to control your timeout from outside your function, you must use **named timeouts** mechanism. To define a timeout with a specified name, use the following construction:

```typescript
@Timeout('notifications', 2500)
handleTimeout() {}
```

Now, you can get a timeout ID with the `SchedulersRegistry`. First, inject it using standard constructor injection:

```typescript
constructor(private readonly schedulersRegistry: SchedulersRegistry) {}
```

And use it in our class:

```typescript
const timeoutId = this.schedulersRegistry.getTimeout('notifications');
clearTimeout(timeoutId);
```

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/27-scheduling).
