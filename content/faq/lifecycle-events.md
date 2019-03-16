### Lifecycle Events

Every application element has a lifecycle managed by Nest.
Nest offers **lifecycle hooks** that provide visibility into key life moments and the
ability to act when they occur.

#### Lifecycle sequence

After creating a injectable/controller by calling its constructor, Nest calls the lifecycle hook methods in the following sequence at specific moments:

|                          |                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `OnModuleInit`           | Called once the host module has been initialized                                            |
| `OnApplicationBootstrap` | Called once the application has fully started and is 4bootstrapped                          |
| `OnModuleDestroy`        | Cleanup just before Nest destroys the host module (`app.close()` method has been evaluated) |
| `OnApplicationShutdown`  | Responds to the system signals (when application gets shutdown by e.g. `SIGTERM`)           |


#### Usage

Each lifecycle hook is represented by interface. Interfaces are technically optional because they do not exist anyway after TypeScript compilation. Nonetheless, it's a good practice to use them in order to benefit from strong typing and editor tooling.

```typescript
@@filename()
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit {
  onModuleInit() {
    console.log(`The module has been initialized.`);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  onModuleInit() {
    console.log(`The module has been initialized.`);
  }
}
```

Additionally, both `OnModuleInit` and `OnApplicationBootstrap` hooks allow you to defer the application initialization process (return a `Promise` or mark the method as `async`).

```typescript
@@filename()
async onModuleInit(): Promise<void> {
  await this.fetch();
}
@@switch
async onModuleInit() {
  await this.fetch();
}
```

#### Overview

Here is a brief description of each lifecycle hook:

|                          |                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `OnModuleInit`           | Called once the host module has been initialized                                            |
| `OnModuleDestroy`        | Cleanup just before Nest destroys the host module (`app.close()` method has been evaluated) |
| `OnApplicationBootstrap` | Called once the application has started                                                     |
| `OnApplicationShutdown`  | Responds to the system signals (application gets shutdown by e.g. `SIGTERM`)                |
