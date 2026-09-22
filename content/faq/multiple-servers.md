### HTTPS

To create an application that uses the HTTPS protocol, set the `httpsOptions` property in the options object passed to the `NestFactory.create()` method:

```typescript
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};
const app = await NestFactory.create(AppModule, {
  httpsOptions,
});
await app.listen(process.env.PORT ?? 3000);
```

If you use the `FastifyAdapter`, create the application as follows:

```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({ https: httpsOptions }),
);
```

#### Multiple simultaneous servers

The following recipe shows how to create a Nest application that listens on multiple ports simultaneously (for example, on an HTTP port and an HTTPS port):

```typescript
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};

const server = express();
const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
await app.init();

const httpServer = http.createServer(server).listen(3000);
const httpsServer = https.createServer(httpsOptions, server).listen(443);
```

Because we created the servers ourselves with `http.createServer()` and `https.createServer()`, Nest doesn't close them when you call `app.close()` or when the process receives a termination signal. You need to close them yourself, for example with a provider that implements the `OnApplicationShutdown` hook:

```typescript
@Injectable()
export class ShutdownObserver implements OnApplicationShutdown {
  private httpServers: http.Server[] = [];

  public addHttpServer(server: http.Server): void {
    this.httpServers.push(server);
  }

  public async onApplicationShutdown(): Promise<void> {
    await Promise.all(
      this.httpServers.map(
        (server) =>
          new Promise((resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
              } else {
                resolve(null);
              }
            });
          }),
      ),
    );
  }
}

const shutdownObserver = app.get(ShutdownObserver);
shutdownObserver.addHttpServer(httpServer);
shutdownObserver.addHttpServer(httpsServer);
```

> info **Hint** The `ExpressAdapter` is imported from the `@nestjs/platform-express` package. The `http` and `https` modules are built into Node.js.

> warning **Warning** This recipe does not work with [GraphQL subscriptions](/graphql/subscriptions).
