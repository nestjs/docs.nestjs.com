### Libraries

Many applications need to solve the same general problems, or reuse a modular component in several contexts. Nest offers a few ways to address this. Each works at a different level and helps meet different architectural and organizational objectives.

Nest [modules](/modules) provide an execution context that lets components be shared within a single application. You can also package modules with [npm](https://npmjs.com) to create a reusable library that different projects can install. This is an effective way to distribute configurable, reusable libraries to loosely connected or unaffiliated organizations (e.g., by distributing and installing third-party libraries).

For sharing code within closely organized groups (e.g., within company or project boundaries), a more lightweight approach can be useful. Monorepos emerged to enable that, and within a monorepo, a **library** provides a lightweight way to share code. In a Nest monorepo, libraries make it straightforward to assemble applications that share components. This also encourages you to decompose monolithic applications, and to focus development on building and composing modular components.

#### Nest libraries

A Nest library is a Nest project that, unlike an application, cannot run on its own. A library must be imported into a containing application for its code to execute. The built-in support for libraries described in this section is only available for **monorepos** (standard mode projects can achieve similar functionality using npm packages).

For example, an organization may develop an `AuthModule` that manages authentication by implementing the company policies that govern all internal applications. Rather than building that module separately for each application, or packaging the code with npm and requiring each project to install it, a monorepo can define the module as a library. Organized this way, all consumers of the library module see an up-to-date version of `AuthModule` as soon as it is committed. This can significantly help coordinate component development and assembly, and it simplifies end-to-end testing.

#### Creating libraries

Any functionality that is suitable for reuse is a candidate for a library. Deciding what should be a library, and what should be part of an application, is an architectural design decision. Creating a library involves more than copying code from an existing application into it: library code must be decoupled from the application. This may take **more** time up front and force design decisions that you wouldn't face with more tightly coupled code. The effort pays off when the library lets you assemble multiple applications more quickly.

To create a library, run the following command:

```bash
$ nest g library my-library
```

When you run the command, the `library` schematic prompts you for a prefix (also known as an alias) for the library:

```bash
What prefix would you like to use for the library (default: @app or 'defaultLibraryPrefix' setting value)?
```

The default prefix is `@app`, unless your `nest-cli.json` file sets a `defaultLibraryPrefix` property.

The command creates a new project called `my-library` in your workspace. Like an application-type project, a library-type project is generated into a named folder by a schematic. Libraries live in the `libs` folder of the monorepo root. Nest creates the `libs` folder when you create the first library.

The files generated for a library differ slightly from those generated for an application. Here are the contents of the `libs` folder after running the command above:

<div class="file-tree">
  <div class="item">libs</div>
  <div class="children">
    <div class="item">my-library</div>
    <div class="children">
      <div class="item">src</div>
      <div class="children">
        <div class="item">index.ts</div>
        <div class="item">my-library.module.ts</div>
        <div class="item">my-library.service.ts</div>
      </div>
      <div class="item">tsconfig.lib.json</div>
    </div>
  </div>
</div>

The `nest-cli.json` file now has a new entry for the library under the `"projects"` key:

```javascript
...
{
    "my-library": {
      "type": "library",
      "root": "libs/my-library",
      "entryFile": "index",
      "sourceRoot": "libs/my-library/src",
      "compilerOptions": {
        "tsConfigPath": "libs/my-library/tsconfig.lib.json"
      }
}
...
```

There are two differences in `nest-cli.json` metadata between libraries and applications:

- the `"type"` property is set to `"library"` instead of `"application"`
- the `"entryFile"` property is set to `"index"` instead of `"main"`

These differences tell the build process to handle libraries appropriately. For example, a library exports its functionality through the `index.js` file.

Like application-type projects, each library has its own `tsconfig.lib.json` file that extends the root (monorepo-wide) `tsconfig.json` file. You can modify this file to provide library-specific compiler options.

To build the library, run:

```bash
$ nest build my-library
```

#### Using libraries

With the generated configuration files in place, using libraries is straightforward. Suppose you want to use `MyLibraryService` from the `my-library` library in the `my-project` application.

Using library modules is the same as using any other Nest module. The monorepo manages paths so that importing libraries and generating builds is transparent. To use `MyLibraryService`, import its declaring module. Modify `my-project/src/app.module.ts` as follows to import `MyLibraryModule`:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MyLibraryModule } from '@app/my-library';

@Module({
  imports: [MyLibraryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

The `import` statement above uses the `@app` path alias, which is the `prefix` we supplied to the `nest g library` command. Nest implements this through tsconfig path mapping. When you add a library, Nest updates the `"paths"` key of the global (monorepo) `tsconfig.json` file like this:

```javascript
"paths": {
    "@app/my-library": [
        "./libs/my-library/src"
    ],
    "@app/my-library/*": [
        "./libs/my-library/src/*"
    ]
}
```

In an ESM project, the first entry points at the library's entry file instead (`./libs/my-library/src/index.ts`).

> warning **Warning** The `paths` mapping is understood only by the TypeScript compiler. Test runners resolve modules on their own. If you run an application's end-to-end tests with Jest, mirror each alias in that application's e2e Jest config `moduleNameMapper` option, for example: `"moduleNameMapper": {{ '{' }} "^@app/my-library(|/.*)$": "<rootDir>/../../libs/my-library/src/$1" {{ '}' }}`. Otherwise, imports through the alias fail at test runtime even though the project compiles.

Together, the monorepo and library features make it straightforward to include library modules in applications.

The same mechanism lets you build and deploy applications that compose libraries. Once you've imported `MyLibraryModule`, `nest build` handles module resolution automatically and bundles the application, along with any library dependencies, for deployment. The default compiler for a monorepo is **Rspack**, so the output is a single file that bundles all the transpiled JavaScript. You can switch to `tsc` as described in [Global compiler options](/cli/monorepo#global-compiler-options).
