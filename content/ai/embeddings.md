### Embeddings

An embedding model turns a text into a vector, so that an application can compare texts by what they mean: `AiService` calls embedding models registered by name, with timeouts, retries and usage events, as it calls language models.

A customer of the store searches for "my cat won't eat", and the search finds nothing: no product says that, and the one they want is a "gentle appetite support for picky eaters". Compared as vectors, the two are close. The store embeds the descriptions of its products once, keeps the vectors next to the products, and embeds each search as it comes in.

The package stops at the vectors. Your application stores them, in PostgreSQL with `pgvector` or in a vector database, and splits long documents into chunks if it needs to.

#### Register the models

Embedding models have a registry of their own, `embeddingModels`, next to `models`. The store's come from OpenAI, through its provider package:

```bash
$ npm i --save @ai-sdk/openai
```

```typescript
@@filename(app.module)
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { Module } from '@nestjs/common';
import { AiModule } from '@nestjs/ai';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [
    AiModule.forRoot({
      isGlobal: true,
      models: { default: anthropic('claude-opus-5-5') },
      embeddingModels: {
        default: openai.embeddingModel('text-embedding-3-small'),
      },
    }),
    CatalogModule,
  ],
})
export class AppModule {}
```

An embedding model is what a provider package returns, as above, or a definition with it as `model` and [settings of its own](/ai/embeddings#embedding-settings). A model id string, such as `'openai/text-embedding-3-small'`, is sent through the [AI Gateway](https://vercel.com/docs/ai-gateway), as it is in `models`.

Calls that name no model use `default`, and the first model registered is never picked in its place. The two registries don't share names: `default` above is one model for `generateText()` and another for `embed()`. An application that only embeds leaves `models` out, and one with no model in either fails at startup.

#### Calling an embedding model

`embed()` embeds one text, and `embedMany()` a list of them:

```typescript
@@filename(catalog/search.service)
import { Injectable } from '@nestjs/common';
import { AiService } from '@nestjs/ai';
import { ProductsRepository, type Product } from './products.repository';

@Injectable()
export class SearchService {
  constructor(
    private readonly ai: AiService,
    private readonly products: ProductsRepository,
  ) {}

  async index(products: Product[]): Promise<void> {
    const { embeddings } = await this.ai.embedMany({
      label: 'index-products',
      values: products.map((product) => product.description),
    });
    await this.products.saveEmbeddings(products, embeddings);
  }

  async search(query: string): Promise<Product[]> {
    const { embedding } = await this.ai.embed({
      label: 'search-products',
      value: query,
    });
    return this.products.findNearest(embedding, 10);
  }
}
```

`model` names one of `embeddingModels`, `default` when it's left out, and `label` names the call in [usage events](/ai/embeddings#usage-and-cost) and in the events of its policies. A call can also take an `EmbeddingModel` as its `model`: it has no settings of its own, and the result's `model.name` is `undefined`. The result has more than the vectors:

| Property | What it is |
| --- | --- |
| `embedding`, `embeddings` | The vector of `embed()`, and the vectors of `embedMany()`, in the order of `values` |
| `value`, `values` | The texts that were embedded |
| `usage` | The tokens the provider reported, summed over its requests: `tokens` |
| `cost` | What the call cost, for a model with `pricing` |
| `attempts` | The provider requests the call made, retries included |
| `model` | The model that answered: its `name`, `provider` and `modelId` |
| `warnings`, `providerMetadata` | What the provider added to its answers |
| `response`, `responses` | The provider's HTTP response to `embed()`, and one for each request of `embedMany()` |

A value that isn't a string, or a model the module doesn't configure, is refused with an `AiConfigurationError` before anything is sent.

To compare two vectors in memory, `cosineSimilarity()` from `ai` takes them and answers a number from -1 to 1. Beyond a few hundred texts, let the database find the nearest ones, with an index.

#### Embedding settings

A definition gives a model settings of its own, and `embeddingDefaults` applies settings to every embedding call. Each setting comes from the call, else from the model's definition, else from `embeddingDefaults`:

```typescript
@@filename(app.module)
import { openai } from '@ai-sdk/openai';
import { Module } from '@nestjs/common';
import { AiModule } from '@nestjs/ai';

@Module({
  imports: [
    AiModule.forRoot({
      isGlobal: true,
      embeddingModels: {
        default: openai.embeddingModel('text-embedding-3-small'),
        documents: {
          model: openai.embeddingModel('text-embedding-3-large'),
          providerOptions: { openai: { dimensions: 1024 } },
          maxParallelCalls: 2,
        },
      },
      embeddingDefaults: { timeout: '30s', retry: { attempts: 5 } },
    }),
  ],
})
export class AppModule {}
```

| Settings | Set on |
| --- | --- |
| `timeout`, `retry`, `resilience` | The call, the model, `embeddingDefaults` |
| `maxParallelCalls`, `providerOptions`, `headers` | The call, the model, `embeddingDefaults` |
| `pricing` | The model |
| `onEmbeddingUsage` | The call, and the module: both are called |
| `abortSignal`, `label` | The call |

The module's `defaults` are for language models, and nothing in them reaches an embedding call: not their timeouts, their headers or their provider options. `budget` and `fallback` are settings of language models only.

`providerOptions` are the provider package's own options, keyed by the provider's name, and `headers` are HTTP headers sent with each request to the provider. The number of dimensions of a vector is such an option, for the models that let you choose it, as `documents` does above.

#### Batches

`embedMany()` takes as many values as you have. The AI SDK splits them into provider requests, with as many values in each as the provider allows, and sends `maxParallelCalls` of those at a time: 4 by default, or one at a time for a model that can't take parallel calls. Whichever request answers first, `embeddings` keeps the order of `values`.

#### Retries, timeouts and cancellation

Every provider request runs under the policies of [`@nestjs/resilience`](/reliability/resilience), built from the same settings as [a language model's](/ai/models#retries-timeouts-and-fallback): `timeout`, `'60s'` by default, and `retry`, 3 attempts by default, which retries what the provider marks retryable and timeouts, and honors a `retry-after` header.

They apply to each request, not to the whole call. `timeout` is how long one request may take, so a call with 20,000 values can run for as long as it needs, and a request that fails is retried alone, without sending the others again.

When a request runs out of attempts, the call rejects with [`AiModelError`](/ai/models#when-a-call-fails), whose `attempts` are that request's, and the requests still running are aborted. `embedMany()` returns every vector or none, so what the finished requests embedded is lost with them. To keep the progress of a big job, send it in groups and save each one, in a queue job or a step of a [workflow](/reliability/workflows):

```typescript
const GROUP_SIZE = 500;

for (let start = 0; start < products.length; start += GROUP_SIZE) {
  await this.search.index(products.slice(start, start + GROUP_SIZE));
}
```

An `abortSignal` passed to the call cancels the requests in flight and the backoff of a retry, and the call rejects with the signal's reason. Since `timeout` covers one request, this is also how to give the whole call a deadline:

```typescript
const { embeddings } = await this.ai.embedMany({
  values: descriptions,
  abortSignal: AbortSignal.timeout(300_000),
});
```

Inside a resilient route, such as one with `@Timeout()` from `@nestjs/resilience`, the route's attempt stops the requests in the same way.

An embedding call has no fallback models. Vectors of different models can't be compared, even when they have the same number of dimensions, so a search index written with one model can't be read with another.

#### Policies of your own

`resilience` takes a policy, or the name of a preset of `ResilienceService`, in place of `retry` and `timeout`, as it does [for a language model](/ai/models#policies-of-your-own). It runs around each provider request, so an outbound rate limit or a bulkhead counts requests, across every call that shares it. The store keeps its embedding requests within its quota at the provider:

```typescript
@@filename(app.module)
import { openai } from '@ai-sdk/openai';
import { Module } from '@nestjs/common';
import { AiModule } from '@nestjs/ai';
import { ResilienceModule } from '@nestjs/resilience';

@Module({
  imports: [
    ResilienceModule.forRoot({
      presets: {
        embeddings: {
          retry: { attempts: 3 },
          timeout: '30s',
          outboundRateLimit: { limit: 3_000, interval: '1m', maxWait: '1m' },
        },
      },
    }),
    AiModule.forRoot({
      isGlobal: true,
      embeddingModels: {
        default: {
          model: openai.embeddingModel('text-embedding-3-small'),
          resilience: 'embeddings',
        },
      },
    }),
  ],
})
export class AppModule {}
```

Give such a policy room for the requests of a call to wait. A request that finds no token rejects the whole call with `OutboundRateLimitError` once it has waited `maxWait`, which is 0 by default, and one that finds a full bulkhead rejects it with `BulkheadFullError` unless the bulkhead has a `maxQueue` to hold it.

The policies publish the events of `@nestjs/resilience` on the `nestjs:resilience:<type>` diagnostics channels, named after the model (`ai:embedding:default retry`), with the call's `label` as their `source`.

#### Usage and cost

A call that succeeds emits one usage event, with the tokens its requests reported. With a model's `pricing`, its price per million input tokens in a unit of your choice, the event also has a `cost`, in the same unit. `onEmbeddingUsage` receives them:

```typescript
@@filename(app.module)
import { openai } from '@ai-sdk/openai';
import { Logger, Module } from '@nestjs/common';
import { AiModule } from '@nestjs/ai';

const usage = new Logger('Embeddings');

@Module({
  imports: [
    AiModule.forRoot({
      isGlobal: true,
      embeddingModels: {
        default: {
          model: openai.embeddingModel('text-embedding-3-small'),
          // Your provider's price, per million input tokens
          pricing: { input: 0.02 },
        },
      },
      onEmbeddingUsage: (event) =>
        usage.log(
          `${event.label ?? 'call'}: ${event.inputCount} values, ` +
            `${event.usage.tokens} tokens, $${event.cost?.toFixed(6)}`,
        ),
    }),
  ],
})
export class AppModule {}
```

| Property | What it is |
| --- | --- |
| `operation` | `'embed'` or `'embedMany'` |
| `label` | The call's `label`, to tell calls apart |
| `model` | The model that answered: `name`, `provider`, `modelId` |
| `inputCount` | How many values the call embedded |
| `usage` | The tokens the provider reported: `tokens` |
| `attempts` | The provider requests the call made, retries included |
| `durationMs` | How long the call took, with its retries and backoff |
| `cost` | The tokens at `pricing.input`; `undefined` without `pricing` |

A call can take its own `onEmbeddingUsage` too, which is called after the module's. `onUsage` is for language models, and isn't called. What a listener throws is logged, and never fails the call. The event carries neither the texts nor the vectors, so it's safe to log.

The events aren't a billing ledger: a provider may bill a request that timed out, and a call that fails emits nothing, even for the requests it completed.

#### Calling the AI SDK yourself

To call the AI SDK yourself, inject the model. `@InjectEmbeddingModel('documents')` injects the `EmbeddingModel` that `documents` names, and `@InjectEmbeddingModel()` the `default` one:

```typescript
@@filename(catalog/documents.service)
import { Injectable } from '@nestjs/common';
import { InjectEmbeddingModel } from '@nestjs/ai';
import { embed, type EmbeddingModel } from 'ai';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectEmbeddingModel('documents')
    private readonly model: EmbeddingModel,
  ) {}

  async vectorOf(text: string): Promise<number[]> {
    const { embedding } = await embed({ model: this.model, value: text });
    return embedding;
  }
}
```

A name the module doesn't configure fails at startup, naming the class that asked for it. The model is the provider's `EmbeddingModel` as it is, so a call made with it gets none of what `AiService` adds: no policies or usage events, and the AI SDK's own retries (`maxRetries`, 2 by default). `AiEmbeddingModels` lists the configured models, with `names()`, `has(name)` and `get(name)`.

Under `forRootAsync()`, its factory returns `embeddingModels` as it returns `models`, and `@InjectEmbeddingModel()` needs what [`@InjectModel()` does](/ai/overview#async-configuration): a class loaded after the module is defined lists its names in `embeddingModelNames`, at the top level.

> info **Hint** [Testing](/ai/testing#testing-embeddings) describes `FakeEmbeddingModel`, an embedding model for tests that calls no provider.
