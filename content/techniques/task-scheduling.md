### Task Scheduling

Task scheduling allows you to schedule arbitrary code (methods/functions) to execute at a fixed date/time, at recurring intervals, or once after a specified interval.  In the Linux world, this is often handled by packages like [cron](https://en.wikipedia.org/wiki/Cron) at the OS level.  For Node.js apps, there are several packages that emulate cron-like functionality.  Nest provides the `@nestjs/schedule` package, which integrates with the popular Node.js [node-cron](https://github.com/kelektiv/node-cron) package. We'll cover this package in the current chapter.

#### Installation

To begin using it, we first install the required dependencies.

```bash
$ npm install --save @nestjs/schedule
```

To activate job scheduling, register all scheduled jobs (we'll see how to define these shortly) by importing the `ScheduleModule` into the root `AppModule`, and running the `forRoot()` static method.

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

The `.forRoot()` call registers all the scheduled jobs (<a href="techniques/task-scheduling#cron-jobs">cron jobs</a>, <a href="techniques/task-scheduling#timeouts">timeouts</a>, and <a href="techniques/task-scheduling#intervals">intervals</a>) that are defined within your app.  Registration occurs when the `onApplicationBootstrap` lifecycle hook occurs, ensuring that all modules have loaded and declared any scheduled jobs.

#### Cron jobs

A cron job schedules an arbitrary function (method call) to run automatically. Cron jobs can run:
- Once, at a specified date/time.
- On a recurring basis; recurring jobs can run at a specified instant within a specified interval (for example, once per hour, once per week, once every 5 minutes)

Define a cron job with the `@Cron()` decorator preceding the method declaration containing the code to be executed, as follows:

```typescript
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
```

In this example, the `handleCron()` method will be called each time the current second is `45`. In other words, the method will be run once per minute, at the 45 second mark.

The `@Cron` decorator supports all standard [cron patterns](http://crontab.org/):
- Asterisk (e.g. `*`)
- Ranges (e.g. `1-3,5`)
- Steps (e.g. `*/2`)

In the example above, we passed `45 * * * * *` to the decorator. The following key shows how each position in the cron pattern string is interpreted:

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

Some sample cron patterns are:

<table>
  <tbody>
    <tr>
      <td>* * * * * *<code></code></td>
      <td>every second</td>
    </tr>
    <tr>
      <td>45 * * * * *<code></code></td>
      <td>every minute, on the 45th second</td>
    </tr>
    <tr>
      <td>* 10 * * * *<code></code></td>
      <td>every hour, at the start of the 10th minute</td>
    </tr>
    <tr>
      <td>0 */30 9-17 * * *<code></code></td>
      <td>every 30 minutes between 9am and 5pm</td>
    </tr>
   <tr>
      <td>0 30 11 * * 1-5<code></code></td>
      <td>Monday to Friday at 11:30am</td>
    </tr>
  </tbody>
</table>

Alternatively, you can supply a JavaScript `Date` object to the `@Cron()` decorator.  Doing so causes the job to execute exactly once, at the specified date.

> info **Hint** Use JavaScript date arithmetic to schedule jobs relative to the current date.  For example, `@Cron(new Date(Date.now() + 10 * 1000))` to schedule a job to run 10 seconds after the app starts.

#### Cron job API

To access and control a cron job after it's been declared, associate a name with the job, then retrieve the job by name using the `SchedulerRegistry` API. To define a cron job name, pass the `name` property in an optional options object as the second argument of the decorator, as shown below:

```typescript
@Cron('* * 8 * * *', {
  name: 'notifications',
})
triggerNotifications() {}
```

You can obtain a reference to the `CronJob` instance from anywhere in your code using the `SchedulerRegistry` API. First, inject `SchedulerRegistry` using standard constructor injection:

```typescript
constructor(private readonly schedulerRegistry: SchedulerRegistry) {}
```

Then use it in a class as follows:

```typescript
const job = this.schedulerRegistry.getCron('notifications');

job.stop();
console.log(job.lastDate());
```

The `getCron()` method returns the named cron job.  The job object has the following methods associated with it:
- `stop()` - stops a job that is scheduled to run.
- `start()` - restarts a job that has been stopped.
- `setTime(time: CronTime)` - stops a job, sets a new time for it, and then starts it
- `lastDate()` - returns a string representation of the last date a job executed
- `nextDates(count: number)` - returns an array (size `count`) of `moment` objects representing upcoming job execution dates.

> info **Hint** Use `toDate()` on `moment` objects to render them in human readable form.  For example, `console.log('next job date:', job.nextDates(1)[0].toDate())`


#### Intervals

To define a method which should run at a specified interval, use the `@Interval()` decorator.

```typescript
@Interval(10000)
handleInterval() {
  this.logger.debug('Called every 10 seconds');
}
```

> info **Hint** This mechanism uses the `setInterval()` function under the hood.

> info **Hint** You can also utilize a cron job to schedule recurring jobs.

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
