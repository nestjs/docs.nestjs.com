### Testing

Tests of code that calls models don't call a model provider: `FakeModel`, from `@nestjs/ai/testing`, is a language model that answers each call with the next of the answers you give it, and records every call it receives.

The fake model is a real `LanguageModel`, so everything around it runs as in production: the module's settings, retries, timeouts and fallback models, schemas, agent functions and their enhancers, and streaming. Only the network is left out.

#### The fake model

A `FakeModel` takes its answers in order:

```typescript
import { FakeModel, providerError } from '@nestjs/ai/testing';

const model = new FakeModel([
  // 1. Text
  'Your order has shipped.',
  // 2. A tool call, and the answer after it, a function of the call
  { toolCalls: [{ name: 'find-order', input: { orderId: 'ord_123' } }] },
  (call) => `The order is ${JSON.stringify(call.toolResults[0].output)}`,
  // 3. An object, for generateObject()
  { object: { category: 'shipping', orderId: 'ord_123', urgent: false } },
  // 4. A provider's error: overloaded
  providerError(529),
]);
```

| Answer | What the model does |
| --- | --- |
| A string | Answers with that text |
| `{{ '{' }} text {{ '}' }}` | The same, with the options below |
| `{{ '{' }} toolCalls {{ '}' }}` | Calls tools, each with its `name`, `input` (default `{{ '{' }}{{ '}' }}`) and `id` (default `call-1`, `call-2`, ...) |
| `{{ '{' }} object {{ '}' }}` | Answers with the object as JSON, which `generateObject()` reads |
| An `Error` | Fails with it, as a provider's request does |
| A function of the call | Answers with what it returns, any of the above, or a promise of it |

An answer object also takes:

| Option | What it does |
| --- | --- |
| `usage` | The tokens the answer reports: `inputTokens` and `outputTokens` (10 each by default), `cachedInputTokens`, `reasoningTokens` |
| `finishReason` | Default `'tool-calls'` with tool calls, else `'stop'` |
| `delay` | Milliseconds before it answers, or before a stream opens. The call's abort, and its timeout, cut it short |
| `chunkDelay` | Milliseconds between the chunks of a stream, which sends its text in word-sized chunks |
| `streamError` | An error the stream fails with after its text, as a connection that breaks |

Given a function instead of a list, `new FakeModel((call) => ...)` answers every call with it. `reply(...answers)` adds answers after the ones not used yet, and `fakeModel(...answers)` is `new FakeModel(answers)`. A call it has no answer left for fails: `FakeModel: no answer left for call 4. Give it more answers.`

`providerError(status, {{ '{' }} message, retryAfter {{ '}' }})` is the error an `@ai-sdk/*` provider throws for an HTTP error: an `APICallError`, retryable for 408, 409, 429 and 5xx, with a `retry-after` header when `retryAfter` (in seconds) is set.

`calls` lists what the model received, and `lastCall` is the last one:

| Property | What it is |
| --- | --- |
| `instructions` | The system prompt |
| `lastUserMessage` | The text of the last user message |
| `toolResults` | What the tools of the previous step returned, as the model reads them: `toolName`, `toolCallId` and `output`, which is the error's message for a tool that failed |
| `tools` | The names of the tools the model was offered |
| `stream` | Whether the call was streamed |
| `options` | Everything the model was sent, as the AI SDK's provider-level call options: `prompt`, `tools`, `responseFormat`, `maxOutputTokens`, `headers` and the rest |

#### Testing a service

Register `AiModule` in a testing module, with fake models under the names the service uses:

```typescript
@@filename(support/triage.service.spec)
import { Test } from '@nestjs/testing';
import { AiModule } from '@nestjs/ai';
import { FakeModel } from '@nestjs/ai/testing';
import { TriageService } from './triage.service';

describe('TriageService', () => {
  it('sorts an email', async () => {
    const fast = new FakeModel([
      { object: { category: 'shipping', orderId: 'ord_123', urgent: true } },
    ]);
    const moduleRef = await Test.createTestingModule({
      imports: [
        AiModule.forRoot({ models: { default: new FakeModel(), fast } }),
      ],
      providers: [TriageService],
    }).compile();

    const triage = await moduleRef
      .get(TriageService)
      .triage('Where is ord_123? It was due on Monday.');

    expect(triage).toEqual({
      category: 'shipping',
      orderId: 'ord_123',
      urgent: true,
    });
    expect(fast.lastCall?.instructions).toContain('support email');
    expect(fast.lastCall?.lastUserMessage).toBe(
      'Where is ord_123? It was due on Monday.',
    );
    expect(fast.lastCall?.options.responseFormat).toMatchObject({
      type: 'json',
    });
  });
});
```

