### CLI command reference

#### nest new

Creates a new (standard mode) Nest project.

```bash
$ nest new <name> [options]
$ nest n <name> [options]
```

##### Description

Creates and initializes a new Nest project. The command prompts for any information you don't pass as an option: the project name, the package manager, the module system (ESM or CommonJS), and whether to set up [NestJS Observe](/observability/overview).

> info **Hint** In non-interactive environments, such as CI, pass the project name and `--package-manager`. The module system then defaults to ESM, and Observe is set up only if you pass `--observe`.

> info **Hint** Choosing **ESM** scaffolds an ESM-first project that uses Vitest for testing. Choosing **CommonJS** scaffolds the traditional layout, which uses Jest. Both variants use oxlint for linting.

The command:

- Creates a folder with the given `<name>`
- Populates the folder with configuration files
- Creates subfolders for source code (`/src`) and end-to-end tests (`/test`)
- Populates the subfolders with default files for application components and tests

##### Arguments

| Argument | Description                 |
| -------- | --------------------------- |
| `<name>` | The name of the new project |

##### Options

| Option                                | Description                                                                                                                                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--directory [directory]`             | Destination directory.                                                                                                                                                                                                                                        |
| `--dry-run`                           | Report the changes that would be made, without changing the filesystem.<br/> Alias: `-d`                                                                                                                                                                      |
| `--skip-git`                          | Skip git repository initialization.<br/> Alias: `-g`                                                                                                                                                                                                          |
| `--skip-install`                      | Skip package installation.<br/> Alias: `-s`                                                                                                                                                                                                                   |
| `--skip-tests`                        | Skip generating test files for the new project.<br/> Alias: `-t`                                                                                                                                                                                              |
| `--package-manager [package-manager]` | Package manager to use: `npm`, `yarn`, `pnpm`, or `bun`. The package manager must be installed globally.<br/> Alias: `-p`                                                                                                                                      |
| `--language [language]`               | Programming language: `TS` (default) or `JS`. The value is case-insensitive, and `typescript` / `javascript` are also accepted.<br/> Alias: `-l`                                                                                                                |
| `--collection [collectionName]`       | Schematics collection to use. Pass the package name of an installed npm package that contains the schematic.<br/> Alias: `-c`                                                                                                                                 |
| `--strict`                            | Enable TypeScript's `strict` mode (with `strictPropertyInitialization` disabled) in the generated `tsconfig.json`. Enabled by default, and there is no flag to disable it: to opt out, set `"strict": false` in `tsconfig.json` after generating the project. |
| `--format`                            | Format generated files using Prettier.                                                                                                                                                                                                                        |
| `--observe` / `--no-observe`          | Set up the `@nestjs/observe` SDK, or skip it, without being prompted. Omit both to be prompted in an interactive terminal (the prompt defaults to yes). Without a terminal, Observe is not set up.                                                            |

#### nest generate

Generates and/or modifies files based on a schematic.

```bash
$ nest generate <schematic> <name> [options]
$ nest g <schematic> <name> [options]
```

##### Arguments

| Argument      | Description                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `<schematic>` | The `schematic` or `collection:schematic` to generate. See the table below for the available schematics. |
| `<name>`      | The name of the generated component. If omitted, the schematic prompts for it.                           |

##### Schematics

| Name          | Alias | Description                                                                                                            |
| ------------- | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| `app`         |       | Generate a new application within a monorepo (converting a standard mode structure to a monorepo).                     |
| `library`     | `lib` | Generate a new library within a monorepo (converting a standard mode structure to a monorepo).                         |
| `class`       | `cl`  | Generate a new class.                                                                                                  |
| `controller`  | `co`  | Generate a controller declaration.                                                                                     |
| `decorator`   | `d`   | Generate a custom decorator. As of v12, the generated decorator uses the `Reflector.createDecorator()` form.           |
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
| `resource`    | `res` | Generate a new CRUD resource (TypeScript only). See the [CRUD (resource) generator](/recipes/crud-generator).          |
| `service`     | `s`   | Generate a service declaration.                                                                                        |

##### Options

| Option                          | Description                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--dry-run`                     | Report the changes that would be made, without changing the filesystem.<br/> Alias: `-d`                        |
| `--project [project]`           | Project that the element should be added to.<br/> Alias: `-p`                                                   |
| `--flat`                        | Do not generate a folder for the element.                                                                       |
| `--no-flat`                     | Generate a folder for the element.                                                                              |
| `--collection [collectionName]` | Schematics collection to use. Pass the package name of an installed npm package that contains the schematic.<br/> Alias: `-c` |
| `--spec`                        | Generate spec files (default).                                                                                  |
| `--no-spec`                     | Skip generating spec files.                                                                                     |
| `--spec-file-suffix [suffix]`   | Use a custom suffix for spec files.                                                                             |
| `--skip-import`                 | Skip importing the generated element into its closest module.                                                   |
| `--format`                      | Format generated files using Prettier.                                                                          |
| `--type <type>`                 | (`resource` only) Transport layer: `rest`, `graphql-code-first`, `graphql-schema-first`, `microservice`, or `ws`. |
| `--crud [value]`                | (`resource` only) Whether to generate CRUD entry points (`true` or `false`).                                    |

