### Server-Sent Events

Server-Sent Events (SSE) is a server push technology that enables a client to receive automatic updates from a server over an HTTP connection. Each notification is sent as a block of text terminated by a pair of newlines (see [Server-sent events on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) to learn more).

#### Usage

To enable Server-Sent Events on a route (a route registered within a **controller class**), annotate the route handler with the `@Sse()` decorator.

```typescript
@Sse('sse')
sse(): Observable<MessageEvent> {
  return interval(1000).pipe(map((_) => ({ data: { hello: 'world' } })));
}
```

> info **Hint** The `@Sse()` decorator and the `MessageEvent` interface are imported from the `@nestjs/common` package, while `Observable`, `interval`, and `map` are imported from the `rxjs` package.

> warning **Warning** Server-Sent Events routes must return an `Observable` stream (or a `Promise` that resolves to one, as shown [below](/http/server-sent-events#client-disconnection)).

In the example above, we defined a route named `sse` that propagates real-time updates. Clients can listen to these events using the [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).

The `sse()` method returns an `Observable` that emits multiple `MessageEvent` objects (in this example, a new `MessageEvent` every second). Each `MessageEvent` object should respect the following interface to match the specification:

```typescript
export interface MessageEvent {
  data?: string | object;
  id?: string;
  type?: string;
  retry?: number;
  comment?: string;
}
```

Object `data` is serialized to JSON. The `type` property is sent as the SSE `event` field, and `comment` is sent as a comment line, which `EventSource` clients ignore (useful, for example, as a keep-alive). If you don't set `id`, Nest assigns an incrementing ID to each event.

With this in place, you can create an instance of the `EventSource` class in your client-side application, passing the `/sse` route (which matches the path passed to the `@Sse()` decorator above) as a constructor argument.

An `EventSource` instance opens a persistent connection to an HTTP server, which sends events in `text/event-stream` format. The connection remains open until it's closed by calling `EventSource.close()`.

Once the connection is open, incoming messages from the server are delivered to your code in the form of events. If the incoming message has an `event` field, the triggered event has the same name as the field value. If no `event` field is present, a generic `message` event is fired (see the [EventSource documentation on MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)).

```javascript
const eventSource = new EventSource('/sse');
eventSource.onmessage = ({ data }) => {
  console.log('New message', JSON.parse(data));
};
```

#### Client disconnection

When a client closes the SSE connection (e.g., with `eventSource.close()`), Nest automatically unsubscribes from the returned `Observable`. This stops the event stream and cleans up any associated resources, including the interval timer in the example above.

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

> info **Hint** The `finalize` operator (imported from `rxjs`) executes its callback whenever the `Observable` terminates: by completion, error, or unsubscription (which includes client disconnection). This makes it the right place to release external resources, such as database cursors or file handles, tied to the stream.

An `@Sse()` handler can be asynchronous, returning a `Promise<Observable>` rather than an `Observable` directly. This is common when the stream needs expensive setup before the first event can be produced, such as opening a database cursor, acquiring a model session, or authorizing against a downstream service.

```typescript
@Sse('stream')
async stream(): Promise<Observable<MessageEvent>> {
  const session = await createSession();

  return new Observable(subscriber => {
    // ...produce events from `session`
  });
}
```

This leaves a gap. If the client disconnects **while the promise is still resolving**, Nest never subscribes to the returned `Observable`, because it doesn't start a producer whose consumer has already gone away. That's the right behavior for the stream, but it means the `Observable`'s teardown logic never runs, and anything allocated during setup (the `session` above) leaks.

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

The signal represents the lifetime of the **SSE response**, not only the connection. It's aborted once the stream terminates for any reason:

- the client disconnected;
- the `Observable` completed;
- the `Observable` errored.

This makes the signal a single cleanup hook for the whole request. Instead of duplicating teardown across an `abort` listener and the `Observable`'s own teardown function, you can wire resources to the signal once and have them released on every exit path:

```typescript
@Sse('stream')
async stream(@SseSignal() signal: AbortSignal): Promise<Observable<MessageEvent>> {
  // The signal aborts when the response ends, so the fetch is canceled whether
  // the client disconnected or the stream simply finished.
  const upstream = await fetch(UPSTREAM_URL, { signal });

  return new Observable(subscriber => {
    // ...
  });
}
```

Because the signal also aborts on normal completion, `signal.aborted` is only meaningful as a "did the client go away?" check **during setup**, before the `Observable` is returned. At that point, the stream can't have completed yet, so an aborted signal unambiguously means the client disconnected.

> warning **Notice** Cleanup wired to the `abort` event may run alongside the `Observable`'s teardown function, so make it idempotent.

Inside a producer, you can also use the signal to end the stream when the client leaves:

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

> info **Hint** `@SseSignal()` is only populated on `@Sse()` routes; on any other route handler, it resolves to `undefined`. It works the same way on the Express and Fastify platforms.

#### Example

A working example is available in the [28-sse sample](https://github.com/nestjs/nest/tree/master/sample/28-sse).