An answer that doesn't match the schema tests the service's handling of `AiOutputError`: give the model `'Sure! Here it is.'`, or an object with a field missing.

#### Retries, timeouts and fallback

`providerError()` and `delay` test what happens when a provider fails, or takes too long. Give the module's retries no backoff, and its attempts a short timeout, so the test doesn't wait:

```typescript
@@filename(support/replies.service.spec)
import { Test } from '@nestjs/testing';
import { AiModelError, AiModule } from '@nestjs/ai';
import { FakeModel, providerError } from '@nestjs/ai/testing';
import { ResilienceTimeoutError } from '@nestjs/resilience';
import { RepliesService } from './replies.service';

async function createReplies(fast: FakeModel, main: FakeModel) {
  const moduleRef = await Test.createTestingModule({
    imports: [
      AiModule.forRoot({
        models: { default: main, fast: { model: fast, fallback: 'default' } },
        defaults: {
          timeout: 50,
          retry: { attempts: 2, backoff: { delay: 0 } },
        },
      }),
    ],
    providers: [RepliesService],
  }).compile();
  return moduleRef.get(RepliesService);
}

describe('RepliesService', () => {
  it('falls back to the default model when the fast one fails', async () => {
    const fast = new FakeModel([providerError(529), providerError(529)]);
    const main = new FakeModel(['Thanks for writing in!']);
    const replies = await createReplies(fast, main);

    await expect(replies.draft('Hello')).resolves.toBe(
      'Thanks for writing in!',
    );
    expect(fast.calls).toHaveLength(2);
  });

  it('gives up when every model fails', async () => {
    const fast = new FakeModel(() => providerError(500));
    const main = new FakeModel(() => ({ text: 'Too late', delay: 1_000 }));
    const replies = await createReplies(fast, main);

    const error = await replies.draft('Hello').catch((error: unknown) => error);

    expect(error).toBeInstanceOf(AiModelError);
    expect((error as AiModelError).attempts).toHaveLength(4);
    expect((error as AiModelError).cause).toBeInstanceOf(
      ResilienceTimeoutError,
    );
  });
});
```

The fast model fails twice, and the default one takes longer than the 50 milliseconds each attempt has, twice: four attempts in all, and the last one's error is the `cause`.

#### Overriding models in end-to-end tests

`overrideModels()` puts fake models in place of the application's own, by name, and keeps the rest of their definitions: their pricing, fallback models, timeouts and retries. A name the module doesn't configure fails when the testing module compiles. The models `@InjectModel()` injects are replaced too:

```typescript
@@filename(test/assistant.e2e-spec)
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { FakeModel, overrideModels } from '@nestjs/ai/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('the assistant', () => {
  let app: INestApplication;
  const model = new FakeModel();

  beforeAll(async () => {
    const moduleRef = await overrideModels(
      Test.createTestingModule({ imports: [AppModule] }),
      { default: model },
    ).compile();
    app = await moduleRef.createNestApplication().init();
  });

  afterAll(() => app.close());

  it('looks the order up before it answers', async () => {
    model.reply(
      { toolCalls: [{ name: 'find-order', input: { orderId: 'ord_123' } }] },
      (call) => {
        const order = call.toolResults[0].output as { status: string };
        return `Your order has ${order.status}.`;
      },
    );

    const response = await request(app.getHttpServer())
      .post('/assistant/questions')
      .send({ question: 'Where is ord_123?' })
      .expect(201);

    expect(response.body).toEqual({ answer: 'Your order has shipped.' });
    expect(model.calls.map((call) => call.tools)).toEqual([
      ['find-order'],
      ['find-order'],
    ]);
  });
});
```

The agent functions run for real, with their schemas, guards and filters: a function's failure reaches the model as the tool's result, which the test reads in the next call's `toolResults`:

