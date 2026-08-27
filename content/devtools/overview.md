### Overview

> info **Hint** This chapter covers the Nest Devtools integration with the Nest framework. If you are looking for the Devtools application, please visit the [Devtools](https://devtools.nestjs.com) website.

Nest Devtools gives you an interactive, always up-to-date view of your application's internals — modules, providers, controllers, and the routes and events that tie them together. Instead of piecing that picture together from imports and constructor signatures, you get a live graph you can search, filter, and click through. This chapter walks you through connecting your local application to Devtools for the first time.

Getting started takes less than five minutes. Open your `main.ts` file and set the `snapshot` attribute to `true` in your application's options object:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
  });
  await app.listen(3000);
}
```

This tells Nest to start collecting the metadata Devtools needs to reconstruct and visualize your application's dependency graph.

Next, install the Devtools integration package:

```bash
$ npm i @nestjs/devtools-integration
```

With the package installed, open `app.module.ts` and import the `DevtoolsModule`:

```typescript
@Module({
  imports: [
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

> info **Note** We check `NODE_ENV` here because `DevtoolsModule` should never run in production.

The `http` flag controls whether `DevtoolsModule` exposes its introspection server at all — leave it disabled and the module effectively does nothing, which is exactly the safety net you want if this configuration accidentally makes it past a review. There's no meaningful runtime overhead to worry about either: metadata collection only kicks in while the introspection server is actually being queried, so your application's regular request handling is unaffected.

Once `DevtoolsModule` is imported and your application is up and running (`npm run start:dev`), head over to [Devtools](https://devtools.nestjs.com) and watch your introspected graph come to life.

<figure><img src="/assets/devtools/modules-graph.png" /></figure>

> info **Hint** Notice that every module connects to `InternalCoreModule` — a global module Nest always imports into the root module. Because it's registered globally, Nest automatically draws an edge between it and every other module in your app. To declutter the view, toggle the **Hide global modules** checkbox in the sidebar.

Under the hood, `DevtoolsModule` spins up a lightweight HTTP server (on port 8000) that this dashboard uses to introspect your application in real time — no extra configuration required.

Let's confirm everything's wired up correctly. Switch the graph view to "Classes" and you should see something like this:

<figure><img src="/assets/devtools/classes-graph.png" /></figure>

Click any node to open a popup with a **"Focus"** button that isolates it on the graph, or use the search bar in the sidebar to jump straight to a specific node.

> info **Hint** Clicking **Inspect** takes you straight to the `/debug` page with that node preselected — perfect for digging into a specific provider or controller.

<figure><img src="/assets/devtools/node-popup.png" /></figure>

> info **Hint** Need a snapshot for docs or a pull request? Click **Export as PNG** in the bottom-right corner of the graph.

The controls in the sidebar let you narrow down edge proximity — handy for zooming in on a specific branch of your application:

<figure><img src="/assets/devtools/subtree-view.png" /></figure>

This is a great way to onboard **new team members** — show them exactly how the application fits together. It's equally useful when you're extracting a module (say, `TasksModule`) along with all of its dependencies ahead of splitting a large application into smaller services.

Everything in Graph Explorer stays in sync with your running application — refresh, and any change you've made to your modules or providers is reflected instantly. There's no build step or separate documentation to keep up to date; the graph **is** the documentation.

See **Graph Explorer** in action:

<figure>
  <iframe
    width="1000"
    height="565"
    src="https://www.youtube.com/embed/bW8V-ssfnvM"
    title="YouTube video player"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  ></iframe>
</figure>

#### Debugging "Cannot resolve dependency" errors

> info **Note** Available for `@nestjs/core` 9.3.10 and above.

If you've worked with Nest for any length of time, you've probably run into the dreaded **"Cannot resolve dependency"** error. It's usually the very first error message any new team member sees, and on a large application it can be genuinely hard to track down — the stack trace tells you what's missing, but not why, or where in a deeply nested provider chain the wiring actually broke. Devtools turns this from a guessing game into a quick, visual diagnosis.

Start by updating your `bootstrap()` call in `main.ts`:

```typescript
bootstrap().catch((err) => {
  writeFileSync('graph.json', PartialGraphHost.toString() ?? '');
  process.exit(1);
});
```

> info **Hint** `PartialGraphHost` is exported from `@nestjs/core`.

You'll also need to set `abortOnError` to `false`:

```typescript
const app = await NestFactory.create(AppModule, {
  snapshot: true,
  abortOnError: false, // <--- THIS
});
```

From now on, whenever your application fails to bootstrap with a **"Cannot resolve dependency"** error, Nest writes a `graph.json` file — a partial graph — to your project root. Drag and drop it into Devtools (switch from "Interactive" to "Preview" mode first) to see exactly where things went wrong:

<figure><img src="/assets/devtools/drag-and-drop.png" /></figure>

Once uploaded, you'll see the graph along with a dialog summarizing what happened:

<figure><img src="/assets/devtools/partial-graph-modules-view.png" /></figure>

The highlighted `TasksModule` is the one to look into — and the dialog already gives you pointers on how to fix it.

Switching to the "Classes" view tells the full story:

<figure><img src="/assets/devtools/partial-graph-classes-view.png" /></figure>

This graph makes it clear: `DiagnosticsService` — which `TasksService` depends on — isn't available in `TasksModule`'s context. The fix is simple: import `DiagnosticsModule` into `TasksModule` and you're back in business.

What would otherwise be a slow process of manually tracing imports across a handful of files — and hoping you didn't miss one — turns into a couple of clicks. It's a small workflow change, but it adds up fast on a codebase with dozens of modules.

#### Routes explorer

Head over to the **Routes explorer** page to see every entrypoint your application registers:

<figure><img src="/assets/devtools/routes.png" /></figure>

> info **Hint** This page isn't limited to HTTP routes — it also covers WebSockets, gRPC, GraphQL resolvers, and more.

Entrypoints are grouped by their host controllers, and you can use the search bar to jump straight to the one you're after.

Click any entrypoint to reveal **a flow graph** showing its full execution path — every guard, interceptor, and pipe bound to that route. It's the fastest way to understand how a request travels through your application, or to figure out why a specific guard, interceptor, or pipe isn't firing when you expect it to.

This view tends to pay off the most on applications that have grown organically over time, where the same guard might be applied at the controller level in one place and per-route in another. Rather than reading through decorators scattered across the codebase, you get the actual, resolved execution order for that specific route.

#### Playground

Want to run code against your application without redeploying? Head to the **Playground** page:

<figure><img src="/assets/devtools/sandbox.png" /></figure>

The Playground lets you test and debug endpoints **in real time**, so you can track down issues without reaching for a separate HTTP client. You can bypass the authentication layer entirely, skipping the extra login step or a dedicated test account — and for event-driven applications, trigger events directly from the Playground to see exactly how your app responds.

Anything your code logs is streamed straight to the Playground's console, so you always know what's happening under the hood.

Just run the code **on the fly** and see the results instantly — no rebuilds, no server restarts.

<figure><img src="/assets/devtools/sandbox-table.png" /></figure>

> info **Hint** Use `console.table()` (or just `table()`) to pretty-print an array of objects.

See the **Playground** in action:

<figure>
  <iframe
    width="1000"
    height="565"
    src="https://www.youtube.com/embed/liSxEN_VXKM"
    title="YouTube video player"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  ></iframe>
</figure>

#### Bootstrap performance analyzer

Curious what's slowing down your application's startup? The **Bootstrap performance** page lists every class node — controllers, providers, enhancers, and more — alongside its instantiation time:

<figure><img src="/assets/devtools/bootstrap-performance.png" /></figure>

It's the quickest way to spot the slowest parts of your bootstrap process, which matters most when startup time is on the critical path — think serverless environments where every millisecond counts.

Slow bootstraps are usually caused by a handful of usual suspects: heavy synchronous work inside a constructor, a provider awaiting a slow external call in `onModuleInit`, or simply a module instantiating far more dependencies than it needs. Sorted by instantiation time, this page makes those outliers obvious at a glance instead of requiring you to sprinkle `console.time()` calls throughout your codebase.

#### Audit

Devtools automatically analyzes your serialized graph and surfaces errors, warnings, and hints worth your attention. Find them all on the **Audit** page:

<figure><img src="/assets/devtools/audit.png" /></figure>

> info **Hint** The screenshot above shows just a sample of the available audit rules.

Think of it as a linter for your application's architecture — a fast way to catch issues before they catch you. Some of the built-in rules flag things you'd otherwise only discover the hard way: a controller carrying far more routes than its neighbors, a module pulling in an unusually large number of dependencies, a provider named `SomethingGuard` that was never actually registered as a guard, or a request-scoped provider that's a strong candidate for [Durable Providers](/fundamentals/injection-scopes#durable-providers) instead. None of these are bugs your test suite will catch, but they're exactly the kind of thing that slows a codebase down over time.

#### Preview static files

To save a serialized graph to a file, use the following code:

```typescript
await app.listen(3000); // OR await app.init()
writeFileSync('./graph.json', app.get(SerializedGraph).toString());
```

> info **Hint** `SerializedGraph` is exported from `@nestjs/core`.

Then simply drag and drop (or upload) the file:

<figure><img src="/assets/devtools/drag-and-drop.png" /></figure>

This comes in handy when you want to share a graph with a co-worker, attach it to a bug report, or analyze it offline — without needing your application up and running.
