### Dashboard

Once an application is instrumented and sending data, its project dashboard fills in automatically - no queries to write, no dashboards to build. This chapter covers what each view shows, how they relate to each other, and how the features built on top of the telemetry - alerts, SLOs, issues, and the agent handoff - fit together. For the full reference, see the [NestJS Observe documentation](https://www.observe.nestjs.com/dashboard/documentation 'NestJS Observe documentation').

<figure><img src="https://www.observe.nestjs.com/docs/telemetry/dashboard.png" alt="Project dashboard" /></figure>

#### How the views nest

Almost every telemetry view is one of three levels, and you move between them by clicking through:

1. **Analytics** - the list view. Every route, job, span, or metric your applications reported in the selected window, aggregated: throughput, latency, failure rate. This is where you notice something.
2. **Operation** - one route (`GET /orders/:id`), one job name, one span name. The same numbers over time, plus the list of individual executions behind them. This is where you confirm the shape of a problem: constant or spiky, everywhere or one release.
3. **Execution** - a single request, a single job run, a single span invocation. Its exact duration, status, user, tags, the error it raised, the waterfall of everything it did, and the logs it wrote. This is where you diagnose.

Aggregates tell you _that_ something is wrong and how much it matters; a single execution tells you _why_. Every view shares one control bar - a time range and an optional application filter - and everything on the page obeys it.

#### Telemetry views

| View        | What it shows                                                                                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Requests** | Every HTTP, GraphQL, and gRPC request, broken down by operation. A request detail page compares the call against the route's own baseline ("slower than 95% of calls") and, when the process was struggling, states by how much host pressure slowed this operation.                                          |
| **Services** | Time spent per NestJS **class and method**, split into own time (with everything awaited subtracted out) and total time. Only instrumented classes appear, so a short list means low coverage, not low traffic.                                                                                               |
| **Errors**   | Every unhandled error, grouped by operation, with the failure leading the page: class, message, stack trace, and source code. The **Group into defects** switch collapses occurrences with the same class and stack shape into one fingerprinted group with first/last seen and the release that introduced it. |
| **Jobs**     | Background work - queue consumers, cron runs - with queue wait time, attempt number, and failure reason alongside duration and failure rate.                                                                                                                                                                    |
| **Spans**    | Analytics over span names across every route that calls them - "how slow is `OrdersService.recalculate` everywhere", rather than "how slow is this one endpoint".                                                                                                                                             |
| **Traces**   | The waterfall for a trace id, across every service that shares it - see [Distributed tracing](/observability/distributed-tracing).                                                                                                                                                                              |
| **Users**    | Per-user activity when `getUserId` is configured: failure rate per user, calls grouped into the actions they performed, a replay of each action, and the paths between them. A **Group by customer** switch rolls identities up by email domain.                                                                 |
| **Custom**   | Counters, gauges, and summaries reported through [`TracerService`](/observability/manual-instrumentation#custom-metrics), grouped by metric name and labels.                                                                                                                                                             |
| **Releases** | Each `serviceVersion` compared against the one before it - error rate, latency, and throughput side by side.                                                                                                                                                                                                    |
| **Logs**     | Everything your services logged (with `forwardLogs` on), correlated to the traces they ran in. On an execution page, each line is placed on the trace's clock next to the span that was in flight.                                                                                                               |
| **Profiler** | CPU, memory, event loop delay and utilization, and garbage collection per application, with per-instance comparison when an application runs on more than one node. Click a spike on the Memory or Event loop delay chart to see which operations ran at that moment, ranked by deviation from their baseline.   |

<figure><img src="https://www.observe.nestjs.com/docs/telemetry/services.png" alt="Services view" /></figure>

#### Handing a failure to a coding agent

Reading a trace tells you what happened. The next step is always the same: go find that code and change it. The **Copy agent prompt** button does that handoff in one click - it copies the entire page as a self-contained markdown prompt, ready to paste into Claude Code, Cursor, or anything else that has your repository open.

The button appears only where there is something to investigate: a request or job that failed or ran slower than 95% of its peers, or a trace containing an error. The prompt carries the task framing, the operation context, the error with its trimmed stack trace and source lines (paths rewritten relative to your project root, so `src/orders/orders.service.ts:35` rather than `/var/app/current/dist/orders/orders.service.js:35`), how the call compares to the operation's average and p95, the top spans by self time, up to 40 log lines chosen errors-first, and closing instructions asking the agent to explain the root cause from the code and propose a fix as a diff with tests.

<figure><img src="https://www.observe.nestjs.com/docs/telemetry/copy-agent-prompt.png" alt="Copy agent prompt" /></figure>

For an agent that needs to keep asking - follow a trace into its logs, check whether an error is still firing - connect it to the [MCP server](/observability/mcp-server) instead.

#### Alerts

Alerts get you told when your telemetry crosses a threshold you care about, instead of you finding out from a customer. A rule watches one metric from one of these families:

| Family  | Metrics                                         | Scoped to                                           |
| ------- | ----------------------------------------------- | --------------------------------------------------- |
| Request | Error rate, p95 latency, avg latency, throughput | An application, and optionally one route + method   |
| Job     | Job failure rate, job throughput, p95 queue wait | An application, and optionally one job name + queue |
| Absence | Telemetry silence, job silence                  | An application, or one job name + queue             |
| Logs    | Matching log lines                              | A pattern, and optionally levels + logger context   |
| Runtime | Event loop delay, CPU usage, memory usage       | An application (sampled per process)                |
| Custom  | Any custom metric your application reports      | A metric name, and optionally one label             |
| SLO     | SLO burn rate                                   | The SLO itself                                      |

Every rule runs in one of two modes: a **fixed threshold** ("error rate above 5%"), or **anomaly detection**, which fires when the metric deviates from its own recent baseline by more than a sensitivity you set. Anomaly mode is often the better choice for runtime metrics - a fixed CPU threshold that's right for one service is wrong for the next, but "unlike its own recent baseline" travels.

Two families deserve a closer look from the instrumentation side:

- **Absence detection.** A **Telemetry silence** rule watches the runtime heartbeat the SDK's `runtimeMetrics` sampler emits even when the application is otherwise idle, and fires once it's been silent longer than a tolerance you set (2 minutes to 7 days). A **Job silence** rule does the same for one named job - a cron that didn't run. This is both lightweight uptime monitoring with no external probe and cron monitoring, from the same mechanism. A scope that has never reported anything doesn't fire: "not yet integrated" isn't "down".
- **Log-pattern alerts** count log lines containing a substring within the window - "alert me when `payment declined` appears more than 10 times in 15 minutes" - and need `forwardLogs` to be on.

A rule can notify through **email**, **Slack** (incoming webhook), a generic **webhook**, an **in-app** notification, or by **creating an issue** pre-filled with the rule's severity and scope. Rules can carry a recurring mute schedule for quiet hours, and every state transition (OK → Firing → Resolved) is recorded with per-channel delivery status.

<figure><img src="https://www.observe.nestjs.com/docs/alerts/create-alert.png" alt="Create alert" /></figure>

#### SLOs

SLOs turn "error rate above 5%" into "we promised 99.9% and we're spending the budget too fast". They're objectives over telemetry you're already collecting - no new instrumentation required. An SLO is built from three layered ideas:

- **SLI (service level indicator)** - a ratio of good events to total events over a window: availability (requests without an unhandled error), latency (requests under a threshold you set), or job success.
- **Objective** - the SLI plus a target percentage (90-99.999%) over a rolling compliance window of 7, 14, 28, or 30 days.
- **Error budget** - how much room you have to miss the target (`1 − target`), and **burn rate**, how fast that budget is being spent. A burn rate of 1.0 spends it exactly on schedule; 14.4 means a 28-day budget would be gone in about two days.

A burn-rate alert is a regular alert rule pointed at an SLO instead of a raw metric. Typical starting points are a fast-burn rule (1 hour window, 14.4×), a slow-burn rule (6 hours, 6×), and a trickle rule (3 days, 1×). A compliance window can't exceed how long your plan retains telemetry.

#### Issues

Issues are lightweight, project-scoped tracking for the work that comes out of your telemetry - a recurring error worth fixing, a latency regression to investigate. Create them by hand from any execution page, promote an error group into one, or let a firing alert open one automatically. An issue links to the request, error, job, or trace it came from, so anyone opening it later has the telemetry in context, not just a description of it.

When you mark an issue resolved and it names something measurable (an operation, an alert rule's scope), the dashboard watches that operation's telemetry against its pre-incident baseline and tells you whether the fix actually held - moving the issue to **Verifying**, then to closed on its own, or back to **Open** with the reading that broke it. Naming the release the fix went out in (your `serviceVersion`) holds verification until that release actually shows up in telemetry.

#### A worked path through the dashboard

The views are designed to be walked in order. A typical investigation:

1. An alert fires, or the **Requests** chart shows p95 climbing.
2. Sort the route list by duration or failure rate to find which operation moved.
3. Open the operation. Is it constant or spiky? Did it start at a deploy? Check **Releases**.
4. Open a single execution from the tail of the distribution - one the baseline card calls _slower than 95% of calls_.
5. Read the **waterfall**: which span holds the self time?
6. If it failed, read the **error card** - stack trace and the source lines around the throw.
7. Check the **logs** for that trace, hovering lines to line them up with the spans.
8. **Copy the agent prompt** and hand the whole thing to a coding agent, or open an **issue** linked to the execution so whoever picks it up starts where you stopped.

The same walk is available to an agent over the [MCP server](/observability/mcp-server), one tool per step, when you'd rather ask questions than click through them.
