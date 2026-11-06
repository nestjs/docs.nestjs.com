### Socket activation

With socket activation, the service manager opens the listening socket for your application. [systemd](https://systemd.io/) listens on the port, starts the application when the first connection arrives, and hands the socket over to it. Connections that arrive while the application starts or restarts wait in the kernel's queue instead of being refused.

This is useful for services that are called rarely, such as internal tools, admin panels, or the many services of a development or staging machine. If the application also exits after some time without requests, such a service holds no memory while nobody uses it. The cost is a cold start: the first request after a pause waits until Node.js loads the application and Nest bootstraps it.

> info **Hint** Listening on a socket passed by the service manager is a feature of Node.js's [`server.listen()`](https://nodejs.org/api/net.html#serverlistenhandle-backlog-callback). It is not supported on Windows.

#### systemd units

Create a socket unit, for example `/etc/systemd/system/my-app.socket`:

```bash
[Socket]
ListenStream=3000

[Install]
WantedBy=sockets.target
```

Next to it, create a service unit with the same name, `/etc/systemd/system/my-app.service`:

```bash
[Service]
WorkingDirectory=/srv/my-app
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
```

Then enable the socket only. systemd starts `my-app.service` on the first connection:

```bash
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now my-app.socket
```

> warning **Warning** Start `node` directly in `ExecStart`. systemd passes the socket as file descriptor `3` and sets the `LISTEN_FDS` and `LISTEN_PID` environment variables, where `LISTEN_PID` is the ID of the process it started. With `npm start`, `nest start`, or a shell script in between, `LISTEN_PID` doesn't match your application's process. The bootstrap below then falls back to listening on the port, which fails with `EADDRINUSE` because systemd already holds it.

> info **Hint** To try it without unit files, run `systemd-socket-activate --listen=3000 node dist/main.js`. It passes the socket the same way, but starts the application only once. It also doesn't forward variables such as `NODE_ENV` unless you name them with `--setenv=NODE_ENV`.

#### Bootstrap

In your `main.ts` file, listen on the passed socket when the application was started this way, and on a port otherwise:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  // Set by systemd when it passes the listening socket to this process
  const activated =
    process.env.LISTEN_FDS === '1' &&
    process.env.LISTEN_PID === String(process.pid);

  if (activated) {
    await app.listen({ fd: 3 } as any);
  } else {
    await app.listen(process.env.PORT ?? 3000);
  }
}

await bootstrap();
```

The Express and Node adapters pass the options object to Node.js's `server.listen()` as is, but their `listen()` typings accept only a port, hence the cast. The Fastify adapter accepts `fd` in its typed listen options:

```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
// ...
await app.listen({ fd: 3 });
```

#### Exiting when idle

systemd doesn't stop the application on its own. To free its memory, let the application exit after some time without requests, and systemd starts it again on the next connection. The following helper counts in-flight requests on the underlying HTTP server, so it works with every adapter and also sees requests that never reach a route handler:

```typescript
@@filename(exit-when-idle)
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';

export function exitWhenIdle(app: INestApplication, idleMs: number) {
  const server: Server = app.getHttpServer();
  let inFlight = 0;
  let timer: NodeJS.Timeout | undefined;

  const scheduleExit = () => {
    timer = setTimeout(async () => {
      await app.close();
      process.exit(0);
    }, idleMs);
  };

  server.on('request', (req, res) => {
    inFlight++;
    clearTimeout(timer);
    res.once('close', () => {
      if (--inFlight === 0) {
        scheduleExit();
      }
    });
  });
  scheduleExit();
}
```

Call it once the application listens on the passed socket:

```typescript
if (activated) {
  await app.listen({ fd: 3 } as any);
  exitWhenIdle(app, 5 * 60_000); // Exit after 5 minutes without requests
}
```

`app.close()` runs the same [shutdown hooks](/fundamentals/lifecycle-events#application-shutdown) as `enableShutdownHooks()` does when systemd stops the service with `SIGTERM`. Exit code `0` tells systemd that the service stopped cleanly, so `Restart=on-failure` doesn't start it again. systemd keeps its own copy of the socket open, so a connection that arrives while the application exits waits for the next start.

The helper counts HTTP requests only. A server-sent events stream counts until the client disconnects, but an open WebSocket connection doesn't. If your application uses WebSockets, also count the sockets of the server's `upgrade` event until they close.

#### Things to keep in mind

- Use `Restart=on-failure`, not `Restart=always`. With `always`, systemd starts the application again right after it exits on idle.
- Health checks and uptime monitors that send requests to the application start it and keep it running.
- Scheduled jobs (see [Task scheduling](/application/task-scheduling)) and queue consumers don't run while the application is stopped. Run them in a process that stays up.
- The first request after a pause waits for the whole bootstrap, including database connections opened by [async providers](/fundamentals/async-providers). The [Serverless](/faq/serverless) chapter shows ways to shorten it. Node.js can also reuse its [compile cache](https://nodejs.org/api/module.html#module-compile-cache) between starts: add `Environment=NODE_COMPILE_CACHE=/var/cache/my-app` and `CacheDirectory=my-app` to the service unit. Node.js writes the cache when the process exits, and a process killed by `SIGTERM` without `enableShutdownHooks()` doesn't write it.
