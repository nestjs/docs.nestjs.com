### SWC

> warning **Warning** SWC isn't compatible with **NestJS CLI plugins**. If you're using a plugin, you should stick to `tsc` or `webpack` (`nest build` and `nest start`).

[SWC](https://swc.rs/) (Speedy Web Compiler) is an extensible Rust-based platform that can be used for both compilation and bundling.

> info **Hint** SWC is 20x faster than Babel on a single thread and 70x faster on four cores.

#### Installation

To get started, first install a few packages:

```bash
$ npm i --save-dev @swc/cli @swc/core nodemon
```

Once the installation process is complete, let's create a new `.swcrc` file in the root directory of your application:

```json
{
  "$schema": "https://json.schemastore.org/swcrc",
  "sourceMaps": true,
  "module": {
    "type": "commonjs"
  },
  "jsc": {
    "target": "es2017",
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "legacyDecorator": true,
      "decoratorMetadata": true
    },
    "keepClassNames": true,
    "baseUrl": "./"
  },
  "minify": false
}
```

#### Scripts

To make the development process easier, let's add a few scripts to the `package.json` file:

```json
{
  "scripts": {
    "build:swc": "npx swc --out-dir dist -w src",
    "start:swc": "nodemon dist/main"
  }
}
```

> info **Hint** Both scripts are dedicated for development purposes only.

Now, open up the terminal and run the follwoing command:

```bash
$ npm run build:swc
```

In another terminal window, run the following command:

```bash
$ npm run start:swc
```

Every time you make a change to your application, the `build:swc` script will recompile your application and the `start:swc` script will restart the application.

#### Common pitfalls

If you use TypeORM/MikroORM or any other ORM in your application, you may stumble upon circular import issues. SWC doesn't handle **circular imports** well, so you should use the following workaround:

```typescript
@Entity()
export class User {
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Relation<Profile>; // <--- see "Relation<>" type here instead of just "Profile"
}
```

> info **Hint** `Relation` type is exported from the `typeorm` package.

Doing this prevents the type of the property from being saved in the transpiled code in the property metadata, preventing circular dependency issues.

If your ORM does not provide a similar workaround, you can define the wrapper type yourself:

```typescript
/**
 * Wrapper type used to circumvent ESM modules circular dependency issue
 * caused by reflection metadata saving the type of the property.
 */
export type WrapperType<T> = T; // WrapperType === Relation
```
### Vitest

[Vitest](https://vitest.dev/) is a fast and lightweight test runner designed to work with Vite. It provides a modern, fast, and easy-to-use testing solution that can be integrated with NestJS projects.

#### Installation

To get started, first install the required packages:

```bash
$ npm i --save-dev vitest unplugin-swc @swc/core @vitest/coverage-c8
```

#### Configuration

Create a vitest.config.ts file in the root directory of your application with the following contents:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
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
  plugins: [swc.vite()], // This is required to build the test files with SWC
});
```

This configuration file sets up the Vitest environment with the necessary aliases, root directory, and SWC plugin. You should also create a separate configuration
file for e2e tests, with an additional field `include` that specifies the test path regex:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vite';

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

#### Update imports in E2E tests

Change any E2E test imports using `import * as request from 'supertest'` to `import request from 'supertest';`. This is necessary because Vitest, when bundled with Vite, expects a default import for supertest. Using a namespace import may cause issues in this specific setup.

Lastly, update the test scripts in your package.json file to the following:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:debug": "vitest --inspect-brk --inspect --logHeapUsage --threads=false",
    "test:e2e": "vitest run -c ./vitest.config.e2e.ts"
  }
}
```
These scripts configure Vitest for running tests, watching for changes, generating code coverage reports, and debugging. The test:e2e script is specifically for running E2E tests with a custom configuration file.

With this setup, you can now enjoy the benefits of using Vitest in your NestJS project, including faster test execution and a more modern testing experience.
> info **Hint** You can check out a working example in this [repository](https://github.com/TrilonIO/nest-vitest)
