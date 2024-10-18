### Migration guide

This article provides a set of guidelines for migrating from Nest version 9 to version 10.
To learn more about the new features we've added in v10, check out this [article](https://trilon.io/blog/nestjs-10-is-now-available).
There were some very minor breaking changes that shouldn't affect most users - you can find the full list of them [here](https://github.com/nestjs/nest/releases/tag/v10.0.0).

#### Upgrading packages

While you can upgrade your packages manually, we recommend using [ncu (npm check updates)](https://npmjs.com/package/npm-check-updates).

#### Cache module

The `CacheModule` has been removed from the `@nestjs/common` package and is now available as a standalone package - `@nestjs/cache-manager`. This change was made to avoid unnecessary dependencies in the `@nestjs/common` package. You can learn more about the `@nestjs/cache-manager` package [here](https://docs.nestjs.com/techniques/caching).

#### Logger

Refactor the values of the `verbose` and `debug` log levels (see [PR](https://github.com/nestjs/nest/pull/11036/files)), now the debug value is set to `1` while verbose is set to `0`.

#### Deprecations

All deprecated methods & modules have been removed.

#### CLI Plugins and TypeScript >= 4.8

NestJS CLI Plugins (available for `@nestjs/swagger` and `@nestjs/graphql` packages) will now require TypeScript >= v4.8 and so older versions of TypeScript will no longer be supported. The reason for this change is that in [TypeScript v4.8 introduced several breaking changes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-8.html#decorators-are-placed-on-modifiers-on-typescripts-syntax-trees) in its Abstract Syntax Tree (AST) which we use to auto-generate OpenAPI and GraphQL schemas.

#### Dropping support for Node.js v12

As of NestJS 10, we no longer support Node.js v12, as [v12 went EOL](https://twitter.com/nodejs/status/1524081123579596800) on April 30, 2022. This means that NestJS 10 requires Node.js v16 or higher. This decision was made to allow us to finally set target to `ES2021` in our TypeScript configuration, instead of shipping polyfills as we did in the past.

From now on, every official NestJS package will be compiled to `ES2021` by default, which should result in a smaller library size and sometimes even (slightly) better performance.

We also strongly recommend using the latest LTS version.
