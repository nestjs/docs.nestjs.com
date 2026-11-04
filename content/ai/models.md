### Models

Every model call runs under a timeout, retries and fallback models, built from the settings of the call, of its model and of the module, and reports the tokens it used and what they cost.

#### Model settings

A model in `forRoot({{ '{' }} models {{ '}' }})` is a `LanguageModel` from a provider package, or a definition with the `LanguageModel` as its `model` and settings of its own. The store's Claude models have their prices, and the default one a fallback from another provider:

```typescript
@@filename(app.module)
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { Module } from '@nestjs/common';
import { AiModule } from '@nestjs/ai';

@Module({
  imports: [
    AiModule.forRoot({
      isGlobal: true,
      models: {
        default: {
          model: anthropic('claude-opus-5-5'),
          pricing: { input: 4, output: 20, cachedInput: 0.2 },
          maxOutputTokens: 4_000,
          fallback: 'backup',
        },
        fast: {
          model: anthropic('claude-haiku-5-5'),
          pricing: { input: 0.1, output: 0.5 },
          timeout: '15s',
        },
        backup: openai('gpt-5'),
      },
      defaults: { timeout: '45s', maxOutputTokens: 1_000 },
    }),
  ],
})
export class AppModule {}
```

Each setting comes from the call, else from the model's definition, else from the module's `defaults`. A call to `default` above is sent `maxOutputTokens: 4000`, and one to `fast` or `backup` `maxOutputTokens: 1000`; a call that sets `maxOutputTokens: 200` sends that, whichever model answers it. `fast` gives an attempt 15 seconds, the others 45.

| Settings | Set on |
| --- | --- |
| `timeout`, `retry`, `resilience` | The call, the model, `defaults` |
| `maxOutputTokens`, `temperature`, `providerOptions`, `headers` | The call, the model, `defaults` |
| `maxSteps`, `budget` | The call, `defaults` |
| `fallback` | The call, the model |
| `pricing` | The model |
| `onUsage` | The call, and the module: both are called |
| `topP`, `topK`, `seed`, `stopSequences`, `presencePenalty`, `frequencyPenalty`, `toolChoice`, `fallbackIf`, `abortSignal` | The call |

`providerOptions` are the provider package's own options, keyed by the provider's name, and `headers` are HTTP headers sent with each request to the provider.