```typescript
it('tells the model when there is no such order', async () => {
  model.reply(
    { toolCalls: [{ name: 'find-order', input: { orderId: 'ord_999' } }] },
    'I could not find that order.',
  );

  await request(app.getHttpServer())
    .post('/assistant/questions')
    .send({ question: 'Where is ord_999?' })
    .expect(201);

  expect(model.lastCall?.toolResults).toEqual([
    expect.objectContaining({
      toolName: 'find-order',
      output: 'There is no order ord_999',
    }),
  ]);
});
```

#### Testing agent functions

`callTool()` runs an agent function as a model's tool call does, with no model: the arguments validated by its schema, its scopes checked, then its guards, interceptors, pipes and filters, and the method. It resolves with what the model would read, and rejects with the `AiToolError` the model would read about a failure:

```typescript
@@filename(assistant/assistant.tools.spec)
import { Test, type TestingModule } from '@nestjs/testing';
import { AiModule } from '@nestjs/ai';
import { callTool, FakeModel } from '@nestjs/ai/testing';
import { OrdersModule } from '../orders/orders.module';
import { AssistantModule } from './assistant.module';

describe('change-address', () => {
  let moduleRef: TestingModule;
  const alice = { request: { user: { id: 'cus_alice' } } };
  const bob = { request: { user: { id: 'cus_bob' } } };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        AiModule.forRoot({
          isGlobal: true,
          models: { default: new FakeModel() },
        }),
        OrdersModule,
        AssistantModule,
      ],
    }).compile();
  });

  afterAll(() => moduleRef.close());

  it("changes the address of the customer's own order", async () => {
    const address = { orderId: 'ord_123', address: '12 Whisker Lane, Leeds' };
    await expect(
      callTool(moduleRef, 'change-address', address, { caller: alice }),
    ).resolves.toEqual({ id: 'ord_123', address: '12 Whisker Lane, Leeds' });
  });

  it("refuses another customer's order", async () => {
    const address = { orderId: 'ord_123', address: '12 Whisker Lane, Leeds' };
    await expect(
      callTool(moduleRef, 'change-address', address, { caller: bob }),
    ).rejects.toThrow('Forbidden resource');
  });

  it('validates the address', async () => {
    const address = { orderId: 'ord_123', address: 'Leeds' };
    await expect(
      callTool(moduleRef, 'change-address', address, { caller: alice }),
    ).rejects.toThrow('Too small');
  });
});
```

`caller` is what a call's `caller` is: a `request`, as the route's, or a `user` and `scopes`. `callTool()` initializes the testing module if it isn't yet. A method that serves MCP clients too is tested as an MCP tool with the [in-memory client](/mcp/testing) of `@nestjs/mcp/testing`, whose calls have the context type `'mcp'`.

