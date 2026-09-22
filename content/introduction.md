### Introduction

Nest (NestJS) is a framework for building efficient, scalable [Node.js](https://nodejs.org/) server-side applications. It uses progressive JavaScript, is built with and fully supports [TypeScript](https://www.typescriptlang.org/) (while still letting you write plain JavaScript), and combines elements of OOP (object-oriented programming), FP (functional programming), and FRP (functional reactive programming).

Under the hood, Nest uses robust HTTP server frameworks such as [Express](https://expressjs.com/) (the default), and can optionally be configured to use [Fastify](https://github.com/fastify/fastify) instead.

Nest provides a level of abstraction above these common Node.js frameworks (Express and Fastify), but also exposes their APIs directly to the developer. This gives you the freedom to use the myriad third-party modules available for the underlying platform.

#### Philosophy

In recent years, thanks to Node.js, JavaScript has become the "lingua franca" of the web for both frontend and backend applications. This has given rise to projects like [Angular](https://angular.dev/), [React](https://github.com/facebook/react), and [Vue](https://github.com/vuejs/core), which improve developer productivity and enable the creation of fast, testable, and extensible frontend applications. However, while plenty of excellent libraries, helpers, and tools exist for Node.js (and server-side JavaScript), none of them effectively solves the main problem of **architecture**.

Nest provides an out-of-the-box application architecture that lets developers and teams create highly testable, scalable, loosely coupled, and maintainable applications. The architecture is heavily inspired by Angular.

#### Installation

To get started, you can either scaffold the project with the [Nest CLI](/cli/overview) or [clone a starter project](#alternatives). Both produce the same outcome.

To scaffold the project with the Nest CLI, run the following commands. They create a new project directory and populate it with the initial core Nest files and supporting modules, giving your project a conventional base structure. We recommend the **Nest CLI** for first-time users, and the [First steps](/first-steps) chapter continues with this approach.

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```

#### Alternatives

Alternatively, you can install the TypeScript starter project with **Git**:

```bash
$ git clone https://github.com/nestjs/typescript-starter.git project
$ cd project
$ npm install
$ npm run start
```

> info **Hint** To clone the repository without its Git history, use [degit](https://github.com/Rich-Harris/degit).

Open your browser and navigate to [`http://localhost:3000/`](http://localhost:3000/).

To install the JavaScript flavor of the starter project, use `javascript-starter.git` in the command sequence above.

You can also start a new project from scratch by installing the core and supporting packages yourself. In that case, you need to set up the project boilerplate files on your own. At a minimum, you need these dependencies: `@nestjs/core`, `@nestjs/common`, `rxjs`, and `reflect-metadata`. For a walkthrough of creating a complete project this way, see [5 steps to create a bare minimum NestJS app from scratch](https://dev.to/micalevisk/5-steps-to-create-a-bare-minimum-nestjs-app-from-scratch-5c3b).
