### SWC

[SWC](https://swc.rs/) (Speedy Web Compiler) is an extensible Rust-based platform that can be used for both compilation and bundling. Using SWC with the Nest CLI is a straightforward way to significantly speed up your development process.

> info **Hint** SWC is approximately **20 times faster** than the default TypeScript compiler.

#### Installation

To get started, first install a few packages:

```bash
$ npm i --save-dev @swc/cli @swc/core
```

#### Getting started

Once the installation is complete, you can use the `swc` builder with the Nest CLI, as follows:

```bash
$ nest start -b swc
# OR nest start --builder swc
```

> info **Hint** If your repository is a monorepo, see the [Monorepo](/recipes/swc#monorepo) section.

Instead of passing the `-b` flag, you can set the `compilerOptions.builder` property to `"swc"` in your `nest-cli.json` file:

```json
{
  "compilerOptions": {
    "builder": "swc"
  }
}
```

To customize the builder's behavior, pass an object containing two attributes, `type` (`"swc"`) and `options`, as follows:

```json
{
  "compilerOptions": {
    "builder": {
      "type": "swc",
      "options": {
        "swcrcPath": "infrastructure/.swcrc",
      }
    }
  }
}
```

For example, to make SWC compile `.jsx` and `.tsx` files, use the following configuration:

```json
{
  "compilerOptions": {
    "builder": {
      "type": "swc",
      "options": { "extensions": [".ts", ".tsx", ".js", ".jsx"] }
    },
  }
}

```

To run the application in watch mode, use the following command:

```bash
$ nest start -b swc -w
# OR nest start --builder swc --watch
```

#### Type checking

Unlike the default TypeScript compiler, SWC doesn't perform any type checking itself. To turn type checking on, use the `--type-check` flag:

```bash
$ nest start -b swc --type-check
```

This command instructs the Nest CLI to run `tsc` in `noEmit` mode alongside SWC, which performs type checking asynchronously. Instead of passing the `--type-check` flag, you can also set the `compilerOptions.typeCheck` property to `true` in your `nest-cli.json` file:

```json
{
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true
  }
}
```

#### CLI Plugins (SWC)

The `--type-check` flag automatically executes **NestJS CLI plugins** and produces a serialized metadata file, which the application can then load at runtime.

#### SWC configuration

The SWC builder is preconfigured to match the requirements of NestJS applications. However, you can customize the configuration by creating a `.swcrc` file in the root directory and adjusting the options as needed:

```json
{
  "$schema": "https://swc.rs/schema.json",
  "sourceMaps": true,
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "baseUrl": "./"
  },
  "minify": false
}
```

> info **Hint** The SWC builder emits the same module format as the TypeScript compiler would: ES modules when your `package.json` file sets `"type": "module"` (the default for new projects), and CommonJS otherwise. A `module` setting in `.swcrc` overrides this.

#### Monorepo

> info **Hint** As of NestJS v12, monorepos use the Rspack builder by default, which already compiles your code with SWC (through Rspack's built-in `swc-loader`). The following setup applies only if you use the deprecated webpack builder.

If your repository is a monorepo, then instead of using the `swc` builder, you have to configure `webpack` to use `swc-loader`.

First, install the required package:

```bash
$ npm i --save-dev swc-loader
```

Once the installation is complete, create a `webpack.config.js` file in the root directory of your application with the following content:

```js
const swcDefaultConfig = require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory().swcOptions;

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: swcDefaultConfig,
        },
      },
    ],
  },
};
```

#### Monorepo and CLI plugins

If you use CLI plugins, `swc-loader` doesn't load them automatically. Instead, you have to create a separate file that loads them manually. To do so, create a `generate-metadata.ts` file next to the `main.ts` file with the following content:

```ts
import { PluginMetadataGenerator } from '@nestjs/cli/lib/compiler/plugins/plugin-metadata-generator.js';
import { ReadonlyVisitor } from '@nestjs/swagger/plugin';

const generator = new PluginMetadataGenerator();
generator.generate({
  visitors: [new ReadonlyVisitor({ introspectComments: true, pathToSource: import.meta.dirname })],
  outputDir: import.meta.dirname,
  watch: true,
  tsconfigPath: 'apps/<name>/tsconfig.app.json',
});
```

> info **Hint** This example uses the `@nestjs/swagger` plugin, but you can use any plugin of your choice.

The `generate()` method accepts the following options:

|                    |                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `watch`            | Whether to watch the project for changes.                                                      |
| `tsconfigPath`     | Path to the `tsconfig.json` file. Relative to the current working directory (`process.cwd()`). |
| `outputDir`        | Path to the directory where the metadata file is saved.                                        |
| `visitors`         | An array of visitors used to generate metadata.                                                |
| `filename`         | The name of the metadata file. Defaults to `metadata.ts`.                                      |
| `printDiagnostics` | Whether to print diagnostics to the console. Defaults to `true`.                               |

Finally, run the `generate-metadata` script in a separate terminal window with the following command:

```bash
$ npx ts-node src/generate-metadata.ts
# OR npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
```

#### Common pitfalls

If you use TypeORM, MikroORM, or any other ORM in your application, you may run into circular import issues. SWC doesn't handle **circular imports** well, so use the following workaround:

```typescript
@Entity()
export class User {
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Relation<Profile>; // <--- see "Relation<>" type here instead of just "Profile"
}
```

> info **Hint** The `Relation` type is exported from the `typeorm` package.

This prevents the property's type from being saved in the property metadata of the transpiled code, which avoids circular dependency issues.

If your ORM does not provide a similar workaround, you can define the wrapper type yourself:

```typescript
/**
 * Wrapper type used to circumvent ESM modules circular dependency issue
 * caused by reflection metadata saving the type of the property.
 */
export type WrapperType<T> = T; // WrapperType === Relation
```

For all [circular dependency injections](/fundamentals/circular-dependency) in your project, you also need to use the custom wrapper type described above:

```typescript
@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => ProfileService))
    private readonly profileService: WrapperType<ProfileService>,
  ) {}
}
```

### Jest + SWC

To use SWC with Jest (the default test runner for CommonJS projects), install the following packages:

```bash
$ npm i --save-dev jest @swc/core @swc/jest
```

Once the installation is complete, update your `package.json` or `jest.config.js` file (depending on your configuration) with the following content:

```json
{
  "jest": {
    "transform": {
      "^.+\\.(t|j)s?$": ["@swc/jest"]
    }
  }
}
```

Additionally, add the `legacyDecorator` and `decoratorMetadata` `transform` properties to your `.swcrc` file:

```json
{
  "$schema": "https://swc.rs/schema.json",
  "sourceMaps": true,
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "legacyDecorator": true,
      "decoratorMetadata": true
    },
    "baseUrl": "./"
  },
  "minify": false
}
```

If you use NestJS CLI plugins in your project, you have to run `PluginMetadataGenerator` manually. See the [Monorepo and CLI plugins](/recipes/swc#monorepo-and-cli-plugins) section to learn more.

### Vitest

[Vitest](https://vitest.dev/) is a fast, lightweight test runner designed to work with Vite. New NestJS projects that use ES modules (the default) are already set up with Vitest. This section shows how to configure Vitest to build your test files with SWC.

#### Installation

To get started, first install the required packages:

```bash
$ npm i --save-dev vitest unplugin-swc @swc/core @vitest/coverage-v8
```

#### Configuration

Create a `vitest.config.ts` file in the root directory of your application with the following content:

```ts
import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
  },
  plugins: [
    // This is required to build the test files with SWC
    swc.vite({
      // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
      module: { type: 'es6' },
    }),
  ],
  resolve: {
    alias: {
      // Ensure Vitest correctly resolves TypeScript path aliases
      'src': resolve(import.meta.dirname, './src'),
    },
  },
});
```

This configuration file sets up the Vitest environment, root directory, and SWC plugin. You should also create a separate configuration file for e2e tests (e.g., `vitest.config.e2e.ts`), with an additional `include` field that specifies the glob pattern for the test files:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
  },
  plugins: [swc.vite()],
});
```

Additionally, you can set the `alias` options to support TypeScript paths in your tests:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    alias: {
      '@src': './src',
      '@test': './test',
    },
    root: './',
  },
  resolve: {
    alias: {
      '@src': './src',
      '@test': './test',
    },
  },
  plugins: [swc.vite()],
});
```

### Path aliases

Vitest doesn't automatically resolve TypeScript path aliases such as `src/`, which can lead to dependency resolution errors during testing. To fix this, add the following `resolve.alias` configuration to your `vitest.config.ts` file:

```ts
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      'src': resolve(import.meta.dirname, './src'),
    },
  },
});
```

This ensures that Vitest correctly resolves module imports, preventing errors related to missing dependencies.

#### Update imports in E2E tests

Change any E2E test imports that use `import * as request from 'supertest'` to `import request from 'supertest'`. `supertest` is a CommonJS module that exports a function, and in an ES module setup like Vitest's, a namespace import isn't callable, so you need the default import.

Lastly, update the test scripts in your `package.json` file:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:debug": "vitest --inspect-brk --no-file-parallelism",
    "test:e2e": "vitest run --config ./vitest.config.e2e.ts"
  }
}
```

These scripts run the tests, watch for changes, generate code coverage reports, and start a debugging session. The `test:e2e` script runs the E2E tests with the dedicated configuration file.

> info **Hint** A working example is available in the [nest-vitest repository](https://github.com/TrilonIO/nest-vitest).
