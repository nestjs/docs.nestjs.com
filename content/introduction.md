### Introduction

Nest is a framework for building efficient, scalable [Node.js](http://nodejs.org/) server-side applications. It uses progressive JavaScript, is built with [TypeScript](http://www.typescriptlang.org/) (preserves compatibility with pure JavaScript) and combines elements of OOP (Object Oriented Programming), FP (Functional Programming), and FRP (Functional Reactive Programming).

Under the hood, Nest makes use of [Express](https://expressjs.com/), but also provides compatibility with a wide range of other libraries (e.g. [Fastify](https://github.com/fastify/fastify)). This allows for easy use of the myriad third-party plugins which are available.

#### Philosophy

In recent years, thanks to Node.js, JavaScript has become the “lingua franca” of the web for both front and backend applications. This has given rise to awesome projects like [Angular](https://angular.io/), [React](https://github.com/facebook/react) and [Vue](https://github.com/vuejs/vue) which improve developer productivity and enable the construction of fast, testable, and extensible frontend applications. However, while plenty of superb libraries, helpers, and tools exist for Node (and server-side JavaScript), none of them effectively solve the main problem - **architecture**.

Nest provides an out-of-the-box application architecture which allows for effortless creation of highly testable, scalable, loosely coupled, and easily maintainable applications.

#### Installation

To get started, scaffold the base project with the [Nest CLI](/cli/overview):

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```

Install the starter project with **Git**:

```bash
$ git clone https://github.com/nestjs/typescript-starter.git project
$ cd project
$ npm install
$ npm run start
```

Or start a new project from scratch with **npm** (or **yarn**):

```bash
$ npm i --save @nestjs/core @nestjs/common rxjs reflect-metadata
```

#### Stay in touch

- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)
