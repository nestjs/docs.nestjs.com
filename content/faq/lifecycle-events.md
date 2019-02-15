### Lifecycle Events

There are two application lifecycle events, `OnModuleInit` and `OnModuleDestroy` hooks. It's a good practice to use them for all the initialization stuff and avoid putting anything directly in the constructor. The constructor should be used only to initialize the class members and for injecting the required dependencies.

```typescript
@@filename()
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit, OnModuleDestroy {
  onModuleInit() {
    console.log(`Initialization...`);
  }

  onModuleDestroy() {
    console.log(`Cleanup...`);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  onModuleInit() {
    console.log(`Initialization...`);
  }

  onModuleDestroy() {
    console.log(`Cleanup...`);
  }
}
```

In order to defer initialization of the application, you can either use `await` keyword or return a `Promise`.

```typescript
@@filename()
async onModuleInit(): Promise<any> {
  await this.fetch();
}
@@switch
async onModuleInit() {
  await this.fetch();
}
```
