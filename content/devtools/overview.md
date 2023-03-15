### Overview

> info **Hint** This chapter covers the Nest Devtools integration with the Nest framework. If you are looking for the Devtools application, please visit the [Devtools](https://devtools.nestjs.com) website.

To start debugging your local application, open up the `main.ts` file and make sure to set the `snapshot` attribute to `true` in the application options object, as follows:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
  });
  await app.listen(3000);
}
```

This will instruct the framework to collect necessary metadata that will let Nest Devtools visualize your application's graph.

Next up, let's install the required dependency:

```bash
$ npm i @nestjs/devtools-integration
```

> warning **Warning** If you're using `@nestjs/graphql` package in your application, make sure to install the latest version (`npm i @nestjs/graphql@11`).

With this dependency in place, let's open up the `app.module.ts` file and import the `DevtoolsModule` that we just installed:

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

> warning **Warning** The reason we are checking the `NODE_ENV` environment variable here is that you should never use this module in production!

Once the `DevtoolsModule` is imported and your application is up and running (`npm run start:dev`), you should be able to navigate to [Devtools](https://devtools.nestjs.com) URL and see the instrospected graph.

<figure><img src="/assets/devtools/modules-graph.png" /></figure>

So as we can see, `DevtoolsModule` makes your application expose an additional HTTP server (on port 8000) that the Devtools application will use to introspect your app.

Just to double-check that everything works as expected, change the graph view to "Classes". You should see the following screen:

<figure><img src="/assets/devtools/classes-graph.png" /></figure>

To focus on a specific node, click on the rectangle and the graph will show a popup window with the **"Focus"** button. You can also use the search bar (located in the sidebar) to find a specific node.

> info **Hint** If you click on the **Inspect** button, application will take you to the `/debug` page with that specific node selected.

<figure><img src="/assets/devtools/node-popup.png" /></figure>

Using the form controls located in the sidebar (on the left), you can control edges proximity to, for example, visualize a specific application sub-tree:

<figure><img src="/assets/devtools/subtree-view.png" /></figure>

#### Routes explorer

When you navigate to the **Routes explorer** page, you should see all of the registered entrypoints:

<figure><img src="/assets/devtools/routes.png" /></figure>

#### Sandbox

To execute JavaScript code on the fly & interact with your application in real-time, navigate to the **Sandbox** page:

<figure><img src="/assets/devtools/sandbox.png" /></figure>

#### Bootstrap performance analyzer

To see a list of all class nodes (controllers, providers, enhancers, etc.) and their corresponding instantiation times, navigate to the **Bootstrap performance** page:

<figure><img src="/assets/devtools/bootstrap-performance.png" /></figure>

#### Audit

To see the auto-generated audit - errors/warnings/hints that the application came up with while analyzing your serialized graph, navigate to the **Audit** page:

<figure><img src="/assets/devtools/audit.png" /></figure>

#### Preview static files

To save a serialized graph to a file, use the following code:

```typescript
await app.listen(3000); // OR await app.init()
writeFileSync('./graph.json', app.get(SerializedGraph).toString());
```

> info **Hint** `SerializedGraph` is exported from the `@nestjs/core` package.

Then you can drag and drop this/upload this file:

<figure><img src="/assets/devtools/drag-and-drop.png" /></figure>
