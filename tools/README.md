# docs.nestjs.com project tooling

This document gives an overview of the tools we use to generate the content for the
docs.nestjs.com website.

# Transforms

All the content that is rendered by the docs.nestjs.com application, and some of its
configuration files, are generated from source files by [Dgeni](https://github.com/angular/dgeni).
Dgeni is a general purpose documentation generation tool.

Markdown files in `content` are processed and transformed
into files that are consumed by the `docs.nestjs.com` web frontend.

# dgeni-cli

The dgeni CLI `tools/dgeni-cli.ts` is wrapper to start a Dgeni package from the command line.
We do not take use of the CLI interface provided by the Dgeni package itself, mainly because
it does not support TypeScript compilation on the fly.

# API reference

`tools/api` generates the API reference served under `/api`. `packages.ts` lists every
package repository and entry point to document, `fetch-sources.ts` shallow-clones them into
`sources/`, and `compiler/` is the Dgeni package that turns their TypeScript sources and
JSDoc comments into pages. See `tools/api/compiler/README.md`.
