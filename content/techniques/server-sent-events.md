### Server-Sent Events

Server-Sent Events (SSE) is a server push technology enabling a client to receive automatic updates from a server via HTTP connection. Each notification is sent as a block of text terminated by a pair of newlines (learn more [here](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)).

#### Usage

To enable Server-Sent events on a route (route registered within a **controller class**), annotate the method handler with the `@Sse()` decorator.

```typescript
@Sse('sse')
sse(): Observable<MessageEvent> {
  return interval(1000).pipe(map((_) => ({ data: { hello: 'world' } })));
}
```

> info **Hint** The `@Sse()` decorator and `MessageEvent` interface are imported from the `@nestjs/common`, while `Observable`, `interval`, and `map` are imported from the `rxjs` package.

> warning **Warning** Server-Sent Events routes must return an `Observable` stream.

In the example above, we defined a route named `sse` that will allow us to propagate real-time updates. These events can be listened to using the [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).

The `sse` method returns an `Observable` that emits multiple `MessageEvent` (in this example, it emits a new `MessageEvent` every second). The `MessageEvent` object should respect the following interface to match the specification:

```typescript
export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}
```

With this in place, we can now create an instance of the `EventSource` class in our client-side application, passing the `/sse` route (which matches the endpoint we have passed into the `@Sse()` decorator above) as a constructor argument.

`EventSource` instance opens a persistent connection to an HTTP server, which sends events in `text/event-stream` format. The connection remains open until closed by calling `EventSource.close()`.

Once the connection is opened, incoming messages from the server are delivered to your code in the form of events. If there is an event field in the incoming message, the triggered event is the same as the event field value. If no event field is present, then a generic `message` event is fired ([source](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)).

```javascript
const eventSource = new EventSource('/sse');
eventSource.onmessage = ({ data }) => {
  console.log('New message', JSON.parse(data));
};
```

#### Client disconnection

When a client closes the SSE connection (e.g., `eventSource.close()`), NestJS automatically unsubscribes from the returned Observable, which stops the event stream and cleans up any associated resources — including the interval timer in the example above.

To run custom teardown logic when a client disconnects, use the `finalize` operator:

```typescript
@Sse('sse')
sse(): Observable<MessageEvent> {
  return interval(1000).pipe(
    map((_) => ({ data: { hello: 'world' } })),
    finalize(() => console.log('Client disconnected')),
  );
}
```

> info **Hint** The `finalize` operator (imported from `rxjs`) executes its callback whenever the Observable terminates — by completion, error, or unsubscription (which includes client disconnect). This makes it the right place to release external resources such as database cursors or file handles tied to the stream.

An `@Sse()` handler may be asynchronous — returning a `Promise<Observable>` rather than an `Observable` directly. This is common when the stream needs expensive setup before the first event can be produced: opening a database cursor, acquiring a model session, or authorizing against a downstream service.

```typescript
@Sse('stream')
async stream(): Promise<Observable<MessageEvent>> {
  const session = await createSession();

  return new Observable(subscriber => {
    // ...produce events from `session`
  });
}
```

There is a gap here. If the client disconnects **while the promise is still resolving**, the returned `Observable` is never subscribed — Nest will not start a producer whose consumer has already gone away. That is the right behaviour for the stream, but it means the `Observable`'s teardown logic never runs, and anything allocated during setup (the `session` above) is leaked.

To close that gap, inject the request's `AbortSignal` with the `@SseSignal()` decorator:

```typescript
import { MessageEvent, Sse, SseSignal } from '@nestjs/common';
import { EMPTY, Observable } from 'rxjs';

@Sse('stream')
async stream(@SseSignal() signal: AbortSignal): Promise<Observable<MessageEvent>> {
  const session = await createSession();

  if (signal.aborted) {
    // The client disconnected during setup. The Observable below will never be
    // subscribed, so release the resource here.
    await session.close();
    return EMPTY;
  }

  return new Observable(subscriber => {
    const stream = session.start();
    stream.on('data', data => subscriber.next({ data }));

    return () => {
      stream.stop();
      session.close();
    };
  });
}
```

#### Signal lifetime

The signal represents the lifetime of the **SSE response**, not just the connection. It is aborted once the stream terminates for any reason:

- the client disconnected;
- the `Observable` completed;
- the `Observable` errored.

This makes the signal a single cleanup hook for the whole request. Rather than duplicating teardown across an `abort` listener and the `Observable`'s own teardown function, you can wire resources to the signal once and have them released on every exit path:

```typescript
@Sse('stream')
async stream(@SseSignal() signal: AbortSignal): Promise<Observable<MessageEvent>> {
  // The signal aborts when the response ends, so the fetch is cancelled whether
  // the client disconnected or the stream simply finished.
  const upstream = await fetch(UPSTREAM_URL, { signal });

  return new Observable(subscriber => {
    // ...
  });
}
```

Because the signal also aborts on normal completion, `signal.aborted` is only meaningful as a "did the client go away?" check **during setup** — before the `Observable` is returned. At that point the stream cannot have completed yet, so an aborted signal unambiguously means the client disconnected.

> warning **Notice** Cleanup wired to the `abort` event may run alongside the `Observable`'s teardown function, so make it idempotent.

Inside a producer, the signal is also a convenient way to end the stream when the client leaves:

```typescript
return new Observable<MessageEvent>(subscriber => {
  const timer = setInterval(() => subscriber.next({ data: 'tick' }), 1000);
  const onAbort = () => subscriber.complete();

  signal.addEventListener('abort', onAbort, { once: true });

  return () => {
    clearInterval(timer);
    signal.removeEventListener('abort', onAbort);
  };
});
```

> info **Hint** `@SseSignal()` is only populated on `@Sse()` routes; on any other handler it resolves to `undefined`. It works identically on both the Express and Fastify platforms.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/28-sse).
