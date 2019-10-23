### Hot Reload (Webpack)

The highest impact on your application's bootstrapping process has a **TypeScript compilation**. But the question is, do we have to recompile a whole project each time when change occurs? Not at all. That's why [webpack](https://github.com/webpack/webpack) HMR (Hot-Module Replacement) significantly decreases an amount of time necessary to instantiate your application.

> warning **Warning** Note that `webpack` won't automatically copy your assets (e.g. `graphql` files) to the `dist` folder. Similary, `webpack` is not compatible with glob static paths (e.g. `entities` property in `TypeOrmModule`).

### With CLI

If you are using the [Nest CLI](http://localhost:4200/cli/overview), the configuration process is pretty straightforward. The CLI wraps `webpack`, which allows use the `HotModuleReplacementPlugin`.

#### Installation

First install the required package:

```bash
$ npm i --save-dev webpack-node-externals
```

#### Configuration

Once the installation is complete, create a `webpack.config.js` file in the root directory of your application.

```typescript
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = function(options) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', './src/main.ts'],
    watch: true,
    externals: [
      nodeExternals({
        whitelist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins: [...options.plugins, new webpack.HotModuleReplacementPlugin()],
  };
}
```

This function takes the original object containing the default webpack configuration and returns a modified one with an applied `HotModuleReplacementPlugin` plugin.

#### Hot-Module Replacement

In order to enable **HMR**, open the application entry file (`main.ts`) and add several webpack-related instructions, as shown below:

```typescript
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```

To simplify the execution process, add two scripts to your `package.json` file.

```json
"build": "nest build --watch --webpack"
"start": "node dist/main",
```

Now simply open your command line and run the following command:

```bash
$ npm run build
```

Once webpack has started **watching files**, run the following command in a separate command line window:

```bash
$ npm run start
```

### Without CLI

If you are not using the [Nest CLI](http://localhost:4200/cli/overview), the configuration will be slightly more complex (will require more manual steps).

#### Installation

First install the required packages:

```bash
$ npm i --save-dev webpack webpack-cli webpack-node-externals ts-loader
```

#### Configuration

Once the installation is complete, create a `webpack.config.js` file in the root directory of your application.

```typescript
const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: ['webpack/hot/poll?100', './src/main.ts'],
  watch: true,
  target: 'node',
  externals: [
    nodeExternals({
      whitelist: ['webpack/hot/poll?100'],
    }),
  ],
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  mode: 'development',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'server.js',
  },
};
```

This configuration tells webpack few essential things about our application. Where sits an entry file, which directory should be used to hold **compiled** files, and also, what kind of loader we want to use in order to compile source files. Basically, you shouldn't worry to much, you don't need to understand the content of this file at all.

#### Hot-Module Replacement

In order to enable **HMR**, we have to open the application entry file (`main.ts`) and add a few webpack-related instructions.

```typescript
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
```

To simplify the execution process, add two scripts to your `package.json` file.

```json
"webpack": "webpack --config webpack.config.js"
"start": "node dist/server",
```

Now simply open your command line and run the following command:

```bash
$ npm run webpack
```

Once webpack has started **watching files**, run the following command in a separate command line window:

```bash
$ npm run start
```

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/08-webpack).
