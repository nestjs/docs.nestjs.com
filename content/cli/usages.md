### CLI command reference

#### nest new

Creates a new (standard mode) Nest project.

```bash
$ nest new <name> [options]
$ nest n <name> [options]
```

##### Description

Creates and initializes a new Nest project. Prompts for package manager.

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
| `--dry-run`                           | Reports changes that would be made, but does not change the filesystem.<br/> Alias: `-d`                                                                                                             |
| `--skip-git`                          | Skip git repository initialization.<br/> Alias: `-g`                                                                                                                                                 |
| `--skip-install`                      | Skip package installation.<br/> Alias: `-s`                                                                                                                                                          |
| `--package-manager [package-manager]` | Specify package manager. Use `npm`, `yarn`, or `pnpm`. Package manager must be installed globally.<br/> Alias: `-p`                                                                                  |
| `--language [language]`               | Specify programming language (`TS` or `JS`).<br/> Alias: `-l`                                                                                                                                        |
| `--collection [collectionName]`       | Specify schematics collection. Use package name of installed npm package containing schematic.<br/> Alias: `-c`                                                                                      |
| `--strict`                            | Start the project with the following TypeScript compiler flags enabled: `strictNullChecks`, `noImplicitAny`, `strictBindCallApply`, `forceConsistentCasingInFileNames`, `noFallthroughCasesInSwitch` |

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
| `decorator`   | `d`   | Generate a custom decorator.                                                                                           |
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
| `--collection [collectionName]` | Specify schematics collection. Use package name of installed npm package containing schematic.<br/> Alias: `-c` |
| `--spec`                        | Enforce spec files generation (default)                                                                         |
| `--no-spec`                     | Disable spec files generation                                                                                   |

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
| `--builder [name]`      | Specify the builder to use for compilation (`tsc`, `swc`, or `webpack`). <br/>Alias `-b`                                                                                                   |
| `--webpack`             | Use webpack for compilation (deprecated: use `--builder webpack` instead).                                                                                                                 |
| `--webpackPath`         | Path to webpack configuration.                                                                                                                                                             |
| `--tsc`                 | Force use `tsc` for compilation.                                                                                                                                                           |
| `--watchAssets`         | Watch non-TS files (assets like `.graphql` etc.). See [Assets](cli/monorepo#assets) for more details.                                                                                      |
| `--type-check`          | Enable type checking (when SWC is used).                                                                                                                                                   |
| `--all`                 | Build all projects in a monorepo.                                                                                                                                                          |
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
| `--builder [name]`      | Specify the builder to use for compilation (`tsc`, `swc`, or `webpack`). <br/>Alias `-b`                                           |
| `--preserveWatchOutput` | Keep outdated console output in watch mode instead of clearing the screen. (`tsc` watch mode only)                                 |
| `--watchAssets`         | Run in watch mode (live-reload), watching non-TS files (assets). See [Assets](cli/monorepo#assets) for more details.               |
| `--debug [hostport]`    | Run in debug mode (with --inspect flag) <br/>Alias `-d`                                                                            |
| `--webpack`             | Use webpack for compilation. (deprecated: use `--builder webpack` instead)                                                         |
| `--webpackPath`         | Path to webpack configuration.                                                                                                     |
| `--tsc`                 | Force use `tsc` for compilation.                                                                                                   |
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
