### CLI command reference

#### nest new

Creates a new (standard mode) Nest project.

```bash
$ nest new <name> [options]
$ nest n <name> [options]
```

##### Description

Creates and initializes a new Nest project.  Prompts for package manager.

- Creates a folder with the given `<name>`
- Populates the folder with configuration files
- Creates sub-folders for source code (`/src`) and end-to-end tests (`/test`)
- Populates the sub-folders with default files for app components and tests

##### Arguments

| Argument | Description                 |
| -------- | --------------------------- |
| `<name>` | The name of the new project |

##### Options

| Option                                | Description                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--dry-run`                           | Reports changes that would be made, but does not change the filesystem.<br/> Alias: `-d`                         |
| `--skip-git`                          | Skip git repository initialization.<br/> Alias: `-g`                                                             |
| `--skip-install`                      | Skip package installation.<br/> Alias: `-s`                                                                      |
| `--package-manager [package-manager]` | Specify package manager.  Use `npm` or `yarn`.  Package manager must be installed globally.<br/> Alias: `-p`     |
| `--language [language]`               | Specify programming language (`TS` or `JS`).<br/> Alias: `-l`                                                    |
| `--collection [collectionName]`       | Specify schematics collection.  Use package name of installed npm package containing schematic.<br/> Alias: `-c` |

#### nest generate

Generates and/or modifies files based on a schematic

```bash
$ nest generate <schematic> <name> [options]
$ nest g <schematic> <name> [options]
```

##### Arguments

| Argument      | Description                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `<schematic>` | The `schematic` or `collection:schematic` to generate.  See the table below for the available schematics. |
| `<name>`      | The name of the generated component.                                                                      |

##### Schematics

| Name          | Alias | Description                                                                                         |
| ------------- | ----- | --------------------------------------------------------------------------------------------------- |
| `application` |       | Generate a new application within a monorepo (converting to monorepo if it's a standard structure). |
| `library`     | `lib` | Generate a new library within a monorepo (converting to monorepo if it's a standard structure).     |
| `class`       | `cl`  | Generate a new class.                                                                               |
| `controller`  | `co`  | Generate a controller declaration.                                                                  |
| `decorator`   | `d`   | Generate a custom decorator.                                                                        |
| `filter`      | `f`   | Generate a filter declaration.                                                                      |
| `gateway`     | `ga`  | Generate a gateway declaration.                                                                     |
| `guard`       | `gu`  | Generate a guard declaration.                                                                       |
| `interface`   |       | Generate an interface.                                                                              |
| `interceptor` | `in`  | Generate an interceptor declaration.                                                                |
| `middleware`  | `mi`  | Generate a middleware declaration.                                                                  |
| `module`      | `mo`  | Generate a module declaration.                                                                      |
| `pipe`        | `pi`  | Generate a pipe declaration.                                                                        |
| `provider`    | `pr`  | Generate a provider declaration.                                                                    |
| `resolver`    | `r`   | Generate a resolver declaration.                                                                    |
| `service`     | `s`   | Generate a service declaration.                                                                     |

##### Options

| Option                          | Description                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--dry-run`                     | Reports changes that would be made, but does not change the filesystem.<br/> Alias: `-d `                        |
| `--project [project]`           | Project that element should be added to.<br/> Alias: `-p`                                                        |
| `--flat`                        | Do not generate a folder for the element.                                                                        |
| `--collection [collectionName]` | Specify schematics collection.  Use package name of installed npm package containing schematic.<br/> Alias: `-c` |

| `--no-spec`                     | Disable spec files generation |

#### nest build
Compiles an application or workspace into an output folder.

```bash
$ nest build <name> [options]
```

##### Arguments

| Argument | Description                       |
| -------- | --------------------------------- |
| `<name>` | The name of the project to build. |

##### Options

| Option          | Description                                     |
| --------------- | ----------------------------------------------- |
| `--path [path]` | Path to `tsconfig` file. <br/>Alias `-p`        |
| `--watch`       | Run in watch mode (live-reload) <br/>Alias `-w` |
| `--webpack`     | Use webpack for compilation.                    |
| `--webpackPath` | Path to webpack configuration.                  |

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

| Option               | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `--path [path]`      | Path to `tsconfig` file. <br/>Alias `-p`                |
| `--watch`            | Run in watch mode (live-reload) <br/>Alias `-w`         |
| `--debug [hostport]` | Run in debug mode (with --inspect flag) <br/>Alias `-d` |
| `--webpack`          | Use webpack for compilation.                            |
| `--webpackPath`      | Path to webpack configuration.                          |


#### nest add

Imports a library that has been packaged as a **nest library**, running its install schematic.

```bash
$ nest add <name> [options]
```

##### Arguments

| Argument | Description                        |
| -------- | ---------------------------------- |
| `<name>` | The name of the library to import. |


#### nest update
Updates `@nestjs` dependencies in the `package.json` `"dependencies"` list to their `@latest` version.

##### Options

| Option    | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `--force` | Do **upgrade** instead of update <br/>Alias `-f`                         |
| `--tag`   | Update to tagged version (use `@latest`, `@<tag>`, etc) <br/>Alias `-wt` |  |

#### nest info
Displays information about installed nest packages and other helpful system info. For example:


```bash
 _   _             _      ___  _____  _____  _     _____
| \ | |           | |    |_  |/  ___|/  __ \| |   |_   _|
|  \| |  ___  ___ | |_     | |\ `--. | /  \/| |     | |
| . ` | / _ \/ __|| __|    | | `--. \| |    | |     | |
| |\  ||  __/\__ \| |_ /\__/ //\__/ /| \__/\| |_____| |_
\_| \_/ \___||___/ \__|\____/ \____/  \____/\_____/\___/

[System Information]
OS Version : macOS High Sierra
NodeJS Version : v8.9.0
YARN Version : 1.5.1
[Nest Information]
microservices version : 6.0.0
websockets version : 6.0.0
testing version : 6.0.0
common version : 6.0.0
core version : 6.0.0
```
