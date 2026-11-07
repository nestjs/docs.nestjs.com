### Version compatibility

This page lists the Node.js and RxJS versions that each major version of Nest works with and the TypeScript version that new projects start with, and explains how to move a project from one major version to the next.

To check which version a project uses, run `nest info` in its root directory, or look at the `@nestjs/core` version in `package.json`.

#### Compatibility table

| Nest | Node.js | TypeScript in new projects | RxJS | Released |
| --- | --- | --- | --- | --- |
| 12.x | v20.19+, or v22.12+ on the 22.x line | `^6.0.2` | 7.1+ | August 2026 |
| 11.x | v20+ | `^5.7.3` | 7.1+ | January 2025 |
| 10.x | v16+ | `^5.0.0` | 7.1+ | June 2023 |
| 9.x | v12+, except v13 | `^4.3.5` | 7.1+ | July 2022 |
| 8.x | v10.13+, except v13 | `^4.3.5` | 7.1+ | July 2021 |

The **Node.js** column shows the version that the documentation of each major version asks for to run an application. In Nest 12, the CLI's generators (`nest new`, `nest generate`, and `nest upgrade`) need a newer release than that. See Node.js requirements in the [migration guide](/migration-guide) for details.

The **TypeScript in new projects** column shows the `typescript` range that `nest new` puts into the `package.json` of a new project. The framework packages themselves don't declare a minimum TypeScript version.

The **RxJS** column shows the `rxjs` peer dependency range of `@nestjs/core` and `@nestjs/common`, which is `^7.1.0` in all of these versions.

Companion packages, such as `@nestjs/config` or `@nestjs/swagger`, follow their own release lines. Use a release whose `peerDependencies` accept the major version of `@nestjs/core` and `@nestjs/common` that your project is on.

#### Moving between major versions

Each migration guide covers a single step, from one major version to the next. This site always shows the guide for the latest step. The guides for earlier steps remain in the archived documentation of the version they upgrade to:

| From | To | Migration guide |
| --- | --- | --- |
| v11 | v12 | [Migration guide](/migration-guide) |
| v10 | v11 | [docs.nestjs.com/v11/migration-guide](https://docs.nestjs.com/v11/migration-guide) |
| v9 | v10 | [docs.nestjs.com/v10/migration-guide](https://docs.nestjs.com/v10/migration-guide) |
| v8 | v9 | [docs.nestjs.com/v9/migration-guide](https://docs.nestjs.com/v9/migration-guide) |
| v7 | v8 | [docs.nestjs.com/v8/migration-guide](https://docs.nestjs.com/v8/migration-guide) |

Because each guide only describes the changes between two adjacent major versions, upgrade a project that is several versions behind **one major version at a time**. Follow the guides in order, and make sure the application builds and its tests pass before you start the next step. Before each step, check that your Node.js version matches the target row of the table above.

For the step from v11 to v12, the CLI provides the `nest upgrade` command, which updates your packages and applies the mechanical parts of the migration. See [nest upgrade](/cli/usages#nest-upgrade) for details. The command doesn't run on a project older than v11, so bring such a project to v11 first.

For the earlier steps, update the packages yourself. The framework packages (`@nestjs/core`, `@nestjs/common`, `@nestjs/testing`, and the `@nestjs/platform-*`, `@nestjs/microservices`, and `@nestjs/websockets` packages you use), as well as `@nestjs/cli` and `@nestjs/schematics`, share the major version number of Nest. Move them to the target major version in a single command, so that npm resolves their peer dependencies together. npm keeps each package in the `package.json` section it is already in. For example, from v10 to v11:

```bash
$ npm i @nestjs/core@11 @nestjs/common@11 @nestjs/platform-express@11 @nestjs/testing@11 @nestjs/cli@11 @nestjs/schematics@11
```

> info **Hint** If another package in your project, such as `@nestjs/config` or `@nestjs/swagger`, doesn't accept the target major version in its `peerDependencies`, npm reports a peer dependency conflict for it. Add that package to the same command, at a release that accepts the target major version. To see what a release accepts, run `npm view <package>@<version> peerDependencies`.

#### Older major versions

The documentation for previous major versions, back to v4, remains available under their own paths, for example [docs.nestjs.com/v11](https://docs.nestjs.com/v11) or [docs.nestjs.com/v10](https://docs.nestjs.com/v10).
