### Workspaces

Nest has two modes for organizing code:

- **standard mode**: suited to individual, project-focused applications that have their own dependencies and settings and don't need to optimize for sharing modules or for complex builds. This is the default mode.
- **monorepo mode**: treats code artifacts as part of a lightweight **monorepo**, and may be more appropriate for teams of developers and/or multi-project environments. It automates parts of the build process to make it easy to create and compose modular components. It promotes code reuse, makes integration testing easier, makes it easy to share project-wide artifacts such as lint rules and other configuration policies, and is easier to use than alternatives such as Git submodules. Monorepo mode uses the concept of a **workspace**, represented in the `nest-cli.json` file, to coordinate the relationships between the components of the monorepo.

Virtually all of Nest's features are independent of your code organization mode. The **only** effect of this choice is how your projects are composed and how build artifacts are generated. All other functionality, from the CLI to core modules to add-on modules, works the same in either mode.

You can also switch from **standard mode** to **monorepo mode** at any time, so you can delay this decision until the benefits of one approach or the other become clearer.

#### Standard mode

When you run `nest new`, Nest creates a new **project** using a built-in schematic. Nest does the following:

1. Creates a new folder named after the `name` argument you pass to `nest new`.
2. Populates that folder with the default files of a minimal Nest application. You can examine these files in the [typescript-starter](https://github.com/nestjs/typescript-starter) repository.
3. Adds files such as `nest-cli.json`, `package.json`, and `tsconfig.json` that configure the tools for compiling, testing, and serving your application.

From there, you can modify the starter files, add new components and dependencies (e.g., `npm install`), and develop your application as described in the rest of this documentation.

#### Monorepo mode

To enable monorepo mode, start with a _standard mode_ structure and add **projects**. A project can be a full **application** (which you add to the workspace with `nest generate app`) or a **library** (which you add with `nest generate library`). We discuss these project types below. The key point for now is that the **act of adding a project** to an existing standard mode structure **converts it** to monorepo mode. Let's look at an example.

If we run:

```bash
$ nest new my-project
```

we get a _standard mode_ structure with the following folders and files:

<div class="file-tree">
  <div class="item">node_modules</div>
  <div class="item">src</div>
  <div class="children">
    <div class="item">app.controller.ts</div>
    <div class="item">app.module.ts</div>
    <div class="item">app.service.ts</div>
    <div class="item">main.ts</div>
  </div>
  <div class="item">nest-cli.json</div>
  <div class="item">package.json</div>
  <div class="item">tsconfig.json</div>
  <div class="item">lint config</div>
</div>

We can convert this to a monorepo mode structure as follows:

```bash
$ cd my-project
$ nest generate app my-app
```

At this point, `nest` converts the existing structure to a **monorepo mode** structure, which results in a few important changes. The folder structure now looks like this:

<div class="file-tree">
  <div class="item">apps</div>
    <div class="children">
      <div class="item">my-app</div>
      <div class="children">
        <div class="item">src</div>
        <div class="children">
          <div class="item">my-app.controller.ts</div>
          <div class="item">my-app.module.ts</div>
          <div class="item">my-app.service.ts</div>
          <div class="item">main.ts</div>
        </div>
        <div class="item">tsconfig.app.json</div>
      </div>
      <div class="item">my-project</div>
      <div class="children">
        <div class="item">src</div>
        <div class="children">
          <div class="item">app.controller.ts</div>
          <div class="item">app.module.ts</div>
          <div class="item">app.service.ts</div>
          <div class="item">main.ts</div>
        </div>
        <div class="item">tsconfig.app.json</div>
      </div>
    </div>
  <div class="item">nest-cli.json</div>
  <div class="item">package.json</div>
  <div class="item">tsconfig.json</div>
  <div class="item">lint config</div>
</div>

The `generate app` schematic has reorganized the code: it moved each **application** project under the `apps` folder and added a project-specific `tsconfig.app.json` file to each project's root folder. Our original `my-project` app has become the **default project** for the monorepo, and is now a peer of the newly added `my-app`, under the `apps` folder. We cover default projects below.

> error **Warning** Converting a standard mode structure to a monorepo only works for projects that follow the canonical Nest project structure. During conversion, the schematic moves the project's `src` and `test` folders into a project folder beneath the root `apps` folder. If a project doesn't use this structure, the conversion fails or produces unreliable results.

#### Workspace projects

A monorepo uses the concept of a workspace to manage its members. Workspaces are composed of **projects**. A project is either:

- an **application**: a full Nest application, including a `main.ts` file that bootstraps it. Aside from compile and build considerations, an application-type project within a workspace is functionally identical to an application in a _standard mode_ structure.
- a **library**: a package of general-purpose features (modules, providers, controllers, etc.) that other projects can use. A library cannot run on its own and has no `main.ts` file. See [Libraries](/cli/libraries) for details.

Every workspace has a **default project**, which should be an application-type project. It is defined by the top-level `"root"` property in the `nest-cli.json` file, which points at the root of the default project (see [CLI properties](/cli/monorepo#cli-properties) below). Usually, this is the **standard mode** application you started with and later converted to a monorepo using `nest generate app`. In that case, the property is populated automatically.

`nest` commands such as `nest build` and `nest start` use the default project when you don't supply a project name.

For example, in the monorepo structure above, running

```bash
$ nest start
```

starts the `my-project` app. To start `my-app`, run:

```bash
$ nest start my-app
```

#### Applications

Application-type projects, informally called "applications", are complete Nest applications that you can run and deploy. You generate one with `nest generate app`.

This command generates a project skeleton, including the standard `src` and `test` folders from the [typescript starter](https://github.com/nestjs/typescript-starter). Unlike in standard mode, an application project in a monorepo has no package dependency file (`package.json`) and no other project configuration artifacts, such as `.prettierrc` or the lint configuration file. Instead, it uses the monorepo-wide dependencies and configuration files.

The schematic does, however, generate a project-specific `tsconfig.app.json` file in the project's root folder. This file sets the appropriate build options, including the compilation output folder. It extends the top-level (monorepo) `tsconfig.json` file, so you can manage global settings monorepo-wide and override them at the project level when needed.

#### Libraries

Library-type projects, or simply "libraries", are packages of Nest components that must be composed into applications to run. You generate one with `nest generate library`. Deciding what belongs in a library is an architectural design decision. We discuss libraries in depth in the [Libraries](/cli/libraries) chapter.

#### CLI properties

Nest keeps the metadata needed to organize, build, and deploy both standard and monorepo projects in the `nest-cli.json` file. Nest updates this file automatically as you add projects, so you usually don't have to edit it. However, you may want to change some settings manually, so it helps to understand the file's structure.

After the steps above, the `nest-cli.json` file looks like this:

```javascript
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/my-project/src",
  "compilerOptions": {
    "deleteOutDir": true,
    "builder": "rspack",
    "tsConfigPath": "apps/my-project/tsconfig.app.json"
  },
  "monorepo": true,
  "root": "apps/my-project",
  "projects": {
    "my-app": {
      "type": "application",
      "root": "apps/my-app",
      "entryFile": "main",
      "sourceRoot": "apps/my-app/src",
      "compilerOptions": {
        "tsConfigPath": "apps/my-app/tsconfig.app.json"
      }
    },
    "my-project": {
      "type": "application",
      "root": "apps/my-project",
      "entryFile": "main",
      "sourceRoot": "apps/my-project/src",
      "compilerOptions": {
        "tsConfigPath": "apps/my-project/tsconfig.app.json"
      }
    }
  }
}
```

The file is divided into sections:

- a global section with top-level properties that control standard and monorepo-wide settings
- a top-level property (`"projects"`) with metadata about each project. This section is present only in monorepo mode structures.

The top-level properties are as follows:

- `"collection"`: points at the collection of schematics used to generate components; you generally shouldn't change this value
- `"sourceRoot"`: points at the root of the source code for the single project in standard mode structures, or the _default project_ in monorepo mode structures
- `"compilerOptions"`: a map with keys specifying compiler options and values specifying the option setting; see details below
- `"generateOptions"`: a map with keys specifying global generate options and values specifying the option setting; see details below
- `"monorepo"`: (monorepo only) always `true` for a monorepo mode structure
- `"root"`: (monorepo only) points at the project root of the _default project_

#### Global compiler options

These properties specify the compiler to use, as well as options that affect **any** compilation step, whether it runs as part of `nest build` or `nest start`, and whichever compiler you use (`tsc`, `swc`, or Rspack).

| Property Name       | Property Value Type | Description                                                                                                                                                                                                                                                               |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webpack`           | boolean             | Deprecated legacy flag for webpack-based compilation. Use `builder` instead. |
| `tsConfigPath`      | string              | (**monorepo only**) Points at the file containing the `tsconfig.json` settings that will be used when `nest build` or `nest start` is called without a `project` option (e.g., when the default project is built or started).                                             |
| `webpackConfigPath` | string              | Deprecated legacy path for webpack options. Use `builder.options.configPath` instead.                                                                                                                                                                                     |
| `deleteOutDir`      | boolean             | If `true`, the compiler first removes the compilation output directory (as configured in `tsconfig.json`; the default is `./dist`) every time it is invoked.                                                                                                              |
| `assets`            | array               | Enables automatic distribution of non-TypeScript assets whenever a compilation step begins (assets are **not** distributed on incremental compiles in `--watch` mode). See below for details.                                                                              |
| `watchAssets`       | boolean             | If `true`, runs in watch mode, watching **all** non-TypeScript assets. (For finer-grained control over which assets to watch, see the [Assets](/cli/monorepo#assets) section below.)                                                                                    |
| `manualRestart`     | boolean             | If `true`, enables the `rs` shortcut to restart the server manually. Defaults to `false`.                                                                                                                                                                                 |
| `builder`           | string/object       | The builder the CLI uses to compile the project (`tsc`, `swc`, or `rspack`). To customize the builder's behavior, pass an object with two attributes: `type` (`tsc`, `swc`, or `rspack`) and `options`.                                                                  |
| `typeCheck`         | boolean             | If `true`, enables type checking for SWC-driven projects (when `builder` is `swc`). Defaults to `false`.                                                                                                                                                                  |
| `emitDeclarations`  | boolean             | If `true`, emits declaration files (`.d.ts`) when using the SWC builder. Defaults to `false`.                                                                                                                                                                             |
| `includeLibraryAssets` | array            | (**monorepo only**) List of library project names whose assets should also be copied when building this application.                                                                                                                                                      |

#### Global generate options

These properties specify the default options for the `nest generate` command.

| Property Name | Property Value Type | Description                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spec`        | boolean _or_ object | If the value is a boolean, `true` enables `spec` generation by default and `false` disables it. A flag passed on the command line overrides this setting, as does a project-specific `generateOptions` setting (see below). If the value is an object, each key is a schematic name, and its boolean value enables or disables default spec generation for that schematic.                                                                   |
| `flat`        | boolean             | If `true`, all generate commands generate a flat structure.                                                                                                                                                                                                                                                                                                                                                                                   |

The following example uses a boolean value to disable spec file generation by default for all projects:

```javascript
{
  "generateOptions": {
    "spec": false
  },
  ...
}
```

The following example uses a boolean value to make flat file generation the default for all projects:

```javascript
{
  "generateOptions": {
    "flat": true
  },
  ...
}
```

In the following example, `spec` file generation is disabled only for `service` schematics (e.g., `nest generate service...`):

```javascript
{
  "generateOptions": {
    "spec": {
      "service": false
    }
  },
  ...
}
```

> warning **Warning** When you specify `spec` as an object, the schematic keys don't support aliases. For example, if you set `service: false` and then generate a service through its alias `s`, the spec file is still generated. To cover both the schematic name and its alias, specify both, as shown below.
>
> ```javascript
> {
>   "generateOptions": {
>     "spec": {
>       "service": false,
>       "s": false
>     }
>   },
>   ...
> }
> ```

#### Project-specific generate options

In addition to global generate options, you can specify project-specific generate options. They use the same format as the global options, but you set them directly on each project.

Project-specific generate options override global generate options.

```javascript
{
  "projects": {
    "cats-project": {
      "generateOptions": {
        "spec": {
          "service": false
        }
      },
      ...
    }
  },
  ...
}
```

> warning **Warning** Generate options are applied in the following order of precedence: options passed on the command line take precedence over project-specific options, which in turn override global options.

#### Specified compiler

Standard mode and monorepo mode use different default compilers because, for larger projects (more typical in a monorepo), Rspack can significantly reduce build times and produces a single file that bundles all project components together. To generate individual files instead, set the builder to `tsc` or `swc`.

#### Assets

TypeScript compilation automatically distributes compiler output (`.js` and `.d.ts` files) to the specified output directory. It can also be convenient to distribute non-TypeScript files, such as `.graphql` files, images, `.html` files, and other assets. This lets you treat `nest build` (and any initial compilation step) as a lightweight **development build** step, in which you edit non-TypeScript files and compile and test iteratively.
Assets must be located in the `src` folder; otherwise, they are not copied.

The value of the `assets` key is an array of elements that specify the files to distribute. The elements can be simple strings with `glob`-like file specs, for example:

```typescript
"assets": ["**/*.graphql"],
"watchAssets": true,
```

For finer control, the elements can be objects with the following keys:

- `"include"`: `glob`-like file specifications for the assets to be distributed
- `"exclude"`: `glob`-like file specifications for assets to **exclude** from the `include` list
- `"outDir"`: the path (relative to the root folder) to distribute the assets to. Defaults to the output directory configured for compiler output.
- `"watchAssets"`: boolean; if `true`, runs in watch mode, watching the specified assets

For example:

```typescript
"assets": [
  { "include": "**/*.graphql", "exclude": "**/omitted.graphql", "watchAssets": true },
]
```

> warning **Warning** Setting `watchAssets` in a top-level `compilerOptions` property overrides any `watchAssets` settings within the `assets` property.

#### Project properties

This element exists only in monorepo mode structures. You generally shouldn't edit these properties, because Nest uses them to locate projects and their configuration options within the monorepo.