A unit test calls the method itself, with the context it needs. A direct call skips everything around the method: the schema, the scopes and the enhancers. The refund of a [durable run](/ai/agents#durable-agent-runs) passes its call's `idempotencyKey` on to the payment provider:

```typescript
@@filename(refunds/refund.tools.spec)
import type { AgentFunctionContext } from '@nestjs/ai';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { RefundTools } from './refund.tools';

describe('RefundTools', () => {
  const orders = {
    findById: vi.fn().mockResolvedValue({
      id: 'ord_123',
      paymentId: 'pay_123',
      total: 4200,
    }),
  };
  const payments = { refund: vi.fn() };
  const tools = new RefundTools(
    orders as unknown as OrdersService,
    payments as unknown as PaymentsService,
  );
  const ctx = {
    idempotencyKey: 'refund-1:tool-1-call-2',
    signal: new AbortController().signal,
  } as AgentFunctionContext;

  it("refunds the order with the call's idempotency key", async () => {
    await expect(tools.refund({ orderId: 'ord_123' }, ctx)).resolves.toEqual({
      refunded: 'ord_123',
      amount: 4200,
    });
    expect(payments.refund).toHaveBeenCalledWith('pay_123', 4200, {
      idempotencyKey: 'refund-1:tool-1-call-2',
    });
  });

  it("doesn't refund an order that doesn't exist", async () => {
    orders.findById.mockResolvedValueOnce(undefined);
    await expect(tools.refund({ orderId: 'ord_999' }, ctx)).rejects.toThrow(
      'There is no order ord_999',
    );
  });
});
```

#### Testing streams

The fake model streams its text in word-sized chunks, so a stream reads as it would from a provider. In an end-to-end test, the response of a chat route is a server-sent events body, whose events are the UI message stream's chunks:

```typescript
it('streams the answer, with the tool call', async () => {
  model.reply(
    { toolCalls: [{ name: 'find-order', input: { orderId: 'ord_123' } }] },
    'Your order has shipped.',
  );

  const response = await request(app.getHttpServer())
    .post('/assistant/chat')
    .send({
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          parts: [{ type: 'text', text: 'Where is ord_123?' }],
        },
      ],
    })
    .expect(200)
    .expect('content-type', 'text/event-stream');

  const chunks = response.text
    .split('\n\n')
    .filter((event) => event.startsWith('data: {'))
    .map((event) => JSON.parse(event.slice('data: '.length)));
  expect(chunks).toContainEqual(
    expect.objectContaining({
      type: 'tool-output-available',
      output: { id: 'ord_123', status: 'shipped', total: 4200 },
    }),
  );
  const text = chunks
    .filter((chunk) => chunk.type === 'text-delta')
    .map((chunk) => chunk.delta)
    .join('');
  expect(text).toBe('Your order has shipped.');
});
```

`streamError` tests a stream that breaks after its first chunk, `{{ '{' }} text: 'Your order', streamError: providerError(500) {{ '}' }}`: the body then ends with an `error` chunk that says `An error occurred.`. Outside HTTP, read the stream of `streamText()` itself, as `textStream`, or its `text` promise.

#### Testing durable runs

A durable run is tested with the workflows engine running in the test, on its in-memory store, with a `ManualWorkflowClock` and its worker turned off: `WorkflowWorker.drain()` runs the instances that are due, until none is left that can run, so the test decides when the run moves on:

```typescript
@@filename(refunds/refund-request.workflow.spec)
import { Test, type TestingModule } from '@nestjs/testing';
import { AiModule } from '@nestjs/ai';
import { FakeModel } from '@nestjs/ai/testing';
import { AiAgents } from '@nestjs/ai/workflows';
import {
  ManualWorkflowClock,
  WorkflowClient,
  WorkflowsModule,
  WorkflowWorker,
} from '@nestjs/workflows';
import { PaymentsService } from '../payments/payments.service';
import { RefundRequest } from './refund-request.workflow';
import { RefundsModule } from './refunds.module';

describe('RefundRequest', () => {
  let moduleRef: TestingModule;
  const payments = { refund: vi.fn() };
  const model = new FakeModel([
    { toolCalls: [{ name: 'find-order', input: { orderId: 'ord_123' } }] },
    { toolCalls: [{ name: 'refund', input: { orderId: 'ord_123' } }] },
    'Your order ord_123 is refunded.',
  ]);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        WorkflowsModule.forRoot({
          clock: new ManualWorkflowClock(),
          worker: false,
        }),
        AiModule.forRoot({ isGlobal: true, models: { default: model } }),
        RefundsModule,
      ],
    })
      .overrideProvider(PaymentsService)
      .useValue(payments)
      .compile();
    await moduleRef.init();
  });

  afterAll(() => moduleRef.close());

  it('refunds the order once the support team approves', async () => {
    const workflows = moduleRef.get(WorkflowClient);
    const worker = moduleRef.get(WorkflowWorker);
    const agents = moduleRef.get(AiAgents);

    await workflows.start(
      RefundRequest,
      { email: 'Please refund ord_123', customerId: 'cus_alice' },
      { id: 'refund-1' },
    );
    await worker.drain();

    const [pending] = await agents.pendingApprovals('refund-1');
    expect(pending).toMatchObject({
      toolName: 'refund',
      input: { orderId: 'ord_123' },
    });
    expect(payments.refund).not.toHaveBeenCalled();

    await agents.approve(pending.key);
    await worker.drain();

    expect(payments.refund).toHaveBeenCalledTimes(1);
    expect(await workflows.getStatus('refund-1')).toMatchObject({
      status: 'completed',
      output: { text: 'Your order ord_123 is refunded.' },
    });
  });
});
```

The model calls and the tool calls the run made before the approval are read back from the journal when it resumes: the fake model is called three times in all. To test a restart, boot a second application on the same store, as [Test crash recovery](/reliability/workflows#test-crash-recovery) shows for any workflow.

#### Testing embeddings

`FakeEmbeddingModel` is the fake model for [embedding calls](/ai/embeddings): a real `EmbeddingModel`, which answers each provider request with the next of the answers you give it, and records the request. It makes up no vectors: an answer has one for each value of the request.

```typescript
@@filename(catalog/search.service.spec)
import { Test } from '@nestjs/testing';
import { AiModule } from '@nestjs/ai';
import { FakeEmbeddingModel, providerError } from '@nestjs/ai/testing';
import { ProductsRepository } from './products.repository';
import { SearchService } from './search.service';

describe('SearchService', () => {
  const products = { saveEmbeddings: vi.fn(), findNearest: vi.fn() };

  async function createSearch(model: FakeEmbeddingModel) {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AiModule.forRoot({
          embeddingModels: { default: model },
          embeddingDefaults: {
            retry: { attempts: 2, backoff: { delay: 0 } },
          },
        }),
      ],
      providers: [
        SearchService,
        { provide: ProductsRepository, useValue: products },
      ],
    }).compile();
    return moduleRef.get(SearchService);
  }

  it('finds the products nearest to the search', async () => {
    const model = new FakeEmbeddingModel([{ embeddings: [[0.1, 0.2]] }]);
    const search = await createSearch(model);

    await search.search("my cat won't eat");

    expect(model.lastCall?.values).toEqual(["my cat won't eat"]);
    expect(products.findNearest).toHaveBeenCalledWith([0.1, 0.2], 10);
  });

  it('sends a failed request again, and only that one', async () => {
    const model = new FakeEmbeddingModel(
      [{ embeddings: [[1]] }, providerError(429), { embeddings: [[2]] }],
      { maxEmbeddingsPerCall: 1, supportsParallelCalls: false },
    );
    const search = await createSearch(model);
    const catalog = [
      { id: 'prd_1', description: 'Salmon pate' },
      { id: 'prd_2', description: 'Catnip mouse' },
    ];

    await search.index(catalog);

    expect(model.calls.map((call) => call.values)).toEqual([
      ['Salmon pate'],
      ['Catnip mouse'],
      ['Catnip mouse'],
    ]);
    expect(products.saveEmbeddings).toHaveBeenCalledWith(catalog, [[1], [2]]);
  });
});
```

The second argument says how the AI SDK splits values, as a provider's model does: here each value is a request of its own, and they are sent one at a time, so the test knows their order. It also takes `provider` and `modelId`. Without it, the model has no limit, and `embedMany()` makes one request.

| Answer | What the model does |
| --- | --- |
| `{{ '{' }} embeddings {{ '}' }}` | Answers with the vectors, one for each value of the request |
| An `Error` | Fails with it, as a provider's request does |
| A function of the call | Answers with what it returns, any of the above, or a promise of it |

An answer object also takes:

| Option | What it does |
| --- | --- |
| `usage` | The tokens the answer reports: `{{ '{' }} tokens {{ '}' }}`, 10 per value by default |
| `delay` | Milliseconds before it answers. The call's abort, and its timeout, cut it short |
| `warnings`, `providerMetadata`, `response` | What the provider adds to its vectors |

Given a function instead of a list, `new FakeEmbeddingModel((call) => ...)` answers every request with it, which suits a test that doesn't care how the values are split. `reply(...answers)` adds answers after the ones not used yet, and `fakeEmbeddingModel(...answers)` is `new FakeEmbeddingModel(answers)`. A request it has no answer left for fails: `FakeEmbeddingModel: no answer left for call 3. Give it more answers.`

`calls` lists what the model received, each with its `values` and its `options`, the AI SDK's provider-level call options such as `abortSignal`, `headers` and `providerOptions`, and `lastCall` is the last one.

`overrideEmbeddingModels()` does for embedding models what `overrideModels()` does for language models: it puts fake models in place of the application's own, by name, and keeps the rest of their definitions, their settings and pricing. A name the module doesn't configure fails when the testing module compiles. The models `@InjectEmbeddingModel()` injects are replaced too:

```typescript
@@filename(test/search.e2e-spec)
import { Test } from '@nestjs/testing';
import {
  FakeEmbeddingModel,
  overrideEmbeddingModels,
} from '@nestjs/ai/testing';
import { AppModule } from '../src/app.module';

const model = new FakeEmbeddingModel(({ values }) => ({
  embeddings: values.map(() => [0.1, 0.2]),
}));

const moduleRef = await overrideEmbeddingModels(
  Test.createTestingModule({ imports: [AppModule] }),
  { default: model },
).compile();
```

To replace language models in the same test, pass what `overrideEmbeddingModels()` returns to `overrideModels()`.
