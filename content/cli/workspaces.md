### Workspaces

Nest has two modes for organizing code:
- **standard mode**: useful for building individual project-focused applications that have their own dependencies and settings, and don't need to optimize for sharing modules, or optimizing complex builds.  This is the default mode.
- **monorepo mode**: this mode treats code artifacts as part of a lightweight **monorepo**, and may be more appropriate for teams of developers and/or multi-project environments.  It automates parts of the build process to make it easy to create and compose modular components, promotes code re-use, makes integration testing easier, makes it easy to share project-wide artifacts like `tslint` rules and other configuration policies, and is easier to use than alternatives like github submodules.  Monorepo mode employs the concept of a **workspace**, represented in the `nest-cli.json` file, to coordinate the relationship between the components of the monorepo.

It's important to note that virtually all of Nest's features are independent of your code organization mode. The **only** affect of this choice is how your projects are composed and how build artifacts are generated.  All other functionality, from the CLI to core modules to add-on modules work the same in either mode.

Also, you can easily switch from **standard mode** to **monorepo mode** at any time, so you can delay this decision until the benefits of one or the other approach become more clear.

### Standard mode

When you run `nest new`, a new **project** is created for you using a built-in schematic. Nest does the following:

1. Create a new folder, corresponding to the `name` argument you provide to `nest new`
2. Populate that folder with default files corresponding to a minimal base-level Nest application.  You can examine these files at the [typescript-starter](https://github.com/nestjs/typescript-starter) repository.
3. Provide additional files such as `nest-cli.json`, `package.json` and `tsconfig.json` that configure and enable various tools for compiling, testing and serving your application.

From there, you can modify the starter files, add new components, add dependencies (e.g., `npm install`), and otherwise develop your application as covered in the rest of this documentation.

### Monorepo mode

To enable monorepo mode, you start with a *standard mode* structure, and add **projects**.  A project can be a full **application** (which you add to the workspace with the command `nest generate app`) or a **library** (which you add to the workspace with the command `nest generate library`). We'll discuss the details of these specific types of project components below.  The key point to note now is that it is the **act of adding a project** to an existing standard mode structure that **converts it** to monorepo mode.  Let's look at an example.

If we run:
```bash
nest new my-project
```

We've constructed a *standard mode* structure, with a folder structure that looks like this:

<div class="file-tree">
  <div class="item">src</div>
  <div class="children">
    <div class="item">app.controller.ts</div>
    <div class="item">app.service.ts</div>
    <div class="item">app.module.ts</div>
    <div class="item">main.ts</div>
  </div>
  <div class="item">node_modules</div>
  <div class="item">nest-cli.json</div>
  <div class="item">package.json</div>
  <div class="item">tsconfig.json</div>
  <div class="item">tslint.json</div>
</div>

The `nest-cli.json` file looks like this:
```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

We can convert this to a *monorepo mode* structure as follows:

```bash
cd my-project
nest generate app my-app
```

At this point, `nest` **converts** the existing structure to a **monorepo mode** structure.  This results in a few important changes.  The folder structure now looks like this:

<div class="file-tree">
  <div class="item">apps</div>
    <div class="children">
      <div class="item">my-app</div>
      <div class="children">
        <div class="item">src</div>
        <div class="children">
          <div class="item">app.controller.ts</div>
          <div class="item">app.service.ts</div>
          <div class="item">app.module.ts</div>
          <div class="item">main.ts</div>
        </div>
        <div class="item">tsconfig.app.json</div>
      </div>
      <div class="item">my-project</div>
      <div class="children">
        <div class="item">src</div>
        <div class="children">
          <div class="item">app.controller.ts</div>
          <div class="item">app.service.ts</div>
          <div class="item">app.module.ts</div>
          <div class="item">main.ts</div>
        </div>
        <div class="item">tsconfig.app.json</div>
      </div>
    </div>
  <div class="item">nest-cli.json</div>
  <div class="item">package.json</div>
  <div class="item">tsconfig.json</div>
  <div class="item">tslint.json</div>
</div>

The `nest` schematic has reorganized the code - moving each **application** project under the `apps` folder, and adding a project-specific `tsconfig.app.json` file.  Our original `my-project` app has become the **default project** for the monorepo, and is now a peer with the just-added `my-app`, located under the `apps` folder.

The `nest-cli.json` file contains details describing the workspace.  It now looks like this:

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/my-project/src",
  "monorepo": true,
  "root": "apps/my-project",
  "compilerOptions": {
    "webpack": true,
    "tsConfigPath": "apps/my-project/tsconfig.app.json"
  },
  "projects": {
    "my-project": {
      "type": "application",
      "root": "apps/my-project",
      "entryFile": "main",
      "sourceRoot": "apps/my-project/src",
      "compilerOptions": {
        "tsConfigPath": "apps/my-project/tsconfig.app.json"
      }
    },
    "my-app": {
      "type": "application",
      "root": "apps/my-app",
      "entryFile": "main",
      "sourceRoot": "apps/my-app/src",
      "compilerOptions": {
        "tsConfigPath": "apps/my-app/tsconfig.app.json"
      }
    }
  }
}
```
> info **Warning** The conversion of a standard mode structure to monorepo only works for projects that have followed the canonical Nest project structure.  Specifically, during conversion, the schematic attempts to relocate the `src` and `test` folders beneath the `apps` folder in the root.  If a project does not use this structure, the conversion will fail or produce unreliable results.

### Workspace projects

A mono repo uses the concept of a workspace to manage its member entities. Workspaces are composed of **projects**.  A project may be either:
- an **application**: a full Nest application including a `main.ts` file to bootstrap the application. Aside from compile and build considerations, an application-type project within a workspace is functionally identical to an application within a *standard mode* structure.
- a **library**: a library is a way of packaging a general purpose set of features (modules, providers, controllers, etc.) that can be used within other projects.  A library cannot run on its own, and has no `main.ts` file.  Read more about libraries [here](/cli/libraries).

All workspaces have a **default project** (which should be an application-type project).  In the `nest-cli.json` file above, the default project is `my-project`.  This is defined by the top-level `"root"` property, which points at the root of the default project.  Usually, this is the **standard mode** application you started with, and later converted to a monorepo using `nest generate app`.  When you follow these steps, this property is populated automatically for you with information about the standard mode project you started with.

Default projects are used by `nest` commands like `nest build` and `nest start` when a project name is not supplied.

For example, in the above structure, running
```bash
$ nest start
```

will start up the `my-project` app.  To start `my-app`, we'd use:

```bash
$ nest start my-app
```

#### Workspace global properties

Workspaces have additional workspace-wide properties that help hide the complexity of working in a multi-project environment.  These are reflected in the following top-level properties of the `nest-cli.json` file:

- `collection`: points at the collection of schematics used to generate components; you generally should not change this value
- `sourceRoot`: points at the root of the source code for the *default project*
- `monorepo`: for a monorepo mode structure, this value is always `true`
- `root`: points at the project root of the *default project*
- `compilerOptions`: a map with keys specifying compiler options and values specifying the option setting

#### Compiler options

Notice that by default, `compilerOptions` is set as follows:
```json
  "compilerOptions": {
    "webpack": true,
    "tsConfigPath": "apps/my-project/tsconfig.app.json"
  }
```

The `webpack` property, when true (the default), uses [webpack](https://webpack.js.org/) to compile and bundle the code.  This is one key difference between monorepo mode and standard mode.  Standard mode uses `tsc` for compilation by default.  The reason for this difference is that webpack can have significant advantages in build times and in producing a single file bundling all project components together.  If you wish to generate individual files, set `webpack` to `false`, which will cause the build process to use `tsc`.

The `tsConfigPath` property points at the file containing the `tsconfig.json` settings that will be used when `nest build` or `nest start` is called without a `project` option (e.g., when the default project is built or started).

### Projects

As stated, workspaces are composed of projects, which may be of the **application** or **library** type.  These are discussed below.

#### Applications

Application-type projects, or what we might informally refer to as just "applications", are complete Nest applications that you can run and deploy.  You generate an application-type project with `nest generate app`.

Let's look inside the `tsconfig.app.json` of the `my-app` project that we built in the last step:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "declaration": false,
    "outDir": "../../dist/apps/my-app"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

The `nest` command automatically generated this for us, and it takes care of setting up proper compilation.  It automatically configures settings so that the compiler can resolve module references and the build artifacts are placed in an appropriate folder.

#### Libraries

As mentioned, library-type projects, or simply "libraries", are packages of Nest components that need to be composed into applications in order to run.  You generate a library-type project with `nest generate library`.

Deciding what belongs in a library is an architectural design decision.  We discuss libraries in depth in the [libraries](/cli/libraries) chapter.
