### Nestia

A set of helper libraries for NestJS, supporting the below features:

  - `@nestia/core` - 15,000x faster validation decorators using [typia](https://github.com/samchon/typia)
  - `@nestia/sdk` - SDK and Swagger Documents generator for `@nestia/core`
  - `nestia` - just CLI tool

> info **info** `nestia` is a third party package and is not managed by the NestJS core team. Please, report any issues found with the library in the [appropriate repository](https://github.com/samchon/nestia).
#### Setup

##### Boilerplate Project

```bash
npx nestia start <directory>
```

Just run above command, then boilerplate project would be constructed.

##### Setup Wizard

```bash
npx nestia setup
```

When you want to use `nestia` in ordinary project, just type above command.

All installation and configuration processes would be automatically done.

Also, you can specify package manager or target `tsconfig.json` file like below:

```bash
npx nestia setup --manager npm
npx nestia setup --manager pnpm
npx nestia setup --manager yarn

npx nestia setup --project tsconfig.json
npx nestia setup --project tsconfig.test.json
```

After the setup, you only can compile `@nestia/core` utilization code by using `ttsc` ([ttypescript](https://github.com/cevek/ttypescript)) command, because `@nestia/core` is a type of tranformer library generating validation code by analyzing DTO types. If you want to run your TypeScript file directly through `ts-node` without compilation, add `-C ttypescript` argument like below:

```bash
# COMPILE THROUGH TTYPESCRIPT
npx ttsc

# RUN TS-NODE WITH TTYPESCRIPT
npx ts-node -C ttypescript src/index.ts
```

##### Manual Setup

If you want to install and configure `nestia` manually, read [Guide Documents - Setup](https://github.com/samchon/nestia/wiki/Setup).
#### `@nestia/core`

Superfast validation decorators for NestJS.

  - 15,000x faster request body validation than class-validator
  - 10x faster JSON response than `JSON.stringify()` and it's type safe
  - Do not need DTO class definition, just fine with interface

`@nestia/core` is a transformer library of NestJS, supporting superfast validation decorators, by wrapping [typia](https://github.com/samchon/typia). Comparing validation speed with `class-validator`, `typia` is maximum **15,000x times faster**, and it is even much safer.

Furthermore, `@nestia/core` can use pure interface typed DTO with **only one line**. With `@nestia/core`, you don't need any extra dedication like defining JSON schema (`@nestjs/swagger`), or using class definition with decorator function calls (`class-validator`). Just enjoy the superfast decorators with pure TypeScript type.

```typescript
import { Controller } from "@nestjs/common";
import { TypedBody, TypedRoute } from "@nestia/core";

import type { IBbsArticle } from "@bbs-api/structures/IBbsArticle";

@Controller("bbs/articles")
export class BbsArticlesController {
    /** 
     * Store a new content.
     * 
     * @param inupt Content to store
     * @returns Newly archived article
     */
    @TypedRoute.Post() // 10x faster and safer JSON.stringify()
    public async store(
        @TypedBody() input: IBbsArticle.IStore // superfast validator
    ): Promise<IBbsArticle>; 
        // do not need DTO class definition, 
        // just fine with interface
}
```

##### TypedBody

`TypedBody()` is a decorator function of `application/json` typed request body.

Also, it supports superfast validation pipe, which is maximum **15,000x times faster** than `nest.Body()` function using `class-validator`.

##### TypedRoute

`TypedRoute` is a set of decorator functions for `application/json` typed response body.

Also, it supports safe and fast JSON stringify function pipe, which is maximum 10x times faster than native `JSON.stringify()` function. Furthermore, it is **type safe** through validation.

  - `TypedRoute.Get()`
  - `TypedRoute.Post()`
  - `TypedRoute.Put()`
  - `TypedRoute.Patch()`
  - `TypedRoute.Delete()`

##### Comment Tags

You can enhance DTO type validation by writing comment tags.

If you want to know more about it, read [Guide Documents of `typia`](https://github.com/samchon/typia/wiki/Runtime-Validators#comment-tags).

```typescript
export interface IBbsArticle {
    /**
     * @format uuid
     */
    id: string;

    writer: IBbsArticle.IWriter;

    /**
     * @minItems 1
     */
    contents: IBbsArticle.IContent[];
}
export namespace IBbsArticle {
    export interface IWriter {
        /**
         * @minLength 3
         */
        name: string;

        /**
         * @format email
         */
        email: string;

        /**
         * @pattern ^0[0-9]{7,16}
         */
        mobile: string;

        /**
         * @minimum 18
         */
        age: number;
    }
}
```
#### `@nestia/sdk`

Automatic *SDK* and *Swagger* generator for `@nestia/core`.

##### Usage

```bash
# BASIC COMMAND
npx nestia <sdk|swagger> <source_directories_or_patterns> \
    --exclude <exclude_directory_or_pattern> \
    --out <output_directory_or_file>

# EXAMPLES
npx nestia sdk "src/**/*.controller.ts" --out "src/api"
npx nestia swagger "src/controllers" --out "dist/swagger.json"
```

You can generate SDK (Software Development Kit) library or Swagger Documents from above commands.

If you've configured `nestia.config.ts` file, you can generate them much easily like below. About the configuration file, read [Guide Documents - Configuration](https://github.com/samchon/nestia/wiki/Configuration)

```bash
npx nestia sdk
npx nestia swagger
```

##### Demonstration

When you run `npx nestia sdk` command, `@nestia/sdk` will generate an SDK library interacting with your backend server, composed with some codes like below. If you want to learn how to distribute and utilize the SDK library, visit and read [Guide Documents - Distribution](https://github.com/samchon/nestia/wiki/Distribution).

```typescript
import { Fetcher, IConnection } from "@nestia/fetcher";
import { IBbsArticle } from "../../../structures/IBbsArticle";

/**
 * Store a new content.
 * 
 * @param input Content to store
 * @returns Newly archived article
 */
export function store(
    connection: api.IConnection, 
    input: IBbsArticle.IStore
): Promise<IBbsArticle> {
    return Fetcher.fetch(
        connection,
        store.ENCRYPTED,
        store.METHOD,
        store.path(),
        input
    );
}
export namespace store {
    export const METHOD = "POST" as const;
    export function path(): string {
        return "/bbs/articles";
    }
}
```
