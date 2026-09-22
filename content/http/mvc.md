### Model-View-Controller

By default, Nest uses the [Express](https://github.com/expressjs/express) library under the hood. As a result, every technique for using the MVC (Model-View-Controller) pattern in Express applies to Nest as well.

First, scaffold a new Nest application using the [CLI](https://github.com/nestjs/nest-cli) tool:

```bash
$ npm i -g @nestjs/cli
$ nest new project
```

To create an MVC app, you also need a [template engine](https://expressjs.com/en/guide/using-template-engines.html) to render HTML views:

```bash
$ npm install --save hbs
```

This example uses the `hbs` ([Handlebars](https://github.com/pillarjs/hbs#readme)) engine, but you can use whichever engine fits your requirements. Once the installation process is complete, configure the Express instance using the following code:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  app.useStaticAssets(join(import.meta.dirname, '..', 'public'));
  app.setBaseViewsDir(join(import.meta.dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
  );

  app.useStaticAssets(join(import.meta.dirname, '..', 'public'));
  app.setBaseViewsDir(join(import.meta.dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

This tells Express that the `public` directory stores static assets, the `views` directory contains templates, and the `hbs` template engine renders HTML output.

#### Template rendering

Now, create a `views` directory with an `index.hbs` template inside it. The template prints a `message` passed from the controller:

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

Next, open the `app.controller` file and replace its contents with the following code:

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

This code specifies the template to use in the `@Render()` decorator, and the return value of the route handler method is passed to the template for rendering. The return value is an object with a `message` property, matching the `message` placeholder in the template.

While the application is running, open your browser and navigate to `http://localhost:3000`. You should see the `Hello world!` message.

#### Adding a layout

The `hbs` engine supports layouts: shared wrapper templates that individual views are rendered into. To use one, set the `layout` local variable with the `setLocal()` method (Nest's wrapper around Express's [app.locals](https://expressjs.com/en/5x/api.html#app.locals)). Modify the previous code as follows:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  app.setLocal('layout', 'layouts/app');
  app.useStaticAssets(join(import.meta.dirname, '..', 'public'));
  app.setBaseViewsDir(join(import.meta.dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
  );

  app.setLocal('layout', 'layouts/app');
  app.useStaticAssets(join(import.meta.dirname, '..', 'public'));
  app.setBaseViewsDir(join(import.meta.dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

Next, create a `layouts` folder inside `views` and add an `app.hbs` file with the following content:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>App</title>
  </head>
  <body>
    {{ '{' }}{{ '{' }}{{ '{' }}body{{ '}' }}{{ '}' }}{{ '}' }}
  </body>
</html>
```

Then, update the `index.hbs` file to:

```html
{{ "{{ message }\}" }}
```

The resulting file structure looks as follows:

<div class="file-tree">
  <div class="item">views</div>
  <div class="children">
    <div class="item">layouts</div>
    <div class="children">
      <div class="item">app.hbs</div>
    </div>
    <div class="item">index.hbs</div>
  </div>
</div>

#### Dynamic template rendering

If the application logic must dynamically decide which template to render, use the `@Res()` decorator and supply the view name in the route handler, rather than in the `@Render()` decorator:

> info **Hint** When Nest detects the `@Res()` decorator, it injects the library-specific `response` object, which you can use to render the template dynamically. See the [Express API reference](https://expressjs.com/en/api.html) to learn more about the `response` object.

```typescript
@@filename(app.controller)
import { Get, Controller, Res, Render } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  root(@Res() res: Response) {
    return res.render(
      this.appService.getViewName(),
      { message: 'Hello world!' },
    );
  }
}
```

#### Example

A working example is available in the [15-mvc sample](https://github.com/nestjs/nest/tree/master/sample/15-mvc).

#### Fastify

As mentioned in the [Performance (Fastify)](/http/performance) chapter, you can use any compatible HTTP provider with Nest. One such library is [Fastify](https://github.com/fastify/fastify). To create an MVC application with Fastify, install the following packages:

```bash
$ npm i --save @fastify/static @fastify/view handlebars
```

The next steps follow almost the same process as with Express, with minor platform-specific differences. Once the installation process is complete, open the `main.ts` file and update its contents:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { join } from 'node:path';
import Handlebars from 'handlebars';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.useStaticAssets({
    root: join(import.meta.dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: Handlebars,
    },
    templates: join(import.meta.dirname, '..', 'views'),
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { join } from 'node:path';
import Handlebars from 'handlebars';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  app.useStaticAssets({
    root: join(import.meta.dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: Handlebars,
    },
    templates: join(import.meta.dirname, '..', 'views'),
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

The Fastify API has a few differences, but the end result of these method calls is the same. One notable difference is that with Fastify, the template name you pass to the `@Render()` decorator must include the file extension:

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

Alternatively, you can use the `@Res()` decorator to inject the response directly and specify the view you want to render, as shown below:

```typescript
import { Get, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Get()
root(@Res() res: FastifyReply) {
  return res.view('index.hbs', { message: 'Hello world!' });
}
```

While the application is running, open your browser and navigate to `http://localhost:3000`. You should see the `Hello world!` message.

#### Example

A working example is available in the [17-mvc-fastify sample](https://github.com/nestjs/nest/tree/master/sample/17-mvc-fastify).
