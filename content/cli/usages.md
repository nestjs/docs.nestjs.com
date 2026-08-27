### CLI command reference

#### nest new

Creates a new (standard mode) Nest project.

```bash
$ nest new <name> [options]
$ nest n <name> [options]
```

##### Description

Creates and initializes a new Nest project. Prompts for the module system (ESM or CommonJS) and the package manager.

> info **Hint** Choosing **ESM** scaffolds an ESM-first project using Vitest for testing; choosing **CommonJS** scaffolds the traditional layout using Jest. Both variants use oxlint for linting.

- Creates a folder with the given `<name>`
- Populates the folder with configuration files
- Creates sub-folders for source code (`/src`) and end-to-end tests (`/test`)
- Populates the sub-folders with default files for app components and tests

##### Arguments

| Argument | Description                 |
| -------- | --------------------------- |
| `<name>` | The name of the new project |

##### Options

| Option                                | Description                                                                                                                                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--directory [directory]`             | Specify the destination directory.                                                                                                                                                                   |
| `--dry-run`                           | Reports changes that would be made, but does not change the filesystem.<br/> Alias: `-d`                                                                                                             |
| `--skip-git`                          | Skip git repository initialization.<br/> Alias: `-g`                                                                                                                                                 |
| `--skip-install`                      | Skip package installation.<br/> Alias: `-s`                                                                                                                                                          |
| `--skip-tests`                        | Do not generate testing files for the new project.<br/> Alias: `-t`                                                                                                                                  |
| `--package-manager [package-manager]` | Specify package manager. Use `npm`, `yarn`, `pnpm`, or `bun`. Package manager must be installed globally.<br/> Alias: `-p`                                                                           |
| `--language [language]`               | Specify programming language (`TS` or `JS`).<br/> Alias: `-l`                                                                                                                                        |
| `--collection [collectionName]`       | Specify schematics collection. Use package name of installed npm package containing schematic.<br/> Alias: `-c`                                                                                      |
| `--strict`                            | Start the project with the following TypeScript compiler flags enabled: `strictNullChecks`, `noImplicitAny`, `strictBindCallApply`, `forceConsistentCasingInFileNames`, `noFallthroughCasesInSwitch` |
| `--format`                            | Format generated files using Prettier.                                                                                                                                                               |
| `--observe` / `--no-observe`          | Auto-configure observability with `@nestjs/observe`, or skip the prompt entirely.                                                                                                                    |

#### nest generate

Generates and/or modifies files based on a schematic

```bash
$ nest generate <schematic> <name> [options]
$ nest g <schematic> <name> [options]
```

##### Arguments

| Argument      | Description                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `<schematic>` | The `schematic` or `collection:schematic` to generate. See the table below for the available schematics. |
| `<name>`      | The name of the generated component.                                                                     |

##### Schematics

| Name          | Alias | Description                                                                                                            |
| ------------- | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| `app`         |       | Generate a new application within a monorepo (converting to monorepo if it's a standard structure).                    |
| `library`     | `lib` | Generate a new library within a monorepo (converting to monorepo if it's a standard structure).                        |
| `class`       | `cl`  | Generate a new class.                                                                                                  |
| `controller`  | `co`  | Generate a controller declaration.                                                                                     |
| `decorator`   | `d`   | Generate a custom decorator. As of v12, the generated decorator uses the preferred `Reflector.createDecorator()` form. |
| `filter`      | `f`   | Generate a filter declaration.                                                                                         |
| `gateway`     | `ga`  | Generate a gateway declaration.                                                                                        |
| `guard`       | `gu`  | Generate a guard declaration.                                                                                          |
| `interface`   | `itf` | Generate an interface.                                                                                                 |
| `interceptor` | `itc` | Generate an interceptor declaration.                                                                                   |
| `middleware`  | `mi`  | Generate a middleware declaration.                                                                                     |
| `module`      | `mo`  | Generate a module declaration.                                                                                         |
| `pipe`        | `pi`  | Generate a pipe declaration.                                                                                           |
| `provider`    | `pr`  | Generate a provider declaration.                                                                                       |
| `resolver`    | `r`   | Generate a resolver declaration.                                                                                       |
| `resource`    | `res` | Generate a new CRUD resource. See the [CRUD (resource) generator](/recipes/crud-generator) for more details. (TS only) |
| `service`     | `s`   | Generate a service declaration.                                                                                        |

##### Options

| Option                          | Description                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--dry-run`                     | Reports changes that would be made, but does not change the filesystem.<br/> Alias: `-d`                        |
| `--project [project]`           | Project that element should be added to.<br/> Alias: `-p`                                                       |
| `--flat`                        | Do not generate a folder for the element.                                                                       |
| `--no-flat`                     | Generate a folder for the element.                                                                              |
| `--collection [collectionName]` | Specify schematics collection. Use package name of installed npm package containing schematic.<br/> Alias: `-c` |
| `--spec`                        | Enforce spec files generation (default)                                                                         |
| `--no-spec`                     | Disable spec files generation                                                                                   |
| `--spec-file-suffix [suffix]`   | Use a custom suffix for spec files.                                                                             |
| `--skip-import`                 | Skip importing the generated element into its closest module.                                                   |
| `--format`                      | Format generated files using Prettier.                                                                          |

