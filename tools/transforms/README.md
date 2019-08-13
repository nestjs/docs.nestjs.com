# Transforms overview

All the content that is rendered by the docs.nestjs.com application, and some of its
configuration files, are generated from source files by [Dgeni](https://github.com/angular/dgeni).
Dgeni is a general purpose documentation generation tool.

Markdown files in `content` are processed and transformed
into files that are consumed by the `docs.nestjs.com` web frontend.

## Packages

The documentation tool of NestJS is split into multiple Dgeni packages.

**nestjs-package**

The main package. Orchestrates all the following packages and sets
final configuration. It is responsible for cleaning up the file system.

**nestjs-base-package**

The base package for common configurations, services and processors for
each package. It handles the general input / output / template path resolution.

**nestjs-content-package**

Orchestrates all hand-written contents for the NestJS documentation.
It makes use of the `content`-folders markdown. On top of that
it takes care of the `content/**/*.json` files such as `content/discover/who-uses.json`.

**content-package**

A package to handle the markdown content files. It creates a new DocType `content`
which include a `content` and `title` of each markdown file.
The **nestjs-content-package** manages this content further.

## Templates

All the templates for the docs.nestjs.com dgeni transformations are stored in the `tools/transforms/templates`
folder. See the [README](./templates/README.md).