#### nest build

Compiles an application or workspace into an output folder.

The `build` command is also responsible for:

- mapping paths (if you use path aliases) via `tsconfig-paths`
- annotating DTOs with OpenAPI decorators (if the `@nestjs/swagger` CLI plugin is enabled)
- annotating DTOs with GraphQL decorators (if the `@nestjs/graphql` CLI plugin is enabled)

```bash
$ nest build [name...] [options]
```

##### Arguments

| Argument    | Description                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------- |
| `[name...]` | The name of the project to build. Pass several names to build several projects. If omitted, the default project is built. |

##### Options

| Option                  | Description                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--path [path]`         | Path to `tsconfig` file. <br/>Alias `-p`                                                                                                                                                   |
| `--config [path]`       | Path to `nest-cli` configuration file. <br/>Alias `-c`                                                                                                                                     |
| `--watch`               | Run in watch mode (live-reload).<br /> With the `tsc` compiler, you can type `rs` to restart the application (when the `manualRestart` option is set to `true`). <br/>Alias `-w` |
| `--builder [name]`      | Builder to use for compilation (`tsc`, `swc`, or `rspack`). <br/>Alias `-b`                                                                                                                |
| `--webpack`             | Deprecated legacy flag for webpack-based compilation. Use `--builder rspack` or another explicit builder instead.                                                                         |
| `--webpackPath [path]`  | Deprecated legacy path to a webpack configuration file. Use the configuration supported by your selected builder instead.                                                                 |
| `--rspackPath [path]`   | Path to a Rspack configuration file.                                                                                                                                                      |
| `--tsc`                 | Force the use of `tsc` for compilation.                                                                                                                                                    |
| `--watchAssets`         | Watch non-TS files (assets such as `.graphql` files). See [Assets](/cli/monorepo#assets) for more details.                                                                                 |
| `--type-check`          | Enable type checking (when SWC is used).                                                                                                                                                   |
| `--no-type-check`       | Disable type checking (when SWC is used).                                                                                                                                                  |
| `--emit-declarations`   | Emit declaration files (`.d.ts`) when using the SWC builder.                                                                                                                               |
| `--all`                 | Build all projects in a monorepo.                                                                                                                                                          |
| `--parallel [concurrency]` | Build projects in parallel (use with `--all`). Pass a positive integer to limit concurrency, or omit the value for unlimited concurrency.                                                |
| `--silent`              | Suppress informational compiler logs.                                                                                                                                                      |
| `--preserveWatchOutput` | Keep outdated console output in watch mode instead of clearing the screen. (`tsc` watch mode only)                                                                                         |

#### nest start

Compiles and runs an application (or the default project in a workspace).

```bash
$ nest start [name] [options]
```

##### Arguments

| Argument | Description                                                          |
| -------- | -------------------------------------------------------------------- |
| `[name]` | The name of the project to run. If omitted, the default project runs. |

##### Options

| Option                  | Description                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--path [path]`         | Path to `tsconfig` file. <br/>Alias `-p`                                                                                           |
| `--config [path]`       | Path to `nest-cli` configuration file. <br/>Alias `-c`                                                                             |
| `--watch`               | Run in watch mode (live-reload). <br/>Alias `-w`                                                                                   |
| `--builder [name]`      | Builder to use for compilation (`tsc`, `swc`, or `rspack`). <br/>Alias `-b`                                                      |
| `--preserveWatchOutput` | Keep outdated console output in watch mode instead of clearing the screen. (`tsc` watch mode only)                                 |
| `--watchAssets`         | Run in watch mode (live-reload), watching non-TS files (assets). See [Assets](/cli/monorepo#assets) for more details.              |
| `--debug [hostport]`    | Run in debug mode (with the `--inspect` flag). <br/>Alias `-d`                                                                     |
| `--webpack`             | Deprecated legacy flag for webpack-based compilation. Use `--builder rspack` or another explicit builder instead.                |
| `--webpackPath [path]`  | Deprecated legacy path to a webpack configuration file. Use the configuration supported by your selected builder instead.          |
| `--rspackPath [path]`   | Path to a Rspack configuration file.                                                                                              |
| `--tsc`                 | Force the use of `tsc` for compilation.                                                                                            |
| `--type-check`          | Enable type checking (when SWC is used).                                                                                           |
| `--no-type-check`       | Disable type checking (when SWC is used).                                                                                          |
| `--emit-declarations`   | Emit declaration files (`.d.ts`) when using the SWC builder.                                                                       |
| `--silent`              | Suppress informational compiler logs.                                                                                              |
| `--sourceRoot [sourceRoot]` | Root of the source code (overrides the `sourceRoot` setting in `nest-cli.json`).                                               |
| `--entryFile [entryFile]` | Entry file to run (overrides the `entryFile` setting in `nest-cli.json`).                                                        |
| `--exec [binary]`       | Binary to run (default: `node`). <br/>Alias `-e`                                                                                   |
| `--no-shell`            | Do not spawn child processes within a shell (see the Node.js `child_process.spawn()` documentation).                               |
| `--env-file [path]`     | Load environment variables from a file, relative to the current directory, and expose them to the application on `process.env`. Repeat the option to load several files. |
| `-- [key=value]`        | Command-line arguments that the application can read from `process.argv`.                                                          |

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
| `--dry-run`           | Report the changes that would be made, without changing the filesystem.<br/> Alias: `-d` |
| `--skip-install`      | Skip package installation.<br/> Alias: `-s`                                              |
| `--project [project]` | Project that the library should be added to.<br/> Alias: `-p`                            |

#### nest upgrade

Upgrades an existing project to the latest NestJS major version.

```bash
$ nest upgrade [options]
$ nest update [options]
```

##### Description

Run from the root of a NestJS v11 project, `nest upgrade` updates your dependencies to v12 and applies the mechanical parts of the migration:

- Refuses to run on Node.js releases that lack `require(esm)` (anything older than v20.19, or v22.x older than v22.12)
- Bumps every recognized `@nestjs/*` package to its v12-compatible major (`@nestjs/graphql`, `@nestjs/apollo`, and `@nestjs/mercurius` go to v14), and reports any other `@nestjs/*` package it doesn't recognize so you can review it yourself
- Bumps TypeScript to v6 (required by the v12 CLI and schematics), and raises `engines.node` in `package.json` to `>=20.19.0` if it declares a lower floor
- Migrates `nest-cli.json` off the deprecated `webpack` / `webpackConfigPath` options and onto `--builder rspack`, updating matching `package.json` scripts
- Renames the GraphQL `playground` option to `graphiql`, switches subscriptions from `subscriptions-transport-ws` to `graphql-ws`, and swaps the packages accordingly
- Replaces the legacy `nats` package with `@nats-io/transport-node` / `@nats-io/nats-core` and rewrites `nats` imports
- Moves library-specific `@nestjs/config` settings under `validationOptions.libraryOptions` and bumps Joi to v18 (the first release implementing Standard Schema)
- Bumps Jest to v30 (and `@types/jest` / `ts-jest` to matching releases) where present, and warns that Jest can `require()` the ESM-only v12 packages only on Node.js v24.9+
- Optionally installs and wires up [`@nestjs/observe`](/observability/overview). It prompts, unless you pass `--observe` or `--no-observe`
- Checks `tsconfig.json` and `tsconfig.build.json` for settings that TypeScript 6 or the ESM-only packages no longer support, such as a legacy `moduleResolution` or a missing `rootDir`
- Scans your sources and prints notes about behavior that changed but can't be migrated automatically, such as lifecycle hook ordering, refined pipe signatures, and structured logging params

The command finishes by installing the updated dependencies (unless `--skip-install` is passed) and printing a report of everything it changed, warned about, and left for you.

> warning **Warning** `nest upgrade` only bumps the **local** `@nestjs/cli` dependency. Update a globally installed CLI yourself with `npm i -g @nestjs/cli@latest`, and do it **before** running the upgrade, because the command itself ships with the CLI.

> info **Hint** The command deliberately does not migrate your project to ESM, Vitest, or oxlint. Those are the defaults for newly generated v12 projects, but existing projects can adopt them on their own schedule. See the [migration guide](/migration-guide) for the full picture.

##### Options

| Option                          | Description                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `--dry-run`                     | Report the changes that would be made, without changing the filesystem.<br/> Alias: `-d`                          |
| `--skip-install`                | Skip package installation.<br/> Alias: `-s`                                                                       |
| `--observe` / `--no-observe`    | Set up `@nestjs/observe`, or skip the setup, without being prompted. Omit both to be prompted in an interactive terminal (the prompt defaults to no). Without a terminal, Observe is not set up. |
| `--tag [tag]`                   | Use an npm dist-tag (e.g., `next`) instead of the default version ranges.<br/> Alias: `-t`                        |
| `--collection [collectionName]` | Schematics collection to use. Pass the package name of an installed npm package that contains the schematic.<br/> Alias: `-c` |

#### nest deploy

Deploys your application to the cloud, powered by [Mau](https://mau.nestjs.com/).

```bash
$ nest deploy [mau-options]
```

##### Description

`nest deploy` is a thin wrapper around the Mau CLI. It locates the Mau binary and forwards every argument you pass to `mau deploy`, so any option Mau supports works here unchanged.

If Mau is not installed in your project, the command offers to add `@nestjs/mau` as a dev dependency and then continues. In a non-interactive environment (e.g., CI), the command fails instead of prompting, so install Mau explicitly first:

```bash
$ npm install --save-dev @nestjs/mau
```

Once Mau starts, it owns the terminal, so its output and prompts reach you directly. See the [Deployment chapter](/deployment#easy-deployment-with-mau) for what Mau does and how to configure it.

#### nest info

Displays information about installed Nest packages and other useful system information. For example:

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
OS Version     : macOS Sequoia 24.6.0
NodeJS Version : v22.12.0
NPM Version    : 10.9.0

[Nest CLI]
Nest CLI Version : 12.0.3

[Nest Platform Information]
platform-express version : 12.0.4
schematics version       : 12.0.4
testing version          : 12.0.4
common version           : 12.0.4
core version             : 12.0.4
cli version              : 12.0.3
```
