### HTTPS

In order to create application that uses HTTPS protocol, we have to pass an options object:

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

If using Fastify create the `app` like this:

```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  ApplicationModule,
  new FastifyAdapter({ https: httpsOptions }),
);
```

#### Multiple simultaneous servers

A full control over the library instance gives a simple way to create a several multiple simultaneous servers that are listening on different ports.

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

> info **Hint** The `ExpressAdapter` is imported from the `@nestjs/platform-express` package.
