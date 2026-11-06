### Streaming responses

A route handler can return a web-standard `Response`, a `ReadableStream`, or an async iterable such as an async generator. Nest sends it as it is produced, with backpressure, and stops it when the client goes away. It works the same on the Express, Fastify, and Node adapters.

Use it for answers that take a while to produce or are too large to hold in memory: the tokens of an LLM, a request proxied to another API, a large export.

> info **Hint** This needs `@nestjs/core` 12.4.0 or later. On older versions, most of these values are answered with an empty JSON object and a 200.

#### Returning a stream

The shortest way to stream is an async generator. Each value it yields is sent as soon as the client can take it:

```typescript
@Get('story')
async *story() {
  for await (const token of this.llm.stream('Tell me a story')) {
    yield token;
  }
}
```

If you already have a `Response`, return it. The AI SDK's `toTextStreamResponse()` returns one, and `fetch()` resolves to one, as a promise or an `Observable` of one works too. To stop the model call when the client leaves, see [Client disconnection](/http/streaming-responses#client-disconnection):

```typescript
@Post('chat')
chat(@Body() { messages }: ChatDto) {
  return streamText({ model, messages }).toTextStreamResponse();
}

@Get('quotes')
quotes() {
  return fetch('https://quotes.example.com/latest');
}
```

