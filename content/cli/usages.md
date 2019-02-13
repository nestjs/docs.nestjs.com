### Usage

In order to achieve a high user-experience, the CLI commands share the same command schema.

```bash
$ nest [command] [...options]
```

#### Options

Each command accepts a set of **options** that are listed below:

- **\--dry-run**: allows to simulate the command execution in order to verify how it will affect your working directory

#### new (alias: n)

The **new** command generates a Nest project based on the [typescript-starter](https://github.com/nestjs/typescript-starter) as well as install the required packages. The CLI will ask you for missing information to create the project, for example, which package manager do you want to use to install dependencies.

| Option      | Description                  | Required | Default value |
| ----------- | ---------------------------- | -------- | ------------- |
| name        | Your application name        | false    | nest-app-name |
| description | Your application description | false    | description   |
| version     | Your application version     | false    | 1.0.0         |
| author      | Your application author      | false    | ''            |

Example usage:

```bash
$ nest new my-awesome-app
```

#### generate (alias: g)

The **generate** command generates a Nest architecture component.

| Option    | Description                                                | Required | Default value |
| --------- | ---------------------------------------------------------- | -------- | ------------- |
| schematic | The schematic name from the list bellow.                   | true     | N/A           |
| name      | The name of the generated Nest architecture component.     | true     | N/A           |
| path      | The path from to generate the Nest architecture component. | false    | src           |

A list of available architecture components:

- class (alias: cl)
- controller (alias: co)
- decorator (alias: d)
- exception (alias: e)
- filter (alias: f)
- gateway (alias: ga)
- guard (alias: gu)
- interceptor (alias: i)
- middleware (alias: mi)
- module (alias: mo)
- pipe (alias: pi)
- provider (alias: pr)
- service (alias: s)

Example usage:

```bash
$ nest generate service users
OR
$ nest g s users
```

#### info (alias: i)

The **info** command will display your project information.

```bash
$ nest info
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
microservices version : 5.0.0
websockets version : 5.0.0
testing version : 5.0.0
common version : 5.0.0
core version : 5.0.0
```
