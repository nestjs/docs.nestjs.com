### Task scheduling

Task scheduling lets you run arbitrary code (methods or functions) at a fixed date and time, at recurring intervals, or once after a specified delay. In the Linux world, this is often handled at the OS level by tools like [cron](https://en.wikipedia.org/wiki/Cron). For Node.js apps, several packages emulate cron-like functionality. Nest provides the `@nestjs/schedule` package, which integrates with the popular Node.js [cron](https://github.com/kelektiv/node-cron) package. This chapter covers the `@nestjs/schedule` package.

#### Installation

To begin using it, install the required dependencies.

```bash
$ npm install --save @nestjs/schedule
```

To activate job scheduling, import the `ScheduleModule` into the root `AppModule` and call the `forRoot()` static method, as shown below:

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

The `forRoot()` call initializes the scheduler and registers any declarative <a href="application/task-scheduling#declarative-cron-jobs">cron jobs</a>, <a href="application/task-scheduling#declarative-timeouts">timeouts</a>, and <a href="application/task-scheduling#declarative-intervals">intervals</a> that exist within your app. The scheduled jobs start in the `onApplicationBootstrap` lifecycle hook, which ensures that all modules have loaded and declared their scheduled jobs.

> warning **Warning** Call `forRoot()` in one module only. Each additional import registers every `@Cron()`, `@Interval()` and `@Timeout()` handler in your app again, so importing it in three modules makes each job run three times.

#### Declarative cron jobs

A cron job schedules an arbitrary function (method call) to run automatically. Cron jobs can run:

- Once, at a specified date and time.
- On a recurring basis. Recurring jobs can run at a specified instant within a specified interval (e.g., once per hour, once per week, once every 5 minutes).

Declare a cron job by applying the `@Cron()` decorator to the method that contains the code to execute, as follows:

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

In this example, the `handleCron()` method is called each time the current second is `45`. In other words, the method runs once per minute, at the 45-second mark.

The `@Cron()` decorator supports the following standard [cron patterns](http://crontab.org/):

- Asterisks (e.g., `*`)
- Ranges and lists (e.g., `1-3,5`)
- Steps (e.g., `*/2`)

In the example above, we passed `45 * * * * *` to the decorator. The following key shows how each position in the cron pattern string is interpreted:

<pre class="language-javascript"><code class="language-javascript">
* * * * * *
| | | | | |
| | | | | day of week
| | | | months
| | | day of month
| | hours
| minutes
seconds (optional)
</code></pre>

Some sample cron patterns are:

<table>
  <tbody>
    <tr>
      <td><code>* * * * * *</code></td>
      <td>every second</td>
    </tr>
    <tr>
      <td><code>45 * * * * *</code></td>
      <td>every minute, on the 45th second</td>
    </tr>
    <tr>
      <td><code>0 10 * * * *</code></td>
      <td>every hour, at the start of the 10th minute</td>
    </tr>
    <tr>
      <td><code>0 */30 9-17 * * *</code></td>
      <td>every 30 minutes between 9am and 5pm</td>
    </tr>
   <tr>
      <td><code>0 30 11 * * 1-5</code></td>
      <td>Monday to Friday at 11:30am</td>
    </tr>
  </tbody>
</table>

The `@nestjs/schedule` package provides the `CronExpression` enum with commonly used cron patterns. You can use this enum as follows:

```typescript
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
```

In this example, the `handleCron()` method is called every `30` seconds. Every method annotated with `@Cron()` is automatically wrapped in a `try-catch` block, so if an exception occurs, it's logged to the console.

Alternatively, you can supply a JavaScript `Date` object to the `@Cron()` decorator. This causes the job to execute exactly once, at the specified date.

> info **Hint** Use JavaScript date arithmetic to schedule jobs relative to the current date. For example, `@Cron(new Date(Date.now() + 10 * 1000))` schedules a job to run 10 seconds after the app starts.

You can also supply additional options as the second parameter to the `@Cron()` decorator.

<table>
  <tbody>
    <tr>
      <td><code>name</code></td>
      <td>
        Lets you access and control a cron job after it's been declared.
      </td>
    </tr>
    <tr>
      <td><code>timeZone</code></td>
      <td>
        Specifies the time zone for the execution. This modifies the actual time relative to your time zone. If the time zone is invalid, an error is thrown. You can check all available time zones on the <a href="http://momentjs.com/timezone/">Moment Timezone</a> website.
      </td>
    </tr>
    <tr>
      <td><code>utcOffset</code></td>
      <td>
        Specifies the offset of your time zone instead of using the <code>timeZone</code> option. Don't combine it with <code>timeZone</code>.
      </td>
    </tr>
    <tr>
      <td><code>waitForCompletion</code></td>
      <td>
        If <code>true</code>, no additional instances of the cron job run until the current <code>onTick</code> callback completes. Any new scheduled executions that occur while the current cron job is running are skipped entirely.
      </td>
    </tr>
    <tr>
      <td><code>disabled</code></td>
      <td>
        If <code>true</code>, the job is not executed at all (defaults to <code>false</code>).
      </td>
    </tr>
  </tbody>
</table>

```typescript
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
```

With the <a href="/application/task-scheduling#dynamic-schedule-module-api">dynamic API</a>, you can access and control a cron job after it's been declared, or create a cron job dynamically (with its cron pattern defined at runtime). To access a declarative cron job via the API, you must associate the job with a name by passing the `name` property in the options object (the decorator's optional second argument).

#### Declarative intervals

To declare that a method should run at a specified (recurring) interval, prefix the method definition with the `@Interval()` decorator. Pass the interval value to the decorator as a number in milliseconds, as shown below:

```typescript
@Interval(10000)
handleInterval() {
  this.logger.debug('Called every 10 seconds');
}
```

> info **Hint** This mechanism uses the JavaScript `setInterval()` function under the hood. You can also use a cron job to schedule recurring jobs.

To control your declarative interval from outside the declaring class via the <a href="/application/task-scheduling#dynamic-schedule-module-api">dynamic API</a>, associate the interval with a name using the following construction:

```typescript
@Interval('notifications', 2500)
handleInterval() {}
```

Every method annotated with `@Interval()` is automatically wrapped in a `try-catch` block, so if an exception occurs, it's logged to the console.

The <a href="application/task-scheduling#dynamic-intervals">dynamic API</a> also enables **creating** dynamic intervals, where the interval's properties are defined at runtime, and **listing and deleting** them.

<app-banner-enterprise></app-banner-enterprise>

#### Declarative timeouts

To declare that a method should run once after a specified timeout, prefix the method definition with the `@Timeout()` decorator. Pass the time offset from application startup (in milliseconds) to the decorator, as shown below:

```typescript
@Timeout(5000)
handleTimeout() {
  this.logger.debug('Called once after 5 seconds');
}
```

> info **Hint** This mechanism uses the JavaScript `setTimeout()` function under the hood.

Every method annotated with `@Timeout()` is automatically wrapped in a `try-catch` block, so if an exception occurs, it's logged to the console.

To control your declarative timeout from outside the declaring class via the <a href="/application/task-scheduling#dynamic-schedule-module-api">dynamic API</a>, associate the timeout with a name using the following construction:

```typescript
@Timeout('notifications', 2500)
handleTimeout() {}
```

The <a href="application/task-scheduling#dynamic-timeouts">dynamic API</a> also enables **creating** dynamic timeouts, where the timeout's properties are defined at runtime, and **listing and deleting** them.

#### Dynamic schedule module API

The `@nestjs/schedule` module provides a dynamic API for managing declarative <a href="application/task-scheduling#declarative-cron-jobs">cron jobs</a>, <a href="application/task-scheduling#declarative-timeouts">timeouts</a>, and <a href="application/task-scheduling#declarative-intervals">intervals</a>. The API also lets you create and manage **dynamic** cron jobs, timeouts, and intervals, whose properties are defined at runtime.

#### Dynamic cron jobs

Obtain a reference to a `CronJob` instance by name from anywhere in your code using the `SchedulerRegistry` API. First, inject `SchedulerRegistry` using standard constructor injection:

```typescript
constructor(private schedulerRegistry: SchedulerRegistry) {}
```

> info **Hint** Import the `SchedulerRegistry` from the `@nestjs/schedule` package.

Then use it in a class. Assume a cron job was created with the following declaration:

```typescript
@Cron('* * 8 * * *', {
  name: 'notifications',
})
triggerNotifications() {}
```

Access this job using the following:

```typescript
const job = this.schedulerRegistry.getCronJob('notifications');

job.stop();
console.log(job.lastDate());
```

The `getCronJob()` method returns the named cron job. The returned `CronJob` object has the following methods:

- `stop()` - stops a job that is scheduled to run.
- `start()` - restarts a job that has been stopped.
- `setTime(time: CronTime)` - stops a job, sets a new time for it, and then starts it.
- `lastDate()` - returns a JavaScript `Date` representing the last execution of the job, or `null` if it hasn't run yet.
- `nextDate()` - returns a `DateTime` representation of the date when the next execution of the job is scheduled.
- `nextDates(count: number)` - returns an array (of size `count`) of `DateTime` representations for the next set of dates that will trigger job execution. `count` defaults to 0, which returns an empty array.

> info **Hint** Call `toJSDate()` on a `DateTime` object (a [Luxon](https://moment.github.io/luxon/) type) to convert it to the equivalent JavaScript `Date`.

**Create** a new cron job dynamically using the `SchedulerRegistry#addCronJob` method, as follows:

```typescript
addCronJob(name: string, seconds: string) {
  const job = new CronJob(`${seconds} * * * * *`, () => {
    this.logger.warn(`time (${seconds}) for job ${name} to run!`);
  });

  this.schedulerRegistry.addCronJob(name, job);
  job.start();

  this.logger.warn(
    `job ${name} added for each minute at ${seconds} seconds!`,
  );
}
```

This code uses the `CronJob` class from the `cron` package to create the cron job. The `CronJob` constructor takes a cron pattern (like the `@Cron()` <a href="application/task-scheduling#declarative-cron-jobs">decorator</a>) as its first argument, and a callback to execute when the cron timer fires as its second argument. The `SchedulerRegistry#addCronJob` method takes two arguments: a name for the `CronJob`, and the `CronJob` object itself.

> warning **Warning** Remember to inject the `SchedulerRegistry` before accessing it. Import `CronJob` from the `cron` package.

**Delete** a named cron job using the `SchedulerRegistry#deleteCronJob` method, as follows:

```typescript
deleteCron(name: string) {
  this.schedulerRegistry.deleteCronJob(name);
  this.logger.warn(`job ${name} deleted!`);
}
```

**List** all cron jobs using the `SchedulerRegistry#getCronJobs` method, as follows:

```typescript
getCrons() {
  const jobs = this.schedulerRegistry.getCronJobs();
  jobs.forEach((value, key, map) => {
    let next;
    try {
      next = value.nextDate().toJSDate();
    } catch (e) {
      next = 'error: next fire date is in the past!';
    }
    this.logger.log(`job: ${key} -> next: ${next}`);
  });
}
```

The `getCronJobs()` method returns a `Map`. This code iterates over the map and calls the `nextDate()` method of each `CronJob`. In the `CronJob` API, `nextDate()` throws an exception if a job has already fired and has no future firing date.

#### Dynamic intervals

Obtain a reference to an interval with the `SchedulerRegistry#getInterval` method. As above, inject `SchedulerRegistry` using standard constructor injection:

```typescript
constructor(private schedulerRegistry: SchedulerRegistry) {}
```

Then use it as follows:

```typescript
const interval = this.schedulerRegistry.getInterval('notifications');
clearInterval(interval);
```

**Create** a new interval dynamically using the `SchedulerRegistry#addInterval` method, as follows:

```typescript
addInterval(name: string, milliseconds: number) {
  const callback = () => {
    this.logger.warn(`Interval ${name} executing at time (${milliseconds})!`);
  };

  const interval = setInterval(callback, milliseconds);
  this.schedulerRegistry.addInterval(name, interval);
}
```

This code creates a standard JavaScript interval, then passes it to the `SchedulerRegistry#addInterval` method.
That method takes two arguments: a name for the interval, and the interval itself.

**Delete** a named interval using the `SchedulerRegistry#deleteInterval` method, as follows:

```typescript
deleteInterval(name: string) {
  this.schedulerRegistry.deleteInterval(name);
  this.logger.warn(`Interval ${name} deleted!`);
}
```

**List** the names of all intervals using the `SchedulerRegistry#getIntervals` method, as follows:

```typescript
getIntervals() {
  const intervals = this.schedulerRegistry.getIntervals();
  intervals.forEach(key => this.logger.log(`Interval: ${key}`));
}
```

#### Dynamic timeouts

Obtain a reference to a timeout with the `SchedulerRegistry#getTimeout` method. As above, inject `SchedulerRegistry` using standard constructor injection:

```typescript
constructor(private readonly schedulerRegistry: SchedulerRegistry) {}
```

Then use it as follows:

```typescript
const timeout = this.schedulerRegistry.getTimeout('notifications');
clearTimeout(timeout);
```

**Create** a new timeout dynamically using the `SchedulerRegistry#addTimeout` method, as follows:

```typescript
addTimeout(name: string, milliseconds: number) {
  const callback = () => {
    this.logger.warn(`Timeout ${name} executing after (${milliseconds})!`);
  };

  const timeout = setTimeout(callback, milliseconds);
  this.schedulerRegistry.addTimeout(name, timeout);
}
```

This code creates a standard JavaScript timeout, then passes it to the `SchedulerRegistry#addTimeout` method.
That method takes two arguments: a name for the timeout, and the timeout itself.

**Delete** a named timeout using the `SchedulerRegistry#deleteTimeout` method, as follows:

```typescript
deleteTimeout(name: string) {
  this.schedulerRegistry.deleteTimeout(name);
  this.logger.warn(`Timeout ${name} deleted!`);
}
```

**List** the names of all timeouts using the `SchedulerRegistry#getTimeouts` method, as follows:

```typescript
getTimeouts() {
  const timeouts = this.schedulerRegistry.getTimeouts();
  timeouts.forEach(key => this.logger.log(`Timeout: ${key}`));
}
```

#### Knowing a cron job actually ran

A scheduled job that throws is a problem you will hear about. A scheduled job that silently *stops being scheduled* (the process crashed, the container was descheduled, a deploy shipped a `@Cron()` expression with a typo) is a problem nobody hears about until the report it generates is missing.

This is the failure mode cron monitoring exists for, and [NestJS Observe](https://www.observe.nestjs.com/ 'NestJS Observe') covers it without a third-party ping service or a heartbeat URL for the job to call on its way out. Scheduled runs are reported as **jobs**, alongside queue consumers, each with its duration, outcome, and failure reason. A **job silence** alert rule fires when a named job hasn't reported within a tolerance you set, anywhere from 2 minutes to 7 days: *"alert me if `daily-invoices` has not reported in the last 26 hours"*.

Two details make this practical rather than noisy. A scope that has never reported anything doesn't fire, so you can add the rule before the job ships without being paged for something that isn't integrated yet. And rules carry a recurring mute schedule, so a job that legitimately doesn't run at weekends doesn't wake anyone on Saturday.

A handler that needs to report its own progress can inject `TracerService` and record spans or custom metrics from inside the run. Metrics in particular aren't tied to a trace, so they can be reported from cron jobs and lifecycle hooks alike. See [Manual instrumentation](/observability/manual-instrumentation) for that, and the [Observability](/observability/overview) chapter for setup.

#### Example

A working example is available in the [27-scheduling sample](https://github.com/nestjs/nest/tree/master/sample/27-scheduling).