A `ReadableStream` gives you the most control, as it knows at once when the client has left (see [Client disconnection](/http/streaming-responses#client-disconnection)):

```typescript
@Get('ticker')
ticker() {
  let timer: NodeJS.Timeout;
  return new ReadableStream({
    start(controller) {
      timer = setInterval(() => controller.enqueue(`${Date.now()}\n`), 1000);
    },
    cancel() {
      clearInterval(timer);
    },
  });
}
```

> info **Hint** `Response` and `ReadableStream` are globals of Node.js, so there is nothing to import.

Any other object with a `Symbol.asyncIterator` method counts as well, a Node.js `Readable` among them. Arrays, `Set`s, and other sync iterables are still serialized as JSON. A thenable that also has that method, such as a Mongoose query, is awaited as usual.

#### What a stream can yield

Each chunk is sent according to its type:

| Chunk                                       | Sent as                                      | Default `Content-Type`      |
| ------------------------------------------- | -------------------------------------------- | --------------------------- |
| String                                      | UTF-8 text                                   | `text/plain; charset=utf-8` |
| `Uint8Array`, `Buffer`, other binary data   | The bytes as they are                        | `application/octet-stream`  |
| Anything else                               | A line of JSON ([NDJSON](https://ndjson.org)) | `application/x-ndjson`      |

The first chunk decides the default `Content-Type`. Set your own with `@Header()`, which takes precedence:

```typescript
@Get('events')
@Header('Content-Type', 'text/event-stream')
async *events() {
  yield 'data: hello\n\n';
}
```

An `undefined` chunk sends nothing, and a chunk that `JSON.stringify()` rejects, such as a `BigInt`, fails the stream.

#### Status and headers

With a generator or a `ReadableStream`, `@HttpCode()` and `@Header()` apply as on any other route. That includes the default status of `POST`, which is 201: add `@HttpCode(200)` if your clients expect a 200.

A `Response` is the whole answer, so its status and headers take precedence over those set before it, by `@HttpCode()`, `@Header()`, a guard, or a middleware. Headers it doesn't set stay in place, such as CORS headers, and its `Set-Cookie` values are added to the ones already there. A `Response` without a `Content-Type` is sent as `application/octet-stream`, unless a `@Header()` or a middleware has set another. A `Response` always has a status, 200 unless you set one, so `@HttpCode()` has no effect on it.

```typescript
@Post('jobs')
createJob() {
  // A 202, not the 201 of POST. CORS headers set earlier are kept.
  return new Response(this.jobs.progress(), {
    status: 202,
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}
```

A `Response` with a `null` body, such as a 204 or what `Response.redirect()` makes, is sent with its status and headers and no body.

`fetch()` decodes the body of the response it returns, but leaves its `Content-Encoding` and `Content-Length` headers in place, along with those describing its connection, such as `Keep-Alive`. Nest drops these from a `Response` that comes from `fetch()`, so that you can return it as it is. A `Response` you build from one, as with `new Response(upstream.body, upstream)`, is sent with the headers you gave it, so leave those out yourself.

#### Errors

The headers wait for the first chunk, because no exception filter can answer once they are sent. So an error before the first chunk is like any other error in a route handler: it goes through the [exception filters](/exception-filters), and the client gets a proper error response.

```typescript
@Get('story')
async *story() {
  // Answered with a 404
  const story = await this.findStory();
  if (!story) {
    throw new NotFoundException();
  }
  yield* story.chapters;
}
```

To send the headers before the first chunk is ready, for example so that a client knows the connection is open, yield an empty string first. From then on, errors can no longer reach the exception filters.

Once the headers are sent, an error is logged, and the connection is closed abruptly rather than ended, so that a truncated answer cannot be mistaken for a complete one: `fetch()` rejects while reading the body, and `curl` reports an error. If your clients need to know what went wrong, make that part of what you stream, and catch the error yourself in the generator.

A body that has been read already (with `await response.text()`, for example) or that is locked can't be sent, so it fails with a 500 instead of sending nothing. An async generator can't tell: one that has run to its end simply sends nothing.

#### Client disconnection

When the client goes away, also before the first chunk, Nest stops the stream, so that a paid LLM call doesn't run on for nobody:

- a `ReadableStream`, or the body of a `Response`, is cancelled, which calls its `cancel()` at once;
- a Node.js `Readable` is destroyed;
- an async generator's `return()` is called, which runs its `finally` blocks.

```typescript
@Get('story')
async *story() {
  const llm = await this.llm.connect();
  try {
    for await (const token of llm.stream('Tell me a story')) {
      yield token;
    }
  } finally {
    await llm.close();
  }
}
```

> warning **Warning** JavaScript queues `return()` until an async generator's next `yield`, so a generator waiting in an `await` stops only once that `await` settles. If an upstream can go quiet for a long time, use a `ReadableStream`, whose `cancel()` runs immediately.

Stopping a stream doesn't always stop what feeds it. Cancelling the `Response` of the AI SDK's `toTextStreamResponse()`, for one, leaves the model call running to its end, and to its bill, unless its `abortSignal` is aborted. To stop the call when the client leaves, abort it from `cancel()`:

```typescript
@Post('chat')
chat(@Body() { messages }: ChatDto) {
  const abort = new AbortController();
  const answer = streamText({ model, messages, abortSignal: abort.signal });
  const reader = answer.textStream.getReader();
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    cancel() {
      abort.abort();
    },
  });
}
```

Check this for any `Response` a library gives you.

#### Slow clients

The next chunk is read only when the client can take it, so a client that reads slowly slows the producer down instead of filling the server's memory. An async generator simply stays paused at its `yield`, and a `ReadableStream`'s `pull()` isn't called.

Something between Nest and the client can still hold chunks back. The [compression](/http/compression) middleware and proxies such as nginx buffer the response: for nginx, set the `X-Accel-Buffering: no` header.

#### HEAD requests

A `HEAD` request doesn't read the stream: a generator doesn't even start, and a `ReadableStream` is cancelled. The status and headers are sent as usual, but as the first chunk is never read, a route that relies on the default `Content-Type` answers `application/octet-stream`. Set it with `@Header()` if it matters.

#### Interceptors

An [interceptor](/interceptors) sees the stream as a single value, which reaches it before streaming starts. So its `finalize()` and `timeout()` are over before the stream is, and interceptors don't see the chunks.

A stream can't be sent as part of something else. If an interceptor wraps or serializes it, as a global one that puts every result under a `data` key does, Nest sends the handler's stream as it is, and other routes keep their wrapper. An interceptor can still:

- pass it on, as with `tap()`;
- replace it with another stream, for example one that reads the first and changes each chunk;
- read it and return a value of its own, which Nest then sends instead.

Neither the `ClassSerializerInterceptor` nor the `StandardSchemaSerializerInterceptor` [serializes](/application/serialization) these values.

#### Handlers that use @Res()

A handler that injects the response with `@Res()` sends it itself, so Nest ignores what it returns, and a generator never starts. With the `passthrough` option of `@Res()`, the returned stream is sent as usual.

#### Choosing how to stream

- **A stream**, as described here, for anything produced over time, in any format, read with `fetch()`.
- [**`@Sse()`**](/http/server-sent-events) for events sent to an `EventSource` from an `Observable`, with event ids and the reconnection they allow.
- [**`StreamableFile`**](/http/file-upload#streaming-files) for files, with their `Content-Disposition` and `Content-Length`.
