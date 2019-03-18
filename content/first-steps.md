### First steps

In this set of articles, you'll learn the **core fundamentals** of Nest. To get familiar with the essential building-blocks of Nest applications, we'll build a basic CRUD application with features that cover a lot of ground at an introductory level.

#### Language

We're in love with [TypeScript](http://www.typescriptlang.org/), but above all - we love [Node.js](https://nodejs.org/en/). That's why Nest is compatible with both TypeScript and **pure JavaScript**. Nest is taking advantage of latest language features, so to use a framework with simple JavaScript we need a [Babel](http://babeljs.io/) compiler.

We'll mostly use TypeScript in the examples we provide, but you can always **switch the code snippets** to vanilla JavaScript syntax.

#### Prerequisites

Please make sure that [Node.js](https://nodejs.org/) (>= 8.9.0) is installed on your operating system.

#### Setup

Setting up a new project is quite simple with the [Nest CLI](/cli/overview). With [npm](https://www.npmjs.com/) installed, you can create a new Nest project with the following commands in your OS terminal:

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```

The `project` directory will be scaffolded with several core files being located within a `src/` directory.

<div class="file-tree">
  <div class="item">src</div>
  <div class="children">
    <div class="item">app.controller.ts</div>
    <div class="item">app.module.ts</div>
    <div class="item">main.ts</div>
  </div>
</div>

Following the convention, newly created modules should have their dedicated directory.

|                     |                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `main.ts`           | The entry file of the application which uses `NestFactory` to create a Nest application instance. |
| `app.module.ts`     | The root module of the application.                                                               |
| `app.controller.ts` | Basic controller sample with a single route.                                                      |

The `main.ts` includes an async function, which will **bootstrap** our application:

```typescript
@@filename(cats.controller)

import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  await app.listen(3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  await app.listen(3000);
}
bootstrap();
```

To create a Nest application instance, we are using the `NestFactory`. `NestFactory` is one of the most fundamental classes, it exposes a few static methods that allows creating application instance. The `create()` method returns an object, which fulfills the `INestApplication` interface, and provides a set of usable methods which are well described in the next chapters.

#### Platform

Nest aims to be a platform-agnostic framework. Platform independence makes possible creating reusable logical parts that developers can take advantage of across several different types of applications. Technically, Nest is able to work with any HTTP library as soon as an adapter is created. And there are two HTTP platforms supported out-of-the-box so far, [express](https://expressjs.com/) and [fastify](https://www.fastify.io).

|                    |                                                                                                                                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform-express` | [Express](https://expressjs.com/) is a well-known minimalist web framework for node. It's a battle tested, production-ready library with lots of resources implemented by the community. The `@nestjs/platform-express` package is being used by default. |
| `platform-fastify` | [Fastify](https://www.fastify.io/) is a fast and low overhead highly focused on providing the best efficiency and speed. Read how to use it [here](/techniques/performance).                                                                              |

In addition, every platform exposes a dedicated application interface, respectively `NestExpressApplication` and `NestFastifyApplication`.

```typescript
const app = await NestFactory.create<NestExpressApplication>(ApplicationModule)
```

Once you pass a type variable, `app` object will have methods available exclusively for a specific platform. Nonetheless, you don't have to do it **unless** you really need to access this platform API.

#### Running application

Once the installation process is complete, you can run the following command to start the HTTP server:

```bash
$ npm run start
```

This command starts the HTTP server on the port defined inside the `src/main.ts` file. While the application is running, open your browser and navigate to `http://localhost:3000/`. You should see the `Hello world!` message.
