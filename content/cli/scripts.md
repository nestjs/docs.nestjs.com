### Nest CLI and scripts

This section explains how the `nest` command interacts with compilers and scripts, to help DevOps personnel manage the development environment.

A Nest application is a **standard** TypeScript application that must be compiled to JavaScript before it can run. There are various ways to handle the compilation step, and developers and teams are free to choose the one that works best for them. With that in mind, Nest provides a set of tools out of the box that aim to:

- Provide a standard build/execute process, available at the command line, that works with reasonable defaults.
- Keep the build/execute process **open**, so developers can access the underlying tools directly and customize them using their native features and options.
- Remain a completely standard TypeScript/Node.js framework, so that any external tools the team chooses can manage the entire compile/deploy/execute pipeline.

Nest achieves this through a combination of the `nest` command, a locally installed TypeScript compiler, and `package.json` scripts. The sections below describe how these pieces work together, what happens at each step of the build/execute process, and how to customize that behavior.

#### The nest binary

The `nest` command is an OS-level binary (i.e., it runs from the OS command line). It covers three distinct areas, described below. We recommend running the build (`nest build`) and execution (`nest start`) subcommands through the `package.json` scripts that are generated when you scaffold a project (see the [typescript starter](https://github.com/nestjs/typescript-starter) if you prefer to start by cloning a repository instead of running `nest new`).

#### Build

`nest build` is a wrapper around the standard `tsc` or `swc` compiler (for [standard projects](/cli/overview#project-structure)) or the Rspack bundler (for [monorepos](/cli/overview#project-structure)). Apart from handling `tsconfig-paths` and running any enabled CLI plugins, it adds no compilation features or steps of its own. It exists because most developers, especially when starting out with Nest, don't need to adjust compiler options (e.g., in the `tsconfig.json` file), which can be tricky.

See the [nest build](/cli/usages#nest-build) documentation for more details.

#### Execution

`nest start` ensures the project has been built (same as `nest build`), then invokes the `node` command in a portable way to execute the compiled application. As with builds, you can customize this process through the `nest start` command and its options, or replace it entirely. The whole process is a standard TypeScript build and execute pipeline, and you can manage it as such.

See the [nest start](/cli/usages#nest-start) documentation for more details.

#### Generation

The `nest generate` commands generate new components, or new applications and libraries within a workspace. (To create a new project, use `nest new`.)

#### Package scripts

Running `nest` commands at the OS command level requires the `nest` binary to be installed globally. This is a standard npm feature, outside Nest's direct control. One consequence is that the globally installed `nest` binary is **not** managed as a project dependency in `package.json`, so two developers can run two different versions of it. The standard solution is to use package scripts, so that you can treat the tools used in the build and execute steps as development dependencies.

When you run `nest new`, or clone the [typescript starter](https://github.com/nestjs/typescript-starter), Nest populates the new project's `package.json` scripts with commands such as `build` and `start`. It also installs the underlying compiler tools (such as `typescript`) as **dev dependencies**.

You run the build and execute scripts with commands such as:

```bash
$ npm run build
```

and

```bash
$ npm run start
```

These commands use npm's script runner to execute `nest build` or `nest start` with the **locally installed** `nest` binary. By using these built-in package scripts, you get full dependency management over the Nest CLI commands\*. By following this **recommended** usage, all members of your organization run the same version of the commands.

\*This applies to the `build` and `start` commands. The `nest new` and `nest generate` commands aren't part of the build/execute pipeline, so they operate in a different context and don't come with built-in `package.json` scripts.

We recommend that most developers and teams use the package scripts to build and run their Nest projects. You can customize the behavior of these scripts through their options, and customize the `tsc`, `swc`, or Rspack configuration files (e.g., `tsconfig.json`) as needed. You are also free to run a completely custom build process to compile the TypeScript (or even to execute TypeScript directly with `ts-node`).

#### Backward compatibility

Because Nest applications are pure TypeScript applications, previous versions of the Nest build/execute scripts continue to work. You are not required to upgrade them. You can adopt the `nest build` and `nest start` commands when you're ready, or keep running your previous or customized scripts.

#### Migration

You are not required to make any changes, but you may want to switch to the CLI commands instead of tools such as `tsc-watch` or `ts-node`. To do so, install the latest version of `@nestjs/cli` both globally and locally:

```bash
$ npm install -g @nestjs/cli
$ cd /some/project/root/folder
$ npm install -D @nestjs/cli
```

Then replace the `scripts` defined in `package.json` with the following:

```typescript
"build": "nest build",
"start": "nest start",
"start:dev": "nest start --watch",
"start:debug": "nest start --debug --watch",
```