In `models`, a model can also be a model id string such as `'openai/gpt-5'`, which the AI SDK sends through the [AI Gateway](https://vercel.com/docs/ai-gateway). In a call, a string is always the name of one of the module's models. A call can also take a `LanguageModel` as its `model`, or in its `fallback`: it has no settings of its own, and the result's `model.name` is `undefined`.

#### Calling the AI SDK yourself

To call the AI SDK yourself, inject the model. `@InjectModel('fast')` injects the `LanguageModel` that `fast` names, and `@InjectModel()` the `default` one:

```typescript
@@filename(support/summaries.service)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/ai';
import { generateText, type LanguageModel } from 'ai';

@Injectable()
export class SummariesService {
  constructor(@InjectModel('fast') private readonly model: LanguageModel) {}

  async summarize(thread: string): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      instructions: 'Summarize the support thread in three sentences.',
      prompt: thread,
    });
    return text;
  }
}
```

A name the module doesn't configure fails at startup, naming the class that asked for it: `SummariesService: @InjectModel('fats') asks for a model AiModule does not configure.` The model is the provider's `LanguageModel` as it is, so a call made with it gets none of what `AiService` adds: no timeouts, fallback models, budgets or usage events, and the AI SDK's own retries (`maxRetries`, 2 by default) instead of the policies below. `AiModels` lists the configured models, with `names()`, `has(name)` and `get(name)`.

#### Retries, timeouts and fallback

Model providers fail: they answer 429 when you send too much, 529 when they are overloaded, and now and then take a minute to answer. Every model call runs under the policies of [`@nestjs/resilience`](/reliability/resilience), built from three settings:

- **`timeout`**: a `TimeoutPolicy`, `'60s'` by default, per attempt: until the whole answer for `generateText()` and `generateObject()`, until the first chunk for `streamText()`. The time tools take doesn't count, since the model has answered by then. `false` turns it off.
- **`retry`**: a `RetryPolicy`, with its options: `attempts` (3 by default, the first included), `backoff` (from `'1s'`, doubling up to `'30s'`, with full jitter) and `retryIf`. What the provider marks retryable is retried, 408, 409, 429 and 5xx responses and failed connections, and so are timeouts. A `retry-after` header is honored, and one that asks for longer than `backoff.maxDelay` moves on to the fallback instead. `retry: false` turns retries off.
- **`fallback`**: the models tried, in order, once the model's retries have run out, each under its own policies. A call sets its own with `fallback: ['default']`, or none with `fallback: false`, and `fallbackIf` narrows which failures move on.

A call can change any of them:

```typescript
const { text } = await this.ai.generateText({
  model: 'fast',
  prompt: email,
  timeout: '10s',
  retry: { attempts: 2, backoff: { delay: '500ms' } },
  fallback: ['default', 'backup'],
  // A request the provider refused (400) would be refused by the next one too
  fallbackIf: (error) =>
    !APICallError.isInstance(error) || error.statusCode !== 400,
});
```

Only the call's own model has its `fallback` followed: a fallback model's `fallback` isn't, so a call that should go on to a third model lists both, as above. `APICallError` is the AI SDK's error for a provider's response, from `ai`. Some failures never move on, whatever `fallbackIf` says: the call's abort, an answer that doesn't match the schema of `generateObject()`, and the AI SDK's errors for a call it can't send, such as an invalid prompt.

Every fallback is logged as a warning through Nest's `Logger`, with the model that failed, the model the call moves on to, and the cause: the error's class, its HTTP status and its message. A revoked API key or a refused request can't hide behind a fallback that works: `The model "default" failed (APICallError, 401: Invalid API key); falling back to "backup".`

Once a chunk has reached the browser, or the tools of a model call have started, its outcome is committed: no timeout, retry or fallback replaces it, so no answer is sent twice and no tool runs twice.

An `abortSignal` passed to the call cancels it at once, without a retry or a fallback, and the call rejects with the signal's reason. Inside a resilient route, such as one with `@Timeout()` from `@nestjs/resilience`, the route's attempt stops the model calls it makes in the same way.

#### When a call fails

When every attempt fails, on every model tried, the call rejects with `AiModelError`. Its `attempts` list each model, attempt and error (a `ResilienceTimeoutError` for an attempt that ran out of time), and its `cause` is the last error. The package's errors extend `AiError`:

| Error | When |
| --- | --- |
| `AiModelError` | Every attempt failed, on every model tried: `attempts`, `cause` |
| `AiOutputError` | `generateObject()`'s answer isn't JSON or doesn't match the schema, or the model still called tools after `maxSteps`: `text` |
| `AiBudgetExceededError` | The call has spent its budget, before its next model call: `usage`, `cost`, `limit` |
| `AiConfigurationError` | A model, an agent function or an option the package can't use: at startup, or when the call is made, before anything is sent |
| `AiToolError` | What the model is told about a tool call that failed: `toolName`, the agent function's name |

A route that calls a model answers an `AiModelError` with 500, as any other error. An exception filter can say the assistant is unavailable instead:

```typescript
@@filename(assistant/model-unavailable.filter)
import {
  Catch,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { AiModelError } from '@nestjs/ai';
import type { Response } from 'express';

@Catch(AiModelError)
export class ModelUnavailableFilter implements ExceptionFilter {
  catch(_error: AiModelError, host: ArgumentsHost) {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.SERVICE_UNAVAILABLE)
      .json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'The assistant is unavailable. Try again in a minute.',
      });
  }
}
```

#### Policies of your own

`resilience` takes a policy, or the name of a preset of `ResilienceService`, in place of `retry` and `timeout`: a circuit breaker or a bulkhead shared with the rest of the application, say. Fallback models are still tried around it, so a call to a model whose breaker is open goes on to the next one:

```typescript
@@filename(app.module)
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { Module } from '@nestjs/common';
import { AiModule } from '@nestjs/ai';
import { ResilienceModule } from '@nestjs/resilience';

@Module({
  imports: [
    ResilienceModule.forRoot({
      presets: {
        anthropic: {
          retry: { attempts: 3 },
          timeout: '30s',
          circuitBreaker: { name: 'anthropic', failureRateThreshold: 50 },
        },
      },
    }),
    AiModule.forRoot({
      isGlobal: true,
      models: {
        default: {
          model: anthropic('claude-opus-5-5'),
          resilience: 'anthropic',
          fallback: 'backup',
        },
        backup: openai('gpt-5'),
      },
    }),
  ],
})
export class AppModule {}
```

A preset replaces the model's `retry` and `timeout` with its own: a preset without a `timeout` leaves the model's calls without one, and a preset's retries honor `retry-after` only if its `backoff` does. A rejection of such a policy (`CircuitOpenError`, `BulkheadFullError`) that no fallback takes reaches the caller as it is: an error of `@nestjs/resilience`, which `ResilienceModule` answers with 503 on an HTTP route. Naming a preset without importing `ResilienceModule` fails with an `AiConfigurationError`.

The policies publish the events of `@nestjs/resilience` on the `nestjs:resilience:<type>` diagnostics channels: `retry`, `timeout` and `fallback`, named after the model (`ai:fast retry`, `ai:fast fallback`), with the call's `label` as their `source` (`AiService` for a call without one). To log the retries of every model call:

```typescript
@@filename(main)
import { subscribe } from 'node:diagnostics_channel';
import { Logger } from '@nestjs/common';
import type { ResilienceRetryEvent } from '@nestjs/resilience';

const logger = new Logger('Models');

subscribe('nestjs:resilience:retry', (message) => {
  const event = message as ResilienceRetryEvent;
  logger.warn(
    `${event.source}: attempt ${event.attempt} of ${event.policy} failed, ` +
      `retrying in ${Math.round(event.delayMs)} ms`,
  );
});
```

#### Usage, cost and budgets

Every model call that answers emits a usage event. With a model's `pricing`, in a unit of your choice per million tokens, it also has a `cost`, in the same unit. `onUsage` receives them:

```typescript
@@filename(app.module)
import { anthropic } from '@ai-sdk/anthropic';
import { Logger, Module } from '@nestjs/common';
import { AiModule } from '@nestjs/ai';

const usage = new Logger('Usage');

@Module({
  imports: [
    AiModule.forRoot({
      isGlobal: true,
      models: {
        // US dollars per million tokens
        default: {
          model: anthropic('claude-opus-5-5'),
          pricing: { input: 4, output: 20, cachedInput: 0.2 },
        },
      },
      onUsage: (event) =>
        usage.log(
          `${event.label ?? 'call'} on ${event.model.name}: ` +
            `${event.usage.totalTokens} tokens, $${event.cost?.toFixed(4)}`,
        ),
    }),
  ],
})
export class AppModule {}
```

| Property | What it is |
| --- | --- |
| `label` | The call's `label`, to tell calls apart |
| `model` | The model that answered: `name`, `provider`, `modelId` |
| `step`, `attempt` | The model call's step in the call (from 0), and the attempt of this model for it (from 1) |
| `fallback`, `stream` | Whether a fallback model answered, and whether the call was streamed |
| `usage` | `inputTokens` (cached ones included), `outputTokens`, `totalTokens`, `cachedInputTokens`, `reasoningTokens` |
| `cost` | The input tokens not read from the cache at `input`, the cached ones at `cachedInput` (default: `input`), and the output tokens at `output`; `undefined` without `pricing` |
| `durationMs`, `finishReason` | How long the model call took, and why the model stopped |

A call can take its own `onUsage` too, which is called after the module's. What a listener throws is logged, and never fails the call. The store meters the assistant's tokens per customer:

```typescript
const { text } = await this.ai.generateText({
  label: 'assistant',
  prompt: question,
  onUsage: (event) =>
    this.metering.record(customerId, event.usage.totalTokens, event.cost),
});
```

A `budget` limits one call: `maxTokens` and `maxCost`, over all its model calls. A call that uses tools makes several, and the budget is checked before each one: a call that has spent it rejects, before its next model call, with `AiBudgetExceededError`, which carries what was spent (`usage`, `cost`) and the `limit`. The check can't stop a model call halfway, so the last one can take a call over its budget. A model without `pricing` counts as free. `defaults.budget` applies a budget to every call:

```typescript
const { object } = await this.ai.generateObject({
  model: 'fast',
  schema: Triage,
  prompt: email,
  tools: ['find-order'],
  budget: { maxTokens: 20_000, maxCost: 0.01 },
});
```

> info **Hint** Since `@nestjs/observe` 0.3.20, [NestJS Observe](/observability/overview) records the model and the tokens of every model call on its outbound span, as it does for any AI SDK call: see [Model calls](/observability/sdk#model-calls). A model named by a gateway id, such as `'openai/gpt-5'`, is called through the AI Gateway's host, `ai-gateway.vercel.sh`: add it to `outgoing.llm.hosts` for Observe to read those calls too.