#### nest build

Compiles an application or workspace into an output folder.

Also, the `build` command is responsible for:

- mapping paths (if using path aliases) via `tsconfig-paths`
- annotating DTOs with OpenAPI decorators (if `@nestjs/swagger` CLI plugin is enabled)
- annotating DTOs with GraphQL decorators (if `@nestjs/graphql` CLI plugin is enabled)

```bash
$ nest build <name> [options]
```

##### Arguments

| Argument | Description                       |
| -------- | --------------------------------- |
| `<name>` | The name of the project to build. |

##### Options

| Option                  | Description                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--path [path]`         | Path to `tsconfig` file. <br/>Alias `-p`                                                                                                                                                   |
| `--config [path]`       | Path to `nest-cli` configuration file. <br/>Alias `-c`                                                                                                                                     |
| `--watch`               | Run in watch mode (live-reload).<br /> If you're using `tsc` for compilation, you can type `rs` to restart the application (when `manualRestart` option is set to `true`). <br/>Alias `-w` |
| `--builder [name]`      | Specify the builder to use for compilation (`tsc`, `swc`, or `rspack`). <br/>Alias `-b`                                                                                                    |
| `--webpack`             | Deprecated legacy flag for webpack-based compilation. Prefer `--builder rspack` or another explicit builder.                                                                              |
| `--webpackPath`         | Deprecated legacy path to a webpack configuration file. Prefer the configuration supported by your selected builder.                                                                      |
| `--rspackPath [path]`   | Path to a Rspack configuration file.                                                                                                                                                      |
| `--tsc`                 | Force use `tsc` for compilation.                                                                                                                                                           |
| `--watchAssets`         | Watch non-TS files (assets like `.graphql` etc.). See [Assets](cli/monorepo#assets) for more details.                                                                                      |
| `--type-check`          | Enable type checking (when SWC is used).                                                                                                                                                   |
| `--no-type-check`       | Disable type checking (when SWC is used).                                                                                                                                                  |
| `--emit-declarations`   | Emit declaration files (`.d.ts`) when using the SWC builder.                                                                                                                               |
| `--all`                 | Build all projects in a monorepo.                                                                                                                                                          |
| `--parallel [concurrency]` | Build projects in parallel (used with `--all`). Pass a positive integer to limit concurrency, or omit the value for unlimited.                                                          |
| `--silent`              | Suppress informational compiler logs.                                                                                                                                                      |
| `--preserveWatchOutput` | Keep outdated console output in watch mode instead of clearing the screen. (`tsc` watch mode only)                                                                                         |

#### nest start

Compiles and runs an application (or default project in a workspace).

```bash
$ nest start <name> [options]
```

##### Arguments

| Argument | Description                     |
| -------- | ------------------------------- |
| `<name>` | The name of the project to run. |

##### Options

| Option                  | Description                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--path [path]`         | Path to `tsconfig` file. <br/>Alias `-p`                                                                                           |
| `--config [path]`       | Path to `nest-cli` configuration file. <br/>Alias `-c`                                                                             |
| `--watch`               | Run in watch mode (live-reload) <br/>Alias `-w`                                                                                    |
| `--builder [name]`      | Specify the builder to use for compilation (`tsc`, `swc`, or `rspack`). <br/>Alias `-b`                                          |
| `--preserveWatchOutput` | Keep outdated console output in watch mode instead of clearing the screen. (`tsc` watch mode only)                                 |
| `--watchAssets`         | Run in watch mode (live-reload), watching non-TS files (assets). See [Assets](cli/monorepo#assets) for more details.               |
| `--debug [hostport]`    | Run in debug mode (with --inspect flag) <br/>Alias `-d`                                                                            |
| `--webpack`             | Deprecated legacy flag for webpack-based compilation. Prefer `--builder rspack` or another explicit builder.                     |
| `--webpackPath`         | Deprecated legacy path to a webpack configuration file. Prefer the configuration supported by your selected builder.               |
| `--rspackPath [path]`   | Path to a Rspack configuration file.                                                                                              |
| `--tsc`                 | Force use `tsc` for compilation.                                                                                                   |
| `--type-check`          | Enable type checking (when SWC is used).                                                                                           |
| `--no-type-check`       | Disable type checking (when SWC is used).                                                                                          |
| `--emit-declarations`   | Emit declaration files (`.d.ts`) when using the SWC builder.                                                                       |
| `--silent`              | Suppress informational compiler logs.                                                                                              |
| `--exec [binary]`       | Binary to run (default: `node`). <br/>Alias `-e`                                                                                   |
| `--no-shell`            | Do not spawn child processes within a shell (see node's `child_process.spawn()` method docs).                                      |
| `--env-file`            | Loads environment variables from a file relative to the current directory, making them available to applications on `process.env`. |
| `-- [key=value]`        | Command-line arguments that can be referenced with `process.argv`.                                                                 |

#### nest add

Imports a library that has been packaged as a **nest library**, running its install schematic.

```bash
$ nest add <name> [options]
```

##### Arguments

| Argument | Description                        |
| -------- | ---------------------------------- |
| `<name>` | The name of the library to import. |

##### Options

| Option                | Description                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `--dry-run`           | Reports changes that would be made, but does not change the filesystem.<br/> Alias: `-d` |
| `--skip-install`      | Skip package installation.<br/> Alias: `-s`                                              |
| `--project [project]` | Project that the library should be added to.<br/> Alias: `-p`                            |

#### nest upgrade

Upgrades an existing project to the latest NestJS major version.

```bash
$ nest upgrade [options]
$ nest update [options]
```

##### Description

Run from the root of a NestJS v11 project, `nest upgrade` updates your dependencies to v12 and applies the mechanical parts of the migration for you:

- Bumps every recognized `@nestjs/*` package to its v12-compatible major (`@nestjs/graphql`, `@nestjs/apollo`, and `@nestjs/mercurius` go to v14), and reports any other `@nestjs/*` package it does not know about so you can review it yourself
- Migrates `nest-cli.json` off the deprecated `webpack` / `webpackConfigPath` options and onto `--builder rspack`, updating matching `package.json` scripts
- Renames the GraphQL `playground` option to `graphiql`, switches subscriptions from `subscriptions-transport-ws` to `graphql-ws`, and swaps the packages accordingly
- Replaces the legacy `nats` package with `@nats-io/transport-node` / `@nats-io/nats-core` and rewrites `nats` imports
- Moves library-specific `@nestjs/config` settings under `validationOptions.libraryOptions` and bumps Joi to v18 (the first release implementing Standard Schema)
- Bumps Jest (and `@types/jest` / `ts-jest`) where present, and warns when your Node.js version is too old to `require()` the ESM-only v12 packages
- Optionally installs and wires up [`@nestjs/observe`](/observability/overview) - it prompts, unless you pass `--observe` or `--no-observe`
- Scans your sources and prints notes about behavior that changed but cannot be migrated automatically, such as lifecycle hook ordering, refined pipe signatures, and structured logging params

The command finishes by installing the updated dependencies (unless `--skip-install` is passed) and printing a report of everything it changed, warned about, and left for you.

> warning **Warning** `nest upgrade` only bumps the **local** `@nestjs/cli` dependency. Update a globally installed CLI yourself with `npm i -g @nestjs/cli@latest` - and do it **before** running the upgrade, since the command itself ships with the CLI.

> info **Hint** The schematic deliberately does not migrate your project to ESM, Vitest, or oxlint. Those are the defaults for newly generated v12 projects, but existing projects can adopt them on their own schedule. See the [Migration guide](/migration-guide) for the full picture.

##### Options

| Option                          | Description                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `--dry-run`                     | Reports changes that would be made, but does not change the filesystem.<br/> Alias: `-d`                          |
| `--skip-install`                | Skip package installation.<br/> Alias: `-s`                                                                       |
| `--observe` / `--no-observe`    | Set up `@nestjs/observe`, or skip the setup entirely. Omit both to be prompted.                                   |
| `--tag [tag]`                   | Use an npm dist-tag (for example `next`) instead of the default version ranges.<br/> Alias: `-t`                  |
| `--collection [collectionName]` | Specify schematics collection. Use package name of installed npm package containing schematic.<br/> Alias: `-c`   |

#### nest deploy

Deploys your application to the cloud, powered by [Mau](https://mau.nestjs.com/).

```bash
$ nest deploy [mau-options]
```

##### Description

`nest deploy` is a thin wrapper around the Mau CLI. It locates the Mau binary and forwards every argument you pass straight through to `mau deploy`, so any option Mau supports works here unchanged.

If Mau is not installed in your project, the command offers to add `@nestjs/mau` as a dev dependency and then continues. In a non-interactive environment (for example CI) the command fails instead of prompting, so install it explicitly first:

```bash
$ npm install --save-dev @nestjs/mau
```

Because Mau owns the terminal once it starts, its output and any prompts it shows are passed through to you directly. See the [Deployment chapter](/deployment#easy-deployment-with-mau) for what Mau does and how to configure it.

#### nest info

Displays information about installed nest packages and other helpful system info. For example:

```bash
$ nest info
```

```bash
 _   _             _      ___  _____  _____  _     _____
| \ | |           | |    |_  |/  ___|/  __ \| |   |_   _|
|  \| |  ___  ___ | |_     | |\ `--. | /  \/| |     | |
| . ` | / _ \/ __|| __|    | | `--. \| |    | |     | |
| |\  ||  __/\__ \| |_ /\__/ //\__/ /| \__/\| |_____| |_
\_| \_/ \___||___/ \__|\____/ \____/  \____/\_____/\___/

[System Information]
OS Version : macOS High Sierra
NodeJS Version : v20.18.0
[Nest Information]
microservices version : 10.0.0
websockets version : 10.0.0
testing version : 10.0.0
common version : 10.0.0
core version : 10.0.0
```
