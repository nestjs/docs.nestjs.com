### AI

`@nestjs/ai` brings language models into a Nest application: models registered by name and injected, calls with timeouts, retries and fallback models, answers validated by a schema, and the methods of your providers as agent functions, which the model calls as tools.

The online store for cat food and supplies gets a hundred support emails a day, and its customers would rather ask the website about their orders than write one. Both are jobs for a language model, inside the order API: sort an email and draft a reply, or answer a customer in a chat with what the API knows about their orders.

The package builds on the [AI SDK](https://ai-sdk.dev) (`ai`) and its provider packages, so any model they support works: Claude, GPT, Gemini, Mistral, or a model behind a gateway. Model calls run on the policies of [`@nestjs/resilience`](/reliability/resilience). You write an agent function, a method with `@AgentFunction()`, and the model is offered it as a tool: every call of one goes through the guards, interceptors, pipes and exception filters your routes use, as the user the model acts for.

In this chapter, you'll give the store's order API:

- A [triage](/ai/overview#structured-output) of support emails into a typed object, and a drafted reply, with a fast and cheap model.
- [Retries, timeouts and a fallback model](/ai/models#retries-timeouts-and-fallback) around every call, a [budget](/ai/models#usage-cost-and-budgets) per call, and a record of what each one cost.
- [Agent functions](/ai/tools) the model calls as the signed-in customer, among them `find-order`, which the store's MCP server serves too: one method, two consumers.
- A [chat assistant](/ai/agents#streaming-to-the-browser) whose answer streams to the browser as it's written.
- A [refund agent](/ai/agents#durable-agent-runs) that waits for the support team's approval, as a durable workflow.
- [Embeddings](/ai/embeddings) of its product descriptions, for a search that finds products by what they mean.
- [Tests](/ai/testing) that run without a model provider.

#### Installation

Install the package, `@nestjs/resilience`, whose policies model calls run on, the AI SDK, a provider package, and Zod, for the schemas:

```bash
$ npm i --save @nestjs/ai @nestjs/resilience ai @ai-sdk/anthropic zod
```

> info **Hint** Every `@ai-sdk/*` provider package works the same way: `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/mistral`, `@ai-sdk/amazon-bedrock` and the others. Schemas can come from any [Standard Schema](https://standardschema.dev) library that produces JSON Schema, as for `@nestjs/mcp`: Zod 4.2 or later and ArkType as they are, Valibot through `toStandardJsonSchema()`. Each major version of `@nestjs/ai` supports one major version of the AI SDK, `ai` 7 for this one, and it needs Node.js 22 or later, as the AI SDK does.

#### Register the models

Import `AiModule` in the root module, with the models the application uses, by name. Calls that name no model use `default`:

```typescript
@@filename(app.module)
import { anthropic } from '@ai-sdk/anthropic';
import { Module } from '@nestjs/common';
import { AiModule } from '@nestjs/ai';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    AiModule.forRoot({
      isGlobal: true,
      models: {
        default: anthropic('claude-opus-5-5'),
        fast: {
          model: anthropic('claude-haiku-5-5'),
          fallback: 'default',
        },
      },
      defaults: { timeout: '30s', retry: { attempts: 3 } },
    }),
    SupportModule,
  ],
})
export class AppModule {}
```

A model is what a provider package returns, such as `anthropic('claude-opus-5-5')`, or a definition with it as `model` and settings of its own: `fallback`, the models tried when it fails, `pricing`, `timeout`, `retry`, and generation settings such as `maxOutputTokens`. `defaults` apply to every call: here, an attempt may take 30 seconds, and each model gets three attempts. [Models](/ai/models) describes every setting.

The provider package reads its API key from the environment, `ANTHROPIC_API_KEY` for `@ai-sdk/anthropic`. To pass it from `ConfigService` instead, create the provider in a factory: see [Async configuration](/ai/overview#async-configuration).

`isGlobal: true` lets every module of the application inject `AiService`. Without it, the module isn't global: `AiService` is injected only in the module that imports `AiModule.forRoot()`. To share one configuration with some modules only, import it in a module of your own that exports it, and import that module where models are called:

```typescript
@@filename(llm/llm.module)
import { anthropic } from '@ai-sdk/anthropic';
import { Module } from '@nestjs/common';
import { AiModule } from '@nestjs/ai';

@Module({
  imports: [
    AiModule.forRoot({ models: { default: anthropic('claude-opus-5-5') } }),
  ],
  exports: [AiModule],
})
export class LlmModule {}
```

#### Calling a model

`AiService` makes the calls. `generateText()` sends a prompt, with `instructions` (the system prompt), and resolves with the answer:

```typescript
@@filename(support/replies.service)
import { Injectable } from '@nestjs/common';
import { AiService } from '@nestjs/ai';

@Injectable()
export class RepliesService {
  constructor(private readonly ai: AiService) {}

  async draft(email: string): Promise<string> {
    const { text } = await this.ai.generateText({
      model: 'fast',
      label: 'draft-reply',
      instructions:
        'Draft a short, friendly reply to the customer. ' +
        'Sign it "The Cat Store".',
      prompt: email,
      maxOutputTokens: 400,
    });
    return text;
  }
}
```

`model` names one of the module's models, `default` when it's left out, and `label` names the call in [usage events](/ai/models#usage-cost-and-budgets) and in the events of its policies. `prompt` is the user's message; `messages` takes a whole conversation instead, as the AI SDK's `ModelMessage` objects (see [Conversations](/ai/agents#conversations)). The result has more than the text:

| Property | What it is |
| --- | --- |
| `text` | The answer: the text of the last model call |
| `finishReason` | Why the model stopped: `'stop'`, `'length'` when it reached `maxOutputTokens`, or `'tool-calls'` when it still asked for tools after `maxSteps` model calls |
| `usage` | The tokens of every model call, summed: `inputTokens`, `outputTokens`, `totalTokens`, `cachedInputTokens` and `reasoningTokens` |
| `cost` | What the call cost, for models with `pricing` |
| `steps` | One per model call, with its text, tool calls, usage, and the attempts it took |
| `toolCalls`, `toolResults` | The tools the model called, with their input, and what each returned or why it failed |
| `responseMessages` | The assistant and tool messages of the call, to append to a conversation |
| `model` | The model that answered: its `name`, `provider` and `modelId` |

A call that names a model the module doesn't configure, an agent function that doesn't exist, or both `prompt` and `messages`, is refused with an `AiConfigurationError` before anything is sent.

#### Structured output

Sorting an email is a job for `generateObject()`. The model is sent the schema's JSON Schema, and its answer is parsed and validated by the schema, so `object` is typed by it:

```typescript
@@filename(support/triage.service)
import { Injectable } from '@nestjs/common';
import { AiService } from '@nestjs/ai';
import * as z from 'zod';

export const Triage = z.object({
  category: z
    .enum(['shipping', 'billing', 'product', 'other'])
    .describe('What the email is about'),
  orderId: z
    .string()
    .nullable()
    .describe('The order id it mentions, such as ord_123, or null'),
  urgent: z.boolean().describe('Whether the customer needs an answer today'),
});

@Injectable()
export class TriageService {
  constructor(private readonly ai: AiService) {}

  async triage(email: string) {
    const { object } = await this.ai.generateObject({
      model: 'fast',
      label: 'triage',
      schema: Triage,
      instructions:
        'You sort the support email of a store for cat food and supplies.',
      prompt: email,
    });
    return object; // { category, orderId, urgent }
  }
}
```

The model reads the `.describe()` texts, as it reads an agent function's: say what each field means, with an example value. `schemaName` and `schemaDescription` name and describe the object, for providers that pass them on to the model. Besides `object`, the result has everything `generateText()`'s has: `usage`, `cost`, `steps` and the rest.

An answer that isn't JSON, or doesn't match the schema, rejects with `AiOutputError`, which carries the model's `text`. It isn't retried, and no fallback model is tried: the model did answer.

The schema's transforms run on the answer, while the model is sent the JSON Schema of its input side. The store also extracts the lines of its suppliers' invoices, and wants the due date as a `Date`; the model is asked for an ISO date string:

```typescript
@@filename(suppliers/invoices.service)
import { Injectable } from '@nestjs/common';
import { AiService } from '@nestjs/ai';
import * as z from 'zod';

const Invoice = z.object({
  number: z.string().describe('The invoice number, such as INV-2041'),
  total: z.number().describe('The total, in cents'),
  dueDate: z.iso.date().transform((value) => new Date(`${value}T00:00:00Z`)),
  lines: z.array(
    z.object({
      description: z.string(),
      amount: z.number().describe('In cents'),
    }),
  ),
});

@Injectable()
export class InvoicesService {
  constructor(private readonly ai: AiService) {}

  async extract(email: string) {
    const { object } = await this.ai.generateObject({
      label: 'invoice',
      schema: Invoice,
      schemaName: 'invoice',
      instructions: 'Extract the invoice from the email of a supplier.',
      prompt: email,
    });
    return object; // object.dueDate is a Date
  }
}
```

The same call works in a queue job, where the store reads its suppliers' mailbox: the code that calls the model doesn't change with where it runs.

With [tools](/ai/tools), the model can look things up before it answers, and the object is the answer of its last model call. A model that is still calling tools after `maxSteps` model calls has given no object, so the call rejects with `AiOutputError` too.

#### Async configuration

`forRootAsync()` takes the options from a factory, a `useClass` or a `useExisting` provider. Here, the factory creates the provider with the API key from `ConfigService`:

```typescript
@@filename(app.module)
import { createAnthropic } from '@ai-sdk/anthropic';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiModule } from '@nestjs/ai';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AiModule.forRootAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const anthropic = createAnthropic({
          apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY'),
        });
        return {
          models: {
            default: anthropic('claude-opus-5-5'),
            fast: { model: anthropic('claude-haiku-5-5'), fallback: 'default' },
          },
          defaults: { timeout: '30s' },
        };
      },
    }),
  ],
})
export class AppModule {}
```

A `useClass` provider implements `AiOptionsFactory`, whose `createAiOptions()` returns the options. `isGlobal` stays at the top level, and so do `modelNames` and `embeddingModelNames`.

`@InjectModel()` (see [Models](/ai/models#calling-the-ai-sdk-yourself)) needs a provider for each model name it injects, and `forRootAsync()` creates them before its factory has run: for the names `@InjectModel()` was seen asking for when the module was defined, in the classes the application had imported by then. A class loaded later, such as one of a [lazily loaded module](/fundamentals/lazy-loading-modules), lists its names in `modelNames: ['fast']`. A name nothing configures fails at startup, with the name of the class that asked for it.

#### One package for many providers

Each `@ai-sdk/*` provider package is one more dependency to install and keep in step with `ai`. Most providers and gateways (OpenAI, Groq, Together, Fireworks, DeepSeek, OpenRouter, LiteLLM, Ollama, vLLM and others) also serve the OpenAI API, so a single package, `@ai-sdk/openai-compatible`, can reach all of them:

```bash
$ npm i --save @ai-sdk/openai-compatible
```

The providers then become data rather than dependencies: keep their base URLs, API keys and model IDs in a database table or your configuration, and build the models in the `forRootAsync()` factory:

```typescript
@@filename(app.module)
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { Module } from '@nestjs/common';
import { AiModule } from '@nestjs/ai';
import { ProvidersModule } from './providers/providers.module';
import { ProvidersService } from './providers/providers.service';

@Module({
  imports: [
    AiModule.forRootAsync({
      isGlobal: true,
      imports: [ProvidersModule],
      inject: [ProvidersService],
      useFactory: async (providers: ProvidersService) => {
        // e.g. rows of { name, baseURL, apiKey, modelId }
        const rows = await providers.findAll();
        const models = Object.fromEntries(
          rows.map((row) => [
            row.name,
            createOpenAICompatible({
              name: row.name,
              baseURL: row.baseURL,
              apiKey: row.apiKey,
            })(row.modelId),
          ]),
        );
        return { models };
      },
    }),
  ],
})
export class AppModule {}
```

The factory runs once, at startup, so a new row takes effect when the application restarts. One row has to be named `default`, for the calls that name no model, and an empty table fails the startup. To use a row without a restart, build the model when you call it and pass it as the call's `model`, which has [no settings of its own](/ai/models#model-settings).

`createOpenAICompatible()` assumes the least of a server. Set `supportsStructuredOutputs: true` for a model that accepts a JSON schema, or [structured output](/ai/overview#structured-output) won't send it the schema, and `includeUsage: true` to ask for usage on streamed calls, which [budgets](/ai/models#usage-cost-and-budgets) rely on.

Use a dedicated `@ai-sdk/*` package when you need a feature the OpenAI API does not expose, such as Anthropic's prompt caching or Google's grounding settings.

#### Module options

| Option | Default | Description |
| --- | --- | --- |
| `models` | | The models, by name: a `LanguageModel`, or `{{ '{' }} model, ... {{ '}' }}` with the settings below. Required unless `embeddingModels` names a model |
| `models.*.fallback` | | The names of the models tried, in order, when this one fails |
| `models.*.pricing` | | `input`, `output` and `cachedInput`: prices per million tokens |
| `models.*.timeout`, `retry`, `resilience` | | The model's own policies, which win over `defaults`, as its generation settings do |
| `defaults.timeout` | `'60s'` | How long an attempt may take; `false` for no limit |
| `defaults.retry` | 3 attempts, from `'1s'` | The options of `RetryPolicy`: `attempts`, `backoff` (`delay`, `factor`, `maxDelay`, `jitter`, or a function), `retryIf`; `false` for none |
| `defaults.resilience` | | A policy, or the name of a `ResilienceService` preset, in place of `retry` and `timeout` |
| `defaults.maxSteps` | `10` | The model calls one call makes while the model asks for tools, and one durable run (whose own default is `25`) |
| `defaults.budget` | | `maxTokens` and `maxCost`, per call and per durable run |
| `defaults.maxOutputTokens`, `temperature`, `providerOptions`, `headers` | | Passed to the model |
| `onUsage` | | Called after every model call that answered |
| `embeddingModels` | | The [embedding models](/ai/embeddings), by name: an `EmbeddingModel`, or `{{ '{' }} model, ... {{ '}' }}` with settings of its own |
| `embeddingDefaults` | | The [settings of embedding calls](/ai/embeddings#embedding-settings), which `defaults` don't reach |
| `onEmbeddingUsage` | | Called after every embedding call that succeeded |
| `include` | every module | The modules whose providers are searched for agent functions |
| `isGlobal` | `false` | Whether the module is global. Top level of `forRootAsync()` |
| `modelNames` | | More model names `@InjectModel()` may inject, for classes loaded after the module is defined. Top level of `forRootAsync()` |
| `embeddingModelNames` | | The same for `@InjectEmbeddingModel()`. Top level of `forRootAsync()` |

Every option of `defaults` is also an option of each call, which wins. `timeout`, `retry`, `resilience` and the generation settings are also settings of a model's definition, which win over `defaults`.

#### Example

A working example is available [here](https://github.com/nestjs/ai/tree/master/sample).
