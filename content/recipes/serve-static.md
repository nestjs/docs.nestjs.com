### Serve Static

In order to serve static content like a Single Page Application (SPA) we can use the `ServeStaticModule` from the `@nestjs/serve-static` package.

#### Installation

First we need to install the required package:

```bash
$ npm install --save @nestjs/serve-static
```

#### Bootstrap

Once the installation process is done, we can import the `ServeStaticModule` into the root `AppModule` and configure it by passing in a configuration object to the `forRoot()` method.

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

With this in place, build the static website and place its content in the location specified by the `rootPath` property.

#### Summary

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/24-serve-static).
