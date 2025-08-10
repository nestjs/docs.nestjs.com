### Nest Failover

Nest Failover is a lightweight, generic module that orchestrates multiple providers for a single capability (for example: send mail, upload files, send SMS, webhooks, etc). You configure providers in priority order and choose among several execution strategies:

- Sequential fallback: try providers one by one until one succeeds
- Parallel all: run all providers in parallel and collect each outcome
- Parallel any: resolve on the first successful provider (similar to `Promise.any`)
- Filtered execution: run only a named subset of providers, in parallel or sequentially

In addition, you can configure per‑provider retries and lifecycle hooks for success, failure, and all‑failed conditions. The module is DI‑friendly and fully typed.

> info **Note** `@calumma/nest-failover` is a third-party package and is not officially maintained by the NestJS core team. If you encounter any issues, please report them in the [official repository](https://github.com/calummacc/nest-failover).

#### Installation

```bash
$ npm install @calumma/nest-failover
```

#### Usage

Import the `FallbackCoreModule` and configure it with your providers in priority order. You can also define retries and lifecycle hooks.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { FallbackCoreModule } from '@calumma/nest-failover';

// Domain-specific types for inputs and outputs
export type SendMailInput = { to: string; subject: string; html?: string; text?: string };
export type SendMailResult = { id: string; accepted: boolean };

@Module({
  imports: [
    FallbackCoreModule.forRoot<SendMailInput, SendMailResult>({
      providers: [
        // Highest priority provider goes first
        { provider: new MailProviderA(), maxRetry: 2, retryDelayMs: 200 },
        // Fallback provider is used after the first one is exhausted
        { provider: new MailProviderB(), maxRetry: 1 },
      ],
      onProviderSuccess: (name, input, output) => {
        // Called once when a provider attempt succeeds
        // Use this to log success or emit metrics
      },
      onProviderFail: (name, input, error) => {
        // Called on every failed attempt (before any retry)
        // Use this to log errors or emit failure metrics
      },
      onAllFailed: (input, lastError) => {
        // Called when all providers have been exhausted without success
        // Use this for alerting or fallback workflows
      },
    }),
  ],
})
export class AppModule {}
```

> info **Hint** Give each provider a unique, human‑readable `name` to simplify logging and filtered execution. If `name` is omitted, the class constructor name is used.

##### Provider contract

Each provider implements a single capability and conforms to the `IProvider<TInput, TResult>` interface.

```typescript
@@filename(mail.provider)
import { IProvider } from '@calumma/nest-failover';

export type SendMailInput = { to: string; subject: string; html?: string; text?: string };
export type SendMailResult = { id: string; accepted: boolean };

export class MailProviderA implements IProvider<SendMailInput, SendMailResult> {
  // Optional human‑readable name, used for logs and filtering
  name = 'mailA';

  async execute(input: SendMailInput): Promise<SendMailResult> {
    // Perform network or SDK calls and return a typed result when successful
    // Throw an error on failure so the orchestrator can retry or fall back
    return { id: 'msg_123', accepted: true };
  }
}
```

#### Async configuration

Use `forRootAsync` to resolve options from other modules (for example, a configuration service) or environment variables.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FallbackCoreModule, FallbackCoreOptions } from '@calumma/nest-failover';

@Module({
  imports: [
    ConfigModule.forRoot(),
    FallbackCoreModule.forRootAsync<SendMailInput, SendMailResult>({
      inject: [ConfigService],
      useFactory: async (
        cfg: ConfigService,
      ): Promise<FallbackCoreOptions<SendMailInput, SendMailResult>> => ({
        providers: [
          { provider: new MailProviderA(/* read from cfg */), maxRetry: 2, retryDelayMs: 200 },
          { provider: new MailProviderB(/* read from cfg */) },
        ],
      }),
    }),
  ],
})
export class AppModule {}
```

#### Injecting and using the orchestrator

Inject `FallbackCoreService<TInput, TResult>` where you need to execute the capability.

```typescript
@@filename(mail.service)
import { Injectable } from '@nestjs/common';
import { FallbackCoreService } from '@calumma/nest-failover';

export type SendMailInput = { to: string; subject: string; html?: string; text?: string };
export type SendMailResult = { id: string; accepted: boolean };

@Injectable()
export class MailService {
  constructor(
    // The orchestrator is typed with your input and output shapes
    private readonly mailFallback: FallbackCoreService<SendMailInput, SendMailResult>,
  ) {}

  async sendMail(input: SendMailInput): Promise<SendMailResult> {
    // Sequential fallback: attempt each provider in order until one succeeds
    return this.mailFallback.execute(input);
  }
}
```

#### Execution modes

The orchestrator supports several execution strategies.

##### Sequential (fallback)

```typescript
@@filename(usage.sequential)
import { FallbackCoreService } from '@calumma/nest-failover';

export async function sendWithFallback(
  fallback: FallbackCoreService<SendMailInput, SendMailResult>,
) {
  try {
    // Attempts providers in order (A then B), applying per‑provider retries
    const result = await fallback.execute({ to: 'user@example.com', subject: 'Welcome' });
    // The first successful provider’s result is returned
    return result;
  } catch (lastError) {
    // If all providers fail, the last encountered error is thrown
    // Handle, transform, or rethrow according to your domain needs
    throw lastError;
  }
}
```

Sequential subset with filtering:

```typescript
@@filename(usage.sequential-filtered)
const { provider, result } = await mailFallback.executeWithFilter(
  { to: 'user@example.com', subject: 'Digest' },
  ['mailB', 'mailA'], // Order matters; tries 'mailB' first, then 'mailA'
  'sequential',
);
```

##### Parallel (all results)

```typescript
@@filename(usage.parallel-all)
const outcomes = await mailFallback.executeAll({ to: 'u@example.com', subject: 'Report' });
// Example shape: [{ provider: 'mailA', result }, { provider: 'mailB', error }]
```

##### Parallel (first success)

```typescript
@@filename(usage.parallel-any)
const first = await mailFallback.executeAny(
  { to: 'x@example.com', subject: 'OTP' },
  ['mailB'], // Optional: limit which providers participate
);
```

#### Multiple capabilities in one application

Maintain separate orchestrators for different capabilities (for example, mail and upload). Prefer distinct tokens or wrapper services to avoid injection ambiguity.

##### Custom provider tokens (recommended)

```typescript
@@filename(tokens)
export const MAIL_FAILOVER = 'MAIL_FAILOVER';
export const UPLOAD_FAILOVER = 'UPLOAD_FAILOVER';
```

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { FallbackCoreService } from '@calumma/nest-failover';
import { MAIL_FAILOVER, UPLOAD_FAILOVER } from './tokens';

@Module({
  providers: [
    {
      provide: MAIL_FAILOVER,
      useFactory: () => new FallbackCoreService<SendMailInput, SendMailResult>({
        providers: [{ provider: new MailProviderA() }, { provider: new MailProviderB() }],
      }),
    },
    {
      provide: UPLOAD_FAILOVER,
      useFactory: () => new FallbackCoreService<UploadInput, UploadResult>({
        providers: [{ provider: new S3Upload() }, { provider: new GCSUpload() }],
      }),
    },
  ],
  exports: [MAIL_FAILOVER, UPLOAD_FAILOVER],
})
export class AppModule {}
```

##### Wrapper classes (simple and explicit)

```typescript
@@filename(mail-failover.service)
import { Injectable } from '@nestjs/common';
import { FallbackCoreService } from '@calumma/nest-failover';

@Injectable()
export class MailFailoverService extends FallbackCoreService<SendMailInput, SendMailResult> {
  constructor() {
    // Configure the orchestrator with domain‑specific providers and retry policies
    super({ providers: [{ provider: new MailProviderA() }, { provider: new MailProviderB() }] });
  }
}
```

```typescript
@@filename(upload-failover.service)
import { Injectable } from '@nestjs/common';
import { FallbackCoreService } from '@calumma/nest-failover';

@Injectable()
export class UploadFailoverService extends FallbackCoreService<UploadInput, UploadResult> {
  constructor() {
    // Configure the orchestrator for a different capability (file uploads)
    super({ providers: [{ provider: new S3Upload() }, { provider: new GCSUpload() }] });
  }
}
```

#### API reference

Exports from `@calumma/nest-failover`:

- FallbackCoreModule
  - `forRoot<TInput, TResult>(options: FallbackCoreOptions<TInput, TResult>): DynamicModule`
  - `forRootAsync<TInput, TResult>(options: FallbackCoreModuleAsyncOptions<TInput, TResult>): DynamicModule`

- FallbackCoreService<TInput, TResult>
  - `execute(input: TInput): Promise<TResult>`
  - `executeAll(input: TInput, providerNames?: string[])`: returns
    ```typescript
    Promise<Array<{ provider: string; result?: TResult; error?: any }>>
    ```
  - `executeAny(input: TInput, providerNames?: string[]): Promise<TResult>`
  - `executeWithFilter(input: TInput, providerNames: string[], mode?: 'parallel' | 'sequential')`

- FALLBACK_CORE_OPTIONS (Injection token for module options)
- FallbackCoreModuleAsyncOptions<TInput, TResult>

- AllProvidersFailedError
  - Thrown by `executeAny` when all selected providers fail; contains an array of individual errors

- IProvider<TInput, TResult>
  - `name?: string` — optional human‑readable name
  - `execute(input: TInput): Promise<TResult>` — perform the operation; throw on failure

- ProviderConfig<TInput, TResult>
  - `provider: IProvider<TInput, TResult>` — concrete provider implementation
  - `maxRetry?: number` — number of retries after the initial attempt (default 0)
  - `retryDelayMs?: number` — delay between retries in milliseconds (default 0)

- FallbackCoreOptions<TInput, TResult>
  - `providers: Array<ProviderConfig<TInput, TResult>>` — providers in priority order
  - `onProviderSuccess?: (providerName: string, input: TInput, output: TResult) => void`
  - `onProviderFail?: (providerName: string, input: TInput, error: any) => void`
  - `onAllFailed?: (input: TInput, lastError: any) => void`

#### Error handling and logging

- Hooks provide observability for each attempt and the final outcome:
  - `onProviderSuccess` is called when a provider attempt succeeds
  - `onProviderFail` is called on every failed attempt
  - `onAllFailed` is called once when no provider succeeds overall
- The service uses the NestJS `Logger` (`debug`, `warn`, `error`). Ensure your app’s logger level includes `debug` if you want detailed traces during development.
- In `executeAny`, when all selected providers fail, the method rejects with `AllProvidersFailedError` that aggregates individual errors.

> warning **Caution** When using retries, ensure provider operations are idempotent to avoid partial side effects in the underlying systems.

#### Best practices

- Make provider operations idempotent when using retries to avoid partial side effects.
- Keep input/output payloads small and serializable if you plan to log or persist them.
- If underlying SDKs already implement retries, tune or disable orchestrator retries to avoid compounding delays.
- Use distinct tokens or wrapper services when orchestrating multiple capabilities in the same module scope.

#### More information

Visit the [official repository](https://github.com/calummacc/nest-failover) for examples and updates.

