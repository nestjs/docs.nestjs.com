# API Documentation Compiler

The API compiler is a script which generates a HTML documentation directly from the nestjs sources code.
The script takes advantage of [Dgeni](https://github.com/angular/dgeni), a documentation framework used by 
AngularJS, Angular 2-x and Angular Material.

## <a name='GettingStarted'></a>Getting Started

First you need to clone the `docs.nestjs.com` repository with all its submodules.

```bash

git clone --recurse-submodules -j8 git@github.com:BrunnerLivio/docs.nestjs.com.git -b feature/api-docs
cd docs.nestjs.com
npm i

```

Then you can simply run this command to start the API

```bash

npm run api

```

You can find the compiled assets in the `src/generated` folder.

### <a name='DebugwithVSCode'></a>Debug with VSCode

Debugging the API script can be hard without and development tool, because the `DocCollection`
is not type-secure. Therefore this `.vscode/launch.json` configuration can help massively while
developing

```json
{
	"version": "0.2.0",
	"configurations": [
		{
			"name": "Start API compiler",
			"type": "node",
			"request": "launch",
			"args": ["${workspaceRoot}/compiler/api/index.ts"],
			"runtimeArgs": ["-r", "ts-node/register"],
			"cwd": "${workspaceRoot}",
			"protocol": "inspector",
			"internalConsoleOptions": "openOnSessionStart",
			"env": {
				"TS_NODE_PROJECT": "${workspaceRoot}/compiler/tsconfig.json"
			}
		}
	]
}
```

## <a name='TagDefinitions'></a>Tag Definitions

This API documentation tool reads its humand-readable information from JSDoc tags.
An useful resource to get started with JSDoc is the devhints.io [JSDoc cheatsheet](https://devhints.io/jsdoc).

> **HINT**
> Some tags which are part of the JSDoc specs are not supported with this generation tool.
> The tool will throw an error in case you use an unsupported tag.
> On the other hand this documentation tool introduces new tags which are not part
> of the JSDoc specs, e.g. `@publicApi`

### Table of contents

* [@publicApi](#publicApi)
* [@description](#description)
* [@param](#param)
* [@see](#see)
* [@usageNotes](#usageNotes)
* [@module](#module)
* [@throws](#throws)
* [@example](#example)
* [@returns](#returns)

### <a name='publicApi'></a>@publicApi

Exposes a document to the public api. In case this tag is not set, the `docs.nestjs.com` user interface
will **NOT** display it.


```ts
@publicApi
```

```ts
/**
 * @publicApi
 */
class MyClass { }
```

### <a name='description'></a>@description

The `@description` is an optional tag for describing a document.
If tag is given, it will automatically assume it is a description.

```ts
@description [description]
```

#### <a name='Parameters'></a>Parameters

- `description`: The description of the document, written in `Markdown`.

#### <a name='UsageNotes'></a>Usage Notes

Important to note is that, a `description` is always split in **two parts**:
`description` and `shortDescription`. They are separated by the first line break.
The `shortDescription` should be a quick summary about the document. The `description` is
a longer, more in-depth description.

```ts
/**
 * This is the short description it can be written in
 * multiple lines.
 * 
 * This is the way longer in-depth description. 
 */
export const myVariable: string;
```

### <a name='param'></a>@param

The `@param` is used to describe a `parameter` of a `function`.

```ts
@param [parameterName] [description]
```

#### <a name='Parameters-1'></a>Parameters

- `parameterName`: The exact name of the parameter.
- `description`: The description of the the parameter, written in `Markdown`.  


```ts
/**
 * @param style Sets AnimationStyles for the parent animation.
 */
function animate(style: string)
```

### <a name='see'></a>@see

`@see` generates a chapter which lists additional links.

```ts
@see [description]
```

#### <a name='Parameters-1'></a>Parameters

- `description`: The description of the parameter, written in `Markdown`.  

```ts
/**
 * @see [Forms Guide](/guide/forms)
 * @see [Reactive Forms Guide](/guide/reactive-forms)
 * @see [Dynamic Forms Guide](/guide/dynamic-form)
 */
```

### <a name='usageNotes'></a>@usageNotes

`@usageNotes` generates a chapter which gives more information how to use
the documentation.


```ts
@usageNotes [description]
```

#### <a name='Parameters-1'></a>Parameters

- `description`: The usage notes, written in `Markdown`.  

```ts
/**
 * @usageNotes 
 * #### Awesome title
 * A description
 */
```

### <a name='module'></a>@module

Associates an NestJS `@Injectable` with a `@Module`.

```ts
@module [moduleName]
```

#### <a name='Parameters-1'></a>Parameters

- `moduleName`: The exact name of the Nest module.

```ts
/**
 * @module CommonModule
 */
@Injectable()
export class HttpClient { }
```

### <a name='throws'></a>@throws

A possible errors which can be thrown by the `function`.

```ts
@throws {Type} [description]
```

#### <a name='Parameters-1'></a>Parameters

- `type`: The type of the `Error` written inside curly braces
- `description`: When the error is thrown

```ts
/**
 * @throws {TimeoutError} Gets thrown in case a health check exceeded the given timeout
 */
```

### <a name='example'></a>@example

Adds a chapter with code examples on how to use the `function`.

```ts
@example [code]
```

#### <a name='Description'></a>Description

- `code` The code written in TypeScript

```ts
/**
 * @example
 * grpc.checkService('hero_service', 'hero.health.v1')
 * @example
 * grpc.checkService('hero_service', 'hero.health.v1', { option: true })
 */
```

### <a name='returns'></a>@returns

Describes what will be returned in a `function`

```ts
@returns [description]
```

#### <a name='Parameters-1'></a>Parameters

- `description`: The description of what gets returned written in `Markdown`. 

```ts
/**
 * @returns A promise to the info about the build
 */
function getBuild: Promise<BuildInfo> { }
```