### HTTPS

To create an application that uses HTTPS protocol, set the `httpsOptions` property in the options passed to the `create()` method of the `NestFactory` class:

```typescript
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};
const app = await NestFactory.create(ApplicationModule, {
  httpsOptions,
});
await app.listen(3000);
```

If you use the `FastifyAdapter`, create the application as follows:

```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  ApplicationModule,
  new FastifyAdapter({ https: httpsOptions }),
);
```

#### Multiple simultaneous servers

A full control over the library instance gives a simple way to create several multiple simultaneous servers that are listening on different ports.

```typescript
const httpsOptions = {
  key: fs.readFileSync('./secrets/private-key.pem'),
  cert: fs.readFileSync('./secrets/public-certificate.pem'),
};

const server = express();
const app = await NestFactory.create(
  ApplicationModule,
  new ExpressAdapter(server),
);
await app.init();

http.createServer(server).listen(3000);
https.createServer(httpsOptions, server).listen(443);
```

> info **Hint** The `ExpressAdapter` is imported from the `@nestjs/platform-express` package, while `http` and `https` are native Node.js packages.

> **Warning** This recipe does not work with [GraphQL Subscriptions](/graphql/subscriptions).
