### Overview

The [Nest CLI](https://github.com/nestjs/nest-cli) is a command-line interface tool that helps you to initialize, develop, and maintain your Nest applications. It assists in multiple ways, including scaffolding the project, serving it in development mode, and building and bundling the application for production distribution.  It embodies best-practice architectural patterns to encourage well-structured apps.

The Nest CLI is based on the [Angular Devkit](https://github.com/angular/devkit) package, and works for server-side applications in much the same way that the [Angular CLI](https://angular.io/cli) assists development of client-side Angular apps.

#### Installation

Install the CLI using **npm**.

> info **Warning** you should use the `-g` option to install `@nestjs/cli` globally, as some of its functions operate outside of the context of a `package.json` file.

```bash
$ npm install -g @nestjs/cli
```

#### Basic workflow

Once installed, you can invoke CLI commands directly from your OS command line through the `nest` executable.  Show the available `nest` commands by entering the following:

```bash
$ nest --help
```

Get help on an individual command using the following construct. Substitute any command, like `new`, `add`, etc., where you see `generate` in the example below to get detailed help on that command:

```bash
$ nest generate --help
```

To create, build and run a new basic Nest project in development mode, go to the folder that should be the parent of your new project, and run the following commands:

```bash
$ nest new my-nest-project
$ cd my-nest-project
$ nest start --watch
```

In your browser, open [http://localhost:3000](http://localhost:3000) to see the new application running. With the `--watch` flag, the app will automatically recompile and reload when you change any of the source files.

#### Workspaces

When you run `nest new`, Nest generates a boilerplate application structure by creating a new folder and populating an initial set of files.  You can continue working in this default structure, adding new components, as described throughout this documentation.  We refer to this as **single project mode**.  Nest also supports the notion of a multi-project **workspace mode**.  You can read the section on [Workspaces](/cli/workspaces) to decide which mode is most suitable for you.  Aside from a very few specific considerations around how the **build** process works (essentially, workspaces automate the build complexities that can sometimes arise from monorepo-style project structures), the rest of this documentation applies equally to both single project and workspace mode approaches.  In fact, you can easily switch from single project mode to workspace mode at any time in the future, so you can safely defer this decision while you're still learning about Nest.

### CLI command syntax

All `nest` commands follow the same format:

`nest commandOrAlias requiredArg [optionalArg] [options]`

For example:

```bash
$ nest new my-nest-project --dry-run
```

Here, `new` is the *commandOrAlias*.  The `new` command has an alias of `n`.  `my-nest-project` is the *requiredArg*.  If a *requiredArg* is not supplied on the command line, `nest` will prompt for it.  Also, `--dry-run` has an equivalent short-hand form `-d`.  With this in mind, the following command is the equivalent of the above:

```bash
$ nest n my-nest-project -d
```

Most commands, and some options, have aliases.  Try running `nest new --help` to see these options and aliases, and to confirm your understanding of the above constructs.

### Command overview

Run `nest <command> --help` for any of the following commands to see command-specific options.

| Command    | Alias | Description                                                                                           |
| ---------- | ----- | ----------------------------------------------------------------------------------------------------- |
| `new`      | `n`   | Scaffolds a new *single project mode* application with all boilerplate files needed to run.           |
| `generate` | `g`   | Generates and/or modifies files based on a schematic.                                                 |
| `build`    |       | Compiles an application or workspace into an output folder.                                           |
| `start`    |       | Compiles and runs an application (or default app in a workspace).                                     |
| `add`      |       | Imports a library that has been packaged as a **nest library**, running its install schematic.        |
| `update`   | `u`   | Update `@nestjs` dependencies in the `package.json` `"dependencies"` list to their `@latest` version. |
| `info`     | `i`   | Displays information about installed nest packages and other helpful system info.                     |


