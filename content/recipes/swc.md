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
