### Overview

The [Nest CLI](https://github.com/nestjs/nest-cli) is a command-line interface tool that helps you to initialize, develop, and maintain your Nest applications. It assists in multiple ways, including scaffolding the project, serving it in development mode, and building and bundling the application for production distribution.  It embodies best-practice architectural patterns to encourage well-structured apps.



#### Installation

Install the CLI using **npm**.

> info **Warning** You should use the `-g` option to install `@nestjs/cli` globally, as some of its functions operate outside of the context of a `package.json` file.

```bash
$ npm install -g @nestjs/cli
```

#### Basic workflow

Once installed, you can invoke CLI commands directly from your OS command line through the `nest` executable.  See the available `nest` commands by entering the following:

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

#### Project structure

When you run `nest new`, Nest generates a boilerplate application structure by creating a new folder and populating an initial set of files.  You can continue working in this default structure, adding new components, as described throughout this documentation.  We refer to this as **standard mode**.  Nest also supports the notion of a multi-project **monorepo mode**.

Aside from a very few specific considerations around how the **build** process works (essentially, monorepo mode simplifies build complexities that can sometimes arise from monorepo-style project structures), and built-in [library](/cli/libraries) support, the rest of the Nest features, and this documentation, apply equally to both standard and monorepo mode project structures.  In fact, you can easily switch from standard mode to monorepo mode at any time in the future, so you can safely defer this decision while you're still learning about Nest.

You can use either mode to manage multiple projects. Here's a quick summary of the differences:

| Feature                                              | Standard Mode                                                      | Monorepo Mode                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| Multiple projects                                    | Separate file system structure                                     | Single file system structure                               |
| `node_modules` & `package.json`                      | Separate instances                                                 | Shared across monorepo                                     |
| Default compiler                                     | `tsc`                                                              | webpack                                                    |
| Compiler settings                                    | Specified separately                                               | Monorepo defaults that can be overridden per project       |
| Config files like `tslint.json`, `.prettierrc`, etc. | Specified separately                                               | Shared across monorepo                                     |
| `nest build` and `nest start` commands               | Target defaults automatically to the (only) project in the context | Target defaults to the **default project** in the monorepo |
| Libraries                                            | Managed manually, usually via npm packaging                        | Built-in support, including path management and bundling   |

Read the sections on [Workspaces](/cli/workspaces) and [Libraries](/cli/libraries) for more detailed information to help you decide which mode is most suitable for you.

### CLI command syntax

All `nest` commands follow the same format:

```bash
nest commandOrAlias requiredArg [optionalArg] [options]`
```

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

See [usage](/cli/usage) for detailed descriptions for each command.

| Command    | Alias | Description                                                                                           |
| ---------- | ----- | ----------------------------------------------------------------------------------------------------- |
| `new`      | `n`   | Scaffolds a new *standard mode* application with all boilerplate files needed to run.                 |
| `generate` | `g`   | Generates and/or modifies files based on a schematic.                                                 |
| `build`    |       | Compiles an application or workspace into an output folder.                                           |
| `start`    |       | Compiles and runs an application (or default project in a workspace).                                 |
| `add`      |       | Imports a library that has been packaged as a **nest library**, running its install schematic.        |
| `update`   | `u`   | Update `@nestjs` dependencies in the `package.json` `"dependencies"` list to their `@latest` version. |
| `info`     | `i`   | Displays information about installed nest packages and other helpful system info.                     |


