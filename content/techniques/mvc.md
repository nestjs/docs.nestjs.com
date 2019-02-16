### Model-View-Controller

Nest, by default, makes use of [express](https://github.com/expressjs/express) library under the hood. Hence, every tutorial about MVC (Model-View-Controller) pattern in express concerns Nest as well. Firstly, let's scaffold a simple Nest application using [CLI](https://github.com/nestjs/nest-cli) tool:

```bash
$ npm i -g @nestjs/cli
$ nest new project
```

In order to create a MVC app, we have to install a [template engine](http://expressjs.com/en/guide/using-template-engines.html):

```bash
$ npm install --save hbs
```

We decided to use a `hbs` engine, though, you can use whatever fits your requirements. Once the installation process is completed, we need to configure the express instance using following code:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    ApplicationModule,
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(
    ApplicationModule,
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(3000);
}
bootstrap();
```

We told [express](https://github.com/expressjs/express) that the `public` directory will be used for storing static assets, `views` will contain templates, and a `hbs` template engine should be used to render an HTML output.

Now, let's create a `views` directory and `index.hbs` template inside it. In the template, we are gonna print a `message` passed from the controller:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>App</title>
  </head>
  <body>
    {{ "{{ message }\}" }}
  </body>
</html>
```

Afterward, open the `app.controller` file and replace the `root()` method with the following code:

```typescript
@@filename(app.controller)
import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }
}
```

> info **Hint** In fact, when Nest detects `@Res()` decorator, it injects library-specific `response` object. Learn more about its abilities [here](http://expressjs.com/en/api.html).

While the application is running, open your browser and navigate to `http://localhost:3000/`. You should see the `Hello world!` message.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/15-mvc).

#### Fastify

As mentioned in this [chapter](/techniques/http-performance), we are able to use any compatible HTTP provider together with Nest. One of them is a [fastify](https://github.com/fastify/fastify) library. In order to create a MVC application with fastify, we have to install following packages:

```bash
$ npm i --save fastify point-of-view handlebars
```

The next steps cover almost the same stuff as in case of express library (with small differences). Once the installation process is completed, we need to open `main.ts` file and update its contents:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { ApplicationModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    ApplicationModule,
    new FastifyAdapter(),
  );
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  await app.listen(3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ApplicationModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule, new FastifyAdapter());
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  await app.listen(3000);
}
bootstrap();
```

The API is different a little but the idea that sits behind those methods calls remains the same. Also, we have to ensure that the template name passed into the `@Render()` decorators include a file extension.

```typescript
@@filename(app.controller)
import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index.hbs')
  root() {
    return { message: 'Hello world!' };
  }
}
```

While the application is running, open your browser and navigate to `http://localhost:3000/`. You should see the `Hello world!` message.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/17-mvc-fastify).
